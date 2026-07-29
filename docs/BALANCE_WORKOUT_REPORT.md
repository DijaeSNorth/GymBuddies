# Gym Buddies Workout Balance Report

## Executive summary

The final deterministic simulation evaluated **14,400 workout sessions** across all 24 machines (600 per machine), four loads, all 16 Buddy species, varied trainer builds, fatigue states, momentum states, deload availability, and repeat-use counts.

Seed: `20260728`. The report is reproducible with `npm run balance:workouts`.

The final pass contains **no blocking dominance, underpowered, success-rate, or fatigue outliers** under the declared thresholds.

## Design goals and final adjustments

- Home Gym rewards were compressed and differentiated: Recovery Rack teaches recovery, Mobility Dumbbells teaches alignment, Technique Plate Stack teaches load stress, and Foam Roller Bike teaches volume preparedness.
- Starter Gym rewards now favor dependable two-discipline builds. Their XP spread is narrow, HP effects remain modest, and repeat soft caps are four sessions.
- Higher gyms now pay more XP and trainer growth only alongside explicit HP loss, fatigue, narrower skill margins, or reduced momentum.
- Bonus-item chances were reduced from the prototype’s broad 17–26% range to 1–8%; Deload Token drops remain 1–6%. This prevents low-input reward farming.
- Glory’s highest-XP machines received negative HP and momentum effects plus two-use repeat soft caps.
- Every machine now uses explicit muscle and Buddy-discipline data rather than relying only on display-name inference.

### Outliers found and corrected

- **Technique Plate Stack** initially scored 4.47, below the Home Gym floor. HP effect increased from +1 to +2 and momentum from +2 to +3 so its technique role is worthwhile without matching Recovery Rack healing.
- **Pivot Hammer Row** initially scored 2.10. XP moved from 4–7 to 5–8 and momentum from +1 to +2 to pay for its extra fatigue.
- **Forge Cage Press** initially scored 1.81. XP moved from 5–9 to 6–10 and momentum from +0 to +1 while its specialization costs stayed intact.
- **Crown Crusher** initially scored 3.48. XP moved from 8–12 to 9–13 and momentum from −1 to +0; its HP, fatigue, difficulty, and repeat cap remain severe.
- **Monorail Ground Stack** became the only second-pass outlier at 4.18 after the Crown Crusher correction. Its XP moved from 9–13 to 10–14, preserving its identity as the highest raw-XP machine.
- A sample-size sensitivity pass then found **Arc Bench Rack**, **Leg Pulse Stack**, **Chain Arc Stack**, and **Wide-Grip Tower** could fall below their gym floors. The starter machines and Chain Arc Stack each gained +1 momentum; Wide-Grip Tower kept its 5–9 XP identity while moving from −2 to −1 HP, 5 to 4 fatigue, and +1 to +2 momentum.
- The final pass, using stable per-machine random streams, produced zero blocking outliers.

## Simulation method

- 600 sessions per machine; 150 each on Easy, Steady, Hard, and Max.
- Trainer level sampled from three below to three above each machine’s recommended range.
- Trainer muscle values scale with level and specialize toward the machine’s declared primary groups.
- Buddy species rotate across the complete 16-species roster; HP and preparation stats vary per session.
- Fatigue, momentum, deload availability, and consecutive-use counts are seeded and varied.
- Each machine receives a stable random stream derived from the report seed and machine ID, preventing array order or sample-size changes from reshuffling another machine’s population.
- Rep input uses a deterministic human-timing model whose variance incorporates machine difficulty, load pressure, form consistency, and trainer-level fit.
- Spot Now reaction time is deterministic from the seed and compared with the real rescue deadline.
- Runtime workout preview, rep grading, rescue, rewards, drops, fatigue, HP, and momentum functions are used directly.

### Outlier thresholds

