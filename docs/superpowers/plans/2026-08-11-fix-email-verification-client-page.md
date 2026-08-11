# Fix Email Verification Client Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the verification link in signup emails actually mark the user as verified so new clients can sign in and request a booking.

**Architecture:** Backend already works (`GET/POST /auth/verify-email` + Kafka email with `?token=`). Emails point at `EMAIL_VERIFICATION_LINK_BASE` = `https://spacefly.ai/verify-email`. The client app has no page at that route, so the token is never sent to auth-service. Add a client page that reads `token` and calls the API; improve login UX for `EMAIL_NOT_VERIFIED` with resend.

**Tech Stack:** Next.js client (`apps/client`), auth-service, next-intl messages (en/ro/ru)

---

## Root cause (confirmed)

| Layer | Status |
|-------|--------|
| Register emits `user.email-verification-requested` | ✅ works |
| email-service builds `EMAIL_VERIFICATION_LINK_BASE?token=…` | ✅ works |
| Link base = `https://spacefly.ai/verify-email` | ✅ configured |
| Client page `/verify-email` | ❌ **missing** |
| Auth API `GET /auth/verify-email?token=` sets `emailVerified=true` | ✅ works (API-only e2e) |
| Login blocks unverified with `EMAIL_NOT_VERIFIED` | ✅ works (matches screenshot) |

User flow break: click email link → land on site → nothing calls API → sign in → red error.

---

## Files

| Action | Path |
|--------|------|
| Create | `apps/client/src/app/[locale]/(auth)/verify-email/page.tsx` |
| Create | `apps/client/src/app/verify-email-page.test.mjs` |
| Modify | `apps/client/src/lib/auth.ts` — `verifyEmail`, `resendVerification`, structured `AuthApiError` |
| Modify | `apps/client/src/app/[locale]/(auth)/login/page.tsx` — resend on unverified |
| Modify | `apps/client/messages/{en,ro,ru}.json` — copy for verify + resend |
| Modify | `apps/auth-service/src/routes/auth.route.ts` — normalize email on resend |

---

### Task 1: Auth client helpers

**Files:**
- Modify: `apps/client/src/lib/auth.ts`

- [ ] **Step 1: Add `AuthApiError` + helpers**

```ts
export class AuthApiError extends Error {
  readonly code?: string;
  readonly status: number;
  constructor(message: string, opts?: { code?: string; status?: number }) {
    super(message);
    this.name = "AuthApiError";
    this.code = opts?.code;
    this.status = opts?.status ?? 0;
  }
}

export async function verifyEmail(token: string): Promise<{ message: string; emailVerified: boolean }> {
  const res = await fetchAuth(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: "GET",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new AuthApiError(error.message || "Verification failed", {
      code: error.code,
      status: res.status,
    });
  }
  return res.json();
}

export async function resendVerification(email: string): Promise<void> {
  const res = await fetchAuth("/auth/resend-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new AuthApiError(error.message || "Could not resend verification email", {
      status: res.status,
    });
  }
}
```

- [ ] **Step 2: Update `login` to throw `AuthApiError` with `code` when present**

Preserve `code: "EMAIL_NOT_VERIFIED"` so the login page can show resend.

---

### Task 2: Verify-email page

**Files:**
- Create: `apps/client/src/app/[locale]/(auth)/verify-email/page.tsx`

- [ ] **Step 1: Client page under auth layout**

Behavior:
1. On mount, read `token` from `window.location.search` (localePrefix is `never`, so URL is `/verify-email?token=…`).
2. If missing → error state "link is invalid".
3. If present → `verifyEmail(token)` once.
4. Success → message + link to `/login`.
5. Failure (invalid/expired) → message + link to login with resend guidance.
6. Use Suspense-friendly pattern or plain client `useEffect` (token only needed client-side).

Match existing auth card styling from login/register.

---

### Task 3: Login resend UX

**Files:**
- Modify: `apps/client/src/app/[locale]/(auth)/login/page.tsx`

- [ ] **Step 1: On `AuthApiError` with `code === "EMAIL_NOT_VERIFIED"`**

Show error banner + "Resend verification email" button that calls `resendVerification(email)` and shows a neutral success toast/message.

---

### Task 4: i18n

**Files:**
- Modify: `apps/client/messages/en.json`, `ro.json`, `ru.json`

Keys under `auth`:
- `verifyEmailTitle`, `verifyEmailChecking`, `verifyEmailSuccess`, `verifyEmailSuccessHint`
- `verifyEmailMissingToken`, `verifyEmailFailed`, `verifyEmailGoToLogin`
- `emailNotVerified`, `resendVerification`, `resendingVerification`, `resendVerificationSent`

---

### Task 5: Auth-service resend normalize

**Files:**
- Modify: `apps/auth-service/src/routes/auth.route.ts` resend handler

- [ ] Use `normalizeEmail(email)` before `findFirst` so mixed-case addresses still match.

---

### Task 6: Contract test

**Files:**
- Create: `apps/client/src/app/verify-email-page.test.mjs`

- [ ] Assert page source calls `/auth/verify-email` and reads `token` query param (same style as other client `.test.mjs` source-contract tests).

Run: `node --test apps/client/src/app/verify-email-page.test.mjs`

---

### Task 7: Commit, push, PR

- [ ] Commit on `fix/email-verification-client-page`
- [ ] Push and open PR into `main`
- [ ] After merge: deploy client (and auth-service if resend normalize ships) per project deploy process
- [ ] Clean worktree after merge

---

## Manual verification (prod/staging)

1. Register a new client account → receive verification email.
2. Click link → land on `/verify-email?token=…` → success message.
3. Sign in with same credentials → reaches dashboard / booking flow (no `EMAIL_NOT_VERIFIED`).
4. Optional: register again, skip email, try login → resend works and new link verifies.

## Out of scope

- Password-reset client page (admin link base; separate bug if missing).
- Forcing re-login after register when verification is enforced (register still issues tokens today).
