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
const mockParams = { id: "42" };
const groupedCategoriesResponse = [
  {
    categories: [
      {
        groupSlug: "retail-commercial",
        id: 17,
        name: "Retail Store / Shop Front",
        slug: "retail-store-shop-front",
        spaceType: "MEETING_ROOM",
      },
    ],
    name: "Retail & Commercial",
    slug: "retail-commercial",
  },
];
const existingAvailabilityPayload = [
  {
    id: 1,
    spaceId: 42,
    dayOfWeek: 0,
    startTime: "10:00",
    endTime: "18:00",
    isOpen: false,
  },
  {
    id: 2,
    spaceId: 42,
    dayOfWeek: 1,
    startTime: "10:00",
    endTime: "18:00",
    isOpen: true,
  },
  {
    id: 3,
    spaceId: 42,
    dayOfWeek: 2,
    startTime: "10:00",
    endTime: "18:00",
    isOpen: true,
  },
  {
    id: 4,
    spaceId: 42,
    dayOfWeek: 3,
    startTime: "10:00",
    endTime: "18:00",
    isOpen: true,
  },
  {
    id: 5,
    spaceId: 42,
    dayOfWeek: 4,
    startTime: "10:00",
    endTime: "18:00",
    isOpen: true,
  },
  {
    id: 6,
    spaceId: 42,
    dayOfWeek: 5,
    startTime: "10:00",
    endTime: "18:00",
    isOpen: true,
  },
  {
    id: 7,
    spaceId: 42,
    dayOfWeek: 6,
    startTime: "10:00",
    endTime: "18:00",
    isOpen: false,
  },
];
const expectedAvailabilityPayload = existingAvailabilityPayload.map(
  ({ dayOfWeek, startTime, endTime, isOpen }) => ({
    dayOfWeek,
    startTime,
    endTime,
    isOpen,
  }),
);

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

describe("host edit space page", () => {
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

  it("prefills the shared form and updates the space with the existing field scope", async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
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
              availability: existingAvailabilityPayload,
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

        if (url.endsWith("/spaces/42") && init?.method === "PUT") {
          return {
            ok: true,
            json: async () => ({ id: 42 }),
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
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Edit Space");
    expect(container.textContent).toContain("Availability");
    expect(container.textContent).not.toContain("Space Type");
    expect(
      container.querySelector('a[href="/host/spaces"]')?.textContent,
    ).toContain("Back to Spaces");

    const nameInput = container.querySelector(
      'input[placeholder="e.g. Modern Downtown Meeting Room"]',
    ) as HTMLInputElement | null;
    const descriptionInput = container.querySelector(
      'textarea[placeholder="Detailed description of your space"]',
    ) as HTMLTextAreaElement | null;
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
    const amenityButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Projector"),
    ) as HTMLButtonElement | undefined;
    const instantBook = container.querySelector(
      "#instantBook",
    ) as HTMLInputElement | null;
    const form = container.querySelector("form");

    expect(nameInput?.value).toBe("Riverside Loft");
    expect(descriptionInput?.value).toContain("Bright loft for team meetings");
    expect(hourlyInput?.value).toBe("45");
    expect(dailyInput?.value).toBe("240");
    expect(categorySelect?.value).toBe("retail-store-shop-front");
    expect(amenityButton?.className).toContain("bg-primary/10");
    expect(instantBook?.checked).toBe(true);
    expect(
      container.querySelector('button[type="submit"]')?.textContent,
    ).toContain("Update Space");

    if (!nameInput || !hourlyInput || !dailyInput || !instantBook || !form) {
      throw new Error("Missing edit form controls");
    }

    await act(async () => {
      setInputValue(nameInput, "Riverside Loft Annex");
      setInputValue(hourlyInput, "55");
      setInputValue(dailyInput, "300");
      instantBook.click();
    });

    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    const updateRequest = fetchMock.mock.calls.find(
      ([url, init]) =>
        url.toString().endsWith("/spaces/42") && init?.method === "PUT",
    );

    expect(updateRequest).toBeDefined();
    expect(JSON.parse(updateRequest?.[1]?.body as string)).toEqual({
      name: "Riverside Loft Annex",
      shortDescription: "Bright loft for team meetings",
      description:
        "Bright loft for team meetings, planning sessions, and workshops with flexible furniture and natural light.",
      spaceType: "MEETING_ROOM",
      pricingType: "BOTH",
      pricePerHour: 55,
      pricePerDay: 300,
      pricePerMonth: null,
      capacity: 12,
      venueId: 7,
      instantBook: false,
      cancellationPolicy: "STRICT",
      houseRules: "Leave the studio as you found it.",
      categorySlug: "retail-store-shop-front",
      amenityIds: [2],
      images: ["/loft.jpg"],
      nameTranslations: null,
      shortDescTranslations: null,
      descriptionTranslations: null,
      videoUrl: null,
      currency: "USD",
      pricingTiers: [],
      monthlyPlans: [],
      availability: expectedAvailabilityPayload,
    });
    const updateHeaders = updateRequest?.[1]?.headers as Headers;
    expect(updateHeaders).toBeInstanceOf(Headers);
    expect(updateHeaders.get("content-type")).toBe("application/json");
    expect(updateHeaders.get("authorization")).toBe("Bearer test-token");
    expect(push).toHaveBeenCalledWith("/host/spaces");
  });
});
