"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import useAuthStore from "@/stores/authStore";
import { fetchWithAuth, SessionExpiredError } from "@/lib/apiClient";
import { useTranslations } from "next-intl";
import {
  Building2,
  DollarSign,
  Calendar,
  Shield,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const BecomeHostPage = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, token, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const t = useTranslations("becomeHost");
  const tCommon = useTranslations("common");

  useEffect(() => {
    if (!authLoading && user?.role === "HOST") {
      window.location.href =
        process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:5001";
    }
  }, [authLoading, user]);

  const handleBecomeHost = async () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/become-host");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/auth/become-host`,
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to become a host");
      }

      const data = await res.json();

      // Update the user in the store with new role
      if (data.user) {
        setUser(data.user);
      }

      setSuccess(true);

      // Redirect to admin app host dashboard after a short delay
      setTimeout(() => {
        window.location.href =
          process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:5001";
      }, 2000);
    } catch (err) {
      // Session expired: the auth store is already navigating to /login.
      if (err instanceof SessionExpiredError) return;
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full size-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 md:py-24">
        <div className="size-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="size-8 text-success" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4 tracking-tight text-balance">
          {t("successTitle")}
        </h1>
        <p className="text-muted mb-6 text-pretty">
          {t("successDescription")}
        </p>
        <p className="text-muted">{t("redirecting")}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Floating space cards — decorative illustration */}
        <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 hidden md:block w-[480px] lg:w-[540px]" aria-hidden="true">
          <div className="relative h-[420px]">
            {/* Card 1 — large, front */}
            <div
              className="absolute left-8 top-8 w-52 h-36 rounded-2xl border border-border bg-white shadow-[var(--shadow-lg)]"
              style={{ animation: "float 6s ease-in-out infinite" }}
            >
              <div className="p-4">
                <div className="w-20 h-2.5 rounded-full bg-foreground/10 mb-3" />
                <div className="w-14 h-2 rounded-full bg-foreground/[0.06] mb-5" />
                <div className="flex gap-1.5">
                  <div className="size-6 rounded-md bg-primary/15" />
                  <div className="size-6 rounded-md bg-primary/10" />
                  <div className="size-6 rounded-md bg-primary/[0.06]" />
                </div>
              </div>
            </div>

            {/* Card 2 — medium, behind right */}
            <div
              className="absolute right-4 top-28 w-44 h-28 rounded-2xl border border-border bg-white shadow-[var(--shadow-md)]"
              style={{ animation: "float 6s ease-in-out 2s infinite" }}
            >
              <div className="p-4">
                <div className="w-16 h-2.5 rounded-full bg-foreground/10 mb-3" />
                <div className="w-24 h-2 rounded-full bg-foreground/[0.06] mb-2" />
                <div className="w-10 h-2 rounded-full bg-foreground/[0.06]" />
              </div>
            </div>

            {/* Card 3 — small accent */}
            <div
              className="absolute left-16 bottom-16 w-40 h-24 rounded-2xl border border-primary/20 bg-primary/[0.03] shadow-[var(--shadow-sm)]"
              style={{ animation: "float 6s ease-in-out 4s infinite" }}
            >
              <div className="p-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 mb-3" />
                <div className="w-20 h-2 rounded-full bg-primary/10" />
              </div>
            </div>

            {/* Dots — scattered */}
            <div className="absolute right-24 top-12 size-2 rounded-full bg-primary/20" style={{ animation: "float 4s ease-in-out 1s infinite" }} />
            <div className="absolute left-0 top-1/2 size-1.5 rounded-full bg-primary/15" style={{ animation: "float 5s ease-in-out 3s infinite" }} />
            <div className="absolute right-12 bottom-24 size-2.5 rounded-full bg-primary/10" style={{ animation: "float 4.5s ease-in-out 0.5s infinite" }} />
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
        `}</style>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-foreground tracking-tighter leading-[0.95] mb-6 text-balance">
              {t("heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-muted max-w-xl mb-10 text-pretty">
              {t("heroDescription")}
            </p>

            {error && (
              <div className="max-w-md mb-6 p-4 bg-danger/10 text-danger rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleBecomeHost}
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-hover text-white text-lg font-semibold rounded-xl shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  {t("processingText")}
                </>
              ) : (
                <>
                  {t("startHosting")}
                  <ArrowRight className="size-5" />
                </>
              )}
            </button>

            {!isAuthenticated && (() => {
              const parts = t("signInToContinue", { link: "__LINK__" }).split("__LINK__");
              return (
                <p className="text-sm text-muted mt-4">
                  {parts[0]}
                  <Link href="/login?redirect=/become-host" className="text-primary hover:underline">
                    {t("signInLink")}
                  </Link>
                  {parts[1]}
                </p>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 rounded-xl border border-border overflow-hidden">
          {[
            { icon: DollarSign, title: t("earnExtraIncome"), desc: t("earnExtraIncomeDesc") },
            { icon: Calendar, title: t("flexibleSchedule"), desc: t("flexibleScheduleDesc") },
            { icon: Shield, title: t("securePayments"), desc: t("securePaymentsDesc") },
            { icon: Building2, title: t("easyManagement"), desc: t("easyManagementDesc") },
          ].map((item, i) => (
            <div
              key={item.title}
              className={cn(
                "p-6 md:p-8",
                i > 0 && "border-t sm:border-l border-border",
                i === 2 && "sm:border-l-0 md:border-l md:border-t-0",
                i === 1 && "sm:border-t-0",
                i === 3 && "sm:border-t-0 md:border-t-0"
              )}
            >
              <item.icon className="size-5 text-primary mb-4" />
              <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted text-pretty">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-muted mb-16">
          {t("howItWorks")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20">
          <div>
            <span className="block text-7xl md:text-8xl font-bold text-primary/10 leading-none tracking-tighter">01</span>
            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">{t("createListing")}</h3>
            <p className="text-sm text-muted leading-relaxed text-pretty">
              {t("createListingDesc")}
            </p>
          </div>

          <div>
            <span className="block text-7xl md:text-8xl font-bold text-primary/10 leading-none tracking-tighter">02</span>
            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">{t("acceptBookings")}</h3>
            <p className="text-sm text-muted leading-relaxed text-pretty">
              {t("acceptBookingsDesc")}
            </p>
          </div>

          <div>
            <span className="block text-7xl md:text-8xl font-bold text-primary/10 leading-none tracking-tighter">03</span>
            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">{t("getPaid")}</h3>
            <p className="text-sm text-muted leading-relaxed text-pretty">
              {t("getPaidDesc")}
            </p>
          </div>
        </div>
        <div className="mt-16 border-t border-border" />
      </section>

      {/* Space Types */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 tracking-tight text-balance">
          {t("whatCanYouHost")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {[
            { name: t("officeDesks"), emoji: "\u{1F5A5}\u{FE0F}" },
            { name: t("privateOffices"), emoji: "\u{1F3E2}" },
            { name: t("meetingRooms"), emoji: "\u{1F465}" },
            { name: t("eventVenues"), emoji: "\u{1F389}" },
            { name: t("weddingVenues"), emoji: "\u{1F492}" },
            { name: t("coworkingSpaces"), emoji: "\u{1F3E0}" },
          ].map((type) => (
            <div key={type.name} className="group p-6 bg-white rounded-xl border border-border shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-primary/30 transition-all">
              <div className="text-4xl mb-3">{type.emoji}</div>
              <p className="text-sm font-medium text-foreground">{type.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-subtle border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight text-balance">
              {t("readyToStart")}
            </h2>
            <p className="text-muted mt-3 text-pretty max-w-lg">
              {t("readyToStartDesc")}
            </p>
          </div>
          <button
            onClick={handleBecomeHost}
            disabled={loading}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-8 py-4 text-lg font-semibold text-white shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                {t("processingText")}
              </>
            ) : (
              <>
                {tCommon("becomeAHost")}
                <ArrowRight className="size-5" />
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
};

export default BecomeHostPage;
