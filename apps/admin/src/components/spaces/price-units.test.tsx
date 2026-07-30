import { describe, expect, it } from "vitest";

import {
  formatPrice,
  formatPriceFull,
  getPriceDisplay,
} from "../../../../client/src/lib/utils";

describe("price units", () => {
  it("formats space prices as dollar amounts without cent conversion", () => {
    expect(formatPrice(1)).toBe("$1");
    expect(formatPrice(12.5)).toBe("$12.5");
    expect(formatPriceFull(1)).toBe("$1.00");
    expect(formatPriceFull(12.5)).toBe("$12.50");
  });

  it("builds listing price labels from raw dollar values", () => {
    expect(
      getPriceDisplay({
        pricingType: "HOURLY",
        pricePerHour: 1,
        pricePerDay: null,
      })
    ).toBe("$1/hr");

    // Flexible pricing: every offered rate is shown inline.
    expect(
      getPriceDisplay({
        pricingType: "BOTH",
        pricePerHour: 15,
        pricePerDay: 120,
      })
    ).toBe("$15/hr · $120/day");

    expect(
      getPriceDisplay({
        pricingType: "BOTH",
        pricePerHour: 15,
        pricePerDay: 120,
        pricePerMonth: 900,
      })
    ).toBe("$15/hr · $120/day · $900/mo");
  });
});
