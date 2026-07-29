# Gym Buddies Progression Balance

## Executive summary

The complete progression model targets a **5h 30m main journey** from trainer creation through Glory Gym. The deterministic balance run completed **2,000 of 2,000 journeys** (100.0%). Mainline journeys averaged **5h 43m**; across mainline, balanced, collector, and optimizer styles, the median was **6h 18m** and the 90th percentile was **7h 41m**.

The model produced **0.0% mandatory-grind journeys**. Main-path training, route encounters, timely captures, boss rewards, recovery, and protected retries were enough to finish; optional sessions still improve collection, machine mastery, and postgame rank.

Reproducible seed: `20260728`. Run `npm run balance:progression` from the repository root.

## Canonical balance configuration

All progression curves are centralized in `client/src/game/content/progressionBalance.ts`. React and Phaser do not own balance numbers. The pure systems in `client/src/game/systems/progressionModel.ts` consume the configuration, while `progressionSimulation.ts` models full journeys.

The existing v12 systems remain authoritative for minute-to-minute workout, capture, route, boss, fatigue, save, and input behavior. This model connects those systems into a journey economy; it does not replace their presentation.

## Six-gym level and time plan

| Order | Gym | Expected Buddy level | Expected trainer physique | Cumulative time | Main-path workouts | Encounters | Boss wins |
| ---: | --- | --- | --- | --- | ---: | ---: | ---: |
| 1 | Home Gym | 3–6 (target 4) | 7–12 (target 9) | 0h 25m | 2 | 0 | 1 |
| 2 | Starter Gym A | 7–12 (target 10) | 9–15 (target 12) | 1h 05m | 5 | 1 | 1 |
| 3 | Starter Gym B | 16–23 (target 20) | 13–20 (target 17) | 2h 00m | 7 | 1 | 1 |
| 4 | Iron Gym | 26–33 (target 30) | 19–27 (target 23) | 3h 05m | 8 | 1 | 1 |
| 5 | Apex Gym | 36–43 (target 40) | 25–34 (target 30) | 4h 15m | 9 | 1 | 1 |
| 6 | Glory Gym | 46–53 (target 50) | 32–39 (target 36) | 5h 30m | 10 | 2 | 1 |

Expected main-journey completion is **4¾–6½ hours**, with 5½ hours as the tuning target. The range includes trainer creation, exploration, normal reading time, route encounters, workouts, recovery, and one successful boss completion per gym.

## Progression layers

### Trainer physique

- The eight fictional muscle attributes remain the stored source values.
- Physique remains a derived 1–40 summary; no medical assessment is implied.
- Machine-focused growth still uses the existing trainer progression system and per-machine growth multipliers.
- Expected physique bands rise from 7–12 at Home Gym to 32–39 at Glory Gym.

### Buddy level, XP, HP, and preparation

- Buddy levels are capped at 60. XP-to-next-level starts at 8 plus a linear level term and a late-game ramp after level 40.
- Maximum HP is derived from species base HP plus a configured per-level term. Level-up healing is proportional and cannot exceed maximum HP.
- Form, Mobility, and Volume retain their established caps of 24, 24, and 12.
- Power, Technique, Endurance, Mobility, and Recovery strengths are derived from species stats, live preparation stats, level, and primary/secondary discipline identity. They are not five additional save fields.

### Catch-up and anti-runaway rules

- Catch-up starts when a Buddy is more than 3 levels below the current gym target. The multiplier gains 12% per missing level and caps at ×2.20.
- A newly captured Buddy receives an additional ×1.15 multiplier for its first 8 sessions, still under the same hard cap.
- Actual levels are never removed. Above a gym’s expected maximum plus 2 grace levels, only 28% of further levels contribute to capture pressure.
- Party depth, disciplines, preparation, move counters, machine alignment, stamina, and fatigue therefore remain relevant even when one Buddy is overleveled.

### Unlock progression and boss completion

- Main routes continue to unlock from visits, preserving the current declarative world graph.
- Boss completions continue to come from the versioned gameplay-time boss schedules.
- Starter B and Apex boss completions retain their shortcut unlocks.
- Endgame unlocks after one completed boss challenge in all six gyms; individual boss variants remain optional collection and rank goals.

### Machine mastery

| Rank | Mastery XP | Readiness bonus | XP multiplier |
| --- | ---: | ---: | ---: |
| new | 0 | +0.0% | ×1.00 |
| familiar | 18 | +1.0% | ×1.02 |
| skilled | 50 | +2.5% | ×1.05 |
| mastered | 110 | +4.0% | ×1.08 |

- Clean technique earns mastery faster than rescued or failed sets.
- Mastery is stored by stable machine ID and survives Recover actions.
- Benefits cap at +4% readiness and +8% XP, so mastery is useful without making one machine dominate every build.
- Existing repeated-use diminishing returns still apply, making rotation better than button farming.

### Buddy Index, fatigue, momentum, and recovery

- `index.first-four`: see 4, catch 4; progression budget allows 1 Deload Token when this reward is surfaced.
- `index.half-roster`: see 10, catch 8; progression budget allows 1 Deload Token when this reward is surfaced.
- `index-field-expert`: see 14, catch 12; progression budget allows 1 Deload Token when this reward is surfaced.
- `index-complete`: see 16, catch 16; progression budget allows 2 Deload Tokens when this reward is surfaced.

