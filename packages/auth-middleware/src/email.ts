/**
 * AUTHMW-003: canonical email normalization.
 *
 * Apply this at every entry point where an email enters the system
 * (registration, login lookup, forgot-password lookup, profile update).
 * Keep it OUT of Prisma `where` clauses on indexed columns so we don't
 * accidentally trigger a sequential scan via `LOWER(email)`.
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
