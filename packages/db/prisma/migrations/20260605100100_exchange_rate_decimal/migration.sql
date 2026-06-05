-- DB-008: switch ExchangeRate.rate and Booking.exchangeRate from Float to Decimal(12, 6).
-- IEEE-754 Float drift compounds across many bookings; Decimal preserves cents.

ALTER TABLE "public"."ExchangeRate"
  ALTER COLUMN "rate" TYPE DECIMAL(12, 6) USING "rate"::DECIMAL(12, 6);

ALTER TABLE "public"."Booking"
  ALTER COLUMN "exchangeRate" TYPE DECIMAL(12, 6) USING "exchangeRate"::DECIMAL(12, 6);

-- Re-set the default after the type change so SET DEFAULT 1.0 binds to the new type.
ALTER TABLE "public"."Booking"
  ALTER COLUMN "exchangeRate" SET DEFAULT 1.0;
