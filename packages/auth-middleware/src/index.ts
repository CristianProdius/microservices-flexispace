// Types
export type {
  JwtPayload,
  AuthUser,
  TokenPair,
  Role,
  TokenUse,
  PurposeTokenPayload,
} from "./types.js";

// JWT utilities
export {
  signAccessToken,
  signRefreshToken,
  signTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  signPasswordResetToken,
  verifyPasswordResetToken,
  signEmailVerificationToken,
  verifyEmailVerificationToken,
  extractTokenFromHeader,
  extractTokenFromCookieHeader,
  extractAccessToken,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "./jwt.js";
export type { VerifyResult, VerifyFailureReason, PasswordResetTokenPayload } from "./jwt.js";

// Password utilities
export { hashPassword, comparePassword, InvalidPasswordError } from "./password.js";

// Email normalization (AUTHMW-003)
export { normalizeEmail } from "./email.js";

// Access-token revocation hook
export {
  setRevocationChecker,
  isAccessTokenRevoked,
  type RevocationChecker,
} from "./revocation.js";

// Express middleware
export {
  shouldBeUser as shouldBeUserExpress,
  shouldBeAdmin as shouldBeAdminExpress,
  shouldBeHost as shouldBeHostExpress,
  shouldBeHostOrAdmin as shouldBeHostOrAdminExpress,
  resolveActingHost as resolveActingHostExpress,
} from "./express.js";

// Fastify middleware
export {
  shouldBeUser as shouldBeUserFastify,
  shouldBeAdmin as shouldBeAdminFastify,
  shouldBeHost as shouldBeHostFastify,
  shouldBeHostOrAdmin as shouldBeHostOrAdminFastify,
} from "./fastify.js";

// Hono middleware
export {
  shouldBeUser as shouldBeUserHono,
  shouldBeAdmin as shouldBeAdminHono,
  shouldBeHost as shouldBeHostHono,
  shouldBeHostOrAdmin as shouldBeHostOrAdminHono,
} from "./hono.js";
