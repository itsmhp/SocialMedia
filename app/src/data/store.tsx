import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type { AppState, Message, Moment, Room, SettingsPage, Spark } from "../types";
import { HOUR_MS, secondsLeft, selectedRoom, settleExpiredRooms } from "./lifecycle";
import { loadAppState, saveAppState } from "./localState";
import { createSeedState } from "./seed";

export const CHAT_REACTIONS = ["😂", "❤️", "🔥"] as const;
export const MOMENT_REACTIONS = ["❤️", "😂", "🔥", "🙌"] as const;

export type Action =
  | { type: "OPEN_SETTINGS" }
  | { type: "OPEN_SETTINGS_PAGE"; page: SettingsPage }
  | { type: "SETTINGS_BACK" }
  | { type: "CLOSE_SETTINGS" }
  | { type: "OPEN_ROOM_LIST" }
  | { type: "OPEN_ROOM_DETAILS" }
  | { type: "CLOSE_ROOM_DETAILS" }
  | { type: "OPEN_CREATE_ROOM" }
  | { type: "CLOSE_CREATE_ROOM" }
  | { type: "SELECT_ROOM"; roomId: string }
  | { type: "REMOVE_ROOM_MEMBER"; roomId: string; memberId: string }
  | { type: "TRANSFER_ROOM_OWNER"; roomId: string; memberId: string }
  | { type: "LEAVE_ROOM"; roomId: string }
  | { type: "CREATE_ROOM"; roomId: string; messageId: string; name: string; spark: string; durationHours: 12 | 24; memberIds: string[]; now: number }
  | { type: "RELIGHT_ROOM"; sourceRoomId: string; roomId: string; messageId: string; now: number }
  | { type: "SEND_MESSAGE"; id: string; text: string; now: number }
  | { type: "POST_SPARK"; id: string; spark: Spark; now: number }
  | { type: "VOTE_SPARK"; messageId: string; option: number }
  | { type: "TOGGLE_KEEP"; messageId: string }
  | { type: "DELETE_MESSAGE"; messageId: string }
  | { type: "TOGGLE_BLOCK_MEMBER"; memberId: string }
  | { type: "REPORT"; targetId: string }
  | { type: "REACT_MESSAGE"; id: string; emoji: string }
  | { type: "CAST_EXTEND_VOTE"; choice: "keep" | "fade"; systemMessageId: string; now: number }
  | { type: "ADD_MOMENT"; id: string; text: string; mood: string; now: number }
  | { type: "REACT_MOMENT"; id: string; emoji: string }
  | { type: "VOTE_GAME"; memberId: string }
  | { type: "NEXT_GAME" }
  | { type: "TICK"; now: number }
  | { type: "SET_PROFILE"; name: string; avatar: string }
  | { type: "REPLAY_INTRO" }
  | { type: "FINISH_INTRO_REPLAY" }
  | { type: "CLEAR_LOCAL_ACTIVITY" }
  | { type: "RESET_APP"; userId: string; now: number }
  | { type: "TOAST"; msg: string }
  | { type: "CLEAR_TOAST" };

export function majorityOf(members: number): number {
  return Math.floor(members / 2) + 1;
}

export function extendOpen(state: AppState): boolean {
  const room = selectedRoom(state);
  return Boolean(
    room &&
      room.status === "active" &&
      room.extensionCount < room.maxExtensions &&
      secondsLeft(room, state.now) <= room.extend.thresholdSec,
  );
}

