"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/stores/authStore";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar,
} from "lucide-react";

interface Booking {
  id: string;
  status: string;
  totalAmount: number;
  serviceFee: number;
  cleaningFee: number;
  startDate: string;
  endDate: string;
  space: {
    name: string;
  };
  guest: {
    name: string;
  };
}

interface EarningsStats {
  totalEarnings: number;
  pendingEarnings: number;
  thisMonth: number;
  completedBookings: number;
}

const HostEarningsPage = () => {
  const { token } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, [token]);

  const fetchEarnings = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/host`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data: Booking[] = await res.json();
        setBookings(data);

        // Calculate stats
        const completedBookings = data.filter(
          (b) => b.status === "COMPLETED"
        );
        const pendingBookings = data.filter((b) =>
          ["DEPOSIT_PAID"].includes(b.status)
        );

        const calculateNetEarnings = (booking: Booking) =>
          booking.totalAmount - booking.serviceFee;

        const totalEarnings = completedBookings.reduce(
          (sum, b) => sum + calculateNetEarnings(b),
          0
        );
        const pendingEarnings = pendingBookings.reduce(
          (sum, b) => sum + calculateNetEarnings(b),
          0
        );

        // This month
        const now = new Date();
        const thisMonthBookings = completedBookings.filter((b) => {
          const endDate = new Date(b.endDate);
          return (
            endDate.getMonth() === now.getMonth() &&
            endDate.getFullYear() === now.getFullYear()
          );
        });
        const thisMonth = thisMonthBookings.reduce(
          (sum, b) => sum + calculateNetEarnings(b),
          0
        );

        setStats({
          totalEarnings,
          pendingEarnings,
          thisMonth,
          completedBookings: completedBookings.length,
        });
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
  const pendingPayoutBookings = bookings.filter((b) =>
    ["DEPOSIT_PAID"].includes(b.status)
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-600 mt-1">Track your hosting income</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-6 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${stats?.totalEarnings?.toFixed(2) || "0.00"}
          </p>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500">Pending</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${stats?.pendingEarnings?.toFixed(2) || "0.00"}
          </p>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500">This Month</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${stats?.thisMonth?.toFixed(2) || "0.00"}
          </p>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.completedBookings || 0}
          </p>
        </div>
      </div>

      {/* Pending Payouts */}
      {pendingPayoutBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Payouts
          </h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-800 mb-4">
              Earnings from confirmed bookings will be paid out after the
              booking is completed.
            </p>
            <div className="space-y-3">
              {pendingPayoutBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {booking.space.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.startDate).toLocaleDateString()} -{" "}
                      {booking.guest.name}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    ${(booking.totalAmount - booking.serviceFee).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Completed Bookings
        </h2>

        {completedBookings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500">No completed bookings yet</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Space
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Guest
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    Fee
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    Net
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {completedBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {booking.space.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {booking.guest.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(booking.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ${booking.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      -${booking.serviceFee.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                      ${(booking.totalAmount - booking.serviceFee).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostEarningsPage;
