import { Request, Response } from "express";
import {
  prisma,
  Prisma,
  PricingType,
  SpaceType,
  CancellationPolicy,
  Currency,
} from "@repo/db";
import { producer } from "../utils/kafka.js";
import {
  buildCategoryPayload,
  normalizeCategorySlug,
} from "../lib/space-taxonomy.js";
import {
  resolveTranslations,
  SPACE_TRANSLATION_FIELDS,
} from "../lib/translations.js";
import {
  isDateOnlyOrIsoDate,
  isValidYouTubeUrl,
  parsePositiveInteger,
  parsePositiveIntegerWithDefault,
} from "../lib/validation.js";

// PRODSVC-012: bound host-scoped lists so a host with thousands of spaces
// can't OOM the API or blow the wire payload.
const SPACE_LIST_DEFAULT_LIMIT = 50;
const SPACE_LIST_MAX_LIMIT = 200;

const venueInclude = {
  select: {
    id: true,
    name: true,
    shortDescription: true,
    description: true,
    nameTranslations: true,
    shortDescTranslations: true,
    descriptionTranslations: true,
    images: true,
    videoUrl: true,
    address: true,
    city: true,
    state: true,
    country: true,
    postalCode: true,
    latitude: true,
    longitude: true,
    currency: true,
    hostId: true,
    isActive: true,
  },
};

const SORT_FIELDS = new Set([
  "createdAt",
  "pricePerHour",
  "pricePerDay",
  "capacity",
]);
const SORT_ORDERS = new Set(["asc", "desc"]);
const SPACE_TYPES = new Set<SpaceType>(Object.values(SpaceType));
const CURRENCIES = new Set<Currency>(Object.values(Currency));
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const parsePositiveInt = (value: unknown, fallback: number) => {
  const parsed = parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseNumberFilter = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toMinutes = (value: string) => {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

type AvailabilityInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
};

const normalizeAvailability = (
  value: unknown,
): { availability: AvailabilityInput[] } | { message: string } => {
  if (!Array.isArray(value) || value.length !== 7) {
    return {
      message: "availability must include all 7 days and at least one open day",
    };
  }

  const seenDays = new Set<number>();
  const availability: AvailabilityInput[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      return { message: "availability entries must be valid day objects" };
    }

    const dayOfWeek = (entry as { dayOfWeek?: unknown }).dayOfWeek;
    const startTime = (entry as { startTime?: unknown }).startTime;
    const endTime = (entry as { endTime?: unknown }).endTime;
    const isOpen = (entry as { isOpen?: unknown }).isOpen;

    if (
      typeof dayOfWeek !== "number" ||
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 0 ||
      dayOfWeek > 6 ||
      seenDays.has(dayOfWeek)
    ) {
      return { message: "availability must include each day exactly once" };
    }

    if (
      typeof startTime !== "string" ||
      typeof endTime !== "string" ||
      !TIME_PATTERN.test(startTime) ||
      !TIME_PATTERN.test(endTime)
    ) {
      return { message: "availability times must use HH:mm format" };
    }

    const resolvedIsOpen = typeof isOpen === "boolean" ? isOpen : true;
    if (resolvedIsOpen && toMinutes(endTime) <= toMinutes(startTime)) {
      return { message: "availability endTime must be after startTime" };
    }

    seenDays.add(dayOfWeek);
    availability.push({
      dayOfWeek,
      startTime,
      endTime,
      isOpen: resolvedIsOpen,
    });
  }

  if (!availability.some((entry) => entry.isOpen)) {
    return {
      message: "availability must include all 7 days and at least one open day",
    };
  }

  return {
    availability: availability.sort((a, b) => a.dayOfWeek - b.dayOfWeek),
  };
};

/**
 * Flatten venue location fields onto space for backward compat.
 * Existing clients read space.city, space.address — this keeps them working.
 */
const flattenVenue = (space: any) => {
  if (!space?.venue) return space;
  return {
    ...space,
    address: space.venue.address,
    city: space.venue.city,
    state: space.venue.state,
    country: space.venue.country,
    postalCode: space.venue.postalCode,
    latitude: space.venue.latitude,
    longitude: space.venue.longitude,
  };
};

