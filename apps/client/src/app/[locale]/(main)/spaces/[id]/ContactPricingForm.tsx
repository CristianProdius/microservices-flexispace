"use client";

import { SpaceWithHost } from "@repo/types";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Clock, Users, ChevronDown } from "lucide-react";
import DatePicker from "@/components/DatePicker";
import useBookingStore from "@/stores/bookingStore";
import useAuthStore from "@/stores/authStore";
import { useTranslations } from "next-intl";

type InquiryMode = "hourly" | "daily";

interface ContactPricingFormProps {
  space: SpaceWithHost;
}

/**
 * Sidebar for spaces with no rates set ("Contact for pricing").
 * Guests pick dates/times, write a message, and send a request-to-book so the
 * host can quote and approve — same PENDING booking path as a 0-rate listing.
 */
const ContactPricingForm = ({ space }: ContactPricingFormProps) => {
  const router = useRouter();
  const { setDraft } = useBookingStore();
  const { isAuthenticated } = useAuthStore();
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const tSpaces = useTranslations("spaces");

  const [mode, setMode] = useState<InquiryMode>("daily");
  const isHourlyUI = mode === "hourly";

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");

  const startHour = parseInt(startTime.split(":")[0]!);
  const messageTrimmed = message.trim();
  const canSubmit =
    Boolean(startDate) &&
    (isHourlyUI || Boolean(endDate)) &&
    messageTrimmed.length >= 10;

  const handleRequest = () => {
    if (!canSubmit) return;

    if (!isAuthenticated) {
      router.push("/login?redirect=/spaces/" + space.id);
      return;
    }

    setDraft({
      spaceId: space.id,
      spaceName: space.name,
      spaceImage: space.images?.[0] || "",
      hostId: space.hostId,
      hostName: space.host?.name || tCommon("unknown"),
      startDate,
      endDate: isHourlyUI ? startDate : endDate,
      startTime: isHourlyUI ? startTime : undefined,
      endTime: isHourlyUI ? endTime : undefined,
      guests,
      isHourly: isHourlyUI,
      bookingMode: mode,
      // Contact-for-pricing inquiries are always $0 until the host quotes.
      subtotal: 0,
      cleaningFee: 0,
      serviceFee: 0,
      totalAmount: 0,
      currency: (space as { currency?: string }).currency || "USD",
      message: messageTrimmed,
      contactForPricing: true,
    });

    router.push("/bookings/checkout");
  };

  // Local calendar "today" so timezone-shifted UTC dates don't block same-day.
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const fieldClass =
    "w-full min-w-0 max-w-full pl-10 pr-9 py-3 border border-border rounded-lg bg-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none";

  return (
    <div className="w-full min-w-0 max-w-full bg-white border border-border rounded-2xl p-4 sm:p-6 shadow-[var(--shadow-lg)]">
      <div className="mb-4 sm:mb-6 text-center">
        <p className="text-base sm:text-lg font-semibold text-foreground mb-1 text-balance">
          {tCommon("contactForPricing")}
        </p>
        <p className="text-sm text-muted text-pretty">
          {t("contactPricingHint")}
        </p>
      </div>

      {/* Hourly / Daily tabs so the guest can describe the window they want */}
      <div
        className="grid grid-cols-2 gap-2 mb-4 sm:mb-6 min-w-0"
        role="tablist"
      >
        {(["daily", "hourly"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`min-w-0 py-2.5 px-2 rounded-lg text-sm font-medium transition-all truncate ${
              mode === m
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-subtle text-muted hover:bg-border"
            }`}
          >
            {tCommon(m)}
          </button>
        ))}
      </div>

      <div className="space-y-4 mb-4 sm:mb-6 min-w-0">
        <div className="min-w-0">
          <label
            htmlFor="inquiry-start-date"
            className="block text-sm font-medium text-muted mb-1"
          >
            {isHourlyUI ? t("date") : t("checkIn")}
          </label>
          <DatePicker
            id="inquiry-start-date"
            value={startDate}
            minDate={minDate}
            placeholder={isHourlyUI ? t("date") : t("checkIn")}
            onChange={(date) => {
              setStartDate(date);
              if (!endDate || date > endDate) setEndDate(date);
            }}
          />
        </div>

        {!isHourlyUI && (
          <div className="min-w-0">
            <label
              htmlFor="inquiry-end-date"
              className="block text-sm font-medium text-muted mb-1"
            >
              {t("checkOut")}
            </label>
            <DatePicker
              id="inquiry-end-date"
              value={endDate}
              minDate={startDate || minDate}
              placeholder={t("checkOut")}
              onChange={(date) => setEndDate(date)}
            />
          </div>
        )}

        {isHourlyUI && (
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3 min-w-0">
            <div className="min-w-0">
              <label
                htmlFor="inquiry-start-time"
                className="block text-sm font-medium text-muted mb-1"
              >
                {t("startTime")}
              </label>
              <div className="relative min-w-0">
                <Clock
                  className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <select
                  id="inquiry-start-time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    const newStart = parseInt(e.target.value.split(":")[0]!);
                    const currentEnd = parseInt(endTime.split(":")[0]!);
                    if (currentEnd <= newStart) {
                      setEndTime(
                        newStart >= 23
                          ? "23:59"
                          : `${(newStart + 1).toString().padStart(2, "0")}:00`
                      );
                    }
                  }}
                  className={fieldClass}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                      {i.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted"
                  aria-hidden
                />
              </div>
            </div>
            <div className="min-w-0">
              <label
                htmlFor="inquiry-end-time"
                className="block text-sm font-medium text-muted mb-1"
              >
                {t("endTime")}
              </label>
              <div className="relative min-w-0">
                <Clock
                  className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <select
                  id="inquiry-end-time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={fieldClass}
                >
                  {Array.from({ length: 23 - startHour }, (_, i) => {
                    const hour = startHour + 1 + i;
                    return (
                      <option
                        key={hour}
                        value={`${hour.toString().padStart(2, "0")}:00`}
                      >
                        {hour.toString().padStart(2, "0")}:00
                      </option>
                    );
                  })}
                  <option key="end-of-day" value="23:59">
                    23:59
                  </option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted"
                  aria-hidden
                />
              </div>
            </div>
          </div>
        )}

        <div className="min-w-0">
          <label
            htmlFor="inquiry-guests"
            className="block text-sm font-medium text-muted mb-1"
          >
            {t("numberOfGuests")}
          </label>
          <div className="relative min-w-0">
            <Users
              className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <select
              id="inquiry-guests"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value))}
              className={fieldClass}
            >
              {Array.from({ length: Math.max(space.capacity, 1) }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {tCommon("guest", { count: i + 1 })}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted"
              aria-hidden
            />
          </div>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="inquiry-message"
            className="block text-sm font-medium text-muted mb-1"
          >
            {t("messageToHost")}
          </label>
          <textarea
            id="inquiry-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={t("messageToHostPlaceholder")}
            className="w-full min-w-0 max-w-full px-3 py-3 border border-border rounded-lg text-base sm:text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y min-h-[100px]"
          />
          <p className="text-xs text-muted mt-1 text-pretty">
            {t("messageToHostHint")}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleRequest}
        disabled={!canSubmit}
        className="w-full min-w-0 py-3.5 px-3 bg-primary text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
      >
        {t("requestToBook")}
      </button>

      <p className="text-center text-sm text-muted mt-2 text-pretty">
        {tSpaces("contactHostForDetails")}
      </p>
    </div>
  );
};

export default ContactPricingForm;
