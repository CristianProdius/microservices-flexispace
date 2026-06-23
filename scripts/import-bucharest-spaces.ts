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
  BUCHAREST_HOSTS,
  BUCHAREST_SPACES,
  type CuratedSpaceSeed,
  validateCuratedSpaceSeeds,
} from "./data/bucharest-spaces.ts";

// Every imported Bucharest venue is modeled as a single bookable COWORKING_SPACE
// under its own Venue. These dimensions are fixed for the whole batch, so they
// live here rather than being repeated in the manifest.
const CATEGORY_SLUG = "coworking-space";
const SPACE_TYPE = "COWORKING_SPACE" as const;
const CURRENCY = "EUR" as const; // prices in the manifest are already EUR (RON/5.0)
const CITY = "Bucharest";
const COUNTRY = "Romania";

const DEFAULT_DESCRIPTION_SUFFIX =
  "Details, final availability, and pricing should be confirmed directly with the venue host.";
const FETCH_TIMEOUT_MS = 20_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
// Distinct advisory-lock id so a Bucharest import never blocks/!blocks on the
// Chisinau import (42751023).
const IMPORT_LOCK_ID = BigInt("42751024");

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

// Coworking hours: open Mon–Fri 08:00–21:00, Sat 09:00–17:00, closed Sunday.
const buildAvailability = (): AvailabilityRow[] =>
  Array.from({ length: 7 }, (_, dayOfWeek) => {
    if (dayOfWeek === 0) {
      return { dayOfWeek, startTime: "09:00", endTime: "17:00", isOpen: false };
    }
    if (dayOfWeek === 6) {
      return { dayOfWeek, startTime: "09:00", endTime: "17:00", isOpen: true };
    }
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
        throw new Error(
          `Failed to download image: ${response.status} ${response.statusText} (${url})`,
        );
      }

      const contentLength = response.headers.get("content-length");
      if (contentLength && Number(contentLength) > MAX_IMAGE_BYTES) {
        throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} bytes: ${url}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.byteLength > MAX_IMAGE_BYTES) {
        throw new Error(
          `Image exceeds ${MAX_IMAGE_BYTES} bytes after download: ${url}`,
        );
      }

      return buffer;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
    }
  }

  throw new Error(`Failed to download image after retries: ${url}`);
};

const buildImportImageObjectKey = (
  ownerId: string,
  space: CuratedSpaceSeed,
  imageIndex: number,
) =>
  `spaces/${ownerId.replace(/[^a-zA-Z0-9_-]/g, "_")}/imports/bucharest/${slugify(
    space.name,
  )}-${imageIndex + 1}`;

const uploadImageToStorage = async (
  ownerId: string,
  space: CuratedSpaceSeed,
  url: string,
  imageIndex: number,
) => {
  const buffer = await fetchImageBuffer(url);
  const imageType = sniffUploadedImageType(buffer);
  const objectKey = `${buildImportImageObjectKey(ownerId, space, imageIndex)}.${imageType.extension}`;
  const { bucket } = getUploadConfig();

  await getS3Client().send(
    new PutObjectCommand({
      Body: buffer,
      Bucket: bucket,
      CacheControl: "public, max-age=31536000, immutable",
      ContentLength: buffer.byteLength,
      ContentType: imageType.mime,
      Key: objectKey,
    }),
  );

  return buildPublicUploadUrl(objectKey);
};

// Scraped image URLs are best-effort: some 404 or hot-link-block. Upload each
// independently and keep whatever succeeds, so one dead URL never aborts the
// whole venue. Returns the public URLs of the images that uploaded cleanly.
const uploadSpaceImages = async (ownerId: string, space: CuratedSpaceSeed) => {
  const results = await Promise.allSettled(
    space.imageSourceUrls.map((imageSourceUrl, imageIndex) =>
      uploadImageToStorage(ownerId, space, imageSourceUrl, imageIndex),
    ),
  );
  const uploaded: string[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      uploaded.push(result.value);
    } else {
      console.warn(
        `  ! image ${index + 1} failed for ${space.name}: ${String(
          (result.reason as Error)?.message ?? result.reason,
        )}`,
      );
    }
  });
  return uploaded;
};

export const validateManifest = (
  spaces: ReadonlyArray<CuratedSpaceSeed> = BUCHAREST_SPACES,
) => {
  validateCuratedSpaceSeeds(spaces);
};

const upsertCuratedHosts = async () => {
  const placeholderPassword = await hashPassword(randomUUID());
  const hosts = new Map<
    string,
    { id: string; hostVerified: boolean; hostingSince: Date | null }
  >();

  for (const host of BUCHAREST_HOSTS) {
    const existing = await prisma.user.findUnique({
      where: { email: host.email },
      select: { hostingSince: true },
    });
    const saved = await prisma.user.upsert({
      where: { email: host.email },
      update: {
        bio: host.bio,
        emailVerified: true,
        hostVerified: true,
        hostingSince: existing?.hostingSince ?? new Date(),
        name: host.name,
        role: "HOST",
        username: host.username,
      },
      create: {
        bio: host.bio,
        email: host.email,
        emailVerified: true,
        hostVerified: true,
        hostingSince: new Date(),
        name: host.name,
        password: placeholderPassword,
        role: "HOST",
        username: host.username,
      },
      select: { id: true, hostVerified: true, hostingSince: true },
    });

    hosts.set(host.slug, saved);
  }

  return hosts;
};

