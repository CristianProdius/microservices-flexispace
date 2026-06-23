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
  BUCHAREST_VENUES,
  type CuratedSpaceSeed,
  type CuratedVenueSeed,
  validateCuratedVenueSeeds,
} from "./data/bucharest-venues.ts";

// Venue-centric Bucharest import: one Venue per location, MANY Spaces (one per
// bookable type — hot desk, dedicated desk, private office, meeting room).
// One HOST per brand (a host owns multiple venues/spaces). Idempotent.
const CURRENCY = "EUR" as const;
const CITY = "Bucharest";
const COUNTRY = "Romania";

const DEFAULT_DESCRIPTION_SUFFIX =
  "Details, final availability, and pricing should be confirmed directly with the venue host.";
const FETCH_TIMEOUT_MS = 20_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMPORT_LOCK_ID = BigInt("42751025");

type AvailabilityRow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
};

const hasArg = (value: string) => process.argv.includes(value);
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Open Mon–Fri 08:00–21:00, Sat 09:00–17:00, closed Sunday.
const buildAvailability = (): AvailabilityRow[] =>
  Array.from({ length: 7 }, (_, dayOfWeek) => {
    if (dayOfWeek === 0) return { dayOfWeek, startTime: "09:00", endTime: "17:00", isOpen: false };
    if (dayOfWeek === 6) return { dayOfWeek, startTime: "09:00", endTime: "17:00", isOpen: true };
    return { dayOfWeek, startTime: "08:00", endTime: "21:00", isOpen: true };
  });

const toTranslations = (ro: string | null | undefined) =>
  ro && ro.trim() ? ({ ro: ro.trim() } as Prisma.InputJsonValue) : undefined;

const bookingHoursFor = (pricingType: CuratedSpaceSeed["pricingType"]) =>
  pricingType === "HOURLY"
    ? { minBookingHours: 1, maxBookingHours: 10 }
    : { minBookingHours: null, maxBookingHours: null };

const fetchImageBuffer = async (url: string) => {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "user-agent":
            "Mozilla/5.0 (compatible; SpaceflySeedBot/1.0; +https://spacefly.ai)",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} (${url})`);
      }
      const contentLength = response.headers.get("content-length");
      if (contentLength && Number(contentLength) > MAX_IMAGE_BYTES) {
        throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} bytes: ${url}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength > MAX_IMAGE_BYTES) {
        throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} bytes after download: ${url}`);
      }
      return buffer;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  throw new Error(`Failed to download image after retries: ${url}`);
};

const uploadImage = async (objectKey: string, url: string) => {
  const buffer = await fetchImageBuffer(url);
  const imageType = sniffUploadedImageType(buffer);
  const key = `${objectKey}.${imageType.extension}`;
  const { bucket } = getUploadConfig();
  await getS3Client().send(
    new PutObjectCommand({
      Body: buffer,
      Bucket: bucket,
      CacheControl: "public, max-age=31536000, immutable",
      ContentLength: buffer.byteLength,
      ContentType: imageType.mime,
      Key: key,
    }),
  );
  return buildPublicUploadUrl(key);
};

// Upload a list of source URLs under a key prefix, keeping only those that
// download cleanly (scraped URLs are best-effort and some 404).
const uploadAll = async (prefix: string, urls: string[]) => {
  const settled = await Promise.allSettled(
    urls.map((u, i) => uploadImage(`${prefix}-${i + 1}`, u)),
  );
  const ok: string[] = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") ok.push(r.value);
    else console.warn(`  ! image ${i + 1} failed (${prefix}): ${String((r.reason as Error)?.message ?? r.reason)}`);
  });
  return ok;
};

export const validateManifest = (
  venues: ReadonlyArray<CuratedVenueSeed> = BUCHAREST_VENUES,
) => validateCuratedVenueSeeds(venues);

// Upsert one HOST per brand. Existing brand hosts (existing=true) are looked up
// by email and NOT modified; only brand-new hosts are created.
const upsertHosts = async () => {
  const placeholderPassword = await hashPassword(randomUUID());
  const bySlug = new Map<string, { id: string }>();
  const seen = new Map<string, CuratedVenueSeed>();
  for (const v of BUCHAREST_VENUES) if (!seen.has(v.hostSlug)) seen.set(v.hostSlug, v);

  for (const [slug, v] of seen) {
    const email = `hosts+${slug}@spacefly.ai`;
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing && v.hostExisting) {
      bySlug.set(slug, existing);
      continue;
    }
    const saved = await prisma.user.upsert({
      where: { email },
      update: { bio: v.hostBio, emailVerified: true, hostVerified: true, name: v.hostName, role: "HOST", username: slug },
      create: {
        bio: v.hostBio, email, emailVerified: true, hostVerified: true,
        hostingSince: new Date(), name: v.hostName, password: placeholderPassword,
        role: "HOST", username: slug,
      },
      select: { id: true },
    });
    bySlug.set(slug, saved);
  }
  return bySlug;
};

