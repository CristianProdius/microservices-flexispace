# Slice 05 — apps/email-service + packages/kafka + packages/types

**Scope:** Kafka/Resend email worker, shared Kafka helpers, shared domain types
**Files reviewed:** 17 (email-service: 4 incl. `.env`/`.env.example`/`package.json`/`src/index.ts`/`src/utils/mailer.ts`; kafka: 5 incl. `package.json`/`client.ts`/`producer.ts`/`consumer.ts`/`index.ts`; types: 9 incl. `package.json`/`index.ts`/`auth.ts`/`booking.ts`/`space.ts`/`venue.ts`/`review.ts`/`payout.ts`/`currency.ts`; plus cross-refs to `packages/db/prisma/schema.prisma`, `docker-compose.yml`, and producer call sites in `apps/auth-service`, `apps/order-service`, `apps/product-service`)
**Findings:** 18

---

## EMAIL-001 — Failed email send is silently swallowed; offset commits and message is lost

- **Severity:** high
- **Category:** data-loss
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/apps/email-service/src/index.ts`
- **Symbol:** `consumer.run({ eachMessage })` (lines 192-208), `subscription.topicHandler` calls into `sendMail`

**Root cause:** Inside `eachMessage`, the entire processing call (`JSON.parse(...)` + `topicHandler` which `await`s `sendMail(...)`) is wrapped in `try { ... } catch (error) { console.error(...) }`. When Resend fails (network blip, 429, malformed `from`, transient `RESEND_API_KEY` outage, etc.), `sendMail` throws but the error is caught and ignored. `eachMessage` returns successfully, so KafkaJS auto-commits the offset for the partition. The booking-confirmation email is gone for good — no retry, no DLQ, no alert. This is at-most-once delivery in a system the rest of the codebase plainly assumes is at-least-once (downstream effects depend on the email actually being sent).
**Impact:** Booking confirmations, host approvals, cancellation notices may silently never reach the user. The only signal is a `console.error` in container logs.
**Fix plan:** Re-throw transient Resend errors from `eachMessage` so KafkaJS retries the partition with backoff, plus add a max-attempt counter via message headers and push permanently failed messages to a dead-letter topic (e.g. `email.dlq`). Add metrics/alerts on the swallow path.

---

## EMAIL-002 — No retry / DLQ policy for poison messages

- **Severity:** high
- **Category:** messaging
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/apps/email-service/src/index.ts`
- **Symbol:** `consumer.run` configuration

**Root cause:** No `retry` config is passed to `consumer.run`, no `eachBatchAutoResolve` tuning, and no dead-letter routing. Combined with EMAIL-001, every kind of failure (malformed JSON, schema drift, missing template field, Resend 5xx) is collapsed into the same silent-drop outcome.
**Impact:** Operators cannot distinguish "permanent bad payload" from "transient downstream error". There is no way to re-drive failed emails after fixing a bug.
**Fix plan:** Wire kafkajs `retry` + DLQ producer publishing the original payload plus error metadata; keep the `JSON.parse` error in a separate catch so it goes straight to DLQ without retry storms.

---

## EMAIL-003 — Email worker subscribes to `user.created` but auth-service publishes payloads that don't include the recipient email

- **Severity:** medium
- **Category:** type-drift
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/apps/email-service/src/index.ts` (lines 42-54) and `/Users/cristian/Development/spacefly-ai/apps/auth-service/src/routes/auth.route.ts:86` / `apps/auth-service/src/routes/user.route.ts:169`

**Root cause:** The `user.created` handler reads `{ email, username }` from `message.value`. The two producer call sites both emit `{ username, email }`, so today it works — but `EmailEventMessage.value` is defined with everything optional (`email?: string`, `username?: string`), and the handler silently does nothing when `email` is missing. There is no schema validation, no warning log, and no shared contract type. A future producer change (e.g. renaming `email` to `recipientEmail`) will silently stop sending welcome emails, with the only symptom being "no welcome email arrived".
**Impact:** Silent feature regression on any contract drift; no test catches it.
**Fix plan:** Move the event payload shapes into `packages/types` (e.g. `UserCreatedEvent`, `BookingCreatedEvent`) and validate with Zod at the consumer; reject and DLQ on validation failure.

---

## EMAIL-004 — `user.became-host` is produced by auth-service but no consumer subscribes

- **Severity:** medium
- **Category:** messaging
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/apps/auth-service/src/routes/auth.route.ts:343` (producer) vs `/Users/cristian/Development/spacefly-ai/apps/email-service/src/index.ts:40-143` (subscription list)

