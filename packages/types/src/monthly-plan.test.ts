import { describe, expect, it } from "vitest";
import {
  monthlyPlanInputSchema,
  monthlyPlansSchema,
  MONTHLY_PLANS_MAX_COUNT,
} from "./monthly-plan.js";

// ---------------------------------------------------------------------------
// monthlyPlanInputSchema
// ---------------------------------------------------------------------------

describe("monthlyPlanInputSchema — valid", () => {
  it("accepts a complete valid plan", () => {
    const result = monthlyPlanInputSchema.safeParse({
      name: "Hot Desk",
      pricePerMonth: 150,
      description: "A comfortable hot desk in the open area.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a plan without description", () => {
    const result = monthlyPlanInputSchema.safeParse({
      name: "Dedicated Desk",
      pricePerMonth: 250,
    });
    expect(result.success).toBe(true);
  });

  it("accepts the minimum allowed price (0.01)", () => {
    const result = monthlyPlanInputSchema.safeParse({
      name: "Trial Plan",
      pricePerMonth: 0.01,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a name exactly 60 chars long", () => {
    const result = monthlyPlanInputSchema.safeParse({
      name: "A".repeat(60),
      pricePerMonth: 100,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a description exactly 300 chars long", () => {
    const result = monthlyPlanInputSchema.safeParse({
      name: "Plan",
      pricePerMonth: 100,
      description: "A".repeat(300),
    });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from name", () => {
    const result = monthlyPlanInputSchema.safeParse({
      name: "  Hot Desk  ",
      pricePerMonth: 100,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Hot Desk");
    }
  });

  it("normalizes whitespace-only description to undefined", () => {
    const result = monthlyPlanInputSchema.safeParse({
      name: "Plan",
      pricePerMonth: 100,
      description: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });

  it("normalizes empty-string description to undefined", () => {
    const result = monthlyPlanInputSchema.safeParse({
      name: "Plan",
      pricePerMonth: 100,
      description: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });
});

describe("monthlyPlanInputSchema — rejected", () => {
  it("rejects an empty name", () => {
    const result = monthlyPlanInputSchema.safeParse({
      name: "",
      pricePerMonth: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only name", () => {
    const result = monthlyPlanInputSchema.safeParse({
      name: "   ",
      pricePerMonth: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 60 chars", () => {
    const result = monthlyPlanInputSchema.safeParse({
      name: "A".repeat(61),
      pricePerMonth: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects price 0", () => {
    const result = monthlyPlanInputSchema.safeParse({
      name: "Plan",
      pricePerMonth: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects price below 0.01 (e.g. 0.009)", () => {
    const result = monthlyPlanInputSchema.safeParse({
      name: "Plan",
      pricePerMonth: 0.009,
    });
    expect(result.success).toBe(false);
  });

  it("rejects NaN price", () => {
    const result = monthlyPlanInputSchema.safeParse({
      name: "Plan",
      pricePerMonth: Number.NaN,
    });
    expect(result.success).toBe(false);
  });

  it("rejects Infinity price", () => {
    const result = monthlyPlanInputSchema.safeParse({
      name: "Plan",
      pricePerMonth: Infinity,
    });
    expect(result.success).toBe(false);
  });

  it("rejects description longer than 300 chars", () => {
    const result = monthlyPlanInputSchema.safeParse({
      name: "Plan",
      pricePerMonth: 100,
      description: "A".repeat(301),
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// monthlyPlansSchema (array)
// ---------------------------------------------------------------------------

describe("monthlyPlansSchema — count cap", () => {
  const makePlan = (i: number) => ({
    name: `Plan ${i}`,
    pricePerMonth: 100 + i,
  });

  it(`accepts an array of ${MONTHLY_PLANS_MAX_COUNT} plans`, () => {
    const plans = Array.from({ length: MONTHLY_PLANS_MAX_COUNT }, (_, i) => makePlan(i));
    const result = monthlyPlansSchema.safeParse(plans);
    expect(result.success).toBe(true);
  });

  it(`rejects an array of ${MONTHLY_PLANS_MAX_COUNT + 1} plans`, () => {
    const plans = Array.from({ length: MONTHLY_PLANS_MAX_COUNT + 1 }, (_, i) => makePlan(i));
    const result = monthlyPlansSchema.safeParse(plans);
    expect(result.success).toBe(false);
  });

  it("accepts an empty array", () => {
    const result = monthlyPlansSchema.safeParse([]);
    expect(result.success).toBe(true);
  });
});
