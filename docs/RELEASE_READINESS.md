# Gym Buddies Release Readiness

Review date: July 28, 2026
Reviewed branch: `feature/gym-buddies-foundation`
Reviewed local revision: `d29ca24a97ce6d1f81a5a603855ff79e63ec373e` plus the current Gym Buddies working tree
Save schema: `v15`

## Recommendation

**Recommended status: alpha — hold deployment until the source snapshot and
GitHub Actions blockers below are resolved.**

Gym Buddies is beyond a prototype and contains a complete six-gym journey,
versioned saves, deterministic gameplay systems, a Phaser overworld, accessible
React UI, keyboard and touch play, original content, offline release support,
and broad automated coverage. It is suitable for controlled alpha playtesting.

It is not a beta or release candidate yet. The complete implementation is still
an uncommitted working tree on a branch that has materially diverged from
`origin/main`, the public site is serving an older build, no successful run of
the new deployment workflow exists, and the application and stylesheet remain
large monoliths.

## Release gate summary

| Gate | Result | Evidence |
| --- | --- | --- |
| Type safety | Pass | Application and Playwright TypeScript configurations pass. |
| Unit and simulation tests | Pass | 19 Vitest files and 138 tests pass. |
| Browser tests | Pass locally | 12 desktop, mobile-touch, GitHub Pages, refresh, character creation, save recovery, and offline checks pass. |
| Production build | Pass with warning | 103 modules build; the lazy Phaser chunk remains above Vite's 500 kB warning threshold. |
| Save reliability | Pass after hardening | v12 through v15 migration, cosmetic-option recovery, backup recovery, imported-data normalization, size limits, and storage failure handling are covered. |
| Security | Pass for alpha | The scoped 288-file client scan produced zero reportable findings; all three non-reportable robustness defects found during validation were fixed. |
| Dependency audit | Pass | `npm audit --omit=dev --audit-level=moderate` reports zero vulnerabilities. |
| GitHub Pages configuration | Pass locally | `/GymBuddies/`, direct refresh, asset URLs, PWA resources, cache rollover, and offline load pass the fixture tests. |
| Live deployment | Fail | The public URL serves an older build and does not contain the current manifest/service-worker release. |
| Source protection | Fail | The complete implementation and release documents are not committed on the current development branch. |
| Release provenance | Partial | Original/generated asset provenance is documented, but the externally loaded web font is not recorded in the asset attribution inventory. |
| Maintainability | Partial | Boundaries are sound, but `App.tsx` and `index.css` are still 4,393 and 4,712 lines. |

## Passed checks

### 1. Architecture

- React owns trainer creation, menus, settings, dialogue, save management,
  accessibility, and HUD composition.
- Phaser is imported only by the Phaser bootstrap and overworld scene.
  `App.tsx` does not import the Phaser package.
- Gameplay calculations, progression, saves, content, input mapping, encounters,
  workouts, captures, bosses, and seeded randomness are in pure TypeScript
  modules.
- Phaser consumes presentation snapshots and does not own the versioned journey
  state.
- Content definitions use stable IDs and build-time validation. The production
  build runs asset/content validation before bundling.
- The trainer pixel renderer is shared by React and Phaser, has no framework
  dependency, and caches complete appearance/direction/pose combinations in a
  bounded store.
- Active gameplay source contains no direct `Math.random` call. Runtime game
  outcomes use the seeded random system.

### 2. React and Phaser boundaries

- The game creates one Phaser canvas and destroys the game on React unmount.
- The Phaser input plugins are disabled; the centralized React/TypeScript action
  map owns keyboard, touch, and gamepad input.
- The performance browser test confirms bounded canvas count, input polling,
  save writes, and React work during idle gameplay.
- Desktop and mobile visual review each showed one live Phaser canvas after
  trainer creation.

### 3. Save reliability

- Explicit schema versions and migrations support legacy v12, v13, and current
  v14 data.
- Corrupted primary saves recover from the previous valid save without silently
  replacing the corrupted source.
- Unsupported future saves pause autosave and are not overwritten without an
  explicit destructive action.
- Save writes validate serializable state, rotate a previous-save backup, and
  verify that the replacement remains readable.
- Manual JSON import/export and representative developer fixtures share the
  production migration and validation path.
