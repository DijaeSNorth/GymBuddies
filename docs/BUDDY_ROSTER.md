# Gym Buddy Roster

## Purpose

This document defines the first polished 16-species Gym Buddies roster:
12 standard species and four exotic species. Every Buddy is built around an
original training discipline rather than an elemental type.

The five disciplines are:

- **Power:** decisive force and pressure.
- **Technique:** alignment, timing, control, and efficient leverage.
- **Endurance:** stable output across long efforts.
- **Mobility:** repositioning, footwork, and recovery from drift.
- **Recovery:** resilience, safe resets, and fatigue-aware support.

Primary and secondary disciplines are player-facing team roles derived from
species content. They are not new persistent save stats. The current
arm-wrestling simulation still uses species Power plus each captured Buddy's
existing level, HP, Form, Mobility, and Volume. Passives and signature moves
are stable authored content and appear in the Index; applying unique
simulation effects is a later balancing phase.

Every species now also has a separate modular character-design record. It
defines a unique silhouette module, muscular build, visible specialization,
three body variations, palette channels, markings, species-scoped appendages,
training accessories, expressions, rare traits, victory poses, and entrances.
These fields are cosmetic-only and cannot change the simulation values listed
above. See `docs/CHARACTER_SYSTEM.md` for the complete contract.

## Roster at a glance

| Index | Stable ID | Name | Class | Disciplines | Gameplay role |
|---:|---|---|---|---|---|
| 001 | `brawny-bear` | Bramblift | Standard | Power / Recovery | Forgiving front-line anchor |
| 002 | `titan-tortoise` | Plastrong | Standard | Endurance / Technique | Late-round control stabilizer |
| 003 | `iron-wolf` | Rivetjack | Standard | Technique / Endurance | Efficient counter specialist |
| 004 | `muscled-boar` | Kettusk | Standard | Power / Endurance | Early momentum breaker |
| 005 | `ripped-rhino` | Railhorn | Standard | Power / Technique | Precision opening striker |
| 006 | `boulder-bison` | Cairnox | Standard | Endurance / Power | High-HP attrition wall |
| 007 | `buff-otter` | Rippleweld | Standard | Mobility / Recovery | Flexible reset support |
| 008 | `titan-gorilla` | Knuckledge | Standard | Technique / Power | Late-bloom leverage expert |
| 009 | `loopstride` | Loopstride | Standard | Mobility / Technique | Fast repositioner |
| 010 | `mendlume` | Mendlume | Standard | Recovery / Technique | Dedicated recovery support |
| 011 | `cadenswoop` | Cadenswoop | Standard | Endurance / Mobility | Mobile long-round specialist |
| 012 | `spotmole` | Spotmole | Standard | Recovery / Power | Durable safety specialist |
| 050 | `prismantle` | Prismantle | Exotic | Technique / Mobility | Elite geometric counter |
| 051 | `vaultwyrm` | Vaultwyrm | Exotic | Endurance / Recovery | Maximum-resilience anchor |
| 052 | `crownquill` | Crownquill | Exotic | Power / Technique | Technical exotic finisher |
| 053 | `manyfold` | Manyfold | Exotic | Recovery / Mobility | Adaptive exotic support |

## Base profiles

All base-profile values are integers. HP is validated from 20–80, Power from
1–50, Control and Stamina from 1–100, Form and Mobility from 1–24, and Volume
from 1–12. These ranges preserve the current gameplay scales. Capture
difficulty uses a 1–5 scale, where 5 is most difficult.