**Root cause:** auth-service publishes `user.became-host` events with `{ userId, email, name }`, presumably to trigger a "welcome host" email — but the email-service `subscriptions` array does not include this topic. Grep across the repo confirms no other consumer either. The message goes to a topic that accumulates and is never read.
**Impact:** New hosts receive no notification; topic also accumulates in Kafka with no consumer offset advancing (depends on retention) — minor disk waste.
**Fix plan:** Either add a subscription + handler to email-service, or remove the producer call until the feature is implemented.

---

## EMAIL-005 — Resend client instantiated per message; no idempotency key passed

- **Severity:** medium
- **Category:** duplicate-delivery
- **Verdict:** real
- **Confidence:** medium
- **File:** `/Users/cristian/Development/spacefly-ai/apps/email-service/src/utils/mailer.ts`
- **Symbol:** `sendMail` (line 20-26)

**Root cause:** `sendMail` calls `resend.emails.send({ from, to, subject, text })` without setting an idempotency key / `Idempotency-Key` header (Resend supports it). Combined with the fact that Kafka redelivers messages on consumer-group rebalance, container restart between `await sendMail` and offset commit, or any future retry policy added for EMAIL-001, the same Kafka message could fire two Resend POSTs and the user gets duplicate emails. The lack of any deduplication key makes this impossible to detect server-side.
**Impact:** Once retries are properly added (which they should be), duplicate confirmation emails become likely. Also wastes Resend quota.
**Fix plan:** Use the Kafka message `topic+partition+offset` (or a `bookingId`-derived hash) as the Resend `idempotencyKey`. Resend will collapse duplicates within its dedup window.

---

## EMAIL-006 — `consumer.subscribe({ fromBeginning: false })` silently swaps the shared-helper default and risks lost startup-window events

- **Severity:** low
- **Category:** messaging
- **Verdict:** real
- **Confidence:** medium
- **File:** `/Users/cristian/Development/spacefly-ai/apps/email-service/src/index.ts:189`

**Root cause:** email-service bypasses `@repo/kafka`'s `createConsumer` helper and calls `kafka.consumer({ groupId: "email-service" })` directly with `fromBeginning: false`. The shared helper in `packages/kafka/src/consumer.ts:39` defaults to `fromBeginning: true`. On a fresh consumer-group (first deploy, or if the consumer group is reset), `fromBeginning: false` means the consumer starts at the log HEAD and ignores any backlog. Any booking emails published while email-service is down/redeploying are lost forever.
**Impact:** During the first deployment, or after a Kafka topic recreation, all in-flight email events are dropped. Inconsistent semantics vs the rest of the codebase that uses the shared helper.
**Fix plan:** Adopt the shared `createConsumer` helper (which also gives consistent error handling) and pick a deliberate retention policy. Alternatively, set `fromBeginning: true` explicitly and document why.

---

## EMAIL-007 — Resend `from` header interpolates env var with no validation, allowing display-name injection

- **Severity:** low
- **Category:** injection
- **Verdict:** real
- **Confidence:** low
- **File:** `/Users/cristian/Development/spacefly-ai/apps/email-service/src/utils/mailer.ts:22`
- **Symbol:** `from: \`Spacefly.ai <${process.env.RESEND_FROM_EMAIL}>\``

**Root cause:** `RESEND_FROM_EMAIL` is interpolated directly into a formatted `from` header. If someone ever sets `RESEND_FROM_EMAIL="noreply@spacefly.ai>, attacker@evil.com <attacker@evil.com"`, the header becomes malformed. This is operator-controlled (env), not user-controlled, so severity is low — but the lack of input validation is still wrong. More importantly, the same pattern with the `to` field is safe because Resend escapes it. Template body (`text: ...`) is also fine for plain text but would be unsafe if migrated to `html`.
**Impact:** Operator misconfiguration could yield malformed `From:`/spoofable senders. No code path currently uses HTML, so no XSS today.
**Fix plan:** Validate `RESEND_FROM_EMAIL` matches a bare email regex at startup, fail fast with a clear error. If/when HTML templates are added, ensure every interpolated `message.value` field is escaped — none of the current template bodies escape `spaceName`/`reason`/`cancelledBy`.

---

## EMAIL-008 — Shutdown does not stop accepting new health requests during disconnect and may abort in-flight `sendMail` calls

