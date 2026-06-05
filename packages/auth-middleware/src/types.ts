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
    }
  }
}
