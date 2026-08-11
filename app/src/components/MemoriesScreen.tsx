import { useStore } from "../data/store";
import { plural } from "../lib/text";

export function MemoriesScreen() {
  const { state, dispatch } = useStore();
  return (
    <section className="screen active">
      <div className="section-head">
        <h2>Memories</h2>
        <span>warm, not vanity metrics</span>
      </div>
      <div className="profile-card">
        <span className="ava">{state.me.avatar}</span>
        <div className="profile-meta">
          <div className="profile-name">{state.me.name}</div>
          <div className="profile-sub">your handle · saved on this device</div>
        </div>
        <button className="btn-small" onClick={() => dispatch({ type: "OPEN_SETTINGS_PAGE", page: "profile" })}>Edit</button>
      </div>
      <div className="memory-title-row">
        <h3>Your Bara</h3>
        <span>{state.baras.length} kept</span>
      </div>
      {state.baras.length ? (
        <div className="bara-list">
          {state.baras.map((bara) => (
            <button
              key={bara.id}
              className="bara-memory"
              onClick={() => dispatch({ type: "SELECT_ROOM", roomId: bara.roomId })}
            >
              <span className="bara-memory-mark" aria-hidden="true">🟠</span>
              <span>
                <strong>{bara.roomName}</strong>
                <small>
                  {bara.messageCount} {plural(bara.messageCount, "message")} · {bara.reactionCount} {plural(bara.reactionCount, "reaction")}
                </small>
              </span>
              <span aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state memories-empty">
          <span aria-hidden="true">🕯️</span>
          <p>When a room fades, its warmest moments stay here.</p>
        </div>
      )}
      <div className="no-vanity">Private memories from rooms you were part of.</div>
    </section>
  );
}
