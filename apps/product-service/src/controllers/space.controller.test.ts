import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createSpace,
  getSpace,
  updateAvailability,
  updateSpace,
} from "./space.controller.js";

const mocks = vi.hoisted(() => {
  const prisma = {
    $transaction: vi.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    availability: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    blockedDate: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    pricingTier: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    review: {
      aggregate: vi.fn().mockResolvedValue({ _avg: { rating: 0 } }),
      count: vi.fn().mockResolvedValue(0),
      groupBy: vi.fn(),
    },
    space: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    spaceAmenity: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    spaceCategory: {
      findUnique: vi.fn(),
    },
    venue: {
      findUnique: vi.fn(),
    },
  };
  return {
    prisma,
    producerSend: vi.fn(),
  };
});

vi.mock("@repo/db", () => ({
  prisma: mocks.prisma,
  // these are re-exported as types/enums elsewhere — keep minimal stubs
  Prisma: {},
  PricingType: {},
  SpaceType: {},
  CancellationPolicy: {},
  Currency: {},
}));

vi.mock("../utils/kafka.js", () => ({
  producer: {
    send: mocks.producerSend,
  },
}));

const createResponse = () => {
  const res = {
    json: vi.fn(),
    status: vi.fn(),
  } as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
  res.status.mockReturnValue(res);
  return res;
};

const validAvailability = () =>
  Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    startTime: "09:00",
    endTime: "17:00",
    isOpen: true,
  }));

afterEach(() => {
  vi.resetAllMocks();
});

describe("PRODSVC-001: updateAvailability validates input", () => {
  it("rejects availability with out-of-range dayOfWeek and never touches Prisma", async () => {
    mocks.prisma.space.findUnique.mockResolvedValue({
      id: 1,
      hostId: "host-1",
    });
    const badAvailability = validAvailability();
    badAvailability[0]!.dayOfWeek = 99;
    const req = {
      body: { availability: badAvailability },
      params: { id: "1" },
      user: { role: "HOST" },
      userId: "host-1",
    } as unknown as Request;
    const res = createResponse();

    await updateAvailability(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.prisma.availability.deleteMany).not.toHaveBeenCalled();
    expect(mocks.prisma.availability.createMany).not.toHaveBeenCalled();
  });

  it("rejects availability with malformed time string", async () => {
    mocks.prisma.space.findUnique.mockResolvedValue({
      id: 1,
      hostId: "host-1",
    });
    const badAvailability = validAvailability();
    badAvailability[2]!.startTime = "bogus";
    const req = {
      body: { availability: badAvailability },
      params: { id: "1" },
      user: { role: "HOST" },
      userId: "host-1",
    } as unknown as Request;
    const res = createResponse();

    await updateAvailability(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.prisma.availability.createMany).not.toHaveBeenCalled();
  });

  it("rejects blocked dates with garbage date strings", async () => {
    mocks.prisma.space.findUnique.mockResolvedValue({
      id: 1,
      hostId: "host-1",
    });
    const req = {
      body: { blockedDates: [{ date: "not-a-date" }] },
      params: { id: "1" },
      user: { role: "HOST" },
      userId: "host-1",
    } as unknown as Request;
    const res = createResponse();

    await updateAvailability(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.prisma.blockedDate.createMany).not.toHaveBeenCalled();
  });

  it("accepts a well-formed availability payload", async () => {
    mocks.prisma.space.findUnique.mockResolvedValue({
      id: 1,
      hostId: "host-1",
    });
    mocks.prisma.availability.deleteMany.mockResolvedValue({ count: 0 });
    mocks.prisma.availability.createMany.mockResolvedValue({ count: 7 });
    const req = {
      body: { availability: validAvailability() },
      params: { id: "1" },
      user: { role: "HOST" },
      userId: "host-1",
    } as unknown as Request;
    const res = createResponse();

    await updateAvailability(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mocks.prisma.availability.createMany).toHaveBeenCalledTimes(1);
  });
});

