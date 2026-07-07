export function computeRefundMinor(options: {
  amountMinor: number;
  refundedMinor: number;
  rate: number;
}): number {
  const remaining = options.amountMinor - options.refundedMinor;
  return Math.round(remaining * options.rate);
}

export function assertRefundable(
  payment: { amountMinor: number; refundedMinor: number },
  refundMinor: number
): void {
  if (payment.refundedMinor + refundMinor > payment.amountMinor) {
    const error = new Error("REFUND_EXCEEDS_CAPTURED");
    (error as Error & { code: string }).code = "REFUND_EXCEEDS_CAPTURED";
    throw error;
  }
}
