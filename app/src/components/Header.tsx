import { extendOpen, useStore } from "../data/store";
import { fmtTime } from "../lib/time";

export function Header() {
  const { state } = useStore();
  const urgent = extendOpen(state);
  return (
    <header className="topbar">
      <div className="circle">
        <div className="flame">🔥</div>
        <div>
          <div className="circle-name">{state.room.name}</div>
          <div className="circle-sub">{state.room.membersLabel}</div>
        </div>
      </div>
      <div className={"countdown" + (urgent ? " urgent" : "")} title="this room fades in 24h">
        <span>{fmtTime(state.room.remaining)}</span>
        <small>left 🔥</small>
      </div>
    </header>
  );
}
