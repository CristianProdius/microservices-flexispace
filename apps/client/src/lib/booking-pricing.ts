import type { PricingTier, SpaceWithHost } from "@repo/types";

export type BookingType = "hourly" | "daily";

export interface BookingPricingInput {
  bookingType: BookingType;
  endDate: string;
  endTime: string;
  space: Pick<
    SpaceWithHost,
    "cleaningFee" | "pricePerDay" | "pricePerHour" | "pricingTiers" | "pricingType"
  >;
  startDate: string;
  startTime: string;
}

export interface AppliedPricingTier {
  label: string;
  minutes: number;
  price: number;
  units: number;
}

export interface BookingPricing {
  appliedTier: AppliedPricingTier | null;
  cleaningFee: number;
  days: number;
  hours: number;
  serviceFee: number;
  subtotal: number;
  totalAmount: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const roundCurrency = (amount: number) => Math.round(amount * 100) / 100;

const minutesFromTime = (value: string) => {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

// CLIENT-009: Parse `YYYY-MM-DD` strings as a date-only value anchored at
// UTC midnight, then round the diff. Using `new Date(str)` works for ISO dates
// but is brittle for partial strings; the explicit parser avoids any DST or
// locale drift between two timestamps that should be exact-day-aligned.
//
// The "+1" is intentional: backend pricing (apps/order-service booking route)
// uses the same `differenceInDays(end, start) + 1` convention, so a single
// overnight stay (Jan 1 -> Jan 2) bills as 2 calendar days. If product later
// switches to a "nights" model both sides must change together.
const inclusiveDayCount = (startDate: string, endDate: string) => {
  const parseDateOnly = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    if (
      typeof year !== "number" ||
      typeof month !== "number" ||
      typeof day !== "number" ||
      Number.isNaN(year) ||
      Number.isNaN(month) ||
      Number.isNaN(day)
    ) {
      return new Date(value).getTime();
    }
    return Date.UTC(year, month - 1, day);
  };

  const startMs = parseDateOnly(startDate);
  const endMs = parseDateOnly(endDate);
  const days = Math.round((endMs - startMs) / DAY_MS) + 1;
  return days > 0 ? days : 1;
};

const bestPricingTier = (
  pricingTiers: PricingTier[] | undefined,
  totalMinutes: number
) => {
  const eligibleTiers = [...(pricingTiers ?? [])]
    .filter((tier) => tier.minutes <= totalMinutes)
    .sort((a, b) => a.minutes - b.minutes);

  return eligibleTiers.at(-1) ?? null;
};

export const calculateBookingPricing = ({
  bookingType,
  endDate,
  endTime,
  space,
  startDate,
  startTime,
}: BookingPricingInput): BookingPricing | null => {
  if (!startDate) return null;
  if (bookingType === "daily" && !endDate) return null;

  const days =
    bookingType === "daily" ? inclusiveDayCount(startDate, endDate) : 1;
  let totalMinutes = days * 24 * 60;
  let hours = 0;

  if (bookingType === "hourly") {
    const minutes = minutesFromTime(endTime) - minutesFromTime(startTime);
    totalMinutes = minutes > 0 ? minutes : 60;
    hours = totalMinutes / 60;
  }

  let subtotal = 0;
  let appliedTier: AppliedPricingTier | null = null;
  const tier = bestPricingTier(space.pricingTiers, totalMinutes);

  if (tier) {
    const units = Math.ceil(totalMinutes / tier.minutes);
    subtotal = roundCurrency(units * tier.price);
    appliedTier = {
      label: tier.label,
      minutes: tier.minutes,
      price: tier.price,
      units,
    };
  } else if (bookingType === "hourly" && space.pricePerHour) {
    subtotal = roundCurrency(hours * space.pricePerHour);
  } else if (bookingType === "daily" && space.pricePerDay) {
    subtotal = roundCurrency(days * space.pricePerDay);
  }

  const cleaningFee = roundCurrency(space.cleaningFee ?? 0);
  const serviceFee = roundCurrency(subtotal * 0.1);
  const totalAmount = roundCurrency(subtotal + cleaningFee + serviceFee);

  return {
    appliedTier,
    cleaningFee,
    days,
    hours,
    serviceFee,
    subtotal,
    totalAmount,
  };
};
