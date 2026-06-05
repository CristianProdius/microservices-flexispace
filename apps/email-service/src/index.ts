import { createKafkaClient, isKafkaEnabled } from "@repo/kafka";
import type { Producer } from "kafkajs";
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

// In-memory attempt counter keyed by `topic:partition:offset`. Kafka message
// headers are immutable from the consumer, so we cannot rewrite an attempt
// count onto the original record; an in-process map is sufficient because
// kafkajs redelivers in-process on throw. On rebalance the new owner restarts
// the count from zero, which is the correct semantic (someone else gets a
// fresh shot) and is bounded by MAX_RETRIES per consumer instance.
const attemptCounts = new Map<string, number>();
const attemptKey = (topic: string, partition: number, offset: string) =>
  `${topic}:${partition}:${offset}`;

const getEmailConfigErrors = () =>
  [
    process.env.RESEND_API_KEY ? null : "RESEND_API_KEY is not configured",
    process.env.RESEND_FROM_EMAIL ? null : "RESEND_FROM_EMAIL is not configured",
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
    cancelledBy?: string;
    totalAmount?: number;
  };
};

const formatCurrency = (amountInDollars: number | undefined) =>
  typeof amountInDollars === "number" ? `$${amountInDollars.toFixed(2)}` : undefined;

const subscriptions = [
  {
    topicName: "user.created",
    topicHandler: async (message: EmailEventMessage) => {
      const { email, username } = message.value || {};

      if (email) {
        await sendMail({
          email,
          subject: "Welcome to Spacefly.ai",
          text: `Welcome ${username}. Your Spacefly.ai account has been created!`,
        });
      }
    },
  },
  {
    topicName: "booking.created",
    topicHandler: async (message: EmailEventMessage) => {
      const { guestEmail, hostEmail, spaceName, status } = message.value || {};

      if (guestEmail) {
        await sendMail({
          email: guestEmail,
          subject: "Your Spacefly.ai booking request was created",
          text: `Your booking request${spaceName ? ` for ${spaceName}` : ""} has been created${status ? ` and is currently ${status.toLowerCase()}` : ""}.`,
        });
      }

      if (hostEmail) {
        await sendMail({
          email: hostEmail,
          subject: "New Spacefly.ai booking request",
          text: `You have a new booking request${spaceName ? ` for ${spaceName}` : ""}.`,
        });
      }
    },
  },
  {
    topicName: "booking.approved",
    topicHandler: async (message: EmailEventMessage) => {
      const { guestEmail, guestName, spaceName } = message.value || {};

      if (guestEmail) {
        await sendMail({
          email: guestEmail,
          subject: "Your Spacefly.ai booking was approved",
          text: `Hello${guestName ? ` ${guestName}` : ""}. Your booking${spaceName ? ` for ${spaceName}` : ""} has been approved.`,
        });
      }
    },
  },
  {
    topicName: "booking.rejected",
    topicHandler: async (message: EmailEventMessage) => {
      const { guestEmail, spaceName, reason } = message.value || {};

      if (guestEmail) {
        await sendMail({
          email: guestEmail,
          subject: "Your Spacefly.ai booking was declined",
          text: `Your booking request${spaceName ? ` for ${spaceName}` : ""} was declined.${reason ? ` Reason: ${reason}` : ""}`,
        });
      }
    },
  },
  {
    topicName: "booking.cancelled",
    topicHandler: async (message: EmailEventMessage) => {
      const { guestEmail, hostEmail, spaceName, cancelledBy } = message.value || {};
      const text = `A Spacefly.ai booking${spaceName ? ` for ${spaceName}` : ""} was cancelled${cancelledBy ? ` by ${cancelledBy.toLowerCase()}` : ""}.`;

      if (guestEmail) {
        await sendMail({
          email: guestEmail,
          subject: "Your Spacefly.ai booking was cancelled",
          text,
        });
      }

      if (hostEmail) {
        await sendMail({
          email: hostEmail,
          subject: "A Spacefly.ai booking was cancelled",
          text,
        });
      }
    },
  },
  {
    topicName: "booking.completed",
    topicHandler: async (message: EmailEventMessage) => {
      const { guestEmail, spaceName, totalAmount } = message.value || {};
      const formattedTotal = formatCurrency(totalAmount);

      if (guestEmail) {
        await sendMail({
          email: guestEmail,
          subject: "Your Spacefly.ai booking is complete",
          text: `Your booking${spaceName ? ` for ${spaceName}` : ""} is complete.${formattedTotal ? ` Total: ${formattedTotal}.` : ""}`,
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
    dlqProducer = kafka.producer();
    await dlqProducer.connect();
    dlqProducerConnected = true;
    console.log("[email-service] DLQ producer connected");

    await consumer.connect();
    consumerConnected = true;
    await consumer.subscribe({
      topics: subscriptions.map((subscription) => subscription.topicName),
      // Match @repo/kafka createConsumer's default. New consumer groups start
      // at the earliest offset so we don't lose pre-existing booking events
      // during a cold deploy. For an already-committed group this is a no-op.
      fromBeginning: true,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
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
          await subscription.topicHandler(parsed && typeof parsed === "object" ? (parsed as EmailEventMessage) : {});
          // Success: drop the counter to bound memory.
          attemptCounts.delete(key);
        } catch (handlerError) {
          if (attempts >= MAX_RETRIES) {
            // Exhausted retries — park in DLQ and commit the offset by
            // returning normally. If the DLQ publish itself throws, we let
            // the throw propagate so kafkajs retries (rather than silently
            // dropping the message — that would be the EMAIL-001 regression).
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
              // publishToDlq already logged. Re-throw the original handler
              // error so kafkajs retries and we get another shot at the DLQ.
              console.error(
                `[email-service] Could not park ${topic} message in DLQ; will retry handler. dlqError:`,
                dlqError
              );
              throw handlerError;
            }
          }

          // Transient failure with retry budget remaining — re-throw so
          // kafkajs backs off and re-invokes eachMessage on the same offset
          // instead of silently committing (EMAIL-001).
          console.warn(
            `[email-service] Handler failed for ${topic} (attempt ${attempts}/${MAX_RETRIES}); re-throwing for retry.`,
            handlerError instanceof Error ? handlerError.message : handlerError
          );
          throw handlerError;
        }
      },
    });

    ready = true;
    readinessDetails = [];
    console.log("Email service is ready");
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
  ready = false;
  readinessDetails = ["shutting down"];
  console.log(`${signal} received. Shutting down email service...`);

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
