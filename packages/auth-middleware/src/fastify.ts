import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken, extractAccessToken } from "./jwt.js";
import type { VerifyFailureReason } from "./jwt.js";
import type { AuthUser, JwtPayload } from "./types.js";
import { hasVerifiedHostAccess } from "./authorization.js";
import { isAccessTokenRevoked } from "./revocation.js";
import { prisma } from "@repo/db";

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

  // AUTHSVC-007: revocation check (no-op when no checker installed).
  if (await isAccessTokenRevoked(result.payload.jti)) {
    await reply.status(401).send({ message: "Token revoked" });
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

export async function resolveActingHost(request: FastifyRequest, reply: FastifyReply) {
  const raw = request.headers["x-acting-host-id"];
  const headerStr = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  if (!headerStr) return;

  const user = (request as any).user;
  if (user?.role !== "ADMIN") return;

  const target = await prisma.user.findUnique({
    where: { id: headerStr },
    select: { id: true, role: true, deletedAt: true },
  });

  if (!target || target.deletedAt) {
    return reply.code(400).send({ message: "Invalid acting host" });
  }
  if (target.role !== "HOST" && target.role !== "ADMIN") {
    return reply.code(400).send({ message: "Invalid acting host" });
  }

  (request as any).realUserId = (request as any).userId;
  (request as any).actingHostId = target.id;
  (request as any).userId = target.id;

  if (request.method !== "GET" && request.method !== "HEAD") {
    console.info(
      JSON.stringify({
        msg: "admin acting as host",
        realUserId: (request as any).realUserId,
        actingHostId: target.id,
        method: request.method,
        path: request.url,
      })
    );
  }
}
