import Stripe from "stripe";

// SF-PAY-01 feature flags. Payments and Stripe-executed payouts are gated
// separately so payments can ship while payouts stay manual.
export const paymentsEnabled = (): boolean =>
  process.env.PAYMENTS_ENABLED === "true";

export const stripePayoutsEnabled = (): boolean =>
  paymentsEnabled() && process.env.PAYOUTS_VIA_STRIPE_ENABLED === "true";

let client: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set — required when PAYMENTS_ENABLED=true"
      );
    }
    client = new Stripe(key);
  }
  return client;
};

/** Test hook: drop the memoized client so env stubs take effect. */
export const resetStripeForTests = () => {
  client = null;
};
