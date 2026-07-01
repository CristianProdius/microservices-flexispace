import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./SpaceMapPin.tsx", import.meta.url), "utf8");

test("map pin shows the per-month rate for MONTHLY spaces", () => {
  assert.match(
    source,
    /pricingType === "MONTHLY"\s*\?\s*space\.pricePerMonth/,
    "MONTHLY pins should use pricePerMonth as the displayed price",
  );
  assert.match(
    source,
    /pricingType === "MONTHLY"\s*\?\s*"\/mo"/,
    "MONTHLY pins should render a /mo label",
  );
});
