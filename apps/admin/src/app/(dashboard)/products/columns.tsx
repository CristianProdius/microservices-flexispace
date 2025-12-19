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
import { Space } from "@repo/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Parse images field - handles both array and stringified array
const parseImages = (images: unknown): string[] => {
  if (Array.isArray(images)) return images;
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const columns: ColumnDef<Space>[] = [
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
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const space = row.original;
      const images = parseImages(space.images);
      return (
        <div className="w-12 h-9 relative">
          {images[0] ? (
            <Image
              src={images[0]}
              alt={space.name}
              fill
              className="rounded object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
              No img
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "spaceType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("spaceType") as string;
      return <span className="text-xs">{type.replace("_", " ")}</span>;
    },
  },
  {
    accessorKey: "city",
    header: "City",
  },
  {
    accessorKey: "pricePerHour",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price/Hr
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = row.getValue("pricePerHour") as number | null;
      return price ? `$${(price / 100).toFixed(0)}` : "-";
    },
  },
  {
    accessorKey: "capacity",
    header: "Capacity",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const space = row.original;

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
              onClick={() =>
                navigator.clipboard.writeText(space.id.toString())
              }
            >
              Copy space ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={`/products/${space.id}`}>View space</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
