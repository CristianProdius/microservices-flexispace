# Slice 04 — apps/order-service + apps/auth-service

**Scope:** Fastify booking API (port 8001) + Express auth API (port 8003)
**Files reviewed:** 10 (5 in order-service, 5 in auth-service) plus cross-references to `packages/auth-middleware/src/*` and `packages/db/prisma/schema.prisma` and `packages/types/src/booking.ts`
**Findings:** 30 (16 BOOKSVC + 14 AUTHSVC)

---

## BOOKSVC-001 — Host approval path can confirm two overlapping PENDING bookings (double-book)

- **Severity:** High
- **Category:** race-condition
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/order-service/src/routes/booking.ts`
- **Symbol:** `PUT /bookings/:id/approve`

**Root cause:** The approve handler only checks that the booking is PENDING and the requester is the host, then unconditionally transitions to CONFIRMED. There is no re-validation that the slot is still free. The original create path only blocks new bookings whose status is `PENDING` or `CONFIRMED` (see `conflictingStatuses`). Two guests can submit overlapping requests while the space is `instantBook=false`; both land as PENDING (no conflict among PENDINGs is enforced on create either, see BOOKSVC-002), and the host can approve both, producing two `CONFIRMED` bookings for the same time/space.

**Impact:** Double-booking that becomes a real customer-facing conflict, payouts and notifications for an unfulfillable slot.

**Fix plan:** Wrap the approve in a serializable transaction that re-runs the conflict scan (same predicate used in create) against `CONFIRMED` bookings, excluding the current booking id; reject with 409 if a conflict exists. Additionally, after approval, automatically REJECT or EXPIRE all other overlapping PENDING bookings for the same window.

---

## BOOKSVC-002 — Conflict check on create allows two PENDING bookings to overlap

- **Severity:** Medium
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/order-service/src/routes/booking.ts`
- **Symbol:** `POST /bookings` (`conflictingStatuses` set)

**Root cause:** `conflictingStatuses` contains both `PENDING` and `CONFIRMED`, which is correct *for instant-book* (since PENDING is not used). But for non-instant-book spaces, every request lands as PENDING — and creating another PENDING for the same slot is blocked, which is fine. However the set omits the schema-defined `APPROVED` status. If any code path (current or future migration) ever produces an `APPROVED` booking, it will not be considered a conflict and the slot can be double-booked.

**Impact:** Latent double-book exposure tied to enum drift; today the route writes `CONFIRMED` instead of `APPROVED` (see BOOKSVC-003) so the bug is dormant but the contract is broken.

**Fix plan:** Either remove `APPROVED` from the Prisma enum, or include it in `conflictingStatuses` everywhere overlap is computed. Add a unit test that iterates `BookingStatus` and asserts the conflict set is the intended set.

---

## BOOKSVC-003 — Dead enum `APPROVED` / approve transitions to `CONFIRMED`

- **Severity:** Low
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/order-service/src/routes/booking.ts`
- **Symbol:** `PUT /bookings/:id/approve`

**Root cause:** Schema defines both `APPROVED` and `CONFIRMED` BookingStatus values. The approve handler writes `status: "CONFIRMED"`, never `APPROVED`. There is no path in either reviewed service that produces `APPROVED`. State-machine intent is unclear and consumers downstream that branch on APPROVED will be wrong.

**Impact:** Confusing state machine; reporting/analytics filters that pivot on APPROVED will silently miss data.

**Fix plan:** Pick one — either delete `APPROVED` from the schema, or have approve set `APPROVED` and add a separate "payment confirmed" transition to `CONFIRMED`. Document the state machine.

---

## BOOKSVC-004 — Cancellation policy is never enforced; no refund window

- **Severity:** High
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/order-service/src/routes/booking.ts`
- **Symbol:** `POST /bookings/:id/cancel`

**Root cause:** `Space.cancellationPolicy` (FLEXIBLE | MODERATE | STRICT | NON_REFUNDABLE) exists in the schema but the cancel handler ignores it entirely. Any guest can cancel a CONFIRMED booking on the day of the event with zero penalty. There is also no concept of refund amount stored on the cancellation (no `refundAmount` write).

