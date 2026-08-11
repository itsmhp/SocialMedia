export interface Message {
  id: string;
  who: string;
  avatar: string;
  text: string;
  time: string;
  system?: boolean;
  reactions: Record<string, number>;
  mine: string[];
}

export interface ExtendVote {
  /** Vote surfaces when remaining <= thresholdSec. */
  thresholdSec: number;
  members: number;
  /** Avatars of members who currently vote to keep the room. */
  keep: string[];
  myVote: "keep" | "fade" | null;
  resolved: boolean;
}

export interface Room {
  name: string;
  membersLabel: string;
  messages: Message[];
  /** Seconds until the room fades. */
  remaining: number;
  extend: ExtendVote;
}

export interface Me {
  name: string;
  avatar: string;
}

export type ScreenName = "chat" | "moments" | "play" | "memories";

export interface AppState {
  screen: ScreenName;
  toast?: string;
  me: Me;
  room: Room;
}
