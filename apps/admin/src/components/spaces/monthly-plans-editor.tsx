"use client";

import { Plus, X } from "lucide-react";
import { CURRENCY_SYMBOLS } from "@repo/types";
import { fieldClassName, labelClassName } from "./space-form.shared";

interface MonthlyPlan {
  name: string;
  pricePerMonth: string;
  description?: string;
}

interface MonthlyPlansEditorProps {
  plans: MonthlyPlan[];
  onChange: (plans: MonthlyPlan[]) => void;
  currency: string;
}

const MonthlyPlansEditor = ({
  plans,
  onChange,
  currency,
}: MonthlyPlansEditorProps) => {
  const currencySymbol =
    CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency;

  const addPlan = () => {
    onChange([...plans, { name: "", pricePerMonth: "", description: "" }]);
  };

  const removePlan = (index: number) => {
    onChange(plans.filter((_, i) => i !== index));
  };

  const updatePlan = (
    index: number,
    field: keyof MonthlyPlan,
    value: string,
  ) => {
    const updated = plans.map((plan, i) =>
      i === index ? { ...plan, [field]: value } : plan,
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className={labelClassName}>Monthly Plans</label>
      <p className="text-sm text-muted-foreground">
        Offer several named monthly plans (e.g. Hot desk, Dedicated desk).
        Guests pick one when booking.
      </p>

      {plans.map((plan, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              {index === 0 && (
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Name
                </label>
              )}
              <input
                type="text"
                value={plan.name}
                onChange={(e) => updatePlan(index, "name", e.target.value)}
                className={fieldClassName}
                placeholder="e.g. Hot desk"
              />
            </div>

            <div className="flex-1">
              {index === 0 && (
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Price ({currencySymbol})
                </label>
              )}
              <input
                type="number"
                min="0"
                step="0.01"
                value={plan.pricePerMonth}
                onChange={(e) =>
                  updatePlan(index, "pricePerMonth", e.target.value)
                }
                className={fieldClassName}
                placeholder={currencySymbol}
              />
            </div>

            <button
              type="button"
              onClick={() => removePlan(index)}
              className="mb-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label={`Remove plan ${index + 1}`}
            >
              <X className="size-4" />
            </button>
          </div>

          <textarea
            rows={2}
            value={plan.description ?? ""}
            onChange={(e) => updatePlan(index, "description", e.target.value)}
            className={fieldClassName}
            maxLength={300}
            placeholder="Optional description (e.g. what's included)"
            aria-label={`Description for plan ${index + 1}`}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addPlan}
        className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Plus className="size-4" />
        Add plan
      </button>
    </div>
  );
};

export default MonthlyPlansEditor;
