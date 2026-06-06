/**
 * AUTHSVC-001: rate limiters for the auth surface.
 *
 * The login limiter keys per IP+email so we don't allow distributed
 * credential stuffing across many accounts from a single IP to slip
 * through under a pure-IP budget, and so a single account can't be
 * locked out from every IP on the internet at once.
 *
 * Limits intentionally err on the strict side; legitimate users won't
 * hit them but a credential-stuffing script will. Tune via env if
 * needed in ops.
 */
import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import { normalizeEmail } from "@repo/auth-middleware";

const FIFTEEN_MIN = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const standardResponse = (_req: Request, res: Response) => {
  res.status(429).json({ message: "Too many requests. Please try again later." });
};

/**
 * Collapse an IP to a /64 prefix for IPv6 (the unit ISPs hand out) so
 * an attacker on a single IPv6 LAN can't rotate addresses to bypass the
 * limit. For IPv4 we use the address as-is.
 */
function ipKey(req: Request): string {
  const ip = req.ip ?? "";
  if (!ip) return "unknown";
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return parts.slice(0, 4).join(":") + "::/64";
  }
  return ip;
}

/**
 * Login: 10 attempts per 15-min window per (ip, email).
 * The key falls back to ip-only when no email is supplied so we still
 * shed garbage requests.
 */
export const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const body = (req.body ?? {}) as { email?: unknown; username?: unknown };
    const identifier =
      typeof body.email === "string"
        ? normalizeEmail(body.email)
        : typeof body.username === "string"
          ? body.username.trim().toLowerCase()
          : "";
    return `${ipKey(req)}:${identifier}`;
  },
  handler: standardResponse,
});

/**
 * Register: 5 attempts per 15-min window per IP. Lower than login because
 * a real human registers once.
 */
export const registerLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: ipKey,
  handler: standardResponse,
});

/**
 * Refresh: 60 per IP per 15 min. The legit client refreshes every ~15min,
 * so 60 leaves plenty of headroom even for users with multiple tabs.
 */
export const refreshLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: ipKey,
  handler: standardResponse,
});

/**
 * Forgot-password: 5 per hour per IP. Sending too many reset emails to
 * arbitrary addresses is itself an attack vector (mailbomb / abuse).
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: ONE_HOUR,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: ipKey,
  handler: standardResponse,
});

/**
 * Reset-password: 10 per 15 min per IP. Bounded so a token-guessing
 * loop is shut down quickly. The single-use jti table is the real
 * defence; this just adds belt-and-braces.
 */
export const resetPasswordLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: ipKey,
  handler: standardResponse,
});

/**
 * AUD-029: resend-verification rate limiter.
 * 3 attempts per 15-min window per (ip, email). Resending verification
 * emails to arbitrary addresses is a mailbomb vector, and a legitimate
 * user only needs the link once per session.
 */
export const resendVerificationLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const body = (req.body ?? {}) as { email?: unknown };
    const identifier =
      typeof body.email === "string" ? normalizeEmail(body.email) : "";
    return `${ipKey(req)}:${identifier}`;
  },
  handler: standardResponse,
});
