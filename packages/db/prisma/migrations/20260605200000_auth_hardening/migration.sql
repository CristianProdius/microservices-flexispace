-- AUTHSVC-005/006/010: auth hardening — host application flow, refresh-token
-- rotation chain, password-reset single-use tracking, hostApplicationPending
-- flag on User.

-- CreateEnum
CREATE TYPE "public"."HostApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable: add hostApplicationPending flag to User
ALTER TABLE "public"."User"
  ADD COLUMN "hostApplicationPending" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: RefreshToken rotation chain
CREATE TABLE "public"."RefreshToken" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "replacedBy" TEXT,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefreshToken_jti_key" ON "public"."RefreshToken"("jti");
CREATE INDEX "RefreshToken_userId_idx" ON "public"."RefreshToken"("userId");
CREATE INDEX "RefreshToken_replacedBy_idx" ON "public"."RefreshToken"("replacedBy");

ALTER TABLE "public"."RefreshToken"
  ADD CONSTRAINT "RefreshToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: HostApplication
CREATE TABLE "public"."HostApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."HostApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "applicationData" JSONB,
    "decisionBy" TEXT,
    "decisionAt" TIMESTAMP(3),
    "decisionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HostApplication_userId_idx" ON "public"."HostApplication"("userId");
CREATE INDEX "HostApplication_status_idx" ON "public"."HostApplication"("status");

ALTER TABLE "public"."HostApplication"
  ADD CONSTRAINT "HostApplication_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: PasswordResetUse (single-use enforcement)
CREATE TABLE "public"."PasswordResetUse" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetUse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetUse_jti_key" ON "public"."PasswordResetUse"("jti");
CREATE INDEX "PasswordResetUse_userId_idx" ON "public"."PasswordResetUse"("userId");

ALTER TABLE "public"."PasswordResetUse"
  ADD CONSTRAINT "PasswordResetUse_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
