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
import {
  resolveMonthlyRate,
  calculateMonthlyEstimate,
} from "@/lib/monthly-estimate";

interface BookingFormProps {
  space: SpaceWithHost;
}

const BookingForm = ({ space }: BookingFormProps) => {
  const router = useRouter();
  const { setDraft } = useBookingStore();
  const { user, isAuthenticated } = useAuthStore();
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");

  const canBookHourly = space.pricingType === "HOURLY" || space.pricingType === "BOTH";
  const canBookDaily = space.pricingType === "DAILY" || space.pricingType === "BOTH";
  const canBookShortTerm = canBookHourly || canBookDaily;
  // Monthly plans can be offered on ANY space type. A space is bookable monthly
  // when it is MONTHLY-typed OR it carries at least one named plan (e.g. a
  // coworking space bookable by the hour that also sells monthly memberships).
  const hasMonthlyPlans = (space.monthlyPlans?.length ?? 0) > 0;
  const monthlyAvailable = space.pricingType === "MONTHLY" || hasMonthlyPlans;
  // Show the "Per hour/day" vs "Monthly" tabs only when BOTH a short-term and a
  // monthly path exist; otherwise the single available mode renders untabbed.
  const showModeTabs = canBookShortTerm && monthlyAvailable;

  // The active booking mode. A monthly booking reuses the daily date-range UI
  // (no time window) and shows the per-month rate. Default to short-term when a
  // short-term path exists and the space isn't monthly-typed; otherwise monthly.
  const [mode, setMode] = useState<"shortTerm" | "monthly">(
    !canBookShortTerm || space.pricingType === "MONTHLY" ? "monthly" : "shortTerm"
  );
  const isMonthly = mode === "monthly";
  const [bookingType, setBookingType] = useState<"hourly" | "daily">(
    space.pricingType === "DAILY" ? "daily" : "hourly"
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [guests, setGuests] = useState(1);
  const [selectedMonthlyPlanId, setSelectedMonthlyPlanId] = useState<number | null>(null);

  // In monthly mode the date UI is a full-day range (check-in/out) and never
  // hourly, regardless of the short-term hourly/daily toggle.
  const isDateRange = isMonthly || bookingType === "daily";
  const isHourlyUI = !isMonthly && bookingType === "hourly";

  // A plans-only listing is allowed to have a null base pricePerMonth, so the
  // headline falls back to the cheapest plan ("from {min}/mo") instead of
  // rendering an empty/NaN base rate.
  const lowestMonthlyPlanPrice = hasMonthlyPlans
    ? Math.min(...space.monthlyPlans!.map((p) => p.pricePerMonth))
    : null;

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

  // The effective monthly rate: the selected plan's price when the space offers
  // plans, otherwise the base pricePerMonth. Drives the client-side estimate.
  const effectiveMonthlyRate = useMemo(
    () =>
      resolveMonthlyRate(
        space.pricePerMonth,
        space.monthlyPlans,
        selectedMonthlyPlanId
      ),
    [space.pricePerMonth, space.monthlyPlans, selectedMonthlyPlanId]
  );

  // MONTHLY spaces are priced per calendar month, pro-rated for remainder days.
  // That pro-ration is done server-side and is authoritative; this is a rough
  // client-side preview so the sidebar can show an approximate subtotal/total.
  const monthlyEstimate = useMemo(() => {
    if (!isMonthly) return null;
    return calculateMonthlyEstimate({
      pricePerMonth: effectiveMonthlyRate,
      cleaningFee: space.cleaningFee,
      startDate,
      endDate,
    });
  }, [isMonthly, effectiveMonthlyRate, space.cleaningFee, startDate, endDate]);

  // The breakdown/checkout draft use the monthly estimate for MONTHLY spaces and
  // the standard hourly/daily pricing otherwise.
  const activePricing = isMonthly ? monthlyEstimate : pricing;

  const subtotalLabel = isMonthly
    ? `${formatPrice(effectiveMonthlyRate ?? space.pricePerMonth ?? 0, (space as any).currency)}/mo`
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
    // A monthly booking with plans requires a plan selection before proceeding.
    if (isMonthly && hasMonthlyPlans && !selectedMonthlyPlanId) return;

    setDraft({
      spaceId: space.id,
      spaceName: space.name,
      spaceImage: space.images?.[0] || "",
      hostId: space.hostId,
      hostName: space.host?.name || tCommon("unknown"),
      startDate,
      // A monthly booking reuses the "daily" date-range path, so a full date
      // range is sent with no time window and isHourly=false.
      endDate: isDateRange ? endDate : startDate,
      startTime: isHourlyUI ? startTime : undefined,
      endTime: isHourlyUI ? endTime : undefined,
      guests,
      pricePerHour: space.pricePerHour || undefined,
      pricePerDay: space.pricePerDay || undefined,
      isHourly: isHourlyUI,
      subtotal: activePricing.subtotal,
      cleaningFee: activePricing.cleaningFee,
      serviceFee: activePricing.serviceFee,
      totalAmount: activePricing.totalAmount,
      currency: (space as any).currency || "USD",
      monthlyPlanId:
        isMonthly && hasMonthlyPlans ? selectedMonthlyPlanId ?? undefined : undefined,
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
      {/* Booking Mode Tabs — only for a mixed space that supports BOTH a
          short-term (hourly/daily) path AND a monthly path (subscription or
          plans). Switching the mode reshapes the box below. */}
      {showModeTabs && (
        <div className="flex gap-2 mb-6" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!isMonthly}
            onClick={() => setMode("shortTerm")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              !isMonthly
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-subtle text-muted hover:bg-border"
            }`}
          >
            {tCommon("perHourDay")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isMonthly}
            onClick={() => setMode("monthly")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              isMonthly
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-subtle text-muted hover:bg-border"
            }`}
          >
            {tCommon("monthly")}
          </button>
        </div>
      )}

      {/* Price Display */}
      <div className="flex items-baseline gap-1 mb-6">
        {isMonthly ? (
          hasMonthlyPlans ? (
            <span className="text-2xl font-bold text-foreground">
              {t("fromPerMonth", {
                price:
                  formatPrice(
                    lowestMonthlyPlanPrice,
                    (space as any).currency
                  ) ?? "",
              })}
            </span>
          ) : (
            <>
              <span className="text-2xl font-bold text-foreground">
                {formatPrice(space.pricePerMonth, (space as any).currency)}
              </span>
              <span className="text-muted">/mo</span>
            </>
          )
        ) : isHourlyUI && space.pricePerHour ? (
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

      {/* Monthly Plan Selector — in monthly mode when the space offers plans. */}
      {isMonthly && hasMonthlyPlans && (
        <div className="mb-6">
          <p className="block text-sm font-medium text-muted mb-2">
            {t("choosePlan")}
          </p>
          <div className="space-y-2" role="radiogroup" aria-label={t("choosePlan")}>
            {space.monthlyPlans!.map((plan) => {
              const selected = selectedMonthlyPlanId === plan.id;
              return (
                <label
                  key={plan.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selected
                      ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="monthly-plan"
                    value={plan.id}
                    checked={selected}
                    onChange={() => setSelectedMonthlyPlanId(plan.id)}
                    className="mt-1 accent-primary"
                  />
                  <span className="flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-foreground">{plan.name}</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatPrice(plan.pricePerMonth, (space as any).currency)}/mo
                      </span>
                    </span>
                    {plan.description && (
                      <span className="block text-xs text-muted mt-0.5">
                        {plan.description}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Type Toggle — short-term only (hidden in monthly mode) */}
      {!isMonthly && canBookHourly && canBookDaily && (
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
            {isHourlyUI ? t("date") : t("checkIn")}
          </label>
          <div className="relative">
            <DatePicker
              id="booking-start-date"
              value={startDate}
              minDate={minDate}
              placeholder={isHourlyUI ? t("date") : t("checkIn")}
              onChange={(date) => {
                setStartDate(date);
                if (!endDate || date > endDate) setEndDate(date);
              }}
            />
          </div>
        </div>

        {isDateRange && (
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

        {isHourlyUI && (
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
          {isMonthly && (
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
        disabled={
          !startDate ||
          (isDateRange && !endDate) ||
          (isMonthly && hasMonthlyPlans && !selectedMonthlyPlanId)
        }
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
