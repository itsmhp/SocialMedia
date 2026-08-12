import type { Me } from "../types";
import { makeId } from "./id";

export const PROFILE_KEY = "falo.profile";

/** Reads the saved profile from this device, or null on first run / bad data. */
export function loadProfile(): Me | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<Me>;
    if (p && typeof p.name === "string" && typeof p.avatar === "string") {
      const profile = {
        id: typeof p.id === "string" && p.id ? p.id : makeId("user"),
        name: p.name,
        avatar: p.avatar,
      };
      if (!p.id) saveProfile(profile);
      return profile;
    }
  } catch {
    // ignore unavailable / malformed storage
  }
  return null;
}

export function saveProfile(me: Me): boolean {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(me));
    return true;
  } catch {
    return false;
  }
}

export function clearProfile(): boolean {
  try {
    localStorage.removeItem(PROFILE_KEY);
    return true;
  } catch {
    return false;
  }
}
