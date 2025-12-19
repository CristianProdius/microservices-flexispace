"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import useAuthStore from "@/stores/authStore";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  DollarSign,
  Plus,
  Star,
} from "lucide-react";

const hostNavItems = [
  { href: "/host", label: "Dashboard", icon: LayoutDashboard },
  { href: "/host/spaces", label: "My Spaces", icon: Building2 },
  { href: "/host/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/host/earnings", label: "Earnings", icon: DollarSign },
];

export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login?redirect=/host");
      } else if (user?.role !== "HOST" && user?.role !== "ADMIN") {
        router.push("/become-host");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== "HOST" && user?.role !== "ADMIN")) {
    return null;
  }

  return (
    <div className="flex gap-8">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 hidden lg:block">
        <div className="sticky top-4 space-y-2">
          <div className="p-4 bg-gray-50 rounded-xl mb-4">
            <h2 className="font-semibold text-gray-900">Host Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage your spaces and bookings
            </p>
          </div>

          <nav className="space-y-1">
            {hostNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4">
            <Link
              href="/host/spaces/new"
              className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add New Space
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-50">
        <nav className="flex justify-around">
          {hostNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                  isActive ? "text-blue-600" : "text-gray-500"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">{children}</main>
    </div>
  );
}
