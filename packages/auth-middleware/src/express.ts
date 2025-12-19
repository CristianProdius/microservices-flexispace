import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, extractTokenFromHeader } from "./jwt.js";
import type { AuthUser } from "./types.js";

export function shouldBeUser(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req.headers.authorization);

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
  };

  req.user = user;
  req.userId = payload.userId;

  return next();
}

export function shouldBeAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req.headers.authorization);

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
  };

  req.user = user;
  req.userId = payload.userId;

  return next();
}

export function shouldBeHost(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  if (payload.role !== "HOST" && payload.role !== "ADMIN") {
    return res.status(403).json({ message: "Host access required" });
  }

  const user: AuthUser = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  req.user = user;
  req.userId = payload.userId;

  return next();
}

export function shouldBeHostOrAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  if (payload.role !== "HOST" && payload.role !== "ADMIN") {
    return res.status(403).json({ message: "Host or Admin access required" });
  }

  const user: AuthUser = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  req.user = user;
  req.userId = payload.userId;

  return next();
}
