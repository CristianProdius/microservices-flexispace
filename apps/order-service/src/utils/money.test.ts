import { describe, expect, it } from "vitest";
import {
  commissionMinor,
  MoneyConversionError,
  refundableMinor,
  toMinorUnits,
} from "./money.js";

describe("toMinorUnits", () => {
  it("converts round dollars", () => expect(toMinorUnits(150)).toBe(15000));
  it("converts cents exactly (no float drift)", () => {
    expect(toMinorUnits(19.99)).toBe(1999);
    expect(toMinorUnits(0.1 + 0.2)).toBe(30); // 0.30000000000000004 -> 30
    expect(toMinorUnits(1234.56)).toBe(123456);
  });
  it("rejects negatives, NaN, Infinity, unsafe magnitudes", () => {
    expect(() => toMinorUnits(-1)).toThrow(MoneyConversionError);
    expect(() => toMinorUnits(Number.NaN)).toThrow(MoneyConversionError);
    expect(() => toMinorUnits(Number.POSITIVE_INFINITY)).toThrow(MoneyConversionError);
    expect(() => toMinorUnits(Number.MAX_SAFE_INTEGER)).toThrow(MoneyConversionError);
  });
});

describe("commissionMinor", () => {
  it("rounds half-up on the integer product", () => {
    expect(commissionMinor(10000, 0.1)).toBe(1000);
    expect(commissionMinor(999, 0.15)).toBe(150); // 149.85 -> 150
    expect(commissionMinor(101, 0.125)).toBe(13); // 12.625 -> 13
  });
  it("clamps rate to [0,1] so a bad row can never exceed the subtotal", () => {
    expect(commissionMinor(10000, 1.5)).toBe(10000);
    expect(commissionMinor(10000, -0.2)).toBe(0);
  });
});

describe("refundableMinor", () => {
  it("applies the policy rate to the captured amount", () => {
    expect(refundableMinor(10000, 0, 0.5)).toBe(5000);
    expect(refundableMinor(10000, 0, 1)).toBe(10000);
    expect(refundableMinor(10000, 0, 0)).toBe(0);
  });
  it("never exceeds what is still un-refunded", () => {
    expect(refundableMinor(10000, 6000, 1)).toBe(4000);
    expect(refundableMinor(10000, 10000, 1)).toBe(0);
  });
});
