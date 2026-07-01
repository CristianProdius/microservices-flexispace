import express, { Request, Response } from "express";
import cors from "cors";
import { shouldBeUser } from "@repo/auth-middleware/express";
import spaceRouter from "./routes/space.route.js";
import categoryRouter from "./routes/category.route.js";
import amenityRouter from "./routes/amenity.route.js";
import uploadRouter from "./routes/upload.route.js";
import venueRouter from "./routes/venue.route.js";
import hostRouter from "./routes/host.route.js";
import currencyRoutes from "./routes/currency.route.js";
import { consumer, producer } from "./utils/kafka.js";
import { parseCorsOrigins } from "./lib/cors.js";
import { buildErrorHandler } from "./lib/error-handler.js";

const PORT = Number(process.env.PORT || 8000);
const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5001",
  "http://localhost:5002",
  "http://localhost:3002",
  "http://localhost:3003",
];

const configuredCorsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);

// M14: fail closed in production. Previously this service silently fell back to
// DEFAULT_CORS_ORIGINS (localhost) with credentials:true when CORS_ORIGINS was
// missing/invalid — unlike auth-service and order-service (BOOKSVC-015), which
// throw at boot. A misconfigured prod deploy could otherwise let a compromised
// dev machine talk to prod with cookies via DNS rebinding or local XSS.
if (process.env.NODE_ENV === "production" && !configuredCorsOrigins.length) {
  throw new Error(
    "CORS_ORIGINS must be set in production; refusing to fall back to localhost defaults"
  );
}

const corsOrigins = configuredCorsOrigins.length ? configuredCorsOrigins : DEFAULT_CORS_ORIGINS;

const app = express();
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  return res.status(200).json({
    status: "ok",
    service: "space-service",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

app.get("/test", shouldBeUser, (req, res) => {
  res.json({ message: "Space service authenticated", userId: req.userId });
});

// Routes
app.use("/spaces", spaceRouter);
app.use("/categories", categoryRouter);
app.use("/amenities", amenityRouter);
app.use("/uploads", uploadRouter);
app.use("/venues", venueRouter);
app.use("/hosts", hostRouter);
app.use("/currencies", currencyRoutes);

// Error handler
app.use(buildErrorHandler());

const start = async () => {
  try {
    // KAFKA-002: producer.connect() throws on initial broker failure.
    // We intentionally let that propagate to the catch below and exit
    // non-zero so the orchestrator restarts the pod, instead of silently
    // running in "log-only" mode and losing events.
    await Promise.all([producer.connect(), consumer.connect()]);
    const server = app.listen(PORT, () => {
      console.log(`Space service is running on port ${PORT}`);
    });

    const shutdown = async (signal: NodeJS.Signals) => {
      console.log(`${signal} received. Shutting down space service...`);

      server.close(async (error) => {
        if (error) {
          console.error("Error closing space service HTTP server:", error);
          process.exit(1);
        }

        try {
          await Promise.all([producer.disconnect(), consumer.disconnect()]);
          process.exit(0);
        } catch (disconnectError) {
          console.error("Error disconnecting space service Kafka clients:", disconnectError);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

start();
