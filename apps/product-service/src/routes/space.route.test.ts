import { signAccessToken } from "@repo/auth-middleware/jwt";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { IncomingMessage, ServerResponse } from "node:http";
import { Duplex } from "node:stream";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import spaceRouter from "./space.route.js";

const mocks = vi.hoisted(() => ({
  availabilityFindMany: vi.fn(),
  blockedDateFindMany: vi.fn(),
  count: vi.fn(),
  availabilityCreateMany: vi.fn(),
  create: vi.fn(),
  createMany: vi.fn(),
  availabilityDeleteMany: vi.fn(),
  deleteMany: vi.fn(),
  bookingFindMany: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  groupBy: vi.fn(),
  pricingTierCreateMany: vi.fn(),
  pricingTierDeleteMany: vi.fn(),
  producerSend: vi.fn(),
  reviewAggregate: vi.fn(),
  spaceCategoryFindUnique: vi.fn(),
  update: vi.fn(),
  venueFindUnique: vi.fn(),
  // AUD-005/021: `shouldBe*` middleware now calls `lookupActiveUser` which
  // hits `prisma.user.findFirst({ id, deletedAt: null })`. Default returns
  // a stub that lets the test's JWT-based auth context flow through; tests
  // that need to assert "soft-deleted" behavior can override per-test.
  userFindFirst: vi.fn(),
}));

// Mock prisma client shared between the module export and the `tx` argument
// passed to callback-style `prisma.$transaction(async (tx) => ...)` calls
// added in PRODSVC-004. Hoisted so it's available inside `vi.mock` factories.
const mockPrismaClient = vi.hoisted(() => {
  // Defined as a `let` we mutate below so the closure inside `$transaction`
  // can refer back to the same object.
  const client: Record<string, unknown> = {};
  return client;
});

vi.mock("@repo/db", () => {
  Object.assign(mockPrismaClient, {
    // Supports both forms used by the controllers:
    //   - array form: `prisma.$transaction([op1, op2])` -> Promise.all
    //   - callback form (PRODSVC-004): `prisma.$transaction(async tx => ...)`
    //     where `tx` is the prisma client itself for the mock.
    $transaction: vi.fn((arg: unknown) => {
      if (typeof arg === "function") {
        return (arg as (tx: unknown) => unknown)(mockPrismaClient);
      }
      return Promise.all(arg as Promise<unknown>[]);
    }),
    availability: {
      createMany: mocks.availabilityCreateMany,
      deleteMany: mocks.availabilityDeleteMany,
      findMany: mocks.availabilityFindMany,
    },
    blockedDate: {
      findMany: mocks.blockedDateFindMany,
    },
    booking: {
      findMany: mocks.bookingFindMany,
    },
    pricingTier: {
      createMany: mocks.pricingTierCreateMany,
      deleteMany: mocks.pricingTierDeleteMany,
    },
    space: {
      count: mocks.count,
      create: mocks.create,
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
    spaceCategory: {
      findUnique: mocks.spaceCategoryFindUnique,
    },
    spaceAmenity: {
      deleteMany: mocks.deleteMany,
      createMany: mocks.createMany,
    },
    review: {
      aggregate: mocks.reviewAggregate,
      groupBy: mocks.groupBy,
    },
    venue: {
      findUnique: mocks.venueFindUnique,
    },
    user: {
      findFirst: mocks.userFindFirst,
    },
  });
  return {
    Currency: {
      EUR: "EUR",
      MDL: "MDL",
      USD: "USD",
    },
    SpaceType: {
      COWORKING_SPACE: "COWORKING_SPACE",
      EVENT_VENUE: "EVENT_VENUE",
      MEETING_ROOM: "MEETING_ROOM",
      OFFICE_DESK: "OFFICE_DESK",
      PRIVATE_OFFICE: "PRIVATE_OFFICE",
      WEDDING_VENUE: "WEDDING_VENUE",
    },
    prisma: mockPrismaClient,
  };
});

vi.mock("../utils/kafka.js", () => ({
  producer: {
    send: mocks.producerSend,
  },
}));

vi.mock("../controllers/review.controller.js", () => ({
  createReview: vi.fn(),
  deleteReview: vi.fn(),
  getSpaceReviews: vi.fn(),
  respondToReview: vi.fn(),
  updateReview: vi.fn(),
}));

class MockSocket extends Duplex {
  public destroyed = false;
  public remoteAddress = "127.0.0.1";
  public writable = true;
  public _writableState = {
    corked: 0,
  };

  _read() {}

  _write(
    _chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    callback();
  }

  destroy(error?: Error) {
    this.destroyed = true;
    if (error) {
      this.emit("error", error);
    }
    this.emit("close");
    return this;
  }

  setTimeout() {
    return this;
  }

  cork() {}

  uncork() {}

  end() {
    this.emit("finish");
    return this;
  }

  destroySoon() {}
}

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/spaces", spaceRouter);
  app.use(
    (
      err: { status?: number; message?: string },
      _req: Request,
      res: Response,
      _next: NextFunction,
    ) =>
      res
        .status(err.status || 500)
        .json({ message: err.message || "Internal Server Error!" }),
  );
  return app;
};