- Fatigue remains capped at 120; the preferred planning ceiling is 78 and the emergency threshold is 102.
- Momentum remains capped at 30 and rewards consistent technique rather than Max-load repetition.
- Deload capacity remains 4. Home recovery and ordinary rest always remain available, so a missing consumable cannot lock the journey.
- After 2 consecutive boss failures, comeback protection restores 24 fatigue and at least 35.0% Buddy HP. The simulator forces the next protected retry to resolve, avoiding permanent failure.

## Deterministic simulation

The script modeled 2,000 complete journeys—well above the 1,000-journey requirement. Styles rotate deterministically: 50% mainline, 30% balanced, 15% collector, and 5% optimizer.

Each journey models configured workouts, route encounters, captures, catch-up XP, machine mastery, trainer growth, fatigue, momentum, Deload drops, recovery stops, boss success, protected retries, Index growth, and optional postgame activity. Randomness uses the project’s seeded RNG; no gameplay calculation in the simulator calls `Math.random`.

### Aggregate results

- Completion rate: **100.0%**
- Average / median / p90 main journey: **6h 25m / 6h 18m / 7h 41m**
- Average final highest Buddy level: **48.6**
- Average final trainer physique: **38.5**
- Journeys requiring unplanned workout grinding: **0.0%**
- Journeys with any boss wall signal: **19.1%**
- Journeys with any runaway-level signal: **0.0%**
- Journeys with an emergency recovery-resource shortage: **0.0%**
- Average recovery stops: **6.96**

### Results by play style

| Style | Journeys | Main journey | Caught species after optional postgame | Mastered machines | Endgame rank |
| --- | ---: | ---: | ---: | ---: | ---: |
| mainline | 1000 | 5h 43m | 6.6 | 0.0 | 3.0 |
| balanced | 600 | 6h 45m | 15.1 | 0.0 | 3.0 |
| collector | 300 | 7h 39m | 16.0 | 0.0 | 4.0 |
| optimizer | 100 | 7h 47m | 12.3 | 4.0 | 4.0 |

### Progression-wall and runaway review

| Gym | Two-failure wall signal | Runaway-level signal | Average boss attempts |
| --- | ---: | ---: | ---: |
| Home Gym | 1.7% | 0.0% | 1.13 |
| Starter Gym A | 3.3% | 0.0% | 1.21 |
| Starter Gym B | 5.1% | 0.0% | 1.25 |
| Iron Gym | 5.1% | 0.0% | 1.25 |
| Apex Gym | 2.9% | 0.0% | 1.21 |
| Glory Gym | 2.7% | 0.0% | 1.19 |

### Findings

- **Progression walls:** No blocking wall was found; protected retries handled unlucky boss sequences without extra workout farming.
- **Runaway growth:** No material runaway-growth pattern was found on the main path.
- **Reward shortages:** Recovery resources remained sufficient in the modeled main journey.
- **Main-path economy:** no simulated journey needed unplanned workout sessions. Capturing within the current route band and the newcomer catch-up curve prevents a single starter from becoming the only practical choice.
- **Optional optimization:** collector and optimizer styles spend more time after the ending on Index completion, alternate boss variants, and machine mastery; none of those goals are required to reach Glory Gym.

## Endgame and replayability

- **Boss Rematch Circuit** (`endgame.rematch-circuit`): Replay all six gyms with rotating machine, move-streak, and fatigue constraints.
- **Machine Mastery Board** (`endgame.mastery-board`): Master distinct machines without repeating one low-risk reward loop.
- **Index Expeditions** (`endgame.index-expeditions`): Use rare route areas and team roles to finish seen and caught records.
- **Balanced Team Trials** (`endgame-balanced-team-trials`): Clear optional rulesets with all five disciplines represented in the party.

Endgame rank combines alternate boss victories, mastered machines, and caught species. Its bonuses are currently tracking and goal-setting only; it does not inflate capture pressure, protecting the main combat balance from postgame runaway growth.

## Balance adjustments made

- Replaced the prototype’s steep `level × 5` XP threshold with the centralized bounded curve so the journey can support level 50 without hundreds of mandatory repetitions.
- Added capped newcomer catch-up XP instead of global party-wide XP, preserving active-Buddy choice while making new captures viable.
- Added challenge-level diminishing returns instead of a hard level cap or enemy rubber-banding.
- Added machine mastery with small capped bonuses and retained repeat-use diminishing returns.
- Added deterministic repeated-failure protection to the model; no Buddy, trainer stat, unlock, Index record, or boss completion can be permanently lost.

## Remaining risks and validation needs

- The full-journey simulator uses abstract action times and a deterministic player-skill model. Real keyboard, touch, and gamepad telemetry should replace those assumptions after structured playtests.
- Catch-up currently applies to completed machine XP. Decide after playtesting whether boss XP should also receive catch-up or remain an active-Buddy reward.
- Index milestone rewards are budgeted here but are not yet surfaced as claimable UI rewards; adding that UI should be a separate focused task with duplicate-claim protection.
- Boss failure protection is implemented as a pure rule and simulation safeguard. Surfacing the recovery grant and protected-retry messaging in the boss UI remains a separate presentation task.
- Endgame activities are defined and measurable, but dedicated rematch-circuit and mastery-board screens are postponed.
- Re-run this report after any change to XP thresholds, gym targets, machine XP, fatigue costs, boss rewards, capture level bands, or mastery thresholds.