- Browser storage failures fall back to an in-memory journey.
- Imported save text is now limited to 1 MiB both at the file-picker boundary
  and at the save-service API.
- Unknown legacy Buddy records now preserve bounded identity text while using
  trusted roster mechanics, palettes, sprites, and animation references.
- Trainer cosmetics use stable IDs and migrate from v14 flat colors into the
  v15 layered-appearance schema with safe replacement for removed options.

### 4. Progression balance

- The deterministic progression report models 2,000 complete journeys.
- All 2,000 journeys complete, with no mandatory-grind signal, no runaway-level
  signal, and no emergency recovery-resource shortage.
- Mainline completion averages 5 hours 43 minutes; the configured journey target
  is 5 hours 30 minutes.
- Catch-up XP, challenge-level diminishing returns, bounded mastery bonuses,
  protected retries, and always-available recovery prevent permanent failure
  states.
- The balance configuration is centralized under the game content layer rather
  than React or Phaser.

### 5. Encounter fairness

- Capture calculations use seeded randomness, explicit state, readable move
  predictions, opponent tendencies, counters, stamina, fatigue, readiness, and
  meter gates.
- Unit tests cover win, escape, failed pin, near-capture, successful capture,
  and full-party handling.
- No direct random calls remain in active Gym Buddies gameplay code.
- Battle speed is configurable and serialized.

### 6. Boss fairness

- Boss availability uses gameplay time rather than relying on wall-clock waiting.
- Save restoration and schedule tests cover availability, rewards, overload,
  and recovery.
- The 2,000-journey model reports a 19.1% aggregate boss-wall signal but no
  blocking progression wall because protected retries recover the player.
- Boss-specific machine alignment, mismatch penalties, move streaks, fatigue,
  stress, overload, and reward data remain separate from wild captures.

### 7. Mobile controls

- The phone-viewport Playwright test passes touch D-pad movement and menu
  controls.
- Touch targets remain visible below the 240×160 playfield.
- Trainer creation, tutorial text, and gameplay controls are legible at the
  tested 390×844 viewport.
- Starting a journey now resets both the app scroll container and window scroll
  to the top; desktop and mobile visual runs measured `scrollTop = 0`.

### 8. Gamepad controls

- Standard, Xbox-style, and PlayStation-style labels are defined.
- Button, D-pad, and analog-direction mapping are covered by deterministic unit
  tests.
- Polling starts only while subscribers exist, falls back to a bounded discovery
  interval, and removes connection listeners when idle.
- Physical-controller browser testing remains a limitation; see blockers.

### 9. Accessibility

- Keyboard remapping, visible focus, keyboard-operable menus, text speed, battle
  speed, high contrast, reduced motion, screen-shake disablement, and hold versus
  toggle input are implemented.
- Status is communicated with text and shape in addition to color.
- Dialogue remains readable in the mobile screenshot.
- Browser focus loss pauses appropriate gameplay work.

### 10. Performance

- The dedicated performance test passes bounded React work, save writes, gamepad
  polls, timers, and Phaser canvases during idle gameplay.
- The Phaser game sleeps while hidden, paused, in menus, or during trainer setup.
- Audio nodes, oscillators, intervals, visibility listeners, and Phaser objects
  have paired cleanup.
- Current public assets contain small generated placeholders and are loaded from
  a validated manifest.
- Production sizes from the final build:

| Output | Minified | Gzip |
| --- | ---: | ---: |
| Application CSS | 79.91 kB | 16.99 kB |
| React/application entry | 469.46 kB | 147.01 kB |
| Lazy Phaser presentation | 1,225.39 kB | 337.20 kB |

The Phaser chunk is lazy, so it does not remove the benefit of application-shell
code splitting, but it remains the largest performance risk.

### 11. GitHub Pages and offline loading

- Repository metadata declares `GymBuddies`, `/GymBuddies/`, and
  `https://dijaesnorth.github.io/GymBuddies/`.
- Vite uses `/` for development and `/GymBuddies/` for production.
- Release generation creates a manifest, icons, `404.html`, and a
  content-derived cache version.
- The service worker caches same-origin release resources only, handles GET
  requests only, and does not cache or intercept save writes.
- Playwright verifies every manifest asset, direct nested refresh, offline core
  loading, and local-save restoration.