- Dominant: value score above 128% of the gym mean while also carrying above-average XP and below-average fatigue.
- Underpowered: value score below 68% of the gym mean.
- Timing outlier: clean success above 90% or below 20%.
- Fatigue outlier: average fatigue above 26 without above-average XP.

## Final simulation results

| Machine | Gym | Clean | Rescued | Failed | Avg XP | Avg HP | Avg fatigue | Avg momentum | Repeat yield | Boost drop | Deload drop | Value |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Recovery Rack | Home Gym | 74.3% | 17.3% | 8.3% | 1.32 | +3.77 | +2.79 | +3.51 | 82.9% | 0.5% | 2.8% | 7.74 |
| Mobility Dumbbells | Home Gym | 74.8% | 17.7% | 7.5% | 2.28 | +1.43 | +7.60 | +4.39 | 88.2% | 1.2% | 1.3% | 7.36 |
| Technique Plate Stack | Home Gym | 69.7% | 19.5% | 10.8% | 2.75 | +0.88 | +9.48 | +4.16 | 87.6% | 1.3% | 1.2% | 6.62 |
| Foam Roller Bike | Home Gym | 77.0% | 15.3% | 7.7% | 2.46 | +2.34 | +6.19 | +4.58 | 88.8% | 1.0% | 2.5% | 8.77 |
| Arc Bench Rack | Starter Gym A | 62.3% | 22.2% | 15.5% | 3.57 | -1.79 | +14.27 | +3.12 | 91.9% | 2.0% | 1.2% | 3.15 |
| Rope Pulley Station | Starter Gym A | 66.5% | 20.2% | 13.3% | 3.60 | -0.57 | +11.68 | +3.53 | 91.6% | 1.5% | 1.3% | 5.19 |
| Iso-Lock Cables | Starter Gym A | 64.3% | 21.0% | 14.7% | 4.02 | -1.65 | +14.02 | +3.40 | 92.7% | 1.2% | 1.0% | 4.05 |
| Pivot Hammer Row | Starter Gym A | 61.3% | 21.8% | 16.8% | 5.17 | -2.86 | +15.41 | +2.94 | 90.9% | 1.3% | 1.2% | 3.51 |
| Slope Drive Press | Starter Gym B | 66.0% | 18.3% | 15.7% | 4.75 | -1.43 | +14.54 | +3.01 | 92.0% | 2.5% | 2.2% | 4.41 |
| Tempo Selector Pulley | Starter Gym B | 71.5% | 18.8% | 9.7% | 4.63 | +0.06 | +11.73 | +4.31 | 92.4% | 2.0% | 1.5% | 7.76 |
| Pulse Wall Rig | Starter Gym B | 66.5% | 19.7% | 13.8% | 4.92 | -1.28 | +12.99 | +3.67 | 92.0% | 1.5% | 0.8% | 5.90 |
| Leg Pulse Stack | Starter Gym B | 62.3% | 20.7% | 17.0% | 5.51 | -2.57 | +15.74 | +3.25 | 92.3% | 2.7% | 0.7% | 4.45 |
| Forge Cage Press | Iron Gym | 62.5% | 18.7% | 18.8% | 6.86 | -3.17 | +16.44 | +2.43 | 88.9% | 2.3% | 1.0% | 4.04 |
| Dynamo Hammer Row | Iron Gym | 66.8% | 18.8% | 14.3% | 5.77 | -1.70 | +14.80 | +2.93 | 88.2% | 1.7% | 0.7% | 4.85 |
| Chain Arc Stack | Iron Gym | 63.3% | 16.2% | 20.5% | 6.30 | -3.22 | +16.44 | +2.38 | 87.3% | 3.5% | 0.5% | 3.47 |
| Wide-Grip Tower | Iron Gym | 62.7% | 21.3% | 16.0% | 6.01 | -2.89 | +15.02 | +2.98 | 86.5% | 2.8% | 1.0% | 4.67 |
| Microload Squeeze Press | Apex Gym | 62.5% | 18.0% | 19.5% | 7.42 | -3.92 | +16.81 | +2.11 | 88.7% | 3.5% | 0.7% | 3.73 |
| Blink Row Matrix | Apex Gym | 64.2% | 17.3% | 18.5% | 6.48 | -2.75 | +15.46 | +3.18 | 89.3% | 2.3% | 0.5% | 5.26 |
| Vector Harness | Apex Gym | 61.0% | 16.7% | 22.3% | 8.20 | -4.13 | +16.91 | +1.80 | 89.0% | 4.2% | 1.0% | 4.03 |
| Compression Lat Press | Apex Gym | 63.8% | 18.3% | 17.8% | 7.48 | -3.76 | +16.55 | +2.68 | 87.4% | 2.2% | 1.0% | 4.68 |
| Crown Crusher | Glory Gym | 60.7% | 18.5% | 20.8% | 10.02 | -4.83 | +17.44 | +1.77 | 83.4% | 3.3% | 0.8% | 5.17 |
| Composure Mill | Glory Gym | 69.5% | 17.0% | 13.5% | 9.54 | -2.11 | +15.19 | +3.91 | 88.1% | 3.8% | 1.8% | 10.13 |
| Torso Relay Matrix | Glory Gym | 64.5% | 17.2% | 18.3% | 10.03 | -3.43 | +16.84 | +2.85 | 87.4% | 3.0% | 1.7% | 7.73 |
| Monorail Ground Stack | Glory Gym | 62.2% | 17.0% | 20.8% | 11.53 | -5.86 | +18.21 | +1.39 | 84.1% | 3.8% | 0.8% | 5.39 |

