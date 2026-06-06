import { Request, Response } from "express";
import { prisma } from "@repo/db";
import { producer } from "../utils/kafka.js";
import { resolveTranslations, VENUE_TRANSLATION_FIELDS } from "../lib/translations.js";
import { parsePositiveIntegerWithDefault } from "../lib/validation.js";

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

  const venues = await prisma.venue.findMany({
    where: { hostId },
    include: { _count: { select: { spaces: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  });
  res.status(200).json(venues);
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
  const hostId = req.userId!;
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
  } = req.body;
  if (!name || !address || !city || !country) {
    return res
      .status(400)
      .json({ message: "Name, address, city, and country are required" });
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
  } = req.body;
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
  };

  // Cascade location changes to all spaces under this venue
  const locationFields = { address, city, state, country, postalCode, latitude, longitude };
  const locationUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(locationFields)) {
    if (value !== undefined) locationUpdates[key] = value;
  }

  if (Object.keys(locationUpdates).length > 0) {
    await prisma.$transaction([
      prisma.venue.update({ where: { id: venueId }, data: venueData }),
      prisma.space.updateMany({ where: { venueId }, data: locationUpdates }),
    ]);
  } else {
    await prisma.venue.update({ where: { id: venueId }, data: venueData });
  }

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
