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
  bookingHours,
  bookingIntervalsOverlap,
  calculateBookingPrice,
  computeBookingHours,
  dateRangesOverlap,
  parsePositiveInteger,
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