**Impact:** Hosts get cancellations they should be paid for; platform has no record of refund decisions. Direct revenue and trust impact.

**Fix plan:** Compute days-until-startDate against the space's cancellation policy thresholds, compute refund/penalty, persist refund amount on the booking (add field) and pass through to the payments pipeline via a `booking.cancelled` event with the refund split.

---

## BOOKSVC-005 — Earnings sum across mixed currencies without conversion

- **Severity:** High
- **Category:** data-integrity
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/order-service/src/routes/booking.ts`
- **Symbol:** `GET /bookings/host/earnings`

**Root cause:** `totalEarnings` and `platformFees` reduce `totalAmount`/`serviceFee` across all of a host's completed bookings without normalizing currency. Each booking stores `totalAmount` in the space's own currency (USD/EUR/MDL — see `Booking.currency` and `Booking.exchangeRate`). Summing them produces a meaningless number.

**Impact:** Hosts see incorrect earnings; downstream payout calculations using the same number would over- or under-pay.

**Fix plan:** Either (a) group by currency and return per-currency totals, or (b) multiply each booking's amounts by `exchangeRate` to normalize to USD before summing. Apply the same fix to stats (BOOKSVC-006).

---

## BOOKSVC-006 — Admin stats sum revenue across currencies and use server-local time

- **Severity:** Medium
- **Category:** data-integrity
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/order-service/src/routes/booking.ts`
- **Symbol:** `GET /bookings/stats`

**Root cause:** Two issues:
1. `totalRevenue = _sum.totalAmount` and `chartData[i].revenue` reduce `totalAmount` across all currencies without normalization (same root cause as BOOKSVC-005).
2. Monthly grouping uses `bDate.getFullYear()` and `bDate.getMonth()` (server-local timezone) while `createdAt` is stored as UTC. Bookings created near midnight UTC will land in the wrong month on hosts in negative timezones, and DST transitions can shift assignments.

**Impact:** Wrong revenue numbers on the admin dashboard; off-by-one-month attributions.

**Fix plan:** Normalize per-currency or to USD; use `getUTCMonth()`/`getUTCFullYear()` (or a timezone-aware library) for grouping; align month boundaries with `startOfMonth` already imported.

---

## BOOKSVC-007 — Missing exchange rate silently defaults to 1.0

- **Severity:** High
- **Category:** data-integrity
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/order-service/src/routes/booking.ts`
- **Symbol:** `getExchangeRate`

**Root cause:** If `ExchangeRate` row for `(fromCurrency, USD)` is missing, the function logs an error and returns `1.0`. A booking in EUR or MDL is then persisted with `exchangeRate=1.0`, treating 1 EUR/MDL as 1 USD. Booking creation also proceeds normally, so the user is charged the local amount but reports treat it as USD.

**Impact:** Material financial reporting errors and host payout miscalculation for any new currency not yet seeded.

**Fix plan:** On missing rate, return 503 with `"Currency conversion unavailable"`, do not persist the booking. Optionally add a maintenance task that backfills missing rates and alerts on missing pairs.

---

## BOOKSVC-008 — Single-currency arithmetic on `Float` columns risks rounding drift

- **Severity:** Low
- **Category:** data-integrity
- **Verdict:** real
- **Confidence:** Medium
- **File:** `apps/order-service/src/routes/booking.ts`
- **Symbol:** `calculateBookingPrice` + `Booking.totalAmount` (schema `Float`)

**Root cause:** Pricing uses JS floating-point math and `Math.round(amount*100)/100`. Stored as `Float` in Postgres. Reductions over many bookings accumulate floating-point drift; comparing a stored amount with a recomputed amount can fail. Industry-standard is to store money as integer minor units or `Decimal`.

**Impact:** Pennies drift in long-running aggregates; reconciliation pain.

**Fix plan:** Migrate money fields to `Decimal(12,2)` (Prisma supports `Decimal`) or switch to integer cents and update all comparisons/arithmetic.

---

## BOOKSVC-009 — Per-day hourly pricing assumes uniform availability across days

- **Severity:** Medium
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/order-service/src/routes/booking.ts`
- **Symbol:** `calculateBookingPrice` + `validateAvailabilityRules`

