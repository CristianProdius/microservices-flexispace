# Admin Host Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin "act as" any host from inside `apps/admin`, with a sidebar host-picker + server-side impersonation via an `X-Acting-Host-Id` header. Also lets admin create new lead host accounts from the dashboard.

**Architecture:** A new `resolveActingHost` middleware (Express and Fastify variants) sits immediately after `shouldBeHost*` on every host-scoped route. When the requester is ADMIN and supplies a valid `X-Acting-Host-Id`, the middleware rewrites `req.userId` (or `request.userId` in Fastify) to the target host. Controllers stay unchanged. Client side, a Zustand-backed `actingHostId` plus a thin `apiFetch` wrapper attach the header on every host fetch.

**Tech Stack:** TypeScript / Express 5 (product-service, auth-service) / Fastify 5 (order-service) / Next.js 15 + Zustand (admin app) / Prisma / Vitest.

**Reference spec:** `docs/superpowers/specs/2026-06-06-admin-host-switcher-design.md`.

---

## Phase 1 — Server middleware

### Task 1: `resolveActingHost` middleware (Express)

**Files:**
- Modify: `packages/auth-middleware/src/express.ts`
- Modify: `packages/auth-middleware/src/types.ts` (extend `Request` typing)
- Modify: `packages/auth-middleware/src/index.ts` (re-export)
- Create: `packages/auth-middleware/src/resolveActingHost.test.ts`

- [ ] **Step 1: Add a vitest dev-dep and script if missing**

```bash
cat packages/auth-middleware/package.json | grep -E "vitest|\"test\"" || echo "no vitest"
```

If missing, add `"vitest": "^3.2.4"` to `devDependencies` and `"test": "vitest run"` to `scripts`, then `pnpm install` at repo root.

- [ ] **Step 2: Extend Express Request typing**

Open `packages/auth-middleware/src/types.ts`. Add to the existing module augmentation:

```ts
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        role: "USER" | "HOST" | "ADMIN";
        hostVerified?: boolean;
      };
      // Set by resolveActingHost when an admin successfully impersonates.
      actingHostId?: string;
      realUserId?: string;
    }
  }
}
```

If `types.ts` already declares `userId` / `user`, only add the two new fields.

- [ ] **Step 3: Write the failing tests**

Create `packages/auth-middleware/src/resolveActingHost.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

vi.mock("@repo/db", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
      },
    },
  };
});

import { prisma } from "@repo/db";
import { resolveActingHost } from "./express.js";

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
  beforeEach(() => vi.clearAllMocks());

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
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("rewrites userId for admin with a valid HOST target", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "host-2", role: "HOST", deletedAt: null });
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
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const req = mockReq({ role: "ADMIN", header: "ghost" });
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    await resolveActingHost(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("400s when admin targets a USER role", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u", role: "USER", deletedAt: null });
    const req = mockReq({ role: "ADMIN", header: "u" });
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    await resolveActingHost(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("400s when target is soft-deleted", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "h", role: "HOST", deletedAt: new Date() });
    const req = mockReq({ role: "ADMIN", header: "h" });
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    await resolveActingHost(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run the tests to confirm they fail**

```bash
cd packages/auth-middleware && pnpm test -- resolveActingHost
```

Expected: FAIL because `resolveActingHost` is not yet exported from `./express.js`.

- [ ] **Step 5: Implement the middleware**

Append to `packages/auth-middleware/src/express.ts`:

```ts
import { prisma } from "@repo/db";

