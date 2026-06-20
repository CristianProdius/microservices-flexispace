import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const onboardingSetPassword = vi.fn();
const getMe = vi.fn();
const apiFetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));
vi.mock("@/stores/authStore", () => ({
  default: () => ({ user: { name: "Ana", role: "HOST" } }),
}));
vi.mock("@/lib/auth", () => ({
  onboardingSetPassword: (...a: unknown[]) => onboardingSetPassword(...a),
  getMe: () => getMe(),
}));
vi.mock("@/lib/apiFetch", () => ({
  apiFetch: (...a: unknown[]) => apiFetch(...a),
  UnauthenticatedError: class extends Error {},
}));

describe("onboarding wizard", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  const setInputValue = (input: HTMLInputElement, value: string) => {
    const proto = Object.getPrototypeOf(input) as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  beforeEach(() => {
    replace.mockReset();
    onboardingSetPassword.mockReset().mockResolvedValue(undefined);
    getMe.mockReset().mockResolvedValue({ mustChangePassword: true });
    apiFetch.mockReset().mockResolvedValue({ ok: true, json: async () => [] });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
  });

  it("redirects to /host when no password change is required", async () => {
    getMe.mockResolvedValueOnce({ mustChangePassword: false });
    const page = await import("./page");
    await act(async () => { root.render(React.createElement(page.default)); });
    await act(async () => { await Promise.resolve(); });
    expect(replace).toHaveBeenCalledWith("/host");
  });

  it("advances from welcome, sets the password, and reaches the final step", async () => {
    const page = await import("./page");
    await act(async () => { root.render(React.createElement(page.default)); });
    await act(async () => { await Promise.resolve(); });

    const continueBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Continue")
    ) as HTMLButtonElement;
    await act(async () => { continueBtn.click(); });

    const pw = container.querySelector("#newPassword") as HTMLInputElement;
    const confirm = container.querySelector("#confirmPassword") as HTMLInputElement;
    await act(async () => {
      setInputValue(pw, "newStrongPass1");
      setInputValue(confirm, "newStrongPass1");
    });

    const form = container.querySelector("form") as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await act(async () => { await Promise.resolve(); });

    expect(onboardingSetPassword).toHaveBeenCalledWith("newStrongPass1");
    expect(container.textContent).toContain("all set");
  });
});