- **Severity:** low
- **Category:** error-handling
- **Verdict:** real
- **Confidence:** medium
- **File:** `/Users/cristian/Development/spacefly-ai/apps/email-service/src/index.ts:222-241`
- **Symbol:** `shutdown`

**Root cause:** `shutdown` calls `server.close()` first (which waits for active HTTP requests to drain) and then `consumer.disconnect()`. But `ready` is never set to `false` at the start of shutdown, so for the duration of HTTP draining, `/health` keeps returning 200 — the orchestrator sees a healthy pod and may keep routing or keep traffic in front of an LB that's about to die. More critically: KafkaJS's `disconnect` waits for the current `eachMessage` to finish, but if shutdown happens between `await sendMail` issuing the Resend request and the response being received, the process can exit and the email future is best-effort. With Resend's HTTP client default timeout this window is short, but it exists.
**Impact:** Minor — readiness state doesn't reflect "about to die". Slow Resend calls during SIGTERM may be aborted.
**Fix plan:** Set `ready = false; readinessDetails = ["shutting down"]` as the first line of `shutdown`, then drain in `consumer.disconnect()` -> `server.close()` order. Optionally wrap `sendMail` with an AbortSignal tied to shutdown.

---

## KAFKA-001 — `producer.send` is fire-and-forget at every call site; messages are silently dropped on broker outage

- **Severity:** high
- **Category:** data-loss
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/kafka/src/producer.ts:25-39`
- **Symbol:** `send` (and every caller in `apps/order-service/src/routes/booking.ts`, `apps/auth-service/src/routes/auth.route.ts`, `apps/product-service/src/controllers/space.controller.ts`, etc.)

**Root cause:** Inside the helper, `await producer.send(...)` is wrapped in `try/catch` that only logs the error (`console.error`). Worse, every call site invokes `producer.send("topic", {...})` without `await` and immediately returns 2xx to the user. If Kafka is unreachable or the producer was never `connect()`-ed (the catch on connect sets `connected = false` and the next `send` logs `Would send to ${topic}: …` and silently returns), the booking is persisted in Postgres but no email event ever leaves the service. The caller's HTTP response says "OK" and the user never learns the email was lost.
**Impact:** A Kafka outage during startup downgrades every service to "writes to DB, never sends events" mode with only log warnings. There is no transactional outbox, no retry queue, no in-memory buffer — events are dropped permanently.
**Fix plan:** Make callers `await producer.send(...)`. On failure, write the event to a Postgres outbox table inside the same transaction as the booking insert; have a separate worker drain the outbox to Kafka. Throw a typed error from `send` instead of swallowing so callers can react.

---

## KAFKA-002 — `createProducer` connection failure leaves the producer permanently in degraded "log-only" mode

- **Severity:** high
- **Category:** data-loss
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/kafka/src/producer.ts:14-23`
- **Symbol:** `connect`

**Root cause:** If `producer.connect()` throws, `connected = false` is set and a warning is logged. There is no retry, no scheduled reconnect, no health-check signal, and `send` becomes a permanent no-op printing `[Kafka Producer] Would send to <topic>: <payload>` for the rest of the process lifetime. KafkaJS itself has its own internal retry, but only after `connect()` succeeds — a failure here is terminal.
**Impact:** A Kafka broker that is briefly unreachable during service startup permanently silences event production until the service is manually restarted. Combined with KAFKA-001, this can drop weeks of events without alerting.
**Fix plan:** Either let `connect()` throw so the caller decides whether to fail-fast, or implement a reconnect loop with exponential backoff and a `health()` accessor that downstream `/health` endpoints can report.

---

## KAFKA-003 — Shared consumer helper swallows `eachMessage` errors and uses `console.log` (not `console.error`)

- **Severity:** medium
- **Category:** error-handling
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/kafka/src/consumer.ts:43-55`
- **Symbol:** `subscribe` -> `eachMessage`

**Root cause:** The try/catch around the handler catches every error and logs `console.log("Error processing message", error)`. That means (a) errors are at-most-once and silently dropped (same class as EMAIL-001 but for every other consumer in the codebase), and (b) the log uses INFO level (`console.log`), making it invisible to most log filters expecting `ERROR`.
**Impact:** Every consumer built on top of this helper will silently lose poison messages and the failures will be buried in INFO logs. There is no DLQ.
**Fix plan:** Re-throw to let KafkaJS handle retry+backoff; add an opt-in DLQ producer; switch to `console.error`.

---

## KAFKA-004 — Three-broker localhost default (`9094/9095/9096`) does not match the single-broker dev compose (`localhost:9092`)

- **Severity:** medium
- **Category:** messaging
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/kafka/src/client.ts:4-8`
- **Symbol:** `KAFKA_BROKERS` default