export async function resolveActingHost(req: Request, res: Response, next: NextFunction) {
  const headerValue = req.header("X-Acting-Host-Id");
  if (!headerValue) return next();

  // Only admins may impersonate; for everyone else the header is silently ignored.
  if (req.user?.role !== "ADMIN") return next();

  const target = await prisma.user.findUnique({
    where: { id: headerValue },
    select: { id: true, role: true, deletedAt: true },
  });

  if (!target || target.deletedAt) {
    return res.status(400).json({ message: "Invalid acting host" });
  }
  if (target.role !== "HOST" && target.role !== "ADMIN") {
    return res.status(400).json({ message: "Invalid acting host" });
  }

  req.realUserId = req.userId;
  req.actingHostId = target.id;
  req.userId = target.id;

  if (req.method !== "GET" && req.method !== "HEAD") {
    console.info(
      JSON.stringify({
        msg: "admin acting as host",
        realUserId: req.realUserId,
        actingHostId: req.actingHostId,
        method: req.method,
        path: req.path,
      })
    );
  }

  return next();
}
```

- [ ] **Step 6: Re-export from the package index**

In `packages/auth-middleware/src/index.ts`, find the Express export block and add `resolveActingHost as resolveActingHostExpress`. Mirror the existing rename pattern:

```ts
export {
  // ...existing express exports...
  resolveActingHost as resolveActingHostExpress,
} from "./express.js";
```

- [ ] **Step 7: Run tests, expect pass**

```bash
cd packages/auth-middleware && pnpm test -- resolveActingHost
```

Expected: PASS — all six cases.

- [ ] **Step 8: Commit**

```bash
git add packages/auth-middleware/src/express.ts packages/auth-middleware/src/types.ts packages/auth-middleware/src/index.ts packages/auth-middleware/src/resolveActingHost.test.ts packages/auth-middleware/package.json
git commit -m "feat(auth-middleware): add resolveActingHost (express)"
```

---

### Task 2: `resolveActingHost` middleware (Fastify)

**Files:**
- Modify: `packages/auth-middleware/src/fastify.ts`
- Modify: `packages/auth-middleware/src/index.ts`
- Create: `packages/auth-middleware/src/resolveActingHost.fastify.test.ts`

- [ ] **Step 1: Inspect existing Fastify middleware shape**

```bash
grep -n "shouldBeHost\|FastifyRequest\|FastifyReply" packages/auth-middleware/src/fastify.ts | head -20
```

Note the signature pattern: `async function name(request, reply)`. Note how it attaches `request.userId` (search for that property).

- [ ] **Step 2: Write the failing tests**

Create `packages/auth-middleware/src/resolveActingHost.fastify.test.ts` mirroring Task 1's structure but with Fastify mock shapes:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyRequest, FastifyReply } from "fastify";

vi.mock("@repo/db", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));

import { prisma } from "@repo/db";
import { resolveActingHost } from "./fastify.js";

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
  beforeEach(() => vi.clearAllMocks());

  it("no-ops when header absent", async () => {
    const req = mockReq({ role: "ADMIN" });
    const reply = mockReply();
    await resolveActingHost(req, reply);
    expect((req as any).actingHostId).toBeUndefined();
    expect(reply.send).not.toHaveBeenCalled();
  });

  it("rewrites userId for admin with valid HOST target", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "h2", role: "HOST", deletedAt: null });
    const req = mockReq({ role: "ADMIN", header: "h2" });
    const reply = mockReply();
    await resolveActingHost(req, reply);
    expect((req as any).userId).toBe("h2");
    expect((req as any).actingHostId).toBe("h2");
    expect((req as any).realUserId).toBe("admin-1");
  });

  it("400s on unknown id", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const req = mockReq({ role: "ADMIN", header: "x" });
    const reply = mockReply();
    await resolveActingHost(req, reply);
    expect(reply.code).toHaveBeenCalledWith(400);
  });

  it("ignores header for non-admin", async () => {
    const req = mockReq({ role: "HOST", userId: "host-1", header: "host-2" });
    const reply = mockReply();
    await resolveActingHost(req, reply);
    expect((req as any).userId).toBe("host-1");
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run tests, confirm fail**

```bash
cd packages/auth-middleware && pnpm test -- resolveActingHost.fastify
```

Expected: FAIL — symbol not exported.

- [ ] **Step 4: Implement**

Append to `packages/auth-middleware/src/fastify.ts`:

```ts
import { prisma } from "@repo/db";

export async function resolveActingHost(request: FastifyRequest, reply: FastifyReply) {
  const headerValue = request.headers["x-acting-host-id"];
  const headerStr = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (!headerStr) return;

  const user = (request as any).user;
  if (user?.role !== "ADMIN") return;

  const target = await prisma.user.findUnique({
    where: { id: headerStr },
    select: { id: true, role: true, deletedAt: true },
  });

  if (!target || target.deletedAt) {
    return reply.code(400).send({ message: "Invalid acting host" });
  }
  if (target.role !== "HOST" && target.role !== "ADMIN") {
    return reply.code(400).send({ message: "Invalid acting host" });
  }

  (request as any).realUserId = (request as any).userId;
  (request as any).actingHostId = target.id;
  (request as any).userId = target.id;

  if (request.method !== "GET" && request.method !== "HEAD") {
    console.info(
      JSON.stringify({
        msg: "admin acting as host",
        realUserId: (request as any).realUserId,
        actingHostId: target.id,
        method: request.method,
        path: request.url,
      })
    );
  }
}
```

- [ ] **Step 5: Re-export**

Add to `packages/auth-middleware/src/index.ts` Fastify export block:

```ts
  resolveActingHost as resolveActingHostFastify,
```

- [ ] **Step 6: Run tests, expect pass**

```bash
cd packages/auth-middleware && pnpm test
```

Expected: All resolveActingHost tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/auth-middleware/src/fastify.ts packages/auth-middleware/src/index.ts packages/auth-middleware/src/resolveActingHost.fastify.test.ts
git commit -m "feat(auth-middleware): add resolveActingHost (fastify)"
```

---

## Phase 2 — Wire middleware into host routes

### Task 3: Wire into product-service venue & space routes

**Files:**
- Modify: `apps/product-service/src/middleware/authMiddleware.ts`
- Modify: `apps/product-service/src/routes/venue.route.ts`
- Modify: `apps/product-service/src/routes/space.route.ts`