- The local release generated 34 cache entries under
  `gym-buddies-core-68b0afa6d3719c77`.

### 12. Asset licensing and originality

- The 16-species roster, trainer presentation, machines, routes, bosses,
  interface shapes, palettes, audio patterns, dialogue, and branding are
  project-specific.
- No protected creature-franchise names were found in the active Gym Buddies
  source scan.
- Placeholder PNG and WAV resources are generated by project scripts rather
  than downloaded or traced.
- Runtime music and sound effects are synthesized from original declarative
  frequency and timing patterns with no third-party samples.
- Asset and audio documents prohibit copied silhouettes, recognizable melodies,
  tracing, and unverified imports.

### 13. Error handling

- Corrupt saves, failed writes, future schemas, unavailable storage, audio
  autoplay restrictions, focus loss, asset validation, and destructive reset
  confirmation have explicit handling.
- The optional trainer-setup storage flag now uses the guarded storage instance
  and cannot throw an uncaught startup exception.
- Oversized imported files are rejected before `File.text()` and before
  `JSON.parse`.
- A full-app error boundary or dedicated crash recovery screen is not yet
  implemented.

### 14. Testing coverage

- Seeded unit tests cover trainer creation, saves, movement, collision, world
  traversal, routes, workouts, Spot Now, Buddy progression, captures, party
  capacity, bosses, fatigue, audio, input, presentation, assets, and progression.
- The integration test completes the vertical-slice journey.
- World tests reach every gym and prove no unlocked location becomes permanently
  unreachable.
- Browser tests cover onboarding, migration, corrupted-save recovery, keyboard,
  touch, settings, performance, Pages assets, refresh, and offline loading.
- New browser checks cover pre-read oversized-file rejection and storage denial
  in the optional setup flag.
- Trainer tests cover 22 cosmetic build controls, eight physique presets,
  stable option recovery, 128 randomized combinations, four directions, eight
  poses, extreme-build clothing overlap, caching, saved looks, and v14-to-v15
  migration.

### 15. Debug and production safety

- Active collision overlays, asset previews, and audio test panels are gated by
  `import.meta.env.DEV`.
- The production bundle does not contain the asset-preview or collision-overlay
  labels.
- The representative-save component code remains in the main bundle, but its
  controls do not render in production. This is bundle-cleanup debt, not an
  enabled production debug surface.
- No secrets, privileged tokens, or environment files are included in the
  Gym Buddies client release.

### 16. Security

Codex Security scan `957b1a19-a540-49f3-9864-f7d5fb6fecf1` reviewed the
deterministic 288-file client inventory and completed with zero reportable
findings.

Validation found three real robustness defects:

1. malformed unknown-dex Buddy render data;
2. unbounded save-file read and parse; and
3. unguarded storage use in an optional setup effect.

Attack-path analysis rejected them as security findings because the first two
require explicit local file selection and have self-only impact, while the
third has no realistic attacker boundary. All three were nevertheless fixed
as production-readiness issues and covered by focused tests.

## Failed or partial checks

### Source snapshot and branch integration — blocker

- The complete local implementation is not committed on the current branch.
- The branch currently has substantial history on both sides of `origin/main`;
  it must not be pushed or rebased casually.
- The current release cannot be reproduced from a clean clone until the
  Gym Buddies-only working tree is reviewed, staged, and committed.
- Files outside the Gym Buddies scope must remain excluded from any snapshot or
  release commit.

### Live deployment and remote CI — blocker

- The public URL returns HTTP 200, but it serves an older asset entry and does
  not reference the current PWA manifest.
- The remote default branch is `main`, while the most recent public workflow
  runs visible on July 25, 2026 targeted an older branch and failed.
- The repaired local workflow has not run on GitHub. A successful clean CI run
  and post-deploy smoke check are required before announcing the alpha URL.

### Remaining monoliths — high-priority debt

- `client/src/App.tsx`: 4,393 lines.
- `client/src/index.css`: 4,712 lines.
- `workoutResolution.ts`, `buddies.ts`, `OverworldScene.ts`,
  `captureBattles.ts`, and `GamePresentation.tsx` are each close to 900–970
  lines.
- The runtime boundaries are correct, but large files increase regression and
  merge risk. The next refactor should extract React screen controllers and
  split CSS by presentation surface without changing system balance.

