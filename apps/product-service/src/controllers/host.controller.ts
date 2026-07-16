import { Request, Response } from "express";
import { Prisma } from "@repo/db";
import { prisma } from "@repo/db";

type HostOrderBy = Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
type HostSortKey = "featured" | "mostVenues" | "newest";

// AUDIT-B4-LOW: "mostVenues" is intentionally absent here — a relation _count in
// orderBy cannot be filtered, so it would rank on ALL venues (incl. soft-deleted)
// and contradict the isActive-filtered venueCount we display. It is ranked via an
// active-only groupBy in fetchHostRows instead. Remaining sorts stay declarative.
const HOST_SORT_ORDER_BY: Record<Exclude<HostSortKey, "mostVenues">, HostOrderBy> = {
  featured: [
    { hostSponsored: "desc" },
    { hostRecommended: "desc" },
    // Verified BADGE tier (enum UNVERIFIED < VERIFIED, so `desc` = VERIFIED
    // first). This is the public badge status, not the `hostVerified` auth flag.
    { hostVerificationStatus: "desc" },
    { hostingSince: "asc" },
  ],
  newest: { hostingSince: "desc" },
};

const parseSort = (raw: unknown): HostSortKey =>
  raw === "mostVenues" || raw === "newest" ? raw : "featured";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const parsePagination = (query: Request["query"]) => {
  const page = Math.max(parseInt(String(query.page ?? "1"), 10) || 1, 1);
  const requestedLimit = parseInt(String(query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
};

interface HostVenueRow {
  city: string;
  images: unknown;
  _count: { spaces: number };
}

interface HostRow {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio: string | null;
  hostingSince: Date | null;
  hostVerificationStatus: "UNVERIFIED" | "VERIFIED";
  hostRecommended: boolean;
  hostSponsored: boolean;
  venues: HostVenueRow[];
}

const parseImageList = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.filter((url): url is string => typeof url === "string" && url.length > 0);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((url): url is string => typeof url === "string" && url.length > 0)
        : [];
    } catch {
      return [];
    }
  }
  return [];
};

const firstVenueImage = (venues: { images: unknown }[]): string | null => {
  for (const venue of venues) {
    const [first] = parseImageList(venue.images);
    if (first) return first;
  }
  return null;
};

const toHostSummary = (host: HostRow) => {
  const cities = Array.from(
    new Set(host.venues.map((venue) => venue.city).filter(Boolean))
  );
  const venueCount = host.venues.length;
  const spaceCount = host.venues.reduce(
    (sum, venue) => sum + (venue._count?.spaces ?? 0),
    0
  );
  return {
    id: host.id,
    name: host.name,
    username: host.username,
    image: host.image,
    coverImage: firstVenueImage(host.venues),
    bio: host.bio,
    hostingSince: host.hostingSince ? host.hostingSince.toISOString() : null,
    hostVerificationStatus: host.hostVerificationStatus,
    hostRecommended: host.hostRecommended,
    hostSponsored: host.hostSponsored,
    venueCount,
    spaceCount,
    cities,
  };
};

// AUDIT-B4-LOW: fetch a page of host rows honouring the requested sort. For
// "mostVenues" we cannot orderBy a filtered relation _count, so we rank host ids
// by their active-only venue count via a groupBy (scoped to the same host filter),
// then hydrate + re-order those ids so the ranking matches the venueCount we render.
const fetchHostRows = async (
  where: Prisma.UserWhereInput,
  sort: HostSortKey,
  city: string | undefined,
  skip: number,
  limit: number
): Promise<HostRow[]> => {
  const select: Prisma.UserSelect = {
    id: true,
    name: true,
    username: true,
    image: true,
    bio: true,
    hostingSince: true,
    hostVerificationStatus: true,
    hostRecommended: true,
    hostSponsored: true,
    venues: {
      where: { isActive: true, ...(city ? { city } : {}) },
      orderBy: { createdAt: "asc" },
      select: {
        city: true,
        images: true,
        _count: { select: { spaces: { where: { isActive: true } } } },
      },
    },
  };

  if (sort === "mostVenues") {
    const ranked = await prisma.venue.groupBy({
      by: ["hostId"],
      where: { isActive: true, ...(city ? { city } : {}), host: where },
      _count: { _all: true },
      orderBy: { _count: { hostId: "desc" } },
      skip,
      take: limit,
    });
    const orderedIds = ranked
      .map((row) => row.hostId)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
    if (orderedIds.length === 0) return [];

    // The shared `select` is typed as the widened Prisma.UserSelect, so the
    // client returns a loosened row type; narrow back to the precise HostRow
    // shape the select actually produces (venues incl. _count).
    const unordered = (await prisma.user.findMany({
      where: { id: { in: orderedIds } },
      select,
    })) as unknown as HostRow[];
    const byId = new Map(unordered.map((host) => [host.id, host]));
    return orderedIds
      .map((id) => byId.get(id))
      .filter((host): host is HostRow => host != null);
  }

  const rows = await prisma.user.findMany({
    where,
    orderBy: HOST_SORT_ORDER_BY[sort],
    skip,
    take: limit,
    select,
  });
  return rows as unknown as HostRow[];
};

