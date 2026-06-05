// Test suite for safeRedirectPath. Runs under node --test.
// We can't import the .ts directly under node; instead we inline the logic
// here to mirror the implementation and lock in the security invariants.
// Keep this aligned with apps/client/src/lib/safeRedirect.ts.
import { test } from "node:test";
import assert from "node:assert/strict";

function safeRedirectPath(redirectTo, fallback = "/") {
  if (!redirectTo) return fallback;
  if (typeof redirectTo !== "string") return fallback;

  if (
    redirectTo.includes("\\") ||
    redirectTo.includes("://") ||
    !redirectTo.startsWith("/") ||
    redirectTo.startsWith("//")
  ) {
    return fallback;
  }

  // Simulate the browser branch with a fixed origin.
  try {
    const url = new URL(redirectTo, "https://app.example.com");
    if (url.origin !== "https://app.example.com") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

test("returns fallback for nullish input", () => {
  assert.equal(safeRedirectPath(null), "/");
  assert.equal(safeRedirectPath(undefined), "/");
  assert.equal(safeRedirectPath(""), "/");
});

test("accepts plain relative path", () => {
  assert.equal(safeRedirectPath("/bookings"), "/bookings");
  assert.equal(safeRedirectPath("/bookings?ref=xyz"), "/bookings?ref=xyz");
  assert.equal(safeRedirectPath("/en/spaces#top"), "/en/spaces#top");
});

test("rejects protocol-relative URL", () => {
  assert.equal(safeRedirectPath("//evil.com"), "/");
  assert.equal(safeRedirectPath("//evil.com/path"), "/");
});

test("rejects backslash payload that browsers normalize to //", () => {
  // /\evil.com → browsers may treat as //evil.com
  assert.equal(safeRedirectPath("/\\evil.com"), "/");
  assert.equal(safeRedirectPath("/\\\\evil.com"), "/");
  assert.equal(safeRedirectPath("/path\\with\\backslashes"), "/");
});

test("rejects absolute URLs", () => {
  assert.equal(safeRedirectPath("https://evil.com"), "/");
  assert.equal(safeRedirectPath("http://evil.com"), "/");
  assert.equal(safeRedirectPath("javascript://comment%0aalert(1)"), "/");
});

test("rejects values that do not start with /", () => {
  assert.equal(safeRedirectPath("bookings"), "/");
  assert.equal(safeRedirectPath("evil.com"), "/");
});

test("honors custom fallback", () => {
  assert.equal(safeRedirectPath(null, "/home"), "/home");
  assert.equal(safeRedirectPath("//evil.com", "/home"), "/home");
});
