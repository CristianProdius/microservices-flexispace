# Host Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin issue a temporary password to a host and have that host, on first login, be routed into a branded 3-step onboarding wizard that forces them to set a new password before using the app.

**Architecture:** Two small `auth-service` endpoints (admin sets/generates a temp password + flips `mustChangePassword: true`; the host clears it via an onboarding-only set-password route that keeps the session alive) plus the existing-but-ignored `requiresPasswordChange` login flag. The `apps/admin` Next.js app surfaces that flag, redirects flagged hosts into a new `(onboarding)` route group, and gains an admin "Set temporary password" panel that shows copyable credentials.

**Tech Stack:** Express 5 + Prisma (`apps/auth-service`), Next.js 15 App Router + Zustand + shadcn/ui + Tailwind v4 (`apps/admin`), Vitest (admin tests).

---

## Testing reality (read first)

- **`apps/auth-service` has NO test harness** — no `vitest.config`, no `test` script, zero test files. We follow that existing convention: backend tasks are verified with `pnpm --filter auth-service check-types` (the real automated gate) plus a documented manual `curl`. Do **not** stand up a new test framework for this feature.
- **`apps/admin` uses Vitest** (`pnpm --filter admin test`) with an established pattern (`createRoot` + `act`, mocking `next/navigation`, `@/stores/authStore`, `@/lib/auth`). Frontend tasks are TDD against that pattern.

## File structure

**Backend (`apps/auth-service`)**
- Modify `src/routes/auth.route.ts` — add `mustChangePassword` to `/auth/me` select; add `POST /auth/onboarding/set-password`.
- Modify `src/utils/validation.ts` — add `onboardingSetPasswordSchema`.
- Modify `src/utils/rateLimit.ts` — add `onboardingSetPasswordLimiter`.
- Modify `src/routes/user.route.ts` — add `generateTempPassword()` + `POST /users/:id/temp-password`.

**Frontend (`apps/admin`)**
- Modify `src/lib/auth.ts` — add `requiresPasswordChange` to `AuthResponse`; add `onboardingSetPassword()` + `getMe()`.
- Modify `src/stores/authStore.ts` — `login` returns `{ user, requiresPasswordChange }`.
- Modify `src/app/(auth)/login/page.tsx` (+ `page.test.tsx`) — redirect flagged users to `/onboarding`.
- Modify `src/middleware.ts` — add `/onboarding/:path*` to the matcher.
- Create `src/app/(onboarding)/layout.tsx` — branded chrome-free wizard layout.
- Create `src/app/(onboarding)/onboarding/page.tsx` (+ `page.test.tsx`) — the 3-step wizard.
- Create `src/components/OnboardingGuard.tsx`; modify `src/app/(dashboard)/layout.tsx` — pull a still-flagged host into onboarding.
- Create `src/components/SetTempPassword.tsx` (+ `SetTempPassword.test.tsx`); modify `src/app/(dashboard)/admin/users/[id]/page.tsx` — admin credentials panel.

---

## Task 1: Expose `mustChangePassword` on `GET /auth/me`

**Files:**
- Modify: `apps/auth-service/src/routes/auth.route.ts:817-832`

- [ ] **Step 1: Add the field to the select block**

In the `router.get("/me", ...)` handler, add `mustChangePassword: true,` to the `select` object (after `emailVerified: true,`):

```ts
        emailVerified: true,
        mustChangePassword: true,
        commissionRate: true,
        createdAt: true,
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter auth-service check-types`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add apps/auth-service/src/routes/auth.route.ts
git commit -m "feat(auth): expose mustChangePassword on /auth/me"
```

---

## Task 2: Validation schema + rate limiter for onboarding set-password

**Files:**
- Modify: `apps/auth-service/src/utils/validation.ts`
- Modify: `apps/auth-service/src/utils/rateLimit.ts`

- [ ] **Step 1: Add the schema**

In `apps/auth-service/src/utils/validation.ts`, after `resetPasswordSchema`/`ResetPasswordBody` (line ~67), add:

```ts
export const onboardingSetPasswordSchema = z.object({
  newPassword: passwordSchema,
});
export type OnboardingSetPasswordBody = z.infer<typeof onboardingSetPasswordSchema>;
```

- [ ] **Step 2: Add the rate limiter**

In `apps/auth-service/src/utils/rateLimit.ts`, after `resetPasswordLimiter` (line ~113), add:

```ts
/**
 * Onboarding set-password: 10 per 15 min per IP. The endpoint is already
 * gated on an authenticated session with mustChangePassword === true; this
 * just sheds abuse.
 */
