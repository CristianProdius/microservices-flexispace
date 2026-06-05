import { createKafkaClient, isKafkaEnabled } from "@repo/kafka";
import {
  BookingApprovedEventSchema,
  BookingCancelledEventSchema,
  BookingCompletedEventSchema,
  BookingCreatedEventSchema,
  BookingRejectedEventSchema,
  UserBecameHostEventSchema,
  UserCreatedEventSchema,
  type BookingApprovedEvent,
  type BookingCancelledEvent,
  type BookingCompletedEvent,
  type BookingCreatedEvent,
  type BookingRejectedEvent,
  type UserBecameHostEvent,
  type UserCreatedEvent,
} from "@repo/types";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import sendMail from "./utils/mailer.js";
import { validateFromEmail } from "./utils/mailer.js";

// Minimal structural type for the bits of a Zod schema we use. Avoids
// pulling `zod` into the email-service's direct dependencies just for a
// type import — the schemas themselves come from `@repo/types`.
type ParseableSchema<T> = {
  safeParse: (value: unknown) =>
    | { success: true; data: T }
    | { success: false; error: { issues: unknown } };
};

const PORT = Number(process.env.PORT || 8004);
const SERVICE_NAME = "email-service";

const kafka = createKafkaClient("email-service");
const consumer = kafka.consumer({ groupId: "email-service" });

let ready = false;
let consumerConnected = false;
let readinessDetails = ["startup has not completed"];

const getEmailConfigErrors = () => {
  const errors: string[] = [];

  if (!process.env.RESEND_API_KEY) {
    errors.push("RESEND_API_KEY is not configured");
  }

  try {
    validateFromEmail(process.env.RESEND_FROM_EMAIL);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "RESEND_FROM_EMAIL is invalid");
  }

  return errors;
};

const formatCurrency = (amountInDollars: number | undefined) =>
  typeof amountInDollars === "number" ? `$${amountInDollars.toFixed(2)}` : undefined;

// Resend collapses duplicate sends per (idempotencyKey, recipient, subject)
// within its dedup window. We derive the key from the Kafka coordinates so
// re-delivery after a crash or rebalance does not send the same email twice.
const buildIdempotencyKey = (
  topic: string,
  partition: number,
  offset: string,
  recipient: string
) =>
  createHash("sha256")
    .update(`${topic}|${partition}|${offset}|${recipient}`)
    .digest("hex")
    .slice(0, 32);

type Subscription<T> = {
  topicName: string;
  schema: ParseableSchema<T>;
  handler: (
    event: T,
    ctx: { topic: string; partition: number; offset: string }
  ) => Promise<void>;
};

const userCreatedSubscription: Subscription<UserCreatedEvent> = {
  topicName: "user.created",
  schema: UserCreatedEventSchema,
  handler: async ({ value: { email, username } }, ctx) => {
    await sendMail({
      email,
      subject: "Welcome to Spacefly.ai",
      text: `Welcome ${username}. Your Spacefly.ai account has been created!`,
      idempotencyKey: buildIdempotencyKey(ctx.topic, ctx.partition, ctx.offset, email),
    });
  },
};

const userBecameHostSubscription: Subscription<UserBecameHostEvent> = {
  topicName: "user.became-host",
  schema: UserBecameHostEventSchema,
  handler: async ({ value: { email, name } }, ctx) => {
    await sendMail({
      email,
      subject: "You're now a Spacefly.ai host",
      text: `Welcome to the host community${name ? `, ${name}` : ""}. You can now list spaces and accept bookings on Spacefly.ai.`,
      idempotencyKey: buildIdempotencyKey(ctx.topic, ctx.partition, ctx.offset, email),
    });
  },
};

const bookingCreatedSubscription: Subscription<BookingCreatedEvent> = {
  topicName: "booking.created",
  schema: BookingCreatedEventSchema,
  handler: async ({ value: { guestEmail, hostEmail, spaceName, status } }, ctx) => {
    if (guestEmail) {
      await sendMail({
        email: guestEmail,
        subject: "Your Spacefly.ai booking request was created",
        text: `Your booking request${spaceName ? ` for ${spaceName}` : ""} has been created${status ? ` and is currently ${status.toLowerCase()}` : ""}.`,
        idempotencyKey: buildIdempotencyKey(ctx.topic, ctx.partition, ctx.offset, guestEmail),
      });
    }

    if (hostEmail) {
      await sendMail({
        email: hostEmail,
        subject: "New Spacefly.ai booking request",
        text: `You have a new booking request${spaceName ? ` for ${spaceName}` : ""}.`,
        idempotencyKey: buildIdempotencyKey(ctx.topic, ctx.partition, ctx.offset, hostEmail),
      });
    }
  },
};

