"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import VenueForm from "@/components/venues/venue-form";
import HostField, { type HostSelection } from "@/components/venues/HostField";
import {
  PRODUCT_SERVICE_URL,
  type VenueFormPayload,
} from "@/components/venues/venue-form.shared";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";
import { createHostInvite } from "@/lib/invites";

const NewVenuePage = () => {
  const router = useRouter();
  const [host, setHost] = useState<HostSelection | null>(null);

  const handleCreate = useCallback(
    async (payload: VenueFormPayload) => {
      try {
        let hostId: string | undefined;
        let invited = false;

        if (host?.kind === "new") {
          if (!host.name.trim() || !host.email.trim()) {
            throw new Error("Enter the new host's name and email.");
          }
          const { userId } = await createHostInvite({
            name: host.name.trim(),
            email: host.email.trim(),
          });
          hostId = userId;
          invited = true;
        } else if (host?.kind === "existing") {
          hostId = host.id;
        }

        const response = await apiFetch(`${PRODUCT_SERVICE_URL}/venues`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(hostId ? { ...payload, hostId } : payload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ message: "" }));
          throw new Error(data.message || "Failed to create venue");
        }

        toast.success(
          invited ? "Venue created and invite emailed to the host." : "Venue created."
        );
        router.push("/host/venues");
      } catch (error) {
        if (error instanceof UnauthenticatedError) {
          router.push("/login");
          throw new Error("Please sign in again.");
        }
        throw error;
      }
    },
    [host, router]
  );

  return (
    <VenueForm
      title="Create New Venue"
      description="Fill in the details for your venue property"
      backHref="/host/venues"
      submitLabel="Create Venue"
      submittingLabel="Creating..."
      onSubmit={handleCreate}
      hostField={<HostField value={host} onChange={setHost} />}
    />
  );
};

export default NewVenuePage;
