import { PutObjectCommand } from "@aws-sdk/client-s3";
import { hashPassword } from "@repo/auth-middleware";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { Prisma } from "../packages/db/generated/prisma/index.js";
import { prisma } from "../packages/db/src/client.ts";
import {
  buildPublicUploadUrl,
  getS3Client,
  getUploadConfig,
  sniffUploadedImageType,
} from "../apps/product-service/src/utils/upload.ts";
import {
  CLUJ_VENUES,
  type CuratedSpaceSeed,
  type CuratedVenueSeed,
  validateCuratedVenueSeeds,
} from "./data/cluj-venues.ts";

// Venue-centric Cluj import: one Venue per location, many Spaces; one HOST per
// brand (existing brand hosts reused, e.g. Regus/Spaces). Idempotent.
const CURRENCY = "EUR" as const;
const CITY = "Cluj-Napoca";
const COUNTRY = "Romania";
const DEFAULT_DESCRIPTION_SUFFIX =
  "Details, final availability, and pricing should be confirmed directly with the venue host.";
const FETCH_TIMEOUT_MS = 20_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMPORT_LOCK_ID = BigInt("42751028");

const hasArg = (v: string) => process.argv.includes(v);
const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const buildAvailability = () =>
  Array.from({ length: 7 }, (_, dayOfWeek) => {
    if (dayOfWeek === 0) return { dayOfWeek, startTime: "09:00", endTime: "17:00", isOpen: false };
    if (dayOfWeek === 6) return { dayOfWeek, startTime: "09:00", endTime: "17:00", isOpen: true };
    return { dayOfWeek, startTime: "08:00", endTime: "21:00", isOpen: true };
  });
const toTranslations = (ro: string | null | undefined) =>
  ro && ro.trim() ? ({ ro: ro.trim() } as Prisma.InputJsonValue) : undefined;
const bookingHoursFor = (p: CuratedSpaceSeed["pricingType"]) =>
  p === "HOURLY" ? { minBookingHours: 1, maxBookingHours: 10 } : { minBookingHours: null, maxBookingHours: null };

const fetchImageBuffer = async (url: string) => {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const r = await fetch(url, {
        headers: { accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8", "user-agent": "Mozilla/5.0 (compatible; SpaceflySeedBot/1.0; +https://spacefly.ai)" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText} (${url})`);
      const cl = r.headers.get("content-length");
      if (cl && Number(cl) > MAX_IMAGE_BYTES) throw new Error(`too big: ${url}`);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.byteLength > MAX_IMAGE_BYTES) throw new Error(`too big after dl: ${url}`);
      return buf;
    } catch (e) { if (attempt === 2) throw e; }
  }
  throw new Error(`download failed: ${url}`);
};
const uploadImage = async (objectKey: string, url: string) => {
  const buf = await fetchImageBuffer(url);
  const t = sniffUploadedImageType(buf);
  const key = `${objectKey}.${t.extension}`;
  const { bucket } = getUploadConfig();
  await getS3Client().send(new PutObjectCommand({ Body: buf, Bucket: bucket, CacheControl: "public, max-age=31536000, immutable", ContentLength: buf.byteLength, ContentType: t.mime, Key: key }));
  return buildPublicUploadUrl(key);
};
const uploadAll = async (prefix: string, urls: string[]) => {
  const settled = await Promise.allSettled(urls.map((u, i) => uploadImage(`${prefix}-${i + 1}`, u)));
  const ok: string[] = [];
  settled.forEach((r, i) => { if (r.status === "fulfilled") ok.push(r.value); else console.warn(`  ! image ${i + 1} failed (${prefix}): ${String((r.reason as Error)?.message ?? r.reason)}`); });
  return ok;
};

export const validateManifest = (v: ReadonlyArray<CuratedVenueSeed> = CLUJ_VENUES) => validateCuratedVenueSeeds(v);

const upsertHosts = async () => {
  const placeholderPassword = await hashPassword(randomUUID());
  const bySlug = new Map<string, { id: string }>();
  const seen = new Map<string, CuratedVenueSeed>();
  for (const v of CLUJ_VENUES) if (!seen.has(v.hostSlug)) seen.set(v.hostSlug, v);
  for (const [slug, v] of seen) {
    const email = `hosts+${slug}@spacefly.ai`;
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing && v.hostExisting) { bySlug.set(slug, existing); continue; }
    const saved = await prisma.user.upsert({
      where: { email },
      update: { bio: v.hostBio, emailVerified: true, hostVerified: true, name: v.hostName, role: "HOST", username: slug },
      create: { bio: v.hostBio, email, emailVerified: true, hostVerified: true, hostingSince: new Date(), name: v.hostName, password: placeholderPassword, role: "HOST", username: slug },
      select: { id: true },
    });
    bySlug.set(slug, saved);
  }
  return bySlug;
};

