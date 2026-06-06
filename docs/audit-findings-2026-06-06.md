# Audit Findings — 2026-06-06

Consolidated output of three parallel multi-agent audit rounds run on
2026-06-06. Each finding has a stable ID (`AUD-NNN`), severity, target
file/lines, root cause, proposed fix, and a confidence note.

## Verification pass (6 parallel verifiers, read-only)

Run 2026-06-06 ~20:00 UTC. Verdicts:

- **Confirmed: 33** — code path matches the claim; ready to fix.
- **Rejected: 1** — `AUD-017` (HostSwitcher useEffect deps). Verifier
  confirmed the effect's `load` callback never references
  `actingHostId`, so omitting it is correct. No bug. Removed from
  fix scope.
- **Partial: 1** — `AUD-024` (length cap on rendered names).
  HostSwitcher actually has CSS `truncate` on both display sites; only
  `admin/bookings/columns.tsx:107,135` lacks it. Scope narrowed.

The rest of this file lists every finding with its verification verdict
inline. Group H (out-of-scope) is unchanged.

**How to use this for parallel SDD:** group findings by independent file
sets (see "Subagent groupings" at the end), dispatch one subagent per
group with the relevant `AUD-NNN` IDs in scope, and have each subagent
verify-before-fixing (especially MEDIUM/LOW items flagged
`CONFIDENCE: speculative`).

## Conventions

- **Severity**: CRITICAL = active exploit / data loss path; HIGH = clear
  bug with user impact or known regression; MEDIUM = correctness / UX
  bug; LOW = code-quality, performance, or defense-in-depth.
- **Confidence**: `verified` = I read the code path and reproduced
  mentally; `agent-only` = surfaced by an audit agent, not
  re-verified by hand; `speculative` = agent reasoning had gaps,
  needs a code check before fixing.
- **Status**: `open` = needs work; `fixed` = closed by an earlier commit;
  `wontfix` = intentional / out of scope (kept for the record).

## Already fixed this week (for reference, do not re-fix)

| ID | Commit | Title |
|---|---|---|
| FIX-001 | `a9e299e` | Cookie `Domain=.spacefly.ai` so admin middleware sees the session |
| FIX-002 | `bfad91a` | Tier overflow cap + commission deducted from host payout (PRICE-001/002) |
| FIX-003 | `e61d859` | Per-host commission admin UI + host-side read-only display |
| FIX-004 | `77e1d0c` | Soft-delete auth bypass (7 sites) + booking authz under impersonation + pricing edge cases + `/auth/me` leak + commissionRate clamp + DB CHECK |
| FIX-005 | `acb31f9` | Client currency display + TZ display + pricing parity + booking-draft shared-device leak |

---

# CRITICAL

(none in this round — the 2026-06-05 soft-delete bypass was the only
CRITICAL we caught; it shipped as FIX-004.)

---

# HIGH

## AUD-001 — Email consumer never subscribes to `user.password-reset-requested` so reset emails are never sent

- **File**: `apps/email-service/src/index.ts:88-208`
- **Confidence**: `agent-only` (compelling — verify by `grep -n "password-reset-requested" apps/email-service/src` returning zero handler matches)
- **Symptom**: `apps/auth-service/src/routes/auth.route.ts:891` emits
  `user.password-reset-requested` on every `/forgot-password` call, but
  `email-service`'s `subscriptions` array has no matching topic. Event
  is silently dropped, user never sees the reset link.
- **Root cause**: AUTHSVC-010 added the producer; the matching
  email-service consumer wasn't merged.
- **Fix**: Add a `user.password-reset-requested` entry in
  `subscriptions` that builds a reset link from
  `PASSWORD_RESET_LINK_BASE` env + token and sends through
  `sendMail()` with a deterministic idempotency key
  (`${userId}:${token-jti}` will do).

## AUD-002 — `sendVerificationEvent` fires `producer.send` without await → unhandled rejection on Kafka failure

