"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";

export type PaymentStatus =
  | "REQUIRES_PAYMENT"
  | "AUTHORIZED"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "CANCELED"
  | "FAILED";

export type DisputeStatus = "NEEDS_RESPONSE" | "UNDER_REVIEW" | "WON" | "LOST";

export type AdminPayment = {
  id: string;
  bookingId: string;
  guestId: string;
  stripePaymentIntentId: string;
  stripeChargeId?: string | null;
  amountMinor: number;
  applicationFeeMinor: number;
  currency: string;
  status: PaymentStatus;
  refundedMinor: number;
  capturedAt?: string | null;
  createdAt: string;
  booking?: {
    id: string;
    status: string;
    guest?: {
      id: string;
      email: string;
      name: string | null;
    } | null;
    space?: {
      id: number;
      name: string;
    } | null;
  } | null;
  dispute?: {
    id: string;
    status: DisputeStatus;
    amountMinor: number;
    currency: string;
    reason?: string | null;
  } | null;
};

const statusClassName = (status: PaymentStatus) =>
  cn(
    status === "REQUIRES_PAYMENT" && "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
    status === "AUTHORIZED" && "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    status === "PAID" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    status === "PARTIALLY_REFUNDED" && "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
    status === "REFUNDED" && "border-muted-foreground/30 bg-muted text-muted-foreground",
    status === "CANCELED" && "border-muted-foreground/30 bg-muted text-muted-foreground",
    status === "FAILED" && "border-destructive/30 bg-destructive/10 text-destructive"
  );

const disputeClassName = (status: DisputeStatus) =>
  cn(
    status === "NEEDS_RESPONSE" && "border-destructive/30 bg-destructive/10 text-destructive",
    status === "UNDER_REVIEW" && "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
    status === "WON" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    status === "LOST" && "border-destructive/30 bg-destructive/10 text-destructive"
  );

const partyLabel = (
  party: { email: string; id: string; name: string | null } | null | undefined,
  fallbackId: string
) => party?.name || party?.email || fallbackId;

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const columns: ColumnDef<AdminPayment>[] = [
  {
    accessorKey: "bookingId",
    header: "Booking",
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <div className="min-w-40">
          <Link
            href={`/admin/bookings?bookingId=${payment.bookingId}`}
            className="font-mono text-xs text-primary hover:underline"
          >
            {payment.bookingId.slice(0, 10)}...
          </Link>
          <div className="text-xs text-muted-foreground">
            {payment.booking?.space?.name || "Unknown space"}
          </div>
        </div>
      );
    },
  },
  {
    id: "guest",
    accessorFn: (payment) =>
      partyLabel(payment.booking?.guest, payment.guestId),
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Guest
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const payment = row.original;
      const label = partyLabel(payment.booking?.guest, payment.guestId);

      return (
        <div className="min-w-40">
          <div className="max-w-[220px] truncate font-medium" title={label}>
            {label}
          </div>
          <div className="text-xs text-muted-foreground">
            {payment.guestId.slice(0, 8)}...
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "amountMinor",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatMoney(row.original.amountMinor / 100, row.original.currency)}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant="outline" className={statusClassName(status)}>
          {status}
        </Badge>
      );
    },
  },
  {
    id: "dispute",
    header: "Dispute",
    cell: ({ row }) => {
      const dispute = row.original.dispute;
      if (!dispute) {
        return (
          <Badge variant="outline" className="text-muted-foreground">
            No dispute
          </Badge>
        );
      }

      return (
        <Badge variant="outline" className={disputeClassName(dispute.status)}>
          {dispute.status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "refundedMinor",
    header: () => <div className="text-right">Refunded</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground">
        {formatMoney(row.original.refundedMinor / 100, row.original.currency)}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
];
