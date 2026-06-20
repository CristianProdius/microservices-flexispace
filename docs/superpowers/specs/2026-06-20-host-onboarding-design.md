# Host Onboarding Flow — Design

**Date:** 2026-06-20
**Status:** Approved (pending spec review)
**Author:** Cristian + Claude

## Problem

We onboard venue hosts manually: we visit a venue, propose they use the platform,
and want to hand them **their email + a temporary password** so they can log in,
set their own password, and start using the app. Today this flow does not exist
end to end:

- **No admin entry point.** The only way to set a password in the admin UI is the
  generic "Add User" sheet (`apps/admin/src/components/AddUser.tsx`). The "Edit User"
  form has no password field, so there is no way to issue/reset a temp password on an
  existing host, and nothing surfaces the credentials to hand over.
- **The flag is never acted on.** The backend login response already returns
  `requiresPasswordChange` (`apps/auth-service/src/routes/auth.route.ts:360,374`),
  but no frontend reads it. A flagged user is granted a full session and dropped on
  the dashboard like anyone else.
- **No way to change a temp password as the invited host.** `POST /auth/change-password`
  (`auth.route.ts:730`) requires the *current* password, wipes the session (forcing a
  re-login mid-flow), and does **not** clear `mustChangePassword`. There is no
  frontend page for it.
- **No onboarding UI** of any kind.

### Production reality (verified 2026-06-20 against prod DB)

10 HOST users exist. 9 are script-seeded test hosts
(`scripts/import-chisinau-spaces.ts`) with alias emails (`hosts+<slug>@spacefly.ai`),
a random unknowable bcrypt password, and `mustChangePassword = false`. 1 is a real
host (`florinsfp@gmail.com`). **All 10 have `mustChangePassword = false`.** The
seeded hosts cannot log in and would not trigger onboarding even if they could. The
seeded hosts are throwaway test data; the design targets **real hosts going forward**,
with a path to re-issue a temp password for any existing host.

## Goals

1. An admin can create a host (real email) OR re-issue a temp password for an existing
   host, in one capability that **sets `mustChangePassword: true`** and **shows
   copyable credentials** (email + temp password + login URL) to hand over.
2. When that host logs in, they are routed into a polished, ElevenLabs-style
   onboarding wizard instead of straight to the dashboard.
3. The wizard requires them to set a new password (clearing the flag) **without
   logging them out mid-flow**, then orients them and drops them in the app.
4. The flag cannot be bypassed by navigating directly to a dashboard URL.

## Non-goals (YAGNI)

- Profile collection (name/photo/phone) during onboarding — hosts are pre-configured.
- Product tour / feature checklist.
- Venue creation or venue-assignment UI — venues are pre-created/assigned out of band.
- Automated invite email — credentials are handed over manually (host emails are
  often aliases, not the host's real inbox).
- The public-facing `forgot-password` / `reset-password` UI (backend exists, frontend
  missing) — tracked separately; not part of this onboarding work.

## Flow (end to end)

1. **Admin issues credentials.** On the user detail page (`admin/users/[id]`), or via a
   "Create host" action, the admin sets/generates a temp password. Backend sets the
   hash + `mustChangePassword: true` and returns the plaintext **once**. UI shows
   copyable email + temp password + login URL.
2. **Admin hands credentials to the host** out of band (in person / message).
3. **Host logs in** at `admin.spacefly.ai` with email + temp password. Login response
   includes `requiresPasswordChange: true`.
4. **Frontend routes to `/onboarding`** instead of the dashboard.
5. **Wizard:** Welcome → Set new password (clears flag, keeps session) → "You're all
   set / your venues" → dashboard.

## Backend changes (`apps/auth-service`)

### B1. New: `POST /users/:id/temp-password` (admin only)
Sets a temporary password on an existing user and flags it for rotation.
- Auth: same admin guard as other `/users` mutations.
- Body: `{ password?: string }`. If omitted, the server generates a strong, human-
  transcribable temp password (e.g. ~12 chars) and returns it.
- Effect (single transaction): `password = hash(temp)`, `mustChangePassword = true`.
  Revoke the target user's existing sessions/refresh tokens (they must use the new temp
  password). Does **not** touch the acting admin's session.
- Response: `{ tempPassword: string }` (plaintext, returned once, never logged).
- Rate-limited; audit-logged consistent with existing `/users` mutations.

### B2. New: `POST /auth/onboarding/set-password` (authenticated host)
The wizard's password step. Distinct from `change-password` because it must not
require the old password and must not log the user out.
- Auth: `shouldBeUser`. **403 unless `req.user.mustChangePassword === true`** (so it
  can only ever be used during onboarding — it is not a current-password bypass).
