import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppState, Message, Room } from "../types";
import { circleStats, circleSummaries, HOUR_MS, settleExpiredRooms } from "./lifecycle";
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
    circleId: "circle_one",
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
    settingsStack: [],
    now: NOW,
    onboarded: true,
    replayingIntro: false,
    roomListOpen: false,
    roomDetailsOpen: false,
    creatingRoom: false,
    me: { id: "user_me", name: "Same face", avatar: "🦊" },
    friends: [{ id: "user_friend", name: "Same face", avatar: "🦊" }],
    streak: 0,
    moments: [],
    game: { prompts: ["test"], idx: 0, votes: { user_me: 0, user_friend: 0 }, mine: null },
    circles: [{
      id: room.circleId,
      name: room.name,
      createdBy: room.createdBy,
      memberIds: [...room.memberIds],
      createdAt: room.createdAt,
    }],
    rooms: [room],
    activeRoomId: room.id,
    baras: [],
    blockedIds: [],
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

  it("derives private Circle records from its room history", () => {
    const state = appState();
    const stats = circleStats(state, state.circles[0]);

    expect(stats).toEqual({
      ageSeconds: 3600,
      roomCount: 1,
      baraCount: 0,
      extensionCount: 0,
      longestBurnSeconds: 3600,
    });
  });

  it("summarizes joined circles with glowing ones first", () => {
    const base = appState();
    const fadedRoom = {
      ...activeRoom(),
      id: "room_faded",
      circleId: "circle_faded",
      name: "Quiet Circle",
      status: "faded" as const,
      createdAt: NOW - 5 * HOUR_MS,
      messages: [],
    };
    const withTwo: AppState = {
      ...base,
      circles: [
        base.circles[0],
        { id: "circle_faded", name: "Quiet Circle", createdBy: "user_me", memberIds: ["user_me"], createdAt: NOW - 5 * HOUR_MS },
      ],
      rooms: [base.rooms[0], fadedRoom],
      baras: [{
        id: "bara_faded", circleId: "circle_faded", roomId: "room_faded", roomName: "Quiet Circle",
        spark: "gone", createdAt: NOW - HOUR_MS, memberCount: 1, messageCount: 0, reactionCount: 0, highlights: [],
      }],
    };
    const summaries = circleSummaries(withTwo);

    expect(summaries.map((summary) => summary.circle.id)).toEqual(["circle_one", "circle_faded"]);
    expect(summaries[0].glowing).toBe(true);
    expect(summaries[0].targetRoomId).toBe("room_one");
    expect(summaries[1].glowing).toBe(false);
    expect(summaries[1].targetRoomId).toBe("room_faded");
    expect(summaries[1].baraCount).toBe(1);
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

  it("migrates version-one rooms and Bara into a permanent Circle", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    const state = settleExpiredRooms(appState(), NOW + 60_001);
    const { circleId: _roomCircleId, ...legacyRoom } = state.rooms[0];
    const { circleId: _baraCircleId, ...legacyBara } = state.baras[0];
    storage.set(APP_STATE_KEY, JSON.stringify({
      version: 1,
      me: state.me,
      streak: state.streak,
      friends: state.friends,
      moments: state.moments,
      game: state.game,
      rooms: [legacyRoom],
      activeRoomId: legacyRoom.id,
      baras: [legacyBara],
    }));

    const restored = loadAppState(appState(), NOW + 120_000);

    expect(restored.circles).toHaveLength(1);
    expect(restored.rooms[0].circleId).toBe(restored.circles[0].id);
    expect(restored.baras[0].circleId).toBe(restored.circles[0].id);
    expect(restored.baras[0].highlights).toEqual(legacyBara.highlights);
  });
});

