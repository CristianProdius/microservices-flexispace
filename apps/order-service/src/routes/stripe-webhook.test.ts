import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stripeWebhookRoute } from "./stripe-webhook.js";

const mocks = vi.hoisted(() => {
  const constructEvent = vi.fn();
  const stripePaymentIntentsCapture = vi.fn();
  const webhookEventCreate = vi.fn();
  const webhookEventUpdate = vi.fn();
  const paymentFindUnique = vi.fn();
  const paymentUpdateMany = vi.fn();
  const bookingUpdate = vi.fn();
  const bookingUpdateMany = vi.fn();
  const paymentAuditLogCreate = vi.fn();
  const refundUpdateMany = vi.fn();
  const stripeConnectAccountUpdate = vi.fn();
  const stripeConnectAccountUpdateMany = vi.fn();
  const disputeUpsert = vi.fn();
  const producerSend = vi.fn();

  const prisma = {
    $transaction: vi.fn((input: unknown) => {
      if (typeof input === "function") return input(prisma);
      return Promise.all(input as Promise<unknown>[]);
    }),
    booking: {
      update: bookingUpdate,
      updateMany: bookingUpdateMany,
    },
    dispute: {
      upsert: disputeUpsert,
    },
    payment: {
      findUnique: paymentFindUnique,
      updateMany: paymentUpdateMany,
    },
    paymentAuditLog: {
      create: paymentAuditLogCreate,
    },
    refund: {
      updateMany: refundUpdateMany,
    },
    stripeConnectAccount: {
      update: stripeConnectAccountUpdate,
      updateMany: stripeConnectAccountUpdateMany,
    },
    webhookEvent: {
      create: webhookEventCreate,
      update: webhookEventUpdate,
    },
  };

  return {
    bookingUpdate,
    bookingUpdateMany,
    constructEvent,
    disputeUpsert,
    paymentAuditLogCreate,
    paymentFindUnique,
    paymentUpdateMany,
    prisma,
    producerSend,
    refundUpdateMany,
    stripeConnectAccountUpdate,
    stripeConnectAccountUpdateMany,
    stripePaymentIntentsCapture,
    webhookEventCreate,
    webhookEventUpdate,
  };
});

vi.mock("@repo/db", () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;
      constructor(message: string, options: { code: string }) {
        super(message);
        this.code = options.code;
      }
    },
  },
  prisma: mocks.prisma,
}));

vi.mock("../utils/kafka.js", () => ({
  producer: {
    send: mocks.producerSend,
  },
}));

vi.mock("../utils/stripe.js", () => ({
  getStripe: () => ({
    paymentIntents: {
      capture: mocks.stripePaymentIntentsCapture,
    },
    webhooks: {
      constructEvent: mocks.constructEvent,
    },
  }),
}));

const createApp = async () => {
  const app = Fastify();
  await app.register(stripeWebhookRoute);
  await app.ready();
  return app;
};

const fakeEvent = (id: string, type: string, object: Record<string, unknown>) => ({
  api_version: "2026-07-01",
  created: 1779098400,
  data: { object },
  id,
  livemode: false,
  object: "event",
  pending_webhooks: 1,
  request: null,
  type,
});

const post = (app: Awaited<ReturnType<typeof createApp>>) =>
  app.inject({
    method: "POST",
    url: "/webhooks/stripe",
    headers: {
      "content-type": "application/json",
      "stripe-signature": "t=1,v1=good",
    },
    payload: JSON.stringify({ id: "raw" }),
  });

