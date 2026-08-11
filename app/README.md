# Unggun — app

Fun group chat **rooms that don't last forever**. A room glows for 12–24h, the
circle can **vote to keep the fire going** (+24h), and when it finally fades it
leaves a small **Bara** recap. Human-first, small circles, no algorithmic feed.

> This is the real app (the earlier clickable demo lives in [`../prototype/`](../prototype/index.html)).
> The concept and its gate live in [`../concept/`](../concept/README.md) and [`../validation/`](../validation/README.md).

## Stack

- **Vite + React + TypeScript** single-page app, shipped as an installable **PWA**.
- **Capacitor** wraps the same web build into native **Android + iOS** apps (one codebase → web + both stores).
- **Supabase foundation** (Postgres + Auth + Realtime) — the lazy client seam +
  draft SQL schema are in place, but the UI store is intentionally still local.
  Environment variables only configure the client; they do not switch the app
  to a real backend yet (see "Backend" below).
- Static hosting (Cloudflare Pages / Vercel / Netlify free tier) — no server to run.

Chosen for a 2-person, no-budget team: one codebase, $0 hosting, realtime built
in, and it reuses the existing web prototype's design.

## Run it

```bash
cd app
npm install
npm run dev      # http://localhost:5173
```

Other scripts: `npm test` (domain/lifecycle tests), `npm run build` (type-check +
production build), `npm run preview` (serve the build, incl. the service worker).

## Mobile apps (Android + iOS via Capacitor)

The same web build is wrapped natively by [Capacitor](https://capacitorjs.com).
`capacitor.config.ts` sets the app id (`com.unggun.app`) and points at `dist/`.

**Android** (the `android/` project is committed):

```bash
npm run android      # build web + sync + open Android Studio
```

Needs a JDK + Android Studio (Android SDK). From there: run on a device/emulator,
or Build → Generate Signed Bundle/APK for the Play Store.

**iOS** (needs macOS — Xcode + CocoaPods):

```bash
npx cap add ios      # run once, on a Mac, to create the ios/ project
npm run ios          # build web + sync + open Xcode
```

You're on Windows, so build/submit iOS from a **Mac** or a **cloud-Mac CI**
(GitHub Actions macOS runner, Codemagic, or Ionic Appflow) — no Mac purchase
required. After any web change, run `npm run cap:sync` to copy it into the native
projects.

**Store accounts (the only unavoidable cost):** Google Play $25 one-time,
Apple Developer $99/year.

## Deploy the web / PWA

The production build uses **relative asset paths**, so it runs at a domain root
or a subpath unchanged.

**GitHub Pages (already set up).** [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml)
builds `app/` and deploys on every push to `main`. One-time: repo **Settings →
Pages → Source: GitHub Actions** (needs a public repo, or GitHub Pro). Then it's
live at `https://<user>.github.io/<repo>/`.

**Vercel / Netlify / Cloudflare Pages (root-domain, a few clicks).** Connect the
repo and set **Root Directory = `app`**, build command `npm run build`, output
directory `dist`. All have a free tier with no server to run.

## What works now

- **First-run profile:** privacy-minimal handle + emoji avatar, editable later and
  saved on this device.
- **Rooms:** open the room switcher, light a private room with a spark, choose a
  12h/24h lifetime and local circle members, then switch among active rooms.
- **Chat** (the core): messages + reactions, an absolute **countdown** that
  survives reload/background time, and **extend-by-vote** keyed by stable user
  IDs. A majority adds +24h and opens a fresh vote in the next cycle.
- **Fade -> Bara -> relight:** expiry locks/deletes the raw chat, deterministically
  keeps the warmest messages as a private Bara, shows factual counts in Memories,
  and can light a clean new round from the same circle.
- **Versioned local persistence:** rooms, chat, reactions, votes, Moments, game
  state and Bara survive reload while the backend remains dormant.
- **Moments / Play** tabs remain local supporting experiments; deeper work on
  them is deferred until the room loop is validated.
- Installable PWA shell (manifest + offline service worker); native Android/iOS via Capacitor.

## Structure

```
src/
  main.tsx            app entry + service-worker registration
  App.tsx             phone shell: Header + active screen + BottomNav + Toast
  types.ts            domain types (Message, Room, ExtendVote, ...)
  styles.css          ember/campfire theme
  lib/id.ts           stable local ID generation
  lib/time.ts         countdown formatting
  lib/useDialogFocus.ts accessible modal focus handling
  data/
    seed.ts           mock seed data (room near expiry)
    lifecycle.ts      absolute clock, expiry, deterministic Bara
    localState.ts     versioned local persistence
    store.tsx         Context + pure reducer — the seam to swap in Supabase
    lifecycle.test.ts lifecycle/reducer/persistence regression tests
  components/         Rooms, CreateRoom, Chat, Vote, Bara, Memories, profile
```

All state changes flow through the reducer in `data/store.tsx`. Swapping the mock
for Supabase means: load a room's messages there, subscribe to Realtime inserts
that `dispatch` into the same reducer, and send mutations to Postgres.

## Backend (Supabase) — foundation only

Today the app runs on a versioned **local store** (great for web/dev and the
single-device lifecycle test). The Supabase seam is not connected to React
queries or mutations yet. Setting environment variables creates an available
client and changes the development console label, but the UI remains local.

To prepare a future multi-user environment:

1. Create a free project at [supabase.com](https://supabase.com).
2. For isolated development only, inspect [`supabase/schema.sql`](supabase/schema.sql)
  as a draft of the tables, RLS and realtime publication. Do not use it for real
  users until the RLS corrections below are implemented and tested.
3. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` +
   `VITE_SUPABASE_ANON_KEY` (Supabase → Settings → API).
4. Restart `npm run dev`. The seam in [`src/lib/supabase.ts`](src/lib/supabase.ts)
  becomes available, but do not treat this as backend activation.

Before wiring, the draft RLS must be tightened for invite-only membership,
reaction membership checks, shared-room profile visibility, roles and removal.
Then auth will use an **email magic link** (no SMS/phone), and the local repository
interface can be replaced by verified Supabase queries + realtime mutations.

## Roadmap (next increments)

1. **Secure multi-user closed alpha**
   - Tighten and test RLS + an atomic, expiring/revocable invite transaction.
   - Add email magic-link auth, room roles, join/leave/remove/report/block.
   - Replace the local repository with queries, mutations and Realtime while
     keeping expiry/Bara server-authoritative and idempotent.
2. **Local hardening**
   - Empty/failure/offline/reconnect states, accurate locale timestamps, input
     and rate limits, plus broader accessibility/E2E coverage.
3. **Push notifications** — Web Push (PWA) + Capacitor Push / APNs+FCM (native) for the "the room is voting to stay alive" re-engagement hook.
4. **Native polish** — Capacitor plugins (Status Bar, Splash Screen, Keyboard, hardware back button) + real PNG / Android adaptive icons.
5. **iOS project** — `npx cap add ios` on a Mac / cloud-Mac CI, then wire signing.
6. Deploy the web/PWA to a free static host + share link for the 14-day test.

## Constraints (kept)

No AI features. English by default. Small private circles, ephemeral by design,
privacy-minimal (handle + emoji avatar; no real name/GPS; email magic link).
