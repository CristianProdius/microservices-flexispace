-- DB-006: rename Booking.cancelledBy (String?) to cancelledByRole (enum BookingActor)
-- The column historically stored the literal role string "GUEST" | "HOST" | "ADMIN".
-- We convert in place and add a typed enum to prevent garbage values.

-- 1. Create the enum.
CREATE TYPE "public"."BookingActor" AS ENUM ('GUEST', 'HOST', 'ADMIN');

-- 2. Rename the column to its semantically correct name.
ALTER TABLE "public"."Booking" RENAME COLUMN "cancelledBy" TO "cancelledByRole";

-- 3. Cast existing values to the new enum. Any pre-existing value that is not
--    one of the three known literals is mapped to NULL so the cast does not fail.
ALTER TABLE "public"."Booking"
  ALTER COLUMN "cancelledByRole" TYPE "public"."BookingActor"
  USING (
    CASE upper(trim("cancelledByRole"))
      WHEN 'GUEST' THEN 'GUEST'::"public"."BookingActor"
      WHEN 'HOST'  THEN 'HOST'::"public"."BookingActor"
      WHEN 'ADMIN' THEN 'ADMIN'::"public"."BookingActor"
      ELSE NULL
    END
  );
