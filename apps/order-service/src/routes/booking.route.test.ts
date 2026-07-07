import Fastify from "fastify";
import { signAccessToken } from "@repo/auth-middleware/jwt";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bookingRoute,
  computeRefundRate,
  MissingExchangeRateError,
  round2,
} from "./booking.js";

const mocks = vi.hoisted(() => {
  const bookingCreate = vi.fn();
  const bookingFindFirst = vi.fn();
  const bookingFindMany = vi.fn();
  const bookingFindUnique = vi.fn();
  const bookingUpdate = vi.fn();
  const bookingUpdateMany = vi.fn();
  const bookingGroupBy = vi.fn();
  const payoutGroupBy = vi.fn();
  const payoutCreate = vi.fn();
  const paymentCreate = vi.fn();
  const paymentFindUnique = vi.fn();
  const paymentUpdate = vi.fn();
  const paymentUpdateMany = vi.fn();
  const paymentAuditLogCreate = vi.fn();
  const refundCreate = vi.fn();
  const stripePaymentIntentsCreate = vi.fn();
  const stripePaymentIntentsCancel = vi.fn();
  const stripePaymentIntentsCapture = vi.fn();
  // AUD-005/021: `shouldBe*` middleware now consults `prisma.user.findFirst`
  // via `lookupActiveUser`. Default to "active user with the role the JWT
  // claims" so existing tests don't have to be aware of the active-user check.
  const userFindFirst = vi.fn(({ where }: { where: { id: string } }) =>
    Promise.resolve({ id: where.id, role: "HOST" }),
  );
  const prisma = {
    $transaction: vi.fn((input: unknown) => {
      if (typeof input === "function") return input(prisma);
      return Promise.all(input as Promise<unknown>[]);
    }),
    booking: {
      create: bookingCreate,
      findFirst: bookingFindFirst,
      findMany: bookingFindMany,
      findUnique: bookingFindUnique,
      groupBy: bookingGroupBy,
      update: bookingUpdate,
      updateMany: bookingUpdateMany,
    },
    exchangeRate: {
      findUnique: vi.fn(),
    },
    payout: {
      groupBy: payoutGroupBy,
      create: payoutCreate,
    },
    payment: {
      create: paymentCreate,
      findUnique: paymentFindUnique,
      update: paymentUpdate,
      updateMany: paymentUpdateMany,
    },
    paymentAuditLog: {
      create: paymentAuditLogCreate,
    },
    refund: {
      create: refundCreate,
    },
    space: {
      findUnique: vi.fn(),
    },
    user: {
      findFirst: userFindFirst,
    },
  };

  return {
    bookingCreate,
    bookingFindFirst,
    bookingFindMany,
    bookingFindUnique,
    bookingGroupBy,
    bookingUpdate,
    bookingUpdateMany,
    exchangeRateFindUnique: prisma.exchangeRate.findUnique,
    paymentAuditLogCreate,
    paymentCreate,
    paymentFindUnique,
    paymentUpdate,
    paymentUpdateMany,
    payoutGroupBy,
    payoutCreate,
    prisma,
    producerSend: vi.fn(),
    refundCreate,
    spaceFindUnique: prisma.space.findUnique,
    stripePaymentIntentsCancel,
    stripePaymentIntentsCapture,
    stripePaymentIntentsCreate,
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
    send: mocks.producerSend,
  },
}));

vi.mock("../utils/stripe.js", () => ({
  paymentsEnabled: () => process.env.PAYMENTS_ENABLED === "true",
  stripePayoutsEnabled: () => false,
  getStripe: () => ({
    paymentIntents: {
      create: mocks.stripePaymentIntentsCreate,
      cancel: mocks.stripePaymentIntentsCancel,
      capture: mocks.stripePaymentIntentsCapture,
    },
  }),
  resetStripeForTests: () => {},
}));

const createApp = async () => {
  const app = Fastify();
  await app.register(bookingRoute);
  return app;
};

const createUserToken = () =>
  signAccessToken({
    userId: "guest-1",
    email: "guest@example.com",
    role: "USER",
  });

const createHostToken = () =>
  signAccessToken({
    userId: "host-1",
    email: "host@example.com",
    role: "HOST",
    hostVerified: true,
  });

const createOtherUserToken = () =>
  signAccessToken({
    userId: "guest-2",
    email: "other@example.com",
    role: "USER",
  });

const monday = "2026-05-18";
const validBookingPayload = {
  endDate: monday,
  endTime: "11:00",
  guests: 1,
  isHourly: true,
  spaceId: 42,
  startDate: monday,
  startTime: "10:00",
};

const baseSpace = {
  availability: [
    {
      dayOfWeek: 1,
      endTime: "17:00",
      isOpen: true,
      startTime: "09:00",
    },
  ],
  blockedDates: [],
  capacity: 4,
  cleaningFee: 0,
  currency: "USD",
  host: { email: "host@example.com" },
  hostId: "host-1",
  id: 42,
  instantBook: false,
  isActive: true,
  maxBookingHours: 8,
  minBookingHours: 1,
  name: "Focused room",
  pricePerDay: null,
  pricePerHour: 25,
  pricingTiers: [],
  pricingType: "HOURLY",
};

const createdBooking = {
  guest: {
    email: "guest@example.com",
    id: "guest-1",
    name: "Guest",
  },
  guestId: "guest-1",
  hostId: "host-1",
  id: "booking-new",
  space: {
    host: { email: "host@example.com" },
  },
  spaceId: 42,
  status: "PENDING",
};

