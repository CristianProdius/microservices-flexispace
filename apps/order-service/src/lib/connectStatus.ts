import type { ConnectAccountStatus } from "@repo/types";

export function deriveConnectStatus(account: {
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements?: { disabled_reason?: string | null };
}): ConnectAccountStatus {
  if (account.requirements?.disabled_reason) return "DISABLED";
  if (account.payouts_enabled) return "ACTIVE";
  if (account.details_submitted) return "PENDING_VERIFICATION";
  return "ONBOARDING";
}
