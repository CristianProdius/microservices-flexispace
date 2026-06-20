"use client";

import { useState } from "react";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import useAuthStore from "@/stores/authStore";
import { toast } from "react-toastify";

interface SetTempPasswordProps {
  userId: string;
  email: string;
}

const SetTempPassword = ({ userId, email }: SetTempPasswordProps) => {
  const { getToken } = useAuthStore();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginUrl =
    typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";

  const generate = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/users/${userId}/temp-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to set temporary password");
      }
      const data = await res.json();
      setTempPassword(data.tempPassword);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to set temporary password");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (label: string, value: string) => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Couldn't copy ${label} — copy it manually`);
    }
  };

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Set temporary password</SheetTitle>
        <SheetDescription asChild>
          <div className="space-y-6 text-left">
            <p className="text-sm text-muted-foreground">
              Generates a one-time temporary password and forces this host to
              choose their own when they first sign in. Share the credentials
              below with the host directly.
            </p>

            {!tempPassword ? (
              <Button onClick={generate} disabled={loading}>
                {loading ? "Generating…" : "Generate temporary password"}
              </Button>
            ) : (
              <div className="space-y-4">
                <CredentialRow label="Login URL" value={loginUrl} onCopy={copy} />
                <CredentialRow label="Email" value={email} onCopy={copy} />
                <CredentialRow
                  label="Temporary password"
                  value={tempPassword}
                  onCopy={copy}
                />
                <p className="text-xs text-amber-600">
                  This password is shown once. Copy it now — you won&apos;t be
                  able to see it again.
                </p>
              </div>
            )}
          </div>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
};

function CredentialRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (label: string, value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <code
          aria-label={label}
          className="flex-1 rounded-md border border-black/10 bg-muted px-3 py-2 font-mono text-sm break-all"
        >
          {value}
        </code>
        <Button type="button" variant="outline" onClick={() => onCopy(label, value)}>
          Copy
        </Button>
      </div>
    </div>
  );
}

export default SetTempPassword;
