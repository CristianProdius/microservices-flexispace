import useAuthStore from "@/stores/authStore";
import { getAccessToken, getRefreshToken, refreshAccessToken, saveTokens, isTokenExpired } from "./auth";
import { createSingleFlight } from "./singleFlight";

/**
 * Thrown by {@link fetchWithAuth} after the session is determined to be expired
 * (no refresh token, refresh failed, or a 401 was returned for a non-idempotent
 * request). The caller is being navigated to `/login`; this error exists so
 * downstream `.json()`/error-message logic does not surface the auth failure
 * as a business error.
 */
export class SessionExpiredError extends Error {
  constructor(message = "Session expired") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

/**
 * Single-flight refresh: both `getValidToken` (proactive, when the local token
 * looks expired) and `fetchWithAuth`'s 401 retry (reactive, when the server
 * rejects a token we thought was valid) funnel through this helper so
 * concurrent callers share one POST /auth/refresh. Auth services that rotate
 * refresh tokens on use would otherwise log the user out spuriously.
 */
const refreshTokenSingleFlight = createSingleFlight<string | null>(async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;
    const refreshed = await refreshAccessToken(refreshToken);
    // Persist whichever refresh token the server returned; rotation-enabled
    // backends invalidate the old one immediately (CLIENT-015).
    const nextAccess = typeof refreshed === "string" ? refreshed : refreshed.accessToken;
    const nextRefresh =
      typeof refreshed === "string"
        ? refreshToken
        : refreshed.refreshToken ?? refreshToken;
    saveTokens(nextAccess, nextRefresh);
    return nextAccess;
  } catch {
    return null;
  }
});

export async function getValidToken(): Promise<string | null> {
  const token = getAccessToken();
  if (!token) return null;
  if (!isTokenExpired(token)) return token;
  return refreshTokenSingleFlight();
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getValidToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });

  // On 401, try one refresh cycle for idempotent requests only.
  if (response.status === 401) {
    const method = (options.method || "GET").toUpperCase();

    // For non-idempotent requests, don't auto-retry — surface the auth error
    // so the caller doesn't accidentally double-submit.
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      useAuthStore.getState().handleSessionExpired();
      throw new SessionExpiredError();
    }

    // For idempotent requests: refresh and retry once. We funnel through the
    // same single-flight helper that `getValidToken` uses, so concurrent 401s
    // coalesce into a single POST /auth/refresh.
    const newToken = await refreshTokenSingleFlight();

    if (!newToken) {
      useAuthStore.getState().handleSessionExpired();
      throw new SessionExpiredError();
    }

    const retryHeaders = new Headers(options.headers);
    retryHeaders.set("Authorization", `Bearer ${newToken}`);
    if (!retryHeaders.has("Content-Type") && options.body) {
      retryHeaders.set("Content-Type", "application/json");
    }
    return fetch(url, { ...options, headers: retryHeaders });
  }

  return response;
}
