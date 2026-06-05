-- CreateTable: Access-token revocation list (logout / password change)
CREATE TABLE "public"."RevokedAccessToken" (
    "jti" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "RevokedAccessToken_pkey" PRIMARY KEY ("jti")
);

-- CreateIndex
CREATE INDEX "RevokedAccessToken_userId_idx" ON "public"."RevokedAccessToken"("userId");

-- CreateIndex
CREATE INDEX "RevokedAccessToken_expiresAt_idx" ON "public"."RevokedAccessToken"("expiresAt");
