import Fastify from "fastify";
import { signAccessToken } from "@repo/auth-middleware/jwt";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { paymentRoute } from "./payment.route.js";

const mocks = vi.hoisted(() => {
  const paymentCount = vi.fn();
  const paymentFindMany = vi.fn();
  const userFindFirst = vi.fn(({ where }: { where: { id: string } }) =>
    Promise.resolve({ id: where.id, role: "ADMIN" }),
  );

  const prisma = {
    payment: {
      count: paymentCount,
      findMany: paymentFindMany,
    },
    user: {
      findFirst: userFindFirst,
    },
  };

  return {
    paymentCount,
    paymentFindMany,
    prisma,
    userFindFirst,
  };
});

vi.mock("@repo/db", () => ({
  prisma: mocks.prisma,
}));

const createApp = async () => {
  const app = Fastify();
  await app.register(paymentRoute);
  await app.ready();
  return app;
};

const createAdminToken = () =>
  signAccessToken({
    email: "admin@example.com",
    role: "ADMIN",
    userId: "admin-1",
  });

describe("payment route", () => {
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

  it("lists payments for admins with status filters and pagination", async () => {
    const app = await createApp();
    const payment = {
      amountMinor: 12345,
      booking: {
        guest: { email: "guest@example.com", id: "guest-1", name: "Guest" },
        id: "booking-1",
        space: { id: 42, name: "Studio" },
        status: "CONFIRMED",
      },
      bookingId: "booking-1",
      currency: "EUR",
      dispute: null,
      guestId: "guest-1",
      id: "payment-1",
      refundedMinor: 0,
      status: "AUTHORIZED",
    };
    mocks.paymentFindMany.mockResolvedValue([payment]);
    mocks.paymentCount.mockResolvedValue(1);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createAdminToken()}` },
      method: "GET",
      url: "/payments?status=AUTHORIZED&page=2&limit=10",
    });

    expect(response.statusCode).toBe(200);
    expect(mocks.paymentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
        skip: 10,
        take: 10,
        where: { status: "AUTHORIZED" },
      }),
    );
    expect(response.json()).toEqual({
      pagination: { limit: 10, page: 2, total: 1, totalPages: 1 },
      payments: [expect.objectContaining({ id: "payment-1" })],
    });
    await app.close();
  });
});
