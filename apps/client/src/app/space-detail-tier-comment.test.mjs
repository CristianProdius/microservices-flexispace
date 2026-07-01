import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./[locale]/(main)/spaces/[id]/page.tsx", import.meta.url),
  "utf8",
);

test("pricing tier renders its optional comment below the price row", () => {
  assert.match(
    source,
    /tier\.comment/,
    "Pricing tier should read tier.comment",
  );
  assert.match(
    source,
    /\{tier\.comment && \(/,
    "Comment should render conditionally when present",
  );
});

test("tier comment uses the small muted style from the mock", () => {
  const commentMatch = source.match(
    /\{tier\.comment && \(\s*<p className="([^"]+)"/,
  );

  assert.ok(commentMatch, "Comment should be rendered inside a <p>");
  assert.match(commentMatch[1], /text-sm/);
  assert.match(commentMatch[1], /text-muted/);
});
