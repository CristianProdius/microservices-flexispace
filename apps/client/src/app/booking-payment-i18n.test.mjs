import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readMessages = (locale) =>
  JSON.parse(
    readFileSync(
      new URL(`../../messages/${locale}.json`, import.meta.url),
      "utf8",
    ),
  );

test("booking payment i18n keys stay in parity across locales", () => {
  const locales = ["en", "ro", "ru"];
  const keySets = locales.map((locale) =>
    Object.keys(readMessages(locale).booking.payment).sort(),
  );

  for (const keys of keySets.slice(1)) {
    assert.deepEqual(keys, keySets[0]);
  }
});
