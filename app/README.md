# Unggun — app

Fun group chat **rooms that don't last forever**. A room glows for 12–24h, the
circle can **vote to keep the fire going** (+24h), and when it finally fades it
leaves a small **Bara** recap. Human-first, small circles, no algorithmic feed.

> This is the real app (the earlier clickable demo lives in [`../prototype/`](../prototype/index.html)).
> The concept and its gate live in [`../concept/`](../concept/README.md) and [`../validation/`](../validation/README.md).

## Stack

- **Vite + React + TypeScript** single-page app, shipped as an installable **PWA**.
- **Capacitor** wraps the same web build into native **Android + iOS** apps (one codebase → web + both stores).
- **Supabase-ready** (Postgres + Auth + Realtime + Storage) — not wired yet; the
  app currently runs on an in-memory mock store so it works with zero setup.
- Static hosting (Cloudflare Pages / Vercel / Netlify free tier) — no server to run.

Chosen for a 2-person, no-budget team: one codebase, $0 hosting, realtime built
in, and it reuses the existing web prototype's design.

## Run it

```bash
cd app
npm install
npm run dev      # http://localhost:5173
```

Other scripts: `npm run build` (type-check + production build), `npm run preview`
(serve the build, incl. the service worker).

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

- **Chat** tab (the core): live 24h **countdown**, a fun ephemeral group chat,
  tap-to-react, and the **extend-by-vote** card near expiry — a majority "keep"
  adds +24h, drops a system note, and resets the countdown.
- **Moments / Play / Memories** tabs (ported from the prototype): a daily-prompt moments feed with reactions, a "Most likely to…" poll, and a warm recap.
- Installable PWA shell (manifest + offline service worker); native Android/iOS via Capacitor.

## Structure

```
src/
  main.tsx            app entry + service-worker registration
  App.tsx             phone shell: Header + active screen + BottomNav + Toast
  types.ts            domain types (Message, Room, ExtendVote, ...)
  styles.css          ember/campfire theme
  lib/time.ts         countdown formatting
  data/
    seed.ts           mock seed data (room near expiry)
    store.tsx         Context + reducer store — the seam to swap in Supabase
  components/         Header, BottomNav, ChatScreen, MessageBubble,
                      ExtendVoteCard, Composer, Placeholder, Toast
```

All state changes flow through the reducer in `data/store.tsx`. Swapping the mock
for Supabase means: load a room's messages there, subscribe to Realtime inserts
that `dispatch` into the same reducer, and send mutations to Postgres.

## Roadmap (next increments)

1. **Wire Supabase**
   - Tables (sketch): `rooms(id, name, created_at, expires_at, resolved)`,
     `room_members(room_id, user_id, avatar)`, `messages(id, room_id, user_id, body, created_at)`,
     `reactions(message_id, user_id, emoji)`, `extend_votes(room_id, user_id, choice)`.
   - **Row-Level Security** so only a room's members can read/write it (enforces
     the private, self-contained rule).
   - **Realtime** subscription on `messages` + `extend_votes`.
   - **Auth:** email magic link (no SMS/phone) — privacy-minimal.
   - A DB job/trigger fades rooms past `expires_at` and writes the Bara recap.
2. **Push notifications** — Web Push (PWA) + Capacitor Push / APNs+FCM (native) for the "the room is voting to stay alive" re-engagement hook.
3. **Native polish** — Capacitor plugins (Status Bar, Splash Screen, Keyboard, hardware back button) + real PNG / Android adaptive icons.
4. **iOS project** — `npx cap add ios` on a Mac / cloud-Mac CI, then wire signing.
5. Deploy the web/PWA to a free static host + share link for the 14-day test.

## Constraints (kept)

No AI features. English by default. Small private circles, ephemeral by design,
privacy-minimal (handle + emoji avatar; no real name/GPS; email magic link).
