import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken, extractAccessToken } from "./jwt.js";
import type { VerifyFailureReason } from "./jwt.js";
import type { AuthUser, JwtPayload } from "./types.js";
import { hasVerifiedHostAccess } from "./authorization.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
    userId?: string;
  }
}

function messageForReason(reason: VerifyFailureReason): string {
  switch (reason) {
    case "expired":
      return "Access token expired";
    case "wrong_token_use":
      return "Wrong token type";
    case "invalid":
    default:
      return "Invalid token";
  }
}

/**
 * Resolve the bearer token from the standard `Authorization` header or,
 * failing that, the HttpOnly session cookie. Header wins when both are
 * present so existing API clients keep their current behaviour.
 */
async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<JwtPayload | null> {
  const token = extractAccessToken(request.headers.authorization, request.headers.cookie);

  if (!token) {
    await reply.status(401).send({ message: "No token provided" });
    return null;
  }

  const result = verifyAccessToken(token);

  if (!result.ok) {
    await reply.status(401).send({ message: messageForReason(result.reason) });
    return null;
  }

  return result.payload;
}

function attachUser(request: FastifyRequest, payload: JwtPayload): void {
  const user: AuthUser = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    hostVerified: payload.hostVerified,
  };

  request.user = user;
  request.userId = payload.userId;
}

export async function shouldBeUser(request: FastifyRequest, reply: FastifyReply) {
  const payload = await authenticate(request, reply);
  if (!payload) return;

  attachUser(request, payload);
}

export async function shouldBeAdmin(request: FastifyRequest, reply: FastifyReply) {
  const payload = await authenticate(request, reply);
  if (!payload) return;

  if (payload.role !== "ADMIN") {
    return reply.status(403).send({ message: "Admin access required" });
  }

  attachUser(request, payload);
}

export async function shouldBeHost(request: FastifyRequest, reply: FastifyReply) {
  const payload = await authenticate(request, reply);
  if (!payload) return;

  if (!hasVerifiedHostAccess(payload)) {
    return reply.status(403).send({ message: "Verified host access required" });
  }

  attachUser(request, payload);
}

export async function shouldBeHostOrAdmin(request: FastifyRequest, reply: FastifyReply) {
  const payload = await authenticate(request, reply);
  if (!payload) return;

  if (!hasVerifiedHostAccess(payload)) {
    return reply.status(403).send({ message: "Verified host or Admin access required" });
  }

  attachUser(request, payload);
}
