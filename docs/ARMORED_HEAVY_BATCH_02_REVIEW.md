# Gym Buddies Handcrafted Batch 02 — Formal Visual Review

Review date: 2026-07-30
Review scope: Railhorn (`ripped-rhino`), Spotmole, Knuckledge (`titan-gorilla`), and A-Rhino
Gate result: **revision required; Batch 02 is not approved as a production standard**

## Executive decision

No Batch 02 asset moved to `approved` or `final`. Automated validation proves that the files are loadable, bounded, addressable, palette-consistent, and safe to fall back from; it does not prove production-quality drawing, pose communication, accessory fit, or cross-resolution identity.

All 29 Batch 02 runtime assets are now `revision-required`. Their 21 character/profile review receipts preserve asset version `1.0.0`, review date, reviewer note, known limitation, required revision, and `proceduralFallbackEnabled: true`.

| Gate status | Profiles | Runtime assets | Decision |
| --- | ---: | ---: | --- |
| `placeholder` | 0 | 0 | None in this authored batch |
| `review` | 0 | 0 | Formal review completed; unresolved work is specific enough to require revision |
| `revision-required` | 21 | 29 | All Batch 02 profiles |
| `approved` | 0 | 0 | No profile met the production bar |
| `final` | 0 | 0 | No automatic or accidental promotion |

The authoritative receipt ledger is `client/src/game/assets/batch02FormalReview.ts`. Runtime status remains resolution-specific through the manifest entries, and the shared A-Rhino overworld profile is recorded separately from its boss-tier overlay.

## Review evidence

The complete contact sheets are generated from the actual React/runtime renderers at `?debug=batch02-review`, not from isolated mock drawings. They include the requested resolutions, four directions, five physique families, neutral and pumped states, all authored battle and showcase poses, five backgrounds, mobile scale, silhouettes, anchors, bounds, accessories, and A-Rhino tiers.

- [Railhorn formal contact sheet](../client/art-source/review/batch-02-formal/ripped-rhino-formal-contact-sheet.png)
- [Spotmole formal contact sheet](../client/art-source/review/batch-02-formal/spotmole-formal-contact-sheet.png)
- [Knuckledge formal contact sheet](../client/art-source/review/batch-02-formal/titan-gorilla-formal-contact-sheet.png)
- [A-Rhino formal contact sheet](../client/art-source/review/batch-02-formal/a-rhino-formal-contact-sheet.png)
- [Original Batch 02 comparison sheet](../client/art-source/review/batch-02-armored-heavy/batch-02-contact-sheet.png)

The Railhorn and A-Rhino sheets include 132 extreme-accessory canvases each: 11 accessory cases across Compact, Broad, and Specialized physiques in all four directions.

## Resolution-specific status ledger

Every entry below is version `1.0.0`, reviewed 2026-07-30, remains eligible for procedural fallback, and has status `revision-required`.

### Railhorn / `ripped-rhino`

| Profile | Resolution | Reviewer note | Known limitation | Required revision |
| --- | --- | --- | --- | --- |
| Overworld | 24×24 | Horn and planted stance survive front, left, and right views. | Broad equipment stacks flatten plate gaps; the rear horn cue is absent; the body can become rectangular. | Re-author species-shaped wrap, chain, belt, sleeve, and rear horn cues while preserving joint gaps. |
| Menu | 32×32 | Four-direction identity is readable. | Preset differences rely too heavily on small overlays and generic accessory placement. | Separate shoulder plates and flexible joints; taper the Broad shell. |
| Battle | 48×48 | Hook and counter side silhouettes retain the horn and low stance. | Several front actions are interchangeable; pump seams and fatigue posture are too weak. | Strengthen action silhouettes, flexible-joint motion, pump contrast, and fatigue posture. |
| Showcase | 64×64 | Front, back, and side identity remain recognizable. | Named bodybuilding poses show too little plate rotation, dorsal depth, or exposed-joint flex. | Re-author pose-specific shell depth and joint motion without changing rigid armor volume. |
| Portrait | 64×64 | Palette and horn match gameplay. | The image is a full-body showcase frame, not an expression-led portrait. | Author a closer portrait with horn clearance, expression, chest segmentation, and shoulder plates. |

### Spotmole

| Profile | Resolution | Reviewer note | Known limitation | Required revision |
| --- | --- | --- | --- | --- |
| Overworld | 24×24 | The low stance and compact torso survive all directions. | Shovel hands and short-limb motion collapse into generic square hands. | Widen the shovel-hand outline and animate shoulders, hips, and short steps as one power chain. |
| Menu | 32×32 | Head-to-torso balance stays distinct from the heavy biped. | Presets and accessories are too subtle to communicate a compact muscular powerhouse. | Clarify ruff, core, leg mass, stance width, and shovel-hand equipment for each physique. |
| Battle | 48×48 | The character stays compact and grounded. | Digging, grappling, preparation, counters, and stamina loss do not have distinct silhouettes. | Re-author hand angles, stance compression, leg drive, and expressions per action. |
| Showcase | 64×64 | Species silhouette remains compact at the larger size. | Most named poses differ by only a few pixels and do not show core or leg emphasis. | Build pose-specific ruff, hand, core, and thigh silhouettes. |
| Portrait | 64×64 | Palette and face mark remain consistent. | Full-body framing leaves too few pixels for personality. | Author an expressive crop using eyes, ruff, shovel hands, and markings. |

