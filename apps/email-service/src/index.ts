import { createKafkaClient, isKafkaEnabled } from "@repo/kafka";
import type { Producer } from "kafkajs";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import sendMail from "./utils/mailer.js";

const PORT = Number(process.env.PORT || 8004);
const SERVICE_NAME = "email-service";

// Dead-letter topic for messages that could not be delivered after MAX_RETRIES
// (transient failures) or that failed to parse as JSON (poison messages).
// Convention: "<source-topic>" producers stay on their own topics; consumers
// route to a single shared DLQ. Replay tooling can inspect headers
// (x-source-topic, x-error, x-retry-count) to triage.
const DLQ_TOPIC = "email.dlq";
const MAX_RETRIES = 5;

const kafka = createKafkaClient("email-service");

// NOTE: We intentionally bypass @repo/kafka's createConsumer helper here. The
// helper subscribes + runs in one step and swallows handler errors, which is
// exactly the EMAIL-001 bug we are fixing. We need to: (a) re-throw transient
// errors so kafkajs retries the partition, (b) track per-message attempts and
// route to a DLQ, and (c) coordinate shutdown with a DLQ producer. We do mirror
// the shared helper's `fromBeginning: true` policy so the two stay aligned.
const consumer = kafka.consumer({
  groupId: "email-service",
  // kafkajs retries the eachMessage handler with exponential backoff when it
  // throws. After `retries` attempts the partition is paused and the consumer
  // crashes (restartOnFailure decides recovery). We handle DLQ routing before
  // we exhaust this budget via the attempt-tracking map below.
  retry: {
    retries: MAX_RETRIES,
    initialRetryTime: 1000,
  },
});

let dlqProducer: Producer | null = null;
let dlqProducerConnected = false;

let ready = false;
let consumerConnected = false;
let readinessDetails = ["startup has not completed"];

// AUD-EMAIL-READY: backoff schedule for Kafka setup retries. The previous
// implementation gave up after the first transient `UNKNOWN_TOPIC_OR_PARTITION`
// at boot, parking the service in a permanent "not_ready" state until an
// operator restarted it. We now retry indefinitely (until shutdown) so the
// service recovers on its own once Kafka stabilises.
const KAFKA_BACKOFF_SEQUENCE_MS = [1_000, 2_000, 5_000, 10_000, 30_000];
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

let shuttingDown = false;
// Guard against piling up multiple recovery loops if CRASH fires repeatedly.
let consumerRecoveryPromise: Promise<void> | null = null;

// In-memory attempt counter keyed by `topic:partition:offset`. Kafka message
// headers are immutable from the consumer, so we cannot rewrite an attempt
// count onto the original record; an in-process map is sufficient because
// kafkajs redelivers in-process on throw. On rebalance the new owner restarts
// the count from zero, which is the correct semantic (someone else gets a
// fresh shot) and is bounded by MAX_RETRIES per consumer instance.
//
// AUD-023: a rebalance-induced redelivery from a different partition owner
// CAN still cause `sendMail` to be invoked a second time. The durable safeguard
// against that double-send is the deterministic `idempotencyKey` we pass to
// `sendMail` (AUD-013) — Resend dedupes on that key for 24h, so a rebalance
// race window is bounded to the same logical email and won't produce two
// deliveries to the recipient.
const attemptCounts = new Map<string, number>();
const attemptKey = (topic: string, partition: number, offset: string) =>
  `${topic}:${partition}:${offset}`;

// AUD-003: link-base envs are required for verification + password reset
// templates. If either is missing the service refuses readiness rather than
// silently falling back to `http://localhost:3002/...`, which would produce
// emails that point at a non-existent endpoint in prod.
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

type EmailEventMessage = {
  value?: {
    email?: string;
    username?: string;
    bookingId?: string;
    guestEmail?: string;
    hostEmail?: string;
    guestName?: string | null;
    spaceName?: string;
    status?: string;
    reason?: string;
    cancelledByRole?: string;
    totalAmount?: number;
    token?: string;
    userId?: string;
    name?: string | null;
    expiresInMinutes?: number;
  };
};

