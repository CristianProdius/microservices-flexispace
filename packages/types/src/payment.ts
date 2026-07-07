import z from "zod";

export const PaymentStatusSchema = z.enum([
  "REQUIRES_PAYMENT",
  "AUTHORIZED",
  "PAID",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
  "CANCELED",
  "FAILED",
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const ConnectAccountStatusSchema = z.enum([
  "ONBOARDING",
  "PENDING_VERIFICATION",
  "ACTIVE",
  "DISABLED",
]);
export type ConnectAccountStatus = z.infer<typeof ConnectAccountStatusSchema>;

// Response of POST /bookings (payment part) and POST /bookings/:id/payment-intent
export const PaymentIntentResponseSchema = z.object({
  paymentId: z.string(),
  clientSecret: z.string(),
  amountMinor: z.number().int().positive(),
  currency: z.enum(["USD", "EUR", "MDL"]),
  status: PaymentStatusSchema,
});
export type PaymentIntentResponse = z.infer<typeof PaymentIntentResponseSchema>;

export const CreateConnectAccountSchema = z.object({
  country: z
    .string()
    .length(2)
    .transform((v) => v.toUpperCase())
    .default("RO"),
});
export type CreateConnectAccountInput = z.infer<typeof CreateConnectAccountSchema>;

export const ConnectStatusResponseSchema = z.object({
  exists: z.boolean(),
  status: ConnectAccountStatusSchema.nullable(),
  payoutsEnabled: z.boolean(),
  detailsSubmitted: z.boolean(),
  requirementsDue: z.array(z.string()),
});
export type ConnectStatusResponse = z.infer<typeof ConnectStatusResponseSchema>;

export const ListPayoutsQuerySchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
  hostId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type ListPayoutsQuery = z.infer<typeof ListPayoutsQuerySchema>;

export const ListPaymentsQuerySchema = z.object({
  status: PaymentStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type ListPaymentsQuery = z.infer<typeof ListPaymentsQuerySchema>;
