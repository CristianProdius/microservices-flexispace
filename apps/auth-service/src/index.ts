import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { shouldBeAdmin } from "@repo/auth-middleware/express";
import { setRevocationChecker } from "@repo/auth-middleware";
import { prisma } from "@repo/db";
import userRoute from "./routes/user.route.js";
import authRoute from "./routes/auth.route.js";
import { producer } from "./utils/kafka.js";

// Wire DB-backed access-token revocation check into the middleware.
// Middleware itself stays DB-free; auth-service owns the store.
setRevocationChecker(async (jti) => {
  const revoked = await prisma.revokedAccessToken.findUnique({ where: { jti } });
  return revoked !== null;
});

const PORT = Number(process.env.PORT || 8003);
const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5001",
  "http://localhost:5002",
  "http://localhost:3002",
  "http://localhost:3003",
];

const configuredCorsOrigins = process.env.CORS_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigins = configuredCorsOrigins?.length ? configuredCorsOrigins : DEFAULT_CORS_ORIGINS;

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
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// Auth routes (public)
app.use("/auth", authRoute);

// User management routes (admin only)
app.use("/users", shouldBeAdmin, userRoute);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  return res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error!" });
});

const start = async () => {
  try {
    await producer.connect();
    const server = app.listen(PORT, () => {
      console.log(`Auth service is running on ${PORT}`);
    });

    const shutdown = async (signal: NodeJS.Signals) => {
      console.log(`${signal} received. Shutting down auth service...`);

      server.close(async (error) => {
        if (error) {
          console.error("Error closing auth service HTTP server:", error);
          process.exit(1);
        }

        try {
          await producer.disconnect();
          process.exit(0);
        } catch (disconnectError) {
          console.error("Error disconnecting auth service Kafka producer:", disconnectError);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

start();
