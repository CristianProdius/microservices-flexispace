-- DB-010: drop denormalised Space.* location columns. The canonical source is
-- Venue.* (joined via Space.venueId, which is non-nullable since
-- 20260512000000_make_venue_id_required). Keeping both copies caused stale
-- search results whenever a venue address was edited.

-- Drop the city index first; the column it covers is about to disappear.
DROP INDEX IF EXISTS "public"."Space_city_idx";

ALTER TABLE "public"."Space"
  DROP COLUMN "address",
  DROP COLUMN "city",
  DROP COLUMN "state",
  DROP COLUMN "country",
  DROP COLUMN "postalCode",
  DROP COLUMN "latitude",
  DROP COLUMN "longitude";
