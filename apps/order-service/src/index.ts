import Fastify from "fastify";
import cors from "@fastify/cors";
import { shouldBeUser } from "@repo/auth-middleware/fastify";
import { bookingRoute } from "./routes/booking.js";
import { consumer, producer } from "./utils/kafka.js";
import { runKafkaSubscriptions } from "./utils/subscriptions.js";

const fastify = Fastify();

fastify.register(cors, {
  origin: ["http://localhost:3002", "http://localhost:3003"],
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
    await fastify.listen({ port: 8001 });
    console.log("Booking service is running on port 8001");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