// Get all spaces with search/filter
export const getSpaces = async (req: Request, res: Response) => {
  // Parse sort param into sortBy/sortOrder before destructuring
  const sortParam = req.query.sort as string | undefined;
  let resolvedSortBy = (req.query.sortBy as string) || "createdAt";
  let resolvedSortOrder = (req.query.sortOrder as string) || "desc";
  // PRODSVC-014: track when the caller really wants rating-ordered
  // results so we can swap to a raw SQL pre-query instead of silently
  // falling back to createdAt.
  let sortByRating = false;

  if (sortParam) {
    switch (sortParam) {
      case "newest":
        resolvedSortBy = "createdAt";
        resolvedSortOrder = "desc";
        break;
      case "price_asc":
        resolvedSortBy = "pricePerHour";
        resolvedSortOrder = "asc";
        break;
      case "price_desc":
        resolvedSortBy = "pricePerHour";
        resolvedSortOrder = "desc";
        break;
      case "rating":
        // Prisma cannot orderBy on aggregations of related rows, so we
        // run a raw SQL GROUP BY below to get the rating-ordered id page
        // and then re-fetch with the rich include shape.
        sortByRating = true;
        resolvedSortOrder = "desc";
        break;
    }
  }
  if (!SORT_FIELDS.has(resolvedSortBy)) {
    resolvedSortBy = "createdAt";
  }
  if (!SORT_ORDERS.has(resolvedSortOrder)) {
    resolvedSortOrder = "desc";
  }

  const {
    city,
    spaceType,
    categorySlug,
    groupSlug,
    minPrice,
    maxPrice,
    minCapacity: minCapacityParam,
    capacity: capacityParam,
    amenityIds,
    instantBook,
    currency: currencyParam,
    neLat,
    neLng,
    swLat,
    swLng,
    page = "1",
    limit = "20",
  } = req.query;

  const minCapacity = minCapacityParam || capacityParam;
  const minCapacityNum = parseNumberFilter(minCapacity);
  const minPriceNum = parseNumberFilter(minPrice);
  const maxPriceNum = parseNumberFilter(maxPrice);

  // PRODSVC-019: enforce non-negative + ordered price bounds before they
  // reach Prisma so callers cannot supply absurd ranges (e.g. negative
  // floors that match every row) to bypass intended pagination semantics.
  if (minPriceNum !== undefined && minPriceNum < 0) {
    return res.status(400).json({ message: "minPrice must be >= 0" });
  }
  if (maxPriceNum !== undefined && maxPriceNum < 0) {
    return res.status(400).json({ message: "maxPrice must be >= 0" });
  }
  if (
    minPriceNum !== undefined &&
    maxPriceNum !== undefined &&
    minPriceNum > maxPriceNum
  ) {
    return res
      .status(400)
      .json({ message: "minPrice must be <= maxPrice" });
  }
  const resolvedSpaceType =
    typeof spaceType === "string" && SPACE_TYPES.has(spaceType as SpaceType)
      ? (spaceType as SpaceType)
      : undefined;
  if (spaceType && !resolvedSpaceType) {
    return res.status(400).json({ message: "Invalid spaceType" });
  }
  const resolvedCurrency =
    typeof currencyParam === "string" &&
    CURRENCIES.has(currencyParam as Currency)
      ? (currencyParam as Currency)
      : undefined;
  if (currencyParam && !resolvedCurrency) {
    return res.status(400).json({ message: "Invalid currency" });
  }

  const pageNum = parsePositiveInt(page, 1);
  const limitNum = Math.min(parsePositiveInt(limit, 20), 100);

  // PRODSVC-016: parse the amenityIds query param (string list, single
  // string, or repeated key) into a numeric array we can hand to Prisma.
  // Default semantics are `some` (has any of the selected) which matches
  // typical marketplace filtering UX where amenities are OR-ed.
  const parseAmenityIds = (value: unknown): number[] => {
    const raw: string[] = Array.isArray(value)
      ? value.flatMap((v) =>
          typeof v === "string" ? v.split(",") : [],
        )
      : typeof value === "string"
        ? value.split(",")
        : [];
    const ids: number[] = [];
    for (const token of raw) {
      const trimmed = token.trim();
      if (!trimmed) continue;
      const parsed = Number(trimmed);
      if (Number.isInteger(parsed) && parsed > 0) ids.push(parsed);
    }
    return ids;
  };
  const amenityIdList = parseAmenityIds(amenityIds);

  const hasBbox = neLat && neLng && swLat && swLng;
  const bbox = hasBbox
    ? {
        neLat: parseNumberFilter(neLat),
        neLng: parseNumberFilter(neLng),
        swLat: parseNumberFilter(swLat),
        swLng: parseNumberFilter(swLng),
      }
    : null;
  const hasValidBbox =
    bbox &&
    bbox.neLat !== undefined &&
    bbox.neLng !== undefined &&
    bbox.swLat !== undefined &&
    bbox.swLng !== undefined;

  const where: Prisma.SpaceWhereInput = {
    isActive: true,
    ...(hasValidBbox
      ? {
          venue: {
            ...(city
              ? {
                  city: {
                    contains: city as string,
                    mode: "insensitive" as const,
                  },
                }
              : {}),
            latitude: { gte: bbox.swLat, lte: bbox.neLat },
            longitude: { gte: bbox.swLng, lte: bbox.neLng },
          },
        }
      : city
        ? {
            venue: {
              city: { contains: city as string, mode: "insensitive" as const },
            },
          }
        : {}),
    ...(resolvedSpaceType && { spaceType: resolvedSpaceType }),
    ...(categorySlug && { categorySlug: categorySlug as string }),
    ...(groupSlug && { category: { is: { groupSlug: groupSlug as string } } }),
    ...(minCapacityNum !== undefined && { capacity: { gte: minCapacityNum } }),
    ...(instantBook !== undefined && { instantBook: instantBook === "true" }),
    ...(resolvedCurrency && { currency: resolvedCurrency }),
    // PRODSVC-016: apply the amenityIds filter. `some` semantics mean "has
    // any of the selected amenities" — the marketplace default; switch to
    // `every` only if product wants strict AND matching.
    ...(amenityIdList.length > 0 && {
      amenities: { some: { amenityId: { in: amenityIdList } } },
    }),
    ...((minPriceNum !== undefined || maxPriceNum !== undefined) && {
      OR: [
        {
          pricePerHour: {
            ...(minPriceNum !== undefined && { gte: minPriceNum }),
            ...(maxPriceNum !== undefined && { lte: maxPriceNum }),
          },
        },
        {
          pricePerDay: {
            ...(minPriceNum !== undefined && { gte: minPriceNum }),
            ...(maxPriceNum !== undefined && { lte: maxPriceNum }),
          },
        },
      ],
    }),
  };

  const orderBy: Prisma.SpaceOrderByWithRelationInput = {
    [resolvedSortBy]: resolvedSortOrder,
  };

  const skip = (pageNum - 1) * limitNum;

  const spaceInclude = {
    category: true,
    venue: venueInclude,
    host: {
      select: {
        id: true,
        name: true,
        image: true,
      },
    },
    amenities: {
      include: {
        amenity: true,
      },
    },
    pricingTiers: { orderBy: { minutes: "asc" as const } },
    _count: {
      select: { reviews: true },
    },
  } satisfies Prisma.SpaceInclude;

  let spaces: Awaited<
    ReturnType<typeof prisma.space.findMany<{ include: typeof spaceInclude }>>
  >;
  let total: number;

  if (sortByRating) {
    // PRODSVC-014: order by avg review rating. Prisma cannot orderBy on
    // aggregations of related rows, so we run a raw SQL pre-query that
    // resolves the ordered page of ids, then re-fetch with the full
    // include shape so the response stays consistent with other sorts.
    // NULLS LAST keeps unrated spaces at the bottom of a desc sort.
    const candidateIdRows = await prisma.space.findMany({
      where,
      select: { id: true },
    });
    total = candidateIdRows.length;
    const candidateIds = candidateIdRows.map((row) => row.id);

    let orderedIds: number[] = [];
    if (candidateIds.length > 0) {
      const rows = await prisma.$queryRaw<
        Array<{ id: number }>
      >`SELECT s."id" AS id
        FROM "Space" s
        LEFT JOIN "Review" r ON r."spaceId" = s."id"
        WHERE s."id" IN (${Prisma.join(candidateIds)})
        GROUP BY s."id"
        ORDER BY AVG(r."rating") DESC NULLS LAST, s."id" DESC
        LIMIT ${limitNum} OFFSET ${skip}`;
      orderedIds = rows.map((r) => r.id);
    }

    if (orderedIds.length === 0) {
      spaces = [];
    } else {
      const pageRows = await prisma.space.findMany({
        where: { id: { in: orderedIds } },
        include: spaceInclude,
      });
      const orderIndex = new Map(orderedIds.map((id, idx) => [id, idx]));
      spaces = pageRows.sort(
        (a, b) =>
          (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0),
      );
    }
  } else {
    [spaces, total] = await Promise.all([
      prisma.space.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: spaceInclude,
      }),
      prisma.space.count({ where }),
    ]);
  }

  const lang = req.query.lang as string | undefined;

  // Calculate average rating for each space (batch query to avoid N+1)
  const spaceIds = spaces.map((s) => s.id);
  const ratings = await prisma.review.groupBy({
    by: ["spaceId"],
    where: { spaceId: { in: spaceIds } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const ratingMap = new Map(
    ratings.map((r) => [
      r.spaceId,
      { avg: r._avg.rating || 0, count: r._count.rating },
    ]),
  );

  const spacesWithRating = spaces.map((space) => {
    const rating = ratingMap.get(space.id) || { avg: 0, count: 0 };
    return flattenVenue({
      ...space,
      averageRating: rating.avg,
      reviewCount: rating.count,
    });
  });

  const resolved = spacesWithRating.map((space) =>
    resolveTranslations(space, lang, SPACE_TRANSLATION_FIELDS),
  );

  res.status(200).json({
    spaces: resolved,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

// Get single space by ID
export const getSpace = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id, 10);
  if (Number.isNaN(spaceId))
    return res.status(400).json({ message: "Invalid ID" });

  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    include: {
      category: true,
      venue: venueInclude,
      // PRODSVC-002: public endpoint must not leak host PII (email/phone).
      // Mirror the projection used by GET /spaces. Authenticated host/admin
      // surfaces that need the richer payload should use a separate endpoint.
      host: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          hostingSince: true,
        },
      },
      amenities: {
        include: {
          amenity: true,
        },
      },
      pricingTiers: { orderBy: { minutes: "asc" } },
      availability: true,
      blockedDates: {
        where: {
          date: { gte: new Date() },
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!space) {
    return res.status(404).json({ message: "Space not found" });
  }

  const lang = req.query.lang as string | undefined;

  // Get average rating
  const avgRating = await prisma.review.aggregate({
    where: { spaceId: space.id },
    _avg: { rating: true },
  });

  const reviewCount = await prisma.review.count({
    where: { spaceId: space.id },
  });

  const spaceWithRating = flattenVenue({
    ...space,
    averageRating: avgRating._avg.rating || 0,
    reviewCount,
  });

  res
    .status(200)
    .json(resolveTranslations(spaceWithRating, lang, SPACE_TRANSLATION_FIELDS));
};

// Create space (HOST only)
export const createSpace = async (req: Request, res: Response) => {
  const hostId = req.userId!;
  const { amenityIds, venueId, pricingTiers, availability, ...spaceData } =
    req.body;
  const availabilityResult = normalizeAvailability(availability);

  if ("message" in availabilityResult) {
    return res.status(400).json({ message: availabilityResult.message });
  }

  // PRODSVC-010: validate videoUrl via URL parser + host allowlist (not regex).
  if (!isValidYouTubeUrl(spaceData.videoUrl)) {
    return res
      .status(400)
      .json({ message: "videoUrl must be a valid YouTube URL" });
  }

  if (!venueId) {
    return res.status(400).json({ message: "venueId is required" });
  }
  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) {
    return res.status(400).json({ message: "Venue not found" });
  }
  if (venue.hostId !== hostId) {
    return res.status(403).json({ message: "Venue does not belong to you" });
  }

  // PRODSVC-009: pre-validate categorySlug so Prisma doesn't 500 on unknown
  // slugs and the client gets an actionable error.
  if (spaceData.categorySlug !== undefined) {
    if (typeof spaceData.categorySlug !== "string") {
      return res
        .status(400)
        .json({ message: "categorySlug must be a string" });
    }
    const normalizedSlug = normalizeCategorySlug(spaceData.categorySlug);
    const category = await prisma.spaceCategory.findUnique({
      where: { slug: normalizedSlug },
      select: { slug: true },
    });
    if (!category) {
      return res
        .status(400)
        .json({ message: `Unknown categorySlug: ${spaceData.categorySlug}` });
    }
  }

  // PRODSVC-004: wrap the fan-out writes (space + amenities + availability +
  // pricing tiers) in a single transaction so a failure in any leg rolls back
  // the parent Space row. Default isolation (READ COMMITTED) is sufficient for
  // a write-only fan-out — no retry loop required.
  //
  // S3 uploads are NOT included here. Image uploads happen via the dedicated
  // `POST /uploads/images` endpoint before this handler runs, so the only
  // S3 references reaching this code are URLs in `spaceData.images`. Rolling
  // back the DB on a Kafka or S3 failure cannot un-upload an object, so we
  // deliberately keep external side effects outside the transaction.
  // Location lives on Venue (see DB-010); no longer denormalised onto Space.
  const space = await prisma.$transaction(async (tx) => {
    const created = await tx.space.create({
      data: {
        ...buildCategoryPayload(spaceData),
        hostId,
        venueId,
        amenities: amenityIds
          ? {
              create: amenityIds.map((amenityId: number) => ({ amenityId })),
            }
          : undefined,
        availability: {
          create: availabilityResult.availability,
        },
      },
      include: {
        category: true,
        amenities: {
          include: { amenity: true },
        },
      },
    });

    if (Array.isArray(pricingTiers) && pricingTiers.length > 0) {
      await tx.pricingTier.createMany({
        data: pricingTiers.map(
          (tier: { minutes: number; label: string; price: number }) => ({
            spaceId: created.id,
            minutes: tier.minutes,
            label: tier.label,
            price: tier.price,
          }),
        ),
      });
    }

    return created;
  });

  // Emit Kafka AFTER the transaction commits — events are not transactional
  // and we must not announce a row that may still be rolled back.
  // TODO(KAFKA-001 follow-up): transactional outbox so downstream search
  // indexers are guaranteed to see the new space.
  try {
    await producer.send("space.created", { value: { id: space.id, hostId } });
  } catch (err) {
    console.error(
      "Failed to publish space.created event for space",
      space.id,
      "- space persisted but search/cache will be stale until reconciled:",
      err instanceof Error ? err.message : err
    );
  }

  res.status(201).json(space);
};

// Update space (HOST owner or ADMIN)
export const updateSpace = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id, 10);
  if (Number.isNaN(spaceId))
    return res.status(400).json({ message: "Invalid ID" });
  const userId = req.userId!;
  const userRole = req.user?.role;
  // Admin gets a blanket override only when NOT impersonating a host; otherwise
  // they must own the resource as the acting host.
  const adminOverride = userRole === "ADMIN" && req.actingHostId === undefined;

  const existingSpace = await prisma.space.findUnique({
    where: { id: spaceId },
  });

  if (!existingSpace) {
    return res.status(404).json({ message: "Space not found" });
  }

  if (existingSpace.hostId !== userId && !adminOverride) {
    return res
      .status(403)
      .json({ message: "Not authorized to update this space" });
  }

  const { amenityIds, venueId, pricingTiers, availability, ...body } = req.body;
  const availabilityResult =
    availability !== undefined ? normalizeAvailability(availability) : null;

  if (availabilityResult && "message" in availabilityResult) {
    return res.status(400).json({ message: availabilityResult.message });
  }

  // Whitelist allowed update fields to prevent mass assignment
  const allowed: Record<string, unknown> = {};
  const allowedKeys = [
    "name",
    "shortDescription",
    "description",
    "spaceType",
    "pricingType",
    "pricePerHour",
    "pricePerDay",
    "cleaningFee",
    "capacity",
    "minBookingHours",
    "maxBookingHours",
    "images",
    "isActive",
    "instantBook",
    "cancellationPolicy",
    "houseRules",
    "categorySlug",
    "currency",
    "nameTranslations",
    "shortDescTranslations",
    "descriptionTranslations",
    "videoUrl",
  ] as const;
  for (const key of allowedKeys) {
    if (body[key] !== undefined) allowed[key] = body[key];
  }

  // PRODSVC-010: validate videoUrl via URL parser + host allowlist (not regex).
  if (!isValidYouTubeUrl(allowed.videoUrl)) {
    return res
      .status(400)
      .json({ message: "videoUrl must be a valid YouTube URL" });
  }

  // If venueId is being changed, validate ownership
  if (venueId !== undefined && venueId !== existingSpace.venueId) {
    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) {
      return res.status(400).json({ message: "Venue not found" });
    }
    if (venue.hostId !== userId && !adminOverride) {
      return res.status(403).json({ message: "Venue does not belong to you" });
    }
    allowed.venueId = venueId;
    // Location now lives on Venue (DB-010); switching venues automatically updates
    // the location surfaced via flattenVenue() — no copy required.
  }

  // PRODSVC-009 + PRODSVC-018: validate categorySlug exists, and pass ONLY
  // whitelisted keys to buildCategoryPayload (which previously received the
  // full untouched body, allowing attackers to inject category-side fields).
  if (allowed.categorySlug !== undefined) {
    if (typeof allowed.categorySlug !== "string") {
      return res
        .status(400)
        .json({ message: "categorySlug must be a string" });
    }
    const normalizedSlug = normalizeCategorySlug(allowed.categorySlug);
    const category = await prisma.spaceCategory.findUnique({
      where: { slug: normalizedSlug },
      select: { slug: true },
    });
    if (!category) {
      return res
        .status(400)
        .json({ message: `Unknown categorySlug: ${allowed.categorySlug}` });
    }
    const resolved = buildCategoryPayload({
      categorySlug: allowed.categorySlug,
    });
    allowed.categorySlug = resolved.categorySlug;
    if (resolved.spaceType) {
      allowed.spaceType = resolved.spaceType;
    }
  }

  // PRODSVC-004: previously the parent `space.update` and each child
  // delete/createMany ran as independent transactions, so a failure in
  // (e.g.) pricingTiers would leave the Space row updated but the related
  // collections half-rewritten. Run the full mutation as one transaction
  // so any failure rolls every leg back.
  //
  // Kafka emission happens after commit (events are not transactional).
  const freshSpace = await prisma.$transaction(async (tx) => {
    await tx.space.update({
      where: { id: spaceId },
      data: allowed,
    });

    if (amenityIds !== undefined) {
      await tx.spaceAmenity.deleteMany({ where: { spaceId } });
      if (amenityIds.length > 0) {
        await tx.spaceAmenity.createMany({
          data: amenityIds.map((amenityId: number) => ({
            spaceId,
            amenityId,
          })),
        });
      }
    }

    if (pricingTiers !== undefined) {
      await tx.pricingTier.deleteMany({ where: { spaceId } });
      if (Array.isArray(pricingTiers) && pricingTiers.length > 0) {
        await tx.pricingTier.createMany({
          data: pricingTiers.map((t: any) => ({
            spaceId,
            minutes: t.minutes,
            label: t.label,
            price: t.price,
          })),
        });
      }
    }

    if (availabilityResult && "availability" in availabilityResult) {
      await tx.availability.deleteMany({ where: { spaceId } });
      await tx.availability.createMany({
        data: availabilityResult.availability.map((entry) => ({
          ...entry,
          spaceId,
        })),
      });
    }

    // Re-fetch inside the transaction so the response reflects committed
    // state (I2) atomically with the writes above.
    return tx.space.findUnique({
      where: { id: spaceId },
      include: {
        category: true,
        venue: venueInclude,
        amenities: { include: { amenity: true } },
        pricingTiers: { orderBy: { minutes: "asc" } },
        availability: { orderBy: { dayOfWeek: "asc" } },
      },
    });
  });

  // TODO(KAFKA-001 follow-up): transactional outbox.
  try {
    await producer.send("space.updated", { value: { id: spaceId } });
  } catch (err) {
    console.error(
      "Failed to publish space.updated event for space",
      spaceId,
      "- DB updated but search/cache will be stale until reconciled:",
      err instanceof Error ? err.message : err
    );
  }

  res.status(200).json(flattenVenue(freshSpace));
};

