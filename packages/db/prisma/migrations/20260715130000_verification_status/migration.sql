-- Add VerificationStatus enum for display badges (separate from the hostVerified auth flag).
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED');

-- Venue: add display status column (everyone starts UNVERIFIED — no carry-over of old true values).
ALTER TABLE "Venue" ADD COLUMN "venueVerificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED';

-- Venue: replace the old featured-sort index with the new status-based one.
DROP INDEX IF EXISTS "Venue_venueSponsored_venueRecommended_venueVerified_idx";
CREATE INDEX "Venue_venueSponsored_venueRecommended_venueVerificationStatus_idx"
ON "Venue"("venueSponsored", "venueRecommended", "venueVerificationStatus");

-- Venue: drop the old boolean column (now superseded by venueVerificationStatus).
ALTER TABLE "Venue" DROP COLUMN "venueVerified";

-- User: add display status column (everyone starts UNVERIFIED).
-- NOTE: hostVerified Boolean is intentionally kept — it is the AUTHORIZATION flag
-- used by auth-middleware, JWT, and host onboarding. Do NOT drop it.
ALTER TABLE "User" ADD COLUMN "hostVerificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED';

-- User: replace the old featured-sort index with the new status-based one.
DROP INDEX IF EXISTS "User_hostSponsored_hostRecommended_hostVerified_idx";
CREATE INDEX "User_hostSponsored_hostRecommended_hostVerificationStatus_idx"
ON "User"("hostSponsored", "hostRecommended", "hostVerificationStatus");
