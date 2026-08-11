export interface Message {
  id: string;
  authorId: string | null;
  who: string;
  avatar: string;
  text: string;
  time: string;
  createdAt: number;
  system?: boolean;
  reactions: Record<string, number>;
  mine: string[];
}

export interface ExtendVote {
  cycle: number;
  thresholdSec: number;
  votes: Record<string, "keep" | "fade">;
}

export type RoomStatus = "active" | "faded";

export interface Room {
  id: string;
  name: string;
  spark: string;
  createdBy: string;
  memberIds: string[];
  createdAt: number;
  expiresAt: number;
  durationHours: 12 | 24;
  status: RoomStatus;
  extensionCount: number;
  maxExtensions: number;
  messages: Message[];
  extend: ExtendVote;
}

export interface Me {
  id: string;
  name: string;
  avatar: string;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
}

export interface Moment {
  id: string;
  authorId: string;
  who: string;
  avatar: string;
  mood: string;
  time: string;
  createdAt: number;
  text: string;
  reactions: Record<string, number>;
  mine: string[];
}

export interface GameState {
  prompts: string[];
  idx: number;
  /** Votes keyed by stable member ID. */
  votes: Record<string, number>;
  mine: string | null;
}

export interface BaraHighlight {
  messageId: string;
  authorId: string | null;
  who: string;
  avatar: string;
  text: string;
  reactions: number;
}

export interface Bara {
  id: string;
  roomId: string;
  roomName: string;
  spark: string;
  createdAt: number;
  memberCount: number;
  messageCount: number;
  reactionCount: number;
  highlights: BaraHighlight[];
}

export type ScreenName = "chat" | "moments" | "play" | "memories";

export type SettingsPage =
  | "home"
  | "profile"
  | "account"
  | "notifications"
  | "privacy"
  | "data"
  | "help"
  | "about"
  | "privacy-policy"
  | "terms"
  | "guidelines"
  | "licenses";

export interface AppState {
  screen: ScreenName;
  settingsStack: SettingsPage[];
  toast?: string;
  now: number;
  onboarded: boolean;
  replayingIntro: boolean;
  roomListOpen: boolean;
  creatingRoom: boolean;
  me: Me;
  streak: number;
  friends: Member[];
  moments: Moment[];
  game: GameState;
  rooms: Room[];
  activeRoomId: string | null;
  baras: Bara[];
}
