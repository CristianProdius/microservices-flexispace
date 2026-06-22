import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { JwtPayload, PurposeTokenPayload, TokenPair, TokenUse } from "./types.js";

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "15m") as SignOptions["expiresIn"];
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as SignOptions["expiresIn"];
const JWT_PASSWORD_RESET_EXPIRES_IN =
  (process.env.JWT_PASSWORD_RESET_EXPIRES_IN || "30m") as SignOptions["expiresIn"];
const EMAIL_VERIFICATION_EXPIRES_IN = (process.env.EMAIL_VERIFICATION_EXPIRES_IN ||
  "24h") as SignOptions["expiresIn"];

const JWT_ALGORITHM = "HS256" as const;
const JWT_ISSUER = "spacefly";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "spacefly-api";

// AUTHMW: small leeway (seconds) applied to exp/nbf checks so a few seconds of
// NTP skew between the signing service (auth-service) and any verifying service
// (product/order, or a multi-host deployment) cannot reject a token in the last
// moments of its life or one minted on a slightly-fast clock. Standard
// distributed-JWT practice; 5s is well below any token TTL so it does not
// meaningfully extend a token's usable window.
const JWT_CLOCK_TOLERANCE_SECONDS = 5;

const getRequiredEnv = (
  name: "JWT_SECRET" | "JWT_REFRESH_SECRET" | "JWT_PASSWORD_RESET_SECRET" | "JWT_VERIFICATION_SECRET",
): string => {
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
  jti?: string,
): string {
  return jwt.sign({ ...payload, tokenUse }, secret, {
    algorithm: JWT_ALGORITHM,
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER,
    expiresIn,
    jwtid: jti ?? randomUUID(),
  });
}

export function signAccessToken(payload: SignablePayload): string {
  return signToken(payload, "access", getRequiredEnv("JWT_SECRET"), JWT_EXPIRES_IN);
}

/**
 * Sign a refresh token. Callers can supply a stable `jti` so the token can be
 * tracked in a server-side rotation chain (AUTHSVC-006). When omitted, a random
 * UUID is generated.
 */
export function signRefreshToken(
  payload: SignablePayload,
  options: { jti?: string } = {},
): string {
  return signToken(
    payload,
    "refresh",
    getRequiredEnv("JWT_REFRESH_SECRET"),
    JWT_REFRESH_EXPIRES_IN,
    options.jti,
  );
}

export function signTokenPair(
  payload: SignablePayload,
  options: { refreshJti?: string } = {},
): TokenPair {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload, { jti: options.refreshJti }),
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
      clockTolerance: JWT_CLOCK_TOLERANCE_SECONDS,
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
  // AUD-004: pin algorithm + issuer on the sign side too so the verify
  // helper (which now requires them) accepts these tokens.
  return jwt.sign(
    { ...payload, purpose: "password-reset" as const },
    getRequiredEnv("JWT_PASSWORD_RESET_SECRET"),
    {
      algorithm: JWT_ALGORITHM,
      issuer: JWT_ISSUER,
      expiresIn: JWT_PASSWORD_RESET_EXPIRES_IN,
      jwtid: options.jti,
    },
  );
}

export function verifyPasswordResetToken(
  token: string,
): PasswordResetTokenPayload | null {
  try {
    // AUD-004: pin the algorithm and issuer so a token signed with a
    // weaker/different alg (or by another issuer that happens to share the
    // secret in a misconfig) cannot be accepted here. No audience claim is
    // set on reset tokens (see signPasswordResetToken), so we don't pin one.
    const decoded = jwt.verify(
      token,
      getRequiredEnv("JWT_PASSWORD_RESET_SECRET"),
      {
        algorithms: [JWT_ALGORITHM],
        issuer: JWT_ISSUER,
        clockTolerance: JWT_CLOCK_TOLERANCE_SECONDS,
      },
    ) as PasswordResetTokenPayload & { jti?: string };
    if (decoded.purpose !== "password-reset") return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * AUTHSVC-004 / AUD-014: email-verification token. The `purpose` claim is
 * checked on verify so it cannot be substituted for an access token.
 *
 * AUD-014: previously this silently fell back to JWT_SECRET when the
 * verification-specific secret was unset, which meant a verification token
 * forged with the access secret would validate here. We now require
 * JWT_VERIFICATION_SECRET to be explicitly configured.
 */
const getVerificationSecret = (): string => {
  return getRequiredEnv("JWT_VERIFICATION_SECRET");
};

export function signEmailVerificationToken(
  payload: Omit<PurposeTokenPayload, "iat" | "exp" | "purpose">,
): string {
  // AUD-004: pin algorithm + issuer on the sign side so the verify helper
  // (which now requires them) accepts these tokens.
  return jwt.sign({ ...payload, purpose: "email-verification" as const }, getVerificationSecret(), {
    algorithm: JWT_ALGORITHM,
    issuer: JWT_ISSUER,
    expiresIn: EMAIL_VERIFICATION_EXPIRES_IN,
    jwtid: randomUUID(),
  });
}

export function verifyEmailVerificationToken(token: string): PurposeTokenPayload | null {
  try {
    // AUD-004: pin algorithm + issuer so a downgrade-attack token (e.g.
    // alg=none) or a token from a different issuer reusing the secret is
    // rejected. No audience set on these tokens.
    const decoded = jwt.verify(token, getVerificationSecret(), {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      clockTolerance: JWT_CLOCK_TOLERANCE_SECONDS,
    }) as PurposeTokenPayload;
    if (decoded.purpose !== "email-verification") return null;
    return decoded;
  } catch {
    return null;
  }
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
