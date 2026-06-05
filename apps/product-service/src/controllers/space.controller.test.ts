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
    booking: { findMany: vi.fn() },
    spaceAmenity: { deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
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
  updateAvailability,
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
    await updateAvailability(
      buildReq({
        params: { id: "42" },
        body: { availability: [], blockedDates: [] },
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
});