const createToken = (
  role: "USER" | "HOST" | "ADMIN",
  userId = "host-user-1",
  hostVerified = role !== "HOST" ? undefined : true,
) =>
  signAccessToken({
    userId,
    email: `${role.toLowerCase()}@example.com`,
    role,
    ...(hostVerified !== undefined && { hostVerified }),
  });

const validAvailability = [
  { dayOfWeek: 0, startTime: "09:00", endTime: "21:00", isOpen: false },
  { dayOfWeek: 1, startTime: "09:00", endTime: "21:00", isOpen: true },
  { dayOfWeek: 2, startTime: "09:00", endTime: "21:00", isOpen: true },
  { dayOfWeek: 3, startTime: "09:00", endTime: "21:00", isOpen: true },
  { dayOfWeek: 4, startTime: "09:00", endTime: "21:00", isOpen: true },
  { dayOfWeek: 5, startTime: "09:00", endTime: "21:00", isOpen: true },
  { dayOfWeek: 6, startTime: "09:00", endTime: "21:00", isOpen: false },
];

const invokeApp = async (input: {
  authorization?: string;
  body?: unknown;
  method: string;
  url: string;
}) => {
  const app = createTestApp();
  const socket = new MockSocket();
  const req = new IncomingMessage(socket as never);
  const res = new ServerResponse(req);
  const chunks: Buffer[] = [];
  const bodyBuffer = input.body
    ? Buffer.from(JSON.stringify(input.body))
    : undefined;

  req.on("end", () => {
    req.complete = true;
  });

  res.write = ((
    chunk: string | Buffer | Uint8Array,
    _encoding?: BufferEncoding,
    callback?: (error?: Error | null) => void,
  ) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    callback?.();
    return true;
  }) as typeof res.write;

  res.end = ((
    chunk?: string | Buffer | Uint8Array,
    _encoding?: BufferEncoding,
    callback?: () => void,
  ) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    res.finished = true;
    callback?.();
    res.emit("finish");
    return res;
  }) as typeof res.end;

  req.method = input.method;
  req.url = input.url;
  req.headers = {
    ...(input.authorization ? { authorization: input.authorization } : {}),
    ...(bodyBuffer
      ? {
          "content-length": String(bodyBuffer.length),
          "content-type": "application/json",
        }
      : {}),
  };

  const finished = new Promise<void>((resolve, reject) => {
    res.on("finish", resolve);
    res.on("error", reject);
  });

  app(req as never, res as never);

  if (bodyBuffer) {
    req.push(bodyBuffer);
  }
  req.push(null);

  await finished;
  socket.destroy();
  res.removeAllListeners();
  req.removeAllListeners();

  const body = Buffer.concat(chunks);
  return {
    json: body.length > 0 ? JSON.parse(body.toString("utf8")) : null,
    status: res.statusCode,
  };
};

