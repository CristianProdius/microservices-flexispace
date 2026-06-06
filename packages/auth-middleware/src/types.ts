export type Role = "USER" | "HOST" | "ADMIN";

export type TokenUse = "access" | "refresh";

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  hostVerified?: boolean;
  tokenUse?: TokenUse;
  iat?: number;
  exp?: number;
  /** JWT id — set by `jsonwebtoken` when `jwtid` is provided at sign time. */
  jti?: string;
}

/**
 * Single-purpose, non-session JWTs (email verification, password reset, etc).
 * Kept separate from session JwtPayload so middleware cannot accidentally
 * accept a verification token as an access token.
 */
export interface PurposeTokenPayload {
  userId: string;
  email: string;
  purpose: "email-verification";
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  userId: string;
  email: string;
  role: Role;
  hostVerified?: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      userId?: string;
      actingHostId?: string;
      realUserId?: string;
    }
  }
}
