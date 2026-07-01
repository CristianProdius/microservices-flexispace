# Spacefly bug audit — 2026-07-01

Multi-agent audit of the whole monorepo (12 service×lens finders, each candidate
adversarially verified, deduped). Read-only — no code changed. Severities are the
reviewer-adjusted values (real exploitability + blast radius). "Latent" = no live
trigger today but becomes real on a foreseeable change.

**Positive result:** no cross-account booking IDOR. Guests/hosts are bound to their
real `userId`; the only cross-tenant power is legitimate ADMIN authority.

Totals: **4 HIGH · ~15 MEDIUM · ~21 LOW**.

---

## 🔴 HIGH

### H1 — Free / underpriced bookings via client-controlled `isHourly`
`apps/order-service/src/routes/booking.ts:510,542,273,702`
The *priced* window and the *blocked* window are computed independently. Pricing uses
`wantsHourly = Boolean(startTime && endTime)`; occupancy uses the raw client `isHourly`.
- (a) Hourly-only space: send `isHourly=false` with no times → `candidates=[]` → `subtotal=0`
  → **free full-day reservation that blocks everyone else**.
- (b) BOTH space: send a 1-hour window with `isHourly=false` → charged 1 hour, blocks the whole day.
**Fix:** derive `isHourly` server-side (times present AND space supports hourly); price the exact
window you block; reject zero-candidate pricing (400); floor `subtotal ≥ 0`.

### H2 — Negative host base rates → negative booking total
`apps/product-service/src/controllers/space.controller.ts:726-749,936` · `order-service/.../booking.ts:542,549`
`createSpace`/`updateSpace` copy `pricePerHour/pricePerDay/cleaningFee/capacity/min-maxBookingHours`
into Prisma with **no numeric validation**; schema is unconstrained `Float?`. A host sets
`pricePerHour:-100` → a guest booking yields a negative total (platform credits the guest).
**Fix:** validate finite `≥ 0` in both create+update; positive-int capacity; `min ≤ max`; DB CHECK
constraints; clamp `subtotal`/`total ≥ 0` in order-service as defense-in-depth.

### H3 — nginx ingress serves the whole site over plaintext HTTP (no HTTPS redirect, no HSTS)
`deploy/nginx/spacefly.conf:2,40,86` · default `INGRESS_MODE=nginx`
All three `:80` blocks `proxy_pass` straight to backends; no `return 301 https`, no HSTS anywhere.
`POST http://api.spacefly.ai/auth/login` sends credentials in cleartext; a TLS-stripping MITM
captures credentials + session cookies across all three hosts. (Caddy path is fine.)
**Fix:** `return 301 https://$host$request_uri;` on every `:80` block (keep ACME passthrough);
add `Strict-Transport-Security` to every 443 block.

### H4 — Payout pipeline does not exist — hosts are never paid
`apps/order-service/src/routes/booking.ts:1338-1342,1584,1591`
`booking.completed` claims "downstream payout reconciliation," but nothing writes the `Payout`
table anywhere (only read-only aggregates exist). `pendingPayout`/`completedPayouts` report 0 forever.
**Fix:** implement a `booking.completed` payout consumer writing `Payout` rows idempotently keyed on
`bookingId` (or compute inline in the complete tx). Until then, remove the false comment + dead fields.

---

## 🟡 MEDIUM

### Auth / session
- **M1 — No per-user access-token kill switch.** `auth-service` reset-password, change-password,
  role-demotion, and host-de-verification don't invalidate outstanding access JWTs (revocation is
  per-`jti` only). A stolen token / demoted admin / de-verified host keeps full access for ~15 min.
  *Fix:* `User.tokensValidAfter` epoch checked in the auth middleware (`iat < tokensValidAfter` → reject)
  + delete refresh sessions + `invalidateUserCache`.
- **M2 — `mustChangePassword` is advisory only** (confirmed from both auth and admin sides). Login
  issues fully-privileged tokens; the flag isn't in the JWT and no middleware checks it; the wizard is
  a client-side redirect (`OnboardingGuard`). A temp-password holder can call APIs directly and never
  rotate. *Fix:* carry the flag in the token (or middleware lookup) and 403 all non-password-change
  endpoints while true.
- **M3 — `logout()` swallows server revocation failure and never clears HttpOnly cookies.**
  `admin/.../authStore.ts:263` + `lib/auth.ts` (no `res.ok` check). On a network blip/5xx the refresh
  chain is never revoked and `.spacefly.ai` cookies live for the 7-day TTL; the UI shows logged-out. On
  a shared machine the next user's browser re-mints the prior session via `/auth/refresh`. *Fix:* gate
  the logged-out UI on a confirmed server revocation; always emit `Set-Cookie` clears.

### Booking / money (order-service)
- **M4 — PENDING holds never expire** → free request-to-book holds block availability indefinitely
  (no payment, no cron, `EXPIRED` never written). *Fix:* `holdExpiresAt` + sweep, and/or exclude
  PENDING from create-time conflicts; cap per-guest pending.
- **M5 — Refund cutoff treats local check-in time as UTC** (`booking.ts:1208`, `setUTCHours` on naive
  `HH:MM`). For RO/MD venues (UTC+2/+3) refunds flip brackets near boundaries (e.g. 100% instead of 0%).
  *Fix:* resolve space/venue IANA timezone → real UTC instant.
- **M6 — `pricingTiers.price = 0` zeroes the subtotal for any duration** (`Math.min` poisoning). A
  "first hour free" tier makes a 30-day booking bill only the cleaning fee. *Fix:* reject tier price `0`
  in `validatePricingTiers` and/or skip zero-price candidates like the zero-hour guard does.
