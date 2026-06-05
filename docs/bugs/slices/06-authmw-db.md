# Slice 06 — packages/auth-middleware + packages/db

**Scope:** Shared JWT/password helpers/middleware + Prisma schema/migrations/client wrapper
**Files reviewed:** 24 (8 in auth-middleware/src, schema.prisma, 11 migration.sql files, client.ts, index.ts, seed.ts, package.json, .env, migration_lock.toml; plus cross-checked ~10 call sites in apps/auth-service, apps/order-service, apps/product-service, and packages/types)
**Findings:** 20 (8 AUTHMW + 12 DB)

---

## AUTHMW-001 — `verifyAccessToken` accepts any JWT algorithm the signer chooses (algorithm-confusion / `alg:none` risk depends on lib defaults)

- **Severity:** medium
- **Category:** jwt
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/auth-middleware/src/jwt.ts`
- **Symbol:** `verifyAccessToken`, `verifyRefreshToken`

**Root cause:** `jwt.verify(token, secret)` is called with no `algorithms` option. `jsonwebtoken@9` defaults to allowing whichever algorithm matches the secret type (HS* for strings), which is safer than v8, but the package still allows the algorithm in the JWT header to drive verification when an `algorithms` array is omitted — and any future migration to RS*/asymmetric keys without re-pinning would silently re-enable algorithm confusion attacks. Sign and verify also never set/check `issuer`, `audience`, `subject`, or `jwtid`, so a token minted for the admin service is interchangeable with one minted for the storefront (cross-service confused deputy).

**Impact:** A leaked token from any service can be used against any other. If anyone ever rotates to RSA keys (e.g., for SSO) without simultaneously editing this file, "none" / HS-on-RSA attacks become possible.

**Fix plan:** Pass `{ algorithms: ["HS256"] }` (and matching `algorithm` on `sign`), plus `issuer`/`audience` claims per service. Document the requirement in the package README.

---

## AUTHMW-002 — `extractTokenFromHeader` is case-sensitive on the `Bearer ` prefix

- **Severity:** low
- **Category:** jwt
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/auth-middleware/src/jwt.ts:49-54`
- **Symbol:** `extractTokenFromHeader`

**Root cause:** `authHeader.startsWith("Bearer ")` rejects `bearer abc…`, `BEARER abc…`, or `Bearer  abc…` (double space). RFC 6750 says the scheme is case-insensitive. Clients that lowercase the auth header (some proxies/SDKs do) will see 401 with a confusing "No token provided" message.

**Impact:** Sporadic auth failures from third-party clients / mobile SDKs / reverse proxies. Not a security hole, but a stability/interop bug in a shared primitive.

**Fix plan:** Compare with `authHeader.slice(0, 7).toLowerCase() === "bearer "` and trim the remainder before returning.

---

## AUTHMW-003 — Login does not normalize email; unique-index race lets two accounts share the same address via case differences

- **Severity:** high
- **Category:** other (cross-package, but rooted in `User.email` uniqueness contract owned by `packages/db`)
- **Verdict:** real
- **Confidence:** high
- **File (consumer that demonstrates the bug):** `/Users/cristian/Development/spacefly-ai/apps/auth-service/src/routes/auth.route.ts:38-122`
- **Schema involved:** `/Users/cristian/Development/spacefly-ai/packages/db/prisma/schema.prisma:69` (`email String @unique`)

**Root cause:** Postgres `TEXT` `UNIQUE` is case-sensitive. `prisma.user.create({ data: { email } })` stores the raw input. `prisma.user.findUnique({ where: { email } })` on login matches exact case. So `Alice@x.com` and `alice@x.com` are two different rows; a registration with mixed-case email can shadow an existing user, then the existing user can no longer log in with their lowercase form. Concurrent registration with two case variants both succeed.

**Impact:** Account-collision / takeover surface, broken login flows. Customer-support nightmare.

