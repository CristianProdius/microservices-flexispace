import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createVenue,
  getMyVenues,
  getVenue,
  getVenueCountsByHost,
  updateVenue,
} from "./venue.controller.js";

const mocks = vi.hoisted(() => {
  const prisma = {
    $transaction: vi.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    space: {
      updateMany: vi.fn(),
    },
    venue: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
  };
  return {
    prisma,
    producerSend: vi.fn(),
    lookupActiveUser: vi.fn(),
    spaceUpdateMany: prisma.space.updateMany,
    venueCreate: prisma.venue.create,
    venueFindMany: prisma.venue.findMany,
    venueFindUnique: prisma.venue.findUnique,
    venueFindFirst: prisma.venue.findFirst,
    venueUpdate: prisma.venue.update,
    venueGroupBy: prisma.venue.groupBy,
  };
});

vi.mock("@repo/db", () => ({
  prisma: mocks.prisma,
}));

vi.mock("../utils/kafka.js", () => ({
  producer: {
    send: mocks.producerSend,
  },
}));

vi.mock("@repo/auth-middleware", () => ({
  lookupActiveUser: mocks.lookupActiveUser,
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

describe("venue controller contract", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("lets an ADMIN assign a venue to an explicit body.hostId", async () => {
    mocks.lookupActiveUser.mockResolvedValueOnce({ id: "host-9", role: "HOST" });
    mocks.venueCreate.mockResolvedValue({ id: 21, hostId: "host-9" });
    const req = {
      body: {
        name: "Venue",
        address: "Str. 1",
        city: "Chisinau",
        country: "Moldova",
        hostId: "host-9",
      },
      userId: "admin-1",
      user: { userId: "admin-1", email: "a@b.co", role: "ADMIN" },
    } as unknown as Request;
    const res = createResponse();

    await createVenue(req, res);

    expect(mocks.lookupActiveUser).toHaveBeenCalledWith("host-9");
    expect(mocks.venueCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ hostId: "host-9" }),
    });
    expect(mocks.producerSend).toHaveBeenCalledWith("venue.created", {
      value: { id: 21, hostId: "host-9" },
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("rejects body.hostId that is not an active HOST/ADMIN with 400 and no create", async () => {
    mocks.lookupActiveUser.mockResolvedValueOnce(null);
    const req = {
      body: {
        name: "Venue",
        address: "Str. 1",
        city: "Chisinau",
        country: "Moldova",
        hostId: "ghost",
      },
      userId: "admin-1",
      user: { userId: "admin-1", email: "a@b.co", role: "ADMIN" },
    } as unknown as Request;
    const res = createResponse();

    await createVenue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid host" });
    expect(mocks.venueCreate).not.toHaveBeenCalled();
  });

  it("rejects body.hostId resolving to a USER with 400", async () => {
    mocks.lookupActiveUser.mockResolvedValueOnce({ id: "u-1", role: "USER" });
    const req = {
      body: {
        name: "Venue",
        address: "Str. 1",
        city: "Chisinau",
        country: "Moldova",
        hostId: "u-1",
      },
      userId: "admin-1",
      user: { userId: "admin-1", email: "a@b.co", role: "ADMIN" },
    } as unknown as Request;
    const res = createResponse();

    await createVenue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.venueCreate).not.toHaveBeenCalled();
  });

  it("ignores body.hostId for a non-ADMIN caller and uses req.userId", async () => {
    mocks.venueCreate.mockResolvedValue({ id: 22, hostId: "host-1" });
    const req = {
      body: {
        name: "Venue",
        address: "Str. 1",
        city: "Chisinau",
        country: "Moldova",
        hostId: "someone-else",
      },
      userId: "host-1",
      user: { userId: "host-1", email: "h@b.co", role: "HOST", hostVerified: true },
    } as unknown as Request;
    const res = createResponse();

    await createVenue(req, res);

    expect(mocks.lookupActiveUser).not.toHaveBeenCalled();
    expect(mocks.venueCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ hostId: "host-1" }),
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("persists media, currency, and translations when creating venues", async () => {
    mocks.venueCreate.mockResolvedValue({ id: 12 });
    const req = {
      body: {
        address: "Main 1",
        city: "Chisinau",
        country: "Moldova",
        currency: "EUR",
        description: "Long description",
        descriptionTranslations: { ro: "Descriere" },
        images: ["/venue.jpg"],
        name: "Venue",
        nameTranslations: { ro: "Locatie" },
        shortDescTranslations: { ro: "Scurt" },
        shortDescription: "Short description",
        videoUrl: "https://youtu.be/demo",
      },
      userId: "host-1",
    } as unknown as Request;
    const res = createResponse();

    await createVenue(req, res);

    expect(mocks.venueCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        currency: "EUR",
        descriptionTranslations: { ro: "Descriere" },
        nameTranslations: { ro: "Locatie" },
        shortDescTranslations: { ro: "Scurt" },
        videoUrl: "https://youtu.be/demo",
      }),
    });
  });

  it("persists media, currency, and translations when updating venues", async () => {
    mocks.venueFindUnique
      .mockResolvedValueOnce({ hostId: "host-1", id: 12 })
      .mockResolvedValueOnce({ id: 12 });
    mocks.venueUpdate.mockResolvedValue({ id: 12 });
    const req = {
      body: {
        currency: "MDL",
        nameTranslations: { ru: "Ploshchadka" },
        videoUrl: "https://youtube.com/watch?v=demo",
      },
      params: { id: "12" },
      user: { role: "HOST" },
      userId: "host-1",
    } as unknown as Request;
    const res = createResponse();

    await updateVenue(req, res);

    expect(mocks.venueUpdate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        currency: "MDL",
        nameTranslations: { ru: "Ploshchadka" },
        videoUrl: "https://youtube.com/watch?v=demo",
      }),
      where: { id: 12 },
    });
  });

  it("persists workingHours when creating venues", async () => {
    mocks.venueCreate.mockResolvedValue({ id: 42 });
    const workingHours = {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: null,
      sunday: null,
    };
    const req = {
      body: {
        address: "Main 1",
        city: "Chisinau",
        country: "Moldova",
        name: "Venue",
        workingHours,
      },
      userId: "host-1",
    } as unknown as Request;
    const res = createResponse();

    await createVenue(req, res);

    expect(mocks.venueCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ workingHours }),
    });
  });

  it("applies workingHours on update when provided", async () => {
    mocks.venueFindUnique.mockResolvedValueOnce({ id: 7, hostId: "host-1" });
    mocks.venueFindUnique.mockResolvedValueOnce({ id: 7 });
    mocks.venueUpdate.mockResolvedValue({ id: 7 });
    const workingHours = {
      monday: { open: "10:00", close: "20:00" },
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null,
    };
    const req = {
      params: { id: "7" },
      body: { workingHours },
      userId: "host-1",
      user: { role: "HOST" },
    } as unknown as Request;
    const res = createResponse();

    await updateVenue(req, res);

    expect(mocks.venueUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: expect.objectContaining({ workingHours }),
    });
  });

  // Regression for the prod 500 reported on 2026-06-07: the old updateVenue
  // cascaded location fields onto `prisma.space.updateMany` even though
  // DB-010 had moved `address/city/state/country/postalCode/latitude/longitude`
  // off the Space model. Prisma then threw "Unknown argument `address`" and
  // every venue edit 500'd. The cascade is now dead — Space must NOT be
  // touched when only location fields change on the venue.
  it("does not cascade location fields onto Space.updateMany (POST-DB-010)", async () => {
    mocks.venueFindUnique
      .mockResolvedValueOnce({ id: 14, hostId: "host-1" })
      .mockResolvedValueOnce({ id: 14 });
    mocks.venueUpdate.mockResolvedValue({ id: 14 });
    const req = {
      params: { id: "14" },
      body: {
        address: "bd. Gagarin 10",
        city: "Chișinău",
        state: "Chișinău",
        country: "Moldova",
        postalCode: "MD-2001",
        latitude: 47.01880363372516,
        longitude: 28.87052792398627,
      },
      userId: "host-1",
      user: { role: "HOST" },
    } as unknown as Request;
    const res = createResponse();

    await updateVenue(req, res);

    expect(mocks.venueUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.spaceUpdateMany).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// Regression for the prod report: deleting "Sala de conferințe" twice and
// having it bounce back into the host's My Venues list each time. deleteVenue
// only flips `isActive: false` to preserve booking history, so getMyVenues
// must filter that out — otherwise the soft-deleted row stays visible and
// the delete button looks broken.
describe("getMyVenues hides soft-deleted venues", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("queries findMany with isActive:true and only counts active spaces", async () => {
    mocks.venueFindMany.mockResolvedValueOnce([]);
    const req = {
      query: {},
      userId: "local_community_business_center",
    } as unknown as Request;
    const res = createResponse();

    await getMyVenues(req, res);

    expect(mocks.venueFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hostId: "local_community_business_center", isActive: true },
        include: { _count: { select: { spaces: { where: { isActive: true } } } } },
      }),
    );
  });
});

