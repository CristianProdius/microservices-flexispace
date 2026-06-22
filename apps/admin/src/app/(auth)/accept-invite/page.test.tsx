import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const getInvite = vi.fn();
const acceptInvite = vi.fn();
const replace = vi.fn();
const setSession = vi.fn();

vi.mock("@/lib/invites", () => ({
  getInvite: (...a: unknown[]) => getInvite(...a),
  acceptInvite: (...a: unknown[]) => acceptInvite(...a),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams("token=tok-1"),
}));
vi.mock("@/stores/authStore", () => ({ default: () => ({ setSession }) }));

describe("AcceptInvitePage", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    getInvite.mockReset().mockResolvedValue({ valid: true, email: "ada@spacefly.ai", name: "Ada" });
    acceptInvite.mockReset().mockResolvedValue({
      user: { id: "u-1", email: "ada@spacefly.ai", username: "ada", name: "Ada", role: "HOST", image: null },
      accessToken: "a",
      refreshToken: "r",
      requiresPasswordChange: false,
    });
    replace.mockReset();
    setSession.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
  });

  it("renders the invitee email for a valid token", async () => {
    const mod = await import("./page");
    await act(async () => { root.render(React.createElement(mod.default)); });
    await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
    expect(container.textContent).toContain("ada@spacefly.ai");
  });

  it("submits the new password and redirects into the app", async () => {
    const mod = await import("./page");
    await act(async () => { root.render(React.createElement(mod.default)); });
    await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
    const pw = container.querySelector('input[type="password"]') as HTMLInputElement;
    await act(async () => {
      // React tracks the input's value; bypass the tracker via the native
      // value setter so the controlled onChange fires (mirrors login test).
      const valueSetter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(pw) as HTMLInputElement,
        "value"
      )?.set;
      valueSetter?.call(pw, "Sup3rSecret!");
      pw.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const form = container.querySelector("form") as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
    expect(acceptInvite).toHaveBeenCalledWith({ token: "tok-1", newPassword: "Sup3rSecret!" });
    expect(replace).toHaveBeenCalledWith("/host");
  });

  it("shows an invalid state for a bad token", async () => {
    getInvite.mockResolvedValueOnce({ valid: false, reason: "expired" });
    const mod = await import("./page");
    await act(async () => { root.render(React.createElement(mod.default)); });
    await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
    expect(container.textContent).toContain("no longer valid");
  });

  it("shows a retryable state on a transient lookup failure and recovers", async () => {
    getInvite.mockReset().mockRejectedValueOnce(new Error("invite_lookup_transient"));
    const mod = await import("./page");
    await act(async () => { root.render(React.createElement(mod.default)); });
    await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
    // Transient copy + retry, not the terminal "no longer valid" screen.
    expect(container.textContent).toContain("Something went wrong loading your invite.");
    expect(container.textContent).not.toContain("no longer valid");

    // Retry succeeds and renders the set-password form for the invitee.
    getInvite.mockResolvedValueOnce({ valid: true, email: "ada@spacefly.ai", name: "Ada" });
    const retry = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Retry")
    ) as HTMLButtonElement;
    await act(async () => {
      retry.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
    expect(container.textContent).toContain("ada@spacefly.ai");
  });
});