| Name | HP | Power | Control | Stamina | Form | Mobility | Volume | Growth | Capture |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|
| Bramblift | 48 | 26 | 48 | 58 | 13 | 8 | 9 | Early surge | 1 |
| Plastrong | 55 | 22 | 70 | 82 | 18 | 7 | 8 | Steady | 1 |
| Rivetjack | 42 | 24 | 84 | 68 | 19 | 15 | 5 | Steady | 2 |
| Kettusk | 50 | 23 | 44 | 70 | 11 | 8 | 9 | Early surge | 2 |
| Railhorn | 49 | 29 | 66 | 55 | 17 | 9 | 10 | Late bloom | 3 |
| Cairnox | 61 | 27 | 52 | 88 | 14 | 6 | 11 | Late bloom | 3 |
| Rippleweld | 40 | 21 | 67 | 61 | 17 | 22 | 4 | Steady | 2 |
| Knuckledge | 52 | 30 | 78 | 64 | 20 | 11 | 9 | Late bloom | 4 |
| Loopstride | 35 | 20 | 75 | 62 | 20 | 23 | 3 | Early surge | 2 |
| Mendlume | 46 | 19 | 74 | 72 | 18 | 14 | 4 | Steady | 2 |
| Cadenswoop | 43 | 23 | 64 | 90 | 16 | 20 | 5 | Late bloom | 3 |
| Spotmole | 57 | 25 | 57 | 77 | 15 | 6 | 10 | Early surge | 2 |
| Prismantle | 45 | 34 | 94 | 71 | 22 | 21 | 5 | Late bloom | 5 |
| Vaultwyrm | 68 | 38 | 73 | 96 | 17 | 13 | 11 | Late bloom | 5 |
| Crownquill | 56 | 40 | 81 | 69 | 19 | 12 | 12 | Late bloom | 5 |
| Manyfold | 53 | 36 | 86 | 80 | 23 | 20 | 7 | Steady | 5 |

## Standard species

### Bramblift

- **Visual and silhouette:** Compact woodland lifter with mossy wrist wraps,
  round ears, a square torso, and oversized forearms.
- **Personality and habitat:** Protective and jovial; found around Home Gym
  gardens and shaded Warm Up Path edges.
- **Growth:** Early HP, Power, and Volume; useful quickly before settling into
  steady gains.
- **Passive — Bramble Brace:** Favors stable resets after a hard opposing push.
- **Signature — Rooted Press:** Plants both feet, absorbs the opening pull, and
  drives through center.
- **Flavor:** Its moss-wraps tighten only when a training partner signals they
  are ready.

### Plastrong

- **Visual and silhouette:** Mat-patterned shell with interlocking grip plates,
  a broad oval body, tiny head, and four block feet.
- **Personality and habitat:** Patient and exacting; lives in Starter Gym A
  courtyards and quiet Warm Up Path lanes.
- **Growth:** Steady HP, Control, and Stamina with no weak level band.
- **Passive — Measured Shell:** Resists late-round drift during sustained
  control.
- **Signature — Eight-Count Lock:** Sets each joint in sequence before an
  unhurried finishing turn.
- **Flavor:** The rings on its shell record completed practice sets, never
  victories over others.

### Rivetjack

- **Visual and silhouette:** Lean jackal-shaped tactician with tall split ears,
  narrow waist, rivet spots, and a weighted straight tail.
- **Personality and habitat:** Observant and dryly playful; frequents Starter
  Link Road rails and Starter Gym B's cool practice floor.
- **Growth:** Steady Control, Form, and Mobility.
- **Passive — Rivet Read:** Learns an opponent's rhythm and favors clean
  counters.
- **Signature — Centerline Switch:** Changes grip angle without surrendering
  the center.
- **Flavor:** It taps one tail weight against the floor whenever a partner's
  form clicks into place.

### Kettusk

- **Visual and silhouette:** Low kettle-shaped body, asymmetric handle tusks,
  compact snout, and stamping feet.
- **Personality and habitat:** Blunt and eager; found in Iron Gate Trail scrub
  and Starter Gym B's reinforced lanes.
- **Growth:** Early Power, Stamina, and Volume followed by durability.
- **Passive — Set Bell:** Builds confidence through a repeated deliberate
  tempo.
- **Signature — Handle Drive:** Converts a compact stance into sudden close
  pressure.
- **Flavor:** One tusk curls up and one curls down, so every grip station fits
  it differently.

### Railhorn

- **Visual and silhouette:** Slate wedge runner with one rail-straight horn,
  sloped back, and parallel padded forearms.
- **Personality and habitat:** Focused and courteous; lives near Starter Gym A's
  loading yard and the first Iron Gate Trail rise.
- **Growth:** Late Power, Control, and Form with a high skill ceiling.
- **Passive — Square Start:** Performs best from a balanced prepared opening.
- **Signature — Rail Line:** Aligns wrist, elbow, and shoulder into one pressure
  path.
- **Flavor:** Its horn never points at a partner; before practice it turns
  sideways and bows.

### Cairnox

- **Visual and silhouette:** Ring horns, a stepped stone hump, and four short
  pillar legs.
- **Personality and habitat:** Calm and communal; paces tired travelers between
  Iron Gate Trail shelters and Iron Gym.
- **Growth:** Late HP, Stamina, and Volume that excel in long encounters.
- **Passive — Trail Pacer:** Maintains steady effort when a challenge runs long.
- **Signature — Cairn Hold:** Stacks small position gains until retreat routes
  close.