**Root cause:** For a multi-day hourly booking (e.g., `startDate=Mon endDate=Wed startTime=10:00 endTime=12:00`), pricing multiplies `(endH-startH)*pricePerHour * days`. That implies the same time-slot is taken each calendar day. `validateAvailabilityRules` similarly checks the same `[startTime,endTime]` against each day's availability. There is, however, no guarantee the conflict search treats it the same way: `bookingIntervalsOverlap` will return a single bool for the whole date range. A booking that conflicts on day 2 only at 10:00–11:00 may still be allowed when both bookings claim full multi-day ranges, depending on existing-booking shape. The price model and conflict model are inconsistent.

**Impact:** Confusion between the "block of nights" semantics implied by daily bookings and the per-day-slot semantics implied by hourly bookings; potential over- or under-charging and missed conflicts.

**Fix plan:** Either (a) restrict hourly bookings to single-day (reject when startDate != endDate and isHourly), or (b) explicitly expand multi-day hourly into per-day slots in both pricing and conflict detection.

---

## BOOKSVC-010 — `bookingHours` does not match `calculateBookingPrice` (min/max enforcement vs. pricing diverge)

- **Severity:** Low
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/order-service/src/routes/booking.ts`
- **Symbol:** `bookingHours` vs `calculateBookingPrice`

**Root cause:** `bookingHours` uses `datesBetweenInclusive(...).length` to count days, while `calculateBookingPrice` uses `differenceInDays(endDate, startDate) + 1`. For purely UTC dates these match, but `datesBetweenInclusive` advances via `setUTCDate` and compares with `<=`, while `differenceInDays` is calendar-aware. The two are equivalent today but the duplication invites future drift. Additionally, `bookingHours` is only called for the min/max booking-hours check; the value sent to pricing is computed separately. Min/max check and pricing can disagree.

**Impact:** A booking that just passes `maxBookingHours` could be priced as if for more hours, or vice versa.

**Fix plan:** Extract a single `computeBookingMinutes(...)` helper used by both the validator and pricing.

---

## BOOKSVC-011 — Serializable transaction has no retry; legitimate bookings will 500

- **Severity:** Medium
- **Category:** error-handling
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/order-service/src/routes/booking.ts`
- **Symbol:** `POST /bookings` (`prisma.$transaction(..., { isolationLevel: 'Serializable' })`)

**Root cause:** Postgres Serializable Snapshot Isolation will abort one transaction with `40001 serialization_failure` when two booking creates race on the same time window. The handler does not catch this; the error bubbles to Fastify and returns 500 with internal error. There is also no retry loop. Under contention, real (non-conflicting) bookings will fail.

**Impact:** Spurious 500s under concurrent traffic; users see an unrecoverable error instead of a retry.

**Fix plan:** Wrap the `$transaction` in a small retry loop (e.g. 3 attempts with backoff) that detects Prisma error code `P2034` / Postgres SQLSTATE `40001`. Surface a 409 only if a real conflict is detected on retry. Consider `SELECT ... FOR UPDATE` on a serializing row (e.g. lock the space row) as a simpler alternative.

---

## BOOKSVC-012 — Cancel handler has no row lock / transaction; loses to concurrent state changes

