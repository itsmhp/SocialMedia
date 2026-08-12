import { Bookmark, BookmarkCheck, Flag, Trash2 } from "lucide-react";
import { CHAT_REACTIONS, useStore } from "../data/store";
import { selectedRoom } from "../data/lifecycle";
import { plural } from "../lib/text";
import type { Message } from "../types";

function PollBody({ m }: { m: Message }) {
  const { state, dispatch } = useStore();
  if (m.spark?.kind !== "poll") return null;
  const votes = m.spark.votes;
  const total = Object.keys(votes).length;
  const myVote = votes[state.me.id];
  return (
    <div className="spark-poll">
      <div className="spark-poll-q">{m.spark.question}</div>
      {m.spark.options.map((option, index) => {
        const count = Object.values(votes).filter((value) => value === index).length;
        const pct = total ? Math.round((count / total) * 100) : 0;
        const mine = myVote === index;
        return (
          <button
            key={index}
            type="button"
            className={"spark-poll-option" + (mine ? " mine" : "")}
            aria-pressed={mine}
            onClick={() => dispatch({ type: "VOTE_SPARK", messageId: m.id, option: index })}
          >
            <span className="spark-poll-fill" style={{ width: pct + "%" }} aria-hidden="true" />
            <span className="spark-poll-label">{option}</span>
            <span className="spark-poll-pct">{pct}%</span>
          </button>
        );
      })}
      <div className="spark-poll-meta">{total} {plural(total, "vote")}</div>
    </div>
  );
}

export function MessageBubble({ m }: { m: Message }) {
  const { state, dispatch } = useStore();

  if (m.system) return <div className="sys-msg">{m.text}</div>;

  const mine = m.authorId === state.me.id;
  const isSpark = Boolean(m.spark);
  const promptLabel = m.spark?.kind === "prompt" ? m.spark.label : null;
  const room = selectedRoom(state);
  const circle = state.circles.find((item) => item.id === room?.circleId);
  const canDelete = mine || circle?.createdBy === state.me.id;

  return (
    <div className={"msg" + (mine ? " mine" : "") + (isSpark ? " spark" : "")}>
      <div className="who">
        {mine ? "You" : m.avatar + " " + m.who}
        <span className="t">{m.time}</span>
      </div>

      {promptLabel ? (
        <div className="spark-prompt">
          <span className="spark-prompt-label">✨ {promptLabel}</span>
          <p>{m.text}</p>
        </div>
      ) : m.spark?.kind === "poll" ? (
        <PollBody m={m} />
      ) : (
        <div className="body">{m.text}</div>
      )}

      <div className="msg-actions">
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
        <div className="msg-tools">
          <button
            type="button"
            className={"keep-btn" + (m.keep ? " active" : "")}
            aria-label={m.keep ? "Kept for Bara" : "Keep for Bara"}
            aria-pressed={Boolean(m.keep)}
            title={m.keep ? "Kept for Bara" : "Keep for Bara"}
            onClick={() => dispatch({ type: "TOGGLE_KEEP", messageId: m.id })}
          >
            {m.keep ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
          </button>
          {canDelete ? (
            <button
              type="button"
              className="msg-icon-btn"
              aria-label="Delete message"
              title="Delete message"
              onClick={() => dispatch({ type: "DELETE_MESSAGE", messageId: m.id })}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className="msg-icon-btn"
              aria-label="Report message"
              title="Report message"
              onClick={() => dispatch({ type: "REPORT", targetId: m.authorId ?? m.id })}
            >
              <Flag size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
