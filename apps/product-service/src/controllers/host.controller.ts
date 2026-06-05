import { Request, Response } from "express";
import { Prisma } from "@repo/db";
import { prisma } from "@repo/db";

type HostOrderBy = Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
type HostSortKey = "featured" | "mostVenues" | "newest";

const HOST_SORT_ORDER_BY: Record<HostSortKey, HostOrderBy> = {
  featured: [{ hostVerified: "desc" }, { hostingSince: "asc" }],
  mostVenues: { venues: { _count: "desc" } },
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
  hostVerified: boolean;
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
    hostVerified: host.hostVerified,
    venueCount,
    spaceCount,
    cities,
  };
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
    ...(verifiedOnly ? { hostVerified: true } : {}),
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
    prisma.user.findMany({
      where,
      orderBy: HOST_SORT_ORDER_BY[sort],
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        hostingSince: true,
        hostVerified: true,
        venues: {
          where: { isActive: true, ...(city ? { city } : {}) },
          orderBy: { createdAt: "asc" },
          select: {
            city: true,
            images: true,
            _count: { select: { spaces: { where: { isActive: true } } } },
          },
        },
      },
    }),
    prisma.user.count({ where }),
    prisma.venue.findMany({
      where: { isActive: true },
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
      hostVerified: true,
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
              city: true,
              country: true,
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

  res.status(200).json({
    id: host.id,
    name: host.name,
    username: host.username,
    image: host.image,
    coverImage: firstVenueImage(host.venues),
    bio: host.bio,
    hostingSince: host.hostingSince ? host.hostingSince.toISOString() : null,
    hostVerified: host.hostVerified,
    venueCount,
    spaceCount,
    cities,
    venues: host.venues,
  });
};
