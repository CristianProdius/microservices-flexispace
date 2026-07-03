"use client";

import { Plus, X } from "lucide-react";
import { PRICING_TIER_PRESETS, CURRENCY_SYMBOLS } from "@repo/types";
import { fieldClassName, labelClassName } from "./space-form.shared";

interface PricingTier {
  minutes: number;
  label: string;
  price: string;
  comment?: string;
}

interface PricingTiersEditorProps {
  tiers: PricingTier[];
  onChange: (tiers: PricingTier[]) => void;
  currency: string;
}

const PricingTiersEditor = ({
  tiers,
  onChange,
  currency,
}: PricingTiersEditorProps) => {
  const currencySymbol =
    CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency;
  const dayMinutes = 24 * 60;
  const customDaysValue = "custom-days";
  const customMinutesValue = "custom-minutes";
  const presetForMinutes = (minutes: number) =>
    PRICING_TIER_PRESETS.find((preset) => preset.minutes === minutes);
  const isWholeDayDuration = (minutes: number) =>
    minutes >= dayMinutes && minutes % dayMinutes === 0;
  const durationValueForTier = (minutes: number) => {
    if (presetForMinutes(minutes)) return minutes.toString();
    return isWholeDayDuration(minutes) ? customDaysValue : customMinutesValue;
  };
  const formatDayLabel = (days: number) =>
    `${days} ${days === 1 ? "day" : "days"}`;
  const formatMinuteLabel = (minutes: number) =>
    `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  const customDaysFromMinutes = (minutes: number) => {
    if (isWholeDayDuration(minutes)) {
      return minutes / dayMinutes;
    }
    return 10;
  };
  const customMinutesFromMinutes = (minutes: number) =>
    Number.isInteger(minutes) && minutes > 0 ? minutes : 60;
  const normalizeDays = (value: string) => {
    const days = parseInt(value, 10);
    return Number.isInteger(days) && days > 0 ? days : 1;
  };
  const normalizeMinutes = (value: string) => {
    const minutes = parseInt(value, 10);
    return Number.isInteger(minutes) && minutes > 0 ? minutes : 1;
  };

  const addTier = () => {
    const firstUnused = PRICING_TIER_PRESETS.find(
      (preset) => !tiers.some((t) => t.minutes === preset.minutes),
    );
    const newTier: PricingTier = firstUnused
      ? {
          minutes: firstUnused.minutes,
          label: firstUnused.label,
          price: "",
          comment: "",
        }
      : { minutes: 60, label: "1 hour", price: "", comment: "" };
    onChange([...tiers, newTier]);
  };

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (
    index: number,
    field: keyof PricingTier,
    value: string | number,
  ) => {
    const updated = tiers.map((tier, i) => {
      if (i !== index) return tier;
      if (field === "minutes") {
        const minutes = typeof value === "string" ? parseInt(value, 10) : value;
        const preset = PRICING_TIER_PRESETS.find((p) => p.minutes === minutes);
        return { ...tier, minutes, label: preset ? preset.label : tier.label };
      }
      return { ...tier, [field]: value };
    });
    onChange(updated);
  };

  const updateDuration = (index: number, value: string) => {
    if (value !== customDaysValue && value !== customMinutesValue) {
      updateTier(index, "minutes", value);
      return;
    }

    const currentMinutes = tiers[index]?.minutes ?? 0;
    const minutes =
      value === customDaysValue
        ? (presetForMinutes(currentMinutes)
            ? 10
            : customDaysFromMinutes(currentMinutes)) * dayMinutes
        : customMinutesFromMinutes(currentMinutes);
    const label =
      value === customDaysValue
        ? formatDayLabel(minutes / dayMinutes)
        : presetForMinutes(currentMinutes)
          ? formatMinuteLabel(minutes)
          : tiers[index]?.label || formatMinuteLabel(minutes);
    const updated = tiers.map((tier, i) =>
      i === index ? { ...tier, minutes, label } : tier,
    );
    onChange(updated);
  };

  const updateCustomDays = (index: number, value: string) => {
    const days = normalizeDays(value);
    const updated = tiers.map((tier, i) =>
      i === index
        ? {
            ...tier,
            minutes: days * dayMinutes,
            label: formatDayLabel(days),
          }
        : tier,
    );
    onChange(updated);
  };

  const updateCustomMinutes = (index: number, value: string) => {
    const minutes = normalizeMinutes(value);
    const updated = tiers.map((tier, i) =>
      i === index
        ? {
            ...tier,
            minutes,
            label: formatMinuteLabel(minutes),
          }
        : tier,
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className={labelClassName}>Pricing Tiers</label>
      <p className="text-sm text-muted-foreground">
        Define interval-based pricing for longer bookings. These override the
        default hourly/daily rates.
      </p>

      {tiers.map((tier, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              {index === 0 && (
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Duration
                </label>
              )}
              <select
                value={durationValueForTier(tier.minutes)}
                onChange={(e) => updateDuration(index, e.target.value)}
                className={fieldClassName}
              >
                {PRICING_TIER_PRESETS.map((preset) => (
                  <option key={preset.minutes} value={preset.minutes}>
                    {preset.label}
                  </option>
                ))}
                <option value={customDaysValue}>Custom days</option>
                <option value={customMinutesValue}>Custom minutes</option>
              </select>
            </div>

            {durationValueForTier(tier.minutes) === customDaysValue && (
              <div className="w-28 shrink-0">
                {index === 0 && (
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Days
                  </label>
                )}
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customDaysFromMinutes(tier.minutes)}
                  onChange={(e) => updateCustomDays(index, e.target.value)}
                  className={fieldClassName}
                  aria-label="Custom duration in days"
                />
              </div>
            )}

            {durationValueForTier(tier.minutes) === customMinutesValue && (
              <div className="w-32 shrink-0">
                {index === 0 && (
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Minutes
                  </label>
                )}
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customMinutesFromMinutes(tier.minutes)}
                  onChange={(e) => updateCustomMinutes(index, e.target.value)}
                  className={fieldClassName}
                  aria-label="Custom duration in minutes"
                />
              </div>
            )}

            <div className="flex-1">
              {index === 0 && (
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Label
                </label>
              )}
              <input
                type="text"
                value={tier.label}
                onChange={(e) => updateTier(index, "label", e.target.value)}
                className={fieldClassName}
                placeholder="e.g. Half day"
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
                value={tier.price}
                onChange={(e) => updateTier(index, "price", e.target.value)}
                className={fieldClassName}
                placeholder={currencySymbol}
              />
            </div>

            <button
              type="button"
              onClick={() => removeTier(index)}
              className="mb-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label={`Remove tier ${index + 1}`}
            >
              <X className="size-4" />
            </button>
          </div>

          <textarea
            rows={2}
            value={tier.comment ?? ""}
            onChange={(e) => updateTier(index, "comment", e.target.value)}
            className={fieldClassName}
            maxLength={300}
            placeholder="Optional comment (e.g. subscription details)"
            aria-label={`Comment for tier ${index + 1}`}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addTier}
        className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Plus className="size-4" />
        Add tier
      </button>
    </div>
  );
};

export default PricingTiersEditor;