## Outlier review

No machine crossed the blocking thresholds. Machines still retain different roles: recovery, momentum, general growth, or high-risk specialization.

## Repeat-use diminishing returns

Each machine defines a `repeatSoftCap`. Sessions up to that cap receive 100% reward efficiency. Every consecutive use beyond the cap removes 12 percentage points down to a 55% floor. Reward efficiency scales XP and momentum directly and scales both drop probabilities quadratically. Switching machines or completing a Recover action resets the consecutive-use chain.

| Previous consecutive uses beyond cap | XP and momentum yield | Drop-yield multiplier |
| ---: | ---: | ---: |
| 1 | 88% | 77.4% |
| 2 | 76% | 57.8% |
| 3 | 64% | 41.0% |
| 4+ | 55% floor | 30.3% floor |

## Complete machine configuration

### Home Gym

#### Recovery Rack

- Stable ID: `home_recovery`
- Gym: Home Gym (`home`)
- Visual concept: A low copper frame with elastic glow-bands and a slow breathing light.
- Gameplay purpose: Teaches readiness, recovery effects, and wide timing windows.
- Primary muscle groups: core, back
- Buddy disciplines affected: recovery, mobility
- XP range: 1–3, ×0.90
- HP effect: +6
- Fatigue cost: +0
- Momentum effect: +1
- Difficulty: 1/5
- Reward table: `reward.home-recovery.completion`; trainer growth ×0.70
- Drop probabilities: Boost Token 1.0%, Deload Token 6.0%
- Recommended trainer level: 1–6
- Repeat soft cap: 2
- Animation cue ID: `machine.home-recovery.cycle`
- Sound cue ID: `train`

#### Mobility Dumbbells

- Stable ID: `home_dumbbells`
- Gym: Home Gym (`home`)
- Visual concept: Compact sky-blue weights orbit a marked shoulder-path rail.
- Gameplay purpose: Teaches clean timing and trainer-to-machine alignment.
- Primary muscle groups: shoulders, core, triceps
- Buddy disciplines affected: technique, mobility
- XP range: 2–4, ×1.00
- HP effect: +2
- Fatigue cost: +1
- Momentum effect: +2
- Difficulty: 1/5
- Reward table: `reward.home-dumbbells.completion`; trainer growth ×0.80
- Drop probabilities: Boost Token 2.0%, Deload Token 3.0%
- Recommended trainer level: 1–8
- Repeat soft cap: 3
- Animation cue ID: `machine.home-dumbbells.cycle`
- Sound cue ID: `train`

