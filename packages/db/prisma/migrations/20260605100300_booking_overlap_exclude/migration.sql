-- DB-009: prevent overlapping multi-day bookings at the database level.
--
-- The application currently relies on a Serializable transaction in
-- apps/order-service/src/routes/booking.ts to catch overlap, but that path
-- only covers PENDING/CONFIRMED and is racy under high concurrency.
--
-- We add an EXCLUDE constraint that catches overlapping multi-day bookings
-- for the same Space when status is one of PENDING/APPROVED/CONFIRMED.
-- Hourly bookings are intentionally left to the application layer because the
-- per-day time-of-day window cannot be expressed against the (startDate,
-- endDate) timestamps without a generated column — and the app test suite
-- explicitly relies on adjacent hourly bookings on the same date being legal.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "public"."Booking"
  ADD CONSTRAINT "Booking_no_overlap_excl"
  EXCLUDE USING gist (
    "spaceId" WITH =,
    tstzrange("startDate", "endDate", '[]') WITH &&
  )
  WHERE (
    "isHourly" = false
    AND "status" IN ('PENDING', 'APPROVED', 'CONFIRMED')
  );
