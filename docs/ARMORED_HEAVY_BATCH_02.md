# Handcrafted Character Art Batch 02: Armored and Heavy Bodies

## Status

Batch 02 is ready for visual review. Every new runtime asset is manifest status
`review`; none has been promoted to `final`.

Production began only after the Bramblift, Rivetjack, Prismantle, and Mat
Watchman pilot sheets were reviewed. The gate, evidence, strengths, and
pipeline issues are recorded in `docs/PILOT_MULTI_RESOLUTION_REVIEW.md`.

## Selected existing designs

| Role | Stable content ID | Display name | Anatomy proof |
| --- | --- | --- | --- |
| Armored/shelled Buddy | `ripped-rhino` | Railhorn | Sloped dorsal carapace, segmented shoulder and chest plates, exposed flexible joints, planted forelimbs |
| Compact powerhouse | `spotmole` | Spotmole | Dense torso, broad low ruff, shovel hands, short powerful limbs |
| Heavy biped | `titan-gorilla` | Knuckledge | High back bridge, thick torso, long load-bearing arms, slab knuckles, supported biped stance |
| Derived boss | `a-rhino` | A-Rhino | Railhorn silhouette plus shell harness, shoulder guards, boss insignia, energy seams, and five presentation tiers |

These are existing roster and boss IDs. No species, boss, combat values, save
fields, unlocks, or gameplay rules were added or replaced.

## Pilot comparison

The batch keeps the pilot contract:

- the same limited marker palette;
- bottom-center anchors and compatible ground lines;
- 24-frame, 24×24 overworld strips;
- native 32×32 menu, 48×48 battle, and 64×64 showcase frames;
- 64×64 boss battle and showcase sheets with five tier rows;
- the same 220–340 ms standard timing classes;
- nearest-neighbor rendering and transparent backgrounds;
- `core`, `battle`, `showcase`, and `portrait` load groups;
- React/Phaser resolver parity and safe fallback behavior.

The batch deliberately improves the weakest pilot area: action readability.
Shoulder Burst, Snapping Hook, Counter, escape, side poses, front poses, and
back poses now use different body orientations and negative space instead of
depending only on one-pixel effect marks.

## Anatomy-family lessons

### Railhorn

The dorsal structure reads most clearly when it is treated as a shallow
carapace with discrete shoulder and chest plates. The rail horn, sloped back,
and low center of gravity are more important to species identity than adding
surface texture. Side frames require separately authored left and right
profiles because the horn cannot safely be inferred from a mirrored generic
body.

### Spotmole

Compact strength reads through a low shoulder line, large shovel hands, short
limb travel, and a dense center. Increasing every dimension made the shape
blobby, so the authored family keeps a small head/foot relationship and spends
variation on the ruff, hands, and stance.

### Knuckledge

Heavy-biped posture needs a visible back bridge and weight-bearing knuckles
without erasing the legs. Long arms alone read as lanky; the thick shoulder
bridge, narrow waist, short supported legs, and flat fists make the silhouette
feel powerful.

### A-Rhino

Boss escalation is clearest when equipment, stance, seams, and ground impact
change together. The rigid plate envelope remains constant across all five
tiers.

## Authored modules

Stable module definitions live in
`client/src/game/assets/armoredHeavyModules.ts`.

Railhorn modules:

- `batch02.railhorn.hard-dorsal-carapace`
- `batch02.railhorn.segmented-shoulder-plates`
- `batch02.railhorn.chest-keel`
- `batch02.railhorn.flex-joints`
- `batch02.railhorn.undershell-power`
- `batch02.railhorn.forelimb-wraps`
- `batch02.railhorn.shell-harness`

Spotmole modules:

- `batch02.spotmole.compact-core`
- `batch02.spotmole.shovel-wraps`
- `batch02.spotmole.reinforced-knees`
- `batch02.spotmole.victory-medal`

Knuckledge modules:

- `batch02.knuckledge.bridge-back`
- `batch02.knuckledge.knuckle-wraps`
- `batch02.knuckledge.gym-chain`
- `batch02.knuckledge.training-belt`

