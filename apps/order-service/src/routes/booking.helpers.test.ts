import { describe, expect, it, vi } from "vitest";

// Mock the workspace deps so importing booking.ts doesn't drag in Prisma /
// Kafka client initialisation.
vi.mock("@repo/db", () => ({
  BookingStatus: {
    APPROVED: "APPROVED",
    CANCELLED: "CANCELLED",
    COMPLETED: "COMPLETED",
    CONFIRMED: "CONFIRMED",
    EXPIRED: "EXPIRED",
    PENDING: "PENDING",
    REJECTED: "REJECTED",
  },
  prisma: {},
}));

vi.mock("@repo/auth-middleware/fastify", () => ({
  shouldBeAdmin: vi.fn(),
  shouldBeHost: vi.fn(),
  shouldBeUser: vi.fn(),
}));

vi.mock("../utils/kafka.js", () => ({
  producer: { send: vi.fn() },
}));

const {
  InvalidParameterError,
  NoApplicablePriceError,
  bookingHours,
  bookingIntervalsOverlap,
  calculateBookingPrice,
  computeBookingHours,
  dateRangesOverlap,
  monthlyProRatedPrice,
  parsePositiveInteger,
  spaceSupportsHourly,
  spaceSupportsMonthly,
} = await import("./booking.js");

const date = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("parsePositiveInteger (BOOKSVC-016)", () => {
  it("returns the fallback when input is absent", () => {
    expect(parsePositiveInteger(undefined, 20)).toBe(20);
    expect(parsePositiveInteger(null, 20)).toBe(20);
    expect(parsePositiveInteger("", 20)).toBe(20);
  });

  it("returns undefined when absent and no fallback is supplied", () => {
    expect(parsePositiveInteger(undefined)).toBeUndefined();
    expect(parsePositiveInteger("")).toBeUndefined();
  });

  it("throws InvalidParameterError for non-numeric input even when a fallback is set", () => {
    expect(() => parsePositiveInteger("abc", 20)).toThrow(InvalidParameterError);
  });

  it("throws InvalidParameterError for negative or zero numbers", () => {
    expect(() => parsePositiveInteger("-5", 20)).toThrow(InvalidParameterError);
    expect(() => parsePositiveInteger(-5, 20)).toThrow(InvalidParameterError);
    expect(() => parsePositiveInteger(0, 20)).toThrow(InvalidParameterError);
    expect(() => parsePositiveInteger("0", 20)).toThrow(InvalidParameterError);
  });

  it("throws for non-integer or unsupported types", () => {
    expect(() => parsePositiveInteger(1.5, 20)).toThrow(InvalidParameterError);
    expect(() => parsePositiveInteger({}, 20)).toThrow(InvalidParameterError);
    expect(() => parsePositiveInteger(true, 20)).toThrow(InvalidParameterError);
  });

  it("clamps to max when provided", () => {
    expect(parsePositiveInteger("250", 20, 100)).toBe(100);
    expect(parsePositiveInteger("50", 20, 100)).toBe(50);
  });
});

describe("dateRangesOverlap (BOOKSVC-013)", () => {
  it("treats back-to-back day ranges as non-overlapping (end exclusive)", () => {
    // [Mon..Tue) and [Tue..Wed) share the boundary at Tue and must NOT overlap.
    expect(
      dateRangesOverlap(date("2026-05-18"), date("2026-05-19"), date("2026-05-19"), date("2026-05-20"))
    ).toBe(false);
  });

  it("flags genuinely overlapping ranges as overlapping", () => {
    // [Mon..Wed) and [Tue..Thu) share Tue -> overlap.
    expect(
      dateRangesOverlap(date("2026-05-18"), date("2026-05-20"), date("2026-05-19"), date("2026-05-21"))
    ).toBe(true);
  });

  it("treats containment as overlapping", () => {
    expect(
      dateRangesOverlap(date("2026-05-18"), date("2026-05-25"), date("2026-05-20"), date("2026-05-22"))
    ).toBe(true);
  });

  it("disjoint ranges do not overlap", () => {
    expect(
      dateRangesOverlap(date("2026-05-18"), date("2026-05-19"), date("2026-05-25"), date("2026-05-26"))
    ).toBe(false);
  });
});

