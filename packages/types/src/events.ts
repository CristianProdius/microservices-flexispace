import z from "zod";

// Shared Kafka event envelope used across services. Producers wrap the
// payload in `{ value: ... }`; the email-service consumer asserts on
// `value.<field>`. We keep `.passthrough()` semantics by allowing unknown
// keys so additive producer changes do not break consumers, but we
// require the fields each handler actually depends on.

const emailString = z.string().email("Invalid email address");

const eventEnvelope = <T extends z.ZodTypeAny>(value: T) =>
  z.object({ value });

export const UserCreatedEventSchema = eventEnvelope(
  z.object({
    email: emailString,
    username: z.string().min(1),
  })
);
export type UserCreatedEvent = z.infer<typeof UserCreatedEventSchema>;

export const UserBecameHostEventSchema = eventEnvelope(
  z.object({
    userId: z.string().min(1),
    email: emailString,
    name: z.string().nullable().optional(),
  })
);
export type UserBecameHostEvent = z.infer<typeof UserBecameHostEventSchema>;

export const BookingCreatedEventSchema = eventEnvelope(
  z.object({
    bookingId: z.string().min(1),
    guestEmail: emailString.optional(),
    hostEmail: emailString.optional(),
    spaceName: z.string().optional(),
    status: z.string().optional(),
  })
);
export type BookingCreatedEvent = z.infer<typeof BookingCreatedEventSchema>;

export const BookingApprovedEventSchema = eventEnvelope(
  z.object({
    bookingId: z.string().min(1),
    guestEmail: emailString,
    guestName: z.string().nullable().optional(),
    spaceName: z.string().optional(),
  })
);
export type BookingApprovedEvent = z.infer<typeof BookingApprovedEventSchema>;

export const BookingRejectedEventSchema = eventEnvelope(
  z.object({
    bookingId: z.string().min(1),
    guestEmail: emailString,
    spaceName: z.string().optional(),
    reason: z.string().optional(),
  })
);
export type BookingRejectedEvent = z.infer<typeof BookingRejectedEventSchema>;

export const BookingCancelledEventSchema = eventEnvelope(
  z.object({
    bookingId: z.string().min(1),
    cancelledBy: z.string().optional(),
    guestEmail: emailString.optional(),
    hostEmail: emailString.optional(),
    spaceName: z.string().optional(),
    reason: z.string().optional(),
  })
);
export type BookingCancelledEvent = z.infer<typeof BookingCancelledEventSchema>;

export const BookingCompletedEventSchema = eventEnvelope(
  z.object({
    bookingId: z.string().min(1),
    guestEmail: emailString,
    spaceName: z.string().optional(),
    totalAmount: z.number().optional(),
  })
);
export type BookingCompletedEvent = z.infer<typeof BookingCompletedEventSchema>;
