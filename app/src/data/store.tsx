import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type { AppState, Message, Moment, ScreenName } from "../types";
import { seedState } from "./seed";

export const CHAT_REACTIONS = ["😂", "❤️", "🔥"] as const;
export const MOMENT_REACTIONS = ["❤️", "😂", "🔥", "🙌"] as const;

export type Action =
  | { type: "SET_SCREEN"; screen: ScreenName }
  | { type: "SEND_MESSAGE"; text: string }
  | { type: "REACT_MESSAGE"; id: string; emoji: string }
  | { type: "CAST_EXTEND_VOTE"; choice: "keep" | "fade" }
  | { type: "ADD_MOMENT"; text: string; mood: string }
  | { type: "REACT_MOMENT"; id: string; emoji: string }
  | { type: "VOTE_GAME"; name: string }
  | { type: "NEXT_GAME" }
  | { type: "TICK" }
  | { type: "SET_PROFILE"; name: string; avatar: string }
  | { type: "OPEN_PROFILE_EDIT" }
  | { type: "CLOSE_PROFILE_EDIT" }
  | { type: "TOAST"; msg: string }
  | { type: "CLEAR_TOAST" };

/** More than half the room. */
export function majorityOf(members: number): number {
  return Math.floor(members / 2) + 1;
}

/** The extend vote is open when the room is near expiry and not yet resolved. */
export function extendOpen(state: AppState): boolean {
  return !state.room.extend.resolved && state.room.remaining <= state.room.extend.thresholdSec;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_SCREEN":
      return { ...state, screen: action.screen };

    case "TICK": {
      if (state.room.remaining <= 0) return state;
      return { ...state, room: { ...state.room, remaining: state.room.remaining - 1 } };
    }

    case "SEND_MESSAGE": {
      const text = action.text.trim();
      if (!text) return state;
      const msg: Message = {
        id: "u" + Date.now(),
        who: "You",
        avatar: state.me.avatar,
        text,
        time: "now",
        reactions: { "😂": 0, "❤️": 0, "🔥": 0 },
        mine: [],
      };
      return { ...state, room: { ...state.room, messages: [...state.room.messages, msg] } };
    }

    case "REACT_MESSAGE": {
      const messages = state.room.messages.map((m) => {
        if (m.id !== action.id) return m;
        const has = m.mine.includes(action.emoji);
        const mine = has ? m.mine.filter((e) => e !== action.emoji) : [...m.mine, action.emoji];
        const count = Math.max(0, (m.reactions[action.emoji] || 0) + (has ? -1 : 1));
        return { ...m, mine, reactions: { ...m.reactions, [action.emoji]: count } };
      });
      return { ...state, room: { ...state.room, messages } };
    }

    case "CAST_EXTEND_VOTE": {
      const ex = state.room.extend;
      if (ex.resolved) return state;
      const me = state.me.avatar;
      const keep = ex.keep.filter((a) => a !== me);
      if (action.choice === "keep") keep.push(me);

      if (keep.length >= majorityOf(ex.members)) {
        const sys: Message = {
          id: "sys" + Date.now(),
          who: "system",
          avatar: "",
          text: "🔥 The circle voted to keep the fire going — this room now glows for 24h more.",
          time: "",
          system: true,
          reactions: {},
          mine: [],
        };
        return {
          ...state,
          toast: "Room extended +24h 🔥",
          room: {
            ...state.room,
            remaining: state.room.remaining + 24 * 3600,
            messages: [...state.room.messages, sys],
            extend: { ...ex, keep, myVote: "keep", resolved: true },
          },
        };
      }
      return {
        ...state,
        toast: action.choice === "fade" ? "Your vote: let it fade 🌙" : undefined,
        room: { ...state.room, extend: { ...ex, keep, myVote: action.choice } },
      };
    }

    case "ADD_MOMENT": {
      const text = action.text.trim();
      if (!text) return state;
      const moment: Moment = {
        id: "um" + Date.now(),
        who: "You",
        avatar: state.me.avatar,
        mood: action.mood,
        time: "just now",
        text,
        reactions: { "❤️": 0, "😂": 0, "🔥": 0, "🙌": 0 },
        mine: [],
      };
      return {
        ...state,
        streak: state.streak + 1,
        toast: "Moment shared with your circle ✨",
        moments: [moment, ...state.moments],
      };
    }

    case "REACT_MOMENT": {
      const moments = state.moments.map((m) => {
        if (m.id !== action.id) return m;
        const has = m.mine.includes(action.emoji);
        const mine = has ? m.mine.filter((e) => e !== action.emoji) : [...m.mine, action.emoji];
        const count = Math.max(0, (m.reactions[action.emoji] || 0) + (has ? -1 : 1));
        return { ...m, mine, reactions: { ...m.reactions, [action.emoji]: count } };
      });
      return { ...state, moments };
    }

    case "VOTE_GAME": {
      const g = state.game;
      if (g.mine === action.name) return state;
      const votes = { ...g.votes };
      if (g.mine) votes[g.mine] = Math.max(0, (votes[g.mine] || 0) - 1);
      votes[action.name] = (votes[action.name] || 0) + 1;
      return { ...state, game: { ...g, votes, mine: action.name } };
    }

    case "NEXT_GAME": {
      const g = state.game;
      const idx = (g.idx + 1) % g.prompts.length;
      const votes: Record<string, number> = {};
      for (const m of [state.me, ...state.friends]) votes[m.name] = 0;
      return { ...state, game: { ...g, idx, votes, mine: null } };
    }

    case "SET_PROFILE":
      return { ...state, me: { name: action.name, avatar: action.avatar }, onboarded: true, editingProfile: false };

    case "OPEN_PROFILE_EDIT":
      return { ...state, editingProfile: true };

    case "CLOSE_PROFILE_EDIT":
      return { ...state, editingProfile: false };

    case "TOAST":
      return { ...state, toast: action.msg };

    case "CLEAR_TOAST":
      return { ...state, toast: undefined };

    default:
      return state;
  }
}

const StoreContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, seedState);

  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => window.clearInterval(id);
  }, []);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
