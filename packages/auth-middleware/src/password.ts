import bcrypt from "bcryptjs";

export class InvalidPasswordError extends Error {
  constructor(message = "Password must be 8–72 characters") {
    super(message);
    this.name = "InvalidPasswordError";
  }
}

// bcrypt cost factor. Must be an integer between 10 and 15. Defaults to 12.
// Values <10 are a security regression; values >15 are impractical for login
// latency. We reject anything outside this window (including NaN from garbage
// env values such as "abc" or "0") and fall back to 12 with a warning.
const RAW_BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS;
const PARSED_BCRYPT_ROUNDS = RAW_BCRYPT_ROUNDS !== undefined ? Number(RAW_BCRYPT_ROUNDS) : NaN;
const BCRYPT_ROUNDS =
  Number.isInteger(PARSED_BCRYPT_ROUNDS) && PARSED_BCRYPT_ROUNDS >= 10 && PARSED_BCRYPT_ROUNDS <= 15
    ? PARSED_BCRYPT_ROUNDS
    : 12;
if (RAW_BCRYPT_ROUNDS !== undefined && BCRYPT_ROUNDS !== PARSED_BCRYPT_ROUNDS) {
  // eslint-disable-next-line no-console
  console.warn(
    `[auth-middleware] BCRYPT_ROUNDS=${RAW_BCRYPT_ROUNDS} invalid (must be integer 10..15); falling back to 12`,
  );
}

export async function hashPassword(password: string): Promise<string> {
  // Defence in depth: zod schemas in @repo/types validate at the boundary, but
  // route handlers may bypass them. bcrypt silently truncates inputs >72 bytes
  // and a multi-MB password is a trivial CPU DoS vector — reject both here.
  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    throw new InvalidPasswordError("Password must be 8–72 characters");
  }
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Intentionally no length guard here: legacy hashes may have been created
// before this guard existed, and rejecting them would lock users out.
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
