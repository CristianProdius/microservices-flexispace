# Host Invite Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a platform admin invite hosts via a secure emailed magic link (set-password + emailVerified on accept) and assign venues to a specific host, including create+invite inline from the venue form.

**Architecture:** Dedicated Invite model + token endpoints in auth-service; user.invited Kafka topic + Resend template in email-service; explicit hostId on venue creation in product-service; admin UI HostField, invite button, and public /accept-invite page.

**Tech Stack:** TypeScript, Express (auth/product/email services), Prisma/Postgres, KafkaJS, Resend, Next.js (admin), Vitest.

---

## File Structure

**packages/db (Prisma schema + client):**
- `packages/db/prisma/schema.prisma` — add `Invite` model + `User.invites` back-relation.
- `packages/db/prisma/migrations/20260622120000_add_invite/migration.sql` — create the `Invite` table, indexes, FK.
- `packages/db/src/index.ts` — re-export the `Invite` type from `@repo/db`.
- `packages/db/generated/prisma/*` — regenerated Prisma client (committed, do not hand-edit).

**apps/auth-service (routes/validation/rate-limit/kafka/session):**
- `apps/auth-service/src/utils/inviteToken.ts` — token generation/hash helpers + `INVITE_TTL_DAYS`.
- `apps/auth-service/src/utils/validation.ts` — `acceptInviteSchema` + `hostInviteSchema`.
- `apps/auth-service/src/utils/rateLimit.ts` — `acceptInviteLimiter`.
- `apps/auth-service/src/routes/auth.route.ts` — public `GET /auth/invite/:token` + `POST /auth/invite/accept`.
- `apps/auth-service/src/routes/user.route.ts` — admin `POST /users/:id/invite` + `POST /users/host-invite` + `buildInviteUrl`.
- `apps/auth-service/.env.example` — document `INVITE_LINK_BASE`.

**apps/email-service (kafka subscribe + Resend mailer + config):**
- `apps/email-service/src/index.ts` — `INVITE_LINK_BASE` readiness gate, `inviteLinkFor` builder, `user.invited` subscriber.
- `apps/email-service/.env.example` — refresh all three link-base envs.

**apps/product-service (createVenue + acting host):**
- `apps/product-service/src/controllers/venue.controller.ts` — accept ADMIN-set `body.hostId` on createVenue.
- `apps/product-service/src/controllers/venue.controller.test.ts` — tests for the body.hostId paths.

**apps/admin (api layer, venue-form, user detail, public accept page):**
- `apps/admin/src/lib/invites.ts` — `inviteUser`, `createHostInvite`, `getInvite`, `acceptInvite`, `searchHosts`.
- `apps/admin/src/lib/invites.test.ts` — API-layer tests.
- `apps/admin/src/components/venues/HostField.tsx` — existing/new host picker.
- `apps/admin/src/components/venues/HostField.test.tsx` — HostField tests.
- `apps/admin/src/components/venues/venue-form.shared.ts` — add optional `hostId` to `VenueFormPayload`.
- `apps/admin/src/components/venues/venue-form.tsx` — render the optional `hostField` slot.
- `apps/admin/src/app/(dashboard)/host/venues/new/page.tsx` — orchestrate host-invite + hostId on create.
- `apps/admin/src/components/SendInvite.tsx` — resendable "Send invite" sheet.
- `apps/admin/src/components/SendInvite.test.tsx` — SendInvite tests.
- `apps/admin/src/app/(dashboard)/admin/users/[id]/page.tsx` — mount `SendInvite` for HOST users.
- `apps/admin/src/app/(auth)/accept-invite/page.tsx` — public set-password accept page.
- `apps/admin/src/app/(auth)/accept-invite/page.test.tsx` — accept-page tests.
- `apps/admin/src/middleware.ts` — verify-only (matcher must NOT include `/accept-invite`).
- `apps/admin/.env.example` — note that `INVITE_LINK_BASE` must target `/accept-invite`.

**shared infra:**
- `docker-compose.yml` — wire `INVITE_LINK_BASE` into auth-service and email-service.
- `.env.example` (root) — document `INVITE_LINK_BASE`.
- `.github/workflows/ci.yml` — hardcode `INVITE_LINK_BASE` for CI.

---

## Subsystem: packages/db (Prisma schema + migrations)

The latest existing migration is `20260606200000`, so the Invite migration must sort after it. The schema/migrate/generate tasks below MUST land before any code that references the `Invite` model on the Prisma client (auth-service, admin type imports).

### Task 1: Add `Invite` Prisma model + User back-relation

**Files:**
- Modify: `/Users/cristian/Development/spacefly-ai/packages/db/prisma/schema.prisma` (User `// Relations` block ~line 119; AUTH section, after `PasswordResetUse` ~line 192)

- [ ] **Step 1: Add the `invites Invite[]` back-relation to the `User` model.**
  In `/Users/cristian/Development/spacefly-ai/packages/db/prisma/schema.prisma`, inside the `User` model's `// Relations` block, add the back-relation after `payouts`:
  ```prisma
  payouts           Payout[] // Payouts for hosts
  invites           Invite[] // Invitations issued to this user
  ```
  (Leave the `@@index([role])` / `@@index([deletedAt])` lines untouched below it.)

