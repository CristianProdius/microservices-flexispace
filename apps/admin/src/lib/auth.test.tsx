import { afterEach, describe, expect, it, vi } from "vitest";

import { login, refreshAccessToken, SessionExpiredError } from "./auth";

const jsonResponse = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("admin auth api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("shows a clear message when the auth service cannot be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );

    await expect(login("admin@spacefly.ai", "admin123")).rejects.toThrow(
      "Unable to reach the authentication service"
    );
  });

  describe("refreshAccessToken", () => {
    it("clears the stored session and throws SessionExpiredError on a 401", async () => {
      localStorage.setItem("admin_accessToken", "stale-access");
      localStorage.setItem("admin_refreshToken", "stale-refresh");
      localStorage.setItem("admin_user", JSON.stringify({ id: "u1" }));
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(jsonResponse(401, { message: "Invalid refresh token" }))
      );

      await expect(refreshAccessToken("stale-refresh")).rejects.toBeInstanceOf(
        SessionExpiredError
      );
      expect(localStorage.getItem("admin_accessToken")).toBeNull();
      expect(localStorage.getItem("admin_refreshToken")).toBeNull();
      expect(localStorage.getItem("admin_user")).toBeNull();
    });

    it("keeps the session and throws a generic error on a non-401 failure", async () => {
      localStorage.setItem("admin_refreshToken", "refresh-1");
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(500)));

      const err = await refreshAccessToken("refresh-1").catch((e) => e);
      expect(err).toBeInstanceOf(Error);
      expect(err).not.toBeInstanceOf(SessionExpiredError);
      expect(localStorage.getItem("admin_refreshToken")).toBe("refresh-1");
    });
  });
});