describe("computeBookingHours / bookingHours (BOOKSVC-010)", () => {
  it("returns 24 hours for a full day (no times)", () => {
    expect(computeBookingHours(null, null)).toBe(24);
  });

  it("computes simple intra-day hours", () => {
    expect(computeBookingHours("09:00", "12:30")).toBe(3.5);
  });

  it("handles midnight crossings", () => {
    // 22:00 -> 03:00 = 5 hours
    expect(computeBookingHours("22:00", "03:00")).toBe(5);
  });

  it("uses the same per-day formula as bookingHours and matches the pricing path", () => {
    const startTime = "09:00";
    const endTime = "12:00";

    // Validation path: 3 days * 3 hours = 9
    const validationHours = bookingHours(
      date("2026-05-18"),
      date("2026-05-20"),
      startTime,
      endTime
    );

    // Pricing path: HOURLY, $10/hr, no availability constraint -> matches.
    // Build availability that is open every day from 00:00-23:59 so the
    // per-day intersection equals the requested window exactly.
    const openAllDay = Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      endTime: "23:59",
      isOpen: true,
      startTime: "00:00",
    }));

    const pricing = calculateBookingPrice(
      {
        availability: openAllDay,
        cleaningFee: 0,
        currency: "USD",
        pricePerDay: null,
        pricePerHour: 10,
        pricingType: "HOURLY",
      },
      date("2026-05-18"),
      date("2026-05-20"),
      startTime,
      endTime
    );

    expect(validationHours).toBe(9);
    expect(pricing.subtotal).toBe(validationHours * 10);
  });
});

describe("bookingIntervalsOverlap (BOOKSVC-014)", () => {
  it("allows adjacent hourly bookings on the same date", () => {
    // 09:00-10:00 and 10:00-11:00 are back-to-back, not overlapping.
    expect(
      bookingIntervalsOverlap(
        {
          endDate: date("2026-05-18"),
          endTime: "10:00",
          isHourly: true,
          startDate: date("2026-05-18"),
          startTime: "09:00",
        },
        {
          endDate: date("2026-05-18"),
          endTime: "11:00",
          isHourly: true,
          startDate: date("2026-05-18"),
          startTime: "10:00",
        }
      )
    ).toBe(false);
  });

  it("detects overlap that spans midnight", () => {
    // Existing booking Sat 22:00 -> Sun 03:00 stored as cross-midnight.
    // Incoming booking Sun 01:00 -> Sun 05:00 must conflict.
    expect(
      bookingIntervalsOverlap(
        {
          endDate: date("2026-05-23"),
          endTime: "03:00",
          isHourly: true,
          startDate: date("2026-05-23"),
          startTime: "22:00",
        },
        {
          endDate: date("2026-05-24"),
          endTime: "05:00",
          isHourly: true,
          startDate: date("2026-05-24"),
          startTime: "01:00",
        }
      )
    ).toBe(true);
  });

  it("treats back-to-back full-day bookings as non-overlapping", () => {
    // [Mon..Mon] full-day then [Tue..Tue] full-day -> no overlap.
    expect(
      bookingIntervalsOverlap(
        {
          endDate: date("2026-05-18"),
          endTime: null,
          isHourly: false,
          startDate: date("2026-05-18"),
          startTime: null,
        },
        {
          endDate: date("2026-05-19"),
          endTime: null,
          isHourly: false,
          startDate: date("2026-05-19"),
          startTime: null,
        }
      )
    ).toBe(false);
  });

  it("flags same-day full-day bookings as overlapping", () => {
    expect(
      bookingIntervalsOverlap(
        {
          endDate: date("2026-05-18"),
          endTime: null,
          isHourly: false,
          startDate: date("2026-05-18"),
          startTime: null,
        },
        {
          endDate: date("2026-05-18"),
          endTime: null,
          isHourly: false,
          startDate: date("2026-05-18"),
          startTime: null,
        }
      )
    ).toBe(true);
  });
});