class MissingEmailConfigError extends Error {
  constructor(envVar: string) {
    super(`${envVar} is not configured`);
    this.name = "MissingEmailConfigError";
  }
}

// AUD-003: throw if the env is missing — getEmailConfigErrors already prevents
// the service from going ready without these, so this should never fire at
// runtime. The throw is belt-and-suspenders for handler-time misuse and gives
// us a typed signal we can introspect in tests.
const verificationLinkFor = (token: string): string => {
  const base = process.env.EMAIL_VERIFICATION_LINK_BASE;
  if (!base) {
    throw new MissingEmailConfigError("EMAIL_VERIFICATION_LINK_BASE");
  }
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}token=${encodeURIComponent(token)}`;
};

// AUD-001: password-reset link builder follows the same shape as the
// verification link. Producer (auth-service) sends a JWT in `token`; we
// append it as a query param onto the configured base URL.
const passwordResetLinkFor = (token: string): string => {
  const base = process.env.PASSWORD_RESET_LINK_BASE;
  if (!base) {
    throw new MissingEmailConfigError("PASSWORD_RESET_LINK_BASE");
  }
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}token=${encodeURIComponent(token)}`;
};

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

// AUD-013: produce a short, deterministic token hash for idempotency keys so
// we can dedupe per-token without leaking the raw bearer token into Resend
// logs or our own observability stack.
const shortHash = (input: string): string =>
  createHash("sha256").update(input).digest("hex").slice(0, 16);

const formatCurrency = (amountInDollars: number | undefined) =>
  typeof amountInDollars === "number" ? `$${amountInDollars.toFixed(2)}` : undefined;

