# Implementation Plan — Bookable Monthly Plans

Spec: `docs/superpowers/specs/2026-07-15-monthly-plans-bookable-design.md`
Branch: `feat/monthly-plans-bookable`

Execution: subagent-driven-development. One implementer per task (TDD, tests,
commit, self-review), then spec-compliance review, then code-quality review.
Tasks are ordered by dependency; execute sequentially.

Conventions to follow (match existing code):
- `PricingTier` / `validatePricingTiers` (`apps/product-service/src/controllers/space.controller.ts`)
  are the closest existing pattern for the new plan model, validation, editor, and
  persistence. Mirror them.
- Migrations are **hand-authored** timestamped SQL folders under
  `packages/db/prisma/migrations/` (see `20260702130000_add_monthly_pricing`). There
  is **no local Spacefly Postgres running**, so DO NOT run `prisma migrate dev`. Edit
  `schema.prisma`, author the migration SQL by hand, and run `pnpm --filter @repo/db
  db:generate` (offline) to regenerate the client.
- Tests: vitest. Run the touched package's tests + typecheck + lint before committing.

---

## Task 1 — DB schema + migration (`packages/db`)

Add the `MonthlyPlan` model and booking columns per the spec.

- In `packages/db/prisma/schema.prisma`:
  - Add `model MonthlyPlan { id, spaceId, name, pricePerMonth Float, description String?,
    sortOrder Int @default(0), space @relation(onDelete: Cascade), bookings Booking[],
    @@unique([spaceId, name]), @@index([spaceId]) }`.
  - Add `monthlyPlans MonthlyPlan[]` to `model Space`.
  - Add to `model Booking`: `monthlyPlanId Int?`, `monthlyPlan MonthlyPlan?
    @relation(fields: [monthlyPlanId], references: [id], onDelete: SetNull)`,
    `monthlyPlanName String?`.
- Author a migration folder `packages/db/prisma/migrations/<UTC timestamp>_add_monthly_plans/migration.sql`
  with: `CREATE TABLE "MonthlyPlan" (...)`, the unique index `("spaceId","name")`, the
  `("spaceId")` index, the FK to `Space` (ON DELETE CASCADE), and `ALTER TABLE "Booking"
  ADD COLUMN "monthlyPlanId" INTEGER`, `ADD COLUMN "monthlyPlanName" TEXT`, plus the FK
  `Booking.monthlyPlanId -> MonthlyPlan.id ON DELETE SET NULL`. Mirror the exact style
  (quoting, `CREATE INDEX`, `ADD CONSTRAINT ... FOREIGN KEY`) of the newest existing
  migration.
- Run `pnpm --filter @repo/db db:generate` and `npx prisma validate` (from `packages/db`)
  to confirm the schema + client are valid. All nullable → non-destructive.

Acceptance: `prisma validate` passes, client regenerates, migration SQL matches the
schema, no existing migration edited.

## Task 2 — Types & validation (`packages/types`)

- Add `monthlyPlanInputSchema` (zod): `name` trimmed non-empty ≤ 60; `pricePerMonth`
  finite ≥ 0.01; `description` optional, ≤ 300, empty/whitespace → undefined. Export a
  `MonthlyPlanInput` type.
- Add `MONTHLY_PLANS_MAX_COUNT = 20` and a `monthlyPlansSchema` = array capped at it.
- Extend the space read type used by the client (`SpaceWithHost` and any shared space
  type that lists pricing) to include `monthlyPlans: Array<{ id: number; name: string;
  pricePerMonth: number; description: string | null; sortOrder: number }>`.
- Extend the booking-create input type/schema with optional `monthlyPlanId: number`.
- Unit tests: accept a valid plan; reject empty name, name > 60, price < 0.01,
  non-finite price, description > 300; array over cap rejected; whitespace description
  normalized to undefined.

Acceptance: types build, tests pass.

## Task 3 — product-service (persist + read + validation)

- Add `validateMonthlyPlans(input): { ok: true; value: MonthlyPlanInput[] } | { ok:
  false; message }` mirroring `validatePricingTiers` (array guard, count cap via
  `MONTHLY_PLANS_MAX_COUNT`, per-entry validation delegating to the zod schema or inline
  checks consistent with the tier validator).
- In space **create** and **update** controllers: accept a `monthlyPlans` array. When
  the effective `pricingType === "MONTHLY"`, replace the space's plans (`deleteMany` then
  `createMany` with `sortOrder = index`). When not MONTHLY, delete any existing plans.
- Relax MONTHLY numeric validation: a MONTHLY space is valid when `pricePerMonth > 0`
  OR it has ≥ 1 valid monthly plan (so a plans-only space needs no base rate).
- Include `monthlyPlans` (ordered `sortOrder asc, id asc`) in the single-space read and
  the venue/space include used by the client detail page.
- Tests: `validateMonthlyPlans` accept/reject; create persists plans for MONTHLY;
  update replaces plans; switching a space away from MONTHLY clears plans; read returns
  ordered plans; plans-only space passes validation without `pricePerMonth`.

Acceptance: product-service tests + typecheck + lint pass.

## Task 4 — order-service (pricing + booking create)

- `calculateBookingPrice`: add an optional effective monthly-rate override param; when
  provided (and the space is MONTHLY) use it in place of `space.pricePerMonth` in the
  existing calendar-month proration. No other path changes.
- Booking **create** for a MONTHLY space: load the space's `monthlyPlans`. If it has
  plans, `monthlyPlanId` is required and must belong to the space (else 400 with a clear
  message); price from that plan and persist `monthlyPlanId` + `monthlyPlanName`
  snapshot. If no plans, unchanged (`pricePerMonth`), `monthlyPlanId` null.
- Surface `monthlyPlanName` in the booking read used by the booking-detail views.
- Tests: `calculateBookingPrice` with override rate prorates correctly; create requires
  a valid `monthlyPlanId` when plans exist; rejects a `monthlyPlanId` from another space;
  falls back to `pricePerMonth` when the space has no plans; snapshot persisted.

Acceptance: order-service tests + typecheck + lint pass.

## Task 5 — Admin UI (`apps/admin`)

- New `MonthlyPlansEditor` component modeled on `PricingTiersEditor`: rows of Name /
  Price / Description with add & remove; `onChange` emits `{ name, pricePerMonth,
  description }[]`. Loads initial plans when editing.
- Render it in the space form **only when `pricingType === "MONTHLY"`**; include the
  emitted `monthlyPlans` in the create/update payload; load existing plans into it when
  editing a MONTHLY space.
- Tests: editor add/remove/emit shape; space form shows the editor only for MONTHLY and
  includes `monthlyPlans` in the submitted payload.

Acceptance: admin tests + typecheck + lint pass.

## Task 6 — Client UI (`apps/client`)

- In `BookingForm`, when `pricingType === "MONTHLY"` and `space.monthlyPlans.length > 0`:
  render a plan selector (name + price/month + description). Require a selection to
  proceed; drive the existing `monthlyEstimate` from the selected plan's `pricePerMonth`;
  write `monthlyPlanId` into the booking draft (`bookingStore`).
- Carry `monthlyPlanId` through the draft → checkout → booking-create request.
- When there are no plans, the current single-`pricePerMonth` flow is unchanged.
- Tests: selector requires a choice and drives the estimate; `monthlyPlanId` is written
  into the draft and included in the booking-create payload.

Acceptance: client tests + typecheck + lint pass.

---

## Final

After all tasks: full-repo build/test sweep for the touched packages, a final
code-review pass over the whole diff, then `superpowers:finishing-a-development-branch`
(open PR against `main`). Migration applies at deploy via `db:deploy`.
