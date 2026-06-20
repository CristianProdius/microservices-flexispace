"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/auth";

/**
 * Belt-and-braces: login already redirects a flagged host to /onboarding, but
 * a host who navigates straight to a dashboard URL (or refreshes mid-wizard)
 * still holds a valid session cookie. This checks the flag once on mount and
 * pulls them back into onboarding. Renders nothing.
 */
export default function OnboardingGuard() {
  const router = useRouter();
  useEffect(() => {
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
  }, [router]);
  return null;
}
