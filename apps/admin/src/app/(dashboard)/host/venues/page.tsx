"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import useAuthStore from "@/stores/authStore";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";
import {
  Hotel,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  DashboardActionCard,
  DataLoadError,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatCard,
} from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface Venue {
  id: number;
  name: string;
  shortDescription: string;
  images: string[];
  city: string;
  country: string;
  _count: {
    spaces: number;
  };
}

const HostVenuesPage = () => {
  const router = useRouter();
  const { actingHostId } = useAuthStore();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const fetchVenues = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      let res: Response;
      try {
        res = await apiFetch(
          `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/venues/host/my`
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
        setVenues(data);
      } else if (res.status === 401) {
        router.push("/login");
      } else {
        throw new Error("Failed to fetch venues");
      }
    } catch (err) {
      console.error("Error fetching venues:", err);
      setError(
        "Venues could not be loaded. Check the product service and retry."
      );
    }
    setLoading(false);
  }, [actingHostId, router]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const deleteVenue = async (venueId: number) => {
    if (!confirm("Are you sure you want to delete this venue?")) return;

    try {
      let res: Response;
      try {
        res = await apiFetch(
          `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/venues/${venueId}`,
          { method: "DELETE" }
        );
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          router.push("/login");
          return;
        }
        throw err;
      }

      if (res.ok) {
        setVenues((prev) => prev.filter((venue) => venue.id !== venueId));
        toast.success("Venue deleted");
      } else if (res.status === 401) {
        router.push("/login");
        return;
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.message || "Failed to delete venue");
      }
    } catch (err) {
      console.error("Error deleting venue:", err);
      toast.error("Error deleting venue");
    }
    setMenuOpen(null);
  };

  const totalSpaces = venues.reduce((sum, v) => sum + (v._count?.spaces ?? 0), 0);

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
          title="My Venues"
          description="Manage your venue properties"
          action={
            <Link
              href="/host/venues/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Plus className="size-4" />
              Add Venue
            </Link>
          }
        />
        <DataLoadError message={error} onRetry={fetchVenues} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="My Venues"
        description="Manage your venue properties"
        action={
          <Link
            href="/host/venues/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Plus className="size-4" />
            Add Venue
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DashboardStatCard
          label="Total Venues"
          value={`${venues.length}`}
          icon={Hotel}
        />
        <DashboardStatCard
          label="Total Spaces"
          value={`${totalSpaces}`}
          icon={Hotel}
        />
        <DashboardStatCard
          label="Avg Spaces per Venue"
          value={venues.length > 0 ? (totalSpaces / venues.length).toFixed(1) : "0"}
          icon={Hotel}
        />
      </div>

      {venues.length === 0 ? (
        <DashboardSection
          title="Your venues"
          description="Create your first venue to organize your spaces."
        >
          <div className="space-y-6 text-center">
            <p className="text-sm text-muted-foreground">
              You haven&apos;t created any venues yet
            </p>
            <div className="mx-auto max-w-sm">
              <DashboardActionCard
                href="/host/venues/new"
                title="Add Your First Venue"
                description="Set up a new venue property with location and photos."
                icon={Plus}
              />
            </div>
          </div>
        </DashboardSection>
      ) : (
        <DashboardSection
          title="Your venues"
          description="Manage venue properties and their spaces."
        >
          <div className="space-y-4">
            {venues.map((venue) => (
              <article
                key={venue.id}
                className="rounded-xl border border-border/60 bg-background p-4 shadow-sm transition-colors hover:bg-accent/20"
              >
                <div className="flex gap-4">
                  <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={venue.images?.[0] || "/placeholder-space.jpg"}
                      alt={venue.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="truncate font-semibold text-foreground">
                          {venue.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="size-4" />
                          <span>
                            {venue.city}, {venue.country}
                          </span>
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setMenuOpen(menuOpen === venue.id ? null : venue.id)
                          }
                          aria-label={`Open actions for ${venue.name}`}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          <MoreVertical className="size-5" />
                        </button>

                        {menuOpen === venue.id && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-border/60 bg-popover p-1 text-popover-foreground shadow-lg">
                            <Link
                              href={`/host/venues/${venue.id}/edit`}
                              onClick={() => setMenuOpen(null)}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <Pencil className="size-4" />
                              Edit
                            </Link>
                            <Link
                              href={`/host/spaces/new?venueId=${venue.id}`}
                              onClick={() => setMenuOpen(null)}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <Plus className="size-4" />
                              Add New Space
                            </Link>
                            <button
                              onClick={() => deleteVenue(venue.id)}
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
                        <Hotel className="size-4" />
                        <span>
                          {venue._count?.spaces ?? 0}{" "}
                          {(venue._count?.spaces ?? 0) === 1 ? "space" : "spaces"}
                        </span>
                      </div>
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

export default HostVenuesPage;