- [ ] **Step 1: Add re-export in product-service middleware shim**

Replace `apps/product-service/src/middleware/authMiddleware.ts` content with:

```ts
export {
  shouldBeUser,
  shouldBeAdmin,
  shouldBeHost,
  shouldBeHostOrAdmin,
  resolveActingHost,
} from "@repo/auth-middleware/express";
```

- [ ] **Step 2: Wire into venue routes**

In `apps/product-service/src/routes/venue.route.ts`, update the import line and route declarations:

```ts
import {
  shouldBeHost,
  shouldBeHostOrAdmin,
  resolveActingHost,
} from "../middleware/authMiddleware.js";

// ...existing imports...

router.get("/host/my", shouldBeHost, resolveActingHost, getMyVenues);
router.post("/", shouldBeHost, resolveActingHost, createVenue);
router.put("/:id", shouldBeHostOrAdmin, resolveActingHost, updateVenue);
router.delete("/:id", shouldBeHostOrAdmin, resolveActingHost, deleteVenue);
```

Leave all other routes (public `GET /`, `GET /:id`) unchanged.

- [ ] **Step 3: Wire into space routes**

In `apps/product-service/src/routes/space.route.ts`, add `resolveActingHost` to the imports and inject it after each host middleware on the host-scoped routes:

```ts
import { shouldBeUser, shouldBeHost, shouldBeHostOrAdmin, resolveActingHost } from "../middleware/authMiddleware.js";

router.get("/host/my", shouldBeHost, resolveActingHost, getMySpaces);
router.post("/", shouldBeHost, resolveActingHost, createSpace);
router.put("/:id", shouldBeHostOrAdmin, resolveActingHost, updateSpace);
router.delete("/:id", shouldBeHost, resolveActingHost, deleteSpace);
router.put("/:id/availability", shouldBeHost, resolveActingHost, updateAvailability);
router.post("/reviews/:reviewId/respond", shouldBeHost, resolveActingHost, respondToReview);
```

- [ ] **Step 4: Typecheck the service**

```bash
cd apps/product-service && pnpm check-types
```

Expected: clean.

- [ ] **Step 5: Run the existing test suite (regression check)**

```bash
cd apps/product-service && pnpm test
```

Expected: existing tests still pass — the new middleware is a no-op when the header is absent.

- [ ] **Step 6: Commit**

```bash
git add apps/product-service/src/middleware/authMiddleware.ts apps/product-service/src/routes/venue.route.ts apps/product-service/src/routes/space.route.ts
git commit -m "feat(product-service): wire resolveActingHost into venue/space host routes"
```

---

### Task 4: Wire into order-service booking & host-earnings routes

**Files:**
- Modify: `apps/order-service/src/routes/booking.ts`

- [ ] **Step 1: Update the import**

```ts
import {
  shouldBeUser,
  shouldBeHost,
  shouldBeAdmin,
  shouldBeHostOrAdmin,
  resolveActingHost,
} from "@repo/auth-middleware/fastify";
```

- [ ] **Step 2: Chain the middleware on every host-scoped preHandler**

Fastify accepts an array of preHandlers. Replace every `{ preHandler: shouldBeHost }` on a host-scoped route with `{ preHandler: [shouldBeHost, resolveActingHost] }`. The host-scoped routes to update are at approximate lines 785, 829, 872, 1060, 1259, 1533 — use `grep -n "preHandler: shouldBeHost" apps/order-service/src/routes/booking.ts` to enumerate them precisely.

Example before:

```ts
fastify.get(
  "/bookings/host/...",
  { preHandler: shouldBeHost },
  async (request, reply) => { ... }
);
```

Example after:

```ts
fastify.get(
  "/bookings/host/...",
  { preHandler: [shouldBeHost, resolveActingHost] },
  async (request, reply) => { ... }
);
```

Do NOT modify `shouldBeUser` or `shouldBeAdmin` routes — those aren't host-scoped.

- [ ] **Step 3: Typecheck and test**

```bash
cd apps/order-service && pnpm check-types && pnpm test
```

