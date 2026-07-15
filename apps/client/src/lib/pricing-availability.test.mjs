import assert from "node:assert/strict";
import test from "node:test";

import { hasBookablePrice } from "./pricing-availability.ts";

test("HOURLY: positive rate is bookable; 0 or null is contact-for-pricing", () => {
  assert.equal(hasBookablePrice({ pricingType: "HOURLY", pricePerHour: 10 }), true);
  assert.equal(hasBookablePrice({ pricingType: "HOURLY", pricePerHour: 0 }), false);
  assert.equal(hasBookablePrice({ pricingType: "HOURLY", pricePerHour: null }), false);
});

test("DAILY: a 0 rate is contact-for-pricing", () => {
  assert.equal(hasBookablePrice({ pricingType: "DAILY", pricePerDay: 50 }), true);
  assert.equal(hasBookablePrice({ pricingType: "DAILY", pricePerDay: 0 }), false);
});

test("BOTH: bookable when either rate is positive", () => {
  assert.equal(
    hasBookablePrice({ pricingType: "BOTH", pricePerHour: 0, pricePerDay: 0 }),
    false,
  );
  assert.equal(
    hasBookablePrice({ pricingType: "BOTH", pricePerHour: 0, pricePerDay: 50 }),
    true,
  );
  assert.equal(
    hasBookablePrice({ pricingType: "BOTH", pricePerHour: 20, pricePerDay: 0 }),
    true,
  );
});

test("MONTHLY is always considered bookable", () => {
  assert.equal(hasBookablePrice({ pricingType: "MONTHLY" }), true);
});
