"use client";

import { LogOut, CalendarDays, User, Building2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Menu } from "@base-ui/react/menu";
import useAuthStore from "@/stores/authStore";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { isHostRole } from "@/lib/roles";

const ProfileButton = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const t = useTranslations("common");

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const isHost = isHostRole(user?.role);

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={t("user")}
        className="size-9 rounded-full bg-subtle flex items-center justify-center hover:bg-border transition-colors border border-border hover:ring-2 hover:ring-primary/20 cursor-pointer"
      >
        {user?.image ? (
          <img
            src={user.image}
            alt={user.name || t("user")}
            className="size-9 rounded-full object-cover"
          />
        ) : (
          <User className="size-5 text-muted" />
        )}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8}>
          <Menu.Popup className="w-56 backdrop-blur-xl bg-white/95 rounded-xl shadow-[var(--shadow-lg)] border border-border py-2 z-50">
            <div className="px-4 py-3 border-b border-border">
              <p className="font-medium text-foreground">{user?.name || t("user")}</p>
              <p className="text-sm text-muted">{user?.email}</p>
              {user?.role && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-subtle text-muted text-xs rounded-full">
                  {user.role}
                </span>
              )}
            </div>

            <div className="py-1">
              <Menu.Item
                onClick={() => router.push("/bookings")}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm text-foreground flex items-center gap-3 cursor-pointer",
                  "data-[highlighted]:bg-subtle"
                )}
              >
                <CalendarDays className="size-4" />
                {t("myBookings")}
              </Menu.Item>

              {isHost && (
                <Menu.Item
                  onClick={() => {
                    window.location.href = `${process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:5001"}/host`;
                  }}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm text-foreground flex items-center gap-3 cursor-pointer",
                    "data-[highlighted]:bg-subtle"
                  )}
                >
                  <Building2 className="size-4" />
                  {t("hostDashboard")}
                </Menu.Item>
              )}

              {!isHost && (
                <Menu.Item
                  onClick={() => router.push("/become-host")}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm text-primary flex items-center gap-3 cursor-pointer",
                    "data-[highlighted]:bg-primary-light"
                  )}
                >
                  <Building2 className="size-4" />
                  {t("becomeAHost")}
                </Menu.Item>
              )}
            </div>

            <div className="border-t border-border pt-1">
              <Menu.Item
                onClick={handleLogout}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm text-danger flex items-center gap-3 cursor-pointer",
                  "data-[highlighted]:bg-danger/10"
                )}
              >
                <LogOut className="size-4" />
                {t("signOut")}
              </Menu.Item>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};

export default ProfileButton;
