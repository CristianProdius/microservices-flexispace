# Slice 03 — apps/product-service

**Scope:** Express API for spaces/venues/categories/amenities/currencies/uploads/reviews
**Files reviewed:** 22 source files + Prisma schema (verified shapes)
**Findings:** 20

---

## PRODSVC-001 — `updateAvailability` skips all validation, allowing arbitrary/invalid availability rows

- **Severity:** high
- **Category:** input-validation
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/product-service/src/controllers/space.controller.ts` lines 801–865
- **Symbol:** `updateAvailability`

**Root cause:** `createSpace` and `updateSpace` route availability through `normalizeAvailability`, which enforces 7 unique days, `HH:mm` format, end-after-start, and at least one open day. The dedicated `PUT /spaces/:id/availability` endpoint feeds `req.body.availability` directly to `prisma.availability.createMany` with `a.dayOfWeek`, `a.startTime`, `a.endTime`, `a.isOpen ?? true` — no type/range checks. Same for `blockedDates` (only `new Date(d.date)` and `d.reason`), which can yield `Invalid Date` rows.

**Impact:** A verified host (or admin) can submit `dayOfWeek: 99`, garbage time strings, duplicate days, zero entries, or `Invalid Date` blocked dates. Subsequent booking flows that read `availability`/`blockedDates` will misbehave (silent acceptance, incorrect availability rendering, or crashes when parsing). The DB layer constrains `@@unique([spaceId, dayOfWeek])` but does not constrain values. Duplicate dayOfWeek inside a single `createMany` will fail mid-call, leaving the space with zero availability rows because the preceding `deleteMany` already executed (atomicity holds within the inner `$transaction`, but the lack of validation surfaces opaque 500s).

**Fix plan:** Run `normalizeAvailability(req.body.availability)` exactly as the other endpoints do; validate each `blockedDates[i]` (`isDateOnlyOrIsoDate`, reason length cap, `date >= today`). Return 400 on any failure before touching Prisma.

---

## PRODSVC-002 — Public `GET /spaces/:id` leaks host email

- **Severity:** high
- **Category:** security
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/product-service/src/controllers/space.controller.ts` lines 390–404
- **Symbol:** `getSpace`

**Root cause:** The space-detail endpoint is mounted publicly (`router.get("/:id", getSpace)`). Its Prisma `include` selects `host: { select: { id, name, email, image, bio, hostingSince } }`. The list endpoint (`getSpaces`) deliberately exposes only `{id, name, image}`. The detail endpoint exposes `email` for every host on every space page view.

**Impact:** Host email addresses are scraped by any unauthenticated client. PII/privacy leak; aids spam/phishing/credential-stuffing. Inconsistent with the list endpoint's defensive selection.

**Fix plan:** Remove `email: true` from the `host.select` in `getSpace`. If client UX needs a contact channel, surface a contact form proxied through booking flow.

---

## PRODSVC-003 — `streamUploadedImage` lets anyone read arbitrary S3 keys in the bucket

- **Severity:** high
- **Category:** authz
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/product-service/src/routes/upload.route.ts` line 47; `apps/product-service/src/controllers/upload.controller.ts` lines 41–101; `apps/product-service/src/utils/upload.ts` lines 174–180
- **Symbol:** `streamUploadedImage` / `getObjectKeyFromRoute`

**Root cause:** `router.get(/^\/(.+)$/, streamUploadedImage)` captures the entire path tail and `getObjectKeyFromRoute` only strips leading slashes. No prefix allow-list is enforced (e.g., `spaces/`), no auth, no signed URL. The handler issues `GetObjectCommand({ Bucket, Key: <user input> })` verbatim.

**Impact:** If the configured `S3_BUCKET` contains anything besides space uploads (backups, exports, other services' data, logs, IaC artifacts), a `GET /uploads/<any-known-or-guessable-key>` exfiltrates it. The bucket is also implicitly trusted as a CDN: `Cache-Control: public, max-age=31536000, immutable` is set from S3 metadata or a hard-coded default, so reads are amplified through any caching layer. Path-traversal-like inputs (`../`, NULL bytes) are not normalized — S3 will treat them as literal key segments, but uppercase `..` paths or HTTP-decoded sequences can collide with non-public namespaces.

**Fix plan:** Constrain the regex / sanitize: require the object key to match `^spaces/[\w-]+/[\w.-]+$`, reject `..`, `//`, control chars; return 404 otherwise. Better: serve uploads through the CDN/S3 directly with pre-signed URLs and remove the proxy entirely.