- **File**: `apps/auth-service/src/routes/auth.route.ts:99-110`
  (also: `apps/order-service/src/routes/booking.ts:1069` and
  `apps/product-service/src/controllers/space.controller.ts:1098`)
- **Confidence**: `agent-only`, easy to verify
- **Symptom**: `/register` returns 201 even when Kafka is degraded; the
  verification email never lands, the user can't verify, and
  `ENFORCE_EMAIL_VERIFICATION=true` then blocks login.
- **Root cause**: helper is not `async`, doesn't await `producer.send`,
  doesn't catch rejection.
- **Fix**: make `sendVerificationEvent` `async`, `await` the send,
  catch and log. Also audit the booking + space `producer.send`
  call sites and either await or `.catch(err => log)`.

## AUD-003 — Email-service verification link falls back to `http://localhost:3002/...` when env unset

- **File**: `apps/email-service/src/index.ts:79-83` (the
  `verificationLinkFor` helper), readiness check at line 54-58
- **Confidence**: `agent-only`
- **Symptom**: A prod deploy missing `EMAIL_VERIFICATION_LINK_BASE`
  silently sends users a localhost link they can't click.
- **Root cause**: hardcoded `http://localhost:3002` fallback in the
  helper; `getEmailConfigErrors` only checks `RESEND_API_KEY` and
  `RESEND_FROM_EMAIL`.
- **Fix**: add both `EMAIL_VERIFICATION_LINK_BASE` and
  `PASSWORD_RESET_LINK_BASE` to `getEmailConfigErrors` so the service
  refuses to become ready when they're unset; remove the localhost
  default in production.

## AUD-004 — `verifyPasswordResetToken` and `verifyEmailVerificationToken` skip algorithm pinning

- **File**: `packages/auth-middleware/src/jwt.ts:160` (reset) and `:192` (verification)
- **Confidence**: `agent-only`, easy to verify
- **Symptom**: Forged token with `alg: "none"` (or asymmetric trickery)
  could pass verification, defeating AUTHMW-001 pinning that the
  access/refresh path enforces.
- **Root cause**: only `verifyToken()` passes `algorithms: [...]`; the
  purpose-token verifiers were added later with a looser signature.
- **Fix**: pass `{ algorithms: ["HS256"], issuer: JWT_ISSUER }` (and
  audience where appropriate) to both `jwt.verify` calls.

## AUD-005 — `shouldBeAdmin` / `shouldBeHost` do not re-check caller's `deletedAt`

- **File**: `packages/auth-middleware/src/express.ts:70-80` and the
  fastify mirror
- **Confidence**: `verified` (read the code yesterday)
- **Symptom**: A soft-deleted admin/host with a still-valid access
  token keeps full access until token expiry (up to 15 min). FIX-004
  closes the refresh side but not the access side.
- **Root cause**: `deletedAt` is not in the JWT, and the middleware
  trusts the JWT payload. The user-delete handler doesn't revoke
  access-token jtis (only refresh tokens, per FIX-004).
- **Fix**: on soft-delete, insert a `RevokedAccessToken` row for every
  live access-token jti for that user. Or have `shouldBeUser` do a
  cached `findUnique({ id, deletedAt: null })` (same cache fix
  applies to `resolveActingHost`).

## AUD-006 — Public GET `/venues/:id` leaks soft-deleted host PII

- **File**: `apps/product-service/src/controllers/venue.controller.ts:44`
- **Confidence**: `agent-only`
- **Symptom**: After a host is soft-deleted (email scrubbed, etc.) the
  public venue page still returns their pre-scrub `name`, `username`,
  `bio`, `image`, `hostingSince` because Prisma's FK include join
  returns the user row regardless of `deletedAt`.
- **Root cause**: `host: { select: {...} }` include has no `where`
  filter; soft-delete only sets `Venue.isActive=false` (if it does)
  but the venue is still publicly readable until then.