### Repository dead-code assurance — partial

The active `main.tsx` to `App.tsx` entry graph and production bundle were
reviewed. Source outside the Gym Buddies scope was explicitly excluded by
project rule, so this review does not claim whole-repository dead-code
clearance. Release staging must use an explicit Gym Buddies allowlist.

### Asset and font provenance — blocker for release candidate

- The original/generated sprites and audio have documented provenance.
- `index.css` still imports a web font from Google Fonts at runtime.
- The font's exact license, version, attribution requirement, privacy impact,
  and redistribution choice are not recorded in the project asset inventory.
- For beta, either self-host a verified licensed font with attribution or use
  the system pixel-style fallback and remove the external request.

### Performance limits — partial

- The lazy Phaser chunk is 1.23 MB minified and triggers Vite's large-chunk
  warning.
- The one-second gameplay clock still updates the large `App` component during
  active play.
- Procedural graphics and placeholder assets keep present runtime performance
  stable, but final sprite sheets and audio must be re-measured before beta.

### Coverage limits — partial

- No physical Xbox-style or PlayStation-style controller was exercised in a
  real browser.
- Safari/iOS installation, offline behavior, and Web Audio were not tested.
- Visual review covered desktop Chromium and one 390×844 phone viewport, not
  tablets, foldables, or browser zoom matrices.
- There is no lint script, so release validation currently relies on TypeScript,
  tests, content validation, build checks, and browser automation.
- Balance reports are deterministic, but their documented `balance:*` commands
  are not wired into `client/package.json`.
- There is no app-level error boundary or player-facing crash recovery screen.
- Simulations demonstrate model consistency, not broad external player
  playtesting. Capture and boss feel still need alpha-player feedback.

## Changes made during this review

- Added a centralized 1 MiB imported-save limit.
- Rejected oversized files before browser file decoding and before JSON parsing.
- Recovered unknown legacy species from trusted roster render and mechanics
  data instead of spreading imported nested objects.
- Preserved bounded legacy identity and descriptive text where safe.
- Guarded the optional setup storage flag with the existing save-storage
  abstraction.
- Reset app and window scroll after trainer confirmation.
- Added unit tests for oversized text and malformed unknown-species recovery.
- Added browser tests for oversized-file rejection, storage-denied startup, and
  onboarding scroll reset.
- Added the layered character studio, v15 cosmetic save migration, shared
  React/Phaser trainer renderer, saved looks, development gallery, and
  deterministic customization coverage.

## Validation performed

| Command or review | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| Focused save and roster Vitest suite | 26 passed |
| Complete `npm run test:unit` | 19 files, 138 tests passed |
| Focused onboarding Playwright suite | 5 passed |
| Complete `npm run test:e2e` | 12 passed across desktop, mobile-touch, and Pages projects |
| `npm run build` | Pass; 103 modules transformed |
| Asset-manifest prebuild validation | 5 passed |
| `npm audit --omit=dev --audit-level=moderate` | 0 vulnerabilities |
| Codex Security scoped client scan | Complete; 0 reportable findings |
| Desktop Chromium screenshot review | Pass; trainer setup and gameplay render |
| 390×844 Chromium screenshot review | Pass with minor crowded top-HUD polish debt |
| Live Pages and GitHub metadata check | Live site reachable but current release not deployed |

`npm run lint` was not run because the client defines no lint command.

## Remaining blockers

1. Create a reviewed Gym Buddies-only commit or protected snapshot from the
   current working tree without staging excluded workspace content.
2. Resolve the branch integration strategy against `origin/main`; do not force
   push or overwrite either history.
3. Run the repaired workflow on GitHub and require a successful Pages deployment
   plus live smoke test.
4. Record or remove the external font dependency before release-candidate
   labeling.
5. Complete at least one physical-gamepad pass and one Safari/iOS pass before
   beta.

## Recommended next task

Create a **Gym Buddies-only release snapshot and integration plan**:

1. inventory the exact client, documentation, and workflow files that belong to
   this implementation;
2. compare the current branch against `origin/main` without changing the
   worktree;
3. stage and commit only the approved Gym Buddies files;
4. run the complete clean-clone validation suite;
5. push a review branch and obtain a successful GitHub Pages preview or
   deployment run; and
6. repeat the live deployment smoke test against the published URL.