**Fix plan:** Either (a) normalize email to lowercase in `packages/auth-middleware/src/password.ts`/sign helpers, or (b) change `User.email` to `citext` in a migration and add `@db.Citext`. Backfill with `UPDATE "User" SET email = lower(email);` after dedup.

---

## AUTHMW-004 — `RegisterSchema` enforces a 6-character password minimum; the runtime `hashPassword`/`comparePassword` have no minimum and accept empty strings

- **Severity:** medium
- **Category:** password
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/auth-middleware/src/password.ts`
- **Symbol:** `hashPassword`, `comparePassword`

**Root cause:** Validation lives only in the Zod schemas in `packages/types`. `apps/auth-service/src/routes/auth.route.ts:36-66` does **not** parse the body with `RegisterSchema` — it only checks `!email || !username || !password`, then directly calls `hashPassword(password)`. `""` is truthy-falsy correctly rejected, but `" "`, `"a"`, or a 10 000-char DoS string all pass through. bcrypt silently truncates inputs >72 bytes, so long passwords have only the first 72 characters meaningful.

**Impact:** Trivial password policy bypass; potential CPU DoS via huge passwords (bcrypt cost factor 12 × giant input = slow); silent truncation means a user setting a 100-char password and a different user with the same first 72 chars hash identically.

**Fix plan:** Add `if (password.length < 8 || password.length > 72)` guard at the top of `hashPassword`. Better: route handlers should use the Zod schema (they already import `@repo/types`).

---

## AUTHMW-005 — `BCRYPT_ROUNDS` parsed with no validation; bad env value silently downgrades to 0 rounds (or NaN throw)

- **Severity:** medium
- **Category:** password
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/auth-middleware/src/password.ts:3`
- **Symbol:** `BCRYPT_ROUNDS`

**Root cause:** `parseInt(process.env.BCRYPT_ROUNDS || "12", 10)` accepts garbage. `BCRYPT_ROUNDS="abc"` → `NaN` → bcryptjs throws at hash time. `BCRYPT_ROUNDS="0"` → `0` rounds → effectively unhashed (bcryptjs may reject, depends on version). `BCRYPT_ROUNDS="4"` (a Heroku-style "save money" tweak) silently weakens every password hash for the entire platform.

**Impact:** Silent security regression possible via env misconfiguration in any deployed service.

**Fix plan:** `const n = Number(process.env.BCRYPT_ROUNDS); BCRYPT_ROUNDS = Number.isInteger(n) && n >= 10 && n <= 15 ? n : 12;` Log a warning on fallback.

---

## AUTHMW-006 — `signRefreshToken` and `signAccessToken` share the same `userId/email/role/hostVerified` payload shape; refresh tokens are accepted by `verifyAccessToken` if `JWT_SECRET === JWT_REFRESH_SECRET`

