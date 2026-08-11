import type { Room } from "../types";
import { useStore } from "../data/store";
import { makeId } from "../lib/id";
import { plural } from "../lib/text";

export function FadedRoom({ room }: { room: Room }) {
  const { state, dispatch } = useStore();
  const bara = state.baras.find((item) => item.roomId === room.id);

  const relight = () => {
    const now = Date.now();
    dispatch({
      type: "RELIGHT_ROOM",
      sourceRoomId: room.id,
      roomId: makeId("room"),
      messageId: makeId("message"),
      now,
    });
  };

  return (
    <section className="screen active bara-view">
      <div className="bara-flame" aria-hidden="true">🟠</div>
      <span className="eyebrow">Bara from {room.name}</span>
      <h1>The fire faded</h1>
      <p className="bara-spark">“{room.spark}”</p>

      {bara ? (
        <>
          <div className="bara-stats" aria-label="Room summary">
            <div><strong>{bara.messageCount}</strong><span>{plural(bara.messageCount, "message")}</span></div>
            <div><strong>{bara.reactionCount}</strong><span>{plural(bara.reactionCount, "reaction")}</span></div>
            <div><strong>{bara.memberCount}</strong><span>{plural(bara.memberCount, "member")}</span></div>
          </div>
          <div className="bara-highlights">
            <h2>Embers worth keeping</h2>
            {bara.highlights.length ? bara.highlights.map((highlight) => (
              <article key={highlight.messageId} className="bara-highlight">
                <div className="who">{highlight.avatar} {highlight.who}</div>
                <p>{highlight.text}</p>
                {highlight.reactions ? <span>🔥 {highlight.reactions} warm {plural(highlight.reactions, "reaction")}</span> : null}
              </article>
            )) : (
              <div className="empty-state compact">
                <p>No messages made it to the embers this time.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="empty-state compact"><p>This Bara is still settling.</p></div>
      )}

      <div className="bara-actions">
        <button className="btn-primary" onClick={relight}>Light it again 🔥</button>
        <button className="btn-ghost" onClick={() => dispatch({ type: "OPEN_ROOM_LIST" })}>Back to rooms</button>
      </div>
    </section>
  );
}