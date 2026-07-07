import Fastify from "fastify";
import { signAccessToken } from "@repo/auth-middleware/jwt";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { connectRoute } from "./connect.route.js";

const mocks = vi.hoisted(() => {
  const paymentAuditLogCreate = vi.fn();
  const stripeAccountLinksCreate = vi.fn();
  const stripeAccountsCreate = vi.fn();
  const stripeConnectAccountCreate = vi.fn();
  const stripeConnectAccountFindUnique = vi.fn();
  const userFindFirst = vi.fn(({ where }: { where: { id: string } }) =>
    Promise.resolve({ id: where.id, role: "HOST" }),
  );
  const userFindUniqueOrThrow = vi.fn();

  const prisma = {
    paymentAuditLog: {
      create: paymentAuditLogCreate,
    },
    stripeConnectAccount: {
      create: stripeConnectAccountCreate,
      findUnique: stripeConnectAccountFindUnique,
    },
    user: {
      findFirst: userFindFirst,
      findUniqueOrThrow: userFindUniqueOrThrow,
    },
  };

  return {
    paymentAuditLogCreate,
    prisma,
    stripeAccountLinksCreate,
    stripeAccountsCreate,
    stripeConnectAccountCreate,
    stripeConnectAccountFindUnique,
    userFindFirst,
    userFindUniqueOrThrow,
  };
});

vi.mock("@repo/db", () => ({
  prisma: mocks.prisma,
}));

vi.mock("../utils/stripe.js", () => ({
  getStripe: () => ({
    accountLinks: {
      create: mocks.stripeAccountLinksCreate,
    },
    accounts: {
      create: mocks.stripeAccountsCreate,
    },
  }),
}));

const createApp = async () => {
  const app = Fastify();
  await app.register(connectRoute);
  await app.ready();
  return app;
};

const createHostToken = () =>
  signAccessToken({
    email: "host@example.com",
    hostVerified: true,
    role: "HOST",
    userId: "host-1",
  });

const createUserToken = () =>
  signAccessToken({
    email: "guest@example.com",
    role: "USER",
    userId: "guest-1",
  });

const connectRow = {
  detailsSubmitted: false,
  payoutsEnabled: false,
  requirementsDue: [],
  status: "ONBOARDING",
  stripeAccountId: "acct_1",
  userId: "host-1",
};

describe("connect route", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  beforeEach(async () => {
    vi.stubEnv("CONNECT_REFRESH_URL", "https://admin.spacefly.test/refresh");
    vi.stubEnv("CONNECT_RETURN_URL", "https://admin.spacefly.test/return");
    mocks.userFindFirst.mockImplementation(({ where }: any) =>
      Promise.resolve({ id: where?.id ?? "host-1", role: "HOST" }),
    );
    const { _clearUserCacheForTests } = await import("@repo/auth-middleware");
    _clearUserCacheForTests();
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  it("creates a Stripe Express account once and returns the existing row on retry", async () => {
    const app = await createApp();
    mocks.stripeConnectAccountFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(connectRow);
    mocks.userFindUniqueOrThrow.mockResolvedValue({ email: "host@example.com" });
    mocks.stripeAccountsCreate.mockResolvedValue({ id: "acct_1" });
    mocks.stripeConnectAccountCreate.mockResolvedValue(connectRow);
    mocks.paymentAuditLogCreate.mockResolvedValue({ id: "audit-1" });

    const first = await app.inject({
      headers: { authorization: `Bearer ${createHostToken()}` },
      method: "POST",
      payload: { country: "ro" },
      url: "/connect/account",
    });
    const second = await app.inject({
      headers: { authorization: `Bearer ${createHostToken()}` },
      method: "POST",
      payload: { country: "ro" },
      url: "/connect/account",
    });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(200);
    expect(mocks.stripeAccountsCreate).toHaveBeenCalledTimes(1);
    expect(mocks.stripeAccountsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        capabilities: { transfers: { requested: true } },
        country: "RO",
        email: "host@example.com",
        metadata: { spaceflyUserId: "host-1" },
        type: "express",
      }),
    );
    expect(mocks.paymentAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "connect.account_created",
        actorId: "host-1",
        actorType: "HOST",
        stripeObjectId: "acct_1",
      }),
    });
    expect(second.json()).toEqual({
      payoutsEnabled: false,
      status: "ONBOARDING",
      stripeAccountId: "acct_1",
    });
    await app.close();
  });

  it("creates an onboarding account link for an existing account", async () => {
    const app = await createApp();
    mocks.stripeConnectAccountFindUnique.mockResolvedValue(connectRow);
    mocks.stripeAccountLinksCreate.mockResolvedValue({
      expires_at: 1779098400,
      url: "https://connect.stripe.test/onboard",
    });

    const response = await app.inject({
      headers: { authorization: `Bearer ${createHostToken()}` },
      method: "POST",
      payload: {},
      url: "/connect/account-link",
    });

    expect(response.statusCode).toBe(201);
    expect(mocks.stripeAccountLinksCreate).toHaveBeenCalledWith({
      account: "acct_1",
      refresh_url: "https://admin.spacefly.test/refresh",
      return_url: "https://admin.spacefly.test/return",
      type: "account_onboarding",
    });
    expect(response.json()).toEqual({
      expiresAt: 1779098400,
      url: "https://connect.stripe.test/onboard",
    });
    await app.close();
  });

  it("reads Connect status from the reconciled account row", async () => {
    const app = await createApp();
    mocks.stripeConnectAccountFindUnique.mockResolvedValue({
      ...connectRow,
      detailsSubmitted: true,
      payoutsEnabled: true,
      requirementsDue: ["external_account"],
      status: "ACTIVE",
    });

    const response = await app.inject({
      headers: { authorization: `Bearer ${createHostToken()}` },
      method: "GET",
      url: "/connect/status",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      detailsSubmitted: true,
      exists: true,
      payoutsEnabled: true,
      requirementsDue: ["external_account"],
      status: "ACTIVE",
    });
    await app.close();
  });

  it("blocks non-host callers", async () => {
    const app = await createApp();
    mocks.userFindFirst.mockResolvedValue({ id: "guest-1", role: "USER" });
    const { _clearUserCacheForTests } = await import("@repo/auth-middleware");
    _clearUserCacheForTests();

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: { country: "RO" },
      url: "/connect/account",
    });

    expect(response.statusCode).toBe(403);
    expect(mocks.stripeAccountsCreate).not.toHaveBeenCalled();
    await app.close();
  });
});
