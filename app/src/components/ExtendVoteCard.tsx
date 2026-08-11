import { majorityOf, useStore } from "../data/store";
import { secondsLeft, selectedRoom } from "../data/lifecycle";
import { makeId } from "../lib/id";
import { fmtShort } from "../lib/time";

export function ExtendVoteCard() {
  const { state, dispatch } = useStore();
  const room = selectedRoom(state);
  if (!room) return null;
  const ex = room.extend;
  const majority = majorityOf(room.memberIds.length);
  const keep = room.memberIds.filter((memberId) => ex.votes[memberId] === "keep").length;
  const pct = Math.min(100, Math.round((keep / majority) * 100));
  const myVote = ex.votes[state.me.id] ?? null;
  const vote = (choice: "keep" | "fade") => dispatch({
    type: "CAST_EXTEND_VOTE",
    choice,
    systemMessageId: makeId("message"),
    now: Date.now(),
  });

  return (
    <div className="vote-card">
      <div className="vote-head">
        ⏳ This room fades in <b>{fmtShort(secondsLeft(room, state.now))}</b> — keep the fire going?
      </div>
      <div className="vote-bar" role="progressbar" aria-label="Votes to keep the room" aria-valuemin={0} aria-valuemax={majority} aria-valuenow={keep}>
        <i style={{ width: pct + "%" }} />
      </div>
      <div className="vote-meta">
        <b>{keep}</b> of {room.memberIds.length} want to keep it · need <b>{majority}</b>
      </div>
      <div className="vote-actions">
        <button
          className={"vote-btn keep" + (myVote === "keep" ? " on" : "")}
          aria-pressed={myVote === "keep"}
          onClick={() => vote("keep")}
        >
          🔥 Keep it 24h more
        </button>
        <button
          className={"vote-btn fade" + (myVote === "fade" ? " on" : "")}
          aria-pressed={myVote === "fade"}
          onClick={() => vote("fade")}
        >
          Let it fade
        </button>
      </div>
    </div>
  );
}