- **Severity:** Medium
- **Category:** race-condition
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/order-service/src/routes/booking.ts`
- **Symbol:** `POST /bookings/:id/cancel`, `PUT /bookings/:id/approve`, `PUT /bookings/:id/reject`, `PUT /bookings/:id/complete`

**Root cause:** All four state-transition handlers do `findUnique` then `update` without a transaction or `where: { id, status: <expected> }` guard. Two concurrent admin/host/guest actions can race: e.g. guest cancels while host approves, both succeed, last write wins. The final state may be CONFIRMED for a booking the guest believes was cancelled (or vice versa).

**Impact:** Inconsistent booking state; confused users; possible double-action notifications.

**Fix plan:** Use compare-and-swap with Prisma: `prisma.booking.updateMany({ where: { id, status: { in: <expected> } }, data: { status: <new>, ... } })` and treat `count === 0` as a 409 conflict response. Or wrap the read/update in a serializable transaction.

---

## BOOKSVC-013 — `dateRangesOverlap` boundary inclusive on both ends — back-to-back daily bookings get blocked

- **Severity:** Low
- **Category:** logic-inconsistency
- **Verdict:** unclear
- **Confidence:** Medium
- **File:** `apps/order-service/src/routes/booking.ts`
- **Symbol:** `dateRangesOverlap` (`aStart <= bEnd && aEnd >= bStart`)

**Root cause:** With `<=` and `>=`, a daily booking ending on 2026-05-02 conflicts with one starting on 2026-05-02. For "nightly" semantics that's wrong (you check out on the morning of the 2nd, next guest checks in same day). For "full-day" semantics that's correct. The product intent is unstated.

**Impact:** Potentially blocks legitimate back-to-back bookings; revenue loss for hosts.

**Fix plan:** Decide on semantics and document. If checkout/checkin can share a date, change to strict inequalities for the date-only comparison and rely on time-slot comparison for hourly.

---

## BOOKSVC-014 — Hourly conflict check ignores cross-day time windows

- **Severity:** Low
- **Category:** logic-inconsistency
- **Verdict:** unclear
- **Confidence:** Medium
- **File:** `apps/order-service/src/routes/booking.ts`
- **Symbol:** `bookingIntervalsOverlap`

**Root cause:** Once both bookings are hourly with start/end times, conflict reduces to `incoming.startTime < existing.endTime && incoming.endTime > existing.startTime` per-day, but the function returns a single boolean for the whole multi-day overlap. Two multi-day hourly bookings whose times overlap on day-2 but not day-1 will be correctly flagged as conflict, but two whose times never overlap on any of the shared days will be flagged as conflict simply because the date ranges overlap. The function effectively treats the time window as repeated daily — see BOOKSVC-009.

**Impact:** Either over-blocks (rejects legitimate bookings) or under-blocks (misses real conflicts on a specific shared day) depending on data.

**Fix plan:** Restrict hourly bookings to single-day or model each day independently.

---

## BOOKSVC-015 — CORS `credentials: true` with hardcoded localhost fallback in production-shaped config

- **Severity:** Low
- **Category:** security
- **Verdict:** real
- **Confidence:** Medium
- **File:** `apps/order-service/src/index.ts`, `apps/auth-service/src/index.ts`
- **Symbol:** `cors` registration

**Root cause:** When `CORS_ORIGINS` is unset or empty, both services fall back to a hardcoded list of `http://localhost:*` origins with `credentials: true`. If env wiring fails in production, the service will reject prod web origins but still accept localhost credentialed requests from a developer machine that DNS-rebinds the production host to localhost (or via XSS on a dev tool running locally). Better to fail closed.

**Impact:** Subtle; lets a compromised dev machine talk to prod with cookies if env mis-set.

**Fix plan:** In production (`NODE_ENV === "production"`), throw if `CORS_ORIGINS` is unset rather than falling back to localhost.

---

## BOOKSVC-016 — `parsePositiveInteger` falls back to fallback even on garbage input

- **Severity:** Low
- **Category:** input-validation
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/order-service/src/routes/booking.ts`
- **Symbol:** `parsePositiveInteger`

**Root cause:** Fallback only triggers when value is undefined/null/"". A request like `?limit=abc` returns `null`, which causes a 400 — fine. But `?page=0` returns `null` → 400 (intended). `?limit=1e3` returns `null` because the regex `^\d+$` rejects scientific notation. Fine. Real edge case: when both `limit` and `page` are valid but a caller passes negative integer string `-1`, the regex `^\d+$` rejects it → `null` → 400. Acceptable. The only true issue: `limit` is capped by `max` (100), but `parsePositiveInteger(spaceId)` passes no `max` — `spaceId` as 2^53-2 would be accepted then collide with a real id type (`Space.id Int`, max 2^31-1). Causes Prisma error / 500.

**Impact:** Minor 500 instead of 400 for absurd `spaceId` values.

**Fix plan:** Clamp `spaceId` to Int32 max, or use `z.coerce.number().int().positive().max(2147483647)`.

---

## AUTHSVC-001 — No rate limiting on register, login, refresh — credential stuffing & enumeration

- **Severity:** High
- **Category:** security
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/auth-service/src/index.ts`, `apps/auth-service/src/routes/auth.route.ts`
- **Symbol:** `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`

