import { Request, Response } from "express";
import { prisma } from "@repo/db";
import { producer } from "../utils/kafka.js";
import { resolveTranslations, VENUE_TRANSLATION_FIELDS } from "../lib/translations.js";

export const getMyVenues = async (req: Request, res: Response) => {
  const hostId = req.userId!;
  const venues = await prisma.venue.findMany({
    where: { hostId },
    include: { _count: { select: { spaces: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json(venues);
};

export const getVenue = async (req: Request, res: Response) => {
  const venueId = parseInt(req.params.id as string, 10);
  if (Number.isNaN(venueId)) return res.status(400).json({ message: "Invalid ID" });
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
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
  if (!venue) return res.status(404).json({ message: "Venue not found" });

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
  producer.send("venue.created", { value: { id: venue.id, hostId } });
  res.status(201).json(venue);
};

export const updateVenue = async (req: Request, res: Response) => {
  const venueId = parseInt(req.params.id as string, 10);
  if (Number.isNaN(venueId)) return res.status(400).json({ message: "Invalid ID" });
  const userId = req.userId!;
  const userRole = req.user?.role;
  const existing = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!existing) return res.status(404).json({ message: "Venue not found" });
  if (existing.hostId !== userId && userRole !== "ADMIN") {
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
  producer.send("venue.updated", { value: { id: venueId } });
  res.status(200).json(venue);
};

export const deleteVenue = async (req: Request, res: Response) => {
  const venueId = parseInt(req.params.id as string, 10);
  if (Number.isNaN(venueId)) return res.status(400).json({ message: "Invalid ID" });
  const userId = req.userId!;
  const userRole = req.user?.role;
  const existing = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!existing) return res.status(404).json({ message: "Venue not found" });
  if (existing.hostId !== userId && userRole !== "ADMIN") {
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
  producer.send("venue.deleted", { value: { id: venueId } });
  res.status(200).json({ message: "Venue deleted successfully" });
};
