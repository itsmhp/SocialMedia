import { majorityOf, useStore } from "../data/store";
import { fmtShort } from "../lib/time";

export function ExtendVoteCard() {
  const { state, dispatch } = useStore();
  const ex = state.room.extend;
  const majority = majorityOf(ex.members);
  const keep = ex.keep.length;
  const pct = Math.min(100, Math.round((keep / majority) * 100));

  return (
    <div className="vote-card">
      <div className="vote-head">
        ⏳ This room fades in <b>{fmtShort(state.room.remaining)}</b> — keep the fire going?
      </div>
      <div className="vote-bar">
        <i style={{ width: pct + "%" }} />
      </div>
      <div className="vote-meta">
        <b>{keep}</b> of {ex.members} want to keep it · need <b>{majority}</b>
      </div>
      <div className="vote-actions">
        <button
          className={"vote-btn keep" + (ex.myVote === "keep" ? " on" : "")}
          onClick={() => dispatch({ type: "CAST_EXTEND_VOTE", choice: "keep" })}
        >
          🔥 Keep it 24h more
        </button>
        <button
          className={"vote-btn fade" + (ex.myVote === "fade" ? " on" : "")}
          onClick={() => dispatch({ type: "CAST_EXTEND_VOTE", choice: "fade" })}
        >
          Let it fade
        </button>
      </div>
    </div>
  );
}
