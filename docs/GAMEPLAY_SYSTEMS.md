# Gym Buddies Gameplay Systems

## Purpose

Gameplay calculations live in `client/src/game/systems`. These modules are pure TypeScript: they do not import React or Phaser, do not mutate their inputs, and do not produce UI messages. React currently supplies state and content, applies returned results, and handles messages, audio, timing, and rendering.

The dependency direction is:

`game/types` and `game/content` → `game/systems` → React or a future Phaser adapter

## Shared conventions

- Inputs are explicit values or typed input objects.
- Outputs contain the calculated values needed to update simulation state.
- Input objects are treated as read-only. Updated trainers, Buddies, arrays, and records are returned as new values.
- Random calculations accept a numeric `RandomState` and return the next numeric state.
- Balance values remain in `game/content/balance.ts` and the existing content modules.
- Systems return mathematical results and classifications. Player-facing sentences remain in React.

## Random number generation

File: `client/src/game/systems/random.ts`

Inputs:

- A serializable unsigned numeric seed or `RandomState`.
- Bounds, probability, or candidate list depending on the operation.

Outputs:

- The generated value.
- The next `RandomState`.

`createRandomState` and the functional generator make tests replayable. Runtime seeding uses platform entropy and time without placing functions, generators, or browser objects in save data.

## Trainer progression

File: `client/src/game/systems/trainerProgression.ts`

Inputs:

- Trainer profile and muscle levels.
- Machine focus.
- Gym tier, growth intensity, and reward bonus where applicable.

Outputs:

- Focus score and workout advantages.
- A new clamped trainer profile after growth.
- The derived physique level.

## Buddy progression

File: `client/src/game/systems/buddyProgression.ts`

Inputs:

- Buddy state.
- Workout machine, readiness, gym tier, and outcome.
- Species, level, stable identity data, nickname catalog, and RNG state when creating a Buddy.

Outputs:

- Normalized workout profile and resistance values.
- Form, mobility, and volume growth.
- Newly created starter or captured Buddy plus the next RNG state.

## Fatigue and recovery

File: `client/src/game/systems/fatigueRecovery.ts`

Inputs:

- Training fatigue and workout momentum.
- Whether passive recovery occurs at Home Gym.
- Active Buddy and current deload inventory for a rest action.

Outputs:

- Bounded fatigue and momentum.
- A new recovered Buddy.
- Updated deload inventory and explicit recovery deltas.

## Route encounters

File: `client/src/game/systems/routeEncounters.ts`

Inputs:

- Origin and destination IDs.
- Gym tier, route boost, current fatigue, species catalog, and RNG state.

Outputs:

- Route definition, fatigue cost, encounter boost, and encounter probability.
- Spawn decision plus next RNG state.
- A complete wild encounter plus next RNG state.

## Workout resolution

File: `client/src/game/systems/workoutResolution.ts`

Inputs:

- Buddy, trainer, machine, gym tier, fatigue, momentum, deload inventory, start time, and RNG state.
- A completed workout session and success/failure outcome for final resolution.

Outputs:

- A complete `WorkoutSession`, consumed deload count, and next RNG state.
- Spot probability and outcome.
- New Buddy and trainer values, XP/level outcome, reward count, fatigue, momentum, and growth deltas.

## Capture battles

File: `client/src/game/systems/captureBattles.ts`

Inputs:

- Match, encounter, gym, selected machine, trainer, active Buddy, fatigue, capture move, meter, and RNG state.

Outputs:

- Trainer/Buddy pressure and readiness breakdowns.
- One move’s meter, challenge, fatigue, and counter changes.
- Capture probability, target, penalty breakdown, outcome, and next RNG state.

The system returns outcome IDs such as `captured`, `failed-roll`, `failed-hold`, and `escape`. React turns those outcomes into dialogue and effects.

## Boss challenges

File: `client/src/game/systems/bossChallenges.ts`

Inputs:

- Boss roster, species catalog, gym, selected machine, match counters, Buddy, capture move, and RNG state as required.

Outputs:

- Boss encounter and challenge machine.
- Challenge tier/profile, alignment, pressure, stress, penalties, move counters, capture target, and next RNG state.

## Rewards

File: `client/src/game/systems/rewards.ts`

Inputs:

- Buddy, trainer, XP amount, and steroid inventory.

Outputs:

- New Buddy and trainer values.
- Level-up metadata, remaining inventory, and explicit stat gains.

## Unlock progression

File: `client/src/game/systems/unlockProgression.ts`

Inputs:

- Candidate zone IDs, valid zone IDs, fallback zones, route graph, and current zone.

Outputs:

- Unique, valid, serializable unlocked-zone arrays.

## Save boundary

`SaveData` contains only JSON-compatible primitives, arrays, and plain objects. React/Phaser instances, functions, RNG controllers, `Map`, `Set`, timers, audio nodes, and rendering state remain outside saves. Unit tests verify a representative v12 save survives a JSON stringify/parse round trip unchanged.
