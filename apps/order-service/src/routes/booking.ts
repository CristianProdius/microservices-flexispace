import { FastifyInstance } from "fastify";
import {
  shouldBeAdmin,
  shouldBeUser,
  shouldBeHost,
  resolveActingHost,
} from "@repo/auth-middleware/fastify";
import { prisma, BookingStatus, Prisma } from "@repo/db";
import { startOfMonth, subMonths, differenceInDays } from "date-fns";
import { CreateBookingSchema, type BookingChartType } from "@repo/types";
import { producer } from "../utils/kafka.js";

// Statuses that occupy a slot and therefore block other bookings from
// overlapping it. Kept exported (via the module scope) so the conflict scan
// in both POST /bookings and the host-approve handler stay in sync.
// BOOKSVC-003: APPROVED was dropped from the BookingStatus schema enum
// (see TYPES-001/types-tail), so only PENDING and CONFIRMED remain.
const CONFLICTING_BOOKING_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
];

// AUDIT-B8 (M4): request-to-book (instantBook=false) bookings are created
// PENDING and would otherwise squat the slot forever if the host never acts.
// We stamp Booking.holdExpiresAt = now + HOLD_WINDOW_MS at create time and the
// conflict scan treats a PENDING row as free once its hold has elapsed, so a
// stale hold self-releases without a cron. NOTE(follow-up): add a background
// sweep to flip elapsed PENDING holds to EXPIRED so they also drop out of
// listings/analytics, not just the conflict scan.
const HOLD_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

// AUDIT-B8 (M4): Prisma `where` fragment for "rows that currently occupy a
// slot". CONFIRMED always conflicts; a PENDING row only conflicts while its
// hold is live (holdExpiresAt null == legacy row with no hold, or in the
// future). Used by the create-time conflict scan so expired holds no longer
// block new bookings. `now` is captured once by the caller for consistency
// across a retried serializable transaction.
const conflictingBookingStatusWhere = (now: Date): Prisma.BookingWhereInput => ({
  OR: [
    { status: "CONFIRMED" },
    {
      status: "PENDING",
      OR: [{ holdExpiresAt: null }, { holdExpiresAt: { gt: now } }],
    },
  ],
});

// AUDIT-B8 (M4): in-memory mirror of the hold-expiry rule for the candidate
// scan. Defense-in-depth alongside `conflictingBookingStatusWhere` (and keeps
// the create path correct even if the DB returns a stale hold).
const isHoldExpired = (
  candidate: { status: BookingStatus; holdExpiresAt?: Date | string | null },
  now: Date
): boolean =>
  candidate.status === "PENDING" &&
  candidate.holdExpiresAt != null &&
  new Date(candidate.holdExpiresAt).getTime() <= now.getTime();

// BOOKSVC-011: Postgres Serializable transactions abort with SQLSTATE 40001
// (Prisma code P2034) under write contention. Real, non-conflicting bookings
// would otherwise 500. Retry a small number of times with exponential backoff
// before surfacing 503 to the caller.
const SERIALIZABLE_RETRY_ATTEMPTS = 3;
const SERIALIZABLE_RETRY_BASE_DELAY_MS = 25;

const isSerializationFailure = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { code?: unknown; meta?: { code?: unknown } };
  if (anyErr.code === "P2034") return true;
  if (anyErr.meta && anyErr.meta.code === "40001") return true;
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") {
    return true;
  }
  return false;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function runWithSerializableRetry<T>(work: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < SERIALIZABLE_RETRY_ATTEMPTS; attempt++) {
    try {
      return await work();
    } catch (err) {
      if (!isSerializationFailure(err)) {
        throw err;
      }
      lastError = err;
      if (attempt < SERIALIZABLE_RETRY_ATTEMPTS - 1) {
        const delay = SERIALIZABLE_RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

// BOOKSVC-008: pragmatic mitigation against Float64 drift in monetary math.
// Long-term fix is to migrate monetary columns to Decimal(12,2) (tracked as
// DB-001). Round to cents at every assignment boundary so totals stay
// coherent with line items.
export const round2 = (n: number): number => Math.round(n * 100) / 100;
const roundCurrency = round2;

// BOOKSVC-007: typed error thrown when an ExchangeRate row is missing for a
// (from, to) pair. Callers MUST surface this to the user instead of silently
// substituting 1.0.
export class MissingExchangeRateError extends Error {
  readonly fromCurrency: string;
  readonly toCurrency: string;
  constructor(fromCurrency: string, toCurrency: string) {
    super(`Exchange rate not configured: ${fromCurrency} -> ${toCurrency}`);
    this.name = "MissingExchangeRateError";
    this.fromCurrency = fromCurrency;
    this.toCurrency = toCurrency;
  }
}

// H1: thrown when NO pricing candidate applies to the requested booking (e.g.
// an hourly-only space asked for a full-day hold with no times, or a window
// that intersects no open day). Callers MUST surface a 400 instead of silently
// pricing 0 — a zero subtotal would be a FREE reservation that still blocks the
// whole slot for everyone else.
export class NoApplicablePriceError extends Error {
  constructor() {
    super("This space has no applicable price for the requested booking");
    this.name = "NoApplicablePriceError";
  }
}

// BOOKSVC-004: refund-rate matrix applied at cancel time.
// FLEXIBLE      : 100% if >24h, else 0%
// MODERATE      : 100% if >5d (120h), 50% if 24h–5d, else 0%
// STRICT        : 50% if >7d (168h), else 0%
// NON_REFUNDABLE: always 0%
export const computeRefundRate = (
  policy: "FLEXIBLE" | "MODERATE" | "STRICT" | "NON_REFUNDABLE",
  hoursUntilCheckin: number
): number => {
  if (policy === "NON_REFUNDABLE") return 0;
  if (policy === "FLEXIBLE") return hoursUntilCheckin > 24 ? 1 : 0;
  if (policy === "MODERATE") {
    if (hoursUntilCheckin > 120) return 1;
    if (hoursUntilCheckin > 24) return 0.5;
    return 0;
  }
  return hoursUntilCheckin > 168 ? 0.5 : 0;
};

// BOOKSVC-006: compute UTC-based [start, end) bounds for "today"/"week"/"month"
// in a caller-supplied IANA timezone. Falls back to UTC on invalid tz.
export const getTzPeriodBounds = (
  now: Date,
  tz: string
): { todayStart: Date; weekStart: Date; monthStart: Date } => {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      weekday: "short",
    }).formatToParts(now);
  } catch {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      weekday: "short",
    }).formatToParts(now);
  }
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const day = Number(pick("day"));
  let hour = Number(pick("hour"));
  if (hour === 24) hour = 0;
  const minute = Number(pick("minute"));
  const second = Number(pick("second"));
  const weekdayShort = pick("weekday");
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekdayShort);

  const elapsedMs =
    (hour * 3600 + minute * 60 + second) * 1000 + (now.getTime() % 1000);
  const todayStart = new Date(now.getTime() - elapsedMs);
  const daysSinceMonday = weekdayIndex >= 0 ? (weekdayIndex + 6) % 7 : 0;
  const weekStart = new Date(todayStart.getTime() - daysSinceMonday * 86_400_000);
  const monthStart = new Date(todayStart.getTime() - (day - 1) * 86_400_000);

  return { todayStart, weekStart, monthStart };
};

// AUDIT-B8 (M5): platform home-market timezone, used as a fallback when a
// venue row somehow lacks one. Mirrors Venue.timezone's schema default.
const DEFAULT_VENUE_TIMEZONE = "Europe/Chisinau";

// AUDIT-B8 (M5): offset (ms) that the given IANA zone's local wall clock is
// AHEAD of UTC at `utcInstant` (e.g. +3h for Europe/Chisinau in summer).
// Computed by formatting the instant in the zone and diffing the read-back
// wall-clock components against the instant. Falls back to 0 (UTC) on an
// invalid zone rather than throwing.
const zoneOffsetMs = (utcInstant: Date, tz: string): number => {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(utcInstant);
  } catch {
    return 0;
  }
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  let hour = pick("hour");
  if (hour === 24) hour = 0;
  const asLocalMs = Date.UTC(
    pick("year"),
    pick("month") - 1,
    pick("day"),
    hour,
    pick("minute"),
    pick("second")
  );
  return asLocalMs - utcInstant.getTime();
};

// AUDIT-B8 (M5): convert a LOCAL wall-clock time (calendar Y/M/D + H:M in the
// venue's IANA zone) to the real UTC instant. The previous cancel-refund code
// treated the local "HH:MM" as if it were UTC (setUTCHours), so for
// Europe/Chisinau (UTC+2/+3) hoursUntilCheckin was off by the zone offset and
// could cross a refund bracket. We build the naive instant from the local
// components, then subtract the zone's offset at (approximately) that instant.
// Single-pass offset resolution; see risks re: the ~1h/yr DST-transition edge.
const localWallClockToUtc = (
  date: Date,
  startTime: string | null,
  tz: string
): Date => {
  const [h, m] = startTime
    ? startTime.split(":").map(Number)
    : [0, 0];
  const naiveUtcMs = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    h ?? 0,
    m ?? 0,
    0,
    0
  );
  const offset = zoneOffsetMs(new Date(naiveUtcMs), tz);
  return new Date(naiveUtcMs - offset);
};

