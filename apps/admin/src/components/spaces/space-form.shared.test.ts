import { describe, expect, it } from "vitest";

import {
  buildSpacePayload,
  createEmptySpaceFormValues,
  mapSpaceToFormValues,
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
