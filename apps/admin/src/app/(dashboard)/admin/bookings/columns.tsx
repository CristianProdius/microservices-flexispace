"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Booking } from "@repo/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import Link from "next/link";

export type AdminBooking = Booking & {
  guest?: {
    email: string;
    id: string;
    name: string | null;
  };
  host?: {
    email: string;
    id: string;
    name: string | null;
  };
  space?: {
    id: number;
    name: string;
  };
};

const relatedPartyLabel = (
  party: { email: string; id: string; name: string | null } | undefined,
  fallbackId: string
) => party?.name || party?.email || fallbackId;

export const columns: ColumnDef<AdminBooking>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        checked={row.getIsSelected()}
      />
    ),
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      const id = row.getValue("id") as string;
      return <span className="font-mono text-xs">{id.slice(0, 8)}...</span>;
    },
  },
  {
    id: "space",
    accessorFn: (booking) => booking.space?.name || booking.spaceId.toString(),
    header: "Space",
    cell: ({ row }) => {
      const booking = row.original;

      return (
        <div className="min-w-40">
          <div className="font-medium">
            {booking.space?.name || "Unknown space"}
          </div>
          <div className="text-xs text-muted-foreground">
            ID {booking.spaceId}
          </div>
        </div>
      );
    },
  },
  {
    id: "guest",
    accessorFn: (booking) =>
      relatedPartyLabel(booking.guest, booking.guestId),
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Guest
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const booking = row.original;
      return (
        <div className="min-w-36">
          <div className="font-medium">
            {relatedPartyLabel(booking.guest, booking.guestId)}
          </div>
          <div className="text-xs text-muted-foreground">
            {booking.guestId.slice(0, 8)}...
          </div>
        </div>
      );
    },
  },
  {
    id: "host",
    accessorFn: (booking) => relatedPartyLabel(booking.host, booking.hostId),
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Host
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const booking = row.original;
      return (
        <div className="min-w-36">
          <div className="font-medium">
            {relatedPartyLabel(booking.host, booking.hostId)}
          </div>
          <div className="text-xs text-muted-foreground">
            {booking.hostId.slice(0, 8)}...
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;

      return (
        <div
          className={cn(
            `p-1 rounded-md w-max text-xs`,
            status === "PENDING" && "bg-yellow-500/40",
            status === "CONFIRMED" && "bg-purple-500/40",
            status === "COMPLETED" && "bg-green-500/40",
            status === "CANCELLED" && "bg-red-500/40",
            status === "REJECTED" && "bg-red-500/40"
          )}
        >
          {status}
        </div>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalAmount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: row.original.currency || "USD",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const booking = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(booking.id)}
            >
              Copy booking ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={`/admin/users/${booking.guestId}`}>View guest</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>View booking details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
