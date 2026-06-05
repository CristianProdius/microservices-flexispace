"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import SpaceForm from "@/components/spaces/space-form";
import {
  PRODUCT_SERVICE_URL,
  type SpaceFormPayload,
} from "@/components/spaces/space-form.shared";
import useAuthStore from "@/stores/authStore";

const NewSpacePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken, isLoading: authLoading } = useAuthStore();
  const [token, setToken] = useState<string | null>(null);
  const venueIdParam = searchParams.get("venueId");
  const defaultVenueId = venueIdParam ? parseInt(venueIdParam, 10) : undefined;

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
    async (payload: SpaceFormPayload) => {
      const resolvedToken = token ?? (await getToken());

      if (!resolvedToken) {
        router.push("/login");
        throw new Error("Please sign in again.");
      }

      const response = await fetch(`${PRODUCT_SERVICE_URL}/spaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resolvedToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: "" }));
        throw new Error(data.message || "Failed to create space");
      }

      router.push("/host/spaces");
    },
    [getToken, router, token]
  );

  return (
    <SpaceForm
      title="Create New Space"
      description="Fill in the details to list your space"
      backHref="/host/spaces"
      token={token}
      defaultVenueId={defaultVenueId}
      submitLabel="Create Space"
      submittingLabel="Creating..."
      onSubmit={handleCreate}
    />
  );
};

export default NewSpacePage;