function updateRoom(state: AppState, roomId: string, update: (room: Room) => Room): AppState {
  return {
    ...state,
    rooms: state.rooms.map((room) => (room.id === roomId ? update(room) : room)),
  };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "OPEN_SETTINGS":
      return { ...state, settingsStack: ["home"], roomListOpen: false };

    case "OPEN_SETTINGS_PAGE":
      return {
        ...state,
        settingsStack: state.settingsStack.length
          ? [...state.settingsStack, action.page]
          : ["home", action.page],
        roomListOpen: false,
      };

    case "SETTINGS_BACK":
      return { ...state, settingsStack: state.settingsStack.slice(0, -1) };

    case "CLOSE_SETTINGS":
      return { ...state, settingsStack: [] };

    case "OPEN_ROOM_LIST":
      return { ...state, roomListOpen: true, roomDetailsOpen: false };

    case "OPEN_ROOM_DETAILS":
      return selectedRoom(state)
        ? { ...state, roomDetailsOpen: true, roomListOpen: false }
        : state;

    case "CLOSE_ROOM_DETAILS":
      return { ...state, roomDetailsOpen: false };

    case "OPEN_CREATE_ROOM":
      return { ...state, creatingRoom: true };

    case "CLOSE_CREATE_ROOM":
      return { ...state, creatingRoom: false };

    case "SELECT_ROOM":
      return {
        ...state,
        activeRoomId: action.roomId,
        roomListOpen: false,
        roomDetailsOpen: false,
      };

    case "REMOVE_ROOM_MEMBER": {
      const room = state.rooms.find((item) => item.id === action.roomId);
      const circle = state.circles.find((item) => item.id === room?.circleId);
      if (
        !room ||
        !circle ||
        circle.createdBy !== state.me.id ||
        action.memberId === state.me.id ||
        !circle.memberIds.includes(action.memberId)
      ) return state;
      const member = state.friends.find((friend) => friend.id === action.memberId);
      return {
        ...state,
        circles: state.circles.map((current) => current.id === circle.id
          ? { ...current, memberIds: current.memberIds.filter((memberId) => memberId !== action.memberId) }
          : current),
        rooms: state.rooms.map((current) => current.circleId === circle.id && current.status === "active"
          ? {
              ...current,
              memberIds: current.memberIds.filter((memberId) => memberId !== action.memberId),
              extend: { ...current.extend, votes: {} },
            }
          : current),
        toast: `${member?.name ?? "Member"} removed from this Circle`,
      };
    }

    case "TRANSFER_ROOM_OWNER": {
      const room = state.rooms.find((item) => item.id === action.roomId);
      const circle = state.circles.find((item) => item.id === room?.circleId);
      if (
        !room ||
        !circle ||
        circle.createdBy !== state.me.id ||
        action.memberId === state.me.id ||
        !circle.memberIds.includes(action.memberId)
      ) return state;
      const member = state.friends.find((friend) => friend.id === action.memberId);
      return {
        ...state,
        circles: state.circles.map((current) => current.id === circle.id
          ? { ...current, createdBy: action.memberId }
          : current),
        rooms: state.rooms.map((current) => current.circleId === circle.id && current.status === "active"
          ? { ...current, createdBy: action.memberId }
          : current),
        toast: `${member?.name ?? "Member"} is now the Circle host`,
      };
    }

    case "LEAVE_ROOM": {
      const room = state.rooms.find((item) => item.id === action.roomId);
      const circle = state.circles.find((item) => item.id === room?.circleId);
      if (
        !room ||
        !circle ||
        circle.createdBy === state.me.id ||
        !circle.memberIds.includes(state.me.id)
      ) return state;
      const rooms = state.rooms.filter((item) => item.circleId !== circle.id);
      return {
        ...state,
        circles: state.circles.filter((item) => item.id !== circle.id),
        rooms,
        activeRoomId: state.rooms.some((item) => item.id === state.activeRoomId && item.circleId === circle.id)
          ? rooms.find((item) => item.status === "active")?.id ?? rooms[0]?.id ?? null
          : state.activeRoomId,
        baras: state.baras.filter((bara) => bara.circleId !== circle.id),
        roomDetailsOpen: false,
        toast: `You left ${circle.name}`,
      };
    }

    case "CREATE_ROOM": {
      const friendIds = new Set(state.friends.map((friend) => friend.id));
      const memberIds = [state.me.id, ...action.memberIds.filter((id) => friendIds.has(id))];
      const room: Room = {
        id: action.roomId,
        circleId: `circle_${action.roomId}`,
        name: action.name.trim(),
        spark: action.spark.trim(),
        createdBy: state.me.id,
        memberIds: [...new Set(memberIds)],
        createdAt: action.now,
        expiresAt: action.now + action.durationHours * HOUR_MS,
        durationHours: action.durationHours,
        status: "active",
        extensionCount: 0,
        maxExtensions: 3,
        extend: { cycle: 0, thresholdSec: 2 * 3600, votes: {} },
        messages: [{
          id: action.messageId,
          authorId: null,
          who: "system",
          avatar: "",
          text: `🔥 ${state.me.name} lit this room: ${action.spark.trim()}`,
          time: "now",
          createdAt: action.now,
          system: true,
          reactions: {},
          mine: [],
        }],
      };
      return {
        ...state,
        now: action.now,
        circles: [{
          id: room.circleId,
          name: room.name,
          createdBy: room.createdBy,
          memberIds: [...room.memberIds],
          createdAt: room.createdAt,
        }, ...state.circles],
        rooms: [room, ...state.rooms],
        activeRoomId: room.id,
        roomListOpen: false,
        roomDetailsOpen: false,
        creatingRoom: false,
        toast: "Room lit 🔥",
      };
    }

    case "RELIGHT_ROOM": {
      const source = state.rooms.find((room) => room.id === action.sourceRoomId);
      if (!source || source.status !== "faded") return state;
      const room: Room = {
        ...source,
        id: action.roomId,
        createdBy: state.me.id,
        createdAt: action.now,
        expiresAt: action.now + source.durationHours * HOUR_MS,
        status: "active",
        extensionCount: 0,
        extend: { ...source.extend, cycle: 0, votes: {} },
        messages: [{
          id: action.messageId,
          authorId: null,
          who: "system",
          avatar: "",
          text: `🔥 ${state.me.name} lit another round of ${source.name}.`,
          time: "now",
          createdAt: action.now,
          system: true,
          reactions: {},
          mine: [],
        }],
      };
      return {
        ...state,
        now: action.now,
        rooms: [room, ...state.rooms],
        activeRoomId: room.id,
        roomListOpen: false,
        roomDetailsOpen: false,
        toast: "The fire is back 🔥",
      };
    }

    case "TICK":
      return settleExpiredRooms(state, action.now);

    case "SEND_MESSAGE": {
      const room = selectedRoom(state);
      const text = action.text.trim();
      if (!room || room.status !== "active" || !text) return state;
      const message: Message = {
        id: action.id,
        authorId: state.me.id,
        who: state.me.name,
        avatar: state.me.avatar,
        text,
        time: "now",
        createdAt: action.now,
        reactions: { "😂": 0, "❤️": 0, "🔥": 0 },
        mine: [],
      };
      return updateRoom({ ...state, now: action.now }, room.id, (current) => ({
        ...current,
        messages: [...current.messages, message],
      }));
    }

    case "POST_SPARK": {
      const room = selectedRoom(state);
      if (!room || room.status !== "active") return state;
      const message: Message = {
        id: action.id,
        authorId: state.me.id,
        who: state.me.name,
        avatar: state.me.avatar,
        text: action.spark.kind === "poll" ? action.spark.question : action.spark.text,
        time: "now",
        createdAt: action.now,
        reactions: { "😂": 0, "❤️": 0, "🔥": 0 },
        mine: [],
        spark: action.spark,
      };
      return updateRoom({ ...state, now: action.now, toast: "Spark added to the room ✨" }, room.id, (current) => ({
        ...current,
        messages: [...current.messages, message],
      }));
    }

    case "VOTE_SPARK": {
      const room = selectedRoom(state);
      if (!room || room.status !== "active") return state;
      const target = room.messages.find((message) => message.id === action.messageId);
      if (!target || target.spark?.kind !== "poll") return state;
      if (action.option < 0 || action.option >= target.spark.options.length) return state;
      return updateRoom(state, room.id, (current) => ({
        ...current,
        messages: current.messages.map((message) => {
          if (message.id !== action.messageId || message.spark?.kind !== "poll") return message;
          const votes = { ...message.spark.votes };
          if (votes[state.me.id] === action.option) delete votes[state.me.id];
          else votes[state.me.id] = action.option;
          return { ...message, spark: { ...message.spark, votes } };
        }),
      }));
    }

    case "TOGGLE_KEEP": {
      const room = selectedRoom(state);
      if (!room || room.status !== "active") return state;
      return updateRoom(state, room.id, (current) => ({
        ...current,
        messages: current.messages.map((message) => (
          message.id === action.messageId && !message.system
            ? { ...message, keep: !message.keep }
            : message
        )),
      }));
    }

    case "DELETE_MESSAGE": {
      const room = selectedRoom(state);
      if (!room || room.status !== "active") return state;
      const target = room.messages.find((message) => message.id === action.messageId);
      if (!target || target.system) return state;
      const circle = state.circles.find((item) => item.id === room.circleId);
      const canDelete = target.authorId === state.me.id || circle?.createdBy === state.me.id;
      if (!canDelete) return state;
      return updateRoom({ ...state, toast: "Message deleted" }, room.id, (current) => ({
        ...current,
        messages: current.messages.filter((message) => message.id !== action.messageId),
      }));
    }

    case "TOGGLE_BLOCK_MEMBER": {
      if (action.memberId === state.me.id) return state;
      const blocked = state.blockedIds.includes(action.memberId);
      const member = state.friends.find((friend) => friend.id === action.memberId);
      return {
        ...state,
        blockedIds: blocked
          ? state.blockedIds.filter((id) => id !== action.memberId)
          : [...state.blockedIds, action.memberId],
        toast: blocked
          ? `${member?.name ?? "Member"} unblocked`
          : `${member?.name ?? "Member"} blocked — you won't see their messages`,
      };
    }

    case "REPORT":
      return { ...state, toast: "Report received. Our team will review it." };

    case "REACT_MESSAGE": {
      const room = selectedRoom(state);
      if (!room || room.status !== "active") return state;
      return updateRoom(state, room.id, (current) => ({
        ...current,
        messages: current.messages.map((message) => {
          if (message.id !== action.id) return message;
          const has = message.mine.includes(action.emoji);
          const mine = has ? message.mine.filter((emoji) => emoji !== action.emoji) : [...message.mine, action.emoji];
          const count = Math.max(0, (message.reactions[action.emoji] || 0) + (has ? -1 : 1));
          return { ...message, mine, reactions: { ...message.reactions, [action.emoji]: count } };
        }),
      }));
    }

    case "CAST_EXTEND_VOTE": {
      const room = selectedRoom(state);
      if (!room || !extendOpen(state)) return state;
      const votes = { ...room.extend.votes, [state.me.id]: action.choice };
      const keep = room.memberIds.filter((memberId) => votes[memberId] === "keep").length;
      if (keep >= majorityOf(room.memberIds.length)) {
        const systemMessage: Message = {
          id: action.systemMessageId,
          authorId: null,
          who: "system",
          avatar: "",
          text: "🔥 The circle voted to keep the fire going — this room now glows for 24h more.",
          time: "",
          createdAt: action.now,
          system: true,
          reactions: {},
          mine: [],
        };
        return updateRoom({ ...state, now: action.now, toast: "Room extended +24h 🔥" }, room.id, (current) => ({
          ...current,
          expiresAt: current.expiresAt + 24 * HOUR_MS,
          extensionCount: current.extensionCount + 1,
          messages: [...current.messages, systemMessage],
          extend: { ...current.extend, cycle: current.extend.cycle + 1, votes: {} },
        }));
      }
      return updateRoom(
        { ...state, toast: action.choice === "fade" ? "Your vote: let it fade 🌙" : undefined },
        room.id,
        (current) => ({ ...current, extend: { ...current.extend, votes } }),
      );
    }

    case "ADD_MOMENT": {
      const text = action.text.trim();
      if (!text) return state;
      const moment: Moment = {
        id: action.id,
        authorId: state.me.id,
        who: state.me.name,
        avatar: state.me.avatar,
        mood: action.mood,
        time: "just now",
        createdAt: action.now,
        text,
        reactions: { "❤️": 0, "😂": 0, "🔥": 0, "🙌": 0 },
        mine: [],
      };
      return {
        ...state,
        now: action.now,
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
      const game = state.game;
      if (game.mine === action.memberId) return state;
      const votes = { ...game.votes };
      if (game.mine) votes[game.mine] = Math.max(0, (votes[game.mine] || 0) - 1);
      votes[action.memberId] = (votes[action.memberId] || 0) + 1;
      return { ...state, game: { ...game, votes, mine: action.memberId } };
    }

    case "NEXT_GAME": {
      const game = state.game;
      const votes: Record<string, number> = {};
      for (const member of [state.me, ...state.friends]) votes[member.id] = 0;
      return { ...state, game: { ...game, idx: (game.idx + 1) % game.prompts.length, votes, mine: null } };
    }

    case "SET_PROFILE":
      return { ...state, me: { ...state.me, name: action.name, avatar: action.avatar }, onboarded: true };

    case "REPLAY_INTRO":
      return { ...state, replayingIntro: true };

    case "FINISH_INTRO_REPLAY":
      return { ...state, replayingIntro: false };

    case "CLEAR_LOCAL_ACTIVITY": {
      const votes = Object.fromEntries(
        [state.me, ...state.friends].map((member) => [member.id, 0]),
      );
      return {
        ...state,
        streak: 0,
        moments: [],
        game: { ...state.game, idx: 0, votes, mine: null },
        circles: [],
        rooms: [],
        activeRoomId: null,
        baras: [],
        toast: "Local activity cleared",
      };
    }

    case "RESET_APP":
      return {
        settingsStack: [],
        now: action.now,
        onboarded: false,
        replayingIntro: false,
        roomListOpen: true,
        roomDetailsOpen: false,
        creatingRoom: false,
        me: { id: action.userId, name: "You", avatar: "🦊" },
        streak: 0,
        friends: [],
        moments: [],
        game: { prompts: state.game.prompts, idx: 0, votes: { [action.userId]: 0 }, mine: null },
        circles: [],
        rooms: [],
        activeRoomId: null,
        baras: [],
        blockedIds: [],
      };

    case "TOAST":
      return { ...state, toast: action.msg };

    case "CLEAR_TOAST":
      return { ...state, toast: undefined };

    default:
      return state;
  }
}

function initializeState(): AppState {
  const now = Date.now();
  const seed = createSeedState(now);
  return settleExpiredRooms(loadAppState(seed, now), now);
}

const StoreContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, initializeState);

  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: "TICK", now: Date.now() }), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    saveAppState(state);
  }, [state.me, state.streak, state.friends, state.moments, state.game, state.circles, state.rooms, state.activeRoomId, state.baras, state.blockedIds]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
