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

The character catalog defines sixteen stable, data-driven archetypes:

| Stable ID | Visual read |
| --- | --- |
| `classic-bodybuilder` | Tapered waist, round shoulders, balanced limbs |
| `open-bodybuilder` | Maximum rounded mass with separated arms, torso, and legs |
| `taper-performer` | Capped shoulders and broad back over a narrow waist |
| `sculpted-physique` | Dense, balanced development with crisp separation |
| `figure-balance` | Round delts, back taper, poised stance, and developed legs |
| `heavy-powerlifter` | Thick torso, grounded hips, dense upper back |
| `platform-lifter` | Explosive traps, hips, and legs with an upright receiving stance |
| `strongman` | Wide trunk, large hands, carry-ready shoulders |
| `balanced-athlete` | Even proportions and an adaptable stance |
| `lean-fighter` | Long limbs, narrow waist, coiled guard |
| `lean-athlete` | Long movement lines with visible muscular separation |
| `compact-powerhouse` | Short frame, broad chest, strong forearms |
| `lower-body-specialist` | Powerful hips and legs with an athletic upper body |
| `upper-body-specialist` | Broad shoulders and arms with a stable base |
| `mobility-specialist` | Lean muscular frame with long movement lines |
| `heavyweight-anchor` | High body mass, broad waist, calm planted posture |

Each archetype points to a modular trainer physique preset. Character recipes
then add height variation, skin tone, face, hair, outfit, accessories, training
discipline, idle pose, and expression through stable option IDs.

## Trainer proportion and posing system

The 28×36 trainer renderer converts 61 independent fictional visual controls
into discrete pixel geometry. The original 22 whole-body controls remain
stable, and 39 regional controls add clavicle, delt, chest, lat, back, arm,
core, hip, thigh, calf, ankle, fullness, separation, vascularity, pump,
posture, stance, and symmetry presentation. Low, middle, and high bands alter
contours and proportions where the handheld frame permits rather than relying
only on color. Front, back, and side views select the appropriate region, so a
back pose shows lat, lower-back, glute, hamstring, and calf emphasis while side
poses separate chest and triceps depth.

Trainer Forge has two views over the same appearance object:

- **Quick Forge** offers all 26 editable starting presets plus the essential
  silhouette controls.
- **Detail Forge** exposes separate Build, Upper Body, Core, and Lower Body
  groups alongside Face, Hair, Outfit, Colors, Accessories, Poses, and Saved
  Looks.

Switching modes never replaces or drops values. Preview tools provide
front/back comparison, mirrored symmetry, silhouette-only inspection,
muscle-region highlights, athletic posing-outfit comparison, three lighting
setups, creator and in-game sizes, pose cycling, and an opt-in slow rotation
that is unavailable when reduced motion is enabled.

Players may keep up to 12 named cosmetic looks. Looks can be duplicated,
renamed, compared, applied, deleted, exported, and imported independently of
progression. Appearance import is size-limited, schema-checked, normalized
against stable content IDs, and repaired to safe defaults if an option is
retired.

The pose catalog has stable IDs and metadata for:

- front relaxed and back relaxed;
- front and back double biceps;
- side chest and side triceps;
- most muscular and abs-and-thigh;
- victory flex, warmup, post-set pump, and fatigued stance;
- confident walk and boss entrance; and
- the existing movement, workout, capture, victory, and fatigue actions.

Workout presentation selects warmup, active-rep, rescue, success, and failure
poses without moving workout calculations into React or the renderer.

Clothing is generated from the same torso, arm, hip, thigh, calf, and waist
anchors as the body. Racerback and stringer tanks retain visible shoulders and
back width, oversized pump covers expand with the shoulder and arm anchors,
compression tops follow the taper, competition outfits remain non-explicit,
bottoms follow glutes and thighs, and belts, wraps, sleeves, chalk, towels, and
bags reuse the current body anchors. Lifting shoes, high tops, and flat shoes
have distinct soles. Primary, secondary, accent, trim, fictional logo, and
accessory colors all use curated stable IDs.

## Gym Buddies

Every one of the 16 species has exactly one character-design record containing:

- a unique silhouette-module ID;
- a named muscular build and visible training specialization;
- Compact, Balanced, Broad, Specialized, and species-signature physique
  presets, all editable afterward;
- species-aware shoulder, front-body, back, working-limb, center-body, and
  driving-limb emphasis controls with anatomy-specific labels;
- three independently selectable palette channels;
- markings and patterns;
- smooth, defined, and etched muscle-definition treatments;
- two species-scoped appendage variations;
- slotted gloves, wraps, joint bands, stance sleeves, belts, ceremonial
  chains, headbands, and victory accessories;
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
physiquePresetId
physique shoulder/chest/back/arm/core/leg emphasis
physique mass/symmetry/stance/posture/pump presentation
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
training, front flex, back flex, side pose, victory, fatigue, capture, boss
entrance, and rare-encounter entrance poses. Canvas smoothing is
disabled and CSS uses nearest-neighbor pixel scaling. Rectangles are clipped to
the logical frame, and generated combinations use a bounded 512-frame cache.

