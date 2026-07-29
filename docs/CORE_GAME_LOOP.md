# Core Game Loop

## Purpose

This document organizes the existing save-v12 actions into a coherent player
loop. It does not add new mechanics.

## Primary loop

```text
Create trainer
  → prepare at a gym
  → choose a route or scout
  → encounter a Buddy or timed boss
  → compete in an arm-wrestling capture
  → add to or improve the team
  → recover and choose the next specialization
  → reach a more demanding gym
```

The loop is successful when every stage informs the next one. Training should
change readiness, travel should create tradeoffs, and encounter results should
create a new preparation decision.

## Opening flow

### Current v12 sequence

1. The game opens at trainer creation.
2. The player selects a preset or customizes:
   - trainer name;
   - hair, skin, top, glove, and shoe colors; and
   - shoulders, chest, arms, triceps, back, core, quads, and calves.
3. The player sees a live pixel preview and physique level.
4. The player chooses:
   - **Start Journey**, beginning at Home Gym; or
   - **Start Tutorial**, beginning at Home Gym with guidance toward Starter
     Gym A.
5. Existing save-v12 players may continue their journey.
6. Setup can be reopened, and the opening can be deliberately reset.

### Opening design goals

- Establish trainer ownership before showing the full dashboard.
- Explain that trainer development and Buddy development are connected.
- Give one safe action at Home Gym before asking the player to travel.
- Teach movement, scouting, workout risk, capture pressure, and boss timing in
  that order.

**Needs validation:** the tutorial currently advances through player-controlled
steps rather than verified action completion. Determine whether later
milestones should advance automatically without blocking free play.

## Moment-to-moment loops

### Exploration loop

1. Read the route direction, fatigue cost, and scouting information.
2. Move with keyboard or on-screen controls.
3. Accumulate route fatigue.
4. Reach a connected gym or trigger a route encounter.
5. Unlock adjacent destinations by visiting the current gym.

Current travel is constrained to connected tiles and includes a short stride
lock plus a scouting cooldown.

### Workout loop

1. Select an active Buddy.
2. Select a machine in the current gym.
3. Review readiness, machine load, and condition.
4. Start the timed set.
5. Hold through a clean rep or respond to a spot window.
6. Resolve XP, HP, trainer growth, Buddy growth, fatigue, momentum, possible
   deload use, and possible steroid reward.
7. Decide whether to train again, recover, change machines, or travel.

### Capture loop

1. Scout manually outside Home Gym, meet a route encounter, or receive a timed
   boss encounter.
2. Review opponent level, base catch chance, current trainer/Buddy pressure,
   and boss machine information when applicable.
3. Start the arm-wrestling match.
4. Choose among Shoulder Burst, Iron Grind, and Snapping Hook.
5. Shift the pressure meter over a limited number of rounds.
6. Meet the hold threshold and resolve the final capture chance.
7. Continue after a capture, failed pin, escape, or full-team result.

### Recovery loop

1. Notice low HP, high fatigue, weak readiness, or lost workout consistency.
2. Wait for passive recovery when appropriate or use the controlled Recover
   action.
3. Restore fatigue, Buddy HP, and readiness-related Buddy stats.
4. Potentially gain deload capacity from meaningful recovery.
5. Return to training or competition with a clearer preparation state.

## Six-gym journey

The current route order is:

```text
Home Gym
  → Starter Gym A
  → Starter Gym B
  → Iron Gym
  → Apex Gym
  → Glory Gym
```

Each visit unlocks adjacent travel rather than opening the entire world at
once. Gym-specific machines and encounter level bands create the progression
curve. Detailed values are recorded in
[Progression Design](./PROGRESSION_DESIGN.md).

## Failure states and recovery

Gym Buddies currently avoids a global “game over.” Failure occurs within a
specific activity:

| Failure state | Current result | Recovery path |
|---|---|---|
| Workout rep fails | HP/stat pressure, added fatigue, spot-needed result | Recover, use an easier machine, improve readiness, or try a better-timed spot |
| Spot window missed | Greater workout loss | Rest and rebuild condition |
| Buddy too worn down | Training action is blocked | Recover or choose lower-fatigue preparation |
| Capture meter too low | Opponent escapes or the pin fails | Scout again after preparation |
| Hold met but roll fails | Near-capture failure | Improve readiness, meter position, or boss alignment |
| Boss machine mismatch | Misses, near misses, fatigue, capture penalty | Return to the required machine and rebuild the streak |
| Boss overload | Non-required moves are restricted | Re-align with the required machine |
| Team full | Capture cannot join the party | **Needs validation:** future team-management solution |
| Route locked | Movement is blocked | Visit connected gyms in order |

Failures should always identify a cause and a next useful action. They should
cost time or condition, not erase the trainer or collection.

## Session structure

Current boss timers run independently on five-to-ten-minute intervals. That
creates a natural medium-session event, but it is not yet a formal session
contract.

**Needs validation:**

- expected time for one workout–encounter–recovery cycle;
- whether boss timers should pause while the page is inactive;
- whether a player should be able to intentionally schedule a boss challenge;
- whether short sessions need a guaranteed useful objective; and
- whether returning players need a concise “what changed while away” summary.

## Controls

| Action | Desktop current | Touch/click current | Gamepad |
|---|---|---|---|
| Move | WASD or arrow keys | On-screen D-pad and route controls | Needs validation; not implemented |
| Select gym/Buddy/machine | Pointer/click | Tap | Needs validation |
| Start workout/recover/scout | Pointer/click | Tap | Needs validation |
| Spot workout | Pointer/click | Tap during active window | Needs validation |
| Choose capture move | Pointer/click | Tap | Needs validation |
| Adjust trainer/settings | Keyboard and pointer inputs | Touch inputs | Needs validation |

Future input work should map devices to named actions rather than adding
device checks inside gameplay rules.

## Accessibility requirements

- Every timed interaction needs a readable state label in addition to motion.
- No route, stress, or capture state may rely on color alone.
- Touch targets need comfortable spacing and must not require hover.
- Keyboard focus order and focus visibility must cover every actionable
  control.
- Audio cues must have visual equivalents.
- Reduced-motion behavior is required before animation intensity expands.
- **Needs validation:** configurable spot-window duration, hold assistance, and
  a non-timed workout option.
