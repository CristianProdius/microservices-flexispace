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
  checkAvailability,
  createSpace,
  updateAvailability,
  validatePricingTiers,
  deleteSpace,
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
      { venue: { venueVerified: "desc" } },
      { host: { hostVerified: "desc" } },
      { createdAt: "desc" },
    ]);
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
    (prisma.space.findUnique as AnyMock).mockResolvedValueOnce({
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
