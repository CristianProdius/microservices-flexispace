"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import VenueForm from "@/components/venues/venue-form";
import {
  PRODUCT_SERVICE_URL,
  type VenueFormPayload,
} from "@/components/venues/venue-form.shared";
import useAuthStore from "@/stores/authStore";

const NewVenuePage = () => {
  const router = useRouter();
  const { getToken, isLoading: authLoading } = useAuthStore();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    let cancelled = false;
    (async () => {
      const resolved = await getToken();
      if (cancelled) return;
      if (!resolved) {
        router.push("/login");
        return;
      }
      setToken(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, getToken, router]);

  const handleCreate = useCallback(
    async (payload: VenueFormPayload) => {
      const resolvedToken = token ?? (await getToken());

      if (!resolvedToken) {
        router.push("/login");
        throw new Error("Please sign in again.");
      }

      const response = await fetch(`${PRODUCT_SERVICE_URL}/venues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resolvedToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: "" }));
        throw new Error(data.message || "Failed to create venue");
      }

      router.push("/host/venues");
    },
    [getToken, router, token]
  );

  return (
    <VenueForm
      title="Create New Venue"
      description="Fill in the details for your venue property"
      backHref="/host/venues"
      token={token}
      submitLabel="Create Venue"
      submittingLabel="Creating..."
      onSubmit={handleCreate}
    />
  );
};

export default NewVenuePage;