const BOOKING_STATUSES = new Set<BookingStatus>([
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "EXPIRED",
]);

const parseBookingStatus = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  return typeof value === "string" && BOOKING_STATUSES.has(value as BookingStatus)
    ? (value as BookingStatus)
    : null;
};

export class InvalidParameterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidParameterError";
  }
}

/**
 * Parses `value` as a positive integer.
 *
 * BOOKSVC-016: distinguish "absent" from "invalid".
 *   - absent (undefined/null/"") -> returns `fallback` (which may itself be undefined)
 *   - present-but-invalid (non-numeric, negative, zero, non-integer, unsafe) -> throws
 *     InvalidParameterError. Callers convert to HTTP 400.
 *   - valid positive integer -> returns the number, clamped to `max` when provided.
 */
export const parsePositiveInteger = (
  value: unknown,
  fallback?: number,
  max?: number
): number | undefined => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value !== "string" && typeof value !== "number") {
    throw new InvalidParameterError("Expected a positive integer");
  }
  const normalized = String(value);
  if (!/^\d+$/.test(normalized)) {
    throw new InvalidParameterError("Expected a positive integer");
  }
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new InvalidParameterError("Expected a positive integer");
  }
  return max ? Math.min(parsed, max) : parsed;
};

const dateFromInput = (value: string) => new Date(`${value}T00:00:00.000Z`);

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

const minutesFromTime = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours! * 60 + minutes!;
};

const datesBetweenInclusive = (startDate: Date, endDate: Date) => {
  const dates: Date[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
};

/**
 * BOOKSVC-010: single source of truth for "hours per day" used by both
 * validation (bookingHours) and pricing (calculateBookingPrice).
 *
 * Returns the number of hours occupied between startTime and endTime on a
 * single day. If either time is missing, the booking is treated as a full
 * 24-hour day. Handles midnight-crossing (endTime <= startTime) by treating
 * the booking as continuing into the following day.
 */
export const computeBookingHours = (
  startTime: string | null,
  endTime: string | null
): number => {
  if (!startTime || !endTime) return 24;
  let minutes = minutesFromTime(endTime) - minutesFromTime(startTime);
  if (minutes <= 0) minutes += 24 * 60; // cross-midnight
  return minutes / 60;
};

export const bookingHours = (
  startDate: Date,
  endDate: Date,
  startTime: string | null,
  endTime: string | null
) => {
  const days = datesBetweenInclusive(startDate, endDate).length;
  return days * computeBookingHours(startTime, endTime);
};

/**
 * BOOKSVC-014: build an absolute UTC [start, end) interval for a booking so
 * the same overlap predicate works for hourly, daily, and midnight-crossing
 * bookings. End is exclusive.
 *
 * For full-day bookings: [startDate 00:00, endDate + 1 day 00:00).
 * For hourly bookings:   [startDate + startTime, endDate + endTime); if the
 * hourly window crosses midnight (endTime <= startTime) the end is rolled
 * forward by an extra day so the interval stays well-formed.
 */
const bookingInstantRange = (booking: {
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
  isHourly: boolean;
}): { start: Date; end: Date } => {
  if (!booking.isHourly || !booking.startTime || !booking.endTime) {
    const start = new Date(booking.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(booking.endDate);
    end.setUTCHours(0, 0, 0, 0);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  const startMinutes = minutesFromTime(booking.startTime);
  const endMinutes = minutesFromTime(booking.endTime);

  const start = new Date(booking.startDate);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCMinutes(startMinutes);

  const end = new Date(booking.endDate);
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCMinutes(endMinutes);
  if (endMinutes <= startMinutes) {
    // Cross-midnight hourly window: roll end forward by one day.
    end.setUTCDate(end.getUTCDate() + 1);
  }

  return { start, end };
};

const validateAvailabilityRules = (
  space: {
    availability?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isOpen: boolean;
    }>;
    blockedDates?: Array<{ date: Date }>;
    minBookingHours: number | null;
    maxBookingHours: number | null;
  },
  startDate: Date,
  endDate: Date,
  startTime: string | null,
  endTime: string | null,
  // MONTHLY bookings rent the whole space for the period, so the per-day
  // open-hours and the hour-based min/max caps don't apply — only host-declared
  // blocked dates constrain them.
  isMonthly = false
) => {
  const requestedDates = datesBetweenInclusive(startDate, endDate);
  const blockedDates = new Set((space.blockedDates ?? []).map((blockedDate) => dateKey(blockedDate.date)));
  if (requestedDates.some((date) => blockedDates.has(dateKey(date)))) {
    return "Some requested dates are blocked";
  }

  // A monthly rental isn't gated by the space's daily open-hours or the
  // hour-based duration caps; only the blocked-date check above applies.
  if (isMonthly) {
    return null;
  }

  if (!space.availability || space.availability.length === 0) {
    return "Space has no availability configured";
  }

  for (const date of requestedDates) {
    const dayAvailability = space.availability.find((item) => item.dayOfWeek === date.getUTCDay());
    if (!dayAvailability || !dayAvailability.isOpen) {
      return "Space is closed on one or more requested dates";
    }

    if (
      startTime &&
      endTime &&
      (minutesFromTime(startTime) < minutesFromTime(dayAvailability.startTime) ||
        minutesFromTime(endTime) > minutesFromTime(dayAvailability.endTime))
    ) {
      return "Booking time is outside availability";
    }
  }

  const hours = bookingHours(startDate, endDate, startTime, endTime);
  if (space.minBookingHours !== null && hours < space.minBookingHours) {
    return `Minimum booking duration is ${space.minBookingHours} hours`;
  }
  if (space.maxBookingHours !== null && hours > space.maxBookingHours) {
    return `Maximum booking duration is ${space.maxBookingHours} hours`;
  }

  return null;
};

/**
 * BOOKSVC-013: half-open overlap predicate. Both ends are EXCLUSIVE so
 * back-to-back intervals (a.end === b.start) do NOT overlap.
 *
 * Callers must pass exclusive-end timestamps. For booking ranges, build them
 * via `bookingInstantRange`.
 */
export const dateRangesOverlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart < bEnd && bStart < aEnd;

export const bookingIntervalsOverlap = (
  existing: {
    startDate: Date;
    endDate: Date;
    startTime: string | null;
    endTime: string | null;
    isHourly: boolean;
  },
  incoming: {
    startDate: Date;
    endDate: Date;
    startTime: string | null;
    endTime: string | null;
    isHourly: boolean;
  }
) => {
  const existingRange = bookingInstantRange(existing);
  const incomingRange = bookingInstantRange(incoming);
  return dateRangesOverlap(
    existingRange.start,
    existingRange.end,
    incomingRange.start,
    incomingRange.end
  );
};

/**
 * BOOKSVC-009: for HOURLY (and BOTH-as-hourly) pricing on multi-day bookings,
 * each day in the range may have a different availability window. The
 * requested [startTime, endTime] window is intersected with that day's
 * availability before being charged, so a Mon 9-18 + Tue 9-12 booking is only
 * charged 9 hours for Monday and 3 hours for Tuesday.
 *
 * If a day has no availability or is closed, contributes 0 hours (validation
 * would normally have already rejected this).
 */
const billableHourlyHours = (
  availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isOpen: boolean;
  }> | undefined,
  startDate: Date,
  endDate: Date,
  startTime: string,
  endTime: string
): number => {
  const requestedStart = minutesFromTime(startTime);
  const requestedEnd = minutesFromTime(endTime);
  if (requestedEnd <= requestedStart) {
    // Cross-midnight or zero-length: fall back to the simple per-day duration.
    // Validation rejects this case via CreateBookingSchema, so this is defensive.
    return datesBetweenInclusive(startDate, endDate).length *
      computeBookingHours(startTime, endTime);
  }

  let totalHours = 0;
  for (const date of datesBetweenInclusive(startDate, endDate)) {
    const day = availability?.find(
      (item) => item.dayOfWeek === date.getUTCDay() && item.isOpen
    );
    if (!day) continue;
    const windowStart = Math.max(requestedStart, minutesFromTime(day.startTime));
    const windowEnd = Math.min(requestedEnd, minutesFromTime(day.endTime));
    if (windowEnd > windowStart) {
      totalHours += (windowEnd - windowStart) / 60;
    }
  }
  return totalHours;
};

// Resolve the platform commission rate to use when computing the host payout
// deduction. Per-host override on User.commissionRate; falls back to the
// DEFAULT_COMMISSION_RATE env var; final fallback to 0 so a misconfigured env
// can't silently double-charge or hide revenue.
//
// Clamps to [0, 1]: a stray 1.5 (from a stale row written before the admin
// validator was added, or a misconfigured env) would make serviceFee > subtotal
// and produce a negative host payout. The admin write-path enforces the same
// range, but this function is the last line of defense at booking time.
export const resolveCommissionRate = (hostCommissionRate: number | null | undefined): number => {
  const clamp = (raw: number) => Math.max(0, Math.min(1, raw));
  if (typeof hostCommissionRate === "number" && Number.isFinite(hostCommissionRate) && hostCommissionRate >= 0) {
    return clamp(hostCommissionRate);
  }
  const fromEnv = Number.parseFloat(process.env.DEFAULT_COMMISSION_RATE ?? "");
  return Number.isFinite(fromEnv) && fromEnv >= 0 ? clamp(fromEnv) : 0;
};

// H1: whether a space can be priced by the hour. The client-supplied `isHourly`
// is NOT trusted — the priced window and the blocked window must be derived from
// the same server-side signal (times present AND the space supports hourly
// pricing) so a caller can never block more than they pay for. A space supports
// hourly pricing when its pricingType is HOURLY or BOTH, or it has any
// per-minute pricing tier configured.
export const spaceSupportsHourly = (space: {
  pricingType: string;
  pricePerHour?: number | null;
  pricingTiers?: Array<{ minutes: number; price: number }>;
}): boolean => {
  // "Supports hourly" must mean an actual usable positive hourly price exists,
  // not just that pricingType is HOURLY/BOTH. Otherwise a BOTH space with only
  // pricePerDay (pricePerHour null) would be treated as hourly — blocking just
  // the requested window while pricing a full day (block != price). Mirror the
  // price gates in calculateBookingPrice: a positive per-hour rate OR a
  // positive-priced tier. (A zero-priced tier is skipped there too.)
  const hasPositiveHourlyRate =
    typeof space.pricePerHour === "number" && space.pricePerHour > 0;
  const hasPositiveTier = (space.pricingTiers ?? []).some((t) => t.price > 0);
  return hasPositiveHourlyRate || hasPositiveTier;
};

// MONTHLY: whether a space is billed per calendar month. A monthly booking is a
// full-day DATE-RANGE booking (no time window, isHourly=false) priced per
// calendar month and pro-rated for the remainder days. Unlike BOTH (which stays
// hourly+daily), MONTHLY is its own pricingType. A space supports monthly iff it
// has a positive pricePerMonth AND its pricingType is MONTHLY — mirroring the
// positive-rate gating used everywhere else so a null/zero rate fails closed.
// Flexible pricing: monthly is offered whenever a positive base monthly rate is
// set (named plans are handled separately in the handler). No longer gated on the
// legacy pricingType.
export const spaceSupportsMonthly = (space: {
  pricePerMonth?: number | null;
}): boolean => (space.pricePerMonth ?? 0) > 0;

// MONTHLY: add `months` whole calendar months to a UTC date. Mirrors date-fns
// addMonths semantics (clamp the day-of-month to the last day of the target
// month, e.g. Jan 31 + 1 month = Feb 28/29) but operates purely on the UTC
// calendar so it is stable regardless of the server's local timezone — the rest
// of the booking math is UTC-based (see dateFromInput / bookingInstantRange).
const addMonthsUtc = (date: Date, months: number): Date => {
  const totalMonths = date.getUTCMonth() + months;
  const targetYear = date.getUTCFullYear() + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;
  // Last day of the target month (day 0 of the following month).
  const lastDayOfTargetMonth = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0)
  ).getUTCDate();
  const clampedDay = Math.min(date.getUTCDate(), lastDayOfTargetMonth);
  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      clampedDay,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );
};

