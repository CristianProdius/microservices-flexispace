import z from "zod";
import type { Space } from "./space";
import type { User } from "./auth";
import type { Currency } from "./currency";

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Date must be valid");

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm");

const minutesFromTime = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours! * 60 + minutes!;
};

// NOTE: `APPROVED` was removed (it was a dead enum value — no code path ever set
// it; the approve handler transitions PENDING -> CONFIRMED directly). Keep this
// union in sync with the Prisma `BookingStatus` enum.
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "EXPIRED";

export interface Booking {
  id: string;

  // Guest & Host
  guestId: string;
  hostId: string;
  spaceId: number;

  // Booking details
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  guests: number;
  isHourly: boolean;

  // Pricing (all in dollars)
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  totalAmount: number;
  currency: Currency;
  exchangeRate: number;

  // Status
  status: BookingStatus;
  guestMessage: string | null;
  hostMessage: string | null;

  // Cancellation
  cancelledByRole: "GUEST" | "HOST" | "ADMIN" | null;
  cancellationReason: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
}

export interface BookingWithDetails extends Booking {
  space: Space;
  guest: Pick<User, "id" | "name" | "email" | "image">;
  host: Pick<User, "id" | "name" | "email" | "image">;
}

/**
 * Aggregated booking data for dashboard charts.
 *
 * `revenue` MUST be expressed in a single currency. The server is responsible
 * for normalizing booking totals to USD (multiply each booking's amount by its
 * stored `exchangeRate` before summing) so that multi-currency bookings do not
 * produce nonsense aggregates. The `currency` field records the currency that
 * `revenue` is denominated in (defaults to "USD" for the normalized series).
 */
export interface BookingChartType {
  month: string;
  total: number;
  confirmed: number;
  revenue: number;
  currency: Currency;
}

// Zod Schemas
export const CreateBookingSchema = z.object({
  spaceId: z.number(),
  startDate: dateOnlySchema,
  endDate: dateOnlySchema,
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  guests: z.number().min(1).default(1),
  isHourly: z.boolean(),
  message: z.string().optional(),
}).superRefine((value, ctx) => {
  const startDate = new Date(`${value.startDate}T00:00:00.000Z`);
  const endDate = new Date(`${value.endDate}T00:00:00.000Z`);

  if (endDate < startDate) {
    ctx.addIssue({
      code: "custom",
      message: "endDate must be on or after startDate",
      path: ["endDate"],
    });
  }

  if (value.isHourly && (!value.startTime || !value.endTime)) {
    ctx.addIssue({
      code: "custom",
      message: "startTime and endTime are required for hourly bookings",
      path: ["startTime"],
    });
    return;
  }

  if ((value.startTime && !value.endTime) || (!value.startTime && value.endTime)) {
    ctx.addIssue({
      code: "custom",
      message: "startTime and endTime must be provided together",
      path: ["endTime"],
    });
    return;
  }

  if (value.startTime && value.endTime && minutesFromTime(value.endTime) <= minutesFromTime(value.startTime)) {
    ctx.addIssue({
      code: "custom",
      message: "endTime must be after startTime",
      path: ["endTime"],
    });
  }
});

export const ApproveBookingSchema = z.object({
  hostNote: z.string().optional(),
});

export const RejectBookingSchema = z.object({
  reason: z.string().min(1, "Please provide a reason for rejection"),
});

export const CancelBookingSchema = z.object({
  reason: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type ApproveBookingInput = z.infer<typeof ApproveBookingSchema>;
export type RejectBookingInput = z.infer<typeof RejectBookingSchema>;
export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;
