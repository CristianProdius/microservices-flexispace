"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import useAuthStore from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeRedirectPath } from "@/lib/safeRedirect";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = await login(email, password);
      // Honour `?next=` from the middleware redirect when it's a safe,
      // same-origin path; otherwise fall back to the role-based default.
      const safeNext = safeRedirectPath(searchParams.get("next"));
      router.replace(
        safeNext ?? (user.role === "ADMIN" ? "/admin" : "/host")
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-semibold text-balance">Sign in</h1>
        <p className="text-sm leading-6 text-[var(--auth-muted)] text-pretty">
          Use your email and password to continue.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            placeholder="name@company.com"
            className="h-11 rounded-xl border-black/10 bg-white shadow-none focus-visible:border-[var(--auth-brand)] focus-visible:ring-[var(--auth-brand)]/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-11 rounded-xl border-black/10 bg-white shadow-none focus-visible:border-[var(--auth-brand)] focus-visible:ring-[var(--auth-brand)]/20"
          />
        </div>

        <Button
          type="submit"
          size="xl"
          disabled={isLoading}
          className="h-12 w-full rounded-xl bg-[var(--auth-brand)] text-white hover:bg-[var(--auth-brand-hover)]"
        >
          <span>{isLoading ? "Signing in..." : "Continue to dashboard"}</span>
          {!isLoading && <ArrowRight className="size-4" />}
        </Button>
      </form>
    </div>
  );
}