// MONTHLY: price a full-day date range per calendar month, pro-rating the
// remainder days at the anchor month's day-rate.
//
// endDate is the LAST OCCUPIED day (inclusive) — the same convention the block
// window ([startDate 00:00, endDate+1day)) and the daily path (days = diff+1)
// use. We convert it to an exclusive `checkout = endDate + 1 day` so the month
// math lines up with what is actually occupied:
//   - a single-day booking (start == end) => 1 occupied day => a positive
//     fraction of a month (never $0 / a free slot-blocking hold);
//   - a full calendar month (e.g. Jan 1 -> Jan 31) => exactly 1x.
//
//   - fullMonths   : whole calendar months from startDate that fit before checkout.
//   - anchor       : startDate + fullMonths calendar months.
//   - remainderDays: occupied days from anchor to checkout (exclusive), >= 0.
//   - monthLen     : whole days in the anchor month (28-31), so the pro-rate is
//                    relative to the specific remainder month.
//   - fraction     : clamped to <= 1 so month-length clamping (e.g. a Jan 31
//                    start whose anchor lands on the shorter Feb) can't price a
//                    partial month above a full month.
//
// result = (fullMonths + fraction) * pricePerMonth, rounded to cents.
// Examples: Jan 1 -> Jan 31 = 1x; Jan 1 -> Feb 28 = 2x; Jan 1 -> Jan 15 = 15/31x.
const MONTHLY_DAY_MS = 24 * 60 * 60 * 1000;
export const monthlyProRatedPrice = (
  startDate: Date,
  endDate: Date,
  pricePerMonth: number
): number => {
  const checkout = new Date(endDate.getTime() + MONTHLY_DAY_MS);
  let fullMonths = 0;
  while (
    addMonthsUtc(startDate, fullMonths + 1).getTime() <= checkout.getTime()
  ) {
    fullMonths++;
  }
  const anchor = addMonthsUtc(startDate, fullMonths);
  const remainderDays = Math.max(0, differenceInDays(checkout, anchor));
  const monthLen = differenceInDays(addMonthsUtc(anchor, 1), anchor);
  const fraction = monthLen > 0 ? Math.min(remainderDays / monthLen, 1) : 0;
  return roundCurrency((fullMonths + fraction) * pricePerMonth);
};

