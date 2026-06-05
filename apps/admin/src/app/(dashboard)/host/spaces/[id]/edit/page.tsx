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
import type { Space } from "@repo/types";

const HostEditSpacePage = () => {
  const params = useParams();
  const router = useRouter();
  const { getToken, isLoading: authLoading } = useAuthStore();
  const id = params.id as string;
  const [token, setToken] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<SpaceFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchSpace = useCallback(async () => {
    setLoadError(null);

    try {
      const resolvedToken = await getToken();

      if (!resolvedToken) {
        router.push("/login");
        return;
      }

      setToken(resolvedToken);

      const response = await fetch(`${PRODUCT_SERVICE_URL}/spaces/${id}`, {
        headers: {
          Authorization: `Bearer ${resolvedToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: "" }));
        throw new Error(data.message || "Failed to load space");
      }

      const data = (await response.json()) as Space;
      setInitialValues(mapSpaceToFormValues(data));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load space");
    } finally {
      setIsLoading(false);
    }
  }, [getToken, id, router]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    fetchSpace();
  }, [authLoading, fetchSpace]);

  const handleUpdate = async (payload: SpaceFormPayload) => {
    const resolvedToken = token ?? (await getToken());

    if (!resolvedToken) {
      router.push("/login");
      throw new Error("Please sign in again.");
    }

    const response = await fetch(`${PRODUCT_SERVICE_URL}/spaces/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resolvedToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: "" }));
      throw new Error(data.message || "Failed to update space");
    }

    router.push("/host/spaces");
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
      token={token}
      initialValues={initialValues}
      submitLabel="Update Space"
      submittingLabel="Saving..."
      onSubmit={handleUpdate}
    />
  );
};

export default HostEditSpacePage;
