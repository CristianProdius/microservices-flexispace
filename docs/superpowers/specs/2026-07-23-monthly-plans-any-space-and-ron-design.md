# Monthly plans on any space + RON currency — design

Date: 2026-07-23
Branch: `feat/monthly-plans-any-space`

## Problem

1. A space like Tekwill offers short-term booking (1h/4h/1day/2days) **and** several
   monthly subscriptions. Hosts cannot add more than one monthly price: monthly prices
   are stored as `PricingTier` rows, which are unique on `(spaceId, minutes)`, so a
   second "1 month" tier collides.
2. The named-subscription feature (`MonthlyPlan`, PR #28) already solves multi-plan
   pricing, but it is gated to spaces whose `pricingType === "MONTHLY"`. Tekwill is a
   mixed space, so it cannot use it.
3. Currency `MDL` renders as the bare symbol `L`, which is ambiguous. There is no `RON`
   (Romanian leu) currency.

## Scope — two independently shippable deliverables

### A. Currency: add RON + unambiguous labels
- Add `RON` to the `Currency` Prisma enum (migration) and `@repo/types` `Currency`.
- `CURRENCY_SYMBOLS`: `MDL` → `"MDL"` (was `"L"`), add `RON` → `"RON"`. Both render as suffix
  (`2200 MDL`, `2700 RON`).
- `CURRENCY_LABELS`: add Romanian Leu.
- Admin currency dropdown: `MDL (Lei MD)`, add `RON (Lei RO)`.
- Product-service self-rate seeding includes RON (`RON_RON = 1`). Cross rates
  (RON↔USD/EUR/MDL) are entered by an admin via the existing exchange-rates page (data step).

### B. Monthly plans on any space + tabbed booking box
- **Admin/backend:** remove the `pricingType === "MONTHLY"` gate so a host can attach named
  `MonthlyPlan`s to any space (HOURLY/DAILY/BOTH/MONTHLY). Reuses existing validation
  (max 20, name unique, price ≥ 0.01). No DB schema change — the model already exists.
  This fixes the "cannot add a second monthly price" error because plans are unique by
  **name**, not by duration.
- **Client booking box:** when a space has **both** short-term pricing and ≥1 monthly plan,
  show two tabs:
  - **"Pe oră/zi"** — existing date/time/guests widget → Request to Book.
  - **"Abonament"** — existing radio list of monthly plans + monthly total → Request to Book.
  Default tab follows `pricingType` (monthly → Abonament, else short-term). Spaces with only
  one mode keep today's single-mode box (no tabs).
- **order-service:** accept a `monthlyPlanId` booking on non-MONTHLY spaces too (server-priced
  from the plan). Today this is restricted to MONTHLY spaces; relax the check to "space has
  the plan".

### Out of scope (YAGNI)
- No Select buttons on the read-only short-term "Pricing" rows (that is a separate, larger
  option). No merge of `PricingTier` and `MonthlyPlan`. No search/filter changes for monthly
  price on mixed spaces.

## Data cleanup (operational)
- Tekwill's two `PricingTier` "1 month" rows (2200 / 2700 MDL) are re-entered as named
  `MonthlyPlan`s and the old tier rows deleted, after deploy.

## Testing
- Types: currency symbol/label unit tests (RON present, MDL → "MDL").
- Client: booking-box tab behaviour (tabs only when both modes; default tab; plan selection
  drives total). Currency formatting tests for RON/MDL suffix.
- product-service: monthly-plan validation accepts plans on non-MONTHLY spaces.
- order-service: monthly-plan booking accepted + server-priced on a non-MONTHLY space.
