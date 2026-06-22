# Host Invite Flow — Design

**Date:** 2026-06-22
**Status:** Approved (pending spec review)
**Author:** Cristian + Claude

## Problem

As a platform admin we want to **create a venue for a host and invite that host to the
platform**, ideally in one flow. Today the building blocks exist but there is no real
"invite": it is three disconnected manual steps and no email is ever sent.

- **No email invite at all.** The only way a created host gets access is
  `POST /users/:id/temp-password` (`apps/auth-service/src/routes/user.route.ts:397-437`),
  which returns a plaintext temp password in the HTTP response for the admin to **copy
  and hand over out-of-band** (`apps/admin/src/components/SetTempPassword.tsx`). The
  lead-host route `POST /users/hosts/lead` (`user.route.ts:141-201`) creates a HOST with
  an intentionally unusable random password and emits no event; its own modal says the
  lead *"cannot log in until you send them an invite"* (`CreateLeadHostModal.tsx:93-96`).
- **Venue creation has no host picker.** `createVenue`
  (`apps/product-service/src/controllers/venue.controller.ts:241-304`) takes no `hostId`
  in the body; the host is whoever the admin is "acting as" via the `X-Acting-Host-Id`
  header (`packages/auth-middleware/src/express.ts:136-171`), set by the global
  `HostSwitcher`. Easy to attach a venue to the wrong host.
- **No single create-venue + invite-host action.** The three steps live in three places
  (HostSwitcher modal, venue form, user-detail temp-password page).
- **Email-verification gap.** Prod runs with `ENFORCE_EMAIL_VERIFICATION=true`, but
  admin-created users get `emailVerified=false` and never receive a verification email
  (only self-registration does), so login 403s `EMAIL_NOT_VERIFIED`
  (`auth.route.ts:331`). Admin-created hosts currently can't log in until `emailVerified`
  is flipped manually.

### Production reality (verified 2026-06-22)

Email is sent via **Resend** (`apps/email-service`, HTTP API, not SMTP); the service
subscribes to `user.created`, `user.email-verification-requested`,
`user.password-reset-requested`, and `booking.*`. Prod has `KAFKA_ENABLED=true` and a
verified `RESEND_FROM_EMAIL`. The temp-password and lead-host paths deliberately bypass
email. There is **no `invite` endpoint, token, or email anywhere** in the repo.

## Goals

1. An admin can **invite a host by email** — the host receives a secure one-time
   **magic link**, clicks it, sets their own password, and is logged in. No password in
   the email.
2. Accepting an invite **sets `emailVerified=true`**, closing the verification gap so
   invited hosts can actually log in.
3. From the **venue creation screen** the admin can assign the venue to an **existing
   host or create + invite a new one inline**, and the venue is saved with an explicit
   `hostId`.
4. A resendable **"Send invite"** action exists on the host/user detail page, alongside
   the existing **Set temp password** kept as an offline fallback.
5. The invite mechanism is **role-agnostic** (works for any user role) so it can later
   serve admin invites; the UI entry points are host/venue-focused for now.

## Non-Goals (YAGNI)

- No bulk invites, invite-management dashboard, or invite analytics.
- No SMS / alternate channels.
- No new host-search endpoint — reuse `GET /users?role=HOST`.
- No change to the existing onboarding wizard (invite accept reuses the same
  "set your own password" outcome and lands the user in the app).

## Approach

**Token storage — dedicated `Invite` model (recommended over reusing password-reset
plumbing).** An invite is semantically distinct from a reset (first-time access, sets
`emailVerified`, carries inviter/role context, is auditable). A dedicated model keeps it
clean and role-agnostic. We store a **hash** of the token and email the raw token in the
link (same best practice as password reset).

### Architecture overview

```
Admin UI                       auth-service                 email-service        DB
--------                       ------------                 -------------        --
[Invite host] ───────────────▶ POST /users/:id/invite ────▶ (Kafka user.invited)─▶ sends   Invite row
[Venue form: new host] ──────▶ POST /users/host-invite ───▶ (Kafka user.invited)─▶ email    (tokenHash)
                                  │ find-or-create HOST
                                  ▼
[Accept-invite page] ◀── magic link (INVITE_LINK_BASE?token=...)
   └─ GET /auth/invite/:token  (validate, show email/name)
   └─ POST /auth/invite/accept (set password, emailVerified=true, session)
[Venue form submit] ─────────▶ POST /venues  { ...venue, hostId }  (admin may set hostId)
```

### 1. `apps/auth-service` (+ `packages/db`)

**New Prisma model `Invite`** (`packages/db/prisma/schema.prisma`):

| field         | type      | notes                                             |
|---------------|-----------|---------------------------------------------------|
| `id`          | String cuid | PK                                              |
| `userId`      | String    | FK → User (cascade on delete)                     |
| `tokenHash`   | String    | sha-256 of raw token; **unique**, indexed         |
| `email`       | String    | snapshot of invited email                         |
| `role`        | Role      | snapshot of intended role                         |
| `invitedById` | String?   | FK → User (the admin)                             |
| `expiresAt`   | DateTime  | default now + 7 days                              |
| `acceptedAt`  | DateTime? | null until accepted                               |
| `createdAt`   | DateTime  | default now()                                     |

Index `@@index([userId])`. Add `invites Invite[]` relation to `User`.

**Endpoints:**

- `POST /users/:id/invite` — **admin-only** (mounted under existing `shouldBeAdmin`
  `/users`). Generates a raw token, deletes any prior unaccepted invite for that user,
  inserts an `Invite`, emits Kafka `user.invited` `{ email, name, token, role }`. Returns
  `{ inviteUrl, expiresAt }` so the admin can copy the link as a fallback. Rate-limited.
