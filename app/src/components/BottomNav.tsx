import { useStore } from "../data/store";
import type { ScreenName } from "../types";

const TABS: { key: ScreenName; icon: string; label: string }[] = [
  { key: "chat", icon: "💬", label: "Chat" },
  { key: "moments", icon: "✨", label: "Moments" },
  { key: "play", icon: "🎲", label: "Play" },
  { key: "memories", icon: "📸", label: "Memories" },
];

export function BottomNav() {
  const { state, dispatch } = useStore();
  return (
    <nav className="bottomnav">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={"nav-btn" + (state.screen === t.key ? " active" : "")}
          aria-current={state.screen === t.key ? "page" : undefined}
          onClick={() => dispatch({ type: "SET_SCREEN", screen: t.key })}
        >
          <span className="nav-icon" aria-hidden="true">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
