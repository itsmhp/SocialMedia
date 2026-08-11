import { useState } from "react";
import { useStore } from "../data/store";
import { makeId } from "../lib/id";

export function Composer() {
  const { dispatch } = useStore();
  const [text, setText] = useState("");

  const send = () => {
    const t = text.trim();
    if (!t) return;
    dispatch({ type: "SEND_MESSAGE", id: makeId("message"), text: t, now: Date.now() });
    setText("");
  };

  return (
    <form className="composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
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
  );
}
