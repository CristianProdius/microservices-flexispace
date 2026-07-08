"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import useAuthStore from "@/stores/authStore";
import { fetchWithAuth, SessionExpiredError } from "@/lib/apiClient";
import { ORDER_SERVICE_URL } from "@/lib/config";
import { useTranslations, useLocale } from "next-intl";
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
  CreditCard,
} from "lucide-react";
import { formatBookingDate } from "@/lib/utils";
// AUDIT-B5-FRONTEND (LOW-1): call the currency util directly so we can thread
// the active next-intl locale (useLocale()) into number formatting. utils'
// formatPriceFull does not yet forward a locale, so we localise at this call site.
import { formatCurrencyPriceFull } from "@/lib/currency";
import CheckoutPaymentForm from "@/components/checkout/CheckoutPaymentForm";

interface Booking {
  id: string;
  spaceId: number;
  status: string;
  paymentStatus: string | null;
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
  currency: string;
  createdAt: string;
  approvedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  holdExpiresAt: string | null;
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

interface PaymentDetail {
  paymentId: string;
  status: string;
  amountMinor: number;
  refundedMinor: number;
  currency: string;
  capturedAt: string | null;
  lastErrorMessage: string | null;
  refunds: Array<{
    id: string;
    amountMinor: number;
    status: string;
    createdAt: string;
  }>;
}

interface PaymentIntentResponse {
  paymentId: string;
  clientSecret: string;
  amountMinor: number;
  currency: string;
  status: string;
}

const BookingDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading: authLoading, token } = useAuthStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [paymentDetail, setPaymentDetail] = useState<PaymentDetail | null>(null);
  const [retryPaymentIntent, setRetryPaymentIntent] =
    useState<PaymentIntentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [recreatingPayment, setRecreatingPayment] = useState(false);
  const locale = useLocale(); // AUDIT-B5-FRONTEND (LOW-1): active next-intl locale for number formatting
  const t = useTranslations("bookings");
  const tStatus = useTranslations("status");
  const tCommon = useTranslations("common");
  const tBooking = useTranslations("booking");
  const tSpaces = useTranslations("spaces");

  const statusConfig: Record<
    string,
    { label: string; color: string; bgColor: string; icon: React.ElementType }
  > = {
    PENDING: {
      label: tStatus("PENDING_HOST"),
      color: "text-yellow-700",
      bgColor: "bg-yellow-50",
      icon: Loader2,
    },
    CONFIRMED: {
      label: tStatus("CONFIRMED"),
      color: "text-green-700",
      bgColor: "bg-green-50",
      icon: CheckCircle,
    },
    COMPLETED: {
      label: tStatus("COMPLETED"),
      color: "text-gray-700",
      bgColor: "bg-gray-50",
      icon: CheckCircle,
    },
    CANCELLED: {
      label: tStatus("CANCELLED"),
      color: "text-red-700",
      bgColor: "bg-red-50",
      icon: XCircle,
    },
    REJECTED: {
      label: tStatus("REJECTED_HOST"),
      color: "text-red-700",
      bgColor: "bg-red-50",
      icon: XCircle,
    },
    EXPIRED: {
      label: tStatus("EXPIRED"),
      color: "text-gray-500",
      bgColor: "bg-gray-50",
      icon: AlertCircle,
    },
  };

  const fetchPaymentDetail = useCallback(async (bookingId: string) => {
    try {
      const res = await fetchWithAuth(
        `${ORDER_SERVICE_URL}/bookings/${bookingId}/payment`
      );
      if (res.status === 404) {
        setPaymentDetail(null);
        return;
      }
      if (!res.ok) return;
      setPaymentDetail((await res.json()) as PaymentDetail);
    } catch (err) {
      if (err instanceof SessionExpiredError) return;
    }
  }, []);

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetchWithAuth(
        `${ORDER_SERVICE_URL}/bookings/${params.id}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch booking");
      }

      const data = await res.json();
      setBooking(data);
      await fetchPaymentDetail(data.id);
    } catch (err) {
      // Session expired: the auth store is already navigating to /login.
      if (err instanceof SessionExpiredError) return;
      setError(err instanceof Error ? err.message : "Failed to fetch booking");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, fetchPaymentDetail]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/bookings/" + params.id);
      return;
    }

    if (!authLoading && isAuthenticated && token) {
      fetchBooking();
    }
  }, [authLoading, isAuthenticated, token, params.id, router, fetchBooking]);

  const cancelBooking = async () => {
    if (!booking || !token || cancelling) return;

    if (!confirm(t("cancelConfirm"))) return;

    setCancelling(true);
    try {
      const res = await fetchWithAuth(
        `${ORDER_SERVICE_URL}/bookings/${booking.id}/cancel`,
        {
          method: "POST",
          body: JSON.stringify({ reason: t("cancelledByGuest") }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to cancel booking");
      }

      fetchBooking();
    } catch (err) {
      // Session expired: the auth store is already navigating to /login.
      if (err instanceof SessionExpiredError) return;
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const recreatePaymentIntent = async () => {
    if (!booking || recreatingPayment) return;
    setRecreatingPayment(true);
    setError("");
    try {
      const res = await fetchWithAuth(
        `${ORDER_SERVICE_URL}/bookings/${booking.id}/payment-intent`,
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || tBooking("payment.paymentFailedRetry"));
      }
      setRetryPaymentIntent((await res.json()) as PaymentIntentResponse);
    } catch (err) {
      if (err instanceof SessionExpiredError) return;
      setError(
        err instanceof Error ? err.message : tBooking("payment.paymentFailedRetry")
      );
    } finally {
      setRecreatingPayment(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
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
          {tCommon("backToBookings")}
        </Link>
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <p>{error || t("bookingNotFound")}</p>
        </div>
      </div>
    );
  }

  const status = statusConfig[booking.status] || statusConfig.PENDING!;
  const StatusIcon = status!.icon;
  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status);
  // AUDIT-B5-FRONTEND (LOW-2): the "Write a review" button linked to
  // /bookings/[id]/review, a route that does not exist yet, so every click 404s.
  // Gate it behind a feature flag (off) until the review-submission page ships.
  // TODO(review-feature): flip to `booking.status === "COMPLETED"` once
  // /bookings/[id]/review exists (backlog).
  const REVIEW_FEATURE_ENABLED = false;
  const canReview = REVIEW_FEATURE_ENABLED && booking.status === "COMPLETED";
  const holdIsLive =
    booking.holdExpiresAt != null &&
    new Date(booking.holdExpiresAt).getTime() > Date.now();
  const canCompletePayment =
    paymentDetail != null &&
    ["REQUIRES_PAYMENT", "FAILED"].includes(paymentDetail.status) &&
    booking.status === "PENDING" &&
    holdIsLive;
  const paymentStatusText =
    paymentDetail?.status === "AUTHORIZED"
      ? tBooking("payment.authorizedNotCharged")
      : paymentDetail?.status === "PAID"
        ? tBooking("payment.paidConfirmed")
        : paymentDetail?.status === "FAILED"
          ? tBooking("payment.paymentFailedRetry")
          : paymentDetail?.status?.replaceAll("_", " ").toLowerCase();
  const formatMinor = (amountMinor: number, currency: string) =>
    formatCurrencyPriceFull(amountMinor / 100, currency, locale);
  const handleRetryConfirmed = async () => {
    setRetryPaymentIntent(null);
    await fetchBooking();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/bookings"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        {tCommon("backToBookings")}
      </Link>

      {/* Status Banner */}
      <div className={`rounded-lg p-4 mb-6 ${status.bgColor}`}>
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${status.color}`} />
          <span className={`font-medium ${status.color}`}>{status.label}</span>
        </div>
        {booking.cancellationReason && (
          <p className="text-sm text-gray-600 mt-2">
            {t("reason")}: {booking.cancellationReason}
          </p>
        )}
      </div>

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
                  className="font-semibold text-gray-900 hover:text-indigo-600"
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
                <p className="text-sm text-gray-500">{tBooking("checkIn")}</p>
                <p className="font-medium">
                  {formatBookingDate(booking.startDate, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {booking.isHourly && booking.startTime && (
                    <span className="text-gray-500"> {t("at", { time: booking.startTime })}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{tBooking("checkOut")}</p>
                <p className="font-medium">
                  {formatBookingDate(booking.endDate, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {booking.isHourly && booking.endTime && (
                    <span className="text-gray-500"> {t("at", { time: booking.endTime })}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("guests")}</p>
                <p className="font-medium">{booking.guests}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("bookingId")}</p>
                <p className="font-medium text-sm">{booking.id}</p>
              </div>
            </div>
          </div>

          {/* Host Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t("yourHost")}</h3>
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
                {tCommon("contact")}
              </button>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              {tSpaces("cancellationPolicy")}
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
            <h3 className="font-semibold text-gray-900 mb-4">{t("paymentSummary")}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{tCommon("subtotal")}</span>
                <span>{formatCurrencyPriceFull(booking.subtotal, booking.currency, locale)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{tCommon("cleaningFee")}</span>
                <span>{formatCurrencyPriceFull(booking.cleaningFee, booking.currency, locale)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
                <span>{tCommon("total")}</span>
                <span>{formatCurrencyPriceFull(booking.totalAmount, booking.currency, locale)}</span>
              </div>
            </div>

            {paymentDetail && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {paymentStatusText}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatMinor(paymentDetail.amountMinor, paymentDetail.currency)}
                    </p>
                    {paymentDetail.lastErrorMessage && (
                      <p className="mt-2 text-sm text-red-600">
                        {paymentDetail.lastErrorMessage}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                    {paymentDetail.status.replaceAll("_", " ")}
                  </span>
                </div>

                {paymentDetail.refundedMinor > 0 && (
                  <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    {tBooking("payment.refundIssued")}:{" "}
                    {formatMinor(paymentDetail.refundedMinor, paymentDetail.currency)}
                  </div>
                )}

                {paymentDetail.refunds.length > 0 && (
                  <div className="mt-3 space-y-2 text-xs text-gray-500">
                    {paymentDetail.refunds.map((refund) => (
                      <div key={refund.id} className="flex justify-between gap-3">
                        <span>{refund.status.replaceAll("_", " ")}</span>
                        <span>{formatMinor(refund.amountMinor, paymentDetail.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {canReview && (
              <Link
                href={`/bookings/${booking.id}/review`}
                className="block w-full py-3 text-center border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center justify-center gap-2">
                  <Star className="w-4 h-4" />
                  {t("writeAReview")}
                </span>
              </Link>
            )}

            {canCancel && (
              <button
                onClick={cancelBooking}
                disabled={cancelling}
                className="w-full py-3 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {cancelling ? t("cancelling") : t("cancelBooking")}
              </button>
            )}

            {canCompletePayment && !retryPaymentIntent && (
              <button
                onClick={recreatePaymentIntent}
                disabled={recreatingPayment}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                <CreditCard className="size-4" />
                {recreatingPayment
                  ? tBooking("processing")
                  : tBooking("payment.completePayment")}
              </button>
            )}

            {retryPaymentIntent && (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="mb-3 text-sm text-gray-600">
                  {tBooking("payment.paymentFailedRetry")}
                </p>
                <CheckoutPaymentForm
                  clientSecret={retryPaymentIntent.clientSecret}
                  onConfirmed={handleRetryConfirmed}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailPage;
