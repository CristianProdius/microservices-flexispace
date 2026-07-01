import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, extractAccessToken } from "./jwt.js";
import type { VerifyFailureReason } from "./jwt.js";
import type { AuthUser, JwtPayload } from "./types.js";
import { hasVerifiedHostAccess } from "./authorization.js";
import { isAccessTokenRevoked } from "./revocation.js";
import { lookupActiveUser, invalidateUserCache } from "./userCache.js";

export { invalidateUserCache };

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

/**
 * AUD-005: re-check that the JWT's userId is still an active (non-deleted)
 * user. JWTs are stateless so a soft-delete won't otherwise propagate until
 * the access token expires. Cached via lookupActiveUser to keep this off the
 * hot path.
 */
async function callerStillActive(
  _req: Request,
  res: Response,
  payload: JwtPayload,
): Promise<boolean> {
  const active = await lookupActiveUser(payload.userId);
  if (!active) {
    res.status(401).json({ message: "Account no longer active" });
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
    res.status(401).json({ message: "Token revoked" });
    return false;
  }
  return true;
}

export async function shouldBeUser(req: Request, res: Response, next: NextFunction) {
  const payload = await authenticate(req, res);
  if (!payload) return;

  if (!(await callerStillActive(req, res, payload))) return;

  attachUser(req, payload);
  return next();
}

export async function shouldBeAdmin(req: Request, res: Response, next: NextFunction) {
  const payload = await authenticate(req, res);
  if (!payload) return;

  if (payload.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }

  if (!(await callerStillActive(req, res, payload))) return;

  attachUser(req, payload);
  return next();
}

export async function shouldBeHost(req: Request, res: Response, next: NextFunction) {
  const payload = await authenticate(req, res);
  if (!payload) return;

  if (!hasVerifiedHostAccess(payload)) {
    return res.status(403).json({ message: "Verified host access required" });
  }

  if (!(await callerStillActive(req, res, payload))) return;

  attachUser(req, payload);
  return next();
}

export async function shouldBeHostOrAdmin(req: Request, res: Response, next: NextFunction) {
  const payload = await authenticate(req, res);
  if (!payload) return;

  if (!hasVerifiedHostAccess(payload)) {
    return res.status(403).json({ message: "Verified host or Admin access required" });
  }

  if (!(await callerStillActive(req, res, payload))) return;

  attachUser(req, payload);
  return next();
}

export async function resolveActingHost(req: Request, res: Response, next: NextFunction) {
  const headerValue = req.header("X-Acting-Host-Id")?.trim();
  if (!headerValue) return next();

  // Only admins may impersonate; for everyone else the header is silently ignored.
  if (req.user?.role !== "ADMIN") return next();

  // AUD-021: cached lookup. Returns null for missing OR soft-deleted users —
  // both collapse to the same 400 here, which matches prior behaviour.
  const target = await lookupActiveUser(headerValue);

  if (!target) {
    return res.status(400).json({ message: "Invalid acting host" });
  }
  if (target.role !== "HOST" && target.role !== "ADMIN") {
    return res.status(400).json({ message: "Invalid acting host" });
  }

  req.realUserId = req.userId;
  req.actingHostId = target.id;
  req.userId = target.id;

  if (req.method !== "GET" && req.method !== "HEAD") {
    console.info(
      JSON.stringify({
        msg: "admin acting as host",
        realUserId: req.realUserId,
        actingHostId: req.actingHostId,
        method: req.method,
        path: req.path,
      })
    );
  }

  return next();
}
