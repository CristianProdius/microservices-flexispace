"use client";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/TablePagination";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import useAuthStore from "@/stores/authStore";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface SpaceRow {
  id: number | string;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onSpacesChanged?: () => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onSpacesChanged,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
  });

  const { getToken } = useAuthStore();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const selectedRows = table.getSelectedRowModel().rows;

      const results = await Promise.allSettled(
        selectedRows.map(async (row) => {
          const spaceId = (row.original as SpaceRow).id;
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/${spaceId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            let message = `Failed to delete space ${spaceId}`;
            try {
              const error = await response.json();
              message = error.message || message;
            } catch {
              // ignore
            }
            throw new Error(message);
          }
        })
      );

      const failures = results.filter(
        (result): result is PromiseRejectedResult => result.status === "rejected"
      );

      if (failures.length > 0) {
        const total = selectedRows.length;
        const detail = failures[0]?.reason instanceof Error ? failures[0].reason.message : "Unknown error";
        throw new Error(
          `Failed to delete ${failures.length} of ${total} space(s): ${detail}`
        );
      }
    },
    onSuccess: () => {
      toast.success("Space(s) deleted successfully");
      setRowSelection({});
      onSpacesChanged?.();
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="rounded-md border">
      {Object.keys(rowSelection).length > 0 && (
        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 bg-red-500 text-white px-2 py-1 text-sm rounded-md m-4 cursor-pointer"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
            {mutation.isPending ? "Deleting" : "Delete Space(s)"}
          </button>
        </div>
      )}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
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
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DataTablePagination table={table} />
    </div>
  );
}