Expected: clean + tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/order-service/src/routes/booking.ts
git commit -m "feat(order-service): wire resolveActingHost into host booking & earnings routes"
```

---

## Phase 3 — Endpoints

### Task 5: Update `GET /users/hosts` to include ADMIN role and venue count

**Files:**
- Modify: `apps/auth-service/src/routes/user.route.ts:75-108`

Background: the existing endpoint filters by `role: "HOST"` and returns `_count: { spaces: true }`. The switcher needs HOST + ADMIN and (separately) venue counts.

- [ ] **Step 1: Update the endpoint to accept `?include=admins` and sort by name**

Replace the body of the existing `router.get("/hosts", ...)` (lines 75-108) with:

```ts
router.get("/hosts", async (req, res) => {
  try {
    const { verified, include } = req.query;
    const includeAdmins = include === "admins";

    const hosts = await prisma.user.findMany({
      where: {
        deletedAt: null,
        role: includeAdmins ? { in: ["HOST", "ADMIN"] } : "HOST",
        ...(verified !== undefined && { hostVerified: verified === "true" }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        image: true,
        phone: true,
        bio: true,
        hostVerified: true,
        emailVerified: true,
        hostingSince: true,
        createdAt: true,
        _count: {
          select: { spaces: true },
        },
      },
      orderBy: [{ name: "asc" }, { username: "asc" }],
    });

    return res.status(200).json(hosts);
  } catch (error) {
    return sendPrismaError(res, error, "Get hosts error");
  }
});
```

The new field `emailVerified` powers the `LEAD` badge in the switcher.

- [ ] **Step 2: Typecheck**

```bash
cd apps/auth-service && pnpm check-types
```

- [ ] **Step 3: Smoke test against local DB**

Start the local postgres (`docker start spacefly-ai-postgres-local`) and run the auth-service locally if not already (`cd apps/auth-service && pnpm dev`). With an admin token:

```bash
curl -s "http://localhost:8003/users/hosts?include=admins" -H "Authorization: Bearer $ADMIN_TOKEN" | head
```

Expected: array including the admin and any host rows.

- [ ] **Step 4: Commit**

```bash
git add apps/auth-service/src/routes/user.route.ts
git commit -m "feat(auth-service): GET /users/hosts supports ?include=admins and sorts by name"
```

---

### Task 6: Add `POST /users/hosts/lead`

**Files:**
- Modify: `apps/auth-service/src/routes/user.route.ts`

- [ ] **Step 1: Add validation helpers near the top of the file**

Just below the existing `validatePassword` block, add:

```ts
const USERNAME_REGEX = /^[a-z0-9_-]+$/;

function slugifyForEmail(username: string): string {
  return username.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

function generateRandomPassword(): string {
  // 64 random bytes → base64 → never satisfies bcrypt-comparable plaintext that any
  // user would type. Used as a placeholder for lead accounts that cannot log in
  // until an invite flow rotates the password.
  const buf = Buffer.alloc(64);
  for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256);
  return buf.toString("base64");
}
```

- [ ] **Step 2: Add the route handler**

Insert before `// Get single user (admin only)` (around line 110):

```ts
// Create lead host account (admin only).
// Lead accounts cannot log in until an invite/password-reset rotates the random
// password. Used by the admin host-switcher to onboard new hosts.
router.post("/hosts/lead", async (req, res) => {
  try {
    const { name, username, email: rawEmail, bio, hostingSince } = req.body ?? {};

    if (typeof name !== "string" || name.trim().length === 0 || name.length > 80) {
      return res.status(400).json({ message: "Name is required (max 80 chars)" });
    }
    if (typeof username !== "string" || !USERNAME_REGEX.test(username) || username.length < 3 || username.length > 32) {
      return res.status(400).json({ message: "Username must be 3-32 chars, lowercase letters, digits, _ or -" });
    }
    if (bio !== undefined && bio !== null && (typeof bio !== "string" || bio.length > 500)) {
      return res.status(400).json({ message: "Bio must be a string up to 500 chars" });
    }

    const email = rawEmail
      ? normalizeEmail(String(rawEmail))
      : `hosts+${slugifyForEmail(username)}@spacefly.ai`;

    const existing = await prisma.user.findFirst({
      where: { deletedAt: null, OR: [{ email }, { username }] },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({ message: "User with this email or username already exists" });
    }

    const hashedPassword = await hashPassword(generateRandomPassword());

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name: name.trim(),
        role: "HOST",
        hostVerified: true,
        emailVerified: false,
        mustChangePassword: true,
        bio: typeof bio === "string" ? bio : null,
        hostingSince: typeof hostingSince === "string" ? new Date(hostingSince) : null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        image: true,
        bio: true,
        hostVerified: true,
        emailVerified: true,
        hostingSince: true,
        createdAt: true,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    return sendPrismaError(res, error, "Create lead host error");
  }
});
```

- [ ] **Step 3: Verify the route order**

Confirm `/hosts/lead` is defined BEFORE `/:id` so Express does not match `lead` as an id. The default route file has `/:id` at line 111; the new route at line ~109 must come earlier. If unsure, grep:

```bash
grep -n "router.\(get\|post\|put\|delete\)" apps/auth-service/src/routes/user.route.ts
```

- [ ] **Step 4: Smoke test**

With auth-service running locally and an admin token:

```bash
curl -s -X POST "http://localhost:8003/users/hosts/lead" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Lead Test","username":"lead-test"}'
```

Expected: 201 + user record with `email: "hosts+lead-test@spacefly.ai"`.

- [ ] **Step 5: Commit**

```bash
git add apps/auth-service/src/routes/user.route.ts
git commit -m "feat(auth-service): POST /users/hosts/lead to create lead host accounts"
```

---

### Task 7: Add `GET /venues/counts-by-host` in product-service

**Files:**
- Modify: `apps/product-service/src/controllers/venue.controller.ts`
- Modify: `apps/product-service/src/routes/venue.route.ts`

- [ ] **Step 1: Add controller function**

Append to `apps/product-service/src/controllers/venue.controller.ts`:

```ts
export const getVenueCountsByHost = async (_req: Request, res: Response) => {
  const grouped = await prisma.venue.groupBy({
    by: ["hostId"],
    _count: { _all: true },
  });
  const payload = grouped.map((row) => ({
    hostId: row.hostId,
    count: row._count._all,
  }));
  return res.status(200).json(payload);
};
```

- [ ] **Step 2: Wire route (admin-only)**

In `apps/product-service/src/routes/venue.route.ts`, add:

```ts
import {
  shouldBeAdmin,
  shouldBeHost,
  shouldBeHostOrAdmin,
  resolveActingHost,
} from "../middleware/authMiddleware.js";

import {
  // existing imports
  getVenueCountsByHost,
} from "../controllers/venue.controller.js";

// Place ABOVE `router.get("/:id", ...)` so `/counts-by-host` is not matched as an id.
router.get("/counts-by-host", shouldBeAdmin, getVenueCountsByHost);
```

If `shouldBeAdmin` isn't already re-exported from `authMiddleware.ts`, add it there too.

- [ ] **Step 3: Typecheck**

```bash
cd apps/product-service && pnpm check-types
```

- [ ] **Step 4: Smoke test**

```bash
curl -s "http://localhost:8000/venues/counts-by-host" -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected: `[{"hostId":"local_ihub_chisinau","count":3}, ...]`.

- [ ] **Step 5: Commit**

```bash
git add apps/product-service/src/controllers/venue.controller.ts apps/product-service/src/routes/venue.route.ts
git commit -m "feat(product-service): GET /venues/counts-by-host (admin) for host switcher"
```

---

## Phase 4 — Admin client

### Task 8: Extend auth store with `actingHostId`

**Files:**
- Modify: `apps/admin/src/stores/authStore.ts`

- [ ] **Step 1: Inspect the existing store shape**

```bash
sed -n '1,80p' apps/admin/src/stores/authStore.ts
```

Identify how state is created (Zustand `create()` call), where `isAdmin` is derived, and how persisted state is handled (if any).

- [ ] **Step 2: Add `actingHostId` to the store**

Add to the state shape and creator:

```ts
// At the top, alongside other top-level constants:
const ACTING_HOST_STORAGE_KEY = "spacefly_acting_host";

// In the store state interface (TypeScript):
interface AuthState {
  // ...existing fields...
  actingHostId: string | null;
  setActingHost: (id: string | null) => void;
}

// In the create() body, in the initial state object:
actingHostId:
  typeof window !== "undefined"
    ? window.localStorage.getItem(ACTING_HOST_STORAGE_KEY)
    : null,

// In the create() body, as a new action:
setActingHost: (id: string | null) => {
  if (typeof window !== "undefined") {
    if (id) window.localStorage.setItem(ACTING_HOST_STORAGE_KEY, id);
    else window.localStorage.removeItem(ACTING_HOST_STORAGE_KEY);
  }
  set({ actingHostId: id });
},
```

If the store currently uses Zustand `persist` middleware, integrate the field into the persisted slice instead of writing to localStorage manually.

- [ ] **Step 3: Typecheck**

```bash
cd apps/admin && pnpm check-types
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/stores/authStore.ts
git commit -m "feat(admin): add actingHostId to auth store, persisted in localStorage"
```

---

### Task 9: Add `apiFetch` wrapper

**Files:**
- Create: `apps/admin/src/lib/apiFetch.ts`
- Create: `apps/admin/src/lib/apiFetch.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/admin/src/lib/apiFetch.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/stores/authStore", () => {
  const state = {
    getToken: vi.fn().mockResolvedValue("tok"),
    isAdmin: true,
    actingHostId: null as string | null,
  };
  return {
    default: { getState: () => state },
    __state: state,
  };
});

