# 4. Tracker & GO / ITERATE / KILL Dashboard

[⬅️ 3. Message templates](03-message-templates.md) · [Kit](README.md)

Use [tracker-template.csv](tracker-template.csv) (import into Google Sheets / Excel). One **row = one room**.

## Columns

| Column | Meaning |
| --- | --- |
| `room_id` | room ID (R01, R02, ...) |
| `host` | who lit the room |
| `circle` | crew / community |
| `spark` | the prompt/vibe used to kick it off |
| `date_lit` | date the room was lit |
| `members_invited` | number of people in the room |
| `members_posted` | number who posted **>= 1** message |
| `messages` | rough total messages over the room's life |
| `lively` | Y if **>= 3 posted** and **>= 20 messages** |
| `extend_vote` | Y/N — was an extend poll run near expiry |
| `extended` | Y if a **majority** voted to keep it alive (+24h) |
| `returned_48h` | Y if the circle lit/joined another room within 48h |
| `next_room_by_other` | Y if a **non-host** member lit the next room |
| `notes` | vibe, why it faded, memorable moments, etc. |

## Metrics & thresholds

North-star: a **Lively Room the circle keeps or repeats** — lively (`lively=Y`) **and** (`extended=Y` **or** `returned_48h=Y`).

| Metric | Formula | PASS |
| --- | --- | ---: |
| Room activation | unique circles with >=1 room / 8 | >= 5/8 |
| Participation | SUM(members_posted) / SUM(members_invited) | >= 50% |
| Lively room | COUNT(lively=Y) / COUNT(rows) | >= 50% |
| Extend pull | COUNT(extended=Y) / COUNT(rows) | >= 30% |
| Return (48h) | circles with any returned_48h=Y / unique circles | >= 40% |
| Participant -> host | circles with any next_room_by_other=Y / unique circles | >= 25% |

Example Google Sheets formulas (data rows start at 2, columns per the CSV):

- Lively room: `=COUNTIF(I2:I, "Y") / COUNTA(A2:A)`
- Participation: `=SUM(G2:G) / SUM(F2:F)`
- Extend pull: `=COUNTIF(K2:K, "Y") / COUNTA(A2:A)`

## Decision

- **GO** — **activation** and **lively-room** pass, plus at least **one** of **extend-pull** or **return** passes → build a thin MVP (light a room, chat + react, countdown, extend vote, Bara).
- **ITERATE** — rooms are lively but neither extends nor repeats → the chat is fun but not sticky; test a stronger spark/daily hook, a different circle size, or the meetup wedge earlier.
- **KILL** — activation < 5/8 **or** lively-room < 50% → the fun-chat wedge isn't strong enough yet; rethink the core.

> Mandatory qualitative question for every host: **"Would this have happened in your normal group chat — or did 'it fades' / 'keep it alive' make it different?"** If "it'd happen anyway," a plain group chat is enough (be cautious).