#### Technique Plate Stack

- Stable ID: `home_plate`
- Gym: Home Gym (`home`)
- Visual concept: Thin hexagonal plates rise one notch when a rep lands cleanly.
- Gameplay purpose: Teaches load selection, form consistency, and controlled stress.
- Primary muscle groups: arms, triceps, core
- Buddy disciplines affected: technique, power
- XP range: 2–5, ×1.04
- HP effect: +2
- Fatigue cost: +2
- Momentum effect: +3
- Difficulty: 2/5
- Reward table: `reward.home-plate.completion`; trainer growth ×0.85
- Drop probabilities: Boost Token 2.5%, Deload Token 2.5%
- Recommended trainer level: 2–10
- Repeat soft cap: 3
- Animation cue ID: `machine.home-plate.cycle`
- Sound cue ID: `train`

#### Foam Roller Bike

- Stable ID: `home_bike`
- Gym: Home Gym (`home`)
- Visual concept: A moss-green pedal rig drives two soft recovery rollers.
- Gameplay purpose: Teaches volume preparedness and low-risk fatigue management.
- Primary muscle groups: quads, calves, core
- Buddy disciplines affected: endurance, recovery
- XP range: 2–4, ×1.00
- HP effect: +3
- Fatigue cost: +1
- Momentum effect: +2
- Difficulty: 1/5
- Reward table: `reward.home-bike.completion`; trainer growth ×0.80
- Drop probabilities: Boost Token 1.5%, Deload Token 4.0%
- Recommended trainer level: 1–8
- Repeat soft cap: 3
- Animation cue ID: `machine.home-bike.cycle`
- Sound cue ID: `train`

### Starter Gym A

#### Arc Bench Rack

- Stable ID: `starter_a_bench`
- Gym: Starter Gym A (`starter-a`)
- Visual concept: A rounded amber press rail with twin safety catches and a rep beacon.
- Gameplay purpose: Builds dependable Power while keeping risk and timing readable.
- Primary muscle groups: chest, shoulders, triceps
- Buddy disciplines affected: power, endurance
- XP range: 3–6, ×1.08
- HP effect: +0
- Fatigue cost: +3
- Momentum effect: +2
- Difficulty: 2/5
- Reward table: `reward.starter-a-bench.completion`; trainer growth ×0.95
- Drop probabilities: Boost Token 3.5%, Deload Token 2.0%
- Recommended trainer level: 6–16
- Repeat soft cap: 4
- Animation cue ID: `machine.starter-a-bench.cycle`
- Sound cue ID: `train`

#### Rope Pulley Station

- Stable ID: `starter_a_ropes`
- Gym: Starter Gym A (`starter-a`)
- Visual concept: Two braided cables sweep through a luminous wrist-alignment arc.
- Gameplay purpose: Develops repeatable grip control and forgiving reset speed.
- Primary muscle groups: arms, back
- Buddy disciplines affected: technique, mobility
- XP range: 3–6, ×1.06
- HP effect: +1
- Fatigue cost: +2
- Momentum effect: +2
- Difficulty: 2/5
- Reward table: `reward.starter-a-ropes.completion`; trainer growth ×0.95
- Drop probabilities: Boost Token 3.0%, Deload Token 2.5%
- Recommended trainer level: 6–18
- Repeat soft cap: 4
- Animation cue ID: `machine.starter-a-ropes.cycle`
- Sound cue ID: `train`

#### Iso-Lock Cables

