import type { AppState, Bara, Circle, Room } from "../types";

export const APP_STATE_KEY = "falo.state";
const VERSION = 2;

type DurableState = Pick<
  AppState,
  "me" | "streak" | "friends" | "moments" | "game" | "circles" | "rooms" | "activeRoomId" | "baras" | "blockedIds"
>;

interface PersistedState extends DurableState {
  version: typeof VERSION;
}

type LegacyRoom = Omit<Room, "circleId"> & { circleId?: string };
type LegacyBara = Omit<Bara, "circleId"> & { circleId?: string };

function circleKey(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function migrateCircles(
  savedRooms: LegacyRoom[],
  savedBaras: LegacyBara[],
): { circles: Circle[]; rooms: Room[]; baras: Bara[] } {
  const circlesByName = new Map<string, Circle>();
  const circleIdByRoom = new Map<string, string>();
  const chronologicalRooms = [...savedRooms].sort((left, right) => left.createdAt - right.createdAt);

  for (const room of chronologicalRooms) {
    const key = circleKey(room.name);
    const current = circlesByName.get(key);
    const circleId = room.circleId ?? current?.id ?? `circle_${room.id}`;
    circlesByName.set(key, {
      id: circleId,
      name: room.name,
      createdBy: room.createdBy,
      memberIds: [...room.memberIds],
      createdAt: Math.min(current?.createdAt ?? room.createdAt, room.createdAt),
    });
    circleIdByRoom.set(room.id, circleId);
  }

  const rooms = savedRooms.map((room) => ({
    ...room,
    circleId: room.circleId ?? circleIdByRoom.get(room.id) ?? `circle_${room.id}`,
  }));
  const baras = savedBaras.map((bara) => ({
    ...bara,
    circleId: bara.circleId
      ?? circleIdByRoom.get(bara.roomId)
      ?? circlesByName.get(circleKey(bara.roomName))?.id
      ?? `circle_${bara.roomId}`,
  }));

  return { circles: [...circlesByName.values()], rooms, baras };
}

export function loadAppState(fallback: AppState, now: number): AppState {
  try {
    const raw = localStorage.getItem(APP_STATE_KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw) as Partial<Omit<PersistedState, "version">> & { version?: number };
    if (
      (saved.version !== 1 && saved.version !== VERSION) ||
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

    const migrated = migrateCircles(
      saved.rooms as LegacyRoom[],
      saved.baras as LegacyBara[],
    );
    const circles = saved.version === VERSION && Array.isArray(saved.circles)
      ? saved.circles
      : migrated.circles;
    const rooms = migrated.rooms;
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
      circles,
      rooms,
      activeRoomId,
      baras: migrated.baras,
      blockedIds: Array.isArray(saved.blockedIds) ? saved.blockedIds : [],
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
    circles: state.circles,
    rooms: state.rooms,
    activeRoomId: state.activeRoomId,
    baras: state.baras,
    blockedIds: state.blockedIds,
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