**Root cause:** No `express-rate-limit` (or equivalent) middleware is registered anywhere. Unauthenticated endpoints can be hit at arbitrary rates. `bcrypt.compare` provides only a small CPU cost (rounds=12), not a defense against distributed credential stuffing.

**Impact:** Brute-force, credential stuffing, account enumeration via timing.

**Fix plan:** Add `express-rate-limit` with a per-IP+email key on `/auth/login`, `/auth/register`, `/auth/refresh`, and any future password-reset endpoint. Stricter limits per email/username. Consider Cloudflare or upstream WAF rate-limit too.

---

## AUTHSVC-002 — Account enumeration on register response

- **Severity:** Medium
- **Category:** security
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/auth-service/src/routes/auth.route.ts`
- **Symbol:** `POST /auth/register`

**Root cause:** Register returns `"User with this email or username already exists"` with status 400, allowing an attacker to enumerate which emails (and usernames) are registered. The login flow uses generic "Invalid credentials" correctly, but the register flow undoes that protection.

**Impact:** Mass email enumeration; phishing target lists.

**Fix plan:** Return the same generic success message ("If the account is available, you'll receive instructions") and send an email to the existing user notifying them of the attempted reuse, or use a delayed email-verification flow that hides existence. At minimum, return identical timing and response for taken vs available addresses.

---

## AUTHSVC-003 — Login is vulnerable to user-existence timing attack

- **Severity:** Low
- **Category:** security
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/auth-service/src/routes/auth.route.ts`
- **Symbol:** `POST /auth/login`

**Root cause:** If `findUnique` returns no user, the handler returns 401 immediately without calling `bcrypt.compare`. When the user exists, `bcrypt.compare` adds ~100ms. The timing difference reliably reveals whether an email is registered.

**Impact:** Email enumeration via response timing.

**Fix plan:** Always call `bcrypt.compare(password, KNOWN_DUMMY_HASH)` when the user is not found, so total time is roughly constant. Or use a constant-time response delay.

---

## AUTHSVC-004 — No email verification gating; emailVerified flag is dead

- **Severity:** Medium
- **Category:** security
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/auth-service/src/routes/auth.route.ts`
- **Symbol:** `POST /auth/register`, `POST /auth/login`, `POST /auth/become-host`

**Root cause:** `User.emailVerified` exists in the schema but is never set to `true` anywhere in either reviewed service. No verification email is sent on register, no token model exists for verification, and login/host-onboarding do not check `emailVerified`. Anyone can register with someone else's email address and immediately use the account.

**Impact:** Spam accounts, email squatting, password recovery flows that depend on verified email cannot be trusted.

**Fix plan:** Add a `VerificationToken` model (token, userId, expiresAt), send a verification email via Kafka (`user.verification.requested`), expose `POST /auth/verify-email`, and refuse `become-host` until verified.

---

## AUTHSVC-005 — `POST /auth/become-host` self-promotes role without admin gate

- **Severity:** High
- **Category:** authz
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/auth-service/src/routes/auth.route.ts`
- **Symbol:** `POST /auth/become-host`

**Root cause:** Any authenticated USER can call `/auth/become-host` and have their `role` set to `HOST`, with new access+refresh tokens issued with `role: "HOST"`. The `hostVerified=false` flag means `hasVerifiedHostAccess()` still rejects them from `shouldBeHost`-protected routes, so they can't act yet — but they have nonetheless self-promoted into a role that the rest of the system uses for branching (admin lists `role: "HOST"` hosts, UI shows host dashboard, etc.). There is no admin approval step. Worse, the schema doesn't store any "host application" record, so admins have no queue to review.

**Impact:** Anyone can pollute the host directory; weakens authz model. If `hasVerifiedHostAccess` is ever loosened (e.g., grace period), this becomes a direct privilege escalation.