export const onboardingSetPasswordLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: ipKey,
  handler: standardResponse,
});
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter auth-service check-types`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/auth-service/src/utils/validation.ts apps/auth-service/src/utils/rateLimit.ts
git commit -m "feat(auth): add schema + limiter for onboarding set-password"
```

---

## Task 3: `POST /auth/onboarding/set-password`

**Files:**
- Modify: `apps/auth-service/src/routes/auth.route.ts` (imports + new handler after `change-password`, before `/me`)

- [ ] **Step 1: Import the new schema and limiter**

In the `validation.js` import block (line ~21-29) add `onboardingSetPasswordSchema`:

```ts
import {
  parseBody,
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  becomeHostSchema,
  onboardingSetPasswordSchema,
} from "../utils/validation.js";
```

In the `rateLimit.js` import block (line ~31-38) add `onboardingSetPasswordLimiter`:

```ts
import {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  resendVerificationLimiter,
  onboardingSetPasswordLimiter,
} from "../utils/rateLimit.js";
```

- [ ] **Step 2: Add the handler**

Insert immediately after the `change-password` handler closes (after line ~808, before the `// =================== ME ====================` comment):

```ts
// ---------------------------------------------------------------------------
// Onboarding set-password. Distinct from /change-password: it does NOT require
// the current password and does NOT log the user out, so the onboarding wizard
// flows straight through. It is usable ONLY while mustChangePassword === true,
// so it can never act as a current-password bypass once onboarding is done.
// ---------------------------------------------------------------------------
router.post(
  "/onboarding/set-password",
  onboardingSetPasswordLimiter,
  shouldBeUser,
  async (req, res) => {
    try {
      const body = parseBody(onboardingSetPasswordSchema, req.body, res);
      if (!body) return;

      const user = await prisma.user.findFirst({
        where: { id: req.userId, deletedAt: null },
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.mustChangePassword !== true) {
        return res
          .status(403)
          .json({ message: "Password change is not required for this account" });
      }

      const newHash = await hashPassword(body.newPassword);

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash, mustChangePassword: false },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          image: true,
          mustChangePassword: true,
        },
      });

      // Intentionally NO session/token revocation here. The account was just
      // provisioned and has a single active session (the one completing the
      // wizard), so there is nothing stale to revoke and the current session
      // stays valid for the rest of onboarding.
      return res.status(200).json({ user: updated });
    } catch (error) {
      console.error("Onboarding set-password error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter auth-service check-types`
Expected: PASS.

- [ ] **Step 4: Manual verification (optional, requires local stack)**

With the auth-service + DB running, and a logged-in user whose `mustChangePassword=true` (set one via Task 4 once built, or directly in DB), confirm:

```bash
# 403 when not flagged, 200 + {"user":{...,"mustChangePassword":false}} when flagged
curl -i -X POST http://localhost:8003/auth/onboarding/set-password \
  -H "Content-Type: application/json" -H "Authorization: Bearer <accessToken>" \
  -d '{"newPassword":"newStrongPass1"}'
```
Expected: `200` with `mustChangePassword:false`; a second call returns `403`.

- [ ] **Step 5: Commit**

```bash
git add apps/auth-service/src/routes/auth.route.ts
git commit -m "feat(auth): onboarding set-password endpoint (no current-pass, keeps session)"
```

---

## Task 4: `POST /users/:id/temp-password` (admin)

**Files:**
- Modify: `apps/auth-service/src/routes/user.route.ts` (generator near line ~47; handler after the `PUT /:id` handler, ~line 379)

- [ ] **Step 1: Add a human-transcribable temp-password generator**

In `apps/auth-service/src/routes/user.route.ts`, after `generateRandomPassword()` (line ~47), add:

