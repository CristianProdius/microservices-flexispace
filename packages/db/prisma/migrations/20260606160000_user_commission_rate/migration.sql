-- Per-host platform commission as a fraction (0.1 = 10%).
-- NULL = fall back to the platform-wide DEFAULT_COMMISSION_RATE env var.
-- Commission is taken out of the host's payout, not added to the client total.
ALTER TABLE "User" ADD COLUMN "commissionRate" DOUBLE PRECISION;
