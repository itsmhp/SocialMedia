import type { AppState, Bara, BaraHighlight, Circle, Room } from "../types";

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

export function circleStats(state: AppState, circle: Circle) {
  const rooms = state.rooms.filter((room) => room.circleId === circle.id);
  let longestBurnSeconds = 0;
  let extensionCount = 0;
  for (const room of rooms) {
    const burnEnd = room.status === "active" ? Math.min(state.now, room.expiresAt) : room.expiresAt;
    longestBurnSeconds = Math.max(longestBurnSeconds, Math.floor((burnEnd - room.createdAt) / 1000));
    extensionCount += room.extensionCount;
  }
  return {
    ageSeconds: Math.max(0, Math.floor((state.now - circle.createdAt) / 1000)),
    roomCount: rooms.length,
    baraCount: state.baras.filter((bara) => bara.circleId === circle.id).length,
    extensionCount,
    longestBurnSeconds: Math.max(0, longestBurnSeconds),
  };
}

export interface CircleSummary {
  circle: Circle;
  glowing: boolean;
  targetRoomId: string | null;
  spark: string;
  expiresAt: number | null;
  updatedAt: number;
  baraCount: number;
}

export function circleSummaries(state: AppState): CircleSummary[] {
  const summaries = state.circles.map((circle) => {
    const rooms = state.rooms.filter((room) => room.circleId === circle.id);
    const active = rooms.find((room) => room.status === "active") ?? null;
    const latest = rooms.reduce<Room | null>(
      (chosen, room) => (!chosen || room.createdAt > chosen.createdAt ? room : chosen),
      null,
    );
    const target = active ?? latest;
    return {
      circle,
      glowing: Boolean(active),
      targetRoomId: target?.id ?? null,
      spark: target?.spark ?? "",
      expiresAt: active?.expiresAt ?? null,
      updatedAt: target?.createdAt ?? circle.createdAt,
      baraCount: state.baras.filter((bara) => bara.circleId === circle.id).length,
    };
  });
  return summaries.sort((left, right) => {
    if (left.glowing !== right.glowing) return left.glowing ? -1 : 1;
    if (left.glowing && right.glowing) return (left.expiresAt ?? 0) - (right.expiresAt ?? 0);
    return right.updatedAt - left.updatedAt;
  });
}

function reactionCount(message: Room["messages"][number]): number {
  return Object.values(message.reactions).reduce((total, count) => total + count, 0);
}

export function createBara(room: Room, createdAt: number, blockedIds: string[] = []): Bara {
  const eligible = room.messages.filter((message) => (
    !message.system && !(message.authorId && blockedIds.includes(message.authorId))
  ));
  const ranked = [...eligible].sort((left, right) => {
    const byKeep = Number(Boolean(right.keep)) - Number(Boolean(left.keep));
    if (byKeep) return byKeep;
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
    circleId: room.circleId,
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
    const bara = createBara(room, now, state.blockedIds);
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