### Knuckledge / `titan-gorilla`

| Profile | Resolution | Reviewer note | Known limitation | Required revision |
| --- | --- | --- | --- | --- |
| Overworld | 24×24 | Bridge arms and slab knuckles create a recognizable heavy biped. | Side views, arm swing, and leg support do not yet show controlled moving weight. | Rebalance shoulder roll, hip support, knuckle contact, and side-frame swing. |
| Menu | 32×32 | Back bridge and long-arm identity survive reduction. | Face and Broad/Specialized/Climber differences are weak. | Clarify chest depth, back width, face, legs, and physique-specific shoulder-to-hand rhythm. |
| Battle | 48×48 | The neutral stance communicates mass. | Required side-facing attacks are absent; most actions retain one front silhouette. | Author side attacks, slab-knuckle arcs, back compression, leg drive, and facial tells. |
| Showcase | 64×64 | Heavy-biped identity remains readable front and back. | Pump, posing, chest depth, and back spread are too similar. | Re-author shoulder bridge, chest projection, back spread, knuckle plant, and fatigue shift. |
| Portrait | 64×64 | Dark bridge silhouette and warm chest palette stay consistent. | Full-body framing prevents clear facial expression. | Author a head-and-shoulder portrait that retains the bridge shoulders. |

### A-Rhino

| Profile | Resolution | Reviewer note | Known limitation | Required revision |
| --- | --- | --- | --- | --- |
| Shared overworld | 24×24 | Still reads as a Railhorn-derived boss. | Shared species strips cannot carry enough A-Rhino harness, expression, or tier identity. | Add boss-safe overlays for horn, joints, harness, and tier cues in all directions. |
| Boss-tier overlay | 24×24 | All tiers avoid wounds and cracked armor. | Pumped and Overload are too similar; Final Round changes viewpoint too sharply. | Escalate seams, posture, harness, expression, and timing around one stable silhouette. |
| Menu | 32×32 | Boss palette and horn survive four directions. | Harness and expression are unevenly legible. | Strengthen harness, red chest motif, and expression without obscuring horn or plate gaps. |
| Battle | 64×64 | Normal and Defeated remain broadly recognizable and non-graphic. | The 48×48 derived comparison loses identity; Final Round changes orientation and apparent body archetype. | Unify all five tiers, varying seams, stance, harness, expression, and timing rather than viewpoint. |
| Showcase | 64×64 | Rigid plate volume remains controlled. | Tier escalation and bodybuilding poses are too similar in posture and exposed musculature. | Clarify harness state, stance, seam intensity, flexible joints, and humbled Defeated posture. |
| Portrait | 64×64 | Horn and red harness motif connect it to A-Rhino. | Full-body framing lacks a readable boss expression. | Author a close boss portrait with horn clearance, expression, and tier-neutral plate geometry. |

## Character findings

### Railhorn

Passes:

- The rail horn stays clear against the outline in front and both side views.
- The asymmetric left/right authored strips avoid an incorrect mirrored horn.
- Side-facing `snapping-hook` and `counter` frames are addressably distinct.
- Shell and plate geometry stays inside frame bounds, and pump does not inflate rigid armor.
- Specialized retains the horn, planted stance, and armored species identity.

Revision findings:

- The back view needs a small horn/base cue to prevent a cross-resolution identity drop.
- Generic wraps and elbow sleeves cross or cover plate/joint boundaries in some Broad and full-stack combinations.
- The ceremonial chain is technically anchored but does not form a convincing shell-mounted path; at small scale it can read as isolated pixels.
- The belt crosses the torso as a generic horizontal band and visually intersects the shell segmentation.
- The valid full equipment stack obscures plate gaps and creates a bright rectangular torso mass.
- Broad is too rectangular in front/back views instead of wide with a grounded taper.
- Neutral and pumped states need stronger exposed-joint, posture, and seam differences.
- Fatigue is mostly a vertical shift; the head, shoulders, stance, and seam energy need a coordinated exhausted posture.

### Spotmole

Passes:

- The character is low, wide, and visibly shorter than Railhorn or Knuckledge.
- The head-to-torso ratio is stable across menu, battle, and showcase.
- Frame bounds and anchors are stable.

Revision findings:

- Spotmole reads as compact, but not yet consistently as muscular; the torso is a simple block and the leg/core construction is underdescribed.
- Shovel hands are not reliably recognizable at 24×24 or in action silhouettes.
- Short-limb animation lacks the compression-and-drive rhythm needed for digging and grappling.
- Compact, Balanced, Broad, Specialized, and Grappler presets differ too little at menu scale.
- Generic accessories are not scaled to the broad hands and short limbs.
- Battle and showcase poses do not provide enough silhouette distinction from other compact species.

### Knuckledge

Passes:

