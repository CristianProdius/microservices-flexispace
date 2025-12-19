"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import useBookingStore from "@/stores/bookingStore";
import useAuthStore from "@/stores/authStore";
import { Calendar, Clock, Users, MapPin, AlertCircle, Check } from "lucide-react";
import StripePaymentForm from "@/components/StripePaymentForm";

const CheckoutPage = () => {
  const router = useRouter();
  const { draft, hasHydrated, clearDraft } = useBookingStore();
  const { user, isAuthenticated, token } = useAuthStore();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"review" | "payment" | "success">("review");
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (hasHydrated && !draft) {
      router.push("/spaces");
    }
  }, [hasHydrated, draft, router]);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push("/login?redirect=/bookings/checkout");
    }
  }, [hasHydrated, isAuthenticated, router]);

  const createBooking = async () => {
    if (!draft || !token) return;

    setLoading(true);
    setError(null);

    try {
      // Create booking
      const bookingRes = await fetch(
        `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            spaceId: draft.spaceId,
            startDate: draft.startDate,
            endDate: draft.endDate,
            startTime: draft.startTime,
            endTime: draft.endTime,
            guests: draft.guests,
            isHourly: draft.isHourly,
            subtotal: draft.subtotal,
            cleaningFee: draft.cleaningFee,
            serviceFee: draft.serviceFee,
            totalAmount: draft.totalAmount,
            depositAmount: draft.depositAmount,
            remainingAmount: draft.remainingAmount,
          }),
        }
      );

      if (!bookingRes.ok) {
        const data = await bookingRes.json();
        throw new Error(data.message || "Failed to create booking");
      }

      const booking = await bookingRes.json();
      setBookingId(booking.id);

      // Create payment session for deposit
      const paymentRes = await fetch(
        `${process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL}/sessions/deposit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookingId: booking.id,
            amount: draft.depositAmount,
            spaceName: draft.spaceName,
          }),
        }
      );

      if (!paymentRes.ok) {
        throw new Error("Failed to create payment session");
      }

      const { clientSecret: secret } = await paymentRes.json();
      setClientSecret(secret);
      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearDraft();
    setStep("success");
  };

  if (!hasHydrated || !draft) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Booking Request Sent!
        </h1>
        <p className="text-gray-600 mb-8">
          Your deposit has been processed. The host will review your booking
          request and respond within 24 hours.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => router.push("/bookings")}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            View My Bookings
          </button>
          <button
            onClick={() => router.push("/spaces")}
            className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Browse More Spaces
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {step === "review" ? "Review Your Booking" : "Complete Payment"}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex gap-4 mb-6">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
              <Image
                src={draft.spaceImage || "/placeholder-space.jpg"}
                alt={draft.spaceName}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{draft.spaceName}</h3>
              <p className="text-sm text-gray-500">Hosted by {draft.hostName}</p>
            </div>
          </div>

          <div className="space-y-3 border-t border-gray-200 pt-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>
                {new Date(draft.startDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
                {draft.endDate !== draft.startDate && (
                  <>
                    {" - "}
                    {new Date(draft.endDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </>
                )}
              </span>
            </div>

            {draft.isHourly && draft.startTime && draft.endTime && (
              <div className="flex items-center gap-3 text-gray-600">
                <Clock className="w-5 h-5" />
                <span>
                  {draft.startTime} - {draft.endTime}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 text-gray-600">
              <Users className="w-5 h-5" />
              <span>{draft.guests} {draft.guests === 1 ? "guest" : "guests"}</span>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${draft.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Cleaning fee</span>
              <span>${draft.cleaningFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Service fee</span>
              <span>${draft.serviceFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
              <span>Total</span>
              <span>${draft.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Schedule */}
          <div className="bg-blue-50 rounded-lg p-4 mt-4">
            <h4 className="font-medium text-blue-900 mb-2">Payment Schedule</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-blue-800">
                <span>Deposit (due now)</span>
                <span className="font-semibold">${draft.depositAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>Remaining (due at check-in)</span>
                <span>${draft.remainingAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div>
          {step === "review" ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Confirm and Pay Deposit
              </h3>

              {error && (
                <div className="flex items-start gap-2 p-4 bg-red-50 text-red-700 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-4 text-sm text-gray-600 mb-6">
                <p>
                  By clicking &quot;Confirm Booking&quot;, you agree to the host&apos;s house
                  rules and cancellation policy.
                </p>
                <p>
                  Your deposit of <strong>${draft.depositAmount.toFixed(2)}</strong> will
                  be charged immediately. The remaining balance will be due at
                  check-in.
                </p>
              </div>

              <button
                onClick={createBooking}
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Confirm Booking"}
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Pay Deposit
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Amount: <strong>${draft.depositAmount.toFixed(2)}</strong>
              </p>

              {clientSecret && (
                <StripePaymentForm
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
