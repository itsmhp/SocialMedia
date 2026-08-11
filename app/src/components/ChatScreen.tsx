import { useEffect } from "react";
import { extendOpen, useStore } from "../data/store";
import { MessageBubble } from "./MessageBubble";
import { ExtendVoteCard } from "./ExtendVoteCard";
import { Composer } from "./Composer";

export function ChatScreen() {
  const { state } = useStore();
  const open = extendOpen(state);
  const count = state.room.messages.length;

  // Keep the newest message + composer in view.
  useEffect(() => {
    const el = document.getElementById("scroll");
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);

  return (
    <section className="screen active">
      <div className="room-banner">
        {open
          ? "⏳ Almost out of time — vote below to keep the fire alive."
          : "🔥 This room fades in 24h — be silly, it won't last."}
      </div>
      <div className="presence">🟢 Dinda, Raka &amp; Sasa are here now</div>
      <div className="chat">
        {state.room.messages.map((m) => (
          <MessageBubble key={m.id} m={m} />
        ))}
        {open && <ExtendVoteCard />}
      </div>
      <Composer />
    </section>
  );
}
