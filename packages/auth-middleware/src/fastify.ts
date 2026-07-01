import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken, extractAccessToken } from "./jwt.js";
import type { VerifyFailureReason } from "./jwt.js";
import type { AuthUser, JwtPayload } from "./types.js";
import { hasVerifiedHostAccess } from "./authorization.js";
import { isAccessTokenRevoked } from "./revocation.js";
import { lookupActiveUser, invalidateUserCache } from "./userCache.js";

export { invalidateUserCache };

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

/**
 * AUD-005: re-check that the JWT's userId is still an active (non-deleted)
 * user. Cached via `lookupActiveUser` so this stays off the hot path.
 */
async function callerStillActive(
  reply: FastifyReply,
  payload: JwtPayload,
): Promise<boolean> {
  const active = await lookupActiveUser(payload.userId);
  if (!active) {
    await reply.status(401).send({ message: "Account no longer active" });
    return false;
  }
  // AUDIT-B8/M1: per-user access-token kill switch. Reject any access token
  // minted before the user's tokensValidAfter watermark (bumped on password
  // reset/change, role downgrade, host de-verification) — same 401 shape as
  // the per-jti revocation rejection. `iat` is in seconds; compare in ms.
  if (
    active.tokensValidAfter &&
    typeof payload.iat === "number" &&
    payload.iat * 1000 < active.tokensValidAfter.getTime()
  ) {
    await reply.status(401).send({ message: "Token revoked" });
    return false;
  }
  return true;
}

export async function shouldBeUser(request: FastifyRequest, reply: FastifyReply) {
  const payload = await authenticate(request, reply);
  if (!payload) return;

  if (!(await callerStillActive(reply, payload))) return;

  attachUser(request, payload);
}

export async function shouldBeAdmin(request: FastifyRequest, reply: FastifyReply) {
  const payload = await authenticate(request, reply);
  if (!payload) return;

  if (payload.role !== "ADMIN") {
    return reply.status(403).send({ message: "Admin access required" });
  }

  if (!(await callerStillActive(reply, payload))) return;

  attachUser(request, payload);
}

export async function shouldBeHost(request: FastifyRequest, reply: FastifyReply) {
  const payload = await authenticate(request, reply);
  if (!payload) return;

  if (!hasVerifiedHostAccess(payload)) {
    return reply.status(403).send({ message: "Verified host access required" });
  }

  if (!(await callerStillActive(reply, payload))) return;

  attachUser(request, payload);
}

export async function shouldBeHostOrAdmin(request: FastifyRequest, reply: FastifyReply) {
  const payload = await authenticate(request, reply);
  if (!payload) return;

  if (!hasVerifiedHostAccess(payload)) {
    return reply.status(403).send({ message: "Verified host or Admin access required" });
  }

  if (!(await callerStillActive(reply, payload))) return;

  attachUser(request, payload);
}

export async function resolveActingHost(request: FastifyRequest, reply: FastifyReply) {
  const raw = request.headers["x-acting-host-id"];
  const headerStr = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  if (!headerStr) return;

  const user = (request as any).user;
  if (user?.role !== "ADMIN") return;

  // AUD-021: cached lookup; null for missing OR soft-deleted users.
  const target = await lookupActiveUser(headerStr);

  if (!target) {
    return reply.code(400).send({ message: "Invalid acting host" });
  }
  if (target.role !== "HOST" && target.role !== "ADMIN") {
    return reply.code(400).send({ message: "Invalid acting host" });
  }

  (request as any).realUserId = (request as any).userId;
  (request as any).actingHostId = target.id;
  (request as any).userId = target.id;

  if (request.method !== "GET" && request.method !== "HEAD") {
    // AUD-033: match express.ts's log shape — `path` must NOT include the
    // querystring so log aggregation across the two frameworks groups
    // identically. Prefer the matched route template when fastify exposes
    // it (cardinality-friendly), otherwise strip the querystring from url.
    const logPath =
      (request as any).routeOptions?.url ?? request.url.split("?")[0];
    console.info(
      JSON.stringify({
        msg: "admin acting as host",
        realUserId: (request as any).realUserId,
        actingHostId: target.id,
        method: request.method,
        path: logPath,
      })
    );
  }
}