---

## PRODSVC-004 — `createSpace` and `updateSpace` perform multi-table writes outside a single transaction → partial-write corruption

- **Severity:** high
- **Category:** data-integrity
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/product-service/src/controllers/space.controller.ts` lines 494–538 (`createSpace`), 645–702 (`updateSpace`)
- **Symbol:** `createSpace`, `updateSpace`

**Root cause:** `createSpace` calls `prisma.space.create(...)` (nested availability + amenities), then a separate non-transactional `prisma.pricingTier.createMany(...)`. If the second call throws (DB hiccup, validation, deploy restart), the space exists with availability but no pricing tiers — and the `space.created` Kafka event is emitted regardless of which step failed (actually it's only emitted at the end, so on failure it's not emitted, but the space row persists). `updateSpace` is worse: a single `prisma.space.update` runs first, then three independent `$transaction` calls (`spaceAmenity` swap, `pricingTier` swap, `availability` swap) executed sequentially. A crash between them leaves the space with new core fields, swapped amenities, but stale pricing/availability. There is no rollback.

**Impact:** Inconsistent space state visible to guests (e.g., new amenities advertised at old prices, or new prices with no availability), bookings made against contradictory data, manual cleanup required, support burden.

**Fix plan:** Wrap each handler's writes in a single `prisma.$transaction(async (tx) => { ... })`. For `createSpace`, include the pricing tier insert inside the same transaction. For `updateSpace`, fold the space update and all three swap operations into one interactive transaction.

---

## PRODSVC-005 — `createReview` accepts `bookingId === undefined` and bypasses booking-ownership check

- **Severity:** high
- **Category:** authz
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/product-service/src/controllers/review.controller.ts` lines 5–72
- **Symbol:** `createReview`

**Root cause:** `bookingId` is read from `req.body` with no presence/type check. `prisma.booking.findFirst({ where: { id: bookingId, spaceId, guestId: userId, status: "COMPLETED" } })`: when `bookingId` is `undefined`, Prisma omits that field from the WHERE, so `findFirst` returns the user's first completed booking on the space, regardless of which booking they intend to review. The "booking exists" check therefore passes spuriously.

The subsequent `prisma.review.findUnique({ where: { bookingId } })` then runs with `bookingId: undefined`, which Prisma rejects at the client layer — but in practice it throws a runtime error that the global error handler returns as 500 (so the request fails). However, if the attacker sends `bookingId: "<id-of-some-arbitrary-booking-they-do-not-own>"` AND has at least one completed booking of their own on that space, the first lookup may still match a real booking (the where becomes `id: <attacker-supplied>, spaceId, guestId: userId, status: COMPLETED`) — so this path is actually safe for non-empty IDs.

The exploitable surface is type-confusion: `bookingId: { not: "" }` (object) would be ignored similarly to undefined; also any falsy non-string would coerce inside the unique check.

**Impact:** Logic relies on Prisma quietly dropping `undefined` from filters; a malformed payload produces a 500 instead of a clean 400, and the auth check (`booking ownership for the *specific* booking`) is not actually performed when `bookingId` is missing — instead any completed booking by the user on that space satisfies it. Subsequent `create({data:{bookingId:undefined,...}})` then fails at the DB layer (required field), so the write is blocked — but the controller never enforces the contract it documents.

**Fix plan:** Validate `bookingId` is a non-empty string at the top of the handler (return 400 if missing). Validate `rating` and `comment` types/lengths. Optionally `parseRating(rating)` and reject before any DB work.

---