- Stable ID: `starter_a_machine`
- Gym: Starter Gym A (`starter-a`)
- Visual concept: Mirrored cable arms freeze around a central lock-point crystal.
- Gameplay purpose: Creates a dependable Technique build under moderate compression.
- Primary muscle groups: chest, triceps, core
- Buddy disciplines affected: technique, recovery
- XP range: 3–7, ×1.07
- HP effect: +0
- Fatigue cost: +3
- Momentum effect: +2
- Difficulty: 2/5
- Reward table: `reward.starter-a-machine.completion`; trainer growth ×1.00
- Drop probabilities: Boost Token 3.0%, Deload Token 2.0%
- Recommended trainer level: 8–18
- Repeat soft cap: 4
- Animation cue ID: `machine.starter-a-machine.cycle`
- Sound cue ID: `train`

#### Pivot Hammer Row

- Stable ID: `starter_a_rows`
- Gym: Starter Gym A (`starter-a`)
- Visual concept: A teal flywheel drives two offset handles through a back-row path.
- Gameplay purpose: Trades extra fatigue for dependable pulling Power and Endurance.
- Primary muscle groups: back, arms
- Buddy disciplines affected: power, endurance
- XP range: 5–8, ×1.10
- HP effect: -1
- Fatigue cost: +4
- Momentum effect: +2
- Difficulty: 3/5
- Reward table: `reward.starter-a-rows.completion`; trainer growth ×1.02
- Drop probabilities: Boost Token 4.0%, Deload Token 1.5%
- Recommended trainer level: 10–20
- Repeat soft cap: 4
- Animation cue ID: `machine.starter-a-rows.cycle`
- Sound cue ID: `train`

### Starter Gym B

#### Slope Drive Press

- Stable ID: `starter_b_leg`
- Gym: Starter Gym B (`starter-b`)
- Visual concept: A diagonal footplate pushes a striped power carriage uphill.
- Gameplay purpose: Builds a stable Power and Endurance base with predictable stress.
- Primary muscle groups: quads, core
- Buddy disciplines affected: power, endurance
- XP range: 4–7, ×1.10
- HP effect: +0
- Fatigue cost: +4
- Momentum effect: +1
- Difficulty: 3/5
- Reward table: `reward.starter-b-leg.completion`; trainer growth ×1.02
- Drop probabilities: Boost Token 4.0%, Deload Token 2.0%
- Recommended trainer level: 14–24
- Repeat soft cap: 4
- Animation cue ID: `machine.starter-b-leg.cycle`
- Sound cue ID: `train`

#### Tempo Selector Pulley

- Stable ID: `starter_b_cable`
- Gym: Starter Gym B (`starter-b`)
- Visual concept: A vertical selector glides between colored tempo bands.
- Gameplay purpose: Develops dependable Technique and Mobility through controlled acceleration.
- Primary muscle groups: core, quads
- Buddy disciplines affected: technique, mobility
- XP range: 3–7, ×1.08
- HP effect: +1
- Fatigue cost: +3
- Momentum effect: +2
- Difficulty: 2/5
- Reward table: `reward.starter-b-cable.completion`; trainer growth ×1.00
- Drop probabilities: Boost Token 3.5%, Deload Token 2.5%
- Recommended trainer level: 14–24
- Repeat soft cap: 4
- Animation cue ID: `machine.starter-b-cable.cycle`
- Sound cue ID: `train`

#### Pulse Wall Rig

- Stable ID: `starter_b_pulley`
- Gym: Starter Gym B (`starter-b`)
- Visual concept: Wall-mounted pulleys flash in sequence toward a narrow timing latch.
- Gameplay purpose: Rewards precise timing without demanding an extreme load.
- Primary muscle groups: core, shoulders, back
- Buddy disciplines affected: technique, mobility
- XP range: 4–7, ×1.10
- HP effect: +0
- Fatigue cost: +3
- Momentum effect: +2
- Difficulty: 3/5
- Reward table: `reward.starter-b-pulley.completion`; trainer growth ×1.02
- Drop probabilities: Boost Token 4.0%, Deload Token 2.0%
- Recommended trainer level: 16–26
- Repeat soft cap: 4
- Animation cue ID: `machine.starter-b-pulley.cycle`
- Sound cue ID: `train`