export const main = async () => {
  validateManifest();
  const totalSpaces = BUCHAREST_VENUES.reduce((n, v) => n + v.spaces.length, 0);

  if (hasArg("--validate")) {
    console.log(`Validated ${BUCHAREST_VENUES.length} venues / ${totalSpaces} spaces.`);
    return;
  }

  const hostsBySlug = await upsertHosts();

  const amenities = await prisma.amenity.findMany({ select: { id: true, name: true } });
  const amenityByName = new Map(amenities.map((a) => [a.name, a.id]));
  const categorySlugs = new Set(
    (await prisma.spaceCategory.findMany({ select: { slug: true } })).map((c) => c.slug),
  );
  for (const v of BUCHAREST_VENUES) {
    for (const s of v.spaces) {
      if (!categorySlugs.has(s.categorySlug)) throw new Error(`Missing category slug: ${s.categorySlug}`);
      const missing = s.amenityNames.find((n) => !amenityByName.has(n));
      if (missing) throw new Error(`Missing amenity in database: ${missing}`);
    }
  }

  await prisma.$executeRaw`SELECT pg_advisory_lock(${IMPORT_LOCK_ID})`;

  let venueCount = 0, spaceCount = 0;
  const skipped: string[] = [];

  for (const venue of BUCHAREST_VENUES) {
    const owner = hostsBySlug.get(venue.hostSlug);
    if (!owner) throw new Error(`Host not found for venue ${venue.name}: ${venue.hostSlug}`);
    console.log(`Venue: ${venue.name} (host ${venue.hostSlug}, ${venue.spaces.length} spaces)`);

    const venuePrefix = `spaces/${owner.id.replace(/[^a-zA-Z0-9_-]/g, "_")}/imports/bucharest/${slugify(venue.name)}/venue`;
    const venueImages = await uploadAll(venuePrefix, venue.imageSourceUrls);

    const venueDescription = `${venue.description} ${DEFAULT_DESCRIPTION_SUFFIX}`.trim();

    const savedVenueId = await prisma.$transaction(async (tx) => {
      const matches = await tx.venue.findMany({
        where: { name: venue.name, address: venue.address, city: CITY },
        select: { id: true },
        orderBy: { id: "asc" },
      });
      if (matches.length > 1) {
        throw new Error(`Duplicate venues for ${venue.name} at ${venue.address}; manual cleanup`);
      }
      const venueData = {
        name: venue.name,
        address: venue.address,
        city: CITY,
        country: COUNTRY,
        currency: CURRENCY,
        postalCode: venue.postalCode,
        shortDescription: venue.shortDescription,
        description: venueDescription,
        shortDescTranslations: toTranslations(venue.shortDescriptionRo),
        descriptionTranslations: toTranslations(venue.descriptionRo),
        hostId: owner.id,
        images: venueImages,
        latitude: null,
        longitude: null,
        state: null,
      } satisfies Prisma.VenueUncheckedCreateInput;

      if (matches[0]) {
        await tx.venue.update({ where: { id: matches[0].id }, data: venueData });
        return matches[0].id;
      }
      const created = await tx.venue.create({ data: venueData, select: { id: true } });
      return created.id;
    });
    venueCount += 1;

    for (const space of venue.spaces) {
      const spacePrefix = `spaces/${owner.id.replace(/[^a-zA-Z0-9_-]/g, "_")}/imports/bucharest/${slugify(venue.name)}/${slugify(space.name)}`;
      const ownImages = space.imageSourceUrls?.length ? await uploadAll(spacePrefix, space.imageSourceUrls) : [];
      const spaceImages = ownImages.length ? ownImages : venueImages;
      if (spaceImages.length === 0) {
        console.warn(`  - skipping space ${space.name}: no images`);
        skipped.push(`${venue.name} / ${space.name}`);
        continue;
      }
      const amenityIds = space.amenityNames.map((n) => amenityByName.get(n)!);
      const { minBookingHours, maxBookingHours } = bookingHoursFor(space.pricingType);
      const availability = buildAvailability();

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
        images: spaceImages,
        isActive: true,
        instantBook: false,
        houseRules: space.houseRules,
        categorySlug: space.categorySlug,
        hostId: owner.id,
        venueId: savedVenueId,
      } satisfies Prisma.SpaceUncheckedCreateInput;

      await prisma.$transaction(async (tx) => {
        const matches = await tx.space.findMany({
          where: { name: space.name, venueId: savedVenueId },
          select: { id: true },
          orderBy: { id: "asc" },
        });
        if (matches.length > 1) {
          throw new Error(`Duplicate spaces ${space.name} in venue ${savedVenueId}`);
        }
        const saved = matches[0]
          ? await tx.space.update({ where: { id: matches[0].id }, data })
          : await tx.space.create({ data });
        await tx.spaceAmenity.deleteMany({ where: { spaceId: saved.id } });
        await tx.spaceAmenity.createMany({
          data: amenityIds.map((amenityId) => ({ spaceId: saved.id, amenityId })),
          skipDuplicates: true,
        });
        await tx.availability.deleteMany({ where: { spaceId: saved.id } });
        await tx.availability.createMany({
          data: availability.map((row) => ({ spaceId: saved.id, ...row })),
        });
      });
      spaceCount += 1;
      console.log(`  + ${space.name} [${space.spaceType}]`);
    }
  }

  console.log(`Done. ${venueCount} venues / ${spaceCount} spaces imported.`);
  if (skipped.length) console.warn(`Skipped ${skipped.length} spaces (no images): ${skipped.join("; ")}`);
};

const isDirectRun =
  process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      try {
        await prisma.$executeRaw`SELECT pg_advisory_unlock(${IMPORT_LOCK_ID})`;
      } catch {
        // ignore
      }
      await prisma.$disconnect();
    });
}
