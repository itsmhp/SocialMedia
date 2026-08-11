import { MOMENT_REACTIONS, useStore } from "../data/store";
import type { Moment } from "../types";

export function MomentCard({ m }: { m: Moment }) {
  const { dispatch } = useStore();
  return (
    <article className="card">
      <div className="card-top">
        <span className="ava">{m.avatar}</span>
        <div>
          <div className="who">
            {m.who} <span className="mood">{m.mood}</span>
          </div>
          <div className="time">{m.time}</div>
        </div>
      </div>
      <div className="text">{m.text}</div>
      <div className="reacts">
        {MOMENT_REACTIONS.map((e) => {
          const on = m.mine.includes(e);
          return (
            <button
              key={e}
              className={"react" + (on ? " active" : "")}
              aria-label={`${on ? "Remove" : "Add"} ${e} reaction`}
              aria-pressed={on}
              onClick={() => dispatch({ type: "REACT_MOMENT", id: m.id, emoji: e })}
            >
              {e} <b>{m.reactions[e] || 0}</b>
            </button>
          );
        })}
      </div>
    </article>
  );
}