- **Fix**: filter the venue itself
  (`findFirst({ where: { id, host: { deletedAt: null } } })`) or
  post-process and 404 if `venue.host.deletedAt`. Same fix needed in
  `getSpace`, `getSpaces`, and any `venueInclude.spaces` path.

## AUD-007 — Public GET `/spaces/:id` leaks soft-deleted host PII

- **File**: `apps/product-service/src/controllers/space.controller.ts:510`
  (plus line 378 for `getSpaces`)
- **Confidence**: `agent-only`
- **Symptom**: Same shape as AUD-006 on the space detail page.
- **Root cause**: Identical Prisma include pattern.
- **Fix**: As AUD-006.

## AUD-008 — `createSpace` / `updateSpace` accept zero or negative `pricingTier.minutes` / `price`

- **File**: `apps/product-service/src/controllers/space.controller.ts:657`
  (create) and `:832` (update)
- **Confidence**: `agent-only`
- **Symptom**: A host can post tiers with `minutes: 0` (which makes
  `Math.ceil(totalMinutes / tier.minutes) = Infinity` in
  `calculateBookingPrice`, surfaced by AUD-007 audit yesterday) or
  negative price (free / negative booking).
- **Root cause**: payload spreads straight to `pricingTier.createMany`;
  Prisma schema is `Int` / `Float` with no `@check` and no app-level
  validation.
- **Fix**: validate every tier before create/update — `minutes` is a
  positive integer, `price >= 0`, `label` is non-empty string,
  reject 400 otherwise. Mirror the runtime guard with a DB CHECK
  constraint in a follow-up migration.

## AUD-009 — `respondToReview` missing `actingHostId` admin-override gate

- **File**: `apps/product-service/src/controllers/review.controller.ts:267`
- **Confidence**: `agent-only`, matches the booking-authz pattern fixed in FIX-004
- **Symptom**: Admin impersonating Host A can post a "host response"
  on any review attached to any other host's space.
- **Root cause**: same shape as the FIX-004 booking handler bug —
  ownership check `review.space.hostId !== hostId && req.user?.role !== "ADMIN"`
  grants blanket bypass to ADMIN regardless of `req.actingHostId`.
- **Fix**: standard pattern —
  `const adminOverride = req.user?.role === "ADMIN" && req.actingHostId === undefined;`
  then `if (review.space.hostId !== hostId && !adminOverride) return 403`.

## AUD-010 — Admin bulk user delete fires with no confirm dialog

- **File**: `apps/admin/src/app/(dashboard)/admin/users/data-table.tsx:104`
- **Confidence**: `agent-only`
- **Symptom**: A misclick on "Delete User(s)" instantly issues parallel
  `DELETE /users/:id` requests for every selected row. No confirm,
  no undo. Soft-delete only mitigates partially.
- **Root cause**: `onClick` directly calls `mutation.mutate()`. Other
  destructive actions in the app use `window.confirm`; this one
  doesn't.
- **Fix**: wrap with `window.confirm()` (or AlertDialog) including the
  selected count before triggering the mutation; disable the button
  while `mutation.isPending`.

## AUD-011 — Admin exchange-rates page uses cached `token` from store, bypassing refresh

- **File**: `apps/admin/src/app/(dashboard)/admin/exchange-rates/page.tsx:23,38,110`
- **Confidence**: `agent-only`
- **Symptom**: After ~15 min idle the access token is stale; "Save" 401s
  even though `getToken()` would have refreshed transparently.
  Initial `fetchRates` also fires before `authStore.initialize()`
  resolves the token, so the GET goes unauthenticated.
- **Root cause**: `const { token } = useAuthStore()` reads a snapshot
  rather than `await getToken()` like every other admin page.
- **Fix**: replace with `await getToken()` (or the new `apiFetch`
  wrapper) in both `fetchRates` and `handleSaveAll`; gate the
  initial fetch on `!authLoading`.

## AUD-012 — Host reject-booking handler uses `prompt()` and sends `null` reason on cancel