- **Severity:** medium
- **Category:** session
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/auth-middleware/src/jwt.ts`
- **Symbol:** `signRefreshToken`, `verifyAccessToken`

**Root cause:** `jwt.ts` itself enforces the two secrets are present, but does not enforce they are different, nor does it stamp a `typ` / `token_use` claim. Several deployed services (see `apps/product-service/.env`, `apps/order-service/.env`) only set `JWT_SECRET`, not `JWT_REFRESH_SECRET`. If an operator copy-pastes the same value (or just sets one variable for "simplicity"), a stolen refresh token becomes a permanent (7-day) access token usable against every protected endpoint.

**Impact:** Catastrophic if operator misconfigures envs — the design encourages the mistake. Refresh tokens have much longer lifetime than access tokens; treating them as access tokens defeats the rotation model.

**Fix plan:** Embed `{ tokenUse: "access" | "refresh" }` in the payload and check it inside `verifyAccessToken` / `verifyRefreshToken`. Optionally throw at startup if `JWT_SECRET === JWT_REFRESH_SECRET`.

---

## AUTHMW-007 — `shouldBeUser` Fastify variant does not `return` reply after authentication failure; subsequent handler middlewares can still attach

- **Severity:** low
- **Category:** adapter-divergence
- **Verdict:** unclear
- **Confidence:** medium
- **File:** `/Users/cristian/Development/spacefly-ai/packages/auth-middleware/src/fastify.ts:13-119`
- **Symbol:** `shouldBeUser` (and the other three) — Fastify variant

**Root cause:** In Fastify, an async preHandler that calls `reply.status(401).send(...)` should also `return reply` (or `return`) to short-circuit. The current code does `return reply.status(401).send(...)`, which in Fastify v5 *does* terminate request processing because `reply.send()` returns the reply object and Fastify aborts when the preHandler resolves to the same reply object. So as written this is correct *for Fastify v5* — but the express adapter sets `req.user` *after* a `return next()` would have run, and `next()` is never called explicitly here. The hono adapter calls `await next()` only on the success path, which is the correct pattern. The Fastify file looks fine, but its correctness is implicit in Fastify framework internals; an upgrade to Fastify v6 could change this. **Verdict:** unclear; flag for hardening (explicit `return`/`done()` patterns) rather than as an exploitable bug today.

**Impact:** None today; future-fastify hazard.

**Fix plan:** Either explicitly throw a Fastify auth error (`throw fastify.httpErrors.unauthorized(...)` via `@fastify/sensible`) or document the dependency on Fastify's preHandler short-circuit semantics.

---

## AUTHMW-008 — `verifyAccessToken` returns `null` on every error class, leaking no distinction between "expired" and "tampered"; clients cannot trigger refresh correctly

- **Severity:** low
- **Category:** jwt
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/auth-middleware/src/jwt.ts:33-47`
- **Symbol:** `verifyAccessToken`, `verifyRefreshToken`

**Root cause:** All exceptions (`TokenExpiredError`, `JsonWebTokenError`, `NotBeforeError`) are swallowed and collapsed to `null`. The middleware then always returns `401 "Invalid or expired token"`. The client cannot distinguish "I should silently refresh" from "I should force re-login". The login flow in `apps/auth-service/src/routes/auth.route.ts:189-228` is built around refresh, but the frontend has no signal to use it.

**Impact:** Worse UX (users get logged out when they should be silently refreshed), bigger attack surface (frontends often retry login on any 401, exposing creds to logging/proxies).

**Fix plan:** Return a tagged result `{ ok: true, payload } | { ok: false, reason: "expired"|"invalid" }`, or have middleware distinguish 401-with-`WWW-Authenticate: Bearer error="invalid_token"` vs `error="token_expired"` per RFC 6750.

---

## DB-001 — `Payout.amount`, `platformFee`, `netAmount` are `Int` while `Booking.totalAmount` is `Float`; unit drift (cents vs dollars) means payouts and bookings cannot be reconciled in SQL

- **Severity:** critical
- **Category:** schema
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/db/prisma/schema.prisma:398-417` (`Payout`) vs lines 332-337 (`Booking`)
- **Symbol:** `Payout.amount`, `Booking.totalAmount`

**Root cause:** The `20260424002000_use_dollar_units` migration converted `Booking.subtotal/serviceFee/cleaningFee/totalAmount` to `DOUBLE PRECISION` and the schema comments say "in dollars". `Payout.amount` was never migrated and is still `INTEGER` with no comment. `packages/types/src/payout.ts:9` claims `amount: number; // In dollars`. The order-service does `prisma.payout.aggregate({ _sum: { netAmount: true } })` without any conversion. So either Payout amounts are cents (and the types file is wrong → 100× under-reporting of host earnings) or they are integer-truncated dollars (losing every cent). Either way, summing Payouts and Bookings produces inconsistent numbers.

**Impact:** Money handling is incorrect. Hosts under- or over-paid. Reports mismatched between booking revenue and payouts.

