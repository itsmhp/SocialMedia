// Backend seam. The app runs entirely on the in-memory mock store until BOTH env
// vars are set (see .env.example). No env = mock, so web/dev just works. Wiring the
// reducer store to these queries + realtime is the next increment.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_ENABLED = Boolean(url && anonKey);

let clientPromise: Promise<import("@supabase/supabase-js").SupabaseClient> | null = null;

/** Lazily creates the client (and loads its bundle) only when Supabase is configured. */
export function getSupabase() {
  if (!SUPABASE_ENABLED) return null;
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(url as string, anonKey as string)
    );
  }
  return clientPromise;
}
