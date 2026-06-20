"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import useAuthStore from "@/stores/authStore";
import { getMe, onboardingSetPassword } from "@/lib/auth";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type Step = "welcome" | "password" | "done";

const MIN_PASSWORD_LENGTH = 8;
const STEP_PROGRESS: Record<Step, number> = { welcome: 33, password: 66, done: 100 };

interface VenueLike {
  id?: string | number;
  name?: string;
}

const inputClass =
  "h-11 rounded-xl border-black/10 bg-white shadow-none focus-visible:border-[var(--auth-brand)] focus-visible:ring-[var(--auth-brand)]/20";
const primaryBtn =
  "h-12 w-full rounded-xl bg-[var(--auth-brand)] text-white hover:bg-[var(--auth-brand-hover)]";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>("welcome");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((me) => {
        if (cancelled) return;
        if (me.mustChangePassword === true) {
          setChecking(false);
        } else {
          router.replace("/host");
        }
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return <p className="text-sm text-[var(--auth-muted)]">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <Progress value={STEP_PROGRESS[step]} />
      {step === "welcome" && (
        <WelcomeStep name={user?.name ?? null} onContinue={() => setStep("password")} />
      )}
      {step === "password" && <PasswordStep onDone={() => setStep("done")} />}
      {step === "done" && <DoneStep onFinish={() => router.replace("/host")} />}
    </div>
  );
}

function WelcomeStep({ name, onContinue }: { name: string | null; onContinue: () => void }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-balance">
          Welcome to Spacefly{name ? `, ${name}` : ""}
        </h1>
        <p className="text-sm leading-6 text-[var(--auth-muted)] text-pretty">
          Let&apos;s get your account set up. It only takes a moment — first,
          choose a password that&apos;s yours.
        </p>
      </div>
      <Button type="button" size="xl" className={primaryBtn} onClick={onContinue}>
        <span>Continue</span>
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

function PasswordStep({ onDone }: { onDone: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await onboardingSetPassword(newPassword);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set your password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-balance">Set your password</h1>
        <p className="text-sm leading-6 text-[var(--auth-muted)] text-pretty">
          Replace the temporary password you used to sign in.
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
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            placeholder="At least 8 characters"
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            placeholder="Re-enter your password"
            className={inputClass}
          />
        </div>
        <Button type="submit" size="xl" disabled={submitting} className={primaryBtn}>
          <span>{submitting ? "Saving…" : "Save and continue"}</span>
          {!submitting && <ArrowRight className="size-4" />}
        </Button>
      </form>
    </div>
  );
}

function DoneStep({ onFinish }: { onFinish: () => void }) {
  const [venues, setVenues] = useState<VenueLike[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/venues/host/my`)
      .then(async (res: Response) => {
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as VenueLike[];
          setVenues(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-balance">You&apos;re all set</h1>
        <p className="text-sm leading-6 text-[var(--auth-muted)] text-pretty">
          {loaded && venues.length > 0
            ? `We've set up ${venues.length} venue${venues.length === 1 ? "" : "s"} for you. Here's what's waiting:`
            : "Your account is ready. You can manage everything from your dashboard."}
        </p>
      </div>

      {venues.length > 0 && (
        <ul className="space-y-2">
          {venues.map((v, i) => (
            <li
              key={v.id ?? i}
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm"
            >
              {v.name ?? "Venue"}
            </li>
          ))}
        </ul>
      )}

      <Button type="button" size="xl" className={primaryBtn} onClick={onFinish}>
        <span>Go to dashboard</span>
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
