import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type { AppState, Message, ScreenName } from "../types";
import { seedState } from "./seed";

export const CHAT_REACTIONS = ["😂", "❤️", "🔥"] as const;

export type Action =
  | { type: "SET_SCREEN"; screen: ScreenName }
  | { type: "SEND_MESSAGE"; text: string }
  | { type: "REACT_MESSAGE"; id: string; emoji: string }
  | { type: "CAST_EXTEND_VOTE"; choice: "keep" | "fade" }
  | { type: "TICK" }
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