const subscriptions = [
  {
    topicName: "user.created",
    topicHandler: async (message: EmailEventMessage) => {
      const { email, username, userId } = message.value || {};

      if (email) {
        // AUD-013: dedupe welcome emails on userId (preferred) or email so a
        // consumer-group rebalance can't double-send.
        const idKey = `welcome:${userId ?? email}`;
        await sendMail({
          email,
          subject: "Welcome to Spacefly.ai",
          text: `Welcome ${username}. Your Spacefly.ai account has been created!`,
          idempotencyKey: idKey,
        });
      }
    },
  },
  {
    topicName: "user.email-verification-requested",
    topicHandler: async (message: EmailEventMessage) => {
      const { email, name, username, token, userId } = message.value || {};
      if (!email || !token) return;

      const link = verificationLinkFor(token);
      const greeting = name || username || "there";
      // AUD-013: hash the token so it doesn't appear in idempotency keys /
      // logs. If a new verification is requested, the token (and thus hash)
      // changes, which is correct — we want a fresh email per token.
      const idKey = `email-verification:${userId ?? email}:${shortHash(token)}`;
      await sendMail({
        email,
        subject: "Verify your Spacefly.ai email address",
        text: `Hi ${greeting},\n\nPlease verify your email address by visiting the following link (valid for 24 hours):\n\n${link}\n\nIf you did not create a Spacefly.ai account you can safely ignore this message.`,
        idempotencyKey: idKey,
      });
    },
  },
  {
    // AUD-001: subscribe to password reset events emitted by auth-service's
    // POST /auth/forgot-password handler. Mirrors the verification email
    // shape and uses PASSWORD_RESET_LINK_BASE for the click-through.
    topicName: "user.password-reset-requested",
    topicHandler: async (message: EmailEventMessage) => {
      const { email, username, token, userId, expiresInMinutes } = message.value || {};
      if (!email || !token) return;

      const link = passwordResetLinkFor(token);
      const greeting = username || "there";
      const expiresCopy =
        typeof expiresInMinutes === "number" && Number.isFinite(expiresInMinutes)
          ? `valid for ${expiresInMinutes} minutes`
          : "valid for a limited time";
      // AUD-013: hash the token in the idempotency key so the raw bearer
      // token never reaches Resend's idempotency store or our logs.
      const idKey = `password-reset:${userId ?? email}:${shortHash(token)}`;
      await sendMail({
        email,
        subject: "Reset your Spacefly.ai password",
        text: `Hi ${greeting},\n\nWe received a request to reset your Spacefly.ai password. Use the link below to choose a new one (${expiresCopy}):\n\n${link}\n\nIf you did not request a password reset you can safely ignore this message — your password will remain unchanged.`,
        idempotencyKey: idKey,
      });
    },
  },
  {
    topicName: "booking.created",
    topicHandler: async (message: EmailEventMessage) => {
      const { guestEmail, hostEmail, spaceName, status, bookingId } = message.value || {};

      // AUD-013: dedupe per-booking so a redelivery doesn't double-send to
      // either party. We send the guest and host emails under distinct keys
      // because Resend dedupes per `idempotencyKey`, and they're distinct
      // logical messages.
      if (guestEmail) {
        await sendMail({
          email: guestEmail,
          subject: "Your Spacefly.ai booking request was created",
          text: `Your booking request${spaceName ? ` for ${spaceName}` : ""} has been created${status ? ` and is currently ${status.toLowerCase()}` : ""}.`,
          idempotencyKey: bookingId ? `booking-created:guest:${bookingId}` : undefined,
        });
      }

      if (hostEmail) {
        await sendMail({
          email: hostEmail,
          subject: "New Spacefly.ai booking request",
          text: `You have a new booking request${spaceName ? ` for ${spaceName}` : ""}.`,
          idempotencyKey: bookingId ? `booking-created:host:${bookingId}` : undefined,
        });
      }
    },
  },
  {
    // TYPES-004: renamed from `booking.approved` to match the actual booking
    // state transition (the approve handler sets status to CONFIRMED).
    topicName: "booking.confirmed",
    topicHandler: async (message: EmailEventMessage) => {
      const { guestEmail, guestName, spaceName, bookingId } = message.value || {};

      if (guestEmail) {
        await sendMail({
          email: guestEmail,
          subject: "Your Spacefly.ai booking was confirmed",
          text: `Hello${guestName ? ` ${guestName}` : ""}. Your booking${spaceName ? ` for ${spaceName}` : ""} has been confirmed.`,
          // AUD-013: one key per (status, bookingId) so a later
          // cancelled/completed transition still sends its own email.
          idempotencyKey: bookingId ? `booking-confirmed:${bookingId}` : undefined,
        });
      }
    },
  },
  {
    topicName: "booking.rejected",
    topicHandler: async (message: EmailEventMessage) => {
      const { guestEmail, spaceName, reason, bookingId } = message.value || {};

      if (guestEmail) {
        await sendMail({
          email: guestEmail,
          subject: "Your Spacefly.ai booking was declined",
          text: `Your booking request${spaceName ? ` for ${spaceName}` : ""} was declined.${reason ? ` Reason: ${reason}` : ""}`,
          idempotencyKey: bookingId ? `booking-rejected:${bookingId}` : undefined,
        });
      }
    },
  },
  {
    topicName: "booking.cancelled",
    topicHandler: async (message: EmailEventMessage) => {
      const { guestEmail, hostEmail, spaceName, cancelledByRole, bookingId } = message.value || {};
      const text = `A Spacefly.ai booking${spaceName ? ` for ${spaceName}` : ""} was cancelled${cancelledByRole ? ` by ${cancelledByRole.toLowerCase()}` : ""}.`;

      if (guestEmail) {
        await sendMail({
          email: guestEmail,
          subject: "Your Spacefly.ai booking was cancelled",
          text,
          idempotencyKey: bookingId ? `booking-cancelled:guest:${bookingId}` : undefined,
        });
      }

      if (hostEmail) {
        await sendMail({
          email: hostEmail,
          subject: "A Spacefly.ai booking was cancelled",
          text,
          idempotencyKey: bookingId ? `booking-cancelled:host:${bookingId}` : undefined,
        });
      }
    },
  },
  {
    topicName: "booking.completed",
    topicHandler: async (message: EmailEventMessage) => {
      const { guestEmail, spaceName, totalAmount, bookingId } = message.value || {};
      const formattedTotal = formatCurrency(totalAmount);

      if (guestEmail) {
        await sendMail({
          email: guestEmail,
          subject: "Your Spacefly.ai booking is complete",
          text: `Your booking${spaceName ? ` for ${spaceName}` : ""} is complete.${formattedTotal ? ` Total: ${formattedTotal}.` : ""}`,
          idempotencyKey: bookingId ? `booking-completed:${bookingId}` : undefined,
        });
      }
    },
  },
];

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(ready ? 200 : 503, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        status: ready ? "ok" : "not_ready",
        service: SERVICE_NAME,
        ready,
        details: readinessDetails,
        uptime: process.uptime(),
        timestamp: Date.now(),
      })
    );
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ message: "Not Found" }));
});

