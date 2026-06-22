import { apiFetch } from "@/lib/apiFetch";
import type { AuthResponse, User } from "@/lib/auth";

const AUTH_SERVICE_URL =
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:8003";

export interface InviteUserResult {
  inviteUrl: string;
  expiresAt: string;
}

export interface HostInviteResult {
  userId: string;
  inviteUrl: string;
  created: boolean;
}

export interface InviteLookup {
  valid: boolean;
  email?: string;
  name?: string;
  reason?: string;
}

/** Resend / first-time email invite for an existing user (admin, bearer). */
export async function inviteUser(userId: string): Promise<InviteUserResult> {
  const res = await apiFetch(`${AUTH_SERVICE_URL}/users/${userId}/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: "" }));
    throw new Error(data.message || "Failed to send invite");
  }
  return res.json();
}

/** Find-or-create a HOST by email and invite them (admin, bearer). */
export async function createHostInvite(input: {
  name: string;
  email: string;
}): Promise<HostInviteResult> {
  const res = await apiFetch(`${AUTH_SERVICE_URL}/users/host-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: "" }));
    throw new Error(data.message || "Failed to create host invite");
  }
  return res.json();
}

/**
 * Thrown by getInvite for transient failures (network error or 5xx) so the
 * caller can offer a retry instead of showing the terminal "invalid" screen.
 */
export class InviteLookupTransientError extends Error {
  constructor() {
    super("invite_lookup_transient");
    this.name = "InviteLookupTransientError";
  }
}

/** Public: validate a token and read the invitee's email/name (no auth). */
export async function getInvite(token: string): Promise<InviteLookup> {
  let res: Response;
  try {
    res = await fetch(
      `${AUTH_SERVICE_URL}/auth/invite/${encodeURIComponent(token)}`,
      { credentials: "include" }
    );
  } catch {
    // Network/connection failure — transient, let the caller retry.
    throw new InviteLookupTransientError();
  }
  if (res.status >= 500) {
    // Server-side blip — transient, let the caller retry.
    throw new InviteLookupTransientError();
  }
  if (!res.ok) {
    // A genuine 4xx means the invite is invalid/expired.
    return { valid: false, reason: "lookup_failed" };
  }
  return res.json();
}

/** Public: redeem the token, set the password, and start a session (cookies). */
export async function acceptInvite(input: {
  token: string;
  newPassword: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${AUTH_SERVICE_URL}/auth/invite/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Could not accept this invite");
  }
  return res.json();
}

/** Reuse GET /users?role=HOST for the venue-form host picker (admin, bearer). */
export async function searchHosts(query?: string): Promise<User[]> {
  const qs = query ? `&search=${encodeURIComponent(query)}` : "";
  const res = await apiFetch(`${AUTH_SERVICE_URL}/users?role=HOST${qs}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: "" }));
    throw new Error(data.message || "Failed to load hosts");
  }
  return res.json();
}