- **Flavor:** Travelers add painted pebbles to its hump; it returns each one at
  the next shelter.

### Rippleweld

- **Visual and silhouette:** Sleek river-lane body, small round head, webbed
  feet, and one long ribbon tail.
- **Personality and habitat:** Inventive and social; follows Recovery Circuit
  channels and Starter Link Road hydration stops.
- **Growth:** Immediate Mobility with steady Control and Form.
- **Passive — Soft Reset:** Finds a stable neutral position after movement
  breaks down.
- **Signature — Ribbon Regrip:** Flows around a stalled angle and returns with a
  safer hold.
- **Flavor:** It knots its tail once for water, twice for rest, and never skips
  either signal.

### Knuckledge

- **Visual and silhouette:** Long arms form a bridge around a narrow body, with
  chalk-white slab knuckles planted at each end.
- **Personality and habitat:** Quiet and studious; climbs Iron Gym gantries and
  Forge Stretch handrail cliffs.
- **Growth:** Late Power, Control, and Form after deliberate investment.
- **Passive — Leverage Lesson:** Converts careful form into pressure.
- **Signature — Bridge and Turn:** Builds an arm bridge before rotating from its
  strongest angle.
- **Flavor:** Its chalk prints resemble little maps, and young Buddies follow
  them as practice routes.

### Loopstride

- **Visual and silhouette:** Two enormous loop ears, a pinched torso, spring
  legs, and crescent feet.
- **Personality and habitat:** Curious and considerate; runs Starter Link Road
  intervals and Champion Ascent's open turns.
- **Growth:** Early Control, Form, and Mobility; long-term Stamina takes work.
- **Passive — Open Lane:** Excels when it has room to reset its feet.
- **Signature — Loop Step:** Circles through a compact pattern to redirect
  pressure.
- **Flavor:** Its ears hum at a balanced pace and go silent the moment a partner
  needs space.

### Mendlume

- **Visual and silhouette:** Low salamander-like caretaker with a teardrop
  lantern crest, padded fingers, and curled tail.
- **Personality and habitat:** Attentive and unhurried; rests in Home Gym
  recovery nooks and Forge Stretch's warm vents.
- **Growth:** Steady HP, Control, and Stamina support.
- **Passive — Cooldown Glow:** Signals a calmer pace when accumulated effort
  becomes too high.
- **Signature — Lantern Release:** Relaxes excess tension and resumes from clean
  alignment.
- **Flavor:** Its crest brightens near a safe resting place, even when the route
  signs are hidden.

### Cadenswoop

- **Visual and silhouette:** Wide striped wing cape, needle beak, counter-beat
  crest, and two very long metronome legs.
- **Personality and habitat:** Upbeat and dependable; rides Champion Ascent
  winds and Glory Gym banner rafters.
- **Growth:** Late Stamina, Form, and Mobility for extended challenges.
- **Passive — Even Cadence:** Holds a repeatable tempo under fatigue.
- **Signature — Switchback Sweep:** Redirects pressure through a long controlled
  arc.
- **Flavor:** Hikers match its wingbeat when the summit path feels longer than
  the map promised.

### Spotmole

- **Visual and silhouette:** Tiny eyes inside a safety-collar ruff, oversized
  shovel palms, and nearly hidden feet.
- **Personality and habitat:** Practical and encouraging; maintains Iron Gym
  underworks and marked Iron Gate Trail rest burrows.
- **Growth:** Early HP, Power, and Stamina; later training improves control.
- **Passive — Ready Spot:** Stabilizes a partner when an attempt leaves its safe
  line.
- **Signature — Burrow Brace:** Drops to a compact base and converts a failing
  angle into a reset.
- **Flavor:** It keeps lost gloves in dry burrows and returns them neatly
  paired.

## Exotic species

### Prismantle

- **Visual and silhouette:** Floating diamond mantle with enormous jointed fins,
  no visible legs, and a split ribbon tail.
- **Personality and habitat:** Formal and enigmatic; appears in rare Forge
  Stretch light pockets and Apex Gym's mirrored gallery.
- **Growth:** Late Control, Form, and Mobility with an elite technical ceiling.
- **Passive — Facet Memory:** Remembers successful alignment patterns.
- **Signature — Prism Fold:** Folds three movement lines into one exact turn.
- **Flavor:** Each fin reflects a different training stance, but none show the
  viewer's face.