A-Rhino uses Railhorn’s anatomy modules plus a boss-specific shell harness,
shoulder guards, belt insignia, raised final-round rails, and ground-impact
marks. Generic human-shaped equipment is not used where it would intersect a
plate hinge, shovel hand, or slab knuckle.

## Armor-specific rendering rules

1. Hard outer shell, back plates, chest plates, shoulder plates, and limb
   guards are rigid modules.
2. Flexible joints and under-shell muscle are separate non-rigid modules.
3. Compact, Balanced, Broad, Specialized, and species-specific presets use
   independent shell width, limb thickness, stance width, plate spacing,
   exposed muscle, center of gravity, and neck posture values.
4. No preset uniformly scales the complete shell.
5. Pump changes exposed joints, seam highlights, confidence, and animation
   intensity. Every boss tier has `armorScale: 1`.
6. Fatigue lowers posture, closes stance, dims energy, and reduces impact. It
   never adds cracks or injury marks.
7. Plate seams remain sparse and functional so they do not become noisy
   surface decoration at 24×24.

## Boss tier language

| Tier | Plate and seam treatment | Posture/equipment treatment |
| --- | --- | --- |
| Normal | Base seams and fixed plate envelope | Harness seated, neutral planted stance |
| Pumped | Brighter exposed seams | Open shoulders, raised harness energy |
| Overload | Coral seam energy and larger ground reaction | Wider stance, locked equipment, stronger impact |
| Final Round | Maximum controlled glow and raised rail accents | Most open stance, insignia focus, highest animation intensity |
| Defeated | Dim seams, no damage marks | Lowered posture, released harness, safe recovery stance |

## Review assets

The approval sheet is:

`client/art-source/review/batch-02-armored-heavy/batch-02-contact-sheet.png`

It is intentionally outside `public/` and is not shipped in the runtime
bundle. The rows are Railhorn, Spotmole, Knuckledge, and A-Rhino. Each row
shows four menu directions, six representative battle poses, and four
showcase or boss-tier frames.

Runtime output:

- 12 authored 24×24 overworld strips;
- 1 five-frame A-Rhino overworld tier overlay;
- 4 native 32×32 menu sheets;
- 3 native 48×48 Buddy battle sheets;
- 1 native 64×64, five-tier boss battle sheet;
- 4 native 64×64 showcase sheets;
- 4 native 64×64 portraits.

The 29 runtime PNGs encode to 40,458 bytes. Fully decoding every file at once
would require 3,431,680 bytes, but the runtime does not do that: overworld and
menu assets load first, while battle, showcase, and portrait groups stay lazy
and use the existing bounded cache.

## Pipeline limitations discovered

- Railhorn proves plated armor and a shallow dorsal carapace, but it does not
  yet prove a full domed shell. Plastrong remains the best candidate for that
  anatomy in the next family batch.
- The review generator produces strong silhouettes and stable material
  boundaries, but final facial expressions, chain links, wrap folds, and
  small insignia still need a handcrafted pixel-artist pass.
- Some 24×24 physique differences necessarily use one- or two-pixel plate and
  stance changes. The 48×48 and 64×64 contexts carry the clearer comparison.
- Final approval should inspect the widest Railhorn preset with every
  accessory combination; the current automated bounds checks cover authored
  base sheets and modular overlays independently.
- A-Rhino’s final-round rails are readable, but the harness release in the
  defeated row would benefit from one more asymmetrical hand-authored frame.

## Recommended changes before Batch 03

1. Review the contact sheet at native size and at 2× nearest-neighbor scale.
2. Hand-tune Railhorn’s face, horn base, and final-round harness release.
3. Hand-tune Spotmole’s shovel-hand fingers and Knuckledge’s knuckle planes.
4. Approve or revise shadow widths against both light and dark route palettes.
5. Use Plastrong for a true dome-shell test before declaring the shelled
   family complete.
6. Keep all Batch 02 assets at `review` until those revisions and the visual
   approval pass are complete.
