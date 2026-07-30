# Workout System

## Purpose

Machine training is a short skill game that turns preparation, load choice,
and consistent timing into Buddy and trainer progression. All HP, fatigue,
form, and load values are fictional RPG statistics. The game does not present
medical, supplement, or real-world exercise advice.

## Player flow

1. Select an active Buddy and a machine.
2. Choose Easy, Steady, Hard, or Max.
3. Review the complete session forecast.
4. Start the set.
5. Press **Lock Rep** as the cursor crosses the visible timing zones.
6. Repeat for every rep in the load profile.
7. If a rep fails, press **Spot Now** during the short rescue window.
8. Review the result and the specific factors that affected it.

The session never succeeds or fails from a hidden random roll. Randomness is
limited to the XP value within the machine's configured range and the
prototype's existing bonus-item roll. Rep grades and rescue outcomes are
deterministic functions of player input timing.

## Load profiles

Load balance lives in `client/src/game/content/workoutLoads.ts`.

| Load | Reps | Rep time | Role | Deload use |
| --- | ---: | ---: | --- | ---: |
| Easy | 3 | 2.4 s | Wide timing window and low-stress technique practice | 0 |
| Steady | 3 | 2.1 s | Balanced risk and the strongest consistent-technique momentum | 0 |
| Hard | 4 | 1.85 s | Tighter timing and higher growth opportunity | Up to 1 |
| Max | 4 | 1.6 s | Tightest timing, highest stress, and reduced momentum efficiency | Up to 2 |

Deload tokens are earned through the existing Recover action. Hard and Max
automatically use available tokens, and the forecast shows the exact cost
before the set begins. A deload token lowers load pressure and raises
readiness; the save still stores only serializable counters.

## Forecast calculations

`calculateWorkoutPreview` is a pure TypeScript function. It accepts the Buddy,
machine, trainer, gym kind, selected load, fatigue, momentum, and available
deload tokens. It returns:

- **Readiness:** current HP, form, mobility, trainer development, machine
  recovery bias, fatigue, momentum, and gym difficulty.
- **Selected load:** the stable load ID chosen by the player.
- **Failure probability:** a readable risk forecast based on load, stress,
  readiness, form consistency, wear, gym difficulty, and both alignments.
  This value communicates difficulty; it is not rolled to determine the rep.
- **Rep timing:** duration, target position, and perfect/good windows from the
  selected load definition.
- **Form consistency:** Buddy movement profile, readiness, trainer alignment,
  Buddy discipline alignment, volume preparedness, and load intensity.
- **Set stress:** effective load pressure, load intensity, fatigue, gym
  difficulty, and readiness.
- **Volume preparedness:** Buddy Volume normalized to the configured cap.
- **Trainer-to-machine alignment:** the trainer's fictional muscle attributes
  matched against the machine's configured focus.
- **Buddy discipline alignment:** primary or secondary Power, Technique,
  Endurance, Mobility, or Recovery discipline matched to machine focus.
- **Expected fatigue:** signed global fatigue change for a controlled set.
- **Expected HP:** signed fictional Buddy HP change for a controlled set.
- **Expected XP:** average machine reward adjusted by load, form consistency,
  and momentum.
- **Deload use:** the exact number of tokens the selected set will consume.

The preview also returns stable feedback codes. React translates those codes
into player-facing explanations, keeping mathematical results separate from
presentation text.

## Rep timing

`resolveWorkoutRep` accepts an immutable `WorkoutSession` and input timestamp.
It converts elapsed rep time to a normalized cursor position and grades the
absolute distance from the configured target:

- **Perfect:** inside the inner green timing zone.
- **Good:** inside the wider blue timing zone.
- **Rough:** just outside the good zone; the rep continues with lower
  consistency.
- **Failed:** substantially early, late, or allowed to time out; Spot Now
  begins.

Completed rep timing scores determine final session quality. A technically
consistent Steady set builds more momentum and can be more efficient than a
rough Max set. Max remains a high-XP option only when the player can control
its tighter timing and higher consequences.

## Spot Now

`advanceWorkoutSession` opens the rescue phase when a rep times out.
`resolveWorkoutSpot` accepts the session and Spot Now timestamp:

- an input within the configured 850 ms save period produces **rescued**;
- a later input or the end of the 1.2 s visible window produces **failure**.

No RNG is used. A rescue ends the unsafe set, awards partial XP, applies a
small HP and fatigue consequence, limits form loss, and reduces momentum.
A miss awards no XP and applies the full configured fictional HP, fatigue,
form, mobility, volume, and momentum consequences.

## Resolution

`calculateWorkoutResolution` accepts a resolved session plus current Buddy,
trainer, momentum, fatigue, and reward state. It returns new immutable values:

- outcome: success, rescued, or failure;
- updated Buddy and trainer;
- XP awarded and level-up state;
- HP change;
- Form, Mobility, and Volume changes;
- momentum change;
- fatigue change; and
- feedback codes.

The function does not import React or Phaser and does not mutate its inputs.
Session and save state contain data only; timestamps, arrays, IDs, booleans,
numbers, and plain objects remain serializable.

## Controls and accessibility

- **Keyboard:** Left/Right selects a load; Enter or Space starts, locks a rep,
  or spots according to context.
- **Touch:** four explicit load buttons plus large Start, Lock Rep, and Spot
  Now controls.
- **Gamepad:** D-pad Left/Right selects a load; A starts, locks, or spots.
- Timing and rescue states use text, meter position, color, and numeric time;
  no outcome relies on color alone.
- Focus remains on DOM controls with visible focus styling.
- Space is prevented from scrolling while the workout control has focus.
- Reduced-motion preferences remove pulsing and shake animations without
  changing timing rules or hiding state.
- The layout collapses from four to two columns on narrow screens, while
  primary touch targets remain at least 46–48 px tall.

## Deterministic validation

`client/src/tests/workoutMiniGame.test.ts` covers:

- seeded creation and perfect completion for Easy, Steady, Hard, and Max;
- the complete forecast field set;
- rising load risk;
- consistent Steady technique versus rough Max momentum and fatigue;
- a successful Spot Now at the rescue boundary;
- a late Spot Now miss;
- a rescue timeout; and
- relative HP, fatigue, form, and XP consequences.

`client/src/tests/visualProgression.test.ts` and
`visualProgressionIntegration.test.ts` additionally verify machine
specializations, technique-weighted development, rescued-set partial credit,
pump buildup and active-time decay, deep-recovery decay, immutable cosmetics,
all four visual intensity levels, fatigue presentation, snapshots, ratings,
and the complete workout-to-visual-history integration.

## Balance questions

- Does the 850 ms rescue period feel fair on lower-refresh mobile devices?
- Should players be able to opt out of automatic deload spending?
- Are the three timing grades readable at 240×160 logical presentation size?
- Does Max offer enough reward for mastery without becoming the default load?
- Should an accessibility option widen timing zones while preserving reward
  transparency?
