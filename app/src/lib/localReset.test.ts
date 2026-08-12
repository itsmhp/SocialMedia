import { afterEach, describe, expect, it, vi } from "vitest";
import { APP_STATE_KEY } from "../data/localState";
import { PREFERENCES_KEY } from "./preferences";
import { PROFILE_KEY } from "./profile";
import { TERMS_KEY } from "./terms";
import { resetLocalStorage } from "./localReset";
import { PENDING_INVITE_KEY } from "./invite";

const initial = new Map([
  [APP_STATE_KEY, "state"],
  [PROFILE_KEY, "profile"],
  [PREFERENCES_KEY, "preferences"],
  [TERMS_KEY, "terms"],
]);

afterEach(() => vi.unstubAllGlobals());

function storage(failRemoveAt?: number, failSessionRemove = false) {
  const values = new Map(initial);
  const sessionValues = new Map([[PENDING_INVITE_KEY, "a".repeat(48)]]);
  let removals = 0;
  return {
    values,
    sessionValues,
    api: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => {
        removals += 1;
        if (removals === failRemoveAt) throw new Error("blocked");
        values.delete(key);
      },
    },
    sessionApi: {
      getItem: (key: string) => sessionValues.get(key) ?? null,
      setItem: (key: string, value: string) => sessionValues.set(key, value),
      removeItem: (key: string) => {
        if (failSessionRemove) throw new Error("blocked");
        sessionValues.delete(key);
      },
    },
  };
}

describe("full local reset", () => {
  it("removes all Falò storage together", () => {
    const stub = storage();
    vi.stubGlobal("localStorage", stub.api);
    vi.stubGlobal("sessionStorage", stub.sessionApi);
    expect(resetLocalStorage()).toBe(true);
    expect(stub.values.size).toBe(0);
    expect(stub.sessionValues.size).toBe(0);
  });

  it.each([1, 2, 3, 4])("restores the previous values when removal %i fails", (failure) => {
    const stub = storage(failure);
    vi.stubGlobal("localStorage", stub.api);
    vi.stubGlobal("sessionStorage", stub.sessionApi);
    expect(resetLocalStorage()).toBe(false);
    expect(stub.values).toEqual(initial);
    expect(stub.sessionValues.get(PENDING_INVITE_KEY)).toBe("a".repeat(48));
  });

  it("restores local data when the pending invite cannot be removed", () => {
    const stub = storage(undefined, true);
    vi.stubGlobal("localStorage", stub.api);
    vi.stubGlobal("sessionStorage", stub.sessionApi);
    expect(resetLocalStorage()).toBe(false);
    expect(stub.values).toEqual(initial);
    expect(stub.sessionValues.get(PENDING_INVITE_KEY)).toBe("a".repeat(48));
  });
});