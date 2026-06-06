-- Enforce a sane range on User.commissionRate so a stray UPDATE (or a stale
-- row from before the admin route's runtime validator was added) can never
-- store a value that would make the platform's commission exceed the host's
-- payout. Null is allowed (= use platform default).
ALTER TABLE "User"
  ADD CONSTRAINT "User_commissionRate_range_chk"
  CHECK ("commissionRate" IS NULL OR ("commissionRate" >= 0 AND "commissionRate" <= 1));