// Delete space (HOST owner or ADMIN)
export const deleteSpace = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id, 10);
  if (Number.isNaN(spaceId))
    return res.status(400).json({ message: "Invalid ID" });
  const userId = req.userId!;
  const userRole = req.user?.role;
  const adminOverride = userRole === "ADMIN" && req.actingHostId === undefined;

  const existingSpace = await prisma.space.findUnique({
    where: { id: spaceId },
  });

  if (!existingSpace) {
    return res.status(404).json({ message: "Space not found" });
  }

  if (existingSpace.hostId !== userId && !adminOverride) {
    return res
      .status(403)
      .json({ message: "Not authorized to delete this space" });
  }

  // Soft delete - just mark as inactive
  await prisma.space.update({
    where: { id: spaceId },
    data: { isActive: false },
  });

  // TODO(KAFKA-001 follow-up): transactional outbox.
  try {
    await producer.send("space.deleted", { value: { id: spaceId } });
  } catch (err) {
    console.error(
      "Failed to publish space.deleted event for space",
      spaceId,
      "- soft-deleted in DB but search/cache will not reflect deletion until reconciled:",
      err instanceof Error ? err.message : err
    );
  }

  res.status(200).json({ message: "Space deleted successfully" });
};

// Get host's own spaces
export const getMySpaces = async (req: Request, res: Response) => {
  const hostId = req.userId!;

  const limit = parsePositiveIntegerWithDefault(
    req.query.limit,
    SPACE_LIST_DEFAULT_LIMIT,
    SPACE_LIST_MAX_LIMIT
  );
  if (limit === null) {
    return res.status(400).json({ message: "Invalid limit" });
  }
  const page = parsePositiveIntegerWithDefault(req.query.page, 1);
  if (page === null) {
    return res.status(400).json({ message: "Invalid page" });
  }

  const spaces = await prisma.space.findMany({
    where: { hostId },
    include: {
      category: true,
      venue: venueInclude,
      pricingTiers: { orderBy: { minutes: "asc" } },
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  });

  res.status(200).json(spaces.map(flattenVenue));
};

// Get/Update space availability
export const getAvailability = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id, 10);
  if (Number.isNaN(spaceId))
    return res.status(400).json({ message: "Invalid ID" });

  const availability = await prisma.availability.findMany({
    where: { spaceId },
    orderBy: { dayOfWeek: "asc" },
  });

  const blockedDates = await prisma.blockedDate.findMany({
    where: {
      spaceId,
      date: { gte: new Date() },
    },
    orderBy: { date: "asc" },
  });

  res.status(200).json({ availability, blockedDates });
};

