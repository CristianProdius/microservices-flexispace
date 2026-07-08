import Fastify from "fastify";
import cors from "@fastify/cors";
// M13: Fastify-5 rate limiter (default export). Guards booking endpoints
// against abuse and keys on the real client IP behind the proxy.
import rateLimit from "@fastify/rate-limit";
import { shouldBeUser } from "@repo/auth-middleware/fastify";
import { bookingRoute } from "./routes/booking.js";
import { connectRoute } from "./routes/connect.route.js";
import { paymentRoute } from "./routes/payment.route.js";
import { payoutRoute } from "./routes/payout.route.js";
import { stripeWebhookRoute } from "./routes/stripe-webhook.js";
import { consumer, producer } from "./utils/kafka.js";
import { runKafkaSubscriptions } from "./utils/subscriptions.js";

const PORT = Number(process.env.PORT || 8001);
const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5001",
  "http://localhost:5002",
  "http://localhost:3002",
  "http://localhost:3003",
];

const configuredCorsOrigins = process.env.CORS_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// BOOKSVC-015: fail closed in production. Falling back to localhost with
// credentials:true is unsafe if env wiring fails — a compromised dev machine
// could otherwise talk to prod with cookies via DNS rebinding or local XSS.
if (process.env.NODE_ENV === "production" && !configuredCorsOrigins?.length) {
  throw new Error(
    "CORS_ORIGINS must be set in production; refusing to fall back to localhost defaults"
  );
}

const corsOrigins = configuredCorsOrigins?.length ? configuredCorsOrigins : DEFAULT_CORS_ORIGINS;

// M13: trustProxy so rate-limit + request logging key on the real client IP
// (X-Forwarded-For) behind the nginx/caddy reverse proxy, not the proxy's IP.
const fastify = Fastify({ trustProxy: true });

// M13: don't leak internal error details on 5xx. Log the real error
// server-side, but only echo route-intended 4xx status/messages to clients.
// Registered before routes so it covers every handler below.
fastify.setErrorHandler((err, request, reply) => {
  request.log.error(err);

  // Fastify validation errors carry `.validation` and default to 400.
  const statusCode =
    err.statusCode ?? (err.validation ? 400 : 500);

  if (statusCode >= 500) {
    return reply.status(500).send({ message: "Internal Server Error" });
  }

  // Preserve intentional 4xx status + message set by routes/validation.
  return reply.status(statusCode).send({ message: err.message });
});

fastify.register(cors, {
  origin: corsOrigins,
  credentials: true,
});

// M13: sane global rate limit (100 req / minute). Keyed on the authenticated
// userId when present, otherwise the (trust-proxy-resolved) client IP.
fastify.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
  keyGenerator: (request) => request.userId ?? request.ip,
});

fastify.get("/health", (request, reply) => {
  return reply.status(200).send({
    status: "ok",
    service: "booking-service",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

fastify.get("/test", { preHandler: shouldBeUser }, (request, reply) => {
  return reply.send({
    message: "Booking service is authenticated!",
    userId: request.userId,
  });
});

fastify.register(bookingRoute);
fastify.register(connectRoute);
fastify.register(paymentRoute);
fastify.register(payoutRoute);
fastify.register(stripeWebhookRoute);

const start = async () => {
  try {
    // KAFKA-002: producer.connect() throws on initial broker failure.
    // We intentionally let that propagate to the catch below and exit
    // non-zero so the orchestrator restarts the pod, instead of silently
    // running in "log-only" mode and losing events.
    await Promise.all([producer.connect(), consumer.connect()]);
    await runKafkaSubscriptions();
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Booking service is running on port ${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();

const shutdown = async (signal: NodeJS.Signals) => {
  console.log(`${signal} received. Shutting down booking service...`);

  try {
    await fastify.close();
    await Promise.all([producer.disconnect(), consumer.disconnect()]);
    process.exit(0);
  } catch (error) {
    console.error("Error shutting down booking service:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
