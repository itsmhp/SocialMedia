import { useState } from "react";
import { useStore } from "../data/store";

export function Composer() {
  const { dispatch } = useStore();
  const [text, setText] = useState("");

  const send = () => {
    const t = text.trim();
    if (!t) return;
    dispatch({ type: "SEND_MESSAGE", text: t });
    setText("");
  };

  return (
    <div className="composer">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            send();
          }
        }}
        placeholder="Say something silly…"
        autoComplete="off"
        aria-label="Message"
      />
      <button className="btn-send" onClick={send}>
        Send
      </button>
    </div>
  );
}
