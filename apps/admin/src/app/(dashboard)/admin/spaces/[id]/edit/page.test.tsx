/* eslint-disable @next/next/no-img-element */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockStore = vi.fn();
const push = vi.fn();
const mockParams = { id: "42" };
const getToken = vi.fn();
const router = { push };
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

vi.mock("@/stores/authStore", () => {
  const hook = (() => mockStore()) as (() => unknown) & {
    getState: () => unknown;
  };
  hook.getState = () => mockStore();
  return { default: hook };
});

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useParams: () => mockParams,
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

describe("admin edit space page", () => {
  let container: HTMLDivElement;
  let root: Root;

  const setInputValue = (
    input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    value: string
  ) => {
    const prototype = Object.getPrototypeOf(input) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;
    const valueSetter = Object.getOwnPropertyDescriptor(
      prototype,
      "value"
    )?.set;

    valueSetter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  beforeAll(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    mockStore.mockReset();
    getToken.mockReset();
    getToken.mockResolvedValue("admin-token");
    mockStore.mockReturnValue({
      getToken,
      isAdmin: true,
      isAuthenticated: true,
      isLoading: false,
    });
    push.mockReset();

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

  it("prefills the shared form for admins and redirects back to admin spaces on save", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url.endsWith("/spaces/42") && !init?.method) {
        return {
          ok: true,
          json: async () => ({
            id: 42,
            name: "Riverside Loft",
            shortDescription: "Bright loft for team meetings",
            description:
              "Bright loft for team meetings, planning sessions, and workshops with flexible furniture and natural light.",
            spaceType: "MEETING_ROOM",
            pricingType: "BOTH",
            pricePerHour: 45,
            pricePerDay: 240,
            capacity: 12,
            address: "River Street 9",
            city: "Chisinau",
            state: "Center",
            country: "Moldova",
            postalCode: "MD-2001",
            instantBook: true,
            cancellationPolicy: "STRICT",
            houseRules: "Leave the studio as you found it.",
            categorySlug: "retail-store-shop-front",
            venueId: 7,
            videoUrl: null,
            currency: "USD",
            pricingTiers: [],
            images: ["/loft.jpg"],
            amenities: [
              {
                id: 10,
                spaceId: 42,
                amenityId: 2,
                amenity: {
                  id: 2,
                  name: "Projector",
                  icon: null,
                  category: "Equipment",
                },
              },
            ],
          }),
        };
      }

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
            { id: 7, name: "Downtown Hub", city: "Chisinau", country: "Moldova" },
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

      if (url.endsWith("/spaces/42") && init?.method === "PUT") {
        return {
          ok: true,
          json: async () => ({ id: 42 }),
        };
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Edit Space");
    expect(container.textContent).not.toContain("Space Type");
    expect(container.querySelector('a[href="/admin/spaces"]')?.textContent).toContain(
      "Back to Spaces"
    );

    const nameInput = container.querySelector(
      'input[placeholder="e.g. Modern Downtown Meeting Room"]'
    ) as HTMLInputElement | null;
    const amenityButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Projector")
    ) as HTMLButtonElement | undefined;
    const form = container.querySelector("form");

    expect(nameInput?.value).toBe("Riverside Loft");
    expect(amenityButton?.className).toContain("bg-primary/10");
    expect(container.querySelector('button[type="submit"]')?.textContent).toContain(
      "Update Space"
    );

    if (!nameInput || !form) {
      throw new Error("Missing edit form controls");
    }

    await act(async () => {
      setInputValue(nameInput, "Riverside Loft Admin Update");
    });

    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    const updateRequest = fetchMock.mock.calls.find(
      ([url, init]) => url.toString().endsWith("/spaces/42") && init?.method === "PUT"
    );

    expect(updateRequest).toBeDefined();
    const updateHeaders = updateRequest?.[1]?.headers as Headers;
    expect(updateHeaders).toBeInstanceOf(Headers);
    expect(updateHeaders.get("content-type")).toBe("application/json");
    expect(updateHeaders.get("authorization")).toBe("Bearer admin-token");
    expect(push).toHaveBeenCalledWith("/admin/spaces");
  });
});
