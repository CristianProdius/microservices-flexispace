"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import { HostEmptyAdminBanner } from "@/components/HostEmptyAdminBanner";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";
import { formatMoney } from "@/lib/format";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Check,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";

import {
  DashboardActionCard,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatCard,
} from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalSpaces: number;
  activeSpaces: number;
  pendingBookings: number;
  upcomingBookings: number;
  // AUDIT M12 (BOOKSVC-005): pending earnings grouped by currency so the
  // "needs attention" prompt never renders a mixed-currency sum as one "$X".
  pendingByCurrency: Record<string, number>;
}

// AUDIT M12: payout-aware, currency-grouped earnings from
// GET /bookings/host/earnings — see the host earnings page for the same shape.
interface CurrencyEarnings {
  currency: string;
  totalEarnings: number;
  platformFees: number;
  grossRevenue: number;
}

interface HostEarnings {
  earningsByCurrency: CurrencyEarnings[];
  pendingPayout: number;
  completedPayouts: number;
}

interface HostSpaceSummary {
  isActive: boolean;
}

interface HostBookingSummary {
  status: string;
  startDate: string;
  totalAmount: number;
  serviceFee: number;
  currency?: string | null;
}

const HostDashboardPage = () => {
  const router = useRouter();
  const { actingHostId, user, isAdmin } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [earnings, setEarnings] = useState<HostEarnings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      let spacesRes: Response;
      try {
        spacesRes = await apiFetch(
          `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/host/my`,
        );
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          router.push("/login");
          return;
        }
        throw err;
      }

      if (spacesRes.status === 401) {
        router.push("/login");
        return;
      }

      const spaces: HostSpaceSummary[] = spacesRes.ok
        ? await spacesRes.json()
        : [];

      let bookingsRes: Response;
      try {
        bookingsRes = await apiFetch(
          `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/host`,
        );
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          router.push("/login");
          return;
        }
        throw err;
      }

      if (bookingsRes.status === 401) {
        router.push("/login");
        return;
      }

      const bookings: HostBookingSummary[] = bookingsRes.ok
        ? await bookingsRes.json()
        : [];

      const activeSpaces = spaces.filter((space) => space.isActive).length;
      const pendingBookings = bookings.filter(
        (booking) => booking.status === "PENDING"
      ).length;
      const upcomingBookings = bookings.filter(
        (booking) =>
          ["CONFIRMED"].includes(booking.status) &&
          new Date(booking.startDate) >= new Date()
      ).length;

      // AUDIT M12: group confirmed-booking net earnings by currency instead of
      // summing across currencies. Each booking carries its own currency;
      // legacy rows without one fall back to USD.
      const pendingByCurrency = bookings
        .filter((booking) => ["CONFIRMED"].includes(booking.status))
        .reduce<Record<string, number>>((acc, booking) => {
          const currency = booking.currency || "USD";
          acc[currency] =
            (acc[currency] ?? 0) + (booking.totalAmount - booking.serviceFee);
          return acc;
        }, {});

      setStats({
        totalSpaces: spaces.length,
        activeSpaces,
        pendingBookings,
        upcomingBookings,
        pendingByCurrency,
      });

      // AUDIT M12: fetch the currency-grouped earnings rollup for the summary
      // cards so a host with RON/MDL bookings never sees a meaningless "$X".
      let earningsRes: Response;
      try {
        earningsRes = await apiFetch(
          `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/host/earnings`,
        );
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          router.push("/login");
          return;
        }
        throw err;
      }
      if (earningsRes.status === 401) {
        router.push("/login");
        return;
      }
      if (earningsRes.ok) {
        const earningsData: HostEarnings = await earningsRes.json();
        setEarnings(earningsData);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
    setLoading(false);
  }, [actingHostId, router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isAdmin && !actingHostId) {
    return <HostEmptyAdminBanner />;
  }

  if (loading) {
    return (
      <div aria-busy="true" className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
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
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/60 bg-card px-5 py-4 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Skeleton className="size-10 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40 max-w-full" />
                  <Skeleton className="h-4 w-48 max-w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="rounded-lg border border-border/60 bg-card px-4 py-5"
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <Skeleton className="size-10 rounded-lg" />
                  <Skeleton className="h-5 w-28 max-w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // AUDIT M12: one earnings card per currency (from /bookings/host/earnings)
  // replaces the old single mixed-currency "Total Earnings" card. Formatted
  // with each row's own currency so RON/MDL are never rendered as USD.
  const earningsCards = (earnings?.earningsByCurrency ?? []).map((row) => ({
    label: `Total Earnings (${row.currency})`,
    value: formatMoney(row.totalEarnings, row.currency, {
      maximumFractionDigits: 0,
    }),
    icon: DollarSign,
  }));

  const statCards = [
    {
      label: "Active Spaces",
      value: `${stats?.activeSpaces || 0} / ${stats?.totalSpaces || 0}`,
      icon: Building2,
    },
    {
      label: "Pending Requests",
      value: `${stats?.pendingBookings || 0}`,
      icon: Clock,
    },
    {
      label: "Upcoming Bookings",
      value: `${stats?.upcomingBookings || 0}`,
      icon: CalendarDays,
    },
    ...earningsCards,
  ];

  // AUDIT M12: render pending earnings per currency (e.g. "RON 1,800 + MDL 500")
  // rather than collapsing them into a single mixed-currency USD figure.
  const pendingCurrencyEntries = Object.entries(
    stats?.pendingByCurrency ?? {}
  ).filter(([, amount]) => amount > 0);
  const pendingEarningsLabel = pendingCurrencyEntries
    .map(([currency, amount]) =>
      formatMoney(amount, currency, { maximumFractionDigits: 0 })
    )
    .join(" + ");

  const needsAttentionLinks = [
    stats?.pendingBookings && stats.pendingBookings > 0
      ? {
          href: "/host/bookings?status=pending",
          title: `${stats.pendingBookings} pending booking${
            stats.pendingBookings > 1 ? "s" : ""
          } need your attention`,
          description: "Review and respond to booking requests",
          icon: AlertCircle,
        }
      : null,
    pendingCurrencyEntries.length > 0
      ? {
          href: "/host/earnings",
          title: `${pendingEarningsLabel} in pending earnings`,
          description: "View your earnings breakdown",
          icon: TrendingUp,
        }
      : null,
  ].filter((link) => link !== null);

  const quickLinks = [
    {
      href: "/host/spaces/new",
      label: "Add New Space",
      icon: Building2,
    },
    {
      href: "/host/bookings",
      label: "View All Bookings",
      icon: CalendarDays,
    },
    {
      href: "/host/spaces",
      label: "Manage Spaces",
      icon: Check,
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={`Welcome back, ${user?.name || "Host"}`}
        description="Here's an overview of your hosting activity"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <DashboardStatCard key={stat.label} {...stat} />
        ))}
      </div>

      {needsAttentionLinks.length > 0 ? (
        <DashboardSection
          title="Needs attention"
          description="Time-sensitive items in your hosting workflow."
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {needsAttentionLinks.map((link) => (
              <DashboardActionCard
                key={link.href}
                href={link.href}
                title={link.title}
                description={link.description}
                icon={link.icon}
              />
            ))}
          </div>
        </DashboardSection>
      ) : null}

      <DashboardSection
        title="Quick links"
        description="Common host tasks and navigation shortcuts."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-5 text-center text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </DashboardSection>
    </div>
  );
};

export default HostDashboardPage;
