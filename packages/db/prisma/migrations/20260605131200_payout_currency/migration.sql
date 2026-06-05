-- DB-002: Add currency column to Payout
-- Payouts were previously aggregated without a currency tag, which meant a host
-- with bookings in multiple currencies (e.g. USD + MDL) had their amounts mixed.
-- Add the column with a USD default, then backfill from any related booking.

-- AlterTable: add currency column with default
ALTER TABLE "public"."Payout"
  ADD COLUMN "currency" "public"."Currency" NOT NULL DEFAULT 'USD';

-- Backfill: derive each payout's currency from the first related booking, if any.
-- Falls back to the column default ('USD') when no related booking exists.
UPDATE "public"."Payout" AS p
SET "currency" = COALESCE(
  (
    SELECT b."currency"
    FROM "public"."Booking" AS b
    WHERE b."id" = ANY (p."bookingIds")
    LIMIT 1
  ),
  'USD'
);
