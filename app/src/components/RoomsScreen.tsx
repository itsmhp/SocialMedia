import { secondsLeft } from "../data/lifecycle";
import { useStore } from "../data/store";
import { fmtShort } from "../lib/time";
import { plural } from "../lib/text";

export function RoomsScreen() {
  const { state, dispatch } = useStore();
  const active = state.rooms.filter((room) => room.status === "active");
  const faded = state.rooms.filter((room) => room.status === "faded");

  return (
    <section className="screen active rooms-screen">
      <div className="rooms-hero">
        <div>
          <span className="eyebrow">Your private circles</span>
          <h1>Rooms</h1>
        </div>
        <button className="btn-light-room" onClick={() => dispatch({ type: "OPEN_CREATE_ROOM" })}>
          <span aria-hidden="true">＋</span> Light a room
        </button>
      </div>

      <div className="room-group">
        <div className="room-group-head">
          <h2>Glowing now</h2>
          <span>{active.length}</span>
        </div>
        {active.length ? (
          <div className="room-list">
            {active.map((room) => (
              <button
                key={room.id}
                className="room-row"
                onClick={() => dispatch({ type: "SELECT_ROOM", roomId: room.id })}
              >
                <span className="room-mark active" aria-hidden="true">🔥</span>
                <span className="room-row-copy">
                  <strong>{room.name}</strong>
                  <small>{room.spark}</small>
                  <span>{room.memberIds.length} {plural(room.memberIds.length, "member")} · {fmtShort(secondsLeft(room, state.now))} left</span>
                </span>
                <span className="room-chevron" aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">🪵</span>
            <p>No room is glowing. Light one for your circle.</p>
          </div>
        )}
      </div>

      {faded.length ? (
        <div className="room-group">
          <div className="room-group-head">
            <h2>Bara</h2>
            <span>{faded.length}</span>
          </div>
          <div className="room-list">
            {faded.map((room) => (
              <button
                key={room.id}
                className="room-row faded"
                onClick={() => dispatch({ type: "SELECT_ROOM", roomId: room.id })}
              >
                <span className="room-mark" aria-hidden="true">🟠</span>
                <span className="room-row-copy">
                  <strong>{room.name}</strong>
                  <small>{room.spark}</small>
                  <span>Faded · open the embers</span>
                </span>
                <span className="room-chevron" aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}