- **File**: `apps/admin/src/app/(dashboard)/host/bookings/page.tsx:214`
- **Confidence**: `agent-only`
- **Symptom**: Esc / Cancel on the native prompt sends
  `{"reason": null}` to `/reject`, irreversibly rejecting the
  booking with no reason. `prompt()` is also disabled in some
  browsers (Brave, iOS PWA).
- **Root cause**: doesn't branch on the `null` return value.
- **Fix**: short-term — `if (reason === null) return;` before the PUT.
  Medium-term — replace `prompt()` with a small modal with a
  required textarea.

---

# MEDIUM

## AUD-013 — Email consumer not idempotent → Resend `idempotencyKey` unused

- **File**: `apps/email-service/src/index.ts:88-208` (all 7 topic handlers)
- **Confidence**: `agent-only`
- **Symptom**: Any offset replay (restart-before-commit, manual reset,
  rebalance) re-sends the same welcome / verification / booking
  email. The Kafka data-wipe on 2026-06-02 (post-deploy runbook)
  makes today low risk, but next replay will burn customers.
- **Root cause**: handlers don't pass `idempotencyKey` to `sendMail`
  even though `utils/mailer.ts:40-62` accepts one. Resend dedupes
  within 24h on that key.
- **Fix**: derive a deterministic key per event (e.g.
  `${topic}:${bookingId}:${status}` or `${userId}:${token-jti}`),
  thread it through `sendMail({ idempotencyKey })`.

## AUD-014 — Env vars consumed by code but absent from `.env.example`

- **File**: `.env.example` (vs. `docker-compose.yml:3-19`)
- **Confidence**: `verified` (matches the runbook from 2026-06-05)
- **Symptom**: `JWT_VERIFICATION_SECRET`, `JWT_PASSWORD_RESET_SECRET`,
  `JWT_PASSWORD_RESET_EXPIRES_IN`, `EMAIL_VERIFICATION_EXPIRES_IN`,
  `ENFORCE_EMAIL_VERIFICATION`, `COOKIE_DOMAIN`,
  `DEFAULT_COMMISSION_RATE` are wired through compose but absent
  from `.env.example`. Worse, `JWT_VERIFICATION_SECRET` silently
  falls back to `JWT_SECRET` (`jwt.ts:178`), defeating the
  AUTHMW-006 distinct-secret intent.
- **Fix**: add the 7 vars to `.env.example` with placeholder values;
  change `getVerificationSecret()` to `getRequiredEnv("JWT_VERIFICATION_SECRET")`
  (or at minimum log a startup warning when the fallback fires).

## AUD-015 — DLQ topic `email.dlq` is written but no consumer exists

- **File**: `apps/email-service/src/index.ts:14` (producer side); no
  consumer found
- **Confidence**: `agent-only`
- **Symptom**: poison messages and max-retries-exceeded payloads pile
  up forever. No alerting, no replay tool, no retention policy
  referenced.
- **Fix**: minimum — document a `kafka-console-consumer`-based
  drain/inspect runbook and configure topic retention/alerts on
  lag. Ideal — small admin/replay job.

## AUD-016 — Host/admin earnings dashboard hardcodes `$` and ignores booking currency

- **File**:
  `apps/admin/src/app/(dashboard)/host/earnings/page.tsx:131-137,309,363,366,369,372`
  + `host/page.tsx:224,243` + `host/bookings/page.tsx:555` +
  `host/spaces/page.tsx:173-181`
- **Confidence**: `agent-only`
- **Symptom**: A host with EUR/GBP bookings sees `$` everywhere; the
  admin bookings table correctly uses `Intl.NumberFormat(...,
  row.original.currency || "USD")` but host pages do not.
  Same flavour as the client-app currency bug closed by FIX-005.
- **Root cause**: direct `${booking.totalAmount.toFixed(2)}` template
  literals with no currency lookup. The "thisMonth" filter also
  computes month/year in browser-local TZ on a UTC ISO string
  (same UTC-drift the client app had).
