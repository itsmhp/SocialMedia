import { useState } from "react";
import { useStore } from "../data/store";
import { makeId } from "../lib/id";
import { useDialogFocus } from "../lib/useDialogFocus";

export function CreateRoomOverlay() {
  const { state, dispatch } = useStore();
  const [name, setName] = useState("");
  const [spark, setSpark] = useState("");
  const [durationHours, setDurationHours] = useState<12 | 24>(24);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const close = () => dispatch({ type: "CLOSE_CREATE_ROOM" });
  const dialogRef = useDialogFocus(state.creatingRoom, close);

  if (!state.creatingRoom) return null;

  const toggleMember = (memberId: string) => {
    setMemberIds((current) => current.includes(memberId)
      ? current.filter((id) => id !== memberId)
      : [...current, memberId]);
  };

  const create = () => {
    if (!name.trim() || !spark.trim()) return;
    const now = Date.now();
    dispatch({
      type: "CREATE_ROOM",
      roomId: makeId("room"),
      messageId: makeId("message"),
      name,
      spark,
      durationHours,
      memberIds,
      now,
    });
  };

  return (
    <div ref={dialogRef} className="overlay" role="dialog" aria-modal="true" aria-labelledby="create-room-title" tabIndex={-1}>
      <div className="create-room-panel">
        <div className="create-room-head">
          <div>
            <span className="eyebrow">New spark</span>
            <h1 id="create-room-title">Light a room</h1>
          </div>
          <button
            className="icon-btn"
            type="button"
            aria-label="Close"
            onClick={close}
          >
            ×
          </button>
        </div>

        <label className="field-label" htmlFor="room-name">Room name</label>
        <input
          id="room-name"
          name="roomName"
          className="field"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Late-night crew…"
          maxLength={28}
          autoComplete="off"
        />

        <label className="field-label" htmlFor="room-spark">What starts the fire?</label>
        <textarea
          id="room-spark"
          name="roomSpark"
          className="field room-spark"
          value={spark}
          onChange={(event) => setSpark(event.target.value)}
          placeholder="Who is still awake?…"
          maxLength={120}
          rows={3}
        />

        <div className="field-label">How long?</div>
        <div className="duration-control" aria-label="Room duration">
          {([12, 24] as const).map((hours) => (
            <button
              key={hours}
              type="button"
              aria-pressed={durationHours === hours}
              className={durationHours === hours ? "active" : ""}
              onClick={() => setDurationHours(hours)}
            >
              {hours} hours
            </button>
          ))}
        </div>

        <div className="field-label">Private circle</div>
        <div className="member-picker">
          {state.friends.map((friend) => (
            <label key={friend.id} className="member-option">
              <input
                type="checkbox"
                checked={memberIds.includes(friend.id)}
                onChange={() => toggleMember(friend.id)}
              />
              <span className="ava sm" aria-hidden="true">{friend.avatar}</span>
              <span>{friend.name}</span>
            </label>
          ))}
        </div>
        <p className="create-room-note">Only selected people belong to this local room.</p>

        <button
          className="btn-primary"
          type="button"
          disabled={!name.trim() || !spark.trim()}
          onClick={create}
        >
          Light the room 🔥
        </button>
      </div>
    </div>
  );
}