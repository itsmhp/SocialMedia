import { useState } from "react";
import { Sparkles, Flame, Scale, Crown, BarChart3, X, Plus } from "lucide-react";
import { selectedRoom } from "../data/lifecycle";
import { useStore } from "../data/store";
import { makeId } from "../lib/id";
import { isBlockedText, MODERATION_NOTICE } from "../lib/moderation";
import {
  CHALLENGES,
  DAILY_PROMPTS,
  mostLikelyPoll,
  pick,
  WOULD_YOU_RATHER,
} from "../lib/sparks";
import type { Spark } from "../types";

export function SparkDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [mode, setMode] = useState<"menu" | "poll" | "mostLikely">("menu");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [prompt, setPrompt] = useState("");

  const room = selectedRoom(state);
  if (!room) return null;
  const members = [state.me, ...state.friends].filter((member) => room.memberIds.includes(member.id));

  const post = (spark: Spark) => {
    dispatch({ type: "POST_SPARK", id: makeId("message"), spark, now: Date.now() });
    onClose();
  };

  const postPoll = () => {
    const trimmed = question.trim();
    const cleaned = options.map((option) => option.trim()).filter(Boolean);
    if (!trimmed || cleaned.length < 2) return;
    if (isBlockedText(trimmed) || cleaned.some(isBlockedText)) {
      dispatch({ type: "TOAST", msg: MODERATION_NOTICE });
      return;
    }
    post({ kind: "poll", question: trimmed, options: cleaned, votes: {} });
  };

  const postMostLikely = () => {
    const trimmed = prompt.trim();
    if (!trimmed || members.length < 2) return;
    if (isBlockedText(trimmed)) {
      dispatch({ type: "TOAST", msg: MODERATION_NOTICE });
      return;
    }
    post(mostLikelyPoll(trimmed, members));
  };

  return (
    <div className="spark-drawer" role="dialog" aria-label="Add a spark">
      <div className="spark-drawer-head">
        <strong>{mode === "menu" ? "Add a spark" : mode === "poll" ? "New poll" : "Most likely to…"}</strong>
        <button type="button" className="icon-btn sm" onClick={onClose} aria-label="Close sparks">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {mode === "menu" ? (
        <div className="spark-menu">
          <button type="button" onClick={() => post({ kind: "prompt", label: "Daily Spark", text: pick(DAILY_PROMPTS) })}>
            <Sparkles size={18} aria-hidden="true" /><span>Daily Spark</span>
          </button>
          <button type="button" onClick={() => post({ kind: "prompt", label: "Challenge", text: pick(CHALLENGES) })}>
            <Flame size={18} aria-hidden="true" /><span>Challenge</span>
          </button>
          <button type="button" onClick={() => post({ ...pick(WOULD_YOU_RATHER), kind: "poll", votes: {} })}>
            <Scale size={18} aria-hidden="true" /><span>Would you rather</span>
          </button>
          <button type="button" onClick={() => setMode("mostLikely")}>
            <Crown size={18} aria-hidden="true" /><span>Most likely to</span>
          </button>
          <button type="button" onClick={() => setMode("poll")}>
            <BarChart3 size={18} aria-hidden="true" /><span>Poll</span>
          </button>
        </div>
      ) : null}

      {mode === "poll" ? (
        <div className="spark-form">
          <input
            className="field"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask your circle…"
            maxLength={120}
            aria-label="Poll question"
          />
          {options.map((option, index) => (
            <input
              key={index}
              className="field"
              value={option}
              onChange={(event) => setOptions((current) => current.map((item, i) => (i === index ? event.target.value : item)))}
              placeholder={`Option ${index + 1}`}
              maxLength={60}
              aria-label={`Poll option ${index + 1}`}
            />
          ))}
          {options.length < 4 ? (
            <button type="button" className="spark-add-option" onClick={() => setOptions((current) => [...current, ""])}>
              <Plus size={15} aria-hidden="true" /> Add option
            </button>
          ) : null}
          <div className="spark-form-actions">
            <button type="button" className="btn-small" onClick={() => setMode("menu")}>Back</button>
            <button type="button" className="btn-primary" onClick={postPoll} disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}>Post poll</button>
          </div>
        </div>
      ) : null}

      {mode === "mostLikely" ? (
        <div className="spark-form">
          <div className="spark-most-likely">
            <span>Most likely to</span>
            <input
              className="field"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="fall asleep first tonight"
              maxLength={80}
              aria-label="Most likely to prompt"
            />
          </div>
          <p className="spark-hint">Members become the options: {members.map((member) => member.name).join(", ")}</p>
          <div className="spark-form-actions">
            <button type="button" className="btn-small" onClick={() => setMode("menu")}>Back</button>
            <button type="button" className="btn-primary" onClick={postMostLikely} disabled={!prompt.trim() || members.length < 2}>Post</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