// Best-effort publish to the DLQ. On failure we LOG LOUDLY and re-throw so the
// consumer retries the original message (kafkajs will re-invoke eachMessage);
// silently swallowing the swallow would re-introduce EMAIL-001. The original
// payload is preserved verbatim (Buffer) so downstream tooling can replay.
const publishToDlq = async (params: {
  sourceTopic: string;
  partition: number;
  offset: string;
  originalValue: Buffer | null;
  originalHeaders: Record<string, Buffer | string | (Buffer | string)[] | undefined> | undefined;
  attempts: number;
  reason: "parse_error" | "max_retries_exceeded";
  error: unknown;
}) => {
  const errorMessage = params.error instanceof Error ? params.error.message : String(params.error);

  if (!dlqProducer || !dlqProducerConnected) {
    console.error(
      `[email-service] DLQ producer unavailable; cannot park message from ${params.sourceTopic} (${params.reason}). Re-throwing so kafkajs retries.`,
      { partition: params.partition, offset: params.offset, error: errorMessage }
    );
    throw new Error(`DLQ producer unavailable while parking message: ${errorMessage}`);
  }

  try {
    await dlqProducer.send({
      topic: DLQ_TOPIC,
      messages: [
        {
          value: params.originalValue,
          headers: {
            ...(params.originalHeaders ?? {}),
            "x-source-topic": params.sourceTopic,
            "x-source-partition": String(params.partition),
            "x-source-offset": params.offset,
            "x-retry-count": String(params.attempts),
            "x-dlq-reason": params.reason,
            "x-error": errorMessage,
            "x-failed-at": new Date().toISOString(),
          },
        },
      ],
    });
    console.warn(
      `[email-service] Parked message to ${DLQ_TOPIC}`,
      {
        sourceTopic: params.sourceTopic,
        partition: params.partition,
        offset: params.offset,
        reason: params.reason,
        attempts: params.attempts,
        error: errorMessage,
      }
    );
  } catch (dlqError) {
    console.error(
      `[email-service] DLQ publish FAILED for ${params.sourceTopic}; re-throwing so kafkajs retries the original message.`,
      { partition: params.partition, offset: params.offset, dlqError, originalError: errorMessage }
    );
    throw dlqError;
  }
};

