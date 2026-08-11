import type { Me } from "../types";

const KEY = "unggun.profile";

/** Reads the saved profile from this device, or null on first run / bad data. */
export function loadProfile(): Me | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<Me>;
    if (p && typeof p.name === "string" && typeof p.avatar === "string") {
      return { name: p.name, avatar: p.avatar };
    }
  } catch {
    // ignore unavailable / malformed storage
  }
  return null;
}

export function saveProfile(me: Me): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(me));
  } catch {
    // ignore unavailable storage (e.g. private mode)
  }
}