- Body: `{ newPassword: string }`. Validation reuses the existing password rules
  (min length, etc. — see `MIN_PASSWORD_LENGTH` in `auth.route.ts`).
- Effect (single transaction): `password = hash(newPassword)`,
  `mustChangePassword = false`. Revoke **other** sessions/refresh tokens for safety but
  **keep the caller's current session/access token valid** so the wizard continues.
- Response: `200` with `{ user }` (the refreshed user, `mustChangePassword: false`) so
  the client updates state in place. No forced re-login.
- Rate-limited.

### B3. Expose the flag on `GET /auth/me`
Add `mustChangePassword` to the select block (`auth.route.ts:817-832`) so the wizard
and route guards can re-check the flag after a reload (the login response is transient).

### B4. (Optional, defensive) Keep `PUT /users/:id` honest
`PUT /users/:id` currently clears `mustChangePassword` when an admin sets a password
(`user.route.ts:352-355`). The admin "Edit User" UI sends no password, so this is not
hit today, but B1 is now the sanctioned path. Leave `PUT` as-is; do **not** route temp
passwords through it. (Noted to avoid a future regression.)

## Frontend changes (`apps/admin`)

### F1. Surface `requiresPasswordChange`
- Extend `AuthResponse` and `User` in `apps/admin/src/lib/auth.ts` to include the flag
  (login already returns it on the wire; the client currently discards it).
- `authStore.login` returns/propagates it.

### F2. Login redirect
In `apps/admin/src/app/(auth)/login/page.tsx` (the existing post-login redirect at
~lines 52-58): if `requiresPasswordChange` is true, `router.replace("/onboarding")`
(ahead of the `next`/role-based redirect).

### F3. Onboarding route group + layout
New route group `apps/admin/src/app/(onboarding)/` with its own minimal, branded
full-screen `layout.tsx` (no dashboard sidebar). Reuse the auth brand tokens
(`--auth-brand`), the wordmark (`public/brand/`), and the auth card styling so it
matches the login page. Extend the `middleware.ts` matcher (`middleware.ts:69`) to
include `/onboarding/:path*` so the route is auth-gated at the edge.

### F4. Wizard page `/onboarding`
A single `"use client"` page driving a 3-step state machine with a progress indicator
(shadcn `Progress`/`Card`/`Button`/`Input`/`Label`/`Form`):
- **Step 1 — Welcome:** "Welcome to Spacefly, {name} — let's get your account set up."
  → Continue.
- **Step 2 — Set password (required):** new password + confirm, with strength/match
  validation matching the login page's input/button styling. Submits to
  `POST /auth/onboarding/set-password`; on success advances **without logout**.
- **Step 3 — You're all set:** fetch `GET /venues/host/my` (product-service, via
  `apiFetch`); show "We've set up N venue(s) for you" as cards; "Go to dashboard" → `/host`.

### F5. Guards
- The onboarding page checks `GET /auth/me`; if `mustChangePassword` is already false,
  redirect to `/host` (don't show the wizard to onboarded users).
- The dashboard layout (`(dashboard)/layout.tsx`) redirects a still-flagged host into
  `/onboarding`, so the wizard can't be skipped by typing a dashboard URL directly.

### F6. Admin "Set temporary password" UI
On `admin/users/[id]` (and/or a "Create host" path), an action that calls B1, then
displays a copyable panel: **email**, **temp password**, and the **login URL**
(`https://admin.spacefly.ai/login`). Make it explicit the temp password is shown only
once. For creating a brand-new host, the existing "Add User" sheet already sets the
flag; the credentials panel is the new, valuable part.

## Data model

No schema change. `mustChangePassword` already exists on the User model
(`packages/db/prisma/schema.prisma:89`, default `false`). B1 sets it true; B2 sets it
false.

## Security considerations

- B2 is gated on `mustChangePassword === true`, so it cannot be used as a
  current-password bypass once onboarding is complete.
- Temp passwords are returned exactly once and never logged; generated temp passwords
  are strong.
- B1 and B2 revoke prior sessions appropriately (B1: target's sessions; B2: the host's
  other sessions, keeping the current one).
- All new endpoints are rate-limited consistent with existing auth/user routes.

## Testing

- **Backend:** B1 sets hash + flag + returns plaintext + revokes target sessions; B2
  rejects when flag is false (403), succeeds when true (clears flag, keeps current
  session, revokes others), validates password rules; `/auth/me` returns the flag.
- **Frontend:** login with a flagged user redirects to `/onboarding`; wizard step 2
  clears the flag and stays logged in; step 3 lists venues; guards redirect both
  directions (flagged → onboarding, unflagged → dashboard).

## Open questions

None blocking. (Future: wire an automated invite email once hosts reliably have real
inboxes; build the public forgot/reset-password UI.)
