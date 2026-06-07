"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import SpaceForm from "@/components/spaces/space-form";
import {
  PRODUCT_SERVICE_URL,
  type SpaceFormPayload,
} from "@/components/spaces/space-form.shared";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";

const NewSpacePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const venueIdParam = searchParams.get("venueId");
  const defaultVenueId = venueIdParam ? parseInt(venueIdParam, 10) : undefined;

  const handleCreate = useCallback(
    async (payload: SpaceFormPayload) => {
      try {
        const response = await apiFetch(`${PRODUCT_SERVICE_URL}/spaces`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ message: "" }));
          throw new Error(data.message || "Failed to create space");
        }

        router.push("/host/spaces");
      } catch (error) {
        if (error instanceof UnauthenticatedError) {
          router.push("/login");
          throw new Error("Please sign in again.");
        }
        throw error;
      }
    },
    [router]
  );

  return (
    <SpaceForm
      title="Create New Space"
      description="Fill in the details to list your space"
      backHref="/host/spaces"
      defaultVenueId={defaultVenueId}
      submitLabel="Create Space"
      submittingLabel="Creating..."
      onSubmit={handleCreate}
    />
  );
};

export default NewSpacePage;
