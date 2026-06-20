import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const getToken = vi.fn();

vi.mock("@/stores/authStore", () => ({
  default: () => ({ getToken }),
}));
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("@/components/ui/sheet", () => ({
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-slot="sheet-content">{children}</div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-slot="sheet-header">{children}</div>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  SheetDescription: ({ children }: { children: React.ReactNode; asChild?: boolean }) => (
    <div>{children}</div>
  ),
}));

describe("SetTempPassword", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    getToken.mockReset().mockResolvedValue("token-123");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tempPassword: "Abcd2345Wxyz9" }) })
    );
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
    vi.unstubAllGlobals();
  });

  it("generates a temp password and reveals copyable credentials", async () => {
    const mod = await import("./SetTempPassword");
    await act(async () => {
      root.render(
        React.createElement(mod.default, { userId: "u-1", email: "host@spacefly.ai" })
      );
    });

    const genBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Generate")
    ) as HTMLButtonElement;
    await act(async () => { genBtn.click(); });
    await act(async () => {
      for (let i = 0; i < 5; i += 1) await Promise.resolve();
    });

    expect(container.textContent).toContain("Abcd2345Wxyz9");
    expect(container.textContent).toContain("host@spacefly.ai");
  });
});