## PRODSVC-006 — `updateRates` (admin currency endpoint) lacks a transaction → partial rate updates on failure

- **Severity:** medium
- **Category:** data-integrity
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/product-service/src/controllers/currency.controller.ts` lines 12–37
- **Symbol:** `updateRates`

**Root cause:** Iterates `for (const ... of rates)` and `await prisma.exchangeRate.upsert(...)` one at a time, no `$transaction`. If the 4th of 6 upserts fails (DB timeout, invalid enum value not caught earlier, etc.), the first 3 are committed and the rest are not. Worse: `invalidateRateCache()` runs only on full success, so booking flows using `convertCurrency` keep using stale cached values for up to 5 minutes even when partial updates landed.

**Impact:** Hosts/guests get inconsistent currency conversions for bookings/quotes during the window of a partial update. Audit trail (`updatedBy`) is also partial.

**Fix plan:** Wrap the upserts in `prisma.$transaction(rates.map(r => prisma.exchangeRate.upsert(...)))`. Move `invalidateRateCache()` to a `finally` (or call it after a successful commit and again if the commit throws, since some rows may still have been written before failure in non-transactional mode — defensive). Also validate `fromCurrency`/`toCurrency` against the `Currency` enum (`Object.values(Currency).includes(...)`).

---

## PRODSVC-007 — Global error handler echoes raw `err.message`, leaking internal error detail

- **Severity:** medium
- **Category:** security
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/product-service/src/index.ts` lines 58–63
- **Symbol:** anonymous error middleware

**Root cause:** `res.status(err.status || 500).json({ message: err.message || "Internal Server Error!" })`. Prisma errors (e.g., `PrismaClientKnownRequestError`) include detailed messages naming tables, columns, and constraints. Many controllers do not catch Prisma errors (missing-row updates, foreign-key violations on `categorySlug`), so those messages are returned to the client untouched.

**Impact:** Information disclosure that aids attackers in mapping the schema, identifying constraints, and crafting injection/abuse payloads. Also returns 500 with a stack-trace-grade message even for client-correctable errors that should be 404/400.

**Fix plan:** Branch on `err.status`: if `status >= 400 && status < 500` return the provided message; otherwise log internally and return a generic `"Internal Server Error"`. Add a Prisma-error handler that maps `P2025` → 404, `P2002` → 409, `P2003` → 400 with a stable, generic message.

---

## PRODSVC-008 — `updateCategory`, `deleteAmenity`, `updateAmenity` rely on Prisma to throw for missing rows → 500 instead of 404

- **Severity:** medium
- **Category:** error-handling
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/product-service/src/controllers/category.controller.ts` lines 80–94; `apps/product-service/src/controllers/amenity.controller.ts` lines 13–47
- **Symbol:** `updateCategory`, `updateAmenity`, `deleteAmenity`

**Root cause:** No `findUnique` existence check before `update`/`delete`. On a missing id, Prisma throws `P2025` ("Record to update not found"), which the global handler converts to a 500 with the raw Prisma message (see PRODSVC-007).

**Impact:** Admin clients see opaque 500s for what should be 404s; combined with PRODSVC-007, the response body leaks Prisma message text. `createAmenity` has no input validation at all (no `name` presence check) and a missing name produces another 500.

**Fix plan:** Add `findUnique` guards returning 404 (matches the pattern already used in `deleteCategory`, `getAmenity`, `getCategory`). Validate `createAmenity` body shape before the Prisma call.

---

## PRODSVC-009 — `createSpace` does not validate `categorySlug` exists → 500 on bad input

- **Severity:** medium
- **Category:** input-validation
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/product-service/src/controllers/space.controller.ts` lines 461–521
- **Symbol:** `createSpace`

**Root cause:** `buildCategoryPayload` normalizes the slug and derives a fallback `spaceType`, but no `prisma.spaceCategory.findUnique({ where: { slug } })` happens. If the slug is missing from the `SPACE_TYPE_BY_CATEGORY_SLUG` map AND not present in `SpaceCategory`, the create call fails with `P2003` foreign-key violation → 500 (with leaky message via PRODSVC-007). Also `spaceType` may be `null` if the slug isn't in the map and no `spaceType` is supplied in the body — Prisma will reject because the column is non-null, again as a 500.

