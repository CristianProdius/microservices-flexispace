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
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
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