describe("settings state", () => {
  it("returns from nested Settings to the room hierarchy", () => {
    const state = appState();
    const opened = reducer(state, { type: "OPEN_SETTINGS" });
    const nested = reducer(opened, { type: "OPEN_SETTINGS_PAGE", page: "profile" });
    const home = reducer(nested, { type: "SETTINGS_BACK" });
    const closed = reducer(home, { type: "SETTINGS_BACK" });

    expect(nested.settingsStack).toEqual(["home", "profile"]);
    expect(closed.settingsStack).toEqual([]);
    expect(closed.activeRoomId).toBe(state.activeRoomId);
  });

  it("clears activity while retaining the profile and circle contacts", () => {
    const state = { ...appState(), streak: 3, moments: [{
      id: "moment_one",
      authorId: "user_me",
      who: "Same face",
      avatar: "🦊",
      mood: "🔥",
      time: "now",
      createdAt: NOW,
      text: "A moment",
      reactions: {},
      mine: [],
    }] };
    const cleared = reducer(state, { type: "CLEAR_LOCAL_ACTIVITY" });

    expect(cleared.me).toEqual(state.me);
    expect(cleared.friends).toEqual(state.friends);
    expect(cleared.rooms).toEqual([]);
    expect(cleared.circles).toEqual([]);
    expect(cleared.moments).toEqual([]);
    expect(cleared.baras).toEqual([]);
    expect(cleared.streak).toBe(0);
    expect(cleared.game.mine).toBeNull();
  });

  it("resets to an empty first-install state", () => {
    const reset = reducer(appState(), { type: "RESET_APP", userId: "user_fresh", now: NOW + 1 });

    expect(reset.onboarded).toBe(false);
    expect(reset.me.id).toBe("user_fresh");
    expect(reset.friends).toEqual([]);
    expect(reset.rooms).toEqual([]);
    expect(reset.circles).toEqual([]);
    expect(reset.moments).toEqual([]);
    expect(reset.baras).toEqual([]);
  });
});

describe("local room membership", () => {
  it("lets the host remove a member without deleting their message history", () => {
    const base = appState();
    const state: AppState = {
      ...base,
      friends: [
        ...base.friends,
        { id: "user_other", name: "Other", avatar: "🌙" },
        { id: "user_removed", name: "Removed", avatar: "⚡" },
      ],
      circles: [{
        ...base.circles[0],
        memberIds: ["user_me", "user_friend", "user_other", "user_removed"],
      }],
      rooms: [{
        ...base.rooms[0],
        memberIds: ["user_me", "user_friend", "user_other", "user_removed"],
        extend: {
          ...base.rooms[0].extend,
          votes: { user_me: "keep", user_friend: "keep" },
        },
      }],
    };
    const removed = reducer(state, {
      type: "REMOVE_ROOM_MEMBER",
      roomId: "room_one",
      memberId: "user_removed",
    });

    expect(removed.rooms[0].memberIds).toEqual(["user_me", "user_friend", "user_other"]);
    expect(removed.circles[0].memberIds).toEqual(["user_me", "user_friend", "user_other"]);
    expect(removed.rooms[0].messages).toEqual(state.rooms[0].messages);
    expect(removed.rooms[0].extend.votes).toEqual({});
  });

  it("requires the current host to transfer ownership to an active member", () => {
    const state = appState();
    const transferred = reducer(state, {
      type: "TRANSFER_ROOM_OWNER",
      roomId: "room_one",
      memberId: "user_friend",
    });
    const secondTransfer = reducer(transferred, {
      type: "TRANSFER_ROOM_OWNER",
      roomId: "room_one",
      memberId: "user_me",
    });

    expect(transferred.rooms[0].createdBy).toBe("user_friend");
    expect(transferred.circles[0].createdBy).toBe("user_friend");
    expect(secondTransfer).toBe(transferred);
  });

  it("lets a non-host leave and selects another visible room", () => {
    const state = appState();
    const otherRoom = { ...activeRoom(), id: "room_two", circleId: "circle_two", name: "Next Room" };
    const memberState: AppState = {
      ...state,
      roomDetailsOpen: true,
      circles: [
        { ...state.circles[0], createdBy: "user_friend" },
        {
          id: otherRoom.circleId,
          name: otherRoom.name,
          createdBy: "user_me",
          memberIds: [...otherRoom.memberIds],
          createdAt: otherRoom.createdAt,
        },
      ],
      rooms: [{ ...state.rooms[0], createdBy: "user_friend" }, otherRoom],
    };
    const left = reducer(memberState, { type: "LEAVE_ROOM", roomId: "room_one" });

    expect(left.rooms.map((room) => room.id)).toEqual(["room_two"]);
    expect(left.circles.map((circle) => circle.id)).toEqual(["circle_two"]);
    expect(left.activeRoomId).toBe("room_two");
    expect(left.roomDetailsOpen).toBe(false);
  });

  it("does not let the host leave before transferring ownership", () => {
    const state = appState();
    expect(reducer(state, { type: "LEAVE_ROOM", roomId: "room_one" })).toBe(state);
  });
});