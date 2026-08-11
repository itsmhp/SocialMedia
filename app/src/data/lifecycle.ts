import type { AppState, Bara, BaraHighlight, Room } from "../types";

export const HOUR_MS = 60 * 60 * 1000;

export function secondsLeft(room: Room, now: number): number {
  return Math.max(0, Math.ceil((room.expiresAt - now) / 1000));
}

export function selectedRoom(state: AppState): Room | null {
  return state.rooms.find((room) => room.id === state.activeRoomId) ?? null;
}

export function memberCount(room: Room): number {
  return room.memberIds.length;
}

function reactionCount(message: Room["messages"][number]): number {
  return Object.values(message.reactions).reduce((total, count) => total + count, 0);
}

export function createBara(room: Room, createdAt: number): Bara {
  const eligible = room.messages.filter((message) => !message.system);
  const ranked = [...eligible].sort((left, right) => {
    const byReactions = reactionCount(right) - reactionCount(left);
    return byReactions || left.createdAt - right.createdAt || left.id.localeCompare(right.id);
  });
  const highlights: BaraHighlight[] = ranked.slice(0, 5).map((message) => ({
    messageId: message.id,
    authorId: message.authorId,
    who: message.who,
    avatar: message.avatar,
    text: message.text,
    reactions: reactionCount(message),
  }));

  return {
    id: `bara_${room.id}_${room.expiresAt}`,
    roomId: room.id,
    roomName: room.name,
    spark: room.spark,
    createdAt,
    memberCount: room.memberIds.length,
    messageCount: eligible.length,
    reactionCount: eligible.reduce((total, message) => total + reactionCount(message), 0),
    highlights,
  };
}

export function settleExpiredRooms(state: AppState, now: number): AppState {
  const baras = [...state.baras];
  let changed = false;
  const rooms = state.rooms.map((room) => {
    if (room.status !== "active" || room.expiresAt > now) return room;
    changed = true;
    const bara = createBara(room, now);
    if (!baras.some((existing) => existing.roomId === room.id)) baras.unshift(bara);
    return {
      ...room,
      status: "faded" as const,
      messages: [],
      extend: { ...room.extend, votes: {} },
    };
  });

  return changed ? { ...state, now, rooms, baras } : { ...state, now };
}