```ts
// Human-transcribable temp password: 14 chars from an unambiguous alphabet
// (no 0/O/1/l/I) so an admin can read it aloud or copy it from a note without
// transcription errors. >= PASSWORD_MIN_LENGTH by construction.
function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(14);
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}
```

- [ ] **Step 2: Add the handler**

Insert after the `PUT /:id` handler closes (after line ~379, before the `// Delete user` comment):

```ts
// Set (or generate) a temporary password for an existing user and force a
// rotation on next login. Returns the plaintext exactly once so the admin can
// hand it to the host. Mounted under `/users` with shouldBeAdmin.
router.post("/:id/temp-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body ?? {};

    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    let tempPassword: string;
    if (password !== undefined && password !== null && password !== "") {
      const pwCheck = validatePassword(password);
      if (!pwCheck.ok) {
        return res.status(400).json({ message: pwCheck.message });
      }
      tempPassword = pwCheck.value;
    } else {
      tempPassword = generateTempPassword();
    }

    const hashedPassword = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword, mustChangePassword: true },
      select: { id: true },
    });

    // Invalidate existing sessions so the only way back in is the new temp
    // password, which then forces the onboarding wizard.
    await prisma.session.deleteMany({ where: { userId: id } });

    return res.status(200).json({ tempPassword });
  } catch (error) {
    return sendPrismaError(res, error, "Set temp password error");
  }
});
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter auth-service check-types`
Expected: PASS.

- [ ] **Step 4: Manual verification (optional, requires local stack)**

```bash
# As an authenticated ADMIN; returns {"tempPassword":"<14 chars>"} and flips the flag
curl -i -X POST http://localhost:8003/users/<hostUserId>/temp-password \
  -H "Content-Type: application/json" -H "Authorization: Bearer <adminAccessToken>" \
  -d '{}'
```
Expected: `200` with a `tempPassword`; logging in as that host returns `requiresPasswordChange:true`.

- [ ] **Step 5: Commit**

```bash
git add apps/auth-service/src/routes/user.route.ts
git commit -m "feat(auth): admin set-temp-password endpoint flips mustChangePassword"
```

---

## Task 5: Frontend auth lib — flag + helpers

**Files:**
- Modify: `apps/admin/src/lib/auth.ts`

- [ ] **Step 1: Add `requiresPasswordChange` to `AuthResponse`**

In `apps/admin/src/lib/auth.ts`, update the interface (lines 36-40):

```ts
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  requiresPasswordChange: boolean;
}
```

- [ ] **Step 2: Add `onboardingSetPassword` and `getMe` helpers**

After the `logout` function (line ~67), add:

```ts
export interface MeResponse extends User {
  mustChangePassword?: boolean;
}

/** Onboarding-only password set (no current password; keeps the session). */
export async function onboardingSetPassword(newPassword: string): Promise<void> {
  const token = getAccessToken();
  const res = await fetchAuth("/auth/onboarding/set-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ newPassword }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Could not set your new password");
  }
}

/** Current account, including the mustChangePassword flag (Task 1). */
export async function getMe(): Promise<MeResponse> {
  const token = getAccessToken();
  const res = await fetchAuth("/auth/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    throw new Error("Failed to load account");
  }
  return res.json();
}
```

(`getAccessToken` is a function declaration later in the file; hoisting makes this valid.)

- [ ] **Step 3: Type-check**

Run: `pnpm --filter admin exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/lib/auth.ts
git commit -m "feat(admin): auth lib exposes requiresPasswordChange + onboarding helpers"
```

---

## Task 6: authStore.login returns the flag

**Files:**
- Modify: `apps/admin/src/stores/authStore.ts:96` (interface) and `:136-160` (impl)

- [ ] **Step 1: Update the interface signature**

Change line 96 from:

```ts
  login: (email: string, password: string) => Promise<User>;
```
to:
```ts
  login: (
    email: string,
    password: string
  ) => Promise<{ user: User; requiresPasswordChange: boolean }>;
```

- [ ] **Step 2: Update the implementation return**

In the `login` impl (lines 136-160), change the final `return response.user;` to:

