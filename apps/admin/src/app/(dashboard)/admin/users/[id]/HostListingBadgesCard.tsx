"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Megaphone, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";
import type { User, VerificationStatus } from "@repo/types";

// The admin badge card manages the public "Verified" BADGE
// (`hostVerificationStatus`), which is distinct from the `hostVerified`
// authorization flag on `User`. The badge status is not on the shared `User`
// type, so we widen it here for display/toggle purposes only.
type HostBadgeUser = User & {
  hostVerificationStatus?: VerificationStatus;
};

interface HostListingBadgesCardProps {
  user: HostBadgeUser;
  onUpdated: () => void;
}

const badgeOptions = [
  {
    key: "hostVerified",
    label: "Verified",
    description: "Marks this host as checked by the platform.",
    icon: BadgeCheck,
  },
  {
    key: "hostRecommended",
    label: "Recommended",
    description: "Lifts this host above ordinary verified hosts.",
    icon: Star,
  },
  {
    key: "hostSponsored",
    label: "Sponsored",
    description: "Gives this host the highest listing priority.",
    icon: Megaphone,
  },
] as const;

const HostListingBadgesCard = ({ user, onUpdated }: HostListingBadgesCardProps) => {
  // The "Verified" toggle reflects the BADGE status, not the auth flag. The PUT
  // sends a `hostVerified` boolean, which the endpoint maps to the badge status.
  const [values, setValues] = useState({
    hostVerified: user.hostVerificationStatus === "VERIFIED",
    hostRecommended: user.hostRecommended,
    hostSponsored: user.hostSponsored,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setValues({
      hostVerified: user.hostVerificationStatus === "VERIFIED",
      hostRecommended: user.hostRecommended,
      hostSponsored: user.hostSponsored,
    });
  }, [user.hostRecommended, user.hostSponsored, user.hostVerificationStatus]);

  const handleSave = async () => {
    setError(null);
    setSavedAt(null);
    setIsSaving(true);

    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/hosts/${user.id}/listing-badges`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || "Failed to update listing badges");
        return;
      }

      setSavedAt(Date.now());
      onUpdated();
    } catch (err) {
      if (err instanceof UnauthenticatedError) {
        setError("Session expired. Please sign in again.");
        return;
      }
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-primary-foreground p-4 rounded-lg space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Listing badges</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sponsored hosts rank first, then recommended, then verified.
        </p>
      </div>

      <div className="space-y-3">
        {badgeOptions.map(({ key, label, description, icon: Icon }) => (
          <label
            key={key}
            className="flex items-start gap-3 rounded-md border border-border/60 bg-background px-3 py-3"
          >
            <Checkbox
              checked={values[key]}
              onCheckedChange={(checked) =>
                setValues((prev) => ({ ...prev, [key]: checked === true }))
              }
              disabled={isSaving}
              className="mt-0.5"
            />
            <span className="flex min-w-0 flex-1 gap-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="text-sm font-medium">{label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {description}
                </span>
              </span>
            </span>
          </label>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {savedAt && !error && <div className="text-sm text-emerald-600">Saved.</div>}

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save badges"}
      </Button>
    </div>
  );
};

export default HostListingBadgesCard;
