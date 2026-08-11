# 14-Day Demand Experiment — Without an App

[⬅️ Validation index](README.md) · [GPT-5.6 Sol verdict](01-gpt-5.6-sol-validation.md)

> 🧰 **Ready-to-use tooling** for running this experiment (recruitment scripts, forms, message templates, tracker) is in [`../experiment/`](../experiment/README.md).

## Goal

Test whether a small circle genuinely **enjoys and returns to a fun, ephemeral group chat room** — and votes to keep a good one alive — before building an app. In this scrappy test you manually play the role the app will later automate (the countdown, the extend vote, the Bara recap). The real product keeps all of this in-app; here we fake it with a throwaway chat group.

## Tools

- a **throwaway group chat** (a fresh WhatsApp/Discord/Telegram group) as the stand-in "room" — spun up per room, only for the test, not part of the product;
- a **manual countdown** you announce (the room "goes quiet / self-destructs in 24h");
- a **poll** (the chat app's built-in poll) for the near-expiry **extend vote**;
- a manual spreadsheet to log liveliness, extends, and returns;
- a fixed set of message templates (spark, nudge, extend poll, Bara recap).

## Minimum sample

- **8 circles** (each with a willing "host" who lights the first room) from one reachable community;
- each circle **4–12 people**;
- **≥60 unique people** invited into rooms in total;
- any vibe works — late-night nonsense, hot takes, study-panic, gaming, gossip, hype; a room doesn't need a purpose beyond being fun.

## Protocol

### Days 1–2: recruit

1. Find **8 hosts**, each with a real circle of 4–12 friends who already have a lively-ish group chat.
2. Don't sell a "new social media"; offer the feeling: **"a fun little room for your crew that only lasts a night."**
3. Get each host to agree to light **at least 2 rooms** over the two weeks.

### Days 3–7: light rooms & run them (liveliness test)

1. For a room, the host spins up a **fresh throwaway group** and drops a **spark** (a prompt/vibe — templates in [`../experiment/03-message-templates.md`](../experiment/03-message-templates.md)).
2. Announce the **countdown**: "this room goes quiet in ~24h, be silly while it lasts."
3. Let it run — you only start it, then **observe**. Log how many of the circle actually post, and roughly how many messages/reactions the room gets.

### Days 8–11: extend vote & fade (intent test)

1. Near a room's expiry, post the **extend poll**: "keep this room alive 24h more? 🔥 keep / 🌙 let it fade."
2. If a **majority** picks 🔥, keep it going (+24h) and note it; otherwise **let it fade** — stop posting and drop a tiny **Bara recap** (3–5 highlights).
3. Record which rooms the circle chose to keep, and how they reacted to a room ending.

### Days 12–14: return & growth test

1. Don't force it — just see whether the circle **lights or joins another room** within ~48h of the last one.
2. Note whether someone **other than the original host** lights the next room (shared ownership).
3. Ask one question: **"Would this room have happened in your normal group chat — or did the 'it fades' / 'keep it alive' part make it different?"**

## Decision thresholds

North-star: **a Lively Room the circle chooses to keep or repeat** — a room with **≥3 people actively posting** and **≥20 messages**, that the circle then **votes to extend** or **returns to** with another room.

| Metric | Formula | PASS |
| --- | --- | ---: |
| Room activation | circles that light ≥1 room / 8 | **≥5/8** |
| Participation | members who post ≥1 message / members invited | **≥50%** |
| Lively room | rooms with ≥3 posters & ≥20 messages / rooms created | **≥50%** |
| Extend pull | rooms the circle voted to keep alive / rooms created | **≥30%** |
| Return (48h) | circles that light/join a 2nd room within 48h / circles | **≥40%** |
| Participant → organic host | circles where a non-host member lights a room / circles | **≥25%** |

### GO

**Activation** and **Lively room** pass, **and** at least one of **Extend pull** or **Return** passes → build a thin MVP (light a room, chat + react, countdown, extend vote, Bara).

### ITERATE

Rooms are lively but neither extends nor repeats → the chat is fun but not yet sticky. Test a stronger daily hook/spark, a different circle size, or bringing the meetup wedge in earlier.

### KILL

Activation <5/8 **or** Lively room <50%. The fun-chat wedge isn't strong enough yet; rethink the core before building.

## Riskiest assumptions

1. A small circle will actually **pile into an ephemeral room and be chatty**, not sit silent.
2. **Ephemerality is fun**, not stressful — "it fades" creates playful urgency, not FOMO-anxiety.
3. Rooms stay lively **without a meetup goal** — fun-for-its-own-sake is enough to retain.
4. The **extend vote** is a real signal — people bother to vote to keep a good room.
5. The circle **returns** for another room within days (a habit forms).
6. Someone **other than the original host** will light the next room (shared ownership).
7. A circle of **4–12** is the right size to make a room feel alive (not empty, not a mob).
8. People will prefer a **dedicated ephemeral room** over just using their always-on group chat.
9. A human-first approach builds trust even if it isn't the main reason people show up.

## Data to record

- how many of the circle posted, and roughly how many messages/reactions per room;
- which rooms reached an **extend vote** and which the circle chose to keep;
- how the circle reacted when a room **faded** (relieved? sad? re-lit a new one?);
- time between one room fading and the next being lit (the return gap);
- who lit each room (was it always the same person, or did it rotate?);
- the key question: **"Would this have happened in your normal group chat — or did 'it fades' / 'keep it alive' make it different?"**
