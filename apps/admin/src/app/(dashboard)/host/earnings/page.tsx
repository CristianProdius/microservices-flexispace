"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import { HostEmptyAdminBanner } from "@/components/HostEmptyAdminBanner";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Percent,
} from "lucide-react";

import {
  DataLoadError,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatCard,
} from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, parseBookingDay } from "@/lib/format";

interface Booking {
  id: string;
  status: string;
  totalAmount: number;
  serviceFee: number;
  cleaningFee: number;
  startDate: string;
  endDate: string;
  currency?: string | null;
  space: {
    name: string;
  };
  guest: {
    name: string;
  };
}

interface EarningsStats {
  totalEarnings: number;
  pendingEarnings: number;
  thisMonth: number;
  completedBookings: number;
}

const HostEarningsPage = () => {
  const router = useRouter();
  const { actingHostId, isAdmin } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // The effective platform commission applied to this host's payouts. Read-only
  // for the host — only an admin can change it from the admin user detail page.
  const [commissionRate, setCommissionRate] = useState<number | null>(null);
  const [hasCommissionOverride, setHasCommissionOverride] = useState(false);

  const fetchEarnings = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      // Fetch the host's own commission rate from /auth/me alongside earnings.
      // /auth/me requires only a logged-in user (not admin), and the response
      // includes both the per-host override and the effective rate (override
      // falling back to the platform default).
      let meRes: Response;
      try {
        meRes = await apiFetch(
          `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/auth/me`
        );
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          router.push("/login");
          return;
        }
        throw err;
      }
      if (meRes.ok) {
        const meBody = await meRes.json();
        setCommissionRate(
          typeof meBody.effectiveCommissionRate === "number"
            ? meBody.effectiveCommissionRate
            : null
        );
        setHasCommissionOverride(typeof meBody.commissionRate === "number");
      }

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

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (res.ok) {
        const data: Booking[] = await res.json();
        setBookings(data);

        const completedBookings = data.filter(
          (b) => b.status === "COMPLETED"
        );
        const pendingBookings = data.filter((b) =>
          ["CONFIRMED"].includes(b.status)
        );

        const calculateNetEarnings = (booking: Booking) =>
          booking.totalAmount - booking.serviceFee;

        const totalEarnings = completedBookings.reduce(
          (sum, b) => sum + calculateNetEarnings(b),
          0
        );
        const pendingEarnings = pendingBookings.reduce(
          (sum, b) => sum + calculateNetEarnings(b),
          0
        );

        const now = new Date();
        const thisMonthBookings = completedBookings.filter((b) => {
          // Anchor the booking endDate in local time (parseBookingDay) so a
          // UTC-midnight ISO from the API doesn't roll into the wrong month
          // for users west of UTC — same fix the client app uses for its
          // calendar-day comparisons.
          const endDate = parseBookingDay(b.endDate);
          if (!endDate) return false;
          return (
            endDate.getMonth() === now.getMonth() &&
            endDate.getFullYear() === now.getFullYear()
          );
        });
        const thisMonth = thisMonthBookings.reduce(
          (sum, b) => sum + calculateNetEarnings(b),
          0
        );

        setStats({
          totalEarnings,
          pendingEarnings,
          thisMonth,
          completedBookings: completedBookings.length,
        });
      } else {
        setError("Booking service unavailable");
      }
    } catch {
      setError("Booking service unavailable");
    }
    setLoading(false);
  }, [actingHostId, router]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  if (isAdmin && !actingHostId) {
    return <HostEmptyAdminBanner />;
  }

  if (loading) {
    return (
      <div aria-busy="true" className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48 max-w-full" />
          <Skeleton className="h-4 w-64 max-w-full" />
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
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="space-y-3">
            <Skeleton className="h-5 w-40 max-w-full" />
            <Skeleton className="h-4 w-80 max-w-full" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Earnings"
          description="Track your hosting income"
        />
        <DataLoadError message={error} onRetry={fetchEarnings} />
      </div>
    );
  }

  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
  const pendingPayoutBookings = bookings.filter((b) =>
    ["CONFIRMED"].includes(b.status)
  );
  // Earnings stat cards aggregate across many bookings that may be in
  // different currencies. We don't have server-side normalization here yet
  // (see CONCERNS on AUD-016), so the rollup is displayed in USD as a
  // best-effort default — same convention used in BookingChartType.
  const statCards = [
    {
      label: "Total Earnings",
      value: formatMoney(stats?.totalEarnings ?? 0, "USD"),
      icon: DollarSign,
    },
    {
      label: "Pending",
      value: formatMoney(stats?.pendingEarnings ?? 0, "USD"),
      icon: Clock,
    },
    {
      label: "This Month",
      value: formatMoney(stats?.thisMonth ?? 0, "USD"),
      icon: Calendar,
    },
    {
      label: "Completed",
      value: `${stats?.completedBookings || 0}`,
      icon: CheckCircle,
    },
  ];

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Earnings"
        description="Track your hosting income"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <DashboardStatCard key={stat.label} {...stat} />
        ))}
      </div>

      {commissionRate !== null && (
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted/60 p-2 text-muted-foreground">
              <Percent className="size-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3 className="text-sm font-medium text-card-foreground">
                  Platform commission
                </h3>
                <span className="text-base font-semibold text-primary">
                  {(commissionRate * 100).toFixed(2)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {hasCommissionOverride
                    ? "(negotiated rate)"
                    : "(platform default)"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Applied to the space subtotal on each booking and deducted from
                your payout. To change this, please contact the Spacefly team.
              </p>
            </div>
          </div>
        </div>
      )}

      {pendingPayoutBookings.length > 0 && (
        <DashboardSection
          title="Pending Payouts"
          description="Confirmed bookings that will pay out after completion."
        >
          <div className="rounded-lg border border-border/60 bg-accent/30 p-4">
            <p className="mb-4 text-sm text-muted-foreground">
              These bookings are confirmed and earnings will be available after
              completion.
            </p>
            <div className="space-y-3">
              {pendingPayoutBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="font-medium text-card-foreground">
                      {booking.space.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.startDate).toLocaleDateString()} -{" "}
                      {booking.guest.name}
                    </p>
                  </div>
                  <p className="font-semibold text-card-foreground">
                    {formatMoney(
                      booking.totalAmount - booking.serviceFee,
                      booking.currency
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </DashboardSection>
      )}

      <DashboardSection
        title="Completed Bookings"
        description="Transaction history for completed stays."
      >
        {completedBookings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-accent/20 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No completed bookings yet
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/60">
            <table className="w-full">
              <thead className="bg-accent/30">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Space
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Guest
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Service Fee
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Net Earnings
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-card">
                {completedBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3 text-sm text-card-foreground">
                      {booking.space.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {booking.guest.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(booking.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-card-foreground">
                      {formatMoney(booking.totalAmount, booking.currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-destructive">
                      -{formatMoney(booking.serviceFee, booking.currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-primary">
                      {formatMoney(
                        booking.totalAmount - booking.serviceFee,
                        booking.currency
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>
    </div>
  );
};

export default HostEarningsPage;
