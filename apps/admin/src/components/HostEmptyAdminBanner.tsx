"use client";

import Link from "next/link";
import { Info } from "lucide-react";

export function HostEmptyAdminBanner() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 size-5 text-muted-foreground" />
        <div className="space-y-2">
          <h2 className="text-base font-semibold">You&apos;re connected as an admin</h2>
          <p className="text-sm text-muted-foreground">
            Pick a host from the sidebar dropdown to view their workspace, or
            visit the{" "}
            <Link href="/admin" className="underline">
              Platform Dashboard
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
