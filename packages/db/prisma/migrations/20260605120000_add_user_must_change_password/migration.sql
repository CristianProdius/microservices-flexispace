-- AlterTable: Add mustChangePassword flag to User (admin-created accounts force a password rotation on first login)
ALTER TABLE "public"."User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
