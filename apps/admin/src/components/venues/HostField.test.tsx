import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const searchHosts = vi.fn();
const createHostInvite = vi.fn();

vi.mock("@/lib/invites", () => ({
  searchHosts: (...a: unknown[]) => searchHosts(...a),
  createHostInvite: (...a: unknown[]) => createHostInvite(...a),
}));

describe("HostField", () => {
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
    searchHosts.mockReset().mockResolvedValue([
      { id: "h-1", email: "host@spacefly.ai", name: "Existing Host", username: "host", role: "HOST" },
    ]);
    createHostInvite.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
  });

  it("searches and selects an existing host", async () => {
    const onChange = vi.fn();
    const mod = await import("./HostField");
    await act(async () => {
      root.render(React.createElement(mod.default, { value: null, onChange }));
    });
    const input = container.querySelector(
      'input[aria-label="Search hosts"]'
    ) as HTMLInputElement;
    await act(async () => {
      setInputValue(input, "ho");
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      for (let i = 0; i < 5; i += 1) await Promise.resolve();
    });
    const option = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Existing Host")
    ) as HTMLButtonElement;
    await act(async () => { option.click(); });
    expect(onChange).toHaveBeenCalledWith({ kind: "existing", id: "h-1", label: "Existing Host" });
  });

  it("captures a new host name + email", async () => {
    const onChange = vi.fn();
    const mod = await import("./HostField");
    await act(async () => {
      root.render(React.createElement(mod.default, { value: null, onChange }));
    });
    const toggle = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("New host")
    ) as HTMLButtonElement;
    await act(async () => { toggle.click(); });
    const nameInput = container.querySelector('input[aria-label="New host name"]') as HTMLInputElement;
    const emailInput = container.querySelector('input[aria-label="New host email"]') as HTMLInputElement;
    await act(async () => {
      setInputValue(nameInput, "Ada");
      setInputValue(emailInput, "ada@spacefly.ai");
    });
    expect(onChange).toHaveBeenLastCalledWith({ kind: "new", name: "Ada", email: "ada@spacefly.ai" });
  });
});
