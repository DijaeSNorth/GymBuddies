# Gym Buddies Production Bundle Audit Baseline

## Scope and reproduction

Baseline captured on 2026-07-30 from the existing Gym Buddies working tree before bundle-boundary changes. It includes the pending Batch 03 formal-review work but excludes every unrelated workspace tree.

Reproduction method:

```text
vite build --sourcemap --outDir <temporary-directory>
```

The report reads each emitted JavaScript file, its source map, and its complete `sourcesContent` membership. Gzip uses level 9; Brotli uses quality 11. Source byte counts are unminified inputs and are used only to rank modules, not as an estimate of minified contribution.

## Baseline chunks

| Chunk | Role | Minified | Gzip | Brotli | Modules |
| --- | --- | ---: | ---: | ---: | ---: |
| `index-Bn1IE_XD.js` | Application entry | 735,273 B | 206,894 B | 172,248 B | 95 |
| `createGamePresentation-B9Ubr_2z.js` | Lazy Phaser presentation | 1,231,561 B | 337,705 B | 270,464 B | 4 |
| **Total JavaScript** |  | **1,966,834 B** | **544,599 B** | **442,712 B** | **99** |

The application entry exceeded Vite's 500 kB advisory. Phaser was already lazy and did not execute during trainer creation.

## Largest baseline entry modules

| Module | Source bytes |
| --- | ---: |
| `src/App.tsx` | 182,455 |
| `react-dom.production.min.js` | 131,685 |
| `trainerPixelRenderer.ts` | 50,668 |
| `trainerAppearance.ts` content | 36,739 |
| `buddies.ts` | 32,667 |
| `journeyMaps.ts` | 30,824 |
| `GamePresentation.tsx` | 30,110 |
| `workoutResolution.ts` | 27,835 |
| `captureBattles.ts` | 26,844 |
| `TrainerCreationScreen.tsx` | 25,961 |
| `characters.ts` | 24,475 |
| `buddyPixelRenderer.ts` | 24,018 |
| `buddyCharacters.ts` | 23,328 |
| `TrainerCustomizationControls.tsx` | 21,778 |
| `PhysiqueReviewPanel.tsx` | 20,972 |
| `machines.ts` | 20,643 |
| `saveValidation.ts` | 20,613 |
| `domeShellModules.ts` | 18,808 |
| `bosses.ts` | 17,954 |
| `bossChallenges.ts` | 17,205 |

## Complete baseline module membership

### Application entry: 95 modules

Vendor:

- `react.production.min.js`, `react/index.js`
- `react-jsx-runtime.production.min.js`, `react/jsx-runtime.js`
- `react-dom.production.min.js`, `react-dom/index.js`, `react-dom/client.js`
- `scheduler.production.min.js`, `scheduler/index.js`

Entry and application:

- `src/main.tsx`
- `src/App.tsx`

Audio, input, and presentation shell:

- `src/game/content/audio.ts`
- `src/game/audio/retroAudioEngine.ts`
- `src/game/phaser/presentationConfig.ts`
- `src/game/phaser/presentationEffects.ts`
- `src/game/input/actionMap.ts`
- `src/game/input/gamepadPolling.ts`
- `src/ui/accessibility/InputAccessibilityPanel.tsx`
- `src/ui/game/GamePresentation.tsx`

Static content:

- `src/game/content/balance.ts`
- `src/game/content/bodybuilding.ts`
- `src/game/content/bossCharacters.ts`
- `src/game/content/bosses.ts`
- `src/game/content/buddies.ts`
- `src/game/content/buddyCharacters.ts`
- `src/game/content/captureBalance.ts`
- `src/game/content/captureMoves.ts`
- `src/game/content/characters.ts`
- `src/game/content/gyms.ts`
- `src/game/content/machines.ts`
- `src/game/content/maps/journeyMaps.ts`
- `src/game/content/progressionBalance.ts`
- `src/game/content/routes.ts`
- `src/game/content/save.ts`
- `src/game/content/trainer.ts`
- `src/game/content/trainerAppearance.ts`
- `src/game/content/tutorial.ts`
- `src/game/content/visualProgression.ts`
- `src/game/content/workoutLoads.ts`
- `src/game/content/worldGraph.ts`

Simulation and save modules:

- `src/game/save/autosavePolicy.ts`
- `src/game/save/saveDefaults.ts`
- `src/game/save/saveMigrations.ts`
- `src/game/save/saveService.ts`
- `src/game/save/saveValidation.ts`
- `src/game/save/visualProgressionValidation.ts`
- `src/game/systems/bodybuildingChallenges.ts`
- `src/game/systems/bossChallenges.ts`
- `src/game/systems/bossScheduling.ts`
- `src/game/systems/buddyCosmetics.ts`
- `src/game/systems/buddyProgression.ts`
- `src/game/systems/captureBattles.ts`
- `src/game/systems/captureParty.ts`
- `src/game/systems/fatigueRecovery.ts`
- `src/game/systems/math.ts`
- `src/game/systems/overworldMovement.ts`
- `src/game/systems/progressionModel.ts`
- `src/game/systems/random.ts`
- `src/game/systems/rewards.ts`
- `src/game/systems/routeEncounters.ts`
- `src/game/systems/trainerAppearance.ts`
- `src/game/systems/trainerCreation.ts`
- `src/game/systems/trainerProgression.ts`
- `src/game/systems/unlockProgression.ts`
- `src/game/systems/visualProgression.ts`
- `src/game/systems/workoutResolution.ts`

Trainer and production UI:

- `src/ui/save/SaveManagementPanel.tsx`
- `src/ui/trainer/PhysiqueReviewPanel.tsx`
- `src/ui/trainer/TrainerCreationScreen.tsx`
- `src/ui/trainer/TrainerCustomizationControls.tsx`
- `src/ui/trainer/TrainerPixelSprite.tsx`
- `src/ui/trainer/TrainerPreviewControls.tsx`
- `src/ui/trainer/TrainerPreviewWorkbench.tsx`
- `src/ui/workout/WorkoutMiniGame.tsx`
- `src/ui/buddies/BuddyCustomizer.tsx`
- `src/ui/buddies/BuddyIndex.tsx`
- `src/ui/buddies/BuddySprite.tsx`

Buddy assets and renderers:

- `src/game/assets/anatomyFamilies.ts`
- `src/game/assets/armoredHeavyModules.ts`
- `src/game/assets/assetUrl.ts`
- `src/game/assets/buddyPresentationCompositor.ts`
- `src/game/assets/buddyPresentationResolver.ts`
- `src/game/assets/buddySpriteCompositor.ts`
- `src/game/assets/buddySpriteResolver.ts`
- `src/game/assets/domeShellModules.ts`
- `src/game/assets/manifest.ts`
- `src/game/assets/paletteSwap.ts`
- `src/game/rendering/armoredHeavyPixelRenderer.ts`
- `src/game/rendering/armoredHeavyPresentationRenderer.ts`
- `src/game/rendering/buddyPixelRenderer.ts`
- `src/game/rendering/buddyPresentationOverlayRenderer.ts`
- `src/game/rendering/domeShellPixelRenderer.ts`
- `src/game/rendering/domeShellPresentationRenderer.ts`
- `src/game/rendering/pilotBuddyPhysiqueRenderer.ts`
- `src/game/rendering/trainerPixelRenderer.ts`

### Phaser presentation chunk: 4 modules

- `node_modules/phaser/dist/phaser.js` — 7,857,764 source bytes
- `src/game/phaser/OverworldScene.ts` — 34,558 source bytes
- `src/game/systems/characterDesign.ts` — 9,844 source bytes
- `src/game/phaser/createGamePresentation.ts` — 1,703 source bytes

## Duplicates and shared dependencies

- Duplicate modules emitted into multiple chunks: **0**
- Multiple Phaser builds: **0**
- Phaser imports outside the designated Phaser modules: **0 runtime imports**; the bridge uses a type-only import.
- Shared React dependencies lived only in the application entry.

## Dynamic-import baseline

The only production dynamic boundary was:

```text
GamePresentation
  -> import(game/phaser/createGamePresentation)
  -> Phaser + OverworldScene
```

Trainer creation and save management worked before Phaser loaded, but the React presentation shell, every Buddy renderer, all Buddy resolution machinery, Buddy customization, the Buddy Index, and Physique Review were still in the startup entry.

## Debug and source hygiene baseline

Production output contained:

- debug gallery modules: **0**
- review metadata modules: **0**
- Playwright or test fixtures: **0**
- art-source references: **0**
- contact-sheet configuration: **0**

The DEV-gated top-level debug screens were already eliminated by Vite. Two source-level risks remained:

1. `AudioTestPanel` was statically imported by `App.tsx`, relying on dead-code elimination.
2. Representative save tooling was statically imported by `SaveManagementPanel`, also relying on dead-code elimination.

Neither leaked its module into this baseline build, but both violated the stronger isolation requirement and lacked a production-output regression guard.

## Primary cause

The main chunk grew because `App.tsx` eagerly pulled the complete production Buddy presentation graph through `BuddySprite` and `BuddyIndex`, plus conditional but non-startup surfaces. The renderer graph alone included 18 modules covering all anatomy families, armor/dome rules, multi-resolution resolution, compositing, palette handling, and procedural fallback.

The correct first optimization was a feature boundary around that cohesive graph, not merging anatomy rules or deleting content.