describe("calculateBookingPrice per-day availability intersection (BOOKSVC-009)", () => {
  // Mon 2026-05-18 (dayOfWeek=1) open 09-18, Tue 2026-05-19 (dayOfWeek=2) open 09-12.
  const availability = [
    { dayOfWeek: 1, endTime: "18:00", isOpen: true, startTime: "09:00" },
    { dayOfWeek: 2, endTime: "12:00", isOpen: true, startTime: "09:00" },
  ];

  it("charges per-day intersected hours instead of full requested window", () => {
    const result = calculateBookingPrice(
      {
        availability,
        cleaningFee: 0,
        currency: "USD",
        pricePerDay: null,
        pricePerHour: 10,
        pricingType: "HOURLY",
      },
      date("2026-05-18"),
      date("2026-05-19"),
      "09:00",
      "18:00",
      0.1 // host commission rate = 10%
    );

    // Monday charged 9 hours (9-18). Tuesday charged 3 hours (9-12 intersected with 9-18).
    // (9 + 3) * $10 = $120 subtotal.
    expect(result.subtotal).toBe(120);
    // Service fee is the platform commission (10% of subtotal) — deducted from
    // the host's payout, NOT added to the client's total.
    expect(result.serviceFee).toBe(12);
    // Client pays the listed price: subtotal + cleaningFee (no fee added on top).
    expect(result.total).toBe(120);
  });

  it("skips days with no availability", () => {
    const result = calculateBookingPrice(
      {
        availability: [
          { dayOfWeek: 1, endTime: "18:00", isOpen: true, startTime: "09:00" },
          // Tuesday closed.
          { dayOfWeek: 2, endTime: "12:00", isOpen: false, startTime: "09:00" },
        ],
        cleaningFee: 0,
        currency: "USD",
        pricePerDay: null,
        pricePerHour: 10,
        pricingType: "HOURLY",
      },
      date("2026-05-18"),
      date("2026-05-19"),
      "09:00",
      "18:00"
    );

    // Only Monday counts: 9 hours * $10 = $90.
    expect(result.subtotal).toBe(90);
  });
});

describe("calculateBookingPrice tier overflow cap (PRICE-001)", () => {
  // Open-all-day availability so per-day intersection doesn't shrink the
  // hourly candidate.
  const openAllDay = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    endTime: "23:59",
    isOpen: true,
    startTime: "00:00",
  }));

  it("uses the cheaper 24h tier when 12h × 4h-block would exceed it", () => {
    // 12h booking with tiers {4h: 4500, 24h: 10000}: the old "largest fitting"
    // selector would charge 3 × 4500 = 13500; the new selector picks the
    // cheaper 1 × 24h tier = 10000.
    const result = calculateBookingPrice(
      {
        availability: openAllDay,
        cleaningFee: 0,
        currency: "MDL",
        pricePerDay: null,
        pricePerHour: null,
        pricingTiers: [
          { minutes: 240, price: 4500 },
          { minutes: 1440, price: 10000 },
        ],
        pricingType: "HOURLY",
      },
      date("2026-05-18"),
      date("2026-05-18"),
      "08:00",
      "20:00",
      0.1
    );

    expect(result.subtotal).toBe(10000);
    expect(result.total).toBe(10000);
    expect(result.serviceFee).toBe(1000);
  });

  it("falls back to the per-block tier price when the booking is shorter than every tier", () => {
    // 3h booking with a single 4h tier at 4500 — only 1 block charged.
    const result = calculateBookingPrice(
      {
        availability: openAllDay,
        cleaningFee: 0,
        currency: "MDL",
        pricePerDay: null,
        pricePerHour: null,
        pricingTiers: [{ minutes: 240, price: 4500 }],
        pricingType: "HOURLY",
      },
      date("2026-05-18"),
      date("2026-05-18"),
      "09:00",
      "12:00",
      0
    );

    expect(result.subtotal).toBe(4500);
    expect(result.serviceFee).toBe(0);
    expect(result.total).toBe(4500);
  });
});

