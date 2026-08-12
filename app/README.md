# Falò — app

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
`capacitor.config.ts` sets the app id (`com.falo.app`) and points at `dist/`.

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

- **First-install journey:** three swipeable introductions explain rooms,
  extend-by-vote and Bara before profile setup. The privacy-minimal handle can be
  typed or randomized, paired with an emoji avatar, edited later and saved on
  this device.
- **Settings and profile hub:** a visible avatar/gear opens Profile, Account,
  Appearance, Notifications, Privacy & Safety, Data, Help and About without
  adding a fifth tab. Profile edits warn before discarding changes; theme,
  notification categories and quiet hours persist separately from room data.
- **Adaptive Signal Fire palette:** the original soft, rounded interface now uses
  chalk, ink, coral, teal and yellow semantic tokens. Appearance offers System,
  Light and Dark modes; System follows the device. Locally bundled Inter and
  natural shadows keep the chat calm while the new colors clarify actions and
  lifecycle states.
- **Local data controls:** clear room activity while retaining the profile, or
  reset the entire app back to first-install onboarding. Both destructive actions
  require confirmation. Privacy, Terms, Community Guidelines, support and
  open-source license pages are available in-app.
- **Rooms hub (home):** the app opens on one Rooms surface listing glowing rooms
  and past Bara, with "Light a room" to start a new fire. There is no bottom tab
  bar — navigation lives inside the room hierarchy.
- **Circles:** every room belongs to a permanent, private Circle. Opening the
  group name shows the **Circle profile**: time together, members, fires lit, and
  private records (longest flame, extensions, Bara kept) that only members see.
- **Circle profile:** inspect the current flame's remaining lifetime, elapsed burn
  time and spark. In local mode a host can transfer hosting or remove a member,
  and a member can leave after confirmation. It states plainly that no shareable
  invite exists until secure cloud Circles are verified.
- **Fail-closed data source:** repository selection stays in `localDemo` unless
  cloud configuration, explicit enablement, authentication and schema verification
  all pass. Shared request state rejects stale async completions before remote
  mutations are connected.
- **Chat** (the core): messages + reactions, an absolute **countdown** that
  survives reload/background time, and **extend-by-vote** keyed by stable user
  IDs. A majority adds +24h and opens a fresh vote in the next cycle.
- **Sparks in chat:** a `+` launcher next to the composer drops a Daily Spark,
  Challenge, Would-you-rather, Most-likely-to, or a custom Poll as a room message
  that everyone can vote on and that fades with the room.
- **Keep for Bara:** any message can be bookmarked so it is guaranteed a place in
  the room's Bara recap when the fire fades.
- **Fade -> Bara -> relight:** expiry locks/deletes the raw chat, deterministically
  keeps the warmest and kept messages as a private Bara in the Rooms hub, and can
  light a clean new round from the same Circle.
- **Versioned local persistence:** Circles, rooms, chat, reactions, votes, sparks
  and Bara survive reload while the backend remains dormant.
- Installable PWA shell (manifest + offline service worker); native Android/iOS via Capacitor.

## Structure

```
src/
  main.tsx            app entry + service-worker registration
  App.tsx             phone shell: Header + active room + Toast
  types.ts            domain types (Circle, Room, Message, Spark, ExtendVote, ...)
  styles.css          ember/campfire theme
  lib/id.ts           stable local ID generation
  lib/time.ts         countdown formatting
  lib/sparks.ts       spark prompt/poll presets
  lib/useDialogFocus.ts accessible modal focus handling
  data/
    seed.ts           mock seed data (room near expiry)
    lifecycle.ts      absolute clock, expiry, deterministic Bara, Circle records
    localState.ts     versioned local persistence + v1->v2 Circle migration
    store.tsx         Context + pure reducer — the seam to swap in Supabase
    lifecycle.test.ts lifecycle/reducer/persistence regression tests
    sparks.test.ts    spark posting, poll voting, keep-for-Bara tests
  components/         Rooms hub, Chat, Sparks, Circle profile, Bara, Settings and policies
```

All state changes flow through the reducer in `data/store.tsx`. Swapping the mock
for Supabase means: load a room's messages there, subscribe to Realtime inserts
that `dispatch` into the same reducer, and send mutations to Postgres.

## Backend (Supabase) — foundation only

Today the app runs on a versioned **local store** (great for web/dev and the
single-device lifecycle test). The Supabase seam is not connected to React
queries or mutations yet. Setting environment variables creates an available
client and changes the development console label, but the UI remains local.

Secure auth/RPC/Realtime client operations and a fail-closed fresh-project schema
are now implemented. See [`supabase/README.md`](supabase/README.md) for the exact
activation and three-user RLS verification gate. The React room store is not
connected until that live gate passes.

To prepare a future multi-user environment:

1. Create a free project at [supabase.com](https://supabase.com).
2. Review [`supabase/schema.sql`](supabase/schema.sql) and the security checklist.
  Run it only in a new empty project; live RLS verification is still required.
3. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` +
   `VITE_SUPABASE_ANON_KEY` (Supabase → Settings → API).
4. Restart `npm run dev`. The seam in [`src/lib/supabase.ts`](src/lib/supabase.ts)
  becomes available, but do not treat this as backend activation.

Auth uses an **email magic link** (no SMS/phone). The schema now enforces hashed,
expiring invites, membership checks, roles, removal, reports and blocks; these
must be exercised against the user's live project before the local repository is
replaced by Supabase queries + Realtime mutations.

## Roadmap (next increments)

1. **Secure multi-user closed alpha**
  - Expand the new repository contract into full local/cloud command and hydration
    adapters with pending/error/retry presentation.
  - Connect Room Details to secure invite, member and report/block operations.
  - Run and test the prepared RLS + atomic invite schema on a live project.
  - Verify email magic-link auth, roles, join/leave/remove/report/block.
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
