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

import MonthlyPlansEditor from "./monthly-plans-editor";

type Plan = {
  name: string;
  pricePerMonth: string;
  description?: string;
};

const EditorHarness = ({
  initialPlans = [],
  onChange,
}: {
  initialPlans?: Plan[];
  onChange: (plans: Plan[]) => void;
}) => {
  const [plans, setPlans] = React.useState<Plan[]>(initialPlans);

  return (
    <MonthlyPlansEditor
      plans={plans}
      onChange={(nextPlans) => {
        onChange(nextPlans);
        setPlans(nextPlans);
      }}
      currency="MDL"
    />
  );
};

const renderEditor = async (
  container: HTMLDivElement,
  onChange: (plans: Plan[]) => void,
  initialPlans?: Plan[],
) => {
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <EditorHarness initialPlans={initialPlans} onChange={onChange} />,
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

describe("MonthlyPlansEditor", () => {
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

  const clickAddPlan = async () => {
    const addButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Add plan"),
    );

    expect(addButton).toBeDefined();

    await act(async () => {
      addButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  };

  it("appends a blank plan row and emits it", async () => {
    const onChange = vi.fn();

    await act(async () => {
      root.unmount();
    });
    root = await renderEditor(container, onChange);
    await clickAddPlan();

    expect(onChange).toHaveBeenLastCalledWith([
      { name: "", pricePerMonth: "", description: "" },
    ]);
  });

  it("defaults description to an empty string when adding a plan", async () => {
    const onChange = vi.fn();

    await act(async () => {
      root.unmount();
    });
    root = await renderEditor(container, onChange);
    await clickAddPlan();

    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ description: "" }),
    ]);
  });

  it("emits name changes via updatePlan", async () => {
    const onChange = vi.fn();

    await act(async () => {
      root.unmount();
    });
    root = await renderEditor(container, onChange, [
      { name: "", pricePerMonth: "100", description: "" },
    ]);

    const nameInput = container.querySelector(
      'input[type="text"]',
    ) as HTMLInputElement;

    await act(async () => {
      setInputValue(nameInput, "Hot desk");
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(onChange).toHaveBeenLastCalledWith([
      { name: "Hot desk", pricePerMonth: "100", description: "" },
    ]);
  });

  it("emits price changes via updatePlan", async () => {
    const onChange = vi.fn();

    await act(async () => {
      root.unmount();
    });
    root = await renderEditor(container, onChange, [
      { name: "Hot desk", pricePerMonth: "", description: "" },
    ]);

    const priceInput = container.querySelector(
      'input[type="number"]',
    ) as HTMLInputElement;

    await act(async () => {
      setInputValue(priceInput, "150");
      priceInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(onChange).toHaveBeenLastCalledWith([
      { name: "Hot desk", pricePerMonth: "150", description: "" },
    ]);
  });

  it("emits description changes via updatePlan", async () => {
    const onChange = vi.fn();

    await act(async () => {
      root.unmount();
    });
    root = await renderEditor(container, onChange, [
      { name: "Hot desk", pricePerMonth: "150", description: "" },
    ]);

    const descriptionTextarea = container.querySelector(
      "textarea",
    ) as HTMLTextAreaElement;

    await act(async () => {
      setTextareaValue(descriptionTextarea, "Includes 24/7 access");
      descriptionTextarea.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(onChange).toHaveBeenLastCalledWith([
      {
        name: "Hot desk",
        pricePerMonth: "150",
        description: "Includes 24/7 access",
      },
    ]);
  });

  it("removes a plan row", async () => {
    const onChange = vi.fn();

    await act(async () => {
      root.unmount();
    });
    root = await renderEditor(container, onChange, [
      { name: "Hot desk", pricePerMonth: "150", description: "" },
      { name: "Dedicated desk", pricePerMonth: "250", description: "" },
    ]);

    const removeButton = container.querySelector(
      'button[aria-label="Remove plan 1"]',
    ) as HTMLButtonElement;

    await act(async () => {
      removeButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onChange).toHaveBeenLastCalledWith([
      { name: "Dedicated desk", pricePerMonth: "250", description: "" },
    ]);
  });

  it("renders the existing description for a loaded plan", async () => {
    await act(async () => {
      root.unmount();
    });
    root = await renderEditor(container, vi.fn(), [
      { name: "Hot desk", pricePerMonth: "150", description: "Flexible" },
    ]);

    const descriptionTextarea = container.querySelector(
      "textarea",
    ) as HTMLTextAreaElement | null;

    expect(descriptionTextarea).not.toBeNull();
    expect(descriptionTextarea?.value).toBe("Flexible");
  });
});
