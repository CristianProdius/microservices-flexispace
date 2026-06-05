import type { NextFunction, Request, Response } from "express";

export interface ErrorHandlerOptions {
  logger?: Pick<Console, "error">;
}

/**
 * Build the Express error middleware.
 *
 * Surfaces:
 * - known Prisma error codes as safe, generic 4xx responses
 * - 4xx errors with their authored message (controllers set these themselves)
 * - 5xx errors as a generic "Internal Server Error" (the original cause is
 *   logged but never echoed in the body)
 */
export function buildErrorHandler(options: ErrorHandlerOptions = {}) {
  const logger = options.logger ?? console;

  return function errorHandler(
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) {
    const status = err?.status || 500;

    if (err?.code === "P2025") {
      return res.status(404).json({ message: "Resource not found" });
    }
    if (err?.code === "P2002") {
      return res.status(409).json({ message: "Resource already exists" });
    }
    if (err?.code === "P2003") {
      return res
        .status(400)
        .json({ message: "Invalid foreign key reference" });
    }

    if (status >= 400 && status < 500) {
      return res.status(status).json({ message: err?.message || "Bad Request" });
    }

    logger.error("[product-service]", err);
    return res.status(500).json({ message: "Internal Server Error" });
  };
}
