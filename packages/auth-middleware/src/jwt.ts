import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { JwtPayload, TokenPair } from "./types.js";

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "15m") as SignOptions["expiresIn"];
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as SignOptions["expiresIn"];
const JWT_PASSWORD_RESET_EXPIRES_IN =
  (process.env.JWT_PASSWORD_RESET_EXPIRES_IN || "30m") as SignOptions["expiresIn"];

const getRequiredEnv = (
  name: "JWT_SECRET" | "JWT_REFRESH_SECRET" | "JWT_PASSWORD_RESET_SECRET",
): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
};

export function signAccessToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, getRequiredEnv("JWT_SECRET"), { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Sign a refresh token. Callers can supply a stable `jti` so the token can be
 * tracked in a server-side rotation chain (AUTHSVC-006). When omitted,
 * `jsonwebtoken` generates a random `jti` because we pass `jwtid`.
 */
export function signRefreshToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
  options: { jti?: string } = {},
): string {
  const signOptions: SignOptions = { expiresIn: JWT_REFRESH_EXPIRES_IN };
  if (options.jti) signOptions.jwtid = options.jti;
  return jwt.sign(payload, getRequiredEnv("JWT_REFRESH_SECRET"), signOptions);
}

export function signTokenPair(
  payload: Omit<JwtPayload, "iat" | "exp">,
  options: { refreshJti?: string } = {},
): TokenPair {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload, { jti: options.refreshJti }),
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

export interface PasswordResetTokenPayload {
  userId: string;
  email: string;
  purpose: "password-reset";
  jti?: string;
  iat?: number;
  exp?: number;
}

/**
 * AUTHSVC-010: short-lived password-reset token. The `purpose` claim is
 * checked on verify so an access/refresh token can never be substituted.
 */
export function signPasswordResetToken(
  payload: Pick<PasswordResetTokenPayload, "userId" | "email">,
  options: { jti: string },
): string {
  return jwt.sign(
    { ...payload, purpose: "password-reset" as const },
    getRequiredEnv("JWT_PASSWORD_RESET_SECRET"),
    { expiresIn: JWT_PASSWORD_RESET_EXPIRES_IN, jwtid: options.jti },
  );
}

export function verifyPasswordResetToken(
  token: string,
): PasswordResetTokenPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      getRequiredEnv("JWT_PASSWORD_RESET_SECRET"),
    ) as PasswordResetTokenPayload & { jti?: string };
    if (decoded.purpose !== "password-reset") return null;
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