**Fix plan:** Decide a single representation. The cleanest is to migrate all monetary columns (Booking, Space, Payout, PricingTier, ExchangeRate) to `Decimal(12, 2)` (`@db.Decimal(12, 2)` in Prisma) — never `Float` and never raw `Int`. Backfill `Payout.amount = old_int_value / 100.0` (if cents) or `* 1.0` (if dollars).

---

## DB-002 — `Payout` has no `currency` column; multi-currency hosts cannot have correct payouts

- **Severity:** high
- **Category:** schema
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/db/prisma/schema.prisma:398-417`
- **Symbol:** `Payout`

**Root cause:** `Currency` enum was added by migration `20260512120000_add_currency_and_pricing_tiers` to `Venue`, `Space`, and `Booking`, but `Payout` was overlooked. A host with one booking in `USD` and one in `MDL` would have their payouts aggregated without any currency tag, mixing units.

**Impact:** Wrong payout values to hosts in EUR/MDL; will only become visible once those currencies are used in production.

**Fix plan:** Add `currency Currency @default(USD)` to `Payout`. Backfill from related bookings (use `bookingIds[]` to find the dominant currency).

---

## DB-003 — `User.email` and `User.username` have both `@unique` and a redundant single-column `@@index([email])` / `@@index([username])`; double index on hot columns

- **Severity:** low
- **Category:** index
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/db/prisma/schema.prisma:94-96`
- **Symbol:** `User` indexes

**Root cause:** `@unique` already creates a btree index. Adding `@@index([email])` and `@@index([username])` creates a second identical index. Postgres won't use both; they just consume disk and slow down writes.

**Impact:** Minor — extra writes, ~2× index storage on User. Not exploitable, but indicates copy-paste schema authoring that may have hidden other redundancies (`Session_token_idx` is also redundant with `Session_token_key`, schema.prisma:108).

**Fix plan:** Drop the redundant `@@index` lines; one migration `DROP INDEX "User_email_idx", "User_username_idx", "Session_token_idx";`.

---

## DB-004 — Most user-facing relations use `onDelete: RESTRICT` (default, not declared), but business code calls `prisma.user.delete()` directly (admin "delete user"); will always fail in production

- **Severity:** high
- **Category:** cascade
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/db/prisma/schema.prisma` (User relations to Venue:138, Space:208, Booking:356/357, Review:388, Payout:413) and consumer at `/Users/cristian/Development/spacefly-ai/apps/auth-service/src/routes/user.route.ts:222-235`
- **Symbol:** `User.delete()` path

**Root cause:** Schema relations from `User` to `Venue`/`Space`/`Booking`/`Review`/`Payout` have no `onDelete` clause → Prisma generates `ON DELETE RESTRICT` (visible in `20260423150000_init/migration.sql:292,310,313,319,328`). The admin route `DELETE /users/:id` calls `prisma.user.delete({ where: { id } })`. Any user that has ever booked, hosted, reviewed, or been paid out cannot be deleted; the endpoint will throw a Prisma P2003 foreign-key violation 500 and the admin will see "Internal server error". Also, GDPR "right to be forgotten" requests cannot be honored without manual SQL.

**Impact:** Admin "Delete user" silently broken for any non-empty account; legal compliance gap.

**Fix plan:** Either (a) implement soft-delete (add `deletedAt DateTime?` and use updateMany), (b) add `onDelete: Cascade` on Session only (already done) and anonymize Booking.guestId/hostId before deletion via a service-level transaction, or (c) change FKs to `ON DELETE SET NULL` for non-essential relations and make the IDs nullable.

---

## DB-005 — `Venue` has no `@@index([country])` despite being filtered/grouped by country in host browse pages

- **Severity:** low
- **Category:** index
- **Verdict:** unclear
- **Confidence:** medium
- **File:** `/Users/cristian/Development/spacefly-ai/packages/db/prisma/schema.prisma:147-151`
- **Symbol:** `Venue` indexes

**Root cause:** `Venue` indexes `hostId`, `city`, `isActive`, and `(latitude, longitude)` only. Several admin and host views query by `country` (e.g., space search includes `country` in select and filter). Volume today is small, but the moment a country filter ships, a sequential scan is guaranteed.

**Impact:** Future scale issue; not exploitable now.

**Fix plan:** Add `@@index([country])` or, better, `@@index([country, city])` to support the dropdown UX directly.

---

## DB-006 — `Booking.cancelledBy` is `String?` storing literal "GUEST" / "HOST" / "ADMIN" — no enum, no FK to `User.id`, and the order-service writes literals while reviews assume it's a userId

- **Severity:** medium
- **Category:** schema
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/db/prisma/schema.prisma:345` (`cancelledBy String?`) and writer at `/Users/cristian/Development/spacefly-ai/apps/order-service/src/routes/booking.ts:669`
- **Symbol:** `Booking.cancelledBy`