export const getHosts = async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const city = typeof req.query.city === "string" && req.query.city.length > 0
    ? req.query.city
    : undefined;
  const verifiedOnly = req.query.verified === "true";
  const searchRaw = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const search = searchRaw.length > 0 ? searchRaw : undefined;
  const sort = parseSort(req.query.sort);

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    venues: {
      some: {
        isActive: true,
        ...(city ? { city } : {}),
      },
    },
    ...(verifiedOnly ? { hostVerificationStatus: "VERIFIED" } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total, cityRows] = await Promise.all([
    fetchHostRows(where, sort, city, skip, limit),
    prisma.user.count({ where }),
    prisma.venue.findMany({
      // AUDIT-B4-LOW: match the getVenuesList facet — exclude venues whose host is
      // soft-deleted so a deleted host's city can't surface in the public dropdown
      // while returning zero hosts.
      where: { isActive: true, host: { deletedAt: null } },
      distinct: ["city"],
      select: { city: true },
      orderBy: { city: "asc" },
    }),
  ]);

  const availableCities = cityRows
    .map((v) => v.city)
    .filter((c): c is string => typeof c === "string" && c.length > 0);

  res.status(200).json({
    hosts: (rows as HostRow[]).map(toHostSummary),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
    availableCities,
  });
};

export const getHost = async (req: Request, res: Response) => {
  const hostId = req.params.id;
  if (!hostId) return res.status(400).json({ message: "Invalid host id" });

  const host = await prisma.user.findFirst({
    where: { id: hostId, deletedAt: null },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      hostingSince: true,
      hostVerificationStatus: true,
      hostRecommended: true,
      hostSponsored: true,
      venues: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          shortDescription: true,
          city: true,
          country: true,
          images: true,
          isActive: true,
          venueVerificationStatus: true,
          venueRecommended: true,
          venueSponsored: true,
          spaces: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              spaceType: true,
              capacity: true,
              pricePerHour: true,
              pricePerDay: true,
              pricingType: true,
              currency: true,
              images: true,
              isActive: true,
              // city/country live on the parent Venue (DB-010), not on Space, so
              // they can't be selected here — they're mapped on from the venue below.
              instantBook: true,
            },
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { spaces: { where: { isActive: true } } } },
        },
      },
    },
  });

  if (!host || host.venues.length === 0) {
    return res.status(404).json({ message: "Host not found" });
  }

  const cities = Array.from(
    new Set(host.venues.map((v) => v.city).filter(Boolean))
  );
  const venueCount = host.venues.length;
  const spaceCount = host.venues.reduce(
    (sum, venue) => sum + (venue._count?.spaces ?? 0),
    0
  );

  // AUD-B6: VenueSpaceSummary.city/country are required in @repo/types and the
  // client SpaceCard renders `{space.city}, {space.country}`, but those columns
  // live on the parent Venue (DB-010), not on Space — so each nested space came
  // back without them and the card printed a bare ", ". Copy each venue's
  // city/country onto its spaces; the response shape is otherwise unchanged.
  const venues = host.venues.map((venue) => ({
    ...venue,
    spaces: venue.spaces.map((space) => ({
      ...space,
      city: venue.city,
      country: venue.country,
    })),
  }));

  res.status(200).json({
    id: host.id,
    name: host.name,
    username: host.username,
    image: host.image,
    coverImage: firstVenueImage(host.venues),
    bio: host.bio,
    hostingSince: host.hostingSince ? host.hostingSince.toISOString() : null,
    hostVerificationStatus: host.hostVerificationStatus,
    hostRecommended: host.hostRecommended,
    hostSponsored: host.hostSponsored,
    venueCount,
    spaceCount,
    cities,
    venues,
  });
};

export const updateHostListingBadges = async (req: Request, res: Response) => {
  const hostId = req.params.id;
  if (!hostId) return res.status(400).json({ message: "Invalid host id" });

  const { hostVerified, hostRecommended, hostSponsored } = req.body ?? {};
  // The `hostVerified` request field toggles the public "Verified" BADGE. Accept
  // a boolean (true -> VERIFIED, false -> UNVERIFIED) or the status string
  // directly; either way it maps to the `hostVerificationStatus` badge column.
  // It must NOT touch the `hostVerified` AUTHORIZATION column (which gates a
  // host's listing access via auth-middleware/JWT) — those stay independent.
  const resolveVerificationStatus = (
    value: unknown
  ): "VERIFIED" | "UNVERIFIED" | null => {
    if (typeof value === "boolean") return value ? "VERIFIED" : "UNVERIFIED";
    if (value === "VERIFIED" || value === "UNVERIFIED") return value;
    return null;
  };
  const hostVerificationStatus = resolveVerificationStatus(hostVerified);
  if (
    hostVerificationStatus === null ||
    typeof hostRecommended !== "boolean" ||
    typeof hostSponsored !== "boolean"
  ) {
    return res.status(400).json({
      message: "hostVerified, hostRecommended, and hostSponsored must be booleans",
    });
  }

  const existing = await prisma.user.findFirst({
    where: { id: hostId, deletedAt: null },
    select: { id: true, role: true },
  });
  if (!existing) {
    return res.status(404).json({ message: "Host not found" });
  }
  if (existing.role !== "HOST" && existing.role !== "ADMIN") {
    return res.status(400).json({
      message: "Listing badges only apply to HOST or ADMIN accounts",
    });
  }

  const user = await prisma.user.update({
    where: { id: hostId },
    data: {
      // Badge status only — the `hostVerified` auth flag is intentionally left
      // untouched here.
      hostVerificationStatus,
      hostRecommended,
      hostSponsored,
    },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      hostVerificationStatus: true,
      hostRecommended: true,
      hostSponsored: true,
    },
  });

  return res.status(200).json(user);
};
