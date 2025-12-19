"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import useAuthStore from "@/stores/authStore";
import StripePaymentForm from "@/components/StripePaymentForm";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  MessageSquare,
  Star,
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
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  depositPaid: boolean;
  remainingPaid: boolean;
  createdAt: string;
  approvedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  space: {
    id: number;
    name: string;
    images: string[];
    address: string;
    city: string;
    country: string;
    cancellationPolicy: string;
  };
  host: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  PENDING: {
    label: "Pending Host Approval",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    icon: Loader2,
  },
  APPROVED: {
    label: "Approved - Awaiting Deposit",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    icon: CheckCircle,
  },
  DEPOSIT_PAID: {
    label: "Deposit Paid - Confirmed",
    color: "text-green-700",
    bgColor: "bg-green-50",
    icon: CheckCircle,
  },
  COMPLETED: {
    label: "Completed",
    color: "text-gray-700",
    bgColor: "bg-gray-50",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-700",
    bgColor: "bg-red-50",
    icon: XCircle,
  },
  REJECTED: {
    label: "Rejected by Host",
    color: "text-red-700",
    bgColor: "bg-red-50",
    icon: XCircle,
  },
  EXPIRED: {
    label: "Expired",
    color: "text-gray-500",
    bgColor: "bg-gray-50",
    icon: AlertCircle,
  },
};

const BookingDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading: authLoading, token } = useAuthStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<"deposit" | "remaining">("deposit");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/bookings/" + params.id);
      return;
    }

    if (!authLoading && isAuthenticated && token) {
      fetchBooking();
    }
  }, [authLoading, isAuthenticated, token, params.id, router]);

  const fetchBooking = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch booking");
      }

      const data = await res.json();
      setBooking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch booking");
    } finally {
      setIsLoading(false);
    }
  };

  const initiatePayment = async (type: "deposit" | "remaining") => {
    if (!booking || !token) return;

    try {
      const endpoint =
        type === "deposit"
          ? `${process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL}/sessions/deposit`
          : `${process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL}/sessions/remaining`;

      const amount =
        type === "deposit" ? booking.depositAmount : booking.remainingAmount;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          amount,
          spaceName: booking.space.name,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create payment session");
      }

      const { clientSecret: secret } = await res.json();
      setClientSecret(secret);
      setPaymentType(type);
      setShowPayment(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate payment");
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setClientSecret(null);
    fetchBooking(); // Refresh booking data
  };

  const cancelBooking = async () => {
    if (!booking || !token || cancelling) return;

    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setCancelling(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/${booking.id}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: "Cancelled by guest" }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to cancel booking");
      }

      fetchBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="py-8">
        <Link
          href="/bookings"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Bookings
        </Link>
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <p>{error || "Booking not found"}</p>
        </div>
      </div>
    );
  }

  const status = statusConfig[booking.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;
  const canCancel = ["PENDING", "APPROVED", "DEPOSIT_PAID"].includes(
    booking.status
  );
  const needsDepositPayment =
    booking.status === "APPROVED" && !booking.depositPaid;
  const needsRemainingPayment =
    booking.status === "DEPOSIT_PAID" && !booking.remainingPaid;
  const canReview = booking.status === "COMPLETED";

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/bookings"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Bookings
      </Link>

      {/* Status Banner */}
      <div className={`rounded-lg p-4 mb-6 ${status.bgColor}`}>
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${status.color}`} />
          <span className={`font-medium ${status.color}`}>{status.label}</span>
        </div>
        {booking.cancellationReason && (
          <p className="text-sm text-gray-600 mt-2">
            Reason: {booking.cancellationReason}
          </p>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && clientSecret && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Pay {paymentType === "deposit" ? "Deposit" : "Remaining Balance"}
            </h3>
            <p className="text-gray-600 mb-4">
              Amount: $
              {paymentType === "deposit"
                ? booking.depositAmount.toFixed(2)
                : booking.remainingAmount.toFixed(2)}
            </p>
            <StripePaymentForm
              clientSecret={clientSecret}
              onSuccess={handlePaymentSuccess}
            />
            <button
              onClick={() => {
                setShowPayment(false);
                setClientSecret(null);
              }}
              className="w-full mt-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Space Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex gap-4 mb-4">
              <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
                <Image
                  src={booking.space.images?.[0] || "/placeholder-space.jpg"}
                  alt={booking.space.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <Link
                  href={`/spaces/${booking.space.id}`}
                  className="font-semibold text-gray-900 hover:text-blue-600"
                >
                  {booking.space.name}
                </Link>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {booking.space.address}, {booking.space.city},{" "}
                    {booking.space.country}
                  </span>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">Check-in</p>
                <p className="font-medium">
                  {new Date(booking.startDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {booking.isHourly && booking.startTime && (
                    <span className="text-gray-500"> at {booking.startTime}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Check-out</p>
                <p className="font-medium">
                  {new Date(booking.endDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {booking.isHourly && booking.endTime && (
                    <span className="text-gray-500"> at {booking.endTime}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Guests</p>
                <p className="font-medium">{booking.guests}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Booking ID</p>
                <p className="font-medium text-sm">{booking.id}</p>
              </div>
            </div>
          </div>

          {/* Host Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Your Host</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden">
                <Image
                  src={booking.host.image || "/default-avatar.png"}
                  alt={booking.host.name || "Host"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {booking.host.name || "Host"}
                </p>
                <p className="text-sm text-gray-500">{booking.host.email}</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                <MessageSquare className="w-4 h-4" />
                Contact
              </button>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              Cancellation Policy
            </h3>
            <p className="text-gray-600 capitalize">
              {booking.space.cancellationPolicy.toLowerCase().replace("_", " ")}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${booking.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Cleaning fee</span>
                <span>${booking.cleaningFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Service fee</span>
                <span>${booking.serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span>${booking.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Deposit</span>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      booking.depositPaid ? "text-green-600" : "text-gray-900"
                    }
                  >
                    ${booking.depositAmount.toFixed(2)}
                  </span>
                  {booking.depositPaid && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Remaining</span>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      booking.remainingPaid ? "text-green-600" : "text-gray-900"
                    }
                  >
                    ${booking.remainingAmount.toFixed(2)}
                  </span>
                  {booking.remainingPaid && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {needsDepositPayment && (
              <button
                onClick={() => initiatePayment("deposit")}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Pay Deposit (${booking.depositAmount.toFixed(2)})
              </button>
            )}

            {needsRemainingPayment && (
              <button
                onClick={() => initiatePayment("remaining")}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Pay Remaining (${booking.remainingAmount.toFixed(2)})
              </button>
            )}

            {canReview && (
              <Link
                href={`/bookings/${booking.id}/review`}
                className="block w-full py-3 text-center border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center justify-center gap-2">
                  <Star className="w-4 h-4" />
                  Write a Review
                </span>
              </Link>
            )}

            {canCancel && (
              <button
                onClick={cancelBooking}
                disabled={cancelling}
                className="w-full py-3 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel Booking"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailPage;
