import { describe, expect, it } from "vitest";
import { fmtElapsed } from "./time";

describe("fmtElapsed", () => {
  it("uses compact minute, hour, and day labels", () => {
    expect(fmtElapsed(30)).toBe("<1m");
    expect(fmtElapsed(42 * 60)).toBe("42m");
    expect(fmtElapsed((3 * 60 + 7) * 60)).toBe("3h 7m");
    expect(fmtElapsed((2 * 24 + 5) * 60 * 60)).toBe("2d 5h");
  });

  it("does not display a negative age", () => {
    expect(fmtElapsed(-60)).toBe("<1m");
  });
});