- Long bridge arms, slab hands, and a high back create the strongest family-specific silhouette in the batch.
- The neutral stance communicates weight without simply scaling the full character.
- Front/back palette and anchor placement remain stable.

Revision findings:

- Controlled weight is present in the static silhouette, but the authored movement lacks shoulder roll, leg bracing, and visible weight transfer.
- Side-facing battle actions required by the gate are not authored; the action set mostly stays front-facing.
- Slab knuckles do not change angle enough during attack, counter, or stamina-loss frames.
- The legs do not visibly support the wide back and arms during loaded actions.
- Facial tells are too small to distinguish preparation, effort, victory, and defeat.
- Chain, belt, wraps, and sleeves use generic anchors instead of the shoulder bridge, narrow waist, and slab hands.

### A-Rhino

Passes:

- Normal, Pumped, Overload, and Defeated retain the horn and main Railhorn-derived armor language.
- Defeated is tired and humbled rather than wounded; there are no cracks, blood, or damage marks.
- Rigid armor does not inflate between tiers.

Revision findings:

- The 48×48 derived base is materially simpler than the 64×64 boss frames and appears like a different presentation tier or individual.
- Pumped and Overload do not escalate clearly enough through seams, stance, harness, expression, or timing.
- Final Round changes to a side-facing battle silhouette while adjacent tiers are front-facing, which reads as an identity/viewpoint break rather than controlled escalation.
- The Defeated battle and showcase frames disagree on orientation and degree of collapse.
- Harness configuration and expression need to stay legible at every tier.

## Cross-resolution inconsistencies

- All four characters preserve their broad palette families, but palette consistency is stronger than anatomy consistency.
- The menu sprites are sometimes visually smaller than the 24×24 overworld presentation despite their larger authored canvas.
- The 48×48 frames often contain a smaller figure with less anatomical information than the 32×32 or 64×64 frame.
- Portraits are full-body enlargements rather than portrait compositions, so facial and personality information does not improve with resolution.
- Spotmole loses shovel-hand specificity; Knuckledge loses controlled-weight motion; Railhorn loses some joint and dorsal depth; A-Rhino loses boss-specific identity in the derived comparison.
- Pump and pose state are not equally recognizable at every resolution.

## Required pixel-art corrections before a second gate

1. Re-author resolution-native silhouettes so the figure uses the available 32, 48, and 64-pixel canvases deliberately.
2. Replace generic accessory placement with species-specific anchor maps for Railhorn shell joints, Spotmole shovel hands, and Knuckledge shoulder bridge/slab hands.
3. Create side-facing battle actions for Knuckledge and strengthen the action silhouettes for every character.
4. Redraw all portrait profiles as close portrait compositions.
5. Increase pose-specific anatomical changes at 64×64 while preserving each anatomy family.
6. Stabilize A-Rhino’s camera-facing identity across all five tiers and make escalation occur through posture, harness, seams, exposed joints, expression, and timing.
7. Re-run the exact formal contact-sheet matrix, then perform a second manual review. Passing automation alone remains insufficient.

## Automated gate coverage

Targeted checks now cover:

- every Railhorn accessory plus the full valid stack across three extreme physiques and four directions;
- horn presence in front and side technical overlays;
- chain and belt/harness technical anchor zones;
- shell, plate, and full-frame bounds;
- distinct addressability of side-action frames;
- cross-resolution manifest palette consistency;
- A-Rhino tier frame identity and ordering;
- resolution of `revision-required` assets with procedural fallback;
- complete review-receipt coverage;
- prevention of accidental `approved` or `final` promotion;
- integrity hashes for all runtime Batch 02 PNGs and the four formal contact sheets.

## Validation results

| Check | Result |
| --- | --- |
| TypeScript application and Playwright typecheck | Passed |
| Authored sprite validation | Passed: 16 overworld profiles, 8 presentation profiles, 2 boss overlays, and all authored frames |
| Unit tests | Passed: 204 tests across 25 files |
| Formal review deck browser test | Passed on desktop Chromium and mobile touch |
| Full Playwright suite | Passed: 27 tests, including keyboard, touch, gamepad, save, performance, and fallback coverage |
| GitHub Pages deployment checks | Passed: exact base-path asset loading, nested refresh fallback, and offline core loading |
| Production build | Passed: `/GymBuddies/`, 77 precached files, 24 lazy presentation files |

The production build still reports the existing large-chunk warning: approximately 705 kB for the main minified script and 1,232 kB for the Phaser presentation chunk before gzip. This review did not change runtime gameplay or undertake a bundle architecture refactor.

## Production-standard decision

Batch 02 is **not ready to establish production visual standards**. It is useful pipeline evidence: it proves multi-resolution loading, deterministic generation, anatomy-family routing, bounded rendering, boss-tier addressing, Pages-safe paths, and formal review capture. It does not yet set the bar for final silhouette craftsmanship, action posing, species-specific equipment, portraits, or cross-resolution identity.

Batch 03 must not begin from these assets as an approved template. Revise Batch 02, regenerate the same evidence deck, and hold a second manual gate first.
