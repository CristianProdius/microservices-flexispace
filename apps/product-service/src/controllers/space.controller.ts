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
    // Listing badges — surfaced so the public cards can show a "Recommended"
    // badge and so the `featured` sort can tier by them (see getSpaces orderBy).
    venueRecommended: true,
    venueSponsored: true,
    venueVerificationStatus: true,
  },
};

// Shared by the deleteSpace booking guard and its P2003 race backstop.
const SPACE_HAS_BOOKINGS_MESSAGE =
  "This space has existing bookings and can't be deleted. Deactivate it instead to hide it from listings while preserving booking history.";

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

// AUD-008: pricing tiers come in over a JSON body with no schema validation
// at the route level, so callers can sneak zero or negative `minutes` /
// `price`, NaN, oversized arrays, or empty labels into the DB. Cap the count
// so a buggy/abusive client can't fan out a thousand tiers per space.
const PRICING_TIER_MAX_COUNT = 20;
const PRICING_TIER_LABEL_MAX_LENGTH = 80;
const PRICING_TIER_COMMENT_MAX_LENGTH = 300;

export type PricingTierInput = {
  minutes: number;
  label: string;
  price: number;
  comment?: string;
};

export const validatePricingTiers = (
  tiers: unknown,
):
  | { ok: true; value: PricingTierInput[] }
  | { ok: false; message: string } => {
  if (!Array.isArray(tiers)) {
    return { ok: false, message: "pricingTiers must be an array" };
  }
  if (tiers.length > PRICING_TIER_MAX_COUNT) {
    return {
      ok: false,
      message: `pricingTiers must contain at most ${PRICING_TIER_MAX_COUNT} entries`,
    };
  }
  const value: PricingTierInput[] = [];
  for (const raw of tiers) {
    if (!raw || typeof raw !== "object") {
      return { ok: false, message: "pricingTiers entries must be objects" };
    }
    const minutes = (raw as { minutes?: unknown }).minutes;
    const price = (raw as { price?: unknown }).price;
    const label = (raw as { label?: unknown }).label;
    if (!Number.isInteger(minutes) || (minutes as number) <= 0) {
      return {
        ok: false,
        message: "pricingTiers.minutes must be a positive integer",
      };
    }
    // M6 (product side): reject price <= 0, not just < 0. A zero-price tier
    // poisons the downstream Math.min subtotal (order-service) so a "first hour
    // free" tier bills only the cleaning fee for any duration. A tier must cost
    // something positive; hosts wanting a free space should not publish a tier.
    // Floor at 0.01 so a sub-cent price can't round to a $0.00 booking charge.
    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0.01
    ) {
      return {
        ok: false,
        message: "pricingTiers.price must be a finite number >= 0.01",
      };
    }
    if (typeof label !== "string") {
      return { ok: false, message: "pricingTiers.label must be a string" };
    }
    const trimmedLabel = label.trim();
    if (trimmedLabel.length === 0) {
      return {
        ok: false,
        message: "pricingTiers.label must not be empty",
      };
    }
    if (label.length > PRICING_TIER_LABEL_MAX_LENGTH) {
      return {
        ok: false,
        message: `pricingTiers.label must be at most ${PRICING_TIER_LABEL_MAX_LENGTH} characters`,
      };
    }
    // Optional free-text comment. When present it must be a string capped at
    // 300 chars; empty/whitespace-only is treated as absent (undefined) so an
    // empty box in the form doesn't persist a blank comment.
    const commentRaw = (raw as { comment?: unknown }).comment;
    let comment: string | undefined;
    if (commentRaw !== undefined && commentRaw !== null) {
      if (typeof commentRaw !== "string") {
        return {
          ok: false,
          message: "pricingTiers.comment must be a string",
        };
      }
      if (commentRaw.length > PRICING_TIER_COMMENT_MAX_LENGTH) {
        return {
          ok: false,
          message: `pricingTiers.comment must be at most ${PRICING_TIER_COMMENT_MAX_LENGTH} characters`,
        };
      }
      const trimmedComment = commentRaw.trim();
      comment = trimmedComment.length > 0 ? trimmedComment : undefined;
    }
    value.push({
      minutes: minutes as number,
      label: trimmedLabel,
      price,
      comment,
    });
  }
  return { ok: true, value };
};

