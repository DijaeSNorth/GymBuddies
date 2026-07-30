# Pilot Multi-Resolution Review Gate

## Review status

Reviewed on 2026-07-29 before Batch 02 production began.

The Bramblift, Rivetjack, Prismantle, and Mat Watchman presentation sheets are
approved as the pipeline reference for Batch 02. This approval covers their
technical contract, palette discipline, anchors, timing classes, fallback
behavior, lazy loading, and review workflow. The higher-resolution pilot art
remains manifest status `review`; this gate does not promote it to final art.

## Evidence reviewed

- four 32×32 menu sheets;
- three 48×48 standard battle sheets;
- one 64×64 five-tier Mat Watchman battle sheet;
- four 64×64 showcase sheets;
- four 64×64 portrait sheets;
- all twelve battle poses and ten showcase poses;
- native 1× sheets plus desktop and 390×844 debug-gallery presentation;
- checker, light, dark, gym, route, battle, and silhouette views;
- strict frame, ground-line, path, manifest, and React/Phaser parity tests.

All sixteen presentation files passed the existing authored-sprite validator.
The standards use bottom-center anchors, compatible marker colors, 240–340 ms
timing classes, and the intended `core`, `battle`, `showcase`, and `portrait`
load groups.

## Shared strengths to preserve

- The 24×24 overworld pipeline remains independent and authoritative.
- Every context uses a native authored sheet rather than a stretched
  overworld frame.
- Marker colors remain limited to outline, primary, secondary, detail, and
  accent roles, with coral reserved for impacts and danger.
- Shadows share a narrow grounded footprint and never change the anchor.
- Character identity survives palette swapping and context changes.
- Missing sheets fall through authored lower resolution, hybrid, procedural,
  and safe-placeholder stages without hiding the character.
- Boss tiers occupy fixed rows and never scale the complete character.

## Issues Batch 02 must address

### Silhouette and pose clarity

- Several battle poses alter an arm or effect line without changing the center
  of gravity enough to read instantly.
- Bramblift remains blocky through the torso, forearms, and legs.
- Rivetjack is distinct but sometimes reads thin rather than powerfully lean.
- Prismantle retains excellent species identity, but many poses share nearly
  identical mantle geometry.
- Front/back and neutral/action differences need stronger negative-space
  changes before adding more highlight pixels.

### Shadows and grounding

- Pilot shadows are compatible and correctly anchored, but are very narrow and
  close in value to dark stages.
- Heavy Batch 02 characters need broader, still-bounded contact shadows.
- Ground impact must be shown with shadow shape, dust pixels, stance, and
  timing—not by moving the bottom-center anchor.

### Detail density and expressions

- Face and equipment details are sparse at 48×48 and especially repetitive
  across Mat Watchman’s tier rows.
- Bright isolated pixels need to remain meaningful; adding texture everywhere
  would weaken the limited palette.
- Batch 02 should spend extra pixels on plate seams, flexible joints, exposed
  musculature, hands, and equipment attachments.

### Boss escalation

- Mat Watchman proves the five-row contract and avoids whole-sprite scaling.
- Normal, pumped, overload, and final-round still depend too much on floating
  accent lines.
- Batch 02 must make tier escalation readable through stance, plate seams,
  harness state, insignia, ground contact, and controlled energy exposure.
- Defeated art must preserve equipment identity and show safe recovery rather
  than damage.

## Batch 02 gate decision

The pipeline is technically ready for the armored and heavy-bodied batch.
Batch 02 may proceed with the following non-negotiable constraints:

1. rigid armor and shell regions are authored modules, never soft-muscle
   overlays;
2. physique presets vary plates, joints, exposed tissue, stance, and center of
   gravity independently;
3. pump cannot inflate hard armor;
4. boss tiers must change posture and equipment as well as effects;
5. every new asset remains `review` until its contact sheet is approved;
6. no gameplay, save, progression, or stable content ID changes are permitted.
