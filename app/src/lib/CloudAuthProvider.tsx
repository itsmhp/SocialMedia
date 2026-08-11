import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { currentAuth, sendMagicLink, signOut, watchAuth, type AuthSnapshot } from "./auth";
import { SUPABASE_CONFIGURED } from "./supabase";

type CloudAuthStatus =
  | "local"
  | "loading"
  | "signedOut"
  | "sending"
  | "emailSent"
  | "signedIn"
  | "signingOut"
  | "error";

interface CloudAuthValue {
  configured: boolean;
  status: CloudAuthStatus;
  userId: string | null;
  email: string | null;
  error: string | null;
  requestMagicLink: (email: string) => Promise<void>;
  endSession: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CloudAuthContext = createContext<CloudAuthValue | null>(null);

function snapshotState(snapshot: AuthSnapshot): Pick<CloudAuthValue, "status" | "userId" | "email" | "error"> {
  return {
    status: snapshot.session ? "signedIn" : "signedOut",
    userId: snapshot.session?.user.id ?? null,
    email: snapshot.email,
    error: null,
  };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Cloud account request failed. Try again.";
}

export function CloudAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Pick<CloudAuthValue, "status" | "userId" | "email" | "error">>({
    status: SUPABASE_CONFIGURED ? "loading" : "local",
    userId: null,
    email: null,
    error: null,
  });

  const refresh = async () => {
    if (!SUPABASE_CONFIGURED) return;
    setState((current) => ({ ...current, status: "loading", error: null }));
    try {
      setState(snapshotState(await currentAuth()));
    } catch (error) {
      setState({ status: "error", userId: null, email: null, error: messageOf(error) });
    }
  };

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const start = async () => {
      try {
        const snapshot = await currentAuth();
        if (active) setState(snapshotState(snapshot));
        const stop = await watchAuth((next) => {
          if (active) setState(snapshotState(next));
        });
        if (active) unsubscribe = stop;
        else stop();
      } catch (error) {
        if (active) setState({ status: "error", userId: null, email: null, error: messageOf(error) });
      }
    };

    void start();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const requestMagicLink = async (email: string) => {
    setState((current) => ({ ...current, status: "sending", error: null }));
    try {
      await sendMagicLink(email);
      setState({ status: "emailSent", userId: null, email: email.trim().toLowerCase(), error: null });
    } catch (error) {
      setState({ status: "error", userId: null, email, error: messageOf(error) });
    }
  };

  const endSession = async () => {
    setState((current) => ({ ...current, status: "signingOut", error: null }));
    try {
      await signOut();
      setState({ status: "signedOut", userId: null, email: null, error: null });
    } catch (error) {
      setState((current) => ({ ...current, status: "error", error: messageOf(error) }));
    }
  };

  return (
    <CloudAuthContext.Provider
      value={{
        configured: SUPABASE_CONFIGURED,
        ...state,
        requestMagicLink,
        endSession,
        refresh,
      }}
    >
      {children}
    </CloudAuthContext.Provider>
  );
}

export function useCloudAuth() {
  const context = useContext(CloudAuthContext);
  if (!context) throw new Error("useCloudAuth must be used within CloudAuthProvider");
  return context;
}