**Root cause:** If `KAFKA_BROKERS` is unset, the client defaults to `["localhost:9094","localhost:9095","localhost:9096"]`. The root `docker-compose.yml` (line 45) exposes Kafka as `kafka:9092` and dev typically forwards `9092`. There is no broker on `9094/9095/9096` in any of the compose files. A developer who forgets to set `KAFKA_BROKERS` will see KafkaJS retry forever against nonexistent brokers, then drop into KAFKA-002's "log-only" state, with no obvious clue from the defaults that they're wrong.
**Impact:** Confusing local-dev failure mode; production is safe because Docker compose sets `KAFKA_BROKERS=kafka:9092` explicitly.
**Fix plan:** Default to `["localhost:9092"]` (matches the compose), and/or throw if `KAFKA_ENABLED=true` and `KAFKA_BROKERS` is undefined.

---

## KAFKA-005 — `isKafkaEnabled` evaluates `process.env.KAFKA_ENABLED` at module load and is frozen forever

- **Severity:** low
- **Category:** other
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/kafka/src/client.ts:3`
- **Symbol:** `const KAFKA_ENABLED = process.env.KAFKA_ENABLED !== "false";`

**Root cause:** `KAFKA_ENABLED` and `KAFKA_BROKERS` are read once at module import. Test runners that mutate `process.env` between tests (or anything using `--env-file` evaluated late) cannot toggle Kafka per-test. Not a runtime bug per se, but it makes the function name lie — `isKafkaEnabled()` is really `isKafkaEnabledAtModuleLoadTime()`.
**Impact:** Hard to test, hard to flip remotely. Also: a bare `KAFKA_ENABLED=` (empty string) is treated as enabled because `"" !== "false"`.
**Fix plan:** Read env vars inside the function. Treat empty string as disabled, or validate at startup.

---

## KAFKA-006 — No TLS/SASL config surface; brokers assumed plaintext

- **Severity:** low
- **Category:** secret-exposure
- **Verdict:** unclear
- **Confidence:** medium
- **File:** `/Users/cristian/Development/spacefly-ai/packages/kafka/src/client.ts:15-22`

**Root cause:** `new Kafka({...})` is constructed with only `clientId`/`brokers`/`retry`. There is no path for `ssl: true` or `sasl: {...}`. If SpaceFly ever migrates to a hosted Kafka (Confluent Cloud, Aiven), every service will silently fail TLS handshake — or worse, if `KAFKA_BROKERS` points to a public broker, credentials/data would travel plaintext.
**Impact:** Today fine (in-cluster `kafka:9092`). Becomes a blocker for managed Kafka migration.
**Fix plan:** Add optional `KAFKA_SSL`/`KAFKA_SASL_USERNAME`/`KAFKA_SASL_PASSWORD` env wiring with sensible defaults.

---

## TYPES-001 — `Currency` enum is `string` everywhere in domain types instead of the `Currency` union

- **Severity:** medium
- **Category:** type-drift
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/types/src/space.ts:129`, `packages/types/src/booking.ts:50`, `packages/types/src/venue.ts:35` and `:64`
- **Symbol:** `Space.currency`, `Booking.currency`, `Venue.currency`, `VenueSpaceSummary.currency`

**Root cause:** Prisma defines `currency Currency` (enum `USD | EUR | MDL`, with `@default(USD)`) on `Space`, `Booking`, `Venue`. The TS types declare these fields as `string`, even though `Currency` is exported by the same package (`./currency`). Consumers can therefore assign any string ("usd", "GBP", "₿") and TypeScript will accept it. Conversely, anywhere code expects a `Currency` and is handed a `string` from the API, type narrowing breaks. This also defeats `CURRENCY_SYMBOLS[currency]` lookups that assume the value is one of the three known keys.
**Impact:** Runtime KeyError-class bugs (`CURRENCY_SYMBOLS[someStr] === undefined`), broken display of currency symbols, broken price math if a non-supported currency leaks in.
**Fix plan:** Change all three fields to `currency: Currency` (already exported from `./currency`).

