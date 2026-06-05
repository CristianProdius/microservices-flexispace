import { create } from "zustand";
import * as auth from "@/lib/auth";
import type { User } from "@/lib/auth";

// Refresh proactively when the access token has this many seconds (or fewer)
// of remaining lifetime. Keeps `getToken` from racing the real expiry while
// avoiding a refresh on every call.
const REFRESH_SAFETY_WINDOW_SECONDS = 30;

interface JwtPayload {
  exp?: number;
}

/**
 * Decode the payload of a JWT without verifying its signature. Returns `null`
 * for malformed tokens so callers can fall back to refreshing.
 */
const decodeJwtPayload = (token: string): JwtPayload | null => {
  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }

  const payloadSegment = segments[1];
  if (!payloadSegment) {
    return null;
  }

  try {
    // base64url -> base64
    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    const parsed: unknown = JSON.parse(json);
    if (parsed && typeof parsed === "object" && "exp" in parsed) {
      const exp = (parsed as { exp: unknown }).exp;
      if (typeof exp === "number") {
        return { exp };
      }
    }
    return {};
  } catch {
    return null;
  }
};

/**
 * Returns true when the token is missing an `exp` claim, has already expired,
 * or is within the refresh safety window of expiring.
 */
export const isTokenNearExpiry = (
  token: string,
  nowMs: number = Date.now(),
  safetyWindowSeconds: number = REFRESH_SAFETY_WINDOW_SECONDS
): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    // If we can't read the expiry, treat the token as stale so we refresh once
    // rather than handing back a potentially-expired credential.
    return true;
  }
  const expiresAtMs = payload.exp * 1000;
  return expiresAtMs - nowMs <= safetyWindowSeconds * 1000;
};

// Module-level single-flight refresh promise. Multiple concurrent `getToken`
// callers share the same in-flight refresh so we never burn more than one
// refresh-token rotation per refresh cycle.
let inFlightRefresh: Promise<string> | null = null;

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isHost: boolean;
  isHostOrAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  initialize: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isHost: false,
  isHostOrAdmin: false,

  initialize: () => {
    // Only run on client side
    if (typeof window === "undefined") {
      set({ isLoading: false });
      return;
    }

    const user = auth.getStoredUser();
    const token = auth.getAccessToken();
    set({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isAdmin: user?.role === "ADMIN",
      isHost: user?.role === "HOST",
      isHostOrAdmin: user?.role === "HOST" || user?.role === "ADMIN",
      isLoading: false,
    });
  },

  login: async (email: string, password: string) => {
    const response = await auth.login(email, password);

    if (response.user.role !== "ADMIN" && response.user.role !== "HOST") {
      throw new Error("Host or admin access required");
    }

    auth.saveTokens(response.accessToken, response.refreshToken);
    auth.saveUser(response.user);
    set({
      user: response.user,
      token: response.accessToken,
      isAuthenticated: true,
      isAdmin: response.user.role === "ADMIN",
      isHost: response.user.role === "HOST",
      isHostOrAdmin: true,
    });
  },

  logout: async () => {
    try {
      const refreshToken = auth.getRefreshToken();
      if (refreshToken) {
        await auth.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      inFlightRefresh = null;
      auth.clearAuth();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        isHost: false,
        isHostOrAdmin: false,
      });
    }
  },

  getToken: async () => {
    // Only run on client side
    if (typeof window === "undefined") {
      return null;
    }

    const token = auth.getAccessToken();
    if (!token) {
      // No session at all - callers should redirect to /login.
      return null;
    }

    // Happy path: current access token is still fresh enough to use.
    if (!isTokenNearExpiry(token)) {
      return token;
    }

    const refreshToken = auth.getRefreshToken();
    if (!refreshToken) {
      // We have an expired access token but no refresh token. Treat as logged
      // out so the caller routes to /login.
      return null;
    }

    // Share a single in-flight refresh across concurrent callers so we don't
    // race the refresh-token rotation.
    if (!inFlightRefresh) {
      inFlightRefresh = (async () => {
        try {
          const newToken = await auth.refreshAccessToken(refreshToken);
          auth.saveTokens(newToken, refreshToken);
          set({ token: newToken });
          return newToken;
        } finally {
          inFlightRefresh = null;
        }
      })();
    }

    // Bubble refresh errors instead of silently logging the user out. Callers
    // can then distinguish "auth service unreachable" from "no session" and
    // surface a real error rather than a mid-session bounce to /login.
    return inFlightRefresh;
  },
}));

export default useAuthStore;
