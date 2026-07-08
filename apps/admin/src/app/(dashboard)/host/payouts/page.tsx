"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  WalletCards,
} from "lucide-react";
import { toast } from "react-toastify";

import { DataLoadError, DashboardPageHeader, DashboardSection } from "@/components/dashboard";
import { HostEmptyAdminBanner } from "@/components/HostEmptyAdminBanner";
import { DataTablePagination } from "@/components/TablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import useAuthStore from "@/stores/authStore";

type ConnectStatus =
  | "ONBOARDING"
  | "PENDING_VERIFICATION"
  | "ACTIVE"
  | "DISABLED";

type ConnectStatusResponse = {
  exists: boolean;
  status: ConnectStatus | null;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsDue: string[];
};

type HostPayout = {
  id: string;
  hostId: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  amountMinor?: number | null;
  platformFeeMinor?: number | null;
  netAmountMinor?: number | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  method?: "MANUAL" | "STRIPE_TRANSFER";
  bookingIds: string[];
  stripeTransferId?: string | null;
  failureReason?: string | null;
  processedAt?: string | null;
  createdAt: string;
};

type PayoutsResponse = {
  payouts: HostPayout[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const formatMinorOrLegacy = (
  amountMinor: number | null | undefined,
  legacyAmount: number,
  currency: string
) => {
  if (typeof amountMinor === "number") {
    return formatMoney(amountMinor / 100, currency);
  }
  return formatMoney(legacyAmount, currency);
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const payoutStatusClassName = (status: HostPayout["status"]) =>
  cn(
    status === "PENDING" && "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
    status === "PROCESSING" && "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    status === "COMPLETED" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    status === "FAILED" && "border-destructive/30 bg-destructive/10 text-destructive"
  );

function PayoutHistoryTable({ data }: { data: HostPayout[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = useMemo<ColumnDef<HostPayout>[]>(
    () => [
      {
        accessorKey: "netAmountMinor",
        header: () => <div className="text-right">Net payout</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatMinorOrLegacy(
              row.original.netAmountMinor,
              row.original.netAmount,
              row.original.currency
            )}
          </div>
        ),
      },
      {
        accessorKey: "platformFeeMinor",
        header: () => <div className="text-right">Platform fee</div>,
        cell: ({ row }) => (
          <div className="text-right text-muted-foreground">
            {formatMinorOrLegacy(
              row.original.platformFeeMinor,
              row.original.platformFee,
              row.original.currency
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={payoutStatusClassName(row.original.status)}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "bookings",
        header: "Bookings",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.bookingIds.length} booking
            {row.original.bookingIds.length === 1 ? "" : "s"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: "processedAt",
        header: "Processed",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.processedAt)}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No payouts yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DataTablePagination table={table} />
    </div>
  );
}

function ConnectSetupCard({
  status,
  onOpenOnboarding,
  isOpening,
}: {
  status: ConnectStatusResponse;
  onOpenOnboarding: (ensureAccount: boolean) => void;
  isOpening: boolean;
}) {
  const isActive = status.status === "ACTIVE";
  const needsAccount = !status.exists;
  const requirements = status.requirementsDue.slice(0, 5);
  const icon = isActive ? CheckCircle2 : AlertTriangle;
  const Icon = icon;

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-lg",
                isActive
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300"
              )}
            >
              <Icon className="size-5" />
            </div>
            <div>
              <CardTitle>Stripe Connect payouts</CardTitle>
              <CardDescription>
                {isActive
                  ? "Your account is active and ready for Stripe transfers."
                  : "Finish payout setup before completed bookings can be transferred."}
              </CardDescription>
            </div>
          </div>
          {!isActive ? (
            <Button
              type="button"
              onClick={() => onOpenOnboarding(needsAccount)}
              disabled={isOpening}
            >
              {isOpening ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ExternalLink className="size-4" />
              )}
              {needsAccount ? "Set up payouts" : "Continue onboarding"}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{status.status || "NOT_STARTED"}</Badge>
          <Badge variant={status.payoutsEnabled ? "default" : "secondary"}>
            {status.payoutsEnabled ? "Payouts enabled" : "Payouts disabled"}
          </Badge>
          <Badge variant={status.detailsSubmitted ? "default" : "secondary"}>
            {status.detailsSubmitted ? "Details submitted" : "Details needed"}
          </Badge>
        </div>

        {requirements.length > 0 ? (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium">Stripe needs more information:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function HostPayoutsPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    isAdmin,
    isHostOrAdmin,
    isLoading: authLoading,
    actingHostId,
  } = useAuthStore();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isHostOrAdmin)) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, isHostOrAdmin, router]);

  const shouldFetch =
    !authLoading && isAuthenticated && isHostOrAdmin && (!isAdmin || !!actingHostId);

  const connectQuery = useQuery({
    enabled: shouldFetch,
    queryKey: ["host-connect-status", actingHostId],
    retry: false,
    queryFn: async (): Promise<ConnectStatusResponse> => {
      let response: Response;
      try {
        response = await apiFetch(
          `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/connect/status`
        );
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          router.push("/login");
        }
        throw err;
      }
      if (response.status === 401) {
        router.push("/login");
        throw new Error("Unauthenticated");
      }
      if (!response.ok) {
        throw new Error("Connect status could not be loaded");
      }
      return response.json();
    },
  });

  const payoutsQuery = useQuery({
    enabled: shouldFetch,
    queryKey: ["host-payouts", actingHostId],
    retry: false,
    queryFn: async (): Promise<PayoutsResponse> => {
      let response: Response;
      try {
        response = await apiFetch(
          `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/payouts/host?limit=100`
        );
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          router.push("/login");
        }
        throw err;
      }
      if (response.status === 401) {
        router.push("/login");
        throw new Error("Unauthenticated");
      }
      if (!response.ok) {
        throw new Error("Payouts could not be loaded");
      }
      return response.json();
    },
  });

  const onboardingMutation = useMutation({
    mutationFn: async (ensureAccount: boolean) => {
      if (ensureAccount) {
        const accountResponse = await apiFetch(
          `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/connect/account`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: "RO" }),
          }
        );
        if (!accountResponse.ok) {
          throw new Error("Connect account could not be created");
        }
      }

      const linkResponse = await apiFetch(
        `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/connect/account-link`,
        { method: "POST" }
      );
      if (!linkResponse.ok) {
        throw new Error("Connect onboarding link could not be created");
      }
      const body = await linkResponse.json();
      if (!body.url || typeof body.url !== "string") {
        throw new Error("Connect onboarding link was missing");
      }
      window.location.href = body.url;
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (authLoading || connectQuery.isLoading || payoutsQuery.isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!isAuthenticated || !isHostOrAdmin) {
    return null;
  }

  if (isAdmin && !actingHostId) {
    return <HostEmptyAdminBanner />;
  }

  if (connectQuery.isError || payoutsQuery.isError || !connectQuery.data) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Payouts"
          description="Set up Stripe Connect and track host payout history."
        />
        <DataLoadError
          message="Payout information could not be loaded. Check the order service and retry."
          onRetry={() => {
            void connectQuery.refetch();
            void payoutsQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Payouts"
        description="Set up Stripe Connect and track host payout history."
      />

      <ConnectSetupCard
        status={connectQuery.data}
        isOpening={onboardingMutation.isPending}
        onOpenOnboarding={(ensureAccount) =>
          onboardingMutation.mutate(ensureAccount)
        }
      />

      <DashboardSection
        title="Payout history"
        description="Completed booking payouts and Stripe transfer status."
        contentClassName="pt-0"
      >
        <div className="pt-6">
          <PayoutHistoryTable data={payoutsQuery.data?.payouts ?? []} />
        </div>
      </DashboardSection>
    </div>
  );
}
