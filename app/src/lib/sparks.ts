import type { Member } from "../types";

export const DAILY_PROMPTS = [
  "What's one tiny thing that made you smile today?",
  "Drop a photo of what's in front of you right now.",
  "What song is stuck in your head?",
  "Best thing you ate in the last 24 hours?",
  "One word for how today felt.",
];

export const CHALLENGES = [
  "Send a selfie doing your worst dance move.",
  "Type your next message with your eyes closed.",
  "Share the last photo in your camera roll.",
  "Voice-note a 5-second impression of someone here.",
  "Reply only in emojis for the next 3 messages.",
];

export const WOULD_YOU_RATHER = [
  { question: "Would you rather…", options: ["Never sleep again", "Never eat again"] },
  { question: "Would you rather…", options: ["Read minds", "Be invisible"] },
  { question: "Would you rather…", options: ["Always be 10 min early", "Always be 20 min late"] },
  { question: "Would you rather…", options: ["Only text", "Only call"] },
];

export const MOST_LIKELY = [
  "fall asleep first tonight",
  "reply at 3am",
  "start a group trip",
  "lose their phone this week",
  "send the most memes",
];

export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function mostLikelyPoll(prompt: string, members: Member[]) {
  return {
    kind: "poll" as const,
    question: `Most likely to ${prompt}`,
    options: members.map((member) => member.name),
    votes: {} as Record<string, number>,
  };
}
