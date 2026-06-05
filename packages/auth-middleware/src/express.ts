import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, extractAccessToken } from "./jwt.js";
import type { VerifyFailureReason } from "./jwt.js";
import type { AuthUser, JwtPayload } from "./types.js";
import { hasVerifiedHostAccess } from "./authorization.js";
import { isAccessTokenRevoked } from "./revocation.js";

/**
 * Resolve the bearer token from the standard `Authorization` header or,
 * failing that, the HttpOnly session cookie. Header wins when both are
 * present so existing API clients keep their current behaviour.
 */
async function authenticate(req: Request, res: Response): Promise<JwtPayload | null> {
  const token = extractAccessToken(req.headers.authorization, req.headers.cookie);

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return null;
  }

  const result = verifyAccessToken(token);

  if (!result.ok) {
    res.status(401).json({ message: messageForReason(result.reason) });
    return null;
  }

  // AUTHSVC-007: check whether this token's jti has been revoked
  // (logout / password change). No-op when no checker is installed.
  if (await isAccessTokenRevoked(result.payload.jti)) {
    res.status(401).json({ message: "Token revoked" });
    return null;
  }

  return result.payload;
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

function attachUser(req: Request, payload: JwtPayload): void {
  const user: AuthUser = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    hostVerified: payload.hostVerified,
  };

  req.user = user;
  req.userId = payload.userId;
}

export async function shouldBeUser(req: Request, res: Response, next: NextFunction) {
  const payload = await authenticate(req, res);
  if (!payload) return;

  attachUser(req, payload);
  return next();
}

export async function shouldBeAdmin(req: Request, res: Response, next: NextFunction) {
  const payload = await authenticate(req, res);
  if (!payload) return;

  if (payload.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }

  attachUser(req, payload);
  return next();
}

export async function shouldBeHost(req: Request, res: Response, next: NextFunction) {
  const payload = await authenticate(req, res);
  if (!payload) return;

  if (!hasVerifiedHostAccess(payload)) {
    return res.status(403).json({ message: "Verified host access required" });
  }

  attachUser(req, payload);
  return next();
}

export async function shouldBeHostOrAdmin(req: Request, res: Response, next: NextFunction) {
  const payload = await authenticate(req, res);
  if (!payload) return;

  if (!hasVerifiedHostAccess(payload)) {
    return res.status(403).json({ message: "Verified host or Admin access required" });
  }

  attachUser(req, payload);
  return next();
}