### Vaultwyrm

- **Visual and silhouette:** A single hollow serpent loop with a crest head and
  clasping tail, shaped like a protective arch.
- **Personality and habitat:** Gentle and stubborn about complete rest; found at
  Champion Ascent rest arches and Glory Gym's upper vault.
- **Growth:** Late HP, Stamina, and Volume; the roster's highest durability.
- **Passive — Shelter Arc:** Favors stability after recovery is treated as part
  of the plan.
- **Signature — Vaulted Hold:** Builds a circular brace that grows harder to
  unwind.
- **Flavor:** Old route markers were built beneath its resting coils, never the
  other way around.

### Crownquill

- **Visual and silhouette:** Radial crown, wedge chest, two piston forelegs, and
  two pin feet.
- **Personality and habitat:** Ceremonial and competitive; challenges prepared
  travelers in Apex Gym and Champion Ascent rare-signal terraces.
- **Growth:** Late Power, Control, and Volume after a strong technical base.
- **Passive — Honor Set:** Commits fully when both competitors enter prepared.
- **Signature — Crown Drive:** Fans its quills for balance before one decisive
  drive.
- **Flavor:** A fallen crown-quill is placed beside the route for whoever next
  needs courage.

### Manyfold

- **Visual and silhouette:** Asymmetric folded hood, four staggered arms, two
  ribbon legs, and one open center fold.
- **Personality and habitat:** Kind and inscrutable; lives in Apex Gym recovery
  alcoves and soft-banner caverns below Glory Lift.
- **Growth:** Steady Control, Form, and Mobility with broad support value.
- **Passive — Spare Hand:** Finds one more stable contact point when a position
  unravels.
- **Signature — Four-Corner Reset:** Unfolds around the table and guides the
  exchange to center.
- **Flavor:** No two witnesses agree on its number of arms, but every account
  mentions a careful spot.

## Animation contract

Every species declares six stable animation references:

```text
buddy.<species-id>.idle
buddy.<species-id>.walk
buddy.<species-id>.battle
buddy.<species-id>.hurt
buddy.<species-id>.victory
buddy.<species-id>.signature
```

Final sprite strips should follow the existing asset pipeline:

- overworld frames use the `buddy-overworld` standard and bottom-center anchor;
- battle portraits use the `battle-portrait` standard;
- signature, hurt, and victory strips should retain the approved idle
  silhouette, palette, anchor, and scale;
- animation timing may change, but stable animation IDs must not;
- a species cannot ship as a recolor of another silhouette.

The current 8×8 procedural sprites are original in-game placeholders. Each has
a unique pixel mask and palette, so the Index and encounter UI remain readable
before final 16×16 strips and 48×48 battle portraits are approved.

## Index behavior

- **Hidden:** Index number and undiscovered state only.
- **Seen:** Name, sprite, class, disciplines, role, habitat, personality, and
  flavor become visible.
- **Caught:** Full base profile, passive, signature move, and growth profile
  become visible.
- **Party:** The active party remains capped at six. The Index is a collection
  record, not additional party storage.

## Compatibility and originality

The first eight standard species preserve their v12 stable IDs and recognizable
design seed while receiving original names and stronger silhouettes. The four
generic myth labels were retired:

| Legacy v12 ID | Canonical species |
|---|---|
| `slycera-griffin` | `prismantle` |
| `cinder-manticore` | `vaultwyrm` |
| `hydra-lurcher` | `crownquill` |
| `pygmy-sable-pegasus` | `manyfold` |

Load-time aliases resolve those IDs to the new species. Legacy Index number 054
also resolves to Knuckledge at 008. No retired display name, silhouette, or
generic myth concept remains in the live roster.

The roster deliberately avoids elemental typing, evolution analogues, capture
objects, borrowed character shapes, familiar franchise terminology, and
recolor variants. Animal inspiration is transformed through the original
training-world culture, physical motif, role, personality, and silhouette.

## Validation

Automated validation rejects:

- counts other than 12 standard and four exotic species;
- duplicate or unsafe species, growth, passive, move, or animation IDs;
- duplicate Index numbers, sprite masks, or palettes;
- missing required writing;
- unknown or repeated discipline assignments;
- signature moves outside the species' disciplines;
- out-of-range base profiles or capture difficulty;
- malformed 8×8 procedural sprites;
- malformed animation references;
- broken legacy aliases, starters, or boss references; and
- a party-limit change away from six.