describe("calculateBookingPrice commission model (PRICE-002)", () => {
  it("client total never includes the commission; commission is reported separately", () => {
    const result = calculateBookingPrice(
      {
        availability: [],
        cleaningFee: 50,
        currency: "USD",
        pricePerDay: 200,
        pricePerHour: null,
        pricingType: "DAILY",
      },
      date("2026-05-18"),
      date("2026-05-18"),
      null,
      null,
      0.15
    );

    expect(result.subtotal).toBe(200);
    expect(result.cleaningFee).toBe(50);
    expect(result.serviceFee).toBe(30); // 15% of subtotal only — not of cleaning.
    expect(result.total).toBe(250); // subtotal + cleaning, no fee added on top.
  });

  it("falls back to the env default when no per-host rate is provided", () => {
    const original = process.env.DEFAULT_COMMISSION_RATE;
    process.env.DEFAULT_COMMISSION_RATE = "0.2";
    try {
      const result = calculateBookingPrice(
        {
          availability: [],
          cleaningFee: 0,
          currency: "USD",
          pricePerDay: 100,
          pricePerHour: null,
          pricingType: "DAILY",
        },
        date("2026-05-18"),
        date("2026-05-18"),
        null,
        null
      );
      expect(result.serviceFee).toBe(20);
    } finally {
      if (original === undefined) {
        delete process.env.DEFAULT_COMMISSION_RATE;
      } else {
        process.env.DEFAULT_COMMISSION_RATE = original;
      }
    }
  });

  it("clamps an out-of-range per-host commission to 1.0 (PRICE-003)", () => {
    // A stray 1.5 (stale row from before the admin validator was added, or a
    // misconfigured manual UPDATE) must not make commission > subtotal.
    const result = calculateBookingPrice(
      {
        availability: [],
        cleaningFee: 0,
        currency: "USD",
        pricePerDay: 100,
        pricePerHour: null,
        pricingType: "DAILY",
      },
      date("2026-05-18"),
      date("2026-05-18"),
      null,
      null,
      1.5
    );
    expect(result.subtotal).toBe(100);
    expect(result.serviceFee).toBe(100); // clamped to 1.0 -> 100% of subtotal
  });
});

describe("spaceSupportsHourly (H1)", () => {
  it("is true for HOURLY/BOTH only when a positive per-hour rate exists", () => {
    expect(
      spaceSupportsHourly({ pricingType: "HOURLY", pricePerHour: 25 })
    ).toBe(true);
    expect(
      spaceSupportsHourly({ pricingType: "BOTH", pricePerHour: 25 })
    ).toBe(true);
  });

  it("is false for HOURLY/BOTH with no usable hourly price (null / <=0)", () => {
    // A BOTH space priced only per-day (pricePerHour null) is NOT hourly-
    // capable: treating it as hourly would block a sub-window while pricing a
    // full day (block != price).
    expect(spaceSupportsHourly({ pricingType: "BOTH" })).toBe(false);
    expect(
      spaceSupportsHourly({ pricingType: "HOURLY", pricePerHour: null })
    ).toBe(false);
    expect(
      spaceSupportsHourly({ pricingType: "BOTH", pricePerHour: 0 })
    ).toBe(false);
  });

  it("is false for DAILY with no positive-priced tiers", () => {
    expect(spaceSupportsHourly({ pricingType: "DAILY" })).toBe(false);
    expect(spaceSupportsHourly({ pricingType: "DAILY", pricingTiers: [] })).toBe(false);
    // A zero-priced tier does not count (it is skipped when pricing).
    expect(
      spaceSupportsHourly({
        pricingType: "DAILY",
        pricingTiers: [{ minutes: 60, price: 0 }],
      })
    ).toBe(false);
  });

  it("is true for DAILY when a positive-priced per-minute tier exists", () => {
    expect(
      spaceSupportsHourly({
        pricingType: "DAILY",
        pricingTiers: [{ minutes: 60, price: 25 }],
      })
    ).toBe(true);
  });
});

