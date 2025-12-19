"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import useAuthStore from "@/stores/authStore";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
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
  remainingAmount: number;
  depositPaid: boolean;
  remainingPaid: boolean;
  createdAt: string;
  space: {
    id: number;
    name: string;
    images: string[];
    address: string;
    city: string;
    country: string;
  };
  host: {
    id: string;
    name: string;
    image: string | null;
  };
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  PENDING: {
    label: "Pending Approval",
    color: "bg-yellow-100 text-yellow-700",
    icon: Loader2,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-blue-100 text-blue-700",
    icon: CheckCircle,
  },
  DEPOSIT_PAID: {
    label: "Deposit Paid",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-gray-100 text-gray-700",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  EXPIRED: {
    label: "Expired",
    color: "bg-gray-100 text-gray-500",
    icon: AlertCircle,
  },
};

const BookingsPage = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, token } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/bookings");
      return;
    }

    if (!authLoading && isAuthenticated && token) {
      fetchBookings();
    }
  }, [authLoading, isAuthenticated, token, router]);

  const fetchBookings = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data = await res.json();
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === "upcoming") {
      return (
        bookingDate >= today &&
        !["CANCELLED", "REJECTED", "EXPIRED", "COMPLETED"].includes(
          booking.status
        )
      );
    }
    if (filter === "past") {
      return (
        bookingDate < today ||
        ["CANCELLED", "REJECTED", "EXPIRED", "COMPLETED"].includes(
          booking.status
        )
      );
    }
    return true;
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(["upcoming", "past", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500 text-lg">No bookings found</p>
          <p className="text-gray-400 mt-2">
            {filter === "upcoming"
              ? "You don't have any upcoming bookings"
              : "Start exploring spaces to make your first booking!"}
          </p>
          <Link
            href="/spaces"
            className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Spaces
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const status = statusConfig[booking.status] || statusConfig.PENDING;
            const StatusIcon = status.icon;

            return (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Space Image */}
                  <div className="relative w-32 h-24 rounded-lg overflow-hidden shrink-0">
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
                      <h3 className="font-semibold text-gray-900 truncate">
                        {booking.space.name}
                      </h3>
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 ${status.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">
                        {booking.space.city}, {booking.space.country}
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
                    </div>
                  </div>

                  {/* Price and Arrow */}
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${booking.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
