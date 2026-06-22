import { NextResponse, type NextRequest } from "next/server";

const ACCESS_TOKEN_COOKIE = "spacefly_access";

/**
 * Decode the payload of a JWT *without* verifying the signature. We do
 * this in the edge so we can catch obviously stale or malformed cookies
 * before serving a protected HTML shell. Actual signature verification
 * still happens at the API boundary via `@repo/auth-middleware`, so an
 * attacker forging a cookie can at most reach the UI shell while every
 * data request 401s — same posture as the legitimate "logged out" view.
 */
function decodeJwtPayload(token: string): { exp?: number; role?: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payloadSegment = parts[1]!;
    // Convert base64url -> base64 and pad as required by atob.
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  // Preserve the destination so the login page can bounce the user back
  // after a successful sign-in (UX, not a security boundary).
  const target = req.nextUrl.pathname + req.nextUrl.search;
  if (target && target !== "/login") {
    url.searchParams.set("next", target);
  }
  return NextResponse.redirect(url);
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    // No session cookie at all → genuinely unauthenticated. Bounce to /login.
    return redirectToLogin(req);
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    // Malformed/garbage cookie → treat as no session.
    return redirectToLogin(req);
  }

  // The access COOKIE intentionally outlives its 15-min JWT (see
  // apps/auth-service/src/utils/cookies.ts). An expired `exp` here therefore
  // does NOT mean "logged out" — it means the short-lived access token lapsed
  // while the 7-day refresh session is almost certainly still valid. Bouncing
  // such a request to /login every 15 minutes was the "have to log in twice"
  // bug. Instead we serve the protected shell and let the client silently
  // refresh (authStore.initialize / getToken → /auth/refresh re-mints a fresh
  // access cookie). This does not weaken the gate: a forged or expired cookie
  // only reaches the static UI shell — every data request still verifies the
  // JWT at the API boundary and 401s until a real refresh succeeds, the same
  // posture as the documented "logged out" view. A truly dead session (no
  // refresh token) self-heals to /login from the client guards.
  //
  // Role-based gating (admin vs host areas) stays in the client layouts as
  // defense-in-depth.
  return NextResponse.next();
}

export const config = {
  // Only run on protected segments. Public auth pages (login, unauthorized)
  // and Next.js internals (`_next/*`, static assets) are intentionally
  // excluded; the `/` landing page redirects users client-side already and
  // does not render any protected content.
  matcher: ["/admin/:path*", "/host/:path*", "/onboarding/:path*"],
};
