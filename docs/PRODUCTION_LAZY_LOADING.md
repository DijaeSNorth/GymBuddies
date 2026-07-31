# Gym Buddies Production Lazy Loading

## Principles

Gym Buddies splits by player-visible feature boundaries, not by arbitrary file size.

- Trainer creation, save loading, save migration, core content validation, and the basic application shell remain eager.
- The active journey coordinator, gameplay HUD, maps, workouts, capture, and boss presentation are owned by a deferred `JourneyGame`.
- Buddy rendering is one shared lazy graph so all anatomy families and fallbacks stay consistent.
- Phaser is nested behind the React Game Presentation boundary.
- Rarely opened customization and review surfaces load on demand.
- The alpha feedback/report panel loads only when a tester opens Playtest Note; its bounded recorder remains available without loading that panel.
- Development tools require both `import.meta.env.DEV` and the matching query or in-game developer surface.

## Production graph

```text
index.html
  -> main application + trainer creation
     -> JourneyGame (journey begins or continues)
        -> GamePresentation
        -> Phaser + OverworldScene (presentation mounts)
     -> BuddySprite shared renderer (first Buddy is shown)
        -> BuddyIndex
        -> BuddyCustomizer (only when opened)
        -> PhysiqueReviewPanel (only when opened)
     -> AlphaPlaytestPanel (only when Playtest Note opens)
```

The Buddy Customizer, Buddy Index, and Physique Review import the shared Buddy Sprite chunk rather than carrying duplicate renderer copies.

## Trigger table

| Surface | Trigger | Loading fallback |
| --- | --- | --- |
| Journey Game | Journey begins or continues | Lightweight application status surface |
| Game Presentation | Completed trainer profile or loaded journey | Reserved 3:2 playfield status panel |
| Buddy Sprite/renderers | First gameplay Buddy preview | Fixed-size transparent sprite slot |
| Buddy Index | Gameplay interface | Compact status text |
| Buddy Customizer | Player selects Customize Buddy | Inline status text |
| Physique Review | Player opens Home Gym review | Modal-shaped status surface |
| Alpha Playtest Panel | Tester opens Playtest Note | Compact accessible status surface |
| Phaser | Game Presentation mounts | Existing React playfield shell |
| Audio Test Panel | DEV build only | None |
| Representative save tools | DEV build only | None |
| Asset/review galleries and Playtest Report Viewer | DEV plus matching `?debug=` query | Not available in production |

## Debug-tool contract

The following pattern is required:

```ts
const LazyDeveloperTool = import.meta.env.DEV
  ? lazy(() => import('./debug/DeveloperTool'))
  : null;
```

Production must not statically import a debug module and rely on hidden CSS, a false JSX branch, or runtime URL checks alone. Query-routed galleries remain dynamically imported from `main.tsx` only inside DEV-folded branches.

Shared runtime resolvers, manifests, and fallback code are not debug tools and remain available where production rendering needs them.

## Phaser behavior

- Only `OverworldScene.ts` and `createGamePresentation.ts` import the Phaser runtime.
- `buddySpriteBridge.ts` uses a type-only Phaser import.
- The React Game Presentation uses a dynamic import to create Phaser.
- Trainer creation and save operations do not load Phaser.
- A returning player loads Phaser immediately because their requested first state is the journey.
- Phaser is not replaced or manually repackaged.

## Character presentation

The first Buddy display loads:

- authored and procedural frame resolvers;
- multi-resolution selection;
- compositors and bounded image caches;
- anatomy-specific rendering rules;
- palette and fallback helpers.

The module is cached after its first import. PNG behavior is unchanged:

- overworld images load first;
- battle assets load when battle presentation requests them;
- showcase assets load when customization or review requests them;
- portrait assets load for dialogue presentation;
- missing profiles continue through lower-resolution, hybrid, procedural, and placeholder fallbacks.

## Prefetch policy

No speculative Phaser prefetch runs during trainer creation. This protects the initial interaction from a 1.23 MB parse.

The first gameplay render is the preload signal for Game Presentation, Buddy rendering, Buddy Index, and Phaser. This is early enough that no further JavaScript requests are required during routine movement. Buddy battle PNG loading retains the existing encounter-context behavior.

Future prefetches should use actual intent:

- route encounter transition may request battle presentation assets;
- opening the Home Gym review affordance may preload Physique Review;
- focusing Customize Buddy may preload the customizer.

Do not preload every production surface on application boot.

## Caching and offline behavior

Vite content hashes make every chunk immutable by filename. The release service worker precaches the eager application shell and runtime-caches Journey Game, presentation, Phaser, Buddy rendering, customization/review, and the Alpha Playtest Panel after their first request. It removes older cache versions during activation.

The service worker does not cache:

- localStorage or save payloads;
- imported JSON save files;
- browser object URLs;
- deferred high-resolution PNGs until requested.

Repeated dynamic imports use the browser module cache and do not create duplicate module instances.

Offline continuation succeeds after the journey runtime has been requested once under the installed service worker. Remaining in Trainer Forge on a first visit deliberately leaves those runtime chunks uncached so the lazy boundary is genuine.

The optional playtest panel follows the same rule: local session recording remains available, and the full feedback surface works offline after that panel was opened once during an online, service-worker-controlled visit.

## Validation commands

```text
npm run bundle:audit
npm run bundle:verify
npm run build
npm run test:e2e:pages
```

`bundle:audit` writes an ignored `.bundle-audit/latest.json` report with complete module membership. `bundle:verify` is part of every production build and enforces the startup-size and debug-isolation contracts.
