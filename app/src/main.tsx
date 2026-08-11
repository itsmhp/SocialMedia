import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App";
import { SUPABASE_CONFIGURED } from "./lib/supabase";
import { CloudAuthProvider } from "./lib/CloudAuthProvider";
import { captureInviteTokenFromAddressBar } from "./lib/invite";
import "./styles.css";

captureInviteTokenFromAddressBar();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CloudAuthProvider>
      <App />
    </CloudAuthProvider>
  </StrictMode>
);

if (import.meta.env.DEV) {
  const backend = SUPABASE_CONFIGURED ? "Supabase client configured; UI store remains local" : "local";
  console.info(`[Unggun] data source: ${backend}`);
}

// Register the service worker only for the web PWA (not inside the native app).
if ("serviceWorker" in navigator && import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
