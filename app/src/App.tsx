import { useEffect, useRef } from "react";
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
import { SettingsScreen } from "./components/SettingsScreen";

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

function AppShell() {
  const { state } = useStore();
  const settingsWasOpen = useRef(false);

  useEffect(() => {
    if (state.settingsStack.length) {
      settingsWasOpen.current = true;
      return;
    }
    if (!settingsWasOpen.current) return;
    settingsWasOpen.current = false;
    if (!state.onboarded) return;
    const frame = window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(".settings-entry")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state.settingsStack.length, state.onboarded]);

  if (state.settingsStack.length) return <SettingsScreen />;
  return (
    <>
      <Header />
      <Screens />
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <div className="phone">
        <AppShell />
        <Toast />
        <CreateRoomOverlay />
        <ProfileOverlay />
      </div>
    </StoreProvider>
  );
}
