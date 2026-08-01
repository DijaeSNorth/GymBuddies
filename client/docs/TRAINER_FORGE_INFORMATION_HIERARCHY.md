# Trainer Forge Information Hierarchy

## Player priority

The studio follows this order:

1. Live character preview
2. Physique preset and major proportions
3. Regional body customization
4. Face, hair, outfit, colors, and accessories
5. Poses and saved looks
6. Separate gameplay attributes
7. Validation and confirmation

The central preview is persistent. The left rail answers “what shape am I building?”, the right inspector answers “what am I changing now?”, and the footer answers “how will I inspect or save it?”

## Visibility tiers

### Always visible

- Gym Buddies Trainer Forge identity
- trainer name
- current physique preset
- undo and redo
- Randomize and Saved Looks entry points
- current inspector category
- live trainer preview
- pose and direction
- gameplay physique level
- validation state
- confirmation

### One action away

- all body regions
- Face
- Hair
- Outfit
- Colors
- Accessories
- Poses
- Gameplay Attributes
- preview modes and lighting
- saved-look management
- randomizer filters

### System management

- appearance-only import/export
- destructive journey reset and confirmation
- contextual help
- accessibility settings retained from the journey

## Build-region map

| Region | Context groups |
| --- | --- |
| Overall | Frame; Stage presentation |
| Head & Neck | Head and neck |
| Shoulders | Shoulder frame; Delt development |
| Chest | Chest development |
| Back | Width and flare; Thickness |
| Arms | Upper arms; Forearms and grip |
| Core | Core silhouette; Core detail |
| Glutes | Glute development |
| Quads | Quad development |
| Hamstrings | Posterior development |
| Calves | Calf development |
| Hands & Feet | Hands and feet |

Every current `TRAINER_BUILD_ATTRIBUTES` ID appears in at least one group. Repeated context is intentional where a proportion affects more than one silhouette decision, such as trapezius size or stance width. A unit test compares the group union against the authored attribute catalog and fails if a future control becomes unreachable.

## Quick versus Detail

Quick Forge is a disclosure level, not a different data model. It shows ten high-impact build values in two five-control segments and keeps all cosmetic categories available. Detail Forge adds regional selection and all authored proportions. Both modes read and write the same `TrainerCreationDraft.appearance` object, so switching modes preserves hidden values, preview state, pose, direction, and history.

## Cosmetic versus gameplay separation

Gameplay muscles do not appear in the Build inspector. They have a dedicated Gameplay category with the existing gameplay presets and stats. The footer presents the calculated Gameplay Physique Level with a label that distinguishes it from cosmetic proportions.

Cosmetic reset affects only the current cosmetic context. Gameplay and pose categories disable that reset. Applying a cosmetic preset or saved look does not write gameplay muscles.

## Interaction model

- Tabs change inspector content without routes or full-page transitions.
- Body-region buttons change only the current Build context.
- Secondary groups segment regions that exceed six controls.
- Drawers trap focus, close on Escape, restore focus to their opener, and do not replace the studio.
- Range inputs retain keyboard arrow adjustment and gamepad left/right adjustment.
- Decrease, reset, and increase buttons avoid dependence on precision dragging.
- Active state uses outline, fill, text, and `aria-pressed`/`aria-selected`, not color alone.

## Preserved content contracts

The UI imports the existing content catalogs rather than duplicating option arrays. Stable IDs remain the persisted identity for presets, build attributes, facial features, hair, clothing, palettes, and accessories. Validation and normalization continue to occur in the existing systems and save layer.
