# 14-Day Demand Experiment — Without an App

[⬅️ Validation index](README.md) · [GPT-5.6 Sol verdict](01-gpt-5.6-sol-validation.md)

> 🧰 **Ready-to-use tooling** for running this experiment (recruitment scripts, forms, WhatsApp templates, tracker) is in [`../experiment/`](../experiment/README.md).

## Goal

Test whether students genuinely want to use the **Plan → vote → commit → attend → repeat** flow, before building an app.

## Tools

- WhatsApp for distribution;
- Tally or Google Forms to create/vote on Plans;
- a manual spreadsheet for status, RSVP, check-in, and repeat;
- manual reminders with a fixed template.

## Minimum sample

- **8 hosts** from a single campus;
- each with a real group of 4–12 people;
- **≥60 unique invitations** in total;
- the activity doesn’t have to be a party: meals, studying, sports, coffee, movies, or hanging out.

## Protocol

### Days 1–2: recruit & baseline

1. Find 8 candidate hosts who, in the last 30 days, struggled to align a group’s schedule.
2. Ask how they usually coordinate timing and when their last plan fell through.
3. Don’t sell a “new social media”; offer the outcome: **“help make your group’s plan actually happen.”**

### Days 3–7: activation test

1. The host fills in: activity, area/place, and 2–3 time options.
2. The founder creates the voting link and the host shares it to WhatsApp themselves.
3. Participants vote without installing an app.
4. The host locks the choice and sends the RSVP/commitment to attend.

### Days 8–11: outcome test

1. Send reminders one day before and two hours before.
2. Record whether the event happened/was canceled and who attended.
3. Ask for one private recap photo or one sentence on “the best part” (optional).

### Days 12–14: repeat & growth test

1. Don’t ask everyone to create a second event.
2. Offer a “create the next version” button/link after the recap.
3. Measure who creates a second Plan and who turns from participant into host without personal prompting from the founder.

## Decision thresholds

| Metric | Formula | PASS |
| --- | --- | ---: |
| Host activation | hosts who send a Plan / 8 hosts | **≥5/8** |
| Voting/RSVP | participants who respond / invitations sent | **≥40%** |
| Plans That Happen | plans carried out / plans created | **≥50%** |
| Attendance | attended / RSVP “yes” | **≥60%** |
| Repeat participant | participants in a second plan / first-time participants | **≥30%** |
| Participant → organic host | participants who create a Plan / first-time participants | **≥25%** |

### GO

All core metrics (activation, Plans That Happen, attendance) pass and at least one growth metric (repeat or participant→host) passes.

### ITERATE

Plans That Happen passes but repeat/host conversion fails. Test a focus on a recurring activity crew or campus organizations, not a social feed.

### KILL

Activation <5/8 **or** Plans That Happen <50%. Don’t build a full social app; the problem or wedge isn’t strong enough yet.

## Riskiest assumptions

1. Candidate hosts find WhatsApp coordination painful enough.
2. Hosts are willing to create an external link.
3. Guests respond without being required to install.
4. Voting produces a decision, not an endless poll.
5. Committing to attend increases attendance.
6. The recap makes people want to do it again.
7. Participants are willing to be the next host.
8. A single campus is dense enough for organic spread.
9. A human-first approach increases trust even if it isn’t the main reason for use.

## Data to record

- time from link creation to sharing;
- number of invitations, votes, RSVPs, attendees;
- reasons for cancellation/no-show;
- who reminded the group;
- whether the host keeps using WhatsApp alongside the link;
- NPS is not a priority; the key question: **“Without our help, would this plan still happen?”**