// Calculate booking price based on space pricing and duration.
//
// Pricing model:
//   - subtotal: cheapest of all candidate billing units for the requested
//     duration. Each tier is one candidate (1 unit if the booking is shorter
//     than the tier, ceil(duration/tier) otherwise) and the raw pricePerHour /
//     pricePerDay rate is also a candidate. This automatically caps an hourly
//     extrapolation at the daily-tier price when a daily tier is cheaper.
//   - cleaningFee: pass-through.
//   - serviceFee: the platform's commission, taken out of the host's payout.
//     The client total does NOT include this — the client pays the listed
//     price and the host receives (subtotal + cleaningFee - serviceFee).
//   - total: subtotal + cleaningFee. This is what the client is charged.
export const calculateBookingPrice = (
  space: {
    pricingType: string;
    pricePerHour: number | null;
    pricePerDay: number | null;
    pricePerMonth?: number | null;
    cleaningFee: number;
    currency: string;
    pricingTiers?: Array<{ minutes: number; price: number }>;
    availability?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isOpen: boolean;
    }>;
  },
  startDate: Date,
  endDate: Date,
  startTime: string | null,
  endTime: string | null,
  hostCommissionRate: number | null | undefined = null,
  // MONTHLY PLANS: when a booking selects a named plan, the plan's monthly rate is
  // passed here and used in place of space.pricePerMonth for the calendar-month
  // proration.
  monthlyRateOverride?: number,
  // Flexible pricing: the explicit mode the guest chose (a tab per offered rate).
  // When set, ONLY that mode is priced (no cross-mode min) and a 0 rate is a valid
  // request-to-book price. When absent, the legacy min-across-modes behavior with
  // strict positive-rate gating applies.
  bookingMode?: "hourly" | "daily" | "monthly"
): { subtotal: number; cleaningFee: number; serviceFee: number; total: number } => {
  // Calculate total minutes for the booking
  const days = differenceInDays(endDate, startDate) + 1;
  let totalMinutes = days * 24 * 60; // default to full days
  if (startTime && endTime) {
    // BOOKSVC-010: share the hours-per-day formula with validation.
    const hoursPerDay = computeBookingHours(startTime, endTime);
    totalMinutes = Math.round(hoursPerDay * 60) * days;
  }

  const candidates: number[] = [];

  // Each tier is a billing unit: ceil(duration / tier) blocks at tier.price.
  // For tiers larger than the booked duration that yields 1 unit, which means
  // "the bigger tier price IS the floor" — exactly the cap behavior we want.
  // A MONTHLY space is priced SOLELY by its monthly rate: skip tier (and the
  // hourly/daily rate) candidates so a stray/cheap tier can't undercut the
  // monthly price via Math.min.
  // A booking is priced monthly when the space is MONTHLY-typed OR the guest
  // selected a named monthly plan (via monthlyRateOverride) on a mixed space.
  // In both cases price SOLELY by the monthly rate: skip tier/hourly/daily
  // candidates so a cheaper short-term rate can't undercut the subscription.
  const explicit = bookingMode;
  const isMonthlyBooking =
    explicit === "monthly" ||
    typeof monthlyRateOverride === "number" ||
    (explicit === undefined && space.pricingType === "MONTHLY");
  // With an explicit mode a 0 rate is a valid request-to-book price; the legacy
  // (no-mode) path keeps the strict > 0 gate so a misconfigured 0 can't silently
  // create a free, slot-blocking hold. null (unset) is never offered.
  const rateOffered = (r: number | null | undefined): boolean =>
    r != null && (explicit !== undefined ? r >= 0 : r > 0);
  for (const tier of isMonthlyBooking ? [] : space.pricingTiers ?? []) {
    // M6: skip a zero/negative-priced tier the same way the zero-hour hourly
    // candidate is guarded below. A "first hour free" (price <= 0) tier would
    // otherwise win Math.min for an unrelated 30-day booking and zero the
    // subtotal, billing only the cleaning fee.
    if (tier.price <= 0) continue;
    const units = Math.ceil(totalMinutes / tier.minutes);
    candidates.push(roundCurrency(units * tier.price));
  }

  // Raw per-hour / per-day rates also compete. Adding BOTH for type=BOTH
  // means an hourly extrapolation can also be capped by the daily rate, not
  // just by a configured tier.
  // Gate on a strictly POSITIVE rate, not mere truthiness: a negative
  // pricePerHour/pricePerDay (possible on legacy rows / importer writes that
  // bypass the product-service H2 validation) is truthy and would otherwise
  // push a negative candidate that Math.min selects and the subtotal floor
  // masks to a free, slot-blocking booking. A non-positive rate contributes no
  // candidate, so the space fails closed (zero-candidate -> 400) instead.
  // When the booking is monthly (MONTHLY space or a selected plan), the
  // hourly/daily/tier candidates are suppressed so only the monthly rate prices
  // it — mirroring the tier suppression above.
  // Flexible pricing: gate on the RATE being offered (not the legacy pricingType).
  // With an explicit mode only that mode contributes a candidate, so a 0 rate can
  // price a request without an unrelated mode undercutting it.
  const wantsHourly = Boolean(startTime && endTime);
  const allowsHourly =
    !isMonthlyBooking &&
    (explicit === undefined || explicit === "hourly") &&
    wantsHourly &&
    rateOffered(space.pricePerHour);
  const allowsDaily =
    !isMonthlyBooking &&
    (explicit === undefined || explicit === "daily") &&
    rateOffered(space.pricePerDay);
  // MONTHLY: a monthly space contributes a calendar-month, pro-rated candidate.
  // Gated on a strictly-positive pricePerMonth exactly like the daily/hourly
  // rates, so a null/zero/negative monthly rate contributes no candidate and the
  // space fails closed (zero-candidate -> NoApplicablePriceError -> 400) rather
  // than pricing a free, slot-blocking hold.
  // MONTHLY PLANS: the effective monthly rate is the selected plan's rate when
  // an override is supplied (a plan can now be selected on any space type),
  // otherwise the MONTHLY space's base pricePerMonth. The strictly-positive gate
  // below still applies so a null/zero/negative rate contributes no candidate
  // and the space fails closed.
  const effectiveMonthlyRate =
    typeof monthlyRateOverride === "number"
      ? monthlyRateOverride
      : isMonthlyBooking
        ? space.pricePerMonth ?? 0
        : 0;
  const allowsMonthly =
    isMonthlyBooking &&
    (typeof monthlyRateOverride === "number"
      ? effectiveMonthlyRate >= 0
      : rateOffered(space.pricePerMonth));

  if (allowsHourly) {
    // BOOKSVC-009: per-day intersection with availability windows.
    const hours = billableHourlyHours(
      space.availability,
      startDate,
      endDate,
      startTime!,
      endTime!
    );
    // Skip a zero-hour candidate. billableHourlyHours returns 0 when the
    // requested time window doesn't intersect any open day (e.g. asking for
    // Mon 13-18 against a Mon 09-12 availability). validateAvailabilityRules
    // currently only checks that the day is open, not that the window
    // intersects, so a zero would silently win Math.min and bill the
    // booking for the cleaning fee alone.
    if (hours > 0) {
      candidates.push(roundCurrency(space.pricePerHour! * hours));
    }
  }
  if (allowsDaily) {
    candidates.push(roundCurrency(space.pricePerDay! * days));
  }
  if (allowsMonthly) {
    // MONTHLY: full-day date-range candidate priced per calendar month and
    // pro-rated for the remainder days (see monthlyProRatedPrice).
    candidates.push(
      monthlyProRatedPrice(startDate, endDate, effectiveMonthlyRate)
    );
  }

  // H1: never silently price 0 when nothing applies. A zero subtotal from an
  // empty candidate set is a free booking that still blocks the whole slot —
  // reject it so the caller returns 400 instead of persisting the hold.
  if (candidates.length === 0) {
    throw new NoApplicablePriceError();
  }
  // H1/H2: floor at >= 0 as defense-in-depth. A negative host rate (see H2)
  // must never produce a negative subtotal that credits the guest.
  const subtotal = Math.max(0, Math.min(...candidates));

  // Clamp the cleaning fee to >= 0 too (a legacy/importer negative would
  // otherwise leave the returned components inconsistent with the floored
  // total, and understate the charge).
  const cleaningFee = Math.max(0, roundCurrency(space.cleaningFee));
  const commissionRate = resolveCommissionRate(hostCommissionRate);
  // Commission applies to the price paid for the space itself, not to the
  // pass-through cleaning fee (cleaning is the host's cost of doing business).
  const serviceFee = roundCurrency(subtotal * commissionRate);
  const total = Math.max(0, roundCurrency(subtotal + cleaningFee));

  return { subtotal, cleaningFee, serviceFee, total };
};

// BOOKSVC-007: never default to 1.0 when an exchange rate is missing — that
// silently under-reports cross-currency bookings (e.g. USD↔MDL by ~18x).
// Throw a typed error so the caller can return 503 / show "rate unavailable".
async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string = "USD"
): Promise<number> {
  if (fromCurrency === toCurrency) return 1.0;

  // M7: a single seeded direction (e.g. USD->MDL but not MDL->USD) must not
  // hard-block all non-USD bookings. Resolve a leg via the direct row, or fall
  // back to the inverse row and use 1/rate; only throw MissingExchangeRateError
  // when neither direction exists. (product-service/src/lib/currency.ts does
  // direct + USD-chain but no inverse fallback; those helpers are currently
  // unused, but they should gain the same inverse fallback if they go live.)
  const resolveLeg = async (
    from: string,
    to: string
  ): Promise<number | null> => {
    if (from === to) return 1.0;
    const direct = await prisma.exchangeRate.findUnique({
      where: {
        fromCurrency_toCurrency: {
          fromCurrency: from as any,
          toCurrency: to as any,
        },
      },
    });
    // Guard against a bogus 0 rate (placeholder seed) the same as the inverse
    // branch — a 0 must fall through to MissingExchangeRateError, not be used
    // as a real rate (which would silently value the booking's revenue at $0).
    if (direct && Number(direct.rate) !== 0) return Number(direct.rate); // Prisma.Decimal
    const inverse = await prisma.exchangeRate.findUnique({
      where: {
        fromCurrency_toCurrency: {
          fromCurrency: to as any,
          toCurrency: from as any,
        },
      },
    });
    if (inverse && Number(inverse.rate) !== 0) return 1 / Number(inverse.rate);
    return null;
  };

  const direct = await resolveLeg(fromCurrency, toCurrency);
  if (direct !== null) return direct;

  // Cross-currency fallback: chain through USD (from -> USD -> to).
  if (fromCurrency !== "USD" && toCurrency !== "USD") {
    const fromUsd = await resolveLeg(fromCurrency, "USD");
    const usdTo = await resolveLeg("USD", toCurrency);
    if (fromUsd !== null && usdTo !== null) return fromUsd * usdTo;
  }

  throw new MissingExchangeRateError(fromCurrency, toCurrency);
}

