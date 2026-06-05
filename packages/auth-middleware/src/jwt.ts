import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { JwtPayload, TokenPair, TokenUse } from "./types.js";

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "15m") as SignOptions["expiresIn"];
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

const JWT_ALGORITHM = "HS256" as const;
const JWT_ISSUER = "spacefly";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "spacefly-api";

const getRequiredEnv = (name: "JWT_SECRET" | "JWT_REFRESH_SECRET"): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
};

// AUTHMW-006: Fail fast when access and refresh secrets are identical. This
// would otherwise let a refresh token be replayed as a permanent access token,
// since both `verifyAccessToken` and `verifyRefreshToken` would accept it.
// Only enforced when BOTH are explicitly set so local dev with a single secret
// (or refresh not configured) still works.
const accessSecretAtImport = process.env.JWT_SECRET;
const refreshSecretAtImport = process.env.JWT_REFRESH_SECRET;
if (
  accessSecretAtImport &&
  refreshSecretAtImport &&
  accessSecretAtImport === refreshSecretAtImport
) {
  throw new Error(
    "JWT_SECRET and JWT_REFRESH_SECRET must be different. Using the same value lets refresh tokens be replayed as access tokens.",
  );
}

type SignablePayload = Omit<JwtPayload, "iat" | "exp" | "tokenUse">;

function signToken(
  payload: SignablePayload,
  tokenUse: TokenUse,
  secret: string,
  expiresIn: SignOptions["expiresIn"],
): string {
  return jwt.sign({ ...payload, tokenUse }, secret, {
    algorithm: JWT_ALGORITHM,
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER,
    expiresIn,
    jwtid: randomUUID(),
  });
}

export function signAccessToken(payload: SignablePayload): string {
  return signToken(payload, "access", getRequiredEnv("JWT_SECRET"), JWT_EXPIRES_IN);
}

export function signRefreshToken(payload: SignablePayload): string {
  return signToken(payload, "refresh", getRequiredEnv("JWT_REFRESH_SECRET"), JWT_REFRESH_EXPIRES_IN);
}

export function signTokenPair(payload: SignablePayload): TokenPair {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export type VerifyFailureReason = "expired" | "invalid" | "wrong_token_use";

export type VerifyResult =
  | { ok: true; payload: JwtPayload }
  | { ok: false; reason: VerifyFailureReason };

function verifyToken(token: string, secret: string, expectedUse: TokenUse): VerifyResult {
  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, secret, {
      algorithms: [JWT_ALGORITHM],
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
    }) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { ok: false, reason: "expired" };
    }
    return { ok: false, reason: "invalid" };
  }

  if (decoded.tokenUse !== expectedUse) {
    return { ok: false, reason: "wrong_token_use" };
  }

  return { ok: true, payload: decoded };
}

export function verifyAccessToken(token: string): VerifyResult {
  return verifyToken(token, getRequiredEnv("JWT_SECRET"), "access");
}

export function verifyRefreshToken(token: string): VerifyResult {
  return verifyToken(token, getRequiredEnv("JWT_REFRESH_SECRET"), "refresh");
}

// AUTHMW-002: RFC 6750 says the Bearer scheme is case-insensitive. Reject
// only on missing header or non-bearer prefix; otherwise trim the remainder.
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }
  if (authHeader.slice(0, 7).toLowerCase() !== "bearer ") {
    return null;
  }
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}
