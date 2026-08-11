import { describe, expect, it } from "vitest";
import { randomHandle } from "./handles";

describe("randomHandle", () => {
  it("always produces a schema-valid handle", () => {
    for (let index = 0; index < 108; index += 1) {
      const handle = randomHandle("", () => (index + 0.25) / 108);
      expect(handle).toMatch(/^[a-z0-9_]{2,16}$/);
    }
  });

  it("does not immediately repeat the current handle", () => {
    const first = randomHandle("", () => 0);
    expect(randomHandle(first, () => 0)).not.toBe(first);
  });

  it("clamps unusual random sources safely", () => {
    expect(randomHandle("", () => -1)).toMatch(/^[a-z0-9_]{2,16}$/);
    expect(randomHandle("", () => 2)).toMatch(/^[a-z0-9_]{2,16}$/);
  });
});