**Root cause:** The column name suggests "the user id who cancelled" (matching `guestId`, `hostId` patterns). The order-service stores the string `"GUEST"` / `"HOST"` / `"ADMIN"` instead — i.e., the role, not the user id. There is no enum constraint, no FK, no validation. Any future code that does `User.findUnique({ where: { id: booking.cancelledBy } })` will silently fail.

**Impact:** Data is semantically broken; refactors and analytics queries will fail or return garbage.

**Fix plan:** Either (a) rename column to `cancelledByRole` and convert to an enum `BookingActor { GUEST, HOST, ADMIN }`, or (b) store the actual user id and add a `cancelledByRole` column. Backfill is straightforward.

---

## DB-007 — `Review.userId` does not enforce that the user actually owns the linked `bookingId` (no composite constraint); `Review.userId` is also not cascade-deleted with the user

- **Severity:** medium
- **Category:** constraint
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/db/prisma/schema.prisma:371-394`
- **Symbol:** `Review`

**Root cause:** Schema has `bookingId String @unique` (good — one review per booking) but `userId` is an unrelated FK. Nothing at the DB layer enforces that `Review.userId == Booking.guestId`. Application code in `apps/product-service/src/controllers/review.controller.ts` does check this, but a buggy admin tool or migration would silently break it. Compounding: deleting a Space cascades reviews (line 389), deleting a User does not — so orphaned reviews of deleted hosts/guests are possible (RESTRICT will block the delete; see DB-004 — but in the meantime, foreign-key counting consistency suffers).

**Impact:** Data integrity risk.

**Fix plan:** Either drop `Review.userId` and derive from `booking.guestId` via the join, or add a deferred CHECK constraint via raw SQL: `ALTER TABLE "Review" ADD CONSTRAINT "review_user_matches_booking" CHECK (...)` after writing a trigger.

---

## DB-008 — `ExchangeRate.rate` is `Float`, used in monetary multiplication; floating-point rounding compounds across many bookings

- **Severity:** medium
- **Category:** schema
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/db/prisma/schema.prisma:155-164` and `Booking.exchangeRate` at line 337
- **Symbol:** `ExchangeRate.rate`, `Booking.exchangeRate`

**Root cause:** `Float` is IEEE-754 binary; multiplying $1234.56 × 1.0987 in `Float` yields a non-decimal result. Subsequent comparisons (`booking.totalAmount === payout.amount * exchangeRate`) will be off by sub-cent amounts. Over thousands of bookings this becomes audit-visible.

**Impact:** Financial reporting drift; potential rounding-error revenue loss / regulatory noise.

**Fix plan:** Migrate `ExchangeRate.rate` and `Booking.exchangeRate` to `Decimal(12, 6)`.

---

## DB-009 — `Booking` has no `@@unique` or partial index preventing two concurrent CONFIRMED bookings for overlapping windows; conflict check is application-only (`SERIALIZABLE` transaction)

