import assert from "node:assert/strict";
import test from "node:test";

import { LOCALE_COOKIE_NAME, parseLocaleCookie } from "./parseLocaleCookie.ts";

const LOCALES = ["ro", "ru", "en"];
const DEFAULT_LOCALE = "ro";

test("LOCALE_COOKIE_NAME matches next-intl's default", () => {
  assert.equal(LOCALE_COOKIE_NAME, "NEXT_LOCALE");
});

test("parseLocaleCookie returns the cookie value when it is a supported locale", () => {
  assert.equal(parseLocaleCookie("NEXT_LOCALE=ro", LOCALES, DEFAULT_LOCALE), "ro");
  assert.equal(parseLocaleCookie("NEXT_LOCALE=ru", LOCALES, DEFAULT_LOCALE), "ru");
  assert.equal(parseLocaleCookie("NEXT_LOCALE=en", LOCALES, DEFAULT_LOCALE), "en");
});

test("parseLocaleCookie tolerates additional cookies in the string", () => {
  assert.equal(
    parseLocaleCookie("foo=bar; NEXT_LOCALE=ru; baz=qux", LOCALES, DEFAULT_LOCALE),
    "ru",
  );
});

test("parseLocaleCookie falls back to the default locale when the cookie is missing", () => {
  assert.equal(parseLocaleCookie("", LOCALES, DEFAULT_LOCALE), DEFAULT_LOCALE);
  assert.equal(parseLocaleCookie("foo=bar", LOCALES, DEFAULT_LOCALE), DEFAULT_LOCALE);
});

test("parseLocaleCookie falls back when the cookie value is not a supported locale", () => {
  // The bug: with localePrefix:"never", split("/")[1] yielded values like
  // "spaces" or "hosts". Make sure stale/garbage values can't slip through.
  assert.equal(
    parseLocaleCookie("NEXT_LOCALE=spaces", LOCALES, DEFAULT_LOCALE),
    DEFAULT_LOCALE,
  );
  assert.equal(
    parseLocaleCookie("NEXT_LOCALE=de", LOCALES, DEFAULT_LOCALE),
    DEFAULT_LOCALE,
  );
});

test("parseLocaleCookie decodes URL-encoded cookie values", () => {
  assert.equal(parseLocaleCookie("NEXT_LOCALE=%72%6F", LOCALES, DEFAULT_LOCALE), "ro");
});
