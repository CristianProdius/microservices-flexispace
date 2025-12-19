import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken, extractTokenFromHeader } from "./jwt.js";
import type { AuthUser } from "./types.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
    userId?: string;
  }
}

export async function shouldBeUser(request: FastifyRequest, reply: FastifyReply) {
  const token = extractTokenFromHeader(request.headers.authorization);

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
  };

  request.user = user;
  request.userId = payload.userId;
}

export async function shouldBeAdmin(request: FastifyRequest, reply: FastifyReply) {
  const token = extractTokenFromHeader(request.headers.authorization);

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
  };

  request.user = user;
  request.userId = payload.userId;
}

export async function shouldBeHost(request: FastifyRequest, reply: FastifyReply) {
  const token = extractTokenFromHeader(request.headers.authorization);

  if (!token) {
    return reply.status(401).send({ message: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }

  if (payload.role !== "HOST" && payload.role !== "ADMIN") {
    return reply.status(403).send({ message: "Host access required" });
  }

  const user: AuthUser = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  request.user = user;
  request.userId = payload.userId;
}

export async function shouldBeHostOrAdmin(request: FastifyRequest, reply: FastifyReply) {
  const token = extractTokenFromHeader(request.headers.authorization);

  if (!token) {
    return reply.status(401).send({ message: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }

  if (payload.role !== "HOST" && payload.role !== "ADMIN") {
    return reply.status(403).send({ message: "Host or Admin access required" });
  }

  const user: AuthUser = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  request.user = user;
  request.userId = payload.userId;
}
