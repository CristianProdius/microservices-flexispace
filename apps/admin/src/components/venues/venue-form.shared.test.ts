import { describe, expect, it } from "vitest";

import {
  buildVenuePayload,
  createEmptyVenueFormValues,
  mapVenueToFormValues,
  type VenueFormValues,
} from "./venue-form.shared";

const baseValues = (
  overrides: Partial<VenueFormValues> = {},
): VenueFormValues => ({
  ...createEmptyVenueFormValues(),
  name: "Hub",
  shortDescription: "short",
  description: "a description long enough",
  address: "1 Main St",
  city: "Chisinau",
  country: "MD",
  ...overrides,
});

describe("createEmptyVenueFormValues verification status", () => {
  it("defaults the verified badge to UNVERIFIED", () => {
    expect(createEmptyVenueFormValues().venueVerificationStatus).toBe(
      "UNVERIFIED",
    );
  });
});

describe("buildVenuePayload verification status", () => {
  it("sends the explicit status when listing badges are included", () => {
    const payload = buildVenuePayload(
      baseValues({ venueVerificationStatus: "VERIFIED" }),
      { includeListingBadges: true },
    );

    expect(payload.venueVerificationStatus).toBe("VERIFIED");
  });

  it("sends UNVERIFIED when the badge is off", () => {
    const payload = buildVenuePayload(
      baseValues({ venueVerificationStatus: "UNVERIFIED" }),
      { includeListingBadges: true },
    );

    expect(payload.venueVerificationStatus).toBe("UNVERIFIED");
  });

  it("omits the status when listing badges are not included", () => {
    const payload = buildVenuePayload(
      baseValues({ venueVerificationStatus: "VERIFIED" }),
    );

    expect(payload).not.toHaveProperty("venueVerificationStatus");
    expect(payload).not.toHaveProperty("venueVerified");
  });
});

describe("mapVenueToFormValues verification status", () => {
  it("hydrates VERIFIED from the loaded venue", () => {
    const values = mapVenueToFormValues({
      id: 1,
      name: "Hub",
      shortDescription: "s",
      description: "d",
      address: "a",
      city: "c",
      state: null,
      country: "MD",
      postalCode: null,
      latitude: null,
      longitude: null,
      images: [],
      currency: "USD",
      venueVerificationStatus: "VERIFIED",
    });

    expect(values.venueVerificationStatus).toBe("VERIFIED");
  });

  it("defaults to UNVERIFIED when the status is absent", () => {
    const values = mapVenueToFormValues({
      id: 1,
      name: "Hub",
      shortDescription: "s",
      description: "d",
      address: "a",
      city: "c",
      state: null,
      country: "MD",
      postalCode: null,
      latitude: null,
      longitude: null,
      images: [],
      currency: "USD",
    });

    expect(values.venueVerificationStatus).toBe("UNVERIFIED");
  });
});
