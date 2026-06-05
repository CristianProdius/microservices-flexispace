import useAuthStore from "@/stores/authStore";
import { getAccessToken, getRefreshToken, refreshAccessToken, saveTokens, isTokenExpired } from "./auth";

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export async function getValidToken(): Promise<string | null> {
  const token = getAccessToken();
  if (!token) return null;
  if (!isTokenExpired(token)) return token;

  // Token expired, refresh
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return null;
      const refreshed = await refreshAccessToken(refreshToken);
      // Persist whichever refresh token the server returned; rotation-enabled
      // backends invalidate the old one immediately.
      saveTokens(refreshed.accessToken, refreshed.refreshToken ?? refreshToken);
      return refreshed.accessToken;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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

  // On 401, try one refresh cycle for GET requests only
  if (response.status === 401) {
    const method = (options.method || "GET").toUpperCase();

    // For non-idempotent requests, don't auto-retry — surface the error
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      useAuthStore.getState().handleSessionExpired();
      return response;
    }

    // Try refresh for idempotent requests — force a fresh refresh cycle
    // by waiting for any in-flight refresh to complete first, then retrying
    if (isRefreshing && refreshPromise) {
      await refreshPromise;
    }
    isRefreshing = false;
    refreshPromise = null;
    const newToken = await getValidToken();

    if (!newToken) {
      useAuthStore.getState().handleSessionExpired();
      return response;
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