// Retry a setup step with exponential backoff. Returns when the step succeeds
// OR when `shuttingDown` flips to true (in which case we just resolve quietly
// and let the shutdown path tear things down).
const withBackoffUntilReady = async (
  label: string,
  step: () => Promise<void>,
): Promise<void> => {
  for (let attempt = 0; !shuttingDown; attempt++) {
    try {
      await step();
      return;
    } catch (err) {
      const backoff =
        KAFKA_BACKOFF_SEQUENCE_MS[
          Math.min(attempt, KAFKA_BACKOFF_SEQUENCE_MS.length - 1)
        ]!;
      const msg = err instanceof Error ? err.message : String(err);
      // Update readiness so /health reflects the current obstacle, not a
      // stale snapshot from the first failure.
      ready = false;
      readinessDetails = [`${label} failed: ${msg}`];
      console.warn(
        `[email-service] ${label} attempt ${attempt + 1} failed: ${msg}; retrying in ${backoff}ms`,
      );
      await sleep(backoff);
    }
  }
};

const buildEachMessageHandler =
  () => async ({ topic, partition, message }: { topic: string; partition: number; message: { value: Buffer | null; offset: string; headers?: Record<string, Buffer | string | (Buffer | string)[] | undefined> } }) => {
    const subscription = subscriptions.find((candidate) => candidate.topicName === topic);
    const rawValue = message.value;
    const value = rawValue?.toString();

    if (!subscription || !value) {
      return;
    }

    // EMAIL-001/002: parse errors are poison messages — they will never
    // succeed on retry, so park them in the DLQ immediately and commit.
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch (parseError) {
      await publishToDlq({
        sourceTopic: topic,
        partition,
        offset: message.offset,
        originalValue: rawValue ?? null,
        originalHeaders: message.headers,
        attempts: 0,
        reason: "parse_error",
        error: parseError,
      });
      return;
    }

    const key = attemptKey(topic, partition, message.offset);
    const attempts = (attemptCounts.get(key) ?? 0) + 1;
    attemptCounts.set(key, attempts);

    try {
      await subscription.topicHandler(
        parsed && typeof parsed === "object" ? (parsed as EmailEventMessage) : {},
      );
      attemptCounts.delete(key);
    } catch (handlerError) {
      if (attempts >= MAX_RETRIES) {
        try {
          await publishToDlq({
            sourceTopic: topic,
            partition,
            offset: message.offset,
            originalValue: rawValue ?? null,
            originalHeaders: message.headers,
            attempts,
            reason: "max_retries_exceeded",
            error: handlerError,
          });
          attemptCounts.delete(key);
          return;
        } catch (dlqError) {
          console.error(
            `[email-service] Could not park ${topic} message in DLQ; will retry handler. dlqError:`,
            dlqError,
          );
          throw handlerError;
        }
      }

      console.warn(
        `[email-service] Handler failed for ${topic} (attempt ${attempts}/${MAX_RETRIES}); re-throwing for retry.`,
        handlerError instanceof Error ? handlerError.message : handlerError,
      );
      throw handlerError;
    }
  };

// Connect + subscribe + run the consumer, retrying until success (or shutdown).
// Safe to call again after a CRASH: disconnects any stale state first.
const setupConsumer = async (): Promise<void> => {
  await withBackoffUntilReady("Kafka consumer setup", async () => {
    if (consumerConnected) {
      try {
        await consumer.disconnect();
      } catch {
        // Ignore — we're about to reconnect.
      }
      consumerConnected = false;
    }
    await consumer.connect();
    consumerConnected = true;
    await consumer.subscribe({
      topics: subscriptions.map((subscription) => subscription.topicName),
      // Match @repo/kafka createConsumer's default. New consumer groups start
      // at the earliest offset so we don't lose pre-existing booking events
      // during a cold deploy. For an already-committed group this is a no-op.
      fromBeginning: true,
    });
    await consumer.run({ eachMessage: buildEachMessageHandler() });

    ready = true;
    readinessDetails = [];
    console.log("Email service is ready");
  });
};

// AUD-EMAIL-READY: keep `ready`/`readinessDetails` in sync with kafkajs runtime
// events instead of caching the first error forever. CRASH triggers a recovery
// loop; CONNECT/DISCONNECT keep the readiness flag honest.
consumer.on(consumer.events.DISCONNECT, () => {
  if (shuttingDown) return;
  ready = false;
  readinessDetails = ["Kafka consumer disconnected (kafkajs will attempt to reconnect)"];
  console.warn("[email-service] Consumer disconnected");
});