describe("stripe webhook route", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    mocks.stripePaymentIntentsCapture.mockResolvedValue({ latest_charge: "ch_1" });
    mocks.webhookEventCreate.mockResolvedValue({ id: "evt" });
    mocks.webhookEventUpdate.mockResolvedValue({ id: "evt" });
    mocks.paymentUpdateMany.mockResolvedValue({ count: 1 });
    mocks.bookingUpdate.mockResolvedValue({ id: "booking" });
    mocks.bookingUpdateMany.mockResolvedValue({ count: 1 });
    mocks.paymentAuditLogCreate.mockResolvedValue({ id: "audit" });
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects an invalid signature with 400", async () => {
    const app = await createApp();
    mocks.constructEvent.mockImplementation(() => {
      throw new Error("bad sig");
    });

    const response = await app.inject({
      method: "POST",
      url: "/webhooks/stripe",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=1,v1=bad",
      },
      payload: JSON.stringify({}),
    });

    expect(response.statusCode).toBe(400);
    expect(mocks.webhookEventCreate).not.toHaveBeenCalled();
    await app.close();
  });

  it("stores the event and is a no-op on redelivery (duplicate evt id)", async () => {
    const app = await createApp();
    mocks.constructEvent.mockReturnValue(
      fakeEvent("evt_1", "payment_intent.payment_failed", {
        id: "pi_1",
        last_payment_error: { code: "card_declined", message: "declined" },
      }),
    );
    mocks.webhookEventCreate
      .mockResolvedValueOnce({ id: "evt_1" })
      .mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "P2002" }));
    mocks.paymentFindUnique.mockResolvedValue({
      bookingId: "b1",
      id: "pay_1",
      stripePaymentIntentId: "pi_1",
    });

    const first = await post(app);
    const second = await post(app);

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(second.json()).toEqual({ received: true, duplicate: true });
    expect(mocks.paymentUpdateMany).toHaveBeenCalledTimes(1);
    await app.close();
  });

  it("amount_capturable_updated on an instant-book booking captures and confirms", async () => {
    const app = await createApp();
    mocks.paymentFindUnique.mockResolvedValue({
      amountMinor: 19999,
      booking: {
        guest: { email: "g@x.md", name: "G" },
        id: "b1",
        space: { instantBook: true, name: "Loft" },
        status: "PENDING",
      },
      bookingId: "b1",
      currency: "USD",
      id: "pay_1",
      status: "REQUIRES_PAYMENT",
      stripePaymentIntentId: "pi_1",
    });
    mocks.constructEvent.mockReturnValue(
      fakeEvent("evt_2", "payment_intent.amount_capturable_updated", {
        id: "pi_1",
      }),
    );

    const response = await post(app);

    expect(response.statusCode).toBe(200);
    expect(mocks.stripePaymentIntentsCapture).toHaveBeenCalledWith(
      "pi_1",
      undefined,
      { idempotencyKey: "capture:b1" },
    );
    expect(mocks.bookingUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CONFIRMED" }),
        where: { id: "b1", status: "PENDING" },
      }),
    );
    await app.close();
  });

  it("amount_capturable_updated on request-to-book only marks AUTHORIZED and extends the hold", async () => {
    const app = await createApp();
    mocks.paymentFindUnique.mockResolvedValue({
      amountMinor: 19999,
      booking: {
        guest: { email: "g@x.md", name: "G" },
        id: "b2",
        space: { instantBook: false, name: "Loft" },
        status: "PENDING",
      },
      bookingId: "b2",
      currency: "USD",
      id: "pay_2",
      status: "REQUIRES_PAYMENT",
      stripePaymentIntentId: "pi_2",
    });
    mocks.constructEvent.mockReturnValue(
      fakeEvent("evt_3", "payment_intent.amount_capturable_updated", {
        id: "pi_2",
      }),
    );

    const response = await post(app);

    expect(response.statusCode).toBe(200);
    expect(mocks.stripePaymentIntentsCapture).not.toHaveBeenCalled();
    expect(mocks.bookingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentStatus: "AUTHORIZED" }),
        where: { id: "b2" },
      }),
    );
    const updateData = mocks.bookingUpdate.mock.calls[0]![0].data;
    expect(new Date(updateData.holdExpiresAt).getTime()).toBeGreaterThan(
      Date.now() + 47 * 60 * 60_000,
    );
    expect(new Date(updateData.holdExpiresAt).getTime()).toBeLessThanOrEqual(
      Date.now() + 48 * 60 * 60_000,
    );
    await app.close();
  });

  it("marks the inbox row FAILED and returns 500 so Stripe retries when a handler throws", async () => {
    const app = await createApp();
    mocks.constructEvent.mockReturnValue(
      fakeEvent("evt_4", "payment_intent.amount_capturable_updated", {
        id: "pi_4",
      }),
    );
    mocks.webhookEventCreate.mockResolvedValueOnce({ id: "evt_4" });
    mocks.paymentFindUnique.mockRejectedValue(new Error("db down"));

    const response = await post(app);

    expect(response.statusCode).toBe(500);
    expect(mocks.webhookEventUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          error: "db down",
          status: "FAILED",
        }),
        where: { id: "evt_4" },
      }),
    );
    await app.close();
  });

  it("reconciles account.updated into the host Connect account row", async () => {
    const app = await createApp();
    mocks.constructEvent.mockReturnValue(
      fakeEvent("evt_acct", "account.updated", {
        charges_enabled: true,
        country: "RO",
        default_currency: "eur",
        details_submitted: true,
        id: "acct_1",
        payouts_enabled: true,
        requirements: {
          currently_due: ["external_account"],
          disabled_reason: null,
        },
      }),
    );
    mocks.stripeConnectAccountUpdateMany.mockResolvedValue({ count: 1 });

    const response = await post(app);

    expect(response.statusCode).toBe(200);
    expect(mocks.stripeConnectAccountUpdateMany).toHaveBeenCalledWith({
      where: { stripeAccountId: "acct_1" },
      data: expect.objectContaining({
        chargesEnabled: true,
        country: "RO",
        defaultCurrency: "eur",
        detailsSubmitted: true,
        payoutsEnabled: true,
        requirementsDue: ["external_account"],
        status: "ACTIVE",
      }),
    });
    expect(mocks.paymentAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "connect.account_updated",
        actorType: "STRIPE_WEBHOOK",
        metadata: { eventId: "evt_acct", status: "ACTIVE" },
        stripeObjectId: "acct_1",
      }),
    });
    await app.close();
  });
});
