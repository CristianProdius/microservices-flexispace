import { pathToFileURL } from "node:url";
import { Prisma } from "../packages/db/generated/prisma/index.js";
import { prisma } from "../packages/db/src/client.ts";
import {
  BUCHAREST_EXPAND,
  type CuratedExpandSpace,
  type CuratedExpandVenue,
  validateExpandSeeds,
} from "./data/bucharest-expand.ts";

// Adds the additional bookable space types to the original 24 Bucharest venues.
// New spaces INHERIT the venue's already-hosted images (no downloads, no S3).
// The venue row is never modified. Idempotent (upsert by name+venueId).
const CURRENCY = "EUR" as const;
const CITY = "Bucharest";
const DEFAULT_DESCRIPTION_SUFFIX =
  "Details, final availability, and pricing should be confirmed directly with the venue host.";
const IMPORT_LOCK_ID = BigInt("42751026");

const hasArg = (v: string) => process.argv.includes(v);

const buildAvailability = () =>
  Array.from({ length: 7 }, (_, dayOfWeek) => {
    if (dayOfWeek === 0) return { dayOfWeek, startTime: "09:00", endTime: "17:00", isOpen: false };
    if (dayOfWeek === 6) return { dayOfWeek, startTime: "09:00", endTime: "17:00", isOpen: true };
    return { dayOfWeek, startTime: "08:00", endTime: "21:00", isOpen: true };
  });

const toTranslations = (ro: string | null | undefined) =>
  ro && ro.trim() ? ({ ro: ro.trim() } as Prisma.InputJsonValue) : undefined;

const bookingHoursFor = (p: CuratedExpandSpace["pricingType"]) =>
  p === "HOURLY" ? { minBookingHours: 1, maxBookingHours: 10 } : { minBookingHours: null, maxBookingHours: null };

export const validateManifest = (v: ReadonlyArray<CuratedExpandVenue> = BUCHAREST_EXPAND) => validateExpandSeeds(v);

export const main = async () => {
  validateManifest();
  const totalNew = BUCHAREST_EXPAND.reduce((n, v) => n + v.newSpaces.length, 0);
  if (hasArg("--validate")) {
    console.log(`Validated ${BUCHAREST_EXPAND.length} venues / ${totalNew} new spaces.`);
    return;
  }

  const amenities = await prisma.amenity.findMany({ select: { id: true, name: true } });
  const amenityByName = new Map(amenities.map((a) => [a.name, a.id]));
  const categorySlugs = new Set((await prisma.spaceCategory.findMany({ select: { slug: true } })).map((c) => c.slug));
  for (const v of BUCHAREST_EXPAND) for (const s of v.newSpaces) {
    if (!categorySlugs.has(s.categorySlug)) throw new Error(`Missing category: ${s.categorySlug}`);
    const m = s.amenityNames.find((n) => !amenityByName.has(n));
    if (m) throw new Error(`Missing amenity: ${m}`);
  }

  await prisma.$executeRaw`SELECT pg_advisory_lock(${IMPORT_LOCK_ID})`;
  let added = 0;
  const skipped: string[] = [];

  for (const venue of BUCHAREST_EXPAND) {
    const existing = await prisma.venue.findFirst({
      where: { name: venue.venueName, address: venue.address, city: CITY },
      select: { id: true, hostId: true, images: true },
      orderBy: { id: "asc" },
    });
    if (!existing) {
      console.warn(`- venue not found, skipping: ${venue.venueName} @ ${venue.address}`);
      skipped.push(venue.venueName);
      continue;
    }
    const inheritedImages = existing.images as Prisma.InputJsonValue;
    console.log(`Venue: ${venue.venueName} (+${venue.newSpaces.length} spaces)`);

    for (const space of venue.newSpaces) {
      const amenityIds = space.amenityNames.map((n) => amenityByName.get(n)!);
      const { minBookingHours, maxBookingHours } = bookingHoursFor(space.pricingType);
      const data = {
        name: space.name,
        shortDescription: space.shortDescription,
        description: `${space.description} ${DEFAULT_DESCRIPTION_SUFFIX}`.trim(),
        shortDescTranslations: toTranslations(space.shortDescriptionRo),
        descriptionTranslations: toTranslations(space.descriptionRo),
        spaceType: space.spaceType,
        pricingType: space.pricingType,
        pricePerHour: space.pricePerHour,
        pricePerDay: space.pricePerDay,
        cleaningFee: 0,
        currency: CURRENCY,
        capacity: space.capacity,
        minBookingHours,
        maxBookingHours,
        images: inheritedImages,
        isActive: true,
        instantBook: false,
        houseRules: space.houseRules,
        categorySlug: space.categorySlug,
        hostId: existing.hostId,
        venueId: existing.id,
      } satisfies Prisma.SpaceUncheckedCreateInput;

      await prisma.$transaction(async (tx) => {
        const m = await tx.space.findMany({ where: { name: space.name, venueId: existing.id }, select: { id: true }, orderBy: { id: "asc" } });
        if (m.length > 1) throw new Error(`Duplicate space ${space.name} in venue ${existing.id}`);
        const saved = m[0] ? await tx.space.update({ where: { id: m[0].id }, data }) : await tx.space.create({ data });
        await tx.spaceAmenity.deleteMany({ where: { spaceId: saved.id } });
        await tx.spaceAmenity.createMany({ data: amenityIds.map((amenityId) => ({ spaceId: saved.id, amenityId })), skipDuplicates: true });
        await tx.availability.deleteMany({ where: { spaceId: saved.id } });
        await tx.availability.createMany({ data: buildAvailability().map((r) => ({ spaceId: saved.id, ...r })) });
      });
      added += 1;
      console.log(`  + ${space.name} [${space.spaceType}]`);
    }
  }
  console.log(`Done. Added ${added} spaces to ${BUCHAREST_EXPAND.length - skipped.length} venues.`);
  if (skipped.length) console.warn(`Skipped (venue not found): ${skipped.join(", ")}`);
};

const isDirectRun = process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main()
    .catch((e) => { console.error(e); process.exitCode = 1; })
    .finally(async () => {
      try { await prisma.$executeRaw`SELECT pg_advisory_unlock(${IMPORT_LOCK_ID})`; } catch { /* ignore */ }
      await prisma.$disconnect();
    });
}
