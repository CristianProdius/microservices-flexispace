/* eslint-disable @next/next/no-img-element */
import React, { act } from "react";
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
let searchParams = new URLSearchParams();
const groupedCategoriesResponse = [
  {
    categories: [
      {
        groupSlug: "retail-commercial",
        id: 17,
        name: "Retail Store / Shop Front",
        slug: "retail-store-shop-front",
        spaceType: "PRIVATE_OFFICE",
      },
    ],
    name: "Retail & Commercial",
    slug: "retail-commercial",
  },
];
const defaultAvailabilityPayload = [
  { dayOfWeek: 0, startTime: "09:00", endTime: "21:00", isOpen: false },
  { dayOfWeek: 1, startTime: "09:00", endTime: "21:00", isOpen: true },
  { dayOfWeek: 2, startTime: "09:00", endTime: "21:00", isOpen: true },
  { dayOfWeek: 3, startTime: "09:00", endTime: "21:00", isOpen: true },
  { dayOfWeek: 4, startTime: "09:00", endTime: "21:00", isOpen: true },
  { dayOfWeek: 5, startTime: "09:00", endTime: "21:00", isOpen: true },
  { dayOfWeek: 6, startTime: "09:00", endTime: "21:00", isOpen: false },
];

// apiFetch reads `useAuthStore.getState()` (Zustand's static accessor) rather
// than the React hook, so the mocked default export needs to surface both.
vi.mock("@/stores/authStore", () => {
  const hook = (() => mockStore()) as (() => unknown) & {
    getState: () => unknown;
  };
  hook.getState = () => mockStore();
  return { default: hook };
});

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => searchParams,
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
    src,
    alt,
    fill,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    alt: string;
    fill?: boolean;
  }) => {
    void fill;
    return <img src={src} alt={alt} {...props} />;
  },
}));

