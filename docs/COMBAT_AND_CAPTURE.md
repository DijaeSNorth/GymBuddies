# Combat and Capture

## Core identity

Gym Buddies uses a competitive arm-wrestling invitation called the Rally
Table. The player and an active Buddy build secure control over a short,
round-based match. A pin proves the team is ready to train together; it does
not harm or imprison the wild Buddy.

The game keeps capture calculations in pure TypeScript. React presents the
match, forecasts, result, and party decision without owning the rules.

## Match flow

1. The match opens at a neutral control-meter position.
2. The wild Buddy reveals a readable stance and move tell.
3. The player reviews three qualitative move forecasts.
4. Both sides commit a move and spend stamina.
5. Pressure, control, counters, preparation, and seeded variation shift the
   meter.
6. The match ends at a meter extreme or the round limit.
7. Sufficient secure control earns a pin and enables the invitation roll.

Wild encounters require 72% secure control before an invitation roll. Boss
targets remain dynamic because their required machine-and-move action,
challenge streak, signature rule, and gym tier are part of the boss system.

## Player moves

| Move | Decision role | Tradeoff | Counters |
|---|---|---|---|
| Shoulder Burst | Seize immediate pressure | Highest power, lowest control, 28 stamina | Iron Grind |
| Iron Grind | Build reliable control | Moderate pressure, strongest control, 17 stamina | Snapping Hook |
| Snapping Hook | Punish a committed surge | Variable reward and wider swing, 22 stamina | Shoulder Burst |

The relationship is circular: Shoulder Burst disrupts Iron Grind, Iron Grind
smothers Snapping Hook, and Snapping Hook redirects Shoulder Burst. Repeating
one move also creates an escalating adaptation penalty. Stamina, Buddy
discipline, trainer muscle alignment, and the visible tell can therefore
change the best decision from round to round.

## Readable forecasts

Each move forecasts one of four outlooks:

- Strong
- Favored
- Even
- Risky

The forecast explains up to three major reasons, such as answering the visible
tell, strong trainer alignment, a fitting Buddy discipline, opponent
adaptation, or dangerously low remaining stamina. It also shows the move's
stamina cost and projected remaining stamina.

Forecasts never reveal the hidden seeded roll or an exact final capture
percentage. They describe the known tactical state while preserving suspense.

## Opponent behavior

Wild Buddies receive a discipline-driven tendency:

- surge-oriented opponents favor immediate pressure;
- anchors favor controlled grinding;
- readers favor tactical hooks; and
- balanced opponents mix all three.

The selected move produces a concise visual tell. Tells may be clear or
guarded, but they always identify a posture the player can reason about.
Opponent weights also respond to meter position, low stamina, repeated player
moves, and their own recent repetition.

Opponent decisions and controlled variation use the versioned seeded random
state. Replaying the same state and decisions produces the same result in
tests.

## Resolution inputs

Round calculations consider:

- active Buddy level, species statistics, Form, Mobility, and Volume;
- the active Buddy's primary and secondary disciplines;
- trainer physique and move-specific muscle alignment;
- current fatigue and team readiness;
- wild Buddy level, statistics, disciplines, and capture difficulty;
- zone pressure and existing boss challenge rules;
- current meter position;
- both move histories and repetition;
- both stamina pools;
- the revealed opponent move and counter relationship; and
- bounded, move-specific seeded variation.

Inputs are treated as immutable values. The system returns the new meter,
stamina, histories, opponent intent, round summary, fatigue, boss challenge
state, and next random state.

## Outcome language

The presentation distinguishes every terminal result:

| Result | Meaning |
|---|---|
| Pin win | The player earned enough secure control to make an invitation attempt |
| Escape | The wild Buddy broke the grip at very low control |
| Failed pin | The match ended below the secure-control target |
| Near-capture | The pin was won, but the Buddy declined the final invitation roll |
| Successful capture | The invitation succeeded and an open party slot was available |
| Full-party capture | The invitation succeeded, but the six-Buddy party requires a decision |

A full-party capture is held as a pending decision. The player can replace any
displayed party member or release the new Buddy safely. Neither option relies
on array position as the captured Buddy's permanent identity, and replacement
does not mutate the existing team array.

## Presentation and controls

The encounter presents:

- round count and secure-control target;
- a labeled control meter and visible target marker;
- player and opponent stamina bars;
- opponent tendency, tell, and confidence;
- three move forecasts with explanations;
- concise per-round counter and stamina narration; and
- an explicit result panel and full-party choice when needed.

Move controls are:

- keyboard: `1`, `2`, and `3`, plus normal focus activation;
- touch: the three large move buttons; and
- gamepad: the first three face-button actions through the centralized input
  map.

Battle speed is a saved accessibility setting:

| Setting | Impact beat |
|---|---:|
| Swift | 160 ms |
| Standard | 280 ms |
| Deliberate | 440 ms |

The speed setting changes presentation timing only. It does not alter rules,
randomness, or outcomes. Reduced motion suppresses the impact animation while
retaining state changes and text feedback.

## Validation coverage

Seeded unit tests cover:

- the complete counter triangle;
- forecasts that omit exact rolls and final chances;
- trainer muscles, fatigue-sensitive starting stamina, repetition, and
  deterministic round variation;
- discipline-driven opponent tendencies and tells;
- escape and failed-pin outcomes without consuming a capture roll;
- near-capture and successful-capture rolls;
- open and full party placement;
- immutable replacement decisions; and
- concise battle-speed definitions.

## Decisions still requiring playtest validation

- Whether the 72% wild target feels legible across early and late encounters.
- Whether the stamina costs create enough viable low-stamina recovery lines.
- Whether guarded tells occur at the right frequency for new players.
- Whether near-captures should offer a limited immediate rematch.
- Whether boss targets need an additional compact explanation on small phones.
