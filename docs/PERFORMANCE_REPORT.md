# Gym Buddies Browser Performance Report

Audit date: July 28, 2026

## Executive summary

Gym Buddies holds a stable 60 fps in the audited desktop and synthetic
modern-phone profiles. The measured five-second idle window now performs
substantially less React, storage, and script work:

- Desktop React commits fell from 78 to 16 (79% fewer).
- Synthetic mobile React commits fell from 65 to 6 (91% fewer).
- Storage writes fell from 10 to 2 (80% fewer).
- Desktop script time fell from 214 ms to 143 ms (33% less).
- Synthetic mobile script time fell from 1,242 ms to 938 ms (24% less).
- Neither profile produced a long task or a frame over 25 ms.
- Three consecutive Phaser teardown/recreation cycles retained exactly one
  canvas and stable timer counts.

The production build remains healthy. The main application gained 0.49 KB
gzip to support the shared polling and save lifecycle policy. The large
Phaser dependency remains isolated behind a dynamic import and is not
downloaded on the trainer-creation screen.

## Measurement method and limitations

Measurements used the production Vite build served at the GitHub Pages test
path `/gym-buddies/`. Playwright's installed headless Chromium collected
Navigation Timing, Largest Contentful Paint, Long Task entries, CDP
`Performance.getMetrics`, request transfer sizes, React commit notifications,
storage calls, active browser timers, canvas counts, and five-second
`requestAnimationFrame` samples.

Two profiles were measured:

1. Desktop Chromium with the Playwright Desktop Chrome viewport.
2. Pixel 5 emulation with 4x CPU throttling, 40 ms request latency, 10 Mbps
   download, and 5 Mbps upload.

Each before/after value is one controlled cold run on the same local machine,
so small load-time differences should be treated as directional rather than
as a field-performance guarantee. The local fixture intentionally sends
uncompressed, `no-store` responses; Vite's gzip figures are the more useful
deployment-size comparison.

The Chrome DevTools performance MCP and Lighthouse were not available in this
session. No Lighthouse score, INP field value, or production-user Core Web
Vitals are claimed.

## Before and after measurements

### Production bundle

| Resource | Before raw / gzip | After raw / gzip | Difference |
| --- | ---: | ---: | ---: |
| HTML | 0.51 / 0.32 KB | 0.51 / 0.31 KB | effectively unchanged |
| CSS | 69.52 / 15.39 KB | 69.52 / 15.39 KB | unchanged |
| Main application JS | 424.63 / 133.65 KB | 426.79 / 134.28 KB | +2.16 / +0.63 KB |
| Lazy Phaser playfield | 1,225.63 / 337.21 KB | 1,225.69 / 337.24 KB | +0.06 / +0.03 KB |

The Phaser chunk still triggers Vite's 500 KB raw chunk warning. It is
deferred until the player completes trainer creation, so it does not block
the opening screen. Replacing or deeply subsetting Phaser was not considered
a safe change for this audit.

### Cold load

| Profile and metric | Before | After | Result |
| --- | ---: | ---: | --- |
| Desktop DOMContentLoaded | 107 ms | 102 ms | -5 ms |
| Desktop load event | 108 ms | 103 ms | -5 ms |
| Desktop LCP | 184 ms | 172 ms | -12 ms |
| Synthetic mobile DOMContentLoaded | 574 ms | 603 ms | +29 ms |
| Synthetic mobile load event | 574 ms | 603 ms | +29 ms |
| Synthetic mobile LCP | 820 ms | 844 ms | +24 ms |

Desktop load improved while synthetic mobile load increased slightly. This is
within the variance expected from one cold run plus the additional 2.16 KB raw
main-thread code. Initial navigation still requests only three resources and
does not request Phaser. Local uncompressed transfer rose from 495,576 to
497,738 bytes before gameplay and from 1,721,510 to 1,723,730 bytes after the
playfield loaded.

### Five-second idle gameplay