describe("PRODSVC-002: GET /spaces/:id does not leak host email", () => {
  it("does not request host.email in the Prisma include", async () => {
    mocks.prisma.space.findUnique.mockResolvedValue({
      id: 1,
      venue: null,
      blockedDates: [],
      reviews: [],
    });
    mocks.prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 0 } });
    mocks.prisma.review.count.mockResolvedValue(0);
    const req = {
      params: { id: "1" },
      query: {},
    } as unknown as Request;
    const res = createResponse();

    await getSpace(req, res);

    const args = mocks.prisma.space.findUnique.mock.calls[0]![0];
    expect(args.include.host.select.email).toBeUndefined();
    expect(args.include.host.select.id).toBe(true);
    expect(args.include.host.select.name).toBe(true);
    expect(args.include.host.select.image).toBe(true);
  });
});

describe("PRODSVC-009: createSpace rejects unknown categorySlug", () => {
  it("returns 400 when categorySlug does not match any SpaceCategory", async () => {
    mocks.prisma.venue.findUnique.mockResolvedValue({
      id: 5,
      hostId: "host-1",
      address: null,
      city: null,
      state: null,
      country: null,
      postalCode: null,
      latitude: null,
      longitude: null,
    });
    mocks.prisma.spaceCategory.findUnique.mockResolvedValue(null);
    const req = {
      body: {
        availability: validAvailability(),
        categorySlug: "made-up-slug",
        venueId: 5,
      },
      userId: "host-1",
    } as unknown as Request;
    const res = createResponse();

    await createSpace(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.prisma.space.create).not.toHaveBeenCalled();
  });
});

describe("PRODSVC-010: videoUrl validation rejects non-YouTube and unsafe schemes", () => {
  it("rejects javascript: scheme that contains the youtube.com substring", async () => {
    mocks.prisma.venue.findUnique.mockResolvedValue({
      id: 5,
      hostId: "host-1",
    });
    const req = {
      body: {
        availability: validAvailability(),
        venueId: 5,
        videoUrl: "javascript:youtube.com/watch?v=evil",
      },
      userId: "host-1",
    } as unknown as Request;
    const res = createResponse();

    await createSpace(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.prisma.space.create).not.toHaveBeenCalled();
  });

  it("rejects open-redirect-style hosts whose path contains youtube.com", async () => {
    mocks.prisma.venue.findUnique.mockResolvedValue({
      id: 5,
      hostId: "host-1",
    });
    const req = {
      body: {
        availability: validAvailability(),
        venueId: 5,
        videoUrl: "https://evil.com/youtube.com/watch?v=xxx",
      },
      userId: "host-1",
    } as unknown as Request;
    const res = createResponse();

    await createSpace(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.prisma.space.create).not.toHaveBeenCalled();
  });
});

describe("PRODSVC-018: updateSpace does not forward unwhitelisted fields to buildCategoryPayload", () => {
  it("ignores attacker-supplied category-side fields injected via the body", async () => {
    mocks.prisma.space.findUnique.mockResolvedValueOnce({
      id: 7,
      hostId: "host-1",
      venueId: 5,
    });
    mocks.prisma.space.update.mockResolvedValue({ id: 7 });
    mocks.prisma.space.findUnique.mockResolvedValueOnce({
      id: 7,
      venue: null,
    });
    mocks.prisma.spaceCategory.findUnique.mockResolvedValue({
      slug: "coworking-space",
    });

    const req = {
      body: {
        categorySlug: "coworking-space",
        // attacker-supplied fields that must NOT be forwarded
        hostId: "attacker-id",
        isActive: false,
        ownerId: "attacker-id",
        somethingMalicious: { sql: "injected" },
        // also a legitimate whitelisted field
        name: "Updated name",
      },
      params: { id: "7" },
      user: { role: "HOST" },
      userId: "host-1",
    } as unknown as Request;
    const res = createResponse();

    await updateSpace(req, res);

    expect(mocks.prisma.space.update).toHaveBeenCalledTimes(1);
    const updateArgs = mocks.prisma.space.update.mock.calls[0]![0];
    expect(updateArgs.data.somethingMalicious).toBeUndefined();
    expect(updateArgs.data.ownerId).toBeUndefined();
    expect(updateArgs.data.hostId).toBeUndefined();
    // sanity: whitelisted fields survive
    expect(updateArgs.data.categorySlug).toBe("coworking-space");
    expect(updateArgs.data.name).toBe("Updated name");
  });
});
