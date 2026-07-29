# Progression Design

> Implementation status: the canonical numeric curves, expected gym levels,
> catch-up rules, machine mastery, anti-overlevel behavior, endgame model, and
> deterministic journey results now live in
> [PROGRESSION_BALANCE.md](PROGRESSION_BALANCE.md). Earlier “needs validation”
> notes below remain useful historical design context only where that report
> does not explicitly resolve them.

## Progression promise

Progression in Gym Buddies is the accumulation of better decisions, a broader
collection, stronger trainer/Buddy preparation, and access to more demanding
gyms. It should not collapse into one universal power number.

## Current progression layers

### Trainer

The trainer has eight current muscle values:

- Shoulders
- Chest
- Arms
- Triceps
- Back
- Core
- Quads
- Calves

Machine focus maps these values into workout advantages. Their aggregate also
contributes to physique level and arena readiness.

### Buddy

Each Buddy currently has:

- species and nickname;
- level and XP;
- HP and maximum HP;
- Form;
- Mobility; and
- Volume.

Leveling increases maximum HP. Workouts, recovery, and steroids can change the
three preparation stats.

### Team

- Current party limit: six.
- Seen and caught species are recorded in the Gym Buddy Index.
- The player selects one active Buddy for workouts and captures.
- **Needs validation:** storage, rotation, release, reserve-team, or roster
  management when the party is full.

### World

- The journey begins at Home Gym.
- Visiting a gym unlocks adjacent destinations.
- Routes add fatigue and can produce encounters.
- Higher gyms increase opponent levels, machine demands, boss pressure, and
  rare encounter opportunity.

### Boss progression

Boss schedules record timing and defeated counts. Bosses test machine
alignment, preparation, streak discipline, and capture execution.

**Needs validation:** how defeated counts become visible long-term progress,
whether each gym has a completion milestone, and whether repeat victories
produce rewards beyond captures.

## Six-gym journey

| Order | Gym | Current band | Current role |
|---:|---|---:|---|
| 1 | Home Gym | Level 1 | Safe onboarding, recovery, light training |
| 2 | Starter Gym A | Levels 1–15 | First scouting and low-risk captures |
| 3 | Starter Gym B | Levels 16–25 | Mid-game control and endurance pressure |
| 4 | Iron Gym | Levels 26–35 | First higher-tier gauntlet |
| 5 | Apex Gym | Levels 36–45 | Late-band precision and mythic pressure |
| 6 | Glory Gym | Levels 36–55 | Highest current challenge and rare encounters |

The overlapping late-game bands are current behavior. **Needs validation:**
whether Glory Gym should begin above Apex Gym, deliberately overlap for roster
variety, or scale dynamically.

## Route progression

| Route | Connection | Current fatigue | Current encounter boost |
|---|---|---:|---:|
| Warm Up Path | Home → Starter A | 0.3 | 0% |
| Starter Link Road | Starter A → Starter B | 0.65 | 2% |
| Iron Gate Trail | Starter B → Iron | 1.0 | 4% |
| Forge Stretch | Iron → Apex | 1.2 | 5% |
| Champion Ascent | Apex → Glory | 1.6 | 7% |

Route numbers are configuration facts from v12, not permanent design targets.
Balance changes require simulation and playtest evidence.

## Five-discipline team model

The player fantasy calls for balanced development through:

- **Power:** force production and decisive pressure.
- **Technique:** control, timing, precision, and efficient movement.
- **Endurance:** sustained work and late-round stability.
- **Mobility:** positioning, recovery from drift, and movement consistency.
- **Recovery:** resilience, HP restoration, fatigue management, and safe
  repeat training.

Current v12 does not store these five as a complete explicit stat block. It
stores trainer muscles, Buddy Form/Mobility/Volume, machine focus strings, HP,
fatigue, readiness, and derived pressure.

**Needs validation:** choose one of these approaches before implementation:

1. disciplines as descriptive Buddy roles derived from existing stats;
2. disciplines as machine and encounter tags;
3. disciplines as player-facing summaries with no new balance layer; or
4. disciplines as new persistent stats with a save migration.

The default design preference is to test derived roles first. Adding five new
persistent values would create the greatest balance and save risk.

## Progress pacing

### Early game

- Learn trainer–machine relationships.
- Complete a safe Home Gym workout.
- Reach Starter Gym A.
- Capture a third Buddy or meaningfully improve a starter.
- Understand fatigue before it becomes severe.

### Mid game

- Compare machines rather than always selecting the highest XP option.
- Rotate active Buddies based on condition.
- Use deliberate recovery and deload capacity.
- Recognize boss machine alignment and streak requirements.

### Late game

- Prepare specialized Buddies for higher-tier machines.
- Manage route and combat fatigue across a longer trip.
- Challenge Apex and Glory bosses with a balanced roster.
- Pursue unseen, uncaught, exotic, or better-fit Buddies.

## Failure and anti-grind policy

- Failed workouts should teach load and readiness.
- Failed captures should expose meter, alignment, or condition causes.
- Passive recovery and Home Gym must provide a low-risk comeback.
- Repeating the easiest action forever should not be the optimal route to all
  late-game goals.
- No failure should delete a captured Buddy or trainer.
- **Needs validation:** soft caps, diminishing returns, encounter protection,
  and boss pity rules.

## Endgame

The current prototype reaches its hardest available content at Glory Gym but
does not define a formal ending.

Potential endgame goals, all **needs validation**:

- defeat and capture a boss from every gym;
- complete the current Gym Buddy Index;
- build a six-Buddy team covering all five disciplines;
- achieve preparation goals without excessive fatigue;
- replay gyms under optional challenge conditions; and
- optimize different trainers or teams in separate save slots.

No endgame reward should be promised until the corresponding tracking,
storage, and balance behavior is designed.

## Replayability

Replayability should come from:

- different trainer profiles;
- different active Buddy and machine pairings;
- route encounters and boss schedules;
- exotic collection;
- team composition;
- workout risk and recovery choices; and
- optional late-game goals.

**Needs validation:** multiple save slots, seeded challenge runs, difficulty
options, daily events, and new-game-plus behavior.
