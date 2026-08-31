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
      groupBy: vi.fn(),
    },
  };
  return {
    prisma,
    userFindMany: prisma.user.findMany,
    userCount: prisma.user.count,
    userFindFirst: prisma.user.findFirst,
    userUpdate: prisma.user.update,
    venueFindMany: prisma.venue.findMany,
    venueGroupBy: prisma.venue.groupBy,
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
  mocks.venueGroupBy.mockResolvedValue([]);
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
        hostVerificationStatus: "VERIFIED",
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
          { hostVerificationStatus: "desc" },
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

  it("applies verified and search filters to the host query", async () => {
    defaultMocks();
    const req = {
      query: { verified: "true", search: "iHUB", city: "Chisinau" },
    } as unknown as Request;
    const res = createResponse();

    await getHosts(req, res);

    const call = mocks.userFindMany.mock.calls[0]![0];
    expect(call.where).toMatchObject({
      deletedAt: null,
      venues: { some: { isActive: true, city: "Chisinau" } },
      hostVerificationStatus: "VERIFIED",
      OR: [
        { name: { contains: "iHUB", mode: "insensitive" } },
        { username: { contains: "iHUB", mode: "insensitive" } },
      ],
    });
  });

  it("ranks sort=mostVenues by active-only venue counts, not the raw relation _count", async () => {
    // groupBy returns ids already ranked by active venue count (u2 before u1)
    mocks.venueGroupBy.mockResolvedValue([
      { hostId: "u2", _count: { _all: 5 } },
      { hostId: "u1", _count: { _all: 2 } },
    ]);
    // findMany(id in) returns them in arbitrary order; controller must re-order
    mocks.userFindMany.mockResolvedValue([
      {
        id: "u1",
        name: "Alice",
        username: "alice",
        image: null,
        bio: null,
        hostingSince: null,
        hostVerificationStatus: "VERIFIED",
        hostRecommended: false,
        hostSponsored: false,
        venues: [],
      },
      {
        id: "u2",
        name: "Bob",
        username: "bob",
        image: null,
        bio: null,
        hostingSince: null,
        hostVerificationStatus: "VERIFIED",
        hostRecommended: false,
        hostSponsored: false,
        venues: [],
      },
    ]);
    mocks.userCount.mockResolvedValue(2);
    mocks.venueFindMany.mockResolvedValue([]);
    const req = {
      query: { verified: "true", sort: "mostVenues", city: "Chisinau" },
    } as unknown as Request;
    const res = createResponse();

    await getHosts(req, res);

    // ranking is computed over active venues, scoped to the same host filter
    const groupCall = mocks.venueGroupBy.mock.calls[0]![0];
    expect(groupCall).toMatchObject({
      by: ["hostId"],
      where: {
        isActive: true,
        city: "Chisinau",
        host: expect.objectContaining({ deletedAt: null, hostVerificationStatus: "VERIFIED" }),
      },
      orderBy: { _count: { hostId: "desc" } },
    });
    // hosts are hydrated by the ranked ids, never via an unfiltered relation _count
    const userCall = mocks.userFindMany.mock.calls[0]![0];
    expect(userCall.where).toEqual({ id: { in: ["u2", "u1"] } });
    expect(userCall.orderBy).toBeUndefined();

    const payload = res.json.mock.calls[0]![0];
    expect(payload.hosts.map((h: { id: string }) => h.id)).toEqual(["u2", "u1"]);
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
        hostVerificationStatus: "VERIFIED",
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
          hostVerificationStatus: true,
          hostRecommended: true,
          hostSponsored: true,
        }),
      })
    );
    const payload = res.json.mock.calls[0]![0];
    expect(payload.hosts[0]).toMatchObject({
      hostVerificationStatus: "VERIFIED",
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

  it("availableCities facet ignores ?city and excludes soft-deleted hosts", async () => {
    defaultMocks();
    const req = { query: { city: "Chisinau" } } as unknown as Request;
    const res = createResponse();

    await getHosts(req, res);

    // not scoped by ?city, and (like getVenuesList) skips soft-deleted hosts so a
    // deleted host's city can't appear in the dropdown yet return zero hosts
    expect(mocks.venueFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, host: { deletedAt: null } },
        distinct: ["city"],
      })
    );
  });

  it("returns 404 when host not found or has no active venues", async () => {
    mocks.userFindFirst.mockResolvedValue(null);
    const req = { params: { id: "missing" } } as unknown as Request;
    const res = createResponse();

    await getHost(req, res);

    expect(mocks.userFindFirst).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { id: "missing", deletedAt: null } })
    );
    expect(mocks.userFindFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { username: "missing", deletedAt: null } })
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("resolves a host by username when id does not match", async () => {
    mocks.userFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "u1",
        name: "Alice",
        username: "alice",
        image: null,
        bio: "Bio",
        hostingSince: new Date("2024-01-01"),
        hostVerificationStatus: "VERIFIED",
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
    const req = { params: { id: "alice" } } as unknown as Request;
    const res = createResponse();

    await getHost(req, res);

    expect(mocks.userFindFirst).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { id: "alice", deletedAt: null } })
    );
    expect(mocks.userFindFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { username: "alice", deletedAt: null } })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0]![0];
    expect(payload).toMatchObject({ id: "u1", username: "alice" });
    expect(payload.venues).toHaveLength(1);
  });

  it("returns host with venues and active space lists", async () => {
    mocks.userFindFirst.mockResolvedValue({
      id: "u1",
      name: "Alice",
      username: "alice",
      image: null,
        bio: "Bio",
        hostingSince: new Date("2024-01-01"),
        hostVerificationStatus: "VERIFIED",
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
    // AUD-B6: VenueSpaceSummary.city/country are required in @repo/types and the
    // client SpaceCard renders `{space.city}, {space.country}`, but those columns
    // live on the parent Venue (DB-010), not on Space — so each nested space must
    // carry the parent venue's city/country or the card prints a bare ", ".
    expect(payload.venues[0].spaces[0]).toMatchObject({
      city: "Chisinau",
      country: "Moldova",
    });
  });

  it("updates host listing badges for HOST and ADMIN accounts", async () => {
    mocks.userFindFirst.mockResolvedValueOnce({ id: "u1", role: "HOST" });
    mocks.userUpdate.mockResolvedValueOnce({
      id: "u1",
      role: "HOST",
      hostVerificationStatus: "VERIFIED",
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

    // The `hostVerified` request field drives the public BADGE status; it must
    // set `hostVerificationStatus` and NEVER touch the `hostVerified`
    // AUTHORIZATION column (which gates host listing access).
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: {
        hostVerificationStatus: "VERIFIED",
        hostRecommended: true,
        hostSponsored: false,
      },
      select: expect.objectContaining({
        hostVerificationStatus: true,
        hostRecommended: true,
        hostSponsored: true,
      }),
    });
    const updateData = mocks.userUpdate.mock.calls[0]![0].data;
    expect(updateData).not.toHaveProperty("hostVerified");
    expect(mocks.userUpdate.mock.calls[0]![0].select).not.toHaveProperty(
      "hostVerified"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        hostVerificationStatus: "VERIFIED",
        hostRecommended: true,
        hostSponsored: false,
      })
    );
  });

  it("maps hostVerified:false to hostVerificationStatus UNVERIFIED", async () => {
    mocks.userFindFirst.mockResolvedValueOnce({ id: "u1", role: "HOST" });
    mocks.userUpdate.mockResolvedValueOnce({
      id: "u1",
      role: "HOST",
      hostVerificationStatus: "UNVERIFIED",
      hostRecommended: false,
      hostSponsored: false,
    });
    const req = {
      params: { id: "u1" },
      body: {
        hostVerified: false,
        hostRecommended: false,
        hostSponsored: false,
      },
    } as unknown as Request;
    const res = createResponse();

    await updateHostListingBadges(req, res);

    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hostVerificationStatus: "UNVERIFIED",
        }),
      })
    );
    const updateData = mocks.userUpdate.mock.calls[0]![0].data;
    expect(updateData).not.toHaveProperty("hostVerified");
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
