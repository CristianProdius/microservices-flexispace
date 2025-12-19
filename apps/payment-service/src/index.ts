import { serve } from "@hono/node-server";
import { Hono } from "hono";
import sessionRoute from "./routes/session.route.js";
import payoutRoute from "./routes/payout.route.js";
import { cors } from "hono/cors";
import { consumer, producer } from "./utils/kafka.js";
import webhookRoute from "./routes/webhooks.route.js";

const app = new Hono();
app.use(
  "*",
  cors({
    origin: ["http://localhost:3002", "http://localhost:3003"],
    credentials: true,
  })
);

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "payment-service",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

app.route("/sessions", sessionRoute);
app.route("/payouts", payoutRoute);
app.route("/webhooks", webhookRoute);

const start = async () => {
  try {
    await Promise.all([producer.connect(), consumer.connect()]);
    serve(
      {
        fetch: app.fetch,
        port: 8002,
      },
      (info) => {
        console.log(`Payment service is running on port 8002`);
      }
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

start();
