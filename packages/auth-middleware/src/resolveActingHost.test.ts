import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

vi.mock("@repo/db", () => {
  return {
    prisma: {
      user: {
        findFirst: vi.fn(),
      },
    },
  };
});

import { prisma } from "@repo/db";
import { resolveActingHost } from "./express.js";
import { _clearUserCacheForTests } from "./userCache.js";

function mockReq(opts: {
  role?: "USER" | "HOST" | "ADMIN";
  userId?: string;
  header?: string;
  method?: string;
  path?: string;
}): Request {
  const headers: Record<string, string> = {};
  if (opts.header) headers["x-acting-host-id"] = opts.header;
  return {
    user: opts.role ? { id: opts.userId || "admin-1", role: opts.role } : undefined,
    userId: opts.userId || (opts.role ? "admin-1" : undefined),
    header: (name: string) => headers[name.toLowerCase()],
    headers,
    method: opts.method || "GET",
    path: opts.path || "/x",
  } as unknown as Request;
}

function mockRes(): Response {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe("resolveActingHost (express)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _clearUserCacheForTests();
  });

  it("no-ops when header is absent", async () => {
    const req = mockReq({ role: "ADMIN" });
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    await resolveActingHost(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.actingHostId).toBeUndefined();
    expect(req.userId).toBe("admin-1");
  });

  it("no-ops (header ignored) when caller is not admin", async () => {
    const req = mockReq({ role: "HOST", userId: "host-1", header: "host-other" });
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    await resolveActingHost(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.actingHostId).toBeUndefined();
    expect(req.userId).toBe("host-1");
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it("rewrites userId for admin with a valid HOST target", async () => {
    (prisma.user.findFirst as any).mockResolvedValue({ id: "host-2", role: "HOST" });
    const req = mockReq({ role: "ADMIN", header: "host-2" });
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    await resolveActingHost(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.realUserId).toBe("admin-1");
    expect(req.actingHostId).toBe("host-2");
    expect(req.userId).toBe("host-2");
  });

  it("400s when admin targets an unknown id", async () => {
    (prisma.user.findFirst as any).mockResolvedValue(null);
    const req = mockReq({ role: "ADMIN", header: "ghost" });
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    await resolveActingHost(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("400s when admin targets a USER role", async () => {
    (prisma.user.findFirst as any).mockResolvedValue({ id: "u", role: "USER" });
    const req = mockReq({ role: "ADMIN", header: "u" });
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    await resolveActingHost(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("400s when target is soft-deleted", async () => {
    // The deletedAt filter is applied inside the cache lookup itself, so a
    // soft-deleted user surfaces as `null` from `lookupActiveUser`.
    (prisma.user.findFirst as any).mockResolvedValue(null);
    const req = mockReq({ role: "ADMIN", header: "h" });
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    await resolveActingHost(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
