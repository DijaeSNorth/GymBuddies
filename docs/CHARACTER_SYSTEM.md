# Gym Buddies Character System

## Design goal

Every major character reads as powerful, athletic, and fitness-focused at the
game's handheld-scale resolution. Strength is communicated through proportion,
posture, definition, equipment, movement, and personality—not through a single
"bigger is better" scale. No body archetype is presented as objectively
superior.

Cosmetics never determine combat statistics. A visual arm, torso, or leg size
does not change Power, level, HP, Form, Mobility, Volume, fatigue, equipment
bonuses, or discipline strengths.

## Shared muscular archetypes

The character catalog defines ten stable, data-driven archetypes:

| Stable ID | Visual read |
| --- | --- |
| `classic-bodybuilder` | Tapered waist, round shoulders, balanced limbs |
| `heavy-powerlifter` | Thick torso, grounded hips, dense upper back |
| `strongman` | Wide trunk, large hands, carry-ready shoulders |
| `balanced-athlete` | Even proportions and an adaptable stance |
| `lean-fighter` | Long limbs, narrow waist, coiled guard |
| `compact-powerhouse` | Short frame, broad chest, strong forearms |
| `lower-body-specialist` | Powerful hips and legs with an athletic upper body |
| `upper-body-specialist` | Broad shoulders and arms with a stable base |
| `mobility-specialist` | Lean muscular frame with long movement lines |
| `heavyweight-anchor` | High body mass, broad waist, calm planted posture |

Each archetype points to a modular trainer physique preset. Character recipes
then add height variation, skin tone, face, hair, outfit, accessories, training
discipline, idle pose, and expression through stable option IDs.

## Gym Buddies

Every one of the 16 species has exactly one character-design record containing:

- a unique silhouette-module ID;
- a named muscular build and visible training specialization;
- compact, balanced, and broad body variations;
- three independently selectable palette channels;
- markings and patterns;
- smooth, defined, and etched muscle-definition treatments;
- two species-scoped appendage variations;
- gloves, wraps, belts, ceremonial chains, and headbands;
- expression, victory-pose, and entrance-animation options; and
- rare glow-line, metallic-tip, or summit-star traits.

Species identity is protected in two ways. The base silhouette comes from the
species' own authored sprite module, and appendage options are scoped to that
species. A player cannot assign another species' horns, ears, tail, wings,
crest, or body module. Palette and accessories may vary without replacing
those anchors.

Player-owned Buddy profiles store:

```text
nickname
primaryPaletteId
secondaryPaletteId
accentPaletteId
patternId
muscleDefinitionId
bodySizeId
appendageVariantId
accessoryIds
rareTraitId
expressionId
victoryPoseId
entranceAnimationId
```

The active-Buddy panel exposes these options with an animated four-direction
preview and deterministic valid randomization. Standard form controls retain
keyboard operation, touch targets remain phone-sized, and the application
input focus layer continues to provide gamepad navigation. Changing the profile
does not reset or rewrite progression.

## Layered Buddy renderer

The procedural Buddy canvas uses a 24×24 logical frame and these ordered layers:

1. shadow;
2. species body;
3. specialization muscles;
4. markings;
5. species appendage;
6. training accessory;
7. expression;
8. pose and rare-trait effects.

Frames support front, back, left, and right plus idle, walking, running,
training, victory, fatigue, capture, and entrance poses. Canvas smoothing is
disabled and CSS uses nearest-neighbor pixel scaling. Rectangles are clipped to
the logical frame, and generated combinations use a bounded 512-frame cache.

## NPC trainers and rivals

Generic route trainers are generated from stable templates and a saved content
seed. Templates constrain valid muscular archetypes, skin tones, faces, hair,
outfits, accessories, disciplines, poses, and expressions. The same seed always
produces the same trainer; this keeps maps and regression tests deterministic.

The current route roster uses five distinct seeded trainers:

- Stride Scout Rin;
- Form Marshal Kio;
- Trail Keeper Bo;
- Forge Reader Sela; and
- Summit Scout Ivo.

Important rivals are handcrafted rather than randomized:

- Joa Brace, a grounded powerlifting rival;
- Suri Tempo, a lean technical counter rival; and
- Ren Lantern, a compact recovery rival.

Each has a unique palette, training philosophy, signature clothing, equipment,
battle stance, entrance ID, and victory ID.

## Gym leaders and bosses

All six gym leaders are handcrafted and use different muscular archetypes,
postures, palettes, equipment, and movement language. Coach Mara communicates
recovery through stillness and wraps; Dex uses a compact square brace; Nia uses
symmetry and centerline control; Sol uses carry equipment and a forward
strongman stance; Vale uses offset mobility lines; and Ori uses balanced
five-discipline gestures.

All 12 boss variants have a separate design record in addition to their combat
definition. Each record declares:

- build label and training philosophy;
- signature pose, clothing, and equipment;
- primary, secondary, and accent palette IDs;
- pattern, body-size, and definition treatment;
- species-valid appendage and accessories;
- rare trait and expression;
- recognizable battle stance; and
- entrance and victory animation IDs.

Boss strength is not represented by size alone. Several high-tier bosses are
compact or standard-sized and communicate threat through etched definition,
asymmetry, posture, rare markings, specialized gear, or tightly controlled
animation.

## Automatic validation

Development and production builds validate:

- unique stable IDs for archetypes, palettes, templates, characters, and boss
  designs;
- exactly one visual design per Buddy species and per boss variant;
- unique species silhouette-module IDs;
- valid palette, body, marking, appendage, accessory, expression, pose, and
  animation references;
- six handcrafted gym leaders and at least three handcrafted rivals;
- valid generated NPC trainer appearances;
- valid character IDs for every overworld NPC;
- species-safe boss cosmetic combinations; and
- complete boss philosophy, equipment, stance, entrance, and victory fields.

Save loading separately normalizes missing or removed cosmetic IDs to safe
species defaults. Valid older saves are never silently erased.

## Development gallery and regression coverage

In development, open `?debug=characters` (or `?debug=assets`) to inspect:

- all ten body archetypes in four directions;
- every trainer pose;
- every trainer top and representative bottom pairing;
- all gym leaders, rivals, and seeded route trainers;
- compact, balanced, and broad versions of every Buddy species; and
- all 12 signature boss designs.

`characterVisualRegression.test.ts` checks every Buddy species, direction, and
pose for visible in-bounds output; sweeps all body/definition/pattern/appendage
combinations; protects four representative frames with deterministic signature
hashes; proves species-default silhouettes remain distinct; verifies seeded
NPC generation; and confirms the render cache stays bounded.

## Adding content

To add a Buddy species:

1. author the species and unique base silhouette;
2. add one `BuddyCharacterDesign` with a unique silhouette-module ID;
3. keep appendage IDs species-scoped;
4. define safe default cosmetic IDs;
5. review all directions at 1× and 2× in the character gallery; and
6. run content validation, visual regression tests, typecheck, and the
   production build.

To add a trainer, leader, or rival, choose an existing archetype or add a
validated new one, then author a stable character recipe. Important characters
must remain handcrafted. New generic route trainers should use a template and a
fixed content seed.
