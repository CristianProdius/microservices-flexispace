"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useAuthStore from "@/stores/authStore";
import type { User } from "@repo/types";

interface CommissionRateCardProps {
  user: User;
  onUpdated: () => void;
}

// Convert the stored fraction (0.1) to the percent string we show in the
// input (10), and back. Empty string in either direction means "no override".
const fractionToPercent = (rate: number | null | undefined): string =>
  typeof rate === "number" ? String(rate * 100) : "";

const CommissionRateCard = ({ user, onUpdated }: CommissionRateCardProps) => {
  const { getToken } = useAuthStore();
  const [percentInput, setPercentInput] = useState<string>(
    fractionToPercent(user.commissionRate)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const hasOverride = typeof user.commissionRate === "number";

  const handleSave = async () => {
    setError(null);
    setSavedAt(null);

    // Parse the input. Empty = clear the override (use platform default).
    const trimmed = percentInput.trim();
    let nextRate: number | null;
    if (trimmed === "") {
      nextRate = null;
    } else {
      const asNumber = Number.parseFloat(trimmed);
      if (!Number.isFinite(asNumber) || asNumber < 0 || asNumber > 100) {
        setError("Enter a percentage between 0 and 100 (or leave empty to use the platform default).");
        return;
      }
      nextRate = asNumber / 100;
    }

    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) {
        setError("Session expired. Please sign in again.");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/users/${user.id}/commission-rate`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ commissionRate: nextRate }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || "Failed to update commission rate");
        return;
      }

      setSavedAt(Date.now());
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setPercentInput("");
    // Submit the clear immediately so the operator doesn't have to press Save.
    setError(null);
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) {
        setError("Session expired. Please sign in again.");
        return;
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/users/${user.id}/commission-rate`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ commissionRate: null }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || "Failed to clear commission rate");
        return;
      }
      setSavedAt(Date.now());
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-primary-foreground p-4 rounded-lg space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Platform commission</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Per-host override on the platform commission. The fee is taken out of
          the host&apos;s payout — the client pays the listed price. Leave empty
          to use the platform default.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="commissionRate">Commission rate (%)</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="commissionRate"
            type="number"
            min={0}
            max={100}
            step="0.1"
            inputMode="decimal"
            placeholder="Platform default"
            value={percentInput}
            onChange={(e) => setPercentInput(e.target.value)}
            disabled={isSaving}
            className="max-w-[180px]"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {hasOverride
            ? `Current override: ${(user.commissionRate! * 100).toFixed(2)}%`
            : "No override set — using the platform default."}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {savedAt && !error && (
        <div className="text-sm text-emerald-600">Saved.</div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
        {hasOverride && (
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={isSaving}
          >
            Clear override
          </Button>
        )}
      </div>
    </div>
  );
};

export default CommissionRateCard;
