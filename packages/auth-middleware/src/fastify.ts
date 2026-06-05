import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken, extractTokenFromHeader } from "./jwt.js";
import type { AuthUser, JwtPayload } from "./types.js";
import { hasVerifiedHostAccess } from "./authorization.js";
import { isAccessTokenRevoked } from "./revocation.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
    userId?: string;
  }
}

async function resolveAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<{ payload: JwtPayload } | null> {
  const token = extractTokenFromHeader(request.headers.authorization);

  if (!token) {
    await reply.status(401).send({ message: "No token provided" });
    return null;
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    await reply.status(401).send({ message: "Invalid or expired token" });
    return null;
  }

  if (await isAccessTokenRevoked(payload.jti)) {
    await reply.status(401).send({ message: "Token revoked" });
    return null;
  }

  return { payload };
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
  const result = await resolveAuth(request, reply);
  if (!result) return;
  attachUser(request, result.payload);
}

export async function shouldBeAdmin(request: FastifyRequest, reply: FastifyReply) {
  const result = await resolveAuth(request, reply);
  if (!result) return;

  if (result.payload.role !== "ADMIN") {
    return reply.status(403).send({ message: "Admin access required" });
  }

  attachUser(request, result.payload);
}

export async function shouldBeHost(request: FastifyRequest, reply: FastifyReply) {
  const result = await resolveAuth(request, reply);
  if (!result) return;

  if (!hasVerifiedHostAccess(result.payload)) {
    return reply.status(403).send({ message: "Verified host access required" });
  }

  attachUser(request, result.payload);
}

export async function shouldBeHostOrAdmin(request: FastifyRequest, reply: FastifyReply) {
  const result = await resolveAuth(request, reply);
  if (!result) return;

  if (!hasVerifiedHostAccess(result.payload)) {
    return reply.status(403).send({ message: "Verified host or Admin access required" });
  }

  attachUser(request, result.payload);
}
