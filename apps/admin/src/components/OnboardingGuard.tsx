"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/auth";
import useAuthStore from "@/stores/authStore";

/**
 * Belt-and-braces: login already redirects a flagged host to /onboarding, but
 * a host who navigates straight to a dashboard URL (or refreshes mid-wizard)
 * still holds a valid session cookie. This checks the flag once on mount and
 * pulls them back into onboarding. Renders nothing.
 */
export default function OnboardingGuard() {
  const router = useRouter();
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Wait until the store has finished establishing/validating the session.
    // Probing /auth/me before then would hit the auth-service with a stale or
    // already-cleared access cookie and surface a spurious 401 in the console.
    if (isLoading || !isAuthenticated) return;

    let cancelled = false;
    getMe()
      .then((me) => {
        if (!cancelled && me.mustChangePassword === true) {
          router.replace("/onboarding");
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [router, isLoading, isAuthenticated]);
  return null;
}
