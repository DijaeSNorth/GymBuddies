# Gym Buddies Alpha Playtest Plan

## Purpose

This alpha is a structured usability and reliability test of the existing Gym Buddies journey. It is not a content vote and does not authorize new species, gyms, broad systems, or balance changes without a reproducible completion blocker.

Questions to answer:

1. Can a new player create a trainer and begin without outside help?
2. Are keyboard, touch, and gamepad actions discoverable?
3. Does the first workout teach timing, load, failure, and Spot Now?
4. Are fatigue and recovery predictable without becoming tedious?
5. Are route access, capture requirements, and boss requirements readable?
6. Does progression remain engaging without a mandatory grind wall?
7. Can players recover from failed encounters, reloads, and save problems?
8. Does the 390×844 phone experience remain legible and comfortable?
9. Are frame pacing, loading, and input response acceptable on target devices?
10. Which moments are confusing, repetitive, unfair, or especially enjoyable?

## Cohort and size

Target 24–36 testers over two rounds:

- 6 new to games or infrequent players;
- 6 RPG or creature-collection players;
- 4 fitness or bodybuilding enthusiasts;
- 6 primarily mobile players;
- 4 primarily desktop players;
- 4 accessibility-focused testers.

Labels are optional and self-selected. A tester may belong to more than one cohort. Do not infer age, health, identity, or experience from behavior.

## Session format

- Recommended first session: 30–45 minutes.
- Minimum useful session: through one workout, route visit, encounter, and capture attempt.
- Optional extended session: 60–90 minutes for progression, boss, save/reload, and repetition observations.
- Testers may stop at any time and may play without Alpha Playtest Mode.
- Ask testers to think aloud only when comfortable; conversations are never recorded by the game.

Use the checklist in `PLAYTESTER_INSTRUCTIONS.md` or the local in-game checklist. Do not coach players past confusion until the observation has been noted.

## Required device coverage

| Device group | Minimum coverage |
| --- | ---: |
| Windows Chrome or Edge, keyboard | 6 sessions |
| macOS Safari or Chrome, keyboard | 3 sessions |
| Android Chrome, touch | 6 sessions |
| iPhone Safari, touch | 6 sessions |
| Standard gamepad on desktop | 3 sessions |
| 390×844-equivalent phone viewport | 4 sessions |
| Reduced motion, high contrast, or remapped controls | 4 sessions |
| Offline continuation after one online journey load | 2 sessions |

Record only coarse browser and operating-system families. Do not ask for serial numbers, IP addresses, precise location, or a full device specification.

## Severity

| Severity | Meaning | Example | Response |
| --- | --- | --- | --- |
| S0 Critical | Data loss, privacy failure, remote-code/security concern, or game cannot start for a broad cohort | Valid save erased; report uploads automatically | Stop distribution; fix and verify immediately |
| S1 High | Reproducible crash, broken progression, impossible required encounter, or unusable primary control | Player cannot leave Home Gym on touch | Fix before the next alpha round |
| S2 Medium | Material confusion, unfairness, repeated friction, or serious visual obstruction with a workaround | Boss requirement is consistently misunderstood | Prioritize by frequency and affected cohort |
| S3 Low | Polish, wording, minor alignment, or isolated preference | One label could be clearer | Batch after higher-severity evidence |
| Observation | Subjective preference without a demonstrated usability defect | Preference for a different route palette | Track; do not fix during collection |

## Issue template

```text
Title:
Severity:
Build ID:
Device cohort:
Starting state:
Steps to reproduce:
Expected:
Observed:
Can reproduce: always / sometimes / once
Progression impact:
Workaround:
Relevant report session ID:
Screenshot or short video:
Privacy check: no name, email, location, IP, or save file attached
```

## Round cadence

1. Run an internal five-session smoke cohort.
2. Triage S0/S1 defects and confirm reproducibility.
3. Run 12–18 external sessions across desktop and mobile.
4. Group duplicate friction and compare cohort signals.
5. Fix only confirmed high-confidence defects.
6. Run a second 8–12-session verification cohort.
7. Publish a short alpha findings summary without personal information.

Do not change combat balance because a single tester disliked an outcome. Require either a deterministic defect, an impossible completion path, or repeated evidence across sessions.

## Alpha-to-beta criteria

Gym Buddies may be labeled beta when:

- no open S0 issues;
- no open S1 save-loss, progression-blocking, or primary-control issues;
- at least 24 representative sessions are reviewed;
- at least 90% of testers can create a trainer and reach the first route without coaching;
- at least 85% can complete or intentionally abandon a workout and recover;
- at least 80% correctly explain the capture control target after one encounter;
- every target platform completes save/reload successfully;
- mobile controls pass on both Android Chrome and iPhone Safari;
- the 95th-percentile session has no repeated crash;
- offline continuation and GitHub Pages refresh remain passing;
- privacy review confirms no automatic report upload or identifying telemetry;
- remaining S2 issues have owners and documented workarounds or acceptance rationale.
