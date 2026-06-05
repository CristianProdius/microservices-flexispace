import type { User } from "@/lib/auth";

/**
 * Single source of truth for "does this user have host privileges?".
 *
 * ADMINs are treated as hosts everywhere so that admin accounts see the same
 * host-only UI (dashboard link, become-host redirect) as regular hosts. Without
 * this helper the individual call sites drift apart over time.
 */
export function isHostRole(role: User["role"] | null | undefined): boolean {
  return role === "HOST" || role === "ADMIN";
}
