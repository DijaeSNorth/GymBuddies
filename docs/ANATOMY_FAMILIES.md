# Gym Buddies Anatomy Families

## Purpose

An anatomy family is an authoring template, not a species replacement. It
defines shared frame geometry, anchors, safe deformation budgets, and expected
body zones while each species retains its protected silhouette features.

The runtime definitions live in
`client/src/game/assets/anatomyFamilies.ts`. Every family uses a 24×24 canvas,
bottom-center pivot `(12, 21)`, and ground line `21`.

## Family catalog

| Family ID | Intended shapes | Primary authoring emphasis | Safe deformation |
| --- | --- | --- | --- |
| `broad-mammal` | Bears, bison, broad boars | Shoulder shelf, back width, forelimb density, haunches | ±2 px horizontal, ±1 px vertical |
| `lean-quadruped` | Wolves, otters, athletic runners | Narrow waist, shoulder line, back taper, running legs | ±2 px horizontal, ±2 px vertical |
| `armored-shelled` | Tortoises, rhinos, plated or quilled species | Armor or shell modules, core density, grounded limbs | ±2 px horizontal, ±1 px vertical |
| `compact-powerhouse` | Mole, loop runner, recovery lantern shapes | Dense limb blocks, compact torso, planted stance | ±2 px horizontal, ±1 px vertical |
| `winged-mythic` | Prismantle and other nonhuman winged forms | Wing or fin roots, central core, crest and tail modules | ±3 px horizontal, ±2 px vertical |
| `serpentine` | Coiled and wyrm-like forms | Coil segments, vaulted spine, clasp tail | ±2 px horizontal, ±2 px vertical |
| `multi-limbed` | Four-armed and offset-limb forms | Separate limb pairs, readable overlap, folded center | ±3 px horizontal, ±1 px vertical |
| `avian` | Winged birdlike athletes | Flight keel, wing span, leg and tail rhythm | ±3 px horizontal, ±2 px vertical |
| `heavy-biped` | Gorilla and other upright heavy forms | Shoulder line, torso block, forearms, leg support | ±2 px horizontal, ±2 px vertical |

## Required template data

Each family defines:

- canvas dimensions;
- pivot and ground line;
- head, body, back, and core zones;
- named limb anchors;
- accessory anchors;
- appendage anchors;
- effect anchors;
- safe horizontal and vertical deformation limits;
- authoring notes describing what may change without losing the silhouette.

## Protected species identity

Family membership never authorizes a generic anatomy swap. Each species keeps
the protected features declared by its character design. Examples:

- Bramblift keeps round ears, a square muzzle, and bear-paw stance.
- Rivetjack keeps its long muzzle, pointed ears, and rivet tail.
- Plastrong keeps a dome shell, low head, and four grounded limbs.
- Prismantle keeps its diamond center, offset prism fins, and angular mantle.
- Manyfold keeps four arms and an offset limb rhythm.

Physique presets may alter emphasis, definition, mass, posture, and stance, but
must not remove these features.

## Anchor ownership

Body anchors belong to the anatomy family. A species profile may refine an
anchor later, but it must not silently change the global pivot or ground line.

Accessory art should be authored around the family anchor:

- headwear uses `head`;
- chains and collars use `neck`;
- belts use `waist`;
- gloves and wraps use `hands`;
- knee sleeves use `knees`;
- pump and rare effects use their named effect anchors.

If a species cannot use a human-shaped slot safely, it must define a
species-specific module. For example, Prismantle equipment attaches to fin
roots or the diamond core rather than pretending it has human wrists.

## Deformation rules

Safe deformation budgets exist for small modular adjustments only. They are
not permission to stretch a complete raster.

Use one of these strategies, in order:

1. Full alternate authored frame for a silhouette-changing preset.
2. Authored replacement module for the affected region.
3. Small anchor-aware deformation within the family budget.
4. Shading-only change for definition where no silhouette change is expected.
5. Appendage or accessory replacement.

When a preset exceeds the family budget, create a new authored module or frame.

## Rigid armor and shell material rules

The `armored-shelled` family separates rigid material from flexible anatomy.
This is a rendering contract, not just an art note.

- Hard outer shells, chest plates, back plates, shoulder plates, and limb
  guards use rigid authored modules.
- Rigid modules may translate, rotate by an authored frame, separate at a
  joint, or be replaced by another authored plate structure. They must not be
  stretched as if they were soft tissue.
- Flexible joints and under-shell musculature occupy explicit gaps between
  plates. Physique emphasis and temporary pump may be shown there.
- Armor segmentation must preserve negative space at the neck, shoulders,
  elbows, hips, and knees.
- Pump may change exposed-area highlights, seam energy, stance, and animation
  intensity. It must not increase rigid armor scale.
- Fatigue uses a lowered head, closed stance, dimmed seams, slower movement,
  and reduced ground impact. It does not add cracks, dents, wounds, or other
  damage marks.
- Broad and specialized physique presets may change shell width, plate
  spacing, limb thickness, center of gravity, and exposed musculature
  independently. They must not uniformly scale the complete shell.

Batch 02 encodes these rules in
`client/src/game/assets/armoredHeavyModules.ts` and validates them in
`client/src/tests/armoredHeavyBatch.test.ts`.

## Validation

The automated suite checks:

- all nine family IDs exist;
- every canvas is 24×24;
- every pivot is `(12, 21)`;
- every ground line is y 21;
- safe deformation budgets remain bounded;
- every species manifest profile references a known family;
- pilot frames remain grounded and in bounds.
