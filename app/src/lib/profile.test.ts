import { afterEach, describe, expect, it, vi } from "vitest";
import { PROFILE_KEY, saveProfile } from "./profile";

const profile = { id: "user_test", name: "ember_test", avatar: "🔥" };

afterEach(() => vi.unstubAllGlobals());

describe("profile persistence", () => {
  it("reports a successful durable save", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      setItem: (key: string, value: string) => values.set(key, value),
    });
    expect(saveProfile(profile)).toBe(true);
    expect(JSON.parse(values.get(PROFILE_KEY) ?? "null")).toEqual(profile);
  });

  it("reports storage failures so onboarding can remain open", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => { throw new Error("blocked"); },
    });
    expect(saveProfile(profile)).toBe(false);
  });
});