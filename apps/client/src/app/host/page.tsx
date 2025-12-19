"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useAuthStore from "@/stores/authStore";
import {
  Building2,
  CalendarDays,
  DollarSign,
  TrendingUp,
  Clock,
  Check,
  AlertCircle,
} from "lucide-react";

interface DashboardStats {
  totalSpaces: number;
  activeSpaces: number;
  pendingBookings: number;
  upcomingBookings: number;
  totalEarnings: number;
  pendingEarnings: number;
}

const HostDashboardPage = () => {
  const { token, user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch spaces count
        const spacesRes = await fetch(
          `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/host/my`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const spaces = spacesRes.ok ? await spacesRes.json() : [];

        // Fetch bookings
        const bookingsRes = await fetch(
          `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/host`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const bookings = bookingsRes.ok ? await bookingsRes.json() : [];

        const activeSpaces = spaces.filter((s: any) => s.isActive).length;
        const pendingBookings = bookings.filter(
          (b: any) => b.status === "PENDING"
        ).length;
        const upcomingBookings = bookings.filter(
          (b: any) =>
            ["APPROVED", "DEPOSIT_PAID"].includes(b.status) &&
            new Date(b.startDate) >= new Date()
        ).length;

        // Calculate earnings
        const completedBookings = bookings.filter(
          (b: any) => b.status === "COMPLETED"
        );
        const totalEarnings = completedBookings.reduce(
          (sum: number, b: any) =>
            sum + (b.totalAmount - b.serviceFee - b.cleaningFee),
          0
        );
        const pendingEarnings = bookings
          .filter((b: any) => ["DEPOSIT_PAID"].includes(b.status))
          .reduce(
            (sum: number, b: any) =>
              sum + (b.totalAmount - b.serviceFee - b.cleaningFee),
            0
          );

        setStats({
          totalSpaces: spaces.length,
          activeSpaces,
          pendingBookings,
          upcomingBookings,
          totalEarnings,
          pendingEarnings,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStats();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name || "Host"}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here&apos;s an overview of your hosting activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-6 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500">Active Spaces</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.activeSpaces || 0}
            <span className="text-sm font-normal text-gray-500">
              {" "}
              / {stats?.totalSpaces || 0}
            </span>
          </p>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500">Pending Requests</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.pendingBookings || 0}
          </p>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500">Upcoming</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.upcomingBookings || 0}
          </p>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${stats?.totalEarnings?.toFixed(0) || 0}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Pending Bookings Alert */}
        {stats?.pendingBookings && stats.pendingBookings > 0 && (
          <Link
            href="/host/bookings?status=pending"
            className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">
                {stats.pendingBookings} booking{" "}
                {stats.pendingBookings === 1 ? "request" : "requests"} pending
              </span>
            </div>
            <p className="text-sm text-yellow-700">
              Review and respond to booking requests to keep guests happy
            </p>
          </Link>
        )}

        {/* Earnings Summary */}
        {stats?.pendingEarnings && stats.pendingEarnings > 0 && (
          <Link
            href="/host/earnings"
            className="p-6 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">
                ${stats.pendingEarnings.toFixed(0)} pending earnings
              </span>
            </div>
            <p className="text-sm text-green-700">
              From upcoming confirmed bookings
            </p>
          </Link>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/host/spaces/new"
          className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
        >
          <Building2 className="w-6 h-6 mx-auto text-gray-600 mb-2" />
          <span className="font-medium text-gray-900">Add New Space</span>
        </Link>

        <Link
          href="/host/bookings"
          className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
        >
          <CalendarDays className="w-6 h-6 mx-auto text-gray-600 mb-2" />
          <span className="font-medium text-gray-900">View All Bookings</span>
        </Link>

        <Link
          href="/host/spaces"
          className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
        >
          <Check className="w-6 h-6 mx-auto text-gray-600 mb-2" />
          <span className="font-medium text-gray-900">Manage Spaces</span>
        </Link>
      </div>
    </div>
  );
};

export default HostDashboardPage;
