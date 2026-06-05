import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { JwtPayload, PurposeTokenPayload, TokenPair } from "./types.js";

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "15m") as SignOptions["expiresIn"];
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as SignOptions["expiresIn"];
const EMAIL_VERIFICATION_EXPIRES_IN = (process.env.EMAIL_VERIFICATION_EXPIRES_IN ||
  "24h") as SignOptions["expiresIn"];

const getRequiredEnv = (
  name: "JWT_SECRET" | "JWT_REFRESH_SECRET" | "JWT_VERIFICATION_SECRET"
): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
};

/**
 * Returns the secret used to sign verification / purpose JWTs.
 * Falls back to JWT_SECRET when JWT_VERIFICATION_SECRET is not set, so
 * existing single-secret deployments keep working — but production should
 * configure a distinct secret so a leaked verification token cannot be
 * mistaken for an access token elsewhere.
 */
const getVerificationSecret = (): string => {
  return process.env.JWT_VERIFICATION_SECRET || getRequiredEnv("JWT_SECRET");
};

export function signAccessToken(payload: Omit<JwtPayload, "iat" | "exp" | "jti">): string {
  // Always assign a jti so individual access tokens can be revoked (logout, etc).
  return jwt.sign(payload, getRequiredEnv("JWT_SECRET"), {
    expiresIn: JWT_EXPIRES_IN,
    jwtid: randomUUID(),
  });
}

export function signRefreshToken(payload: Omit<JwtPayload, "iat" | "exp" | "jti">): string {
  return jwt.sign(payload, getRequiredEnv("JWT_REFRESH_SECRET"), {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    jwtid: randomUUID(),
  });
}

export function signTokenPair(payload: Omit<JwtPayload, "iat" | "exp" | "jti">): TokenPair {
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

export function signEmailVerificationToken(
  payload: Omit<PurposeTokenPayload, "iat" | "exp" | "purpose">
): string {
  return jwt.sign({ ...payload, purpose: "email-verification" }, getVerificationSecret(), {
    expiresIn: EMAIL_VERIFICATION_EXPIRES_IN,
  });
}

export function verifyEmailVerificationToken(token: string): PurposeTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getVerificationSecret()) as PurposeTokenPayload;
    if (decoded.purpose !== "email-verification") {
      return null;
    }
    return decoded;
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
