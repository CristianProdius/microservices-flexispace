import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, extractTokenFromHeader } from "./jwt.js";
import type { AuthUser, JwtPayload } from "./types.js";
import { hasVerifiedHostAccess } from "./authorization.js";
import { isAccessTokenRevoked } from "./revocation.js";

async function resolveAuth(
  req: Request,
  res: Response
): Promise<{ payload: JwtPayload } | null> {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return null;
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({ message: "Invalid or expired token" });
    return null;
  }

  // Reject tokens that have been explicitly revoked (logout, password change).
  if (await isAccessTokenRevoked(payload.jti)) {
    res.status(401).json({ message: "Token revoked" });
    return null;
  }

  return { payload };
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
  const result = await resolveAuth(req, res);
  if (!result) return;

  attachUser(req, result.payload);
  return next();
}

export async function shouldBeAdmin(req: Request, res: Response, next: NextFunction) {
  const result = await resolveAuth(req, res);
  if (!result) return;

  if (result.payload.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }

  attachUser(req, result.payload);
  return next();
}

export async function shouldBeHost(req: Request, res: Response, next: NextFunction) {
  const result = await resolveAuth(req, res);
  if (!result) return;

  if (!hasVerifiedHostAccess(result.payload)) {
    return res.status(403).json({ message: "Verified host access required" });
  }

  attachUser(req, result.payload);
  return next();
}

export async function shouldBeHostOrAdmin(req: Request, res: Response, next: NextFunction) {
  const result = await resolveAuth(req, res);
  if (!result) return;

  if (!hasVerifiedHostAccess(result.payload)) {
    return res.status(403).json({ message: "Verified host or Admin access required" });
  }

  attachUser(req, result.payload);
  return next();
}