// Monthly plans: a MONTHLY space may offer several named subscription plans
// (name + pricePerMonth + optional description), and a booking references the
// chosen plan. Like pricingTiers, these arrive over an unvalidated JSON body,
// so mirror validatePricingTiers' guards (array, count cap, per-entry rules).
// Values match the @repo/types monthlyPlanInputSchema (name <= 60, price >=
// 0.01, description <= 300) but are inline-validated here to stay consistent
// with validatePricingTiers and avoid a runtime dependency on @repo/types.
const MONTHLY_PLANS_MAX_COUNT = 20;
const MONTHLY_PLAN_NAME_MAX_LENGTH = 60;
const MONTHLY_PLAN_DESCRIPTION_MAX_LENGTH = 300;

export type MonthlyPlanInput = {
  name: string;
  pricePerMonth: number;
  description?: string;
};

export const validateMonthlyPlans = (
  plans: unknown,
):
  | { ok: true; value: MonthlyPlanInput[] }
  | { ok: false; message: string } => {
  if (!Array.isArray(plans)) {
    return { ok: false, message: "monthlyPlans must be an array" };
  }
  if (plans.length > MONTHLY_PLANS_MAX_COUNT) {
    return {
      ok: false,
      message: `monthlyPlans must contain at most ${MONTHLY_PLANS_MAX_COUNT} entries`,
    };
  }
  const value: MonthlyPlanInput[] = [];
  for (const raw of plans) {
    if (!raw || typeof raw !== "object") {
      return { ok: false, message: "monthlyPlans entries must be objects" };
    }
    const name = (raw as { name?: unknown }).name;
    const pricePerMonth = (raw as { pricePerMonth?: unknown }).pricePerMonth;
    if (typeof name !== "string") {
      return { ok: false, message: "monthlyPlans.name must be a string" };
    }
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return { ok: false, message: "monthlyPlans.name must not be empty" };
    }
    if (trimmedName.length > MONTHLY_PLAN_NAME_MAX_LENGTH) {
      return {
        ok: false,
        message: `monthlyPlans.name must be at most ${MONTHLY_PLAN_NAME_MAX_LENGTH} characters`,
      };
    }
    // Floor at 0.01 so a sub-cent price can't round to a $0.00 monthly charge.
    if (
      typeof pricePerMonth !== "number" ||
      !Number.isFinite(pricePerMonth) ||
      pricePerMonth < 0.01
    ) {
      return {
        ok: false,
        message: "monthlyPlans.pricePerMonth must be a finite number >= 0.01",
      };
    }
    // Optional description: string capped at 300 chars; empty/whitespace-only
    // is treated as absent (undefined) so a blank form box doesn't persist.
    const descriptionRaw = (raw as { description?: unknown }).description;
    let description: string | undefined;
    if (descriptionRaw !== undefined && descriptionRaw !== null) {
      if (typeof descriptionRaw !== "string") {
        return {
          ok: false,
          message: "monthlyPlans.description must be a string",
        };
      }
      if (descriptionRaw.length > MONTHLY_PLAN_DESCRIPTION_MAX_LENGTH) {
        return {
          ok: false,
          message: `monthlyPlans.description must be at most ${MONTHLY_PLAN_DESCRIPTION_MAX_LENGTH} characters`,
        };
      }
      const trimmedDescription = descriptionRaw.trim();
      description =
        trimmedDescription.length > 0 ? trimmedDescription : undefined;
    }
    value.push({ name: trimmedName, pricePerMonth, description });
  }
  // Reject duplicate plan names up front so we return a clean 400 instead of
  // letting the DB's @@unique([spaceId, name]) constraint blow up the
  // createMany with a P2002 (opaque 409/500). Compare trimmed names
  // case-sensitively to match the constraint's exact semantics.
  const seenNames = new Set<string>();
  for (const plan of value) {
    if (seenNames.has(plan.name)) {
      return {
        ok: false,
        message: "monthlyPlans.name values must be unique",
      };
    }
    seenNames.add(plan.name);
  }
  return { ok: true, value };
};

