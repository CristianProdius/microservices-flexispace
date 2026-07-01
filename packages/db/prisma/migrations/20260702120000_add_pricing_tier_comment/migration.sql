-- Optional free-text note shown under the tier price (e.g. a subscription
-- nuance). Nullable; app layer enforces the 300-char cap.
ALTER TABLE "PricingTier" ADD COLUMN "comment" TEXT;
