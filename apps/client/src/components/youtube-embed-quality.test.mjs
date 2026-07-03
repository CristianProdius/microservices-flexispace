import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./YouTubeEmbed.tsx", import.meta.url),
  "utf8",
);

test("embed keeps the privacy-enhanced youtube-nocookie host", () => {
  assert.match(source, /youtube-nocookie\.com\/embed/);
});

test("embed requests a clean, best-quality player via query params", () => {
  assert.match(source, /rel:\s*"0"/, "rel=0 limits related videos");
  assert.match(source, /modestbranding:\s*"1"/);
  assert.match(source, /playsinline:\s*"1"/);
});

test("embed src includes the encoded params and keeps fullscreen support", () => {
  assert.match(source, /embedParams\.toString\(\)/);
  assert.match(source, /allowFullScreen/);
  assert.match(source, /allow="[^"]*encrypted-media[^"]*"/);
});
