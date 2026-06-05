import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { verifyAccessToken, extractTokenFromHeader } from "./jwt.js";
import type { VerifyFailureReason } from "./jwt.js";
import type { AuthUser, JwtPayload } from "./types.js";
import { hasVerifiedHostAccess } from "./authorization.js";

type AuthVariables = {
  user: AuthUser;
  userId: string;
};

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

function authenticate(c: Context):
  | { ok: true; payload: JwtPayload }
  | { ok: false; response: Response } {
  const token = extractTokenFromHeader(c.req.header("Authorization"));

  if (!token) {
    return { ok: false, response: c.json({ message: "No token provided" }, 401) };
  }

  const result = verifyAccessToken(token);

  if (!result.ok) {
    return {
      ok: false,
      response: c.json({ message: messageForReason(result.reason) }, 401),
    };
  }

  return { ok: true, payload: result.payload };
}

function attachUser(c: Context<{ Variables: AuthVariables }>, payload: JwtPayload): void {
  const user: AuthUser = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    hostVerified: payload.hostVerified,
  };

  c.set("user", user);
  c.set("userId", payload.userId);
}

export const shouldBeUser = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const auth = authenticate(c);
    if (!auth.ok) return auth.response;

    attachUser(c, auth.payload);
    await next();
  }
);

export const shouldBeAdmin = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const auth = authenticate(c);
    if (!auth.ok) return auth.response;

    if (auth.payload.role !== "ADMIN") {
      return c.json({ message: "Admin access required" }, 403);
    }

    attachUser(c, auth.payload);
    await next();
  }
);

export const shouldBeHost = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const auth = authenticate(c);
    if (!auth.ok) return auth.response;

    if (!hasVerifiedHostAccess(auth.payload)) {
      return c.json({ message: "Verified host access required" }, 403);
    }

    attachUser(c, auth.payload);
    await next();
  }
);

export const shouldBeHostOrAdmin = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const auth = authenticate(c);
    if (!auth.ok) return auth.response;

    if (!hasVerifiedHostAccess(auth.payload)) {
      return c.json({ message: "Verified host or Admin access required" }, 403);
    }

    attachUser(c, auth.payload);
    await next();
  }
);
