"use client";
import { Link, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import ProfileButton from "../ProfileButton";
import LanguageSwitcher from "../LanguageSwitcher";
import MobileMenu from "./MobileMenu";
import useAuthStore from "@/stores/authStore";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { isHostRole } from "@/lib/roles";

export const NavbarV4 = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const t = useTranslations("common");
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50 w-full pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-7xl px-4 pt-3">
        <nav
          className="rounded-2xl border border-border bg-white/80 backdrop-blur-lg shadow-sm px-6 py-2.5"
          aria-label={t("navigation")}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" aria-label="Spacefly.ai">
              <Image
                src="/brand/wordmark_transparent.png"
                alt="Spacefly.ai"
                width={188}
                height={62}
                priority
                className="h-8 w-auto object-contain"
              />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/spaces"
                className={cn(
                  "text-sm font-semibold transition-colors",
                  pathname === "/spaces" ? "text-primary" : "text-foreground hover:text-primary"
                )}
              >
                {t("browseSpaces")}
              </Link>
              <Link
                href="/hosts"
                className={cn(
                  "text-sm font-semibold transition-colors",
                  pathname === "/hosts" ? "text-primary" : "text-foreground hover:text-primary"
                )}
              >
                {t("browseHosts")}
              </Link>
              {isAuthenticated && (
                <Link
                  href="/bookings"
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    pathname === "/bookings" ? "text-primary" : "text-foreground hover:text-primary"
                  )}
                >
                  {t("myBookings")}
                </Link>
              )}
              {isAuthenticated && isHostRole(user?.role) && (
                <a
                  href={`${process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:5001"}/host`}
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {t("hostDashboard")}
                </a>
              )}
            </div>

            {/* Desktop right controls */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher />
              {!isLoading && !isAuthenticated && (
                <>
                  <Link
                    href="/become-host"
                    className="text-xs text-muted hover:text-foreground transition-colors"
                  >
                    {t("becomeAHost")}
                  </Link>
                  <Link
                    href="/login"
                    className="text-xs text-primary font-medium hover:text-primary-hover transition-colors"
                  >
                    {t("signIn")}
                  </Link>
                </>
              )}
              {!isLoading && isAuthenticated && <ProfileButton />}
            </div>

            {/* Mobile controls */}
            <div className="flex md:hidden items-center gap-2">
              <LanguageSwitcher />
              <MobileMenu />
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default NavbarV4;