**Fix plan:** Replace `become-host` with a `host-application` model. Admin uses `PUT /users/:id/verify-host` (which already exists) and `PUT /users/:id/role` to grant HOST after review.

---

## AUTHSVC-006 — Refresh token never rotates; reuse not detected

- **Severity:** High
- **Category:** security
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/auth-service/src/routes/auth.route.ts`
- **Symbol:** `POST /auth/refresh`

**Root cause:** `/auth/refresh` accepts a refresh token, verifies it, looks up the session, and issues a new access token — but never rotates the refresh token and never invalidates the old session. A stolen refresh token is valid for the full 30-day window. There is no reuse-detection (the standard "rotate-and-invalidate-on-reuse" pattern from OWASP). Logout only deletes the specific token submitted, so an attacker who never logs out keeps access.

**Impact:** Stolen refresh tokens give persistent unobservable access.

**Fix plan:** On each successful refresh: delete the old session row and create a new one with a new refresh token; return both `accessToken` and the new `refreshToken`. If a refresh token is presented whose session is already deleted, force-logout the user (delete all their sessions) and require re-login.

---

## AUTHSVC-007 — `POST /auth/logout` does not invalidate the access token

- **Severity:** Low
- **Category:** security
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/auth-service/src/routes/auth.route.ts`
- **Symbol:** `POST /auth/logout`

**Root cause:** Logout deletes the session row (refresh token) but the issued access token remains valid until its `exp`. There is no denylist or `jti`-tracking. Combined with the 15-minute access TTL the window is small, but on a shared device a freshly-issued token survives logout.

**Impact:** Short-window post-logout access on shared devices.

**Fix plan:** Either accept the 15-minute TTL as policy and document it, or add a token denylist keyed by `jti` checked in `verifyAccessToken`.

---

## AUTHSVC-008 — Email/username uniqueness is case-sensitive; duplicate accounts possible

- **Severity:** Medium
- **Category:** data-integrity
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/auth-service/src/routes/auth.route.ts`, `apps/auth-service/src/routes/user.route.ts`
- **Symbol:** `POST /auth/register`, `POST /users` (admin)

**Root cause:** Email and username are stored verbatim with a `@unique` constraint. The constraint is case-sensitive by default in Postgres. A user can register `Alice@example.com` and another can register `alice@example.com`. Lookup by `findUnique({ where: { email } })` is also case-sensitive, so login with the "wrong" case will silently fail (BOOKSVC also depends on this for booking ownership).

**Impact:** Confused duplicate accounts; login frustration; password-reset hits the wrong row.

**Fix plan:** Lowercase the email (and optionally username) before all writes and queries. Add a Prisma `@db.Citext` migration or normalize at the application layer.

---

## AUTHSVC-009 — No password change endpoint; profile update doesn't re-auth

- **Severity:** Medium
- **Category:** security
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/auth-service/src/routes/auth.route.ts`
- **Symbol:** `PUT /auth/me`, missing `PUT /auth/password`

**Root cause:** There is no endpoint to change the password (the only path to a new password is via admin `PUT /users/:id`). The profile-update endpoint also doesn't require the current password to change `phone`, `bio`, or `image`. If an access token is briefly stolen (XSS, shared machine), the attacker can alter profile fields without re-auth.

**Impact:** Missing critical feature; brief token compromise has higher blast radius than necessary.

**Fix plan:** Add `PUT /auth/password` that requires `currentPassword` and rotates all sessions. Optionally require step-up auth (re-enter password) for email/phone changes.

---

## AUTHSVC-010 — No password reset flow exists

