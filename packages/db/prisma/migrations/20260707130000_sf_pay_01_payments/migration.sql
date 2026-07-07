-- SF-PAY-01: payment, refund, Stripe Connect, webhook, audit, and dispute rails.

CREATE TYPE "PaymentStatus" AS ENUM (
    'REQUIRES_PAYMENT',
    'AUTHORIZED',
    'PAID',
    'PARTIALLY_REFUNDED',
    'REFUNDED',
    'CANCELED',
    'FAILED'
);

CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

CREATE TYPE "ConnectAccountStatus" AS ENUM (
    'ONBOARDING',
    'PENDING_VERIFICATION',
    'ACTIVE',
    'DISABLED'
);

CREATE TYPE "PayoutMethod" AS ENUM ('MANUAL', 'STRIPE_TRANSFER');
CREATE TYPE "WebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'SKIPPED');
CREATE TYPE "DisputeStatus" AS ENUM ('NEEDS_RESPONSE', 'UNDER_REVIEW', 'WON', 'LOST');

ALTER TABLE "Booking"
    ADD COLUMN "paymentStatus" "PaymentStatus";

ALTER TABLE "Payout"
    ADD COLUMN "amountMinor" INTEGER,
    ADD COLUMN "platformFeeMinor" INTEGER,
    ADD COLUMN "netAmountMinor" INTEGER,
    ADD COLUMN "method" "PayoutMethod" NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN "stripeTransferId" TEXT,
    ADD COLUMN "idempotencyKey" TEXT,
    ADD COLUMN "failureReason" TEXT;

CREATE TABLE "Payment" (
    "id"                    TEXT NOT NULL,
    "bookingId"             TEXT NOT NULL,
    "guestId"               TEXT NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "stripeChargeId"        TEXT,
    "amountMinor"           INTEGER NOT NULL,
    "applicationFeeMinor"   INTEGER NOT NULL,
    "currency"              "Currency" NOT NULL,
    "status"                "PaymentStatus" NOT NULL DEFAULT 'REQUIRES_PAYMENT',
    "captureMethod"         TEXT NOT NULL DEFAULT 'manual',
    "authorizedAt"          TIMESTAMP(3),
    "capturedAt"            TIMESTAMP(3),
    "canceledAt"            TIMESTAMP(3),
    "refundedMinor"         INTEGER NOT NULL DEFAULT 0,
    "lastErrorCode"         TEXT,
    "lastErrorMessage"      TEXT,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Refund" (
    "id"              TEXT NOT NULL,
    "paymentId"       TEXT NOT NULL,
    "bookingId"       TEXT NOT NULL,
    "stripeRefundId"  TEXT,
    "idempotencyKey"  TEXT NOT NULL,
    "amountMinor"     INTEGER NOT NULL,
    "currency"        "Currency" NOT NULL,
    "status"          "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "reason"          TEXT,
    "initiatedByRole" "BookingActor" NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StripeConnectAccount" (
    "id"               TEXT NOT NULL,
    "userId"           TEXT NOT NULL,
    "stripeAccountId"  TEXT NOT NULL,
    "status"           "ConnectAccountStatus" NOT NULL DEFAULT 'ONBOARDING',
    "chargesEnabled"   BOOLEAN NOT NULL DEFAULT false,
    "payoutsEnabled"   BOOLEAN NOT NULL DEFAULT false,
    "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "country"          TEXT,
    "defaultCurrency"  TEXT,
    "requirementsDue"  JSONB,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeConnectAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookEvent" (
    "id"          TEXT NOT NULL,
    "type"        TEXT NOT NULL,
    "status"      "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "payload"     JSONB NOT NULL,
    "error"       TEXT,
    "receivedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentAuditLog" (
    "id"             TEXT NOT NULL,
    "bookingId"      TEXT,
    "paymentId"      TEXT,
    "refundId"       TEXT,
    "payoutId"       TEXT,
    "actorType"      TEXT NOT NULL,
    "actorId"        TEXT,
    "action"         TEXT NOT NULL,
    "amountMinor"    INTEGER,
    "currency"       "Currency",
    "stripeObjectId" TEXT,
    "metadata"       JSONB,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Dispute" (
    "id"            TEXT NOT NULL,
    "paymentId"     TEXT NOT NULL,
    "bookingId"     TEXT NOT NULL,
    "amountMinor"   INTEGER NOT NULL,
    "currency"      "Currency" NOT NULL,
    "status"        "DisputeStatus" NOT NULL,
    "reason"        TEXT,
    "evidenceDueBy" TIMESTAMP(3),
    "closedAt"      TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");
CREATE UNIQUE INDEX "Payment_stripeChargeId_key" ON "Payment"("stripeChargeId");
CREATE INDEX "Payment_guestId_idx" ON "Payment"("guestId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

CREATE UNIQUE INDEX "Refund_stripeRefundId_key" ON "Refund"("stripeRefundId");
CREATE UNIQUE INDEX "Refund_idempotencyKey_key" ON "Refund"("idempotencyKey");
CREATE INDEX "Refund_bookingId_idx" ON "Refund"("bookingId");
CREATE INDEX "Refund_status_idx" ON "Refund"("status");

CREATE UNIQUE INDEX "StripeConnectAccount_userId_key" ON "StripeConnectAccount"("userId");
CREATE UNIQUE INDEX "StripeConnectAccount_stripeAccountId_key" ON "StripeConnectAccount"("stripeAccountId");

CREATE INDEX "WebhookEvent_type_idx" ON "WebhookEvent"("type");
CREATE INDEX "WebhookEvent_status_idx" ON "WebhookEvent"("status");
CREATE INDEX "WebhookEvent_receivedAt_idx" ON "WebhookEvent"("receivedAt");

CREATE INDEX "PaymentAuditLog_bookingId_idx" ON "PaymentAuditLog"("bookingId");
CREATE INDEX "PaymentAuditLog_payoutId_idx" ON "PaymentAuditLog"("payoutId");
CREATE INDEX "PaymentAuditLog_createdAt_idx" ON "PaymentAuditLog"("createdAt");
CREATE INDEX "PaymentAuditLog_action_idx" ON "PaymentAuditLog"("action");

CREATE UNIQUE INDEX "Dispute_paymentId_key" ON "Dispute"("paymentId");
CREATE INDEX "Dispute_bookingId_idx" ON "Dispute"("bookingId");
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

CREATE INDEX "Booking_paymentStatus_idx" ON "Booking"("paymentStatus");

CREATE UNIQUE INDEX "Payout_stripeTransferId_key" ON "Payout"("stripeTransferId");
CREATE UNIQUE INDEX "Payout_idempotencyKey_key" ON "Payout"("idempotencyKey");
CREATE INDEX "Payout_method_idx" ON "Payout"("method");

ALTER TABLE "Payment"
    ADD CONSTRAINT "Payment_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Refund"
    ADD CONSTRAINT "Refund_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StripeConnectAccount"
    ADD CONSTRAINT "StripeConnectAccount_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Dispute"
    ADD CONSTRAINT "Dispute_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