- **Fix**: format via `Intl.NumberFormat` using `booking.currency`;
  use UTC-safe extraction for month grouping. Reuse the
  `formatBookingDate` helper added to the client app in FIX-005.

## AUD-017 — `useEffect` deps miss `actingHostId` in HostSwitcher

- **File**: `apps/admin/src/components/HostSwitcher.tsx:73-75`
- **Confidence**: `speculative` — agent noted host pages DO subscribe
  to `actingHostId`; only HostSwitcher's `load` effect drops it.
  Verify by reading the actual effect.
- **Symptom**: After admin creates a lead-host via
  `CreateLeadHostModal`, the HostSwitcher counts column doesn't
  refresh until hard refresh.
- **Fix**: add `actingHostId` to the dep array (or a `refreshKey`
  bumped on lead-host create).

## AUD-018 — Admin login ignores `?next=` from middleware redirect

- **File**: `apps/admin/src/app/(auth)/login/page.tsx:26`
  (middleware sets the param at `apps/admin/src/middleware.ts:36`)
- **Confidence**: `verified` (read the file in earlier rounds)
- **Symptom**: Middleware sets `?next=/admin/users`; login always
  bounces to `/admin` or `/host` regardless. UX bug. Also harmless
  side effect: open-redirect attempts are no-ops.
- **Fix**: read `next`, pass through a `safeRedirectPath` helper
  (must start with `/`, no `//`, no scheme), fall back to
  role-based default.

## AUD-019 — `updateReview` does not validate comment type/length

- **File**: `apps/product-service/src/controllers/review.controller.ts:187`
- **Confidence**: `agent-only`
- **Symptom**: Guest can `PUT { comment: null }` (wipes the comment),
  `{ comment: 12345 }` (rejected by Prisma as 500), or a 5 MB
  string bypassing the `createReview` `COMMENT_MAX_LENGTH` cap.
- **Root cause**: only `rating` is validated; `comment` is spread
  straight to the update payload.
- **Fix**: mirror `createReview` — if `comment !== undefined`, require
  string, trim, non-empty, ≤ `COMMENT_MAX_LENGTH`, else 400.

## AUD-020 — `getVenueCountsByHost` ignores soft-deleted hosts and inactive venues

- **File**: `apps/product-service/src/controllers/venue.controller.ts:272`
- **Confidence**: `agent-only`
- **Symptom**: Admin host-counts dashboard shows counts for deleted
  hosts and inflates totals with soft-deleted venues.
- **Fix**: add
  `where: { isActive: true, host: { deletedAt: null } }` to the
  `groupBy` call.

## AUD-021 — `resolveActingHost` performs uncached DB lookup per request

- **File**: `packages/auth-middleware/src/express.ts:107` and the
  fastify mirror
- **Confidence**: `verified`
- **Symptom**: Every admin request bearing `X-Acting-Host-Id` does a
  `prisma.user.findUnique` round-trip before the route handler.
  Admin list views fire many such requests in bursts.
- **Fix**: in-process LRU+TTL cache (e.g. `lru-cache`, 30-60s TTL)
  keyed by user id, invalidated on user update via Kafka.

## AUD-022 — Money columns still `Float` — Payout / Space / Booking / PricingTier precision drift

- **File**: `packages/db/prisma/schema.prisma` (`Payout`, `Space`,
  `Booking`, `PricingTier` price columns)
- **Confidence**: `verified` (documented in migration comments)
- **Symptom**: IEEE-754 drift compounds when aggregating across many
  bookings. Surfaces as 0.01 cent discrepancies on host earnings
  totals.
- **Fix**: track migration to `Decimal(12,2)` as a scheduled item;
  meantime, wrap aggregations in
  `ROUND(SUM(amount)::numeric, 2)` at the DB layer. Add a
  Decimal-string helper in `packages/types/src/currency.ts`.