- `POST /users/host-invite` — **admin-only**. Body `{ name, email }`. Find-or-create a
  HOST by normalized email (reusing lead-host creation semantics: `hostVerified=true`,
  `mustChangePassword=true`, unusable random password). Then create the invite + emit
  event as above. Returns `{ userId, inviteUrl, created }`. Used by the venue form's
  "new host" path.
- `GET /auth/invite/:token` — **public**. Looks up by `tokenHash`; returns
  `{ valid, email, name }` (or `{ valid:false, reason }` for expired/used/unknown). Drives
  the accept page render. No auth.
- `POST /auth/invite/accept` — **public, rate-limited** (new limiter, mirror
  `onboardingSetPasswordLimiter`). Body `{ token, newPassword }` (newPassword validated by
  existing `passwordSchema`). On valid unexpired unused token: set the user's bcrypt
  password, `mustChangePassword=false`, **`emailVerified=true`**, set `Invite.acceptedAt`,
  delete the user's existing sessions, issue and return a fresh session (cookies +
  tokens) like login. Idempotency: an already-accepted/expired token returns a clear 4xx.

**Token:** `crypto.randomBytes(32)` → base64url raw token; `tokenHash = sha256(raw)`.
Only the hash is stored. Reuse `hashPassword` (`packages/auth-middleware`) for the
password.

### 2. `apps/email-service`

- Subscribe to new Kafka topic **`user.invited`** → build the link
  `INVITE_LINK_BASE + "?token=" + token` and send via Resend with a new host-friendly
  template (welcome + "Accept your invitation" CTA). New required env
  **`INVITE_LINK_BASE`** (e.g. `https://admin.spacefly.ai/accept-invite`), added to
  `getEmailConfigErrors()`, `docker-compose.yml`, and `.env.example`. Best-effort send;
  failures logged, not fatal to the producer.

### 3. `apps/product-service`

- `createVenue` accepts an **optional `hostId`** in the request body. If present **and**
  the caller is ADMIN, validate it resolves to an active HOST/ADMIN and use it as the
  venue's `hostId`; otherwise fall back to the existing acting-host/`req.userId`. Keeps
  the impersonation path working while enabling explicit assignment. Validation mirrors
  `resolveActingHost`'s target check.

### 4. `apps/admin`

- **`HostField`** component on the venue form (`components/venues/venue-form.tsx`):
  async-search existing hosts via `GET /users?role=HOST`, **or** "New host" (name +
  email). Submit flow in `app/(dashboard)/host/venues/new/page.tsx`:
  1. If "new host": `POST /users/host-invite` → `{ userId }`.
  2. `POST /venues` with explicit `hostId` (selected or new).
  3. Toast confirming venue created + invite emailed.
- **Host/user detail page** (`app/(dashboard)/admin/users/[id]/page.tsx`): add
  **"Send invite (email link)"** button → `POST /users/:id/invite`; show success toast
  with the copyable `inviteUrl` as fallback; resendable. Keep `SetTempPassword`.
- **New public page `/accept-invite`** (in the `(auth)` group, no auth guard; extend
  `middleware.ts` matcher): read `?token`, call `GET /auth/invite/:token` to render the
  invitee's email/name (or an "invalid/expired" state), show a set-password form, call
  `POST /auth/invite/accept`, then redirect into the app (dashboard/host).

### Data flow (happy path — create venue + invite new host)

1. Admin fills venue form, picks "New host", enters name + email, submits.
2. Admin app `POST /users/host-invite` → auth-service find-or-creates HOST, writes
   `Invite`, emits `user.invited` → email-service sends magic link. Returns `userId`.
3. Admin app `POST /venues { ...venue, hostId: userId }` → venue saved for that host.
4. Host receives email, clicks link → `/accept-invite?token=...` → sets password →
   `POST /auth/invite/accept` sets password + `emailVerified=true`, returns session →
   host lands in the app, sees their venue.

### Error handling

- Invalid/expired/used token: `GET /auth/invite/:token` returns `valid:false`; accept
  page shows a friendly "this invite is no longer valid — ask your admin to resend".
- `POST /auth/invite/accept` on bad token → 400/410; weak password → 400 (existing
  `passwordSchema` message); rate-limit exceeded → 429.
- `host-invite` with an email that already exists as a non-host → 409 with a clear
  message (don't silently change someone's role).
- Email send failure does not fail the admin call (best-effort, logged); admin still
  gets `inviteUrl` to relay manually.
- Venue `hostId` that isn't an active HOST/ADMIN → 400, venue not created.

### Testing

- **`apps/admin` (Vitest):** unit/flow tests for `HostField` (search + new-host paths),
  the invite button (calls endpoint, shows toast/url), and the `/accept-invite` page
  (valid/invalid token states, submit → redirect). Mock the API layer.
- **`apps/auth-service`, `apps/email-service`:** no test harness exists (per project
  history); verify with `pnpm check-types` plus targeted manual verification against a
  local stack. The implementation plan will decide whether to stand up a minimal Vitest
  harness for the new invite endpoints or keep type-check-only; default is type-check +
  manual to match the existing onboarding work.
- **Migration:** `Invite` table via Prisma migrate; verify `prisma migrate deploy` is
  clean on a schema that already has the onboarding columns.

## Open questions for the plan

- Minimal test harness for auth-service invite endpoints vs. type-check-only.
- Whether `host-invite` should live in auth-service or be split (auth creates user,
  product-service owns venue) — current design keeps user creation in auth-service and
  has the admin app orchestrate the two calls.