- [ ] **Step 2: Add the `Invite` model in the AUTH section.**
  In the same file, immediately after the `PasswordResetUse` model (just before `RevokedAccessToken`), add:
  ```prisma
  // First-time-access invitations. An admin invites a user by email; the raw
  // token is emailed (magic link) and only its sha-256 hash is stored here.
  // Accepting an invite sets the user's password + emailVerified=true. Distinct
  // from PasswordResetUse: role-agnostic, carries inviter/role context, auditable.
  model Invite {
    id          String    @id @default(cuid())
    userId      String
    user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    tokenHash   String    @unique
    email       String
    role        Role
    invitedById String?
    expiresAt   DateTime
    acceptedAt  DateTime?
    createdAt   DateTime  @default(now())

    @@index([userId])
  }
  ```
  Note: `invitedById` is a plain nullable scalar (the inviting admin's id) with **no** relation field — adding a second FK to `User` would force a named-relation rename of the `userId` relation, which the contract does not ask for. It mirrors `HostApplication.decisionBy` (a bare admin-id string).

- [ ] **Step 3: Validate the schema parses.**
  Run:
  ```
  pnpm --filter @repo/db exec prisma validate
  ```
  Expect output: `The schema at prisma/schema.prisma is valid 🚀` (or equivalent "valid" message). If it errors, fix the model before continuing.

- [ ] **Step 4: Commit.**
  ```
  git add packages/db/prisma/schema.prisma
  git commit -m "feat(db): add Invite model + User.invites relation"
  ```

### Task 2: Create the `Invite` migration

**Files:**
- Create: `/Users/cristian/Development/spacefly-ai/packages/db/prisma/migrations/20260622120000_add_invite/migration.sql`

- [ ] **Step 1: Generate the migration via Prisma (preferred — keeps it in sync with the schema).**
  This requires a reachable local DB (`packages/db/.env` → `postgresql://spacefly:spacefly@localhost:5432/spacefly`). Run:
  ```
  pnpm --filter @repo/db exec prisma migrate dev --skip-generate --name add_invite
  ```
  Expect: a new dir `prisma/migrations/<timestamp>_add_invite/` containing `migration.sql`, and `The following migration(s) have been applied`. Prisma will pick its own UTC timestamp; that is fine as long as it sorts after `20260606200000`.

- [ ] **Step 2: If no local DB is available, hand-write the migration instead (skip Step 1).**
  Create `/Users/cristian/Development/spacefly-ai/packages/db/prisma/migrations/20260622120000_add_invite/migration.sql` with exactly:
  ```sql
  -- CreateTable: Invite (first-time-access magic-link invitations; stores token hash only)
  CREATE TABLE "public"."Invite" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "tokenHash" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "role" "public"."Role" NOT NULL,
      "invitedById" TEXT,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "acceptedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
  );

  -- CreateIndex
  CREATE UNIQUE INDEX "Invite_tokenHash_key" ON "public"."Invite"("tokenHash");

  -- CreateIndex
  CREATE INDEX "Invite_userId_idx" ON "public"."Invite"("userId");

  -- AddForeignKey
  ALTER TABLE "public"."Invite" ADD CONSTRAINT "Invite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  ```
  (The `Role` enum and `User` table already exist from prior migrations, so this migration only adds the `Invite` table.)

- [ ] **Step 3: Verify the migration is the latest by sort order.**
  Run:
  ```
  ls packages/db/prisma/migrations | sort | tail -3
  ```
  Expect the `..._add_invite` dir to sort **after** `20260606200000_add_missing_indexes`. If Prisma chose a timestamp that sorts earlier (clock skew), rename the dir to `20260622120000_add_invite`.

- [ ] **Step 4: Dry-verify the SQL applies cleanly on the current schema.**
  If a local DB is available and Step 1 was used, the migration is already applied. Otherwise confirm a clean deploy path:
  ```
  pnpm --filter @repo/db exec prisma migrate status
  ```
  Expect: `Database schema is up to date!` (no "following migrations have not yet been applied" beyond the one you just added, and no drift/failed-migration warnings).

- [ ] **Step 5: Commit.**
  ```
  git add packages/db/prisma/migrations/
  git commit -m "feat(db): add Invite table migration"
  ```

### Task 3: Regenerate Prisma client + export `Invite` type from `@repo/db`

**Files:**
- Modify: `/Users/cristian/Development/spacefly-ai/packages/db/src/index.ts` (the `export type { ... }` list, lines 24-40)
- Modify (generated, do not hand-edit — produced by Step 1): `/Users/cristian/Development/spacefly-ai/packages/db/generated/prisma/*`

- [ ] **Step 1: Regenerate the committed client (`db:migrate`/`migrate dev` does NOT do this).**
  ```
  pnpm --filter @repo/db db:generate
  ```
  Expect: `✔ Generated Prisma Client ... to ./generated/prisma`. This refreshes `packages/db/generated/prisma`, which is committed and consumed by relative import. (`Role` is already exported in `src/index.ts`; no enum was added, so the `export { ... }` enum list does not change.)

- [ ] **Step 2: Add `Invite` to the type re-export list in `src/index.ts`.**
  In `/Users/cristian/Development/spacefly-ai/packages/db/src/index.ts`, add `Invite` to the `export type { ... }` block (e.g. after `Session`):
  ```ts
  export type {
    User,
    Session,
    Invite,
    Venue,
    ExchangeRate,
  ```
  Do not add `PrismaClient` (singleton enforced) and do not touch `client.ts`.

- [ ] **Step 3: Build the package (tsc + tsc-alias) — this is the package's only validation gate.**
  ```
  pnpm --filter @repo/db build
  ```
  Expect: exit 0, no TS errors. A failure here means the `Invite` type isn't present in `generated/prisma` (re-run Step 1) or the export name is mistyped.

- [ ] **Step 4: Type-check the whole monorepo so downstream consumers see `Invite`.**
  ```
  pnpm check-types
  ```
  Expect: turbo reports all `check-types` tasks passing (exit 0). This confirms `import { prisma } from "@repo/db"` and `import type { Invite } from "@repo/db"` resolve for auth-service and other packages.

- [ ] **Step 5: Commit.**
  ```
  git add packages/db/src/index.ts packages/db/generated/prisma
  git commit -m "feat(db): regenerate client and export Invite type"
  ```

---

## Subsystem: apps/auth-service (routes/validation/rate-limit/kafka/session)

### Task 4: Invite token helpers + INVITE_TTL constant

**Files:**
- Create: `apps/auth-service/src/utils/inviteToken.ts`
- Test: type-check only (no harness in auth-service per recon)

- [ ] **Step 1: Create the token helper module.** Write `apps/auth-service/src/utils/inviteToken.ts` verbatim:
  ```ts
  /**
   * Host-invite token helpers.
   *
   * The raw token is emailed (base64url of 32 random bytes); only its
   * sha-256 hash is ever stored (Invite.tokenHash), mirroring the
   * password-reset best practice. A leaked DB row cannot be replayed
   * against the accept endpoint because the raw token is non-derivable
   * from the hash.
   */
  import { randomBytes, createHash } from "crypto";

  export const INVITE_TTL_DAYS = 7;

  export function hashInviteToken(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }

  export function generateInviteToken(): { raw: string; tokenHash: string } {
    const raw = randomBytes(32).toString("base64url");
    return { raw, tokenHash: hashInviteToken(raw) };
  }
  ```

- [ ] **Step 2: Type-check.** Run `pnpm --filter auth-service check-types`. Expected: clean (no output / exit 0). If `check-types` is not wired, run `pnpm --filter auth-service build` and expect a clean `tsc` exit.

- [ ] **Step 3: Manual verify the round-trip.** Run:
  ```
  pnpm --filter auth-service exec node -e "const {generateInviteToken,hashInviteToken}=require('./dist/utils/inviteToken.js');const t=generateInviteToken();console.log(t.tokenHash===hashInviteToken(t.raw), t.raw.length>=40, /^[a-f0-9]{64}$/.test(t.tokenHash));"
  ```
  Expected output: `true true true`.

- [ ] **Step 4: Commit.** `git add apps/auth-service/src/utils/inviteToken.ts && git commit -m "feat(auth): add invite token helpers (sha256 hashed, base64url)"`.

### Task 5: Invite/accept validation schema + accept rate limiter

**Files:**
- Modify: `apps/auth-service/src/utils/validation.ts` (append after `onboardingSetPasswordSchema`, validation.ts:72)
- Modify: `apps/auth-service/src/utils/rateLimit.ts` (append after `resendVerificationLimiter`, rateLimit.ts:147)
- Test: type-check only

- [ ] **Step 1: Add the accept-invite body schema.** In `apps/auth-service/src/utils/validation.ts`, immediately after the `onboardingSetPasswordSchema` block (line 72), add:
  ```ts
  export const acceptInviteSchema = z.object({
    token: z.string().min(20).max(4096),
    newPassword: passwordSchema,
  });
  export type AcceptInviteBody = z.infer<typeof acceptInviteSchema>;
  ```
  (Reuses the existing `passwordSchema` min8/max256 and mirrors `resetPasswordSchema`'s token bounds.)

- [ ] **Step 2: Add the host-invite body schema.** Directly below, add:
  ```ts
  export const hostInviteSchema = z.object({
    name: z.string().trim().min(1, "name is required").max(120),
    email: emailSchema,
  });
  export type HostInviteBody = z.infer<typeof hostInviteSchema>;
  ```

- [ ] **Step 3: Add the accept-invite rate limiter.** In `apps/auth-service/src/utils/rateLimit.ts`, append after `resendVerificationLimiter` (line 147):
  ```ts
  /**
   * Accept-invite: 10 per 15 min per IP. Mirrors onboardingSetPasswordLimiter.
   * The single-use tokenHash row is the real defence (an accepted invite
   * can't be replayed); this just shuts down a token-guessing loop early.
   */
  export const acceptInviteLimiter = rateLimit({
    windowMs: FIFTEEN_MIN,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: ipKey,
    handler: standardResponse,
  });
  ```

- [ ] **Step 4: Type-check.** Run `pnpm --filter auth-service check-types`. Expected: clean exit 0.

- [ ] **Step 5: Commit.** `git add apps/auth-service/src/utils/validation.ts apps/auth-service/src/utils/rateLimit.ts && git commit -m "feat(auth): add invite/accept validation schemas and accept rate limiter"`.

### Task 6: Public GET /auth/invite/:token (validate token)

**Files:**
- Modify: `apps/auth-service/src/routes/auth.route.ts` (import block auth.route.ts:3-19; new handler near the other public handlers, e.g. after `/register`/`/login`)
- Test: type-check + manual curl

- [ ] **Step 1: Add imports for the invite helpers.** In `apps/auth-service/src/routes/auth.route.ts`, after the existing `import { producer } from "../utils/kafka.js";` (auth.route.ts:19 region) add:
  ```ts
  import { hashInviteToken } from "../utils/inviteToken.js";
  ```
  And extend the validation/limiter imports already present in this file (the block around auth.route.ts:31-39) to include the new exports:
  ```ts
  import { acceptInviteSchema } from "../utils/validation.js";
  import { acceptInviteLimiter } from "../utils/rateLimit.js";
  ```
  (Add to the existing import statements from those modules rather than duplicating them — match whatever named-import shape is already there.)

- [ ] **Step 2: Add the public validate handler.** Add this handler to the `/auth` router (it is PUBLIC — no `shouldBeUser`, mirroring `/register` per recon GOTCHA 3):
  ```ts
  // Public: validate an invite token so the accept page can render the
  // invitee's email/name (or a friendly "no longer valid" state).
  // No auth — the user is not logged in yet.
  router.get("/invite/:token", async (req, res) => {
    try {
      const raw = req.params.token ?? "";
      if (!raw || raw.length < 20 || raw.length > 4096) {
        return res.status(200).json({ valid: false, reason: "INVALID" });
      }

      const tokenHash = hashInviteToken(raw);
      const invite = await prisma.invite.findUnique({
        where: { tokenHash },
        select: {
          email: true,
          acceptedAt: true,
          expiresAt: true,
          user: { select: { name: true, deletedAt: true } },
        },
      });

      if (!invite || invite.user.deletedAt) {
        return res.status(200).json({ valid: false, reason: "INVALID" });
      }
      if (invite.acceptedAt) {
        return res.status(200).json({ valid: false, reason: "ALREADY_ACCEPTED" });
      }
      if (invite.expiresAt.getTime() <= Date.now()) {
        return res.status(200).json({ valid: false, reason: "EXPIRED" });
      }

      return res.status(200).json({
        valid: true,
        email: invite.email,
        name: invite.user.name ?? undefined,
      });
    } catch (error) {
      console.error("Invite validate error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  ```
  (Always returns 200 with `{ valid: false, reason }` for bad/expired/used so the accept page renders a friendly state rather than handling 4xx; `findUnique` is safe here because `tokenHash` is `@unique` and we explicitly re-check `user.deletedAt`.)

- [ ] **Step 3: Type-check.** Run `pnpm --filter auth-service check-types`. Expected: clean. (This depends on the `Invite` model existing on the Prisma client — Tasks 1-3 must land first. If the client is stale, run `pnpm --filter @repo/db db:generate` then re-check.)

- [ ] **Step 4: Manual verify.** With the local stack up, an unknown token returns `valid:false`:
  ```
  curl -s http://localhost:4001/auth/invite/this-is-a-nonexistent-token-1234567890 | jq
  ```
  Expected: `{ "valid": false, "reason": "INVALID" }`.

- [ ] **Step 5: Commit.** `git add apps/auth-service/src/routes/auth.route.ts && git commit -m "feat(auth): add public GET /auth/invite/:token validate endpoint"`.

### Task 7: Public POST /auth/invite/accept (set password + emailVerified + session)

**Files:**
- Modify: `apps/auth-service/src/routes/auth.route.ts` (new handler after `/auth/invite/:token`; reuse session-issuance helpers `persistRefreshToken`/`refreshLifetimeMs`/`accessLifetimeMs`/`setAuthCookies`/`signTokenPair` already in this file)
- Test: type-check + manual curl

- [ ] **Step 1: Add the accept handler.** Add to the `/auth` router. It is PUBLIC (rate-limited, no `shouldBeUser` — the invitee is not logged in; per GOTCHA 3 it must NOT read `req.userId`). It mirrors the login session-issuance snippet verbatim (GOTCHA 5/6: Session row AND RefreshToken row; setAuthCookies arg order refresh-then-access):
  ```ts
  // Public, rate-limited: accept an invite. Sets the user's own password,
  // clears mustChangePassword, sets emailVerified=true (the emailed token
  // proves ownership — closes the prod EMAIL_NOT_VERIFIED gate), marks the
  // invite accepted, drops the user's existing sessions, and issues a fresh
  // session exactly like login. No shouldBeUser — invitee isn't logged in.
  router.post("/invite/accept", acceptInviteLimiter, async (req, res) => {
    try {
      const body = parseBody(acceptInviteSchema, req.body, res);
      if (!body) return;

      const tokenHash = hashInviteToken(body.token);
      const invite = await prisma.invite.findUnique({
        where: { tokenHash },
        select: { id: true, userId: true, acceptedAt: true, expiresAt: true },
      });

      if (!invite) {
        return res.status(400).json({ message: "This invite is no longer valid." });
      }
      if (invite.acceptedAt) {
        return res.status(410).json({ message: "This invite has already been used." });
      }
      if (invite.expiresAt.getTime() <= Date.now()) {
        return res.status(410).json({ message: "This invite has expired." });
      }

      const user = await prisma.user.findFirst({
        where: { id: invite.userId, deletedAt: null },
      });
      if (!user) {
        return res.status(400).json({ message: "This invite is no longer valid." });
      }

      const newHash = await hashPassword(body.newPassword);

      // Apply the password + verification + accepted-at atomically, then
      // drop any prior sessions for this user (the invite is a fresh start).
      const updatedUser = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where: { id: user.id },
          data: {
            password: newHash,
            mustChangePassword: false,
            emailVerified: true,
          },
        });
        await tx.invite.update({
          where: { id: invite.id },
          data: { acceptedAt: new Date() },
        });
        await tx.session.deleteMany({ where: { userId: user.id } });
        return u;
      });

      // Issue a fresh session — identical to the login handler.
      const refreshJti = uuidv4();
      const tokens = signTokenPair(
        {
          userId: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          hostVerified: updatedUser.hostVerified,
        },
        { refreshJti },
      );

      await persistRefreshToken({ jti: refreshJti, userId: updatedUser.id });
      await prisma.session.create({
        data: {
          userId: updatedUser.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + refreshLifetimeMs()),
        },
      });

      setAuthCookies(res, tokens.accessToken, tokens.refreshToken, refreshLifetimeMs(), accessLifetimeMs());

      return res.status(200).json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          name: updatedUser.name,
          role: updatedUser.role,
          image: updatedUser.image,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      console.error("Invite accept error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  ```
  (Response shape — `{ user, accessToken, refreshToken }` plus cookies — matches `POST /auth/login`. `session.deleteMany` is inside the tx so an accept can't half-apply; the new Session/RefreshToken rows are created after commit, same ordering as login.)

- [ ] **Step 2: Type-check.** Run `pnpm --filter auth-service check-types`. Expected: clean. (Confirm `signTokenPair`, `persistRefreshToken`, `refreshLifetimeMs`, `accessLifetimeMs`, `setAuthCookies`, `uuidv4`, `parseBody`, `hashPassword` are all already imported in this file per recon snippets; add any that are missing — e.g. `parseBody` from `../utils/validation.js`.)

- [ ] **Step 3: Manual verify (full round-trip).** Requires a real invite row (created by Task 8). After creating one and capturing its raw token as `$TOKEN`:
  ```
  curl -si -X POST http://localhost:4001/auth/invite/accept \
    -H 'content-type: application/json' \
    -d "{\"token\":\"$TOKEN\",\"newPassword\":\"hunter2hunter2\"}"
  ```
  Expected: `HTTP/1.1 200`, a JSON body with `user`/`accessToken`/`refreshToken`, and `Set-Cookie` headers for the access + refresh cookies. A second call with the same `$TOKEN` returns `HTTP/1.1 410` `{"message":"This invite has already been used."}`. Then `GET /auth/invite/$TOKEN` returns `{"valid":false,"reason":"ALREADY_ACCEPTED"}`.

- [ ] **Step 4: Commit.** `git add apps/auth-service/src/routes/auth.route.ts && git commit -m "feat(auth): add public POST /auth/invite/accept (set password, verify email, issue session)"`.

### Task 8: Admin POST /users/:id/invite (create invite for existing user)

**Files:**
- Modify: `apps/auth-service/src/routes/user.route.ts` (imports user.route.ts:1-6; new handler — place BEFORE the `/:id` GET at user.route.ts:204 so the literal path isn't shadowed by the `:id` param route)
- Test: type-check + manual curl

- [ ] **Step 1: Add imports.** In `apps/auth-service/src/routes/user.route.ts`, after the existing imports (user.route.ts:1-6) add:
  ```ts
  import { generateInviteToken, INVITE_TTL_DAYS } from "../utils/inviteToken.js";
  ```
  (`producer` and `normalizeEmail`/`hashPassword` are already imported at user.route.ts:4-5.)

- [ ] **Step 2: Add an env-derived invite-link helper near the top of the file** (after the `generateTempPassword` block, ~user.route.ts:60):
  ```ts
  // Magic-link base for invites, e.g. https://admin.spacefly.ai/accept-invite.
  // The raw token is appended as ?token=...; only its hash is stored.
  function buildInviteUrl(rawToken: string): string {
    const base = process.env.INVITE_LINK_BASE ?? "";
    return `${base}?token=${encodeURIComponent(rawToken)}`;
  }
  ```

- [ ] **Step 3: Add the invite handler BEFORE the `/:id` GET (user.route.ts:204).** The whole router is already mounted behind `shouldBeAdmin` (index.ts:71), so no per-handler admin check is needed:
  ```ts
  // Create (or refresh) an email invite for an existing user. Admin-only via
  // the /users mount guard. Deletes any prior unaccepted invite for the user,
  // inserts a fresh Invite (hash stored, raw emitted), and emits user.invited.
  // Returns the inviteUrl so the admin can copy it as an offline fallback.
  router.post("/:id/invite", async (req, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, email: true, name: true, role: true },
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { raw, tokenHash } = generateInviteToken();
      const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
      const invitedById = req.userId ?? null;

      // One live invite per user: clear prior unaccepted invites, then insert.
      await prisma.$transaction([
        prisma.invite.deleteMany({ where: { userId: user.id, acceptedAt: null } }),
        prisma.invite.create({
          data: {
            userId: user.id,
            tokenHash,
            email: user.email,
            role: user.role,
            invitedById,
            expiresAt,
          },
        }),
      ]);

      // Best-effort publish (GOTCHA 9): the Invite row is the durable side
      // effect; a Kafka outage must not fail the admin call — the returned
      // inviteUrl lets the admin relay the link manually.
      try {
        await producer.send("user.invited", {
          value: {
            email: user.email,
            name: user.name ?? null,
            token: raw,
            role: user.role,
          },
        });
      } catch (err) {
        console.error(
          "Failed to publish user.invited event for",
          user.id,
          "- invite created but email will not fire:",
          err instanceof Error ? err.message : err,
        );
      }

      return res.status(200).json({ inviteUrl: buildInviteUrl(raw), expiresAt: expiresAt.toISOString() });
    } catch (error) {
      return sendPrismaError(res, error, "Create invite error");
    }
  });
  ```
  (`req.userId` is populated by `shouldBeAdmin`. Publish payload is exactly `{ email, name, token, role }` under `value`, matching the `user.invited` contract. Error posture uses `sendPrismaError` to match the rest of user.route.ts.)

- [ ] **Step 4: Type-check.** Run `pnpm --filter auth-service check-types`. Expected: clean (requires the `Invite` model on the generated client — see Tasks 1-3).

- [ ] **Step 5: Manual verify.** With an admin access token `$ADMIN` and an existing user id `$UID`, and `INVITE_LINK_BASE=https://admin.spacefly.ai/accept-invite` in the auth-service env:
  ```
  curl -s -X POST http://localhost:4001/users/$UID/invite \
    -H "authorization: Bearer $ADMIN" | jq
  ```
  Expected: `{ "inviteUrl": "https://admin.spacefly.ai/accept-invite?token=...", "expiresAt": "<ISO 8601>" }`. Capture the `?token=` value for the accept round-trip in Task 7's manual step.

- [ ] **Step 6: Commit.** `git add apps/auth-service/src/routes/user.route.ts && git commit -m "feat(auth): add admin POST /users/:id/invite endpoint"`.

### Task 9: Admin POST /users/host-invite (find-or-create HOST + invite)

**Files:**
- Modify: `apps/auth-service/src/routes/user.route.ts` (new handler before the `/:id` GET, user.route.ts:204; reuses `parseBody`-style validation via the new `hostInviteSchema`, `generateRandomPassword`, `slugifyForEmail`, `buildInviteUrl`)
- Test: type-check + manual curl

- [ ] **Step 1: Add the schema import.** Extend the imports at the top of `apps/auth-service/src/routes/user.route.ts` to bring in the host-invite schema and `parseBody`:
  ```ts
  import { hostInviteSchema, parseBody } from "../utils/validation.js";
  ```

- [ ] **Step 2: Add the host-invite handler before `/:id` GET (user.route.ts:204).** Admin-only via the mount guard:
  ```ts
  // Find-or-create a HOST by normalized email, then create an invite + emit
  // user.invited. Used by the venue form's "new host" path. Admin-only via
  // the /users mount guard. 409 if the email already exists as a non-HOST
  // (don't silently change someone's role).
  router.post("/host-invite", async (req, res) => {
    try {
      const body = parseBody(hostInviteSchema, req.body, res);
      if (!body) return;

      const email = normalizeEmail(body.email);
      const name = body.name.trim();

      const existing = await prisma.user.findFirst({
        where: { email, deletedAt: null },
        select: { id: true, role: true },
      });

      if (existing && existing.role !== "HOST" && existing.role !== "ADMIN") {
        return res
          .status(409)
          .json({ message: "A user with this email already exists with a different role." });
      }

      let userId: string;
      let created: boolean;

      if (existing) {
        userId = existing.id;
        created = false;
      } else {
        // Mirror lead-host creation semantics: verified host, unusable random
        // password, mustChangePassword=true. A unique username is derived from
        // the email local-part; collisions are avoided with a short suffix.
        const hashedPassword = await hashPassword(generateRandomPassword());
        const base = slugifyForEmail(email.split("@")[0] ?? "host").slice(0, 24) || "host";
        const username = `${base}-${randomBytes(3).toString("hex")}`;

        const user = await prisma.user.create({
          data: {
            email,
            username,
            password: hashedPassword,
            name,
            role: "HOST",
            hostVerified: true,
            emailVerified: false,
            mustChangePassword: true,
          },
          select: { id: true },
        });
        userId = user.id;
        created = true;
      }

      const { raw, tokenHash } = generateInviteToken();
      const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
      const invitedById = req.userId ?? null;

      await prisma.$transaction([
        prisma.invite.deleteMany({ where: { userId, acceptedAt: null } }),
        prisma.invite.create({
          data: { userId, tokenHash, email, role: "HOST", invitedById, expiresAt },
        }),
      ]);

      try {
        await producer.send("user.invited", {
          value: { email, name, token: raw, role: "HOST" },
        });
      } catch (err) {
        console.error(
          "Failed to publish user.invited event (host-invite) for",
          userId,
          "- invite created but email will not fire:",
          err instanceof Error ? err.message : err,
        );
      }

      return res
        .status(201)
        .json({ userId, inviteUrl: buildInviteUrl(raw), created });
    } catch (error) {
      return sendPrismaError(res, error, "Host invite error");
    }
  });
  ```
  (`randomBytes` is already imported at user.route.ts:2; `slugifyForEmail`/`generateRandomPassword` already defined in this file. Find-or-create keys on normalized email per GOTCHA 2. 201 + `{ userId, inviteUrl, created }` matches the contract; 409 on non-HOST/ADMIN matches the error-handling spec.)

- [ ] **Step 3: Type-check.** Run `pnpm --filter auth-service check-types`. Expected: clean.

- [ ] **Step 4: Manual verify (new host path).** With admin token `$ADMIN`:
  ```
  curl -s -X POST http://localhost:4001/users/host-invite \
    -H "authorization: Bearer $ADMIN" -H 'content-type: application/json' \
    -d '{"name":"Ada Lovelace","email":"ada+invite@example.com"}' | jq
  ```
  Expected first call: `{ "userId": "<cuid>", "inviteUrl": "https://.../accept-invite?token=...", "created": true }`. Repeat the same call: expect `"created": false` (find path, fresh invite). A non-host existing email returns `HTTP 409`.

- [ ] **Step 5: Commit.** `git add apps/auth-service/src/routes/user.route.ts && git commit -m "feat(auth): add admin POST /users/host-invite (find-or-create HOST + invite)"`.

### Task 10: Document and wire INVITE_LINK_BASE env for auth-service

**Files:**
- Modify: `apps/auth-service/.env.example`
- Modify: `docker-compose.yml` (auth-service service env block) — coordinate with Task 11 which adds the same var to the email-service block
- Test: manual grep

- [ ] **Step 1: Add the var to the example env.** Append to `apps/auth-service/.env.example`:
  ```
  # Base URL of the admin accept-invite page; the raw invite token is appended
  # as ?token=... to build the magic link returned by the invite endpoints.
  INVITE_LINK_BASE=https://admin.spacefly.ai/accept-invite
  ```

- [ ] **Step 2: Wire it into docker-compose.** In `docker-compose.yml`, add `INVITE_LINK_BASE` to the `auth-service` `environment:` block, matching the style of the existing `EMAIL_VERIFICATION_LINK_BASE`/`PASSWORD_RESET_LINK_BASE` entries (e.g. `INVITE_LINK_BASE: ${INVITE_LINK_BASE}`).

- [ ] **Step 3: Manual verify.** Run `grep -rn INVITE_LINK_BASE apps/auth-service/.env.example docker-compose.yml`. Expected: the var appears in both files. Confirm `buildInviteUrl` (added in Task 8) reads `process.env.INVITE_LINK_BASE`.

- [ ] **Step 4: Commit.** `git add apps/auth-service/.env.example docker-compose.yml && git commit -m "chore(auth): document and wire INVITE_LINK_BASE env"`.

---

## Subsystem: apps/email-service (kafka subscribe + Resend mailer + config)

The `EmailEventMessage` value type already carries `email`, `username`, `token`, `userId`, `name` — the invite handler needs nothing new there (role isn't used by the handler), so no type edit is required.

### Task 11: email-service — INVITE_LINK_BASE config enforcement (three layers)

**Files:**
- Modify: `/Users/cristian/Development/spacefly-ai/apps/email-service/src/index.ts:79-89` (getEmailConfigErrors)
- Modify: `/Users/cristian/Development/spacefly-ai/docker-compose.yml:169-178` (email-service env block)
- Modify: `/Users/cristian/Development/spacefly-ai/.env.example:36-41` (root Email block)
- Modify: `/Users/cristian/Development/spacefly-ai/apps/email-service/.env.example` (service-local example)
- Modify: `/Users/cristian/Development/spacefly-ai/.github/workflows/ci.yml:25-26` (CI env block)
- Test: none (no harness — verify via `check-types` + runtime readiness gate + compose substitution + CI)

- [ ] **Step 1: Add `INVITE_LINK_BASE` to `getEmailConfigErrors`.** This is the readiness gate — it must land first so a missing env is caught at startup, not at handler time (where it would throw `MissingEmailConfigError`, burn retries, and DLQ the message). In `/Users/cristian/Development/spacefly-ai/apps/email-service/src/index.ts`, change the array (currently `src/index.ts:79-89`) to append one entry before the closing `]`:
  ```ts
  const getEmailConfigErrors = () =>
    [
      process.env.RESEND_API_KEY ? null : "RESEND_API_KEY is not configured",
      process.env.RESEND_FROM_EMAIL ? null : "RESEND_FROM_EMAIL is not configured",
      process.env.EMAIL_VERIFICATION_LINK_BASE
        ? null
        : "EMAIL_VERIFICATION_LINK_BASE is not configured",
      process.env.PASSWORD_RESET_LINK_BASE
        ? null
        : "PASSWORD_RESET_LINK_BASE is not configured",
      process.env.INVITE_LINK_BASE ? null : "INVITE_LINK_BASE is not configured",
    ].filter((message): message is string => Boolean(message));
  ```

- [ ] **Step 2: Add `INVITE_LINK_BASE` to docker-compose.** Compose uses `${VAR:?...}` substitution, so an unset var aborts `docker compose up` for the WHOLE stack — this must stay in lockstep with the readiness gate. In `/Users/cristian/Development/spacefly-ai/docker-compose.yml`, immediately after the `PASSWORD_RESET_LINK_BASE` line (currently `:178`) in the email-service `environment:` block, add:
  ```yaml
        INVITE_LINK_BASE: ${INVITE_LINK_BASE:?INVITE_LINK_BASE is required}
  ```

- [ ] **Step 3: Add `INVITE_LINK_BASE` to root `.env.example`.** In `/Users/cristian/Development/spacefly-ai/.env.example`, after the `PASSWORD_RESET_LINK_BASE` line (currently `:41`), add:
  ```
  INVITE_LINK_BASE="https://admin.spacefly.ai/accept-invite"
  ```
  (Use the admin origin — the accept-invite page lives in the admin app; this must match `<NEXT_PUBLIC_ADMIN_URL>/accept-invite`.)

- [ ] **Step 4: Bring the service-local `.env.example` up to date with all three link bases.** `/Users/cristian/Development/spacefly-ai/apps/email-service/.env.example` is stale — it lacks `EMAIL_VERIFICATION_LINK_BASE` and `PASSWORD_RESET_LINK_BASE` entirely. Replace the `# Resend` section so the local example reflects every required env. Make the file end with:
  ```
  # Resend
  RESEND_API_KEY="re_replace_with_production_key"
  RESEND_FROM_EMAIL="noreply@spacefly.ai"

  # Link bases the service appends ?token=... to. All three are required at boot
  # (getEmailConfigErrors gates readiness without them).
  EMAIL_VERIFICATION_LINK_BASE="https://spacefly.ai/verify-email"
  PASSWORD_RESET_LINK_BASE="https://admin.spacefly.ai/reset-password"
  INVITE_LINK_BASE="https://admin.spacefly.ai/accept-invite"
  ```

- [ ] **Step 5: Add `INVITE_LINK_BASE` to CI env.** CI hardcodes the link bases (history: commits `bc6efb2`/`e5dec1f` broke CI when a required link env was missing). In `/Users/cristian/Development/spacefly-ai/.github/workflows/ci.yml`, after the `PASSWORD_RESET_LINK_BASE` line (currently `:26`), add (matching the surrounding indentation):
  ```yaml
        INVITE_LINK_BASE: https://admin.spacefly.ai/accept-invite
  ```

- [ ] **Step 6: Type-check the package (expect clean).** From repo root run:
  ```bash
  pnpm turbo check-types --filter=email-service
  ```
  Expected: turbo reports the `email-service#check-types` task succeeds with no `tsc` errors. (Package name confirmed as `email-service` in `apps/email-service/package.json`.)

- [ ] **Step 7: Manual-verify the readiness gate fires on a missing env.** Confirm the new entry actually gates readiness. From `/Users/cristian/Development/spacefly-ai/apps/email-service` run:
  ```bash
  RESEND_API_KEY=x RESEND_FROM_EMAIL=x EMAIL_VERIFICATION_LINK_BASE=x PASSWORD_RESET_LINK_BASE=x \
    node -e "$(printf '%s' 'const e=[process.env.RESEND_API_KEY?null:"RESEND_API_KEY is not configured",process.env.RESEND_FROM_EMAIL?null:"RESEND_FROM_EMAIL is not configured",process.env.EMAIL_VERIFICATION_LINK_BASE?null:"EMAIL_VERIFICATION_LINK_BASE is not configured",process.env.PASSWORD_RESET_LINK_BASE?null:"PASSWORD_RESET_LINK_BASE is not configured",process.env.INVITE_LINK_BASE?null:"INVITE_LINK_BASE is not configured"].filter(Boolean);console.log(JSON.stringify(e));')"
  ```
  Expected output: `["INVITE_LINK_BASE is not configured"]` (only the invite env missing). Re-running with `INVITE_LINK_BASE=x` prepended must print `[]`.

- [ ] **Step 8: Commit.**
  ```bash
  git add apps/email-service/src/index.ts docker-compose.yml .env.example apps/email-service/.env.example .github/workflows/ci.yml
  git commit -m "feat(email-service): require INVITE_LINK_BASE env across config layers"
  ```

### Task 12: email-service — inviteLinkFor builder

**Files:**
- Modify: `/Users/cristian/Development/spacefly-ai/apps/email-service/src/index.ts:141` (add builder after `passwordResetLinkFor`)
- Test: none (no harness — verify via `check-types` + manual node eval)

- [ ] **Step 1: Add the `inviteLinkFor` link builder.** Read `process.env` lazily *inside* the function (same as `verificationLinkFor`/`passwordResetLinkFor` at `src/index.ts:122`/`:134`) so readiness ordering and any future tests stay consistent. Reuse the `base.includes("?") ? "&" : "?"` separator — do not hardcode `?`. In `/Users/cristian/Development/spacefly-ai/apps/email-service/src/index.ts`, immediately after the closing `};` of `passwordResetLinkFor` (currently `src/index.ts:141`), add:
  ```ts
  // Invite link builder — same shape as verification/reset. Producer
  // (auth-service) sends the invite token in `token`; we append it onto
  // INVITE_LINK_BASE as a query param.
  const inviteLinkFor = (token: string): string => {
    const base = process.env.INVITE_LINK_BASE;
    if (!base) {
      throw new MissingEmailConfigError("INVITE_LINK_BASE");
    }
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}token=${encodeURIComponent(token)}`;
  };
  ```

- [ ] **Step 2: Type-check the package (expect clean).** From repo root:
  ```bash
  pnpm turbo check-types --filter=email-service
  ```
  Expected: `email-service#check-types` succeeds, no `tsc` errors. (At this point `inviteLinkFor` is declared but unused — `tsc --noEmit` does not error on unused module-level `const`, so this is clean; the consuming handler is added in the next task.)

- [ ] **Step 3: Manual-verify the builder's query-param logic.** Confirm both the `?` and `&` separator branches and URL-encoding. Run:
  ```bash
  node -e 'const f=(t)=>{const b=process.env.INVITE_LINK_BASE;const s=b.includes("?")?"&":"?";return `${b}${s}token=${encodeURIComponent(t)}`}; process.env.INVITE_LINK_BASE="https://admin.spacefly.ai/accept-invite"; console.log(f("a b/c+d")); process.env.INVITE_LINK_BASE="https://x.test/accept?ref=1"; console.log(f("tok"));'
  ```
  Expected output:
  ```
  https://admin.spacefly.ai/accept-invite?token=a%20b%2Fc%2Bd
  https://x.test/accept?ref=1&token=tok
  ```

- [ ] **Step 4: Commit.**
  ```bash
  git add apps/email-service/src/index.ts
  git commit -m "feat(email-service): add inviteLinkFor token-link builder"
  ```

### Task 13: email-service — user.invited subscriber

**Files:**
- Modify: `/Users/cristian/Development/spacefly-ai/apps/email-service/src/index.ts:152-320` (push object onto the `subscriptions` array)
- Test: none (no harness — verify via `check-types` + manual handler eval)

- [ ] **Step 1: Add the `user.invited` subscription object.** Adding a subscriber is purely an array push — do NOT touch the consumer/DLQ machinery (`setupConsumer` `:506-531`, `buildEachMessageHandler` `:434-502`); the subscribe-topics list (`:519`) and dispatch (`:436`) are both derived from this array. Mimic the verification handler (`src/index.ts:171-190`) verbatim: early-`return` (not throw) on missing fields so a benign partial event doesn't burn retries and DLQ; hash the token into the idempotency key via `shortHash` so the raw token never lands in Resend's idempotency store or logs. No `html` field — `sendMail` sends `text` only. The `EmailEventMessage` `value` type (`:91-109`) already carries `email`, `username`, `token`, `userId`, `name`, so no type edit is needed. In `/Users/cristian/Development/spacefly-ai/apps/email-service/src/index.ts`, inside the `subscriptions` array (place it right after the `user.email-verification-requested` object, which currently ends at `:190`), insert:
  ```ts
    {
      topicName: "user.invited",
      topicHandler: async (message: EmailEventMessage) => {
        const { email, name, username, token, userId } = message.value || {};
        if (!email || !token) return;

        const link = inviteLinkFor(token);
        const greeting = name || username || "there";
        // AUD-013: hash the token into the idempotency key so a consumer-group
        // rebalance redelivering this message can't double-send, without
        // leaking the raw token into Resend's dedupe store or logs.
        const idKey = `user-invited:${userId ?? email}:${shortHash(token)}`;
        await sendMail({
          email,
          subject: "You've been invited to Spacefly.ai",
          text: `Hi ${greeting},\n\nYou've been invited to join Spacefly.ai. Accept your invitation using the link below:\n\n${link}\n\nIf you weren't expecting this invitation you can safely ignore this message.`,
          idempotencyKey: idKey,
        });
      },
    },
  ```

- [ ] **Step 2: Type-check the package (expect clean).** From repo root:
  ```bash
  pnpm turbo check-types --filter=email-service
  ```
  Expected: `email-service#check-types` succeeds, no `tsc` errors. (`inviteLinkFor` is now consumed; `name`/`username`/`token`/`userId`/`email` all resolve against the existing `EmailEventMessage` `value` type.)

- [ ] **Step 3: Manual-verify subscribe + dispatch derive the new topic.** Confirm the array drives both the subscribe list and the dispatch lookup so no extra wiring is needed. From `/Users/cristian/Development/spacefly-ai/apps/email-service` run:
  ```bash
  pnpm dlx tsx -e 'import("./src/index.ts").catch(()=>{})' 2>/dev/null; grep -c '"user.invited"' src/index.ts
  ```
  Expected: `1` (single subscription object present). Then sanity-check the topic is in the array by eye: it sits between the verification and the next handler in `subscriptions` (`:152-320`), which `:519` maps to `topics` and `:436` matches on — both automatic.

- [ ] **Step 4: Manual-verify the handler's early-return guard and id-key shape.** Confirm a partial event returns silently and a full event produces a token-hashed key (raw token absent). Run:
  ```bash
  node -e 'const {createHash}=require("crypto");const shortHash=(i)=>createHash("sha256").update(i).digest("hex").slice(0,16);const h=(v)=>{const{email,name,username,token,userId}=v||{};if(!email||!token)return"SKIPPED";const greeting=name||username||"there";return `user-invited:${userId??email}:${shortHash(token)}`};console.log(h({email:"a@b.co",token:"RAWTOKEN123",userId:"u1",name:"Ada"}));console.log(h({email:"a@b.co"}));console.log(h({token:"RAWTOKEN123"}));'
  ```
  Expected output:
  ```
  user-invited:u1:<16-hex-chars>
  SKIPPED
  SKIPPED
  ```
  Confirm the first line contains a 16-char hex hash and does NOT contain `RAWTOKEN123`.

- [ ] **Step 5: Commit.**
  ```bash
  git add apps/email-service/src/index.ts
  git commit -m "feat(email-service): send invite email on user.invited topic"
  ```

---

## Subsystem: apps/product-service (createVenue + acting host)

### Task 14: createVenue accepts explicit body.hostId (ADMIN-only)

**Files:**
- Modify: `apps/product-service/src/controllers/venue.controller.ts` (createVenue, lines 241-304; add import at lines 1-5)
- Test: `apps/product-service/src/controllers/venue.controller.test.ts` (vitest; mock `@repo/auth-middleware`)

Context: `createVenue` currently derives the venue owner solely from `req.userId!` (line 242), which `resolveActingHost` may have already rewritten to the `X-Acting-Host-Id` target. We add a NEW path: an explicit `body.hostId` that, **only when the real caller is ADMIN**, overrides the owner after validating the target is an active HOST/ADMIN via the shared `lookupActiveUser` cache (the same check `resolveActingHost` uses). The route gate is unchanged — `hasVerifiedHostAccess` already returns `true` for ADMIN (`packages/auth-middleware/src/authorization.ts:3-4`), so a plain ADMIN passes the existing `shouldBeHost` gate on `POST "/"`.

Precedence (explicit, see gotcha): the resolved value is what is BOTH persisted and published to `venue.created`. `req.user?.role` is the caller's REAL role from the JWT (never rewritten); `req.userId` may be the acting host. If `X-Acting-Host-Id` header AND `body.hostId` are both supplied, **`body.hostId` wins** (it is the explicit, intentional assignment and is independently validated). Non-ADMIN callers' `body.hostId` is ignored — they keep `req.userId`.

- [ ] **Step 1: Write failing test — ADMIN body.hostId overrides req.userId.**
  In `apps/product-service/src/controllers/venue.controller.test.ts`, add the `@repo/auth-middleware` mock to the existing `vi.hoisted`/`vi.mock` block. Add `lookupActiveUser: vi.fn()` to the hoisted `mocks` object:
  ```ts
  return {
    prisma,
    producerSend: vi.fn(),
    lookupActiveUser: vi.fn(),
    spaceUpdateMany: prisma.space.updateMany,
    venueCreate: prisma.venue.create,
    venueFindMany: prisma.venue.findMany,
    venueFindUnique: prisma.venue.findUnique,
    venueFindFirst: prisma.venue.findFirst,
    venueUpdate: prisma.venue.update,
    venueGroupBy: prisma.venue.groupBy,
  };
  ```
  And add the mock module next to the existing `vi.mock("../utils/kafka.js", ...)`:
  ```ts
  vi.mock("@repo/auth-middleware", () => ({
    lookupActiveUser: mocks.lookupActiveUser,
  }));
  ```
  Then add a test inside `describe("venue controller contract", ...)`:
  ```ts
  it("lets an ADMIN assign a venue to an explicit body.hostId", async () => {
    mocks.lookupActiveUser.mockResolvedValueOnce({ id: "host-9", role: "HOST" });
    mocks.venueCreate.mockResolvedValue({ id: 21, hostId: "host-9" });
    const req = {
      body: {
        name: "Venue",
        address: "Str. 1",
        city: "Chisinau",
        country: "Moldova",
        hostId: "host-9",
      },
      userId: "admin-1",
      user: { userId: "admin-1", email: "a@b.co", role: "ADMIN" },
    } as unknown as Request;
    const res = createResponse();

    await createVenue(req, res);

    expect(mocks.lookupActiveUser).toHaveBeenCalledWith("host-9");
    expect(mocks.venueCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ hostId: "host-9" }),
    });
    expect(mocks.producerSend).toHaveBeenCalledWith("venue.created", {
      value: { id: 21, hostId: "host-9" },
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
  ```

- [ ] **Step 2: Run the test — expect FAIL.**
  ```
  pnpm --filter product-service test -- venue.controller
  ```
  Expected: the new test FAILS (`lookupActiveUser` not called; `venueCreate` called with `hostId: "admin-1"` from `req.userId`). Pre-existing tests still pass.

- [ ] **Step 3: Add the `lookupActiveUser` import.**
  In `apps/product-service/src/controllers/venue.controller.ts`, after line 5, add:
  ```ts
  import { lookupActiveUser } from "@repo/auth-middleware";
  ```
  (Root export, confirmed in `packages/auth-middleware/src/index.ts`. Do NOT import from a subpath.)

- [ ] **Step 4: Resolve hostId from body for ADMIN callers.**
  In `createVenue`, replace the owner-derivation and body destructure. Change line 242 and the destructure (lines 243-261) so `hostId` from the body is pulled out, then resolve it. Replace:
  ```ts
  const hostId = req.userId!;
  const {
    name,
    shortDescription,
    ...
    workingHours,
  } = req.body;
  if (!name || !address || !city || !country) {
  ```
  with:
  ```ts
  const {
    name,
    shortDescription,
    description,
    nameTranslations,
    shortDescTranslations,
    descriptionTranslations,
    images,
    videoUrl,
    address,
    city,
    state,
    country,
    postalCode,
    latitude,
    longitude,
    currency,
    workingHours,
    hostId: bodyHostId,
  } = req.body;
  // Default owner is the (possibly impersonated) caller. An ADMIN may instead
  // assign the venue to an explicit host via body.hostId — validated against the
  // same active-user cache resolveActingHost uses. body.hostId wins over the
  // X-Acting-Host-Id header when both are present. Non-admins' body.hostId is
  // ignored.
  let hostId = req.userId!;
  if (bodyHostId !== undefined && req.user?.role === "ADMIN") {
    const target = await lookupActiveUser(bodyHostId);
    if (!target || (target.role !== "HOST" && target.role !== "ADMIN")) {
      return res.status(400).json({ message: "Invalid host" });
    }
    hostId = target.id;
  }
  if (!name || !address || !city || !country) {
  ```
  The existing `prisma.venue.create` `hostId` field (line 286) and the `producer.send("venue.created", { value: { id: venue.id, hostId } })` (line 294) now use the resolved `hostId` unchanged — no further edits there.

- [ ] **Step 5: Run the test — expect PASS.**
  ```
  pnpm --filter product-service test -- venue.controller
  ```
  Expected: the new test PASSES and all pre-existing `venue.controller` tests still PASS.

- [ ] **Step 6: Type-check — expect clean.**
  ```
  pnpm --filter product-service check-types
  ```
  Expected: exits 0, no output.

- [ ] **Step 7: Commit.**
  ```
  git add apps/product-service/src/controllers/venue.controller.ts apps/product-service/src/controllers/venue.controller.test.ts
  git commit -m "feat(product-service): createVenue accepts ADMIN-set body.hostId"
  ```

### Task 15: createVenue body.hostId — guard non-admin and invalid-target paths

**Files:**
- Modify: `apps/product-service/src/controllers/venue.controller.ts` (createVenue — no new code expected; this task proves the guards from Task 14)
- Test: `apps/product-service/src/controllers/venue.controller.test.ts`

Context: locks in the two security/validation edges the spec calls out (Error handling: "Venue `hostId` that isn't an active HOST/ADMIN → 400, venue not created"; gotcha: non-admin `body.hostId` must be ignored). These should already pass given Task 14's implementation — this task is a guard-test, written failing-first against the asserted behavior to confirm no regression and that `venue.create` is NOT called on the 400 path.

- [ ] **Step 1: Write tests — invalid target 400, and non-admin ignored.**
  In `apps/product-service/src/controllers/venue.controller.test.ts`, add inside `describe("venue controller contract", ...)`:
  ```ts
  it("rejects body.hostId that is not an active HOST/ADMIN with 400 and no create", async () => {
    mocks.lookupActiveUser.mockResolvedValueOnce(null);
    const req = {
      body: {
        name: "Venue",
        address: "Str. 1",
        city: "Chisinau",
        country: "Moldova",
        hostId: "ghost",
      },
      userId: "admin-1",
      user: { userId: "admin-1", email: "a@b.co", role: "ADMIN" },
    } as unknown as Request;
    const res = createResponse();

    await createVenue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid host" });
    expect(mocks.venueCreate).not.toHaveBeenCalled();
  });

  it("rejects body.hostId resolving to a USER with 400", async () => {
    mocks.lookupActiveUser.mockResolvedValueOnce({ id: "u-1", role: "USER" });
    const req = {
      body: {
        name: "Venue",
        address: "Str. 1",
        city: "Chisinau",
        country: "Moldova",
        hostId: "u-1",
      },
      userId: "admin-1",
      user: { userId: "admin-1", email: "a@b.co", role: "ADMIN" },
    } as unknown as Request;
    const res = createResponse();

    await createVenue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.venueCreate).not.toHaveBeenCalled();
  });

  it("ignores body.hostId for a non-ADMIN caller and uses req.userId", async () => {
    mocks.venueCreate.mockResolvedValue({ id: 22, hostId: "host-1" });
    const req = {
      body: {
        name: "Venue",
        address: "Str. 1",
        city: "Chisinau",
        country: "Moldova",
        hostId: "someone-else",
      },
      userId: "host-1",
      user: { userId: "host-1", email: "h@b.co", role: "HOST", hostVerified: true },
    } as unknown as Request;
    const res = createResponse();

    await createVenue(req, res);

    expect(mocks.lookupActiveUser).not.toHaveBeenCalled();
    expect(mocks.venueCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ hostId: "host-1" }),
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
  ```

- [ ] **Step 2: Run the tests — expect PASS.**
  ```
  pnpm --filter product-service test -- venue.controller
  ```
  Expected: all three new tests PASS (behavior delivered by Task 14). If any FAIL, the Task 14 implementation is wrong — fix the controller, do not weaken the test.

- [ ] **Step 3: Manual verification — invalid hostId rejected, valid hostId persists.**
  With a local stack running and an ADMIN access token in `$ADMIN_TOKEN`:
  ```
  # invalid host -> 400, no venue created
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/venues \
    -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"X","address":"A","city":"C","country":"Co","hostId":"does-not-exist"}'
  ```
  Expected output: `400`.
  ```
  # valid host id ($HOST_ID is an active HOST) -> 201, venue.hostId == $HOST_ID
  curl -s -X POST http://localhost:3000/venues \
    -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
    -d "{\"name\":\"X\",\"address\":\"A\",\"city\":\"C\",\"country\":\"Co\",\"hostId\":\"$HOST_ID\"}" \
    | grep -o "\"hostId\":\"[^\"]*\""
  ```
  Expected output: `"hostId":"<value of $HOST_ID>"`.

- [ ] **Step 4: Type-check — expect clean.**
  ```
  pnpm --filter product-service check-types
  ```
  Expected: exits 0, no output.

- [ ] **Step 5: Commit.**
  ```
  git add apps/product-service/src/controllers/venue.controller.test.ts
  git commit -m "test(product-service): guard body.hostId invalid-target and non-admin paths"
  ```

---

## Subsystem: apps/admin (api layer, venue-form, user detail, middleware, vitest)

### Task 16: admin API layer — invite + host helpers (lib/invites.ts)

**Files:**
- Create: `apps/admin/src/lib/invites.ts`
- Test: `apps/admin/src/lib/invites.test.ts`

- [ ] **Step 1: Write the failing test for the API layer.** Create `apps/admin/src/lib/invites.test.ts`. It mocks `@/lib/apiFetch` (bearer/product path is not used here, but `searchHosts` uses `apiFetch`) and stubs `fetch` for the credentialed auth-service calls. Because `getInvite`/`acceptInvite` are public, they must NOT go through `apiFetch`; they must hit `NEXT_PUBLIC_AUTH_SERVICE_URL` directly with `credentials:"include"`.

  ```ts
  import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

  const apiFetch = vi.fn();
  vi.mock("@/lib/apiFetch", () => ({
    apiFetch: (...args: unknown[]) => apiFetch(...args),
    UnauthenticatedError: class UnauthenticatedError extends Error {},
  }));

  describe("lib/invites", () => {
    beforeEach(() => {
      apiFetch.mockReset();
      vi.stubGlobal("fetch", vi.fn());
    });
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.resetModules();
    });

    it("inviteUser POSTs to /users/:id/invite and returns inviteUrl", async () => {
      apiFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ inviteUrl: "https://admin.spacefly.ai/accept-invite?token=t", expiresAt: "2026-07-01T00:00:00.000Z" }),
      });
      const { inviteUser } = await import("./invites");
      const res = await inviteUser("u-1");
      expect(apiFetch).toHaveBeenCalledWith(
        expect.stringContaining("/users/u-1/invite"),
        expect.objectContaining({ method: "POST" })
      );
      expect(res.inviteUrl).toContain("token=t");
    });

    it("createHostInvite POSTs name+email to /users/host-invite", async () => {
      apiFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ userId: "u-2", inviteUrl: "https://x?token=t2", created: true }),
      });
      const { createHostInvite } = await import("./invites");
      const res = await createHostInvite({ name: "Ada", email: "ada@spacefly.ai" });
      const [, init] = apiFetch.mock.calls[0];
      expect(JSON.parse(init.body)).toEqual({ name: "Ada", email: "ada@spacefly.ai" });
      expect(res.userId).toBe("u-2");
      expect(res.created).toBe(true);
    });

    it("createHostInvite surfaces the 409 message", async () => {
      apiFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Email already in use by a non-host account" }),
      });
      const { createHostInvite } = await import("./invites");
      await expect(createHostInvite({ name: "X", email: "x@y.z" })).rejects.toThrow(
        "Email already in use by a non-host account"
      );
    });

    it("getInvite calls the public auth endpoint WITHOUT apiFetch and with credentials", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ valid: true, email: "ada@spacefly.ai", name: "Ada" }),
      });
      const { getInvite } = await import("./invites");
      const res = await getInvite("tok-123");
      expect(apiFetch).not.toHaveBeenCalled();
      const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain("/auth/invite/tok-123");
      expect(init.credentials).toBe("include");
      expect(res.valid).toBe(true);
      expect(res.email).toBe("ada@spacefly.ai");
    });

    it("acceptInvite POSTs token+newPassword to /auth/invite/accept with credentials", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          user: { id: "u-3", email: "ada@spacefly.ai", username: "ada", name: "Ada", role: "HOST", image: null },
          accessToken: "a",
          refreshToken: "r",
        }),
      });
      const { acceptInvite } = await import("./invites");
      const res = await acceptInvite({ token: "tok-9", newPassword: "Sup3rSecret!" });
      const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain("/auth/invite/accept");
      expect(init.credentials).toBe("include");
      expect(JSON.parse(init.body)).toEqual({ token: "tok-9", newPassword: "Sup3rSecret!" });
      expect(res.accessToken).toBe("a");
    });

    it("searchHosts uses apiFetch GET /users?role=HOST and forwards the query", async () => {
      apiFetch.mockResolvedValue({
        ok: true,
        json: async () => [{ id: "h-1", email: "h@s.ai", name: "Host", username: "host", role: "HOST" }],
      });
      const { searchHosts } = await import("./invites");
      const hosts = await searchHosts("ho");
      const [url] = apiFetch.mock.calls[0];
      expect(url).toContain("/users?role=HOST");
      expect(url).toContain("search=ho");
      expect(hosts[0].id).toBe("h-1");
    });
  });
  ```

- [ ] **Step 2: Run the test, expect FAIL (module missing).**

  ```
  pnpm --filter admin vitest run src/lib/invites.test.ts
  ```
  Expected: failure resolving `./invites` (`Failed to load url ./invites`).

- [ ] **Step 3: Implement `apps/admin/src/lib/invites.ts`.** Two fetch paths per GOTCHA #1: admin writes (`inviteUser`, `createHostInvite`, `searchHosts`) go through `apiFetch` (bearer + `X-Acting-Host-Id`); public redeem reads (`getInvite`, `acceptInvite`) go straight to the auth-service with `credentials:"include"` and NO bearer (cookie-authoritative, GOTCHA #4). `AUTH_SERVICE_URL` is module-private in `lib/auth.ts`, so redeclare it here.

  ```ts
  import { apiFetch } from "@/lib/apiFetch";
  import type { AuthResponse, User } from "@/lib/auth";

  const AUTH_SERVICE_URL =
    process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:8003";

  export interface InviteUserResult {
    inviteUrl: string;
    expiresAt: string;
  }

  export interface HostInviteResult {
    userId: string;
    inviteUrl: string;
    created: boolean;
  }

  export interface InviteLookup {
    valid: boolean;
    email?: string;
    name?: string;
    reason?: string;
  }

  /** Resend / first-time email invite for an existing user (admin, bearer). */
  export async function inviteUser(userId: string): Promise<InviteUserResult> {
    const res = await apiFetch(`${AUTH_SERVICE_URL}/users/${userId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: "" }));
      throw new Error(data.message || "Failed to send invite");
    }
    return res.json();
  }

  /** Find-or-create a HOST by email and invite them (admin, bearer). */
  export async function createHostInvite(input: {
    name: string;
    email: string;
  }): Promise<HostInviteResult> {
    const res = await apiFetch(`${AUTH_SERVICE_URL}/users/host-invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: "" }));
      throw new Error(data.message || "Failed to create host invite");
    }
    return res.json();
  }

  /** Public: validate a token and read the invitee's email/name (no auth). */
  export async function getInvite(token: string): Promise<InviteLookup> {
    const res = await fetch(
      `${AUTH_SERVICE_URL}/auth/invite/${encodeURIComponent(token)}`,
      { credentials: "include" }
    );
    if (!res.ok) {
      return { valid: false, reason: "lookup_failed" };
    }
    return res.json();
  }

  /** Public: redeem the token, set the password, and start a session (cookies). */
  export async function acceptInvite(input: {
    token: string;
    newPassword: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${AUTH_SERVICE_URL}/auth/invite/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "Could not accept this invite");
    }
    return res.json();
  }

  /** Reuse GET /users?role=HOST for the venue-form host picker (admin, bearer). */
  export async function searchHosts(query?: string): Promise<User[]> {
    const qs = query ? `&search=${encodeURIComponent(query)}` : "";
    const res = await apiFetch(`${AUTH_SERVICE_URL}/users?role=HOST${qs}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: "" }));
      throw new Error(data.message || "Failed to load hosts");
    }
    return res.json();
  }
  ```

- [ ] **Step 4: Run the test, expect PASS.**

  ```
  pnpm --filter admin vitest run src/lib/invites.test.ts
  ```
  Expected: `6 passed`.

- [ ] **Step 5: Type-check + commit.**

  ```
  pnpm --filter admin check-types
  ```
  Expected: clean exit. Commit: `feat(admin): invite/host API layer (inviteUser, createHostInvite, getInvite, acceptInvite, searchHosts)`.

### Task 17: admin venue-form — HostField + hostId on create

**Files:**
- Create: `apps/admin/src/components/venues/HostField.tsx`
- Test: `apps/admin/src/components/venues/HostField.test.tsx`
- Modify: `apps/admin/src/components/venues/venue-form.shared.ts` (add `hostId` to `VenueFormPayload`)
- Modify: `apps/admin/src/components/venues/venue-form.tsx` (render `HostField`)
- Modify: `apps/admin/src/app/(dashboard)/host/venues/new/page.tsx` (orchestrate host-invite + hostId)

- [ ] **Step 1: Write the failing test for `HostField`.** Create `apps/admin/src/components/venues/HostField.test.tsx`, mirroring the raw `react-dom/client` + `act` pattern (no RTL — GOTCHA #8). Mock `@/lib/invites` (`searchHosts`, `createHostInvite`). The component is controlled: it takes a `value: HostSelection | null` and `onChange`, exposing a "Select existing" search list and a "New host" (name + email) sub-form.

  ```tsx
  import React from "react";
  import { act } from "react";
  import { createRoot, type Root } from "react-dom/client";
  import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

  const searchHosts = vi.fn();
  const createHostInvite = vi.fn();

  vi.mock("@/lib/invites", () => ({
    searchHosts: (...a: unknown[]) => searchHosts(...a),
    createHostInvite: (...a: unknown[]) => createHostInvite(...a),
  }));

  describe("HostField", () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeAll(() => {
      (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    });

    beforeEach(() => {
      searchHosts.mockReset().mockResolvedValue([
        { id: "h-1", email: "host@spacefly.ai", name: "Existing Host", username: "host", role: "HOST" },
      ]);
      createHostInvite.mockReset();
      container = document.createElement("div");
      document.body.appendChild(container);
      root = createRoot(container);
    });

    afterEach(async () => {
      await act(async () => { root.unmount(); });
      container.remove();
    });

    it("searches and selects an existing host", async () => {
      const onChange = vi.fn();
      const mod = await import("./HostField");
      await act(async () => {
        root.render(React.createElement(mod.default, { value: null, onChange }));
      });
      const input = container.querySelector(
        'input[aria-label="Search hosts"]'
      ) as HTMLInputElement;
      await act(async () => {
        input.value = "ho";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
      const option = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Existing Host")
      ) as HTMLButtonElement;
      await act(async () => { option.click(); });
      expect(onChange).toHaveBeenCalledWith({ kind: "existing", id: "h-1", label: "Existing Host" });
    });

    it("captures a new host name + email", async () => {
      const onChange = vi.fn();
      const mod = await import("./HostField");
      await act(async () => {
        root.render(React.createElement(mod.default, { value: null, onChange }));
      });
      const toggle = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("New host")
      ) as HTMLButtonElement;
      await act(async () => { toggle.click(); });
      const nameInput = container.querySelector('input[aria-label="New host name"]') as HTMLInputElement;
      const emailInput = container.querySelector('input[aria-label="New host email"]') as HTMLInputElement;
      await act(async () => {
        nameInput.value = "Ada";
        nameInput.dispatchEvent(new Event("input", { bubbles: true }));
        emailInput.value = "ada@spacefly.ai";
        emailInput.dispatchEvent(new Event("input", { bubbles: true }));
      });
      expect(onChange).toHaveBeenLastCalledWith({ kind: "new", name: "Ada", email: "ada@spacefly.ai" });
    });
  });
  ```

- [ ] **Step 2: Run the test, expect FAIL (module missing).**

  ```
  pnpm --filter admin vitest run src/components/venues/HostField.test.tsx
  ```
  Expected: failure resolving `./HostField`.

- [ ] **Step 3: Implement `apps/admin/src/components/venues/HostField.tsx`.** Controlled component, exporting the `HostSelection` type so the page and form can share it. Debounced search via `searchHosts`; "New host" sub-form emits `{ kind:"new", name, email }` on each keystroke (parent owns submit-time validation). Uses existing `@/components/ui` primitives and `fieldClassName`/`labelClassName` from `./venue-form.shared`.

  ```tsx
  "use client";

  import { useEffect, useRef, useState } from "react";
  import { Button } from "@/components/ui/button";
  import { Label } from "@/components/ui/label";
  import { searchHosts } from "@/lib/invites";
  import type { User } from "@/lib/auth";
  import { fieldClassName, labelClassName } from "./venue-form.shared";

  export type HostSelection =
    | { kind: "existing"; id: string; label: string }
    | { kind: "new"; name: string; email: string };

  interface HostFieldProps {
    value: HostSelection | null;
    onChange: (value: HostSelection | null) => void;
  }

  const HostField = ({ value, onChange }: HostFieldProps) => {
    const [mode, setMode] = useState<"existing" | "new">("existing");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<User[]>([]);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (mode !== "existing") return;
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => {
        searchHosts(query || undefined)
          .then(setResults)
          .catch(() => setResults([]));
      }, 250);
      return () => {
        if (debounce.current) clearTimeout(debounce.current);
      };
    }, [mode, query]);

    return (
      <div className="space-y-3">
        <Label className={labelClassName}>Host</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "existing" ? "default" : "outline"}
            onClick={() => {
              setMode("existing");
              onChange(null);
            }}
          >
            Existing host
          </Button>
          <Button
            type="button"
            variant={mode === "new" ? "default" : "outline"}
            onClick={() => {
              setMode("new");
              onChange(name || email ? { kind: "new", name, email } : null);
            }}
          >
            New host
          </Button>
        </div>

        {mode === "existing" ? (
          <div className="space-y-2">
            <input
              aria-label="Search hosts"
              className={fieldClassName}
              placeholder="Search by name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {value?.kind === "existing" && (
              <p className="text-sm text-muted-foreground">
                Selected: {value.label}
              </p>
            )}
            <ul className="space-y-1">
              {results.map((host) => (
                <li key={host.id}>
                  <button
                    type="button"
                    className="w-full rounded-md border border-input px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() =>
                      onChange({
                        kind: "existing",
                        id: host.id,
                        label: host.name || host.username || host.email,
                      })
                    }
                  >
                    {host.name || host.username} — {host.email}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              aria-label="New host name"
              className={fieldClassName}
              placeholder="Full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                onChange({ kind: "new", name: e.target.value, email });
              }}
            />
            <input
              aria-label="New host email"
              type="email"
              className={fieldClassName}
              placeholder="name@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                onChange({ kind: "new", name, email: e.target.value });
              }}
            />
          </div>
        )}
      </div>
    );
  };

  export default HostField;
  ```

- [ ] **Step 4: Run the test, expect PASS.**

  ```
  pnpm --filter admin vitest run src/components/venues/HostField.test.tsx
  ```
  Expected: `2 passed`.

- [ ] **Step 5: Add optional `hostId` to `VenueFormPayload`.** Edit `apps/admin/src/components/venues/venue-form.shared.ts`. Add the field to the `VenueFormPayload` interface (after `workingHours`). Do NOT add it to `VenueFormValues`/`buildVenuePayload` — the host selection lives outside `VenueForm`'s internal `formData` and is merged by the page.

  ```ts
    currency: Currency;
    workingHours: WorkingHoursValue | null;
    hostId?: string;
  }
  ```

- [ ] **Step 6: Wire `HostField` into `VenueForm` via an optional render slot.** Edit `apps/admin/src/components/venues/venue-form.tsx`. Add an optional `hostField?: React.ReactNode` prop to `VenueFormProps` and render it inside the form (after the Basic Information section). This keeps `VenueForm` presentational and avoids `VenueForm` knowing about invites (DRY/YAGNI). In `VenueFormProps`:

  ```ts
    onSubmit: (payload: VenueFormPayload) => Promise<void>;
    hostField?: React.ReactNode;
  }
  ```
  Destructure `hostField` in the component signature and render it just inside `<form ...>` before the first `DashboardSection`:
  ```tsx
        <form onSubmit={handleSubmit} className="space-y-8">
          {hostField}
          <DashboardSection title="Basic Information" contentClassName="space-y-4">
  ```
  Note: the existing submit button stays `disabled={loading || formData.images.length === 0}` (GOTCHA #7); host validation is enforced by the page's `onSubmit` throwing (the error banner at lines 128-132 surfaces it).

- [ ] **Step 7: Orchestrate host-invite + hostId in the new-venue page.** Edit `apps/admin/src/app/(dashboard)/host/venues/new/page.tsx`. Add `HostField` state, pass it via the new `hostField` prop, and in `handleCreate`: if `new`, call `createHostInvite` first to get `userId`; then POST `/venues` with `hostId`. Keep the existing `apiFetch` + `UnauthenticatedError` flow (GOTCHA #1: venue write uses `apiFetch` + `PRODUCT_SERVICE_URL`).

  ```tsx
  "use client";

  import { useCallback, useState } from "react";
  import { useRouter } from "next/navigation";
  import { toast } from "react-toastify";

  import VenueForm from "@/components/venues/venue-form";
  import HostField, { type HostSelection } from "@/components/venues/HostField";
  import {
    PRODUCT_SERVICE_URL,
    type VenueFormPayload,
  } from "@/components/venues/venue-form.shared";
  import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";
  import { createHostInvite } from "@/lib/invites";

  const NewVenuePage = () => {
    const router = useRouter();
    const [host, setHost] = useState<HostSelection | null>(null);

    const handleCreate = useCallback(
      async (payload: VenueFormPayload) => {
        try {
          let hostId: string | undefined;
          let invited = false;

          if (host?.kind === "new") {
            if (!host.name.trim() || !host.email.trim()) {
              throw new Error("Enter the new host's name and email.");
            }
            const { userId } = await createHostInvite({
              name: host.name.trim(),
              email: host.email.trim(),
            });
            hostId = userId;
            invited = true;
          } else if (host?.kind === "existing") {
            hostId = host.id;
          }

          const response = await apiFetch(`${PRODUCT_SERVICE_URL}/venues`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(hostId ? { ...payload, hostId } : payload),
          });

          if (!response.ok) {
            const data = await response.json().catch(() => ({ message: "" }));
            throw new Error(data.message || "Failed to create venue");
          }

          toast.success(
            invited ? "Venue created and invite emailed to the host." : "Venue created."
          );
          router.push("/host/venues");
        } catch (error) {
          if (error instanceof UnauthenticatedError) {
            router.push("/login");
            throw new Error("Please sign in again.");
          }
          throw error;
        }
      },
      [host, router]
    );

    return (
      <VenueForm
        title="Create New Venue"
        description="Fill in the details for your venue property"
        backHref="/host/venues"
        submitLabel="Create Venue"
        submittingLabel="Creating..."
        onSubmit={handleCreate}
        hostField={<HostField value={host} onChange={setHost} />}
      />
    );
  };

  export default NewVenuePage;
  ```

- [ ] **Step 8: Type-check, re-run the venue tests, commit.**

  ```
  pnpm --filter admin check-types
  pnpm --filter admin vitest run src/components/venues/HostField.test.tsx
  ```
  Expected: clean type-check, `2 passed`. Commit: `feat(admin): HostField on venue form + explicit hostId on create`.

### Task 18: admin user-detail — "Send invite" button (SendInvite component)

**Files:**
- Create: `apps/admin/src/components/SendInvite.tsx`
- Test: `apps/admin/src/components/SendInvite.test.tsx`
- Modify: `apps/admin/src/app/(dashboard)/admin/users/[id]/page.tsx` (mount alongside `SetTempPassword`)

- [ ] **Step 1: Write the failing test for `SendInvite`.** Create `apps/admin/src/components/SendInvite.test.tsx`, copying the `SetTempPassword.test.tsx` harness exactly (raw `react-dom`, mock `@/components/ui/sheet`, `react-toastify`). Mock `@/lib/invites` `inviteUser` instead of stubbing fetch — the API layer is already tested.

  ```tsx
  import React from "react";
  import { act } from "react";
  import { createRoot, type Root } from "react-dom/client";
  import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

  const inviteUser = vi.fn();
  vi.mock("@/lib/invites", () => ({ inviteUser: (...a: unknown[]) => inviteUser(...a) }));
  vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
  vi.mock("@/components/ui/sheet", () => ({
    SheetContent: ({ children }: { children: React.ReactNode }) => <div data-slot="sheet-content">{children}</div>,
    SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    SheetDescription: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <div>{children}</div>,
  }));

  describe("SendInvite", () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeAll(() => {
      (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    });

    beforeEach(() => {
      inviteUser.mockReset().mockResolvedValue({
        inviteUrl: "https://admin.spacefly.ai/accept-invite?token=abc",
        expiresAt: "2026-07-01T00:00:00.000Z",
      });
      container = document.createElement("div");
      document.body.appendChild(container);
      root = createRoot(container);
    });

    afterEach(async () => {
      await act(async () => { root.unmount(); });
      container.remove();
    });

    it("sends an invite and reveals the copyable invite URL", async () => {
      const mod = await import("./SendInvite");
      await act(async () => {
        root.render(React.createElement(mod.default, { userId: "u-1", email: "host@spacefly.ai" }));
      });
      const btn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Send invite")
      ) as HTMLButtonElement;
      await act(async () => { btn.click(); });
      await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
      expect(inviteUser).toHaveBeenCalledWith("u-1");
      expect(container.textContent).toContain("https://admin.spacefly.ai/accept-invite?token=abc");
    });
  });
  ```

- [ ] **Step 2: Run the test, expect FAIL (module missing).**

  ```
  pnpm --filter admin vitest run src/components/SendInvite.test.tsx
  ```
  Expected: failure resolving `./SendInvite`.

- [ ] **Step 3: Implement `apps/admin/src/components/SendInvite.tsx`.** Mirror `SetTempPassword`: renders `<SheetContent>` with NO own `<Sheet>` (parent provides it — GOTCHA #6). Reuse the `CredentialRow` copy pattern; resendable (button stays available after success). Calls `inviteUser` from the API layer.

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
  import { Label } from "./ui/label";
  import { inviteUser } from "@/lib/invites";
  import { toast } from "react-toastify";

  interface SendInviteProps {
    userId: string;
    email: string;
  }

  const SendInvite = ({ userId, email }: SendInviteProps) => {
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const send = async () => {
      setLoading(true);
      try {
        const { inviteUrl: url } = await inviteUser(userId);
        setInviteUrl(url);
        toast.success("Invite emailed");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to send invite");
      } finally {
        setLoading(false);
      }
    };

    const copy = async (label: string, value: string) => {
      try {
        if (!navigator.clipboard) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(value);
        toast.success(`${label} copied`);
      } catch {
        toast.error(`Couldn't copy ${label} — copy it manually`);
      }
    };

    return (
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="mb-4">Send invite</SheetTitle>
          <SheetDescription asChild>
            <div className="space-y-6 text-left">
              <p className="text-sm text-muted-foreground">
                Emails {email} a one-time magic link to set their password and sign in.
                Re-sending invalidates any earlier link.
              </p>
              <Button onClick={send} disabled={loading}>
                {loading ? "Sending…" : inviteUrl ? "Resend invite" : "Send invite (email link)"}
              </Button>
              {inviteUrl && (
                <div className="space-y-4">
                  <CredentialRow label="Invite link" value={inviteUrl} onCopy={copy} />
                  <p className="text-xs text-amber-600">
                    Share this link only as a fallback — the host also received it by email.
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
        <div className="flex items-center gap-2">
          <code
            aria-label={label}
            className="flex-1 rounded-md border border-black/10 bg-muted px-3 py-2 font-mono text-sm break-all"
          >
            {value}
          </code>
          <Button type="button" variant="outline" onClick={() => onCopy(label, value)}>
            Copy
          </Button>
        </div>
      </div>
    );
  }

  export default SendInvite;
  ```

- [ ] **Step 4: Run the test, expect PASS.**

  ```
  pnpm --filter admin vitest run src/components/SendInvite.test.tsx
  ```
  Expected: `1 passed`.

- [ ] **Step 5: Mount `SendInvite` on the user-detail page.** Edit `apps/admin/src/app/(dashboard)/admin/users/[id]/page.tsx`. Add the import after the `SetTempPassword` import (line 24):

  ```tsx
  import SetTempPassword from "@/components/SetTempPassword";
  import SendInvite from "@/components/SendInvite";
  ```
  Add a third `Sheet` inside the existing `flex gap-2` row (gated to HOST, alongside the temp-password fallback — spec §4), immediately after the `SetTempPassword` `Sheet` block (after line 224):
  ```tsx
                  {user.role === "HOST" && (
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline">Send invite</Button>
                      </SheetTrigger>
                      <SendInvite userId={user.id} email={user.email} />
                    </Sheet>
                  )}
  ```

- [ ] **Step 6: Type-check + commit.**

  ```
  pnpm --filter admin check-types
  ```
  Expected: clean. Commit: `feat(admin): resendable Send-invite action on user detail`.

### Task 19: admin public /accept-invite page (no middleware change)

**Files:**
- Create: `apps/admin/src/app/(auth)/accept-invite/page.tsx`
- Test: `apps/admin/src/app/(auth)/accept-invite/page.test.tsx`
- Modify: `apps/admin/src/middleware.ts` — **verify only, no change** (see Step 1)

- [ ] **Step 1: Confirm the matcher needs NO change (guard against a wrong edit).** Per GOTCHA #3 and recon, `/accept-invite` is public by default because the matcher is `["/admin/:path*","/host/:path*","/onboarding/:path*"]`. Adding it would gate the page behind `spacefly_access` and break logged-out acceptance. Verify and record the current matcher:

  ```
  grep -n "matcher" apps/admin/src/middleware.ts
  ```
  Expected output (unchanged): `matcher: ["/admin/:path*", "/host/:path*", "/onboarding/:path*"]`. Do NOT edit `middleware.ts`.

- [ ] **Step 2: Write the failing test for the accept-invite page.** Create `apps/admin/src/app/(auth)/accept-invite/page.test.tsx`. Mock `@/lib/invites` (`getInvite`, `acceptInvite`), `next/navigation` (`useRouter`, `useSearchParams`), and `@/stores/authStore` (to capture the post-accept session save). Two cases: valid token renders the email + a set-password form; submit calls `acceptInvite` and redirects.

  ```tsx
  import React from "react";
  import { act } from "react";
  import { createRoot, type Root } from "react-dom/client";
  import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

  const getInvite = vi.fn();
  const acceptInvite = vi.fn();
  const replace = vi.fn();
  const setSession = vi.fn();

  vi.mock("@/lib/invites", () => ({
    getInvite: (...a: unknown[]) => getInvite(...a),
    acceptInvite: (...a: unknown[]) => acceptInvite(...a),
  }));
  vi.mock("next/navigation", () => ({
    useRouter: () => ({ replace }),
    useSearchParams: () => new URLSearchParams("token=tok-1"),
  }));
  vi.mock("@/stores/authStore", () => ({ default: () => ({ setSession }) }));

  describe("AcceptInvitePage", () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeAll(() => {
      (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    });

    beforeEach(() => {
      getInvite.mockReset().mockResolvedValue({ valid: true, email: "ada@spacefly.ai", name: "Ada" });
      acceptInvite.mockReset().mockResolvedValue({
        user: { id: "u-1", email: "ada@spacefly.ai", username: "ada", name: "Ada", role: "HOST", image: null },
        accessToken: "a",
        refreshToken: "r",
        requiresPasswordChange: false,
      });
      replace.mockReset();
      setSession.mockReset();
      container = document.createElement("div");
      document.body.appendChild(container);
      root = createRoot(container);
    });

    afterEach(async () => {
      await act(async () => { root.unmount(); });
      container.remove();
    });

    it("renders the invitee email for a valid token", async () => {
      const mod = await import("./page");
      await act(async () => { root.render(React.createElement(mod.default)); });
      await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
      expect(container.textContent).toContain("ada@spacefly.ai");
    });

    it("submits the new password and redirects into the app", async () => {
      const mod = await import("./page");
      await act(async () => { root.render(React.createElement(mod.default)); });
      await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
      const pw = container.querySelector('input[type="password"]') as HTMLInputElement;
      await act(async () => {
        pw.value = "Sup3rSecret!";
        pw.dispatchEvent(new Event("input", { bubbles: true }));
      });
      const form = container.querySelector("form") as HTMLFormElement;
      await act(async () => {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });
      await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
      expect(acceptInvite).toHaveBeenCalledWith({ token: "tok-1", newPassword: "Sup3rSecret!" });
      expect(replace).toHaveBeenCalledWith("/host");
    });

    it("shows an invalid state for a bad token", async () => {
      getInvite.mockResolvedValueOnce({ valid: false, reason: "expired" });
      const mod = await import("./page");
      await act(async () => { root.render(React.createElement(mod.default)); });
      await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
      expect(container.textContent).toContain("no longer valid");
    });
  });
  ```

- [ ] **Step 3: Confirm the auth store exposes a session setter (or pick the existing one).** The accept response mirrors login; the page must persist it. Check the store's public API:

  ```
  grep -nE "setSession|saveTokens|saveUser|login:" apps/admin/src/stores/authStore.ts
  ```
  If a `setSession`/equivalent action exists, use it in Step 4; otherwise persist via the existing `saveTokens`/`saveUser` helpers from `@/lib/auth` and adjust the store mock in the test accordingly. (Decide here so the page and test agree on the exact symbol.)

- [ ] **Step 4: Implement `apps/admin/src/app/(auth)/accept-invite/page.tsx`.** Lives in the `(auth)` group to inherit `AuthLayout` chrome while staying outside the middleware matcher (GOTCHA #3). Wrap in `<Suspense>` because `useSearchParams` forces out of static prerender (mirror the login page). Loads invite via `getInvite`, renders email/name or an invalid state, submits via `acceptInvite`, persists the session, and `router.replace`s into the app. Uses `@/components/ui` `Input`/`Label`/`Button`.

  ```tsx
  "use client";

  import { Suspense, useEffect, useState } from "react";
  import { useRouter, useSearchParams } from "next/navigation";
  import useAuthStore from "@/stores/authStore";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { acceptInvite, getInvite, type InviteLookup } from "@/lib/invites";

  export default function AcceptInvitePage() {
    return (
      <Suspense fallback={<AcceptInviteShell />}>
        <AcceptInviteForm />
      </Suspense>
    );
  }

  function AcceptInviteShell() {
    return (
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-semibold">Accept your invitation</h1>
        <p className="text-sm text-[var(--auth-muted)]">Loading your invite…</p>
      </div>
    );
  }

  function AcceptInviteForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setSession } = useAuthStore();
    const token = searchParams.get("token") ?? "";

    const [lookup, setLookup] = useState<InviteLookup | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      if (!token) {
        setLookup({ valid: false, reason: "missing_token" });
        return;
      }
      getInvite(token)
        .then(setLookup)
        .catch(() => setLookup({ valid: false, reason: "lookup_failed" }));
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setSubmitting(true);
      try {
        const session = await acceptInvite({ token, newPassword });
        setSession(session);
        router.replace(session.user.role === "ADMIN" ? "/admin" : "/host");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not accept this invite");
      } finally {
        setSubmitting(false);
      }
    };

    if (!lookup) return <AcceptInviteShell />;

    if (!lookup.valid) {
      return (
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">Invitation unavailable</h1>
          <p className="text-sm text-[var(--auth-muted)]">
            This invite is no longer valid — ask your admin to resend it.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center lg:text-left">
          <h1 className="text-2xl font-semibold">Accept your invitation</h1>
          <p className="text-sm text-[var(--auth-muted)]">
            Welcome{lookup.name ? `, ${lookup.name}` : ""}. Set a password for{" "}
            <strong>{lookup.email}</strong> to finish.
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
              placeholder="••••••••"
              className="h-11 rounded-xl border-black/10 bg-white"
            />
          </div>
          <Button
            type="submit"
            size="xl"
            disabled={submitting || newPassword.length === 0}
            className="h-12 w-full rounded-xl bg-[var(--auth-brand)] text-white hover:bg-[var(--auth-brand-hover)]"
          >
            {submitting ? "Setting up…" : "Accept invite & continue"}
          </Button>
        </form>
      </div>
    );
  }
  ```
  Note: if Step 3 found no `setSession`, replace `const { setSession } = useAuthStore();` + `setSession(session)` with the discovered persistence path (e.g. `saveTokens`/`saveUser` from `@/lib/auth`) and keep the test's store mock in sync.

- [ ] **Step 5: Run the page test, expect PASS.**

  ```
  pnpm --filter admin vitest run "src/app/(auth)/accept-invite/page.test.tsx"
  ```
  Expected: `3 passed`.

- [ ] **Step 6: Full admin suite + type-check + commit.**

  ```
  pnpm --filter admin check-types
  pnpm --filter admin test
  ```
  Expected: clean type-check; all suites pass (new files: `invites.test.ts`, `HostField.test.tsx`, `SendInvite.test.tsx`, `accept-invite/page.test.tsx`). Commit: `feat(admin): public /accept-invite page (set password, start session)`.

### Task 20: admin env wiring for invite link base

**Files:**
- Modify: `apps/admin/.env.example`

- [ ] **Step 1: Document the invite-link base env.** The link base lives on the email-service producer (`INVITE_LINK_BASE`), but the admin app's `/accept-invite` page is its target. Add a comment-only note to `apps/admin/.env.example` so deployers know the admin origin must match `INVITE_LINK_BASE` (no new `NEXT_PUBLIC_*` is required — the page reads `?token` at runtime, GOTCHA #2). Append after the existing `NEXT_PUBLIC_ADMIN_URL` line:

  ```
  # Invite magic links point at this app's /accept-invite route.
  # The email-service INVITE_LINK_BASE must equal "<NEXT_PUBLIC_ADMIN_URL>/accept-invite"
  # e.g. https://admin.spacefly.ai/accept-invite
  ```

- [ ] **Step 2: Commit.** Commit: `docs(admin): note INVITE_LINK_BASE must target /accept-invite`.

---

## Subsystem: End-to-end verification

### Task 21: End-to-end manual verification

**Goal:** Exercise the full create-venue + invite + accept happy path against the local stack, proving the four subsystems interoperate.

**Prerequisites:** Local stack up (`docker compose up`), DB migrated (Task 2 applied), all services rebuilt with the new code, and `INVITE_LINK_BASE=http://localhost:3001/accept-invite` (or your admin origin) set in both auth-service and email-service. Have an admin access token in `$ADMIN` and the admin app running.

