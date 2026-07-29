# Machine-Based Boss Challenges

## Purpose

Gym bosses are structured Rally Table trials, not wild encounters with larger
numbers. Every boss asks the player to combine:

- the announced gym machine;
- a specific capture move;
- a short required-action streak;
- stamina and fatigue management; and
- the boss's readable signature rule.

The challenge simulation remains in pure TypeScript. React presents
availability, warnings, stress, arena identity, rewards, and party decisions.
Phaser does not own boss timers or challenge state.

## Roster

Each of the six gyms has exactly two named boss variants.

| Gym | Bosses | Mechanical distinction |
|---|---|---|
| Home Gym | Bramblift Mat Watchman; Rippleweld Desk Warden | Anchored opening; repeated-move read |
| Starter Gym A | Railhorn Bench Marshal; Cairnox Redline | Low-stamina surge; machine-mismatch tax |
| Starter Gym B | Rivetjack Counter; Kettusk Prime | Late target feint; complete-action bonus |
| Iron Gym | Prismantle Sentinel; Manyfold Relay | Final-round pressure; complete-miss escalation |
| Apex Gym | Vaultwyrm Arch; Crownquill Brace | Low boss-stamina surge; near-miss fatigue tax |
| Glory Gym | Manyfold Summit; Prismantle Zenith | High-stress phase; overload escalation |

Every variant defines a stable boss ID, personality, visual identity, preferred
tactic, counterplay, signature rule, arena effect, and reward-table ID.
Development content validation requires six rosters, two variants per roster,
twelve distinct signature triggers, valid Buddy references, valid move
references, complete readable text, unique IDs, and bounded reward values.

## Challenge tiers

| Tier | Rounds | Required streak | Misses to overload |
|---|---:|---:|---:|
| Low | 4 | 2 | 4 |
| Normal | 5 | 3 | 4 |
| High | 6 | 4 | 5 |

The required machine is selected with seeded randomness from the current gym's
four machines. The required move comes from the selected boss's signature
rule. A complete challenge action must use both at once.

- Complete action: advances the streak, reduces accumulated pressure, and
  receives the strongest alignment bonus.
- Near miss: uses the correct machine or correct move, but not both. It adds a
  near-miss point without adding a complete miss.
- Miss: uses neither requirement. It breaks the streak and adds a miss.
- Overload: reaches the tier's miss limit. A machine mismatch locks capture
  actions until the player returns to the announced station; further bad
  choices add fatigue and pressure.

## Dynamic targets and signature rules

Boss capture targets remain bounded between 64% and 92%. The live target
combines gym tier, current machine alignment, active Buddy consistency, misses,
near misses, completed streak, and the boss's signature target shift.

Each signature trigger has a visible warning and a deterministic effect. The
current triggers cover opening pressure, repeated moves, low team stamina,
machine mismatch, nearing the target, completing the required action, the
final round, complete misses, low opponent stamina, near misses, high stress,
and overload.

The boss's preferred tactic also biases its seeded move selection. Normal
discipline tendencies, stamina, recent move history, and anti-repetition
behavior still apply, so preferred does not mean guaranteed.

## Availability and scheduling

Boss challenges are voluntary. When a gym is ready, its availability card
stays ready until the player chooses **Answer Boss Challenge**. A ready boss
does not block route scouting, training, travel, or recovery.

The Home Gym begins ready. Repeat challenges use a seeded five-to-ten-minute
cooldown measured in active gameplay time. The clock advances only while:

- the game document is visible; and
- trainer setup is complete.

System time is not used for new schedules. Closing the game, changing the
computer clock, or leaving the game hidden cannot advance cooldowns.

Legacy wall-clock saves receive a fixed one-minute active-play grace period.
The magnitude of the old timestamp is ignored. Current saves store:

- total boss gameplay milliseconds;
- ready-at gameplay milliseconds per gym;
- claimed challenge cycle;
- last rewarded cycle;
- defeat count; and
- last boss ID.

Starting a challenge claims one cycle and immediately starts the next
gameplay-time cooldown. Reward settlement accepts a cycle only once, preventing
duplicate rewards from repeated result handling.

## Rewards

Boss capture success grants the captured Buddy through the normal party flow
and resolves the boss's reward table:

- active Buddy XP;
- fatigue recovery;
- workout momentum;
- guaranteed Deload tokens where configured; and
- one seeded chance for a bonus Deload token.

All values respect existing fatigue, momentum, and token caps. Rewards apply
even when the captured Buddy requires a full-party replacement decision,
because the boss victory itself is already complete.

## Presentation and accessibility

The current gym card shows:

- ready now or remaining active-play time;
- both possible named challengers;
- whether the challenge can be answered; and
- a clear statement that normal play advances the cooldown.

The encounter dossier shows personality, visual identity, preferred tactic,
counterplay, signature warning, required machine-plus-move action, tier,
streak, misses, near misses, stress, target, arena effect, and reward preview.

Boss-specific arena effects use only borders and low-contrast background
gradients. They do not cover sprites, meters, tells, text, or move controls.
The stress bar uses a semantic meter label in addition to color. Existing
keyboard, touch, gamepad, reduced-motion, and battle-speed behavior remains
active.

## Playtest decisions still open

- Whether five-to-ten active minutes is the correct repeat cadence for every
  gym after the first clear.
- Whether high-tier near-miss fatigue is too punishing for low-Volume teams.
- Whether the Home Gym should continue starting ready after the guided
  tutorial is expanded.
- Whether later bosses need an optional rematch queue once multiple gyms are
  simultaneously ready.
