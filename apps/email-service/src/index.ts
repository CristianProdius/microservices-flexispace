import { createKafkaClient, isKafkaEnabled } from "@repo/kafka";
import { createServer } from "node:http";
import sendMail from "./utils/mailer.js";

const PORT = Number(process.env.PORT || 8004);
const SERVICE_NAME = "email-service";

const kafka = createKafkaClient("email-service");
const consumer = kafka.consumer({ groupId: "email-service" });

let ready = false;
let consumerConnected = false;
let readinessDetails = ["startup has not completed"];

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
    // TYPES-004: renamed from `booking.approved` to match the actual booking
    // state transition (the approve handler sets status to CONFIRMED).
    topicName: "booking.confirmed",
    topicHandler: async (message: EmailEventMessage) => {
      const { guestEmail, guestName, spaceName } = message.value || {};

      if (guestEmail) {
        await sendMail({
          email: guestEmail,
          subject: "Your Spacefly.ai booking was confirmed",
          text: `Hello${guestName ? ` ${guestName}` : ""}. Your booking${spaceName ? ` for ${spaceName}` : ""} has been confirmed.`,
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
      eachMessage: async ({ topic, message }) => {
        const subscription = subscriptions.find((candidate) => candidate.topicName === topic);
        const value = message.value?.toString();

        if (!subscription || !value) {
          return;
        }

        try {
          const parsed = JSON.parse(value);
          await subscription.topicHandler(parsed && typeof parsed === "object" ? parsed : {});
        } catch (error) {
          console.error(`Error processing ${topic} email event:`, error);
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