export const main = async () => {
  validateManifest();
  const totalSpaces = CLUJ_VENUES.reduce((n, v) => n + v.spaces.length, 0);
  if (hasArg("--validate")) { console.log(`Validated ${CLUJ_VENUES.length} Cluj venues / ${totalSpaces} spaces.`); return; }

  const hostsBySlug = await upsertHosts();
  const amenities = await prisma.amenity.findMany({ select: { id: true, name: true } });
  const amenityByName = new Map(amenities.map((a) => [a.name, a.id]));
  const categorySlugs = new Set((await prisma.spaceCategory.findMany({ select: { slug: true } })).map((c) => c.slug));
  for (const v of CLUJ_VENUES) for (const s of v.spaces) {
    if (!categorySlugs.has(s.categorySlug)) throw new Error(`Missing category: ${s.categorySlug}`);
    const m = s.amenityNames.find((n) => !amenityByName.has(n));
    if (m) throw new Error(`Missing amenity: ${m}`);
  }

  await prisma.$executeRaw`SELECT pg_advisory_lock(${IMPORT_LOCK_ID})`;
  let venueCount = 0, spaceCount = 0;
  const skipped: string[] = [];

  for (const venue of CLUJ_VENUES) {
    const owner = hostsBySlug.get(venue.hostSlug);
    if (!owner) throw new Error(`Host not found: ${venue.hostSlug}`);
    console.log(`Venue: ${venue.name} (host ${venue.hostSlug}, ${venue.spaces.length} spaces)`);
    const venuePrefix = `spaces/${owner.id.replace(/[^a-zA-Z0-9_-]/g, "_")}/imports/cluj/${slugify(venue.name)}/venue`;
    const venueImages = await uploadAll(venuePrefix, venue.imageSourceUrls);
    const venueDescription = `${venue.description} ${DEFAULT_DESCRIPTION_SUFFIX}`.trim();

    const savedVenueId = await prisma.$transaction(async (tx) => {
      const m = await tx.venue.findMany({ where: { name: venue.name, address: venue.address, city: CITY }, select: { id: true }, orderBy: { id: "asc" } });
      if (m.length > 1) throw new Error(`Duplicate venues for ${venue.name}`);
      const venueData = {
        name: venue.name, address: venue.address, city: CITY, country: COUNTRY, currency: CURRENCY,
        postalCode: venue.postalCode, shortDescription: venue.shortDescription, description: venueDescription,
        shortDescTranslations: toTranslations(venue.shortDescriptionRo), descriptionTranslations: toTranslations(venue.descriptionRo),
        hostId: owner.id, images: venueImages, latitude: null, longitude: null, state: null,
      } satisfies Prisma.VenueUncheckedCreateInput;
      if (m[0]) { await tx.venue.update({ where: { id: m[0].id }, data: venueData }); return m[0].id; }
      return (await tx.venue.create({ data: venueData, select: { id: true } })).id;
    });
    venueCount += 1;

    for (const space of venue.spaces) {
      const sp = `spaces/${owner.id.replace(/[^a-zA-Z0-9_-]/g, "_")}/imports/cluj/${slugify(venue.name)}/${slugify(space.name)}`;
      const own = space.imageSourceUrls?.length ? await uploadAll(sp, space.imageSourceUrls) : [];
      const spaceImages = own.length ? own : venueImages;
      if (spaceImages.length === 0) { console.warn(`  - skipping ${space.name}: no images`); skipped.push(`${venue.name}/${space.name}`); continue; }
      const amenityIds = space.amenityNames.map((n) => amenityByName.get(n)!);
      const { minBookingHours, maxBookingHours } = bookingHoursFor(space.pricingType);
      const data = {
        name: space.name, shortDescription: space.shortDescription,
        description: `${space.description} ${DEFAULT_DESCRIPTION_SUFFIX}`.trim(),
        shortDescTranslations: toTranslations(space.shortDescriptionRo), descriptionTranslations: toTranslations(space.descriptionRo),
        spaceType: space.spaceType, pricingType: space.pricingType, pricePerHour: space.pricePerHour, pricePerDay: space.pricePerDay,
        cleaningFee: 0, currency: CURRENCY, capacity: space.capacity, minBookingHours, maxBookingHours,
        images: spaceImages, isActive: true, instantBook: false, houseRules: space.houseRules,
        categorySlug: space.categorySlug, hostId: owner.id, venueId: savedVenueId,
      } satisfies Prisma.SpaceUncheckedCreateInput;
      await prisma.$transaction(async (tx) => {
        const m = await tx.space.findMany({ where: { name: space.name, venueId: savedVenueId }, select: { id: true }, orderBy: { id: "asc" } });
        if (m.length > 1) throw new Error(`Duplicate space ${space.name}`);
        const saved = m[0] ? await tx.space.update({ where: { id: m[0].id }, data }) : await tx.space.create({ data });
        await tx.spaceAmenity.deleteMany({ where: { spaceId: saved.id } });
        await tx.spaceAmenity.createMany({ data: amenityIds.map((amenityId) => ({ spaceId: saved.id, amenityId })), skipDuplicates: true });
        await tx.availability.deleteMany({ where: { spaceId: saved.id } });
        await tx.availability.createMany({ data: buildAvailability().map((r) => ({ spaceId: saved.id, ...r })) });
      });
      spaceCount += 1;
      console.log(`  + ${space.name} [${space.spaceType}]`);
    }
  }
  console.log(`Done. ${venueCount} Cluj venues / ${spaceCount} spaces imported.`);
  if (skipped.length) console.warn(`Skipped ${skipped.length}: ${skipped.join("; ")}`);
};

const isDirectRun = process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => {
    try { await prisma.$executeRaw`SELECT pg_advisory_unlock(${IMPORT_LOCK_ID})`; } catch { /* ignore */ }
    await prisma.$disconnect();
  });
}
