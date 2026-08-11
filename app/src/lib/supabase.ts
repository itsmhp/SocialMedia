// Backend seam. The UI remains local until the repository adapter is wired and
// verified against a live project. These variables only configure the client.
const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

function validBackendUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export const SUPABASE_CONFIGURED = Boolean(anonKey && validBackendUrl(url));

let clientPromise: Promise<import("@supabase/supabase-js").SupabaseClient> | null = null;

export function getSupabase() {
  if (!SUPABASE_CONFIGURED) return null;
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(url, anonKey)
    );
  }
  return clientPromise;
}

export async function requireSupabase() {
  const pending = getSupabase();
  if (!pending) throw new Error("Supabase is not configured for this build.");
  return pending;
}