---

## TYPES-002 — `Booking.exchangeRate` is required in TS but `BookingChartType` ignores any currency context

- **Severity:** low
- **Category:** type-drift
- **Verdict:** real
- **Confidence:** medium
- **File:** `/Users/cristian/Development/spacefly-ai/packages/types/src/booking.ts:51, 76-81`

**Root cause:** `Booking.exchangeRate: number` matches Prisma's `Float @default(1.0)` — OK. But `BookingChartType` carries `total/confirmed/revenue` without any indication of currency or exchange-rate normalization. Aggregating bookings whose `currency` differs and summing `totalAmount` raw will produce nonsense revenue numbers in charts.
**Impact:** Host/admin dashboards may display incorrect revenue when multi-currency bookings are mixed.
**Fix plan:** Either require all chart inputs to be USD-normalized (multiply by `exchangeRate` server-side before aggregating) or attach a `currency` field to `BookingChartType` and require single-currency queries.

---

## TYPES-003 — `Payout.amount/platformFee/netAmount` are `Int` in Prisma but typed as `number; // In dollars`

- **Severity:** medium
- **Category:** type-drift
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/types/src/payout.ts:8-10` vs `/Users/cristian/Development/spacefly-ai/packages/db/prisma/schema.prisma:401-404`

**Root cause:** Booking pricing is `Float` (dollars) in Prisma. `Payout.amount`/`platformFee`/`netAmount` are `Int`. The TS comment says "In dollars" — but `Int` means storing $49.99 would either fail Prisma validation or get truncated to 49. Inconsistent with `Booking.totalAmount: Float`. Either the units are cents (and the comment is wrong) or the schema needs to become `Float`. The mismatch will manifest when payouts start being computed from fractional booking totals.
**Impact:** Loss-of-precision (silent truncation if `Math.floor` happens at the boundary) or runtime Prisma errors (if `49.99` is passed to a `Int` column). Either way, host earnings will not match displayed booking totals.
**Fix plan:** Decide on the unit (recommend keeping `Float` to match Booking) and update both the schema and the type comment.

---

## TYPES-004 — `BookingStatus` includes `APPROVED` but no code path ever sets this status (dead enum value)

- **Severity:** low
- **Category:** type-drift
- **Verdict:** real
- **Confidence:** high
- **File:** `/Users/cristian/Development/spacefly-ai/packages/types/src/booking.ts:20-27`, `packages/db/prisma/schema.prisma:35-43`

**Root cause:** Both the Prisma enum and the TS union list `APPROVED` and `CONFIRMED`. The approve handler in `apps/order-service/src/routes/booking.ts:559-565` skips `APPROVED` entirely and goes straight `PENDING -> CONFIRMED`, but still emits a Kafka event named `booking.approved`. Any exhaustive `switch (status)` consumer will write dead code branches, and developers will reasonably assume "APPROVED is a thing" and write filters that always return empty.
**Impact:** Confusing dual semantics. Filtering by `APPROVED` returns nothing. UI authors may build state machines on a status that never appears.
**Fix plan:** Either remove `APPROVED` from the enum + Prisma schema (and rename the topic to `booking.confirmed`) or change the approve handler to set `APPROVED` first with a separate confirmation step. Pick one and align both ends.

---

## Summary

- **Files reviewed:** 17
- **Severity counts:**
  - email-service (EMAIL-001..008): 2 high, 3 medium, 3 low
  - kafka (KAFKA-001..006): 2 high, 2 medium, 2 low
  - types (TYPES-001..004): 0 high, 2 medium, 2 low
- **Top 3 most impactful bugs:**
  1. **KAFKA-001 / KAFKA-002** — `producer.send` is fire-and-forget at every call site, and producer-connect failure is permanent and silent. A brief Kafka outage during startup downgrades the entire fleet to "writes-to-DB, never-emits-events" with only log noise; bookings get persisted but no email/event is ever produced.
  2. **EMAIL-001** — Failed Resend calls are swallowed inside `eachMessage`, so Kafka commits the offset and the booking confirmation is permanently lost. At-most-once delivery in a system that needs at-least-once.
  3. **TYPES-001** — `Space.currency`, `Booking.currency`, `Venue.currency` are typed as `string` even though Prisma's `Currency` enum is exported from the same package; this lets non-supported currency codes leak through the type system and breaks `CURRENCY_SYMBOLS[...]` lookups at runtime.
