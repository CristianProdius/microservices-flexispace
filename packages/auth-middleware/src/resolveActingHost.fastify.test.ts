import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyRequest, FastifyReply } from "fastify";

vi.mock("@repo/db", () => ({
  prisma: { user: { findFirst: vi.fn() } },
}));

import { prisma } from "@repo/db";
import { resolveActingHost } from "./fastify.js";
import { _clearUserCacheForTests } from "./userCache.js";

function mockReq(opts: { role?: "USER"|"HOST"|"ADMIN"; userId?: string; header?: string; method?: string; path?: string }): FastifyRequest {
  const headers: Record<string, string> = {};
  if (opts.header) headers["x-acting-host-id"] = opts.header;
  return {
    user: opts.role ? { id: opts.userId || "admin-1", role: opts.role } : undefined,
    userId: opts.userId || (opts.role ? "admin-1" : undefined),
    headers,
    method: opts.method || "GET",
    url: opts.path || "/x",
  } as unknown as FastifyRequest;
}

function mockReply(): FastifyReply {
  const reply: any = {};
  reply.status = vi.fn().mockReturnValue(reply);
  reply.code = vi.fn().mockReturnValue(reply);
  reply.send = vi.fn().mockReturnValue(reply);
  return reply as FastifyReply;
}

describe("resolveActingHost (fastify)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _clearUserCacheForTests();
  });

  it("no-ops when header absent", async () => {
    const req = mockReq({ role: "ADMIN" });
    const reply = mockReply();
    await resolveActingHost(req, reply);
    expect((req as any).actingHostId).toBeUndefined();
    expect(reply.send).not.toHaveBeenCalled();
  });

  it("rewrites userId for admin with valid HOST target", async () => {
    (prisma.user.findFirst as any).mockResolvedValue({ id: "h2", role: "HOST" });
    const req = mockReq({ role: "ADMIN", header: "h2" });
    const reply = mockReply();
    await resolveActingHost(req, reply);
    expect((req as any).userId).toBe("h2");
    expect((req as any).actingHostId).toBe("h2");
    expect((req as any).realUserId).toBe("admin-1");
  });

  it("400s on unknown id", async () => {
    (prisma.user.findFirst as any).mockResolvedValue(null);
    const req = mockReq({ role: "ADMIN", header: "x" });
    const reply = mockReply();
    await resolveActingHost(req, reply);
    expect(reply.code).toHaveBeenCalledWith(400);
  });

  it("400s on USER role target", async () => {
    (prisma.user.findFirst as any).mockResolvedValue({ id: "u", role: "USER" });
    const req = mockReq({ role: "ADMIN", header: "u" });
    const reply = mockReply();
    await resolveActingHost(req, reply);
    expect(reply.code).toHaveBeenCalledWith(400);
  });

  it("400s on soft-deleted target", async () => {
    // findFirst applies the deletedAt: null filter, so a soft-deleted user
    // surfaces as `null` from the cache.
    (prisma.user.findFirst as any).mockResolvedValue(null);
    const req = mockReq({ role: "ADMIN", header: "d" });
    const reply = mockReply();
    await resolveActingHost(req, reply);
    expect(reply.code).toHaveBeenCalledWith(400);
  });

  it("ignores header for non-admin", async () => {
    const req = mockReq({ role: "HOST", userId: "host-1", header: "host-2" });
    const reply = mockReply();
    await resolveActingHost(req, reply);
    expect((req as any).userId).toBe("host-1");
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });
});