#### Leg Pulse Stack

- Stable ID: `starter_b_leg_pulse`
- Gym: Starter Gym B (`starter-b`)
- Visual concept: A broad foot sled compresses glowing springs in short rhythm bursts.
- Gameplay purpose: Raises Endurance rewards at the cost of higher fatigue and tighter form.
- Primary muscle groups: quads, calves
- Buddy disciplines affected: endurance, power
- XP range: 5–8, ×1.12
- HP effect: -1
- Fatigue cost: +5
- Momentum effect: +2
- Difficulty: 3/5
- Reward table: `reward.starter-b-leg-pulse.completion`; trainer growth ×1.05
- Drop probabilities: Boost Token 4.5%, Deload Token 1.5%
- Recommended trainer level: 18–28
- Repeat soft cap: 4
- Animation cue ID: `machine.starter-b-leg-pulse.cycle`
- Sound cue ID: `train`

### Iron Gym

#### Forge Cage Press

- Stable ID: `iron_armor`
- Gym: Iron Gym (`higher-1`)
- Visual concept: Dark guide rails throw orange sparks as the carriage reaches lock.
- Gameplay purpose: Specializes Power at a clear HP and fatigue cost.
- Primary muscle groups: chest, back, arms
- Buddy disciplines affected: power, technique
- XP range: 6–10, ×1.14
- HP effect: -1
- Fatigue cost: +5
- Momentum effect: +1
- Difficulty: 4/5
- Reward table: `reward.iron-armor.completion`; trainer growth ×1.10
- Drop probabilities: Boost Token 5.0%, Deload Token 2.0%
- Recommended trainer level: 24–34
- Repeat soft cap: 3
- Animation cue ID: `machine.iron-armor.cycle`
- Sound cue ID: `train`

#### Dynamo Hammer Row

- Stable ID: `iron_row`
- Gym: Iron Gym (`higher-1`)
- Visual concept: A brass flywheel stores each pull and releases a cooling blue pulse.
- Gameplay purpose: Specializes durable Endurance with moderate recovery support.
- Primary muscle groups: quads, calves, core
- Buddy disciplines affected: endurance, recovery
- XP range: 5–8, ×1.10
- HP effect: +0
- Fatigue cost: +4
- Momentum effect: +1
- Difficulty: 3/5
- Reward table: `reward.iron-row.completion`; trainer growth ×1.06
- Drop probabilities: Boost Token 4.5%, Deload Token 3.0%
- Recommended trainer level: 24–34
- Repeat soft cap: 3
- Animation cue ID: `machine.iron-row.cycle`
- Sound cue ID: `train`

#### Chain Arc Stack

- Stable ID: `iron_chain`
- Gym: Iron Gym (`higher-1`)
- Visual concept: Linked counterweights rattle through an uneven resistance curve.
- Gameplay purpose: Specializes explosive lockout Technique with meaningful failure risk.
- Primary muscle groups: chest, triceps, core
- Buddy disciplines affected: technique, power
- XP range: 6–9, ×1.13
- HP effect: -1
- Fatigue cost: +5
- Momentum effect: +1
- Difficulty: 4/5
- Reward table: `reward.iron-chain.completion`; trainer growth ×1.10
- Drop probabilities: Boost Token 5.5%, Deload Token 2.0%
- Recommended trainer level: 26–36
- Repeat soft cap: 3
- Animation cue ID: `machine.iron-chain.cycle`
- Sound cue ID: `train`

#### Wide-Grip Tower

