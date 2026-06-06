"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";
import {
  BadgeCheck,
  Building2,
  EyeOff,
  Hotel,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Star,
  Trash2,
  Users,
} from "lucide-react";

import {
  DashboardActionCard,
  DataLoadError,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatCard,
} from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Space {
  id: number;
  name: string;
  images: string[];
  city: string;
  country: string;
  capacity: number;
  pricePerHour: number | null;
  pricePerDay: number | null;
  pricingType: "HOURLY" | "DAILY" | "BOTH";
  isActive: boolean;
  averageRating: number | null;
  totalReviews: number;
  venue?: {
    name: string;
  } | null;
}

const HostSpacesPage = () => {
  const router = useRouter();
  const { actingHostId } = useAuthStore();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const fetchSpaces = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      let res: Response;
      try {
        res = await apiFetch(
          `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/host/my`,
        );
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          router.push("/login");
          return;
        }
        throw err;
      }
      if (res.ok) {
        const data = await res.json();
        setSpaces(data);
      } else if (res.status === 401) {
        router.push("/login");
      } else {
        throw new Error("Failed to fetch spaces");
      }
    } catch (error) {
      console.error("Error fetching spaces:", error);
      setError(
        "Spaces could not be loaded. Check the product service and retry.",
      );
    }
    setLoading(false);
  }, [actingHostId, router]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const toggleSpaceStatus = async (spaceId: number, currentStatus: boolean) => {
    try {
      let res: Response;
      try {
        res = await apiFetch(
          `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/${spaceId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !currentStatus }),
          },
        );
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          router.push("/login");
          return;
        }
        throw err;
      }

      if (res.ok) {
        setSpaces((prev) =>
          prev.map((space) =>
            space.id === spaceId
              ? { ...space, isActive: !currentStatus }
              : space,
          ),
        );
      } else {
        throw new Error("Failed to update space status");
      }
    } catch (error) {
      console.error("Error toggling space status:", error);
      setError(
        "Space status could not be updated. Retry after checking the product service.",
      );
    }
    setMenuOpen(null);
  };

  const deleteSpace = async (spaceId: number) => {
    if (!confirm("Are you sure you want to delete this space?")) return;

    try {
      let res: Response;
      try {
        res = await apiFetch(
          `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/${spaceId}`,
          { method: "DELETE" },
        );
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          router.push("/login");
          return;
        }
        throw err;
      }

      if (res.ok) {
        setSpaces((prev) => prev.filter((space) => space.id !== spaceId));
      } else {
        throw new Error("Failed to delete space");
      }
    } catch (error) {
      console.error("Error deleting space:", error);
      setError(
        "Space could not be deleted. Retry after checking the product service.",
      );
    }
    setMenuOpen(null);
  };

  const getPriceDisplay = (space: Space) => {
    if (space.pricingType === "HOURLY" && space.pricePerHour) {
      return `$${space.pricePerHour}/hr`;
    }
    if (space.pricingType === "DAILY" && space.pricePerDay) {
      return `$${space.pricePerDay}/day`;
    }
    if (space.pricingType === "BOTH") {
      if (space.pricePerHour) return `$${space.pricePerHour}/hr`;
      if (space.pricePerDay) return `$${space.pricePerDay}/day`;
    }
    return "—";
  };

  const activeSpaces = spaces.filter((space) => space.isActive).length;
  const inactiveSpaces = spaces.length - activeSpaces;
  const reviewedSpaces = spaces.filter(
    (space) => space.averageRating != null && space.averageRating > 0,
  ).length;

  if (loading) {
    return (
      <div aria-busy="true" className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48 max-w-full" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="size-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="rounded-xl border border-border/60 bg-background px-4 py-5"
              >
                <div className="flex gap-4">
                  <Skeleton className="h-24 w-32 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-40 max-w-full" />
                    <Skeleton className="h-4 w-48 max-w-full" />
                    <Skeleton className="h-4 w-32 max-w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="My Spaces"
          description="Manage your listed spaces"
          action={
            <Link
              href="/host/spaces/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Plus className="size-4" />
              Add Space
            </Link>
          }
        />
        <DataLoadError message={error} onRetry={fetchSpaces} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="My Spaces"
        description="Manage your listed spaces"
        action={
          <Link
            href="/host/spaces/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Plus className="size-4" />
            Add Space
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DashboardStatCard
          label="Total Spaces"
          value={`${spaces.length}`}
          icon={Building2}
        />
        <DashboardStatCard
          label="Active Listings"
          value={`${activeSpaces}`}
          icon={BadgeCheck}
        />
        <DashboardStatCard
          label="Inactive Listings"
          value={`${inactiveSpaces}`}
          icon={EyeOff}
        />
      </div>

      {spaces.length === 0 ? (
        <DashboardSection
          title="Your listings"
          description="Create your first listing to start receiving booking requests."
        >
          <div className="space-y-6 text-center">
            <p className="text-sm text-muted-foreground">
              You haven&apos;t listed any spaces yet
            </p>
            <div className="mx-auto max-w-sm">
              <DashboardActionCard
                href="/host/spaces/new"
                title="Add Your First Space"
                description="Set up a new listing with photos, capacity, and pricing."
                icon={Plus}
              />
            </div>
          </div>
        </DashboardSection>
      ) : (
        <DashboardSection
          title="Your listings"
          description={
            reviewedSpaces > 0
              ? `${reviewedSpaces} space${reviewedSpaces > 1 ? "s" : ""} already have guest reviews.`
              : "Review availability, pricing, and listing status."
          }
        >
          <div className="space-y-4">
            {spaces.map((space) => (
              <article
                key={space.id}
                className="rounded-xl border border-border/60 bg-background p-4 shadow-sm transition-colors hover:bg-accent/20"
              >
                <div className="flex gap-4">
                  <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={space.images?.[0] || "/placeholder-space.jpg"}
                      alt={space.name}
                      fill
                      className="object-cover"
                    />
                    {!space.isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="text-xs font-medium text-white">
                          Inactive
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="truncate font-semibold text-foreground">
                          {space.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-4" />
                            {space.city}, {space.country}
                          </span>
                          {space.venue?.name && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              <Hotel className="size-3" />
                              {space.venue.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setMenuOpen(menuOpen === space.id ? null : space.id)
                          }
                          aria-label={`Open actions for ${space.name}`}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          <MoreVertical className="size-5" />
                        </button>

                        {menuOpen === space.id && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-border/60 bg-popover p-1 text-popover-foreground shadow-lg">
                            <Link
                              href={`/host/spaces/${space.id}/edit`}
                              onClick={() => setMenuOpen(null)}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <Pencil className="size-4" />
                              Edit
                            </Link>
                            <button
                              onClick={() =>
                                toggleSpaceStatus(space.id, space.isActive)
                              }
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              {space.isActive ? (
                                <>
                                  <PowerOff className="size-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="size-4" />
                                  Activate
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => deleteSpace(space.id)}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-300"
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="size-4" />
                        <span>{space.capacity}</span>
                      </div>
                      <span className="font-medium text-foreground">
                        {getPriceDisplay(space)}
                      </span>
                      {space.averageRating != null &&
                        space.averageRating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="size-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-foreground">
                              {space.averageRating.toFixed(1)}
                            </span>
                            <span className="text-muted-foreground">
                              ({space.totalReviews})
                            </span>
                          </div>
                        )}
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                          space.isActive
                            ? "bg-green-500/10 text-green-700 ring-green-500/20 dark:text-green-300"
                            : "bg-muted text-muted-foreground ring-border/60",
                        )}
                      >
                        {space.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </DashboardSection>
      )}
    </div>
  );
};

export default HostSpacesPage;