- [ ] **Step 1: Confirm envs and topic wiring.** Verify both services see the invite env and the topic is subscribed:
  ```
  grep -rn INVITE_LINK_BASE apps/auth-service/.env.example apps/email-service/.env.example docker-compose.yml .env.example .github/workflows/ci.yml
  grep -c '"user.invited"' apps/email-service/src/index.ts
  ```
  Expected: `INVITE_LINK_BASE` present across all five files; `user.invited` count is `1`.

- [ ] **Step 2: Create a HOST + invite via host-invite (new host path).** With `$ADMIN`:
  ```
  curl -s -X POST http://localhost:4001/users/host-invite \
    -H "authorization: Bearer $ADMIN" -H 'content-type: application/json' \
    -d '{"name":"E2E Host","email":"e2e-host@example.com"}' | jq
  ```
  Expected: `{ "userId": "<cuid>", "inviteUrl": "http://localhost:3001/accept-invite?token=...", "created": true }`. Capture `userId` as `$HOST_ID` and the `?token=` value as `$TOKEN`. Check the email-service logs show a `user.invited` send for `e2e-host@example.com` (or, in dev without Resend, the readiness gate passed and the handler ran).

- [ ] **Step 3: Create a venue assigned to that host (ADMIN body.hostId).** With `$ADMIN`:
  ```
  curl -s -X POST http://localhost:3000/venues \
    -H "authorization: Bearer $ADMIN" -H 'content-type: application/json' \
    -d "{\"name\":\"E2E Venue\",\"address\":\"A\",\"city\":\"C\",\"country\":\"Co\",\"images\":[\"https://x/i.jpg\"],\"hostId\":\"$HOST_ID\"}" \
    | grep -o "\"hostId\":\"[^\"]*\""
  ```
  Expected: `"hostId":"<value of $HOST_ID>"` — the venue is owned by the invited host, not the admin.

