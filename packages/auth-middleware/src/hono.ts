import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { verifyAccessToken, extractTokenFromHeader } from "./jwt.js";
import type { AuthUser, JwtPayload } from "./types.js";
import { hasVerifiedHostAccess } from "./authorization.js";
import { isAccessTokenRevoked } from "./revocation.js";

type AuthVariables = {
  user: AuthUser;
  userId: string;
};

type AuthContext = Context<{ Variables: AuthVariables }>;

async function resolveAuth(c: AuthContext): Promise<JwtPayload | Response> {
  const token = extractTokenFromHeader(c.req.header("Authorization"));

  if (!token) {
    return c.json({ message: "No token provided" }, 401);
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return c.json({ message: "Invalid or expired token" }, 401);
  }

  if (await isAccessTokenRevoked(payload.jti)) {
    return c.json({ message: "Token revoked" }, 401);
  }

  return payload;
}

function attachUser(c: AuthContext, payload: JwtPayload): void {
  const user: AuthUser = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    hostVerified: payload.hostVerified,
  };

  c.set("user", user);
  c.set("userId", payload.userId);
}

export const shouldBeUser = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const result = await resolveAuth(c);
  if (result instanceof Response) return result;

  attachUser(c, result);
  await next();
});

export const shouldBeAdmin = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const result = await resolveAuth(c);
  if (result instanceof Response) return result;

  if (result.role !== "ADMIN") {
    return c.json({ message: "Admin access required" }, 403);
  }

  attachUser(c, result);
  await next();
});

export const shouldBeHost = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const result = await resolveAuth(c);
  if (result instanceof Response) return result;

  if (!hasVerifiedHostAccess(result)) {
    return c.json({ message: "Verified host access required" }, 403);
  }

  attachUser(c, result);
  await next();
});

export const shouldBeHostOrAdmin = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const result = await resolveAuth(c);
    if (result instanceof Response) return result;

    if (!hasVerifiedHostAccess(result)) {
      return c.json({ message: "Verified host or Admin access required" }, 403);
    }

    attachUser(c, result);
    await next();
  }
);
