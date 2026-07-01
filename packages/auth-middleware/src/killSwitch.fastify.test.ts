// AUDIT-B8/M1: per-user access-token kill switch (fastify guard).
// Mirror of killSwitch.test.ts for the fastify variant of the guard.
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyRequest, FastifyReply } from "fastify";

vi.mock("@repo/db", () => ({
  prisma: { user: { findFirst: vi.fn() } },
}));

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
import { shouldBeUser } from "./fastify.js";
import { _clearUserCacheForTests } from "./userCache.js";

const IAT_OLD = 1_000; // 1_000_000 ms
const IAT_NEW = 3_000; // 3_000_000 ms
const WATERMARK = new Date(2_000_000);

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

function mockReq(): FastifyRequest {
  return { headers: {} } as unknown as FastifyRequest;
}

function mockReply(): FastifyReply {
  const reply: any = {};
  reply.status = vi.fn().mockReturnValue(reply);
  reply.code = vi.fn().mockReturnValue(reply);
  reply.send = vi.fn().mockReturnValue(reply);
  return reply as FastifyReply;
}

describe("shouldBeUser kill switch (fastify)", () => {
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
    const reply = mockReply();
    await shouldBeUser(req, reply);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({ message: "Token revoked" });
    expect((req as any).userId).toBeUndefined();
  });

  it("allows a token minted after tokensValidAfter", async () => {
    (verifyAccessToken as any).mockReturnValue(mockPayload(IAT_NEW));
    (prisma.user.findFirst as any).mockResolvedValue({
      id: "u1",
      role: "USER",
      tokensValidAfter: WATERMARK,
    });

    const req = mockReq();
    const reply = mockReply();
    await shouldBeUser(req, reply);

    expect(reply.send).not.toHaveBeenCalled();
    expect((req as any).userId).toBe("u1");
  });

  it("allows any token when tokensValidAfter is null (no watermark set)", async () => {
    (verifyAccessToken as any).mockReturnValue(mockPayload(IAT_OLD));
    (prisma.user.findFirst as any).mockResolvedValue({
      id: "u1",
      role: "USER",
      tokensValidAfter: null,
    });

    const req = mockReq();
    const reply = mockReply();
    await shouldBeUser(req, reply);

    expect(reply.send).not.toHaveBeenCalled();
    expect((req as any).userId).toBe("u1");
  });
});
