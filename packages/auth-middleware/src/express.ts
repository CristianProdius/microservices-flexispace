import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, extractAccessToken } from "./jwt.js";
import type { AuthUser } from "./types.js";
import { hasVerifiedHostAccess } from "./authorization.js";

/**
 * Resolve the bearer token from the standard `Authorization` header or,
 * failing that, the HttpOnly session cookie. Header wins when both are
 * present so existing API clients keep their current behaviour.
 */
function resolveToken(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  return extractAccessToken(req.headers.authorization, cookieHeader);
}

export function shouldBeUser(req: Request, res: Response, next: NextFunction) {
  const token = resolveToken(req);

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const user: AuthUser = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    hostVerified: payload.hostVerified,
  };

  req.user = user;
  req.userId = payload.userId;

  return next();
}

export function shouldBeAdmin(req: Request, res: Response, next: NextFunction) {
  const token = resolveToken(req);

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  if (payload.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const user: AuthUser = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    hostVerified: payload.hostVerified,
  };

  req.user = user;
  req.userId = payload.userId;

  return next();
}

export function shouldBeHost(req: Request, res: Response, next: NextFunction) {
  const token = resolveToken(req);

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  if (!hasVerifiedHostAccess(payload)) {
    return res.status(403).json({ message: "Verified host access required" });
  }

  const user: AuthUser = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    hostVerified: payload.hostVerified,
  };

  req.user = user;
  req.userId = payload.userId;

  return next();
}

export function shouldBeHostOrAdmin(req: Request, res: Response, next: NextFunction) {
  const token = resolveToken(req);

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  if (!hasVerifiedHostAccess(payload)) {
    return res.status(403).json({ message: "Verified host or Admin access required" });
  }

  const user: AuthUser = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    hostVerified: payload.hostVerified,
  };

  req.user = user;
  req.userId = payload.userId;

  return next();
}
