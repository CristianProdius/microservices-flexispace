import { describe, expect, it } from "vitest";

import {
  buildSpacePayload,
  createEmptySpaceFormValues,
  defaultPricingTypeForCategory,
  mapSpaceToFormValues,
  pricingTypeOptionsForCategory,
  type SpaceFormValues,
} from "./space-form.shared";

const baseValues = (
  overrides: Partial<SpaceFormValues> = {},
): SpaceFormValues => ({
  ...createEmptySpaceFormValues(),
  categorySlug: "meeting-room",
  capacity: "4",
  ...overrides,
});

describe("buildSpacePayload pricing tier comments", () => {
  it("includes a trimmed comment when present", () => {
    const payload = buildSpacePayload(
      baseValues({
        pricingTiers: [
          { minutes: 60, label: "1 hour", price: "10", comment: "  Members only  " },
        ],
      }),
    );

    expect(payload.pricingTiers).toEqual([
      { minutes: 60, label: "1 hour", price: 10, comment: "Members only" },
    ]);
  });

  it("omits the comment when empty or whitespace only", () => {
    const payload = buildSpacePayload(
      baseValues({
        pricingTiers: [
          { minutes: 60, label: "1 hour", price: "10", comment: "   " },
          { minutes: 120, label: "2 hours", price: "18" },
        ],
      }),
    );

    expect(payload.pricingTiers).toEqual([
      { minutes: 60, label: "1 hour", price: 10 },
      { minutes: 120, label: "2 hours", price: 18 },
    ]);
    expect(payload.pricingTiers[0]).not.toHaveProperty("comment");
  });
});

describe("mapSpaceToFormValues pricing tier comments", () => {
  it("hydrates the comment from a loaded space, defaulting to empty string", () => {
    const values = mapSpaceToFormValues({
      name: "Room",
      shortDescription: "",
      description: "",
      spaceType: "MEETING_ROOM",
      pricingType: "BOTH",
      pricePerHour: 10,
      pricePerDay: 80,
      pricePerMonth: null,
      capacity: 4,
      instantBook: false,
      cancellationPolicy: "MODERATE",
      houseRules: "",
      categorySlug: "meeting-room",
      images: [],
      amenities: [],
      currency: "USD",
      pricingTiers: [
        { id: 1, spaceId: 1, minutes: 60, label: "1 hour", price: 10, comment: "Members only" },
        { id: 2, spaceId: 1, minutes: 120, label: "2 hours", price: 18 },
      ],
      availability: [],
    });

    expect(values.pricingTiers).toEqual([
      { minutes: 60, label: "1 hour", price: "10", comment: "Members only" },
      { minutes: 120, label: "2 hours", price: "18", comment: "" },
    ]);
  });
});

describe("buildSpacePayload pricePerMonth", () => {
  it("parses pricePerMonth to a number when set", () => {
    const payload = buildSpacePayload(
      baseValues({ pricingType: "MONTHLY", pricePerMonth: "1200" }),
    );

    expect(payload.pricePerMonth).toBe(1200);
  });

  it("sends null for pricePerMonth when left empty", () => {
    const payload = buildSpacePayload(baseValues({ pricePerMonth: "" }));

    expect(payload.pricePerMonth).toBeNull();
  });
});

describe("mapSpaceToFormValues pricePerMonth", () => {
  it("hydrates pricePerMonth from a loaded space", () => {
    const values = mapSpaceToFormValues({
      name: "Desk",
      shortDescription: "",
      description: "",
      spaceType: "OFFICE_DESK",
      pricingType: "MONTHLY",
      pricePerHour: null,
      pricePerDay: null,
      pricePerMonth: 1200,
      capacity: 1,
      instantBook: false,
      cancellationPolicy: "MODERATE",
      houseRules: "",
      categorySlug: "office-desk",
      images: [],
      amenities: [],
      currency: "USD",
      pricingTiers: [],
      availability: [],
    });

    expect(values.pricePerMonth).toBe("1200");
  });

  it("defaults pricePerMonth to an empty string when absent", () => {
    const values = mapSpaceToFormValues({
      name: "Room",
      shortDescription: "",
      description: "",
      spaceType: "MEETING_ROOM",
      pricingType: "BOTH",
      pricePerHour: 10,
      pricePerDay: 80,
      pricePerMonth: null,
      capacity: 4,
      instantBook: false,
      cancellationPolicy: "MODERATE",
      houseRules: "",
      categorySlug: "meeting-room",
      images: [],
      amenities: [],
      currency: "USD",
      pricingTiers: [],
      availability: [],
    });

    expect(values.pricePerMonth).toBe("");
  });
});

