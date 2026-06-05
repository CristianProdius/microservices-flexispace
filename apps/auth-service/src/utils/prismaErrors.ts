import { Prisma } from "@repo/db";

export interface MappedPrismaError {
  status: number;
  message: string;
}

/**
 * Map a Prisma error to a safe HTTP response. Never leaks raw err.message
 * (which can include connection strings, column data, etc).
 *
 * - P2025 (record not found)        -> 404
 * - P2002 (unique constraint)       -> 409 + field-aware message
 * - P2003 (FK violation)            -> 400
 * - anything else                   -> 500 generic
 */
export function mapPrismaError(err: unknown): MappedPrismaError {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2025":
        return { status: 404, message: "Resource not found" };
      case "P2002": {
        const target = (err.meta as { target?: string[] | string } | undefined)?.target;
        const fields = Array.isArray(target) ? target : target ? [target] : [];
        if (fields.includes("email")) {
          return { status: 409, message: "Email already in use" };
        }
        if (fields.includes("username")) {
          return { status: 409, message: "Username already in use" };
        }
        return { status: 409, message: "Unique constraint violation" };
      }
      case "P2003":
        return { status: 400, message: "Invalid reference to a related resource" };
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return { status: 400, message: "Invalid request payload" };
  }

  return { status: 500, message: "Internal server error" };
}

/**
 * Convenience: send the mapped Prisma error on an Express response.
 * Always logs the original error server-side (without leaking to client).
 */
export function sendPrismaError(
  res: { status: (code: number) => { json: (body: unknown) => unknown } },
  err: unknown,
  context: string
): unknown {
  const mapped = mapPrismaError(err);
  if (mapped.status >= 500) {
    console.error(`${context}:`, err);
  } else {
    console.warn(`${context} (${mapped.status}):`, err);
  }
  return res.status(mapped.status).json({ message: mapped.message });
}
