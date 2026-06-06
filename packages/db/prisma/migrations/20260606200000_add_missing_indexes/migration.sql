-- Payout.bookingIds is queried with `WHERE b.id = ANY(p.bookingIds)`; without
-- a GIN index this seq-scans every payout. Used by currency backfills and
-- "which payouts include booking X" reports.
CREATE INDEX IF NOT EXISTS "Payout_bookingIds_gin"
  ON "Payout" USING GIN ("bookingIds");

-- SpaceAmenity's composite unique indexes (spaceId, amenityId) — fine for
-- "which amenities does this space have", but the reverse query
-- ("which spaces have amenity X") falls off the composite. Add the reverse.
CREATE INDEX IF NOT EXISTS "SpaceAmenity_amenityId_idx"
  ON "SpaceAmenity" ("amenityId");
