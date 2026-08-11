import { useState } from "react";
import { useStore } from "../data/store";
import { MomentCard } from "./MomentCard";

const MOODS = ["😊", "😌", "🥰", "😂", "😮‍💨", "🎶", "🔥"];
const PROMPT = "What's one little thing that made you smile today? 😊";

export function MomentsScreen() {
  const { state, dispatch } = useStore();
  const [text, setText] = useState("");
  const [mood, setMood] = useState("😊");

  const share = () => {
    if (!text.trim()) {
      dispatch({ type: "TOAST", msg: "Write your moment first 🙂" });
      return;
    }
    dispatch({ type: "ADD_MOMENT", text, mood });
    setText("");
    setMood("😊");
  };

  return (
    <section className="screen active">
      <div className="prompt-card">
        <div className="prompt-label">Today's Prompt</div>
        <div className="prompt-text">{PROMPT}</div>
        <div className="compose">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Share an unfiltered moment with your circle…"
          />
          <div className="mood-row">
            {MOODS.map((mo) => (
              <button
                key={mo}
                className={"mood" + (mood === mo ? " active" : "")}
                onClick={() => setMood(mo)}
              >
                {mo}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={share}>
            Share Moment
          </button>
        </div>
      </div>

      <div className="feed">
        {state.moments.map((m) => (
          <MomentCard key={m.id} m={m} />
        ))}
      </div>

      <div className="finite-note">— that's all today's moments · we start again tomorrow 🌙 —</div>
    </section>
  );
}
