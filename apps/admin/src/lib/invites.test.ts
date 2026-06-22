import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("@/lib/apiFetch", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
  UnauthenticatedError: class UnauthenticatedError extends Error {},
}));

describe("lib/invites", () => {
  beforeEach(() => {
    apiFetch.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("inviteUser POSTs to /users/:id/invite and returns inviteUrl", async () => {
    apiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ inviteUrl: "https://admin.spacefly.ai/accept-invite?token=t", expiresAt: "2026-07-01T00:00:00.000Z" }),
    });
    const { inviteUser } = await import("./invites");
    const res = await inviteUser("u-1");
    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/u-1/invite"),
      expect.objectContaining({ method: "POST" })
    );
    expect(res.inviteUrl).toContain("token=t");
  });

  it("createHostInvite POSTs name+email to /users/host-invite", async () => {
    apiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ userId: "u-2", inviteUrl: "https://x?token=t2", created: true }),
    });
    const { createHostInvite } = await import("./invites");
    const res = await createHostInvite({ name: "Ada", email: "ada@spacefly.ai" });
    const [, init] = apiFetch.mock.calls[0]!;
    expect(JSON.parse(init.body)).toEqual({ name: "Ada", email: "ada@spacefly.ai" });
    expect(res.userId).toBe("u-2");
    expect(res.created).toBe(true);
  });

  it("createHostInvite surfaces the 409 message", async () => {
    apiFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Email already in use by a non-host account" }),
    });
    const { createHostInvite } = await import("./invites");
    await expect(createHostInvite({ name: "X", email: "x@y.z" })).rejects.toThrow(
      "Email already in use by a non-host account"
    );
  });

  it("getInvite calls the public auth endpoint WITHOUT apiFetch and with credentials", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true, email: "ada@spacefly.ai", name: "Ada" }),
    });
    const { getInvite } = await import("./invites");
    const res = await getInvite("tok-123");
    expect(apiFetch).not.toHaveBeenCalled();
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(url).toContain("/auth/invite/tok-123");
    expect(init.credentials).toBe("include");
    expect(res.valid).toBe(true);
    expect(res.email).toBe("ada@spacefly.ai");
  });

  it("acceptInvite POSTs token+newPassword to /auth/invite/accept with credentials", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: { id: "u-3", email: "ada@spacefly.ai", username: "ada", name: "Ada", role: "HOST", image: null },
        accessToken: "a",
        refreshToken: "r",
      }),
    });
    const { acceptInvite } = await import("./invites");
    const res = await acceptInvite({ token: "tok-9", newPassword: "Sup3rSecret!" });
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(url).toContain("/auth/invite/accept");
    expect(init.credentials).toBe("include");
    expect(JSON.parse(init.body)).toEqual({ token: "tok-9", newPassword: "Sup3rSecret!" });
    expect(res.accessToken).toBe("a");
  });

  it("searchHosts uses apiFetch GET /users?role=HOST and forwards the query", async () => {
    apiFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: "h-1", email: "h@s.ai", name: "Host", username: "host", role: "HOST" }],
    });
    const { searchHosts } = await import("./invites");
    const hosts = await searchHosts("ho");
    const [url] = apiFetch.mock.calls[0]!;
    expect(url).toContain("/users?role=HOST");
    expect(url).toContain("search=ho");
    expect(hosts[0]!.id).toBe("h-1");
  });
});
