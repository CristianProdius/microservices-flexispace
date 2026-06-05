-- DB-004: Soft-delete (anonymize) support for User.
-- Hard-deletes are not supported because cascade rules on Booking/Payout
-- would wipe financial history that must be retained for legal/accounting
-- purposes (typically 5-7yr). The admin "delete user" endpoint scrubs PII
-- and sets deletedAt; auth and listing paths filter out non-null deletedAt.

ALTER TABLE "public"."User" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "User_deletedAt_idx" ON "public"."User"("deletedAt");
