import { circleSummaries } from "../data/lifecycle";
import { useStore } from "../data/store";
import { fmtShort } from "../lib/time";
import { plural } from "../lib/text";

export function RoomsScreen() {
  const { state, dispatch } = useStore();
  const circles = circleSummaries(state);

  return (
    <section className="screen active rooms-screen">
      <div className="rooms-hero">
        <div>
          <span className="eyebrow">Your private circles</span>
          <h1>Circles</h1>
        </div>
        <button className="btn-light-room" onClick={() => dispatch({ type: "OPEN_CREATE_ROOM" })}>
          <span aria-hidden="true">＋</span> Light a room
        </button>
      </div>

      {circles.length ? (
        <div className="room-list">
          {circles.map((summary) => {
            const members = summary.circle.memberIds.length;
            const secondsLeft = summary.expiresAt
              ? Math.max(0, Math.ceil((summary.expiresAt - state.now) / 1000))
              : 0;
            return (
              <button
                key={summary.circle.id}
                className={"room-row" + (summary.glowing ? "" : " faded")}
                onClick={() => summary.targetRoomId && dispatch({ type: "SELECT_ROOM", roomId: summary.targetRoomId })}
                disabled={!summary.targetRoomId}
              >
                <span className={"room-mark" + (summary.glowing ? " active" : "")} aria-hidden="true">
                  {summary.glowing ? "🔥" : "🟠"}
                </span>
                <span className="room-row-copy">
                  <strong>{summary.circle.name}</strong>
                  <small>{summary.spark}</small>
                  <span>
                    {members} {plural(members, "member")}
                    {summary.glowing ? ` · ${fmtShort(secondsLeft)} left` : " · Faded"}
                    {summary.baraCount ? ` · ${summary.baraCount} Bara` : ""}
                  </span>
                </span>
                <span className={"circle-status" + (summary.glowing ? " glowing" : "")}>
                  {summary.glowing ? "Glowing" : "Light again"}
                </span>
                <span className="room-chevron" aria-hidden="true">›</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <span aria-hidden="true">🪵</span>
          <p>No circles yet. Light a room for your people.</p>
        </div>
      )}
    </section>
  );
}