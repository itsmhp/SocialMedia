import { useStore } from "../data/store";

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
        <button className="btn-small" onClick={() => dispatch({ type: "OPEN_PROFILE_EDIT" })}>Edit</button>
      </div>
      <div className="streak-big">
        🔥 <b>{state.streak}</b> day streak
      </div>
      <div className="recap">
        This week with {state.room.name}: <b>12 moments</b> · <b>1 real hangout</b> ·{" "}
        <b>34 warm reactions</b>.
      </div>
      <div className="mem-grid">
        <div className="mem">☕</div>
        <div className="mem">🐈</div>
        <div className="mem">🎧</div>
        <div className="mem">🌙</div>
        <div className="mem">📚</div>
        <div className="mem">✨</div>
      </div>
      <div className="no-vanity">No followers. No public likes. Just you &amp; your closest people. 💛</div>
    </section>
  );
}
