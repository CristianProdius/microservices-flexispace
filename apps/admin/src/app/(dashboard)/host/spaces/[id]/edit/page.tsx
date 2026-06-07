"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { DashboardPageHeader, DashboardSection } from "@/components/dashboard";
import SpaceForm from "@/components/spaces/space-form";
import {
  PRODUCT_SERVICE_URL,
  mapSpaceToFormValues,
  type SpaceFormPayload,
  type SpaceFormValues,
} from "@/components/spaces/space-form.shared";
import { Skeleton } from "@/components/ui/skeleton";
import useAuthStore from "@/stores/authStore";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";
import type { Space } from "@repo/types";

const HostEditSpacePage = () => {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading } = useAuthStore();
  const id = params.id as string;
  const [initialValues, setInitialValues] = useState<SpaceFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchSpace = useCallback(async () => {
    setLoadError(null);

    try {
      const response = await apiFetch(`${PRODUCT_SERVICE_URL}/spaces/${id}`);

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: "" }));
        throw new Error(data.message || "Failed to load space");
      }

      const data = (await response.json()) as Space;
      setInitialValues(mapSpaceToFormValues(data));
    } catch (error) {
      if (error instanceof UnauthenticatedError) {
        router.push("/login");
        return;
      }
      setLoadError(error instanceof Error ? error.message : "Failed to load space");
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    fetchSpace();
  }, [authLoading, fetchSpace]);

  const handleUpdate = async (payload: SpaceFormPayload) => {
    try {
      const response = await apiFetch(`${PRODUCT_SERVICE_URL}/spaces/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: "" }));
        throw new Error(data.message || "Failed to update space");
      }

      router.push("/host/spaces");
    } catch (error) {
      if (error instanceof UnauthenticatedError) {
        router.push("/login");
        throw new Error("Please sign in again.");
      }
      throw error;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="space-y-8">
        <DashboardPageHeader
          title="Edit Space"
          description="Update the details for your listing"
        />
        <DashboardSection title="Loading space details">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </DashboardSection>
      </div>
    );
  }

  if (!initialValues) {
    return (
      <div className="space-y-8">
        <DashboardPageHeader
          title="Edit Space"
          description="Update the details for your listing"
        />
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {loadError || "Space not found"}
        </div>
      </div>
    );
  }

  return (
    <SpaceForm
      title="Edit Space"
      description="Update the details for your listing"
      backHref="/host/spaces"
      initialValues={initialValues}
      submitLabel="Update Space"
      submittingLabel="Saving..."
      onSubmit={handleUpdate}
    />
  );
};

export default HostEditSpacePage;
