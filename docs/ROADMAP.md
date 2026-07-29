# Gym Buddies Roadmap

## Roadmap principles

- The protected save-v12 prototype is the behavior baseline.
- Establish build and tests before refactoring.
- Separate architecture changes from balance changes.
- Expand one system at a time.
- Preserve keyboard, touch/click, saves, original content, and relative Pages
  paths.
- Do not merge or stage unrelated application content.
- Every new creature, visual, sound, name, and story element passes
  originality review.

Dates and staffing are **needs validation**. This roadmap is ordered by risk
and dependency, not calendar estimates.

## Phase 0 — Protected design baseline

### Status

In progress.

### Deliverables

- Protected v12 branch and tag.
- Repository audit.
- Game vision.
- Core loop.
- Progression, workout, and capture designs.
- Content, art, originality, architecture, and roadmap guidance.

### Exit gate

- All ten foundation documents agree on current versus proposed behavior.
- No gameplay code changed.
- Uncertain choices are labeled for validation.

## Phase 1 — Clean GymBuddies foundation

### Goal

Make the canonical v12 branch self-contained and reproducible without changing
gameplay.

### Deliverables

- GymBuddies-only `package.json` and lockfile.
- Minimal TypeScript and Vite configuration.
- Clean HTML and React entry point.
- Project-specific `.gitignore`.
- Clean GitHub Pages workflow with relative asset paths.
- Typecheck, test, lint, and production-build scripts.
- No excluded application paths in the commit.

### Exit gate

- Clean checkout installs and builds.
- Production output loads with relative paths.
- App/CSS behavior and save-v12 key are unchanged.

## Phase 2 — Characterization and input baseline

### Goal

Protect current rules before extraction.

### Deliverables

- Characterization tests for saves, routes, workouts, fatigue, encounters,
  bosses, and captures.
- Desktop keyboard smoke test.
- Touch/D-pad smoke test.
- Central action-map design.
- Accessibility baseline audit.

### Exit gate

- Tests capture important v12 outcomes.
- No unexplained balance deltas.
- Input behavior matches the protected prototype.

## Phase 3 — Configuration extraction

### Goal

Move content and tuning out of the large component without changing values.

### Deliverables

- Typed gym, route, machine, Buddy, boss, and balance configuration.
- Stable content identifiers.
- Configuration validation.
- Snapshot or equivalence tests for extracted data.

### Exit gate

- Current six gyms, five routes, 24 machines, current Buddy roster, bosses,
  and balance values are equivalent to v12.
- App rendering continues to use the same player-facing content.

## Phase 4 — Gameplay-rule extraction

### Goal

Separate simulation from React rendering.

### Deliverables

- Pure workout calculations.
- Fatigue/recovery rules.
- Progression and XP rules.
- Encounter generation.
- Wild capture resolution.
- Boss challenge and capture resolution.
- Injectable time/randomness boundaries.

### Exit gate

- Characterization tests pass after each system extraction.
- UI consumes rule results rather than duplicating formulas.
- Save serialization remains compatible.

## Phase 5 — Input and accessibility hardening

### Goal

Support the required device range and reduce interaction barriers.

### Deliverables

- Central action map.
- Keyboard remapping design.
- Touch-target and focus improvements.
- Gamepad support.
- Reduced-motion setting.
- Non-color state indicators.
- **Needs validation:** spot timing assistance and non-timed workout option.

### Exit gate

- Core loop is usable with keyboard, touchscreen, and gamepad.
- Audio has visual equivalents.
- Critical actions have visible focus and accessible labels.

## Phase 6 — Progression clarity

### Goal

Make current growth and preparation choices easier to understand before adding
new progression.

### Deliverables

- Clear trainer/Buddy/machine relationship explanations.
- Team role summaries.
- Gym completion/progress presentation.
- Full-team handling design.
- Boss-defeat progression design.
- Evaluation of the five-discipline taxonomy.

### Exit gate

- Playtesters can explain Power, Technique, Endurance, Mobility, and Recovery
  in Gym Buddies terms.
- A decision is made on derived roles versus new persistent stats.
- Any save-schema change has a migration plan.

## Phase 7 — Content and presentation expansion

### Goal

Expand the world only after systems and originality gates are stable.

### Candidate deliverables

- Additional original Buddies.
- More machine animations and gym environment identity.
- Expanded boss presentation.
- Original dialogue and route events.
- Asset manifest and provenance records.
- High-contrast and palette options.

All candidate content **needs validation** for scope, balance, performance, and
originality.

### Exit gate

- Every asset has provenance.
- No protected-IP comparison language remains.
- New content adds a distinct gameplay role.

## Phase 8 — Endgame and replayability

### Goal

Give Glory Gym completion and team mastery a durable purpose.

### Candidate directions

- gym-boss completion goals;
- Gym Buddy Index completion;
- balanced five-discipline team goals;
- optional challenge conditions;
- alternate trainer builds;
- multiple save slots; and
- structured replay or new-game-plus modes.

All directions **need validation**. No endgame promise is approved by this
roadmap alone.

### Exit gate

- The game has a clear completion statement.
- Continued play offers meaningful choices rather than pure repetition.
- Save and balance behavior remains understandable.

## Cross-phase quality gate

Every phase must report:

- files changed;
- functionality added or intentionally unchanged;
- typecheck result;
- test result;
- lint result;
- production-build result;
- desktop, touch, and gamepad validation appropriate to the phase;
- save compatibility;
- originality review;
- unresolved risks; and
- recommended next task.

## Decisions still requiring validation

- Target session length and audience age rating.
- Steroid terminology and health messaging.
- Formal endgame.
- Full-team capture handling.
- Multiple saves and export/import.
- Exact role of the five disciplines.
- Dynamic or fixed late-game level bands.
- Boss retry and timer protection.
- Timed-workout accessibility options.
- Long-term renderer choice for the route map.
- Performance budgets and supported device floor.
