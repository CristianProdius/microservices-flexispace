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
import { deleteUsers, type DeleteUsersResult } from "./delete-users";

interface User {
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: string;
  image: string | null;
  createdAt: string;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onUsersChanged?: () => void | Promise<void>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onUsersChanged,
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

  const mutation = useMutation<DeleteUsersResult, Error>({
    mutationFn: async () => {
      const token = await getToken();
      const selectedRows = table.getSelectedRowModel().rows;
      const selectedIds = selectedRows.map((row) => (row.original as User).id);

      return deleteUsers({
        baseUrl: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ?? "",
        token,
        ids: selectedIds,
      });
    },
    onSuccess: async ({ successCount }) => {
      toast.success(`${successCount} user(s) deleted successfully`);
      setRowSelection({});
      if (onUsersChanged) {
        await onUsersChanged();
      }
    },
    onError: async (error) => {
      toast.error(error.message);
      // Refresh anyway so partial successes are reflected in the list.
      setRowSelection({});
      if (onUsersChanged) {
        await onUsersChanged();
      }
    },
  });

  return (
    <div className="rounded-md border">
      {Object.keys(rowSelection).length > 0 && (
        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 bg-red-500 text-white px-2 py-1 text-sm rounded-md m-4 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={() => {
              if (mutation.isPending) return;
              const count = table.getSelectedRowModel().rows.length;
              if (count === 0) return;
              const ok = window.confirm(
                `Delete ${count} user${count === 1 ? "" : "s"}? This action cannot be undone.`
              );
              if (!ok) return;
              mutation.mutate();
            }}
            disabled={mutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
            {mutation.isPending ? "Deleting" : "Delete User(s)"}
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
