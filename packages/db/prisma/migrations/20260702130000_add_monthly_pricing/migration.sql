-- Add MONTHLY pricing option. Note: ALTER TYPE ... ADD VALUE cannot run inside a
-- transaction block on older Postgres, so it lives in its own migration statement.
ALTER TYPE "PricingType" ADD VALUE 'MONTHLY';

-- Space monthly price, in dollars, pro-rated per calendar month for range bookings.
ALTER TABLE "Space" ADD COLUMN "pricePerMonth" DOUBLE PRECISION;
