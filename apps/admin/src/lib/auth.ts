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

export async function refreshAccessToken(refreshToken: string): Promise<string> {
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

  if (!res.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await res.json();
  return data.accessToken;
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
