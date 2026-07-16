import type { MonthlyPlanItem } from "@repo/types";

// A MONTHLY space is priced per calendar month, pro-rated for remainder days.
// That pro-ration is authoritative server-side; this module produces a rough
// client-side preview so the booking sidebar can show an approximate
// subtotal/total before checkout. When a space offers named monthly plans the
// preview is driven off the *selected* plan's rate instead of the space's base
// `pricePerMonth`.

export interface MonthlyEstimate {
  days: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  totalAmount: number;
}

/**
 * Resolve the effective monthly rate. When the space has plans, only the
 * selected plan's rate is valid (returns null until one is chosen, mirroring
 * the server which *requires* a plan when plans exist). With no plans it falls
 * back to the space's base `pricePerMonth`.
 */
export const resolveMonthlyRate = (
  basePricePerMonth: number | null | undefined,
  plans: MonthlyPlanItem[] | undefined,
  selectedPlanId: number | null | undefined
): number | null => {
  if (plans && plans.length > 0) {
    if (selectedPlanId == null) return null;
    const plan = plans.find((p) => p.id === selectedPlanId);
    return plan ? plan.pricePerMonth : null;
  }
  return basePricePerMonth ?? null;
};

const round = (n: number) => Math.round(n * 100) / 100;

interface MonthlyEstimateInput {
  pricePerMonth: number | null | undefined;
  cleaningFee: number | null | undefined;
  startDate: string;
  endDate: string;
}

/**
 * Preview a monthly booking by spreading the rate evenly across ~30 days for
 * the inclusive day range (start..end billed as (end - start) + 1 days),
 * mirroring the daily convention used elsewhere in the booking flow.
 */
export const calculateMonthlyEstimate = ({
  pricePerMonth,
  cleaningFee,
  startDate,
  endDate,
}: MonthlyEstimateInput): MonthlyEstimate | null => {
  if (!startDate || !endDate) return null;
  if (!pricePerMonth) return null;

  const parseDay = (v: string) => {
    const [y, m, d] = v.split("-").map(Number);
    return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
  };
  const days = Math.max(
    1,
    Math.round((parseDay(endDate) - parseDay(startDate)) / 86400000) + 1
  );
  const subtotal = round((pricePerMonth * days) / 30);
  const fee = round(cleaningFee ?? 0);
  return {
    days,
    subtotal,
    cleaningFee: fee,
    serviceFee: 0,
    totalAmount: round(subtotal + fee),
  };
};