consumer.on(consumer.events.CRASH, ({ payload }) => {
  if (shuttingDown) return;
  ready = false;
  const msg = payload?.error instanceof Error ? payload.error.message : "consumer crashed";
  readinessDetails = [`Kafka consumer crashed: ${msg}`];
  console.error("[email-service] Consumer crashed; attempting recovery:", msg);
  if (consumerRecoveryPromise) return;
  consumerRecoveryPromise = setupConsumer()
    .catch((err) => {
      console.error("[email-service] Consumer recovery loop exited:", err);
    })
    .finally(() => {
      consumerRecoveryPromise = null;
    });
});

const start = async () => {
  try {
    server.listen(PORT, () => {
      console.log(`Email service health server is running on port ${PORT}`);
    });

    const emailConfigErrors = getEmailConfigErrors();
    if (emailConfigErrors.length > 0) {
      readinessDetails = emailConfigErrors;
      console.error(`Email service is not ready: ${emailConfigErrors.join("; ")}`);
      return;
    }

    if (!isKafkaEnabled()) {
      ready = true;
      readinessDetails = [];
      console.log("Email service is ready with Kafka disabled");
      return;
    }

    // Spin up a dedicated DLQ producer. We construct via kafkajs directly
    // (not @repo/kafka's createProducer) because the shared helper swallows
    // send errors, and we need failures to propagate so we can re-throw.
    await withBackoffUntilReady("DLQ producer connect", async () => {
      const producer = kafka.producer();
      await producer.connect();
      dlqProducer = producer;
      dlqProducerConnected = true;
      console.log("[email-service] DLQ producer connected");
    });

    if (shuttingDown) return;
    await setupConsumer();
  } catch (error) {
    ready = false;
    readinessDetails = [error instanceof Error ? error.message : "Email service startup failed"];
    console.error("Email service is not ready:", error);
  }
};

start();

const shutdown = async (signal: NodeJS.Signals) => {
  // EMAIL-008: flip readiness immediately so /health reports 503 and the
  // orchestrator stops sending traffic / new pods are spun up to take over.
  // AUD-EMAIL-READY: also flip `shuttingDown` so any in-flight setup-retry
  // loop bails out cleanly instead of fighting the disconnect calls below.
  ready = false;
  readinessDetails = ["shutting down"];
  shuttingDown = true;
  console.log(`${signal} received. Shutting down email service...`);

  // If a CRASH-driven recovery loop is currently mid-backoff, wait for it
  // to notice `shuttingDown` and exit before we tear the consumer down so
  // we don't race a reconnect against a disconnect.
  if (consumerRecoveryPromise) {
    try {
      await consumerRecoveryPromise;
    } catch {
      // already logged by the recovery loop's own catch
    }
  }

  // EMAIL-008: drain in dependency order — consumer first (stop pulling new
  // work and let in-flight handlers finish), then DLQ producer (no longer
  // needed once the consumer is quiet), then the HTTP server last (so the
  // readiness probe can keep reporting 503 throughout the drain).
  let exitCode = 0;

  try {
    if (consumerConnected) {
      await consumer.disconnect();
      consumerConnected = false;
    }
  } catch (disconnectError) {
    console.error("Error disconnecting email service Kafka consumer:", disconnectError);
    exitCode = 1;
  }

  try {
    if (dlqProducer && dlqProducerConnected) {
      await dlqProducer.disconnect();
      dlqProducerConnected = false;
    }
  } catch (disconnectError) {
    console.error("Error disconnecting email service DLQ producer:", disconnectError);
    exitCode = 1;
  }

  await new Promise<void>((resolve) => {
    server.close((error) => {
      if (error) {
        console.error("Error closing email service health server:", error);
        exitCode = 1;
      }
      resolve();
    });
  });

  process.exit(exitCode);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
