import { describe, expect, it } from "vitest";
import type { AppState, Room } from "../types";
import { createBara, HOUR_MS } from "./lifecycle";
import { reducer } from "./store";

const NOW = 1_800_000_000_000;

function room(): Room {
  return {
    id: "room_one",
    circleId: "circle_one",
    name: "Night Crew",
    spark: "Who is still awake?",
    createdBy: "user_me",
    memberIds: ["user_me", "user_friend"],
    createdAt: NOW - HOUR_MS,
    expiresAt: NOW + HOUR_MS,
    durationHours: 12,
    status: "active",
    extensionCount: 0,
    maxExtensions: 3,
    extend: { cycle: 0, thresholdSec: 2 * 3600, votes: {} },
    messages: [],
  };
}

function state(): AppState {
  const active = room();
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
    game: { prompts: ["test"], idx: 0, votes: {}, mine: null },
    circles: [{
      id: active.circleId,
      name: active.name,
      createdBy: active.createdBy,
      memberIds: [...active.memberIds],
      createdAt: active.createdAt,
    }],
    rooms: [active],
    activeRoomId: active.id,
    baras: [],
    blockedIds: [],
  };
}

describe("sparks", () => {
  it("posts a prompt spark as a room message that fades with the room", () => {
    const posted = reducer(state(), {
      type: "POST_SPARK",
      id: "message_spark",
      spark: { kind: "prompt", label: "Challenge", text: "Send a selfie doing your worst dance." },
      now: NOW,
    });
    const message = posted.rooms[0].messages[0];

    expect(message.spark).toEqual({ kind: "prompt", label: "Challenge", text: "Send a selfie doing your worst dance." });
    expect(message.text).toBe("Send a selfie doing your worst dance.");
    expect(message.authorId).toBe("user_me");
  });

  it("toggles a single poll vote per member", () => {
    const posted = reducer(state(), {
      type: "POST_SPARK",
      id: "message_poll",
      spark: { kind: "poll", question: "Coffee or tea?", options: ["Coffee", "Tea"], votes: {} },
      now: NOW,
    });
    const voted = reducer(posted, { type: "VOTE_SPARK", messageId: "message_poll", option: 0 });
    const movedVote = reducer(voted, { type: "VOTE_SPARK", messageId: "message_poll", option: 1 });
    const cleared = reducer(movedVote, { type: "VOTE_SPARK", messageId: "message_poll", option: 1 });

    const poll = (s: AppState) => {
      const message = s.rooms[0].messages[0];
      return message.spark?.kind === "poll" ? message.spark.votes : {};
    };
    expect(poll(voted)).toEqual({ user_me: 0 });
    expect(poll(movedVote)).toEqual({ user_me: 1 });
    expect(poll(cleared)).toEqual({});
  });

  it("ignores out-of-range poll options", () => {
    const posted = reducer(state(), {
      type: "POST_SPARK",
      id: "message_poll",
      spark: { kind: "poll", question: "Coffee or tea?", options: ["Coffee", "Tea"], votes: {} },
      now: NOW,
    });
    const unchanged = reducer(posted, { type: "VOTE_SPARK", messageId: "message_poll", option: 5 });
    expect(unchanged).toBe(posted);
  });

  it("keeps a message for Bara and ranks kept messages first", () => {
    const base = state();
    const withMessages: AppState = {
      ...base,
      rooms: [{
        ...base.rooms[0],
        messages: [
          { id: "m_hot", authorId: "user_friend", who: "Friend", avatar: "🌙", text: "Popular", time: "now", createdAt: NOW - 3000, reactions: { "🔥": 9 }, mine: [] },
          { id: "m_keep", authorId: "user_me", who: "Me", avatar: "🦊", text: "Quiet but ours", time: "now", createdAt: NOW - 2000, reactions: { "🔥": 0 }, mine: [] },
        ],
      }],
    };
    const kept = reducer(withMessages, { type: "TOGGLE_KEEP", messageId: "m_keep" });
    const bara = createBara(kept.rooms[0], NOW);

    expect(kept.rooms[0].messages.find((m) => m.id === "m_keep")?.keep).toBe(true);
    expect(bara.highlights[0].messageId).toBe("m_keep");
    expect(bara.highlights[1].messageId).toBe("m_hot");
  });

  it("does not keep or vote on messages once the room has faded", () => {
    const faded: AppState = {
      ...state(),
      rooms: [{ ...room(), status: "faded", messages: [] }],
    };
    expect(reducer(faded, { type: "TOGGLE_KEEP", messageId: "whatever" })).toBe(faded);
    expect(reducer(faded, { type: "POST_SPARK", id: "x", spark: { kind: "prompt", label: "L", text: "T" }, now: NOW })).toBe(faded);
  });
});
