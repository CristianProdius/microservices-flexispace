"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import VenueForm from "@/components/venues/venue-form";
import {
  PRODUCT_SERVICE_URL,
  type VenueFormPayload,
} from "@/components/venues/venue-form.shared";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";

const NewVenuePage = () => {
  const router = useRouter();

  const handleCreate = useCallback(
    async (payload: VenueFormPayload) => {
      try {
        const response = await apiFetch(`${PRODUCT_SERVICE_URL}/venues`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ message: "" }));
          throw new Error(data.message || "Failed to create venue");
        }

        router.push("/host/venues");
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
    <VenueForm
      title="Create New Venue"
      description="Fill in the details for your venue property"
      backHref="/host/venues"
      submitLabel="Create Venue"
      submittingLabel="Creating..."
      onSubmit={handleCreate}
    />
  );
};

export default NewVenuePage;
