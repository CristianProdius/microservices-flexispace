/**
 * HttpOnly session cookie helpers.
 *
 * Uses the canonical cookie names exported from `@repo/auth-middleware`
 * so the admin app's edge middleware (and any other consumer that reads
 * the session cookie) sees the value set here. The auth-service is the
 * sole writer; everyone else reads.
 */
import type { Response } from "express";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@repo/auth-middleware";

const ACCESS_COOKIE_PATH = "/";
const REFRESH_COOKIE_PATH = "/auth";

function isSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

function sameSite(): "lax" | "none" | "strict" {
  // In production we often run cross-site (different subdomains for client
  // and auth service). "none" requires Secure to be set.
  return isSecure() ? "none" : "lax";
}

// When the auth-service is served from a different subdomain than the admin/
// client apps (e.g. api.spacefly.ai vs admin.spacefly.ai), the session cookie
// must be scoped to the parent domain so the browser sends it to both. Set
// COOKIE_DOMAIN=.spacefly.ai in that case. Leave unset for single-host setups
// and local dev — undefined means "host-only cookie" which is the safe default.
function cookieDomain(): string | undefined {
  const raw = process.env.COOKIE_DOMAIN?.trim();
  return raw ? raw : undefined;
}

export function setAccessCookie(res: Response, token: string, maxAgeMs: number): void {
  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: sameSite(),
    domain: cookieDomain(),
    path: ACCESS_COOKIE_PATH,
    maxAge: maxAgeMs,
  });
}

export function setRefreshCookie(
  res: Response,
  token: string,
  maxAgeMs: number,
): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: sameSite(),
    domain: cookieDomain(),
    path: REFRESH_COOKIE_PATH,
    maxAge: maxAgeMs,
  });
}

export function clearAccessCookie(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: sameSite(),
    domain: cookieDomain(),
    path: ACCESS_COOKIE_PATH,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: sameSite(),
    domain: cookieDomain(),
    path: REFRESH_COOKIE_PATH,
  });
}

/**
 * Set both access + refresh cookies; used after register/login/refresh.
 *
 * The access COOKIE is deliberately given the REFRESH lifetime as its browser
 * `maxAge`, NOT the (short) access-JWT lifetime. The JWT inside still carries
 * its own 15-min `exp` and is what the API verifies, so authorization is
 * unchanged. But the cookie outliving the JWT lets the admin edge middleware
 * tell "lapsed access token, session still alive" (serve the shell, let the
 * client refresh) apart from "no session" (bounce to /login). Tying the
 * cookie's maxAge to the 15-min JWT made the cookie vanish the instant the
 * token expired, so an idle tab got bounced to /login every 15 min despite a
 * valid 7-day refresh session — the "have to log in twice" symptom.
 *
 * `accessMaxAgeMs` is retained for call-site compatibility but is no longer
 * used for the cookie lifetime (the JWT's own exp governs API expiry).
 */
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  refreshMaxAgeMs: number,
  accessMaxAgeMs: number,
): void {
  void accessMaxAgeMs;
  setAccessCookie(res, accessToken, refreshMaxAgeMs);
  setRefreshCookie(res, refreshToken, refreshMaxAgeMs);
}

/** Clear both access + refresh cookies; used at logout. */
export function clearAuthCookies(res: Response): void {
  clearAccessCookie(res);
  clearRefreshCookie(res);
}

// Backwards-compatible alias for callers that still use the old name.
export const REFRESH_COOKIE_NAME = REFRESH_TOKEN_COOKIE;