| Metric | Desktop before | Desktop after | Mobile before | Mobile after |
| --- | ---: | ---: | ---: | ---: |
| React commits | 78 | 16 | 65 | 6 |
| Save-related storage writes | 10 | 2 | 10 | 2 |
| CDP task duration | 397 ms | 312 ms | 2,149 ms | 1,651 ms |
| CDP script duration | 214 ms | 143 ms | 1,242 ms | 938 ms |
| Long tasks | 0 | 0 | 0 | 0 |
| Active intervals | 3 | 2 | 3 | 2 |

The measurement begins 1.2 seconds after the canvas appears, so some
typewriter-dialogue commits can still be included. The permanent Playwright
regression waits for dialogue to settle and enforces no more than eight React
commits, four storage-key writes, and eight gamepad scans in its 5.2-second
window.

Two bounded timeouts replace continuous work in the after run: the pending
autosave boundary and the disconnected-gamepad discovery scan. They are
cleared when their last owner unmounts and did not grow across lifecycle
cycles.

### Frame pacing

| Profile | Before | After |
| --- | ---: | ---: |
| Desktop average / p95 | 16.67 / 16.8 ms | 16.67 / 16.8 ms |
| Desktop frames over 25 ms | 0 of 300 | 0 of 300 |
| Synthetic mobile average / p95 | 16.67 / 16.7 ms | 16.67 / 16.7 ms |
| Synthetic mobile frames over 25 ms | 0 of 300 | 0 of 300 |

Both profiles remained at 60 fps. This headless result proves stable pacing in
the audited scene, not every future content-heavy encounter on physical
hardware.

## Audit findings by subsystem

### React rendering

Before the change, `App` updated `workoutFrame` every 90 ms even when no
workout existed. That committed the large application tree roughly eleven
times per second and also generated new Phaser snapshot objects.

The 90 ms clock now exists only for an unresolved workout. Workout advancement
and result timers use stable session identifiers instead of restarting on
every session-object update. The Phaser snapshot and overworld direction data
are memoized, so unrelated one-second UI updates no longer redraw the trainer
graphics.

The one-second boss/gameplay clock still updates the large `App` component
during active play. It now stops before changing React state when gameplay is
paused, the tab is hidden, or trainer creation is active. Splitting `App` into
smaller state consumers remains a useful later refactor, but was outside this
safe audit.

### Phaser lifecycle and object ownership

The playfield creates one `Phaser.Game`, one scene, a fixed set of reusable
graphics layers, one trainer container, and bounded labels. Snapshot updates
clear and redraw existing graphics instead of appending sprites. Debug labels
are destroyed before rebuilding.

`GamePresentation` destroys the controller with `game.destroy(true)` on
unmount. Three trainer-edit round trips measured one canvas after every
recreation, with stable interval/timeout counts. Pause, menu, focus-loss, and
hidden-tab states now sleep the Phaser game loop and wake it when play resumes.

Phaser keyboard, mouse, touch, and gamepad input plugins are explicitly
disabled because React's centralized action map owns those devices.

### Texture and asset loading

The current overworld is procedural `Graphics`; it contains no Phaser
`load.image`, `load.spritesheet`, `load.audio`, or texture-preload calls.
There is therefore no large eager texture allocation in the audited path.

The public asset tree contains 24 files totaling 21,724 bytes. The largest
file is a 7,982-byte original WAV. Asset-manifest validation runs before every
production build. Final art should continue to be loaded by scene/content
need rather than importing the complete roster at boot.

### Audio cleanup

The retro audio engine creates its `AudioContext` only after an unlock gesture.
It prevents duplicate music tickers, tracks every active oscillator/gain pair,
removes and disconnects nodes on `onended`, stops scheduled nodes on track
changes, suspends on hidden tabs, and closes/disconnects the graph on dispose.

Existing audio tests cover duplicate-loop prevention, hidden-page behavior,
mute behavior, and disposal. No continuously growing audio-node path was
found.

### Event listeners and timers

