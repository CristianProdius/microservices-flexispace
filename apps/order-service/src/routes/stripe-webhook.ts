import { FastifyInstance } from "fastify";
import { prisma, Prisma } from "@repo/db";
import type Stripe from "stripe";
import { writeAudit } from "../utils/audit.js";
import { producer } from "../utils/kafka.js";
import { getStripe } from "../utils/stripe.js";

// SF-PAY-01: request-to-book hold once payment is authorized (mirrors
// HOLD_WINDOW_MS in booking.ts, so the host still has 48h to decide).
const AUTHORIZED_HOLD_WINDOW_MS = 48 * 60 * 60 * 1000;

const isUniqueViolation = (err: unknown): boolean =>
  (err as { code?: string })?.code === "P2002" ||
  (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002");

export const stripeWebhookRoute = async (fastify: FastifyInstance) => {
  // Signature verification needs exact request bytes. Keep this parser scoped
  // to the webhook plugin so normal JSON routes still receive parsed objects.
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (_request, body, done) => done(null, body)
  );

  fastify.post(
    "/webhooks/stripe",
    { config: { rateLimit: false } },
    async (request, reply) => {
      const signature = request.headers["stripe-signature"];
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!signature || !secret) {
        return reply.status(400).send({ message: "Missing webhook signature" });
      }

      let event: Stripe.Event;
      try {
        event = getStripe().webhooks.constructEvent(
          request.body as Buffer,
          signature,
          secret
        );
      } catch (err) {
        request.log.warn(
          { err },
          "Stripe webhook signature verification failed"
        );
        return reply.status(400).send({ message: "Invalid signature" });
      }

      try {
        await prisma.webhookEvent.create({
          data: {
            id: event.id,
            type: event.type,
            payload: event as unknown as Prisma.InputJsonValue,
            status: "RECEIVED",
          },
        });
      } catch (err) {
        if (isUniqueViolation(err)) {
          return reply.send({ received: true, duplicate: true });
        }
        throw err;
      }

      try {
        const handled = await handleEvent(event, request.log);
        await prisma.webhookEvent.update({
          where: { id: event.id },
          data: {
            status: handled ? "PROCESSED" : "SKIPPED",
            processedAt: new Date(),
          },
        });
        return reply.send({ received: true });
      } catch (err) {
        request.log.error(
          { err, eventId: event.id, type: event.type },
          "Webhook handler failed"
        );
        await prisma.webhookEvent.update({
          where: { id: event.id },
          data: {
            status: "FAILED",
            error: err instanceof Error ? err.message : String(err),
          },
        });
        return reply
          .status(500)
          .send({ message: "Webhook processing failed" });
      }
    }
  );
};

async function handleEvent(
  event: Stripe.Event,
  log: { error: (obj: unknown, msg?: string) => void }
): Promise<boolean> {
  switch (event.type) {
    case "payment_intent.amount_capturable_updated":
      return onAuthorized(event.data.object as Stripe.PaymentIntent, log);
    case "payment_intent.payment_failed":
      return onPaymentFailed(event.data.object as Stripe.PaymentIntent);
    case "payment_intent.canceled":
      return onPaymentCanceled(event.data.object as Stripe.PaymentIntent);
    case "payment_intent.succeeded":
      return onPaymentSucceeded(event.data.object as Stripe.PaymentIntent);
    case "charge.refunded":
      return onChargeRefunded(event.data.object as Stripe.Charge);
    case "refund.failed":
      return onRefundFailed(event.data.object as Stripe.Refund);
    case "account.updated":
      return onAccountUpdated(event.data.object as Stripe.Account);
    case "charge.dispute.created":
    case "charge.dispute.closed":
      return onDispute(event.data.object as Stripe.Dispute, event.type);
    default:
      return false;
  }
}

