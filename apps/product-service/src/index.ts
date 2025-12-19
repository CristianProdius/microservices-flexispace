import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { shouldBeUser } from "@repo/auth-middleware/express";
import spaceRouter from "./routes/space.route.js";
import categoryRouter from "./routes/category.route.js";
import amenityRouter from "./routes/amenity.route.js";
import { consumer, producer } from "./utils/kafka.js";

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

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  return res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error!" });
});

const start = async () => {
  try {
    await Promise.all([producer.connect(), consumer.connect()]);
    app.listen(8000, () => {
      console.log("Space service is running on port 8000");
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

start();
