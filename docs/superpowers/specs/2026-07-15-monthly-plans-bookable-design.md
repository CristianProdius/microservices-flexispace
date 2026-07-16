# Bookable Monthly Plans — Design Spec

**Date:** 2026-07-15
**Status:** Approved (Approach A)
**Motivation:** A MONTHLY space (e.g. Tekwill) needs to offer **several named monthly
subscription plans** (Hot desk / Dedicated / Private office), each with its own
monthly price, and a guest must be able to **select one plan and book it**. Today a
space has a single `pricePerMonth`, and `PricingTier` is keyed `@@unique([spaceId,
minutes])` — so a second "1 month" tier collides. Monthly plans are a distinct
concept from duration tiers, so they get their own model.

## Scope (v1)

- A plan = **name + monthly price + optional description**. No per-plan capacity /
  inventory / availability — all plans share the space's availability.
- Plans are **optional**. A MONTHLY space with only `pricePerMonth` keeps working
  unchanged. Plans are additive for spaces that want multiple options.
- If a MONTHLY space **has ≥1 plan**, a booking **must** select a valid plan and is
  priced from that plan's monthly rate. If it has **0 plans**, current `pricePerMonth`
  behavior is unchanged.
- Only MONTHLY spaces use plans. Plans are ignored/not shown for HOURLY/DAILY/BOTH.
- Out of scope: recurring/auto-renew billing, plan-level images, proration changes
  (reuse the existing calendar-month proration), Stripe subscription objects.

## Data Model (Prisma + migration)

New model:

```prisma
model MonthlyPlan {
  id            Int     @id @default(autoincrement())
  spaceId       Int
  name          String            // "Hot desk", "Dedicated", "Private office"
  pricePerMonth Float             // in the space's currency
  description   String?           // optional, <= 300 chars
  sortOrder     Int     @default(0)

  space    Space     @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  bookings Booking[]

  @@unique([spaceId, name])       // no two plans with the same name per space
  @@index([spaceId])
}
```

`Space` gains `monthlyPlans MonthlyPlan[]`.

`Booking` gains:

```prisma
  monthlyPlanId   Int?
  monthlyPlan     MonthlyPlan? @relation(fields: [monthlyPlanId], references: [id], onDelete: SetNull)
  monthlyPlanName String?      // snapshot: preserves which plan was booked even if
                               // the plan is later renamed or deleted
```

- All new columns are **nullable → non-destructive migration, no backfill**.
- Deleting a plan uses `onDelete: SetNull` on the booking side; `monthlyPlanName`
  (and the already-stored `totalAmount`) preserve the booking's history. Hosts can
  remove a plan without a 409 even if it has past bookings.
- Cascade delete with the space (a plan has no meaning without its space).

## Validation & Types (`@repo/types`)

- `monthlyPlanInputSchema` (zod): `name` non-empty, trimmed, ≤ 60 chars; `pricePerMonth`
  finite ≥ 0.01; `description` optional string ≤ 300 chars (empty/whitespace → undefined).
- `MONTHLY_PLANS_MAX_COUNT = 20`; a space's `monthlyPlans` array must not exceed it.
- Extend the space read type (`SpaceWithHost`) to include `monthlyPlans` (ordered by
  `sortOrder`, then `id`).
- Booking-create payload gains optional `monthlyPlanId`.

## product-service

- `validateMonthlyPlans(input)` mirroring `validatePricingTiers` (array, per-entry
  field validation, count cap), returning `{ ok, value }` / `{ ok: false, message }`.
- Space **create/update**: accept a `monthlyPlans` array. Persist via replace
  (`deleteMany` + `createMany`) **only when `pricingType === MONTHLY`**; when the type
  is not MONTHLY, clear any existing plans. Assign `sortOrder` by array index.
- Space **read** (single space + venue includes used by the client detail page):
  include `monthlyPlans` ordered by `sortOrder, id`.
- MONTHLY validation relaxed: a MONTHLY space is valid when
  `pricePerMonth > 0` **OR** it has ≥1 valid monthly plan (so a plans-only space
  doesn't need a base `pricePerMonth`).

## order-service (booking + pricing)

- `calculateBookingPrice` accepts an optional **effective monthly rate** override.
  When booking a MONTHLY space with a selected plan, pass `plan.pricePerMonth`; the
  existing calendar-month proration path is reused verbatim with that rate instead of
  `space.pricePerMonth`. All other pricing paths unchanged.
- Booking **create** for a MONTHLY space:
  - Load the space's `monthlyPlans`.
  - If the space **has plans**: `monthlyPlanId` is **required**, must belong to this
    space (else 400/404); price from that plan; persist `monthlyPlanId` +
    `monthlyPlanName` snapshot.
  - If the space **has no plans**: behavior unchanged (uses `pricePerMonth`);
    `monthlyPlanId` ignored/null.
- Booking reads that surface pricing/plan info include `monthlyPlanName` where the
  booking detail is shown.

## Admin UI

- New `MonthlyPlansEditor` component (modeled on `PricingTiersEditor`): rows of
  **Name / Price / Description**, add & remove, emits `{ name, pricePerMonth,
  description }[]`.
- Rendered in the space form **only when `pricingType === MONTHLY`**. Wired into the
  create/update payload (`monthlyPlans`). Loads existing plans when editing.

## Client UI

- In `BookingForm`, when `pricingType === MONTHLY` **and** the space has plans:
  render a **plan selector** (name + price/month + description). A plan must be
  selected to proceed; the selection drives the client-side `monthlyEstimate` (using
  the selected plan's `pricePerMonth`) and is written into the booking draft.
- The booking draft → checkout → booking-create call carries `monthlyPlanId`.
- When the space has no plans: current single-`pricePerMonth` flow, unchanged.

## Testing (TDD, per task)

- **types**: `monthlyPlanInputSchema` accept/reject cases; count cap.
- **product-service**: `validateMonthlyPlans` unit tests; create/update persists &
  replaces plans only for MONTHLY and clears otherwise; read includes ordered plans;
  relaxed MONTHLY validation (plans-only space valid without `pricePerMonth`).
- **order-service**: `calculateBookingPrice` with an override rate; booking-create
  requires a valid `monthlyPlanId` when plans exist, rejects a plan from another
  space, falls back to `pricePerMonth` when no plans; snapshot persisted.
- **admin**: `MonthlyPlansEditor` add/remove/emit; space form shows it only for
  MONTHLY and includes plans in the payload.
- **client**: `BookingForm` plan selector required, drives estimate, writes
  `monthlyPlanId` into the draft.

## Backward Compatibility

- Existing MONTHLY spaces (single `pricePerMonth`, no plans) and all existing
  bookings are unaffected (new columns nullable, plan path only triggers when plans
  exist).
- No change to HOURLY/DAILY/BOTH pricing or the duration-tier engine.
