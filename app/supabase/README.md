# Supabase activation

The cloud foundation is implemented but deliberately **not enabled by default**.
Unggun remains fully usable in local mode. A live project is required before the
repository adapter can be connected and honestly called multi-user.

## What is ready

- lazy Supabase JS client (zero network requests without configuration);
- email magic-link session APIs and conditional account UI;
- typed client operations for rooms, invites, membership, messages, reactions,
  extension votes, reports, blocks, and Realtime channel cleanup;
- fresh-project schema with fail-closed RLS;
- atomic room creation (creator membership is created in the same transaction);
- expiring, revocable, use-capped invites stored only as SHA-256 hashes;
- atomic join with row locking, capacity enforcement, and removed-member denial;
- server-side extension majority resolution per cycle;
- idempotent server-side fade/Bara generation before raw chat deletion;
- 12 local tests, including static security contract checks.

## What is not yet verified

- SQL execution against a real Supabase Postgres instance;
- RLS behavior across owner, member, removed member, and unrelated user;
- magic-link email delivery and redirect allow-list;
- two-browser Realtime behavior;
- server cron execution;
- synchronization between remote rows and the React room store.

Do not enable cloud room writes until those checks pass.

## Safe setup

1. Create a **new**, empty Supabase project. Do not reuse a project containing
   data from the earlier draft schema.
2. In Auth -> URL Configuration, set the production Site URL and allow the exact
   local/preview callback URLs used for testing.
3. Run [`schema.sql`](schema.sql) once in the SQL editor. It intentionally fails
   if the application tables already exist.
4. Copy [`.env.example`](../.env.example) to `.env` and add only:
   `VITE_SUPABASE_URL`, the publishable/anon key, and optionally
   `VITE_AUTH_REDIRECT_URL`.
5. Never put a service-role key in Vite environment variables, source code,
   browser storage, chat, screenshots, or issue reports.
6. Start `npm run dev`, open Memories, and request a magic link from the Cloud
   account card.

Official references used:

- [Passwordless email auth](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Database functions](https://supabase.com/docs/guides/database/functions)
- [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)

## Required verification gate

Use three distinct authenticated browser profiles:

1. **Owner:** creates a room and invite.
2. **Invited member:** previews and joins with the token.
3. **Unrelated user:** knows the room UUID but has no invite.

Verify all of the following:

- owner and member can read the room, membership, messages, votes, and Bara;
- unrelated user cannot read or mutate any room child row;
- direct insert into `room_members`, `room_invites`, `rooms`, and `extend_votes`
  is denied;
- expired, revoked, exhausted, and full-room invites cannot join;
- removed members cannot rejoin with an invite;
- duplicate join retries do not consume another invite use;
- two simultaneous final majority votes extend exactly once;
- a fade creates one Bara, snapshots up to five highlights, preserves report
  evidence, and deletes raw messages;
- leaving/removal stops future reads after Realtime reconnect;
- every Realtime channel is removed when changing rooms or signing out.

Only after this gate passes should `supabaseRepository.ts` hydrate the shared
React store and replace local mutations with remote operations.