- [ ] **Step 4: Validate the invite token (public GET).**
  ```
  curl -s "http://localhost:4001/auth/invite/$TOKEN" | jq
  ```
  Expected: `{ "valid": true, "email": "e2e-host@example.com", "name": "E2E Host" }`.

- [ ] **Step 5: Accept the invite (public POST) and confirm session issuance.**
  ```
  curl -si -X POST http://localhost:4001/auth/invite/accept \
    -H 'content-type: application/json' \
    -d "{\"token\":\"$TOKEN\",\"newPassword\":\"hunter2hunter2\"}"
  ```
  Expected: `HTTP/1.1 200`, body `{ user, accessToken, refreshToken }`, and `Set-Cookie` for the access + refresh cookies. Re-running the same call returns `HTTP/1.1 410` (`"This invite has already been used."`), and `GET /auth/invite/$TOKEN` now returns `{ "valid": false, "reason": "ALREADY_ACCEPTED" }`.

- [ ] **Step 6: Confirm the accepted user can log in (emailVerified gate closed).**
  ```
  curl -s -X POST http://localhost:4001/auth/login \
    -H 'content-type: application/json' \
    -d '{"email":"e2e-host@example.com","password":"hunter2hunter2"}' | jq '.user.role'
  ```
  Expected: `"HOST"` with no `EMAIL_NOT_VERIFIED` error — proving accept set `emailVerified=true` and `mustChangePassword=false`.

- [ ] **Step 7: UI walkthrough (browser).** In the admin app: open a venue's "Create New Venue" form, switch the HostField to "New host", enter a name + email, and submit — expect the toast "Venue created and invite emailed to the host." and a new venue owned by that host. On a HOST user's detail page, click "Send invite", confirm the copyable invite link appears. Finally, open the emailed/copied `/accept-invite?token=...` link in a logged-out browser, set a password, and confirm you land in `/host`.

- [ ] **Step 8: Full type-check + suites across the monorepo.**
  ```
  pnpm check-types
  pnpm --filter product-service test -- venue.controller
  pnpm --filter admin test
  ```
  Expected: all green. This is the final gate before merging the Host Invite Flow.