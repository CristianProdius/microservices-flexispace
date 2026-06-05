import assert from "node:assert/strict";
import test from "node:test";

import { calculateBookingPricing } from "./booking-pricing.ts";

const baseSpace = {
  cleaningFee: 0,
  currency: "MDL",
  pricePerDay: 10000,
  pricePerHour: 1500,
  pricingTiers: [
    { id: 1, spaceId: 14, minutes: 60, label: "1 hour", price: 1500 },
    { id: 2, spaceId: 14, minutes: 240, label: "4 hours (half day)", price: 4500 },
    { id: 3, spaceId: 14, minutes: 1440, label: "1 day", price: 10000 },
    { id: 4, spaceId: 14, minutes: 2880, label: "2 days", price: 12000 },
  ],
  pricingType: "BOTH",
};

test("hourly bookings use the best configured pricing tier", () => {
  const pricing = calculateBookingPricing({
    bookingType: "hourly",
    endDate: "",
    endTime: "13:00",
    space: baseSpace,
    startDate: "2026-05-25",
    startTime: "09:00",
  });

  assert.equal(pricing?.subtotal, 4500);
  assert.equal(pricing?.serviceFee, 450);
  assert.equal(pricing?.totalAmount, 4950);
  assert.deepEqual(pricing?.appliedTier, {
    label: "4 hours (half day)",
    minutes: 240,
    price: 4500,
    units: 1,
  });
});

test("daily bookings can use multi-day configured pricing tiers", () => {
  const pricing = calculateBookingPricing({
    bookingType: "daily",
    endDate: "2026-05-26",
    endTime: "17:00",
    space: baseSpace,
    startDate: "2026-05-25",
    startTime: "09:00",
  });

  assert.equal(pricing?.days, 2);
  assert.equal(pricing?.subtotal, 12000);
  assert.equal(pricing?.serviceFee, 1200);
  assert.equal(pricing?.totalAmount, 13200);
});

test("inclusive day count treats same-day bookings as 1 day", () => {
  const pricing = calculateBookingPricing({
    bookingType: "daily",
    endDate: "2026-05-25",
    endTime: "",
    space: { ...baseSpace, pricingTiers: [] },
    startDate: "2026-05-25",
    startTime: "",
  });

  assert.equal(pricing?.days, 1);
  assert.equal(pricing?.subtotal, 10000);
});

test("inclusive day count is stable across DST transitions (US spring-forward)", () => {
  // 2026-03-08 is the US DST spring-forward day; a naive local-time diff would
  // return 0.96 days for this 1-night stay, then ceil to 1, dropping the
  // intended "+1" offset. UTC anchoring keeps the result consistent.
  const pricing = calculateBookingPricing({
    bookingType: "daily",
    endDate: "2026-03-09",
    endTime: "",
    space: { ...baseSpace, pricingTiers: [] },
    startDate: "2026-03-08",
    startTime: "",
  });

  assert.equal(pricing?.days, 2);
});

test("hourly bookings allow a 23:59 end-of-day end time", () => {
  // Verifies that the late-evening slot enabled by the new BookingForm options
  // (CLIENT-014) produces a sane pricing result rather than collapsing to the
  // 60-minute minimum.
  const pricing = calculateBookingPricing({
    bookingType: "hourly",
    endDate: "",
    endTime: "23:59",
    space: { ...baseSpace, pricingTiers: [] },
    startDate: "2026-05-25",
    startTime: "23:00",
  });

  assert.ok(pricing);
  assert.ok(pricing.hours > 0.98 && pricing.hours < 1.0);
  assert.ok(pricing.subtotal > 0);
});

test("cleaning fee matches the configured fixed space fee", () => {
  const pricing = calculateBookingPricing({
    bookingType: "hourly",
    endDate: "",
    endTime: "11:00",
    space: {
      ...baseSpace,
      cleaningFee: 275,
      pricingTiers: [],
      pricingType: "HOURLY",
    },
    startDate: "2026-05-25",
    startTime: "09:00",
  });

  assert.equal(pricing?.subtotal, 3000);
  assert.equal(pricing?.cleaningFee, 275);
  assert.equal(pricing?.serviceFee, 300);
  assert.equal(pricing?.totalAmount, 3575);
});
