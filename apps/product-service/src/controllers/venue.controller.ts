import { Request, Response } from "express";
import { Currency, Prisma, prisma } from "@repo/db";
import { producer } from "../utils/kafka.js";
import { resolveTranslations, VENUE_TRANSLATION_FIELDS } from "../lib/translations.js";
import {
  isValidYouTubeUrl,
  parsePositiveIntegerWithDefault,
} from "../lib/validation.js";
import { lookupActiveUser } from "@repo/auth-middleware";

// PRODSVC-021: valid Currency enum members, mirroring the space controller's
// `CURRENCIES` set. Used to reject unknown currency codes (e.g. "XXX") with a
// 400 before they hit Prisma as an invalid enum value.
const CURRENCIES = new Set<Currency>(Object.values(Currency));

// PRODSVC-021: type/range-validate the scalar venue inputs that are written
// straight to Prisma (latitude/longitude Float?, currency enum, videoUrl). An
// untyped `latitude: "abc"` or `currency: "XXX"` otherwise flows into
// `prisma.venue.{create,update}` and throws PrismaClientValidationError ->
// unhandled 500 where a 400 is intended. Mirrors the bodyHostId type-guard in
// createVenue. `null`/`undefined` mean "not provided" and are left to the
// existing optional-field handling. Returns an error message string on the
// first invalid field, or null when everything checks out.
const validateVenueScalarInputs = (input: {
  latitude?: unknown;
  longitude?: unknown;
  currency?: unknown;
  videoUrl?: unknown;
}): string | null => {
  const { latitude, longitude, currency, videoUrl } = input;
  if (
    latitude !== undefined &&
    latitude !== null &&
    (typeof latitude !== "number" ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90)
  ) {
    return "latitude must be a number between -90 and 90";
  }
  if (
    longitude !== undefined &&
    longitude !== null &&
    (typeof longitude !== "number" ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180)
  ) {
    return "longitude must be a number between -180 and 180";
  }
  if (
    currency !== undefined &&
    currency !== null &&
    !(typeof currency === "string" && CURRENCIES.has(currency as Currency))
  ) {
    return "Invalid currency";
  }
  // PRODSVC-010 parity with space.videoUrl: URL-parser + host allowlist. The
  // helper treats null/undefined/"" as valid so optional videoUrl short-circuits.
  if (!isValidYouTubeUrl(videoUrl)) {
    return "videoUrl must be a valid YouTube URL";
  }
  return null;
};

// PRODSVC-012: cap host-scoped lists so a host with thousands of venues can't
// blow up memory/CPU or generate huge payloads. Allow client-provided paging.
const VENUE_LIST_DEFAULT_LIMIT = 50;
const VENUE_LIST_MAX_LIMIT = 200;

export const getMyVenues = async (req: Request, res: Response) => {
  const hostId = req.userId!;

  const limit = parsePositiveIntegerWithDefault(
    req.query.limit,
    VENUE_LIST_DEFAULT_LIMIT,
    VENUE_LIST_MAX_LIMIT
  );
  if (limit === null) {
    return res.status(400).json({ message: "Invalid limit" });
  }
  const page = parsePositiveIntegerWithDefault(req.query.page, 1);
  if (page === null) {
    return res.status(400).json({ message: "Invalid page" });
  }

  // Hide soft-deleted venues (isActive: false). Without this filter, a host
  // who deletes a venue sees it bounce back into "My Venues" on the next
  // page load — `deleteVenue` only flips `isActive: false` to preserve
  // booking history, and the row still satisfies `where: { hostId }`. Same
  // soft-delete posture as the public listing and `flattenVenue()` reads.
  const venues = await prisma.venue.findMany({
    where: { hostId, isActive: true },
    include: { _count: { select: { spaces: { where: { isActive: true } } } } },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  });
  res.status(200).json(venues);
};

// Public venue listing for the customer-facing "Browse Venues" page (previously
// the page showed Hosts; product asked for one card per venue so customers go
// directly to /venues/{id} instead of detouring through /hosts/[slug]).
//
// Soft-delete + isActive filters mirror getVenue (AUD-006/PRODSVC-015) so a
// tombstoned host's venues or a hidden venue can't surface here either.
const VENUES_LIST_DEFAULT_LIMIT = 24;
const VENUES_LIST_MAX_LIMIT = 50;
// The shared `HostFilter` UI exposes `featured | mostVenues | newest`. On a
// per-venue listing "mostVenues" doesn't have a 1:1 host-equivalent (each row
// IS a venue) so we map it to the most useful adjacent signal: venues with
// the most active spaces first. This keeps the filter pill honest instead of
// silently falling back to `featured`.
type VenueListSort = "newest" | "featured" | "mostVenues";
const parseVenueListSort = (raw: unknown): VenueListSort => {
  if (raw === "newest" || raw === "mostVenues") return raw;
  return "featured";
};

