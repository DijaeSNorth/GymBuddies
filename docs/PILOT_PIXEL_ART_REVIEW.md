# Gym Buddies Pilot Pixel-Art Review

## Review date

2026-07-29

## Scope and method

This review records the shipped v1 pilot weaknesses before any v2 polish.
Assets were inspected at native 1×, 2×, and 4×; in the development Sprite
Strip Lab at desktop and 390×844 mobile sizes; over checker, light, dark,
field/route, gym, and battle colors; and as silhouettes.

The review covers head-to-body proportion, muscle-group readability, ground
contact, center of gravity, pose clarity, direction consistency, modular-layer
alignment, outline consistency, and palette contrast.

## Bramblift / Brawny Bear v1

Strengths:

- stable bottom-center anchor;
- broad shoulders and large forearms read at native size;
- round-ear cues survive on light and field backgrounds;
- front and back remain directionally consistent.

Weaknesses:

- head, torso, forearms, and legs use similarly rectangular clusters;
- chest and upper-back mass do not taper convincingly into the waist;
- straight split legs weaken bear-like weight and grappler balance;
- side-facing poses lose most of the broad-mammal silhouette;
- Broad risks becoming a featureless block when generic physique pixels are
  added;
- walk, run, flex, and entrance states rely heavily on vertical bob or simple
  arm height;
- the near-black outline loses some separation on the darkest battle colors.

## Rivetjack / Iron Wolf v1

Strengths:

- pointed ears, angular muzzle, and weighted tail remain identifiable;
- the narrower waist distinguishes it from Bramblift;
- right-facing mirroring is currently safe because the v1 authored base has no
  one-sided feature.

Weaknesses:

- the upright rectangular torso reads more humanoid than lean quadruped;
- long limbs appear thin rather than muscular;
- haunch, calf, and forelimb drive are not clearly separated;
- side-running frames remain too vertical and do not show useful torso rotation;
- front flex, back flex, victory, and entrance silhouettes are too similar;
- tail motion does not reinforce stride or balance;
- shoulder/back definition becomes noisy when generic overlays cover the base.

## Prismantle v1

Strengths:

- the diamond core and offset fins are the pilot’s most original silhouette;
- all four directions are authored;
- no asymmetric direction uses mirroring;
- the central accent reads well on dark and battle colors.

Weaknesses:

- the central body is too narrow to communicate strong mass;
- thin one-pixel fins become noisy over detailed or similarly valued backgrounds;
- front/back distinction depends too much on palette instead of geometry;
- appendage overlap is hard to parse at native size;
- small lower supports make the center of gravity feel uncertain;
- generic humanoid muscle overlays visibly conflict with the geometric body;
- rare and boss-entrance poses add effects without enough posture change.

## Mat Watchman v1

Strengths:

- all five tier slots exist and remain in bounds;
- escalation does not enlarge the whole sprite;
- the defeated overlay is non-graphic.

Weaknesses:

- the transparent tier sheet is too sparse to read independently;
- normal, pumped, and final-round rely primarily on floating accent lines;
- the harness, halo, wraps, and belt do not form strong equipment clusters;
- expression changes are not visible enough at 24×24;
- the defeated tier does not clearly retain the same equipment identity;
- tier timing does not yet support anticipation, hold, and recovery beats.

## Shared v2 goals

- strengthen species-specific silhouettes before adding highlight detail;
- preserve one-pixel negative-space channels between arms, torso, and legs;
- use pose-specific foot planting and center-of-gravity changes;
- reserve isolated bright pixels for meaningful pump, rare, or tier cues;
- replace generic pilot muscle overlays with anatomy-aware modular treatment;
- retain stable v1 review assets for comparison;
- promote v2 only after all automated and in-browser checks pass.

## Final v2 outcome

The v2 candidates passed their promotion gate on 2026-07-29 and are marked
`final`. The original v1 review files and manifest keys remain available.

- Bramblift now uses an angled shoulder shelf, tapered trunk, planted grappler
  legs, heavier forelimbs, and a muzzle-led side profile.
- Rivetjack now uses a lean shoulder-to-waist taper, long forelimb line,
  spring-loaded haunches, and a tail that reinforces forward momentum.
- Prismantle now has a wider diamond core, authored front/back geometry,
  independently authored left/right fins, and no unsafe mirror path.
- Mat Watchman now communicates normal, pumped, overload, final-round, and
  defeated tiers through distinct harness, halo, wrap, light, breath, and
  recovery shapes without scaling the underlying Buddy.
- All three Buddies use anatomy-aware v2 physique modules. The modules preserve
  the five stable presets while avoiding the generic humanoid muscle overlay.
- Animation timing now gives runs and captures quicker reads, fatigue a longer
  recovery beat, and flex/entrance states a deliberate hold.

Validation covered exact PNG signatures, every direction and pose, pivot and
ground bounds, preset distinction, Mat's five tiers, cache limits, React/Phaser
receipt parity, desktop rendering, Pixel 5 rendering, silhouette mode, and
production asset resolution.
