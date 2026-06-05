"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/stores/authStore";
import { DashboardPageHeader } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "react-toastify";

const PRODUCT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || "http://localhost:8000";

interface ExchangeRate {
  id: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  updatedAt: string;
  updatedBy: string | null;
}

const ExchangeRatesPage = () => {
  const { token } = useAuthStore();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Store the raw string from the input so partial typing ("0", "1.", "")
  // round-trips correctly. We only parse at save time.
  const [editedRates, setEditedRates] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const res = await fetch(`${PRODUCT_SERVICE_URL}/currencies/rates`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setRates(data);
      } else {
        toast.error("Failed to load exchange rates");
      }
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      toast.error("Error loading exchange rates");
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (id: number, value: string) => {
    setEditedRates((prev) => {
      const original = rates.find((rate) => rate.id === id);
      // Treat "edited value equals original" as not-dirty so the Save All
      // button correctly disables once the user reverts their edit.
      if (original && value === String(original.rate)) {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: value };
    });
  };

  const hasChanges = Object.keys(editedRates).length > 0;

  const handleSaveAll = async () => {
    if (!hasChanges) return;

    // Validate every dirty row before issuing the request.
    const invalid: string[] = [];
    const parsedEdits: Record<number, number> = {};
    for (const [idStr, raw] of Object.entries(editedRates)) {
      const id = Number(idStr);
      const original = rates.find((rate) => rate.id === id);
      const numValue = parseFloat(raw);
      if (Number.isNaN(numValue) || numValue <= 0) {
        invalid.push(
          original
            ? `${original.fromCurrency} → ${original.toCurrency}`
            : `rate #${id}`
        );
        continue;
      }
      parsedEdits[id] = numValue;
    }

    if (invalid.length > 0) {
      toast.error(`Enter a positive rate for: ${invalid.join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      const updatedRates = rates.map((rate) => ({
        id: rate.id,
        fromCurrency: rate.fromCurrency,
        toCurrency: rate.toCurrency,
        rate: parsedEdits[rate.id] ?? rate.rate,
      }));

      const res = await fetch(`${PRODUCT_SERVICE_URL}/currencies/rates`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedRates),
      });

      if (res.ok) {
        const data = await res.json();
        setRates(data);
        setEditedRates({});
        toast.success("Exchange rates updated successfully");
      } else {
        const errData = await res.json().catch(() => null);
        toast.error(errData?.message || "Failed to update exchange rates");
      }
    } catch (error) {
      console.error("Error saving exchange rates:", error);
      toast.error("Error saving exchange rates");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card px-4 py-6 text-sm text-muted-foreground shadow-sm">
        Loading exchange rates...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Exchange Rates"
        description="Manage currency exchange rates for the platform"
        action={
          <Button onClick={handleSaveAll} disabled={!hasChanges || saving}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save All
              </>
            )}
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                From
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                To
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Rate
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rates.map((rate) => (
              <tr
                key={rate.id}
                className="transition-colors hover:bg-accent/30"
              >
                <td className="px-4 py-3 text-sm font-medium text-card-foreground">
                  {rate.fromCurrency}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-card-foreground">
                  {rate.toCurrency}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={editedRates[rate.id] ?? String(rate.rate)}
                    onChange={(e) => handleRateChange(rate.id, e.target.value)}
                    className="w-36 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(rate.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rates.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-muted-foreground">
              No exchange rates configured
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExchangeRatesPage;
