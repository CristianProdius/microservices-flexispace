"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { searchHosts } from "@/lib/invites";
import type { User } from "@/lib/auth";
import { fieldClassName, labelClassName } from "./venue-form.shared";

export type HostSelection =
  | { kind: "existing"; id: string; label: string }
  | { kind: "new"; name: string; email: string };

interface HostFieldProps {
  value: HostSelection | null;
  onChange: (value: HostSelection | null) => void;
}

const HostField = ({ value, onChange }: HostFieldProps) => {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode !== "existing") return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      searchHosts(query || undefined)
        .then(setResults)
        .catch(() => setResults([]));
    }, 250);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [mode, query]);

  return (
    <div className="space-y-3">
      <Label className={labelClassName}>Host</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "existing" ? "default" : "outline"}
          onClick={() => {
            setMode("existing");
            onChange(null);
          }}
        >
          Existing host
        </Button>
        <Button
          type="button"
          variant={mode === "new" ? "default" : "outline"}
          onClick={() => {
            setMode("new");
            onChange(name || email ? { kind: "new", name, email } : null);
          }}
        >
          New host
        </Button>
      </div>

      {mode === "existing" ? (
        <div className="space-y-2">
          <input
            aria-label="Search hosts"
            className={fieldClassName}
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {value?.kind === "existing" && (
            <p className="text-sm text-muted-foreground">
              Selected: {value.label}
            </p>
          )}
          <ul className="space-y-1">
            {results.map((host) => (
              <li key={host.id}>
                <button
                  type="button"
                  className="w-full rounded-md border border-input px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() =>
                    onChange({
                      kind: "existing",
                      id: host.id,
                      label: host.name || host.username || host.email,
                    })
                  }
                >
                  {host.name || host.username} — {host.email}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            aria-label="New host name"
            className={fieldClassName}
            placeholder="Full name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              onChange({ kind: "new", name: e.target.value, email });
            }}
          />
          <input
            aria-label="New host email"
            type="email"
            className={fieldClassName}
            placeholder="name@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              onChange({ kind: "new", name, email: e.target.value });
            }}
          />
        </div>
      )}
    </div>
  );
};

export default HostField;
