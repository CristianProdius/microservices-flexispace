import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// NOTE: these assert against the SOURCE TEXT rather than importing
// getPriceDisplay, because utils.ts uses extensionless relative imports
// (e.g. `./currency`) that Next.js/tsc resolve but `node --test` cannot. The
// patterns are kept loose enough to survive defensive refactors of the source
// (an optional `perMonth?` label, a `?? "/mo"` fallback) while still pinning
// the MONTHLY display behavior.
const source = readFileSync(new URL("./utils.ts", import.meta.url), "utf8");

test("PriceLabels exposes a perMonth label defaulting to /mo", () => {
  // `perMonth` may be declared optional (`perMonth?: string`).
  assert.match(source, /perMonth\??:\s*string/, "PriceLabels should declare perMonth");
  assert.match(
    source,
    /perMonth:\s*"\/mo"/,
    "Default/compact labels should set perMonth to /mo",
  );
});

test("getPriceDisplay shows every offered mode inline (flexible pricing)", () => {
  // A mode is included when its rate is set (non-null), so all filled options
  // render joined together rather than a single pricingType branch.
  assert.match(
    source,
    /space\.pricePerHour != null/,
    "hourly is shown when the rate is set",
  );
  assert.match(
    source,
    /space\.pricePerDay != null/,
    "daily is shown when the rate is set",
  );
  assert.match(
    source,
    /space\.pricePerMonth != null/,
    "monthly is shown when the base rate is set",
  );
  assert.match(
    source,
    /formatPrice\(space\.pricePerMonth, c\)\}\$\{perMonth\}/,
    "monthly formats pricePerMonth with the perMonth label",
  );
  assert.match(
    source,
    /parts\.join\(" · "\)/,
    "offered modes are joined into one headline",
  );
});
