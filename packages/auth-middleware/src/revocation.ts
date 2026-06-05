/**
 * Pluggable access-token revocation check.
 *
 * The auth-middleware package is intentionally DB-free. Services that maintain
 * a revocation store (e.g. auth-service writes to a `RevokedAccessToken`
 * table on logout / password change) install a checker at startup via
 * `setRevocationChecker`. Middleware then calls it on every authenticated
 * request to reject access tokens whose `jti` has been revoked.
 *
 * If no checker is installed (default), revocation is effectively a no-op —
 * which preserves backwards behaviour for services that have not yet wired
 * the store up.
 */

export type RevocationChecker = (jti: string) => Promise<boolean>;

let checker: RevocationChecker | null = null;

export function setRevocationChecker(fn: RevocationChecker | null): void {
  checker = fn;
}

export async function isAccessTokenRevoked(jti: string | undefined): Promise<boolean> {
  if (!jti || !checker) return false;
  try {
    return await checker(jti);
  } catch (error) {
    // Fail-closed: if the revocation store is unreachable, reject the token
    // rather than letting a potentially-revoked token through.
    console.error("[auth-middleware] revocation check failed:", error);
    return true;
  }
}
