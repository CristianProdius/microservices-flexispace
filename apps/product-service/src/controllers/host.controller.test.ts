import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getHost, getHosts, updateHostListingBadges } from "./host.controller.js";

const mocks = vi.hoisted(() => {
  const prisma = {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    venue: {
      findMany: vi.fn(),
    },
  };
  return {
    prisma,
    userFindMany: prisma.user.findMany,
    userCount: prisma.user.count,
    userFindFirst: prisma.user.findFirst,
    userUpdate: prisma.user.update,
    venueFindMany: prisma.venue.findMany,
  };
});

vi.mock("@repo/db", () => ({
  prisma: mocks.prisma,
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

const defaultMocks = () => {
  mocks.userFindMany.mockResolvedValue([]);
  mocks.userCount.mockResolvedValue(0);
  mocks.venueFindMany.mockResolvedValue([]);
};

describe("host controller", () => {
  afterEach(() => vi.resetAllMocks());

  it("lists only users that have at least one active venue", async () => {
    mocks.userFindMany.mockResolvedValue([
      {
        id: "u1",
        name: "Alice",
        username: "alice",
        image: null,
        bio: "Bio",
        hostingSince: new Date("2024-01-01"),
        hostVerified: true,
        hostRecommended: true,
        hostSponsored: false,
        venues: [
          { city: "Chisinau", _count: { spaces: 3 } },
          { city: "Chisinau", _count: { spaces: 0 } },
        ],
      },
    ]);
    mocks.userCount.mockResolvedValue(1);
    mocks.venueFindMany.mockResolvedValue([
      { city: "Chisinau" },
      { city: "Bucharest" },
    ]);
    const req = { query: {} } as unknown as Request;
    const res = createResponse();

    await getHosts(req, res);

    expect(mocks.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          venues: { some: { isActive: true } },
        }),
        orderBy: [
          { hostSponsored: "desc" },
          { hostRecommended: "desc" },
          { hostVerified: "desc" },
          { hostingSince: "asc" },
        ],
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0]![0];
    expect(payload.hosts).toHaveLength(1);
    expect(payload.hosts[0]).toMatchObject({
      id: "u1",
      venueCount: 2,
      spaceCount: 3,
      cities: ["Chisinau"],
      hostRecommended: true,
      hostSponsored: false,
    });
    expect(payload.pagination).toMatchObject({ page: 1, total: 1 });
    expect(payload.availableCities).toEqual(["Chisinau", "Bucharest"]);
  });

  it("applies verified, search, and sort filters", async () => {
    defaultMocks();
    const req = {
      query: { verified: "true", search: "iHUB", sort: "mostVenues", city: "Chisinau" },
    } as unknown as Request;
    const res = createResponse();

    await getHosts(req, res);

    const call = mocks.userFindMany.mock.calls[0]![0];
    expect(call.where).toMatchObject({
      deletedAt: null,
      venues: { some: { isActive: true, city: "Chisinau" } },
      hostVerified: true,
      OR: [
        { name: { contains: "iHUB", mode: "insensitive" } },
        { username: { contains: "iHUB", mode: "insensitive" } },
      ],
    });
    expect(call.orderBy).toEqual({ venues: { _count: "desc" } });
  });

  it("returns listing badge flags for hosts", async () => {
    mocks.userFindMany.mockResolvedValue([
      {
        id: "u2",
        name: "Bob",
        username: "bob",
        image: null,
        bio: null,
        hostingSince: null,
        hostVerified: true,
        hostRecommended: false,
        hostSponsored: true,
        venues: [{ city: "Bucharest", images: [], _count: { spaces: 1 } }],
      },
    ]);
    mocks.userCount.mockResolvedValue(1);
    mocks.venueFindMany.mockResolvedValue([]);
    const req = { query: {} } as unknown as Request;
    const res = createResponse();

    await getHosts(req, res);

    expect(mocks.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          hostVerified: true,
          hostRecommended: true,
          hostSponsored: true,
        }),
      })
    );
    const payload = res.json.mock.calls[0]![0];
    expect(payload.hosts[0]).toMatchObject({
      hostVerified: true,
      hostRecommended: false,
      hostSponsored: true,
    });
  });

  it("maps sort=newest to hostingSince desc", async () => {
    defaultMocks();
    const req = { query: { sort: "newest" } } as unknown as Request;
    const res = createResponse();

    await getHosts(req, res);

    const call = mocks.userFindMany.mock.calls[0]![0];
    expect(call.orderBy).toEqual({ hostingSince: "desc" });
  });

  it("availableCities query is not affected by ?city filter", async () => {
    defaultMocks();
    const req = { query: { city: "Chisinau" } } as unknown as Request;
    const res = createResponse();

    await getHosts(req, res);

    expect(mocks.venueFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
        distinct: ["city"],
      })
    );
  });

  it("returns 404 when host not found or has no active venues", async () => {
    mocks.userFindFirst.mockResolvedValue(null);
    const req = { params: { id: "missing" } } as unknown as Request;
    const res = createResponse();

    await getHost(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns host with venues and active space lists", async () => {
    mocks.userFindFirst.mockResolvedValue({
      id: "u1",
      name: "Alice",
      username: "alice",
      image: null,
        bio: "Bio",
        hostingSince: new Date("2024-01-01"),
        hostVerified: true,
        hostRecommended: true,
        hostSponsored: false,
        venues: [
          {
            id: 1,
            name: "Hub",
            city: "Chisinau",
          country: "Moldova",
          images: ["/v.jpg"],
          isActive: true,
          spaces: [{ id: 10, name: "Room A", isActive: true }],
          _count: { spaces: 1 },
        },
      ],
    });
    const req = { params: { id: "u1" } } as unknown as Request;
    const res = createResponse();

    await getHost(req, res);

    expect(mocks.userFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1", deletedAt: null },
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0]![0];
    expect(payload.id).toBe("u1");
    expect(payload.hostRecommended).toBe(true);
    expect(payload.hostSponsored).toBe(false);
    expect(payload.venues).toHaveLength(1);
    expect(payload.venues[0].spaces[0].id).toBe(10);
  });

  it("updates host listing badges for HOST and ADMIN accounts", async () => {
    mocks.userFindFirst.mockResolvedValueOnce({ id: "u1", role: "HOST" });
    mocks.userUpdate.mockResolvedValueOnce({
      id: "u1",
      role: "HOST",
      hostVerified: true,
      hostRecommended: true,
      hostSponsored: false,
    });
    const req = {
      params: { id: "u1" },
      body: {
        hostVerified: true,
        hostRecommended: true,
        hostSponsored: false,
      },
    } as unknown as Request;
    const res = createResponse();

    await updateHostListingBadges(req, res);

    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: {
        hostVerified: true,
        hostRecommended: true,
        hostSponsored: false,
      },
      select: expect.objectContaining({
        hostVerified: true,
        hostRecommended: true,
        hostSponsored: true,
      }),
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        hostVerified: true,
        hostRecommended: true,
        hostSponsored: false,
      })
    );
  });

  it("rejects host listing badge payloads with non-boolean values", async () => {
    const req = {
      params: { id: "u1" },
      body: { hostSponsored: "true" },
    } as unknown as Request;
    const res = createResponse();

    await updateHostListingBadges(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "hostVerified, hostRecommended, and hostSponsored must be booleans",
    });
    expect(mocks.userFindFirst).not.toHaveBeenCalled();
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });
});