describe("calculateBookingPrice zero-candidate rejection (H1)", () => {
  const openAllDay = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    endTime: "23:59",
    isOpen: true,
    startTime: "00:00",
  }));

  it("throws NoApplicablePriceError instead of pricing 0 for an hourly-only space booked as a full day", () => {
    // Hourly-only space (no daily rate, no tiers) asked for a full day (no
    // times). The old code produced candidates=[] -> subtotal=0 -> a free,
    // fully-blocking reservation. Now it throws so the route returns 400.
    expect(() =>
      calculateBookingPrice(
        {
          availability: openAllDay,
          cleaningFee: 0,
          currency: "USD",
          pricePerDay: null,
          pricePerHour: 25,
          pricingType: "HOURLY",
        },
        date("2026-05-18"),
        date("2026-05-18"),
        null,
        null
      )
    ).toThrow(NoApplicablePriceError);
  });
});

describe("calculateBookingPrice zero-price tier guard (M6)", () => {
  const openAllDay = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    endTime: "23:59",
    isOpen: true,
    startTime: "00:00",
  }));

  it("skips a zero-price tier so it can't zero an unrelated duration", () => {
    // A "first hour free" tier (60min @ 0) would win Math.min for a 12h booking
    // (12 * 0 = 0) and make the whole booking free. It must be skipped so the
    // real 4h tier prices the booking.
    const result = calculateBookingPrice(
      {
        availability: openAllDay,
        cleaningFee: 0,
        currency: "MDL",
        pricePerDay: null,
        pricePerHour: null,
        pricingTiers: [
          { minutes: 60, price: 0 },
          { minutes: 240, price: 4500 },
        ],
        pricingType: "HOURLY",
      },
      date("2026-05-18"),
      date("2026-05-18"),
      "08:00",
      "20:00",
      0
    );
    // 12h / 4h = 3 blocks * 4500 = 13500 (the zero tier is ignored).
    expect(result.subtotal).toBe(13500);
  });
});

describe("calculateBookingPrice fails closed on a non-positive base rate (H1/H2)", () => {
  it("rejects a negative daily rate (no candidate) instead of pricing a free hold", () => {
    // A negative rate is not truthy-gated into a candidate: it contributes
    // nothing, so with no other price path the candidate set is empty and we
    // throw (400) rather than flooring a negative to a free, slot-blocking $0.
    expect(() =>
      calculateBookingPrice(
        {
          availability: [],
          cleaningFee: 0,
          currency: "USD",
          pricePerDay: -100,
          pricePerHour: null,
          pricingType: "DAILY",
        },
        date("2026-05-18"),
        date("2026-05-18"),
        null,
        null,
        0
      )
    ).toThrow(NoApplicablePriceError);
  });

  it("ignores a negative rate but still prices via a valid positive tier", () => {
    // BOTH space with a bogus negative pricePerHour but a valid $10/hr tier:
    // the negative is dropped, the tier prices the booking (no free hold).
    const openAllDay = Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      endTime: "23:59",
      isOpen: true,
      startTime: "00:00",
    }));
    const result = calculateBookingPrice(
      {
        availability: openAllDay,
        cleaningFee: 0,
        currency: "USD",
        pricePerDay: null,
        pricePerHour: -5,
        pricingTiers: [{ minutes: 60, price: 10 }],
        pricingType: "BOTH",
      },
      date("2026-05-18"),
      date("2026-05-18"),
      "09:00",
      "10:00",
      0
    );
    expect(result.subtotal).toBe(10);
    expect(result.total).toBe(10);
  });
});

describe("calculateBookingPrice no-intersection zero-hour candidate (PRICE-004)", () => {
  // Mon 2026-05-18 (dayOfWeek=1) open 09-12 only.
  const availability = [
    { dayOfWeek: 1, endTime: "12:00", isOpen: true, startTime: "09:00" },
  ];

  it("does not bill 0 when the requested window misses every open day", () => {
    // Request Mon 13-18 against Mon 09-12 availability: billableHourlyHours
    // returns 0. Before the fix, the hourly candidate was `pricePerHour * 0 = 0`
    // and won Math.min, making the subtotal 0 and the booking free. The fix
    // skips zero-hour candidates so a tier or the daily rate wins instead.
    const result = calculateBookingPrice(
      {
        availability,
        cleaningFee: 0,
        currency: "USD",
        pricePerDay: 200,
        pricePerHour: 50,
        pricingType: "BOTH",
      },
      date("2026-05-18"),
      date("2026-05-18"),
      "13:00",
      "18:00",
      0.1
    );
    // Daily rate (200) is the only surviving candidate.
    expect(result.subtotal).toBe(200);
  });
});

