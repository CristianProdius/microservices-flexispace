import z from "zod";
import type { User } from "./auth";

export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Payout {
  id: string;
  hostId: string;
  // All amounts are in dollars (Float in Prisma), matching Booking pricing.
  // Do not truncate to Int — booking totals may have cents.
  // Long-term target: Decimal(12, 2).
  amount: number;
  platformFee: number;
  netAmount: number;
  status: PayoutStatus;
  bookingIds: string[];
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutWithHost extends Payout {
  host: Pick<User, "id" | "name" | "email" | "image">;
}

// A single-currency money bucket. Earnings/payouts are reported PER CURRENCY
// (the platform books in USD/RON/MDL) — never summed into one scalar, which
// would silently add e.g. MDL + USD (M10).
export interface CurrencyAmount {
  currency: string;
  amount: number;
}

export interface HostEarningsByCurrency {
  currency: string;
  totalEarnings: number;
  platformFees: number;
  grossRevenue: number;
}

// Response shape of GET /bookings/host/earnings.
export interface HostEarnings {
  earningsByCurrency: HostEarningsByCurrency[];
  pendingPayout: CurrencyAmount[];
  completedPayouts: CurrencyAmount[];
}

// Zod Schemas
export const CreatePayoutSchema = z.object({
  hostId: z.string(),
  bookingIds: z.array(z.string()).min(1, "At least one booking is required"),
});

export const ProcessPayoutSchema = z.object({});

export type CreatePayoutInput = z.infer<typeof CreatePayoutSchema>;
export type ProcessPayoutInput = z.infer<typeof ProcessPayoutSchema>;
