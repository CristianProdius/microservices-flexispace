-- CreateTable: MonthlyPlan
-- Named monthly subscription plans offered by a MONTHLY-priced space.
-- A booking can reference the chosen plan via monthlyPlanId / monthlyPlanName.
CREATE TABLE "public"."MonthlyPlan" (
    "id" SERIAL NOT NULL,
    "spaceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "pricePerMonth" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MonthlyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyPlan_spaceId_name_key" ON "public"."MonthlyPlan"("spaceId", "name");

-- CreateIndex
CREATE INDEX "MonthlyPlan_spaceId_idx" ON "public"."MonthlyPlan"("spaceId");

-- AddForeignKey: MonthlyPlan.spaceId -> Space.id (cascade delete plans with space)
ALTER TABLE "public"."MonthlyPlan" ADD CONSTRAINT "MonthlyPlan_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "public"."Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Booking - add monthly plan reference columns
ALTER TABLE "public"."Booking" ADD COLUMN "monthlyPlanId" INTEGER;
ALTER TABLE "public"."Booking" ADD COLUMN "monthlyPlanName" TEXT;

-- AddForeignKey: Booking.monthlyPlanId -> MonthlyPlan.id (set null if plan deleted)
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_monthlyPlanId_fkey" FOREIGN KEY ("monthlyPlanId") REFERENCES "public"."MonthlyPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
