"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useAuthStore from "@/stores/authStore";
import { HostEmptyAdminBanner } from "@/components/HostEmptyAdminBanner";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Percent,
  WalletCards,
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

// AUDIT M12 (BOOKSVC-005): the host earnings summary must be grouped by
// currency. Summing net earnings across RON/MDL/USD bookings and rendering the
// rollup as a single "$X" is meaningless, so we read the payout-aware,
// currency-grouped totals from GET /bookings/host/earnings instead of deriving
// a mixed-currency sum client-side. Shape mirrors the order-service route.
interface CurrencyEarnings {
  currency: string;
  totalEarnings: number;
  platformFees: number;
  grossRevenue: number;
}

interface CurrencyAmount {
  currency: string;
  amount: number;
}

interface HostEarnings {
  earningsByCurrency: CurrencyEarnings[];
  // The order-service groups payouts by currency (M10). Accept both shapes so
  // this renders correctly whether or not that change has shipped yet (the
  // older route returned a USD-denominated scalar).
  pendingPayout: number | CurrencyAmount[];
  completedPayouts: number | CurrencyAmount[];
}

interface ConnectStatus {
  exists: boolean;
  status: "ONBOARDING" | "PENDING_VERIFICATION" | "ACTIVE" | "DISABLED" | null;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsDue: string[];
}

// Render a payout field that may be a scalar (legacy) or a per-currency array.
const formatPayout = (
  payout: number | CurrencyAmount[] | undefined,
): string => {
  if (Array.isArray(payout)) {
    if (payout.length === 0) return formatMoney(0, "USD");
    return payout
      .map((row) => formatMoney(row.amount, row.currency))
      .join(" + ");
  }
  return formatMoney(payout ?? 0, "USD");
};

interface EarningsStats {
  completedBookings: number;
  // Grouped by currency so we never render a mixed-currency sum as USD.
  thisMonthByCurrency: Record<string, number>;
}

const HostEarningsPage = () => {
  const router = useRouter();
  const { actingHostId, isAdmin } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [earnings, setEarnings] = useState<HostEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // The effective platform commission applied to this host's payouts. Read-only
  // for the host — only an admin can change it from the admin user detail page.
  const [commissionRate, setCommissionRate] = useState<number | null>(null);
  const [hasCommissionOverride, setHasCommissionOverride] = useState(false);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);

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

      try {
        const connectRes = await apiFetch(
          `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/connect/status`
        );
        if (connectRes.status === 401) {
          router.push("/login");
          return;
        }
        if (connectRes.ok) {
          setConnectStatus(await connectRes.json());
        }
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          router.push("/login");
          return;
        }
        setConnectStatus(null);
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

        const calculateNetEarnings = (booking: Booking) =>
          booking.totalAmount - booking.serviceFee;

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

        // AUDIT M12: group this-month net earnings by booking currency rather
        // than summing across currencies. Each booking already carries its own
        // currency; falling back to USD only for legacy rows without one.
        const thisMonthByCurrency = thisMonthBookings.reduce<
          Record<string, number>
        >((acc, b) => {
          const currency = b.currency || "USD";
          acc[currency] = (acc[currency] ?? 0) + calculateNetEarnings(b);
          return acc;
        }, {});

        setStats({
          completedBookings: completedBookings.length,
          thisMonthByCurrency,
        });

        // AUDIT M12: pull the payout-aware, currency-grouped rollup from the
        // dedicated endpoint. The per-row table below keeps using /bookings/host
        // (each row already renders booking.currency); this only powers the
        // summary cards so RON + MDL are never collapsed into one "$X".
        let earningsRes: Response;
        try {
          earningsRes = await apiFetch(
            `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/host/earnings`
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
  const connectNeedsSetup =
    connectStatus !== null && connectStatus.status !== "ACTIVE";
  // AUDIT M12: the money summary now lives in the per-currency "Earnings by
  // currency" section below (sourced from /bookings/host/earnings). The top
  // cards only hold values that are safe to show as scalars: the completed
  // booking count, and the payout totals which are USD-denominated in the
  // Payout model (so a single-currency USD format is correct here).
  const statCards = [
    {
      label: "Completed",
      value: `${stats?.completedBookings || 0}`,
      icon: CheckCircle,
    },
    {
      label: "Pending Payout",
      value: formatPayout(earnings?.pendingPayout),
      icon: Clock,
    },
    {
      label: "Paid Out",
      value: formatPayout(earnings?.completedPayouts),
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Earnings"
        description="Track your hosting income"
      />

      {connectNeedsSetup && (
        <Link
          href="/host/payouts"
          className="block rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-yellow-900 transition-colors hover:bg-yellow-500/15 dark:text-yellow-100"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-background/70 p-2 text-yellow-700 dark:text-yellow-200">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="font-medium">Payout setup required</p>
                <p className="text-sm text-yellow-800/80 dark:text-yellow-100/80">
                  Complete Stripe Connect onboarding before completed bookings
                  can be transferred.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <WalletCards className="size-4" />
              Open payouts
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <DashboardStatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* AUDIT M12: one card per currency instead of a single mixed "$X". */}
      <DashboardSection
        title="Earnings by currency"
        description="Net payout earnings grouped by booking currency."
      >
        {earnings?.earningsByCurrency && earnings.earningsByCurrency.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {earnings.earningsByCurrency.map((row) => (
              <div
                key={row.currency}
                className="rounded-xl border border-border/60 bg-card p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {row.currency}
                  </span>
                  <DollarSign className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-primary">
                  {formatMoney(row.totalEarnings, row.currency)}
                </p>
                <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <dt>Gross revenue</dt>
                    <dd className="text-card-foreground">
                      {formatMoney(row.grossRevenue, row.currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Platform fees</dt>
                    <dd className="text-destructive">
                      -{formatMoney(row.platformFees, row.currency)}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/60 bg-accent/20 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No completed earnings yet
            </p>
          </div>
        )}
      </DashboardSection>

      {stats && Object.keys(stats.thisMonthByCurrency).length > 0 && (
        <DashboardSection
          title="This month"
          description="Net earnings from stays completed this month."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(stats.thisMonthByCurrency).map(
              ([currency, amount]) => (
                <div
                  key={currency}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 shadow-sm"
                >
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Calendar className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{currency}</p>
                    <p className="text-lg font-semibold text-card-foreground">
                      {formatMoney(amount, currency)}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </DashboardSection>
      )}

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
