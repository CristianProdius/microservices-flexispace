import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshAccessToken: vi.fn(),
  saveTokens: vi.fn(),
  saveUser: vi.fn(),
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
  getStoredUser: vi.fn(),
  clearAuth: vi.fn(),
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
      vi.mocked(auth.refreshAccessToken).mockResolvedValue(refreshed);

      const { default: store } = await import("./authStore");
      const token = await store.getState().getToken();
      expect(token).toBe(refreshed);
      expect(auth.refreshAccessToken).toHaveBeenCalledTimes(1);
      expect(auth.saveTokens).toHaveBeenCalledWith(refreshed, "refresh-1");
    });

    it("shares a single in-flight refresh across concurrent callers", async () => {
      const stale = makeJwt(Math.floor(Date.now() / 1000) - 1);
      const refreshed = makeJwt(Math.floor(Date.now() / 1000) + 60 * 60);
      vi.mocked(auth.getAccessToken).mockReturnValue(stale);
      vi.mocked(auth.getRefreshToken).mockReturnValue("refresh-1");

      let resolveRefresh!: (value: string) => void;
      vi.mocked(auth.refreshAccessToken).mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            resolveRefresh = resolve;
          })
      );

      const { default: store } = await import("./authStore");
      const p1 = store.getState().getToken();
      const p2 = store.getState().getToken();
      const p3 = store.getState().getToken();

      resolveRefresh(refreshed);
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

    it("retries after a previous refresh failure (clears in-flight slot)", async () => {
      const stale = makeJwt(Math.floor(Date.now() / 1000) - 1);
      const refreshed = makeJwt(Math.floor(Date.now() / 1000) + 60 * 60);
      vi.mocked(auth.getAccessToken).mockReturnValue(stale);
      vi.mocked(auth.getRefreshToken).mockReturnValue("refresh-1");
      vi.mocked(auth.refreshAccessToken)
        .mockRejectedValueOnce(new Error("transient"))
        .mockResolvedValueOnce(refreshed);

      const { default: store } = await import("./authStore");
      await expect(store.getState().getToken()).rejects.toThrow("transient");
      const second = await store.getState().getToken();
      expect(second).toBe(refreshed);
      expect(auth.refreshAccessToken).toHaveBeenCalledTimes(2);
    });
  });
});