describe("spaceSupportsMonthly (MONTHLY)", () => {
  it("is true only for MONTHLY with a positive per-month rate", () => {
    expect(
      spaceSupportsMonthly({ pricingType: "MONTHLY", pricePerMonth: 1200 })
    ).toBe(true);
  });

  it("is false for MONTHLY with a null / zero / negative rate", () => {
    expect(spaceSupportsMonthly({ pricingType: "MONTHLY" })).toBe(false);
    expect(
      spaceSupportsMonthly({ pricingType: "MONTHLY", pricePerMonth: null })
    ).toBe(false);
    expect(
      spaceSupportsMonthly({ pricingType: "MONTHLY", pricePerMonth: 0 })
    ).toBe(false);
    expect(
      spaceSupportsMonthly({ pricingType: "MONTHLY", pricePerMonth: -500 })
    ).toBe(false);
  });

  it("is false for non-MONTHLY types even with a positive per-month rate", () => {
    // BOTH stays hourly+daily; MONTHLY is its own type and must be opted into.
    expect(
      spaceSupportsMonthly({ pricingType: "BOTH", pricePerMonth: 1200 })
    ).toBe(false);
    expect(
      spaceSupportsMonthly({ pricingType: "DAILY", pricePerMonth: 1200 })
    ).toBe(false);
    expect(
      spaceSupportsMonthly({ pricingType: "HOURLY", pricePerMonth: 1200 })
    ).toBe(false);
  });
});

describe("monthlyProRatedPrice (MONTHLY)", () => {
  it("prices exact whole calendar months at N * rate (endDate inclusive)", () => {
    // endDate is the LAST occupied day, so all of January is Jan 1 -> Jan 31.
    expect(monthlyProRatedPrice(date("2026-01-01"), date("2026-01-31"), 1000)).toBe(
      1000
    );
    // Jan 1 -> Feb 28 occupies all of Jan and all of Feb = 2 months.
    expect(monthlyProRatedPrice(date("2026-01-01"), date("2026-02-28"), 1000)).toBe(
      2000
    );
    // A whole month starting mid-month: Jan 15 -> Feb 14 == 1 month.
    expect(monthlyProRatedPrice(date("2026-01-15"), date("2026-02-14"), 1000)).toBe(
      1000
    );
  });

  it("prices a single-day booking as a positive day-fraction, never $0", () => {
    // Regression: startDate == endDate must NOT price to 0 (that would be a
    // free, slot-blocking hold). Jan 1 -> Jan 1 = 1 of January's 31 days.
    expect(monthlyProRatedPrice(date("2026-01-01"), date("2026-01-01"), 3100)).toBe(
      100
    );
  });

  it("pro-rates a partial trailing month at the anchor month's day-rate", () => {
    // Jan 1 -> Feb 14: all of January (1 month) + 14 of Feb's 28 days = 1.5x.
    expect(
      monthlyProRatedPrice(date("2026-01-01"), date("2026-02-14"), 1000)
    ).toBeCloseTo(1500, 2);
  });

  it("pro-rates a sub-month range (fullMonths = 0)", () => {
    // Jan 1 -> Jan 16: 0 full months + 16 of January's 31 occupied days.
    expect(
      monthlyProRatedPrice(date("2026-01-01"), date("2026-01-16"), 3100)
    ).toBeCloseTo((16 / 31) * 3100, 2);
  });

  it("uses the specific remainder month's length for the pro-rate", () => {
    // The pro-rate denominator is the ANCHOR month's length, so the same
    // number of trailing days costs more in a short month than a long one.
    // Feb 1 -> Feb 14 (anchor Feb, 28 days) = 14/28 = 0.5 months.
    expect(
      monthlyProRatedPrice(date("2026-02-01"), date("2026-02-14"), 1000)
    ).toBeCloseTo(500, 2);
    // Jan 1 -> Jan 14 (anchor Jan, 31 days) = 14/31 months, i.e. cheaper.
    expect(
      monthlyProRatedPrice(date("2026-01-01"), date("2026-01-14"), 1000)
    ).toBeCloseTo((14 / 31) * 1000, 2);
  });
});

