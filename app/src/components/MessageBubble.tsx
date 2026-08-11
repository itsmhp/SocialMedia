import { CHAT_REACTIONS, useStore } from "../data/store";
import type { Message } from "../types";

export function MessageBubble({ m }: { m: Message }) {
  const { state, dispatch } = useStore();

  if (m.system) return <div className="sys-msg">{m.text}</div>;

  const mine = m.authorId === state.me.id;
  return (
    <div className={"msg" + (mine ? " mine" : "")}>
      <div className="who">
        {mine ? "You" : m.avatar + " " + m.who}
        <span className="t">{m.time}</span>
      </div>
      <div className="body">{m.text}</div>
      <div className="mreacts">
        {CHAT_REACTIONS.map((e) => {
          const c = m.reactions[e] || 0;
          const on = m.mine.includes(e);
          return (
            <button
              key={e}
              className={"mreact" + (on ? " active" : "")}
              aria-label={`${on ? "Remove" : "Add"} ${e} reaction`}
              aria-pressed={on}
              onClick={() => dispatch({ type: "REACT_MESSAGE", id: m.id, emoji: e })}
            >
              {e}
              {c || on ? (
                <>
                  {" "}
                  <b>{c}</b>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
