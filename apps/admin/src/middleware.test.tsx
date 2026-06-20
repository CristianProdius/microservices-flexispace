import { describe, expect, it, vi } from "vitest";

// Mock `next/server` so we don't pull in the full Next.js edge runtime
// during unit tests. We only need to assert on the redirect target /
// next-response decisions.
vi.mock("next/server", () => {
  class FakeNextResponse {
    static next() {
      return { type: "next" as const };
    }
    static redirect(url: URL) {
      return { type: "redirect" as const, url };
    }
  }
  return { NextResponse: FakeNextResponse };
});

import { middleware } from "./middleware";

type FakeNextUrl = URL & { clone: () => FakeNextUrl };

type FakeRequest = {
  nextUrl: FakeNextUrl;
  cookies: { get: (name: string) => { value: string } | undefined };
};

function buildNextUrl(pathname: string): FakeNextUrl {
  const url = new URL(`http://localhost:5001${pathname}`) as FakeNextUrl;
  url.clone = () => buildNextUrl(pathname);
  return url;
}

function buildRequest(pathname: string, cookieValue?: string): FakeRequest {
  return {
    nextUrl: buildNextUrl(pathname),
    cookies: {
      get: (name: string) =>
        name === "spacefly_access" && cookieValue
          ? { value: cookieValue }
          : undefined,
    },
  };
}

function buildJwt(payload: Record<string, unknown>): string {
  const encode = (obj: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

describe("admin edge middleware", () => {
  it("redirects unauthenticated requests to /login with a next= param", () => {
    const req = buildRequest("/admin/users");

    const result = middleware(
      req as unknown as Parameters<typeof middleware>[0]
    ) as unknown as { type: string; url: URL };

    expect(result.type).toBe("redirect");
    expect(result.url.pathname).toBe("/login");
    expect(result.url.searchParams.get("next")).toBe("/admin/users");
  });

  it("redirects unauthenticated /onboarding requests to /login", () => {
    const req = buildRequest("/onboarding");

    const result = middleware(
      req as unknown as Parameters<typeof middleware>[0]
    ) as unknown as { type: string; url: URL };

    expect(result.type).toBe("redirect");
    expect(result.url.pathname).toBe("/login");
  });

  it("redirects requests with a malformed cookie value", () => {
    const req = buildRequest("/host/spaces", "not-a-jwt");

    const result = middleware(
      req as unknown as Parameters<typeof middleware>[0]
    ) as unknown as { type: string };

    expect(result.type).toBe("redirect");
  });

  it("redirects when the cookie carries an expired access token", () => {
    const expiredToken = buildJwt({
      userId: "u1",
      role: "ADMIN",
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    const req = buildRequest("/admin", expiredToken);

    const result = middleware(
      req as unknown as Parameters<typeof middleware>[0]
    ) as unknown as { type: string };

    expect(result.type).toBe("redirect");
  });

  it("lets the request through when the cookie carries a fresh JWT", () => {
    const freshToken = buildJwt({
      userId: "u1",
      role: "ADMIN",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const req = buildRequest("/admin/users", freshToken);

    const result = middleware(
      req as unknown as Parameters<typeof middleware>[0]
    ) as unknown as { type: string };

    expect(result.type).toBe("next");
  });
});
