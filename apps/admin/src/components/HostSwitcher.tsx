"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, X } from "lucide-react";
import useAuthStore from "@/stores/authStore";
import { apiFetch, UnauthenticatedError } from "@/lib/apiFetch";
import { CreateLeadHostModal, type CreatedHost } from "./CreateLeadHostModal";

interface Host {
  id: string;
  name: string | null;
  username: string;
  email: string;
  image: string | null;
  role: "HOST" | "ADMIN";
  hostVerified: boolean;
  emailVerified: boolean;
}

interface CountRow {
  hostId: string;
  count: number;
}

export function HostSwitcher() {
  const { isAdmin, actingHostId, setActingHost } = useAuthStore();
  const [hosts, setHosts] = useState<Host[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [hostsRes, countsRes] = await Promise.all([
        apiFetch(
          `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/users/hosts?include=admins`
        ),
        apiFetch(
          `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/venues/counts-by-host`
        ),
      ]);
      if (!hostsRes.ok) throw new Error("hosts");
      if (!countsRes.ok) throw new Error("counts");
      const hostsJson: Host[] = await hostsRes.json();
      const countsJson: CountRow[] = await countsRes.json();
      setHosts(hostsJson);
      setCounts(
        Object.fromEntries(countsJson.map((r) => [r.hostId, r.count]))
      );
    } catch (err) {
      if (err instanceof UnauthenticatedError) {
        setError("Session expired");
      } else {
        setError("Couldn't load hosts");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const selected = useMemo(
    () => hosts.find((h) => h.id === actingHostId) ?? null,
    [hosts, actingHostId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hosts;
    return hosts.filter(
      (h) =>
        (h.name?.toLowerCase().includes(q) ?? false) ||
        h.username.toLowerCase().includes(q) ||
        h.email.toLowerCase().includes(q)
    );
  }, [hosts, query]);

  const handleCreated = useCallback(
    (host: CreatedHost) => {
      setActingHost(host.id);
      void load();
    },
    [setActingHost, load]
  );

  if (!isAdmin) return null;

  return (
    <div className="px-2 py-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between gap-2 rounded-md border border-border/60 bg-card px-3 py-2 text-left text-sm hover:bg-accent/30 transition-colors"
          >
            <span className="truncate">
              {selected ? (
                <>
                  <span className="text-muted-foreground">Acting as:</span>{" "}
                  <span className="font-medium">
                    {selected.name || selected.username}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Select a host…</span>
              )}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="border-b border-border/60 p-2">
            <Input
              placeholder="Search hosts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {loading && (
              <div className="p-3 text-sm text-muted-foreground">
                Loading…
              </div>
            )}
            {!loading && error && (
              <div className="p-3 text-sm text-red-600">
                {error}{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => void load()}
                >
                  retry
                </button>
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">
                No matches.
              </div>
            )}
            {!loading &&
              !error &&
              filtered.map((h) => {
                const badge =
                  h.role === "ADMIN"
                    ? "ADMIN"
                    : h.emailVerified
                    ? "HOST"
                    : "LEAD";
                const isActive = actingHostId === h.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setActingHost(h.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent/30 transition-colors ${
                      isActive ? "bg-accent/30" : ""
                    }`}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block truncate font-medium">
                        {h.name || h.username}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {h.email}
                      </span>
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      {badge}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums w-6 text-right">
                      {counts[h.id] ?? 0}
                    </span>
                  </button>
                );
              })}
          </div>
          <div className="border-t border-border/60 p-2 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => {
                setOpen(false);
                setCreateOpen(true);
              }}
            >
              <Plus className="size-4" />
              Create new lead host
            </Button>
            {actingHostId && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground"
                onClick={() => {
                  setActingHost(null);
                  setOpen(false);
                }}
              >
                <X className="size-4" />
                Clear selection
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <CreateLeadHostModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
