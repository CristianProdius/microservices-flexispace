"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import useAuthStore from "@/stores/authStore";
import {
  Calendar,
  Clock,
  Users,
  Check,
  X,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface Booking {
  id: string;
  spaceId: number;
  status: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  guests: number;
  isHourly: boolean;
  totalAmount: number;
  depositAmount: number;
  depositPaid: boolean;
  createdAt: string;
  space: {
    id: number;
    name: string;
    images: string[];
  };
  guest: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

const statusFilters = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "DEPOSIT_PAID", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const HostBookingsPage = () => {
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get("status") || "all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const fetchBookings = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/host`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/${bookingId}/approve`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: "APPROVED" } : b
          )
        );
      }
    } catch (error) {
      console.error("Error approving booking:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    const reason = prompt("Please provide a reason for rejection (optional):");

    setActionLoading(bookingId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/${bookingId}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: "REJECTED" } : b
          )
        );
      }
    } catch (error) {
      console.error("Error rejecting booking:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/${bookingId}/complete`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: "COMPLETED" } : b
          )
        );
      }
    } catch (error) {
      console.error("Error completing booking:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBookings = bookings.filter((b) =>
    filter === "all" ? true : b.status === filter
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-600 mt-1">
          Manage booking requests for your spaces
        </p>
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-800">
            You have {pendingCount} pending booking{" "}
            {pendingCount === 1 ? "request" : "requests"} awaiting your response
          </p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
            {f.value === "PENDING" && pendingCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white border border-gray-200 rounded-xl p-4"
            >
              <div className="flex gap-4">
                {/* Space Image */}
                <div className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={booking.space.images?.[0] || "/placeholder-space.jpg"}
                    alt={booking.space.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Booking Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {booking.space.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Booked by {booking.guest.name || booking.guest.email}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : booking.status === "APPROVED"
                            ? "bg-blue-100 text-blue-700"
                            : booking.status === "DEPOSIT_PAID"
                              ? "bg-green-100 text-green-700"
                              : booking.status === "COMPLETED"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-red-100 text-red-700"
                      }`}
                    >
                      {booking.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(booking.startDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}
                        {booking.endDate !== booking.startDate && (
                          <>
                            {" - "}
                            {new Date(booking.endDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </>
                        )}
                      </span>
                    </div>

                    {booking.isHourly &&
                      booking.startTime &&
                      booking.endTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {booking.startTime} - {booking.endTime}
                          </span>
                        </div>
                      )}

                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{booking.guests}</span>
                    </div>

                    <span className="font-medium text-gray-900">
                      ${booking.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {booking.status === "PENDING" && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(booking.id)}
                    disabled={actionLoading === booking.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === booking.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(booking.id)}
                    disabled={actionLoading === booking.id}
                    className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}

              {booking.status === "DEPOSIT_PAID" && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                  <button
                    onClick={() => handleComplete(booking.id)}
                    disabled={actionLoading === booking.id}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === booking.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Mark as Completed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HostBookingsPage;
