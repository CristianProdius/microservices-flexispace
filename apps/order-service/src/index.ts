import Fastify from "fastify";
import cors from "@fastify/cors";
import { shouldBeUser } from "@repo/auth-middleware/fastify";
import { bookingRoute } from "./routes/booking.js";
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

const fastify = Fastify();

fastify.register(cors, {
  origin: corsOrigins,
  credentials: true,
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

const start = async () => {
  try {
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
