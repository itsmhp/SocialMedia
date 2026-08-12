import type { AppState, Member, Message, Room } from "../types";
import { makeId } from "../lib/id";
import { loadProfile } from "../lib/profile";

const friends: Member[] = [
  { id: "user_dinda", name: "Dinda", avatar: "🌸" },
  { id: "user_raka", name: "Raka", avatar: "🎧" },
  { id: "user_sasa", name: "Sasa", avatar: "🐱" },
  { id: "user_bagas", name: "Bagas", avatar: "⚡" },
  { id: "user_nadia", name: "Nadia", avatar: "🌙" },
];

function seededMessages(now: number): Message[] {
  return [
    { id: "c1", authorId: "user_dinda", who: "Dinda", avatar: "🌸", text: "ok who else is NOT sleeping rn 😭", time: "20:14", createdAt: now - 6 * 60_000, reactions: { "😂": 2, "❤️": 0, "🔥": 0 }, mine: [] },
    { id: "c2", authorId: "user_raka", who: "Raka", avatar: "🎧", text: "me. third coffee. send help ☕", time: "20:15", createdAt: now - 5 * 60_000, reactions: { "😂": 3, "❤️": 1, "🔥": 0 }, mine: [] },
    { id: "c3", authorId: "user_sasa", who: "Sasa", avatar: "🐱", text: "just saw a cat that looks EXACTLY like Bagas lmaooo", time: "20:16", createdAt: now - 4 * 60_000, reactions: { "😂": 4, "❤️": 0, "🔥": 2 }, mine: [] },
    { id: "c4", authorId: "user_bagas", who: "Bagas", avatar: "⚡", text: "excuse me i am far more handsome 💅", time: "20:16", createdAt: now - 3 * 60_000, reactions: { "😂": 5, "❤️": 1, "🔥": 0 }, mine: [] },
    { id: "c5", authorId: "user_nadia", who: "Nadia", avatar: "🌙", text: "this room fades tomorrow and i already miss the chaos 🥲", time: "20:18", createdAt: now - 2 * 60_000, reactions: { "😂": 1, "❤️": 3, "🔥": 0 }, mine: [] },
    { id: "c6", authorId: "user_raka", who: "Raka", avatar: "🎧", text: "wait the countdown says under 2h?? i'm not done being unhinged 😩", time: "20:19", createdAt: now - 60_000, reactions: { "😂": 2, "❤️": 1, "🔥": 0 }, mine: [] },
  ];
}

/**
 * Mock seed data — the app runs entirely on this until the Supabase data
 * layer is wired in (see README "Roadmap"). The room starts near expiry so
 * the extend-by-vote card is visible immediately.
 */
export function createSeedState(now = Date.now()): AppState {
  const savedProfile = loadProfile();
  const me = savedProfile ?? { id: makeId("user"), name: "You", avatar: "🦊" };
  const circleId = "circle_dusk_crew";
  const room: Room = {
    id: "room_dusk_crew",
    circleId,
    name: "Dusk Crew",
    spark: "Who's still awake?",
    createdBy: "user_dinda",
    memberIds: [me.id, ...friends.map((friend) => friend.id)],
    createdAt: now - 22 * 60 * 60_000,
    expiresAt: now + (1 * 3600 + 59 * 60 + 30) * 1000,
    durationHours: 24,
    status: "active",
    extensionCount: 0,
    maxExtensions: 3,
    extend: {
      cycle: 0,
      thresholdSec: 2 * 3600,
      votes: { user_dinda: "keep", user_raka: "keep", user_sasa: "keep" },
    },
    messages: seededMessages(now),
  };

  return {
    settingsStack: [],
    now,
    onboarded: savedProfile !== null,
    replayingIntro: false,
    roomListOpen: true,
    roomDetailsOpen: false,
    creatingRoom: false,
    me,
    streak: 0,
    friends,
    moments: [
      { id: "m1", authorId: "user_dinda", who: "Dinda", avatar: "🌸", mood: "😌", time: "1h ago", createdAt: now - 60 * 60_000, text: "Found an amazing iced latte near campus, you have to try it ☕", reactions: { "❤️": 3, "😂": 0, "🔥": 2, "🙌": 0 }, mine: [] },
      { id: "m2", authorId: "user_raka", who: "Raka", avatar: "🎧", mood: "🎶", time: "2h ago", createdAt: now - 2 * 60 * 60_000, text: "Playing my sad-boy playlist, anyone want to keep me company? lol", reactions: { "❤️": 2, "😂": 1, "🔥": 0, "🙌": 0 }, mine: [] },
      { id: "m3", authorId: "user_sasa", who: "Sasa", avatar: "🐱", mood: "🥰", time: "3h ago", createdAt: now - 3 * 60 * 60_000, text: "The campus cat keeps getting chubbier because I keep feeding it 🐈", reactions: { "❤️": 4, "😂": 0, "🔥": 0, "🙌": 1 }, mine: [] },
      { id: "m4", authorId: "user_bagas", who: "Bagas", avatar: "⚡", mood: "😮\u200d💨", time: "5h ago", createdAt: now - 5 * 60 * 60_000, text: "Finished my assignment at 3am. Someone please invite me out so I stay sane 😭", reactions: { "❤️": 1, "😂": 2, "🔥": 1, "🙌": 0 }, mine: [] },
    ],
    game: {
      prompts: [
        "be late to morning class ⏰",
        "treat everyone when they've got some cash 💸",
        "fall asleep during a movie night 😴",
        "spontaneously plan a hangout ✨",
      ],
      idx: 0,
      votes: { [me.id]: 0, user_dinda: 2, user_raka: 1, user_sasa: 0, user_bagas: 3, user_nadia: 1 },
      mine: null,
    },
    circles: [{
      id: circleId,
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
