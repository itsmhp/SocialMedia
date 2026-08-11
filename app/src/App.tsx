import { StoreProvider, useStore } from "./data/store";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { ChatScreen } from "./components/ChatScreen";
import { MomentsScreen } from "./components/MomentsScreen";
import { PlayScreen } from "./components/PlayScreen";
import { MemoriesScreen } from "./components/MemoriesScreen";
import { ProfileOverlay } from "./components/ProfileOverlay";
import { CreateRoomOverlay } from "./components/CreateRoomOverlay";
import { Toast } from "./components/Toast";

function Screens() {
  const { state } = useStore();
  return (
    <main className={"scroll" + (state.screen === "chat" ? " chat-scroll" : "")} id="scroll">
      {state.screen === "chat" && <ChatScreen />}
      {state.screen === "moments" && <MomentsScreen />}
      {state.screen === "play" && <PlayScreen />}
      {state.screen === "memories" && <MemoriesScreen />}
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
        <CreateRoomOverlay />
        <ProfileOverlay />
      </div>
    </StoreProvider>
  );
}
