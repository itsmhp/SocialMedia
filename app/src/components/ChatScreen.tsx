import { useEffect } from "react";
import { extendOpen, useStore } from "../data/store";
import { memberCount, selectedRoom } from "../data/lifecycle";
import { MessageBubble } from "./MessageBubble";
import { ExtendVoteCard } from "./ExtendVoteCard";
import { Composer } from "./Composer";
import { FadedRoom } from "./FadedRoom";
import { RoomsScreen } from "./RoomsScreen";
import { plural } from "../lib/text";

export function ChatScreen() {
  const { state } = useStore();
  const room = selectedRoom(state);
  const open = extendOpen(state);
  const count = room?.messages.length ?? 0;

  // Keep the newest message + composer in view.
  useEffect(() => {
    const el = document.getElementById("scroll");
    if (el) el.scrollTop = el.scrollHeight;
  }, [count, room?.id]);

  if (state.roomListOpen || !room) return <RoomsScreen />;
  if (room.status === "faded") return <FadedRoom room={room} />;

  return (
    <section className="screen active">
      <div className="room-banner">
        {open
          ? "⏳ Almost out of time — vote now to keep the fire alive."
          : `🔥 ${room.spark}`}
      </div>
      {open && <ExtendVoteCard />}
      <div className="presence">🔒 {memberCount(room)} {plural(memberCount(room), "member")} · this chat fades with the room</div>
      <div className="chat">
        {room.messages.map((message) => (
          <MessageBubble key={message.id} m={message} />
        ))}
      </div>
      <Composer />
    </section>
  );
}
