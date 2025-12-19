"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import { Building2, Users, CalendarCheck, DollarSign } from "lucide-react";

const Homepage = () => {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  if (authLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">FlexiSpace Admin Dashboard</h1>
        <p className="text-gray-500">Manage spaces, users, and bookings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spaces</p>
              <p className="text-2xl font-bold">--</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold">--</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CalendarCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Bookings</p>
              <p className="text-2xl font-bold">--</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-2xl font-bold">--</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/users")}
            className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-5 h-5 text-gray-600 mb-2" />
            <p className="font-medium">Manage Users</p>
            <p className="text-sm text-gray-500">View and manage platform users</p>
          </button>
          <button
            onClick={() => router.push("/orders")}
            className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CalendarCheck className="w-5 h-5 text-gray-600 mb-2" />
            <p className="font-medium">View Bookings</p>
            <p className="text-sm text-gray-500">Monitor all bookings</p>
          </button>
          <button
            onClick={() => router.push("/products")}
            className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Building2 className="w-5 h-5 text-gray-600 mb-2" />
            <p className="font-medium">View Spaces</p>
            <p className="text-sm text-gray-500">Browse all listed spaces</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
