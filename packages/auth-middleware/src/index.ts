// Types
export type { JwtPayload, AuthUser, TokenPair, Role } from "./types.js";

// JWT utilities
export {
  signAccessToken,
  signRefreshToken,
  signTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
} from "./jwt.js";

// Password utilities
export { hashPassword, comparePassword } from "./password.js";

// Express middleware
export {
  shouldBeUser as shouldBeUserExpress,
  shouldBeAdmin as shouldBeAdminExpress,
  shouldBeHost as shouldBeHostExpress,
  shouldBeHostOrAdmin as shouldBeHostOrAdminExpress,
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
