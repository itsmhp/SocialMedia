import type { AppState } from "../types";
import { loadProfile } from "../lib/profile";

const savedProfile = loadProfile();

/**
 * Mock seed data — the app runs entirely on this until the Supabase data
 * layer is wired in (see README "Roadmap"). The room starts near expiry so
 * the extend-by-vote card is visible immediately.
 */
export const seedState: AppState = {
  screen: "chat",
  onboarded: savedProfile !== null,
  editingProfile: false,
  me: savedProfile ?? { name: "You", avatar: "🦊" },
  streak: 5,
  friends: [
    { name: "Dinda", avatar: "🌸" },
    { name: "Raka", avatar: "🎧" },
    { name: "Sasa", avatar: "🐱" },
    { name: "Bagas", avatar: "⚡" },
    { name: "Nadia", avatar: "🌙" },
  ],
  moments: [
    { id: "m1", who: "Dinda", avatar: "🌸", mood: "😌", time: "1h ago", text: "Found an amazing iced latte near campus, you have to try it ☕", reactions: { "❤️": 3, "😂": 0, "🔥": 2, "🙌": 0 }, mine: [] },
    { id: "m2", who: "Raka", avatar: "🎧", mood: "🎶", time: "2h ago", text: "Playing my sad-boy playlist, anyone want to keep me company? lol", reactions: { "❤️": 2, "😂": 1, "🔥": 0, "🙌": 0 }, mine: [] },
    { id: "m3", who: "Sasa", avatar: "🐱", mood: "🥰", time: "3h ago", text: "The campus cat keeps getting chubbier because I keep feeding it 🐈", reactions: { "❤️": 4, "😂": 0, "🔥": 0, "🙌": 1 }, mine: [] },
    { id: "m4", who: "Bagas", avatar: "⚡", mood: "😮\u200d💨", time: "5h ago", text: "Finished my assignment at 3am. Someone please invite me out so I stay sane 😭", reactions: { "❤️": 1, "😂": 2, "🔥": 1, "🙌": 0 }, mine: [] },
  ],
  game: {
    prompts: [
      "be late to morning class ⏰",
      "treat everyone when they've got some cash 💸",
      "fall asleep during a movie night 😴",
      "spontaneously plan a hangout ✨",
    ],
    idx: 0,
    votes: { You: 0, Dinda: 2, Raka: 1, Sasa: 0, Bagas: 3, Nadia: 1 },
    mine: null,
  },
  room: {
    name: "Dusk Crew",
    membersLabel: "6 people · private room",
    remaining: 1 * 3600 + 59 * 60 + 30,
    extend: {
      thresholdSec: 2 * 3600,
      members: 6,
      keep: ["🌸", "🎧", "🐱"],
      myVote: null,
      resolved: false,
    },
    messages: [
      { id: "c1", who: "Dinda", avatar: "🌸", text: "ok who else is NOT sleeping rn 😭", time: "20:14", reactions: { "😂": 2, "❤️": 0, "🔥": 0 }, mine: [] },
      { id: "c2", who: "Raka", avatar: "🎧", text: "me. third coffee. send help ☕", time: "20:15", reactions: { "😂": 3, "❤️": 1, "🔥": 0 }, mine: [] },
      { id: "c3", who: "Sasa", avatar: "🐱", text: "just saw a cat that looks EXACTLY like Bagas lmaooo", time: "20:16", reactions: { "😂": 4, "❤️": 0, "🔥": 2 }, mine: [] },
      { id: "c4", who: "Bagas", avatar: "⚡", text: "excuse me i am far more handsome 💅", time: "20:16", reactions: { "😂": 5, "❤️": 1, "🔥": 0 }, mine: [] },
      { id: "c5", who: "Nadia", avatar: "🌙", text: "this room fades tomorrow and i already miss the chaos 🥲", time: "20:18", reactions: { "😂": 1, "❤️": 3, "🔥": 0 }, mine: [] },
      { id: "c6", who: "Raka", avatar: "🎧", text: "wait the countdown says under 2h?? i'm not done being unhinged 😩", time: "20:19", reactions: { "😂": 2, "❤️": 1, "🔥": 0 }, mine: [] },
    ],
  },
};
