import Fastify from "fastify";
import { signAccessToken } from "@repo/auth-middleware/jwt";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { payoutRoute } from "./payout.route.js";

const mocks = vi.hoisted(() => {
  const paymentAuditLogCreate = vi.fn();
  const payoutCount = vi.fn();
  const payoutFindMany = vi.fn();
  const payoutFindUniqueOrThrow = vi.fn();
  const payoutUpdate = vi.fn();
  const payoutUpdateMany = vi.fn();
  const stripeTransfersCreate = vi.fn();
  const userFindFirst = vi.fn(({ where }: { where: { id: string } }) =>
    Promise.resolve({ id: where.id, role: "ADMIN" }),
  );

  const prisma = {
    $transaction: vi.fn((input: unknown) => {
      if (typeof input === "function") return input(prisma);
      return Promise.all(input as Promise<unknown>[]);
    }),
    paymentAuditLog: {
      create: paymentAuditLogCreate,
    },
    payout: {
      count: payoutCount,
      findMany: payoutFindMany,
      findUniqueOrThrow: payoutFindUniqueOrThrow,
      update: payoutUpdate,
      updateMany: payoutUpdateMany,
    },
    user: {
      findFirst: userFindFirst,
    },
  };

  return {
    paymentAuditLogCreate,
    payoutCount,
    payoutFindMany,
    payoutFindUniqueOrThrow,
    payoutUpdate,
    payoutUpdateMany,
    prisma,
    stripeTransfersCreate,
    userFindFirst,
  };
});

vi.mock("@repo/db", () => ({
  prisma: mocks.prisma,
}));

vi.mock("../utils/stripe.js", () => ({
  getStripe: () => ({
    transfers: {
      create: mocks.stripeTransfersCreate,
    },
  }),
}));

const createApp = async () => {
  const app = Fastify();
  await app.register(payoutRoute);
  await app.ready();
  return app;
};

const createAdminToken = () =>
  signAccessToken({
    email: "admin@example.com",
    role: "ADMIN",
    userId: "admin-1",
  });

const createHostToken = () =>
  signAccessToken({
    email: "host@example.com",
    hostVerified: true,
    role: "HOST",
    userId: "host-1",
  });

const activePayout = {
  bookingIds: ["booking-1"],
  currency: "EUR",
  host: {
    connectAccount: {
      status: "ACTIVE",
      stripeAccountId: "acct_1",
    },
  },
  hostId: "host-1",
  id: "payout-1",
  idempotencyKey: null,
  netAmountMinor: 8000,
  status: "PENDING",
};

describe("payout route", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  beforeEach(async () => {
    mocks.userFindFirst.mockImplementation(({ where }: any) =>
      Promise.resolve({ id: where?.id ?? "admin-1", role: "ADMIN" }),
    );
    const { _clearUserCacheForTests } = await import("@repo/auth-middleware");
    _clearUserCacheForTests();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("processes a payout exactly once under concurrent process calls", async () => {
    const app = await createApp();
    mocks.payoutFindUniqueOrThrow.mockResolvedValue(activePayout);
    mocks.payoutUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    mocks.stripeTransfersCreate.mockResolvedValue({ id: "tr_1" });
    mocks.payoutUpdate.mockImplementation(({ data }: any) =>
      Promise.resolve({ ...activePayout, ...data }),
    );
    mocks.paymentAuditLogCreate.mockResolvedValue({ id: "audit-1" });

    const [first, second] = await Promise.all([
      app.inject({
        headers: { authorization: `Bearer ${createAdminToken()}` },
        method: "POST",
        payload: {},
        url: "/payouts/payout-1/process",
      }),
      app.inject({
        headers: { authorization: `Bearer ${createAdminToken()}` },
        method: "POST",
        payload: {},
        url: "/payouts/payout-1/process",
      }),
    ]);

    const okResponses = [first, second].filter((response) => response.statusCode === 200);
    expect(okResponses).toHaveLength(1);
    expect(mocks.stripeTransfersCreate).toHaveBeenCalledTimes(1);
    expect(mocks.stripeTransfersCreate).toHaveBeenCalledWith(
      {
        amount: 8000,
        currency: "eur",
        destination: "acct_1",
        metadata: { payoutId: "payout-1" },
        transfer_group: "booking:booking-1",
      },
      { idempotencyKey: "transfer:payout-1" },
    );
    expect(okResponses[0]!.json()).toEqual(
      expect.objectContaining({
        id: "payout-1",
        idempotencyKey: "transfer:payout-1",
        status: "COMPLETED",
        stripeTransferId: "tr_1",
      }),
    );
    await app.close();
  });

  it("rejects processing when the host Connect account is not active", async () => {
    const app = await createApp();
    mocks.payoutFindUniqueOrThrow.mockResolvedValue({
      ...activePayout,
      host: { connectAccount: { status: "PENDING_VERIFICATION" } },
    });

    const response = await app.inject({
      headers: { authorization: `Bearer ${createAdminToken()}` },
      method: "POST",
      payload: {},
      url: "/payouts/payout-1/process",
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ code: "CONNECT_NOT_READY" });
    expect(mocks.stripeTransfersCreate).not.toHaveBeenCalled();
    await app.close();
  });

  it("rejects processing a legacy payout without netAmountMinor", async () => {
    const app = await createApp();
    mocks.payoutFindUniqueOrThrow.mockResolvedValue({
      ...activePayout,
      netAmountMinor: null,
    });

    const response = await app.inject({
      headers: { authorization: `Bearer ${createAdminToken()}` },
      method: "POST",
      payload: {},
      url: "/payouts/payout-1/process",
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ code: "LEGACY_PAYOUT_NO_MINOR_AMOUNT" });
    expect(mocks.stripeTransfersCreate).not.toHaveBeenCalled();
    await app.close();
  });

  it("lists payouts for admins with filters and pagination", async () => {
    const app = await createApp();
    mocks.payoutFindMany.mockResolvedValue([activePayout]);
    mocks.payoutCount.mockResolvedValue(1);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createAdminToken()}` },
      method: "GET",
      url: "/payouts?status=PENDING&hostId=host-1&page=1&limit=20",
    });

    expect(response.statusCode).toBe(200);
    expect(mocks.payoutFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PENDING", hostId: "host-1" },
      }),
    );
    expect(response.json()).toEqual({
      pagination: { limit: 20, page: 1, total: 1, totalPages: 1 },
      payouts: [expect.objectContaining({ id: "payout-1" })],
    });
    await app.close();
  });

  it("lists payouts for the authenticated host", async () => {
    const app = await createApp();
    mocks.userFindFirst.mockImplementation(({ where }: any) =>
      Promise.resolve({ id: where?.id ?? "host-1", role: "HOST" }),
    );
    const { _clearUserCacheForTests } = await import("@repo/auth-middleware");
    _clearUserCacheForTests();
    mocks.payoutFindMany.mockResolvedValue([activePayout]);
    mocks.payoutCount.mockResolvedValue(1);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createHostToken()}` },
      method: "GET",
      url: "/payouts/host?page=1&limit=20",
    });

    expect(response.statusCode).toBe(200);
    expect(mocks.payoutFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hostId: "host-1" },
      }),
    );
    await app.close();
  });
});
