import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppState, Message, Room } from "../types";
import { HOUR_MS, settleExpiredRooms } from "./lifecycle";
import { APP_STATE_KEY, loadAppState, saveAppState } from "./localState";
import { majorityOf, reducer } from "./store";

const NOW = 1_800_000_000_000;

function message(id: string, authorId: string, text: string, reactions: number, createdAt: number): Message {
  return {
    id,
    authorId,
    who: authorId === "user_me" ? "Same face" : "Friend",
    avatar: "🦊",
    text,
    time: "now",
    createdAt,
    reactions: { "🔥": reactions },
    mine: [],
  };
}

function activeRoom(): Room {
  return {
    id: "room_one",
    name: "Night Crew",
    spark: "Who is still awake?",
    createdBy: "user_me",
    memberIds: ["user_me", "user_friend"],
    createdAt: NOW - HOUR_MS,
    expiresAt: NOW + 60_000,
    durationHours: 12,
    status: "active",
    extensionCount: 0,
    maxExtensions: 3,
    extend: {
      cycle: 0,
      thresholdSec: 2 * 3600,
      votes: { user_friend: "keep" },
    },
    messages: [
      message("message_one", "user_me", "First ember", 1, NOW - 2_000),
      message("message_two", "user_friend", "Warmest ember", 4, NOW - 1_000),
    ],
  };
}

function appState(): AppState {
  const room = activeRoom();
  return {
    screen: "chat",
    now: NOW,
    onboarded: true,
    editingProfile: false,
    roomListOpen: false,
    creatingRoom: false,
    me: { id: "user_me", name: "Same face", avatar: "🦊" },
    friends: [{ id: "user_friend", name: "Same face", avatar: "🦊" }],
    streak: 0,
    moments: [],
    game: { prompts: ["test"], idx: 0, votes: { user_me: 0, user_friend: 0 }, mine: null },
    rooms: [room],
    activeRoomId: room.id,
    baras: [],
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("room lifecycle", () => {
  it("requires more than half for odd and even circles", () => {
    expect(majorityOf(1)).toBe(1);
    expect(majorityOf(5)).toBe(3);
    expect(majorityOf(6)).toBe(4);
  });

  it("counts users with duplicate names and avatars as separate voters", () => {
    const state = appState();
    const result = reducer(state, {
      type: "CAST_EXTEND_VOTE",
      choice: "keep",
      systemMessageId: "message_system",
      now: NOW,
    });
    const room = result.rooms[0];

    expect(room.extensionCount).toBe(1);
    expect(room.expiresAt).toBe(state.rooms[0].expiresAt + 24 * HOUR_MS);
    expect(room.extend.cycle).toBe(1);
    expect(room.extend.votes).toEqual({});
    expect(room.messages[room.messages.length - 1]?.id).toBe("message_system");
  });

  it("fades once, deletes raw chat, and ranks deterministic Bara highlights", () => {
    const faded = settleExpiredRooms(appState(), NOW + 60_001);
    const settledAgain = settleExpiredRooms(faded, NOW + 120_000);

    expect(faded.rooms[0].status).toBe("faded");
    expect(faded.rooms[0].messages).toEqual([]);
    expect(faded.baras).toHaveLength(1);
    expect(faded.baras[0].messageCount).toBe(2);
    expect(faded.baras[0].reactionCount).toBe(5);
    expect(faded.baras[0].highlights.map((highlight) => highlight.messageId)).toEqual([
      "message_two",
      "message_one",
    ]);
    expect(settledAgain.baras).toHaveLength(1);
  });

  it("relights a faded room without restoring its deleted chat", () => {
    const faded = settleExpiredRooms(appState(), NOW + 60_001);
    const relit = reducer(faded, {
      type: "RELIGHT_ROOM",
      sourceRoomId: "room_one",
      roomId: "room_two",
      messageId: "message_relit",
      now: NOW + 61_000,
    });

    expect(relit.rooms[0].id).toBe("room_two");
    expect(relit.rooms[0].status).toBe("active");
    expect(relit.rooms[0].messages.map((item) => item.id)).toEqual(["message_relit"]);
    expect(relit.rooms.find((room) => room.id === "room_one")?.messages).toEqual([]);
    expect(relit.baras).toHaveLength(1);
  });

  it("restores durable room activity across reload", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    const state = appState();
    const sent = reducer(state, {
      type: "SEND_MESSAGE",
      id: "message_persisted",
      text: "Still here after reload",
      now: NOW + 1_000,
    });

    saveAppState(sent);
    const restored = loadAppState(appState(), NOW + 2_000);

    expect(storage.has(APP_STATE_KEY)).toBe(true);
    const restoredMessages = restored.rooms[0].messages;
    expect(restoredMessages[restoredMessages.length - 1]?.id).toBe("message_persisted");
    expect(restored.rooms[0].expiresAt).toBe(sent.rooms[0].expiresAt);
  });
});