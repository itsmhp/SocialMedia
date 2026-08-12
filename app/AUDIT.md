# Unggun Application Audit

**Audit date:** 2026-08-11  
**Baseline:** commit `baef508`  
**Implementation update:** local L0 lifecycle implemented in the current working tree  
**Scope:** Product completeness, core room lifecycle, local state, UX/accessibility,
PWA/native readiness, backend seam, security, and testability.  
**Reference product definition:**
[`concept/04-rooms-and-lanes.md`](../concept/04-rooms-and-lanes.md) and the thin-MVP
gate in [`validation/02-14-day-experiment.md`](../validation/02-14-day-experiment.md).

## Implementation update

The audit was acted on immediately. The current working tree now includes:

- stable IDs for users, rooms, messages and all identity-sensitive votes;
- absolute `expiresAt` countdowns with resume/reload reconciliation;
- versioned local persistence for rooms, chat, reactions, votes, Moments, game
  state and Bara;
- a Rooms hub and “Light a room” flow with spark, duration and private members;
- repeatable extension cycles, deterministic fade, raw-chat deletion, factual
  Bara, Memories integration and relight;
- removal of fictional presence/streak/hangout recap from the core surfaces;
- semantic toggle/progress/live-region states, visible focus, reduced motion,
  larger touch targets and dialog focus trapping;
- five Vitest domain/persistence tests plus a production-browser acceptance run.

Verified locally: create -> send -> reload -> extend -> expire on reload -> Bara ->
Memories -> relight -> reload. Tests pass 5/5 and the production build transforms
98 modules without errors.

The app is now suitable for **single-device local dogfood of the core room loop**.
It is still not a multi-user closed alpha: secure invite/join, auth, realtime,
server-authoritative expiry, safety operations and corrected RLS remain L1 work.

### L1 foundation update

The current working tree now also contains the code foundation for that next gate:

- fail-closed fresh-project schema with private authorization helpers;
- atomic create room, hashed invite, join, revoke, leave, remove and extension-vote RPCs;
- server-authoritative idempotent fade/Bara finalization;
- report evidence retention plus block/report policies;
- magic-link session client and conditional account UI;
- typed room/invite/message/reaction/vote/report/block/Realtime adapter;
- lifecycle, schema/auth/invite and random-handle contract tests (15 tests total).

This does **not** change the readiness verdict to multi-user. A live Supabase project
and three authenticated test users are required to execute the SQL, verify RLS and
Realtime, and then connect the adapter to the React store. The exact gate is documented
in [`supabase/README.md`](supabase/README.md).

### First-install UX update

First-run users now see three swipeable introduction pages covering the core room,
extend-vote and Bara loop before creating a profile. Profile setup can generate a
schema-valid random handle, supports Back/Skip, persists completion across reload, and
editing an existing profile opens directly without replaying the introduction.

### Settings and profile update

The first Settings milestone is now implemented locally:

- a visible header avatar/gear opens a secondary Settings stack and Back returns
  to the previously active bottom tab;
- Profile, Account, Notifications, Privacy & Safety, Data, Help and About groups
  expose the existing editor/cloud account plus truthful local-alpha status;
- notification categories and quiet hours use separate versioned preference
  storage without requesting system permission prematurely;
- profile editing warns before discarding unsaved changes and only commits local
  profile state after a configured signed-in cloud update succeeds;
- clear activity preserves profile/onboarding while removing rooms, Moments,
  game votes and Bara; full reset removes local profile/preferences and returns
  to a genuinely empty first-install state;
- Privacy Policy, Terms, Community Guidelines, public support and dependency
  license destinations are accessible in-app.

That milestone was verified with 29/29 Vitest tests, production TypeScript/Vite build,
zero editor diagnostics, and browser checks at 320x568, 390x844 and 1440x900.
No horizontal overflow was found; keyboard/focus, unsaved-change confirmation,
preference reload, prior-tab return, clear and reset flows were exercised.

### Repository and room-details update

The first Phase 2A increment is implemented locally:

- a fail-closed repository selector requires configuration, explicit enablement,
  authentication and schema verification before cloud mode can be selected;
- keyed async operation state ignores stale success/failure from overlapping
  requests and exposes consistent pending/error/retry metadata;