describe("buildSpacePayload monthlyPlans", () => {
  it("includes monthly plans for MONTHLY spaces, filtering blank rows", () => {
    const payload = buildSpacePayload(
      baseValues({
        pricingType: "MONTHLY",
        pricePerMonth: "1200",
        monthlyPlans: [
          { name: "Hot desk", pricePerMonth: "150", description: "Flexible" },
          { name: "", pricePerMonth: "250", description: "" },
        ],
      }),
    );

    expect(payload.monthlyPlans).toEqual([
      { name: "Hot desk", pricePerMonth: 150, description: "Flexible" },
    ]);
  });

  it("omits the description when empty or whitespace only", () => {
    const payload = buildSpacePayload(
      baseValues({
        pricingType: "MONTHLY",
        pricePerMonth: "1200",
        monthlyPlans: [
          { name: "Hot desk", pricePerMonth: "150", description: "   " },
        ],
      }),
    );

    expect(payload.monthlyPlans).toEqual([
      { name: "Hot desk", pricePerMonth: 150 },
    ]);
    expect(payload.monthlyPlans?.[0]).not.toHaveProperty("description");
  });

  it("includes monthly plans on non-MONTHLY spaces (subscriptions alongside hourly/daily)", () => {
    const payload = buildSpacePayload(
      baseValues({
        pricingType: "BOTH",
        monthlyPlans: [
          { name: "Hot desk", pricePerMonth: "150", description: "Flexible" },
          { name: "", pricePerMonth: "250", description: "" },
        ],
      }),
    );

    expect(payload.monthlyPlans).toEqual([
      { name: "Hot desk", pricePerMonth: 150, description: "Flexible" },
    ]);
  });
});

describe("mapSpaceToFormValues monthlyPlans", () => {
  it("hydrates monthly plans from a loaded space, defaulting description to empty string", () => {
    const values = mapSpaceToFormValues({
      name: "Desk",
      shortDescription: "",
      description: "",
      spaceType: "OFFICE_DESK",
      pricingType: "MONTHLY",
      pricePerHour: null,
      pricePerDay: null,
      pricePerMonth: 1200,
      capacity: 1,
      instantBook: false,
      cancellationPolicy: "MODERATE",
      houseRules: "",
      categorySlug: "office-desk",
      images: [],
      amenities: [],
      currency: "USD",
      pricingTiers: [],
      monthlyPlans: [
        {
          id: 1,
          name: "Hot desk",
          pricePerMonth: 150,
          description: "Flexible",
          sortOrder: 0,
        },
        {
          id: 2,
          name: "Dedicated desk",
          pricePerMonth: 250,
          description: null,
          sortOrder: 1,
        },
      ],
      availability: [],
    });

    expect(values.monthlyPlans).toEqual([
      { name: "Hot desk", pricePerMonth: "150", description: "Flexible" },
      { name: "Dedicated desk", pricePerMonth: "250", description: "" },
    ]);
  });

  it("defaults monthly plans to an empty array when absent", () => {
    const values = mapSpaceToFormValues({
      name: "Room",
      shortDescription: "",
      description: "",
      spaceType: "MEETING_ROOM",
      pricingType: "BOTH",
      pricePerHour: 10,
      pricePerDay: 80,
      pricePerMonth: null,
      capacity: 4,
      instantBook: false,
      cancellationPolicy: "MODERATE",
      houseRules: "",
      categorySlug: "meeting-room",
      images: [],
      amenities: [],
      currency: "USD",
      pricingTiers: [],
      availability: [],
    });

    expect(values.monthlyPlans).toEqual([]);
  });
});

describe("pricingTypeOptionsForCategory", () => {
  it("excludes Both and includes Monthly for office categories", () => {
    for (const spaceType of [
      "OFFICE_DESK",
      "PRIVATE_OFFICE",
      "COWORKING_SPACE",
    ] as const) {
      const values = pricingTypeOptionsForCategory(spaceType).map(
        (option) => option.value,
      );

      expect(values).toContain("MONTHLY");
      expect(values).not.toContain("BOTH");
      expect(values).toEqual(["HOURLY", "DAILY", "MONTHLY"]);
    }
  });

  it("keeps the full set (including Both) for non-office categories", () => {
    const values = pricingTypeOptionsForCategory("MEETING_ROOM").map(
      (option) => option.value,
    );

    expect(values).toEqual(["HOURLY", "DAILY", "MONTHLY", "BOTH"]);
  });
});

describe("defaultPricingTypeForCategory", () => {
  it("defaults office categories to Monthly", () => {
    expect(defaultPricingTypeForCategory("OFFICE_DESK")).toBe("MONTHLY");
    expect(defaultPricingTypeForCategory("PRIVATE_OFFICE")).toBe("MONTHLY");
    expect(defaultPricingTypeForCategory("COWORKING_SPACE")).toBe("MONTHLY");
  });

  it("keeps Both as the default for non-office categories", () => {
    expect(defaultPricingTypeForCategory("MEETING_ROOM")).toBe("BOTH");
  });
});
