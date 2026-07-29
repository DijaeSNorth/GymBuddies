# Trainer Creation

## Player promise

Every player trainer has a deliberately powerful, athletic, fitness-focused
silhouette. Customization creates different kinds of muscular characters
without presenting one body type as better, healthier, or more capable than
another.

Trainer creation is mandatory for a new journey and can be reopened later
without resetting progression.

## Data separation

`TrainerProfile` stores four independent kinds of state:

1. `appearance`: cosmetic body, face, hair, outfit, colors, and accessories;
2. `muscles`: the eight fictional trainer progression attributes;
3. `trainerEquipmentBonuses`: a separate save-level discipline modifier
   record, currently initialized to zero;
4. `appearancePresets`: up to eight player-saved cosmetic looks; and
5. legacy palette mirrors used by older presentation consumers.

Cosmetic arm size does not change capture pressure. Visible body mass does not
change trainer power. Equipment visuals do not create bonuses. The player must
intentionally assign gameplay attributes or earn equipment bonuses through
their corresponding progression systems.

Current fatigue remains a top-level journey value, Physique Level remains
derived from trainer muscles, and training specialization remains represented
by machine mastery. None are stored inside cosmetic appearance.

Changing `appearance` or loading an appearance preset preserves:

- trainer muscle progression;
- equipment bonuses;
- current fatigue and momentum;
- training specialization and machine mastery;
- Buddies and Index progress;
- route and gym progression;
- boss schedules and victories; and
- audio, input, and accessibility settings.

## Cosmetic build

The cosmetic build has 22 independently adjustable values from 0 through 10:

- height and overall body scale;
- head size and neck thickness;
- shoulder width, trapezius size, chest size, upper-back width, and lower-back
  thickness;
- biceps, triceps, forearms, and hand size;
- core definition and waist width;
- glutes, quads, hamstrings, calves, and foot size; and
- overall muscle definition and body mass.

The renderer uses a muscular baseline at value 0. Larger values add discrete
pixel modules instead of stretching a single sprite. This preserves readable
anatomy and clothing attachment at both extremes.

Eight cosmetic physique presets provide starting values only:

- Balanced Athlete
- Classic Bodybuilder
- Heavy Powerlifter
- Strongman
- Lean Fighter
- Compact Powerhouse
- Lower-Body Specialist
- Upper-Body Specialist

Selecting a preset never locks an individual build control.

## Face and hair catalog

Stable option IDs define multiple:

- face shapes;
- eyes and eyebrows;
- noses, mouths, and ears;
- facial-hair styles;
- scars, freckles, tattoos, and face paint;
- hair styles and lengths; and
- hair and highlight colors.

`bald` is a normal hair-style option and normalizes hair length to `none`.
Skin tones, features, and hairstyles are presented as neutral visual choices
without cultural stereotypes or evaluative labels.

## Outfit and accessories

The current catalog separately supports:

- shirts, tank tops, hoodies, and compression tops;
- shorts, joggers, and leggings;
- shoes and socks;
- gloves and wrist wraps;
- elbow and knee sleeves;
- headbands, hats, belts, gym bags, and jewelry; and
- optional late-game capes, ribbons, and mantles.

Top, bottom, shoe, and accessory palettes have independent primary, secondary,
and accent selections. Clothing geometry is calculated from the current
shoulder, torso, waist, arm, thigh, calf, hand, and foot modules so larger
builds do not reuse a detached fixed-size garment.

## Layered pixel renderer

The shared renderer generates original 28×36 logical pixel frames using this
layer order:

1. shadow;
2. legs;
3. torso;
4. arms;
5. head;
6. hair;
7. facial details;
8. clothing;
9. shoes;
10. accessories;
11. equipment; and
12. effects.

The same pure renderer feeds the React preview canvas and Phaser overworld
graphics. It supports:

- front, back, left, and right directions;
- idle, walking, running, training, victory, fatigue, capture, and
  boss-introduction poses;
- two-frame readable motion;
- a shared bottom-center anchor;
- curated palette swaps;
- discrete body modules; and
- a bounded 512-frame combination cache.

The minimum cosmetic settings retain broad shoulders, visible arms, and a
grounded stance. Maximum settings remain within the fixed canvas and preserve
visible head, torso, limbs, clothing, and shoes.

## Studio interface

Customization is organized into:

- Build
- Face
- Hair
- Outfit
- Colors
- Accessories
- Preview

The studio provides:

- live animated preview;
- left/right rotation;
- all-direction preview gallery;
- all-pose selection;
- deterministic-valid cosmetic randomization;
- undo and redo history;
- category reset;
- before-and-after comparison;
- curated color swatches;
- up to eight saveable appearance presets; and
- a separate gameplay-attribute section.

All controls are DOM-based and remain keyboard focusable. Touch targets are at
least 44 logical CSS pixels where practical. Keyboard arrows adjust sliders,
native selects remain operable, and gamepad left/right adjusts focused sliders
or selects while the D-pad navigates controls. Reduced motion stops preview
animation without removing the selected pose.

## Persistence and migration

Schema v15 stores cosmetic selections with stable option IDs rather than array
positions. The v14-to-v15 migration converts legacy skin, hair, top, glove, and
shoe colors into the nearest curated stable IDs and adds an empty saved-look
collection.

Loading validates every build value and option reference. Missing or removed
options fall back to the corresponding safe default, invalid build values are
clamped, duplicate saved-look IDs are repaired, and at most eight presets are
retained. A recoverable cosmetic error cannot create an invisible trainer or
invalidate otherwise valid journey progress.

## Development gallery and tests

The development-only asset deck includes all eight physique presets in all four
directions. Automated tests verify:

- all preset/direction/pose combinations render inside the shared frame;
- minimum and maximum builds remain visible and distinct;
- clothing overlaps its corresponding body modules at extreme proportions;
- generated-frame caching is bounded;
- randomization is deterministic and valid;
- missing stable option IDs recover safely;
- cosmetics and progression remain independent; and
- v14 saves migrate to the v15 cosmetic schema.
