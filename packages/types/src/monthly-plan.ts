import z from "zod";

export const MONTHLY_PLANS_MAX_COUNT = 20;

/** Shape returned by the server when reading a space's monthly plans. */
export interface MonthlyPlanItem {
  id: number;
  name: string;
  pricePerMonth: number;
  description: string | null;
  sortOrder: number;
}

export const monthlyPlanInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(60, "Name must be at most 60 characters"),
  pricePerMonth: z
    .number()
    .finite("Price must be a finite number")
    .min(0.01, "Price must be at least 0.01"),
  description: z
    .string()
    .max(300, "Description must be at most 300 characters")
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    }),
});

export type MonthlyPlanInput = z.infer<typeof monthlyPlanInputSchema>;

export const monthlyPlansSchema = z
  .array(monthlyPlanInputSchema)
  .max(MONTHLY_PLANS_MAX_COUNT, `A space may have at most ${MONTHLY_PLANS_MAX_COUNT} monthly plans`);
