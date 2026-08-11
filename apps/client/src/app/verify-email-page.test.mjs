import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("./[locale]/(auth)/verify-email/page.tsx", import.meta.url),
  "utf8",
);
const authSource = readFileSync(new URL("../lib/auth.ts", import.meta.url), "utf8");
const loginSource = readFileSync(
  new URL("./[locale]/(auth)/login/page.tsx", import.meta.url),
  "utf8",
);

test("verify-email page reads token from query and calls verifyEmail helper", () => {
  assert.match(
    pageSource,
    /searchParams\.get\("token"\)|URLSearchParams\(window\.location\.search\)/,
    "Page must read the token query param from the email link",
  );
  assert.match(pageSource, /verifyEmail\(token\)/, "Page must call verifyEmail with the token");
});

test("auth helper hits GET /auth/verify-email with the token", () => {
  assert.match(
    authSource,
    /\/auth\/verify-email\?token=\$\{encodeURIComponent\(token\)\}/,
    "verifyEmail must call the auth-service verify-email endpoint",
  );
  assert.match(authSource, /export async function resendVerification/, "resend helper must exist");
  assert.match(authSource, /class AuthApiError/, "login errors must preserve API codes");
});

test("login page offers resend when EMAIL_NOT_VERIFIED", () => {
  assert.match(
    loginSource,
    /EMAIL_NOT_VERIFIED/,
    "Login must branch on EMAIL_NOT_VERIFIED from auth-service",
  );
  assert.match(
    loginSource,
    /resendVerification/,
    "Login must allow resending the verification email",
  );
});