describe("getVenue host PII filter (AUD-006)", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("queries findFirst with host.deletedAt:null relation filter", async () => {
    mocks.venueFindFirst.mockResolvedValueOnce({
      id: 5,
      isActive: true,
      name: "ok",
      host: { id: "host-1", name: "Host" },
      spaces: [],
    });
    const req = {
      params: { id: "5" },
      query: {},
    } as unknown as Request;
    const res = createResponse();

    await getVenue(req, res);

    expect(mocks.venueFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 5, host: { deletedAt: null } },
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns the same 404 message when the host has been soft-deleted", async () => {
    // findFirst returns null because the relation filter excludes the row.
    mocks.venueFindFirst.mockResolvedValueOnce(null);
    const req = {
      params: { id: "5" },
      query: {},
    } as unknown as Request;
    const res = createResponse();

    await getVenue(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Venue not found" });
  });
});

describe("getVenueCountsByHost filters (AUD-020)", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("excludes inactive venues and soft-deleted hosts", async () => {
    mocks.venueGroupBy.mockResolvedValueOnce([
      { hostId: "host-1", _count: { _all: 3 } },
    ]);
    const req = {} as unknown as Request;
    const res = createResponse();

    await getVenueCountsByHost(req, res);

    expect(mocks.venueGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, host: { deletedAt: null } },
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      { hostId: "host-1", count: 3 },
    ]);
  });
});