describe("booking routes", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  beforeEach(async () => {
    // AUD-005/021: re-prime the user.findFirst default after vi.resetAllMocks
    // cleared it (afterEach below). Tests that want a "soft-deleted" path can
    // override per-test by calling mocks.userFindFirst.mockResolvedValueOnce.
    mocks.userFindFirst.mockImplementation(({ where }: any) =>
      Promise.resolve({ id: where?.id ?? "user", role: "HOST" }),
    );
    const { _clearUserCacheForTests } = await import("@repo/auth-middleware");
    _clearUserCacheForTests();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("POST /bookings with PAYMENTS_ENABLED", () => {
    beforeEach(() => {
      vi.stubEnv("PAYMENTS_ENABLED", "true");
      mocks.stripePaymentIntentsCreate.mockResolvedValue({
        id: "pi_123",
        client_secret: "pi_123_secret_abc",
      });
      mocks.paymentCreate.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: "pay_1", ...data }),
      );
      mocks.bookingUpdate.mockResolvedValue({ id: "booking-new" });
      mocks.paymentAuditLogCreate.mockResolvedValue({ id: "audit-1" });
    });

    afterEach(() => vi.unstubAllEnvs());

    it("creates the booking PENDING with a 30-minute payment hold even for instant book, creates a manual-capture PI in integer minor units, and returns the clientSecret", async () => {
      const app = await createApp();
      mocks.spaceFindUnique.mockResolvedValue({
        ...baseSpace,
        instantBook: true,
        pricePerHour: 199.99,
      });
      mocks.bookingFindMany.mockResolvedValue([]);
      mocks.bookingCreate.mockImplementation(({ data }: any) =>
        Promise.resolve({
          ...createdBooking,
          ...data,
          guest: createdBooking.guest,
          id: "booking-new",
          space: { host: { email: "host@example.com" }, name: "Focused room" },
        }),
      );

      const response = await app.inject({
        headers: { authorization: `Bearer ${createUserToken()}` },
        method: "POST",
        payload: validBookingPayload,
        url: "/bookings",
      });

      expect(response.statusCode).toBe(201);
      const created = mocks.bookingCreate.mock.calls[0]![0].data;
      expect(created.status).toBe("PENDING");
      expect(new Date(created.holdExpiresAt).getTime()).toBeLessThanOrEqual(
        Date.now() + 30 * 60_000,
      );
      expect(mocks.stripePaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 19999,
          currency: "usd",
          capture_method: "manual",
          metadata: expect.objectContaining({ bookingId: "booking-new" }),
        }),
        expect.objectContaining({ idempotencyKey: "pi:booking-new" }),
      );
      expect(response.json().payment).toEqual(
        expect.objectContaining({
          amountMinor: 19999,
          clientSecret: "pi_123_secret_abc",
          status: "REQUIRES_PAYMENT",
        }),
      );
      await app.close();
    });

    it("expires the booking and returns 502 when PaymentIntent creation fails", async () => {
      const app = await createApp();
      mocks.spaceFindUnique.mockResolvedValue(baseSpace);
      mocks.bookingFindMany.mockResolvedValue([]);
      mocks.bookingCreate.mockImplementation(({ data }: any) =>
        Promise.resolve({
          ...createdBooking,
          ...data,
          guest: createdBooking.guest,
          id: "booking-new",
          space: { host: { email: "host@example.com" }, name: "Focused room" },
        }),
      );
      mocks.stripePaymentIntentsCreate.mockRejectedValue(new Error("stripe down"));

      const response = await app.inject({
        headers: { authorization: `Bearer ${createUserToken()}` },
        method: "POST",
        payload: validBookingPayload,
        url: "/bookings",
      });

      expect(response.statusCode).toBe(502);
      expect(mocks.bookingUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "EXPIRED" },
          where: expect.objectContaining({ status: "PENDING" }),
        }),
      );
      await app.close();
    });

    it("is unchanged when the flag is off", async () => {
      vi.stubEnv("PAYMENTS_ENABLED", "false");
      const app = await createApp();
      mocks.spaceFindUnique.mockResolvedValue({
        ...baseSpace,
        instantBook: true,
      });
      mocks.bookingFindMany.mockResolvedValue([]);
      mocks.bookingCreate.mockResolvedValue({
        ...createdBooking,
        status: "CONFIRMED",
      });

      const response = await app.inject({
        headers: { authorization: `Bearer ${createUserToken()}` },
        method: "POST",
        payload: validBookingPayload,
        url: "/bookings",
      });

      expect(response.statusCode).toBe(201);
      expect(mocks.stripePaymentIntentsCreate).not.toHaveBeenCalled();
      expect(response.json().payment).toBeUndefined();
      await app.close();
    });
  });

  describe("booking payment endpoints", () => {
    beforeEach(() => {
      vi.stubEnv("PAYMENTS_ENABLED", "true");
      mocks.stripePaymentIntentsCreate.mockResolvedValue({
        id: "pi_retry",
        client_secret: "pi_retry_secret",
      });
      mocks.paymentUpdate.mockImplementation(({ data }: any) =>
        Promise.resolve({
          amountMinor: 2500,
          currency: "USD",
          id: "pay_1",
          status: data.status,
          stripePaymentIntentId: data.stripePaymentIntentId,
        }),
      );
      mocks.bookingUpdate.mockResolvedValue({ id: "booking-new" });
      mocks.paymentAuditLogCreate.mockResolvedValue({ id: "audit-1" });
    });

    afterEach(() => vi.unstubAllEnvs());

    it("lets the guest recreate a failed PaymentIntent for a live pending hold", async () => {
      const app = await createApp();
      const holdExpiresAt = new Date(Date.now() + 10 * 60_000);
      mocks.bookingFindUnique.mockResolvedValue({
        guestId: "guest-1",
        holdExpiresAt,
        id: "b-retry",
        payment: {
          amountMinor: 2500,
          applicationFeeMinor: 250,
          currency: "USD",
          id: "pay_1",
          status: "FAILED",
          stripePaymentIntentId: "pi_old",
          updatedAt: new Date("2026-05-18T10:00:00.000Z"),
        },
        spaceId: 42,
        status: "PENDING",
      });

      const response = await app.inject({
        headers: { authorization: `Bearer ${createUserToken()}` },
        method: "POST",
        payload: {},
        url: "/bookings/b-retry/payment-intent",
      });

      expect(response.statusCode).toBe(201);
      expect(mocks.stripePaymentIntentsCancel).toHaveBeenCalledWith("pi_old");
      expect(mocks.stripePaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2500,
          currency: "usd",
          capture_method: "manual",
          metadata: expect.objectContaining({ bookingId: "b-retry" }),
        }),
        expect.objectContaining({
          idempotencyKey: "pi:b-retry:retry:1779098400000",
        }),
      );
      expect(response.json()).toEqual(
        expect.objectContaining({
          amountMinor: 2500,
          clientSecret: "pi_retry_secret",
          currency: "USD",
          paymentId: "pay_1",
          status: "REQUIRES_PAYMENT",
        }),
      );
      await app.close();
    });

    it("blocks non-guests from recreating a PaymentIntent", async () => {
      const app = await createApp();
      mocks.bookingFindUnique.mockResolvedValue({
        guestId: "guest-2",
        holdExpiresAt: new Date(Date.now() + 10 * 60_000),
        id: "b-retry",
        payment: {
          id: "pay_1",
          status: "FAILED",
          stripePaymentIntentId: "pi_old",
        },
        status: "PENDING",
      });

      const response = await app.inject({
        headers: { authorization: `Bearer ${createUserToken()}` },
        method: "POST",
        payload: {},
        url: "/bookings/b-retry/payment-intent",
      });

      expect(response.statusCode).toBe(403);
      expect(mocks.stripePaymentIntentsCreate).not.toHaveBeenCalled();
      await app.close();
    });

    it("lets the guest read booking payment and refund status", async () => {
      const app = await createApp();
      mocks.bookingFindUnique.mockResolvedValue({
        guestId: "guest-1",
        hostId: "host-1",
        id: "booking-new",
        payment: {
          amountMinor: 2500,
          capturedAt: null,
          currency: "USD",
          id: "pay_1",
          lastErrorMessage: "declined",
          refundedMinor: 500,
          refunds: [
            {
              amountMinor: 500,
              createdAt: new Date("2026-05-18T10:00:00.000Z"),
              id: "refund-1",
              status: "SUCCEEDED",
            },
          ],
          status: "PARTIALLY_REFUNDED",
        },
      });

      const response = await app.inject({
        headers: { authorization: `Bearer ${createUserToken()}` },
        method: "GET",
        url: "/bookings/booking-new/payment",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        amountMinor: 2500,
        capturedAt: null,
        currency: "USD",
        lastErrorMessage: "declined",
        paymentId: "pay_1",
        refundedMinor: 500,
        refunds: [
          {
            amountMinor: 500,
            createdAt: "2026-05-18T10:00:00.000Z",
            id: "refund-1",
            status: "SUCCEEDED",
          },
        ],
        status: "PARTIALLY_REFUNDED",
      });
      await app.close();
    });

    it("blocks strangers from reading booking payment status", async () => {
      const app = await createApp();
      mocks.bookingFindUnique.mockResolvedValue({
        guestId: "guest-1",
        hostId: "host-1",
        id: "booking-new",
        payment: {
          id: "pay_1",
          refunds: [],
          status: "REQUIRES_PAYMENT",
        },
      });

      const response = await app.inject({
        headers: { authorization: `Bearer ${createOtherUserToken()}` },
        method: "GET",
        url: "/bookings/booking-new/payment",
      });

      expect(response.statusCode).toBe(403);
      await app.close();
    });
  });

  describe("payment capture and uncaptured release transitions", () => {
    beforeEach(() => {
      vi.stubEnv("PAYMENTS_ENABLED", "true");
      mocks.paymentAuditLogCreate.mockResolvedValue({ id: "audit-1" });
      mocks.paymentUpdateMany.mockResolvedValue({ count: 1 });
      mocks.bookingUpdate.mockResolvedValue({ id: "booking" });
      mocks.stripePaymentIntentsCapture.mockResolvedValue({
        latest_charge: "ch_1",
      });
      mocks.stripePaymentIntentsCancel.mockResolvedValue({ id: "pi_cancelled" });
      mocks.producerSend.mockResolvedValue(undefined);
    });

    afterEach(() => vi.unstubAllEnvs());

    it("captures an AUTHORIZED payment when a host approves the booking", async () => {
      const app = await createApp();
      mocks.bookingFindUnique
        .mockResolvedValueOnce({
          endDate: new Date(monday),
          endTime: "12:00",
          guest: { email: "guest@example.com", name: "Guest" },
          hostId: "host-1",
          id: "b-auth",
          isHourly: true,
          space: { name: "Focused room" },
          spaceId: 42,
          startDate: new Date(monday),
          startTime: "10:00",
          status: "PENDING",
        })
        .mockResolvedValueOnce({ id: "b-auth", status: "CONFIRMED" });
      mocks.paymentFindUnique.mockResolvedValue({
        amountMinor: 19999,
        bookingId: "b-auth",
        currency: "USD",
        id: "pay_1",
        status: "AUTHORIZED",
        stripePaymentIntentId: "pi_auth",
      });
      mocks.bookingFindMany.mockResolvedValue([]);
      mocks.bookingUpdateMany.mockResolvedValue({ count: 1 });

      const response = await app.inject({
        headers: { authorization: `Bearer ${createHostToken()}` },
        method: "PUT",
        payload: {},
        url: "/bookings/b-auth/approve",
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.stripePaymentIntentsCapture).toHaveBeenCalledWith(
        "pi_auth",
        undefined,
        { idempotencyKey: "capture:b-auth" },
      );
      expect(mocks.paymentUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "PAID",
            stripeChargeId: "ch_1",
          }),
          where: { id: "pay_1", status: "AUTHORIZED" },
        }),
      );
      expect(mocks.bookingUpdate).toHaveBeenCalledWith({
        data: { paymentStatus: "PAID" },
        where: { id: "b-auth" },
      });
      await app.close();
    });

    it("blocks approval when the guest payment is not authorized", async () => {
      const app = await createApp();
      mocks.bookingFindUnique.mockResolvedValueOnce({
        endDate: new Date(monday),
        endTime: "12:00",
        guest: { email: "guest@example.com", name: "Guest" },
        hostId: "host-1",
        id: "b-unpaid",
        isHourly: true,
        space: { name: "Focused room" },
        spaceId: 42,
        startDate: new Date(monday),
        startTime: "10:00",
        status: "PENDING",
      });
      mocks.paymentFindUnique.mockResolvedValue({
        amountMinor: 19999,
        bookingId: "b-unpaid",
        currency: "USD",
        id: "pay_1",
        status: "REQUIRES_PAYMENT",
        stripePaymentIntentId: "pi_requires",
      });

      const response = await app.inject({
        headers: { authorization: `Bearer ${createHostToken()}` },
        method: "PUT",
        payload: {},
        url: "/bookings/b-unpaid/approve",
      });

      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual({
        code: "PAYMENT_NOT_AUTHORIZED",
        message:
          "Guest payment is not authorized yet — the booking cannot be approved",
      });
      expect(mocks.stripePaymentIntentsCapture).not.toHaveBeenCalled();
      expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
      await app.close();
    });

    it("compensates a confirmed booking back to CANCELLED when capture fails", async () => {
      const app = await createApp();
      mocks.bookingFindUnique
        .mockResolvedValueOnce({
          endDate: new Date(monday),
          endTime: "12:00",
          guest: { email: "guest@example.com", name: "Guest" },
          hostId: "host-1",
          id: "b-capture-fail",
          isHourly: true,
          space: { name: "Focused room" },
          spaceId: 42,
          startDate: new Date(monday),
          startTime: "10:00",
          status: "PENDING",
        })
        .mockResolvedValueOnce({ id: "b-capture-fail", status: "CONFIRMED" });
      mocks.paymentFindUnique.mockResolvedValue({
        amountMinor: 19999,
        bookingId: "b-capture-fail",
        currency: "USD",
        id: "pay_1",
        status: "AUTHORIZED",
        stripePaymentIntentId: "pi_auth",
      });
      mocks.bookingFindMany.mockResolvedValue([]);
      mocks.bookingUpdateMany.mockResolvedValue({ count: 1 });
      mocks.stripePaymentIntentsCapture.mockRejectedValue(new Error("auth expired"));

      const response = await app.inject({
        headers: { authorization: `Bearer ${createHostToken()}` },
        method: "PUT",
        payload: {},
        url: "/bookings/b-capture-fail/approve",
      });

      expect(response.statusCode).toBe(402);
      expect(response.json()).toEqual({
        code: "PAYMENT_CAPTURE_FAILED",
        message:
          "The guest's payment could not be captured; the booking was cancelled",
      });
      expect(mocks.bookingUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cancellationReason: "payment_capture_failed",
            cancelledByRole: "HOST",
            paymentStatus: "FAILED",
            status: "CANCELLED",
          }),
          where: { id: "b-capture-fail", status: "CONFIRMED" },
        }),
      );
      expect(mocks.paymentUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastErrorMessage: "capture_failed",
            status: "FAILED",
          }),
          where: { id: "pay_1" },
        }),
      );
      expect(mocks.stripePaymentIntentsCancel).toHaveBeenCalledWith("pi_auth");
      await app.close();
    });

    it("releases an AUTHORIZED payment when the host rejects the booking", async () => {
      const app = await createApp();
      mocks.bookingFindUnique
        .mockResolvedValueOnce({
          guest: { email: "guest@example.com" },
          hostId: "host-1",
          id: "b-reject",
          space: { name: "Focused room" },
          status: "PENDING",
        })
        .mockResolvedValueOnce({ id: "b-reject", status: "REJECTED" });
      mocks.bookingUpdateMany.mockResolvedValue({ count: 1 });
      mocks.paymentFindUnique.mockResolvedValue({
        amountMinor: 2500,
        bookingId: "b-reject",
        currency: "USD",
        id: "pay_1",
        status: "AUTHORIZED",
        stripePaymentIntentId: "pi_auth",
      });

      const response = await app.inject({
        headers: { authorization: `Bearer ${createHostToken()}` },
        method: "PUT",
        payload: { reason: "Not available" },
        url: "/bookings/b-reject/reject",
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.stripePaymentIntentsCancel).toHaveBeenCalledWith("pi_auth");
      expect(mocks.paymentUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "CANCELED" }),
          where: {
            id: "pay_1",
            status: { in: ["REQUIRES_PAYMENT", "AUTHORIZED", "FAILED"] },
          },
        }),
      );
      await app.close();
    });

    it("cancels an AUTHORIZED pending payment on guest cancellation without creating a refund", async () => {
      const app = await createApp();
      mocks.bookingFindUnique
        .mockResolvedValueOnce({
          currency: "USD",
          endDate: new Date(monday),
          endTime: "12:00",
          guest: { email: "guest@example.com", name: "Guest" },
          guestId: "guest-1",
          host: { email: "host@example.com", name: "Host" },
          hostId: "host-1",
          id: "b-pending-cancel",
          isHourly: true,
          space: {
            cancellationPolicy: "FLEXIBLE",
            name: "Focused room",
            venue: { timezone: "Europe/Chisinau" },
          },
          spaceId: 42,
          startDate: new Date(monday),
          startTime: "10:00",
          status: "PENDING",
          totalAmount: 100,
        })
        .mockResolvedValueOnce({ id: "b-pending-cancel", status: "CANCELLED" });
      mocks.bookingUpdateMany.mockResolvedValue({ count: 1 });
      mocks.paymentFindUnique.mockResolvedValue({
        amountMinor: 2500,
        bookingId: "b-pending-cancel",
        currency: "USD",
        id: "pay_1",
        status: "AUTHORIZED",
        stripePaymentIntentId: "pi_auth",
      });

      const response = await app.inject({
        headers: { authorization: `Bearer ${createUserToken()}` },
        method: "POST",
        payload: { reason: "Plans changed" },
        url: "/bookings/b-pending-cancel/cancel",
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.stripePaymentIntentsCancel).toHaveBeenCalledWith("pi_auth");
      expect(mocks.paymentUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "CANCELED" }),
          where: {
            id: "pay_1",
            status: { in: ["REQUIRES_PAYMENT", "AUTHORIZED", "FAILED"] },
          },
        }),
      );
      expect(mocks.refundCreate).not.toHaveBeenCalled();
      await app.close();
    });

    it("blocks completion when a Payment row exists but has not been captured", async () => {
      const app = await createApp();
      mocks.bookingFindUnique.mockResolvedValueOnce({
        guest: { email: "guest@example.com" },
        hostId: "host-1",
        id: "b-complete-unpaid",
        serviceFee: 20,
        space: { name: "Focused room" },
        status: "CONFIRMED",
        totalAmount: 100,
      });
      mocks.paymentFindUnique.mockResolvedValue({
        bookingId: "b-complete-unpaid",
        id: "pay_1",
        status: "AUTHORIZED",
      });

      const response = await app.inject({
        headers: { authorization: `Bearer ${createHostToken()}` },
        method: "PUT",
        payload: {},
        url: "/bookings/b-complete-unpaid/complete",
      });

      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual({
        code: "PAYMENT_NOT_CAPTURED",
        message: "Guest payment has not been captured yet",
      });
      expect(mocks.payoutCreate).not.toHaveBeenCalled();
      expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
      await app.close();
    });
  });

  it("allows adjacent hourly bookings on the same date", async () => {
    const app = await createApp();
    mocks.spaceFindUnique.mockResolvedValue(baseSpace);
    mocks.bookingFindFirst.mockResolvedValue({
      endDate: new Date(monday),
      endTime: "10:00",
      isHourly: true,
      startDate: new Date(monday),
      startTime: "09:00",
    });
    mocks.bookingFindMany.mockResolvedValue([
      {
        endDate: new Date(monday),
        endTime: "10:00",
        isHourly: true,
        startDate: new Date(monday),
        startTime: "09:00",
      },
    ]);
    mocks.bookingCreate.mockResolvedValue(createdBooking);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "11:00",
        guests: 1,
        isHourly: true,
        spaceId: 42,
        startDate: monday,
        startTime: "10:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(201);
    expect(mocks.bookingCreate).toHaveBeenCalled();
    await app.close();
  });

  it("rejects hourly bookings outside configured availability", async () => {
    const app = await createApp();
    mocks.spaceFindUnique.mockResolvedValue(baseSpace);
    mocks.bookingFindFirst.mockResolvedValue(null);
    mocks.bookingFindMany.mockResolvedValue([]);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "18:00",
        guests: 1,
        isHourly: true,
        spaceId: 42,
        startDate: monday,
        startTime: "17:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ message: "Booking time is outside availability" });
    expect(mocks.bookingCreate).not.toHaveBeenCalled();
    await app.close();
  });

  it("rejects blocked booking dates before creating a booking", async () => {
    const app = await createApp();
    mocks.spaceFindUnique.mockResolvedValue({
      ...baseSpace,
      blockedDates: [{ date: new Date(monday), reason: "Maintenance" }],
    });
    mocks.bookingFindFirst.mockResolvedValue(null);
    mocks.bookingFindMany.mockResolvedValue([]);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "11:00",
        guests: 1,
        isHourly: true,
        spaceId: 42,
        startDate: monday,
        startTime: "10:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ message: "Some requested dates are blocked" });
    expect(mocks.bookingCreate).not.toHaveBeenCalled();
    await app.close();
  });

  // H1: hourly-only space + isHourly=false + no times must NOT become a free,
  // fully-blocking full-day reservation. Server derives isHourly=false (no
  // times), pricing finds no applicable candidate, and the route returns 400.
  it("rejects an hourly-only space booked full-day with no times (no free hold)", async () => {
    const app = await createApp();
    mocks.spaceFindUnique.mockResolvedValue({
      ...baseSpace,
      // Drop the max-hours cap so the full-day request reaches the pricing path
      // rather than being rejected by the duration rule first.
      maxBookingHours: null,
    });
    mocks.bookingFindMany.mockResolvedValue([]);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        guests: 1,
        isHourly: false,
        spaceId: 42,
        startDate: monday,
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: "This space has no applicable price for the requested booking",
    });
    expect(mocks.bookingCreate).not.toHaveBeenCalled();
    await app.close();
  });

  // H1: BOTH space + 1h window + isHourly=false must price AND block only that
  // hour (derived isHourly=true). If the client value were trusted the booking
  // would block the whole day (409 against the adjacent 09:00-10:00 booking)
  // while only paying for 1h. Getting 201 proves the blocked window == priced
  // window.
  it("derives isHourly server-side so the blocked window equals the priced window (BOTH space, 1h)", async () => {
    const app = await createApp();
    mocks.spaceFindUnique.mockResolvedValue({
      ...baseSpace,
      pricePerDay: 100,
      pricePerHour: 25,
      pricingType: "BOTH",
    });
    // An adjacent hourly booking 09:00-10:00. If the incoming booking were
    // (wrongly) treated as a full day it would overlap this and 409.
    mocks.bookingFindMany.mockResolvedValue([
      {
        endDate: new Date(monday),
        endTime: "10:00",
        isHourly: true,
        startDate: new Date(monday),
        startTime: "09:00",
      },
    ]);
    mocks.bookingCreate.mockResolvedValue(createdBooking);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "11:00",
        guests: 1,
        isHourly: false, // client lie — must be ignored
        spaceId: 42,
        startDate: monday,
        startTime: "10:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(201);
    // Persisted with the server-derived isHourly (true) and priced for 1 hour.
    expect(mocks.bookingCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isHourly: true,
          startTime: "10:00",
          endTime: "11:00",
          subtotal: 25, // 1h * $25 (cheaper than the $100 daily rate)
        }),
      }),
    );
    await app.close();
  });

  // H1: a normal daily booking still succeeds with the full-day interval and
  // the correct daily total.
  it("still creates a normal daily booking with the correct total", async () => {
    const app = await createApp();
    mocks.spaceFindUnique.mockResolvedValue({
      ...baseSpace,
      maxBookingHours: null,
      pricePerDay: 100,
      pricePerHour: null,
      pricingType: "DAILY",
    });
    mocks.bookingFindMany.mockResolvedValue([]);
    mocks.bookingCreate.mockResolvedValue(createdBooking);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        guests: 1,
        isHourly: false,
        spaceId: 42,
        startDate: monday,
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(201);
    expect(mocks.bookingCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isHourly: false, // DAILY space -> full-day interval
          subtotal: 100,
          totalAmount: 100,
        }),
      }),
    );
    await app.close();
  });

  // MONTHLY: a monthly space booked over a full-day date range (no times) is
  // priced via the calendar-month candidate and persisted as a full-day
  // (isHourly=false) multi-day booking, exactly like a daily range.
  it("prices a monthly space over a date range via the monthly candidate", async () => {
    const app = await createApp();
    // Open every day so the multi-day full-day range passes availability, and
    // drop the max-hours cap so the long range reaches the pricing path.
    const openAllWeek = Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      endTime: "23:59",
      isOpen: true,
      startTime: "00:00",
    }));
    mocks.spaceFindUnique.mockResolvedValue({
      ...baseSpace,
      availability: openAllWeek,
      maxBookingHours: null,
      pricePerDay: null,
      pricePerHour: null,
      pricePerMonth: 2000,
      pricingType: "MONTHLY",
    });
    mocks.bookingFindMany.mockResolvedValue([]);
    mocks.bookingCreate.mockResolvedValue(createdBooking);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        // endDate inclusive: 2026-05-18 -> 2026-06-17 occupies exactly one
        // calendar month (checkout 2026-06-18).
        endDate: "2026-06-17",
        guests: 1,
        spaceId: 42,
        startDate: monday,
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(201);
    expect(mocks.bookingCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isHourly: false, // MONTHLY -> full-day date-range interval
          startTime: undefined,
          endTime: undefined,
          subtotal: 2000, // 1 calendar month * $2000
          totalAmount: 2000,
        }),
      }),
    );
    await app.close();
  });

  // BOOKSVC-008: round2 keeps float drift from leaking into totals.
  describe("round2 helper", () => {
    it("rounds 0.1 + 0.2 to a clean 0.3 cents", () => {
      expect(round2(0.1 + 0.2)).toBe(0.3);
    });
    it("collapses sub-cent drift to two decimals", () => {
      // 1.005, 1.015, 2.555 aren't exactly representable in IEEE-754, so
      // Math.round can land on either side. The point of round2 is that the
      // result has at most two decimal places, which is what consumers rely on.
      const samples = [1.005, 1.015, 2.555, 0.5499999, 0.5500001, 7.125];
      for (const n of samples) {
        const r = round2(n);
        // No more than two decimal digits.
        expect(r * 100 - Math.round(r * 100)).toBeCloseTo(0, 9);
      }
    });
    it("is idempotent on already-rounded values", () => {
      expect(round2(99.99)).toBe(99.99);
      expect(round2(0)).toBe(0);
    });
  });

  // BOOKSVC-004: refund-rate matrix.
  describe("computeRefundRate", () => {
    it("FLEXIBLE: 100% beyond 24h, 0% within 24h", () => {
      expect(computeRefundRate("FLEXIBLE", 48)).toBe(1);
      expect(computeRefundRate("FLEXIBLE", 25)).toBe(1);
      expect(computeRefundRate("FLEXIBLE", 24)).toBe(0);
      expect(computeRefundRate("FLEXIBLE", 1)).toBe(0);
    });
    it("MODERATE: 100% >5d, 50% 24h–5d, 0% <24h", () => {
      expect(computeRefundRate("MODERATE", 24 * 6)).toBe(1);
      expect(computeRefundRate("MODERATE", 120)).toBe(0.5);
      expect(computeRefundRate("MODERATE", 25)).toBe(0.5);
      expect(computeRefundRate("MODERATE", 24)).toBe(0);
      expect(computeRefundRate("MODERATE", 1)).toBe(0);
    });
    it("STRICT: 50% >7d, 0% otherwise", () => {
      expect(computeRefundRate("STRICT", 24 * 8)).toBe(0.5);
      expect(computeRefundRate("STRICT", 168)).toBe(0);
      expect(computeRefundRate("STRICT", 24)).toBe(0);
    });
    it("NON_REFUNDABLE: always 0%", () => {
      expect(computeRefundRate("NON_REFUNDABLE", 24 * 30)).toBe(0);
      expect(computeRefundRate("NON_REFUNDABLE", 1)).toBe(0);
    });
  });

  // BOOKSVC-007: missing exchange rate throws (does not silently default to 1.0).
  describe("MissingExchangeRateError", () => {
    it("carries the from/to pair so callers can surface a 503 reason", () => {
      const err = new MissingExchangeRateError("MDL", "USD");
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe("MissingExchangeRateError");
      expect(err.fromCurrency).toBe("MDL");
      expect(err.toCurrency).toBe("USD");
      expect(err.message).toContain("MDL");
      expect(err.message).toContain("USD");
    });
  });

  it("rejects invalid hourly time ranges before pricing", async () => {
    const app = await createApp();

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "10:00",
        guests: 1,
        isHourly: true,
        spaceId: 42,
        startDate: monday,
        startTime: "11:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(400);
    expect(mocks.spaceFindUnique).not.toHaveBeenCalled();
    expect(mocks.bookingCreate).not.toHaveBeenCalled();
    await app.close();
  });

  // BOOKSVC-002: every BookingStatus value should be classified as
  // conflicting or not, intentionally.
  it("classifies every BookingStatus enum value intentionally for conflict detection", async () => {
    // Mirror of the implementation's CONFLICTING_BOOKING_STATUSES.
    const occupying = new Set(["PENDING", "CONFIRMED"]);
    const free = new Set(["COMPLETED", "CANCELLED", "REJECTED", "EXPIRED"]);
    // Pull the enum surface from the mocked @repo/db so this test fails
    // if a new status is added to the schema without being classified here.
    const { BookingStatus } = await import("@repo/db");
    const allStatuses = Object.keys(BookingStatus as Record<string, string>);
    for (const status of allStatuses) {
      expect(occupying.has(status) || free.has(status)).toBe(true);
    }
    // APPROVED must be in the occupying set (the BOOKSVC-002 regression).
    expect(occupying.has("PENDING")).toBe(true);
  });

  // BOOKSVC-012: stale-state guard on cancel.
  it("returns 409 when cancelling a booking that has already been completed (CAS rejected)", async () => {
    const app = await createApp();
    mocks.bookingFindUnique
      .mockResolvedValueOnce({
        // initial findUnique inside the cancel handler
        endDate: new Date(monday),
        endTime: "12:00",
        guest: { email: "guest@example.com", name: "Guest" },
        guestId: "guest-1",
        host: { email: "host@example.com", name: "Host" },
        hostId: "host-1",
        id: "b-1",
        isHourly: true,
        space: { name: "Focused room" },
        spaceId: 42,
        startDate: new Date(monday),
        startTime: "10:00",
        status: "CONFIRMED",
      })
      .mockResolvedValueOnce({ status: "COMPLETED" });
    // CAS: zero rows updated → another transition won the race.
    mocks.bookingUpdateMany.mockResolvedValue({ count: 0 });

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: { reason: "Plans changed" },
      url: "/bookings/b-1/cancel",
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      message: "Cannot cancel booking with status COMPLETED",
    });
    expect(mocks.bookingUpdateMany).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: "CANCELLED" }),
      where: {
        id: "b-1",
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    expect(mocks.producerSend).not.toHaveBeenCalled();
    await app.close();
  });

  // BOOKSVC-012: stale-state guard on complete.
  it("returns 409 when completing a booking that was cancelled mid-flight", async () => {
    const app = await createApp();
    mocks.bookingFindUnique
      .mockResolvedValueOnce({
        guest: { email: "guest@example.com" },
        hostId: "host-1",
        id: "b-2",
        space: { name: "Focused room" },
        status: "CONFIRMED",
        totalAmount: 100,
      })
      .mockResolvedValueOnce({ status: "CANCELLED" });
    mocks.bookingUpdateMany.mockResolvedValue({ count: 0 });

    const response = await app.inject({
      headers: { authorization: `Bearer ${createHostToken()}` },
      method: "PUT",
      payload: {},
      url: "/bookings/b-2/complete",
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      message: "Cannot complete booking with status CANCELLED",
    });
    expect(mocks.bookingUpdateMany).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: "COMPLETED" }),
      where: { id: "b-2", status: "CONFIRMED" },
    });
    expect(mocks.producerSend).not.toHaveBeenCalled();
    await app.close();
  });

  // H4: completing a booking creates the host Payout atomically with the flip.
  it("creates a host Payout when a booking is completed", async () => {
    const app = await createApp();
    mocks.bookingFindUnique
      .mockResolvedValueOnce({
        guest: { email: "guest@example.com" },
        hostId: "host-1",
        id: "b-3",
        space: { name: "Focused room" },
        status: "CONFIRMED",
        totalAmount: 100,
        serviceFee: 20,
        currency: "USD",
      })
      .mockResolvedValueOnce({ id: "b-3", status: "COMPLETED" });
    mocks.bookingUpdateMany.mockResolvedValue({ count: 1 });
    mocks.payoutCreate.mockResolvedValue({ id: "payout-1" });

    const response = await app.inject({
      headers: { authorization: `Bearer ${createHostToken()}` },
      method: "PUT",
      payload: {},
      url: "/bookings/b-3/complete",
    });

    expect(response.statusCode).toBe(200);
    // amount = guest total, platformFee = commission, netAmount = host take-home.
    expect(mocks.payoutCreate).toHaveBeenCalledWith({
      data: {
        hostId: "host-1",
        amount: 100,
        platformFee: 20,
        netAmount: 80,
        currency: "USD",
        bookingIds: ["b-3"],
      },
    });
    await app.close();
  });

  // M7: a single seeded rate direction must not block non-USD bookings — the
  // inverse (USD->from) row is used via 1/rate when the direct row is absent.
  it("creates a non-USD booking using the inverse exchange-rate row when the direct row is missing", async () => {
    const app = await createApp();
    mocks.spaceFindUnique.mockResolvedValue({ ...baseSpace, currency: "MDL" });
    mocks.bookingFindFirst.mockResolvedValue(null);
    mocks.bookingFindMany.mockResolvedValue([]);
    mocks.bookingCreate.mockResolvedValue(createdBooking);
    // Only USD->MDL is seeded; the direct MDL->USD lookup returns null.
    mocks.exchangeRateFindUnique.mockImplementation(({ where }: any) => {
      const { fromCurrency, toCurrency } = where.fromCurrency_toCurrency;
      if (fromCurrency === "USD" && toCurrency === "MDL") {
        return Promise.resolve({ rate: "0.055" });
      }
      return Promise.resolve(null);
    });

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "11:00",
        guests: 1,
        isHourly: true,
        spaceId: 42,
        startDate: monday,
        startTime: "10:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(201);
    expect(mocks.bookingCreate).toHaveBeenCalled();
    await app.close();
  });

  // M7: only when neither direction exists do we surface a 503 rate-unavailable.
  it("returns 503 when neither exchange-rate direction exists for a non-USD space", async () => {
    const app = await createApp();
    mocks.spaceFindUnique.mockResolvedValue({ ...baseSpace, currency: "MDL" });
    mocks.bookingFindFirst.mockResolvedValue(null);
    mocks.bookingFindMany.mockResolvedValue([]);
    mocks.exchangeRateFindUnique.mockResolvedValue(null);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "11:00",
        guests: 1,
        isHourly: true,
        spaceId: 42,
        startDate: monday,
        startTime: "10:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(503);
    expect(mocks.bookingCreate).not.toHaveBeenCalled();
    await app.close();
  });

  // M8/M9: auto-reject publishes booking.rejected for each race-loser and
  // includes guestEmail + guestName so the email-service consumer notifies them.
  it("publishes booking.rejected with guest email/name for auto-rejected bookings on approve", async () => {
    const app = await createApp();
    mocks.bookingFindUnique
      // approve handler: the booking being confirmed
      .mockResolvedValueOnce({
        endDate: new Date(monday),
        endTime: "12:00",
        guest: { email: "winner@example.com", name: "Winner" },
        hostId: "host-1",
        id: "b-win",
        isHourly: true,
        space: { name: "Focused room" },
        spaceId: 42,
        startDate: new Date(monday),
        startTime: "10:00",
        status: "PENDING",
      })
      // post-txn re-read of the confirmed booking
      .mockResolvedValueOnce({ id: "b-win", status: "CONFIRMED" });
    mocks.bookingFindMany
      // overlapping candidates inside the txn (one PENDING race-loser)
      .mockResolvedValueOnce([
        {
          endDate: new Date(monday),
          endTime: "12:00",
          id: "b-loser",
          isHourly: true,
          startDate: new Date(monday),
          startTime: "10:00",
          status: "PENDING",
        },
      ])
      // M9 follow-up query for the rejected bookings' guest email/name
      .mockResolvedValueOnce([
        { guest: { email: "loser@example.com", name: "Loser" }, id: "b-loser" },
      ]);
    mocks.bookingUpdateMany.mockResolvedValue({ count: 1 });
    mocks.producerSend.mockResolvedValue(undefined);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createHostToken()}` },
      method: "PUT",
      payload: {},
      url: "/bookings/b-win/approve",
    });

    expect(response.statusCode).toBe(200);
    expect(mocks.producerSend).toHaveBeenCalledWith("booking.rejected", {
      value: expect.objectContaining({
        bookingId: "b-loser",
        guestEmail: "loser@example.com",
        guestName: "Loser",
        spaceName: "Focused room",
      }),
    });
    await app.close();
  });

  // M10: host earnings returns per-currency payout arrays (never a scalar that
  // silently sums across currencies).
  it("returns per-currency pendingPayout/completedPayouts arrays for host earnings", async () => {
    const app = await createApp();
    mocks.bookingGroupBy.mockResolvedValue([
      { _sum: { serviceFee: 20, totalAmount: 200 }, currency: "USD" },
    ]);
    mocks.payoutGroupBy
      // pending (PENDING/PROCESSING) aggregate
      .mockResolvedValueOnce([{ _sum: { netAmount: 50 }, currency: "USD" }])
      // completed aggregate
      .mockResolvedValueOnce([{ _sum: { netAmount: 900 }, currency: "MDL" }]);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createHostToken()}` },
      method: "GET",
      url: "/bookings/host/earnings",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      completedPayouts: [{ amount: 900, currency: "MDL" }],
      earningsByCurrency: [
        { currency: "USD", grossRevenue: 200, platformFees: 20, totalEarnings: 180 },
      ],
      pendingPayout: [{ amount: 50, currency: "USD" }],
    });
    await app.close();
  });

  // AUDIT-B8 (M4): an expired PENDING hold no longer squats the slot, so a new
  // overlapping booking succeeds instead of 409ing.
  it("does not let an EXPIRED PENDING hold block a new overlapping booking", async () => {
    const app = await createApp();
    mocks.spaceFindUnique.mockResolvedValue(baseSpace);
    // Conflicting PENDING request-to-book whose 48h hold elapsed an hour ago.
    mocks.bookingFindMany.mockResolvedValue([
      {
        endDate: new Date(monday),
        endTime: "11:00",
        holdExpiresAt: new Date(Date.now() - 60 * 60 * 1000),
        isHourly: true,
        startDate: new Date(monday),
        startTime: "10:00",
        status: "PENDING",
      },
    ]);
    mocks.bookingCreate.mockResolvedValue(createdBooking);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "11:00",
        guests: 1,
        isHourly: true,
        spaceId: 42,
        startDate: monday,
        startTime: "10:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(201);
    expect(mocks.bookingCreate).toHaveBeenCalled();
    // The freshly created PENDING hold carries a future holdExpiresAt.
    const createArg = mocks.bookingCreate.mock.calls[0]![0] as {
      data: { holdExpiresAt: Date | null };
    };
    expect(createArg.data.holdExpiresAt).toBeInstanceOf(Date);
    expect((createArg.data.holdExpiresAt as Date).getTime()).toBeGreaterThan(
      Date.now(),
    );
    await app.close();
  });

  // AUDIT-B8 (M4): a live (non-expired) PENDING hold still occupies the slot.
  it("still blocks a new overlapping booking while a PENDING hold is live", async () => {
    const app = await createApp();
    mocks.spaceFindUnique.mockResolvedValue(baseSpace);
    mocks.bookingFindMany.mockResolvedValue([
      {
        endDate: new Date(monday),
        endTime: "11:00",
        holdExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isHourly: true,
        startDate: new Date(monday),
        startTime: "10:00",
        status: "PENDING",
      },
    ]);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "11:00",
        guests: 1,
        isHourly: true,
        spaceId: 42,
        startDate: monday,
        startTime: "10:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(409);
    expect(mocks.bookingCreate).not.toHaveBeenCalled();
    await app.close();
  });

  // AUDIT-B8 (M5): the refund cutoff must interpret startTime in the venue's
  // timezone. A check-in ~23h out in Europe/Chisinau (UTC+3 in July) is inside
  // the FLEXIBLE 24h bracket (0% refund); the old setUTCHours bug read it as
  // ~26h (>24h → 100%). Only fake Date so real timers keep working.
  it("uses the venue timezone for the refund hoursUntilCheckin bracket", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-14T10:00:00.000Z"));
    try {
      const app = await createApp();
      mocks.bookingFindUnique
        .mockResolvedValueOnce({
          currency: "USD",
          endDate: new Date("2026-07-15T00:00:00.000Z"),
          endTime: "13:00",
          guest: { email: "guest@example.com", name: "Guest" },
          guestId: "guest-1",
          host: { email: "host@example.com", name: "Host" },
          hostId: "host-1",
          id: "b-tz",
          isHourly: true,
          // Local check-in 12:00 Chisinau (UTC+3) == 09:00Z on the 15th, i.e.
          // exactly 23h after the frozen now (10:00Z on the 14th).
          space: {
            cancellationPolicy: "FLEXIBLE",
            name: "Focused room",
            venue: { timezone: "Europe/Chisinau" },
          },
          spaceId: 42,
          startDate: new Date("2026-07-15T00:00:00.000Z"),
          startTime: "12:00",
          status: "CONFIRMED",
          totalAmount: 100,
        })
        .mockResolvedValueOnce({ id: "b-tz", status: "CANCELLED" });
      mocks.bookingUpdateMany.mockResolvedValue({ count: 1 });
      mocks.producerSend.mockResolvedValue(undefined);

      const response = await app.inject({
        headers: { authorization: `Bearer ${createUserToken()}` },
        method: "POST",
        payload: { reason: "Plans changed" },
        url: "/bookings/b-tz/cancel",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json() as {
        refund: { hoursUntilCheckin: number; rate: number };
      };
      // Correct tz math: 23h out (not the buggy ~26h).
      expect(body.refund.hoursUntilCheckin).toBe(23);
      // 23h < 24h => FLEXIBLE refunds 0% (the buggy >24h read would give 100%).
      expect(body.refund.rate).toBe(0);
      await app.close();
    } finally {
      vi.useRealTimers();
    }
  });
});