- Stable ID: `iron_grip`
- Gym: Iron Gym (`higher-1`)
- Visual concept: Oversized rotating handles climb a narrow iron column.
- Gameplay purpose: Specializes late-set control while taxing HP and fatigue.
- Primary muscle groups: arms, back
- Buddy disciplines affected: technique, endurance
- XP range: 5–9, ×1.12
- HP effect: -1
- Fatigue cost: +4
- Momentum effect: +2
- Difficulty: 4/5
- Reward table: `reward.iron-grip.completion`; trainer growth ×1.12
- Drop probabilities: Boost Token 5.5%, Deload Token 1.5%
- Recommended trainer level: 27–36
- Repeat soft cap: 3
- Animation cue ID: `machine.iron-grip.cycle`
- Sound cue ID: `train`

### Apex Gym

#### Microload Squeeze Press

- Stable ID: `apex_platform`
- Gym: Apex Gym (`higher-2`)
- Visual concept: Floating violet plates align to a single bright precision seam.
- Gameplay purpose: High-risk Technique specialization with strong clean-set rewards.
- Primary muscle groups: triceps, shoulders, core
- Buddy disciplines affected: technique, power
- XP range: 6–10, ×1.16
- HP effect: -2
- Fatigue cost: +6
- Momentum effect: +0
- Difficulty: 4/5
- Reward table: `reward.apex-platform.completion`; trainer growth ×1.18
- Drop probabilities: Boost Token 6.5%, Deload Token 2.0%
- Recommended trainer level: 34–44
- Repeat soft cap: 3
- Animation cue ID: `machine.apex-platform.cycle`
- Sound cue ID: `train`

#### Blink Row Matrix

- Stable ID: `apex_blink`
- Gym: Apex Gym (`higher-2`)
- Visual concept: Three offset handles light in a looping cyan rhythm pattern.
- Gameplay purpose: Specializes Mobility and Endurance through demanding rhythm changes.
- Primary muscle groups: core, calves
- Buddy disciplines affected: mobility, endurance
- XP range: 5–9, ×1.13
- HP effect: -1
- Fatigue cost: +5
- Momentum effect: +2
- Difficulty: 4/5
- Reward table: `reward.apex-blink.completion`; trainer growth ×1.12
- Drop probabilities: Boost Token 5.5%, Deload Token 3.0%
- Recommended trainer level: 34–44
- Repeat soft cap: 3
- Animation cue ID: `machine.apex-blink.cycle`
- Sound cue ID: `train`

#### Vector Harness

- Stable ID: `apex_harness`
- Gym: Apex Gym (`higher-2`)
- Visual concept: A suspended belt pulls against four directional leverage anchors.
- Gameplay purpose: High-value leverage specialization with severe load pressure.
- Primary muscle groups: back, chest, core
- Buddy disciplines affected: technique, power
- XP range: 7–11, ×1.18
- HP effect: -2
- Fatigue cost: +6
- Momentum effect: +0
- Difficulty: 5/5
- Reward table: `reward.apex-harness.completion`; trainer growth ×1.20
- Drop probabilities: Boost Token 7.0%, Deload Token 1.5%
- Recommended trainer level: 36–46
- Repeat soft cap: 3
- Animation cue ID: `machine.apex-harness.cycle`
- Sound cue ID: `train`

#### Compression Lat Press

- Stable ID: `apex_lat`
- Gym: Apex Gym (`higher-2`)
- Visual concept: Overhead fins fold toward a deep-blue pressure core.
- Gameplay purpose: Specializes back pressure with a small Recovery crossover.
- Primary muscle groups: back, core
- Buddy disciplines affected: power, recovery
- XP range: 6–10, ×1.16
- HP effect: -2
- Fatigue cost: +6
- Momentum effect: +1
- Difficulty: 4/5
- Reward table: `reward.apex-lat.completion`; trainer growth ×1.17
- Drop probabilities: Boost Token 6.0%, Deload Token 2.5%
- Recommended trainer level: 36–46
- Repeat soft cap: 3
- Animation cue ID: `machine.apex-lat.cycle`
- Sound cue ID: `train`