describe("space routes", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  beforeEach(async () => {
    // AUD-005/021: `shouldBe*` calls `lookupActiveUser` which queries
    // `prisma.user.findFirst`. Default the mock to "active user with the
    // role the JWT claims" so existing tests don't have to be aware of the
    // active-user check; tests that need a soft-deleted path can override.
    mocks.userFindFirst.mockImplementation(({ where }: any) =>
      Promise.resolve({ id: where?.id ?? "user", role: "HOST" }),
    );
    // The cache is module-level; clear between tests so prior overrides
    // don't bleed.
    const { _clearUserCacheForTests } = await import(
      "@repo/auth-middleware"
    );
    _clearUserCacheForTests();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("rejects non-host, non-admin users before reaching the update controller", async () => {
    const response = await invokeApp({
      authorization: `Bearer ${createToken("USER", "user-1")}`,
      body: { title: "Updated title" },
      method: "PUT",
      url: "/spaces/123",
    });

    expect(response.status).toBe(403);
    expect(response.json).toEqual({
      message: "Verified host or Admin access required",
    });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("rejects unverified hosts before reaching space management controllers", async () => {
    const response = await invokeApp({
      authorization: `Bearer ${createToken("HOST", "pending-host-1", false)}`,
      body: {
        categorySlug: "meeting-training-room",
        country: "Moldova",
        description: "A private meeting space for product work.",
        images: ["/space.png"],
        name: "Pending host space",
        pricingType: "HOURLY",
        shortDescription: "Private meeting space",
        spaceType: "MEETING_ROOM",
        venueId: 22,
      },
      method: "POST",
      url: "/spaces",
    });

    expect(response.status).toBe(403);
    expect(response.json).toEqual({ message: "Verified host access required" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("routes host/my before the public id route", async () => {
    // getMySpaces now aggregates ratings (AUD-B6), so stub the batched groupBy.
    mocks.groupBy.mockResolvedValue([]);
    mocks.findMany.mockResolvedValue([
      {
        _count: { bookings: 0, reviews: 0 },
        id: 123,
        name: "Host space",
        venue: {
          address: "Main Street 1",
          city: "Chisinau",
          country: "Moldova",
          latitude: null,
          longitude: null,
          postalCode: null,
          state: null,
        },
      },
    ]);

    const response = await invokeApp({
      authorization: `Bearer ${createToken("HOST", "host-user-1")}`,
      method: "GET",
      url: "/spaces/host/my",
    });

    expect(response.status).toBe(200);
    expect(response.json).toMatchObject([{ id: 123, name: "Host space" }]);
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hostId: "host-user-1" },
      }),
    );
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("keeps host-owner restrictions inside the update controller", async () => {
    mocks.findUnique.mockResolvedValue({
      hostId: "different-host",
      id: 123,
    });

    const response = await invokeApp({
      authorization: `Bearer ${createToken("HOST", "host-user-1")}`,
      body: { title: "Updated title" },
      method: "PUT",
      url: "/spaces/123",
    });

    expect(response.status).toBe(403);
    expect(response.json).toEqual({
      message: "Not authorized to update this space",
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("allows admins to update a space they do not own", async () => {
    mocks.findUnique
      .mockResolvedValueOnce({
        hostId: "different-host",
        id: 123,
      })
      .mockResolvedValueOnce({
        category: null,
        id: 123,
        spaceType: "MEETING_ROOM",
        name: "Updated title",
      });
    mocks.spaceCategoryFindUnique.mockResolvedValue({
      slug: "meeting-training-room",
    });
    mocks.update.mockResolvedValue({
      category: null,
      id: 123,
      spaceType: "MEETING_ROOM",
      name: "Updated title",
    });

    const response = await invokeApp({
      authorization: `Bearer ${createToken("ADMIN", "admin-1")}`,
      body: {
        categorySlug: "meeting-training-room",
        spaceType: "EVENT_VENUE",
        name: "Updated title",
      },
      method: "PUT",
      url: "/spaces/123",
    });

    expect(response.status).toBe(200);
    expect(response.json).toEqual({
      category: null,
      id: 123,
      spaceType: "MEETING_ROOM",
      name: "Updated title",
    });
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          categorySlug: "meeting-training-room",
          spaceType: "MEETING_ROOM",
          name: "Updated title",
        },
        where: { id: 123 },
      }),
    );
    expect(mocks.producerSend).toHaveBeenCalledWith("space.updated", {
      value: { id: 123 },
    });
  });

  it("derives the canonical legacy space type from categorySlug on create", async () => {
    mocks.spaceCategoryFindUnique.mockResolvedValue({
      slug: "retail-store-shop-front",
    });
    mocks.venueFindUnique.mockResolvedValue({
      address: "Main Street 1",
      city: "Chisinau",
      country: "Moldova",
      hostId: "host-user-1",
      id: 22,
      isActive: true,
      latitude: null,
      longitude: null,
      postalCode: null,
      state: null,
    });
    mocks.create.mockResolvedValue({
      amenities: [],
      category: {
        group: {
          name: "Retail & Commercial",
          slug: "retail-commercial",
          sortOrder: 4,
        },
        groupSlug: "retail-commercial",
        id: 17,
        name: "Retail Store / Shop Front",
        slug: "retail-store-shop-front",
        sortOrder: 1,
      },
      id: 321,
      spaceType: "PRIVATE_OFFICE",
    });

    const response = await invokeApp({
      authorization: `Bearer ${createToken("HOST", "host-user-1")}`,
      body: {
        address: "Main Street 1",
        amenities: [],
        availability: validAvailability,
        categorySlug: "retail-store-shop-front",
        city: "Chisinau",
        country: "Moldova",
        description:
          "A bright retail space for launches, previews, and short-term brand activations.",
        images: ["/space.png"],
        name: "Launch Store",
        pricingType: "DAILY",
        shortDescription: "Flexible retail frontage in the city center",
        spaceType: "MEETING_ROOM",
        venueId: 22,
      },
      method: "POST",
      url: "/spaces",
    });

    expect(response.status).toBe(201);
    expect(response.json).toMatchObject({
      id: 321,
      spaceType: "PRIVATE_OFFICE",
    });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          categorySlug: "retail-store-shop-front",
          hostId: "host-user-1",
          spaceType: "PRIVATE_OFFICE",
          availability: {
            create: validAvailability,
          },
        }),
      }),
    );
  });

  it("requires availability when hosts create spaces", async () => {
    mocks.venueFindUnique.mockResolvedValue({
      address: "Main Street 1",
      city: "Chisinau",
      country: "Moldova",
      hostId: "host-user-1",
      id: 22,
      isActive: true,
      latitude: null,
      longitude: null,
      postalCode: null,
      state: null,
    });

    const response = await invokeApp({
      authorization: `Bearer ${createToken("HOST", "host-user-1")}`,
      body: {
        categorySlug: "meeting-training-room",
        country: "Moldova",
        description: "A private meeting space for product work.",
        images: ["/space.png"],
        name: "Pending host space",
        pricingType: "HOURLY",
        shortDescription: "Private meeting space",
        spaceType: "MEETING_ROOM",
        venueId: 22,
      },
      method: "POST",
      url: "/spaces",
    });

    expect(response.status).toBe(400);
    expect(response.json).toEqual({
      message: "availability must include all 7 days and at least one open day",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("normalizes the legacy meeting-room slug on update", async () => {
    mocks.findUnique.mockResolvedValue({
      hostId: "host-user-1",
      id: 123,
    });
    mocks.spaceCategoryFindUnique.mockResolvedValue({
      slug: "meeting-training-room",
    });
    mocks.update.mockResolvedValue({
      category: {
        group: {
          name: "Business & Office",
          slug: "business-office",
          sortOrder: 1,
        },
        groupSlug: "business-office",
        id: 3,
        name: "Meeting & Training Room",
        slug: "meeting-training-room",
        sortOrder: 3,
      },
      id: 123,
      spaceType: "MEETING_ROOM",
    });

    const response = await invokeApp({
      authorization: `Bearer ${createToken("HOST", "host-user-1")}`,
      body: {
        categorySlug: "meeting-room",
        spaceType: "WEDDING_VENUE",
      },
      method: "PUT",
      url: "/spaces/123",
    });

    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          categorySlug: "meeting-training-room",
          spaceType: "MEETING_ROOM",
        },
      }),
    );
  });

  it("replaces availability when hosts update a space", async () => {
    mocks.findUnique
      .mockResolvedValueOnce({
        hostId: "host-user-1",
        id: 123,
        venueId: 22,
      })
      .mockResolvedValueOnce({
        availability: validAvailability,
        id: 123,
      });
    mocks.update.mockResolvedValue({
      id: 123,
    });

    const response = await invokeApp({
      authorization: `Bearer ${createToken("HOST", "host-user-1")}`,
      body: {
        availability: validAvailability,
      },
      method: "PUT",
      url: "/spaces/123",
    });

    expect(response.status).toBe(200);
    expect(mocks.availabilityDeleteMany).toHaveBeenCalledWith({
      where: { spaceId: 123 },
    });
    expect(mocks.availabilityCreateMany).toHaveBeenCalledWith({
      data: validAvailability.map((entry) => ({ ...entry, spaceId: 123 })),
    });
    expect(mocks.producerSend).toHaveBeenCalledWith("space.updated", {
      value: { id: 123 },
    });
  });

  it("applies groupSlug filters through the category relation on list endpoints", async () => {
    mocks.findMany.mockResolvedValue([
      {
        _count: { reviews: 0 },
        amenities: [],
        category: {
          group: {
            name: "Events & Celebrations",
            slug: "events-celebrations",
            sortOrder: 2,
          },
          groupSlug: "events-celebrations",
          id: 11,
          name: "Event Venue",
          slug: "event-venue",
          sortOrder: 1,
        },
        host: {
          id: "host-1",
          image: null,
          name: "Host",
        },
        id: 1,
      },
    ]);
    mocks.count.mockResolvedValue(1);
    mocks.reviewAggregate.mockResolvedValue({
      _avg: { rating: null },
    });
    mocks.groupBy.mockResolvedValue([]);

    const response = await invokeApp({
      method: "GET",
      url: "/spaces?groupSlug=events-celebrations",
    });

    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: {
            is: {
              groupSlug: "events-celebrations",
            },
          },
        }),
      }),
    );
    expect(response.json.pagination.total).toBe(1);
  });

  it("rejects invalid space type filters before querying Prisma", async () => {
    const response = await invokeApp({
      method: "GET",
      url: "/spaces?spaceType=NOT_A_SPACE_TYPE",
    });

    expect(response.status).toBe(400);
    expect(response.json).toEqual({ message: "Invalid spaceType" });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("rejects invalid availability check dates with a 400 response", async () => {
    const response = await invokeApp({
      authorization: `Bearer ${createToken("USER", "guest-1")}`,
      body: {
        endDate: "2026-05-20",
        startDate: "not-a-date",
      },
      method: "POST",
      url: "/spaces/123/check",
    });

    expect(response.status).toBe(400);
    expect(response.json).toEqual({
      message: "startDate must be a valid date",
    });
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.bookingFindMany).not.toHaveBeenCalled();
  });

  it("rejects reversed availability date ranges before querying Prisma", async () => {
    const response = await invokeApp({
      authorization: `Bearer ${createToken("USER", "guest-1")}`,
      body: {
        endDate: "2026-05-19",
        startDate: "2026-05-20",
      },
      method: "POST",
      url: "/spaces/123/check",
    });

    expect(response.status).toBe(400);
    expect(response.json).toEqual({
      message: "endDate must be on or after startDate",
    });
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.bookingFindMany).not.toHaveBeenCalled();
  });

  it("does not emit space.created when a downstream insert fails inside the transaction (PRODSVC-004)", async () => {
    mocks.spaceCategoryFindUnique.mockResolvedValue({
      slug: "retail-store-shop-front",
    });
    mocks.venueFindUnique.mockResolvedValue({
      address: "Main Street 1",
      city: "Chisinau",
      country: "Moldova",
      hostId: "host-user-1",
      id: 22,
      isActive: true,
      latitude: null,
      longitude: null,
      postalCode: null,
      state: null,
    });
    // space.create succeeds, then pricingTier.createMany blows up: the
    // controller must propagate the error and NOT publish a Kafka event
    // for a space that gets rolled back.
    mocks.create.mockResolvedValue({
      amenities: [],
      category: null,
      id: 999,
      spaceType: "PRIVATE_OFFICE",
    });
    mocks.pricingTierCreateMany.mockRejectedValue(
      new Error("simulated DB failure"),
    );

    const response = await invokeApp({
      authorization: `Bearer ${createToken("HOST", "host-user-1")}`,
      body: {
        availability: validAvailability,
        categorySlug: "retail-store-shop-front",
        description: "Will fail mid-fan-out",
        images: ["/space.png"],
        name: "Doomed space",
        pricingTiers: [{ label: "1 hr", minutes: 60, price: 50 }],
        pricingType: "HOURLY",
        shortDescription: "Doomed",
        venueId: 22,
      },
      method: "POST",
      url: "/spaces",
    });

    expect(response.status).toBe(500);
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.pricingTierCreateMany).toHaveBeenCalledTimes(1);
    // The whole point of the fix: no event for a transaction that failed.
    expect(mocks.producerSend).not.toHaveBeenCalled();
  });
});