## NPC trainers and rivals

Generic route trainers are generated from stable templates and a saved content
seed. Templates constrain valid muscular archetypes, skin tones, faces, hair,
facial hair, brows, region-approved outfit combinations, accessories,
specialties, disciplines, pose preferences, and expressions. The same seed always
produces the same trainer; this keeps maps and regression tests deterministic.

The current route roster uses five distinct seeded trainers:

- Stride Scout Rin;
- Form Marshal Kio;
- Trail Keeper Bo;
- Forge Reader Sela; and
- Summit Scout Ivo.

Important rivals are handcrafted rather than randomized:

- Joa Brace, a glute-emphasis platform rival with a side-chest brace;
- Suri Tempo, a lean core-emphasis rival with an abs-and-thigh stance; and
- Ren Lantern, a trap-emphasis platform lifter with a back-double-biceps pose.

Each has a unique palette, training philosophy, signature and late-game
outfits, warmup, battle stance, victory pose, loss reaction, gym accessory, and
an original fictional sponsor-style patch.

## Gym leaders and bosses

All six gym leaders are handcrafted and use different muscular archetypes,
primary muscle emphases, postures, palettes, equipment, and movement language.
Coach Mara uses a poised back-emphasis stance; Dex uses a compact forearm-heavy
side-triceps brace; Nia uses sculpted shoulder symmetry; Sol uses a thick
strongman lower-back stance; Vale uses a tapered back and side-chest line; and
Ori uses a high-mass chest-emphasis victory flex.

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

Each boss also defines five presentation-only tiers: Normal, Pumped, Overload,
Final Round, and Defeated. Tiers adjust bounded silhouette accents, markings,
equipment, posture, breathing cues, and arena lighting without changing the
boss's level, statistics, capture math, rewards, or stable identity.

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

## Visible training development

Trainer Forge cosmetics remain the authoritative base appearance. The v19
visual progression model stores independent capped values for shoulders,
chest, back, biceps, triceps, forearms, core, glutes, quads, hamstrings, and
calves. A pure TypeScript presentation adapter applies those values as
temporary offsets at one of four player-selected levels:

- Cosmetic only;
- Subtle development;
- Standard development; or
- Exaggerated arcade development.

The adapter returns a cloned appearance for React and Phaser. It never writes
the offsets into the Trainer Forge appearance. Press, pull, squat, hinge, calf,
core, mobility, and recovery machine patterns are declarative, and all 24
machine IDs are validated against exactly one pattern.

Successful set volume and technique build a temporary per-region pump. Pump
decays against monotonic active gameplay time, not wall-clock time, and a deep
recovery accelerates decay. Player preferences can hide pump or fatigue
presentation without deleting either progression or training history. Fatigue
may lower derived posture and add a derived towel or recovery wraps; selected
cosmetics remain unchanged.

The Home Gym Physique Review compares the migration/new-journey baseline with
the current derived appearance, cycles existing bodybuilding poses, displays
fictional ratings, inspects recent machine history, saves up to 12 progress
snapshots, and stores an in-game pixel portrait without file-system access.
Its six optional seeded stage challenges use player timing, preparation,
recovery, outfit choice, pose choice, pump, and training history. They do not
replace machine bosses or arm-wrestling captures.

## Development gallery and regression coverage

In development, open `?debug=characters` (or `?debug=assets`) to inspect:

- all sixteen body archetypes in four directions;
- minimum, middle, and maximum values for every body control;
- every trainer pose, including all bodybuilding poses;
- every trainer top on minimum and maximum frames with adaptive bottoms,
  wraps, sleeves, and a belt;
- light and dark skin tones across stress cases;
- a native-scale 240×160 handheld preview;
- all gym leaders, rivals, and seeded route trainers;
- all five species-scoped physique presets for every Buddy;
- every Buddy pose, silhouette-only checks, light/dark checks, and mobile-size
  previews; and
- all five presentation tiers for all 12 signature boss designs.

`trainerPixelRenderer.test.ts` proves each requested body region has distinct
low, middle, and high geometry; checks every preset, direction, and pose remains
in bounds; validates clothing attachment on extreme builds; verifies front/back
muscle emphasis; protects negative space at maximum mass; and confirms the
render cache stays bounded.

`characterVisualRegression.test.ts` checks every Buddy species, direction, and
pose for visible in-bounds output; sweeps all body/definition/pattern/appendage
combinations; protects four representative frames with deterministic signature
hashes; proves species-default silhouettes remain distinct; verifies important
character physique metadata and seeded NPC generation; and confirms the Buddy
render cache stays bounded.

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
