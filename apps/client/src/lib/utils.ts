import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Space } from "@repo/types"
import { formatCurrencyPrice, formatCurrencyPriceFull } from "./currency";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Parse images field — handles both array and stringified array */
export const parseImages = (images: unknown): string[] => {
  if (Array.isArray(images)) return images;
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

/** Convert price (stored in dollars) to a display string (e.g. "$5,000") */
export const formatPrice = (price: number | null | undefined, currency?: string): string | null => {
  if (price == null) return null;
  return formatCurrencyPrice(price, currency);
};

/** Convert price (stored in dollars) to a full display string with cents (e.g. "$5,000.00") */
export const formatPriceFull = (price: number | null | undefined, currency?: string): string => {
  if (price == null) return formatCurrencyPriceFull(0, currency);
  return formatCurrencyPriceFull(price, currency);
};

/**
 * Parse a calendar-day string (YYYY-MM-DD or a UTC-midnight ISO timestamp from
 * the API) into a Date constructed in *local* time, so toLocaleDateString
 * renders the same calendar day the user intended.
 *
 * Booking dates come back from the API as e.g. "2026-06-05T00:00:00.000Z".
 * `new Date("2026-06-05T00:00:00.000Z").toLocaleDateString()` for a user
 * west of UTC returns the previous day (because UTC midnight is the day
 * before in their timezone). CLIENT-002 fixed the upcoming/past filter on
 * the bookings list this way; this helper extends the same fix to every
 * display site that renders a booking date.
 */
export const formatBookingDate = (
  isoOrDayString: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  },
  locale?: string
): string => {
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
    // Fall back to the raw value so we surface bad input rather than crash.
    return isoOrDayString;
  }
  // Local-time constructor anchors the Date to the user's calendar day.
  return new Date(year, month - 1, day).toLocaleDateString(locale, options);
};

export interface PriceLabels {
  perHr: string;
  perDay: string;
  // Optional so existing callers that predate MONTHLY pricing still compile;
  // the formatter falls back to "/mo" when a caller doesn't supply it.
  perMonth?: string;
  from: string;
  contactForPricing: string;
}

export const defaultPriceLabels: PriceLabels = {
  perHr: "/hr",
  perDay: "/day",
  perMonth: "/mo",
  from: "From",
  contactForPricing: "Contact for pricing",
};

export const compactPriceLabels: PriceLabels = {
  perHr: "/hr",
  perDay: "/day",
  perMonth: "/mo",
  from: "",
  contactForPricing: "Contact",
};

// Flexible pricing: a space may offer any combination of hourly/daily/monthly,
// so the headline shows EVERY option the host filled in (e.g. "$5/hr · $30/day ·
// $500/mo") rather than a single pricingType-driven branch. A mode is shown when
// its rate is set (non-null, including 0 — a 0 is a request-to-book listing).
// Monthly falls back to the cheapest named plan when there's no base rate.
export const getPriceDisplay = (
  space: {
    pricingType?: Space["pricingType"] | string;
    pricePerHour: number | null;
    pricePerDay: number | null;
    pricePerMonth?: number | null;
    monthlyPlans?: Array<{ pricePerMonth: number }> | null;
    currency?: string;
  },
  labels: PriceLabels = defaultPriceLabels,
): string => {
  const c = (space as any).currency;
  const perMonth = labels.perMonth ?? "/mo";
  const parts: string[] = [];
  if (space.pricePerHour != null)
    parts.push(`${formatPrice(space.pricePerHour, c)}${labels.perHr}`);
  if (space.pricePerDay != null)
    parts.push(`${formatPrice(space.pricePerDay, c)}${labels.perDay}`);
  if (space.pricePerMonth != null) {
    parts.push(`${formatPrice(space.pricePerMonth, c)}${perMonth}`);
  } else if ((space.monthlyPlans?.length ?? 0) > 0) {
    const min = Math.min(...space.monthlyPlans!.map((p) => p.pricePerMonth));
    const fromPrefix = labels.from ? `${labels.from} ` : "";
    parts.push(`${fromPrefix}${formatPrice(min, c)}${perMonth}`);
  }
  if (parts.length === 0) return labels.contactForPricing;
  return parts.join(" · ");
};
