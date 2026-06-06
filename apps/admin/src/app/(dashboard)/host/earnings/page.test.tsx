import React, { act } from "react";
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

describe("host earnings page", () => {
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
    mockStore.mockReturnValue({ actingHostId: null });

    const currentMonth = new Date();
    const inThisMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      10
    ).toISOString();
    const nextDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      11
    ).toISOString();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: "booking-1",
            status: "COMPLETED",
            totalAmount: 240,
            serviceFee: 40,
            cleaningFee: 0,
            startDate: inThisMonth,
            endDate: nextDay,
            space: { name: "Sunlit Meeting Room" },
            guest: { name: "Alex Johnson" },
          },
          {
            id: "booking-2",
            status: "CONFIRMED",
            totalAmount: 180,
            serviceFee: 30,
            cleaningFee: 0,
            startDate: inThisMonth,
            endDate: nextDay,
            space: { name: "Studio Loft" },
            guest: { name: "Taylor Smith" },
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

  it("renders semantic loading surfaces while earnings data is pending", async () => {
    const deferred = createDeferred<{
      ok: boolean;
      json: () => Promise<unknown>;
    }>();

    vi.stubGlobal("fetch", vi.fn().mockReturnValue(deferred.promise));

    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);

    const classNames = getClassNames();
    expect(classNames.some((className) => className.includes("bg-card"))).toBe(true);
    expect(
      classNames.some((className) => className.includes("border-border/60"))
    ).toBe(true);
    expect(classNames.some((className) => className.includes("bg-gray-200"))).toBe(
      false
    );
  });

  it("renders earnings content with dashboard tokens and existing booking data", async () => {
    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Earnings");
    expect(container.textContent).toContain("Track your hosting income");
    expect(container.textContent).toContain("Total Earnings");
    expect(container.textContent).toContain("Pending");
    expect(container.textContent).toContain("This Month");
    expect(container.textContent).toContain("Completed");
    expect(container.textContent).toContain("Pending Payouts");
    expect(container.textContent).toContain("Completed Bookings");
    expect(container.textContent).toContain("Sunlit Meeting Room");
    expect(container.textContent).toContain("Studio Loft");
    expect(container.textContent).toContain("$200.00");
    expect(container.textContent).toContain("$150.00");
    expect(container.textContent).toContain("$40.00");

    const pendingPayoutRow = container
      .querySelector("p.font-medium.text-card-foreground")
      ?.closest("div.rounded-lg");
    const completedTable = container.querySelector("table");
    const completedTableWrapper = completedTable?.closest("div.overflow-hidden");
    const completedTableBody = container.querySelector("tbody");

    expect(pendingPayoutRow).not.toBeNull();
    expect(pendingPayoutRow?.className).toContain("bg-card");
    expect(pendingPayoutRow?.className).toContain("border-border/60");
    expect(completedTable).not.toBeNull();
    expect(completedTableWrapper?.className).toContain("border-border/60");
    expect(completedTableBody?.className).toContain("bg-card");

    const classNames = getClassNames();
    expect(classNames.some((className) => className.includes("bg-card"))).toBe(true);
    expect(
      classNames.some((className) => className.includes("text-muted-foreground"))
    ).toBe(true);
    expect(
      classNames.some((className) => className.includes("border-border/60"))
    ).toBe(true);
    expect(classNames.some((className) => className.includes("bg-accent/30"))).toBe(
      true
    );
    expect(classNames.some((className) => className.includes("bg-white"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("bg-gray-50"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("text-gray-500"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("text-gray-900"))).toBe(
      false
    );
    expect(
      classNames.some((className) => className.includes("border-gray-200"))
    ).toBe(false);
  });

  it("renders a retryable service unavailable state when earnings cannot be fetched", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Booking service unavailable");
    expect(container.textContent).toContain("Retry");
    expect(consoleError).not.toHaveBeenCalled();
  });
});
