import { describe, expect, it } from "vitest";
import { assertRefundable, computeRefundMinor } from "./refund.js";

describe("computeRefundMinor", () => {
  it("guest cancel returns rate * (amount - alreadyRefunded)", () => {
    expect(
      computeRefundMinor({ amountMinor: 10000, refundedMinor: 0, rate: 0.5 })
    ).toBe(5000);
  });

  it("host/admin full cancel refunds the full remaining", () => {
    expect(
      computeRefundMinor({ amountMinor: 10000, refundedMinor: 0, rate: 1 })
    ).toBe(10000);
  });

  it("rate 0 (non-refundable policy) returns 0", () => {
    expect(
      computeRefundMinor({ amountMinor: 10000, refundedMinor: 0, rate: 0 })
    ).toBe(0);
  });

  it("rounds to whole minor units (no fractional cents)", () => {
    expect(
      computeRefundMinor({ amountMinor: 9999, refundedMinor: 0, rate: 0.5 })
    ).toBe(5000);
  });
});

describe("assertRefundable", () => {
  it("throws when refund would exceed captured amount", () => {
    expect(() =>
      assertRefundable({ amountMinor: 10000, refundedMinor: 8000 }, 5000)
    ).toThrow(/REFUND_EXCEEDS_CAPTURED/);
  });

  it("allows a refund exactly up to the remaining balance", () => {
    expect(() =>
      assertRefundable({ amountMinor: 10000, refundedMinor: 8000 }, 2000)
    ).not.toThrow();
  });
});
