"use client";

import { SpaceWithHost } from "@repo/types";
import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { Clock, Users, ChevronDown } from "lucide-react";
import DatePicker from "@/components/DatePicker";
import useBookingStore from "@/stores/bookingStore";
import useAuthStore from "@/stores/authStore";
import { useTranslations } from "next-intl";
import { formatPrice, formatPriceFull } from "@/lib/utils";
import { calculateBookingPricing } from "@/lib/booking-pricing";

interface BookingFormProps {
  space: SpaceWithHost;
}

const BookingForm = ({ space }: BookingFormProps) => {
  const router = useRouter();
  const { setDraft } = useBookingStore();
  const { user, isAuthenticated } = useAuthStore();
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");

  // A MONTHLY space books as a full-day date range (like DAILY): no time
  // window, isHourly=false. It just reuses the "daily" UI path here and shows
  // the per-month rate instead of the per-day rate.
  const [bookingType, setBookingType] = useState<"hourly" | "daily">(
    space.pricingType === "DAILY" || space.pricingType === "MONTHLY"
      ? "daily"
      : "hourly"
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [guests, setGuests] = useState(1);

  const canBookHourly = space.pricingType === "HOURLY" || space.pricingType === "BOTH";
  const canBookDaily = space.pricingType === "DAILY" || space.pricingType === "BOTH";
  const canBookMonthly = space.pricingType === "MONTHLY";

  const startHour = parseInt(startTime.split(":")[0]!);

  const pricing = useMemo(() => {
    return calculateBookingPricing({
      bookingType,
      endDate,
      endTime,
      space,
      startDate,
      startTime,
    });
  }, [bookingType, startDate, endDate, startTime, endTime, space]);

  // MONTHLY spaces are priced per calendar month, pro-rated for remainder days.
  // That pro-ration is done server-side and is authoritative; this is a rough
  // client-side preview that spreads the monthly rate evenly across ~30 days so
  // the sidebar can show an approximate subtotal/total before checkout.
  const monthlyEstimate = useMemo(() => {
    if (!canBookMonthly || !startDate || !endDate) return null;
    const pricePerMonth = space.pricePerMonth ?? 0;
    if (!pricePerMonth) return null;
    const parseDay = (v: string) => {
      const [y, m, d] = v.split("-").map(Number);
      return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
    };
    // Inclusive day count, mirroring the daily convention (start..end billed
    // as (end - start) + 1 days).
    const days = Math.max(
      1,
      Math.round((parseDay(endDate) - parseDay(startDate)) / 86400000) + 1
    );
    const round = (n: number) => Math.round(n * 100) / 100;
    const subtotal = round((pricePerMonth * days) / 30);
    const cleaningFee = round(space.cleaningFee ?? 0);
    return {
      days,
      subtotal,
      cleaningFee,
      serviceFee: 0,
      totalAmount: round(subtotal + cleaningFee),
    };
  }, [canBookMonthly, startDate, endDate, space.pricePerMonth, space.cleaningFee]);

  // The breakdown/checkout draft use the monthly estimate for MONTHLY spaces and
  // the standard hourly/daily pricing otherwise.
  const activePricing = canBookMonthly ? monthlyEstimate : pricing;

  const subtotalLabel = canBookMonthly
    ? `${formatPrice(space.pricePerMonth ?? 0, (space as any).currency)}/mo`
    : pricing?.appliedTier
      ? `${pricing.appliedTier.label} x ${pricing.appliedTier.units}`
      : bookingType === "hourly"
        ? t("hoursCalc", {
            price: space.pricePerHour ?? 0,
            count: pricing?.hours ?? 0,
          })
        : t("daysCalc", {
            price: space.pricePerDay ?? 0,
            count: pricing?.days ?? 0,
          });

  const handleBooking = () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/spaces/" + space.id);
      return;
    }

    if (!activePricing || !startDate) return;

    setDraft({
      spaceId: space.id,
      spaceName: space.name,
      spaceImage: space.images?.[0] || "",
      hostId: space.hostId,
      hostName: space.host?.name || tCommon("unknown"),
      startDate,
      // MONTHLY reuses the "daily" date-range path, so a full date range is
      // sent with no time window and isHourly=false for both.
      endDate: bookingType === "daily" ? endDate : startDate,
      startTime: bookingType === "hourly" ? startTime : undefined,
      endTime: bookingType === "hourly" ? endTime : undefined,
      guests,
      pricePerHour: space.pricePerHour || undefined,
      pricePerDay: space.pricePerDay || undefined,
      isHourly: bookingType === "hourly",
      subtotal: activePricing.subtotal,
      cleaningFee: activePricing.cleaningFee,
      serviceFee: activePricing.serviceFee,
      totalAmount: activePricing.totalAmount,
      currency: (space as any).currency || "USD",
    });

    router.push("/bookings/checkout");
  };

  // CLIENT-004: derive today's date from local components so users in any
  // timezone can still book "today". `toISOString()` returns UTC, which can
  // flip the date forward or backward relative to the user's local calendar.
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-[var(--shadow-lg)]">
      {/* Price Display */}
      <div className="flex items-baseline gap-1 mb-6">
        {canBookMonthly ? (
          <>
            <span className="text-2xl font-bold text-foreground">
              {formatPrice(space.pricePerMonth, (space as any).currency)}
            </span>
            <span className="text-muted">/mo</span>
          </>
        ) : bookingType === "hourly" && space.pricePerHour ? (
          <>
            <span className="text-2xl font-bold text-foreground">
              {formatPrice(space.pricePerHour, (space as any).currency)}
            </span>
            <span className="text-muted">{tCommon("perHour")}</span>
          </>
        ) : (
          <>
            <span className="text-2xl font-bold text-foreground">
              {formatPrice(space.pricePerDay, (space as any).currency)}
            </span>
            <span className="text-muted">{tCommon("perDay")}</span>
          </>
        )}
      </div>

      {/* Booking Type Toggle */}
      {canBookHourly && canBookDaily && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setBookingType("hourly")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              bookingType === "hourly"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-subtle text-muted hover:bg-border"
            }`}
          >
            {tCommon("hourly")}
          </button>
          <button
            onClick={() => setBookingType("daily")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              bookingType === "daily"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-subtle text-muted hover:bg-border"
            }`}
          >
            {tCommon("daily")}
          </button>
        </div>
      )}

      {/* Date Selection */}
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="booking-start-date" className="block text-sm font-medium text-muted mb-1">
            {bookingType === "hourly" ? t("date") : t("checkIn")}
          </label>
          <div className="relative">
            <DatePicker
              id="booking-start-date"
              value={startDate}
              minDate={minDate}
              placeholder={bookingType === "hourly" ? t("date") : t("checkIn")}
              onChange={(date) => {
                setStartDate(date);
                if (!endDate || date > endDate) setEndDate(date);
              }}
            />
          </div>
        </div>

        {bookingType === "daily" && (
          <div>
            <label htmlFor="booking-end-date" className="block text-sm font-medium text-muted mb-1">
              {t("checkOut")}
            </label>
            <div className="relative">
              <DatePicker
                id="booking-end-date"
                value={endDate}
                minDate={startDate || minDate}
                placeholder={t("checkOut")}
                onChange={(date) => setEndDate(date)}
              />
            </div>
          </div>
        )}

        {bookingType === "hourly" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="booking-start-time" className="block text-sm font-medium text-muted mb-1">
                {t("startTime")}
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <select
                  id="booking-start-time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    const newStart = parseInt(e.target.value.split(":")[0]!);
                    const currentEnd = parseInt(endTime.split(":")[0]!);
                    if (currentEnd <= newStart) {
                      // CLIENT-014: when starting at 23:00 the only valid end
                      // option is the 23:59 end-of-day sentinel.
                      setEndTime(
                        newStart >= 23
                          ? "23:59"
                          : `${(newStart + 1).toString().padStart(2, "0")}:00`
                      );
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
                >
                  {/* CLIENT-014: start can be up to 23:00 so users can book a
                      late-evening slot that ends at midnight (23:59). */}
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                      {i.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="booking-end-time" className="block text-sm font-medium text-muted mb-1">
                {t("endTime")}
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <select
                  id="booking-end-time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
                >
                  {/* CLIENT-014: include a 23:59 sentinel so a 22:00 or 23:00
                      start can end at midnight without crossing days. */}
                  {Array.from({ length: 23 - startHour }, (_, i) => {
                    const hour = startHour + 1 + i;
                    return (
                      <option key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                        {hour.toString().padStart(2, "0")}:00
                      </option>
                    );
                  })}
                  <option key="end-of-day" value="23:59">
                    23:59
                  </option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Guests */}
        <div>
          <label htmlFor="booking-guests" className="block text-sm font-medium text-muted mb-1">
            {t("numberOfGuests")}
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <select
              id="booking-guests"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value))}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
            >
              {Array.from({ length: space.capacity }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {tCommon("guest", { count: i + 1 })}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Pricing Breakdown */}
      {activePricing && startDate && (
        <div className="border-t border-border pt-4 mb-6 space-y-2">
          <div className="flex justify-between text-muted">
            <span>
              {subtotalLabel}
            </span>
            <span>{formatPriceFull(activePricing.subtotal, (space as any).currency)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>{tCommon("cleaningFee")}</span>
            <span>{formatPriceFull(activePricing.cleaningFee, (space as any).currency)}</span>
          </div>
          <div className="flex justify-between font-semibold text-foreground pt-2 border-t border-border">
            <span>{tCommon("total")}</span>
            <span>{formatPriceFull(activePricing.totalAmount, (space as any).currency)}</span>
          </div>
          {canBookMonthly && (
            // The monthly subtotal here is a rough client estimate (rate spread
            // over ~30 days); the server prices it per calendar month (pro-rated),
            // so make clear the final total is confirmed at booking.
            <p className="text-xs text-muted pt-1">
              Estimated — the final monthly total is calculated at booking.
            </p>
          )}
        </div>
      )}

      {/* Book Button */}
      <button
        onClick={handleBooking}
        disabled={!startDate || (bookingType === "daily" && !endDate)}
        className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
      >
        {space.instantBook ? t("bookNow") : t("requestToBook")}
      </button>

      {!space.instantBook && (
        <p className="text-center text-sm text-muted mt-2">
          {t("depositDisclaimer")}
        </p>
      )}
    </div>
  );
};

export default BookingForm;
