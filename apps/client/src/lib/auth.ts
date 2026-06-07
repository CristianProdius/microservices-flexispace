const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:8003";
const AUTH_SERVICE_UNREACHABLE_MESSAGE =
  "Unable to reach the authentication service. Check that it is running and allows this local app.";

async function fetchAuth(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${AUTH_SERVICE_URL}${path}`, init);
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

export async function register(
  email: string,
  username: string,
  password: string,
  name?: string
): Promise<AuthResponse> {
  const res = await fetchAuth("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password, name }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Registration failed");
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

export interface RefreshResponse {
  accessToken: string;
  /**
   * Optional. Auth services that rotate refresh tokens return a new value
   * here; services that don't rotate omit it. Callers should persist whichever
   * value the server returned and fall back to the existing token otherwise.
   */
  refreshToken?: string;
}

// AUD-027: on a `409 { code: "REFRESH_RACE" }` from auth-service (two tabs
// or apps refreshing the same `.spacefly.ai` cookie simultaneously), retry
// once after a short backoff. By then the winning request's `Set-Cookie`
// has updated the browser's refresh token and the retry will succeed
// without forcing a logout.
const REFRESH_RACE_RETRY_DELAY_MS = 250;
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshResponse> {
  const doRequest = () =>
    fetchAuth("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

  let res = await doRequest();

  if (res.status === 409) {
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
  return {
    accessToken: data.accessToken,
    refreshToken: typeof data.refreshToken === "string" ? data.refreshToken : undefined,
  };
}

export async function getMe(token: string): Promise<User> {
  const res = await fetchAuth("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to get user");
  }

  return res.json();
}

// Token storage helpers
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

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

/** Decode the payload section of a JWT without verification (client-side only). */
export function decodeJwtPayload(token: string): { exp?: number; [key: string]: unknown } {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT");
  const payload = parts[1]!;
  // Handle base64url encoding: replace URL-safe chars and pad if needed
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = atob(base64);
  return JSON.parse(json);
}

/**
 * Check whether a JWT access token is expired (or about to expire within bufferMs).
 * Returns true (expired) on any error to trigger a refresh attempt.
 */
export function isTokenExpired(token: string, bufferMs = 60_000): boolean {
  try {
    const { exp } = decodeJwtPayload(token);
    if (typeof exp !== "number") return true;
    return exp * 1000 - bufferMs <= Date.now();
  } catch {
    return true;
  }
}
