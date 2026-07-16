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

test("getPriceDisplay renders the per-month rate for MONTHLY spaces", () => {
  assert.match(
    source,
    /pricingType === "MONTHLY" && space\.pricePerMonth/,
    "MONTHLY branch should read pricePerMonth",
  );
  // The label may carry a `?? "/mo"` fallback for callers that omit perMonth.
  assert.match(
    source,
    /formatPrice\(space\.pricePerMonth, c\)\}\$\{labels\.perMonth(\s*\?\?\s*"\/mo")?\}/,
    "MONTHLY branch should format pricePerMonth with the perMonth label",
  );
});