- **Severity:** medium
- **Category:** constraint
- **Verdict:** real
- **Confidence:** medium
- **File:** `/Users/cristian/Development/spacefly-ai/packages/db/prisma/schema.prisma:315-367` (no `EXCLUDE USING gist` constraint)
- **Symbol:** `Booking` overlap protection

**Root cause:** Overlap prevention is done in `apps/order-service/src/routes/booking.ts:336-394` inside a `Serializable` transaction. That works for the common path but: (a) `EXPIRED` and `APPROVED` are *not* listed in `conflictingStatuses` (only `PENDING`, `CONFIRMED`), so an `APPROVED` booking does not block another booking — and the schema's `BookingStatus` enum carries the `APPROVED` value, which is dead/ambiguous (transactional approve writes `CONFIRMED`, see booking.ts:561). (b) Postgres `EXCLUDE` constraints with `tstzrange` and `gist` could enforce this at the DB level, eliminating the need to trust application-level serialization.

**Impact:** Race conditions still possible under high load; "approved but not yet confirmed" bookings won't block conflicting new bookings.

**Fix plan:** Add `EXCLUDE USING gist (spaceId WITH =, tstzrange(startDate, endDate, '[]') WITH &&) WHERE (status IN ('PENDING','APPROVED','CONFIRMED'))` via raw SQL migration. Resolve the APPROVED vs CONFIRMED enum split.

---

## DB-010 — `Space` location columns (`address`, `city`, `state`, `country`, `postalCode`, `latitude`, `longitude`) duplicate `Venue` columns; venueId is required (DB-init), so Space rows store stale denormalized copies

- **Severity:** medium
- **Category:** schema
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/db/prisma/schema.prisma:188-195` vs `Venue` at 126-133
- **Symbol:** `Space` location fields

**Root cause:** The `20260511230000_add_venue_model` migration introduced `Venue`, the `20260512000000_make_venue_id_required` migration made `venueId` non-null and backfilled. The Space location columns were never dropped. `apps/product-service/src/controllers/space.controller.ts:283-284,629` writes the Space location from the venue at create time, but a `PUT /venues/:id` that changes the venue address does not propagate to Space rows — they will silently diverge. Filters use `space.city` (line 35), so search results show the old city.

**Impact:** Stale location data in search and listings. Hosts editing a venue address see an inconsistent state.

**Fix plan:** Either (a) drop the duplicated columns from Space (and switch queries to filter `venue: { city }`), or (b) make Space location columns mutable only via venue update with a trigger / app-level cascading update.

---

## DB-011 — `seed.ts` ships and is committed with hardcoded admin credentials `admin@spacefly.ai / admin123` and `upsert` uses an empty `update: {}` so a re-seed in production will NOT overwrite a rotated password — but a first seed in any new environment plants the predictable creds

- **Severity:** high
- **Category:** other
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/db/prisma/seed.ts:255-303`
- **Symbol:** admin / host / user seeds

**Root cause:** Production deployment uses `db:deploy` (no seed) per package.json, but the seed script is in the repo and any operator who runs `pnpm db:seed` (mentioned in onboarding docs) against prod will create three predictable accounts. The `update: {}` makes the script idempotent on re-runs, *but* the first run on a fresh database creates the accounts. There is no env guard like `if (process.env.NODE_ENV === "production") throw`.

**Impact:** Cred-stuffing trivially compromises an admin account if seed is ever run in prod (intentional or by mistake).

**Fix plan:** Refuse to run if `NODE_ENV === "production"` unless `ALLOW_PROD_SEED=1`. Generate a random initial password and print it to stdout once. Move demo data to a separate `seed.demo.ts`.

---

## DB-012 — `packages/db/src/client.ts` singleton pattern misses Next.js / Turbopack hot-reload edge case: `global` is shared in Node but two different module copies (CJS + ESM) each see their own `global.prisma` and create extra PrismaClient instances; in serverless `NODE_ENV !== "production"` the assignment leaks