- **Severity:** High
- **Category:** security
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/auth-service/src/routes/auth.route.ts`
- **Symbol:** missing `POST /auth/forgot-password`, `POST /auth/reset-password`

**Root cause:** No forgot/reset endpoints, no `PasswordResetToken` model in the schema, no Kafka event for `password.reset.requested`. Users who forget their password must contact an admin who would have to use `PUT /users/:id` (which accepts no password field anyway — see AUTHSVC-013).

**Impact:** Major missing feature; admins have no clean way to handle forgotten passwords; users locked out.

**Fix plan:** Add `PasswordResetToken { id, userId, tokenHash, expiresAt, usedAt }`. Implement `POST /auth/forgot-password` (always returns 200, sends an email via Kafka), `POST /auth/reset-password` (validates token, single-use, ≤30min TTL, rotates all sessions). Rate-limit both.

---

## AUTHSVC-011 — Register/login/refresh accept arbitrary request bodies; no schema validation

- **Severity:** Medium
- **Category:** input-validation
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/auth-service/src/routes/auth.route.ts`
- **Symbol:** `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `PUT /auth/me`

**Root cause:** Bodies are destructured directly from `req.body` with no Zod (or other) validation. `email`, `username`, `password`, `name`, `phone`, `bio`, `image` are not checked for type, length, format, or shape. `password` has no minimum length enforced. `name` accepts arbitrary types — when non-string is sent to `prisma.user.create`, Prisma throws and the request returns 500. `image` accepts any string with no URL validation. `phone` no format check. Conversely the booking service does use Zod (good); auth-service is inconsistent.

**Impact:** Weak passwords are accepted; bad data persisted; 500 errors leak as "Internal server error"; future XSS risk in fields that flow to other services.

**Fix plan:** Define Zod schemas in `@repo/types` for `RegisterInput`, `LoginInput`, `RefreshInput`, `UpdateProfileInput`. Enforce password policy (length ≥ 10, etc.). Validate `image` as URL, `email` as email, `phone` as E.164.

---

## AUTHSVC-012 — Admin `/users` routes silently swallow Prisma errors as 500

- **Severity:** Low
- **Category:** error-handling
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/auth-service/src/routes/user.route.ts`
- **Symbol:** `PUT /users/:id`, `POST /users`, `DELETE /users/:id`

**Root cause:** Each handler wraps in `try/catch` and on any error returns `500 "Internal server error"` while logging the raw error to stdout. P2002 (unique conflict on email/username update), P2025 (record not found on delete), and other Prisma errors all collapse to the same 500. Admins get no signal about what went wrong, and the global Express error middleware (which would surface `err.message`) is never reached.

**Impact:** Operational opacity; admins reissue the same broken request; no signal of conflicting email.

**Fix plan:** Map Prisma error codes to 400/404/409 with user-readable messages. Or remove the try/catch and let the global middleware handle them (it already exists in `index.ts`). Be careful not to leak internals — keep `err.message` only when the code is a known business error.

---

## AUTHSVC-013 — Admin can lock out all admins / delete themselves

- **Severity:** Medium
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/auth-service/src/routes/user.route.ts`
- **Symbol:** `DELETE /users/:id`, `PUT /users/:id/role`

**Root cause:** Neither endpoint prevents the calling admin from demoting or deleting the last admin. `PUT /users/:id/role` lets an admin change their own role to USER. `DELETE /users/:id` lets an admin delete themselves. There is no "must keep at least one admin" guard.

**Impact:** Self-inflicted lockout; recoverable only by direct DB access.

**Fix plan:** In both handlers: if target is the caller, refuse; if action would leave zero admins, refuse. Add a `count({ where: { role: "ADMIN" } })` check before applying.

---

## AUTHSVC-014 — Admin `PUT /users/:id` cannot change password; admin `POST /users` accepts plaintext but no policy

- **Severity:** Low
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** High
- **File:** `apps/auth-service/src/routes/user.route.ts`
- **Symbol:** `PUT /users/:id`, `POST /users`

**Root cause:** `PUT /users/:id` silently ignores any `password` field in the body — admins cannot reset a forgotten password via this endpoint. `POST /users` accepts plaintext `password`, hashes it, and stores — but there is no password policy enforcement (length, complexity). The admin-created account is also not flagged "must reset on first login".

**Impact:** No working admin password-reset path (combined with missing forgot-password — AUTHSVC-010 — leaves users no recovery option); admin-set passwords can be weak.

**Fix plan:** Allow `password` in `PUT /users/:id` (hash it, rotate sessions); enforce a minimum policy at the schema layer; add a `mustChangePassword` flag for admin-created accounts.

---

End of slice 04.
