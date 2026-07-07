import Fastify from "fastify";
import { signAccessToken } from "@repo/auth-middleware/jwt";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { bookingRoute } from "./booking.js";

const mocks = vi.hoisted(() => {
  const bookingFindUnique = vi.fn();
  const bookingUpdate = vi.fn();
  const bookingUpdateMany = vi.fn();
  const paymentFindUnique = vi.fn();
  const paymentAuditLogCreate = vi.fn();
  const refundUpdate = vi.fn();
  const refundUpsert = vi.fn();
  const stripeRefundsCreate = vi.fn();
  const userFindFirst = vi.fn(({ where }: { where: { id: string } }) =>
    Promise.resolve({ id: where.id, role: "USER" }),
  );

  const prisma = {
    $transaction: vi.fn((input: unknown) => {
      if (typeof input === "function") return input(prisma);
      return Promise.all(input as Promise<unknown>[]);
    }),
    booking: {
      findUnique: bookingFindUnique,
      update: bookingUpdate,
      updateMany: bookingUpdateMany,
    },
    payment: {
      findUnique: paymentFindUnique,
    },
    paymentAuditLog: {
      create: paymentAuditLogCreate,
    },
    refund: {
      update: refundUpdate,
      upsert: refundUpsert,
    },
    user: {
      findFirst: userFindFirst,
    },
  };

  return {
    bookingFindUnique,
    bookingUpdate,
    bookingUpdateMany,
    paymentAuditLogCreate,
    paymentFindUnique,
    prisma,
    refundUpdate,
    refundUpsert,
    stripeRefundsCreate,
    userFindFirst,
  };
});

vi.mock("@repo/db", () => ({
  BookingStatus: {
    CANCELLED: "CANCELLED",
    COMPLETED: "COMPLETED",
    CONFIRMED: "CONFIRMED",
    EXPIRED: "EXPIRED",
    PENDING: "PENDING",
    REJECTED: "REJECTED",
  },
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
    send: vi.fn(),
  },
}));

vi.mock("../utils/stripe.js", () => ({
  paymentsEnabled: () => process.env.PAYMENTS_ENABLED === "true",
  stripePayoutsEnabled: () => false,
  getStripe: () => ({
    paymentIntents: {
      cancel: vi.fn(),
    },
    refunds: {
      create: mocks.stripeRefundsCreate,
    },
  }),
  resetStripeForTests: () => {},
}));

const createApp = async () => {
  const app = Fastify();
  await app.register(bookingRoute);
  await app.ready();
  return app;
};

const createUserToken = () =>
  signAccessToken({
    email: "guest@example.com",
    role: "USER",
    userId: "guest-1",
  });

const confirmedBooking = {
  currency: "USD",
  endDate: new Date("2026-05-18T00:00:00.000Z"),
  endTime: "12:00",
  guest: { email: "guest@example.com", name: "Guest" },
  guestId: "guest-1",
  host: { email: "host@example.com", name: "Host" },
  hostId: "host-1",
  id: "b-paid",
  isHourly: true,
  space: {
    cancellationPolicy: "FLEXIBLE",
    name: "Focused room",
    venue: { timezone: "Europe/Chisinau" },
  },
  spaceId: 42,
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60_000),
  startTime: "10:00",
  status: "CONFIRMED",
  totalAmount: 100,
};

const capturedPayment = {
  amountMinor: 10000,
  bookingId: "b-paid",
  currency: "USD",
  id: "pay_1",
  refundedMinor: 0,
  status: "PAID",
  stripeChargeId: "ch_1",
  stripePaymentIntentId: "pi_1",
};

describe("booking cancel captured-payment refunds", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  beforeEach(() => {
    vi.stubEnv("PAYMENTS_ENABLED", "true");
    mocks.userFindFirst.mockImplementation(({ where }: any) =>
      Promise.resolve({ id: where?.id ?? "guest-1", role: "USER" }),
    );
    mocks.bookingUpdateMany.mockResolvedValue({ count: 1 });
    mocks.paymentFindUnique.mockResolvedValue(capturedPayment);
    mocks.paymentAuditLogCreate.mockResolvedValue({ id: "audit-1" });
    mocks.refundUpdate.mockResolvedValue({ id: "refund_1" });
    mocks.stripeRefundsCreate.mockResolvedValue({ id: "re_1" });
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  it("creates a pending Refund row, audits it, and calls Stripe with a deterministic idempotency key", async () => {
    const app = await createApp();
    mocks.bookingFindUnique
      .mockResolvedValueOnce(confirmedBooking)
      .mockResolvedValueOnce({ id: "b-paid", status: "CANCELLED" });
    mocks.refundUpsert.mockResolvedValue({
      amountMinor: 10000,
      id: "refund_1",
      idempotencyKey: "refund:b-paid:cancellation",
      stripeRefundId: null,
    });

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: { reason: "Plans changed" },
      url: "/bookings/b-paid/cancel",
    });

    expect(response.statusCode).toBe(200);
    expect(mocks.refundUpsert).toHaveBeenCalledWith({
      create: expect.objectContaining({
        amountMinor: 10000,
        bookingId: "b-paid",
        currency: "USD",
        idempotencyKey: "refund:b-paid:cancellation",
        paymentId: "pay_1",
        status: "PENDING",
      }),
      update: {},
      where: { idempotencyKey: "refund:b-paid:cancellation" },
    });
    expect(mocks.paymentAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "refund.created",
        amountMinor: 10000,
        bookingId: "b-paid",
        paymentId: "pay_1",
        refundId: "refund_1",
      }),
    });
    expect(mocks.stripeRefundsCreate).toHaveBeenCalledWith(
      { amount: 10000, charge: "ch_1" },
      { idempotencyKey: "refund:b-paid:cancellation" },
    );
    expect(response.json().refund).toEqual(
      expect.objectContaining({
        amountMinor: 10000,
        provider: "stripe",
        refundId: "refund_1",
      }),
    );
    await app.close();
  });

  it("reuses the idempotent Refund row and only calls Stripe once when cancellation is retried", async () => {
    const app = await createApp();
    mocks.bookingFindUnique
      .mockResolvedValueOnce(confirmedBooking)
      .mockResolvedValueOnce({ id: "b-paid", status: "CANCELLED" })
      .mockResolvedValueOnce(confirmedBooking)
      .mockResolvedValueOnce({ id: "b-paid", status: "CANCELLED" });
    mocks.refundUpsert
      .mockResolvedValueOnce({
        amountMinor: 10000,
        id: "refund_1",
        idempotencyKey: "refund:b-paid:cancellation",
        stripeRefundId: null,
      })
      .mockResolvedValueOnce({
        amountMinor: 10000,
        id: "refund_1",
        idempotencyKey: "refund:b-paid:cancellation",
        stripeRefundId: "re_1",
      });

    const first = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: { reason: "Plans changed" },
      url: "/bookings/b-paid/cancel",
    });
    const second = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: { reason: "Plans changed" },
      url: "/bookings/b-paid/cancel",
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(mocks.refundUpsert).toHaveBeenCalledTimes(2);
    expect(mocks.refundUpsert.mock.calls[0]![0].where).toEqual(
      mocks.refundUpsert.mock.calls[1]![0].where,
    );
    expect(mocks.stripeRefundsCreate).toHaveBeenCalledTimes(1);
    await app.close();
  });
});