- **Severity:** medium
- **Category:** client-wrapper
- **Verdict:** unclear
- **Confidence:** medium
- **File:** `/Users/cristian/Development/spacefly-ai/packages/db/src/client.ts`
- **Symbol:** singleton

**Root cause:** Two issues. (1) The export from `packages/db/src/index.ts` re-exports `* from "../generated/prisma"`, which re-exports `PrismaClient`. Any consumer that does `import { PrismaClient } from "@repo/db"` and instantiates it themselves bypasses the singleton. There's no eslint guard preventing this. (2) The standard Prisma "globalThis" trick uses `globalThis`, not `global`; `global` works in Node but trips bundler edge cases (Next.js edge runtime, Cloudflare Workers). (3) `globalForPrisma.prisma` is typed as `PrismaClient` (non-optional) but actually accessed as `|| new PrismaClient()` — TS lies here.

**Impact:** Possible connection-pool exhaustion in dev hot-reload or serverless cold starts. Not exploitable.

**Fix plan:** Use `globalThis as unknown as { prisma?: PrismaClient }`; remove `PrismaClient` from public exports (only export the instance and the types). Add an `eslint` rule banning `new PrismaClient` outside `client.ts` and `seed.ts`.

---

## Cross-cutting notes (not numbered findings)

- `packages/db/.env` is committed to the repo (`DATABASE_URL="postgresql://spacefly:spacefly@localhost:5432/spacefly"`). Not a credentials leak (local-only), but should be `.env.example`. The same applies to all `apps/*/`.env` files which contain `JWT_SECRET="spacefly-jwt-secret-key-2025-secure-token"`.
- `packages/db/src/index.ts` re-exports the entire generated Prisma namespace, including internal helpers like `Prisma` and `PrismaClient`. This widens the API surface unnecessarily and ties downstream services to the generated output path.
- `Booking.bookingIds` on `Payout` is `String[]` with no FK or index; you cannot join from `Booking` back to `Payout` in SQL and there's no constraint that all listed ids exist.

---

## Summary

Files reviewed: 24 in the two target packages (auth-middleware src: 8; db: schema + 11 migrations + client.ts + index.ts + seed.ts + tsconfigs/package.json/.env); cross-checked ~10 consumer files in `apps/auth-service`, `apps/order-service`, `apps/product-service`, and `packages/types` to verify claims.

**Headline counts by severity**

- **packages/auth-middleware:** 8 findings — 0 critical / 1 high (AUTHMW-003) / 4 medium (AUTHMW-001, 004, 005, 006) / 3 low (AUTHMW-002, 007, 008)
- **packages/db:** 12 findings — 1 critical (DB-001) / 3 high (DB-002, DB-004, DB-011) / 6 medium (DB-006, DB-007, DB-008, DB-009, DB-010, DB-012) / 2 low (DB-003, DB-005)

**Top 3 most impactful**

1. **DB-001** — `Payout.amount` is `Int` while `Booking.totalAmount` is `Float`, with the types package claiming dollars: a money-handling unit drift between two of the most important monetary tables. Pay-outs will not reconcile against bookings. Critical for any host-payout flow.
2. **AUTHMW-003** — Case-sensitive `email` uniqueness in `User` plus no lowercase normalization in registration/login means two accounts can share one address ("Alice@x.com" vs "alice@x.com"). Account-collision and login lockout risk.
3. **DB-004** — User delete is wired to RESTRICT on every meaningful relation, so the admin "delete user" route always 500s for non-empty accounts; GDPR right-to-erasure cannot be honored. Combined with **AUTHMW-006** (refresh-token-as-access-token if operators reuse the same secret) and **DB-011** (predictable `admin/admin123` seed), the security posture of the platform is significantly weaker than the rest of the codebase suggests.
