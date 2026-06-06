"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import useAuthStore from "@/stores/authStore";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  Users,
  X,
} from "lucide-react";

import {
  DataLoadError,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatCard,
} from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  spaceId: number;
  status: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  guests: number;
  isHourly: boolean;
  totalAmount: number;
  createdAt: string;
  space: {
    id: number;
    name: string;
    images: string[];
  };
  guest: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

const statusBadgeClassName = (status: string) =>
  cn(
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
    status === "PENDING"
      ? "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300"
      : status === "CONFIRMED"
        ? "bg-green-500/10 text-green-700 ring-green-500/20 dark:text-green-300"
        : status === "COMPLETED"
          ? "bg-muted text-muted-foreground ring-border/60"
          : "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300"
  );

const KNOWN_STATUS_FILTERS = new Set([
  "all",
  "PENDING",
  "APPROVED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
]);

const normalizeStatusFilter = (raw: string | null): string => {
  if (!raw) return "all";
  if (raw === "all") return "all";
  const upper = raw.toUpperCase();
  return KNOWN_STATUS_FILTERS.has(upper) ? upper : "all";
};

const HostBookingsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { actingHostId } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState(() =>
    normalizeStatusFilter(searchParams.get("status"))
  );
  const [spaceFilter, setSpaceFilter] = useState(
    () => searchParams.get("spaceId") || "all"
  );
  const [actionLoading, setActionLoading] = useState<Set<string>>(
    () => new Set<string>()
  );

  const statusFilters = [
    { value: "all", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  // Sync filter state back into the URL so refreshes and shares preserve the
  // active selection. Replace (not push) to avoid polluting browser history.
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") {
      params.set("status", filter);
    }
    if (spaceFilter !== "all") {
      params.set("spaceId", spaceFilter);
    }
    const query = params.toString();
    router.replace(query ? `/host/bookings?${query}` : "/host/bookings", {
      scroll: false,
    });
  }, [filter, spaceFilter, router]);

  const fetchBookings = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      let res: Response;
      try {
        res = await apiFetch(
          `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/host`
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
        setBookings(data);
      } else if (res.status === 401) {
        router.push("/login");
      } else {
        setError("Booking service unavailable");
      }
    } catch {
      setError("Booking service unavailable");
    }
    setLoading(false);
  }, [actingHostId, router]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const beginAction = (bookingId: string) => {
    setActionLoading((prev) => {
      if (prev.has(bookingId)) return prev;
      const next = new Set(prev);
      next.add(bookingId);
      return next;
    });
  };

  const endAction = (bookingId: string) => {
    setActionLoading((prev) => {
      if (!prev.has(bookingId)) return prev;
      const next = new Set(prev);
      next.delete(bookingId);
      return next;
    });
  };

  const handleApprove = async (bookingId: string) => {
    if (actionLoading.has(bookingId)) return;
    beginAction(bookingId);
    try {
      let res: Response;
      try {
        res = await apiFetch(
          `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/${bookingId}/approve`,
          { method: "PUT" }
        );
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          router.push("/login");
          return;
        }
        throw err;
      }

      if (res.ok) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: "CONFIRMED" }
              : booking
          )
        );
      } else {
        throw new Error("Failed to approve booking");
      }
    } catch (error) {
      console.error("Error approving booking:", error);
      setError("Booking could not be approved. Retry after checking the order service.");
    } finally {
      endAction(bookingId);
    }
  };

  const handleReject = async (bookingId: string) => {
    if (actionLoading.has(bookingId)) return;
    const reason = prompt("Reason for rejection (optional):");

    beginAction(bookingId);
    try {
      let res: Response;
      try {
        res = await apiFetch(
          `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/${bookingId}/reject`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason }),
          }
        );
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          router.push("/login");
          return;
        }
        throw err;
      }

      if (res.ok) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: "REJECTED" }
              : booking
          )
        );
      } else {
        throw new Error("Failed to reject booking");
      }
    } catch (error) {
      console.error("Error rejecting booking:", error);
      setError("Booking could not be rejected. Retry after checking the order service.");
    } finally {
      endAction(bookingId);
    }
  };

  const handleComplete = async (bookingId: string) => {
    if (actionLoading.has(bookingId)) return;
    beginAction(bookingId);
    try {
      let res: Response;
      try {
        res = await apiFetch(
          `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/${bookingId}/complete`,
          { method: "PUT" }
        );
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          router.push("/login");
          return;
        }
        throw err;
      }

      if (res.ok) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: "COMPLETED" }
              : booking
          )
        );
      } else {
        throw new Error("Failed to complete booking");
      }
    } catch (error) {
      console.error("Error completing booking:", error);
      setError("Booking could not be completed. Retry after checking the order service.");
    } finally {
      endAction(bookingId);
    }
  };

  const spaceOptions = Array.from(
    new Map(
      bookings.map((booking) => [
        booking.spaceId,
        {
          id: booking.spaceId,
          name: booking.space.name,
        },
      ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus = filter === "all" ? true : booking.status === filter;
    const matchesSpace =
      spaceFilter === "all" ? true : booking.spaceId.toString() === spaceFilter;
    return matchesStatus && matchesSpace;
  });
  const pendingCount = bookings.filter(
    (booking) => booking.status === "PENDING"
  ).length;
  const confirmedCount = bookings.filter(
    (booking) => booking.status === "CONFIRMED"
  ).length;
  const completedCount = bookings.filter(
    (booking) => booking.status === "COMPLETED"
  ).length;

  if (loading) {
    return (
      <div aria-busy="true" className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-40 max-w-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="size-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-24 rounded-lg" />
            ))}
          </div>
          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="rounded-xl border border-border/60 bg-background p-4"
              >
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-24 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-40 max-w-full" />
                    <Skeleton className="h-4 w-52 max-w-full" />
                    <Skeleton className="h-4 w-36 max-w-full" />
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
          title="Bookings"
          description="Manage booking requests for your spaces"
        />
        <DataLoadError message={error} onRetry={fetchBookings} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Bookings"
        description="Manage booking requests for your spaces"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DashboardStatCard
          label="Total Bookings"
          value={`${bookings.length}`}
          icon={Calendar}
        />
        <DashboardStatCard
          label="Pending Review"
          value={`${pendingCount}`}
          icon={Clock}
        />
        <DashboardStatCard
          label="Confirmed"
          value={`${confirmedCount}`}
          icon={CheckCheck}
        />
        <DashboardStatCard
          label="Completed"
          value={`${completedCount}`}
          icon={Check}
        />
      </div>

      {pendingCount > 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-700 dark:text-amber-300">
          <AlertCircle className="size-5 shrink-0" />
          <p className="text-sm font-medium">
            {pendingCount} booking{pendingCount > 1 ? "s" : ""} pending your
            review
          </p>
        </div>
      ) : null}

      <DashboardSection
        title="Booking requests"
        description="Filter bookings by status and respond to incoming requests."
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            {statusFilters.map((statusFilter) => (
              <button
                key={statusFilter.value}
                onClick={() => setFilter(statusFilter.value)}
                className={cn(
                  "inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  filter === statusFilter.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border/60 bg-accent/40 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {statusFilter.label}
                {statusFilter.value === "PENDING" && pendingCount > 0 ? (
                  <span className="ml-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white">
                    {pendingCount}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {spaceOptions.length > 0 ? (
            <div className="flex items-center gap-2">
              <label
                htmlFor="booking-space-filter"
                className="text-sm font-medium text-muted-foreground"
              >
                Space
              </label>
              <select
                id="booking-space-filter"
                aria-label="Filter bookings by space"
                value={spaceFilter}
                onChange={(event) => setSpaceFilter(event.target.value)}
                className="h-10 min-w-48 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All spaces</option>
                {spaceOptions.map((space) => (
                  <option key={space.id} value={space.id.toString()}>
                    {space.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-accent/20 py-12 text-center">
            <p className="text-sm text-muted-foreground">No bookings found</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredBookings.map((booking) => (
              <article
                key={booking.id}
                className="rounded-xl border border-border/60 bg-background p-4 shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={booking.space.images?.[0] || "/placeholder-space.jpg"}
                      alt={booking.space.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {booking.space.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Booked by {booking.guest.name || booking.guest.email}
                        </p>
                      </div>
                      <span className={statusBadgeClassName(booking.status)}>
                        {booking.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-4" />
                        <span>
                          {new Date(booking.startDate).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" }
                          )}
                          {booking.endDate !== booking.startDate ? (
                            <>
                              {" - "}
                              {new Date(booking.endDate).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" }
                              )}
                            </>
                          ) : null}
                        </span>
                      </div>

                      {booking.isHourly &&
                      booking.startTime &&
                      booking.endTime ? (
                        <div className="flex items-center gap-1">
                          <Clock className="size-4" />
                          <span>
                            {booking.startTime} - {booking.endTime}
                          </span>
                        </div>
                      ) : null}

                      <div className="flex items-center gap-1">
                        <Users className="size-4" />
                        <span>{booking.guests}</span>
                      </div>

                      <span className="font-medium text-foreground">
                        ${booking.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {booking.status === "PENDING" ? (
                  <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
                    <button
                      onClick={() => handleApprove(booking.id)}
                      disabled={actionLoading.has(booking.id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading.has(booking.id) ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(booking.id)}
                      disabled={actionLoading.has(booking.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-500/15 disabled:opacity-50 dark:text-red-300"
                    >
                      <X className="size-4" />
                      Reject
                    </button>
                  </div>
                ) : null}

                {booking.status === "CONFIRMED" ? (
                  <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
                    <button
                      onClick={() => handleComplete(booking.id)}
                      disabled={actionLoading.has(booking.id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {actionLoading.has(booking.id) ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Mark as Completed
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
};

export default HostBookingsPage;
