# Alpha Playtest Privacy

## Plain-language promise

Alpha Playtest Mode is optional, local, and account-free. Gym Buddies does not automatically upload playtest reports. A player must preview and download a JSON report, then choose whether and how to send it.

The game works normally when the mode is disabled.

## Information stored locally

- random session ID;
- game version and build identifier;
- save schema version;
- browser family and operating-system family;
- viewport size;
- touch and current gamepad availability;
- session start and visible active duration;
- current gym or route identifier;
- trainer and active Buddy levels;
- party size and fatigue band;
- tutorial step and completed-boss count;
- bounded attempt/result counters;
- optional self-selected tester cohorts;
- optional ratings and short notes submitted by the player;
- bounded meaningful-event timeline;
- safe error summaries from recovery boundaries.

The environment summary intentionally omits browser patch versions, hardware identifiers, installed fonts, network data, and other fingerprinting details.

## Information deliberately excluded

- real names;
- email, phone, account, or payment information;
- IP address;
- precise or background location;
- advertising IDs or tracking pixels;
- device serial numbers;
- microphone, camera, clipboard, contacts, or conversation contents;
- full browser fingerprints;
- free-form text unless the player explicitly submits it;
- complete imported-save data;
- stack traces in production reports;
- every movement step, animation frame, clock tick, render, or input poll.

Players are reminded not to enter names or contact details in optional notes.

## Storage limits

- Timeline: maximum 120 events and 48 KB serialized.
- Feedback: maximum 50 entries, 280 characters per optional note.
- Errors: maximum 20 summaries with at most 25 recent events each.
- Local session: maximum 192 KB; oldest timeline events are removed first.
- Imported report: maximum 512 KB.

Malformed, unsupported, or oversized local sessions and imported reports are rejected safely. Playtest state uses `gym-buddies-alpha-playtest-session-v1`, separate from the versioned game-save keys.

## Export controls

Before export the panel shows:

- session/build/schema details;
- count of notes and error summaries;
- whether coarse environment details are included;
- whether the event timeline is included;
- current progression summary.

Players can:

- remove individual feedback entries;
- exclude environment details;
- exclude the event timeline;
- cancel without exporting;
- disable future playtest collection.

Disabling collection retains the existing local session so the player can later export it. It does not alter the game save.

## Error safety

Production diagnostics use fixed safe messages, a recovery category, coarse game mode/location/overlay, build/schema identifiers, and recent bounded events. Production exports do not contain JavaScript stack traces. Development console output may contain component-stack details for a developer running a local build; the production report viewer is absent from release bundles.

## Network policy

Alpha Playtest code has no `fetch`, beacon, analytics SDK, tracking pixel, or reporting endpoint. Service-worker caching may request normal game assets, but it never caches or transmits save or playtest browser storage.

If automatic submission is considered later, it requires a separate privacy review, affirmative consent design, deletion/retention policy, security review, and new user approval. It is not part of this alpha.
