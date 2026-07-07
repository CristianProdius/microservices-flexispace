import { describe, expect, it } from "vitest";
import { deriveConnectStatus } from "./connectStatus.js";

describe("deriveConnectStatus", () => {
  it("payouts_enabled -> ACTIVE", () => {
    expect(
      deriveConnectStatus({
        payouts_enabled: true,
        details_submitted: true,
        requirements: { disabled_reason: null },
      })
    ).toBe("ACTIVE");
  });

  it("details submitted but not payouts-enabled -> PENDING_VERIFICATION", () => {
    expect(
      deriveConnectStatus({
        payouts_enabled: false,
        details_submitted: true,
        requirements: { disabled_reason: null },
      })
    ).toBe("PENDING_VERIFICATION");
  });

  it("disabled_reason present -> DISABLED", () => {
    expect(
      deriveConnectStatus({
        payouts_enabled: false,
        details_submitted: true,
        requirements: { disabled_reason: "requirements.past_due" },
      })
    ).toBe("DISABLED");
  });

  it("fresh account -> ONBOARDING", () => {
    expect(
      deriveConnectStatus({
        payouts_enabled: false,
        details_submitted: false,
        requirements: { disabled_reason: null },
      })
    ).toBe("ONBOARDING");
  });
});