export const getVenuesList = async (req: Request, res: Response) => {
  const page = parsePositiveIntegerWithDefault(req.query.page, 1);
  if (page === null) {
    return res.status(400).json({ message: "Invalid page" });
  }
  const limit = parsePositiveIntegerWithDefault(
    req.query.limit,
    VENUES_LIST_DEFAULT_LIMIT,
    VENUES_LIST_MAX_LIMIT
  );
  if (limit === null) {
    return res.status(400).json({ message: "Invalid limit" });
  }

  const city =
    typeof req.query.city === "string" && req.query.city.length > 0
      ? req.query.city
      : undefined;
  const verifiedOnly = req.query.verified === "true";
  const searchRaw = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const search = searchRaw.length > 0 ? searchRaw : undefined;
  const sort = parseVenueListSort(req.query.sort);

  // Featured = sponsored, recommended, then verified inventory first. Venue
  // badges are checked before host badges at each tier so admins can promote a
  // specific venue without lifting every venue from that host.
  const orderBy =
    sort === "featured"
      ? [
          { venueSponsored: "desc" as const },
          { host: { hostSponsored: "desc" as const } },
          { venueRecommended: "desc" as const },
          { host: { hostRecommended: "desc" as const } },
          { venueVerified: "desc" as const },
          { host: { hostVerified: "desc" as const } },
          { host: { hostingSince: "asc" as const } },
          { createdAt: "desc" as const },
        ]
      : sort === "mostVenues"
        ? [
            { spaces: { _count: "desc" as const } },
            { createdAt: "desc" as const },
          ]
        : [{ createdAt: "desc" as const }];

  const andFilters: Prisma.VenueWhereInput[] = [];
  if (verifiedOnly) {
    andFilters.push({
      OR: [
        { venueVerified: true },
        { host: { hostVerified: true } },
      ],
    });
  }
  if (search) {
    andFilters.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { host: { name: { contains: search, mode: "insensitive" } } },
        { host: { username: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  const where: Prisma.VenueWhereInput = {
    isActive: true,
    host: {
      deletedAt: null,
    },
    ...(city ? { city } : {}),
    ...(andFilters.length > 0 ? { AND: andFilters } : {}),
  };

  const [rows, total, cityRows] = await Promise.all([
    prisma.venue.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        shortDescription: true,
        city: true,
        country: true,
        images: true,
        venueVerified: true,
        venueRecommended: true,
        venueSponsored: true,
        host: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            hostingSince: true,
            hostVerified: true,
            hostRecommended: true,
            hostSponsored: true,
          },
        },
        _count: { select: { spaces: { where: { isActive: true } } } },
      },
    }),
    prisma.venue.count({ where }),
    prisma.venue.findMany({
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
    venues: rows.map((v) => ({
      id: v.id,
      name: v.name,
      shortDescription: v.shortDescription,
      city: v.city,
      country: v.country,
      images: Array.isArray(v.images) ? v.images : [],
      venueVerified: v.venueVerified,
      venueRecommended: v.venueRecommended,
      venueSponsored: v.venueSponsored,
      spaceCount: v._count.spaces,
      host: {
        id: v.host.id,
        name: v.host.name,
        username: v.host.username,
        image: v.host.image,
        hostingSince: v.host.hostingSince ? v.host.hostingSince.toISOString() : null,
        hostVerified: v.host.hostVerified,
        hostRecommended: v.host.hostRecommended,
        hostSponsored: v.host.hostSponsored,
      },
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
    availableCities,
  });
};

export const getVenue = async (req: Request, res: Response) => {
  const venueId = parseInt(req.params.id as string, 10);
  if (Number.isNaN(venueId)) return res.status(400).json({ message: "Invalid ID" });
  // AUD-006: this route is public; if the host was soft-deleted (deletedAt
  // not null) we must hide the venue rather than leak the (former) host's
  // name/bio/image. Use findFirst with a relation filter so the row never
  // returns if the host is tombstoned. Return the same 404 message in both
  // cases so we don't expose host deletion as a side channel.
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, host: { deletedAt: null } },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          hostingSince: true,
          hostVerified: true,
          hostRecommended: true,
          hostSponsored: true,
        },
      },
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
          // city/country live on the parent Venue (DB-010) and are already in the response.
          instantBook: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  // PRODSVC-015: this route is public; a soft-deleted (isActive=false) venue
  // should be hidden so its name/address/lat-long/host PII don't leak via a
  // direct link or cached URL.
  if (!venue || !venue.isActive) {
    return res.status(404).json({ message: "Venue not found" });
  }

  const lang = req.query.lang as string | undefined;
  res.status(200).json(resolveTranslations(venue, lang, VENUE_TRANSLATION_FIELDS));
};

