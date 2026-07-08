"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { DataLoadError, DashboardPageHeader } from "@/components/dashboard";
import { DataTablePagination } from "@/components/TablePagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";
import useAuthStore from "@/stores/authStore";
import { AdminPayment, PaymentStatus, columns } from "./columns";

type PaymentFilter = PaymentStatus | "ALL";

type PaymentsResponse = {
  payments: AdminPayment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const paymentFilters: PaymentFilter[] = [
  "ALL",
  "REQUIRES_PAYMENT",
  "AUTHORIZED",
  "PAID",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
  "CANCELED",
  "FAILED",
];

function PaymentsTable({ data }: { data: AdminPayment[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);

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
                No payments found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DataTablePagination table={table} />
    </div>
  );
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<PaymentFilter>("ALL");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const paymentsQuery = useQuery({
    enabled: !authLoading && isAuthenticated && isAdmin,
    queryKey: ["admin-payments", statusFilter],
    retry: false,
    queryFn: async (): Promise<PaymentsResponse> => {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      let response: Response;
      try {
        response = await apiFetch(
          `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/payments?${params}`
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
        throw new Error("Payments could not be loaded");
      }
      return response.json();
    },
  });

  if (authLoading || paymentsQuery.isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Payments"
        description="Guest charges, authorizations, refunds, and disputes."
        action={
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as PaymentFilter)}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {paymentFilters.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "ALL" ? "All statuses" : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {paymentsQuery.isError ? (
        <DataLoadError
          message="Payments could not be loaded. Check the order service and retry."
          onRetry={() => {
            void paymentsQuery.refetch();
          }}
        />
      ) : (
        <PaymentsTable data={paymentsQuery.data?.payments ?? []} />
      )}
    </div>
  );
}
