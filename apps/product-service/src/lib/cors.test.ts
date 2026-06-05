import { describe, expect, it, vi } from "vitest";
import { parseCorsOrigins } from "./cors.js";

const silentLogger = { warn: vi.fn() };

describe("parseCorsOrigins", () => {
  it("returns an empty list for missing/empty input", () => {
    expect(parseCorsOrigins(undefined, { logger: silentLogger })).toEqual([]);
    expect(parseCorsOrigins(null, { logger: silentLogger })).toEqual([]);
    expect(parseCorsOrigins("", { logger: silentLogger })).toEqual([]);
    expect(parseCorsOrigins("  ,  ,", { logger: silentLogger })).toEqual([]);
  });

  it("trims whitespace and strips trailing slashes", () => {
    const out = parseCorsOrigins(
      "  https://app.spacefly.ai/ , https://admin.spacefly.ai///",
      { logger: silentLogger }
    );
    expect(out).toEqual([
      "https://app.spacefly.ai",
      "https://admin.spacefly.ai",
    ]);
  });

  it("rejects the wildcard origin", () => {
    const warn = vi.fn();
    const out = parseCorsOrigins("https://app.spacefly.ai,*", {
      logger: { warn },
    });
    expect(out).toEqual(["https://app.spacefly.ai"]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('wildcard origin "*"')
    );
  });

  it("rejects unparseable origins", () => {
    const warn = vi.fn();
    const out = parseCorsOrigins("not-a-url,https://ok.example.com", {
      logger: { warn },
    });
    expect(out).toEqual(["https://ok.example.com"]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('unparseable origin "not-a-url"')
    );
  });

  it("rejects http origins outside of localhost", () => {
    const warn = vi.fn();
    const out = parseCorsOrigins(
      "http://evil.example.com,http://localhost:5001,http://127.0.0.1:3002",
      { logger: { warn } }
    );
    expect(out).toEqual([
      "http://localhost:5001",
      "http://127.0.0.1:3002",
    ]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("evil.example.com")
    );
  });

  it("rejects non-http(s) protocols", () => {
    const warn = vi.fn();
    const out = parseCorsOrigins("ftp://example.com,https://ok.example.com", {
      logger: { warn },
    });
    expect(out).toEqual(["https://ok.example.com"]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("non-http(s) origin")
    );
  });

  it("deduplicates equivalent origins", () => {
    const out = parseCorsOrigins(
      "https://app.spacefly.ai,https://app.spacefly.ai/,https://app.spacefly.ai",
      { logger: silentLogger }
    );
    expect(out).toEqual(["https://app.spacefly.ai"]);
  });
});