// H2: validate the numeric base-rate fields before they reach Prisma. The DB
// columns are unconstrained `Float?`, so without this a host could persist a
// negative pricePerHour/pricePerDay/cleaningFee and drive a booking total
// negative (platform credits the guest), or a zero/negative capacity /
// non-ordered booking-hour bounds. Only the money/count fields copied out of
// SPACE_WRITE_KEYS are checked here; non-numeric fields are left untouched.
// `spaceData` is the already-whitelisted object (create) or `allowed` (update),
// so we only ever see fields the caller is permitted to write.
const validateSpaceNumericFields = (
  data: Record<string, unknown>,
  // On a partial update, the stored row's current min/max so the cross-field
  // check uses the effective post-update values, not just the ones in this body.
  existing?: { minBookingHours?: number | null; maxBookingHours?: number | null },
): { message: string } | null => {
  // A `null` clears a nullable column (blank hourly/daily rate, cleared cap) —
  // treat it like "not provided" and skip, same as `undefined`. Only a wrong
  // TYPE or a non-positive/out-of-range value is an error. (Regression guard:
  // the admin form always posts pricePerHour/pricePerDay as `number | null`.)
  const isAbsent = (v: unknown) => v === undefined || v === null;

  // pricePerHour / pricePerDay: a base rate that, when present, must be a finite
  // number >= 0. A host may deliberately set it to 0 to list the space as
  // "Contact for pricing": the public site renders that label (getPriceDisplay
  // treats a 0/falsy rate as unpriced) and the order-service fails closed on a
  // zero-candidate price set, so a 0-rate space can never be booked at $0.
  // Negative or non-finite is still invalid. A space priced only via
  // pricingTiers simply leaves these null.
  for (const key of ["pricePerHour", "pricePerDay"] as const) {
    const raw = data[key];
    if (isAbsent(raw)) continue;
    if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) {
      return { message: `${key} must be a finite number >= 0` };
    }
  }

  // pricePerMonth backs a monthly booking (a full-day date-range priced per
  // calendar month, pro-rated for the remainder). Like the hourly/daily rates it
  // may be 0 (a request-to-book / free listing); only negative or non-finite is
  // invalid. A blank field (null) means monthly isn't offered.
  if (!isAbsent(data.pricePerMonth)) {
    const raw = data.pricePerMonth;
    if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) {
      return { message: "pricePerMonth must be a finite number >= 0" };
    }
  }

  // cleaningFee: finite number >= 0 (0 is a legitimate "no cleaning fee").
  if (!isAbsent(data.cleaningFee)) {
    const fee = data.cleaningFee;
    if (typeof fee !== "number" || !Number.isFinite(fee) || fee < 0) {
      return { message: "cleaningFee must be a finite number >= 0" };
    }
  }

  // capacity: positive integer when present.
  if (!isAbsent(data.capacity)) {
    const capacity = data.capacity;
    if (
      typeof capacity !== "number" ||
      !Number.isInteger(capacity) ||
      capacity <= 0
    ) {
      return { message: "capacity must be a positive integer" };
    }
  }

  // minBookingHours / maxBookingHours: positive integers when present, and the
  // effective min must not exceed the effective max (merging in the stored
  // values so a partial update that sets only one side is still validated).
  for (const key of ["minBookingHours", "maxBookingHours"] as const) {
    const raw = data[key];
    if (isAbsent(raw)) continue;
    if (typeof raw !== "number" || !Number.isInteger(raw) || raw <= 0) {
      return { message: `${key} must be a positive integer` };
    }
  }
  const effMin = !isAbsent(data.minBookingHours)
    ? (data.minBookingHours as number)
    : existing?.minBookingHours;
  const effMax = !isAbsent(data.maxBookingHours)
    ? (data.maxBookingHours as number)
    : existing?.maxBookingHours;
  if (
    typeof effMin === "number" &&
    typeof effMax === "number" &&
    effMin > effMax
  ) {
    return { message: "minBookingHours must be <= maxBookingHours" };
  }

  return null;
};

// LOW: amenityIds arrives untrusted from the body and is `.map()`'d
// unconditionally into SpaceAmenity rows. Require an array of distinct positive
// integers (capped) so a malformed/oversized payload can't 500 Prisma or fan
// out thousands of join rows. Mirrors validatePricingTiers' shape.
const AMENITY_IDS_MAX_COUNT = 50;

