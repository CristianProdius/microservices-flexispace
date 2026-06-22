/**
 * Host-invite token helpers.
 *
 * The raw token is emailed (base64url of 32 random bytes); only its
 * sha-256 hash is ever stored (Invite.tokenHash), mirroring the
 * password-reset best practice. A leaked DB row cannot be replayed
 * against the accept endpoint because the raw token is non-derivable
 * from the hash.
 */
import { randomBytes, createHash } from "crypto";

export const INVITE_TTL_DAYS = 7;

export function hashInviteToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateInviteToken(): { raw: string; tokenHash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, tokenHash: hashInviteToken(raw) };
}
