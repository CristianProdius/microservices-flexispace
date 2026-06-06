import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/stores/authStore", () => {
  const state = {
    getToken: vi.fn().mockResolvedValue("tok"),
    isAdmin: true,
    actingHostId: null as string | null,
  };
  return {
    default: { getState: () => state },
    __state: state,
  };
});

import * as store from "@/stores/authStore";
import { apiFetch, UnauthenticatedError } from "./apiFetch";

const state = (store as any).__state;

describe("apiFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    state.getToken = vi.fn().mockResolvedValue("tok");
    state.isAdmin = true;
    state.actingHostId = null;
  });

  it("attaches Authorization", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}"));
    await apiFetch("https://api/x");
    const init = fetchSpy.mock.calls[0]![1] as RequestInit;
    expect((init.headers as Headers).get("authorization")).toBe("Bearer tok");
  });

  it("attaches X-Acting-Host-Id when admin + actingHostId set", async () => {
    state.actingHostId = "host-1";
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}"));
    await apiFetch("https://api/x");
    const init = fetchSpy.mock.calls[0]![1] as RequestInit;
    expect((init.headers as Headers).get("x-acting-host-id")).toBe("host-1");
  });

  it("omits X-Acting-Host-Id when not admin", async () => {
    state.isAdmin = false;
    state.actingHostId = "host-1";
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}"));
    await apiFetch("https://api/x");
    const init = fetchSpy.mock.calls[0]![1] as RequestInit;
    expect((init.headers as Headers).get("x-acting-host-id")).toBeNull();
  });

  it("throws UnauthenticatedError when no token", async () => {
    state.getToken = vi.fn().mockResolvedValue(null);
    await expect(apiFetch("https://api/x")).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
