import { APP_STATE_KEY } from "../data/localState";
import { PREFERENCES_KEY } from "./preferences";
import { PROFILE_KEY } from "./profile";
import { clearPendingInviteToken, PENDING_INVITE_KEY } from "./invite";

const LOCAL_KEYS = [APP_STATE_KEY, PROFILE_KEY, PREFERENCES_KEY] as const;

export function resetLocalStorage(): boolean {
  const snapshot = new Map<string, string | null>();
  let pendingInvite: string | null = null;
  try {
    for (const key of LOCAL_KEYS) snapshot.set(key, localStorage.getItem(key));
    pendingInvite = sessionStorage.getItem(PENDING_INVITE_KEY);
    for (const key of LOCAL_KEYS) localStorage.removeItem(key);
    if (!clearPendingInviteToken()) throw new Error("Pending invite could not be cleared.");
    return true;
  } catch {
    try {
      for (const [key, value] of snapshot) {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      }
      if (pendingInvite === null) sessionStorage.removeItem(PENDING_INVITE_KEY);
      else sessionStorage.setItem(PENDING_INVITE_KEY, pendingInvite);
    } catch {
      // Best-effort rollback; the caller keeps the current in-memory session intact.
    }
    return false;
  }
}