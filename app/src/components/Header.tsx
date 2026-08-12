import { Settings } from "lucide-react";
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
      <div className="circle">
        <button className="room-list-entry" onClick={() => dispatch({ type: "OPEN_ROOM_LIST" })} aria-label="View rooms">
          <span className="flame" aria-hidden="true">🔥</span>
        </button>
        {showingRooms ? (
          <div className="circle-copy">
            <div className="circle-name">Falò</div>
            <div className="circle-sub">your private circles</div>
          </div>
        ) : (
          <button className="circle-profile-entry" onClick={() => dispatch({ type: "OPEN_ROOM_DETAILS" })} aria-label={`Open ${room.name} Circle profile`}>
            <div className="circle-name">{room.name}</div>
            <div className="circle-sub">{memberCount(room)} {plural(memberCount(room), "member")} · private Circle</div>
          </button>
        )}
      </div>
      <div className="topbar-actions">
        {!showingRooms && room.status === "active" ? (
          <div className={"countdown" + (urgent ? " urgent" : "")} title="Time until this room fades">
            <span>{fmtTime(secondsLeft(room, state.now))}</span>
            <small>left 🔥</small>
          </div>
        ) : null}
        {!showingRooms && room.status === "faded" ? <div className="bara-chip">Bara</div> : null}
        <button
          type="button"
          className="settings-entry"
          onClick={() => dispatch({ type: "OPEN_SETTINGS" })}
          aria-label="Open Settings"
          title="Settings"
        >
          <span aria-hidden="true">{state.me.avatar}</span>
          <Settings size={13} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
