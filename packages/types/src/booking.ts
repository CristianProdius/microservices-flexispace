import z from "zod";
import type { Space } from "./space";
import type { User } from "./auth";

export type BookingStatus =
  | "PENDING"
  | "APPROVED"
  | "DEPOSIT_PAID"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "EXPIRED";

export interface Booking {
  id: string;

  // Guest info
  userId: string;
  guestEmail: string;
  guestName: string;
  guestPhone: string | null;
  numberOfGuests: number;

  // Space reference
  spaceId: number;

  // Booking details
  startDateTime: string;
  endDateTime: string;
  isHourly: boolean;

  // Pricing (all in cents)
  subtotal: number;
  serviceFee: number;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;

  // Payment tracking
  depositPaid: boolean;
  depositPaidAt: string | null;
  remainingPaid: boolean;
  remainingPaidAt: string | null;
  depositSessionId: string | null;
  remainingSessionId: string | null;

  // Status
  status: BookingStatus;
  hostNote: string | null;
  guestNote: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
}

export interface BookingWithDetails extends Booking {
  space: Space;
  user: Pick<User, "id" | "name" | "email" | "image">;
}

export interface BookingChartType {
  month: string;
  total: number;
  confirmed: number;
  revenue: number;
}

// Zod Schemas
export const CreateBookingSchema = z.object({
  spaceId: z.number(),
  startDateTime: z.string(),
  endDateTime: z.string(),
  isHourly: z.boolean(),
  numberOfGuests: z.number().min(1).default(1),
  guestName: z.string().min(1, "Name is required"),
  guestEmail: z.string().email("Invalid email"),
  guestPhone: z.string().optional(),
  guestNote: z.string().optional(),
});

export const ApproveBookingSchema = z.object({
  hostNote: z.string().optional(),
});

export const RejectBookingSchema = z.object({
  hostNote: z.string().min(1, "Please provide a reason for rejection"),
});

export const CancelBookingSchema = z.object({
  reason: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type ApproveBookingInput = z.infer<typeof ApproveBookingSchema>;
export type RejectBookingInput = z.infer<typeof RejectBookingSchema>;
export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;