export const updateAvailability = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id, 10);
  if (Number.isNaN(spaceId))
    return res.status(400).json({ message: "Invalid ID" });
  const userId = req.userId!;
  const { availability, blockedDates } = req.body;

  const space = await prisma.space.findUnique({
    where: { id: spaceId },
  });

  if (!space) {
    return res.status(404).json({ message: "Space not found" });
  }

  const adminOverride = req.user?.role === "ADMIN" && req.actingHostId === undefined;
  if (space.hostId !== userId && !adminOverride) {
    return res.status(403).json({ message: "Not authorized" });
  }

  // PRODSVC-001: validate availability the same way create/update do, so
  // verified hosts can't corrupt the availability table with bogus
  // dayOfWeek/time payloads that break subsequent bookings.
  let normalizedAvailability: AvailabilityInput[] | null = null;
  if (availability !== undefined) {
    const availabilityResult = normalizeAvailability(availability);
    if ("message" in availabilityResult) {
      return res.status(400).json({ message: availabilityResult.message });
    }
    normalizedAvailability = availabilityResult.availability;
  }

  // PRODSVC-001: validate blocked dates before writing — `new Date("bogus")`
  // silently produces an Invalid Date and Prisma would reject (500) or, worse,
  // store NaN. Reject with 400 on any malformed date entry.
  let normalizedBlockedDates: { date: Date; reason: string | null }[] | null =
    null;
  if (blockedDates !== undefined) {
    if (!Array.isArray(blockedDates)) {
      return res
        .status(400)
        .json({ message: "blockedDates must be an array" });
    }
    const out: { date: Date; reason: string | null }[] = [];
    for (const entry of blockedDates) {
      if (!entry || typeof entry !== "object") {
        return res
          .status(400)
          .json({ message: "blockedDates entries must be objects" });
      }
      const rawDate = (entry as { date?: unknown }).date;
      if (!isDateOnlyOrIsoDate(rawDate)) {
        return res
          .status(400)
          .json({ message: "blockedDates.date must be a valid date" });
      }
      const rawReason = (entry as { reason?: unknown }).reason;
      out.push({
        date: new Date(rawDate as string),
        reason: typeof rawReason === "string" ? rawReason : null,
      });
    }
    normalizedBlockedDates = out;
  }

  // Update availability
  if (normalizedAvailability) {
    await prisma.$transaction([
      prisma.availability.deleteMany({ where: { spaceId } }),
      prisma.availability.createMany({
        data: normalizedAvailability.map((a) => ({
          spaceId,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          isOpen: a.isOpen,
        })),
      }),
    ]);
  }

  // Update blocked dates
  if (normalizedBlockedDates) {
    await prisma.$transaction([
      prisma.blockedDate.deleteMany({
        where: {
          spaceId,
          date: { gte: new Date() },
        },
      }),
      ...(normalizedBlockedDates.length > 0
        ? [
            prisma.blockedDate.createMany({
              data: normalizedBlockedDates.map((d) => ({
                spaceId,
                date: d.date,
                reason: d.reason,
              })),
            }),
          ]
        : []),
    ]);
  }

  // PRODSVC-013: notify downstream consumers (search reindexer, client
  // cache invalidation) that the space has changed. Without this they
  // serve stale availability after a host updates their schedule. Match
  // the fire-and-forget pattern used by createSpace/updateSpace/deleteSpace
  // in this file — kafka durability is handled inside the producer.
  producer.send("space.updated", { value: { id: spaceId } });

  res.status(200).json({ message: "Availability updated" });
};

