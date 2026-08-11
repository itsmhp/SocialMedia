import { StoreProvider, useStore } from "./data/store";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { ChatScreen } from "./components/ChatScreen";
import { Placeholder } from "./components/Placeholder";
import { Toast } from "./components/Toast";

function Screens() {
  const { state } = useStore();
  return (
    <main className="scroll" id="scroll">
      {state.screen === "chat" && <ChatScreen />}
      {state.screen === "moments" && (
        <Placeholder emoji="✨" title="Moments" line="Little unfiltered moments with your circle. Porting from the prototype next." />
      )}
      {state.screen === "play" && (
        <Placeholder emoji="🎲" title="Play" line="Silly group games to keep a room alive. Porting next." />
      )}
      {state.screen === "memories" && (
        <Placeholder emoji="📸" title="Memories" line="Bara — warm recaps of rooms that faded. Porting next." />
      )}
    </main>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <div className="phone">
        <Header />
        <Screens />
        <BottomNav />
        <Toast />
      </div>
    </StoreProvider>
  );
}