async function onAuthorized(
  pi: Stripe.PaymentIntent,
  log: { error: (obj: unknown, msg?: string) => void }
): Promise<boolean> {
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: pi.id },
    include: {
      booking: {
        include: {
          space: {
            select: {
              host: { select: { email: true } },
              instantBook: true,
              name: true,
            },
          },
          guest: { select: { email: true, name: true } },
        },
      },
    },
  });
  if (!payment) return false;

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const cas = await tx.payment.updateMany({
      where: { id: payment.id, status: "REQUIRES_PAYMENT" },
      data: { status: "AUTHORIZED", authorizedAt: now },
    });
    if (cas.count === 0) return;
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: {
        paymentStatus: "AUTHORIZED",
        ...(payment.booking.space.instantBook
          ? {}
          : {
              holdExpiresAt: new Date(
                now.getTime() + AUTHORIZED_HOLD_WINDOW_MS
              ),
            }),
      },
    });
    await writeAudit(tx, {
      bookingId: payment.bookingId,
      paymentId: payment.id,
      actorType: "STRIPE_WEBHOOK",
      action: "payment.authorized",
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      stripeObjectId: pi.id,
    });
  });

  if (payment.booking.space.instantBook) {
    const captured = await getStripe().paymentIntents.capture(pi.id, undefined, {
      idempotencyKey: `capture:${payment.bookingId}`,
    });
    await prisma.$transaction(async (tx) => {
      const cas = await tx.payment.updateMany({
        where: { id: payment.id, status: "AUTHORIZED" },
        data: {
          status: "PAID",
          capturedAt: new Date(),
          stripeChargeId:
            typeof captured.latest_charge === "string"
              ? captured.latest_charge
              : captured.latest_charge?.id,
        },
      });
      if (cas.count === 0) return;
      await tx.booking.updateMany({
        where: { id: payment.bookingId, status: "PENDING" },
        data: {
          status: "CONFIRMED",
          approvedAt: new Date(),
          paymentStatus: "PAID",
        },
      });
      await writeAudit(tx, {
        bookingId: payment.bookingId,
        paymentId: payment.id,
        actorType: "STRIPE_WEBHOOK",
        action: "payment.captured",
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        stripeObjectId: pi.id,
      });
    });
    try {
      await producer.send("booking.confirmed", {
        value: {
          bookingId: payment.bookingId,
          guestEmail: payment.booking.guest.email,
          guestName: payment.booking.guest.name,
          spaceName: payment.booking.space.name,
        },
      });
    } catch (err) {
      log.error(
        { err, bookingId: payment.bookingId },
        "Failed to publish booking.confirmed after capture"
      );
    }
  }

  return true;
}

async function onPaymentFailed(pi: Stripe.PaymentIntent): Promise<boolean> {
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: pi.id },
  });
  if (!payment) return false;

  await prisma.$transaction(async (tx) => {
    const cas = await tx.payment.updateMany({
      where: {
        id: payment.id,
        status: { in: ["REQUIRES_PAYMENT", "AUTHORIZED"] },
      },
      data: {
        status: "FAILED",
        lastErrorCode: pi.last_payment_error?.code ?? null,
        lastErrorMessage: pi.last_payment_error?.message ?? null,
      },
    });
    if (cas.count === 0) return;
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { paymentStatus: "FAILED" },
    });
    await writeAudit(tx, {
      bookingId: payment.bookingId,
      paymentId: payment.id,
      actorType: "STRIPE_WEBHOOK",
      action: "payment.failed",
      stripeObjectId: pi.id,
      metadata: { code: pi.last_payment_error?.code ?? null },
    });
  });

  return true;
}

async function onPaymentCanceled(pi: Stripe.PaymentIntent): Promise<boolean> {
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: pi.id },
  });
  if (!payment) return false;

  await prisma.$transaction(async (tx) => {
    const cas = await tx.payment.updateMany({
      where: {
        id: payment.id,
        status: { in: ["REQUIRES_PAYMENT", "AUTHORIZED", "FAILED"] },
      },
      data: { status: "CANCELED", canceledAt: new Date() },
    });
    if (cas.count === 0) return;
    await tx.booking.updateMany({
      where: { id: payment.bookingId, status: "PENDING" },
      data: { status: "EXPIRED", paymentStatus: "CANCELED" },
    });
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { paymentStatus: "CANCELED" },
    });
    await writeAudit(tx, {
      bookingId: payment.bookingId,
      paymentId: payment.id,
      actorType: "STRIPE_WEBHOOK",
      action: "payment.canceled",
      stripeObjectId: pi.id,
    });
  });

  return true;
}

async function onPaymentSucceeded(pi: Stripe.PaymentIntent): Promise<boolean> {
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: pi.id },
  });
  if (!payment) return false;

  await prisma.$transaction(async (tx) => {
    const cas = await tx.payment.updateMany({
      where: {
        id: payment.id,
        status: { in: ["REQUIRES_PAYMENT", "AUTHORIZED"] },
      },
      data: {
        status: "PAID",
        capturedAt: new Date(),
        stripeChargeId:
          typeof pi.latest_charge === "string"
            ? pi.latest_charge
            : pi.latest_charge?.id,
      },
    });
    if (cas.count === 0) return;
    await tx.booking.updateMany({
      where: { id: payment.bookingId, status: "PENDING" },
      data: { status: "CONFIRMED", approvedAt: new Date() },
    });
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { paymentStatus: "PAID" },
    });
    await writeAudit(tx, {
      bookingId: payment.bookingId,
      paymentId: payment.id,
      actorType: "STRIPE_WEBHOOK",
      action: "payment.captured_reconciled",
      stripeObjectId: pi.id,
    });
  });

  return true;
}

async function onChargeRefunded(_charge: Stripe.Charge): Promise<boolean> {
  return false;
}

async function onRefundFailed(_refund: Stripe.Refund): Promise<boolean> {
  return false;
}

async function onAccountUpdated(_account: Stripe.Account): Promise<boolean> {
  return false;
}

async function onDispute(
  _dispute: Stripe.Dispute,
  _type: string
): Promise<boolean> {
  return false;
}
