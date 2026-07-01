// AUDIT-B8/M1: per-user access-token kill switch (express guard).
// The guard must reject any access token whose `iat` predates the user's
// `tokensValidAfter` watermark, and allow a token minted after it.
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

vi.mock("@repo/db", () => ({
  prisma: { user: { findFirst: vi.fn() } },
}));

// Mock token extraction/verification so we can drive `iat` directly without
// standing up JWT secrets. isAccessTokenRevoked is left real — with no checker
// installed it returns false, exercising the code path under test.
vi.mock("./jwt.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./jwt.js")>();
  return {
    ...actual,
    extractAccessToken: vi.fn(() => "dummy-token"),
    verifyAccessToken: vi.fn(),
  };
});

import { prisma } from "@repo/db";
import { verifyAccessToken } from "./jwt.js";
import { shouldBeUser } from "./express.js";
import { _clearUserCacheForTests } from "./userCache.js";

// Seconds → the JWT `iat` unit.
const IAT_OLD = 1_000; // 1_000_000 ms
const IAT_NEW = 3_000; // 3_000_000 ms
const WATERMARK = new Date(2_000_000); // between the two, in ms

function mockPayload(iat: number) {
  return {
    ok: true as const,
    payload: {
      userId: "u1",
      email: "u1@example.com",
      role: "USER" as const,
      tokenUse: "access" as const,
      iat,
      jti: "jti-1",
    },
  };
}

function mockReq(): Request {
  return { headers: {} } as unknown as Request;
}

function mockRes(): Response {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe("shouldBeUser kill switch (express)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _clearUserCacheForTests();
  });

  it("rejects a token whose iat predates tokensValidAfter", async () => {
    (verifyAccessToken as any).mockReturnValue(mockPayload(IAT_OLD));
    (prisma.user.findFirst as any).mockResolvedValue({
      id: "u1",
      role: "USER",
      tokensValidAfter: WATERMARK,
    });

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    await shouldBeUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token revoked" });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows a token minted after tokensValidAfter", async () => {
    (verifyAccessToken as any).mockReturnValue(mockPayload(IAT_NEW));
    (prisma.user.findFirst as any).mockResolvedValue({
      id: "u1",
      role: "USER",
      tokensValidAfter: WATERMARK,
    });

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    await shouldBeUser(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalledWith(401);
    expect(req.userId).toBe("u1");
  });

  it("allows any token when tokensValidAfter is null (no watermark set)", async () => {
    (verifyAccessToken as any).mockReturnValue(mockPayload(IAT_OLD));
    (prisma.user.findFirst as any).mockResolvedValue({
      id: "u1",
      role: "USER",
      tokensValidAfter: null,
    });

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    await shouldBeUser(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalledWith(401);
  });
});