export const bookingRoute = async (fastify: FastifyInstance) => {
  // Create a new booking request (Guest)
  fastify.post(
    "/bookings",
    { preHandler: shouldBeUser },
    async (request, reply) => {
      const guestId = request.userId!;
      const result = CreateBookingSchema.safeParse(request.body);

      if (!result.success) {
        return reply.status(400).send({
          message: "Validation failed",
          errors: result.error.issues,
        });
      }

      // H1: the client `isHourly` is intentionally NOT destructured/used here.
      // It is derived server-side below so the blocked window equals the priced
      // window (see `isHourly` derivation after the space is loaded).
      const { spaceId, startDate, endDate, startTime, endTime, guests, message, monthlyPlanId, bookingMode } = result.data;
      const requestedStartDate = dateFromInput(startDate);
      const requestedEndDate = dateFromInput(endDate);

      // Get space details
      const space = await prisma.space.findUnique({
        where: { id: spaceId },
        include: {
          availability: true,
          blockedDates: true,
          host: true,
          pricingTiers: { orderBy: { minutes: "asc" } },
          // MONTHLY PLANS: load the space's plans so a booking can select one
          // and be priced from its rate (see plan resolution below).
          monthlyPlans: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
        },
      });

      if (!space) {
        return reply.status(404).send({ message: "Space not found" });
      }

      if (!space.isActive) {
        return reply.status(400).send({ message: "Space is not available" });
      }

      // Check capacity
      if (guests && guests > space.capacity) {
        return reply.status(400).send({
          message: `Space capacity is ${space.capacity} guests`,
        });
      }

      // MONTHLY PLANS: resolve a selected named plan. Plans can now be attached
      // to ANY space type (a mixed space may sell monthly memberships alongside
      // hourly/daily). A plan is REQUIRED only for a MONTHLY-typed space that
      // offers plans; on any other type the plan is optional — selecting one
      // switches the booking to monthly pricing, omitting it books short-term.
      // Flexible pricing: the guest wants a monthly booking when they picked the
      // monthly tab (bookingMode) or — for legacy clients that don't send a mode —
      // the space is monthly-typed with no short-term path.
      const wantsMonthly =
        bookingMode === "monthly" ||
        (bookingMode === undefined && space.pricingType === "MONTHLY");
      let selectedMonthlyPlan:
        | { id: number; name: string; pricePerMonth: number }
        | null = null;
      const monthlyPlans = space.monthlyPlans ?? [];
      if (monthlyPlans.length > 0) {
        if (monthlyPlanId !== undefined) {
          const plan = monthlyPlans.find((p) => p.id === monthlyPlanId);
          if (!plan) {
            return reply.status(400).send({
              message: "Selected monthly plan is not available for this space",
            });
          }
          selectedMonthlyPlan = plan;
        } else if (wantsMonthly) {
          // A monthly booking on a space that offers named plans must pick one.
          // Booking a different mode (hourly/daily) doesn't require a plan.
          return reply.status(400).send({
            message: "monthlyPlanId is required for this space",
          });
        }
      }

      // A monthly booking (chosen monthly mode or a selected plan) is a full-period
      // rental — relax the per-day open-hours and hour-cap checks (only blocked
      // dates apply).
      const isMonthlyBooking =
        selectedMonthlyPlan !== null ||
        wantsMonthly ||
        (bookingMode === undefined && spaceSupportsMonthly(space));
      const availabilityError = validateAvailabilityRules(
        space,
        requestedStartDate,
        requestedEndDate,
        startTime || null,
        endTime || null,
        isMonthlyBooking
      );
      if (availabilityError) {
        return reply.status(400).send({ message: availabilityError });
      }

      // H1: derive isHourly server-side. Never trust the client value for either
      // occupancy (bookingInstantRange) or persistence. A booking is hourly iff
      // a time window was supplied AND the space actually supports hourly
      // pricing (a positive per-hour rate or tier); otherwise it is a full-day
      // booking (blocks and prices the whole day). This closes both exploits:
      // (a) hourly-only space + isHourly=false + no times -> full-day interval +
      // zero candidates -> 400 below; (b) BOTH space + 1h window + isHourly=false
      // -> priced 1h AND blocks only 1h.
      // KNOWN FOLLOW-UP: for a SINGLE-day hourly booking the blocked window
      // equals the priced window; for a MULTI-day hourly booking
      // bookingInstantRange still blocks one contiguous span across overnights
      // while pricing sums only the per-day availability intersection, so the
      // block window can exceed the priced window (phantom blocking, not
      // underpricing). Tracked in docs/bug-audit-2026-07.md follow-ups.
      // A booking is hourly only in the hourly mode with a real time window. An
      // explicit non-hourly mode (or a selected plan / monthly booking) is a
      // full-day rental. Falls back to the server-derived signal for legacy
      // clients that don't send a mode.
      const isHourly = isMonthlyBooking
        ? false
        : bookingMode !== undefined
          ? bookingMode === "hourly" && Boolean(startTime && endTime)
          : Boolean(startTime && endTime) && spaceSupportsHourly(space);

      // Contact-for-pricing: space has no rate fields set at all (all null, no
      // plans). Guests still need a way to inquire — accept a 0-price PENDING
      // request so the host can quote and approve. Instant-book free holds are
      // still rejected below (same H1 protection as a 0-rate mode).
      const isContactForPricing =
        space.pricePerHour == null &&
        space.pricePerDay == null &&
        space.pricePerMonth == null &&
        monthlyPlans.length === 0;

      // Calculate pricing
      let pricing: ReturnType<typeof calculateBookingPrice>;
      try {
        pricing = calculateBookingPrice(
          space,
          requestedStartDate,
          requestedEndDate,
          startTime || null,
          endTime || null,
          space.host?.commissionRate ?? null,
          selectedMonthlyPlan?.pricePerMonth,
          bookingMode
        );
      } catch (err) {
        // H1: no applicable price for the requested window (e.g. a mode the space
        // doesn't offer). Contact-for-pricing inquiries are the one exception —
        // they become a 0-price PENDING request so the guest can ask for a quote.
        if (err instanceof NoApplicablePriceError) {
          if (isContactForPricing) {
            pricing = {
              subtotal: 0,
              cleaningFee: 0,
              serviceFee: 0,
              total: 0,
            };
          } else {
            return reply.status(400).send({ message: err.message });
          }
        } else {
          throw err;
        }
      }

      // Zero-price: a mode priced at 0 (or a contact-for-pricing inquiry) is a
      // request-to-book lead the host approves — allowed only for a non-instant
      // space. Never auto-CONFIRM a free, slot-blocking booking (H1 preserved).
      if (pricing.subtotal === 0 && space.instantBook) {
        return reply.status(400).send({
          message: "This space can't be booked instantly at no charge",
        });
      }

      let exchangeRate: number;
      try {
        exchangeRate = await getExchangeRate(space.currency);
      } catch (err) {
        if (err instanceof MissingExchangeRateError) {
          return reply.status(503).send({
            message: `Exchange rate unavailable for ${err.fromCurrency} -> ${err.toCurrency}`,
          });
        }
        throw err;
      }

      // BOOKSVC-001/002: use the shared conflict-status rule so every status
      // that occupies a slot is treated as a conflict during the serializable
      // transaction. AUDIT-B8 (M4): a PENDING row only conflicts while its hold
      // is live, so an expired request-to-book hold no longer blocks new
      // bookings. CONFIRMED still always conflicts.
      const now = new Date();
      const conflictWhere: Prisma.BookingWhereInput = {
        spaceId,
        startDate: { lte: requestedEndDate },
        endDate: { gte: requestedStartDate },
        ...conflictingBookingStatusWhere(now),
      };

      let booking;
      try {
        // BOOKSVC-011: retry the serializable transaction on 40001/P2034.
        booking = await runWithSerializableRetry(() =>
          prisma.$transaction(async (tx) => {
            const candidateConflicts = await tx.booking.findMany({ where: conflictWhere });
            const conflict = candidateConflicts.find((candidate) =>
              // AUDIT-B8 (M4): skip PENDING rows whose hold has elapsed — they
              // no longer occupy the slot even if the DB layer surfaced them.
              !isHoldExpired(candidate, now) &&
              bookingIntervalsOverlap(
                {
                  endDate: candidate.endDate,
                  endTime: candidate.endTime,
                  isHourly: candidate.isHourly,
                  startDate: candidate.startDate,
                  startTime: candidate.startTime,
                },
                {
                  endDate: requestedEndDate,
                  endTime: endTime || null,
                  isHourly,
                  startDate: requestedStartDate,
                  startTime: startTime || null,
                }
              )
            );
            if (conflict) throw new Error("CONFLICT");
            return tx.booking.create({
              data: {
                spaceId,
                guestId,
                hostId: space.hostId,
                startDate: requestedStartDate,
                endDate: requestedEndDate,
                startTime,
                endTime,
                guests: guests || 1,
                isHourly,
                status: space.instantBook ? "CONFIRMED" : "PENDING",
                // AUDIT-B8 (M4): stamp a hold window on request-to-book
                // (PENDING) rows so an un-actioned hold self-releases; instant
                // bookings are CONFIRMED and never hold-expire.
                holdExpiresAt: space.instantBook
                  ? null
                  : new Date(now.getTime() + HOLD_WINDOW_MS),
                subtotal: pricing.subtotal,
                cleaningFee: pricing.cleaningFee,
                serviceFee: pricing.serviceFee,
                totalAmount: pricing.total,
                // MONTHLY PLANS: persist the selected plan reference + a name
                // snapshot so booking history survives a later plan rename or
                // delete. Null when no plan applies (no-plans / non-MONTHLY).
                monthlyPlanId: selectedMonthlyPlan?.id ?? null,
                monthlyPlanName: selectedMonthlyPlan?.name ?? null,
                guestMessage: message,
                currency: space.currency,
                exchangeRate,
              },
              include: {
                space: {
                  include: { host: true },
                },
                guest: {
                  select: { id: true, name: true, email: true },
                },
              },
            });
          }, { isolationLevel: 'Serializable' })
        );
      } catch (err: any) {
        if (err?.message === "CONFLICT") {
          return reply.status(409).send({
            message: "These dates conflict with an existing booking",
          });
        }
        if (isSerializationFailure(err)) {
          return reply.status(503).send({
            message: "Booking system is busy, please retry shortly",
          });
        }
        throw err;
      }

      // Send Kafka event. The booking row is already committed; surfacing
      // a 5xx here would mislead the user into retrying and creating a
      // duplicate. Log loudly and continue.
      // TODO(KAFKA-001 follow-up): replace fire-and-forget with a
      // transactional outbox so the DB write + event publish are atomic.
      try {
        await producer.send("booking.created", {
          value: {
            bookingId: booking.id,
            spaceId: booking.spaceId,
            guestId: booking.guestId,
            hostId: booking.hostId,
            guestEmail: booking.guest.email,
            hostEmail: booking.space.host.email,
            spaceName: booking.space.name,
            status: booking.status,
          },
        });
      } catch (err) {
        request.log.error(
          { err, bookingId: booking.id, topic: "booking.created" },
          "Failed to publish booking.created event; booking persisted but downstream (email, notifications) will not fire until reconciled"
        );
      }

      return reply.status(201).send(booking);
    }
  );

  // Get bookings for logged-in guest
  fastify.get(
    "/bookings/my",
    { preHandler: shouldBeUser },
    async (request, reply) => {
      const guestId = request.userId!;
      const { status: statusParam } = request.query as { status?: string };
      const status = parseBookingStatus(statusParam);
      if (status === null) {
        return reply.status(400).send({ message: "Invalid booking status" });
      }

      const bookings = await prisma.booking.findMany({
        where: {
          guestId,
          ...(status && { status }),
        },
        include: {
          space: {
            include: {
              host: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return reply.send(bookings);
    }
  );

  // Get bookings for host's spaces
  fastify.get(
    "/bookings/host",
    { preHandler: [shouldBeHost, resolveActingHost] },
    async (request, reply) => {
      const hostId = request.userId!;
      const { status, spaceId } = request.query as {
        status?: string;
        spaceId?: string;
      };
      const parsedStatus = parseBookingStatus(status);
      if (parsedStatus === null) {
        return reply.status(400).send({ message: "Invalid booking status" });
      }

      let spaceIdFilter: number | undefined;
      try {
        spaceIdFilter = parsePositiveInteger(spaceId);
      } catch (err) {
        if (err instanceof InvalidParameterError) {
          return reply.status(400).send({ message: "spaceId must be a positive integer" });
        }
        throw err;
      }

      const bookings = await prisma.booking.findMany({
        where: {
          hostId,
          ...(parsedStatus && { status: parsedStatus }),
          ...(spaceIdFilter !== undefined && { spaceId: spaceIdFilter }),
        },
        include: {
          space: true,
          guest: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return reply.send(bookings);
    }
  );

  // Get single booking
  fastify.get(
    "/bookings/:id",
    { preHandler: shouldBeUser },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.userId!;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          space: {
            include: {
              amenities: { include: { amenity: true } },
            },
          },
          guest: {
            select: { id: true, name: true, email: true, image: true },
          },
          host: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      if (!booking) {
        return reply.status(404).send({ message: "Booking not found" });
      }

      // Check access
      const userRole = request.user?.role;
      if (
        booking.guestId !== userId &&
        booking.hostId !== userId &&
        userRole !== "ADMIN"
      ) {
        return reply.status(403).send({ message: "Not authorized" });
      }

      return reply.send(booking);
    }
  );

  // Approve booking (Host)
  fastify.put(
    "/bookings/:id/approve",
    { preHandler: [shouldBeHost, resolveActingHost] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const hostId = request.userId!;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          space: true,
          guest: { select: { email: true, name: true } },
        },
      });

      if (!booking) {
        return reply.status(404).send({ message: "Booking not found" });
      }

      // When an admin is "acting as" a specific host (X-Acting-Host-Id header
      // applied by resolveActingHost), the blanket ADMIN override is suspended
      // — they must own the booking AS that host, matching the venue/space
      // controllers tightened in commit 9433cbd. Without this check, an admin
      // impersonating host A could approve a booking belonging to host B,
      // breaking the audit-log promise of the impersonation pretense.
      const adminOverride =
        request.user?.role === "ADMIN" && (request as any).actingHostId === undefined;
      if (booking.hostId !== hostId && !adminOverride) {
        return reply.status(403).send({ message: "Not authorized" });
      }

      if (booking.status !== "PENDING") {
        return reply.status(400).send({
          message: `Cannot approve booking with status ${booking.status}`,
        });
      }

      // BOOKSVC-001: even though create-path blocks new overlapping PENDINGs
      // via CONFLICTING_BOOKING_STATUSES, the host can have multiple
      // overlapping PENDINGs that were all submitted while none of them were
      // approved. Re-scan inside a serializable transaction against the
      // currently-occupying statuses (excluding this booking), 409 if a
      // confirmed/approved overlap now exists, otherwise approve via CAS and
      // auto-reject every other overlapping PENDING for the same window.
      // BOOKSVC-011: wrap with the retry helper.
      // BOOKSVC-012: use updateMany CAS for the approve write itself so a
      // racing cancel/reject can't lose.
      type ApproveResult =
        | { kind: "ok"; rejected: string[] }
        | { kind: "conflict" }
        | { kind: "stale"; status: BookingStatus };

      let result: ApproveResult;
      try {
        result = await runWithSerializableRetry(() =>
          prisma.$transaction(async (tx): Promise<ApproveResult> => {
            const overlappingCandidates = await tx.booking.findMany({
              where: {
                spaceId: booking.spaceId,
                id: { not: id },
                status: { in: CONFLICTING_BOOKING_STATUSES },
                startDate: { lte: booking.endDate },
                endDate: { gte: booking.startDate },
              },
              select: {
                id: true,
                status: true,
                startDate: true,
                endDate: true,
                startTime: true,
                endTime: true,
                isHourly: true,
              },
            });

            const overlapping = overlappingCandidates.filter((candidate) =>
              bookingIntervalsOverlap(
                {
                  endDate: candidate.endDate,
                  endTime: candidate.endTime,
                  isHourly: candidate.isHourly,
                  startDate: candidate.startDate,
                  startTime: candidate.startTime,
                },
                {
                  endDate: booking.endDate,
                  endTime: booking.endTime,
                  isHourly: booking.isHourly,
                  startDate: booking.startDate,
                  startTime: booking.startTime,
                }
              )
            );

            const blocking = overlapping.find(
              (c) => c.status === "CONFIRMED"
            );
            if (blocking) {
              return { kind: "conflict" };
            }

            // BOOKSVC-012 CAS: only flip PENDING -> CONFIRMED, never overwrite
            // a row that another handler has already moved off PENDING.
            const cas = await tx.booking.updateMany({
              where: { id, status: "PENDING" },
              data: { status: "CONFIRMED", approvedAt: new Date() },
            });
            if (cas.count === 0) {
              const refreshed = await tx.booking.findUnique({
                where: { id },
                select: { status: true },
              });
              return { kind: "stale", status: refreshed?.status ?? booking.status };
            }

            // BOOKSVC-001 auto-reject: every other PENDING for the same slot
            // is now unfulfillable. Reject them in the same txn.
            const pendingOverlapIds = overlapping
              .filter((c) => c.status === "PENDING")
              .map((c) => c.id);
            if (pendingOverlapIds.length > 0) {
              await tx.booking.updateMany({
                where: { id: { in: pendingOverlapIds }, status: "PENDING" },
                data: {
                  status: "REJECTED",
                  hostMessage: "Automatically rejected: slot was awarded to another booking",
                },
              });
            }

            return { kind: "ok", rejected: pendingOverlapIds };
          }, { isolationLevel: 'Serializable' })
        );
      } catch (err) {
        if (isSerializationFailure(err)) {
          return reply.status(503).send({
            message: "Booking system is busy, please retry shortly",
          });
        }
        throw err;
      }

      if (result.kind === "conflict") {
        return reply.status(409).send({
          message: "Slot is no longer available — another booking has been confirmed for this window",
        });
      }

      if (result.kind === "stale") {
        return reply.status(409).send({
          message: `Cannot approve booking with status ${result.status}`,
        });
      }

      const updatedBooking = await prisma.booking.findUnique({
        where: { id },
        include: { space: true, guest: true },
      });

      // TYPES-004: topic renamed from `booking.approved` to `booking.confirmed`
      // to match the actual state transition (PENDING -> CONFIRMED).
      // TODO(KAFKA-001 follow-up): transactional outbox. Booking status is
      // already updated; do not fail the request if the event publish fails.
      try {
        await producer.send("booking.confirmed", {
          value: {
            bookingId: id,
            guestEmail: booking.guest.email,
            guestName: booking.guest.name,
            spaceName: booking.space.name,
          },
        });
      } catch (err) {
        request.log.error(
          { err, bookingId: id, topic: "booking.confirmed" },
          "Failed to publish booking.confirmed event; status updated but guest will not be notified"
        );
      }

      // Fire rejection events for every PENDING auto-rejected as a side effect
      // of this approval so downstream consumers (email, notifications) react.
      // M9: the email-service consumer gates the whole send on `guestEmail`, so
      // fetch each race-loser's guest email/name and include them in the payload
      // so the consumer's guestEmail guard passes — otherwise those guests are
      // never notified their booking lost the slot.
      // M8/M9: this is a POST-COMMIT side effect (the approve + auto-reject are
      // already durable). Wrap the whole notify block in a log-and-continue
      // try/catch (KAFKA-001 pattern) so a transient DB error on the email
      // lookup, or a broker outage, can't 500 an approval that already
      // succeeded (which would also strand the reject notifications and make a
      // host retry hit the CAS with a contradictory 409).
      try {
        const rejectedBookings =
          result.rejected.length > 0
            ? await prisma.booking.findMany({
                where: { id: { in: result.rejected } },
                select: {
                  id: true,
                  guest: { select: { email: true, name: true } },
                },
              })
            : [];

        // Await each publish inside Promise.allSettled so one broker failure
        // doesn't reject the whole batch or crash the worker with an unhandled
        // rejection; log each failure and carry on.
        const rejectionPublishResults = await Promise.allSettled(
          rejectedBookings.map((rejected) =>
            producer.send("booking.rejected", {
              value: {
                bookingId: rejected.id,
                guestEmail: rejected.guest.email,
                guestName: rejected.guest.name,
                spaceName: booking.space.name,
                reason:
                  "Automatically rejected: slot was awarded to another booking",
              },
            })
          )
        );
        rejectionPublishResults.forEach((outcome, idx) => {
          if (outcome.status === "rejected") {
            request.log.error(
              {
                err: outcome.reason,
                bookingId: rejectedBookings[idx]?.id,
                topic: "booking.rejected",
              },
              "Failed to publish auto-reject booking.rejected event; guest will not be notified"
            );
          }
        });
      } catch (err) {
        request.log.error(
          { err, topic: "booking.rejected" },
          "Failed to notify auto-rejected guests after a committed approval; booking state is durable, notifications skipped"
        );
      }

      return reply.send(updatedBooking);
    }
  );

  // Reject booking (Host)
  fastify.put(
    "/bookings/:id/reject",
    { preHandler: [shouldBeHost, resolveActingHost] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const hostId = request.userId!;
      const { reason } = request.body as { reason?: string };

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { space: true, guest: { select: { email: true } } },
      });

      if (!booking) {
        return reply.status(404).send({ message: "Booking not found" });
      }

      // Blanket ADMIN override is suspended while impersonating a specific
      // host (see /approve for the full rationale).
      const adminOverride =
        request.user?.role === "ADMIN" && (request as any).actingHostId === undefined;
      if (booking.hostId !== hostId && !adminOverride) {
        return reply.status(403).send({ message: "Not authorized" });
      }

      if (booking.status !== "PENDING") {
        return reply.status(400).send({
          message: `Cannot reject booking with status ${booking.status}`,
        });
      }

      // BOOKSVC-012: compare-and-swap so a concurrent approve/cancel can't
      // be silently overwritten.
      const cas = await prisma.booking.updateMany({
        where: { id, status: "PENDING" },
        data: {
          status: "REJECTED",
          hostMessage: reason,
        },
      });
      if (cas.count === 0) {
        const refreshed = await prisma.booking.findUnique({
          where: { id },
          select: { status: true },
        });
        return reply.status(409).send({
          message: `Cannot reject booking with status ${refreshed?.status ?? "UNKNOWN"}`,
        });
      }
      const updatedBooking = await prisma.booking.findUnique({
        where: { id },
      });

      // TODO(KAFKA-001 follow-up): transactional outbox. DB write already
      // committed; log + continue rather than misleading the host.
      try {
        await producer.send("booking.rejected", {
          value: {
            bookingId: id,
            guestEmail: booking.guest.email,
            spaceName: booking.space.name,
            reason,
          },
        });
      } catch (err) {
        request.log.error(
          { err, bookingId: id, topic: "booking.rejected" },
          "Failed to publish booking.rejected event; guest will not be notified"
        );
      }

      return reply.send(updatedBooking);
    }
  );

  // Cancel booking (Guest or Host)
  fastify.post(
    "/bookings/:id/cancel",
    { preHandler: shouldBeUser },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.userId!;
      const { reason } = request.body as { reason?: string };

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          // AUDIT-B8 (M5): pull the venue's IANA timezone so the refund cutoff
          // interprets the booking's local startTime correctly (see below).
          space: { include: { venue: { select: { timezone: true } } } },
          guest: { select: { email: true, name: true } },
          host: { select: { email: true, name: true } },
        },
      });

      if (!booking) {
        return reply.status(404).send({ message: "Booking not found" });
      }

      const isGuest = booking.guestId === userId;
      const isHost = booking.hostId === userId;
      const isAdmin = request.user?.role === "ADMIN";

      if (!isGuest && !isHost && !isAdmin) {
        return reply.status(403).send({ message: "Not authorized" });
      }

      const cancellableStatuses: BookingStatus[] = ["PENDING", "CONFIRMED"];
      if (!cancellableStatuses.includes(booking.status)) {
        return reply.status(400).send({
          message: `Cannot cancel booking with status ${booking.status}`,
        });
      }

      // BOOKSVC-004+012: apply the space's cancellation policy AND use
      // compare-and-swap so a concurrent approve/reject can't be silently
      // overwritten. Refund policy (FLEXIBLE/MODERATE/STRICT/NON_REFUNDABLE)
      // is enforced only for GUEST cancellations of CONFIRMED bookings; HOST
      // and ADMIN cancellations always refund 100%.
      const actor = isGuest ? "GUEST" : isHost ? "HOST" : "ADMIN";
      const now = new Date();
      const policy = booking.space.cancellationPolicy as
        | "FLEXIBLE"
        | "MODERATE"
        | "STRICT"
        | "NON_REFUNDABLE";

      // AUDIT-B8 (M5): resolve check-in as a REAL UTC instant from the local
      // wall-clock startDate+startTime in the venue's timezone. The old code
      // did checkinAt.setUTCHours(h, m), treating a LOCAL "HH:MM" as UTC, so
      // for Europe/Chisinau (UTC+2/+3) hoursUntilCheckin was off by the zone
      // offset and could tip a booking across a refund bracket (e.g. a ~23h
      // check-in mis-read as >24h). Falls back to the platform default zone.
      const venueTimezone =
        booking.space.venue?.timezone ?? DEFAULT_VENUE_TIMEZONE;
      const checkinAt = localWallClockToUtc(
        booking.startDate,
        booking.startTime,
        venueTimezone
      );
      const hoursUntilCheckin = (checkinAt.getTime() - now.getTime()) / 3_600_000;

      let refundRate: number;
      if (actor !== "GUEST" || booking.status === "PENDING") {
        refundRate = 1;
      } else {
        refundRate = computeRefundRate(policy, hoursUntilCheckin);
      }
      const refundAmount = round2(booking.totalAmount * refundRate);

      // BOOKSVC-012: compare-and-swap to avoid a concurrent state transition.
      const cas = await prisma.booking.updateMany({
        where: { id, status: { in: cancellableStatuses } },
        data: {
          status: "CANCELLED",
          cancelledAt: now,
          cancelledByRole: actor,
          cancellationReason: reason,
        },
      });
      if (cas.count === 0) {
        const refreshed = await prisma.booking.findUnique({
          where: { id },
          select: { status: true },
        });
        return reply.status(409).send({
          message: `Cannot cancel booking with status ${refreshed?.status ?? "UNKNOWN"}`,
        });
      }
      const updatedBooking = await prisma.booking.findUnique({ where: { id } });

      // TODO(KAFKA-001 follow-up): transactional outbox. DB write already
      // committed; log + continue rather than reverse a successful cancel.
      try {
        await producer.send("booking.cancelled", {
          value: {
            bookingId: id,
            cancelledByRole: actor,
            guestEmail: booking.guest.email,
            guestName: booking.guest.name,
            hostEmail: booking.host.email,
            hostName: booking.host.name,
            spaceName: booking.space.name,
            reason,
            cancellationPolicy: policy,
            hoursUntilCheckin: round2(hoursUntilCheckin),
            refundRate,
            refundAmount,
            currency: booking.currency,
          },
        });
      } catch (err) {
        request.log.error(
          { err, bookingId: id, topic: "booking.cancelled" },
          "Failed to publish booking.cancelled event; counterparty will not be notified"
        );
      }

      return reply.send({
        ...updatedBooking,
        refund: {
          policy,
          rate: refundRate,
          amount: refundAmount,
          currency: booking.currency,
          hoursUntilCheckin: round2(hoursUntilCheckin),
        },
      });
    }
  );

  // Mark booking as completed (Host)
  fastify.put(
    "/bookings/:id/complete",
    { preHandler: [shouldBeHost, resolveActingHost] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const hostId = request.userId!;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { space: true, guest: { select: { email: true } } },
      });

      if (!booking) {
        return reply.status(404).send({ message: "Booking not found" });
      }

      // Blanket ADMIN override is suspended while impersonating a specific
      // host (see /approve for the full rationale).
      const adminOverride =
        request.user?.role === "ADMIN" && (request as any).actingHostId === undefined;
      if (booking.hostId !== hostId && !adminOverride) {
        return reply.status(403).send({ message: "Not authorized" });
      }

      if (booking.status !== "CONFIRMED") {
        return reply.status(400).send({
          message: "Booking must be confirmed to be completed",
        });
      }

      // BOOKSVC-012: compare-and-swap so a concurrent cancel can't be silently
      // overwritten by completion.
      // H4: create the host Payout in the SAME transaction as the CONFIRMED->
      // COMPLETED flip. The CAS makes the whole block run exactly once per
      // booking (a retry or a concurrent complete sees status!=CONFIRMED and
      // 409s), so the payout is created exactly once and atomically with
      // completion — no lost-event window, and no dependency on a downstream
      // consumer that never existed. amount = what the guest paid; platformFee =
      // the commission the platform keeps; netAmount = the host's take-home.
      const casCount = await prisma.$transaction(async (tx) => {
        const cas = await tx.booking.updateMany({
          where: { id, status: "CONFIRMED" },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
        if (cas.count === 0) return 0;

        const amount = roundCurrency(booking.totalAmount);
        const platformFee = roundCurrency(booking.serviceFee);
        await tx.payout.create({
          data: {
            hostId: booking.hostId,
            amount,
            platformFee,
            netAmount: roundCurrency(amount - platformFee),
            currency: booking.currency,
            // status defaults to PENDING; a real disbursement flow flips it to
            // PROCESSING/COMPLETED later. Until then it feeds the host earnings
            // endpoint's pendingPayout (per-currency).
            bookingIds: [id],
          },
        });
        return cas.count;
      });
      if (casCount === 0) {
        const refreshed = await prisma.booking.findUnique({
          where: { id },
          select: { status: true },
        });
        return reply.status(409).send({
          message: `Cannot complete booking with status ${refreshed?.status ?? "UNKNOWN"}`,
        });
      }
      const updatedBooking = await prisma.booking.findUnique({
        where: { id },
      });

      // TODO(KAFKA-001 follow-up): transactional outbox. The payout + completion
      // are already committed atomically above; this event only drives the
      // guest completion email and can be replayed manually if publish fails.
      try {
        await producer.send("booking.completed", {
          value: {
            bookingId: id,
            guestEmail: booking.guest.email,
            spaceName: booking.space.name,
            hostId: booking.hostId,
            totalAmount: booking.totalAmount,
          },
        });
      } catch (err) {
        request.log.error(
          { err, bookingId: id, topic: "booking.completed" },
          "Failed to publish booking.completed event; the payout is already committed, only the guest completion email is affected and can be replayed"
        );
      }

      return reply.send(updatedBooking);
    }
  );

  // Get all bookings (Admin)
  fastify.get(
    "/bookings",
    { preHandler: shouldBeAdmin },
    async (request, reply) => {
      const { status, limit, page = 1 } = request.query as {
        status?: string;
        limit?: string;
        page?: string;
      };
      const parsedStatus = parseBookingStatus(status);
      if (parsedStatus === null) {
        return reply.status(400).send({ message: "Invalid booking status" });
      }

      let take: number;
      let pageNumber: number;
      try {
        // Both calls have a fallback so they always return a number.
        take = parsePositiveInteger(limit, 20, 100)!;
        pageNumber = parsePositiveInteger(page, 1)!;
      } catch (err) {
        if (err instanceof InvalidParameterError) {
          return reply.status(400).send({ message: "Invalid pagination" });
        }
        throw err;
      }
      const skip = (pageNumber - 1) * take;
      const where = parsedStatus ? { status: parsedStatus } : undefined;

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: "desc" },
          include: {
            space: true,
            guest: { select: { id: true, name: true, email: true } },
            host: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.booking.count({ where }),
      ]);

      return reply.send({
        bookings,
        pagination: {
          page: pageNumber,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    }
  );

  // Get booking stats (Admin)
  fastify.get(
    "/bookings/stats",
    { preHandler: shouldBeAdmin },
    async (request, reply) => {
      const { tz: tzParam } = request.query as { tz?: string };
      const tz = typeof tzParam === "string" && tzParam.length > 0 ? tzParam : "UTC";

      const now = new Date();
      const sixMonthsAgo = startOfMonth(subMonths(now, 5));

      // BOOKSVC-006: bucket boundaries should follow the admin's tz, not the
      // server's local clock. The chartData below still buckets by UTC month to
      // stay stable across deploys, but `todayStart`/`weekStart`/`monthStart`
      // surface tz-aware bounds for the dashboard's "today / this week / this
      // month" tiles.
      const { todayStart, weekStart, monthStart } = getTzPeriodBounds(now, tz);

      const [
        totalBookings,
        pendingBookings,
        completedBookings,
        revenueByCurrency,
        monthlyData,
        revenueTodayByCurrency,
        revenueThisWeekByCurrency,
        revenueThisMonthByCurrency,
      ] = await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: "PENDING" } }),
        prisma.booking.count({ where: { status: "COMPLETED" } }),
        // BOOKSVC-006 (+005): group by currency so admins never see
        // meaningless cross-currency sums.
        prisma.booking.groupBy({
          by: ["currency"],
          where: { status: "COMPLETED" },
          _sum: { totalAmount: true },
        }),
        prisma.booking.findMany({
          where: { createdAt: { gte: sixMonthsAgo } },
          select: {
            createdAt: true,
            status: true,
            totalAmount: true,
            currency: true,
            exchangeRate: true,
          },
        }),
        prisma.booking.groupBy({
          by: ["currency"],
          where: { status: "COMPLETED", completedAt: { gte: todayStart } },
          _sum: { totalAmount: true },
        }),
        prisma.booking.groupBy({
          by: ["currency"],
          where: { status: "COMPLETED", completedAt: { gte: weekStart } },
          _sum: { totalAmount: true },
        }),
        prisma.booking.groupBy({
          by: ["currency"],
          where: { status: "COMPLETED", completedAt: { gte: monthStart } },
          _sum: { totalAmount: true },
        }),
      ]);

      const groupRowsToTotals = (
        rows: Array<{ currency: string; _sum: { totalAmount: number | null } }>
      ) =>
        rows.map((row) => ({
          currency: row.currency,
          total: round2(row._sum.totalAmount ?? 0),
        }));

      // Group by month
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];

      // TYPES-002: chart `revenue` must be in a single currency. Normalize each
      // booking to USD by multiplying by the exchange rate recorded at booking
      // time, otherwise summing mixed currencies produces nonsense.
      const chartData: BookingChartType[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const year = d.getFullYear();
        const month = d.getMonth();

        const monthBookings = monthlyData.filter((b) => {
          const bDate = new Date(b.createdAt);
          return bDate.getFullYear() === year && bDate.getMonth() === month;
        });

        // Build revenue per currency for this month bucket.
        const revenueByCurrencyForMonth = new Map<string, number>();
        for (const b of monthBookings) {
          if (b.status !== "COMPLETED") continue;
          const prev = revenueByCurrencyForMonth.get(b.currency) ?? 0;
          revenueByCurrencyForMonth.set(b.currency, prev + b.totalAmount);
        }

        chartData.push({
          month: monthNames[month]!,
          total: monthBookings.length,
          confirmed: monthBookings.filter(
            (b) => b.status === "CONFIRMED" || b.status === "COMPLETED"
          ).length,
          // TYPES-002: chart `revenue` is a single number, USD-normalized via
          // the exchangeRate recorded at booking time. Per-currency breakdowns
          // are surfaced separately in the parent stats response.
          revenue: round2(
            monthBookings
              .filter((b) => b.status === "COMPLETED")
              .reduce(
                (sum, b) => sum + b.totalAmount * Number(b.exchangeRate ?? 1),
                0
              )
          ),
          currency: "USD",
        });
      }

      return reply.send({
        timezone: tz,
        totalBookings,
        pendingBookings,
        completedBookings,
        revenueByCurrency: groupRowsToTotals(
          revenueByCurrency as Array<{ currency: string; _sum: { totalAmount: number | null } }>
        ),
        revenueToday: groupRowsToTotals(
          revenueTodayByCurrency as Array<{ currency: string; _sum: { totalAmount: number | null } }>
        ),
        revenueThisWeek: groupRowsToTotals(
          revenueThisWeekByCurrency as Array<{ currency: string; _sum: { totalAmount: number | null } }>
        ),
        revenueThisMonth: groupRowsToTotals(
          revenueThisMonthByCurrency as Array<{ currency: string; _sum: { totalAmount: number | null } }>
        ),
        chartData,
      });
    }
  );

  // Host earnings
  fastify.get(
    "/bookings/host/earnings",
    { preHandler: [shouldBeHost, resolveActingHost] },
    async (request, reply) => {
      const hostId = request.userId!;

      // BOOKSVC-005: aggregate by currency so we never produce meaningless
      // mixed-currency totals like "USD 100 + MDL 1800 = 1900".
      const [completedByCurrency, pendingPayouts, earnings] = await Promise.all([
        prisma.booking.groupBy({
          by: ["currency"],
          where: {
            hostId,
            status: "COMPLETED",
          },
          _sum: {
            totalAmount: true,
            serviceFee: true,
          },
        }),
        // M10: group payouts by currency (like completedByCurrency above) so
        // we emit per-currency arrays instead of a scalar that silently sums
        // across currencies (e.g. MDL + USD).
        prisma.payout.groupBy({
          by: ["currency"],
          where: {
            hostId,
            status: { in: ["PENDING", "PROCESSING"] },
          },
          _sum: { netAmount: true },
        }),
        prisma.payout.groupBy({
          by: ["currency"],
          where: {
            hostId,
            status: "COMPLETED",
          },
          _sum: { netAmount: true },
        }),
      ]);

      const earningsByCurrency = completedByCurrency.map((row) => {
        const total = row._sum.totalAmount ?? 0;
        const fees = row._sum.serviceFee ?? 0;
        return {
          currency: row.currency,
          totalEarnings: round2(total - fees),
          platformFees: round2(fees),
          grossRevenue: round2(total),
        };
      });

      return reply.send({
        earningsByCurrency,
        // M10: per-currency payout arrays mirroring earningsByCurrency's shape,
        // so mixed-currency payouts are never collapsed into a single scalar.
        pendingPayout: pendingPayouts.map((row) => ({
          currency: row.currency,
          amount: round2(row._sum.netAmount ?? 0),
        })),
        completedPayouts: earnings.map((row) => ({
          currency: row.currency,
          amount: round2(row._sum.netAmount ?? 0),
        })),
      });
    }
  );
};
