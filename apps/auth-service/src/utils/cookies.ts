/**
 * HttpOnly refresh-token cookie helpers.
 *
 * Re-introduced here because this branch is off `main` and the wave-2
 * `fix/admin-server-auth` helpers don't exist yet on our base. When we
 * merge, prefer the shared helpers from `@repo/auth-middleware` and
 * delete these — the goal is one canonical implementation, not two.
 */
import type { Response } from "express";

const REFRESH_COOKIE_NAME = "refreshToken";
const COOKIE_PATH = "/auth";

function isSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

function sameSite(): "lax" | "none" {
  // In production we often run cross-site (different subdomains for client
  // and auth service). "none" requires Secure to be set.
  return isSecure() ? "none" : "lax";
}

export function setRefreshCookie(
  res: Response,
  token: string,
  maxAgeMs: number,
): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: sameSite(),
    path: COOKIE_PATH,
    maxAge: maxAgeMs,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: sameSite(),
    path: COOKIE_PATH,
  });
}

export { REFRESH_COOKIE_NAME };