Resize, fullscreen, blur, visibility, keyboard, and touch listeners have
paired cleanup. Touch repeat intervals exist only while a direction is held
and are cleared on pointer-up, pointer-cancel, lost capture, and unmount.

Three independent 60 Hz gamepad scanners were found across the presentation,
trainer creation, and workout UI. They now subscribe to one shared scanner.
With no controller, it checks once per second; with a connected controller it
polls per frame to preserve responsive held/repeated input. Connection
listeners and the outstanding frame/timeout are removed when the final
subscriber unmounts.

The typewriter uses one self-clearing interval per message instead of tearing
down and creating an interval for every character.

### Save frequency

Simulation state still advances the boss gameplay clock once per active
second, but synchronous `localStorage` serialization no longer follows every
clock update. Clock-only persistence is limited to once per five seconds;
trainer confirmation, settings, rewards, and other meaningful save changes
remain immediate.

The latest serializable save is flushed when the document becomes hidden or
the page fires `pagehide`. Explicit import, restore, and confirmed-reset writes
remain immediate. A current valid save is never silently erased, and the
previous-save rotation continues to be owned by the existing save service.

The tradeoff is a maximum five-second active-tab persistence delay if the
browser process terminates without delivering lifecycle events.

### Collision checks

Movement and transition collision are pure TypeScript action calculations,
not per-frame Phaser physics. Maps use small declarative collision-rectangle
and interactable arrays, checked only when movement/interact actions occur.
The current data size does not justify a spatial index.

### Particles and effects

No `ParticleEmitter` or Phaser particle system exists in the audited runtime.
Feedback effects reuse fixed graphics layers, kill prior tweens on those
targets, clear their geometry on completion, and keep camera reactions short.
Particle-count growth is therefore zero for the current implementation.

### Hidden-tab and mobile-touch behavior

Focus loss or a hidden document pauses gameplay, clears sustained movement,
suspends audio, stops active audio nodes/music timers, prevents boss-time
advancement, and sleeps Phaser. Resume is explicit to avoid accidental input.

The gameplay surface uses `touch-action: none`; buttons use
`touch-action: manipulation`, pointer capture, and bounded repeat intervals.
Touch targets are 44–64 CSS pixels in the main deck. No document-level
high-frequency touch listener or prevent-default loop was found.

## Changes made

- Scoped 90 ms React updates and workout intervals to active sessions.
- Memoized Phaser snapshot and movement-derived presentation data.
- Added a five-second clock-only autosave policy with hidden/page-exit
  flushing and immediate meaningful-state persistence.
- Consolidated three UI gamepad pollers into one connection-aware service.
- Explicitly disabled unused Phaser input plugins.
- Slept/woke Phaser with pause and focus lifecycle.
- Made the dialogue interval self-clearing.
- Added unit coverage for the autosave interval policy.
- Added a Playwright budget/lifecycle regression for commits, storage writes,
  controller scans, and repeated Phaser recreation.

## Validation

- TypeScript application and Playwright configs: passed.
- Vitest: 18 files, 123 tests passed.
- Focused performance Playwright test: passed.
- Production build and asset-manifest prebuild validation: passed.
- Desktop and synthetic-mobile frame/load harness: passed with no runtime
  errors or long tasks.
- Lint: not run because the project currently defines no lint script or lint
  configuration.

## Remaining risks and recommended follow-up

1. The lazy Phaser chunk is 337.24 KB gzip. Keep it deferred and measure on
   physical mid-range Android/iOS hardware before adding texture atlases.
2. `App.tsx` remains a large owner of many unrelated state domains. An
   incremental component/store subscription split can reduce the remaining
   active-play one-second commits without changing simulation ownership.
3. Add production Real User Monitoring for LCP, INP, long tasks, device memory,
   and route/scene identity before using lab numbers as shipping thresholds.
4. Add scene-specific performance budgets when final sprite sheets, encounter
   portraits, and music assets replace procedural placeholders.
5. Re-run this audit on a physical phone with thermal throttling and during a
   workout, capture battle, boss entrance, and rare-route effect sequence.
