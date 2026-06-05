/**
 * Validate a `?redirect=...` value before passing it to `router.push`.
 *
 * Returns the path itself if it is a same-origin, relative path; otherwise
 * returns the supplied fallback (default "/").
 *
 * Hardening notes:
 * - Rejects protocol-relative URLs (`//evil.com`, normalized from `/\evil.com`)
 *   that browsers may interpret as cross-origin.
 * - Rejects any input containing backslashes — browsers normalize `\` to `/`,
 *   so `/\evil.com` becomes `//evil.com` post-normalization and bypasses a
 *   naive `startsWith("//")` check.
 * - Rejects anything containing `://` before parsing so we don't accidentally
 *   accept absolute URLs to other origins.
 * - Validates the resolved URL's origin matches `window.location.origin`.
 */
export function safeRedirectPath(
  redirectTo: string | null | undefined,
  fallback = "/"
): string {
  if (!redirectTo) return fallback;
  if (typeof redirectTo !== "string") return fallback;

  // Reject suspicious characters before any parsing.
  if (
    redirectTo.includes("\\") ||
    redirectTo.includes("://") ||
    !redirectTo.startsWith("/") ||
    redirectTo.startsWith("//")
  ) {
    return fallback;
  }

  if (typeof window === "undefined") {
    // SSR: trust the simple prefix check above (we already rejected `//`,
    // `\`, `://`, and anything not starting with `/`).
    return redirectTo;
  }

  try {
    const url = new URL(redirectTo, window.location.origin);
    if (url.origin !== window.location.origin) {
      return fallback;
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
