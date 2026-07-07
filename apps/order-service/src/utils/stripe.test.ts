import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getStripe,
  paymentsEnabled,
  resetStripeForTests,
  stripePayoutsEnabled,
} from "./stripe.js";

describe("stripe client + flags", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    resetStripeForTests();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("paymentsEnabled only when PAYMENTS_ENABLED === 'true'", () => {
    vi.stubEnv("PAYMENTS_ENABLED", "true");
    expect(paymentsEnabled()).toBe(true);
    vi.stubEnv("PAYMENTS_ENABLED", "false");
    expect(paymentsEnabled()).toBe(false);
    vi.stubEnv("PAYMENTS_ENABLED", "");
    expect(paymentsEnabled()).toBe(false);
  });

  it("stripePayoutsEnabled requires both flags", () => {
    vi.stubEnv("PAYMENTS_ENABLED", "true");
    vi.stubEnv("PAYOUTS_VIA_STRIPE_ENABLED", "true");
    expect(stripePayoutsEnabled()).toBe(true);
    vi.stubEnv("PAYMENTS_ENABLED", "false");
    expect(stripePayoutsEnabled()).toBe(false);
  });

  it("getStripe throws a clear error when the key is missing", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(() => getStripe()).toThrow(/STRIPE_SECRET_KEY/);
  });

  it("getStripe returns a memoized client", () => {
    expect(getStripe()).toBe(getStripe());
  });
});