// Check availability for specific dates
export const checkAvailability = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parsePositiveInteger(id);
  if (spaceId === null) return res.status(400).json({ message: "Invalid ID" });
  const { startDate, endDate } = req.body;

  if (!isDateOnlyOrIsoDate(startDate)) {
    return res.status(400).json({ message: "startDate must be a valid date" });
  }
  if (!isDateOnlyOrIsoDate(endDate)) {
    return res.status(400).json({ message: "endDate must be a valid date" });
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) {
    return res
      .status(400)
      .json({ message: "endDate must be on or after startDate" });
  }
  // PRODSVC-017: cap the range to 90 days. Without this an unauth caller
  // can ask for a multi-year window and force a full scan of the
  // availability/booking rows. Gateway-level rate limiting is separate.
  const MAX_RANGE_DAYS = 90;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const rangeDays = Math.ceil(
    (end.getTime() - start.getTime()) / MS_PER_DAY,
  );
  if (rangeDays > MAX_RANGE_DAYS) {
    return res.status(400).json({
      message: `Date range must be ${MAX_RANGE_DAYS} days or fewer`,
    });
  }

  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    include: {
      availability: true,
      blockedDates: true,
    },
  });

  if (!space) {
    return res.status(404).json({ message: "Space not found" });
  }

  // Check blocked dates
  const blockedInRange = space.blockedDates.filter((bd) => {
    const bdDate = new Date(bd.date);
    return bdDate >= start && bdDate <= end;
  });

  if (blockedInRange.length > 0) {
    return res.status(200).json({
      available: false,
      reason: "Some dates are blocked",
      blockedDates: blockedInRange,
    });
  }

  // Check existing bookings
  const conflictingBookings = await prisma.booking.findMany({
    where: {
      spaceId,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
      OR: [
        {
          startDate: { lte: end },
          endDate: { gte: start },
        },
      ],
    },
  });

  if (conflictingBookings.length > 0) {
    return res.status(200).json({
      available: false,
      reason: "Dates conflict with existing bookings",
    });
  }

  res.status(200).json({ available: true });
};
