import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const bookingForm = readFileSync(
  new URL("./[locale]/(main)/spaces/[id]/BookingForm.tsx", import.meta.url),
  "utf8",
);
const detailPage = readFileSync(
  new URL("./[locale]/(main)/spaces/[id]/page.tsx", import.meta.url),
  "utf8",
);

test("booking form derives canBookMonthly from the MONTHLY pricing type", () => {
  assert.match(
    bookingForm,
    /const canBookMonthly = space\.pricingType === "MONTHLY"/,
    "canBookMonthly should be true only for MONTHLY spaces",
  );
});

test("MONTHLY spaces default to the date-range (daily) booking UI", () => {
  assert.match(
    bookingForm,
    /space\.pricingType === "DAILY" \|\| space\.pricingType === "MONTHLY"\s*\?\s*"daily"/,
    "MONTHLY should reuse the daily date-range path (no hourly time inputs)",
  );
});

test("booking form shows the per-month headline rate with a /mo label", () => {
  assert.match(
    bookingForm,
    /canBookMonthly \? \(/,
    "Price display should branch on canBookMonthly first",
  );
  assert.match(
    bookingForm,
    /formatPrice\(space\.pricePerMonth, \(space as any\)\.currency\)/,
    "Monthly headline should format pricePerMonth",
  );
  assert.match(bookingForm, /<span className="text-muted">\/mo<\/span>/);
});

test("monthly total is previewed client-side but flagged as server-authoritative", () => {
  assert.match(
    bookingForm,
    /const monthlyEstimate = useMemo/,
    "A rough monthly estimate should feed the breakdown/draft",
  );
  assert.match(
    bookingForm,
    /const activePricing = canBookMonthly \? monthlyEstimate : pricing/,
    "The breakdown and checkout draft should use the monthly estimate for MONTHLY spaces",
  );
});

test("space detail headline price uses the MONTHLY-aware util", () => {
  assert.match(
    detailPage,
    /getPriceDisplay/,
    "The detail page should surface the headline price via getPriceDisplay",
  );
});

test("space detail keeps the pricing tier comment display", () => {
  // Guard against regressing the stacked-branch tier-comment feature.
  assert.match(detailPage, /\{tier\.comment && \(/);
});
