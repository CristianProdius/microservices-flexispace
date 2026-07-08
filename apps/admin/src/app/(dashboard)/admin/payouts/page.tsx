"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
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
import {
  AdminPayout,
  PayoutStatus,
  createColumns,
} from "./columns";

type PayoutFilter = PayoutStatus | "ALL";

type PayoutsResponse = {
  payouts: AdminPayout[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const payoutFilters: PayoutFilter[] = [
  "ALL",
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
];

function PayoutsTable({
  data,
  onProcess,
  processingId,
}: {
  data: AdminPayout[];
  onProcess: (payout: AdminPayout) => void;
  processingId: string | null;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = useMemo(
    () => createColumns({ onProcess, processingId }),
    [onProcess, processingId]
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
                No payouts found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DataTablePagination table={table} />
    </div>
  );
}

export default function AdminPayoutsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<PayoutFilter>("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const payoutsQuery = useQuery({
    enabled: !authLoading && isAuthenticated && isAdmin,
    queryKey: ["admin-payouts", statusFilter],
    retry: false,
    queryFn: async (): Promise<PayoutsResponse> => {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      let response: Response;
      try {
        response = await apiFetch(
          `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/payouts?${params}`
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

  const processMutation = useMutation({
    mutationFn: async (payoutId: string): Promise<AdminPayout> => {
      let response: Response;
      try {
        response = await apiFetch(
          `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/payouts/${payoutId}/process`,
          { method: "POST" }
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
        let message = "Payout could not be processed";
        try {
          const body = await response.json();
          message = body.message || body.code || message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }
      return response.json();
    },
    onMutate: (payoutId) => {
      setProcessingId(payoutId);
    },
    onSuccess: () => {
      toast.success("Payout processed");
      void queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      setProcessingId(null);
    },
  });

  const handleProcess = useMemo(
    () => (payout: AdminPayout) => {
      processMutation.mutate(payout.id);
    },
    [processMutation]
  );

  if (authLoading || payoutsQuery.isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Payouts"
        description="Review host payout queue and process Stripe Connect transfers."
        action={
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as PayoutFilter)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {payoutFilters.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "ALL" ? "All statuses" : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {payoutsQuery.isError ? (
        <DataLoadError
          message="Payouts could not be loaded. Check the order service and retry."
          onRetry={() => {
            void payoutsQuery.refetch();
          }}
        />
      ) : (
        <PayoutsTable
          data={payoutsQuery.data?.payouts ?? []}
          onProcess={handleProcess}
          processingId={processingId}
        />
      )}
    </div>
  );
}
