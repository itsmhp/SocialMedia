import { afterEach, describe, expect, it, vi } from "vitest";
import { migrateBrandKeys } from "./brandMigration";

afterEach(() => vi.unstubAllGlobals());

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    api: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    } as unknown as Storage,
  };
}

describe("brand key migration", () => {
  it("moves legacy unggun.* values to falo.* keys and drops the old keys", () => {
    const local = memoryStorage({ "unggun.state": "s", "unggun.profile": "p", "unggun.preferences": "pref", "unggun.terms": "t" });
    const session = memoryStorage({ "unggun.pendingInvite": "inv" });
    vi.stubGlobal("localStorage", local.api);
    vi.stubGlobal("sessionStorage", session.api);

    migrateBrandKeys();

    expect(local.values.get("falo.state")).toBe("s");
    expect(local.values.get("falo.profile")).toBe("p");
    expect(local.values.get("falo.preferences")).toBe("pref");
    expect(local.values.get("falo.terms")).toBe("t");
    expect(session.values.get("falo.pendingInvite")).toBe("inv");
    for (const key of ["unggun.state", "unggun.profile", "unggun.preferences", "unggun.terms"]) {
      expect(local.values.has(key)).toBe(false);
    }
    expect(session.values.has("unggun.pendingInvite")).toBe(false);
  });

  it("keeps an existing falo.* value and drops the stale legacy key", () => {
    const local = memoryStorage({ "unggun.profile": "old", "falo.profile": "current" });
    const session = memoryStorage();
    vi.stubGlobal("localStorage", local.api);
    vi.stubGlobal("sessionStorage", session.api);

    migrateBrandKeys();

    expect(local.values.get("falo.profile")).toBe("current");
    expect(local.values.has("unggun.profile")).toBe(false);
  });

  it("is a no-op when there is nothing to migrate", () => {
    const local = memoryStorage();
    const session = memoryStorage();
    vi.stubGlobal("localStorage", local.api);
    vi.stubGlobal("sessionStorage", session.api);

    expect(() => migrateBrandKeys()).not.toThrow();
    expect(local.values.size).toBe(0);
    expect(session.values.size).toBe(0);
  });
});
