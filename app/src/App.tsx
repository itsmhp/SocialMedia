import { useEffect, useRef } from "react";
import { StoreProvider, useStore } from "./data/store";
import { Header } from "./components/Header";
import { ChatScreen } from "./components/ChatScreen";
import { ProfileOverlay } from "./components/ProfileOverlay";
import { CreateRoomOverlay } from "./components/CreateRoomOverlay";
import { Toast } from "./components/Toast";
import { SettingsScreen } from "./components/SettingsScreen";
import { RepositoryProvider } from "./data/RepositoryProvider";
import { CircleProfileSheet } from "./components/RoomDetailsSheet";

function Screens() {
  return (
    <main className="scroll chat-scroll" id="scroll">
      <ChatScreen />
    </main>
  );
}

function AppShell() {
  const { state } = useStore();
  const settingsWasOpen = useRef(false);
  const roomDetailsWasOpen = useRef(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const modalOpen = state.roomDetailsOpen || state.creatingRoom || !state.onboarded || state.replayingIntro;

  useEffect(() => {
    shellRef.current?.toggleAttribute("inert", modalOpen);
  }, [modalOpen]);

  useEffect(() => {
    if (state.roomDetailsOpen) {
      roomDetailsWasOpen.current = true;
      return;
    }
    if (!roomDetailsWasOpen.current) return;
    roomDetailsWasOpen.current = false;
    const frame = window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(".circle-profile-entry")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state.roomDetailsOpen]);

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

  return (
    <div ref={shellRef} className="app-shell" aria-hidden={modalOpen ? true : undefined}>
      {state.settingsStack.length ? (
        <SettingsScreen />
      ) : (
        <>
          <Header />
          <Screens />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <RepositoryProvider>
      <StoreProvider>
        <div className="phone">
          <AppShell />
          <Toast />
          <CreateRoomOverlay />
          <CircleProfileSheet />
          <ProfileOverlay />
        </div>
      </StoreProvider>
    </RepositoryProvider>
  );
}
