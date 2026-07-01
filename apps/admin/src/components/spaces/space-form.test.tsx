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

import SpaceForm from "./space-form";
import { createEmptySpaceFormValues } from "./space-form.shared";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("img", { alt: (props.alt as string) ?? "" }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => React.createElement("a", { href }, children),
}));

vi.mock("@/lib/apiFetch", () => ({
  apiFetch: vi.fn(async () => ({ ok: false })),
}));

vi.mock("@/lib/uploadImage", () => ({
  uploadImage: vi.fn(async () => ({ url: "https://example.com/i.jpg" })),
}));

const noopSubmit = vi.fn(async () => {});

const getPricingSelect = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("select")).find((select) =>
    Array.from(select.options).some((option) => option.value === "MONTHLY"),
  );

const optionValues = (select: HTMLSelectElement) =>
  Array.from(select.options).map((option) => option.value);

describe("SpaceForm monthly pricing", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
    } as Response);
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  const renderForm = async (values: ReturnType<typeof createEmptySpaceFormValues>) => {
    root = createRoot(container);
    await act(async () => {
      root.render(
        <SpaceForm
          title="Edit"
          description="desc"
          backHref="/spaces"
          initialValues={values}
          submitLabel="Save"
          submittingLabel="Saving"
          onSubmit={noopSubmit}
        />,
      );
    });
  };

  it("excludes Both and includes Monthly for office categories", async () => {
    await renderForm({
      ...createEmptySpaceFormValues(),
      spaceType: "OFFICE_DESK",
      pricingType: "MONTHLY",
    });

    const pricingSelect = getPricingSelect(container);
    expect(pricingSelect).toBeDefined();
    expect(optionValues(pricingSelect!)).toEqual(["HOURLY", "DAILY", "MONTHLY"]);
    expect(optionValues(pricingSelect!)).not.toContain("BOTH");
  });

  it("repairs a stuck BOTH pricing type to Monthly for office categories", async () => {
    await renderForm({
      ...createEmptySpaceFormValues(),
      spaceType: "OFFICE_DESK",
      pricingType: "BOTH",
    });

    const pricingSelect = getPricingSelect(container);
    expect(pricingSelect).toBeDefined();
    expect(pricingSelect!.value).toBe("MONTHLY");
  });

  it("shows the Price per month input when pricingType is MONTHLY", async () => {
    await renderForm({
      ...createEmptySpaceFormValues(),
      spaceType: "OFFICE_DESK",
      pricingType: "MONTHLY",
    });

    expect(container.textContent).toContain("Price per month");
  });

  it("keeps Both and hides the monthly input for non-office categories", async () => {
    await renderForm({
      ...createEmptySpaceFormValues(),
      spaceType: "MEETING_ROOM",
      pricingType: "BOTH",
    });

    const pricingSelect = getPricingSelect(container);
    expect(pricingSelect).toBeDefined();
    expect(optionValues(pricingSelect!)).toEqual([
      "HOURLY",
      "DAILY",
      "MONTHLY",
      "BOTH",
    ]);
    expect(container.textContent).not.toContain("Price per month");
  });
});
