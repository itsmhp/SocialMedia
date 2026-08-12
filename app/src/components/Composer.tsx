import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore } from "../data/store";
import { makeId } from "../lib/id";
import { isBlockedText, MODERATION_NOTICE } from "../lib/moderation";
import { SparkDrawer } from "./SparkDrawer";

export function Composer() {
  const { dispatch } = useStore();
  const [text, setText] = useState("");
  const [sparksOpen, setSparksOpen] = useState(false);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    if (isBlockedText(t)) {
      dispatch({ type: "TOAST", msg: MODERATION_NOTICE });
      return;
    }
    dispatch({ type: "SEND_MESSAGE", id: makeId("message"), text: t, now: Date.now() });
    setText("");
  };

  return (
    <div className="composer-wrap">
      {sparksOpen ? <SparkDrawer onClose={() => setSparksOpen(false)} /> : null}
      <form className="composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
        <button
          type="button"
          className={"btn-spark" + (sparksOpen ? " active" : "")}
          onClick={() => setSparksOpen((open) => !open)}
          aria-label="Add a spark"
          aria-expanded={sparksOpen}
        >
          <Plus size={20} aria-hidden="true" />
        </button>
        <input
          name="message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something silly…"
          autoComplete="off"
          maxLength={500}
          aria-label="Message"
        />
        <button className="btn-send" type="submit" disabled={!text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
