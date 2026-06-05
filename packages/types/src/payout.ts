import z from "zod";
import type { User } from "./auth";

export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Payout {
  id: string;
  hostId: string;
  // All amounts are in dollars (Float in Prisma), matching Booking pricing.
  // Do not truncate to Int — booking totals may have cents.
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

export interface HostEarnings {
  totalEarnings: number;
  pendingPayout: number;
  completedPayouts: number;
  platformFees: number;
}

// Zod Schemas
export const CreatePayoutSchema = z.object({
  hostId: z.string(),
  bookingIds: z.array(z.string()).min(1, "At least one booking is required"),
});

export const ProcessPayoutSchema = z.object({});

export type CreatePayoutInput = z.infer<typeof CreatePayoutSchema>;
export type ProcessPayoutInput = z.infer<typeof ProcessPayoutSchema>;