export const createVenue = async (req: Request, res: Response) => {
  const {
    name,
    shortDescription,
    description,
    nameTranslations,
    shortDescTranslations,
    descriptionTranslations,
    images,
    videoUrl,
    address,
    city,
    state,
    country,
    postalCode,
    latitude,
    longitude,
    currency,
    workingHours,
    hostId: bodyHostId,
  } = req.body;
  // Default owner is the (possibly impersonated) caller. An ADMIN may instead
  // assign the venue to an explicit host via body.hostId — validated against the
  // same active-user cache resolveActingHost uses. body.hostId wins over the
  // X-Acting-Host-Id header when both are present. Non-admins' body.hostId is
  // ignored.
  let hostId = req.userId!;
  if (bodyHostId !== undefined && req.user?.role === "ADMIN") {
    // Type-validate before hitting Prisma: a non-string (object/array) flows
    // into `prisma.user.findFirst` as a malformed `where` and throws
    // PrismaClientValidationError -> unhandled 500. Reject it as the intended
    // 400 "Invalid host" instead.
    if (typeof bodyHostId !== "string" || bodyHostId.length === 0) {
      return res.status(400).json({ message: "Invalid host" });
    }
    const target = await lookupActiveUser(bodyHostId);
    if (!target || (target.role !== "HOST" && target.role !== "ADMIN")) {
      return res.status(400).json({ message: "Invalid host" });
    }
    hostId = target.id;
  }
  if (!name || !address || !city || !country) {
    return res
      .status(400)
      .json({ message: "Name, address, city, and country are required" });
  }
  // PRODSVC-021: validate geo/currency/video scalars before the Prisma write so
  // malformed inputs return 400 instead of a Prisma 500.
  const scalarError = validateVenueScalarInputs({
    latitude,
    longitude,
    currency,
    videoUrl,
  });
  if (scalarError) {
    return res.status(400).json({ message: scalarError });
  }
  const venue = await prisma.venue.create({
    data: {
      name,
      shortDescription: shortDescription || "",
      description: description || "",
      nameTranslations: nameTranslations ?? undefined,
      shortDescTranslations: shortDescTranslations ?? undefined,
      descriptionTranslations: descriptionTranslations ?? undefined,
      images: images || [],
      videoUrl: videoUrl || null,
      address,
      city,
      state: state || null,
      country,
      postalCode: postalCode || null,
      latitude: latitude || null,
      longitude: longitude || null,
      currency: currency || undefined,
      workingHours: workingHours ?? undefined,
      hostId,
    },
  });
  // TODO(KAFKA-001 follow-up): transactional outbox so downstream search
  // indexers are guaranteed to see the new venue. For now: log + continue —
  // the venue row is already committed and failing the response would lead
  // hosts to retry and create duplicates.
  try {
    await producer.send("venue.created", { value: { id: venue.id, hostId } });
  } catch (err) {
    console.error(
      "Failed to publish venue.created event for venue",
      venue.id,
      "- venue persisted but search/cache will be stale until reconciled:",
      err instanceof Error ? err.message : err
    );
  }
  res.status(201).json(venue);
};

