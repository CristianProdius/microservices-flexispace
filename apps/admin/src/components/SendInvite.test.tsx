import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const inviteUser = vi.fn();
vi.mock("@/lib/invites", () => ({ inviteUser: (...a: unknown[]) => inviteUser(...a) }));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/ui/sheet", () => ({
  SheetContent: ({ children }: { children: React.ReactNode }) => <div data-slot="sheet-content">{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  SheetDescription: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <div>{children}</div>,
}));

describe("SendInvite", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    inviteUser.mockReset().mockResolvedValue({
      inviteUrl: "https://admin.spacefly.ai/accept-invite?token=abc",
      expiresAt: "2026-07-01T00:00:00.000Z",
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
  });

  it("sends an invite and reveals the copyable invite URL", async () => {
    const mod = await import("./SendInvite");
    await act(async () => {
      root.render(React.createElement(mod.default, { userId: "u-1", email: "host@spacefly.ai" }));
    });
    const btn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Send invite")
    ) as HTMLButtonElement;
    await act(async () => { btn.click(); });
    await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
    expect(inviteUser).toHaveBeenCalledWith("u-1");
    expect(container.textContent).toContain("https://admin.spacefly.ai/accept-invite?token=abc");
  });
});
