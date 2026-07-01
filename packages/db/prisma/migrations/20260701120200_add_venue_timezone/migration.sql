-- AUDIT-B8: IANA timezone used to interpret local booking times for spaces under
-- this venue. Defaults to the platform's home market (Europe/Chisinau); hosts
-- abroad override per venue.
ALTER TABLE "Venue" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Europe/Chisinau';
