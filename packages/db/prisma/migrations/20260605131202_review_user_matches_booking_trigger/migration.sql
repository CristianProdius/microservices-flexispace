-- DB-007: Enforce Review.userId == Booking.guestId at the database layer.
--
-- The application controller already checks this on the create path, but a
-- backfill script or future tool could insert/update a Review whose userId
-- does not match the related booking's guestId. Add a CONSTRAINT TRIGGER so
-- the DB rejects any such row.
--
-- We use a CONSTRAINT TRIGGER (rather than a CHECK constraint) because the
-- assertion involves a subquery against another table, which CHECK does not
-- allow. The trigger fires AFTER INSERT OR UPDATE and is not deferrable, so
-- it runs at the end of the statement.

CREATE OR REPLACE FUNCTION "public"."enforce_review_user_matches_booking"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  booking_guest_id TEXT;
BEGIN
  SELECT b."guestId"
    INTO booking_guest_id
    FROM "public"."Booking" AS b
   WHERE b."id" = NEW."bookingId";

  IF booking_guest_id IS NULL THEN
    RAISE EXCEPTION
      'Review.bookingId % does not reference an existing Booking',
      NEW."bookingId"
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF NEW."userId" IS DISTINCT FROM booking_guest_id THEN
    RAISE EXCEPTION
      'Review.userId (%) must equal Booking.guestId (%) for bookingId %',
      NEW."userId", booking_guest_id, NEW."bookingId"
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "review_user_matches_booking" ON "public"."Review";

CREATE CONSTRAINT TRIGGER "review_user_matches_booking"
  AFTER INSERT OR UPDATE OF "userId", "bookingId" ON "public"."Review"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."enforce_review_user_matches_booking"();
