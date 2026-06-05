-- TYPES-003: Payout amounts must be in dollars (Float), matching Booking
-- pricing precision. Previously declared as Int which would truncate cents.
ALTER TABLE "public"."Payout"
  ALTER COLUMN "amount" TYPE DOUBLE PRECISION USING "amount"::double precision,
  ALTER COLUMN "platformFee" TYPE DOUBLE PRECISION USING "platformFee"::double precision,
  ALTER COLUMN "netAmount" TYPE DOUBLE PRECISION USING "netAmount"::double precision;

-- TYPES-004: Remove dead `APPROVED` value from BookingStatus enum. No code
-- path ever wrote it (the approve handler transitions PENDING -> CONFIRMED
-- directly), so renaming the enum in place is safe.
--
-- Postgres can't drop a single enum value, so rebuild the enum.
ALTER TYPE "public"."BookingStatus" RENAME TO "BookingStatus_old";

CREATE TYPE "public"."BookingStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
  'EXPIRED'
);

-- Safety net: if any row was ever set to APPROVED, promote it to CONFIRMED
-- before casting (matches current handler semantics).
UPDATE "public"."Booking"
  SET "status" = 'CONFIRMED'
  WHERE "status"::text = 'APPROVED';

ALTER TABLE "public"."Booking"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "public"."BookingStatus"
    USING "status"::text::"public"."BookingStatus",
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

DROP TYPE "public"."BookingStatus_old";