export const updateVenue = async (req: Request, res: Response) => {
  const venueId = parseInt(req.params.id as string, 10);
  if (Number.isNaN(venueId)) return res.status(400).json({ message: "Invalid ID" });
  const userId = req.userId!;
  const userRole = req.user?.role;
  // When admin is acting as a specific host (actingHostId set), they must own
  // the resource AS that host — the blanket ADMIN override is suspended.
  const adminOverride = userRole === "ADMIN" && req.actingHostId === undefined;
  const existing = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!existing) return res.status(404).json({ message: "Venue not found" });
  if (existing.hostId !== userId && !adminOverride) {
    return res
      .status(403)
      .json({ message: "Not authorized to update this venue" });
  }
  const {
    name,
    shortDescription,
    description,
    nameTranslations,
    shortDescTranslations,
    descriptionTranslations,
    images,
    videoUrl,
    address,
    city,
    state,
    country,
    postalCode,
    latitude,
    longitude,
    currency,
    isActive,
    workingHours,
    venueVerified,
    venueRecommended,
    venueSponsored,
  } = req.body;

  const hasVenueListingBadgePatch =
    venueVerified !== undefined ||
    venueRecommended !== undefined ||
    venueSponsored !== undefined;
  const canUpdateVenueListingBadges = userRole === "ADMIN";
  if (hasVenueListingBadgePatch && !canUpdateVenueListingBadges) {
    return res.status(403).json({
      message: "Only admins can update venue listing badges",
    });
  }
  if (
    hasVenueListingBadgePatch &&
    ((venueVerified !== undefined && typeof venueVerified !== "boolean") ||
      (venueRecommended !== undefined && typeof venueRecommended !== "boolean") ||
      (venueSponsored !== undefined && typeof venueSponsored !== "boolean"))
  ) {
    return res.status(400).json({
      message: "venueVerified, venueRecommended, and venueSponsored must be booleans",
    });
  }

  // PRODSVC-021: validate geo/currency/video scalars before the Prisma write so
  // malformed inputs return 400 instead of a Prisma 500.
  const scalarError = validateVenueScalarInputs({
    latitude,
    longitude,
    currency,
    videoUrl,
  });
  if (scalarError) {
    return res.status(400).json({ message: scalarError });
  }

  const venueData = {
    ...(name !== undefined && { name }),
    ...(shortDescription !== undefined && { shortDescription }),
    ...(description !== undefined && { description }),
    ...(nameTranslations !== undefined && { nameTranslations }),
    ...(shortDescTranslations !== undefined && { shortDescTranslations }),
    ...(descriptionTranslations !== undefined && { descriptionTranslations }),
    ...(images !== undefined && { images }),
    ...(videoUrl !== undefined && { videoUrl }),
    ...(address !== undefined && { address }),
    ...(city !== undefined && { city }),
    ...(state !== undefined && { state }),
    ...(country !== undefined && { country }),
    ...(postalCode !== undefined && { postalCode }),
    ...(latitude !== undefined && { latitude }),
    ...(longitude !== undefined && { longitude }),
    ...(currency !== undefined && { currency }),
    ...(isActive !== undefined && { isActive }),
    ...(workingHours !== undefined && { workingHours }),
    ...(canUpdateVenueListingBadges && venueVerified !== undefined && { venueVerified }),
    ...(canUpdateVenueListingBadges && venueRecommended !== undefined && { venueRecommended }),
    ...(canUpdateVenueListingBadges && venueSponsored !== undefined && { venueSponsored }),
  };

  // Location lives on the Venue model alone after DB-010 — `Space` no longer
  // has address/city/state/country/postalCode/latitude/longitude columns, so
  // the previous `prisma.space.updateMany` cascade now throws "Unknown
  // argument `address`" and 500s the venue update. The Venue row's own
  // location fields are already inside `venueData` above, so a single
  // update is all that's needed. flattenVenue() on the GET path is what
  // surfaces those fields to consumers that used to read them off Space.
  await prisma.venue.update({ where: { id: venueId }, data: venueData });

  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  // TODO(KAFKA-001 follow-up): transactional outbox.
  try {
    await producer.send("venue.updated", { value: { id: venueId } });
  } catch (err) {
    console.error(
      "Failed to publish venue.updated event for venue",
      venueId,
      "- DB updated but search/cache will be stale until reconciled:",
      err instanceof Error ? err.message : err
    );
  }
  res.status(200).json(venue);
};

export const deleteVenue = async (req: Request, res: Response) => {
  const venueId = parseInt(req.params.id as string, 10);
  if (Number.isNaN(venueId)) return res.status(400).json({ message: "Invalid ID" });
  const userId = req.userId!;
  const userRole = req.user?.role;
  const adminOverride = userRole === "ADMIN" && req.actingHostId === undefined;
  const existing = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!existing) return res.status(404).json({ message: "Venue not found" });
  if (existing.hostId !== userId && !adminOverride) {
    return res
      .status(403)
      .json({ message: "Not authorized to delete this venue" });
  }
  await prisma.$transaction([
    prisma.venue.update({
      where: { id: venueId },
      data: { isActive: false },
    }),
    prisma.space.updateMany({ where: { venueId }, data: { isActive: false } }),
  ]);
  // TODO(KAFKA-001 follow-up): transactional outbox.
  try {
    await producer.send("venue.deleted", { value: { id: venueId } });
  } catch (err) {
    console.error(
      "Failed to publish venue.deleted event for venue",
      venueId,
      "- soft-deleted in DB but search/cache will not reflect deletion until reconciled:",
      err instanceof Error ? err.message : err
    );
  }
  res.status(200).json({ message: "Venue deleted successfully" });
};

export const getVenueCountsByHost = async (_req: Request, res: Response) => {
  // AUD-020: exclude inactive (soft-deleted) venues and venues whose host is
  // soft-deleted so admin dashboards don't see ghost counts. The previous
  // unfiltered groupBy made it look like tombstoned hosts still owned active
  // inventory.
  const grouped = await prisma.venue.groupBy({
    by: ["hostId"],
    where: { isActive: true, host: { deletedAt: null } },
    _count: { _all: true },
  });
  const payload = grouped.map((row) => ({
    hostId: row.hostId,
    count: row._count._all,
  }));
  return res.status(200).json(payload);
};
