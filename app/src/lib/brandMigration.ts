import { APP_STATE_KEY } from "../data/localState";
import { PROFILE_KEY } from "./profile";
import { PREFERENCES_KEY } from "./preferences";
import { TERMS_KEY } from "./terms";
import { PENDING_INVITE_KEY } from "./invite";

const LOCAL_KEY_MAP: [string, string][] = [
  ["unggun.state", APP_STATE_KEY],
  ["unggun.profile", PROFILE_KEY],
  ["unggun.preferences", PREFERENCES_KEY],
  ["unggun.terms", TERMS_KEY],
];

const SESSION_KEY_MAP: [string, string][] = [
  ["unggun.pendingInvite", PENDING_INVITE_KEY],
];

function rename(storage: Storage, pairs: [string, string][]): void {
  for (const [legacyKey, currentKey] of pairs) {
    if (legacyKey === currentKey) continue;
    try {
      const legacyValue = storage.getItem(legacyKey);
      if (legacyValue === null) continue;
      if (storage.getItem(currentKey) === null) storage.setItem(currentKey, legacyValue);
      storage.removeItem(legacyKey);
    } catch {
      // ignore unavailable storage
    }
  }
}

/** Carry data saved under the previous "unggun.*" brand over to the current "falo.*" keys. */
export function migrateBrandKeys(): void {
  try { rename(localStorage, LOCAL_KEY_MAP); } catch { /* ignore unavailable storage */ }
  try { rename(sessionStorage, SESSION_KEY_MAP); } catch { /* ignore unavailable storage */ }
}
