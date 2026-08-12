import { describe, expect, it } from "vitest";
import type { AppState, Message, Room } from "../types";
import { createBara, HOUR_MS } from "./lifecycle";
import { reducer } from "./store";

const NOW = 1_800_000_000_000;

function message(id: string, authorId: string, text: string): Message {
  return { id, authorId, who: authorId, avatar: "🦊", text, time: "now", createdAt: NOW - 1000, reactions: { "🔥": 0 }, mine: [] };
}

function room(hostId: string): Room {
  return {
    id: "room_one",
    circleId: "circle_one",
    name: "Crew",
    spark: "hi",
    createdBy: hostId,
    memberIds: ["user_me", "user_friend"],
    createdAt: NOW - HOUR_MS,
    expiresAt: NOW + HOUR_MS,
    durationHours: 12,
    status: "active",
    extensionCount: 0,
    maxExtensions: 3,
    extend: { cycle: 0, thresholdSec: 2 * 3600, votes: {} },
    messages: [message("m_me", "user_me", "mine"), message("m_friend", "user_friend", "theirs")],
  };
}

function state(hostId = "user_me"): AppState {
  const active = room(hostId);
  return {
    settingsStack: [],
    now: NOW,
    onboarded: true,
    replayingIntro: false,
    roomListOpen: false,
    roomDetailsOpen: false,
    creatingRoom: false,
    me: { id: "user_me", name: "Me", avatar: "🦊" },
    friends: [{ id: "user_friend", name: "Friend", avatar: "🌙" }],
    streak: 0,
    moments: [],
    game: { prompts: ["t"], idx: 0, votes: {}, mine: null },
    circles: [{ id: "circle_one", name: "Crew", createdBy: hostId, memberIds: ["user_me", "user_friend"], createdAt: active.createdAt }],
    rooms: [active],
    activeRoomId: active.id,
    baras: [],
    blockedIds: [],
  };
}

describe("safety: delete, block, report", () => {
  it("lets the author delete their own message", () => {
    const result = reducer(state("user_friend"), { type: "DELETE_MESSAGE", messageId: "m_me" });
    expect(result.rooms[0].messages.map((m) => m.id)).toEqual(["m_friend"]);
  });

  it("does not let a non-host delete someone else's message", () => {
    const base = state("user_friend");
    const result = reducer(base, { type: "DELETE_MESSAGE", messageId: "m_friend" });
    expect(result).toBe(base);
  });

  it("lets the Circle host delete any message", () => {
    const result = reducer(state("user_me"), { type: "DELETE_MESSAGE", messageId: "m_friend" });
    expect(result.rooms[0].messages.map((m) => m.id)).toEqual(["m_me"]);
  });

  it("toggles block and never blocks yourself", () => {
    const blocked = reducer(state(), { type: "TOGGLE_BLOCK_MEMBER", memberId: "user_friend" });
    expect(blocked.blockedIds).toEqual(["user_friend"]);
    const unblocked = reducer(blocked, { type: "TOGGLE_BLOCK_MEMBER", memberId: "user_friend" });
    expect(unblocked.blockedIds).toEqual([]);
    expect(reducer(state(), { type: "TOGGLE_BLOCK_MEMBER", memberId: "user_me" }).blockedIds).toEqual([]);
  });

  it("excludes blocked authors from a Bara recap", () => {
    const bara = createBara(room("user_me"), NOW, ["user_friend"]);
    expect(bara.highlights.map((h) => h.messageId)).toEqual(["m_me"]);
    expect(bara.messageCount).toBe(1);
  });

  it("acknowledges a report", () => {
    const result = reducer(state(), { type: "REPORT", targetId: "user_friend" });
    expect(result.toast).toMatch(/report/i);
  });
});
