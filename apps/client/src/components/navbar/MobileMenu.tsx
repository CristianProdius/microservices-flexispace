"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { Menu as MenuIcon, X, LogOut } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import useAuthStore from "@/stores/authStore";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { isHostRole } from "@/lib/roles";
import LanguageSwitcher from "../LanguageSwitcher";

const MobileMenu = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuthStore();
  const t = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();

  const isHost = isHostRole(user?.role);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label={t("menu")}
        className="p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
      >
        <MenuIcon className="size-5" />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Popup className="fixed inset-y-0 right-0 w-72 bg-white z-50 shadow-xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <Dialog.Title className="font-semibold text-foreground">
              {t("navigation")}
            </Dialog.Title>
            <Dialog.Close
              aria-label={t("closeMenu")}
              className="p-1.5 text-muted hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>

          <nav className="flex-1 overflow-y-auto py-2">
            <Dialog.Close render={<Link href="/spaces" />} className={cn(
              "block px-4 py-3 text-sm font-medium",
              pathname === "/spaces" ? "text-primary" : "text-foreground"
            )}>
              {t("browseSpaces")}
            </Dialog.Close>

            <Dialog.Close render={<Link href="/hosts" />} className={cn(
              "block px-4 py-3 text-sm font-medium",
              pathname === "/hosts" ? "text-primary" : "text-foreground"
            )}>
              {t("browseHosts")}
            </Dialog.Close>

            {isAuthenticated && (
              <Dialog.Close render={<Link href="/bookings" />} className={cn(
                "block px-4 py-3 text-sm font-medium",
                pathname === "/bookings" ? "text-primary" : "text-foreground"
              )}>
                {t("myBookings")}
              </Dialog.Close>
            )}

            {isAuthenticated && isHost && (
              <Dialog.Close
                render={
                  <a href={`${process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:5001"}/host`} />
                }
                className="block px-4 py-3 text-sm font-medium text-foreground"
              >
                {t("hostDashboard")}
              </Dialog.Close>
            )}

            {!isLoading && !isAuthenticated && (
              <Dialog.Close render={<Link href="/become-host" />} className={cn(
                "block px-4 py-3 text-sm font-medium",
                pathname === "/become-host" ? "text-primary" : "text-foreground"
              )}>
                {t("becomeAHost")}
              </Dialog.Close>
            )}
          </nav>

          <div className="border-t border-border px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <LanguageSwitcher />
            </div>

            {!isLoading && (
              isAuthenticated ? (
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted">{user?.email}</p>
                  </div>
                  <Dialog.Close
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-danger cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    {t("signOut")}
                  </Dialog.Close>
                </div>
              ) : (
                <Dialog.Close render={<Link href="/login" />} className="block text-sm font-medium text-primary">
                  {t("signIn")}
                </Dialog.Close>
              )
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default MobileMenu;
