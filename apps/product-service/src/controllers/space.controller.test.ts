import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

// Mock the kafka utility BEFORE importing the controller so its module-level
// `producer` reference resolves to our spy.
vi.mock("../utils/kafka.js", () => ({
  producer: { send: vi.fn() },
  consumer: { connect: vi.fn(), disconnect: vi.fn(), run: vi.fn() },
}));

// Mock the prisma client. We retain access to the real generated `Prisma`
// helper (for `Prisma.join` and enum re-exports) by re-exporting it from
// the real module via `importActual`.
vi.mock("@repo/db", async () => {
  const actual =
    await vi.importActual<typeof import("@repo/db")>("@repo/db");
  const prisma = {
    space: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    review: {
      groupBy: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    availability: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    blockedDate: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    pricingTier: { createMany: vi.fn(), deleteMany: vi.fn() },
    monthlyPlan: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    venue: { findUnique: vi.fn() },
    booking: { findMany: vi.fn(), count: vi.fn() },
    spaceAmenity: { deleteMany: vi.fn(), createMany: vi.fn() },
    spaceCategory: { findUnique: vi.fn() },
    $transaction: vi.fn(async (input: unknown) => {
      // Support both shapes used in this controller: array form (Promise.all)
      // and callback form `(tx) => ...` where the tx receives the same mock.
      if (typeof input === "function") {
        return (input as (tx: typeof prisma) => unknown)(prisma);
      }
      return Promise.all(input as Promise<unknown>[]);
    }),
    $queryRaw: vi.fn(),
  };
  return { ...actual, prisma };
});

// Import after the mocks so the controller sees the mocked modules.
const { prisma } = await import("@repo/db");
const { producer } = await import("../utils/kafka.js");
const {
  getSpaces,
  getSpace,
  getAvailability,
  checkAvailability,
  createSpace,
  updateSpace,
  updateAvailability,
  validatePricingTiers,
  validateMonthlyPlans,
  validateAmenityIds,
  deleteSpace,
  getMySpaces,
} = await import("./space.controller.js");

type AnyMock = Mock;

const buildRes = () => {
  const res: {
    statusCode: number;
    body: unknown;
    status: (code: number) => typeof res;
    json: (payload: unknown) => typeof res;
  } = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

const buildReq = (overrides: Record<string, unknown> = {}) =>
  ({
    query: {},
    params: {},
    body: {},
    userId: "user-1",
    user: { role: "HOST" as const },
    ...overrides,
  }) as unknown as Parameters<typeof getSpaces>[0];

beforeEach(() => {
  vi.clearAllMocks();
  // Default count/findMany/groupBy responses so handlers that don't care
  // about data shape still complete.
  (prisma.space.count as AnyMock).mockResolvedValue(0);
  (prisma.space.findMany as AnyMock).mockResolvedValue([]);
  (prisma.review.groupBy as AnyMock).mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("getSpaces - PRODSVC-019 price validation", () => {
  it("rejects negative minPrice with 400", async () => {
    const res = buildRes();
    await getSpaces(
      buildReq({ query: { minPrice: "-100" } }),
      res as never,
    );
    expect(res.statusCode).toBe(400);
    expect(prisma.space.findMany).not.toHaveBeenCalled();
  });

  it("rejects negative maxPrice with 400", async () => {
    const res = buildRes();
    await getSpaces(
      buildReq({ query: { maxPrice: "-1" } }),
      res as never,
    );
    expect(res.statusCode).toBe(400);
  });

  it("rejects min > max with 400", async () => {
    const res = buildRes();
    await getSpaces(
      buildReq({ query: { minPrice: "200", maxPrice: "10" } }),
      res as never,
    );
    expect(res.statusCode).toBe(400);
  });

  it("accepts a well-formed price range", async () => {
    const res = buildRes();
    await getSpaces(
      buildReq({ query: { minPrice: "10", maxPrice: "200" } }),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    expect(prisma.space.findMany).toHaveBeenCalled();
  });
});

describe("getSpaces - PRODSVC-016 amenityIds filter", () => {
  it("applies amenityIds.some to the Prisma where clause", async () => {
    const res = buildRes();
    await getSpaces(
      buildReq({ query: { amenityIds: "1,2,3" } }),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    const call = (prisma.space.findMany as AnyMock).mock.calls[0]?.[0];
    expect(call?.where?.amenities).toEqual({
      some: { amenityId: { in: [1, 2, 3] } },
    });
  });

  it("omits the amenity filter when no ids are supplied", async () => {
    const res = buildRes();
    await getSpaces(buildReq(), res as never);
    const call = (prisma.space.findMany as AnyMock).mock.calls[0]?.[0];
    expect(call?.where?.amenities).toBeUndefined();
  });

  it("ignores non-numeric tokens", async () => {
    const res = buildRes();
    await getSpaces(
      buildReq({ query: { amenityIds: "1,abc,3,," } }),
      res as never,
    );
    const call = (prisma.space.findMany as AnyMock).mock.calls[0]?.[0];
    expect(call?.where?.amenities).toEqual({
      some: { amenityId: { in: [1, 3] } },
    });
  });
});

describe("getSpaces - PRODSVC-021 sort=featured", () => {
  it("orders by venue/host listing badges then newest", async () => {
    const res = buildRes();
    await getSpaces(buildReq({ query: { sort: "featured" } }), res as never);
    expect(res.statusCode).toBe(200);
    const call = (prisma.space.findMany as AnyMock).mock.calls[0]?.[0];
    expect(call?.orderBy).toEqual([
      { venue: { venueSponsored: "desc" } },
      { host: { hostSponsored: "desc" } },
      { venue: { venueRecommended: "desc" } },
      { host: { hostRecommended: "desc" } },
      { venue: { venueVerificationStatus: "desc" } },
      { host: { hostVerificationStatus: "desc" } },
      { host: { hostingSince: "asc" } },
      { createdAt: "desc" },
    ]);
  });

  it("featured takes precedence over a co-supplied sortBy=averageRating", async () => {
    const res = buildRes();
    await getSpaces(
      buildReq({ query: { sort: "featured", sortBy: "averageRating" } }),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    // Must use the badge-tiered array orderBy, NOT the raw-SQL rating path.
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    const call = (prisma.space.findMany as AnyMock).mock.calls[0]?.[0];
    expect(Array.isArray(call?.orderBy)).toBe(true);
  });
});

describe("deleteSpace - PRODSVC-022 hard delete", () => {
  it("hard-deletes a space with no bookings (not a soft delete)", async () => {
    const res = buildRes();
    (prisma.space.findUnique as AnyMock).mockResolvedValueOnce({
      id: 7,
      hostId: "user-1",
    });
    (prisma.booking.count as AnyMock).mockResolvedValueOnce(0);

    await deleteSpace(
      buildReq({ params: { id: "7" } }) as never,
      res as never,
    );

    expect(res.statusCode).toBe(200);
    expect(prisma.space.delete).toHaveBeenCalledWith({ where: { id: 7 } });
    // Must NOT fall back to the old isActive:false soft delete.
    expect(prisma.space.update).not.toHaveBeenCalled();
    expect(producer.send).toHaveBeenCalledWith("space.deleted", {
      value: { id: 7 },
    });
  });

  it("returns 409 and does not delete when the space has bookings", async () => {
    const res = buildRes();
    (prisma.space.findUnique as AnyMock).mockResolvedValueOnce({
      id: 8,
      hostId: "user-1",
    });
    (prisma.booking.count as AnyMock).mockResolvedValueOnce(3);

    await deleteSpace(
      buildReq({ params: { id: "8" } }) as never,
      res as never,
    );

    expect(res.statusCode).toBe(409);
    expect((res.body as { code?: string })?.code).toBe("SPACE_HAS_BOOKINGS");
    expect(prisma.space.delete).not.toHaveBeenCalled();
  });

  it("maps a P2003 FK race on delete to the same 409 (TOCTOU backstop)", async () => {
    const res = buildRes();
    (prisma.space.findUnique as AnyMock).mockResolvedValueOnce({
      id: 9,
      hostId: "user-1",
    });
    // Count says 0, but a booking lands before delete -> FK Restrict throws.
    (prisma.booking.count as AnyMock).mockResolvedValueOnce(0);
    (prisma.space.delete as AnyMock).mockRejectedValueOnce(
      Object.assign(new Error("FK violation"), { code: "P2003" }),
    );

    await deleteSpace(
      buildReq({ params: { id: "9" } }) as never,
      res as never,
    );

    expect(res.statusCode).toBe(409);
    expect((res.body as { code?: string })?.code).toBe("SPACE_HAS_BOOKINGS");
  });

  it("rethrows non-P2003 delete errors to the global handler", async () => {
    const res = buildRes();
    (prisma.space.findUnique as AnyMock).mockResolvedValueOnce({
      id: 10,
      hostId: "user-1",
    });
    (prisma.booking.count as AnyMock).mockResolvedValueOnce(0);
    (prisma.space.delete as AnyMock).mockRejectedValueOnce(
      Object.assign(new Error("db down"), { code: "P1001" }),
    );

    await expect(
      deleteSpace(buildReq({ params: { id: "10" } }) as never, res as never),
    ).rejects.toThrow("db down");
  });
});

describe("getSpaces - PRODSVC-014 sort=rating", () => {
  it("issues a raw SQL GROUP BY query and re-fetches the ordered ids", async () => {
    const res = buildRes();
    (prisma.space.findMany as AnyMock)
      // 1st call: candidate ids
      .mockResolvedValueOnce([{ id: 10 }, { id: 20 }, { id: 30 }])
      // 2nd call: full rows (returned out of order intentionally)
      .mockResolvedValueOnce([
        { id: 20, venue: null },
        { id: 10, venue: null },
        { id: 30, venue: null },
      ]);
    (prisma.$queryRaw as AnyMock).mockResolvedValueOnce([
      { id: 30 },
      { id: 10 },
      { id: 20 },
    ]);

    await getSpaces(buildReq({ query: { sort: "rating" } }), res as never);

    expect(res.statusCode).toBe(200);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    const body = (res.body as { spaces: Array<{ id: number }> }).spaces;
    expect(body.map((s) => s.id)).toEqual([30, 10, 20]);
  });

  it("short-circuits to an empty page when no spaces match", async () => {
    const res = buildRes();
    (prisma.space.findMany as AnyMock).mockResolvedValueOnce([]);
    await getSpaces(buildReq({ query: { sort: "rating" } }), res as never);
    expect(res.statusCode).toBe(200);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    const body = res.body as { spaces: unknown[]; pagination: { total: number } };
    expect(body.spaces).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });
});

describe("checkAvailability - PRODSVC-017 range cap", () => {
  it("rejects a > 90 day window with 400", async () => {
    const res = buildRes();
    await checkAvailability(
      buildReq({
        params: { id: "1" },
        body: { startDate: "2024-01-01", endDate: "2024-06-01" },
      }),
      res as never,
    );
    expect(res.statusCode).toBe(400);
    expect(prisma.space.findUnique).not.toHaveBeenCalled();
  });

  it("accepts a window inside the 90 day cap", async () => {
    const res = buildRes();
    // M11: checkAvailability now resolves the space via findFirst with the
    // isActive + venue.isActive guard.
    (prisma.space.findFirst as AnyMock).mockResolvedValueOnce({
      id: 1,
      availability: [],
      blockedDates: [],
    });
    (prisma.booking.findMany as AnyMock).mockResolvedValueOnce([]);
    await checkAvailability(
      buildReq({
        params: { id: "1" },
        body: { startDate: "2024-01-01", endDate: "2024-03-01" },
      }),
      res as never,
    );
    expect(res.statusCode).toBe(200);
  });
});

describe("updateAvailability - PRODSVC-013 emits space.updated", () => {
  it("publishes space.updated after a successful availability update", async () => {
    const res = buildRes();
    (prisma.space.findUnique as AnyMock).mockResolvedValueOnce({
      id: 42,
      hostId: "user-1",
    });
    // PRODSVC-001: normalizeAvailability requires all 7 days, each present
    // exactly once. The test must send a complete week.
    const fullWeek = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      dayOfWeek,
      startTime: "09:00",
      endTime: "18:00",
      isOpen: true,
    }));
    await updateAvailability(
      buildReq({
        params: { id: "42" },
        body: { availability: fullWeek, blockedDates: [] },
      }),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    expect(producer.send).toHaveBeenCalledWith("space.updated", {
      value: { id: 42 },
    });
  });

  it("does not publish if the space is not owned by the caller", async () => {
    const res = buildRes();
    (prisma.space.findUnique as AnyMock).mockResolvedValueOnce({
      id: 42,
      hostId: "someone-else",
    });
    await updateAvailability(
      buildReq({
        params: { id: "42" },
        body: { availability: [] },
        user: { role: "HOST" },
      }),
      res as never,
    );
    expect(res.statusCode).toBe(403);
    expect(producer.send).not.toHaveBeenCalled();
  });

  // AUD-035: producer.send is now awaited inside a try/catch so a broker
  // outage cannot reject the response promise / crash the worker.
  it("logs and continues when producer.send rejects (AUD-035)", async () => {
    const res = buildRes();
    (prisma.space.findUnique as AnyMock).mockResolvedValueOnce({
      id: 42,
      hostId: "user-1",
    });
    (producer.send as AnyMock).mockRejectedValueOnce(
      new Error("kafka down"),
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const fullWeek = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      dayOfWeek,
      startTime: "09:00",
      endTime: "18:00",
      isOpen: true,
    }));
    await updateAvailability(
      buildReq({
        params: { id: "42" },
        body: { availability: fullWeek, blockedDates: [] },
      }),
      res as never,
    );

    expect(res.statusCode).toBe(200);
    expect(producer.send).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("getSpaces - AUD-026 sortBy=averageRating", () => {
  it("routes ?sortBy=averageRating into the raw SQL rating branch", async () => {
    const res = buildRes();
    (prisma.space.findMany as AnyMock)
      .mockResolvedValueOnce([{ id: 11 }, { id: 22 }])
      .mockResolvedValueOnce([
        { id: 11, venue: null },
        { id: 22, venue: null },
      ]);
    (prisma.$queryRaw as AnyMock).mockResolvedValueOnce([
      { id: 22 },
      { id: 11 },
    ]);

    await getSpaces(
      buildReq({
        query: { sortBy: "averageRating", sortOrder: "desc" },
      }),
      res as never,
    );

    expect(res.statusCode).toBe(200);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    const body = (res.body as { spaces: Array<{ id: number }> }).spaces;
    expect(body.map((s) => s.id)).toEqual([22, 11]);
  });

  it("honors sortOrder=asc in the rating branch", async () => {
    const res = buildRes();
    (prisma.space.findMany as AnyMock)
      .mockResolvedValueOnce([{ id: 11 }, { id: 22 }])
      .mockResolvedValueOnce([
        { id: 11, venue: null },
        { id: 22, venue: null },
      ]);
    (prisma.$queryRaw as AnyMock).mockResolvedValueOnce([
      { id: 11 },
      { id: 22 },
    ]);

    await getSpaces(
      buildReq({
        query: { sortBy: "averageRating", sortOrder: "asc" },
      }),
      res as never,
    );

    expect(res.statusCode).toBe(200);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });
});

describe("validatePricingTiers - AUD-008", () => {
  it("accepts well-formed tiers", () => {
    const result = validatePricingTiers([
      { minutes: 30, label: "Half hour", price: 10 },
      { minutes: 60, label: "Hour", price: 18 },
    ]);
    expect(result).toEqual({
      ok: true,
      value: [
        { minutes: 30, label: "Half hour", price: 10 },
        { minutes: 60, label: "Hour", price: 18 },
      ],
    });
  });

  it("rejects non-array input", () => {
    expect(validatePricingTiers("nope")).toEqual({
      ok: false,
      message: expect.stringContaining("array") as unknown as string,
    });
  });

  it("rejects zero or negative minutes", () => {
    const zero = validatePricingTiers([
      { minutes: 0, label: "free", price: 1 },
    ]);
    expect(zero.ok).toBe(false);
    const neg = validatePricingTiers([
      { minutes: -5, label: "free", price: 1 },
    ]);
    expect(neg.ok).toBe(false);
  });

  it("rejects non-integer minutes", () => {
    expect(
      validatePricingTiers([{ minutes: 1.5, label: "ok", price: 1 }]).ok,
    ).toBe(false);
  });

  // M6 (product side): a zero-price tier zeroes the Math.min subtotal
  // downstream, so a "first hour free" tier bills only the cleaning fee for
  // any duration. Reject price <= 0, not just < 0.
  it("rejects a zero price (M6)", () => {
    const result = validatePricingTiers([
      { minutes: 30, label: "free", price: 0 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("0.01");
    }
  });

  it("rejects negative or non-finite price", () => {
    expect(
      validatePricingTiers([{ minutes: 30, label: "ok", price: -1 }]).ok,
    ).toBe(false);
    expect(
      validatePricingTiers([{ minutes: 30, label: "ok", price: NaN }]).ok,
    ).toBe(false);
    expect(
      validatePricingTiers([{ minutes: 30, label: "ok", price: Infinity }])
        .ok,
    ).toBe(false);
  });

  it("rejects empty / oversized labels", () => {
    expect(
      validatePricingTiers([{ minutes: 30, label: "   ", price: 1 }]).ok,
    ).toBe(false);
    expect(
      validatePricingTiers([
        { minutes: 30, label: "a".repeat(81), price: 1 },
      ]).ok,
    ).toBe(false);
  });

  it("caps tier count at 20", () => {
    const tiers = Array.from({ length: 21 }, (_, i) => ({
      minutes: (i + 1) * 15,
      label: `t${i}`,
      price: 1,
    }));
    expect(validatePricingTiers(tiers).ok).toBe(false);
  });

  it("persists an optional comment when present", () => {
    const result = validatePricingTiers([
      { minutes: 30, label: "Half hour", price: 10, comment: "  Peak rate  " },
    ]);
    expect(result).toEqual({
      ok: true,
      value: [
        { minutes: 30, label: "Half hour", price: 10, comment: "Peak rate" },
      ],
    });
  });

  it("accepts a tier without a comment", () => {
    const result = validatePricingTiers([
      { minutes: 60, label: "Hour", price: 18 },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]?.comment).toBeUndefined();
    }
  });

  it("treats an empty / whitespace-only comment as absent", () => {
    const result = validatePricingTiers([
      { minutes: 60, label: "Hour", price: 18, comment: "   " },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]?.comment).toBeUndefined();
    }
  });

  it("rejects a comment over 300 characters", () => {
    const result = validatePricingTiers([
      { minutes: 60, label: "Hour", price: 18, comment: "a".repeat(301) },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("300");
    }
  });

  it("rejects a non-string comment", () => {
    const result = validatePricingTiers([
      { minutes: 60, label: "Hour", price: 18, comment: 123 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("comment");
    }
  });
});

// Monthly plans: a MONTHLY space may offer several named subscription plans,
// each a name + pricePerMonth (+ optional description). validateMonthlyPlans
// mirrors validatePricingTiers' shape (array guard, count cap, per-entry rules)
// so a malformed/oversized body can't reach `monthlyPlan.createMany`.
describe("validateMonthlyPlans - monthly plans T3", () => {
  it("accepts well-formed plans", () => {
    const result = validateMonthlyPlans([
      { name: "Basic", pricePerMonth: 200 },
      { name: "Pro", pricePerMonth: 500, description: "Dedicated desk" },
    ]);
    expect(result).toEqual({
      ok: true,
      value: [
        { name: "Basic", pricePerMonth: 200, description: undefined },
        { name: "Pro", pricePerMonth: 500, description: "Dedicated desk" },
      ],
    });
  });

  it("rejects non-array input", () => {
    expect(validateMonthlyPlans("nope")).toEqual({
      ok: false,
      message: expect.stringContaining("array") as unknown as string,
    });
  });

  it("caps plan count at 20", () => {
    const plans = Array.from({ length: 21 }, (_, i) => ({
      name: `Plan ${i}`,
      pricePerMonth: 100,
    }));
    expect(validateMonthlyPlans(plans).ok).toBe(false);
  });

  it("rejects an empty / whitespace-only name", () => {
    expect(
      validateMonthlyPlans([{ name: "   ", pricePerMonth: 100 }]).ok,
    ).toBe(false);
  });

  it("rejects a name over 60 characters", () => {
    const result = validateMonthlyPlans([
      { name: "a".repeat(61), pricePerMonth: 100 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("60");
    }
  });

  it("trims the name", () => {
    const result = validateMonthlyPlans([
      { name: "  Basic  ", pricePerMonth: 100 },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]?.name).toBe("Basic");
    }
  });

  it("rejects a price below 0.01", () => {
    const result = validateMonthlyPlans([{ name: "Basic", pricePerMonth: 0 }]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("0.01");
    }
  });

  it("rejects a non-finite price", () => {
    expect(
      validateMonthlyPlans([{ name: "Basic", pricePerMonth: NaN }]).ok,
    ).toBe(false);
    expect(
      validateMonthlyPlans([{ name: "Basic", pricePerMonth: Infinity }]).ok,
    ).toBe(false);
  });

  it("rejects a description over 300 characters", () => {
    const result = validateMonthlyPlans([
      { name: "Basic", pricePerMonth: 100, description: "a".repeat(301) },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("300");
    }
  });

  it("treats an empty / whitespace-only description as absent", () => {
    const result = validateMonthlyPlans([
      { name: "Basic", pricePerMonth: 100, description: "   " },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]?.description).toBeUndefined();
    }
  });

  // The DB enforces @@unique([spaceId, name]) on MonthlyPlan, so two plans with
  // the same (trimmed) name would fail the createMany with a P2002 and surface
  // as an opaque 409/500. Reject the duplicate up front with a clean 400 —
  // comparison is case-sensitive to match the DB unique constraint.
  it("rejects duplicate plan names (post-trim, case-sensitive)", () => {
    const result = validateMonthlyPlans([
      { name: "Basic", pricePerMonth: 200 },
      { name: "  Basic  ", pricePerMonth: 500 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(
        "monthlyPlans.name values must be unique",
      );
    }
  });
});

// Mirror of the updateVenue regression at c353c9d: if a stale client posts
// location fields like `address/city/country` (left over from before DB-010
// moved them off Space onto Venue), createSpace must filter them out via
// the SPACE_WRITE_KEYS whitelist instead of letting them reach
// `tx.space.create` and produce an "Unknown argument `address`" 500.
describe("createSpace - SPACE_WRITE_KEYS whitelist (POST-DB-010)", () => {
  it("drops non-whitelisted fields (e.g. address/city) from the create payload", async () => {
    (prisma.venue.findUnique as AnyMock).mockResolvedValue({
      id: 1,
      hostId: "user-1",
      // M11: createSpace now rejects a soft-deleted (isActive:false) venue.
      isActive: true,
    });
    (prisma.space.create as AnyMock).mockResolvedValue({
      id: 99,
      category: null,
      amenities: [],
    });

    const req = buildReq({
      body: {
        // Whitelisted: should survive.
        name: "Test space",
        shortDescription: "Short",
        description: "Long description text",
        pricingType: "HOURLY",
        pricePerHour: 10,
        cleaningFee: 0,
        capacity: 4,
        images: ["/img.png"],
        // Non-whitelisted (legacy / mass-assignment risk): must be stripped.
        address: "Old denormalised field",
        city: "Chișinău",
        state: "Chișinău",
        country: "Moldova",
        postalCode: "MD-2001",
        latitude: 47.0188,
        longitude: 28.8705,
        hostId: "attacker-id",
        // Transaction inputs (consumed before the whitelist):
        venueId: 1,
        availability: Array.from({ length: 7 }, (_, dayOfWeek) => ({
          dayOfWeek,
          startTime: "09:00",
          endTime: "18:00",
          isOpen: dayOfWeek < 5,
        })),
      },
    });
    const res = buildRes();

    await createSpace(req, res as never);

    expect(prisma.space.create).toHaveBeenCalledTimes(1);
    const callArgs = (prisma.space.create as AnyMock).mock.calls[0]?.[0];
    expect(callArgs).toBeDefined();
    const dataKeys = Object.keys(callArgs.data);

    // Whitelisted fields are present.
    expect(dataKeys).toEqual(
      expect.arrayContaining(["name", "description", "pricingType"]),
    );
    // Non-whitelisted fields are NOT in the create payload — otherwise
    // Prisma would 500 with "Unknown argument `address`" at runtime.
    expect(dataKeys).not.toContain("address");
    expect(dataKeys).not.toContain("city");
    expect(dataKeys).not.toContain("state");
    expect(dataKeys).not.toContain("country");
    expect(dataKeys).not.toContain("postalCode");
    expect(dataKeys).not.toContain("latitude");
    expect(dataKeys).not.toContain("longitude");
    // hostId is set from `req.userId`, not from the body — mass-assignment
    // protection.
    expect(callArgs.data.hostId).toBe("user-1");
  });
});

// H2: createSpace/updateSpace must validate the whitelisted numeric base rates
// before they reach Prisma, so a host can't persist a negative pricePerHour (→
// negative booking total) or a zero/negative capacity / inverted booking-hour
// bounds. The unconstrained Float? columns give no DB-level protection.
const fullWeek = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  startTime: "09:00",
  endTime: "18:00",
  isOpen: dayOfWeek < 5,
}));

const buildCreateBody = (overrides: Record<string, unknown> = {}) => ({
  name: "Test space",
  pricingType: "HOURLY",
  venueId: 1,
  availability: fullWeek,
  ...overrides,
});

describe("createSpace - H2 numeric base-rate validation", () => {
  beforeEach(() => {
    (prisma.venue.findUnique as AnyMock).mockResolvedValue({
      id: 1,
      hostId: "user-1",
      isActive: true,
    });
    (prisma.space.create as AnyMock).mockResolvedValue({
      id: 1,
      category: null,
      amenities: [],
    });
  });

  it("rejects a negative pricePerHour with 400", async () => {
    const res = buildRes();
    await createSpace(
      buildReq({ body: buildCreateBody({ pricePerHour: -100 }) }),
      res as never,
    );
    expect(res.statusCode).toBe(400);
    expect(prisma.space.create).not.toHaveBeenCalled();
  });

  it("accepts a zero pricePerHour (0 means 'Contact for pricing', not bookable online)", async () => {
    // A host may set an hourly/daily rate to 0 to list a space as "Contact for
    // pricing": the public site renders that label and the order-service fails
    // closed on a zero-candidate price set, so it can't be booked at $0.
    const res = buildRes();
    await createSpace(
      buildReq({ body: buildCreateBody({ pricePerHour: 0 }) }),
      res as never,
    );
    expect(res.statusCode).toBe(201);
    expect(prisma.space.create).toHaveBeenCalled();
  });

  it("accepts a zero pricePerDay for a DAILY space (Contact for pricing)", async () => {
    const res = buildRes();
    await createSpace(
      buildReq({
        body: buildCreateBody({
          pricingType: "DAILY",
          pricePerDay: 0,
          pricePerHour: null,
        }),
      }),
      res as never,
    );
    expect(res.statusCode).toBe(201);
    expect(prisma.space.create).toHaveBeenCalled();
  });

  it("accepts a null blank rate (regression: DAILY-only space with pricePerHour:null)", async () => {
    // The admin form always posts the unused rate as `null`. A null clears the
    // nullable column and must NOT be rejected, or normal single-rate spaces
    // become unsaveable.
    const res = buildRes();
    await createSpace(
      buildReq({
        body: buildCreateBody({
          pricingType: "DAILY",
          pricePerDay: 100,
          pricePerHour: null,
        }),
      }),
      res as never,
    );
    expect(res.statusCode).toBe(201);
    expect(prisma.space.create).toHaveBeenCalled();
  });

  it("rejects a negative pricePerMonth but allows 0 (request-to-book)", async () => {
    const negRes = buildRes();
    await createSpace(
      buildReq({ body: buildCreateBody({ pricePerMonth: -5 }) }),
      negRes as never,
    );
    expect(negRes.statusCode).toBe(400);
    expect(prisma.space.create).not.toHaveBeenCalled();

    // Flexible pricing: a 0 rate is a valid request-to-book / free listing.
    const zeroRes = buildRes();
    await createSpace(
      buildReq({ body: buildCreateBody({ pricePerMonth: 0 }) }),
      zeroRes as never,
    );
    expect(zeroRes.statusCode).toBe(201);
  });

  it("accepts a positive pricePerMonth on a MONTHLY space", async () => {
    const res = buildRes();
    await createSpace(
      buildReq({
        body: buildCreateBody({
          pricingType: "MONTHLY",
          pricePerMonth: 500,
        }),
      }),
      res as never,
    );
    expect(res.statusCode).toBe(201);
    expect(prisma.space.create).toHaveBeenCalledTimes(1);
  });

  it("accepts a null pricePerMonth (clears the column on a DAILY space)", async () => {
    // The admin form posts the unused rate as `null`; a null clears the
    // nullable column and must NOT be rejected.
    const res = buildRes();
    await createSpace(
      buildReq({
        body: buildCreateBody({
          pricingType: "DAILY",
          pricePerDay: 100,
          pricePerMonth: null,
        }),
      }),
      res as never,
    );
    expect(res.statusCode).toBe(201);
    expect(prisma.space.create).toHaveBeenCalled();
  });

  it("rejects a negative cleaningFee but accepts zero", async () => {
    const negRes = buildRes();
    await createSpace(
      buildReq({ body: buildCreateBody({ cleaningFee: -1 }) }),
      negRes as never,
    );
    expect(negRes.statusCode).toBe(400);

    const zeroRes = buildRes();
    await createSpace(
      buildReq({ body: buildCreateBody({ cleaningFee: 0 }) }),
      zeroRes as never,
    );
    expect(zeroRes.statusCode).toBe(201);
    expect(prisma.space.create).toHaveBeenCalledTimes(1);
  });

  it("rejects a zero or negative capacity with 400", async () => {
    const zeroRes = buildRes();
    await createSpace(
      buildReq({ body: buildCreateBody({ capacity: 0 }) }),
      zeroRes as never,
    );
    expect(zeroRes.statusCode).toBe(400);

    const negRes = buildRes();
    await createSpace(
      buildReq({ body: buildCreateBody({ capacity: -4 }) }),
      negRes as never,
    );
    expect(negRes.statusCode).toBe(400);
    expect(prisma.space.create).not.toHaveBeenCalled();
  });

  it("rejects minBookingHours > maxBookingHours with 400", async () => {
    const res = buildRes();
    await createSpace(
      buildReq({
        body: buildCreateBody({ minBookingHours: 5, maxBookingHours: 2 }),
      }),
      res as never,
    );
    expect(res.statusCode).toBe(400);
    expect(prisma.space.create).not.toHaveBeenCalled();
  });

  it("accepts well-ordered booking-hour bounds", async () => {
    const res = buildRes();
    await createSpace(
      buildReq({
        body: buildCreateBody({ minBookingHours: 1, maxBookingHours: 8 }),
      }),
      res as never,
    );
    expect(res.statusCode).toBe(201);
  });
});

describe("updateSpace - H2 numeric base-rate validation", () => {
  it("rejects a negative pricePerDay with 400", async () => {
    const res = buildRes();
    (prisma.space.findUnique as AnyMock).mockResolvedValueOnce({
      id: 5,
      hostId: "user-1",
      venueId: 1,
    });
    await updateSpace(
      buildReq({ params: { id: "5" }, body: { pricePerDay: -50 } }),
      res as never,
    );
    expect(res.statusCode).toBe(400);
    expect(prisma.space.update).not.toHaveBeenCalled();
  });

  it("rejects a negative pricePerMonth with 400", async () => {
    const res = buildRes();
    (prisma.space.findUnique as AnyMock).mockResolvedValueOnce({
      id: 7,
      hostId: "user-1",
      venueId: 1,
    });
    await updateSpace(
      buildReq({ params: { id: "7" }, body: { pricePerMonth: -5 } }),
      res as never,
    );
    expect(res.statusCode).toBe(400);
    expect(prisma.space.update).not.toHaveBeenCalled();
  });

  it("rejects a partial update whose new min exceeds the STORED max", async () => {
    // Stored max=4; a PATCH sending only minBookingHours:8 must be rejected
    // using the effective (merged) bounds, not just the fields in this body.
    const res = buildRes();
    (prisma.space.findUnique as AnyMock).mockResolvedValueOnce({
      id: 6,
      hostId: "user-1",
      venueId: 1,
      minBookingHours: 1,
      maxBookingHours: 4,
    });
    await updateSpace(
      buildReq({ params: { id: "6" }, body: { minBookingHours: 8 } }),
      res as never,
    );
    expect(res.statusCode).toBe(400);
    expect(prisma.space.update).not.toHaveBeenCalled();
  });
});

// Monthly-plan persistence + the relaxed MONTHLY validation rule: a MONTHLY
// space is valid with a positive pricePerMonth OR >= 1 valid monthly plan.
describe("createSpace - monthly plans persistence (T3)", () => {
  beforeEach(() => {
    (prisma.venue.findUnique as AnyMock).mockResolvedValue({
      id: 1,
      hostId: "user-1",
      isActive: true,
    });
    (prisma.space.create as AnyMock).mockResolvedValue({
      id: 42,
      category: null,
      amenities: [],
    });
  });

  it("persists monthlyPlans with sortOrder indices for a MONTHLY space", async () => {
    const res = buildRes();
    await createSpace(
      buildReq({
        body: buildCreateBody({
          pricingType: "MONTHLY",
          pricePerMonth: 500,
          monthlyPlans: [
            { name: "Basic", pricePerMonth: 200 },
            { name: "Pro", pricePerMonth: 500, description: "Dedicated desk" },
          ],
        }),
      }),
      res as never,
    );
    expect(res.statusCode).toBe(201);
    expect(prisma.monthlyPlan.createMany).toHaveBeenCalledTimes(1);
    const args = (prisma.monthlyPlan.createMany as AnyMock).mock.calls[0]?.[0];
    expect(args.data).toEqual([
      {
        spaceId: 42,
        name: "Basic",
        pricePerMonth: 200,
        description: undefined,
        sortOrder: 0,
      },
      {
        spaceId: 42,
        name: "Pro",
        pricePerMonth: 500,
        description: "Dedicated desk",
        sortOrder: 1,
      },
    ]);
  });

  it("accepts a MONTHLY space with plans but no pricePerMonth", async () => {
    const res = buildRes();
    await createSpace(
      buildReq({
        body: buildCreateBody({
          pricingType: "MONTHLY",
          monthlyPlans: [{ name: "Basic", pricePerMonth: 200 }],
        }),
      }),
      res as never,
    );
    expect(res.statusCode).toBe(201);
    expect(prisma.space.create).toHaveBeenCalledTimes(1);
    expect(prisma.monthlyPlan.createMany).toHaveBeenCalledTimes(1);
  });

  it("allows a space with no rate at all (lists as 'Contact for pricing')", async () => {
    // Flexible pricing: no single-type minimum. An unpriced space is a valid
    // "Contact for pricing" listing rather than a 400.
    const res = buildRes();
    await createSpace(
      buildReq({
        body: buildCreateBody({
          pricingType: "MONTHLY",
          pricePerHour: null,
          pricePerDay: null,
          pricePerMonth: null,
        }),
      }),
      res as never,
    );
    expect(res.statusCode).toBe(201);
    expect(prisma.space.create).toHaveBeenCalledTimes(1);
  });

  it("persists plans for a non-MONTHLY space (subscriptions alongside hourly/daily)", async () => {
    const res = buildRes();
    await createSpace(
      buildReq({
        body: buildCreateBody({
          pricingType: "HOURLY",
          pricePerHour: 10,
          monthlyPlans: [{ name: "Basic", pricePerMonth: 200 }],
        }),
      }),
      res as never,
    );
    expect(res.statusCode).toBe(201);
    expect(prisma.monthlyPlan.createMany).toHaveBeenCalledTimes(1);
  });
});

describe("updateSpace - monthly plans persistence (T3)", () => {
  it("replaces plans (deleteMany + createMany) for a MONTHLY space", async () => {
    const res = buildRes();
    (prisma.space.findUnique as AnyMock)
      .mockResolvedValueOnce({
        id: 8,
        hostId: "user-1",
        venueId: 1,
        pricingType: "MONTHLY",
        pricePerMonth: 500,
      })
      .mockResolvedValueOnce({ id: 8, category: null });
    await updateSpace(
      buildReq({
        params: { id: "8" },
        body: {
          monthlyPlans: [
            { name: "Basic", pricePerMonth: 200 },
            { name: "Pro", pricePerMonth: 500 },
          ],
        },
      }),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    expect(prisma.monthlyPlan.deleteMany).toHaveBeenCalledWith({
      where: { spaceId: 8 },
    });
    expect(prisma.monthlyPlan.createMany).toHaveBeenCalledTimes(1);
    const args = (prisma.monthlyPlan.createMany as AnyMock).mock.calls[0]?.[0];
    expect(args.data.map((p: { sortOrder: number }) => p.sortOrder)).toEqual([
      0, 1,
    ]);
  });

  it("replaces plans on a non-MONTHLY space when the update provides them", async () => {
    const res = buildRes();
    (prisma.space.findUnique as AnyMock)
      .mockResolvedValueOnce({
        id: 9,
        hostId: "user-1",
        venueId: 1,
        pricingType: "MONTHLY",
        pricePerMonth: 500,
      })
      .mockResolvedValueOnce({ id: 9, category: null });
    await updateSpace(
      buildReq({
        params: { id: "9" },
        body: {
          pricingType: "HOURLY",
          pricePerHour: 10,
          monthlyPlans: [{ name: "Member", pricePerMonth: 300 }],
        },
      }),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    expect(prisma.monthlyPlan.deleteMany).toHaveBeenCalledWith({
      where: { spaceId: 9 },
    });
    expect(prisma.monthlyPlan.createMany).toHaveBeenCalledTimes(1);
  });

  // A type switch that does NOT touch monthlyPlans must preserve existing plans:
  // plans are no longer tied to the MONTHLY pricing type, so switching to
  // HOURLY/DAILY/BOTH must not silently wipe a space's subscriptions.
  it("preserves plans when switching to a non-MONTHLY type without touching monthlyPlans", async () => {
    const res = buildRes();
    (prisma.space.findUnique as AnyMock)
      .mockResolvedValueOnce({
        id: 11,
        hostId: "user-1",
        venueId: 1,
        pricingType: "MONTHLY",
        pricePerMonth: 500,
      })
      .mockResolvedValueOnce({ id: 11, category: null });
    await updateSpace(
      buildReq({
        params: { id: "11" },
        body: { pricingType: "HOURLY", pricePerHour: 10 },
      }),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    expect(prisma.monthlyPlan.deleteMany).not.toHaveBeenCalled();
    expect(prisma.monthlyPlan.createMany).not.toHaveBeenCalled();
  });

  // A partial update of a MONTHLY space that doesn't touch monthlyPlans must
  // preserve the existing plans — the controller must neither delete nor
  // recreate them when the field is absent from the body.
  it("preserves plans when a MONTHLY update omits monthlyPlans", async () => {
    const res = buildRes();
    (prisma.space.findUnique as AnyMock)
      .mockResolvedValueOnce({
        id: 10,
        hostId: "user-1",
        venueId: 1,
        pricingType: "MONTHLY",
        pricePerMonth: 500,
      })
      .mockResolvedValueOnce({ id: 10, category: null });
    await updateSpace(
      buildReq({
        params: { id: "10" },
        body: { name: "Renamed monthly space" },
      }),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    expect(prisma.monthlyPlan.deleteMany).not.toHaveBeenCalled();
    expect(prisma.monthlyPlan.createMany).not.toHaveBeenCalled();
  });
});

describe("getSpace - includes ordered monthlyPlans (T3)", () => {
  it("includes monthlyPlans ordered by sortOrder then id", async () => {
    (prisma.space.findFirst as AnyMock).mockResolvedValue({
      id: 3,
      venue: {},
      monthlyPlans: [],
    });
    (prisma.review.aggregate as AnyMock).mockResolvedValue({
      _avg: { rating: null },
    });
    (prisma.review.count as AnyMock).mockResolvedValue(0);

    await getSpace(
      buildReq({ params: { id: "3" } }),
      buildRes() as never,
    );

    const args = (prisma.space.findFirst as AnyMock).mock.calls[0]?.[0];
    expect(args.include.monthlyPlans).toEqual({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
  });
});

// LOW: amenityIds is trusted from the body and `.map()`'d unconditionally into
// join rows. validateAmenityIds enforces an array of distinct positive ints
// (capped) so a malformed payload can't 500 Prisma or fan out thousands of rows.
describe("validateAmenityIds - LOW", () => {
  it("accepts an array of distinct positive integers", () => {
    expect(validateAmenityIds([1, 2, 3])).toEqual({
      ok: true,
      value: [1, 2, 3],
    });
  });

  it("rejects a non-array", () => {
    expect(validateAmenityIds("1,2,3").ok).toBe(false);
    expect(validateAmenityIds(42).ok).toBe(false);
  });

  it("rejects negative / zero / non-integer ids", () => {
    expect(validateAmenityIds([-1]).ok).toBe(false);
    expect(validateAmenityIds([0]).ok).toBe(false);
    expect(validateAmenityIds([1.5]).ok).toBe(false);
  });

  it("rejects duplicates and oversized arrays", () => {
    expect(validateAmenityIds([1, 1]).ok).toBe(false);
    expect(
      validateAmenityIds(Array.from({ length: 51 }, (_, i) => i + 1)).ok,
    ).toBe(false);
  });
});

describe("createSpace - LOW amenityIds validation", () => {
  beforeEach(() => {
    (prisma.venue.findUnique as AnyMock).mockResolvedValue({
      id: 1,
      hostId: "user-1",
      isActive: true,
    });
    (prisma.space.create as AnyMock).mockResolvedValue({
      id: 1,
      category: null,
      amenities: [],
    });
  });

  it("rejects a non-array amenityIds with 400", async () => {
    const res = buildRes();
    await createSpace(
      buildReq({ body: buildCreateBody({ amenityIds: "1,2" }) }),
      res as never,
    );
    expect(res.statusCode).toBe(400);
    expect(prisma.space.create).not.toHaveBeenCalled();
  });

  it("rejects negative amenityIds with 400", async () => {
    const res = buildRes();
    await createSpace(
      buildReq({ body: buildCreateBody({ amenityIds: [-3] }) }),
      res as never,
    );
    expect(res.statusCode).toBe(400);
    expect(prisma.space.create).not.toHaveBeenCalled();
  });
});

// LOW: getSpaces string-only query-param guards. Express parses ?city=a&city=b
// into an array (→ Prisma 500 when it reaches `contains`) and ?categorySlug[not]
// =x into a nested object (→ filter-operator injection). Both must be skipped.
describe("getSpaces - LOW query-param type guards", () => {
  it("ignores an array city param instead of 500ing", async () => {
    const res = buildRes();
    await getSpaces(
      buildReq({ query: { city: ["a", "b"] } }),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    const call = (prisma.space.findMany as AnyMock).mock.calls[0]?.[0];
    // No city venue filter is applied for a non-string city, but M11 still
    // requires venue.isActive so soft-deleted venues stay hidden.
    expect(call?.where?.venue).toEqual({ isActive: true });
  });

  it("ignores a categorySlug filter-operator object", async () => {
    const res = buildRes();
    await getSpaces(
      buildReq({ query: { categorySlug: { not: "foo" } } }),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    const call = (prisma.space.findMany as AnyMock).mock.calls[0]?.[0];
    expect(call?.where?.categorySlug).toBeUndefined();
  });

  it("ignores an array groupSlug param", async () => {
    const res = buildRes();
    await getSpaces(
      buildReq({ query: { groupSlug: ["a", "b"] } }),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    const call = (prisma.space.findMany as AnyMock).mock.calls[0]?.[0];
    expect(call?.where?.category).toBeUndefined();
  });

  it("still applies a well-formed string city filter", async () => {
    const res = buildRes();
    await getSpaces(
      buildReq({ query: { city: "Chișinău" } }),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    const call = (prisma.space.findMany as AnyMock).mock.calls[0]?.[0];
    expect(call?.where?.venue?.city).toEqual({
      contains: "Chișinău",
      mode: "insensitive",
    });
  });
});

// M11: public read paths must under no longer under-filter soft-delete state.
// getSpaces/getSpace/getAvailability/checkAvailability all require the space to
// be isActive AND to belong to an isActive venue, and createSpace refuses to
// attach a new space to a soft-deleted venue.
describe("getSpaces - M11 venue.isActive filter", () => {
  it("always requires venue.isActive:true in the where clause", async () => {
    const res = buildRes();
    await getSpaces(buildReq(), res as never);
    const call = (prisma.space.findMany as AnyMock).mock.calls[0]?.[0];
    expect(call?.where?.venue).toEqual({ isActive: true });
  });

  it("merges venue.isActive with a city filter", async () => {
    const res = buildRes();
    await getSpaces(buildReq({ query: { city: "Cluj" } }), res as never);
    const call = (prisma.space.findMany as AnyMock).mock.calls[0]?.[0];
    expect(call?.where?.venue).toEqual({
      isActive: true,
      city: { contains: "Cluj", mode: "insensitive" },
    });
  });

  it("merges venue.isActive with a bbox filter", async () => {
    const res = buildRes();
    await getSpaces(
      buildReq({
        query: { neLat: "48", neLng: "27", swLat: "46", swLng: "26" },
      }),
      res as never,
    );
    const call = (prisma.space.findMany as AnyMock).mock.calls[0]?.[0];
    expect(call?.where?.venue?.isActive).toBe(true);
    expect(call?.where?.venue?.latitude).toEqual({ gte: 46, lte: 48 });
  });
});

describe("getSpace - M11 soft-delete visibility", () => {
  it("404s (generic) when the space/venue is filtered out by the guard", async () => {
    const res = buildRes();
    // An inactive space OR a space whose venue is inactive is excluded by the
    // where clause, so findFirst returns null for both cases.
    (prisma.space.findFirst as AnyMock).mockResolvedValueOnce(null);
    await getSpace(buildReq({ params: { id: "5" } }), res as never);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: "Space not found" });
  });

  it("applies isActive + venue.isActive + host.deletedAt in the query", async () => {
    const res = buildRes();
    (prisma.space.findFirst as AnyMock).mockResolvedValueOnce(null);
    await getSpace(buildReq({ params: { id: "5" } }), res as never);
    const call = (prisma.space.findFirst as AnyMock).mock.calls[0]?.[0];
    expect(call?.where?.isActive).toBe(true);
    expect(call?.where?.venue).toEqual({ isActive: true });
    expect(call?.where?.host).toEqual({ deletedAt: null });
  });
});

describe("getAvailability - M11 soft-delete guard", () => {
  it("404s a hidden space before returning any schedule", async () => {
    const res = buildRes();
    (prisma.space.findFirst as AnyMock).mockResolvedValueOnce(null);
    await getAvailability(buildReq({ params: { id: "5" } }), res as never);
    expect(res.statusCode).toBe(404);
    expect(prisma.availability.findMany).not.toHaveBeenCalled();
    const call = (prisma.space.findFirst as AnyMock).mock.calls[0]?.[0];
    expect(call?.where?.isActive).toBe(true);
    expect(call?.where?.venue).toEqual({ isActive: true });
  });
});

describe("checkAvailability - M11 soft-delete guard", () => {
  it("404s a hidden space so it can't be probed/booked", async () => {
    const res = buildRes();
    (prisma.space.findFirst as AnyMock).mockResolvedValueOnce(null);
    await checkAvailability(
      buildReq({
        params: { id: "5" },
        body: { startDate: "2024-01-01", endDate: "2024-01-10" },
      }),
      res as never,
    );
    expect(res.statusCode).toBe(404);
    const call = (prisma.space.findFirst as AnyMock).mock.calls[0]?.[0];
    expect(call?.where?.isActive).toBe(true);
    expect(call?.where?.venue).toEqual({ isActive: true });
  });
});

// AUD-B6: the per-space review count must be emitted under `totalReviews` (the
// @repo/types Space key every frontend reads), not the old `reviewCount` key
// which was silently dropped so counts always rendered 0. getMySpaces must also
// compute averageRating + totalReviews for the admin host Spaces page.
describe("getSpaces - AUD-B6 totalReviews key", () => {
  it("emits totalReviews (not reviewCount) with the aggregated count", async () => {
    const res = buildRes();
    (prisma.space.findMany as AnyMock).mockResolvedValueOnce([
      { id: 1, venue: null },
      { id: 2, venue: null },
    ]);
    (prisma.review.groupBy as AnyMock).mockResolvedValueOnce([
      { spaceId: 1, _avg: { rating: 4.5 }, _count: { rating: 3 } },
    ]);

    await getSpaces(buildReq(), res as never);

    expect(res.statusCode).toBe(200);
    const spaces = (
      res.body as {
        spaces: Array<{
          id: number;
          averageRating: number;
          totalReviews?: number;
          reviewCount?: number;
        }>;
      }
    ).spaces;
    const rated = spaces.find((s) => s.id === 1)!;
    expect(rated.totalReviews).toBe(3);
    expect(rated.averageRating).toBe(4.5);
    expect(rated).not.toHaveProperty("reviewCount");
    // A space with no reviews still reports a zero count under the new key.
    const unrated = spaces.find((s) => s.id === 2)!;
    expect(unrated.totalReviews).toBe(0);
    expect(unrated).not.toHaveProperty("reviewCount");
  });
});

describe("getSpace - AUD-B6 totalReviews key", () => {
  it("emits totalReviews (not reviewCount) with the review count", async () => {
    const res = buildRes();
    (prisma.space.findFirst as AnyMock).mockResolvedValueOnce({
      id: 5,
      venue: null,
    });
    (prisma.review.aggregate as AnyMock).mockResolvedValueOnce({
      _avg: { rating: 4 },
    });
    (prisma.review.count as AnyMock).mockResolvedValueOnce(7);

    await getSpace(buildReq({ params: { id: "5" } }), res as never);

    expect(res.statusCode).toBe(200);
    const body = res.body as {
      averageRating: number;
      totalReviews?: number;
      reviewCount?: number;
    };
    expect(body.totalReviews).toBe(7);
    expect(body.averageRating).toBe(4);
    expect(body).not.toHaveProperty("reviewCount");
  });
});

describe("getMySpaces - AUD-B6 attaches ratings", () => {
  it("computes averageRating + totalReviews for each returned space", async () => {
    const res = buildRes();
    (prisma.space.findMany as AnyMock).mockResolvedValueOnce([
      { id: 10, venue: null, _count: { bookings: 2, reviews: 3 } },
      { id: 20, venue: null, _count: { bookings: 0, reviews: 0 } },
    ]);
    (prisma.review.groupBy as AnyMock).mockResolvedValueOnce([
      { spaceId: 10, _avg: { rating: 4.5 }, _count: { rating: 3 } },
    ]);

    await getMySpaces(buildReq(), res as never);

    expect(res.statusCode).toBe(200);
    const body = res.body as Array<{
      id: number;
      averageRating: number;
      totalReviews: number;
    }>;
    const rated = body.find((s) => s.id === 10)!;
    expect(rated.averageRating).toBe(4.5);
    expect(rated.totalReviews).toBe(3);
    // A space with no reviews still reports zeros (not undefined).
    const unrated = body.find((s) => s.id === 20)!;
    expect(unrated.averageRating).toBe(0);
    expect(unrated.totalReviews).toBe(0);
  });
});

describe("createSpace - M11 deactivated venue guard", () => {
  it("400s when the target venue is soft-deleted (isActive:false)", async () => {
    (prisma.venue.findUnique as AnyMock).mockResolvedValue({
      id: 1,
      hostId: "user-1",
      isActive: false,
    });
    const res = buildRes();
    await createSpace(
      buildReq({ body: buildCreateBody() }),
      res as never,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      message: "Cannot add a space to a deactivated venue",
    });
    expect(prisma.space.create).not.toHaveBeenCalled();
  });
});