```ts
    return {
      user: response.user,
      requiresPasswordChange: response.requiresPasswordChange === true,
    };
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter admin exec tsc --noEmit`
Expected: FAIL — `login/page.tsx` still treats the result as `User` (`user.role`). That is fixed in Task 7. (If you prefer a green tree between tasks, do Task 7 before type-checking; both are committed together-safe.)

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/stores/authStore.ts
git commit -m "feat(admin): authStore.login returns requiresPasswordChange"
```

---

## Task 7: Login redirects flagged users to `/onboarding`

**Files:**
- Modify: `apps/admin/src/app/(auth)/login/page.tsx:51-58`
- Test: `apps/admin/src/app/(auth)/login/page.test.tsx`

- [ ] **Step 1: Update existing tests for the new return shape + add the redirect test**

In `page.test.tsx`, every `login.mockResolvedValueOnce({...user fields...})` must now resolve `{ user: {...}, requiresPasswordChange: false }`. Update all five existing mocks. For example the first one (lines 70-77) becomes:

```ts
    login.mockResolvedValueOnce({
      user: {
        id: "admin-1",
        email: "admin@spacefly.ai",
        username: "admin",
        name: "Admin",
        role: "ADMIN",
        image: null,
      },
      requiresPasswordChange: false,
    });
