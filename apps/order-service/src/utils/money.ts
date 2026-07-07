// SF-PAY-01: integer minor-unit money helpers. USD, EUR and MDL are all
// 2-decimal currencies, so a single factor of 100 is correct for every
// Currency enum member. All Stripe amounts MUST come from these helpers —
// never from Float columns directly.
const MINOR_FACTOR = 100;

export class MoneyConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyConversionError";
  }
}

/** Convert a major-unit Float (e.g. Booking.totalAmount) to integer minor units. */
export const toMinorUnits = (amountMajor: number): number => {
  if (!Number.isFinite(amountMajor) || amountMajor < 0) {
    throw new MoneyConversionError(`Cannot convert ${amountMajor} to minor units`);
  }
  const minor = Math.round(amountMajor * MINOR_FACTOR);
  if (!Number.isSafeInteger(minor)) {
    throw new MoneyConversionError(
      `Amount ${amountMajor} exceeds safe integer minor units`
    );
  }
  return minor;
};

/** Platform commission in minor units. Rate clamped to [0,1] (mirrors resolveCommissionRate). */
export const commissionMinor = (subtotalMinor: number, rate: number): number => {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(rate) ? rate : 0));
  return Math.round(subtotalMinor * clamped);
};

/**
 * How much may be refunded now: policy rate applied to the captured amount,
 * capped by what has not been refunded yet. Never negative.
 */
export const refundableMinor = (
  capturedMinor: number,
  alreadyRefundedMinor: number,
  rate: number
): number => {
  const byRate = Math.round(capturedMinor * Math.max(0, Math.min(1, rate)));
  return Math.max(0, Math.min(byRate, capturedMinor - alreadyRefundedMinor));
};
