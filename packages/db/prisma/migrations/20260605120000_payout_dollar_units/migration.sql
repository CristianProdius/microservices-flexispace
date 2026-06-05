-- DB-001 fix: Align Payout monetary columns with Booking dollar units.
--
-- Booking.subtotal / cleaningFee / serviceFee / totalAmount were migrated
-- from INTEGER to DOUBLE PRECISION (dollars) in
-- 20260424002000_use_dollar_units. The Payout columns were left as INTEGER,
-- which created a unit drift: aggregating Payout.netAmount alongside
-- Booking.totalAmount produced inconsistent host-earnings reports.
--
-- Backfill rationale: at the time of this migration there is NO producing
-- call site for Payout rows anywhere in the repo (no `prisma.payout.create`
-- / `.update`). The shared TS type (`packages/types/src/payout.ts`) has
-- always declared `amount: number; // In dollars`. Existing rows (if any)
-- are therefore treated as already being in whole-dollar units, and the
-- cast is a straight `::double precision` with no division by 100.
--
-- Long-term target for ALL monetary columns (Booking, Space, Payout,
-- PricingTier, ExchangeRate) is `Decimal(12, 2)` for exact-cent arithmetic.
-- That refactor is intentionally out of scope here because it cascades
-- into every price/currency call site (Prisma `Decimal` serializes as a
-- string, breaking `a + b` math); it must be tracked as a separate task.

ALTER TABLE "Payout"
  ALTER COLUMN "amount"      TYPE DOUBLE PRECISION USING "amount"::double precision,
  ALTER COLUMN "platformFee" TYPE DOUBLE PRECISION USING "platformFee"::double precision,
  ALTER COLUMN "netAmount"   TYPE DOUBLE PRECISION USING "netAmount"::double precision;

COMMENT ON COLUMN "Payout"."amount"      IS 'In dollars; long-term target: Decimal(12,2)';
COMMENT ON COLUMN "Payout"."platformFee" IS 'In dollars; long-term target: Decimal(12,2)';
COMMENT ON COLUMN "Payout"."netAmount"   IS 'In dollars; long-term target: Decimal(12,2)';