**Impact:** Hosts get cryptic 500s on minor typos. Confused state from the client's perspective; harder support.

**Fix plan:** Validate `categorySlug` is a non-empty string AND exists in DB before the create. Validate `spaceType` is a member of the enum if explicitly provided.

---

## PRODSVC-010 — `videoUrl` regex permits open-redirect-style and arbitrary YouTube subdomain URLs

- **Severity:** low
- **Category:** input-validation
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/product-service/src/controllers/space.controller.ts` lines 471–481, 603–613
- **Symbol:** `createSpace`, `updateSpace`

**Root cause:** `/^https:\/\/(www\.)?youtube\.com\/|^https:\/\/youtu\.be\//` matches any path on `youtube.com`/`youtu.be`, including `https://youtube.com/redirect?q=https://evil.com`. There is no parse of the URL or path-shape check. `venue.controller.ts` does not validate `videoUrl` at all (no regex in `createVenue`/`updateVenue`).

**Impact:** Hosts can store arbitrary YouTube URLs (or anything on those hosts). If the frontend embeds via `<iframe>`, the page renders a YouTube IFrame to any path which is generally safe; but `youtube.com/redirect` and similar can be used to redirect users off-platform. Bigger asymmetry: venues have no validation at all, so any string is accepted (including `javascript:`-style URLs that an old client could render).

**Fix plan:** Use `new URL(...)` and require `hostname` ∈ {`www.youtube.com`, `youtube.com`, `youtu.be`}, restrict to `/watch`, `/embed/<id>`, or `youtu.be/<id>` paths. Apply identical validation in `venue.controller.ts`.

---

## PRODSVC-011 — `respondToReview` does not validate the `response` body field

- **Severity:** low
- **Category:** input-validation
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/product-service/src/controllers/review.controller.ts` lines 209–249
- **Symbol:** `respondToReview`

**Root cause:** `const { response } = req.body;` then written directly to `hostResponse`. No presence, type, or length check. A non-string (object, number) is persisted as-is via Prisma (which will throw for non-string in TS-aware mode but works for null/missing → sets to `null`).

**Impact:** Hosts can wipe a response by sending `null`/`undefined` (sets `hostResponse: undefined` which Prisma treats as "no change"; sending `null` would clear it). Hosts can also store unbounded payloads. Combined with frontend that renders without truncation, this is a low-severity stored-content abuse vector.

**Fix plan:** Require `typeof response === "string"`, trim, enforce a length cap (e.g. 2000 chars), reject empties.

---

## PRODSVC-012 — `getMyVenues`, `getMySpaces`, `getCategories`, `getAmenities`, `getRates` are unbounded `findMany`s

- **Severity:** low
- **Category:** performance
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/product-service/src/controllers/venue.controller.ts` lines 6–14; `apps/product-service/src/controllers/space.controller.ts` lines 756–776; `apps/product-service/src/controllers/category.controller.ts` lines 126–158; `apps/product-service/src/controllers/amenity.controller.ts` lines 49–71; `apps/product-service/src/controllers/currency.controller.ts` lines 5–10
- **Symbol:** several

**Root cause:** No `take`/`skip`. For host-scoped lists this could explode when a host has thousands of spaces/venues. For taxonomy lists (categories, amenities, rates) the cardinality is currently bounded but unconstrained at the DB layer.

**Impact:** Memory/CPU spikes on the API server and client; large JSON payloads over the wire; potential abuse vector if an attacker can create many rows.

**Fix plan:** Add server-side pagination on host-scoped lists at minimum; add a sensible hard cap (`take: 200` etc.) on taxonomy lists.

---

## PRODSVC-013 — `updateAvailability` does not emit `space.updated` Kafka event

