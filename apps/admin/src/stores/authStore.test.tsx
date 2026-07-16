import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshAccessToken: vi.fn(),
  bootstrapSessionFromCookie: vi.fn(),
  saveTokens: vi.fn(),
  saveUser: vi.fn(),
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
  getStoredUser: vi.fn(),
  clearAuth: vi.fn(),
  SessionExpiredError: class SessionExpiredError extends Error {
    constructor(message = "Session expired") {
      super(message);
      this.name = "SessionExpiredError";
    }
  },
}));

import * as auth from "@/lib/auth";

const base64Url = (input: string) =>
  Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const makeJwt = (expSeconds: number) => {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ exp: expSeconds }));
  return `${header}.${payload}.signature`;
};

const resetState = async () => {
  const mod = await import("./authStore");
  // Reset to a clean slate so concurrent tests don't share refresh promises.
  mod.default.setState({ user: null, token: null });
};

describe("authStore", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    // Reset the URL so route-gated logic (cookie bootstrap) starts from a
    // neutral, non-protected path unless a test opts in.
    window.history.pushState({}, "", "/");
    await resetState();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("isTokenNearExpiry", () => {
    it("returns false for a token comfortably in the future", async () => {
      const { isTokenNearExpiry } = await import("./authStore");
      const now = 1_000_000_000_000;
      const token = makeJwt(Math.floor(now / 1000) + 60 * 60); // +1h
      expect(isTokenNearExpiry(token, now)).toBe(false);
    });

    it("returns true for an already-expired token", async () => {
      const { isTokenNearExpiry } = await import("./authStore");
      const now = 1_000_000_000_000;
      const token = makeJwt(Math.floor(now / 1000) - 60);
      expect(isTokenNearExpiry(token, now)).toBe(true);
    });

    it("returns true when token expires inside the safety window", async () => {
      const { isTokenNearExpiry } = await import("./authStore");
      const now = 1_000_000_000_000;
      const token = makeJwt(Math.floor(now / 1000) + 5); // +5s, within 30s window
      expect(isTokenNearExpiry(token, now)).toBe(true);
    });

    it("returns true for malformed tokens", async () => {
      const { isTokenNearExpiry } = await import("./authStore");
      expect(isTokenNearExpiry("not-a-jwt")).toBe(true);
      expect(isTokenNearExpiry("only.one")).toBe(true);
    });

    it("returns true when the exp claim is missing", async () => {
      const { isTokenNearExpiry } = await import("./authStore");
      const header = base64Url(JSON.stringify({ alg: "HS256" }));
      const payload = base64Url(JSON.stringify({ sub: "u1" }));
      expect(isTokenNearExpiry(`${header}.${payload}.sig`)).toBe(true);
    });
  });

  describe("initialize", () => {
    const adminUser = { id: "u1", email: "a@b.c", username: "a", name: null, role: "ADMIN", image: null };

    it("logs out without calling the auth-service when nothing is stored", async () => {
      vi.mocked(auth.getStoredUser).mockReturnValue(null);
      vi.mocked(auth.getAccessToken).mockReturnValue(null);

      const { default: store } = await import("./authStore");
      await store.getState().initialize();

      const s = store.getState();
      expect(s.isAuthenticated).toBe(false);
      expect(s.isLoading).toBe(false);
      expect(auth.refreshAccessToken).not.toHaveBeenCalled();
    });

    it("stays authenticated without refreshing when the stored token is fresh", async () => {
      const fresh = makeJwt(Math.floor(Date.now() / 1000) + 60 * 60);
      vi.mocked(auth.getStoredUser).mockReturnValue(adminUser as never);
      vi.mocked(auth.getAccessToken).mockReturnValue(fresh);

      const { default: store } = await import("./authStore");
      await store.getState().initialize();

      const s = store.getState();
      expect(s.isAuthenticated).toBe(true);
      expect(s.isAdmin).toBe(true);
      expect(s.isLoading).toBe(false);
      expect(auth.refreshAccessToken).not.toHaveBeenCalled();
    });

    it("recovers a stale session by refreshing before the app probes /me", async () => {
      const stale = makeJwt(Math.floor(Date.now() / 1000) - 1);
      const refreshed = makeJwt(Math.floor(Date.now() / 1000) + 60 * 60);
      vi.mocked(auth.getStoredUser).mockReturnValue(adminUser as never);
      vi.mocked(auth.getAccessToken).mockReturnValue(stale);
      vi.mocked(auth.getRefreshToken).mockReturnValue("refresh-1");
      vi.mocked(auth.refreshAccessToken).mockResolvedValue({
        accessToken: refreshed,
        refreshToken: "refresh-2",
      });

      const { default: store } = await import("./authStore");
      await store.getState().initialize();

      const s = store.getState();
      expect(s.isAuthenticated).toBe(true);
      expect(s.token).toBe(refreshed);
      // The ROTATED refresh token must be persisted, not the stale one we sent.
      expect(auth.saveTokens).toHaveBeenCalledWith(refreshed, "refresh-2");
      expect(s.isLoading).toBe(false);
    });

    it("clears the dead session when the boot refresh is rejected (401)", async () => {
      const stale = makeJwt(Math.floor(Date.now() / 1000) - 1);
      vi.mocked(auth.getStoredUser).mockReturnValue(adminUser as never);
      vi.mocked(auth.getAccessToken).mockReturnValue(stale);
      vi.mocked(auth.getRefreshToken).mockReturnValue("dead-refresh");
      vi.mocked(auth.refreshAccessToken).mockRejectedValue(
        new auth.SessionExpiredError("expired")
      );

      const { default: store } = await import("./authStore");
      await store.getState().initialize();

      const s = store.getState();
      expect(s.isAuthenticated).toBe(false);
      expect(s.user).toBeNull();
      expect(auth.clearAuth).toHaveBeenCalled();
      expect(s.isLoading).toBe(false);
    });

    it("logs out when the access token is stale and there is no refresh token", async () => {
      const stale = makeJwt(Math.floor(Date.now() / 1000) - 1);
      vi.mocked(auth.getStoredUser).mockReturnValue(adminUser as never);
      vi.mocked(auth.getAccessToken).mockReturnValue(stale);
      vi.mocked(auth.getRefreshToken).mockReturnValue(null);

      const { default: store } = await import("./authStore");
      await store.getState().initialize();

      const s = store.getState();
      expect(s.isAuthenticated).toBe(false);
      expect(auth.clearAuth).toHaveBeenCalled();
      expect(auth.refreshAccessToken).not.toHaveBeenCalled();
      expect(s.isLoading).toBe(false);
    });

    it("keeps the optimistic session on a transient (non-401) refresh failure", async () => {
      const stale = makeJwt(Math.floor(Date.now() / 1000) - 1);
      vi.mocked(auth.getStoredUser).mockReturnValue(adminUser as never);
      vi.mocked(auth.getAccessToken).mockReturnValue(stale);
      vi.mocked(auth.getRefreshToken).mockReturnValue("refresh-1");
      vi.mocked(auth.refreshAccessToken).mockRejectedValue(
        new Error("auth-service unreachable")
      );

      const { default: store } = await import("./authStore");
      await store.getState().initialize();

      const s = store.getState();
      expect(s.isAuthenticated).toBe(true);
      expect(auth.clearAuth).not.toHaveBeenCalled();
      expect(s.isLoading).toBe(false);
    });

    describe("cross-subdomain SSO cookie bootstrap", () => {
      const hostUser = {
        id: "h1",
        email: "host@b.c",
        username: "host",
        name: "Host",
        role: "HOST",
        image: null,
      };

      it("hydrates the session from the .spacefly.ai cookie when localStorage is cold on a protected route", async () => {
        // Repro: a host logs in on the public client (spacefly.ai) and clicks
        // "Host Dashboard", arriving at admin.spacefly.ai/host via a full
        // cross-origin load. This origin's localStorage is empty, but the
        // browser holds the shared HttpOnly session cookie — hydrate from it
        // instead of bouncing to /login (the spurious second login).
        window.history.pushState({}, "", "/host");
        const fresh = makeJwt(Math.floor(Date.now() / 1000) + 60 * 60);
        vi.mocked(auth.getStoredUser).mockReturnValue(null);
        vi.mocked(auth.getAccessToken).mockReturnValue(null);
        vi.mocked(auth.bootstrapSessionFromCookie).mockResolvedValue({
          user: hostUser as never,
          accessToken: fresh,
          refreshToken: "cookie-refresh",
        });

        const { default: store } = await import("./authStore");
        await store.getState().initialize();

        const s = store.getState();
        expect(s.isAuthenticated).toBe(true);
        expect(s.isHost).toBe(true);
        expect(s.isHostOrAdmin).toBe(true);
        expect(s.token).toBe(fresh);
        expect(s.isLoading).toBe(false);
        // Persist the cookie-minted credentials so bearer-based apiFetch works.
        expect(auth.saveTokens).toHaveBeenCalledWith(fresh, "cookie-refresh");
        expect(auth.saveUser).toHaveBeenCalledWith(hostUser);
      });

      it("does NOT probe the cookie on a public route (anon visitor to /login makes no auth-service call)", async () => {
        window.history.pushState({}, "", "/login");
        vi.mocked(auth.getStoredUser).mockReturnValue(null);
        vi.mocked(auth.getAccessToken).mockReturnValue(null);

        const { default: store } = await import("./authStore");
        await store.getState().initialize();

        const s = store.getState();
        expect(s.isAuthenticated).toBe(false);
        expect(s.isLoading).toBe(false);
        expect(auth.bootstrapSessionFromCookie).not.toHaveBeenCalled();
      });

      it("stays logged out when no cookie session exists on a protected route", async () => {
        window.history.pushState({}, "", "/host");
        vi.mocked(auth.getStoredUser).mockReturnValue(null);
        vi.mocked(auth.getAccessToken).mockReturnValue(null);
        vi.mocked(auth.bootstrapSessionFromCookie).mockResolvedValue(null);

        const { default: store } = await import("./authStore");
        await store.getState().initialize();

        const s = store.getState();
        expect(s.isAuthenticated).toBe(false);
        expect(s.user).toBeNull();
        expect(s.isLoading).toBe(false);
      });
    });
  });

  describe("getToken", () => {
    it("returns null when no access token is stored", async () => {
      vi.mocked(auth.getAccessToken).mockReturnValue(null);
      const { default: store } = await import("./authStore");
      const token = await store.getState().getToken();
      expect(token).toBeNull();
      expect(auth.refreshAccessToken).not.toHaveBeenCalled();
    });

    it("returns the stored token without refreshing when it is still fresh", async () => {
      const fresh = makeJwt(Math.floor(Date.now() / 1000) + 60 * 60);
      vi.mocked(auth.getAccessToken).mockReturnValue(fresh);
      const { default: store } = await import("./authStore");
      const token = await store.getState().getToken();
      expect(token).toBe(fresh);
      expect(auth.refreshAccessToken).not.toHaveBeenCalled();
    });

    it("refreshes when the stored token is near expiry", async () => {
      const stale = makeJwt(Math.floor(Date.now() / 1000) - 1);
      const refreshed = makeJwt(Math.floor(Date.now() / 1000) + 60 * 60);
      vi.mocked(auth.getAccessToken).mockReturnValue(stale);
      vi.mocked(auth.getRefreshToken).mockReturnValue("refresh-1");
      vi.mocked(auth.refreshAccessToken).mockResolvedValue({
        accessToken: refreshed,
        refreshToken: "refresh-2",
      });

      const { default: store } = await import("./authStore");
      const token = await store.getState().getToken();
      expect(token).toBe(refreshed);
      expect(auth.refreshAccessToken).toHaveBeenCalledTimes(1);
      // The ROTATED refresh token must be persisted, not the stale one we sent.
      expect(auth.saveTokens).toHaveBeenCalledWith(refreshed, "refresh-2");
    });

    it("shares a single in-flight refresh across concurrent callers", async () => {
      const stale = makeJwt(Math.floor(Date.now() / 1000) - 1);
      const refreshed = makeJwt(Math.floor(Date.now() / 1000) + 60 * 60);
      vi.mocked(auth.getAccessToken).mockReturnValue(stale);
      vi.mocked(auth.getRefreshToken).mockReturnValue("refresh-1");

      let resolveRefresh!: (value: { accessToken: string; refreshToken: string }) => void;
      vi.mocked(auth.refreshAccessToken).mockImplementation(
        () =>
          new Promise<{ accessToken: string; refreshToken: string }>((resolve) => {
            resolveRefresh = resolve;
          })
      );

      const { default: store } = await import("./authStore");
      const p1 = store.getState().getToken();
      const p2 = store.getState().getToken();
      const p3 = store.getState().getToken();

      resolveRefresh({ accessToken: refreshed, refreshToken: "refresh-2" });
      const [t1, t2, t3] = await Promise.all([p1, p2, p3]);

      expect(t1).toBe(refreshed);
      expect(t2).toBe(refreshed);
      expect(t3).toBe(refreshed);
      expect(auth.refreshAccessToken).toHaveBeenCalledTimes(1);
    });

    it("returns null when access token is stale and no refresh token exists", async () => {
      const stale = makeJwt(Math.floor(Date.now() / 1000) - 1);
      vi.mocked(auth.getAccessToken).mockReturnValue(stale);
      vi.mocked(auth.getRefreshToken).mockReturnValue(null);

      const { default: store } = await import("./authStore");
      const token = await store.getState().getToken();
      expect(token).toBeNull();
      expect(auth.refreshAccessToken).not.toHaveBeenCalled();
    });

    it("throws when refresh fails so callers can distinguish from no-session", async () => {
      const stale = makeJwt(Math.floor(Date.now() / 1000) - 1);
      vi.mocked(auth.getAccessToken).mockReturnValue(stale);
      vi.mocked(auth.getRefreshToken).mockReturnValue("refresh-1");
      vi.mocked(auth.refreshAccessToken).mockRejectedValue(
        new Error("auth-service unreachable")
      );

      const { default: store } = await import("./authStore");
      await expect(store.getState().getToken()).rejects.toThrow(
        "auth-service unreachable"
      );
    });

    it("logs out and returns null when refresh fails with SessionExpiredError", async () => {
      const stale = makeJwt(Math.floor(Date.now() / 1000) - 1);
      vi.mocked(auth.getAccessToken).mockReturnValue(stale);
      vi.mocked(auth.getRefreshToken).mockReturnValue("dead-refresh");
      vi.mocked(auth.refreshAccessToken).mockRejectedValue(
        new auth.SessionExpiredError("expired")
      );

      const { default: store } = await import("./authStore");
      const token = await store.getState().getToken();
      expect(token).toBeNull();
      expect(store.getState().isAuthenticated).toBe(false);
      expect(store.getState().user).toBeNull();
    });

    it("does NOT cool off after a TRANSIENT refresh failure — it bubbles and the next call retries (AUD-B5)", async () => {
      // A transient blip (network/5xx) must not arm the cool-off, or one flaky
      // refresh during the rotation window would bounce in-flight work to
      // /login for 5s. getToken bubbles the error so the caller can retry, and
      // the very next call refreshes again rather than returning null.
      const stale = makeJwt(Math.floor(Date.now() / 1000) - 1);
      const refreshed = makeJwt(Math.floor(Date.now() / 1000) + 60 * 60);
      vi.mocked(auth.getAccessToken).mockReturnValue(stale);
      vi.mocked(auth.getRefreshToken).mockReturnValue("refresh-1");
      vi.mocked(auth.refreshAccessToken)
        .mockRejectedValueOnce(new Error("transient"))
        .mockResolvedValueOnce({ accessToken: refreshed, refreshToken: "refresh-2" });

      const { default: store } = await import("./authStore");
      await expect(store.getState().getToken()).rejects.toThrow("transient");

      // No cool-off: the next call retries the refresh and succeeds.
      const recovered = await store.getState().getToken();
      expect(recovered).toBe(refreshed);
      expect(auth.refreshAccessToken).toHaveBeenCalledTimes(2);
    });
  });
});