const bookingApprovedSubscription: Subscription<BookingApprovedEvent> = {
  topicName: "booking.approved",
  schema: BookingApprovedEventSchema,
  handler: async ({ value: { guestEmail, guestName, spaceName } }, ctx) => {
    await sendMail({
      email: guestEmail,
      subject: "Your Spacefly.ai booking was approved",
      text: `Hello${guestName ? ` ${guestName}` : ""}. Your booking${spaceName ? ` for ${spaceName}` : ""} has been approved.`,
      idempotencyKey: buildIdempotencyKey(ctx.topic, ctx.partition, ctx.offset, guestEmail),
    });
  },
};

const bookingRejectedSubscription: Subscription<BookingRejectedEvent> = {
  topicName: "booking.rejected",
  schema: BookingRejectedEventSchema,
  handler: async ({ value: { guestEmail, spaceName, reason } }, ctx) => {
    await sendMail({
      email: guestEmail,
      subject: "Your Spacefly.ai booking was declined",
      text: `Your booking request${spaceName ? ` for ${spaceName}` : ""} was declined.${reason ? ` Reason: ${reason}` : ""}`,
      idempotencyKey: buildIdempotencyKey(ctx.topic, ctx.partition, ctx.offset, guestEmail),
    });
  },
};

const bookingCancelledSubscription: Subscription<BookingCancelledEvent> = {
  topicName: "booking.cancelled",
  schema: BookingCancelledEventSchema,
  handler: async ({ value: { guestEmail, hostEmail, spaceName, cancelledBy } }, ctx) => {
    const text = `A Spacefly.ai booking${spaceName ? ` for ${spaceName}` : ""} was cancelled${cancelledBy ? ` by ${cancelledBy.toLowerCase()}` : ""}.`;

    if (guestEmail) {
      await sendMail({
        email: guestEmail,
        subject: "Your Spacefly.ai booking was cancelled",
        text,
        idempotencyKey: buildIdempotencyKey(ctx.topic, ctx.partition, ctx.offset, guestEmail),
      });
    }

    if (hostEmail) {
      await sendMail({
        email: hostEmail,
        subject: "A Spacefly.ai booking was cancelled",
        text,
        idempotencyKey: buildIdempotencyKey(ctx.topic, ctx.partition, ctx.offset, hostEmail),
      });
    }
  },
};

const bookingCompletedSubscription: Subscription<BookingCompletedEvent> = {
  topicName: "booking.completed",
  schema: BookingCompletedEventSchema,
  handler: async ({ value: { guestEmail, spaceName, totalAmount } }, ctx) => {
    const formattedTotal = formatCurrency(totalAmount);

    await sendMail({
      email: guestEmail,
      subject: "Your Spacefly.ai booking is complete",
      text: `Your booking${spaceName ? ` for ${spaceName}` : ""} is complete.${formattedTotal ? ` Total: ${formattedTotal}.` : ""}`,
      idempotencyKey: buildIdempotencyKey(ctx.topic, ctx.partition, ctx.offset, guestEmail),
    });
  },
};

// `unknown` to keep the heterogeneous handler signatures in a single
// dispatch table without losing per-subscription type safety above.
const subscriptions: Subscription<unknown>[] = [
  userCreatedSubscription as unknown as Subscription<unknown>,
  userBecameHostSubscription as unknown as Subscription<unknown>,
  bookingCreatedSubscription as unknown as Subscription<unknown>,
  bookingApprovedSubscription as unknown as Subscription<unknown>,
  bookingRejectedSubscription as unknown as Subscription<unknown>,
  bookingCancelledSubscription as unknown as Subscription<unknown>,
  bookingCompletedSubscription as unknown as Subscription<unknown>,
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

    await consumer.connect();
    consumerConnected = true;
    await consumer.subscribe({
      topics: subscriptions.map((subscription) => subscription.topicName),
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const subscription = subscriptions.find((candidate) => candidate.topicName === topic);
        const value = message.value?.toString();

        if (!subscription || !value) {
          return;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(value);
        } catch (error) {
          console.error(
            `[email-service] Dropping malformed JSON on ${topic}@${partition}:${message.offset}:`,
            error
          );
          return;
        }

        const result = subscription.schema.safeParse(parsed);
        if (!result.success) {
          console.error(
            `[email-service] Dropping ${topic}@${partition}:${message.offset} that failed schema validation:`,
            result.error.issues
          );
          return;
        }

        try {
          await subscription.handler(result.data, {
            topic,
            partition,
            offset: message.offset,
          });
        } catch (error) {
          console.error(
            `[email-service] Handler for ${topic}@${partition}:${message.offset} failed:`,
            error
          );
          throw error;
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
  console.log(`${signal} received. Shutting down email service...`);

  server.close(async (error) => {
    if (error) {
      console.error("Error closing email service health server:", error);
      process.exit(1);
    }

    try {
      if (consumerConnected) {
        await consumer.disconnect();
      }
      process.exit(0);
    } catch (disconnectError) {
      console.error("Error disconnecting email service Kafka consumer:", disconnectError);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
