# Technical Architecture

## Scope

This document records the current save-v12 architecture and a safe target
structure for later refactoring. It does not authorize behavior changes.

## Current architecture

The protected prototype currently consists of:

- `client/src/App.tsx`: approximately 5,420 lines containing data,
  configuration, rules, timers, persistence, audio, input, and React UI;
- `client/src/index.css`: approximately 1,598 lines of layout, pixel-art,
  state, animation, and responsive styling;
- browser `localStorage` under the save-v12 key;
- synthesized Web Audio for music and sound effects;
- DOM-rendered map, setup, workout, capture, index, log, and settings;
- keyboard listeners for WASD and arrow movement;
- pointer/touch-compatible buttons and D-pad; and
- a relative-path GitHub Pages production build in the current local
  environment.

The canonical branch does not yet contain a clean GymBuddies-owned package,
entry point, Vite configuration, TypeScript configuration, test suite, or
standalone build workflow.

## Non-negotiable boundaries

Future refactoring must preserve:

- save-v12 behavior or provide an explicit migration;
- all six gyms and five routes;
- all current machine, creature, boss, workout, fatigue, and capture rules;
- keyboard and touch/click controls;
- relative GitHub Pages asset paths;
- original content and synthesized audio;
- deterministic configuration values unless a balance change is separately
  approved; and
- the protected snapshot tag.

## Target module boundaries

The following is a proposed extraction map, not current file structure:

```text
client/src/
  app/
    AppShell
    screens
    overlays
  game/
    config/
      gyms
      routes
      machines
      buddies
      bosses
      balance
    rules/
      workout
      fatigue
      progression
      encounters
      capture
      bossChallenge
    state/
      saveSchema
      saveMigration
      selectors
      actions
    input/
      actions
      keyboard
      pointer
      gamepad
    audio/
      engine
      musicProfiles
      sfx
    presentation/
      uiModels
      animationState
```

Names and exact folders **need validation** during the clean-foundation task.
The important rule is dependency direction:

```text
configuration → pure gameplay rules → state actions/selectors → UI models
→ React rendering
```

Rendering must not become the source of truth for gameplay state.

## Gameplay configuration

Balance values should move into typed configuration by domain:

- workout duration and spot window;
- fatigue caps and recovery;
- machine XP/recovery/load/reward values;
- route fatigue and encounter modifiers;
- gym level bands;
- boss tiers, capture targets, penalties, and streak rules; and
- team and Buddy stat caps.

Extraction must be mechanical first. Tuning changes belong in separate,
playtested commits.

## Rules

Rules modules should:

- accept serializable inputs;
- return explicit results and event descriptions;
- avoid DOM, React, timers, audio nodes, and random global state;
- receive randomness through an injectable source where practical;
- expose enough detail for UI explanation; and
- have characterization tests copied from v12 behavior.

## State and saves

Current save state includes trainer, team, collection, zones, selected
machines, boss schedules, tutorial, audio, fatigue, momentum, deload, and
other progression.

Save rules:

- Serialize gameplay state, not React or audio objects.
- Keep a required save version.
- Validate ranges and missing fields on load.
- Back up current migration behavior with tests before changing it.
- Do not silently reinterpret v12 values after extracting configuration.
- **Needs validation:** multiple slots, export/import, corruption recovery,
  and cross-device saves.

## Time and randomness

Current behavior uses wall-clock time, intervals, timeouts, and `Math.random`.
Future tests will be more reliable if time and randomness can be injected into
pure rules.

Do not change timer semantics during initial extraction. Characterize:

- workout phases;
- spot windows;
- rest cooldown;
- passive recovery;
- stride lock;
- route encounter cooldown;
- zone transitions; and
- boss schedules.

## Input model

Define player actions centrally:

```text
move-up
move-down
move-left
move-right
confirm
cancel
workout
spot
recover
scout
capture-move-1
capture-move-2
capture-move-3
pause
```

Map keyboard, pointer/touch, and future gamepad inputs to these actions.
Gameplay rules should consume actions, not browser key names.

Current gamepad support is absent. Adding it is a future feature and must not
be represented as existing compatibility.

## Rendering and UI

- Keep text-heavy, form-heavy, and accessibility-sensitive UI in the DOM.
- Derive UI labels and warnings from gameplay results.
- Keep animation state presentational.
- Preserve responsive desktop/touch layouts.
- Add error boundaries and debug views without leaking them into save state.
- **Needs validation:** whether the route playfield remains DOM-based or later
  gains a dedicated 2D renderer.

## Audio

- Audio engine state is runtime-only and must not enter gameplay rules.
- Saves may store enabled and volume preferences.
- Music profiles and SFX events should use stable original keys.
- All cues need visual equivalents.
- Audio must begin only after permitted user interaction.

## Accessibility architecture

- Semantic controls and labels are required.
- Focus management belongs at screen/overlay boundaries.
- Reduced motion should be a shared preference.
- Input actions should support remapping.
- Timed-assist settings, if approved, belong in configuration and save state,
  not scattered component checks.

## Testing strategy

### Characterization

- Save-v12 load and normalization.
- Gym/route unlock behavior.
- Workout readiness, failure, spotting, growth, and rewards.
- Fatigue, passive recovery, controlled recovery, momentum, and deload.
- Encounter generation and collection tracking.
- Wild and boss capture thresholds.
- Boss alignment, misses, streaks, near misses, and overload.

### Interface

- Opening and continue flow.
- Keyboard movement.
- Touch/D-pad movement.
- Focus order and keyboard activation.
- Workout and capture state labels.
- Reduced-motion presentation when implemented.
- Gamepad action mapping when implemented.

### Build

- Typecheck.
- Unit tests.
- Lint.
- Production build.
- Relative asset-path assertion.
- Clean-checkout GitHub Pages smoke test.

## Performance and debug

**Needs validation:** performance budgets for startup, bundle size, animation,
and low-end mobile devices.

Provide development-only visibility into:

- current save version;
- active timers;
- route position;
- fatigue/readiness inputs;
- encounter roll inputs;
- workout calculation results; and
- capture/boss calculation results.

Debug data must never expose secrets or become required for normal play.

## Refactor safety sequence

1. Establish a clean GymBuddies-only toolchain.
2. Capture source hashes and run baseline build.
3. Add characterization tests around existing functions.
4. Extract configuration with no value changes.
5. Extract pure rules one system at a time.
6. Introduce UI models and input actions.
7. Add gamepad and accessibility improvements as separate features.
8. Compare saves and gameplay outcomes after every phase.