## AUD-023 — Rebalance + per-partition `attemptCounts` can double-process or re-deliver

- **File**: `apps/email-service/src/index.ts:46-50`
- **Confidence**: `agent-only` — largely mitigated once AUD-013 ships
- **Symptom**: a partition moving mid-retry can re-process and re-send.
- **Fix**: covered by AUD-013 (idempotency keys). Optional: use
  `pause()` / `isRunning()` / `isStale()` in `eachMessage` for
  clean rebalance behavior.

## AUD-024 — Host display name / guest email rendered without length cap

- **File**: `apps/admin/src/components/HostSwitcher.tsx:182,186`,
  `apps/admin/src/app/(dashboard)/admin/bookings/columns.tsx:107,135`
- **Confidence**: `speculative` (React escapes; the concern is layout
  break + RTL injection, not XSS)
- **Symptom**: 5KB strings of zero-width chars or RTL overrides break
  the sidebar / table layout for every admin.
- **Fix**: truncate at render to e.g. 80 chars; strip control chars
  via `String.prototype.normalize("NFC")`. Apply `dir="ltr"` on the
  dropdown row.

## AUD-025 — Admin list endpoints fetched with no pagination params

- **File**: `apps/admin/src/app/(dashboard)/admin/users/page.tsx:38`,
  `spaces/page.tsx:34`, `bookings/page.tsx:31`
- **Confidence**: `agent-only`
- **Symptom**: `/users`, `/spaces`, `/bookings` fetched without
  `?limit=` / `?offset=`. If the backend default is unbounded, the
  admin app OOMs on a large tenant. Pagination is purely
  client-side via TanStack Table.
- **Fix**: send `?limit=200`, paginate server-side. At minimum cap
  the in-memory size and show a "first N" notice.

## AUD-026 — Rating sort `?sortBy=averageRating` silently falls back to createdAt

- **File**: `apps/product-service/src/controllers/space.controller.ts:55`
- **Confidence**: `agent-only`
- **Symptom**: Clients sending `?sortBy=averageRating&sortOrder=desc`
  get createdAt ordering. The rating raw-SQL branch is only
  reachable via `?sort=rating` shorthand.
- **Fix**: route `sortBy=averageRating` into the same raw-SQL branch,
  or document the contract.

## AUD-027 — Refresh-token rotation has a TOCTOU race (from earlier audit, unfixed)

- **File**: `apps/auth-service/src/routes/auth.route.ts:461-481`
- **Confidence**: `agent-only`, surfaced in Round 1
- **Symptom**: `findUnique` + later `persistRefreshToken` are separate
  transactions; two concurrent refreshes with the same valid token
  both pass the `stored.usedAt == null` check, both mint
  successors, and only the second triggers reuse detection on the
  next call (after legitimate tokens were already issued).
- **Fix**: wrap the read + `update({where:{jti, usedAt:null}})` in a
  single transaction (or use a conditional update with
  affected-row check) so exactly one rotation wins.

## AUD-028 — `/auth/logout` rejects when access token is expired

- **File**: `apps/auth-service/src/routes/auth.route.ts:367-411`
- **Confidence**: `agent-only`, Round 1
- **Symptom**: Logout is gated by `shouldBeUser`; an expired access
  token returns 401 and the handler never runs, leaving the
  refresh chain live.
- **Fix**: make `/auth/logout` tolerant of expired/missing access
  tokens — run handler unconditionally, fall back to
  refresh-cookie/userId from the refresh JWT.

## AUD-029 — `/resend-verification` has no rate limit

- **File**: `apps/auth-service/src/routes/auth.route.ts:583`
- **Confidence**: `verified` (TODO acknowledged in code)
- **Symptom**: enables email-bombing of any known address.
- **Fix**: attach the shared rate-limiter as the comment promises.

---

# LOW

## AUD-030 — `Payout.bookingIds` lacks a GIN index

