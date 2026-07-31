# Alpha Playtest Report Format

## Identity

- Format: `gym-buddies-alpha-playtest`
- Report version: `1`
- Filename: `gym-buddies-playtest-<game-version>-<session-id>.json`
- Maximum accepted size: 512 KB

The report format is independent from the Gym Buddies save schema. A report cannot be imported as a save and never contains a complete save.

## Top-level shape

```json
{
  "format": "gym-buddies-alpha-playtest",
  "reportVersion": 1,
  "exportedAt": "2026-07-30T20:00:00.000Z",
  "session": {
    "sessionId": "random-uuid",
    "gameVersion": "0.12.0",
    "buildId": "commit-or-build-id",
    "saveSchemaVersion": 19,
    "startedAt": "2026-07-30T19:20:00.000Z",
    "lastActiveAt": "2026-07-30T20:00:00.000Z",
    "activeDurationMs": 2400000,
    "environment": {
      "browserFamily": "chrome",
      "operatingSystemFamily": "android",
      "screenWidth": 390,
      "screenHeight": 844,
      "touchAvailable": true,
      "gamepadAvailable": false
    },
    "cohortLabels": ["mobile-player"],
    "counters": {},
    "pendingCheckpoints": [],
    "completedCheckpoints": [],
    "feedback": [],
    "timeline": [],
    "errors": [],
    "checklist": {}
  },
  "progression": {
    "currentGym": "starter-a",
    "currentRoute": null,
    "trainerLevel": 5,
    "activeBuddyLevel": 6,
    "partySize": 3,
    "fatigueRange": "building",
    "tutorialStep": 4,
    "completedBosses": 1
  }
}
```

`environment` and `timeline` are optional because the player may remove them before export.

## Feedback

Each feedback item contains:

- random entry ID and timestamp;
- source: quick note or checkpoint;
- selected category or milestone checkpoint ID;
- optional clarity, enjoyment, fairness, difficulty, and pace ratings;
- optional player-submitted note capped at 280 characters;
- coarse gameplay context captured at submission.

No report consumer should assume a note is safe to publish. Treat it as untrusted player input, escape it in HTML, and remove accidental personal information before issue tracking.

## Timeline

Meaningful event kinds:

- location entered;
- machine used;
- workout completed;
- encounter started;
- capture result;
- boss result;
- recovery used;
- save loaded or migrated;
- error boundary activated;
- journey retried;
- Phaser presentation recovered;
- feedback submitted.

Events contain safe labels and coarse context. The game does not record movement steps, animation events, input timing, clock ticks, or React renders.

## Errors

Error summaries contain category, fixed safe message, game mode, location, overlay, build ID, save schema version, and up to 25 recent bounded events. Production reports do not contain stack traces.

## Validation rules

The development viewer rejects:

- invalid JSON;
- wrong format or report version;
- files larger than 512 KB;
- more than 50 feedback items;
- more than 20 error items;
- more than 120 timeline events;
- unknown categories, checkpoints, or cohort labels;
- malformed IDs, notes, or summary sections.

The viewer treats all strings as untrusted display data and does not execute report content.
