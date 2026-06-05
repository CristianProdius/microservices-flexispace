import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const replace = vi.fn();
const login = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    replace,
  }),
}));

vi.mock("@/stores/authStore", () => ({
  default: () => ({
    login,
  }),
}));

describe("admin login page", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  const setInputValue = (input: HTMLInputElement, value: string) => {
    const prototype = Object.getPrototypeOf(input) as HTMLInputElement;
    const valueSetter = Object.getOwnPropertyDescriptor(
      prototype,
      "value"
    )?.set;

    valueSetter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    login.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("submits credentials and redirects admins to /admin on success", async () => {
    login.mockResolvedValueOnce({
      id: "admin-1",
      email: "admin@spacefly.ai",
      username: "admin",
      name: "Admin",
      role: "ADMIN",
      image: null,
    });

    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    const email = container.querySelector("#email") as HTMLInputElement | null;
    const password = container.querySelector(
      "#password"
    ) as HTMLInputElement | null;
    const form = container.querySelector("form");

    expect(email).not.toBeNull();
    expect(password).not.toBeNull();
    expect(form).not.toBeNull();

    if (!email || !password || !form) {
      return;
    }

    await act(async () => {
      setInputValue(email, "admin@spacefly.ai");
      setInputValue(password, "secret123");
    });

    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(login).toHaveBeenCalledWith("admin@spacefly.ai", "secret123");
    expect(replace).toHaveBeenCalledWith("/admin");
    expect(push).not.toHaveBeenCalled();
  });

  it("redirects hosts to /host on successful login", async () => {
    login.mockResolvedValueOnce({
      id: "host-1",
      email: "host@spacefly.ai",
      username: "host",
      name: "Host",
      role: "HOST",
      image: null,
    });

    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    const email = container.querySelector("#email") as HTMLInputElement | null;
    const password = container.querySelector(
      "#password"
    ) as HTMLInputElement | null;
    const form = container.querySelector("form");

    if (!email || !password || !form) {
      return;
    }

    await act(async () => {
      setInputValue(email, "host@spacefly.ai");
      setInputValue(password, "secret123");
    });

    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(replace).toHaveBeenCalledWith("/host");
    expect(push).not.toHaveBeenCalled();
  });

  it("renders inline errors when login fails", async () => {
    login.mockRejectedValueOnce(new Error("Invalid credentials"));

    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    const email = container.querySelector("#email") as HTMLInputElement | null;
    const password = container.querySelector(
      "#password"
    ) as HTMLInputElement | null;
    const form = container.querySelector("form");

    expect(email).not.toBeNull();
    expect(password).not.toBeNull();
    expect(form).not.toBeNull();

    if (!email || !password || !form) {
      return;
    }

    await act(async () => {
      setInputValue(email, "admin@spacefly.ai");
      setInputValue(password, "wrong-pass");
    });

    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(login).toHaveBeenCalledWith("admin@spacefly.ai", "wrong-pass");
    expect(container.textContent).toContain("Invalid credentials");
  });

  it("renders a focused sign-in form surface", async () => {
    const pageModule = await import("./page");
    const html = renderToStaticMarkup(React.createElement(pageModule.default));

    expect(html).toContain("Sign in");
    expect(html).toContain("Use your email and password to continue.");
    expect(html).toContain("<form");
    expect(html).toContain('for="email"');
    expect(html).toContain('id="email"');
    expect(html).toContain('type="email"');
    expect(html).toContain("name@company.com");
    expect(html).toContain('for="password"');
    expect(html).toContain('id="password"');
    expect(html).toContain('type="password"');
    expect(html).toContain("Continue to dashboard");
    expect(html).not.toContain("Host and admin access");
    expect(html).not.toContain("Manage spaces, bookings, and hosts from one place.");
  });
});
