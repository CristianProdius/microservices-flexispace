import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { shouldBeAdmin } from "@repo/auth-middleware/express";
import userRoute from "./routes/user.route.js";
import authRoute from "./routes/auth.route.js";
import { producer } from "./utils/kafka.js";

const app = express();
app.use(
  cors({
    origin: ["http://localhost:3002", "http://localhost:3003"],
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
    app.listen(8003, () => {
      console.log("Auth service is running on 8003");
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

start();