describe("host new space page", () => {
  let container: HTMLDivElement;
  let root: Root;

  const setInputValue = (
    input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    value: string,
  ) => {
    const prototype = Object.getPrototypeOf(input) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;
    const valueSetter = Object.getOwnPropertyDescriptor(
      prototype,
      "value",
    )?.set;

    valueSetter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const fillRequiredFields = async () => {
    const nameInput = container.querySelector(
      'input[placeholder="e.g. Modern Downtown Meeting Room"]',
    ) as HTMLInputElement | null;
    const shortDescriptionInput = container.querySelector(
      'input[placeholder="Brief description for search results"]',
    ) as HTMLInputElement | null;
    const descriptionInput = container.querySelector(
      'textarea[placeholder="Detailed description of your space"]',
    ) as HTMLTextAreaElement | null;
    const capacityInput = container.querySelector(
      'input[placeholder="Maximum number of people"]',
    ) as HTMLInputElement | null;
    const venueSelect = Array.from(container.querySelectorAll("select")).find(
      (select) => select.textContent?.includes("Select a venue"),
    ) as HTMLSelectElement | undefined;
    const hourlyInput = Array.from(container.querySelectorAll("input")).find(
      (input) => input.previousElementSibling?.textContent === "Price Per Hour",
    ) as HTMLInputElement | undefined;
    const dailyInput = Array.from(container.querySelectorAll("input")).find(
      (input) => input.previousElementSibling?.textContent === "Price Per Day",
    ) as HTMLInputElement | undefined;
    const categorySelect = Array.from(
      container.querySelectorAll("select"),
    ).find((select) => select.textContent?.includes("Select a category")) as
      | HTMLSelectElement
      | undefined;

    if (
      !nameInput ||
      !shortDescriptionInput ||
      !descriptionInput ||
      !capacityInput ||
      !venueSelect ||
      !hourlyInput ||
      !dailyInput ||
      !categorySelect
    ) {
      throw new Error("Required space form fields are missing");
    }

    await act(async () => {
      setInputValue(nameInput, "Sunset Studio");
      setInputValue(shortDescriptionInput, "A bright studio for workshops");
      setInputValue(
        descriptionInput,
        "A bright studio for workshops and events with plenty of natural light.",
      );
      setInputValue(categorySelect, "retail-store-shop-front");
      setInputValue(capacityInput, "8");
      setInputValue(venueSelect, "7");
      setInputValue(hourlyInput, "25");
      setInputValue(dailyInput, "120");
    });
  };

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
    mockStore.mockReturnValue({
      token: "test-token",
      getToken: vi.fn(async () => "test-token"),
      isLoading: false,
    });
    push.mockReset();
    searchParams = new URLSearchParams();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();

        if (url.endsWith("/categories?grouped=true")) {
          return {
            ok: true,
            json: async () => groupedCategoriesResponse,
          };
        }

        if (url.endsWith("/venues/host/my")) {
          return {
            ok: true,
            json: async () => [
              {
                id: 7,
                name: "Downtown Hub",
                city: "Chisinau",
                country: "Moldova",
              },
            ],
          };
        }

        if (url.includes("/amenities")) {
          return {
            ok: true,
            json: async () => [
              { id: 1, name: "Wi-Fi", icon: null, category: "Connectivity" },
              { id: 2, name: "Projector", icon: null, category: "Equipment" },
            ],
          };
        }

        throw new Error(`Unexpected fetch call: ${url}`);
      }),
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

  it("uses semantic dashboard surfaces for the host space form", async () => {
    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Create New Space");
    expect(container.textContent).toContain(
      "Fill in the details to list your space",
    );
    expect(container.textContent).toContain("Basic Information");
    expect(container.textContent).toContain("Images");
    expect(container.textContent).toContain("Venue");
    expect(container.textContent).toContain("Pricing");
    expect(container.textContent).toContain("Availability");
    expect(container.textContent).toContain("Monday");
    expect(container.textContent).toContain("Amenities");
    expect(container.textContent).toContain("Settings");
    expect(container.textContent).toContain("Enable instant booking");
    expect(container.textContent).not.toContain("Space Type");
    expect(
      container.querySelector('a[href="/host/spaces"]')?.textContent,
    ).toContain("Back to Spaces");
    expect(
      container.querySelector('button[type="submit"]')?.textContent,
    ).toContain("Create Space");
    expect(container.querySelector('label input[type="file"]')).not.toBeNull();

    const classNames = getClassNames();
    expect(classNames.some((className) => className.includes("bg-card"))).toBe(
      true,
    );
    expect(
      classNames.some((className) => className.includes("border-border/60")),
    ).toBe(true);
    expect(
      classNames.some((className) =>
        className.includes("text-muted-foreground"),
      ),
    ).toBe(true);
    expect(
      classNames.some((className) => className.includes("border-input")),
    ).toBe(true);
    expect(
      classNames.some((className) => className.includes("focus:ring-ring/50")),
    ).toBe(true);
    expect(classNames.some((className) => className.includes("bg-white"))).toBe(
      false,
    );
    expect(
      classNames.some((className) => className.includes("text-gray-600")),
    ).toBe(false);
    expect(
      classNames.some((className) => className.includes("text-gray-700")),
    ).toBe(false);
    expect(
      classNames.some((className) => className.includes("text-gray-900")),
    ).toBe(false);
    expect(
      classNames.some((className) => className.includes("border-gray-200")),
    ).toBe(false);
    expect(
      classNames.some((className) => className.includes("hover:bg-gray-50")),
    ).toBe(false);
  });

  it("shows upload errors and tokenized selected amenity/toggle surfaces", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();

        if (url.endsWith("/categories?grouped=true")) {
          return { ok: true, json: async () => groupedCategoriesResponse };
        }

        if (url.endsWith("/venues/host/my")) {
          return {
            ok: true,
            json: async () => [
              {
                id: 7,
                name: "Downtown Hub",
                city: "Chisinau",
                country: "Moldova",
              },
            ],
          };
        }

        if (url.includes("/amenities")) {
          return {
            ok: true,
            json: async () => [
              { id: 1, name: "Wi-Fi", icon: null, category: "Connectivity" },
            ],
          };
        }

        if (url.endsWith("/uploads/images")) {
          return {
            ok: false,
            json: async () => ({ message: "Upload failed" }),
          };
        }

        throw new Error(`Unexpected fetch call: ${url}`);
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

    const amenityButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Wi-Fi"),
    ) as HTMLButtonElement | undefined;
    const instantBook = container.querySelector(
      "#instantBook",
    ) as HTMLInputElement | null;
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;

    expect(amenityButton).toBeDefined();
    expect(instantBook).not.toBeNull();
    expect(fileInput).not.toBeNull();

    await act(async () => {
      amenityButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      instantBook?.click();
    });

    if (fileInput) {
      Object.defineProperty(fileInput, "files", {
        configurable: true,
        value: [new File(["x"], "space.png", { type: "image/png" })],
      });

      await act(async () => {
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    expect(amenityButton?.className).toContain("bg-primary/10");
    expect(amenityButton?.className).toContain("text-primary");
    expect(instantBook?.checked).toBe(true);
    expect(container.textContent).toContain("Upload failed");

    const uploadError = Array.from(container.querySelectorAll("p")).find(
      (node) => node.textContent?.includes("Upload failed"),
    );
    const instantBookRow = instantBook?.closest("div.rounded-lg");
    expect(uploadError?.className).toContain("bg-destructive/10");
    expect(uploadError?.className).toContain("text-destructive");
    expect(instantBookRow?.className).toContain("border-border/60");
    expect(instantBookRow?.className).toContain("bg-accent/20");
  });

  it("renders uploaded image controls and a tokenized top-level submit error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input.toString();

        if (url.endsWith("/categories?grouped=true")) {
          return { ok: true, json: async () => groupedCategoriesResponse };
        }

        if (url.endsWith("/venues/host/my")) {
          return {
            ok: true,
            json: async () => [
              {
                id: 7,
                name: "Downtown Hub",
                city: "Chisinau",
                country: "Moldova",
              },
            ],
          };
        }

        if (url.includes("/amenities")) {
          return {
            ok: true,
            json: async () => [
              { id: 1, name: "Wi-Fi", icon: null, category: "Connectivity" },
            ],
          };
        }

        if (url.endsWith("/uploads/images")) {
          return {
            ok: true,
            json: async () => ({ url: "/uploaded-space.png" }),
          };
        }

        if (url.endsWith("/spaces") && init?.method === "POST") {
          return {
            ok: false,
            json: async () => ({ message: "Creation failed" }),
          };
        }

        throw new Error(`Unexpected fetch call: ${url}`);
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

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;

    if (fileInput) {
      Object.defineProperty(fileInput, "files", {
        configurable: true,
        value: [new File(["x"], "space.png", { type: "image/png" })],
      });

      await act(async () => {
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    const form = container.querySelector("form");

    expect(
      container.querySelector('button[aria-label="Remove image 1"]'),
    ).not.toBeNull();

    if (form) {
      await fillRequiredFields();
      await act(async () => {
        form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    expect(container.textContent).toContain("Creation failed");

    const topLevelError = Array.from(container.querySelectorAll("div")).find(
      (node) =>
        node.textContent?.trim() === "Creation failed" &&
        node.className.includes("bg-destructive/10"),
    );
    expect(topLevelError?.className).toContain("bg-destructive/10");
    expect(topLevelError?.className).toContain("text-destructive");
    expect(
      container.querySelector('button[type="submit"]')?.className,
    ).toContain("bg-primary");
    expect(
      container.querySelector('a[href="/host/spaces"]')?.className,
    ).toContain("hover:bg-accent");
  });

  it("submits the current create payload shape and redirects back to host spaces", async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input.toString();

        if (url.endsWith("/categories")) {
          return {
            ok: true,
            json: async () => groupedCategoriesResponse,
          };
        }

        if (url.endsWith("/categories?grouped=true")) {
          return {
            ok: true,
            json: async () => groupedCategoriesResponse,
          };
        }

        if (url.endsWith("/venues/host/my")) {
          return {
            ok: true,
            json: async () => [
              {
                id: 7,
                name: "Downtown Hub",
                city: "Chisinau",
                country: "Moldova",
              },
            ],
          };
        }

        if (url.includes("/amenities")) {
          return {
            ok: true,
            json: async () => [
              { id: 1, name: "Wi-Fi", icon: null, category: "Connectivity" },
              { id: 2, name: "Projector", icon: null, category: "Equipment" },
            ],
          };
        }

        if (url.endsWith("/uploads/images")) {
          return {
            ok: true,
            json: async () => ({ url: "/uploaded-space.png" }),
          };
        }

        if (url.endsWith("/spaces") && init?.method === "POST") {
          return {
            ok: true,
            json: async () => ({ id: 99 }),
          };
        }

        throw new Error(`Unexpected fetch call: ${url}`);
      },
    );

    vi.stubGlobal("fetch", fetchMock);

    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const amenityButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Wi-Fi"),
    ) as HTMLButtonElement | undefined;
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;
    const form = container.querySelector("form");

    expect(fileInput).not.toBeNull();
    expect(form).not.toBeNull();

    if (fileInput) {
      Object.defineProperty(fileInput, "files", {
        configurable: true,
        value: [new File(["x"], "space.png", { type: "image/png" })],
      });

      await act(async () => {
        amenityButton?.dispatchEvent(
          new MouseEvent("click", { bubbles: true }),
        );
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    await fillRequiredFields();

    await act(async () => {
      form?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    const createRequest = fetchMock.mock.calls.find(
      ([url, init]) =>
        url.toString().endsWith("/spaces") && init?.method === "POST",
    );

    expect(createRequest).toBeDefined();
    expect(JSON.parse(createRequest?.[1]?.body as string)).toEqual({
      name: "Sunset Studio",
      shortDescription: "A bright studio for workshops",
      description:
        "A bright studio for workshops and events with plenty of natural light.",
      spaceType: "PRIVATE_OFFICE",
      pricingType: "BOTH",
      pricePerHour: 25,
      pricePerDay: 120,
      capacity: 8,
      venueId: 7,
      instantBook: false,
      cancellationPolicy: "MODERATE",
      houseRules: "",
      categorySlug: "retail-store-shop-front",
      amenityIds: [1],
      images: ["/uploaded-space.png"],
      nameTranslations: null,
      shortDescTranslations: null,
      descriptionTranslations: null,
      videoUrl: null,
      currency: "USD",
      pricingTiers: [],
      availability: defaultAvailabilityPayload,
    });
    // apiFetch always wraps headers in a Headers instance, so assert via
    // the Headers API rather than a deep-equal on a plain object literal.
    const createdHeaders = createRequest?.[1]?.headers as Headers;
    expect(createdHeaders).toBeInstanceOf(Headers);
    expect(createdHeaders.get("content-type")).toBe("application/json");
    expect(createdHeaders.get("authorization")).toBe("Bearer test-token");
    expect(push).toHaveBeenCalledWith("/host/spaces");
  });

  it("preselects the venue from the venueId query parameter", async () => {
    searchParams = new URLSearchParams("venueId=7");
    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const venueSelect = Array.from(container.querySelectorAll("select")).find(
      (select) => select.textContent?.includes("Select a venue"),
    ) as HTMLSelectElement | undefined;

    expect(venueSelect?.value).toBe("7");
  });
});