- **M7 — `getExchangeRate` has no reverse/USD-chain fallback** (`booking.ts:557-574`). If an operator
  seeds only `USD→MDL`, every MDL space 503s on every booking forever (visible but unbookable). The
  sibling `product-service/.../currency.ts` already chains through USD. *Fix:* add the same fallback or
  auto-write the inverse pair.
- **M8 — Auto-reject publish is fire-and-forget** (`booking.ts:1068-1076`, unawaited, no try/catch) →
  a Kafka outage becomes an unhandled rejection that can crash the worker. *Fix:* await in try/catch
  (`Promise.allSettled`), mirroring the `booking.confirmed` send.
- **M9 — Auto-reject payload omits `guestEmail`** → race-loser guests are never sent a decline email
  (the email consumer short-circuits on missing `guestEmail`). *Fix:* fetch + include `guestEmail`/`guestName`.
- **M10 — Payout earnings endpoint sums `Payout.netAmount` across currencies** with no `by:[currency]`
  grouping. *Latent* until payout rows exist (see H4). *Fix:* group by currency like `completedByCurrency`.

### Product-service / visibility
- **M11 — `getSpace` serves deactivated spaces; neither read path filters `venue.isActive`.**
  "Deactivate to hide" doesn't hide the detail page; a soft-deleted venue's spaces stay public + bookable
  (its location leaks) because `updateVenue` soft-delete doesn't cascade. *Fix:* add `isActive:true` and
  `venue:{isActive:true}` to `getSpace`/`getSpaces` (+ availability endpoints).

### Frontend (admin)
- **M12 — Host earnings dashboard sums mixed currencies and labels it USD**
  (`admin/.../host/earnings/page.tsx` + `host/page.tsx`). A host with RON/MDL bookings sees a meaningless
  "$X" total; it bypasses `GET /bookings/host/earnings` built for exactly this. *Fix:* call that endpoint
  and render per-currency; never hardcode `"USD"` on a mixed sum.

### Config / infra
- **M13 — `order-service` (the money service) has zero rate limiting + leaks internal error messages on 500.**
  No `@fastify/rate-limit`; no `setErrorHandler` (Fastify echoes `err.message`). *Fix:* register rate-limit
  (global + tighter on booking creation, keyed on userId/IP, `trustProxy:true`) + a redacting error handler.
- **M14 — `product-service` fails *open* on missing/invalid `CORS_ORIGINS`** (silently trusts localhost
  with `credentials:true`) where auth/order fail closed. A typo (`http://` not `https://`) empties the
  allowlist. *Fix:* throw at boot in prod when the resolved list is empty (match the siblings).
- **M15 — docker-compose defaults the verification/reset JWT secrets to empty** (`${VAR:-}` not `${VAR:?}`).
  Auth-service boots green but email-verification & password-reset 500 in prod with no boot signal.
  *Fix:* use the `${VAR:?...}` required form like `JWT_SECRET`.

---

## 🟢 LOW (selected)

**Input validation / wrong status (product-service):** `getSpaces` casts `city`/`categorySlug`/`groupSlug`
`as string` with no guard → unauthenticated Prisma 500s **and** filter-operator injection that reshuffles
public listings (`?categorySlug[not]=foo`); `amenityIds` and venue `latitude/longitude/currency` unvalidated
(500-where-400). **Authz/visibility:** admin `venueId` reassignment skips venue-ownership; `createSpace`
attaches a new active space to a soft-deleted venue; `GET /spaces/:id/reviews` returns reviewer PII for
tombstoned-host spaces; "most venues/spaces" sort counts soft-deleted rows; `availableCities` facet omits the
host-deleted filter. **Auth:** refresh lifetime 7d-vs-30d default mismatch (premature logout);
`SameSite=None` logout CSRF (forced logout); `getToken` cool-off turns a transient refresh blip into a 5s
logout dropping in-flight work; edge middleware doesn't enforce ADMIN-vs-HOST role and accepts
expired/unsigned cookies (shell flash only today — defense-in-depth). **Email:** host free-text interpolated
into branded emails (phishing vector); recipient address never validated (5 doomed retries); multi-recipient
idempotency gap on missing `bookingId`; `attemptCounts` map leak on rebalance. **Client:** review-submission
route `/bookings/[id]/review` doesn't exist (feature unreachable); `getStoredUser()` `JSON.parse` with no
try/catch can brick auth init; `login()`/`register()` don't clear the booking draft (shared-device bleed);
currency formatting hardcoded to `en-US` (wrong separators for ro/ru); checkout shows a stale client price.
**Kafka/events:** dead consumers (product-service connects but never subscribes; order subscribes to `[]`);
generic consumer DLQs **and** re-throws (double-processing); `booking.cancelled` audit gap for admin cancels.
**API-contract cosmetics:** `reviewCount` vs `totalReviews` (counts render 0); `getMySpaces` omits ratings;
`VenueSpaceSummary.city/country` renders a stray ", "; `auth-service` error handler echoes raw messages.

---

## Suggested order of attack
1. **H1, H2** — money correctness, both small server-side validations. Highest ROI.
2. **H3, M15** — prod-config one-liners (HTTPS redirect/HSTS; required JWT secrets).
3. **M1, M2, M3** — auth hardening (`tokensValidAfter` covers M1 and most of M2).
4. **M4–M11** — booking/visibility correctness.
5. **H4** — payout pipeline (largest build; product decision on payout mechanics first).
6. LOW batch — input-validation + API-contract cosmetics are quick wins.