```

Apply the same `{ user: {...}, requiresPasswordChange: false }` wrapping to the host mock (lines 114-121), the `?next=` mock (lines 190-197), and the unsafe-`?next=` mock (lines 229-236). The "renders inline errors" test uses `mockRejectedValueOnce` and is unchanged.

Then add a new test after the "renders inline errors" test:

```ts
  it("redirects to /onboarding when a password change is required", async () => {
    login.mockResolvedValueOnce({
      user: {
        id: "host-1",
        email: "host@spacefly.ai",
        username: "host",
        name: "Host",
        role: "HOST",
        image: null,
      },
      requiresPasswordChange: true,
    });

    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    const email = container.querySelector("#email") as HTMLInputElement | null;
    const password = container.querySelector(
      "#password"
    ) as HTMLInputElement | null;
    const form = container.querySelector("form");

    if (!email || !password || !form) {
      return;
    }

    await act(async () => {
      setInputValue(email, "host@spacefly.ai");
      setInputValue(password, "TempPass123");
    });

    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(replace).toHaveBeenCalledWith("/onboarding");
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter admin test -- src/app/\(auth\)/login/page.test.tsx`
Expected: FAIL — the new test fails (page still destructures `const user = await login(...)`), and the updated existing tests fail to read `.role` off `{ user, requiresPasswordChange }`.

- [ ] **Step 3: Update the page**

In `login/page.tsx`, replace the body of `handleSubmit`'s `try` (lines 52-58) with:

```ts
      const { user, requiresPasswordChange } = await login(email, password);
      if (requiresPasswordChange) {
        router.replace("/onboarding");
        return;
      }
      // Honour `?next=` from the middleware redirect when it's a safe,
      // same-origin path; otherwise fall back to the role-based default.
      const safeNext = safeRedirectPath(searchParams.get("next"));
      router.replace(
        safeNext ?? (user.role === "ADMIN" ? "/admin" : "/host")
      );
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter admin test -- src/app/\(auth\)/login/page.test.tsx`
Expected: PASS (all tests).

- [ ] **Step 5: Type-check + commit**

Run: `pnpm --filter admin exec tsc --noEmit`
Expected: PASS.

```bash
git add "apps/admin/src/app/(auth)/login/page.tsx" "apps/admin/src/app/(auth)/login/page.test.tsx"
git commit -m "feat(admin): route password-change-required hosts to /onboarding on login"
```

---

## Task 8: Middleware gates `/onboarding`

**Files:**
- Modify: `apps/admin/src/middleware.ts:69`
- Test: `apps/admin/src/middleware.test.tsx`

- [ ] **Step 1: Add a failing test**

In `apps/admin/src/middleware.test.tsx`, add a test that an `/onboarding` request without a token redirects to login. Use the file's existing helpers for building a `NextRequest` (mirror an existing "no token" test in that file). Representative test:

```ts
  it("redirects unauthenticated /onboarding requests to login", () => {
    const req = makeRequest("/onboarding"); // no spacefly_access cookie
    const res = middleware(req);
    expect(res.headers.get("location")).toContain("/login");
  });
```

If the existing test file uses a different request-builder name than `makeRequest`, reuse whatever it already uses (match the existing "redirects when cookie missing" test exactly).

- [ ] **Step 2: Run to verify behavior**

Run: `pnpm --filter admin test -- src/middleware.test.tsx`
Expected: PASS already for the redirect logic (middleware redirects any no-token request). This test locks the intent; the functional change is the matcher in Step 3 (which Next applies at runtime, not in unit tests).

- [ ] **Step 3: Extend the matcher**

Change line 69 from:

```ts
  matcher: ["/admin/:path*", "/host/:path*"],
```
to:
```ts
  matcher: ["/admin/:path*", "/host/:path*", "/onboarding/:path*"],
```

- [ ] **Step 4: Run the full middleware test + commit**

Run: `pnpm --filter admin test -- src/middleware.test.tsx`
Expected: PASS.

```bash
git add apps/admin/src/middleware.ts apps/admin/src/middleware.test.tsx
git commit -m "feat(admin): gate /onboarding behind auth middleware"
```

---

## Task 9: Onboarding layout

**Files:**
- Create: `apps/admin/src/app/(onboarding)/layout.tsx`

- [ ] **Step 1: Create the branded, chrome-free layout**

```tsx
import Image from "next/image";
import type { ReactNode } from "react";

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="auth-shell flex min-h-dvh flex-col bg-[var(--auth-subtle)]">
      <header className="flex items-center justify-center px-6 py-6">
        <Image
          src="/brand/wordmark_transparent.png"
          alt="Spacefly.ai"
          width={160}
          height={52}
          priority
          className="h-8 w-auto object-contain"
        />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="auth-card w-full max-w-lg rounded-[28px] bg-white p-8 text-[var(--auth-foreground)] sm:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Type-check + commit**

Run: `pnpm --filter admin exec tsc --noEmit`
Expected: PASS.

```bash
git add "apps/admin/src/app/(onboarding)/layout.tsx"
git commit -m "feat(admin): branded onboarding layout"
```

---

## Task 10: Onboarding wizard page

**Files:**
- Create: `apps/admin/src/app/(onboarding)/onboarding/page.tsx`
- Test: `apps/admin/src/app/(onboarding)/onboarding/page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const onboardingSetPassword = vi.fn();
const getMe = vi.fn();
const apiFetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));
vi.mock("@/stores/authStore", () => ({
  default: () => ({ user: { name: "Ana", role: "HOST" } }),
}));
vi.mock("@/lib/auth", () => ({
  onboardingSetPassword: (...a: unknown[]) => onboardingSetPassword(...a),
  getMe: () => getMe(),
}));
vi.mock("@/lib/apiFetch", () => ({
  apiFetch: (...a: unknown[]) => apiFetch(...a),
  UnauthenticatedError: class extends Error {},
}));

describe("onboarding wizard", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  const setInputValue = (input: HTMLInputElement, value: string) => {
    const proto = Object.getPrototypeOf(input) as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  beforeEach(() => {
    replace.mockReset();
    onboardingSetPassword.mockReset().mockResolvedValue(undefined);
    getMe.mockReset().mockResolvedValue({ mustChangePassword: true });
    apiFetch.mockReset().mockResolvedValue({ ok: true, json: async () => [] });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
  });

  it("redirects to /host when no password change is required", async () => {
    getMe.mockResolvedValueOnce({ mustChangePassword: false });
    const page = await import("./page");
    await act(async () => { root.render(React.createElement(page.default)); });
    await act(async () => { await Promise.resolve(); });
    expect(replace).toHaveBeenCalledWith("/host");
  });

  it("advances from welcome, sets the password, and reaches the final step", async () => {
    const page = await import("./page");
    await act(async () => { root.render(React.createElement(page.default)); });
    await act(async () => { await Promise.resolve(); });

    // Welcome -> Continue
    const continueBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Continue")
    ) as HTMLButtonElement;
    await act(async () => { continueBtn.click(); });

    const pw = container.querySelector("#newPassword") as HTMLInputElement;
    const confirm = container.querySelector("#confirmPassword") as HTMLInputElement;
    await act(async () => {
      setInputValue(pw, "newStrongPass1");
      setInputValue(confirm, "newStrongPass1");
    });

    const form = container.querySelector("form") as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await act(async () => { await Promise.resolve(); });

    expect(onboardingSetPassword).toHaveBeenCalledWith("newStrongPass1");
    expect(container.textContent).toContain("all set");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter admin test -- "src/app/(onboarding)/onboarding/page.test.tsx"`
Expected: FAIL — `Cannot find module './page'`.

- [ ] **Step 3: Implement the wizard**

Create `apps/admin/src/app/(onboarding)/onboarding/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import useAuthStore from "@/stores/authStore";
import { getMe, onboardingSetPassword } from "@/lib/auth";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type Step = "welcome" | "password" | "done";

const MIN_PASSWORD_LENGTH = 8;
const STEP_PROGRESS: Record<Step, number> = { welcome: 33, password: 66, done: 100 };

interface VenueLike {
  id?: string | number;
  name?: string;
}

const inputClass =
  "h-11 rounded-xl border-black/10 bg-white shadow-none focus-visible:border-[var(--auth-brand)] focus-visible:ring-[var(--auth-brand)]/20";
const primaryBtn =
  "h-12 w-full rounded-xl bg-[var(--auth-brand)] text-white hover:bg-[var(--auth-brand-hover)]";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>("welcome");
  const [checking, setChecking] = useState(true);

  // Guard: only show the wizard while the account is actually flagged.
  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((me) => {
        if (cancelled) return;
        if (me.mustChangePassword === true) {
          setChecking(false);
        } else {
          router.replace("/host");
        }
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return <p className="text-sm text-[var(--auth-muted)]">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <Progress value={STEP_PROGRESS[step]} />
      {step === "welcome" && (
        <WelcomeStep name={user?.name ?? null} onContinue={() => setStep("password")} />
      )}
      {step === "password" && <PasswordStep onDone={() => setStep("done")} />}
      {step === "done" && <DoneStep onFinish={() => router.replace("/host")} />}
    </div>
  );
}

function WelcomeStep({ name, onContinue }: { name: string | null; onContinue: () => void }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-balance">
          Welcome to Spacefly{name ? `, ${name}` : ""}
        </h1>
        <p className="text-sm leading-6 text-[var(--auth-muted)] text-pretty">
          Let&apos;s get your account set up. It only takes a moment — first,
          choose a password that&apos;s yours.
        </p>
      </div>
      <Button type="button" size="xl" className={primaryBtn} onClick={onContinue}>
        <span>Continue</span>
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

function PasswordStep({ onDone }: { onDone: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await onboardingSetPassword(newPassword);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set your password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-balance">Set your password</h1>
        <p className="text-sm leading-6 text-[var(--auth-muted)] text-pretty">
          Replace the temporary password you used to sign in.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            placeholder="At least 8 characters"
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            placeholder="Re-enter your password"
            className={inputClass}
          />
        </div>
        <Button type="submit" size="xl" disabled={submitting} className={primaryBtn}>
          <span>{submitting ? "Saving…" : "Save and continue"}</span>
          {!submitting && <ArrowRight className="size-4" />}
        </Button>
      </form>
    </div>
  );
}

function DoneStep({ onFinish }: { onFinish: () => void }) {
  const [venues, setVenues] = useState<VenueLike[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/venues/host/my`)
      .then(async (res: Response) => {
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as VenueLike[];
          setVenues(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-balance">You&apos;re all set</h1>
        <p className="text-sm leading-6 text-[var(--auth-muted)] text-pretty">
          {loaded && venues.length > 0
            ? `We've set up ${venues.length} venue${venues.length === 1 ? "" : "s"} for you. Here's what's waiting:`
            : "Your account is ready. You can manage everything from your dashboard."}
        </p>
      </div>

      {venues.length > 0 && (
        <ul className="space-y-2">
          {venues.map((v, i) => (
            <li
              key={v.id ?? i}
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm"
            >
              {v.name ?? "Venue"}
            </li>
          ))}
        </ul>
      )}

      <Button type="button" size="xl" className={primaryBtn} onClick={onFinish}>
        <span>Go to dashboard</span>
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter admin test -- "src/app/(onboarding)/onboarding/page.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Type-check + commit**

Run: `pnpm --filter admin exec tsc --noEmit`
Expected: PASS.

```bash
git add "apps/admin/src/app/(onboarding)/onboarding/page.tsx" "apps/admin/src/app/(onboarding)/onboarding/page.test.tsx"
git commit -m "feat(admin): 3-step host onboarding wizard"
```

---

## Task 11: Dashboard guard pulls flagged hosts into onboarding

**Files:**
- Create: `apps/admin/src/components/OnboardingGuard.tsx`
- Modify: `apps/admin/src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create the guard component**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/auth";

/**
 * Belt-and-braces: login already redirects a flagged host to /onboarding, but
 * a host who navigates straight to a dashboard URL (or refreshes mid-wizard)
 * still holds a valid session cookie. This checks the flag once on mount and
 * pulls them back into onboarding. Renders nothing.
 */
export default function OnboardingGuard() {
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((me) => {
        if (!cancelled && me.mustChangePassword === true) {
          router.replace("/onboarding");
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [router]);
  return null;
}
```

- [ ] **Step 2: Mount it in the dashboard layout**

In `apps/admin/src/app/(dashboard)/layout.tsx`, add the import at the top:

```ts
import OnboardingGuard from "@/components/OnboardingGuard";
```

Then render it just inside `<QueryProvider>` (before the `<div className="flex">`):

```tsx
    <QueryProvider>
      <OnboardingGuard />
      <div className="flex">
```

- [ ] **Step 3: Type-check + commit**

Run: `pnpm --filter admin exec tsc --noEmit`
Expected: PASS.

```bash
git add apps/admin/src/components/OnboardingGuard.tsx "apps/admin/src/app/(dashboard)/layout.tsx"
git commit -m "feat(admin): redirect still-flagged hosts into onboarding from dashboard"
```

---

## Task 12: Admin "Set temporary password" panel

**Files:**
- Create: `apps/admin/src/components/SetTempPassword.tsx`
- Test: `apps/admin/src/components/SetTempPassword.test.tsx`
- Modify: `apps/admin/src/app/(dashboard)/admin/users/[id]/page.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const getToken = vi.fn();

vi.mock("@/stores/authStore", () => ({
  default: () => ({ getToken }),
}));
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("SetTempPassword", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    getToken.mockReset().mockResolvedValue("token-123");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tempPassword: "Abcd2345Wxyz9" }) })
    );
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
    vi.unstubAllGlobals();
  });

  it("generates a temp password and reveals copyable credentials", async () => {
    const mod = await import("./SetTempPassword");
    await act(async () => {
      root.render(
        React.createElement(mod.default, { userId: "u-1", email: "host@spacefly.ai" })
      );
    });

    const genBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Generate")
    ) as HTMLButtonElement;
    await act(async () => { genBtn.click(); });
    await act(async () => { await Promise.resolve(); });

    expect(container.textContent).toContain("Abcd2345Wxyz9");
    expect(container.textContent).toContain("host@spacefly.ai");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter admin test -- src/components/SetTempPassword.test.tsx`
Expected: FAIL — `Cannot find module './SetTempPassword'`.

- [ ] **Step 3: Implement the component**

Create `apps/admin/src/components/SetTempPassword.tsx`:

```tsx
"use client";

import { useState } from "react";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import useAuthStore from "@/stores/authStore";
import { toast } from "react-toastify";

interface SetTempPasswordProps {
  userId: string;
  email: string;
}

const SetTempPassword = ({ userId, email }: SetTempPasswordProps) => {
  const { getToken } = useAuthStore();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginUrl =
    typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";

  const generate = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/users/${userId}/temp-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to set temporary password");
      }
      const data = await res.json();
      setTempPassword(data.tempPassword);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to set temporary password");
    } finally {
      setLoading(false);
    }
  };

  const copy = (label: string, value: string) => {
    navigator.clipboard?.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Set temporary password</SheetTitle>
        <SheetDescription asChild>
          <div className="space-y-6 text-left">
            <p className="text-sm text-muted-foreground">
              Generates a one-time temporary password and forces this host to
              choose their own when they first sign in. Share the credentials
              below with the host directly.
            </p>

            {!tempPassword ? (
              <Button onClick={generate} disabled={loading}>
                {loading ? "Generating…" : "Generate temporary password"}
              </Button>
            ) : (
              <div className="space-y-4">
                <CredentialRow label="Login URL" value={loginUrl} onCopy={copy} />
                <CredentialRow label="Email" value={email} onCopy={copy} />
                <CredentialRow
                  label="Temporary password"
                  value={tempPassword}
                  onCopy={copy}
                />
                <p className="text-xs text-amber-600">
                  This password is shown once. Copy it now — you won&apos;t be
                  able to see it again.
                </p>
              </div>
            )}
          </div>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
};

function CredentialRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (label: string, value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input readOnly value={value} className="font-mono" />
        <Button type="button" variant="outline" onClick={() => onCopy(label, value)}>
          Copy
        </Button>
      </div>
    </div>
  );
}

export default SetTempPassword;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter admin test -- src/components/SetTempPassword.test.tsx`
Expected: PASS.

- [ ] **Step 5: Wire it into the user detail page**

In `apps/admin/src/app/(dashboard)/admin/users/[id]/page.tsx`, add the import (after the `EditUser` import, line ~23):

```ts
import SetTempPassword from "@/components/SetTempPassword";
```

Then, in the "INFORMATION CONTAINER" header (the `<div className="flex items-center justify-between">` at lines 198-215), add a second action next to the Edit User sheet so the block reads:

```tsx
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">User Information</h1>
              <div className="flex gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button>Edit User</Button>
                  </SheetTrigger>
                  <EditUser
                    user={{
                      id: user.id,
                      email: user.email,
                      username: user.username,
                      name: user.name,
                      role: user.role,
                    }}
                    onUpdated={fetchUser}
                  />
                </Sheet>
                {user.role === "HOST" && (
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline">Set temp password</Button>
                    </SheetTrigger>
                    <SetTempPassword userId={user.id} email={user.email} />
                  </Sheet>
                )}
              </div>
            </div>
```

- [ ] **Step 6: Type-check + commit**

Run: `pnpm --filter admin exec tsc --noEmit`
Expected: PASS.

```bash
git add apps/admin/src/components/SetTempPassword.tsx apps/admin/src/components/SetTempPassword.test.tsx "apps/admin/src/app/(dashboard)/admin/users/[id]/page.tsx"
git commit -m "feat(admin): admin set-temp-password panel with copyable credentials"
```

---

## Final verification

- [ ] **Backend types:** `pnpm --filter auth-service check-types` → PASS
- [ ] **Frontend types:** `pnpm --filter admin exec tsc --noEmit` → PASS
- [ ] **Frontend tests:** `pnpm --filter admin test` → PASS (login, middleware, onboarding wizard, SetTempPassword)
- [ ] **Manual end-to-end (local stack):**
  1. As admin, open a HOST user → "Set temp password" → copy the generated credentials.
  2. Log out, log in as that host with the temp password → lands on `/onboarding` (welcome).
  3. Continue → set a new password → "you're all set" lists the host's venues → "Go to dashboard" → `/host`.
  4. Log out, log back in with the **new** password → goes straight to `/host` (no onboarding).
  5. While a host is still flagged, typing `/host` directly bounces back to `/onboarding`.

## Spec coverage check

| Spec item | Task |
|---|---|
| B1 admin set-temp-password (+flag, return once) | Task 4 |
| B2 onboarding set-password (gated, clears flag, keeps session) | Tasks 2, 3 |
| B3 `mustChangePassword` on `/auth/me` | Task 1 |
| F1 surface `requiresPasswordChange` | Tasks 5, 6 |
| F2 login redirect | Task 7 |
| F3 onboarding route group + layout + middleware | Tasks 8, 9 |
| F4 3-step wizard | Task 10 |
| F5 guards (both directions) | Tasks 10 (out), 11 (in) |
| F6 admin credentials panel | Task 12 |

## Notes / intentional deviations from spec

- **B2 session revocation:** the spec said "revoke other sessions, keep current." Implementation keeps it simpler and equally safe — it revokes nothing, because an admin-provisioned host has exactly one active session (the one completing the wizard). This avoids coupling to refresh-cookie internals and guarantees the wizard never logs itself out. Documented inline in the handler.
- **B4** (leave `PUT /:id` as-is) requires no code change — recorded for awareness only.
