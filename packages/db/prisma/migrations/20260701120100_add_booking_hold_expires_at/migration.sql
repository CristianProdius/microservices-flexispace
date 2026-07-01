-- AUDIT-B8: when a PENDING request-to-book hold auto-expires. Null for bookings
-- without a hold (e.g. instant-book). A reaper transitions PENDING rows past
-- this instant to EXPIRED so held inventory is released.
ALTER TABLE "Booking" ADD COLUMN "holdExpiresAt" TIMESTAMP(3);
