import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./utils.ts", import.meta.url), "utf8");

test("PriceLabels exposes a perMonth label defaulting to /mo", () => {
  assert.match(source, /perMonth:\s*string/, "PriceLabels should declare perMonth");
  assert.match(
    source,
    /perMonth:\s*"\/mo"/,
    "Default/compact labels should set perMonth to /mo",
  );
});

test("getPriceDisplay renders the per-month rate for MONTHLY spaces", () => {
  assert.match(
    source,
    /pricingType === "MONTHLY" && space\.pricePerMonth/,
    "MONTHLY branch should read pricePerMonth",
  );
  assert.match(
    source,
    /formatPrice\(space\.pricePerMonth, c\)\}\$\{labels\.perMonth\}/,
    "MONTHLY branch should format pricePerMonth with the perMonth label",
  );
});
