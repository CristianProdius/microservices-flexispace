/* eslint-disable @next/next/no-img-element */
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mockStore = vi.fn();
const push = vi.fn();
const router = { push };

vi.mock("@/stores/authStore", () => ({
  default: () => mockStore(),
}));

const apiFetchMock = vi.fn((input: string, init?: RequestInit) =>
  fetch(input, init)
);

vi.mock("@/lib/apiFetch", () => {
  class UnauthenticatedError extends Error {
    constructor() {
      super("Unauthenticated");
      this.name = "UnauthenticatedError";
    }
  }
  return {
    UnauthenticatedError,
    apiFetch: (...args: Parameters<typeof apiFetchMock>) =>
      apiFetchMock(...args),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    fill,
    src,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    alt: string;
    fill?: boolean;
  }) => {
    void fill;
    return <img alt={alt} src={src} {...props} />;
  },
}));

describe("host spaces page", () => {
  let container: HTMLDivElement;
  let root: Root;

  const getClassNames = () =>
    Array.from(container.querySelectorAll<HTMLElement>("*"))
      .map((element) => element.className)
      .filter(
        (className): className is string => typeof className === "string",
      );

  beforeAll(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    mockStore.mockReset();
    push.mockReset();
    apiFetchMock.mockReset();
    apiFetchMock.mockImplementation((input: string, init?: RequestInit) =>
      fetch(input, init)
    );
    mockStore.mockReturnValue({
      actingHostId: null,
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    vi.unstubAllGlobals();
    container.remove();
  });

  it("renders a theme-aware empty state and keeps add-space links as links", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );

    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("My Spaces");
    expect(container.textContent).toContain(
      "You haven't listed any spaces yet",
    );
    expect(
      container.querySelectorAll('a[href="/host/spaces/new"]').length,
    ).toBe(2);

    const classNames = getClassNames();
    expect(classNames.some((className) => className.includes("bg-card"))).toBe(
      true,
    );
    expect(
      classNames.some((className) =>
        className.includes("text-muted-foreground"),
      ),
    ).toBe(true);
    expect(
      classNames.some((className) => className.includes("border-border/60")),
    ).toBe(true);
    expect(
      classNames.some((className) => className.includes("bg-gray-50")),
    ).toBe(false);
    expect(classNames.some((className) => className.includes("bg-white"))).toBe(
      false,
    );
    expect(
      classNames.some((className) => className.includes("text-gray-500")),
    ).toBe(false);
    expect(
      classNames.some((className) => className.includes("text-gray-900")),
    ).toBe(false);
    expect(
      classNames.some((className) => className.includes("bg-gradient-to-r")),
    ).toBe(false);
  });

  it("renders theme-aware card actions for listed spaces", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 42,
            name: "Riverside Loft",
            images: ["/loft.jpg"],
            city: "Chisinau",
            country: "Moldova",
            capacity: 12,
            pricePerHour: 40,
            pricePerDay: null,
            pricingType: "HOURLY",
            isActive: true,
            averageRating: 4.8,
            totalReviews: 16,
          },
        ],
      }),
    );

    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const menuButton = container.querySelector(
      'button[aria-label="Open actions for Riverside Loft"]',
    );

    expect(menuButton).not.toBeNull();

    await act(async () => {
      menuButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Deactivate");
    expect(
      container.querySelector('a[href="/host/spaces/42/edit"]')?.textContent,
    ).toContain("Edit");

    const classNames = getClassNames();
    expect(
      classNames.some((className) => className.includes("bg-popover")),
    ).toBe(true);
    expect(
      classNames.some((className) =>
        className.includes("text-popover-foreground"),
      ),
    ).toBe(true);
    expect(
      classNames.some((className) => className.includes("hover:bg-accent")),
    ).toBe(true);
    expect(
      classNames.some((className) => className.includes("hover:bg-gray-50")),
    ).toBe(false);
    expect(
      classNames.some((className) => className.includes("border-gray-200")),
    ).toBe(false);
  });

  it("calls apiFetch for the host spaces endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );

    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/spaces/host/my"),
    );
  });
});