export const main = async () => {
  validateManifest();

  if (hasArg("--validate")) {
    console.log(
      `Validated ${BUCHAREST_SPACES.length} curated Bucharest spaces across ${BUCHAREST_HOSTS.length} hosts.`,
    );
    return;
  }

  const hostsBySlug = await upsertCuratedHosts();

  const amenities = await prisma.amenity.findMany({
    select: { id: true, name: true },
  });
  const amenityByName = new Map(
    amenities.map((amenity) => [amenity.name, amenity.id]),
  );

  const categories = await prisma.spaceCategory.findMany({
    select: { slug: true },
  });
  if (!new Set(categories.map((c) => c.slug)).has(CATEGORY_SLUG)) {
    throw new Error(`Missing category slug in database: ${CATEGORY_SLUG}`);
  }

  for (const space of BUCHAREST_SPACES) {
    const missingAmenity = space.amenityNames.find(
      (name) => !amenityByName.has(name),
    );
    if (missingAmenity) {
      throw new Error(`Missing amenity in database: ${missingAmenity}`);
    }
  }

  await prisma.$executeRaw`SELECT pg_advisory_lock(${IMPORT_LOCK_ID})`;

  let imported = 0;
  const skipped: string[] = [];

  for (const space of BUCHAREST_SPACES) {
    console.log(`Importing ${space.name}...`);
    const owner = hostsBySlug.get(space.hostSlug);
    if (!owner) {
      throw new Error(
        `Local host not found for ${space.name}: ${space.hostSlug}`,
      );
    }

    const uploadedImages = await uploadSpaceImages(owner.id, space);
    if (uploadedImages.length === 0) {
      console.warn(`  - skipping ${space.name}: no images could be downloaded`);
      skipped.push(space.name);
      continue;
    }

    const amenityIds = space.amenityNames.map(
      (name) => amenityByName.get(name)!,
    );
    const availability = buildAvailability();
    const { minBookingHours, maxBookingHours } = bookingHoursFor(
      space.pricingType,
    );

    // Location fields live exclusively on Venue (DB-010). The Space row carries
    // pricing, capacity, translations and the image URL array.
    const data = {
      name: space.name,
      shortDescription: space.shortDescription,
      description: `${space.description} ${DEFAULT_DESCRIPTION_SUFFIX}`.trim(),
      shortDescTranslations: toTranslations(space.shortDescriptionRo),
      descriptionTranslations: toTranslations(space.descriptionRo),
      spaceType: SPACE_TYPE,
      pricingType: space.pricingType,
      pricePerHour: space.pricePerHour,
      pricePerDay: space.pricePerDay,
      cleaningFee: 0,
      currency: CURRENCY,
      capacity: space.capacity,
      minBookingHours,
      maxBookingHours,
      images: uploadedImages,
      isActive: true,
      instantBook: false,
      houseRules: space.houseRules,
      categorySlug: CATEGORY_SLUG,
      hostId: owner.id,
    } satisfies Omit<Prisma.SpaceUncheckedCreateInput, "venueId">;

    const savedSpace = await prisma.$transaction(async (tx) => {
      // Identify existing spaces by name; verify against the venue address so we
      // do not collide with same-named spaces elsewhere.
      const matches = await tx.space.findMany({
        where: {
          name: space.name,
          venue: { address: space.address, city: CITY },
        },
        select: { id: true, venueId: true },
        orderBy: { id: "asc" },
      });

      if (matches.length > 1) {
        throw new Error(
          `Duplicate spaces found for ${space.name} at ${space.address}; manual cleanup required`,
        );
      }

      const saved =
        matches[0] == null
          ? await tx.space.create({
              data: {
                ...data,
                venueId: (
                  await tx.venue.create({
                    data: {
                      address: space.address,
                      city: CITY,
                      country: COUNTRY,
                      currency: CURRENCY,
                      description: data.description,
                      shortDescTranslations: toTranslations(
                        space.shortDescriptionRo,
                      ),
                      descriptionTranslations: toTranslations(
                        space.descriptionRo,
                      ),
                      hostId: owner.id,
                      images: uploadedImages,
                      latitude: null,
                      longitude: null,
                      name: space.name,
                      postalCode: space.postalCode,
                      shortDescription: space.shortDescription,
                      state: null,
                    },
                    select: { id: true },
                  })
                ).id,
              },
            })
          : await tx.space.update({
              where: { id: matches[0].id },
              data,
            });

      await tx.venue.update({
        where: { id: saved.venueId },
        data: { hostId: owner.id, images: uploadedImages },
      });

      await tx.spaceAmenity.deleteMany({ where: { spaceId: saved.id } });
      await tx.spaceAmenity.createMany({
        data: amenityIds.map((amenityId) => ({ spaceId: saved.id, amenityId })),
        skipDuplicates: true,
      });

      await tx.availability.deleteMany({ where: { spaceId: saved.id } });
      await tx.availability.createMany({
        data: availability.map((row) => ({ spaceId: saved.id, ...row })),
      });

      return saved;
    });

    imported += 1;
    console.log(`Imported ${space.name} as space #${savedSpace.id}`);
  }

  const total = await prisma.space.count({
    where: {
      venue: { city: CITY },
      hostId: { in: Array.from(hostsBySlug.values()).map((host) => host.id) },
    },
  });
  console.log(
    `Done. Imported ${imported} Bucharest spaces (${total} total under these hosts).`,
  );
  if (skipped.length > 0) {
    console.warn(`Skipped ${skipped.length} (no images): ${skipped.join(", ")}`);
  }
};

const isDirectRun =
  process.argv[1] != null &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

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
        // Ignore unlock failures when the advisory lock was never acquired.
      }
      await prisma.$disconnect();
    });
}
