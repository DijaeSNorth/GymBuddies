# Phaser Overworld Implementation

## Scope

The Phaser overworld now covers the complete Gym Buddies journey:

1. Home Gym.
2. Route 1 / Warm Up Path.
3. Starter Gym A.
4. Route 2 / Starter Link Road.
5. Starter Gym B.
6. Route 3 / Iron Gate Trail.
7. Iron Gym.
8. Route 4 / Forge Stretch.
9. Apex Gym.
10. Route 5 / Champion Ascent.
11. Glory Gym.

Phaser renders and animates these locations. React owns the live overworld state and applies gameplay side effects. Pure TypeScript modules own collision, movement, access requirements, transitions, encounter checks, route progression, and validation.

## State boundary

`OverworldState` remains serializable and contains the current location, tile position, facing, movement and encounter cooldown times, and animation sequence numbers. `SaveData.visitedZoneIds` records gym visits. Existing boss-schedule defeat counts record completed boss challenges.

Phaser receives a read-only presentation snapshot. It does not unlock routes, apply fatigue, roll encounters, recover a Buddy, select machines, or mutate saves.

```text
Keyboard / touch / gamepad
  -> centralized InputAction
  -> React action handler
  -> pure overworld resolver + progression snapshot
  -> next state + domain events
  -> React side effects and Phaser presentation snapshot
```

## Declarative world graph

World connections live in:

`client/src/game/content/worldGraph.ts`

Each connection declares stable IDs, endpoints, optional route map, route name, fatigue, encounter boost, difficulty rank, reward quality, travel preview, and access requirement.

The five main routes open in order when their departure gyms are visited:

| Rank | Route | Connection | Fatigue | Encounter boost | Reward quality |
|---:|---|---|---:|---:|---|
| 1 | Warm Up Path | Home -> Starter A | 0.30 | 0% | Foundation |
| 2 | Starter Link Road | Starter A -> Starter B | 0.65 | 2% | Improved |
| 3 | Iron Gate Trail | Starter B -> Iron | 1.00 | 4% | Strong |
| 4 | Forge Stretch | Iron -> Apex | 1.20 | 5% | Elite |
| 5 | Champion Ascent | Apex -> Glory | 1.60 | 7% | Champion |

Each route’s fatigue is split equally between entering the route and reaching the destination gym. Return travel is symmetric.

Two optional direct connections unlock after boss completion:

- Recovery Circuit links Home Gym and Starter Gym B after a Starter Gym B boss victory.
- Glory Lift links Iron Gym and Glory Gym after an Apex Gym boss victory.

Locked doors render with a lock plate. Attempting to use one returns its authored requirement through the normal dialogue surface.

## Data-driven maps

Map configuration lives in:

`client/src/game/content/maps/journeyMaps.ts`

All eleven maps declare tile dimensions, an original palette, floor style, default spawn, collision rectangles, interactables, graph-backed transitions, encounter regions, environmental props, and lighting areas.

Development validation detects:

- Duplicate map, object, prop, light, transition, and encounter IDs.
- Invalid spawns and out-of-bounds content.
- Unknown machines, destinations, transitions, and graph connections.
- Blocked step exits.
- Missing connection directions.
- Missing rare encounter areas.
- Non-increasing main-route fatigue, difficulty, or encounter quality.
- Any progressively unlocked location that cannot be reached from Home Gym.

## Location identity

The maps use original procedural shapes and limited palettes:

- Home Gym: calm green recovery light, planters, hydration, and foundation chalk marks.
- Starter Gym A: coral pressure platform and first-attempt banners.
- Starter Gym B: cool-blue control lighting, pacing fans, and tension records.
- Iron Gym: rust tones, retired chains, scarred plates, and a gate emblem.
- Apex Gym: violet focus lighting, footwork arcs, and directional fans.
- Glory Gym: gold summit light, five-discipline banners, and balanced-team trophies.
- Warm Up Path: green sunrise track and volunteer-maintained planters.
- Starter Link Road: blue interval flags and technique records.
- Iron Gate Trail: sunset metal markers, chain posts, and a recovery shelter.
- Forge Stretch: violet dusk, steam vents, and warm forge light.
- Champion Ascent: gold banners, altitude fans, summit turf, and a recovery camp.

Route signs provide fatigue, difficulty, reward quality, and an environmental preview. Scouts reinforce encounter and recovery guidance without turning the journey into a set of menu buttons.

## Encounters and recovery

Every route contains two standard pulse-turf areas and one visually distinct rare-signal area. Encounter checks occur only after successful movement into those rectangles and retain the seeded route calculation plus the 1,800 ms cooldown.

Each route uses the destination gym’s encounter band, so levels rise with the journey. Authored encounter boosts and reward-quality tiers also rise by route. Rare areas add an additional encounter boost and surface their quality in dialogue.

Safe recovery interactions are available at:

- Home Gym’s Recovery Nook.
- Iron Gate Trail’s shelter.
- Champion Ascent’s summit camp.
- Glory Gym’s Champion Reset Bench.

These interactions call the existing recovery system and respect its battle, workout, readiness, and cooldown rules.

## Movement and presentation

- 8-pixel tiles at a 240x160 logical playfield.
- 105 ms movement cadence and half-duration blocked cadence.
- 92 ms derived walk tween.
- WASD, arrow keys, touch D-pad, gamepad D-pad, and left analog stick.
- 0.14 camera interpolation with a restrained dead zone.
- Palette-driven floors, walls, encounter areas, props, and light overlays.
- Development F2 overlay for collisions, interactions, transitions, encounters, facing target, and grid coordinates.

## Tests

`overworldMovement.test.ts` covers content validation, collision, movement cooldowns, interactions, fatigue symmetry, designated encounters, rare/recovery content, and centralized inputs.

`worldJourney.test.ts`:

- Validates progressive reachability.
- Walks the exact eleven-location critical path.
- Verifies every route’s total configured fatigue.
- Verifies visit-gated mainline access.
- Verifies boss-gated shortcuts.
- Verifies rising difficulty, fatigue, encounter boost, reward quality, and rare areas.

## Remaining work

- Room-level tile position is still session state rather than save state.
- Procedural props should eventually be replaced through the stable asset manifest with original final sprite sheets.
- Touchscreen and physical-gamepad traversal need device playtesting across the full critical path.
- Route balance and rare encounter rates need a complete 30-45 minute progression playtest before tuning.
