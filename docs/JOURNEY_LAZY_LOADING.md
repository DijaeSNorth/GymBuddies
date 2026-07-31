# Journey Lazy Loading

## Loading contract

The production `JourneyGame` module loads only after a player begins or continues a journey.

```text
index.html
  -> eager App + save recovery + Trainer Forge
     -> JourneyGame (begin or continue)
        -> GamePresentation
           -> Phaser runtime
        -> BuddySprite (first Buddy presentation)
        -> BuddyIndex
        -> BuddyCustomizer (when opened)
        -> PhysiqueReviewPanel (when opened)
     -> AlphaPlaytestPanel (when Playtest Note opens)
```

Trainer creation does not request `JourneyGame`, Buddy presentation code, `GamePresentation`, or Phaser. There is no preload tag for these boundaries.

## Loading states

The journey module uses a lightweight `role="status"` surface with polite live-region behavior. The 240×160 playfield and other nested lazy surfaces retain reserved-space loading states so the interface does not collapse while their modules arrive.

## Re-entry and cleanup

ES module imports are cached by the browser. Re-entering an already loaded journey reuses module evaluation, while React recreates the presentation instance. Journey inactivity:

- clears the journey interval;
- pauses journey actions and input processing;
- unmounts and destroys the Phaser presentation;
- keeps the application-owned audio engine singular;
- preserves the canonical save and current controller state during trainer editing.

Replacing the save through validated import or recovery uses a journey revision to recreate the journey against the replacement state.

## Release-cache policy

The release service worker precaches the eager application shell and core files. Journey and nested presentation JavaScript/CSS are classified as deferred runtime resources:

- `JourneyGame`
- `GamePresentation`
- `createGamePresentation`
- `BuddySprite`
- `BuddyIndex`
- `BuddyCustomizer`
- `PhysiqueReviewPanel`
- `AlphaPlaytestPanel`

They enter the versioned runtime cache only after the player requests them. This is required so a service-worker installation during trainer creation does not silently download the journey or Phaser. After an online journey has loaded once under the active service worker, offline continuation uses the cached hashed resources. Save data is browser state and is never placed in the service-worker cache.

All URLs are derived from the Vite `/GymBuddies/` base, including nested Pages refreshes.

## Production guards

`npm run bundle:verify` enforces:

- a main entry no larger than 85% of the original recorded baseline;
- a distinct `JourneyGame` output chunk;
- all established character/presentation lazy boundaries;
- no lazy chunk referenced by `index.html`;
- no representative development or review labels in production bundles.

The Pages Playwright test gates the actual `JourneyGame` request and proves:

- the module is absent during Trainer Forge;
- Phaser and Buddy renderers are also absent;
- the accessible loading state appears while the request is pending;
- continuing a save requests the journey and creates one canvas;
- nested Pages paths and offline continuation work.
- the alpha panel remains absent at startup and works offline after its first controlled online request.

## Current production measurements

| Chunk | Minified | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| Main entry | 405,282 B | 126,041 B | 107,535 B |
| JourneyGame | 185,165 B | 57,478 B | 48,566 B |
| GamePresentation | 19,332 B | 5,950 B | 5,301 B |
| AlphaPlaytestPanel | 10,465 B | 3,304 B | 2,801 B |
| Phaser presentation | 1,231,655 B | 337,734 B | 270,842 B |

Compared with the pre-extraction 561,877-byte entry, the main entry remains 27.9% smaller after adding the bounded alpha recorder. Phaser remains a single deferred copy and is not altered by this work.
