import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { JwtPayload, TokenPair } from "./types.js";

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "15m") as SignOptions["expiresIn"];
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

const getRequiredEnv = (name: "JWT_SECRET" | "JWT_REFRESH_SECRET"): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
};

export function signAccessToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, getRequiredEnv("JWT_SECRET"), { expiresIn: JWT_EXPIRES_IN });
}

export function signRefreshToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, getRequiredEnv("JWT_REFRESH_SECRET"), { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

export function signTokenPair(payload: Omit<JwtPayload, "iat" | "exp">): TokenPair {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getRequiredEnv("JWT_SECRET")) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getRequiredEnv("JWT_REFRESH_SECRET")) as JwtPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

/** Default cookie name carrying the access JWT for SpaceFly clients. */
export const ACCESS_TOKEN_COOKIE = "spacefly_access";

/** Default cookie name carrying the refresh JWT for SpaceFly clients. */
export const REFRESH_TOKEN_COOKIE = "spacefly_refresh";

/**
 * Parse a raw `Cookie:` header string and return the value of the named
 * cookie, or `null` when not present. Avoids pulling in `cookie-parser`
 * as a runtime dependency so the helper stays usable from Express,
 * Fastify, Hono and Next.js edge alike.
 */
export function extractTokenFromCookieHeader(
  cookieHeader: string | undefined | null,
  cookieName: string = ACCESS_TOKEN_COOKIE
): string | null {
  if (!cookieHeader) {
    return null;
  }

  // Cookies are separated by `; ` per RFC 6265, but be lenient with whitespace.
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const eqIndex = part.indexOf("=");
    if (eqIndex === -1) continue;
    const name = part.slice(0, eqIndex).trim();
    if (name !== cookieName) continue;
    const value = part.slice(eqIndex + 1).trim();
    if (!value) return null;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}

/**
 * Resolve the access token from either the `Authorization: Bearer …`
 * header (preferred, for least surprise with existing API clients) or
 * the HttpOnly session cookie. Returns `null` when neither is present.
 */
export function extractAccessToken(
  authHeader: string | undefined | null,
  cookieHeader: string | undefined | null,
  cookieName: string = ACCESS_TOKEN_COOKIE
): string | null {
  const fromHeader = extractTokenFromHeader(authHeader ?? undefined);
  if (fromHeader) return fromHeader;
  return extractTokenFromCookieHeader(cookieHeader, cookieName);
}