export const validateAmenityIds = (
  amenityIds: unknown,
): { ok: true; value: number[] } | { ok: false; message: string } => {
  if (!Array.isArray(amenityIds)) {
    return { ok: false, message: "amenityIds must be an array" };
  }
  if (amenityIds.length > AMENITY_IDS_MAX_COUNT) {
    return {
      ok: false,
      message: `amenityIds must contain at most ${AMENITY_IDS_MAX_COUNT} entries`,
    };
  }
  const seen = new Set<number>();
  for (const raw of amenityIds) {
    if (typeof raw !== "number" || !Number.isInteger(raw) || raw <= 0) {
      return {
        ok: false,
        message: "amenityIds must be positive integers",
      };
    }
    if (seen.has(raw)) {
      return { ok: false, message: "amenityIds must be distinct" };
    }
    seen.add(raw);
  }
  return { ok: true, value: Array.from(seen) };
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
  // PRODSVC-021: `featured` orders by listing badges (sponsored → recommended →
  // verified) at the venue then host level, falling back to newest. It needs a
  // multi-key relation orderBy that the scalar SORT_FIELDS path can't express,
  // so we flag it here and build the array form below.
  let sortByFeatured = false;

  if (sortParam) {
    switch (sortParam) {
      case "newest":
        resolvedSortBy = "createdAt";
        resolvedSortOrder = "desc";
        break;
      case "featured":
        sortByFeatured = true;
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
  // AUD-026: clients that use the verbose ?sortBy=averageRating&sortOrder=...
  // form previously fell through to the SORT_FIELDS whitelist (which only
  // contains real Prisma columns) and silently degraded to createdAt. Detect
  // the synonym here so it routes into the same raw SQL branch as
  // sort=rating. Don't add it to SORT_FIELDS — Prisma's orderBy can't handle
  // a computed avg(reviews.rating). sortOrder is still honored below.
  // An explicit sort=featured wins over a co-supplied sortBy=averageRating: the
  // featured array orderBy below must not be silently swapped for the raw-SQL
  // rating path, which would drop the badge tiers without any error.
  if (
    !sortByFeatured &&
    (resolvedSortBy === "averageRating" || resolvedSortBy === "rating")
  ) {
    sortByRating = true;
    resolvedSortBy = "createdAt"; // fallback for SORT_FIELDS check; the
    // sortByRating branch takes precedence and ignores this.
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

  // LOW: guard string-only query params. Express parses ?city=a&city=b into an
  // array and ?categorySlug[not]=x into a nested object; casting either `as
  // string` previously 500'd Prisma (array reaches `contains`) or injected a
  // filter operator (object reshuffles the public listing). Accept a plain
  // string only, else skip the filter — mirrors the spaceType/currency guards.
  const cityFilter = typeof city === "string" ? city : undefined;
  const categorySlugFilter =
    typeof categorySlug === "string" ? categorySlug : undefined;
  const groupSlugFilter = typeof groupSlug === "string" ? groupSlug : undefined;

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
    // AUD-007: hide spaces whose host has been soft-deleted from public lists
    // so the (former) host's PII (name/image/bio) doesn't leak via the host
    // include below. Layered on top of any venue/bbox filter further down.
    host: { deletedAt: null },
    // M11: a soft-deleted venue (isActive:false) must not surface its
    // still-active spaces in public search — otherwise a deactivated venue's
    // spaces keep appearing and republish its location. Always require
    // venue.isActive, merged with any existing city/bbox venue predicate.
    venue: hasValidBbox
      ? {
          isActive: true,
          ...(cityFilter
            ? {
                city: {
                  contains: cityFilter,
                  mode: "insensitive" as const,
                },
              }
            : {}),
          latitude: { gte: bbox.swLat, lte: bbox.neLat },
          longitude: { gte: bbox.swLng, lte: bbox.neLng },
        }
      : cityFilter
        ? {
            isActive: true,
            city: { contains: cityFilter, mode: "insensitive" as const },
          }
        : { isActive: true },
    ...(resolvedSpaceType && { spaceType: resolvedSpaceType }),
    ...(categorySlugFilter && { categorySlug: categorySlugFilter }),
    ...(groupSlugFilter && {
      category: { is: { groupSlug: groupSlugFilter } },
    }),
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

  // Featured tiers by venue badges first, then the host's account-level badges,
  // so an admin can promote one venue without lifting every venue from that
  // host. Mirrors the ordering used by getVenuesList (venue.controller.ts).
  const orderBy:
    | Prisma.SpaceOrderByWithRelationInput
    | Prisma.SpaceOrderByWithRelationInput[] = sortByFeatured
    ? [
        { venue: { venueSponsored: "desc" } },
        { host: { hostSponsored: "desc" } },
        { venue: { venueRecommended: "desc" } },
        { host: { hostRecommended: "desc" } },
        // Verified BADGE tier (enum UNVERIFIED < VERIFIED, so `desc` = VERIFIED
        // first) — the public badge status, not the `hostVerified` auth flag.
        { venue: { venueVerificationStatus: "desc" } },
        { host: { hostVerificationStatus: "desc" } },
        { host: { hostingSince: "asc" } },
        { createdAt: "desc" },
      ]
    : { [resolvedSortBy]: resolvedSortOrder };

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
    monthlyPlans: {
      orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }],
    },
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
    // AUD-026: honor sortOrder=asc as well; use NULLS LAST/FIRST consistently
    // so unrated spaces always sink to the bottom regardless of direction.
    const candidateIdRows = await prisma.space.findMany({
      where,
      select: { id: true },
    });
    total = candidateIdRows.length;
    const candidateIds = candidateIdRows.map((row) => row.id);

    let orderedIds: number[] = [];
    if (candidateIds.length > 0) {
      const ascending = resolvedSortOrder === "asc";
      const rows = ascending
        ? await prisma.$queryRaw<
            Array<{ id: number }>
          >`SELECT s."id" AS id
            FROM "Space" s
            LEFT JOIN "Review" r ON r."spaceId" = s."id"
            WHERE s."id" IN (${Prisma.join(candidateIds)})
            GROUP BY s."id"
            ORDER BY AVG(r."rating") ASC NULLS LAST, s."id" ASC
            LIMIT ${limitNum} OFFSET ${skip}`
        : await prisma.$queryRaw<
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
      // AUD-B6: emit under `totalReviews` (the @repo/types Space key every
      // frontend reads); the old `reviewCount` key was silently ignored so
      // counts always rendered 0.
      totalReviews: rating.count,
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

  // AUD-007: this route is public. If the host has been soft-deleted
  // (deletedAt not null) we must return 404 so the included `host` block
  // doesn't leak the (former) host's name/bio/image via a direct link.
  // findFirst + relation filter never returns the row in that case; we
  // 404 with the same generic message used for missing spaces so deletion
  // isn't a side channel.
  // M11: the same generic 404 must also cover a host-deactivated space
  // (isActive:false) and a soft-deleted venue's spaces (venue.isActive:false)
  // so the public detail page never serves a hidden listing or leaks its
  // existence. These predicates live in the where clause so the row simply
  // never comes back — no separate branch that could diverge.
  const space = await prisma.space.findFirst({
    where: {
      id: spaceId,
      isActive: true,
      host: { deletedAt: null },
      venue: { isActive: true },
    },
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
          username: true,
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
      monthlyPlans: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
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
    // AUD-B6: emit under `totalReviews` to match the @repo/types Space key the
    // frontends read; `reviewCount` was ignored and rendered 0.
    totalReviews: reviewCount,
  });

  res
    .status(200)
    .json(resolveTranslations(spaceWithRating, lang, SPACE_TRANSLATION_FIELDS));
};

// Shared whitelist used by both create and update paths to guard against
// "Unknown argument" Prisma errors when an old client posts a stale payload
// (e.g. fields like `address/city/country` that DB-010 moved off Space onto
// Venue), and as defense-in-depth against mass-assignment of model fields
// like `hostId` from the request body. Mirrors updateSpace's allowedKeys.
const SPACE_WRITE_KEYS = [
  "name",
  "shortDescription",
  "description",
  "spaceType",
  "pricingType",
  "pricePerHour",
  "pricePerDay",
  "pricePerMonth",
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

// Create space (HOST only)
export const createSpace = async (req: Request, res: Response) => {
  const hostId = req.userId!;
  const { amenityIds, venueId, pricingTiers, monthlyPlans, availability } =
    req.body;
  // Whitelist-pluck so a stale payload with location fields (or any other
  // non-whitelisted property) can't reach `tx.space.create` and trigger
  // "Unknown argument" 500s. See updateSpace for the same pattern. Typed as
  // `any` to satisfy Prisma's strict SpaceCreateInput shape — runtime
  // validation (categorySlug, videoUrl, tiers, availability) happens below.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spaceData: any = {};
  for (const key of SPACE_WRITE_KEYS) {
    if (req.body[key] !== undefined) spaceData[key] = req.body[key];
  }
  const availabilityResult = normalizeAvailability(availability);

  if ("message" in availabilityResult) {
    return res.status(400).json({ message: availabilityResult.message });
  }

  // H2: validate the whitelisted numeric base rates before they reach Prisma.
  const numericError = validateSpaceNumericFields(spaceData);
  if (numericError) {
    return res.status(400).json({ message: numericError.message });
  }
  // AUD-008 (monthly plans): validate the monthly plans array before opening a
  // transaction, mirroring pricingTiers. Needed here so the relaxed MONTHLY
  // check below can count valid plans.
  let normalizedMonthlyPlans: MonthlyPlanInput[] | null = null;
  if (monthlyPlans !== undefined) {
    const planResult = validateMonthlyPlans(monthlyPlans);
    if (!planResult.ok) {
      return res.status(400).json({ message: planResult.message });
    }
    normalizedMonthlyPlans = planResult.value;
  }

  // Flexible pricing: a space may offer any combination of hourly/daily/monthly
  // rates (each optional) or none at all — an unpriced space simply lists as
  // "Contact for pricing" on the public site. No single-type minimum is enforced;
  // the per-rate numeric checks above still apply.

  // LOW: validate amenityIds (untrusted array from the body) before it's
  // `.map()`'d into join rows in the transaction below.
  let normalizedAmenityIds: number[] | null = null;
  if (amenityIds !== undefined) {
    const amenityResult = validateAmenityIds(amenityIds);
    if (!amenityResult.ok) {
      return res.status(400).json({ message: amenityResult.message });
    }
    normalizedAmenityIds = amenityResult.value;
  }

  // PRODSVC-010: validate videoUrl via URL parser + host allowlist (not regex).
  if (!isValidYouTubeUrl(spaceData.videoUrl)) {
    return res
      .status(400)
      .json({ message: "videoUrl must be a valid YouTube URL" });
  }

  // AUD-008: validate pricing tiers before opening a transaction. Reject
  // zero/negative minutes & negative prices so hosts can't accidentally
  // (or maliciously) publish a "1 minute for free" tier.
  let normalizedPricingTiers: PricingTierInput[] | null = null;
  if (pricingTiers !== undefined) {
    const tierResult = validatePricingTiers(pricingTiers);
    if (!tierResult.ok) {
      return res.status(400).json({ message: tierResult.message });
    }
    normalizedPricingTiers = tierResult.value;
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
  // M11: refuse to attach a new active space to a soft-deleted venue
  // (isActive:false). Otherwise a host republishes the deactivated venue's
  // location under a fresh listing that public search/detail would serve.
  if (!venue.isActive) {
    return res
      .status(400)
      .json({ message: "Cannot add a space to a deactivated venue" });
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
        amenities: normalizedAmenityIds
          ? {
              create: normalizedAmenityIds.map((amenityId) => ({ amenityId })),
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

    if (normalizedPricingTiers && normalizedPricingTiers.length > 0) {
      await tx.pricingTier.createMany({
        data: normalizedPricingTiers.map((tier) => ({
          spaceId: created.id,
          minutes: tier.minutes,
          label: tier.label,
          price: tier.price,
          comment: tier.comment,
        })),
      });
    }

    // Monthly plans can be attached to any space type: a space may offer named
    // monthly subscriptions alongside hourly/daily pricing (e.g. a coworking
    // space bookable by the hour AND by monthly membership). Persist them (with
    // sortOrder = array index) when the payload provides at least one plan.
    if (normalizedMonthlyPlans && normalizedMonthlyPlans.length > 0) {
      await tx.monthlyPlan.createMany({
        data: normalizedMonthlyPlans.map((plan, index) => ({
          spaceId: created.id,
          name: plan.name,
          pricePerMonth: plan.pricePerMonth,
          description: plan.description,
          sortOrder: index,
        })),
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

  const { amenityIds, venueId, pricingTiers, monthlyPlans, availability, ...body } =
    req.body;
  const availabilityResult =
    availability !== undefined ? normalizeAvailability(availability) : null;

  if (availabilityResult && "message" in availabilityResult) {
    return res.status(400).json({ message: availabilityResult.message });
  }

  // AUD-008: validate pricing tiers up front so we don't open a transaction
  // and delete the existing tiers before discovering the new payload is
  // garbage.
  let normalizedPricingTiers: PricingTierInput[] | null = null;
  if (pricingTiers !== undefined) {
    const tierResult = validatePricingTiers(pricingTiers);
    if (!tierResult.ok) {
      return res.status(400).json({ message: tierResult.message });
    }
    normalizedPricingTiers = tierResult.value;
  }

  // AUD-008 (monthly plans): validate the monthly plans array up front, before
  // opening a transaction, so we don't delete the existing plans and then
  // discover the new payload is garbage.
  let normalizedMonthlyPlans: MonthlyPlanInput[] | null = null;
  if (monthlyPlans !== undefined) {
    const planResult = validateMonthlyPlans(monthlyPlans);
    if (!planResult.ok) {
      return res.status(400).json({ message: planResult.message });
    }
    normalizedMonthlyPlans = planResult.value;
  }

  // LOW: validate amenityIds (untrusted array from the body) before the
  // deleteMany/createMany rewrite in the transaction below.
  let normalizedAmenityIds: number[] | null = null;
  if (amenityIds !== undefined) {
    const amenityResult = validateAmenityIds(amenityIds);
    if (!amenityResult.ok) {
      return res.status(400).json({ message: amenityResult.message });
    }
    normalizedAmenityIds = amenityResult.value;
  }

  // Whitelist allowed update fields to prevent mass assignment. Shared with
  // createSpace via SPACE_WRITE_KEYS so the two paths can't drift.
  const allowed: Record<string, unknown> = {};
  for (const key of SPACE_WRITE_KEYS) {
    if (body[key] !== undefined) allowed[key] = body[key];
  }

  // H2: validate the whitelisted numeric base rates before they reach Prisma.
  // Pass the stored min/max so a partial update setting only one side can't
  // persist an inconsistent min > max window.
  const numericError = validateSpaceNumericFields(allowed, {
    minBookingHours: existingSpace.minBookingHours,
    maxBookingHours: existingSpace.maxBookingHours,
  });
  if (numericError) {
    return res.status(400).json({ message: numericError.message });
  }
  // Flexible pricing (see createSpace): no single-type minimum — a space may
  // offer any combination of rates or none (listing as "Contact for pricing").

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

    if (normalizedAmenityIds !== null) {
      await tx.spaceAmenity.deleteMany({ where: { spaceId } });
      if (normalizedAmenityIds.length > 0) {
        await tx.spaceAmenity.createMany({
          data: normalizedAmenityIds.map((amenityId) => ({
            spaceId,
            amenityId,
          })),
        });
      }
    }

    if (normalizedPricingTiers !== null) {
      await tx.pricingTier.deleteMany({ where: { spaceId } });
      if (normalizedPricingTiers.length > 0) {
        await tx.pricingTier.createMany({
          data: normalizedPricingTiers.map((t) => ({
            spaceId,
            minutes: t.minutes,
            label: t.label,
            price: t.price,
            comment: t.comment,
          })),
        });
      }
    }

    // Monthly plans can be attached to any space type. When the payload provides
    // a monthlyPlans array, replace the space's plans with it (deleteMany then
    // createMany, sortOrder = index); an empty array clears them. When the field
    // is omitted (null), leave existing plans untouched — mirrors pricingTiers.
    if (normalizedMonthlyPlans !== null) {
      await tx.monthlyPlan.deleteMany({ where: { spaceId } });
      if (normalizedMonthlyPlans.length > 0) {
        await tx.monthlyPlan.createMany({
          data: normalizedMonthlyPlans.map((plan, index) => ({
            spaceId,
            name: plan.name,
            pricePerMonth: plan.pricePerMonth,
            description: plan.description,
            sortOrder: index,
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
        monthlyPlans: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
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

  // PRODSVC-022: "Delete" must actually remove the space, not just flip
  // isActive=false. The old soft delete left the row in place, and getMySpaces
  // (below) returns every hostId row regardless of isActive, so a "deleted"
  // space kept reappearing as an inactive listing and could never be removed.
  //
  // Hard delete is safe for spaces with no booking history: SpaceAmenity,
  // PricingTier, Availability, BlockedDate and Review all cascade
  // (schema.prisma onDelete: Cascade). The Booking relation does NOT cascade
  // (onDelete defaults to Restrict) so historical bookings are preserved — a
  // space that has bookings can't be hard-deleted; we return 409 with a clear
  // reason instead of letting Prisma throw an opaque FK error.
  const bookingCount = await prisma.booking.count({ where: { spaceId } });
  if (bookingCount > 0) {
    return res
      .status(409)
      .json({ message: SPACE_HAS_BOOKINGS_MESSAGE, code: "SPACE_HAS_BOOKINGS", bookingCount });
  }

  try {
    await prisma.space.delete({ where: { id: spaceId } });
  } catch (err) {
    // TOCTOU backstop: the count above and this delete are not atomic, so a
    // booking can land in the gap (order-service writes to the same DB). The
    // Booking->Space FK is onDelete: Restrict, so that race surfaces as a
    // Prisma P2003. Map it to the same friendly 409 the count guard returns
    // instead of leaking the generic "invalid foreign key" error to the host.
    if ((err as { code?: string })?.code === "P2003") {
      return res
        .status(409)
        .json({ message: SPACE_HAS_BOOKINGS_MESSAGE, code: "SPACE_HAS_BOOKINGS" });
    }
    throw err;
  }

  // TODO(KAFKA-001 follow-up): transactional outbox.
  try {
    await producer.send("space.deleted", { value: { id: spaceId } });
  } catch (err) {
    console.error(
      "Failed to publish space.deleted event for space",
      spaceId,
      "- hard-deleted in DB but search/cache will not reflect deletion until reconciled:",
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
      monthlyPlans: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
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

  // AUD-B6: the admin host Spaces page renders each space's averageRating and a
  // review count, but this endpoint previously returned neither. Aggregate
  // ratings the same way getSpaces does (batch groupBy to avoid N+1) and attach
  // averageRating + totalReviews so the admin cards stop showing 0/blank.
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
      totalReviews: rating.count,
    });
  });

  res.status(200).json(spacesWithRating);
};

// Get/Update space availability
export const getAvailability = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id, 10);
  if (Number.isNaN(spaceId))
    return res.status(400).json({ message: "Invalid ID" });

  // M11: this is a public read. Resolve the space through the same
  // isActive + venue.isActive guard so a host-deactivated space or a
  // soft-deleted venue's space can't be probed for its schedule. 404 with
  // the generic message so a hidden space isn't a side channel.
  const space = await prisma.space.findFirst({
    where: { id: spaceId, isActive: true, venue: { isActive: true } },
    select: { id: true },
  });
  if (!space) {
    return res.status(404).json({ message: "Space not found" });
  }

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
  // serve stale availability after a host updates their schedule.
  // AUD-035: await + try/catch the publish to match the sibling handlers
  // in this file (createSpace/updateSpace/deleteSpace). A throwing producer
  // would otherwise produce an unhandled promise rejection and could crash
  // the worker; we log and continue because the DB write has already
  // committed and the response should not fail.
  // TODO(KAFKA-001 follow-up): transactional outbox.
  try {
    await producer.send("space.updated", { value: { id: spaceId } });
  } catch (err) {
    console.error(
      "Failed to publish space.updated event for space",
      spaceId,
      "- availability updated but search/cache will be stale until reconciled:",
      err instanceof Error ? err.message : err
    );
  }

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

  // M11: apply the public isActive + venue.isActive guard so a hidden space
  // (host-deactivated, or belonging to a soft-deleted venue) can't be probed
  // or booked. findFirst (not findUnique) so the relation filter applies; a
  // filtered-out space returns the same generic 404 as a missing one.
  const space = await prisma.space.findFirst({
    where: { id: spaceId, isActive: true, venue: { isActive: true } },
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
