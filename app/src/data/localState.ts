import type { AppState } from "../types";

export const APP_STATE_KEY = "unggun.state";
const VERSION = 1;

type DurableState = Pick<
  AppState,
  "me" | "streak" | "friends" | "moments" | "game" | "rooms" | "activeRoomId" | "baras"
>;

interface PersistedState extends DurableState {
  version: typeof VERSION;
}

export function loadAppState(fallback: AppState, now: number): AppState {
  try {
    const raw = localStorage.getItem(APP_STATE_KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw) as Partial<PersistedState>;
    if (
      saved.version !== VERSION ||
      !Array.isArray(saved.friends) ||
      !Array.isArray(saved.moments) ||
      !Array.isArray(saved.rooms) ||
      !Array.isArray(saved.baras) ||
      !saved.game ||
      !saved.me ||
      typeof saved.me.id !== "string"
    ) {
      return fallback;
    }

    const rooms = saved.rooms;
    const activeRoomId = rooms.some((room) => room.id === saved.activeRoomId)
      ? saved.activeRoomId ?? null
      : rooms[0]?.id ?? null;

    return {
      ...fallback,
      now,
      me: fallback.onboarded ? fallback.me : saved.me,
      streak: typeof saved.streak === "number" ? saved.streak : fallback.streak,
      friends: saved.friends,
      moments: saved.moments,
      game: saved.game,
      rooms,
      activeRoomId,
      baras: saved.baras,
    };
  } catch {
    return fallback;
  }
}

export function saveAppState(state: AppState): void {
  const saved: PersistedState = {
    version: VERSION,
    me: state.me,
    streak: state.streak,
    friends: state.friends,
    moments: state.moments,
    game: state.game,
    rooms: state.rooms,
    activeRoomId: state.activeRoomId,
    baras: state.baras,
  };
  try {
    localStorage.setItem(APP_STATE_KEY, JSON.stringify(saved));
  } catch {
    // The in-memory app remains usable when storage is unavailable.
  }
}

export function clearAppState(): boolean {
  try {
    localStorage.removeItem(APP_STATE_KEY);
    return true;
  } catch {
    return false;
  }
}