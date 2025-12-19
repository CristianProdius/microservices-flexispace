"use client";

import { SpaceWithHost } from "@repo/types";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Users, ChevronDown } from "lucide-react";
import useBookingStore from "@/stores/bookingStore";
import useAuthStore from "@/stores/authStore";

interface BookingFormProps {
  space: SpaceWithHost;
}

const BookingForm = ({ space }: BookingFormProps) => {
  const router = useRouter();
  const { setDraft } = useBookingStore();
  const { user, isAuthenticated } = useAuthStore();

  const [bookingType, setBookingType] = useState<"hourly" | "daily">(
    space.pricingType === "DAILY" ? "daily" : "hourly"
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [guests, setGuests] = useState(1);

  const canBookHourly = space.pricingType === "HOURLY" || space.pricingType === "BOTH";
  const canBookDaily = space.pricingType === "DAILY" || space.pricingType === "BOTH";

  const pricing = useMemo(() => {
    if (!startDate) return null;

    let subtotal = 0;
    let hours = 0;
    let days = 0;

    if (bookingType === "hourly" && space.pricePerHour) {
      const start = parseInt(startTime.split(":")[0]!);
      const end = parseInt(endTime.split(":")[0]!);
      hours = end - start;
      if (hours <= 0) hours = 1;
      subtotal = hours * space.pricePerHour;
    } else if (bookingType === "daily" && space.pricePerDay && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (days <= 0) days = 1;
      subtotal = days * space.pricePerDay;
    }

    const cleaningFee = subtotal * 0.05; // 5% cleaning fee
    const serviceFee = subtotal * 0.1; // 10% service fee
    const totalAmount = subtotal + cleaningFee + serviceFee;
    const depositAmount = totalAmount * (space.depositPercent / 100);
    const remainingAmount = totalAmount - depositAmount;

    return {
      hours,
      days,
      subtotal,
      cleaningFee,
      serviceFee,
      totalAmount,
      depositAmount,
      remainingAmount,
    };
  }, [bookingType, startDate, endDate, startTime, endTime, space]);

  const handleBooking = () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/spaces/" + space.id);
      return;
    }

    if (!pricing || !startDate) return;

    setDraft({
      spaceId: space.id,
      spaceName: space.name,
      spaceImage: space.images?.[0] || "",
      hostId: space.hostId,
      hostName: space.host?.name || "Unknown",
      startDate,
      endDate: bookingType === "daily" ? endDate : startDate,
      startTime: bookingType === "hourly" ? startTime : undefined,
      endTime: bookingType === "hourly" ? endTime : undefined,
      guests,
      pricePerHour: space.pricePerHour || undefined,
      pricePerDay: space.pricePerDay || undefined,
      isHourly: bookingType === "hourly",
      subtotal: pricing.subtotal,
      cleaningFee: pricing.cleaningFee,
      serviceFee: pricing.serviceFee,
      totalAmount: pricing.totalAmount,
      depositAmount: pricing.depositAmount,
      remainingAmount: pricing.remainingAmount,
    });

    router.push("/bookings/checkout");
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
      {/* Price Display */}
      <div className="flex items-baseline gap-1 mb-6">
        {bookingType === "hourly" && space.pricePerHour ? (
          <>
            <span className="text-2xl font-bold text-gray-900">
              ${space.pricePerHour}
            </span>
            <span className="text-gray-500">/hour</span>
          </>
        ) : (
          <>
            <span className="text-2xl font-bold text-gray-900">
              ${space.pricePerDay}
            </span>
            <span className="text-gray-500">/day</span>
          </>
        )}
      </div>

      {/* Booking Type Toggle */}
      {canBookHourly && canBookDaily && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setBookingType("hourly")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              bookingType === "hourly"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Hourly
          </button>
          <button
            onClick={() => setBookingType("daily")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              bookingType === "daily"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Daily
          </button>
        </div>
      )}

      {/* Date Selection */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {bookingType === "hourly" ? "Date" : "Check-in"}
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={startDate}
              min={minDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (!endDate || e.target.value > endDate) {
                  setEndDate(e.target.value);
                }
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {bookingType === "daily" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check-out
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={endDate}
                min={startDate || minDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {bookingType === "hourly" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                      {i.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                      {i.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Guests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Guests
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value))}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              {Array.from({ length: space.capacity }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {i === 0 ? "guest" : "guests"}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Pricing Breakdown */}
      {pricing && startDate && (
        <div className="border-t border-gray-200 pt-4 mb-6 space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>
              {bookingType === "hourly"
                ? `$${space.pricePerHour} x ${pricing.hours} hours`
                : `$${space.pricePerDay} x ${pricing.days} days`}
            </span>
            <span>${pricing.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Cleaning fee</span>
            <span>${pricing.cleaningFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Service fee</span>
            <span>${pricing.serviceFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
            <span>Total</span>
            <span>${pricing.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-blue-600 font-medium">
            <span>Deposit due now ({space.depositPercent}%)</span>
            <span>${pricing.depositAmount.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Book Button */}
      <button
        onClick={handleBooking}
        disabled={!startDate || (bookingType === "daily" && !endDate)}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {space.instantBook ? "Book Now" : "Request to Book"}
      </button>

      {!space.instantBook && (
        <p className="text-center text-sm text-gray-500 mt-2">
          You won&apos;t be charged until the host approves
        </p>
      )}
    </div>
  );
};

export default BookingForm;