- **Severity:** low
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/product-service/src/controllers/space.controller.ts` lines 801–865
- **Symbol:** `updateAvailability`

**Root cause:** `updateSpace` emits `producer.send("space.updated", ...)`. `updateAvailability` mutates availability and blocked dates without emitting any event. Downstream caches/search indexes that listen to `space.updated` (e.g., to refresh "next available slot" badges) will not invalidate.

**Impact:** Stale derived data in search/cache layers until the next full reindex or until a host edits the space metadata.

**Fix plan:** After successful write, emit `producer.send("space.updated", { value: { id: spaceId } })`, matching the pattern from `updateSpace`.

---

## PRODSVC-014 — `getSpaces` `sort=rating` silently falls back to `createdAt desc` without telling the client

- **Severity:** low
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/product-service/src/controllers/space.controller.ts` lines 184–190
- **Symbol:** `getSpaces`

**Root cause:** Comment acknowledges `averageRating` is computed post-query and cannot be sorted in Prisma; the code silently substitutes `createdAt desc`. The response includes `averageRating` per item — so the client thinks it's getting rating-sorted results, but it's getting "newest first".

**Impact:** UX bug: the "Top rated" filter on the client returns newest spaces. Users complain that highly-rated spaces are buried.

**Fix plan:** Either compute rating server-side via `groupBy` first and reorder the `findMany` results (correct but more complex; needs careful pagination); or add a denormalized `averageRating`/`reviewCount` column on `Space` and order by it; or, short-term, return 400 with `"sort=rating not supported"` so the client falls back to a working sort.

---

## PRODSVC-015 — `getVenue` returns soft-deleted venues with full host PII

- **Severity:** low
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/product-service/src/controllers/venue.controller.ts` lines 16–58
- **Symbol:** `getVenue`

**Root cause:** No `where: { ..., isActive: true }` filter on `prisma.venue.findUnique`. Spaces inside the include are filtered to active, but the venue itself can be `isActive=false` and still returned with full metadata. Note this endpoint is public (`router.get("/:id", getVenue)` in `venue.route.ts`).

**Impact:** Hosts who soft-delete a venue (expecting it to disappear from the public site) still have its name, address, lat/long, images, and host profile fetched by direct-link visitors. Caches/search may continue surfacing the URL.

**Fix plan:** After `findUnique`, return 404 when `!venue || !venue.isActive`. (Keep an admin/host-owner override if needed via separate route.)

---

## PRODSVC-016 — `getSpaces` does not honor `amenityIds` filter even though it's parsed

- **Severity:** low
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/product-service/src/controllers/space.controller.ts` lines 199–304
- **Symbol:** `getSpaces`

**Root cause:** `amenityIds` is destructured out of `req.query` (line 208) but never used in the `where` clause. Clients sending `?amenityIds=1,2,3` get all spaces back unfiltered, with no error.

**Impact:** Search filter on the public space listing is broken — silently. Users selecting "Has WiFi" see all spaces.

**Fix plan:** Parse `amenityIds` (CSV → integer array, validate), then `where.amenities = { some: { amenityId: { in: parsed } } }` (or `every` if AND semantics are required).

---

## PRODSVC-017 — `checkAvailability` permits arbitrary far-future date ranges and is unauthenticated against the booking lookup

- **Severity:** low
- **Category:** performance
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/product-service/src/controllers/space.controller.ts` lines 868–938
- **Symbol:** `checkAvailability`

**Root cause:** Validates date format and ordering but not range size. An authenticated user can request `startDate=1970-01-01&endDate=9999-12-31` and the handler will (a) load all `blockedDates` on the space, (b) run `prisma.booking.findMany` for any PENDING/CONFIRMED booking overlapping the entire range. With many bookings, this returns a large result set into memory.

**Impact:** Cheap-to-trigger DoS surface; database load amplifier. Also, `blockedDates` is loaded as a side effect of `include: { blockedDates: true }` (no date filter) — every blocked date ever set is loaded on every check.

**Fix plan:** Cap the span (e.g., 366 days), reject if exceeded. Filter `blockedDates` on the `include` to `{ date: { gte: start, lte: end } }`. Use `prisma.booking.findFirst` to early-exit once any conflict is found.

---

## PRODSVC-018 — `updateSpace` reads `req.body` whitelisted but flows full `body` into `buildCategoryPayload`

- **Severity:** low
- **Category:** input-validation
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/product-service/src/controllers/space.controller.ts` lines 565–643
- **Symbol:** `updateSpace`