- a header control opens Room Details with lifetime, spark, role and member list;
- local host transfer and member removal enforce ownership rules, while members
  can leave after confirmation; membership-count changes reset the active ballot;
- the room sheet truthfully disables shareable invites in local mode instead of
  producing a link that another user cannot join;
- nested confirmation dialogs make the parent sheet inert/hidden and restore
  keyboard focus to a stable control.

Current verification: 42/42 Vitest tests, production TypeScript/Vite build,
zero editor diagnostics, final code-review pass, and browser checks at 320x568,
390x844 and 1440x900 with no horizontal overflow. Secure invite/join,
report/block UI, cloud hydration and Realtime remain open work.

### Signal Fire palette update

The previous brown, dark-only palette has been replaced while retaining the
app's original soft, rounded visual language:

- light mode uses chalk, ink, coral, accessible teal and yellow status surfaces;
- Appearance provides persistent System, Light and Dark choices; System follows
  `prefers-color-scheme` and updates when the device changes;
- locally bundled Inter, rounded cards and natural shadows preserve the
  earlier chat experience without the old brown cast;
- browser theme colors and the PWA manifest now match the new identity.

Rendered-surface scans across Chat, Moments, Play, Memories, Settings and Room
Details found no legacy brown backgrounds. Light/dark token contrast passes for
body, muted, coral, teal and primary-action text; responsive checks at 320x568,
390x844 and 1440x900 show no page-level horizontal overflow.

Room Details also exposes a live, compact elapsed burn time from the room's
persisted `createdAt`, capped at `expiresAt` after fade so the achievement stays
truthful rather than increasing forever.

## Executive verdict

At the audited baseline, Unggun was a coherent **interactive prototype**. After the
local L0 implementation above, its defining loop is now usable on one device, but it
is not yet a multi-user social app or closed-alpha MVP.

The strongest parts are the differentiated campfire concept, focused visual language,
working local onboarding/profile, chat composition and reactions, the visible timer,
and the extend-vote interaction. The local implementation now closes this loop except
for bringing a real second participant through a secure invite:

> light a room -> invite a circle -> chat/react -> extend or fade -> Bara -> light again

The remaining product boundary is the network: there is still no secure join/invite
flow, real second participant, auth/realtime store, server-authoritative expiry, or
moderation operations.

**Recommendation:** the standalone Moments/Play/Memories tabs were removed in favor
of one Rooms hub, a Circle profile behind the group name, and in-room Sparks; do not
re-add discovery or meetup features yet. Connect the proven local repository contract
to a corrected Supabase model and pass the two-browser closed-alpha gate next.

## Readiness

| Target | Status | Reason |
| --- | --- | --- |
| Concept/demo presentation | Ready | Core look, chat, reactions, countdown, vote, and profile are demonstrable. |
| Single-device local dogfood | Ready for core loop | Create, persist, extend, fade, Bara and relight pass locally; supporting tabs remain experimental. |
| Multi-user closed alpha | Not ready | No auth, create/join/invite, realtime store, secure membership flow, or safety controls. |
| Public web beta | Not ready | Multi-user access control, reliability, moderation, and operational states are incomplete. |
| Android/iOS release | Not ready | Android is scaffolded, iOS is not; icons, native plugins, signing, notifications, and device testing remain. |

## What exists today

