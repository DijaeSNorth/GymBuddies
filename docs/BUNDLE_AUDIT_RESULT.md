# Gym Buddies Production Bundle Audit Result

## Outcome

After the journey-interface extraction and alpha-playtest instrumentation, production startup JavaScript remains **44.9% below the original baseline**. The opt-in playtest service adds bounded local event recording to the entry, while its 10.47 kB feedback/report panel remains deferred until opened. Gameplay, saves, content IDs, character rendering, asset output, and Phaser are unchanged.

Measurements use `npm run bundle:audit`, gzip level 9, and Brotli quality 11.

## Before and after

### Startup entry

| Measurement | Original baseline | Before journey extraction | Post-extraction | Current alpha | Alpha change |
| --- | ---: | ---: | ---: | ---: | ---: |
| Minified | 735,273 B | 561,877 B | 393,350 B | 405,282 B | +11,932 B / 3.03% |
| Gzip | 206,894 B | 172,672 B | 121,999 B | 126,041 B | +4,042 B / 3.31% |
| Brotli | 172,248 B | 145,161 B | 104,120 B | 107,535 B | +3,415 B / 3.28% |
| Modules | 95 | 71 | 56 | 60 | 4 bounded entry modules |

### Phaser

| Measurement | Baseline | Final | Change |
| --- | ---: | ---: | ---: |
| Minified | 1,231,561 B | 1,231,655 B | effectively unchanged |
| Gzip | 337,705 B | 337,735 B | effectively unchanged |
| Modules | 4 | 4 | unchanged |

Phaser remains a single copy and a nested dynamic import. It does not load on the trainer-creation screen.

### Total JavaScript

| Measurement | Original baseline | Before journey extraction | Post-extraction | Current alpha | Alpha change |
| --- | ---: | ---: | ---: | ---: | ---: |
| Minified | 1,966,834 B | 1,969,085 B | 1,983,296 B | 2,008,409 B | +25,113 B / 1.27% |
| Gzip | 544,599 B | 547,645 B | 553,927 B | 561,932 B | +8,005 B / 1.45% |
| Brotli | 442,712 B | 448,010 B | 455,074 B | 461,811 B | +6,737 B / 1.48% |

The current increase covers the bounded local recorder, checkpoint integration, feedback UI, and report export. It does not duplicate modules: the audit reports zero modules in multiple chunks.

## Final chunks

| Chunk | Trigger | Minified | Gzip | Brotli | Modules |
| --- | --- | ---: | ---: | ---: | ---: |
| Main entry | Initial document | 405.28 kB | 126.04 kB | 107.54 kB | 60 |
| Journey Game | Journey begins or continues | 185.17 kB | 57.48 kB | 48.57 kB | 24 |
| Buddy Sprite | First gameplay Buddy render | 134.41 kB | 24.24 kB | 20.46 kB | 18 |
| Game Presentation | Journey begins | 19.33 kB | 5.95 kB | 5.30 kB | 3 |
| Alpha Playtest Panel | Tester opens Playtest Note | 10.47 kB | 3.30 kB | 2.80 kB | 1 |
| Physique Review | Review opens | 9.96 kB | 3.24 kB | 2.81 kB | 1 |
| Buddy Customizer | Customizer opens | 6.76 kB | 2.22 kB | 1.98 kB | 1 |
| Buddy Index | Journey interface begins | 5.38 kB | 1.73 kB | 1.53 kB | 1 |
| Phaser presentation | Game Presentation mounts | 1,231.66 kB | 337.73 kB | 270.84 kB | 4 |

## Modules removed from startup

The following complete groups left the main chunk:

- active journey orchestration and rendering;
- route, workout, encounter, capture, boss, HUD, and recovery presentation;
- `BuddySprite.tsx`
- Buddy sprite and presentation resolvers
- Buddy sprite and presentation compositors
- all anatomy-family definitions
- armored-heavy and dome-shell module data
- base, armored, dome-shell, pilot, and presentation renderers
- palette and asset URL helpers
- `GamePresentation.tsx`
- `InputAccessibilityPanel.tsx`
- Phaser presentation configuration
- `BuddyIndex.tsx`
- `BuddyCustomizer.tsx`
- `PhysiqueReviewPanel.tsx`

All 18 Buddy rendering modules share one `BuddySprite` chunk. Anatomy-specific rules remain separate and readable; no giant renderer switch was introduced.

## Debug isolation

Production contains none of the following:

- Asset Preview Screen
- Character Gallery
- Sprite Strip Lab
- Batch 02 or Batch 03 review galleries
- Audio Test Panel
- representative save tools
- Playtest Report Viewer
- contact-sheet data
- approval-ledger UI
- test fixtures or Playwright utilities

The build now fails if representative debug labels or review labels enter any production JavaScript file. The audio panel and representative saves are true DEV-only dynamic modules rather than static imports hidden by rendering conditions.

## Character-content behavior

Core species, trainer, boss, map, machine, and simulation metadata remain eager because `App.tsx` directly calculates encounters, previews, progression, and UI labels from them.

Deferred:

- all Buddy pixel rendering implementations;
- multi-resolution frame resolution and compositing;
- anatomy-specific renderer modules;
- customization-only and review-only UI.

Still eager:

- `buddies.ts`
- `buddyCharacters.ts`
- `bossCharacters.ts`
- `characters.ts`
- trainer appearance data
- simulation and save modules

Splitting those remaining content tables would require separating the 4,800-line application/simulation coordinator. That is the recommended next optimization, not a safe change for this pass.

## Startup and request impact

For a new journey:

1. The entry and trainer creation load.
2. No Journey Game, Buddy renderer, Game Presentation, or Phaser chunk is requested.
3. Confirming the trainer loads Journey Game.
4. Journey Game loads Game Presentation, Buddy rendering, and the Buddy Index.
5. Game Presentation then loads Phaser.
6. Buddy Customizer, Physique Review, and the Alpha Playtest Panel remain unloaded until opened.

For a returning journey, gameplay modules load immediately because gameplay is the requested first state. No new requests occur during ordinary overworld movement after that initial gameplay load.

JavaScript module imports are browser-cached promises, so repeated customizer or review openings do not refetch or recreate the modules.

## Offline and GitHub Pages impact

- All chunk URLs use Vite's `/GymBuddies/` base.
- The service worker precaches the application shell but runtime-caches Journey Game, Game Presentation, Phaser, Buddy rendering, customization/review, and Alpha Playtest Panel chunks only after they are requested.
- Save data remains in versioned browser storage and is never cached by the service worker.
- Battle/showcase/portrait PNGs retain their existing deferred cache policy.
- Offline startup, direct Pages refresh, and all asset URLs pass Playwright.
- Offline continuation remains available after the journey runtime has loaded once under the installed service worker. Optional playtest feedback works offline after its lazy panel has been opened once while online. A first visit that never leaves Trainer Forge intentionally does not download the journey runtime.

## Production safeguards

- `npm run bundle:audit` produces `.bundle-audit/latest.json` with every chunk, compressed size, module, duplicate, manifest edge, and production-source hygiene result.
- `npm run bundle:verify` enforces:
  - at least 15% main-chunk reduction from the recorded baseline;
  - no debug/review labels in production;
  - all eight required lazy boundaries;
  - no lazy chunk referenced directly by `index.html`.
- `npm run build` runs the bundle guard automatically.
- The Pages browser test proves the relevant scripts are absent during trainer creation and requested after journey start.

## Validation completed

- TypeScript typecheck: passed.
- Strict authored-sprite validation: 16 overworld profiles, 11 presentation profiles, 3 boss overlays, and every authored frame passed.
- Vitest: 232 tests passed across 29 files.
- Playwright desktop: 22 passed, 1 intentionally skipped.
- Playwright mobile: 14 passed.
- Playwright GitHub Pages: 4 passed, including production lazy loading, repository-subpath assets, nested refresh, and offline save restoration.
- Production build and release-asset generation: passed.
- Production bundle verification: passed at 44.9% below the original entry baseline, with all eight required lazy boundaries and no forbidden debug labels.
- Visual inspection: desktop and 390x844-equivalent mobile Alpha Playtest panels remained readable, scrollable, and in bounds.
- `git diff --check`: passed; only existing line-ending normalization warnings were reported.

## Remaining largest production units

The largest non-vendor unit is no longer in the startup entry:

1. `useJourneyController.tsx` — 3,434 lines in the deferred Journey Game chunk
2. `App.tsx` — 856 lines in the main entry
3. `trainerPixelRenderer.ts` — 50,668 source bytes
4. trainer appearance content — 36,739 source bytes
5. Buddy species metadata — 32,632 source bytes

## Recommended next optimization

Split the deferred `useJourneyController.tsx` by coherent orchestration domain while retaining the single application save source of truth. This is a maintainability follow-up, not a startup requirement, and should preserve the established pure-system boundaries.
