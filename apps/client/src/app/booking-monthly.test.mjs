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
const checkoutPage = readFileSync(
  new URL("./[locale]/(main)/bookings/checkout/page.tsx", import.meta.url),
  "utf8",
);
const bookingStore = readFileSync(
  new URL("../stores/bookingStore.ts", import.meta.url),
  "utf8",
);

test("offered booking modes are derived from the filled rates (flexible pricing)", () => {
  // A tab per offered mode (hourly/daily/monthly), derived from which rates the
  // host set — not the legacy single pricingType.
  assert.match(
    bookingForm,
    /const modes = offeredModes\(space\)/,
    "the form should derive offered modes from the shared helper",
  );
  assert.match(
    bookingForm,
    /const hasMonthlyPlans = \(space\.monthlyPlans\?\.length \?\? 0\) > 0/,
    "hasMonthlyPlans should be true whenever the space carries plans",
  );
});

test("mode defaults to the first offered mode", () => {
  assert.match(
    bookingForm,
    /useState<BookingMode>\(availableModes\[0\] \?\? "hourly"\)/,
    "the initial mode should be the first offered mode",
  );
});

test("daily and monthly use the full-day date range; only hourly renders time inputs", () => {
  assert.match(
    bookingForm,
    /const isDateRange = mode === "daily" \|\| mode === "monthly"/,
    "daily and monthly both use the check-in/check-out range",
  );
  assert.match(
    bookingForm,
    /const isHourlyUI = mode === "hourly"/,
    "only hourly mode renders the time inputs",
  );
});

test("booking form shows the per-month headline rate with a /mo label", () => {
  assert.match(
    bookingForm,
    /isMonthly \? \(/,
    "Price display should branch on the monthly mode first",
  );
  assert.match(
    bookingForm,
    /formatPrice\(space\.pricePerMonth, \(space as any\)\.currency\)/,
    "Single-price monthly headline should still format pricePerMonth",
  );
  assert.match(bookingForm, /<span className="text-muted">\/mo<\/span>/);
});

// --- Plans-only monthly headline (T6 review) ---

test("headline reflects the lowest plan price when the space has plans", () => {
  // A plans-only space may have a null base pricePerMonth, so the headline
  // must fall back to the cheapest plan rather than rendering an empty/NaN price.
  assert.match(
    bookingForm,
    /lowestMonthlyPlanPrice/,
    "A lowest-plan price should be derived for the headline",
  );
  assert.match(
    bookingForm,
    /Math\.min\([^)]*monthlyPlans/s,
    "The lowest plan price should be the min of the plans' pricePerMonth",
  );
});

test("plans-only headline uses a 'from' i18n key and the shared formatter", () => {
  assert.match(
    bookingForm,
    /hasMonthlyPlans \?/,
    "The headline should branch on hasMonthlyPlans",
  );
  assert.match(
    bookingForm,
    /t\("fromPerMonth"/,
    "The plans headline should use the booking.fromPerMonth i18n key",
  );
});

test("monthly total is previewed client-side but flagged as server-authoritative", () => {
  assert.match(
    bookingForm,
    /const monthlyEstimate = useMemo/,
    "A rough monthly estimate should feed the breakdown/draft",
  );
  assert.match(
    bookingForm,
    /const activePricing = isMonthly \? monthlyEstimate : pricing/,
    "The breakdown and checkout draft should use the monthly estimate in monthly mode",
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

// --- Monthly plans (bookable) ---

test("booking form only renders the plan selector when the space has plans", () => {
  assert.match(
    bookingForm,
    /space\.monthlyPlans\b/,
    "The form should read space.monthlyPlans",
  );
  assert.match(
    bookingForm,
    /const hasMonthlyPlans = \(space\.monthlyPlans\?\.length \?\? 0\) > 0/,
    "hasMonthlyPlans is true whenever the space carries at least one plan",
  );
  assert.match(
    bookingForm,
    /\{isMonthly && hasMonthlyPlans && \(/,
    "the plan selector renders only in monthly mode when plans exist",
  );
});

test("mode tabs render one tab per offered mode, only when more than one exists", () => {
  assert.match(
    bookingForm,
    /const showModeTabs = availableModes\.length > 1/,
    "tabs show only when more than one mode is offered",
  );
  assert.match(
    bookingForm,
    /\{showModeTabs && \(/,
    "the tab strip should be gated on showModeTabs",
  );
  assert.match(
    bookingForm,
    /availableModes\.map\(\(m\) =>/,
    "a tab is rendered per available mode",
  );
  assert.match(
    bookingForm,
    /onClick=\{\(\) => setMode\(m\)\}/,
    "clicking a tab switches to that mode",
  );
});

test("checkout POST forwards the chosen bookingMode when set", () => {
  assert.match(
    checkoutPage,
    /\.\.\.\(draft\.bookingMode \? \{ bookingMode: draft\.bookingMode \} : \{\}\)/,
    "the booking-create body should spread bookingMode when present",
  );
});

test("booking form tracks the selected monthly plan id in state", () => {
  assert.match(
    bookingForm,
    /const \[selectedMonthlyPlanId, setSelectedMonthlyPlanId\] = useState/,
    "A selectedMonthlyPlanId state drives the selector",
  );
});

test("monthly estimate is driven off the selected plan's rate via the helper", () => {
  assert.match(
    bookingForm,
    /resolveMonthlyRate/,
    "The effective monthly rate should be resolved from the selected plan",
  );
  assert.match(
    bookingForm,
    /calculateMonthlyEstimate/,
    "The estimate should come from the shared monthly-estimate helper",
  );
});

test("reserve CTA is disabled until a plan is chosen when plans exist", () => {
  assert.match(
    bookingForm,
    /hasMonthlyPlans && !selectedMonthlyPlanId/,
    "The book button disabled expression must require a plan when plans exist",
  );
});

test("selected monthlyPlanId is written into the booking draft", () => {
  assert.match(
    bookingForm,
    /monthlyPlanId:\s*isMonthly && hasMonthlyPlans \? selectedMonthlyPlanId.*: undefined/s,
    "setDraft should carry the selected monthlyPlanId (only in monthly mode with plans)",
  );
});

test("booking draft type declares an optional monthlyPlanId", () => {
  assert.match(
    bookingStore,
    /monthlyPlanId\?:\s*number/,
    "BookingDraft should include an optional monthlyPlanId",
  );
});

test("checkout POST forwards monthlyPlanId only when set", () => {
  assert.match(
    checkoutPage,
    /\.\.\.\(draft\.monthlyPlanId != null \? \{ monthlyPlanId: draft\.monthlyPlanId \} : \{\}\)/,
    "The booking-create body should spread monthlyPlanId only when present",
  );
});
