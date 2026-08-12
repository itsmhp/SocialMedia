import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearPreferences,
  DEFAULT_PREFERENCES,
  loadPreferences,
  PREFERENCES_KEY,
  savePreferences,
} from "./preferences";

function storageStub(initial?: string) {
  const values = new Map<string, string>();
  if (initial) values.set(PREFERENCES_KEY, initial);
  return {
    values,
    api: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("preferences", () => {
  it("uses safe defaults when nothing is saved", () => {
    const storage = storageStub();
    vi.stubGlobal("localStorage", storage.api);
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it("round-trips valid notification and quiet-hour preferences", () => {
    const storage = storageStub();
    vi.stubGlobal("localStorage", storage.api);
    const changed = {
      ...DEFAULT_PREFERENCES,
      theme: "dark" as const,
      notifications: {
        ...DEFAULT_PREFERENCES.notifications,
        roomActivity: true,
        quietHoursEnabled: true,
        quietStart: "21:30",
        quietEnd: "07:15",
      },
    };
    expect(savePreferences(changed)).toBe(true);
    expect(loadPreferences()).toEqual(changed);
    expect(clearPreferences()).toBe(true);
    expect(storage.values.has(PREFERENCES_KEY)).toBe(false);
  });

  it("keeps version-one notification choices when theme is missing", () => {
    const notifications = {
      ...DEFAULT_PREFERENCES.notifications,
      roomActivity: true,
    };
    const storage = storageStub(JSON.stringify({ version: 1, notifications }));
    vi.stubGlobal("localStorage", storage.api);

    expect(loadPreferences()).toEqual({
      ...DEFAULT_PREFERENCES,
      notifications,
    });
  });

  it("rejects malformed or incompatible saved preferences", () => {
    const malformed = storageStub(JSON.stringify({
      version: 1,
      notifications: { ...DEFAULT_PREFERENCES.notifications, quietStart: "99:99" },
    }));
    vi.stubGlobal("localStorage", malformed.api);
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it("fails safely when storage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    });
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
    expect(savePreferences(DEFAULT_PREFERENCES)).toBe(false);
    expect(clearPreferences()).toBe(false);
  });
});