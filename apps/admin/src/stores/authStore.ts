import { create } from "zustand";
import * as auth from "@/lib/auth";
import type { AuthResponse, User } from "@/lib/auth";

// Refresh proactively when the access token has this many seconds (or fewer)
// of remaining lifetime. Keeps `getToken` from racing the real expiry while
// avoiding a refresh on every call.
const REFRESH_SAFETY_WINDOW_SECONDS = 30;
const ACTING_HOST_STORAGE_KEY = "spacefly_acting_host";

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

// Timestamp (ms epoch) of the last GENUINE session-expiry rejection (a
// SessionExpiredError / real 401). While we're inside the cool-off window we
// refuse to issue another refresh with what is almost certainly the same
// stale refresh token the server has already rejected — a fresh attempt would
// just burn another rotation. Transient errors (network/5xx, auth-service
// unreachable) deliberately do NOT set this (AUD-B5) so a blip during the
// rotation window doesn't bounce in-flight work to /login; they bubble to
// callers to retry instead. Cleared on next successful refresh (AUD-034).
const REFRESH_FAILURE_COOLDOWN_MS = 5_000;
let lastRefreshErrorAt: number | null = null;

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isHost: boolean;
  isHostOrAdmin: boolean;
  actingHostId: string | null;
  setActingHost: (id: string | null) => void;
  login: (
    email: string,
    password: string
  ) => Promise<{ user: User; requiresPasswordChange: boolean }>;
  setSession: (session: AuthResponse) => void;
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
  actingHostId:
    typeof window !== "undefined"
      ? window.localStorage.getItem(ACTING_HOST_STORAGE_KEY)
      : null,

  initialize: async () => {
    // Only run on client side
    if (typeof window === "undefined") {
      set({ isLoading: false });
      return;
    }

    const loggedOut = {
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      isHost: false,
      isHostOrAdmin: false,
    } as const;

    const user = auth.getStoredUser();
    const token = auth.getAccessToken();

    // No stored credentials → clean logged-out state. We never touch the
    // auth-service, so a fresh/incognito visitor sees no 401s.
    if (!token || !user) {
      set({
        ...loggedOut,
        actingHostId: window.localStorage.getItem(ACTING_HOST_STORAGE_KEY),
        isLoading: false,
      });
      return;
    }

    // Optimistically surface the stored session while we validate it.
    set({
      user,
      token,
      isAuthenticated: true,
      isAdmin: user.role === "ADMIN",
      isHost: user.role === "HOST",
      isHostOrAdmin: user.role === "HOST" || user.role === "ADMIN",
      actingHostId: window.localStorage.getItem(ACTING_HOST_STORAGE_KEY),
      isLoading: true,
    });

    // Access token still good → ready to go, no network call.
    if (!isTokenNearExpiry(token)) {
      set({ isLoading: false });
      return;
    }

    // The access token has lapsed (its cookie has too — both are 15-min TTL).
    // Recover the session BEFORE any dashboard guard probes /auth/me with the
    // expired cookie; otherwise a returning visitor's lapsed-or-dead session
    // surfaces as 401s on /auth/me and /auth/refresh in the console.
    const refreshToken = auth.getRefreshToken();
    if (!refreshToken) {
      // Expired access token and nothing to refresh with → dead session.
      auth.clearAuth();
      set({ ...loggedOut, isLoading: false });
      return;
    }

    try {
      const { accessToken, refreshToken: rotated } =
        await auth.refreshAccessToken(refreshToken);
      // Persist the ROTATED refresh token so the next refresh presents the
      // current child jti, not the already-used parent (which the server
      // treats as reuse → revokes the chain → forces a second login).
      auth.saveTokens(accessToken, rotated);
      set({ token: accessToken, isLoading: false });
    } catch (error) {
      if (error instanceof auth.SessionExpiredError) {
        // Refresh token is dead — clear the session so guards skip their
        // /auth/me probe and the user gets a clean login (refreshAccessToken
        // has already wiped localStorage).
        auth.clearAuth();
        set({ ...loggedOut, isLoading: false });
      } else {
        // Transient / auth-service unreachable: keep the optimistic session
        // (AUD-034 — don't bounce on a blip) and let getToken retry on demand.
        set({ isLoading: false });
      }
    }
  },

  login: async (email: string, password: string) => {
    const response = await auth.login(email, password);

    if (response.user.role !== "ADMIN" && response.user.role !== "HOST") {
      throw new Error("Host or admin access required");
    }

    auth.saveTokens(response.accessToken, response.refreshToken);
    auth.saveUser(response.user);
    // Clear any stale acting-host selection so a fresh session starts clean,
    // even if a previous admin selection lingered in localStorage.
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACTING_HOST_STORAGE_KEY);
    }
    set({
      user: response.user,
      token: response.accessToken,
      isAuthenticated: true,
      isAdmin: response.user.role === "ADMIN",
      isHost: response.user.role === "HOST",
      isHostOrAdmin: true,
      actingHostId: null,
    });
    return {
      user: response.user,
      requiresPasswordChange: response.requiresPasswordChange === true,
    };
  },

  setSession: (session: AuthResponse) => {
    auth.saveTokens(session.accessToken, session.refreshToken);
    auth.saveUser(session.user);
    // Clear any stale acting-host selection so a fresh session starts clean.
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACTING_HOST_STORAGE_KEY);
    }
    set({
      user: session.user,
      token: session.accessToken,
      isAuthenticated: true,
      isAdmin: session.user.role === "ADMIN",
      isHost: session.user.role === "HOST",
      isHostOrAdmin: true,
      actingHostId: null,
    });
  },

  setActingHost: (id: string | null) => {
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem(ACTING_HOST_STORAGE_KEY, id);
      else window.localStorage.removeItem(ACTING_HOST_STORAGE_KEY);
    }
    set({ actingHostId: id });
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
      lastRefreshErrorAt = null;
      auth.clearAuth();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(ACTING_HOST_STORAGE_KEY);
      }
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        isHost: false,
        isHostOrAdmin: false,
        actingHostId: null,
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

    // Cool-off: if a recent refresh just failed, don't burn another rotation
    // against the same stale refresh token. Return null so callers route to
    // /login rather than thrash the auth server (AUD-034).
    if (
      lastRefreshErrorAt !== null &&
      Date.now() - lastRefreshErrorAt < REFRESH_FAILURE_COOLDOWN_MS
    ) {
      return null;
    }

    // Share a single in-flight refresh across concurrent callers so we don't
    // race the refresh-token rotation.
    //
    // AUD-034: clearing `inFlightRefresh` synchronously inside the IIFE's
    // `finally` would null it out *before* awaiters of the returned promise
    // get to resume — so a `getToken()` call arriving in the same tick (after
    // the clear, before its own `getAccessToken()` re-read) would observe
    // `null` and kick off a second refresh with the now-rotated token. Defer
    // the clear via `queueMicrotask` / `setTimeout(0)` so any awaiter that
    // started during the same tick still sees the resolved promise.
    if (!inFlightRefresh) {
      const scheduleClear = () => {
        if (typeof queueMicrotask === "function") {
          queueMicrotask(() => {
            inFlightRefresh = null;
          });
        } else {
          setTimeout(() => {
            inFlightRefresh = null;
          }, 0);
        }
      };

      inFlightRefresh = (async () => {
        let succeeded = false;
        try {
          const { accessToken, refreshToken: rotated } =
            await auth.refreshAccessToken(refreshToken);
          // Persist the ROTATED refresh token in lockstep with the cookie so
          // the next cycle never replays an already-used parent jti.
          auth.saveTokens(accessToken, rotated);
          set({ token: accessToken });
          lastRefreshErrorAt = null;
          succeeded = true;
          return accessToken;
        } catch (error) {
          // AUD-B5: only a GENUINE session-expiry (auth-service explicitly
          // rejected our refresh token → SessionExpiredError / real 401) arms
          // the cool-off. A transient blip (network/5xx, auth-service
          // unreachable) must NOT set lastRefreshErrorAt — otherwise one flaky
          // refresh during the rotation window bounces in-flight work to
          // /login for 5s (dropping mutations as UnauthenticatedError). We let
          // such errors bubble so callers can retry, mirroring how
          // initialize() preserves its optimistic session on a transient blip.
          if (error instanceof auth.SessionExpiredError) {
            lastRefreshErrorAt = Date.now();
          }
          // Eager clear on rejection so the cool-off path above (genuine
          // expiry) — or a clean retry (transient) — governs the next call,
          // not a re-await of this rejected promise.
          inFlightRefresh = null;
          throw error;
        } finally {
          // On success, defer the clear by one microtask so co-tick awaiters
          // can still resolve against the same promise. On any rejection we
          // already eager-cleared above; a transient error leaves
          // lastRefreshErrorAt untouched, so keying off `succeeded` (not
          // lastRefreshErrorAt) avoids a deferred clear clobbering a fresh
          // refresh a retrying caller may have already started (AUD-B5).
          if (succeeded) {
            scheduleClear();
          }
        }
      })();
    }

    // Bubble refresh errors instead of silently logging the user out, EXCEPT
    // when the auth-service explicitly rejected our refresh token (401). A
    // SessionExpiredError means the session is dead, so self-heal: drop the
    // stale state and return null so the caller routes cleanly to /login
    // rather than thrashing the server with a token it has already rejected.
    // Other errors (auth-service unreachable) still bubble so callers can
    // distinguish a transient blip from "no session".
    try {
      return await inFlightRefresh;
    } catch (error) {
      if (error instanceof auth.SessionExpiredError) {
        // refreshAccessToken already cleared localStorage; sync the store.
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
          isHost: false,
          isHostOrAdmin: false,
        });
        return null;
      }
      throw error;
    }
  },
}));

export default useAuthStore;
