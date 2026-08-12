import { afterEach, describe, expect, it, vi } from "vitest";
import { acceptTerms, hasAcceptedTerms, TERMS_KEY, TERMS_VERSION } from "./terms";

afterEach(() => vi.unstubAllGlobals());

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    api: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  };
}

describe("terms acceptance", () => {
  it("is not accepted before the user agrees", () => {
    const store = memoryStorage();
    vi.stubGlobal("localStorage", store.api);
    expect(hasAcceptedTerms()).toBe(false);
  });

  it("records the current version and timestamp on acceptance", () => {
    const store = memoryStorage();
    vi.stubGlobal("localStorage", store.api);
    expect(acceptTerms(1700)).toBe(true);
    expect(JSON.parse(store.values.get(TERMS_KEY)!)).toEqual({ version: TERMS_VERSION, at: 1700 });
    expect(hasAcceptedTerms()).toBe(true);
  });

  it("treats a different stored version as not accepted", () => {
    const store = memoryStorage({ [TERMS_KEY]: JSON.stringify({ version: TERMS_VERSION + 1, at: 1 }) });
    vi.stubGlobal("localStorage", store.api);
    expect(hasAcceptedTerms()).toBe(false);
  });

  it("returns false when storage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    });
    expect(acceptTerms()).toBe(false);
    expect(hasAcceptedTerms()).toBe(false);
  });
});
