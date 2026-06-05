import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken, extractTokenFromHeader } from "./jwt.js";
import type { AuthUser } from "./types.js";
import { hasVerifiedHostAccess } from "./authorization.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
    userId?: string;
  }
}

// Helper: explicitly await the reply and return it so Fastify reliably
// short-circuits the request lifecycle, regardless of framework internals.
// (See: AUTHMW-007 — relying on `return reply.status().send()` works in
// Fastify v5 only because send() returns the reply object; this pattern is
// more robust and future-proof.)
async function sendAndHalt(
  reply: FastifyReply,
  status: number,
  body: Record<string, unknown>
): Promise<FastifyReply> {
  await reply.status(status).send(body);
  return reply;
}

export async function shouldBeUser(request: FastifyRequest, reply: FastifyReply) {
  const token = extractTokenFromHeader(request.headers.authorization);

  if (!token) {
    return sendAndHalt(reply, 401, { message: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return sendAndHalt(reply, 401, { message: "Invalid or expired token" });
  }

  const user: AuthUser = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    hostVerified: payload.hostVerified,
  };

  request.user = user;
  request.userId = payload.userId;
}

export async function shouldBeAdmin(request: FastifyRequest, reply: FastifyReply) {
  const token = extractTokenFromHeader(request.headers.authorization);

  if (!token) {
    return sendAndHalt(reply, 401, { message: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return sendAndHalt(reply, 401, { message: "Invalid or expired token" });
  }

  if (payload.role !== "ADMIN") {
    return sendAndHalt(reply, 403, { message: "Admin access required" });
  }

  const user: AuthUser = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    hostVerified: payload.hostVerified,
  };

  request.user = user;
  request.userId = payload.userId;
}

export async function shouldBeHost(request: FastifyRequest, reply: FastifyReply) {
  const token = extractTokenFromHeader(request.headers.authorization);

  if (!token) {
    return sendAndHalt(reply, 401, { message: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return sendAndHalt(reply, 401, { message: "Invalid or expired token" });
  }

  if (!hasVerifiedHostAccess(payload)) {
    return sendAndHalt(reply, 403, { message: "Verified host access required" });
  }

  const user: AuthUser = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    hostVerified: payload.hostVerified,
  };

  request.user = user;
  request.userId = payload.userId;
}

export async function shouldBeHostOrAdmin(request: FastifyRequest, reply: FastifyReply) {
  const token = extractTokenFromHeader(request.headers.authorization);

  if (!token) {
    return sendAndHalt(reply, 401, { message: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return sendAndHalt(reply, 401, { message: "Invalid or expired token" });
  }

  if (!hasVerifiedHostAccess(payload)) {
    return sendAndHalt(reply, 403, { message: "Verified host or Admin access required" });
  }

  const user: AuthUser = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    hostVerified: payload.hostVerified,
  };

  request.user = user;
  request.userId = payload.userId;
}
