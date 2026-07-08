"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Send } from "lucide-react";

export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type ConnectStatus =
  | "ONBOARDING"
  | "PENDING_VERIFICATION"
  | "ACTIVE"
  | "DISABLED";

export type AdminPayout = {
  id: string;
  hostId: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  amountMinor?: number | null;
  platformFeeMinor?: number | null;
  netAmountMinor?: number | null;
  status: PayoutStatus;
  method?: "MANUAL" | "STRIPE_TRANSFER";
  bookingIds: string[];
  stripeTransferId?: string | null;
  idempotencyKey?: string | null;
  failureReason?: string | null;
  processedAt?: string | null;
  createdAt: string;
  host?: {
    id: string;
    email: string;
    name: string | null;
    connectAccount?: {
      status: ConnectStatus;
      payoutsEnabled: boolean;
    } | null;
  } | null;
};

type PayoutColumnsOptions = {
  onProcess: (payout: AdminPayout) => void;
  processingId?: string | null;
};

const statusClassName = (status: PayoutStatus) =>
  cn(
    status === "PENDING" && "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
    status === "PROCESSING" && "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    status === "COMPLETED" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    status === "FAILED" && "border-destructive/30 bg-destructive/10 text-destructive"
  );

const connectClassName = (status: ConnectStatus | null | undefined) =>
  cn(
    status === "ACTIVE" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    status === "PENDING_VERIFICATION" && "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
    status === "ONBOARDING" && "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    status === "DISABLED" && "border-destructive/30 bg-destructive/10 text-destructive",
    !status && "text-muted-foreground"
  );

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

const canProcess = (payout: AdminPayout) =>
  ["PENDING", "FAILED"].includes(payout.status) &&
  payout.host?.connectAccount?.status === "ACTIVE";

const disabledReason = (payout: AdminPayout) => {
  if (!["PENDING", "FAILED"].includes(payout.status)) {
    return "Only pending or failed payouts can be processed";
  }
  if (payout.host?.connectAccount?.status !== "ACTIVE") {
    return "Host Connect account is not active";
  }
  return undefined;
};

export const createColumns = ({
  onProcess,
  processingId,
}: PayoutColumnsOptions): ColumnDef<AdminPayout>[] => [
  {
    id: "host",
    accessorFn: (payout) =>
      payout.host?.name || payout.host?.email || payout.hostId,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Host
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const payout = row.original;
      const label = payout.host?.name || payout.host?.email || payout.hostId;

      return (
        <div className="min-w-44">
          <div className="max-w-[220px] truncate font-medium" title={label}>
            {label}
          </div>
          <div className="text-xs text-muted-foreground">
            {payout.hostId.slice(0, 8)}...
          </div>
        </div>
      );
    },
  },
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
    cell: ({ row }) => {
      const payout = row.original;
      const badge = (
        <Badge variant="outline" className={statusClassName(payout.status)}>
          {payout.status}
        </Badge>
      );

      if (payout.status !== "FAILED" || !payout.failureReason) {
        return badge;
      }

      return (
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent className="max-w-xs">
            {payout.failureReason}
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    id: "connect",
    header: "Connect",
    cell: ({ row }) => {
      const status = row.original.host?.connectAccount?.status;
      return (
        <Badge variant="outline" className={connectClassName(status)}>
          {status || "UNKNOWN"}
        </Badge>
      );
    },
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
  {
    id: "actions",
    cell: ({ row }) => {
      const payout = row.original;
      const reason = disabledReason(payout);
      const isProcessing = processingId === payout.id;

      return (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canProcess(payout) || isProcessing}
          title={reason}
          onClick={() => onProcess(payout)}
        >
          <Send className="size-4" />
          {isProcessing ? "Processing" : "Process"}
        </Button>
      );
    },
  },
];
