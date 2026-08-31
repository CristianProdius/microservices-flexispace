import { describe, expect, it } from "vitest";
import { hostProfileHref } from "./host";

describe("hostProfileHref", () => {
  it("uses username when it differs from the host id", () => {
    expect(hostProfileHref({ id: "cmqqjyo2200028o4db2gf8hph", username: "regus" })).toBe(
      "/hosts/regus"
    );
  });

  it("falls back to id when username is missing", () => {
    expect(hostProfileHref({ id: "u1" })).toBe("/hosts/u1");
    expect(hostProfileHref({ id: "u1", username: null })).toBe("/hosts/u1");
    expect(hostProfileHref({ id: "u1", username: "  " })).toBe("/hosts/u1");
  });

  it("does not emit a duplicate path when username equals id", () => {
    expect(hostProfileHref({ id: "alice", username: "alice" })).toBe("/hosts/alice");
  });
});