**Root cause:** The whitelist (`allowedKeys`) protects the Prisma `update` from mass-assignment. But `buildCategoryPayload({...body, categorySlug: allowed.categorySlug})` (line 637) spreads the full request body — including non-whitelisted keys — into the helper. Today `buildCategoryPayload` only reads `categorySlug`, so this is dormant; the moment the helper is extended to read other fields, the protection silently breaks.

**Impact:** Latent mass-assignment vulnerability. Not currently exploitable, but fragile.

**Fix plan:** Call `buildCategoryPayload({ categorySlug: allowed.categorySlug })` — pass only the fields the helper needs.

---

## PRODSVC-019 — Public `OR` price filter in `getSpaces` does not enforce non-negative bounds

- **Severity:** low
- **Category:** input-validation
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/product-service/src/controllers/space.controller.ts` lines 221–303
- **Symbol:** `getSpaces`

**Root cause:** `parseNumberFilter` accepts any finite number including negatives and `0`. A query like `?minPrice=-100&maxPrice=99999999` is accepted; not a security bug, but the `OR` between `pricePerHour` and `pricePerDay` ranges can also produce surprising results: a space with `pricePerDay=50` (in range) shows up even if `pricePerHour` is undefined or 0 — fine semantically, but combined with `currency` filter not normalizing across currencies, range queries cross-currency are nonsensical.

**Impact:** Cross-currency price filters silently return mixed/inconsistent results. Users filtering "$0–$100" see EUR/MDL spaces priced 0–100 in their respective currencies.

**Fix plan:** Either require `currency` to be set when price filters are used, or convert min/max into each candidate currency at query time (use `convertCurrency` from `lib/currency.ts`). At minimum, clamp `minPrice`/`maxPrice` to `>= 0`.

---

## PRODSVC-020 — CORS `credentials: true` paired with a possibly-large origin allow-list and no `Vary` discipline

- **Severity:** low
- **Category:** security
- **Verdict:** unclear
- **Confidence:** medium
- **File:** `apps/product-service/src/index.ts` lines 14–32
- **Symbol:** CORS setup

**Root cause:** `cors({ origin: corsOrigins, credentials: true })`. `corsOrigins` is an array driven by `CORS_ORIGINS` env split on `,` with no normalization (e.g., trailing slashes, scheme checks). If an operator accidentally puts `"*"` in the env, the `cors` package would still respect it as a literal string in array form (no match), but pasting an unintended origin (typo, dev URL with `http://`) sticks. Combined with `credentials: true`, a mistakenly-configured allow-list authorizes cookies/Authorization headers from that origin.

**Impact:** Operational footgun. Real exposure depends on production env config (out of scope of this slice).

**Fix plan:** Validate each entry against a schema (`https://` only outside localhost), reject `*`, document required format in `.env.example`.

---

## Remaining areas

Most of the surface is covered; smaller items not promoted to findings:

- `getMyVenues` returns soft-deleted venues (no `isActive` filter) — likely intentional, but worth a UX review.
- `updateVenue` cascades location to soft-deleted spaces under the venue.
- `createAmenity` accepts arbitrary `spaceTypes` array entries (no enum validation).
- `getRates` is publicly readable; probably intentional but unauthenticated.
- `producer.send(...)` is fire-and-forget (not awaited) in all controllers — current `createProducer` implementation swallows errors internally, so this is safe today but couples controller correctness to producer internals.
- No rate limiting at the app level (search endpoints in particular are cheap to abuse).
- `lib/currency.ts` chain-through-USD fallback can produce stale rates if the cache TTL (5 min) lapses mid-request; minor.
