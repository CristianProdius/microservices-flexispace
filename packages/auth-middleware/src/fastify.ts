import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken, extractAccessToken } from "./jwt.js";
import type { AuthUser } from "./types.js";
import { hasVerifiedHostAccess } from "./authorization.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
    userId?: string;
  }
}

/**
 * Resolve the bearer token from the standard `Authorization` header or,
 * failing that, the HttpOnly session cookie. Header wins when both are
 * present so existing API clients keep their current behaviour.
 */
function resolveToken(request: FastifyRequest): string | null {
  const cookieHeader = request.headers.cookie;
  return extractAccessToken(request.headers.authorization, cookieHeader);
}

export async function shouldBeUser(request: FastifyRequest, reply: FastifyReply) {
  const token = resolveToken(request);

  if (!token) {
    return reply.status(401).send({ message: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return reply.status(401).send({ message: "Invalid or expired token" });
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
  const token = resolveToken(request);

  if (!token) {
    return reply.status(401).send({ message: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }

  if (payload.role !== "ADMIN") {
    return reply.status(403).send({ message: "Admin access required" });
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
  const token = resolveToken(request);

  if (!token) {
    return reply.status(401).send({ message: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }

  if (!hasVerifiedHostAccess(payload)) {
    return reply.status(403).send({ message: "Verified host access required" });
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
  const token = resolveToken(request);

  if (!token) {
    return reply.status(401).send({ message: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }

  if (!hasVerifiedHostAccess(payload)) {
    return reply.status(403).send({ message: "Verified host or Admin access required" });
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
