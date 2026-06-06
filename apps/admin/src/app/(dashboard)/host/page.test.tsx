import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockStore = vi.fn();
const push = vi.fn();
const router = { push };
const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
};

vi.mock("@/stores/authStore", () => ({
  default: () => mockStore(),
}));

vi.mock("@/lib/apiFetch", () => {
  class UnauthenticatedError extends Error {
    constructor() {
      super("Unauthenticated");
      this.name = "UnauthenticatedError";
    }
  }
  return {
    UnauthenticatedError,
    apiFetch: (input: string, init?: RequestInit) => fetch(input, init),
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

describe("host dashboard page", () => {
  let container: HTMLDivElement;
  let root: Root;

  const getClassNames = () =>
    Array.from(container.querySelectorAll<HTMLElement>("*"))
      .map((element) => element.className)
      .filter((className): className is string => typeof className === "string");

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
    mockStore.mockReturnValue({
      actingHostId: null,
      user: { name: "Cristian Prodius" },
    });

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ isActive: true }, { isActive: false }],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              status: "PENDING",
              startDate: "2099-02-01T10:00:00.000Z",
              totalAmount: 120,
              serviceFee: 20,
            },
            {
              status: "CONFIRMED",
              startDate: "2099-02-10T12:00:00.000Z",
              totalAmount: 240,
              serviceFee: 40,
            },
            {
              status: "COMPLETED",
              startDate: "2099-01-10T12:00:00.000Z",
              totalAmount: 360,
              serviceFee: 60,
            },
          ],
        })
    );

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

  it("renders theme-aware loading skeleton surfaces while stats are pending", async () => {
    const spacesDeferred = createDeferred<{
      ok: boolean;
      json: () => Promise<Array<{ isActive: boolean }>>;
    }>();
    const bookingsDeferred = createDeferred<{
      ok: boolean;
      json: () => Promise<
        Array<{
          status: string;
          startDate: string;
          totalAmount: number;
          serviceFee: number;
        }>
      >;
    }>();

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockReturnValueOnce(spacesDeferred.promise)
        .mockReturnValueOnce(bookingsDeferred.promise)
    );

    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(3);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(container.querySelectorAll('div[class*="bg-card"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('div[class*="border-border/60"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-slot="skeleton"].bg-accent').length).toBeGreaterThan(0);

    const classNames = getClassNames();
    expect(classNames.some((className) => className.includes("bg-gray-200"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("bg-white"))).toBe(
      false
    );
  });

  it("renders semantic dashboard surfaces and preserves host links after loading", async () => {
    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Welcome back, Cristian Prodius");
    expect(container.textContent).toContain("Active Spaces");
    expect(container.textContent).toContain("Pending Requests");
    expect(container.textContent).toContain("Upcoming Bookings");
    expect(container.textContent).toContain("Total Earnings");
    expect(container.textContent).toContain("Needs attention");
    expect(container.textContent).toContain("Quick links");
    expect(container.textContent).toContain("1 / 2");
    expect(container.textContent).toContain("$300");
    expect(container.textContent).toContain("$200 in pending earnings");
    expect(container.textContent).toContain("1 pending booking need your attention");
    expect(container.querySelector("h1")?.textContent).toContain("Welcome back, Cristian Prodius");
    expect(container.querySelector("h2")?.textContent).toContain("Needs attention");
    expect(container.querySelectorAll("a").length).toBe(5);
    expect(container.querySelector('a[href="/host/bookings?status=pending"]')).not.toBeNull();
    expect(container.querySelector('a[href="/host/earnings"]')).not.toBeNull();
    expect(container.querySelector('a[href="/host/spaces/new"]')).not.toBeNull();
    expect(container.querySelector('a[href="/host/bookings"]')).not.toBeNull();
    expect(container.querySelector('a[href="/host/spaces"]')).not.toBeNull();

    const classNames = getClassNames();
    expect(classNames.some((className) => className.includes("bg-card"))).toBe(true);
    expect(
      classNames.some((className) => className.includes("text-muted-foreground"))
    ).toBe(true);
    expect(
      classNames.some((className) => className.includes("border-border/60"))
    ).toBe(true);
    expect(classNames.some((className) => className.includes("bg-primary/10"))).toBe(
      true
    );
    expect(classNames.some((className) => className.includes("lg:grid-cols-4"))).toBe(
      true
    );
    expect(classNames.some((className) => className.includes("md:grid-cols-2"))).toBe(
      true
    );
    expect(classNames.some((className) => className.includes("md:grid-cols-3"))).toBe(
      true
    );
    expect(classNames.some((className) => className.includes("bg-white"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("text-gray-500"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("text-gray-900"))).toBe(
      false
    );
    expect(
      classNames.some((className) => className.includes("hover:bg-gray-50"))
    ).toBe(false);
  });
});