| Capability | Maturity | Audit note |
| --- | --- | --- |
| First-run handle + emoji avatar | Functional locally | Stored in `localStorage`; Settings edit/randomize/save/cancel and discard warning work. Signed-in cloud-first update errors are surfaced. |
| Settings and local data controls | Functional locally | Secondary navigation, versioned preferences, quiet hours, policy/support/license pages, confirmed clear and full reset work. Notification delivery and cloud deletion remain future work. |
| Chat composition | Functional locally | Messages are length-capped and persist across reload. No network delivery, retry, delete, or realtime yet. |
| Message reactions | Functional locally | Toggle state persists; multi-user voter records remain L1 backend work. |
| Countdown | Functional locally | Absolute `expiresAt` reconciles reload/background time and triggers deterministic expiry. |
| Extend vote | Functional locally | Stable user IDs, majority logic, +24h, cycle reset, and extension cap are implemented and tested. |
| Room fade | Functional locally | Expiry locks the room, deletes raw chat, and creates Bara exactly once. |
| Bara recap | Functional locally | Deterministic top highlights and factual counts appear in the faded room and Memories. |
| Room creation / Spark | Functional locally | Name, spark, 12h/24h duration, and private local member selection. |
| Circles / room list / switching | Partial | Active/faded room switching works; circle membership is still local seed data. |
| Room details / local membership | Functional locally | Status and members are visible; local host transfer/remove and member leave are confirmed and tested. No shareable invite or remote membership yet. |
| Invite / join | Missing | Secure RPC wrappers exist, but there is no consumer flow and the React store remains local. |
| Authentication + multi-user realtime | Missing | Supabase client/schema exist, but the React store never calls them. |
| Circles | Functional locally | Every room belongs to a permanent private Circle; the group name opens a Circle profile with members, time together, and private records. v1 data migrates into Circles on load. |
| Sparks in chat | Functional locally | A `+` launcher posts Daily Spark, Challenge, Would-you-rather, Most-likely-to, and custom Polls as room messages; poll votes use stable member IDs and fade with the room. |
| Keep for Bara | Functional locally | Any message can be bookmarked to guarantee its place in the room's Bara recap. |
| PWA | Partial | Manifest and service worker exist; production icons/update/offline UX are incomplete. |
| Native apps | Foundation only | Capacitor + Android scaffold exist; no completed release path or device verification. |
| Automated tests | Initial coverage | 42 domain/reducer/persistence/contract tests pass; committed browser E2E and live RLS tests remain. |

## P0 - Core blockers

Resolved headings below retain their original baseline evidence for traceability. The
implementation update at the top is the current status.

### 1. The campfire lifecycle does not complete — resolved locally

**Evidence**

