"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptInvite, getInvite, type InviteLookup } from "@/lib/invites";

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AcceptInviteShell />}>
      <AcceptInviteForm />
    </Suspense>
  );
}

function AcceptInviteShell() {
  return (
    <div className="space-y-2 text-center lg:text-left">
      <h1 className="text-2xl font-semibold">Accept your invitation</h1>
      <p className="text-sm text-[var(--auth-muted)]">Loading your invite…</p>
    </div>
  );
}

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuthStore();
  const token = searchParams.get("token") ?? "";

  const [lookup, setLookup] = useState<InviteLookup | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLookup({ valid: false, reason: "missing_token" });
      return;
    }
    getInvite(token)
      .then(setLookup)
      .catch(() => setLookup({ valid: false, reason: "lookup_failed" }));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const session = await acceptInvite({ token, newPassword });
      setSession(session);
      router.replace(session.user.role === "ADMIN" ? "/admin" : "/host");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept this invite");
    } finally {
      setSubmitting(false);
    }
  };

  if (!lookup) return <AcceptInviteShell />;

  if (!lookup.valid) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Invitation unavailable</h1>
        <p className="text-sm text-[var(--auth-muted)]">
          This invite is no longer valid — ask your admin to resend it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-semibold">Accept your invitation</h1>
        <p className="text-sm text-[var(--auth-muted)]">
          Welcome{lookup.name ? `, ${lookup.name}` : ""}. Set a password for{" "}
          <strong>{lookup.email}</strong> to finish.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            placeholder="••••••••"
            className="h-11 rounded-xl border-black/10 bg-white"
          />
        </div>
        <Button
          type="submit"
          size="xl"
          disabled={submitting || newPassword.length === 0}
          className="h-12 w-full rounded-xl bg-[var(--auth-brand)] text-white hover:bg-[var(--auth-brand-hover)]"
        >
          {submitting ? "Setting up…" : "Accept invite & continue"}
        </Button>
      </form>
    </div>
  );
}