describe("calculateBookingPrice MONTHLY candidate (MONTHLY)", () => {
  it("prices a monthly space over a date range via the monthly candidate", () => {
    // Full-day date-range booking (no times) on a MONTHLY space. endDate is
    // inclusive, so Jan 1 -> Feb 14 = all of January (1 month) + 14 of Feb's 28
    // days = 1.5 months * $2000 = $3000.
    const result = calculateBookingPrice(
      {
        availability: [],
        cleaningFee: 0,
        currency: "USD",
        pricePerDay: null,
        pricePerHour: null,
        pricePerMonth: 2000,
        pricingType: "MONTHLY",
      },
      date("2026-01-01"),
      date("2026-02-14"),
      null,
      null,
      0.1
    );

    expect(result.subtotal).toBe(3000);
    expect(result.total).toBe(3000);
    expect(result.serviceFee).toBe(300); // 10% commission, deducted from payout.
  });

  it("throws NoApplicablePriceError for a MONTHLY space with a non-positive rate", () => {
    // Fails closed exactly like the daily/hourly non-positive-rate paths.
    expect(() =>
      calculateBookingPrice(
        {
          availability: [],
          cleaningFee: 0,
          currency: "USD",
          pricePerDay: null,
          pricePerHour: null,
          pricePerMonth: 0,
          pricingType: "MONTHLY",
        },
        date("2026-01-01"),
        date("2026-02-01"),
        null,
        null,
        0
      )
    ).toThrow(NoApplicablePriceError);
  });

  it("prices off the monthly rate override when provided for a MONTHLY space", () => {
    // Same date range as the base MONTHLY candidate test (Jan 1 -> Feb 14 =
    // 1.5 months) but the selected plan's rate ($3000/mo) is passed as the
    // override instead of space.pricePerMonth ($2000). 1.5 * $3000 = $4500.
    const result = calculateBookingPrice(
      {
        availability: [],
        cleaningFee: 0,
        currency: "USD",
        pricePerDay: null,
        pricePerHour: null,
        pricePerMonth: 2000,
        pricingType: "MONTHLY",
      },
      date("2026-01-01"),
      date("2026-02-14"),
      null,
      null,
      0.1,
      3000
    );

    expect(result.subtotal).toBe(4500);
    expect(result.total).toBe(4500);
    expect(result.serviceFee).toBe(450); // 10% of 4500.
  });

  it("prices monthly on a non-MONTHLY space when a plan rate override is supplied", () => {
    // A mixed (BOTH/DAILY) space can offer named monthly plans. When the route
    // passes a selected plan's rate as the override, the booking is priced
    // monthly and the cheaper per-day rate is suppressed so it can't undercut
    // the subscription.
    const result = calculateBookingPrice(
      {
        availability: [],
        cleaningFee: 0,
        currency: "USD",
        pricePerDay: 50, // 31 days * $50 = $1550 < plan; must be suppressed
        pricePerHour: null,
        pricePerMonth: null,
        pricingType: "BOTH",
      },
      date("2026-05-18"),
      date("2026-06-17"), // exactly one calendar month
      null,
      null,
      0,
      2700 // selected plan rate override
    );
    expect(result.subtotal).toBe(2700);
  });

  it("does not add a monthly candidate for a non-MONTHLY space (daily unaffected)", () => {
    // A DAILY space that happens to carry a pricePerMonth must still price
    // per-day — MONTHLY must be explicitly opted into via pricingType.
    const result = calculateBookingPrice(
      {
        availability: [],
        cleaningFee: 0,
        currency: "USD",
        pricePerDay: 100,
        pricePerHour: null,
        pricePerMonth: 2000,
        pricingType: "DAILY",
      },
      date("2026-05-18"),
      date("2026-05-18"),
      null,
      null,
      0
    );
    expect(result.subtotal).toBe(100);
  });
});
