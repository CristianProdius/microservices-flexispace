import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveMonthlyRate,
  calculateMonthlyEstimate,
} from "./monthly-estimate.ts";

// resolveMonthlyRate — picks the selected plan's rate when plans exist,
// otherwise falls back to the space's base pricePerMonth.

test("resolveMonthlyRate returns the selected plan's price when plans exist", () => {
  const plans = [
    { id: 1, name: "Hot desk", pricePerMonth: 100, description: null, sortOrder: 0 },
    { id: 2, name: "Private office", pricePerMonth: 400, description: null, sortOrder: 1 },
  ];
  assert.equal(resolveMonthlyRate(200, plans, 2), 400);
  assert.equal(resolveMonthlyRate(200, plans, 1), 100);
});

test("resolveMonthlyRate returns null when plans exist but none selected", () => {
  const plans = [
    { id: 1, name: "Hot desk", pricePerMonth: 100, description: null, sortOrder: 0 },
  ];
  assert.equal(resolveMonthlyRate(200, plans, null), null);
});

test("resolveMonthlyRate returns null when selected plan id is not in the list", () => {
  const plans = [
    { id: 1, name: "Hot desk", pricePerMonth: 100, description: null, sortOrder: 0 },
  ];
  assert.equal(resolveMonthlyRate(200, plans, 999), null);
});

test("resolveMonthlyRate falls back to base pricePerMonth when there are no plans", () => {
  assert.equal(resolveMonthlyRate(200, [], null), 200);
  assert.equal(resolveMonthlyRate(200, undefined, null), 200);
});

// calculateMonthlyEstimate — spreads the rate over ~30 days for the inclusive
// day range; drives the sidebar subtotal/total.

test("calculateMonthlyEstimate spreads the selected plan rate over 30 days", () => {
  // 30 inclusive days at 400/mo -> subtotal ~400.
  const est = calculateMonthlyEstimate({
    pricePerMonth: 400,
    cleaningFee: 0,
    startDate: "2026-01-01",
    endDate: "2026-01-30",
  });
  assert.equal(est.days, 30);
  assert.equal(est.subtotal, 400);
  assert.equal(est.totalAmount, 400);
});

test("calculateMonthlyEstimate differs between two plan prices", () => {
  const cheap = calculateMonthlyEstimate({
    pricePerMonth: 100,
    cleaningFee: 0,
    startDate: "2026-01-01",
    endDate: "2026-01-30",
  });
  const dear = calculateMonthlyEstimate({
    pricePerMonth: 400,
    cleaningFee: 0,
    startDate: "2026-01-01",
    endDate: "2026-01-30",
  });
  assert.equal(cheap.subtotal, 100);
  assert.equal(dear.subtotal, 400);
  assert.notEqual(cheap.subtotal, dear.subtotal);
});

test("calculateMonthlyEstimate adds the cleaning fee into the total", () => {
  const est = calculateMonthlyEstimate({
    pricePerMonth: 300,
    cleaningFee: 50,
    startDate: "2026-01-01",
    endDate: "2026-01-30",
  });
  assert.equal(est.cleaningFee, 50);
  assert.equal(est.totalAmount, 350);
});

test("calculateMonthlyEstimate returns null without a valid rate or dates", () => {
  assert.equal(
    calculateMonthlyEstimate({ pricePerMonth: null, cleaningFee: 0, startDate: "2026-01-01", endDate: "2026-01-30" }),
    null,
  );
  assert.equal(
    calculateMonthlyEstimate({ pricePerMonth: 400, cleaningFee: 0, startDate: "", endDate: "" }),
    null,
  );
});