import * as store from "@/stores/authStore";
import { apiFetch, UnauthenticatedError } from "./apiFetch";

const state = (store as any).__state;

describe("apiFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    state.getToken = vi.fn().mockResolvedValue("tok");
    state.isAdmin = true;
    state.actingHostId = null;
  });

  it("attaches Authorization", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}"));
    await apiFetch("https://api/x");
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect((init.headers as Headers).get("authorization")).toBe("Bearer tok");
  });

  it("attaches X-Acting-Host-Id when admin + actingHostId set", async () => {
    state.actingHostId = "host-1";
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}"));
    await apiFetch("https://api/x");
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect((init.headers as Headers).get("x-acting-host-id")).toBe("host-1");
  });

  it("omits X-Acting-Host-Id when not admin", async () => {
    state.isAdmin = false;
    state.actingHostId = "host-1";
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}"));
    await apiFetch("https://api/x");
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect((init.headers as Headers).get("x-acting-host-id")).toBeNull();
  });

  it("throws UnauthenticatedError when no token", async () => {
    state.getToken = vi.fn().mockResolvedValue(null);
    await expect(apiFetch("https://api/x")).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
```

- [ ] **Step 2: Create the implementation**

Create `apps/admin/src/lib/apiFetch.ts`:

```ts
import useAuthStore from "@/stores/authStore";

export class UnauthenticatedError extends Error {
  constructor() {
    super("Unauthenticated");
    this.name = "UnauthenticatedError";
  }
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { getToken, isAdmin, actingHostId } = useAuthStore.getState();
  const token = await getToken();
  if (!token) throw new UnauthenticatedError();

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (isAdmin && actingHostId) {
    headers.set("X-Acting-Host-Id", actingHostId);
  }
  return fetch(input, { ...init, headers });
}
```

- [ ] **Step 3: Run tests**

```bash
cd apps/admin && pnpm test -- apiFetch
```

Expected: PASS (all 4 cases).

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/lib/apiFetch.ts apps/admin/src/lib/apiFetch.test.ts
git commit -m "feat(admin): apiFetch wrapper attaches X-Acting-Host-Id header"
```

---

### Task 10: Migrate admin host pages to use `apiFetch` + subscribe to `actingHostId`

**Files:**
- Modify: `apps/admin/src/app/(dashboard)/host/venues/page.tsx`
- Modify: `apps/admin/src/app/(dashboard)/host/spaces/page.tsx`
- Modify: `apps/admin/src/app/(dashboard)/host/bookings/page.tsx`
- Modify: `apps/admin/src/app/(dashboard)/host/earnings/page.tsx`
- Modify: `apps/admin/src/app/(dashboard)/host/page.tsx`

For each file:

- [ ] **Step 1: Replace direct `fetch(URL, { headers: { Authorization } })` with `apiFetch(URL)`**

For example, in venues/page.tsx, replace:

```ts
const res = await fetch(
  `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/venues/host/my`,
  { headers: { Authorization: `Bearer ${resolvedToken}` } }
);
```

with:

```ts
const res = await apiFetch(
  `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/venues/host/my`
);
```

And remove the `getToken()` call that produced `resolvedToken` (apiFetch handles it). Keep the 401 redirect:

```ts
try {
  const res = await apiFetch(URL);
  if (res.ok) { ... }
  else if (res.status === 401) { router.push("/login"); }
  else throw new Error(...);
} catch (err) {
  if (err instanceof UnauthenticatedError) {
    router.push("/login");
    return;
  }
  // existing error handling
}
```

- [ ] **Step 2: Subscribe to `actingHostId` and add to fetch deps**

In each page, alongside the existing `useAuthStore` destructure, also pull `actingHostId`:

```ts
const { getToken, actingHostId } = useAuthStore();
```

Then add `actingHostId` to the `useCallback` deps for `fetchVenues` / `fetchSpaces` / etc. and to the `useEffect` deps array. This makes the page refetch when the admin changes acting host.

- [ ] **Step 3: Repeat for all five files**

Files (and their existing fetch calls — verify with grep):

```bash
grep -n "fetch(\|getToken" apps/admin/src/app/\(dashboard\)/host/{venues,spaces,bookings,earnings}/page.tsx apps/admin/src/app/\(dashboard\)/host/page.tsx
```

Apply the same Step 1+2 treatment to each.

- [ ] **Step 4: Typecheck and run admin tests**

```bash
cd apps/admin && pnpm check-types && pnpm test
```

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/app/\(dashboard\)/host
git commit -m "refactor(admin): migrate host pages to apiFetch, refetch on actingHostId change"
```

---

### Task 11: `HostSwitcher` component

**Files:**
- Create: `apps/admin/src/components/HostSwitcher.tsx`
- Create: `apps/admin/src/components/CreateLeadHostModal.tsx`

- [ ] **Step 1: Inspect existing UI primitives**

```bash
ls apps/admin/src/components/ui/ | head
```

Note which dropdown/popover/modal components already exist (likely shadcn-style: `popover.tsx`, `dialog.tsx`, `input.tsx`, `button.tsx`, `avatar.tsx`).

- [ ] **Step 2: Build `CreateLeadHostModal.tsx`**

Create `apps/admin/src/components/CreateLeadHostModal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";
import { toast } from "react-toastify";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (host: { id: string; name: string | null; username: string; email: string }) => void;
}

export function CreateLeadHostModal({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/users/hosts/lead`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            username: username.trim().toLowerCase(),
            email: email.trim() || undefined,
            bio: bio.trim() || undefined,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.message || "Failed to create lead host");
        return;
      }
      const host = await res.json();
      onCreated(host);
      toast.success("Lead host created");
      onOpenChange(false);
      setName(""); setUsername(""); setEmail(""); setBio("");
    } catch (err) {
      if (err instanceof UnauthenticatedError) {
        toast.error("Session expired");
        return;
      }
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create lead host</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
          </div>
          <div>
            <Label htmlFor="username">Username *</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required pattern="^[a-z0-9_-]+$" minLength={3} maxLength={32} />
          </div>
          <div>
            <Label htmlFor="email">Email (optional)</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hosts+<username>@spacefly.ai" />
          </div>
          <div>
            <Label htmlFor="bio">Bio (optional)</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

If `Textarea` or `Label` doesn't exist in `components/ui/`, fall back to plain `<textarea>` / `<label>` with utility classes — check `components/ui/` listing from Step 1.

- [ ] **Step 3: Build `HostSwitcher.tsx`**

Create `apps/admin/src/components/HostSwitcher.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, X } from "lucide-react";
import useAuthStore from "@/stores/authStore";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";
import { CreateLeadHostModal } from "./CreateLeadHostModal";

interface Host {
  id: string;
  name: string | null;
  username: string;
  email: string;
  image: string | null;
  role: "HOST" | "ADMIN";
  hostVerified: boolean;
  emailVerified: boolean;
}

interface CountRow { hostId: string; count: number }

export function HostSwitcher() {
  const { isAdmin, actingHostId, setActingHost } = useAuthStore();
  const [hosts, setHosts] = useState<Host[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [hostsRes, countsRes] = await Promise.all([
        apiFetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/users/hosts?include=admins`),
        apiFetch(`${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/venues/counts-by-host`),
      ]);
      if (!hostsRes.ok) throw new Error("hosts");
      if (!countsRes.ok) throw new Error("counts");
      const hostsJson: Host[] = await hostsRes.json();
      const countsJson: CountRow[] = await countsRes.json();
      setHosts(hostsJson);
      setCounts(Object.fromEntries(countsJson.map((r) => [r.hostId, r.count])));
    } catch (err) {
      if (err instanceof UnauthenticatedError) {
        setError("Session expired");
      } else {
        setError("Couldn't load hosts");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  const selected = useMemo(() => hosts.find((h) => h.id === actingHostId) ?? null, [hosts, actingHostId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hosts;
    return hosts.filter(
      (h) =>
        h.name?.toLowerCase().includes(q) ||
        h.username.toLowerCase().includes(q) ||
        h.email.toLowerCase().includes(q)
    );
  }, [hosts, query]);

  if (!isAdmin) return null;

  return (
    <div className="px-2 py-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="w-full flex items-center justify-between gap-2 rounded-md border border-border/60 bg-card px-3 py-2 text-left text-sm hover:bg-accent/30"
          >
            <span className="truncate">
              {selected ? (
                <>
                  <span className="text-muted-foreground">Acting as:</span>{" "}
                  <span className="font-medium">{selected.name || selected.username}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Select a host…</span>
              )}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="border-b border-border/60 p-2">
            <Input
              placeholder="Search hosts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {loading && <div className="p-3 text-sm text-muted-foreground">Loading…</div>}
            {error && (
              <div className="p-3 text-sm text-red-600">
                {error} <button className="underline" onClick={load}>retry</button>
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">No matches.</div>
            )}
            {!loading && !error && filtered.map((h) => {
              const badge = h.role === "ADMIN"
                ? "ADMIN"
                : h.emailVerified ? "HOST" : "LEAD";
              return (
                <button
                  key={h.id}
                  onClick={() => { setActingHost(h.id); setOpen(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent/30 ${actingHostId === h.id ? "bg-accent/30" : ""}`}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block truncate font-medium">{h.name || h.username}</span>
                    <span className="block truncate text-xs text-muted-foreground">{h.email}</span>
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase">{badge}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{counts[h.id] ?? 0}</span>
                </button>
              );
            })}
          </div>
          <div className="border-t border-border/60 p-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => { setOpen(false); setCreateOpen(true); }}
            >
              <Plus className="size-4" />
              Create new lead host
            </Button>
            {actingHostId && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-muted-foreground"
                onClick={() => { setActingHost(null); setOpen(false); }}
              >
                <X className="size-4" />
                Clear selection
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <CreateLeadHostModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(host) => {
          setActingHost(host.id);
          load();
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
cd apps/admin && pnpm check-types
```

If `Popover` doesn't exist in `components/ui/`, install/scaffold it (shadcn `popover` from `@radix-ui/react-popover`) or substitute a simple absolute-positioned `<div>` for v1.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/components/HostSwitcher.tsx apps/admin/src/components/CreateLeadHostModal.tsx
git commit -m "feat(admin): HostSwitcher dropdown + create-lead modal"
```

---

### Task 12: Wire `HostSwitcher` into `AppSidebar`

**Files:**
- Modify: `apps/admin/src/components/AppSidebar.tsx`

- [ ] **Step 1: Import and render conditionally**

In `AppSidebar.tsx`, near the top:

```tsx
import { HostSwitcher } from "./HostSwitcher";
```

Find the section that renders the "Host View" group header. Insert `<HostSwitcher />` immediately under the group label. Component is self-conditional (`if (!isAdmin) return null;`), so no extra guard needed.

- [ ] **Step 2: Visual check in browser**

```bash
cd apps/admin && pnpm dev
```

Visit `http://localhost:3001/host/venues` logged in as admin; sidebar should show the switcher. Logged in as a host, the switcher must be hidden.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/components/AppSidebar.tsx
git commit -m "feat(admin): render HostSwitcher in the host sidebar group"
```

---

### Task 13: Empty-state banner on host pages when admin has no acting host

**Files:**
- Create: `apps/admin/src/components/HostEmptyAdminBanner.tsx`
- Modify: `apps/admin/src/app/(dashboard)/host/venues/page.tsx`
- Modify: `apps/admin/src/app/(dashboard)/host/spaces/page.tsx`
- Modify: `apps/admin/src/app/(dashboard)/host/bookings/page.tsx`
- Modify: `apps/admin/src/app/(dashboard)/host/earnings/page.tsx`
- Modify: `apps/admin/src/app/(dashboard)/host/page.tsx`

- [ ] **Step 1: Create the banner component**

```tsx
"use client";
import Link from "next/link";
import { Info } from "lucide-react";

export function HostEmptyAdminBanner() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 size-5 text-muted-foreground" />
        <div className="space-y-2">
          <h2 className="text-base font-semibold">You're connected as an admin</h2>
          <p className="text-sm text-muted-foreground">
            Pick a host from the sidebar dropdown to view their workspace, or visit the{" "}
            <Link href="/admin/dashboard" className="underline">Platform Dashboard</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Render conditionally in each host page**

At the top of each page's render, after the loading guard:

```tsx
const { isAdmin, actingHostId } = useAuthStore();
// ...
if (isAdmin && !actingHostId) {
  return <HostEmptyAdminBanner />;
}
```

Place this BEFORE the existing data-driven render. Hosts (`!isAdmin`) skip the banner and see their normal page.

- [ ] **Step 3: Typecheck and dev-server smoke**

```bash
cd apps/admin && pnpm check-types
```

Visit each host page as admin (no host selected) → banner shows. Pick a host → page renders that host's data.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/components/HostEmptyAdminBanner.tsx apps/admin/src/app/\(dashboard\)/host
git commit -m "feat(admin): empty-state banner on host pages when admin has no acting host"
```

---

## Phase 5 — Verification

### Task 14: End-to-end smoke against local stack

- [ ] **Step 1: Start the stack**

```bash
docker start spacefly-ai-postgres-local
cd apps/auth-service && pnpm dev &
cd apps/product-service && pnpm dev &
cd apps/order-service && pnpm dev &
cd apps/admin && pnpm dev
```

- [ ] **Step 2: Walk the happy path**

- Log in as admin.
- `/host/venues` → see the banner.
- Pick `iHUB Chisinau` (or whichever local host exists in your DB) → see their venues.
- Edit a venue (change description, save) → success toast.
- Switch to another host → list updates.
- Open the switcher → click `+ Create new lead host` → submit `name="Smoke Test"`, `username="smoketest"` → new lead appears and is auto-selected; workspace is empty.
- Clear selection → banner reappears.

- [ ] **Step 3: Confirm host login unaffected**

Log in as a host (e.g., florinsfp@gmail.com). Sidebar should have NO switcher. My Venues should show ONLY their own venues. Editing works the same as before.

- [ ] **Step 4: Confirm server-side guard against header tampering**

In an authenticated host session, manually send `X-Acting-Host-Id: <admin-id>` via curl/devtools. Confirm the server still scopes to the host's own id (middleware no-ops for non-admins).

- [ ] **Step 5: Commit any small fixes uncovered during smoke**

If anything fails during smoke, fix inline and commit as `fix(admin): <what>` then re-run the smoke from Step 2.

---

## Self-review notes

- Spec coverage: every requirement in the spec maps to a task — middleware (1,2), wiring (3,4), endpoints (5,6,7), client state (8), fetch wrapper (9), page migration (10), switcher (11), sidebar (12), empty state (13), smoke (14).
- The spec's "Implementation order" matches the task sequencing above.
- No placeholders or TODOs left in the task bodies.
- All code blocks contain complete, runnable content.
- The `GET /users/hosts` endpoint already existed and is admin-gated via `app.use("/users", shouldBeAdmin, userRoute)` in `apps/auth-service/src/index.ts:71`. The plan updates the existing handler rather than creating a duplicate.
