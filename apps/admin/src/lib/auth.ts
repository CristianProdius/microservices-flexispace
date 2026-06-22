const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:8003";
const AUTH_SERVICE_UNREACHABLE_MESSAGE =
  "Unable to reach the authentication service. Check that it is running and allows this local app.";

/**
 * All auth-service calls must opt-in to credentialed CORS so the
 * HttpOnly `spacefly_access` / `spacefly_refresh` cookies set by
 * `/auth/login` & `/auth/refresh` actually round-trip the browser. The
 * cookies are what the Next.js edge middleware (apps/admin/src/middleware.ts)
 * reads to gate `/admin/*` and `/host/*`.
 */
async function fetchAuth(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${AUTH_SERVICE_URL}${path}`, {
      ...init,
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(AUTH_SERVICE_UNREACHABLE_MESSAGE);
    }

    throw error;
  }
}

export interface User {
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: "USER" | "HOST" | "ADMIN";
  image: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  requiresPasswordChange: boolean;
}

/**
 * Thrown when the auth-service rejects our credentials with 401 — i.e. the
 * stored session is genuinely dead (refresh token expired/revoked/invalid),
 * as opposed to a transient or network failure. Callers use this to self-heal:
 * drop the stale session and route to /login instead of thrashing the
 * auth-service with a token it has already rejected (and surfacing repeated
 * 401s on /auth/me & /auth/refresh in the console).
 */
export class SessionExpiredError extends Error {
  constructor(message = "Session expired") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetchAuth("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Login failed");
  }

  return res.json();
}

export async function logout(refreshToken: string): Promise<void> {
  const token = getAccessToken();
  await fetchAuth("/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ refreshToken }),
  });
}

export interface MeResponse extends User {
  mustChangePassword?: boolean;
}

/** Onboarding-only password set (no current password; keeps the session). */
export async function onboardingSetPassword(newPassword: string): Promise<void> {
  const token = getAccessToken();
  const res = await fetchAuth("/auth/onboarding/set-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ newPassword }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Could not set your new password");
  }
}

/** Current account, including the mustChangePassword flag. */
export async function getMe(): Promise<MeResponse> {
  // Cookie-authoritative: rely on the HttpOnly `spacefly_access` cookie that
  // fetchAuth sends via credentials:include, NOT the localStorage bearer token.
  // The server prefers the Authorization header over the cookie, so a stale
  // localStorage token would shadow a fresh cookie and 401 — which would make
  // the onboarding guard wrongly treat a still-flagged host as done. Omitting
  // the header lets the always-fresh cookie authenticate the read.
  const res = await fetchAuth("/auth/me");
  if (!res.ok) {
    throw new Error("Failed to load account");
  }
  return res.json();
}

// AUD-027: when an admin page and a customer page (or two browser tabs) hit
// `/auth/refresh` simultaneously with the same `.spacefly.ai`-scoped cookie,
// the auth-service detects exactly one winner via an atomic claim and tells
// the loser to retry via HTTP 409 with `code: "REFRESH_RACE"`. By the time
// the loser sees that response, the browser has already applied the
// winner's `Set-Cookie`, so a single retry will pick up the new refresh
// token and succeed without revoking the chain.
const REFRESH_RACE_RETRY_DELAY_MS = 250;
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export async function refreshAccessToken(refreshToken: string): Promise<RefreshResult> {
  const doRequest = () =>
    fetchAuth("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

  let res = await doRequest();

  if (res.status === 409) {
    // Try to read the code without consuming the body on the success path.
    const body = await res.clone().json().catch(() => ({}));
    if (body?.code === "REFRESH_RACE") {
      await sleep(REFRESH_RACE_RETRY_DELAY_MS);
      res = await doRequest();
    }
  }

  if (res.status === 401) {
    // The refresh token is dead (expired/revoked/invalid). Drop the stale local
    // session so the app stops replaying a credential the server has already
    // rejected, and signal callers to route cleanly to /login.
    clearAuth();
    throw new SessionExpiredError("Refresh token rejected");
  }

  if (!res.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await res.json();
  // Surface the ROTATED refresh token so the caller can persist it. The
  // rotating /refresh path returns a fresh `refreshToken`; if the client keeps
  // replaying the old (now-used) one, the server's reuse-detection revokes the
  // entire chain and forces a spurious second login. The legacy (jti-less)
  // path returns only an access token, so fall back to the token we presented.
  return {
    accessToken: data.accessToken,
    refreshToken:
      typeof data.refreshToken === "string" ? data.refreshToken : refreshToken,
  };
}

// Token storage helpers.
//
// TRANSITIONAL (ADMIN-004): tokens are also persisted to localStorage so
// the existing fetch sites that send `Authorization: Bearer ${token}`
// keep working. The long-term direction is cookie-only auth — the
// HttpOnly `spacefly_access` / `spacefly_refresh` cookies set by the
// auth-service are now the primary credential. A follow-up branch will
// remove the localStorage path entirely once every fetch site has been
// migrated to `credentials: "include"` (no Authorization header).
const ACCESS_TOKEN_KEY = "admin_accessToken";
const REFRESH_TOKEN_KEY = "admin_refreshToken";
const USER_KEY = "admin_user";

export function saveTokens(accessToken: string, refreshToken: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function saveUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
}

export function getStoredUser(): User | null {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }
  return null;
}

export function clearAuth(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function isAdmin(): boolean {
  const user = getStoredUser();
  return user?.role === "ADMIN";
}

export function isHost(): boolean {
  const user = getStoredUser();
  return user?.role === "HOST";
}

export function isHostOrAdmin(): boolean {
  const user = getStoredUser();
  return user?.role === "HOST" || user?.role === "ADMIN";
}
