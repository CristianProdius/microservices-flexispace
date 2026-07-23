import { describe, it, expect } from "vitest";
import {
  CURRENCIES,
  CURRENCY_SYMBOLS,
  CURRENCY_LABELS,
} from "./currency";

describe("currency definitions", () => {
  it("includes RON alongside USD/EUR/MDL", () => {
    expect(CURRENCIES).toEqual(["USD", "EUR", "MDL", "RON"]);
  });

  it("renders MDL and RON as unambiguous suffixes, not a bare L", () => {
    // The bare "L" was ambiguous between Moldovan and Romanian lei.
    expect(CURRENCY_SYMBOLS.MDL).toBe("MDL");
    expect(CURRENCY_SYMBOLS.RON).toBe("RON");
    expect(CURRENCY_SYMBOLS.USD).toBe("$");
    expect(CURRENCY_SYMBOLS.EUR).toBe("€");
  });

  it("has a human label for every currency", () => {
    for (const c of CURRENCIES) {
      expect(CURRENCY_LABELS[c]).toBeTruthy();
    }
    expect(CURRENCY_LABELS.RON).toContain("RON");
  });
});