### Glory Gym

#### Crown Crusher

- Stable ID: `glory_crusher`
- Gym: Glory Gym (`higher-3`)
- Visual concept: A gold-and-crimson press closes beneath a floating crown gauge.
- Gameplay purpose: Extreme Power specialization with high HP, fatigue, and timing risk.
- Primary muscle groups: chest, arms
- Buddy disciplines affected: power
- XP range: 9–13, ×1.20
- HP effect: -3
- Fatigue cost: +7
- Momentum effect: +0
- Difficulty: 5/5
- Reward table: `reward.glory-crusher.completion`; trainer growth ×1.28
- Drop probabilities: Boost Token 7.5%, Deload Token 1.5%
- Recommended trainer level: 44–55
- Repeat soft cap: 2
- Animation cue ID: `machine.glory-crusher.cycle`
- Sound cue ID: `train`

#### Composure Mill

- Stable ID: `glory_mill`
- Gym: Glory Gym (`higher-3`)
- Visual concept: A silver posture wheel turns through alternating balance gates.
- Gameplay purpose: Endgame Technique and Endurance specialization that rewards composure.
- Primary muscle groups: shoulders, core
- Buddy disciplines affected: technique, endurance
- XP range: 7–11, ×1.16
- HP effect: -1
- Fatigue cost: +6
- Momentum effect: +2
- Difficulty: 4/5
- Reward table: `reward.glory-mill.completion`; trainer growth ×1.22
- Drop probabilities: Boost Token 6.5%, Deload Token 3.0%
- Recommended trainer level: 42–55
- Repeat soft cap: 3
- Animation cue ID: `machine.glory-mill.cycle`
- Sound cue ID: `train`

#### Torso Relay Matrix

- Stable ID: `glory_torso`
- Gym: Glory Gym (`higher-3`)
- Visual concept: Four linked pads pass a bright impulse around a central core ring.
- Gameplay purpose: Endgame transfer specialization balancing Power and Mobility.
- Primary muscle groups: core, quads
- Buddy disciplines affected: power, mobility
- XP range: 8–12, ×1.18
- HP effect: -2
- Fatigue cost: +7
- Momentum effect: +1
- Difficulty: 5/5
- Reward table: `reward.glory-torso.completion`; trainer growth ×1.24
- Drop probabilities: Boost Token 7.0%, Deload Token 2.0%
- Recommended trainer level: 44–55
- Repeat soft cap: 3
- Animation cue ID: `machine.glory-torso.cycle`
- Sound cue ID: `train`

#### Monorail Ground Stack

- Stable ID: `glory_deadlift`
- Gym: Glory Gym (`higher-3`)
- Visual concept: A black floor carriage breaks free along a single glowing rail.
- Gameplay purpose: Highest raw XP potential with the roster’s greatest fatigue and HP cost.
- Primary muscle groups: quads, calves, core, back
- Buddy disciplines affected: power, endurance
- XP range: 10–14, ×1.20
- HP effect: -4
- Fatigue cost: +8
- Momentum effect: -1
- Difficulty: 5/5
- Reward table: `reward.glory-deadlift.completion`; trainer growth ×1.30
- Drop probabilities: Boost Token 8.0%, Deload Token 1.0%
- Recommended trainer level: 46–55
- Repeat soft cap: 2
- Animation cue ID: `machine.glory-deadlift.cycle`
- Sound cue ID: `train`

## Remaining validation questions

- The timing model approximates human input; telemetry from real keyboard, touch, and gamepad sessions should replace its assumptions when available.
- Drop rates are intentionally low. Validate whether players recognize them as bonuses rather than expected per-session rewards.
- Confirm that a Recover reset feels like a strategic break and not a mandatory farming loop.
- Re-run this report after changing load windows, XP curves, fatigue caps, Buddy base stats, or trainer muscle limits.
