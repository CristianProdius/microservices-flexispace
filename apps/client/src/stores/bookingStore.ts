import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface BookingDraft {
  spaceId: number;
  spaceName: string;
  spaceImage: string;
  hostId: string;
  hostName: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  guests: number;
  pricePerHour?: number;
  pricePerDay?: number;
  isHourly: boolean;
  // The explicit chosen booking mode. Disambiguates daily vs monthly for a space
  // offering both as a full-day date range; the server prices exactly this mode.
  bookingMode?: "hourly" | "daily" | "monthly";
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  totalAmount: number;
  currency: string;
  // Set only for a MONTHLY space that offers named plans; the server requires
  // it in that case and prices from the chosen plan.
  monthlyPlanId?: number;
  // Optional note from the guest (required on contact-for-pricing inquiries).
  // Persisted as Booking.guestMessage on create.
  message?: string;
  // True when the space has no published rates — checkout shows "Contact for
  // pricing" instead of a $0 total, and the request is a quote inquiry.
  contactForPricing?: boolean;
}

interface BookingState {
  draft: BookingDraft | null;
  hasHydrated: boolean;
  setDraft: (draft: BookingDraft) => void;
  clearDraft: () => void;
  updateDraft: (updates: Partial<BookingDraft>) => void;
}

const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      draft: null,
      hasHydrated: false,
      setDraft: (draft) => set({ draft }),
      clearDraft: () => set({ draft: null }),
      updateDraft: (updates) =>
        set((state) => ({
          draft: state.draft ? { ...state.draft, ...updates } : null,
        })),
    }),
    {
      name: "booking-draft",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true;
        }
      },
    }
  )
);

export default useBookingStore;