- [`src/data/store.tsx`](src/data/store.tsx#L35-L39) returns the same state once
  `remaining <= 0`; it does not fade or archive the room.
- [`src/types.ts`](src/types.ts#L21-L28) has no room ID, lifecycle status, expiry
  timestamp, Bara, or archive model.
- [`src/components/MemoriesScreen.tsx`](src/components/MemoriesScreen.tsx#L21-L35)
  renders fixed recap numbers and emoji tiles.
- A successful extension sets `extend.resolved = true`, and no action resets it for a
  later cycle. The room can therefore reach its next deadline without another vote.

**Impact**

The app cannot deliver its defining promise or test whether expiry, extension, Bara,
and return behavior are valuable.

**Required outcome**

- Model `Room.status` (`active`, `voting`, `faded`), `expiresAt`, extension cycles, and
  a persisted `Bara` record.
- Derive time left from `expiresAt - now`, including after reload/resume.
- At expiry: lock posting, create a deterministic 3-5 item Bara, remove or hide the raw
  chat according to the product policy, and expose “Light another room.”
- Reopen a fresh vote in each eligible cycle until an explicit lifetime cap is reached.
- Add an accelerated-clock test so the entire lifecycle can be verified in seconds.

### 2. There is no entry or return loop — local create/rooms/relight resolved; invite remains L1

**Evidence**

- [`src/data/seed.ts`](src/data/seed.ts#L10-L61) supplies the only room, members,
  presence, messages, moments, and votes.
- [`src/types.ts`](src/types.ts#L46-L58) stores one `room`, not a room collection or
  active room ID.
- There is no create-room, room-list, invite, join, leave, or relight component/action.

**Impact**

A real circle cannot start using Unggun. The app also cannot measure room activation,
participation, lively rooms, extend pull, 48-hour return, or organic hosts from the
validation plan.

**Required outcome**

- Add a Home/Rooms surface showing active rooms, fading rooms, and recent Bara.
- Add “Light a room”: name, spark/prompt, 12h or 24h duration, and private-by-default
  membership.
- Add invite-code/link creation, join preview, member cap, expiry, revoke, and optional
  host approval.
- After a fade, support relighting from the same circle without restoring the old chat.

### 3. Mutable display values are used as identity — resolved locally

**Evidence**

- [`src/types.ts`](src/types.ts#L10-L19) stores extend voters as avatar strings.
- [`src/data/store.tsx`](src/data/store.tsx#L67-L72) removes/adds a vote by the current
  emoji avatar. The profile picker permits the same emoji as seeded friends.
- [`src/types.ts`](src/types.ts#L40-L44) and
  [`src/data/store.tsx`](src/data/store.tsx#L124-L139) key game votes by display name.
- Chat ownership is inferred from the literal author string `"You"` rather than a user
  ID.

**Impact**

Two people with the same avatar or handle can overwrite/collapse votes. Changing a
profile can orphan prior state. This will break as soon as real users are connected.

**Required outcome**

Give every user, room, message, vote, reaction, moment, and Bara a stable opaque ID.
Use IDs for all logic and use handle/avatar only for display. Enforce one vote per
`(roomId, cycleId, userId)`.

### 4. Activity and time are not persisted — resolved locally

**Evidence**

- [`src/data/store.tsx`](src/data/store.tsx#L167-L177) initializes directly from the
  seed and only starts a one-second interval.
- Only [`src/lib/profile.ts`](src/lib/profile.ts#L1-L26) writes to local storage.
- Browser audit at 390x844: sending a message changed the message count from 6 to 7;
  reload returned it to 6.

**Impact**

Messages, reactions, votes, moments, game state, streaks, and countdown progress vanish
on refresh/app restart. Background timer throttling can also make expiry inaccurate.

**Required outcome**

Add a small versioned local repository (localStorage is sufficient for text-only
dogfood; IndexedDB if media arrives). Persist domain events/state, migrate old versions,
recover safely from malformed data, and always calculate time from an absolute expiry.
Keep this repository behind a narrow interface that Supabase can replace later.

### 5. The draft backend must not be enabled as-is — open L1 blocker

**Evidence**

- [`supabase/schema.sql`](supabase/schema.sql#L77-L78) allows any authenticated user to
  insert themselves into `room_members`; no invite token, approval, expiry, revocation,
  or capacity check is enforced.
- The reaction insert policy checks `user_id = auth.uid()` but does not verify membership
  in the message's room.
- Profiles are readable by every authenticated account, not only shared-room members.
- There are no host policies for removing members, rotating invites, deleting a room,
  or a member leaving.
- The optional expiry job only sets `rooms.resolved`; it does not create Bara or enforce
  deletion/retention.

**Impact**

Knowing/leaking a UUID could bypass the intended invite-only model, and the schema does
not support the promised host/safety lifecycle.

**Required outcome before Supabase wiring**

- Join through a server-side/RPC transaction that validates a hashed invite token,
  expiry, revocation, room capacity, and approval policy.
- Require current room membership on every message, reaction, and vote mutation.
- Restrict profile visibility to self and shared-room members.
- Add host/member roles and explicit leave, remove, revoke, and delete policies.
- Create room + creator membership atomically.
- Test RLS with owner, member, removed member, invited stranger, and unrelated user.

## P1 - High-priority gaps

### 6. Several screens present fictional state as real state

- Presence is always “Dinda, Raka & Sasa are here now.”
- Memories always reports 12 moments, 1 real hangout, and 34 reactions even though the
  app has no hangout feature.
- The streak begins at 5 and increases on every moment post, so repeated posts can farm
  it in one session.
- Message and moment timestamps are fixed strings rather than stored dates.

Derive these values from state or label the build clearly as demo data. For local
dogfood, remove any metric that is not truthful. False social proof will damage trust
and contaminate validation results.

### 7. Minimum safety and member controls are absent

Before inviting real users, add:

- leave room;
- block member;
- report message/member with a reason and review status;
- delete own message;
- host remove member;
- revoke/rotate invite;
- room/member caps and client/server rate limits;
- clear community rules, privacy summary, and account/data deletion path.

These are needed even for private circles. Discovery and Daily Unggun must remain off
until report/review operations work.

### 8. Accessibility and touch behavior need a dedicated pass

Source and browser findings:

- Active bottom navigation has no `aria-current`.
- Reaction, mood, avatar, game, and extend-vote toggles do not expose `aria-pressed`.
- The moment textarea has no label or `aria-label`.
- The toast has no `role="status"` / `aria-live="polite"`.
- The profile overlay has no dialog semantics, focus trap, Escape behavior, or inert
  background.
- Emoji-only mood/reaction controls do not provide descriptive action labels.
- Measured chat reaction targets are about 26px high and extend-vote buttons about 35px,
  below the recommended 44x44 touch target.
- Animations have no `prefers-reduced-motion` fallback.
- Chat has no heading/skip target, and progress bars are visual-only rather than semantic
  progress elements.

Keep native button semantics, add visible `:focus-visible` treatment suited to the dark
theme, preserve browser zoom, and test keyboard-only plus one screen reader before alpha.

### 9. Core business logic has no automated protection — initial coverage added

There are no test/spec files and [`package.json`](package.json#L7-L14) has no test or
lint command. Add focused tests before extending the reducer:

1. majority thresholds for odd/even room sizes;
2. unique voting and vote changes by user ID;
3. extension-cycle reset and lifetime cap;
4. foreground/background/reload expiry from `expiresAt`;
5. fade locks posting and creates exactly one Bara;
6. persistence migration/recovery;
7. create -> invite -> join -> chat -> vote -> fade -> relight integration flow;
8. Supabase RLS denial cases before enabling the backend.

### 10. No loading, empty, failure, or offline product states

The seed guarantees populated success screens, so the app has no design for:

- no rooms, no messages, no moments, no memories, or a room with only the host;
- send pending/failed/retry and reconnecting/reconnected;
- expired/revoked/full invite;
- profile persistence failure;
- backend configuration/session errors;
- offline mode and stale cached data;
- service-worker update available.

Define these states before realtime wiring; otherwise network failures will look like
successful actions or blank screens.

### 11. Input limits and abuse-cost controls are missing

Messages and moments have no maximum length, local action throttling, or schema length
constraint. Add client and server limits, trim/validate normalized text, reject empty
content, cap reactions and room membership, and rate-limit message/invite/report actions.
React already escapes rendered text; preserve that property.

### 12. Metrics required for the product decision are not instrumented

Add a privacy-minimal event model, not vanity dashboards:

- `room_lit`, `invite_opened`, `member_joined`;
- first post and unique posters per room;
- message/reaction counts;
- `extend_vote_opened`, vote response, result;
- `room_faded`, `bara_opened`, `room_relit`;
- time to first post and time to next room;
- host ID vs relight host ID.

Use aggregate IDs/timestamps; do not log message bodies. These events must calculate the
exact thresholds in the 14-day experiment.

### 13. Backend documentation overstates what configuration does — resolved

[`README.md`](README.md#L8-L13) says setting two environment variables switches the app
from mock to Supabase. In reality [`src/main.tsx`](src/main.tsx#L12-L14) only changes a
development console message, and [`src/lib/supabase.ts`](src/lib/supabase.ts#L1-L23) is
never called by the store.

Update the README to say “schema/client foundation only; UI remains mock” until queries,
auth, realtime subscriptions, mutations, and failure states are actually wired.

## P2 - Polish and maintainability

### PWA and native packaging

- Add 192px and 512px PNG icons, a maskable icon, a real Apple touch icon, and Android
  adaptive icon/splash assets. A single SVG is not enough for consistent installation.
- Make the service worker cache only successful same-origin responses. Do not return
  `index.html` as the fallback for failed JS/CSS/image requests.
- Add an update-available flow and an explicit offline/reconnecting indicator.
- Complete Capacitor Status Bar, Splash Screen, Keyboard, hardware-back behavior, and
  push-notification integration; verify on a physical Android device.
- Create and test the iOS project on macOS/cloud CI before claiming iOS readiness.

### Navigation and chat ergonomics

- Reflect the active web tab/room in the URL so refresh, Back, and deep links behave
  predictably.
- Do not force-scroll to the newest message when a user is reading older messages; show
  a “new messages” control unless they are already near the bottom.
- Replace the fixed header title “this room fades in 24h” and banner copy with the actual
  duration/status. After extension, `remaining + 24h` can be nearly 26h.
- Use real timestamps and locale-aware formatting.
- Add unread counts and last-read position only after multiple rooms/realtime exist.

### Profile and settings

Keep the profile privacy-minimal. Useful settings are:

- handle + avatar;
- notification preference and quiet hours;
- reduced-motion preference (in addition to OS preference);
- blocked members and reports;
- clear local demo data / sign out / delete account;
- privacy, community rules, and support.

Do not add real name, bio pressure, contact upload, precise location, or public follower
metrics.

### Code/documentation cleanup

- Split the growing global stylesheet by feature or establish a small token/component
  layer before more screens are added.
- Remove the unused `Placeholder` component when confirmed unused.
- Keep README “What works now” strictly factual and distinguish scaffolded, mocked,
  partially implemented, and production-ready capabilities.

## Recommended local-first implementation order

### Milestone L0 - Truthful local vertical slice

1. [x] Introduce stable IDs and the Room/ExtensionCycle/Bara lifecycle model.
2. [x] Replace relative `remaining` with absolute `expiresAt` and a testable clock.
3. [x] Add versioned local persistence for rooms, messages, reactions, votes, and Bara.
4. [x] Build Home/Rooms plus “Light a room” (spark, duration, private members).
5. [x] Implement vote-cycle reset, fade, deterministic Bara, and “Light again.”
6. [~] Derive visible core counts/presence and add room/Bara empty states; broader
  network failure states belong to L1.
7. [x] Add reducer/domain tests and a browser test of the accelerated lifecycle.
8. [~] Complete the initial accessibility/touch pass; screen-reader/device testing remains.

**L0 acceptance gate**

- A user can create a room, post/react, vote, let it expire, open its Bara, and relight.
- The exact state survives reload and returning after the expiry time.
- Two members may share a handle/avatar without corrupting identity or votes.
- No fictional presence, streak, recap, or activity counts are shown.
- The accelerated end-to-end lifecycle test and production build pass.

### Milestone L1 - Two-browser closed alpha

1. Correct and test the schema/RLS/invite transaction.
2. Add email magic-link auth and profile synchronization.
3. Connect the repository interface to Supabase queries, mutations, and realtime.
4. Add secure invite/join, member roles, leave/remove/revoke, report, and block.
5. Make expiry/Bara server-authoritative and idempotent.
6. Add delivery/reconnect/error states and privacy-minimal decision metrics.

**L1 acceptance gate**

Two separate browser profiles can securely join the same invited room, exchange and
react to messages in realtime, cast one vote each, observe the same server-timed fade,
and open the same Bara. An unrelated authenticated user is denied by RLS.

### Milestone L2 - Installable beta

1. Push notifications for room activity and the near-expiry vote.
2. PWA icons, offline/update UX, and install testing.
3. Android device polish; iOS project, signing, and device test.
4. Operational report review, retention/deletion jobs, monitoring, and backups.
5. Run the 14-day gate with real circles before expanding the feature set.

## Explicitly defer

Until the L1 gate and product metrics pass, defer:

- public feed, followers, public likes, and algorithmic discovery;
- Daily Unggun / stranger matching;
- meetup Plans, location, RSVP, and check-in;
- video and expensive media workflows;
- deeper Moments/Play/streak development;
- monetization;
- any AI-generated feature or recap.

Bara can remain entirely deterministic: member-saved highlights plus the most-reacted
eligible messages, with simple tie-breaking and a manual review/edit step before the raw
room is removed.

## Audit evidence summary

- Source-reviewed the React state, all current screen components, local profile storage,
  PWA shell, Supabase seam/schema, README, canonical concept, and experiment gate.
- Browser-checked the production preview at 390x844: no horizontal overflow and no
  console errors in the inspected state.
- Verified message loss on reload (6 -> 7 -> 6).
- Measured undersized touch controls and confirmed missing navigation/toggle/live-region
  semantics in the rendered DOM.
- Found no automated test/spec files.
- Verified the current production baseline with `npm run build` (TypeScript + Vite,
  90 modules transformed).

## Next decision

The highest-value next implementation is **Milestone L0 steps 1-5 together as one thin
feature slice**. Fixing only the countdown UI or only adding local message persistence
would leave the defining lifecycle untestable. The first meaningful release candidate
is the moment a locally created room can genuinely become a persistent Bara and be
relit.