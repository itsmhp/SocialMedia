import { extendOpen, useStore } from "../data/store";
import { memberCount, secondsLeft, selectedRoom } from "../data/lifecycle";
import { fmtTime } from "../lib/time";
import { plural } from "../lib/text";

export function Header() {
  const { state, dispatch } = useStore();
  const room = selectedRoom(state);
  const urgent = extendOpen(state);
  const showingRooms = state.roomListOpen || !room;
  return (
    <header className="topbar">
      <button className="circle circle-button" onClick={() => dispatch({ type: "OPEN_ROOM_LIST" })} aria-label="View rooms">
        <div className="flame" aria-hidden="true">🔥</div>
        <div>
          <div className="circle-name">{showingRooms ? "Unggun" : room.name}</div>
          <div className="circle-sub">
            {showingRooms ? "your private circles" : `${memberCount(room)} ${plural(memberCount(room), "member")} · private room`}
          </div>
        </div>
      </button>
      {!showingRooms && room.status === "active" ? (
        <div className={"countdown" + (urgent ? " urgent" : "")} title="Time until this room fades">
          <span>{fmtTime(secondsLeft(room, state.now))}</span>
          <small>left 🔥</small>
        </div>
      ) : null}
      {!showingRooms && room.status === "faded" ? <div className="bara-chip">Bara</div> : null}
    </header>
  );
}
