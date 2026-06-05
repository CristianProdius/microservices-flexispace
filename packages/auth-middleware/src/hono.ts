import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { verifyAccessToken, extractAccessToken } from "./jwt.js";
import type { AuthUser } from "./types.js";
import { hasVerifiedHostAccess } from "./authorization.js";

type AuthVariables = {
  user: AuthUser;
  userId: string;
};

/**
 * Resolve the bearer token from the standard `Authorization` header or,
 * failing that, the HttpOnly session cookie. Header wins when both are
 * present so existing API clients keep their current behaviour.
 */
function resolveToken(c: Context): string | null {
  return extractAccessToken(c.req.header("Authorization"), c.req.header("Cookie"));
}

export const shouldBeUser = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const token = resolveToken(c);

    if (!token) {
      return c.json({ message: "No token provided" }, 401);
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      return c.json({ message: "Invalid or expired token" }, 401);
    }

    const user: AuthUser = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      hostVerified: payload.hostVerified,
    };

    c.set("user", user);
    c.set("userId", payload.userId);

    await next();
  }
);

export const shouldBeAdmin = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const token = resolveToken(c);

    if (!token) {
      return c.json({ message: "No token provided" }, 401);
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      return c.json({ message: "Invalid or expired token" }, 401);
    }

    if (payload.role !== "ADMIN") {
      return c.json({ message: "Admin access required" }, 403);
    }

    const user: AuthUser = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      hostVerified: payload.hostVerified,
    };

    c.set("user", user);
    c.set("userId", payload.userId);

    await next();
  }
);

export const shouldBeHost = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const token = resolveToken(c);

    if (!token) {
      return c.json({ message: "No token provided" }, 401);
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      return c.json({ message: "Invalid or expired token" }, 401);
    }

    if (!hasVerifiedHostAccess(payload)) {
      return c.json({ message: "Verified host access required" }, 403);
    }

    const user: AuthUser = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      hostVerified: payload.hostVerified,
    };

    c.set("user", user);
    c.set("userId", payload.userId);

    await next();
  }
);

export const shouldBeHostOrAdmin = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const token = resolveToken(c);

    if (!token) {
      return c.json({ message: "No token provided" }, 401);
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      return c.json({ message: "Invalid or expired token" }, 401);
    }

    if (!hasVerifiedHostAccess(payload)) {
      return c.json({ message: "Verified host or Admin access required" }, 403);
    }

    const user: AuthUser = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      hostVerified: payload.hostVerified,
    };

    c.set("user", user);
    c.set("userId", payload.userId);

    await next();
  }
);