- **File**: `packages/db/prisma/schema.prisma:497`
- **Confidence**: `verified`
- **Symptom**: currency-backfill `WHERE b.id = ANY(p.bookingIds)` (and
  any future "find payouts containing booking X" query) full-scans.
- **Fix**: `CREATE INDEX Payout_bookingIds_gin ON "Payout" USING GIN ("bookingIds");`

## AUD-031 — `SpaceAmenity.amenityId` lacks an index

- **File**: `packages/db/prisma/schema.prisma:354`
- **Confidence**: `agent-only`
- **Symptom**: composite `@@unique([spaceId, amenityId])` indexes
  `spaceId` first; `WHERE amenityId = ?` ("which spaces have wifi")
  sequential-scans.
- **Fix**: add `@@index([amenityId])` and a `CREATE INDEX` migration.

## AUD-032 — Shared `createConsumer` swallows `connect()` errors

- **File**: `packages/kafka/src/consumer.ts:32-34`
- **Confidence**: `agent-only`
- **Symptom**: a service using this helper boots without Kafka and
  reports healthy.
- **Fix**: throw on connect failure to match the producer semantics,
  or expose `isHealthy()` like the producer does.

## AUD-033 — Express vs Fastify drift in admin-acting log line

- **File**: `packages/auth-middleware/src/fastify.ts:143` (vs
  `express.ts`)
- **Confidence**: `agent-only`
- **Symptom**: Express logs `req.path` (no querystring); Fastify logs
  `request.url` (includes query). Audit/log parity broken.
- **Fix**: in fastify.ts compute
  `request.routeOptions?.url ?? request.url.split("?")[0]`.

## AUD-034 — Single-flight refresh clears `inFlightRefresh` before awaiters resolve

- **File**: `apps/admin/src/stores/authStore.ts:214-230`
- **Confidence**: `agent-only`, Round 1
- **Symptom**: setting `inFlightRefresh = null` in the IIFE `finally`
  allows a second caller arriving mid-`await` to start a *new*
  refresh using the same (already-rotated) refresh token, which
  the server now flags as reuse and revokes the entire chain.
- **Fix**: only null out after a tick / small debounce; do not retry
  with a stale refresh token on rejection.

## AUD-035 — `updateAvailability` fires Kafka without awaiting / catching

- **File**: `apps/product-service/src/controllers/space.controller.ts:1098`
- **Confidence**: `agent-only`
- **Fix**: match the surrounding pattern —
  `try { await producer.send(...) } catch (err) { console.error(...) }`.

## AUD-036 — Resend `console.log` leaks recipient PII

- **File**: `apps/email-service/src/utils/mailer.ts:68`
- **Confidence**: `agent-only`
- **Symptom**: every successful send logs the full Resend response,
  including the recipient address.
- **Fix**: drop to debug level or redact to `{ id: data?.id }`.

## AUD-037 — `CommissionRateCard` bypasses `apiFetch`

- **File**:
  `apps/admin/src/app/(dashboard)/admin/users/[id]/CommissionRateCard.tsx:57-67`
- **Confidence**: `verified` (added today, didn't use `apiFetch`)
- **Symptom**: inconsistent with the rest of the admin app after the
  CLIENT-018 wrapper migration; doesn't get auto-refresh handling,
  doesn't carry `X-Acting-Host-Id` (probably fine since admin-only,
  but inconsistent).
- **Fix**: switch to `apiFetch`. Backend already ignores
  `X-Acting-Host-Id` on `/users/:id/commission-rate` (it gates on
  `shouldBeAdmin`), verify and document.

## AUD-038 — localStorage tokens defeat the HttpOnly cookie posture (admin + client)

- **File**: `apps/admin/src/lib/auth.ts:93-138` and
  `apps/client/src/lib/auth.ts:128-153`
- **Confidence**: `verified`, transitional per ADMIN-004 TODO
- **Symptom**: any XSS exfiltrates the long-lived refresh token,
  defeating the cookie work.
