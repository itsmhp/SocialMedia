import type { Session } from "@supabase/supabase-js";
import { requireSupabase } from "./supabase";

export interface AuthSnapshot {
  session: Session | null;
  email: string | null;
}

function redirectUrl(): string {
  const configured = import.meta.env.VITE_AUTH_REDIRECT_URL?.trim();
  if (configured) return configured;
  return new URL(import.meta.env.BASE_URL, window.location.href).href;
}

export function normalizeAuthEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
  return email;
}

export async function currentAuth(): Promise<AuthSnapshot> {
  const client = await requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return { session: data.session, email: data.session?.user.email ?? null };
}

export async function sendMagicLink(email: string): Promise<void> {
  const normalized = normalizeAuthEmail(email);
  const client = await requireSupabase();
  const { error } = await client.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: redirectUrl(),
      shouldCreateUser: true,
    },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const client = await requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function watchAuth(
  onChange: (snapshot: AuthSnapshot) => void,
): Promise<() => void> {
  const client = await requireSupabase();
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    onChange({ session, email: session?.user.email ?? null });
  });
  return () => data.subscription.unsubscribe();
}