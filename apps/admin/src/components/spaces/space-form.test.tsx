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

  // Flexible pricing: all three rate inputs are always shown (each optional) and
  // there is no single pricing-type dropdown — the offered modes are derived from
  // whichever rates the host fills in.
  it("shows all three rate inputs for an office category", async () => {
    await renderForm({
      ...createEmptySpaceFormValues(),
      spaceType: "OFFICE_DESK",
    });

    expect(container.textContent).toContain("Price Per Hour");
    expect(container.textContent).toContain("Price Per Day");
    expect(container.textContent).toContain("Price Per Month");
  });

  it("shows all three rate inputs for a non-office category too", async () => {
    await renderForm({
      ...createEmptySpaceFormValues(),
      spaceType: "MEETING_ROOM",
    });

    expect(container.textContent).toContain("Price Per Hour");
    expect(container.textContent).toContain("Price Per Day");
    expect(container.textContent).toContain("Price Per Month");
  });

  it("no longer renders a pricing-type dropdown", async () => {
    await renderForm({
      ...createEmptySpaceFormValues(),
      spaceType: "MEETING_ROOM",
    });

    expect(getPricingSelect(container)).toBeUndefined();
  });
});
