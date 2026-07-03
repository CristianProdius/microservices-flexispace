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

import PricingTiersEditor from "./pricing-tiers-editor";

type Tier = {
  minutes: number;
  label: string;
  price: string;
  comment?: string;
};

const EditorHarness = ({
  initialTiers = [],
  onChange,
}: {
  initialTiers?: Tier[];
  onChange: (tiers: Tier[]) => void;
}) => {
  const [tiers, setTiers] = React.useState<Tier[]>(initialTiers);

  return (
    <PricingTiersEditor
      tiers={tiers}
      onChange={(nextTiers) => {
        onChange(nextTiers);
        setTiers(nextTiers);
      }}
      currency="MDL"
    />
  );
};

const renderEditor = async (
  container: HTMLDivElement,
  onChange: (tiers: Tier[]) => void,
  initialTiers?: Tier[],
) => {
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <EditorHarness initialTiers={initialTiers} onChange={onChange} />,
    );
  });
  return root;
};

const setInputValue = (input: HTMLInputElement, value: string) => {
  const valueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  valueSetter?.call(input, value);
};

const setTextareaValue = (textarea: HTMLTextAreaElement, value: string) => {
  const valueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value",
  )?.set;
  valueSetter?.call(textarea, value);
};

describe("PricingTiersEditor", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = await renderEditor(container, vi.fn());
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  const clickAddTier = async () => {
    const addButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Add tier"),
    );

    expect(addButton).toBeDefined();

    await act(async () => {
      addButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  };

  it("offers a 2 week preset duration", async () => {
    await clickAddTier();

    const optionLabels = Array.from(container.querySelectorAll("option")).map(
      (option) => option.textContent,
    );

    expect(optionLabels).toContain("2 weeks");
  });

  it("emits custom day durations as minute-based pricing tiers", async () => {
    const onChange = vi.fn();

    await act(async () => {
      root.unmount();
    });
    root = await renderEditor(container, onChange);
    await clickAddTier();

    let durationSelect = container.querySelector("select") as HTMLSelectElement;

    await act(async () => {
      durationSelect.value = "1440";
      durationSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });

    durationSelect = container.querySelector("select") as HTMLSelectElement;

    await act(async () => {
      durationSelect.value = "custom-days";
      durationSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const customDaysInput = container.querySelector(
      'input[aria-label="Custom duration in days"]',
    ) as HTMLInputElement | null;

    expect(customDaysInput).not.toBeNull();

    await act(async () => {
      setInputValue(customDaysInput!, "12");
      customDaysInput!.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(onChange).toHaveBeenLastCalledWith([
      {
        minutes: 12 * 24 * 60,
        label: "12 days",
        price: "",
        comment: "",
      },
    ]);
  });

  it("preserves existing non-preset minute durations in edit mode", async () => {
    await act(async () => {
      root.unmount();
    });
    root = await renderEditor(container, vi.fn(), [
      { minutes: 30, label: "Half hour", price: "10" },
    ]);

    const durationSelect = container.querySelector(
      "select",
    ) as HTMLSelectElement;
    const customMinutesInput = container.querySelector(
      'input[aria-label="Custom duration in minutes"]',
    ) as HTMLInputElement | null;
    const customDaysInput = container.querySelector(
      'input[aria-label="Custom duration in days"]',
    );

    expect(durationSelect.value).toBe("custom-minutes");
    expect(customMinutesInput?.value).toBe("30");
    expect(customDaysInput).toBeNull();
  });

  it("defaults comment to an empty string when adding a tier", async () => {
    const onChange = vi.fn();

    await act(async () => {
      root.unmount();
    });
    root = await renderEditor(container, onChange);
    await clickAddTier();

    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ comment: "" }),
    ]);
  });

  it("renders the existing comment for a loaded tier", async () => {
    await act(async () => {
      root.unmount();
    });
    root = await renderEditor(container, vi.fn(), [
      { minutes: 60, label: "1 hour", price: "10", comment: "Members only" },
    ]);

    const commentTextarea = container.querySelector(
      "textarea",
    ) as HTMLTextAreaElement | null;

    expect(commentTextarea).not.toBeNull();
    expect(commentTextarea?.value).toBe("Members only");
  });

  it("emits comment changes via updateTier", async () => {
    const onChange = vi.fn();

    await act(async () => {
      root.unmount();
    });
    root = await renderEditor(container, onChange, [
      { minutes: 60, label: "1 hour", price: "10", comment: "" },
    ]);

    const commentTextarea = container.querySelector(
      "textarea",
    ) as HTMLTextAreaElement;

    await act(async () => {
      setTextareaValue(commentTextarea, "Subscription details");
      commentTextarea.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(onChange).toHaveBeenLastCalledWith([
      {
        minutes: 60,
        label: "1 hour",
        price: "10",
        comment: "Subscription details",
      },
    ]);
  });
});
