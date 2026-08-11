# 4. Tracker & GO / ITERATE / KILL Dashboard

[⬅️ 3. WhatsApp templates](03-whatsapp-templates.md) · [Kit](README.md)

Use [tracker-template.csv](tracker-template.csv) (import into Google Sheets / Excel). One **row = one Plan**.

## Columns

| Column | Meaning |
| --- | --- |
| `plan_id` | plan ID (P01, P02, ...) |
| `host` | host name |
| `community` | campus / community |
| `activity` | what you'll do |
| `date_created` | date the plan was created |
| `invites_sent` | number of people invited |
| `votes_in` | number who voted |
| `locked` | Y/N — final time & place announced |
| `rsvp_yes` | number who committed to attend |
| `attended` | number who actually checked in |
| `plan_happened` | Y if it happened with **>= 3 attending** |
| `repeat_participants` | of these participants, how many joined a 2nd plan |
| `participant_became_host` | how many participants then **created** their own plan |
| `notes` | reason for cancellation / no-show, etc. |

## Metrics & thresholds

| Metric | Formula | PASS |
| --- | --- | ---: |
| Host activation | unique hosts with >=1 plan / 8 | >= 5/8 |
| Vote/RSVP response | SUM(votes_in) / SUM(invites_sent) | >= 40% |
| Plans that happen | COUNT(plan_happened=Y) / COUNT(rows) | >= 50% |
| Attendance | SUM(attended) / SUM(rsvp_yes) | >= 60% |
| Repeat participant | SUM(repeat_participants) / unique participants | >= 30% |
| Participant -> host | SUM(participant_became_host) / unique participants | >= 25% |

Example Google Sheets formulas (data rows start at 2):

- Plans that happen: `=COUNTIF(K2:K, "Y") / COUNTA(A2:A)`
- Attendance: `=SUM(J2:J) / SUM(I2:I)`
- Response: `=SUM(G2:G) / SUM(F2:F)`

## Decision

- **GO** — activation, plans-that-happen, and attendance **pass**, plus at least **one** growth metric (repeat or participant->host) passes → build a thin MVP (create / vote / lock / RSVP / check-in).
- **ITERATE** — plans-that-happen passes but growth fails → focus on recurring-activity crews or campus organization tools.
- **KILL** — activation < 5/8 **or** plans-that-happen < 50% → stop the social app thesis; the problem / wedge isn't strong enough.

> Mandatory qualitative question for every host: **"Without our help, would this plan still have happened?"** An answer of "yes, it still would" = a signal that WhatsApp alone is enough (be cautious).