- **Fix**: finish ADMIN-004 — migrate fetch sites to
  `credentials: "include"` and remove the localStorage paths. Big
  change; out of scope for this audit.
- **Status**: `wontfix` for this batch — needs BFF design discussion.

## AUD-039 — Client / admin frontends have no double-submit guard on slow networks

- **File**: `apps/client/src/app/[locale]/(main)/bookings/checkout/page.tsx:42`
  and host action buttons across the admin app
- **Confidence**: `verified`
- **Symptom**: rapid double-click before React re-render can submit
  twice. Backend serializable overlap check prevents overlapping
  bookings but doesn't catch two non-overlapping ones.
- **Fix**: synchronous ref guard at the top of the click handler;
  also send an `Idempotency-Key` UUID per draft and have the
  server dedupe.

---

# Subagent groupings (proposed)

Each group below is one independent file set — dispatch one
subagent per group with the listed IDs in scope. SDD-style:
TDD, verify-before-fixing, end with green tests + a self-contained
commit.

## Group A — auth-service security (3 fixes, no DB changes)

- AUD-002 (sendVerificationEvent await + producer.send hardening)
- AUD-004 (algorithm pinning on verification + reset tokens)
- AUD-005 (re-check `deletedAt` on access path — pick the cached
  middleware-side option; revoking-jti option is bigger scope)
- AUD-028 (logout tolerant of expired access)
- AUD-029 (rate-limit `/resend-verification`)

## Group B — product-service authz + leaks (4 fixes)

- AUD-006 (venue host PII leak)
- AUD-007 (space host PII leak)
- AUD-009 (review respondToReview admin-override gate)
- AUD-020 (getVenueCountsByHost filters)

## Group C — product-service validation (3 fixes)

- AUD-008 (pricing tier validation, runtime + add a follow-up CHECK
  migration if scope allows)
- AUD-019 (review comment validation)
- AUD-026 (rating sort fallback)
- AUD-035 (updateAvailability await/catch)

## Group D — email-service correctness (4 fixes)

- AUD-001 (subscribe to `user.password-reset-requested`)
- AUD-003 (refuse to start without `*_LINK_BASE` envs)
- AUD-013 (idempotency keys on all sendMail calls)
- AUD-015 (DLQ drain/runbook + alerting)
- AUD-023 (rebalance — falls out of AUD-013)
- AUD-036 (drop PII log)

## Group E — admin UX bugs (5 fixes, no backend)

- AUD-010 (confirm dialog on bulk delete)
- AUD-011 (use `getToken()` on exchange-rates page)
- AUD-012 (handle prompt cancel; modal is a follow-up)
- AUD-016 (currency + UTC display in host pages)
- AUD-017 (HostSwitcher deps — verify before fixing)
- AUD-018 (login `?next=` safe-redirect)
- AUD-024 (length cap on rendered names; speculative — verify)
- AUD-025 (server-side pagination on admin lists)
- AUD-037 (`CommissionRateCard` → `apiFetch`)

## Group F — cross-cutting infra (3 fixes, 2 migrations)

- AUD-014 (`.env.example` + drop `JWT_VERIFICATION_SECRET` legacy
  fallback)
- AUD-021 (LRU cache on `resolveActingHost`)
- AUD-022 (track Decimal migration — research-only, scoped item)
- AUD-030 (Payout.bookingIds GIN index — migration)
- AUD-031 (SpaceAmenity.amenityId index — migration)
- AUD-032 (`createConsumer` throw on connect failure)
- AUD-033 (Express/Fastify log parity)
- AUD-034 (single-flight `inFlightRefresh` debounce)

## Out of scope for this batch

- AUD-038 — localStorage migration (needs BFF design)
- AUD-039 — Idempotency-Key (needs server-side dedupe table; design
  decision)
- AUD-027 — refresh-token TOCTOU race (real but rare; defer to
  Decimal/auth refactor batch)
