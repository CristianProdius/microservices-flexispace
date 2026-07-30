import assert from "node:assert/strict";
import test from "node:test";

import { hasBookablePrice, offeredModes } from "./pricing-availability.ts";

test("a mode is offered when its rate is set, including 0 (request-to-book)", () => {
  const m = offeredModes({ pricePerHour: 0, pricePerDay: 50, pricePerMonth: null });
  assert.equal(m.hourly, true); // 0 is offered, not "contact"
  assert.equal(m.daily, true);
  assert.equal(m.monthly, false); // null rate, no plans
});

test("an unset (null/undefined) rate is not offered", () => {
  const m = offeredModes({ pricePerHour: null });
  assert.equal(m.hourly, false);
  assert.equal(m.daily, false);
  assert.equal(m.monthly, false);
});

test("monthly is offered by a base rate OR named plans", () => {
  assert.equal(offeredModes({ pricePerMonth: 500 }).monthly, true);
  assert.equal(
    offeredModes({ pricePerMonth: null, monthlyPlans: [{ id: 1 }] }).monthly,
    true,
  );
  assert.equal(offeredModes({ pricePerMonth: null, monthlyPlans: [] }).monthly, false);
});

test("hasBookablePrice: any offered mode shows the box; a 0 rate still books", () => {
  assert.equal(hasBookablePrice({ pricePerHour: 10 }), true);
  assert.equal(hasBookablePrice({ pricePerHour: 0 }), true); // 0 -> request-to-book box
  assert.equal(hasBookablePrice({ pricePerDay: 0 }), true);
  assert.equal(hasBookablePrice({ pricePerMonth: 0 }), true);
  assert.equal(hasBookablePrice({ monthlyPlans: [{ id: 1 }] }), true);
});

test("hasBookablePrice: only a space with no offered mode is contact-for-pricing", () => {
  assert.equal(
    hasBookablePrice({ pricePerHour: null, pricePerDay: null, pricePerMonth: null }),
    false,
  );
  assert.equal(hasBookablePrice({}), false);
});
