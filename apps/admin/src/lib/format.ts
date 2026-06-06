/**
 * Format an amount as a localized currency string. Defaults to USD when the
 * caller doesn't have a currency (legacy bookings, fallback path).
 */
export function formatMoney(
  amount: number | null | undefined,
  currency?: string | null,
  options: Intl.NumberFormatOptions = {}
): string {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    ...options,
  }).format(value);
}

/**
 * Parse a calendar-day string (YYYY-MM-DD or a UTC-midnight ISO timestamp from
 * the API) into a Date constructed in *local* time. Mirrors the same fix that
 * `apps/client/src/lib/utils.ts` `formatBookingDate` applies for the client app
 * — keeps month-grouping and calendar-day display consistent for users west of
 * UTC. Returns `null` if the value can't be parsed so callers can fall back.
 */
export function parseBookingDay(isoOrDayString: string): Date | null {
  const dayStr = isoOrDayString.slice(0, 10);
  const parts = dayStr.split("-").map(Number);
  const [year, month, day] = parts;
  if (
    parts.length !== 3 ||
    year === undefined ||
    month === undefined ||
    day === undefined ||
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }
  return new Date(year, month - 1, day);
}

export function formatBookingDate(
  isoOrDayString: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  },
  locale?: string
): string {
  const parsed = parseBookingDay(isoOrDayString);
  if (!parsed) return isoOrDayString;
  return parsed.toLocaleDateString(locale, options);
}
