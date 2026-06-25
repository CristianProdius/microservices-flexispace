ALTER TABLE "User"
ADD COLUMN "hostRecommended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hostSponsored" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Venue"
ADD COLUMN "venueVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "venueRecommended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "venueSponsored" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "User_hostSponsored_hostRecommended_hostVerified_idx"
ON "User"("hostSponsored", "hostRecommended", "hostVerified");

CREATE INDEX "Venue_venueSponsored_venueRecommended_venueVerified_idx"
ON "Venue"("venueSponsored", "venueRecommended", "venueVerified");
