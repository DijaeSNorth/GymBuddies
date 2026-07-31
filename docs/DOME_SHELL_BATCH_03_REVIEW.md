# Gym Buddies Handcrafted Batch 03 Formal Review

## Decision

Batch 03 is not ready to establish final production standards.

- Approved profiles: none
- Final profiles: none
- Review profiles: 9
- Revision-required profiles: 12
- Dome Warden gameplay status: presentation-only
- Combat, progression, encounters, saves, stable species IDs, and physique calculations changed: none

The batch proves the structural domed-shell pipeline: rigid and flexible layers are separated, authored directions remain in bounds, pump never scales the shell, 32 explicit accessory anchors resolve deterministically, React and Phaser agree, and missing assets fall back safely. The art gate remains open because action silhouettes, showcase posing, portrait composition, and accessory modules are not yet consistently authored to final quality.

## Review evidence

Formal evidence is generated from `?debug=batch03-review`:

- [Cross-resolution comparison](../client/art-source/review/batch-03-formal/cross-resolution.png)
- [Native 1×, 2×, and 4× inspection](../client/art-source/review/batch-03-formal/native-scales.png)
- [Silhouette comparison](../client/art-source/review/batch-03-formal/silhouettes.png)
- [Armor-layer isolation](../client/art-source/review/batch-03-formal/armor-layers.png)
- [Anchor diagrams](../client/art-source/review/batch-03-formal/anchors.png)
- [Accessory-priority matrix](../client/art-source/review/batch-03-formal/accessory-priority.png)
- [390×844 mobile preview](../client/art-source/review/batch-03-formal/mobile.png)
- [Dome Warden tier comparison](../client/art-source/review/batch-03-formal/boss-tiers.png)
- [Resolution-specific ledger](../client/art-source/review/batch-03-formal/formal-ledger.png)
- [Plastrong contact sheet](../client/art-source/review/batch-03-formal/titan-tortoise-review-contact-sheet.png)
- [Railhorn v3 contact sheet](../client/art-source/review/batch-03-formal/ripped-rhino-review-contact-sheet.png)
- [Cairnox contact sheet](../client/art-source/review/batch-03-formal/boulder-bison-review-contact-sheet.png)
- [Dome Warden contact sheet](../client/art-source/review/batch-03-formal/dome-warden-review-contact-sheet.png)

The earlier Batch 02 Railhorn evidence remains at `client/art-source/review/batch-02-formal/ripped-rhino-formal-contact-sheet.png` for direct v1/v3 comparison.

## Plastrong

### Passed

- The complete upper dome, front plastron, neck opening, shoulder openings, hip openings, flexible joints, and exposed limbs remain independently represented.
- Front, back, left, and right have distinct pixel signatures and do not use unsafe mirroring.
- The back view removes the front plastron.
- All five physique presets remain technically distinct.
- Pump changes exposed tissue and highlights without changing upper-dome or plastron geometry.
- The silhouette remains recognizable at native 24×24 on light, dark, gym, route, and battle backgrounds.

### Revision findings

- Side-view plastron depth is too shallow at 24×24 and does not carry the same structural read as the front.
- Compact and Balanced rely on small stance changes; Broad and Dome Fortress need more distinct opening width and center-of-gravity cues.
- Battle actions are too similar. Shoulder Burst, Iron Grind, Snapping Hook, near-pin, escape, and defeat need action-specific limb and neck motion.
- Showcase poses are not sufficiently differentiated. Front/back double biceps, side chest, side triceps, most muscular, and abs-and-thigh currently read as near-neutral variants.
- The portrait uses full-body framing, leaving too few pixels for expression or shell-surface personality.
- Joint tissue needs cleaner one-pixel transitions at the neck and shoulders.
- Accessory art is currently an anchor system, not a complete set of authored belts, wraps, sleeves, chains, harnesses, medals, ribbons, and insignia.

### Resolution decisions

- 24×24 overworld: `review`, may ship in alpha.
- 32×32 menu: `review`, may ship in alpha.
- 48×48 battle: `revision-required`.
- 64×64 showcase: `revision-required`.
- 64×64 portrait: `revision-required`.

## Railhorn v3

### V3 versus Batch 02 v1

V3 improves:

- horn clearance in front and side silhouettes;
- tapered rather than rectangular plate mass;
- side-facing Shoulder Burst, Snapping Hook, Counter, and Escape;
- front/back/side showcase pose variety; and
- cross-resolution palette consistency.

V3 still needs:

- a complete v3 accessory stress sheet;
- clearer Broad versus Specialized shoulder structures;
- stronger fatigue and facial tells;
- authored equipment and fabric movement; and
- a true close portrait.

Decision: keep v3 as the preferred review alternative. Retain v1 as `revision-required`. Do not call v3 an approved replacement yet.

### Resolution decisions

- 24×24 overworld: `review`, may ship in alpha.
- 32×32 menu: `review`, may ship in alpha.
- 48×48 battle: `review`, may ship in alpha.
- 64×64 showcase: `review`, may ship in alpha.
- 64×64 portrait: `revision-required`.

## Cairnox

### Passed

- The rigid stacked torso remains separate from the exposed limbs.
- Horn line, ochre limbs, and block mass create a silhouette distinct from Plastrong and Railhorn.
- The rigid torso does not expand under pump.
- The character stays in bounds and grounded at native mobile scale.

### Revision findings

- Front and back rely too much on internal markings; the silhouette needs clearer rear mass.
- Compact, Balanced, and Broad need stronger stance and shoulder-overhang separation.
- All battle actions share essentially one pose. The result reads static rather than controlled and heavy.
- Showcase poses do not use limb spread, torso tilt, horn angle, or weight transfer.
- Fatigue lacks visible limb bend and lowered neck while preserving an undamaged torso.
- The portrait needs an expression-led crop, clearer horn base, and exposed-neck transition.

### Resolution decisions

- 24×24 overworld: `review`, may ship in alpha.
- 32×32 menu: `review`, may ship in alpha.
- 48×48 battle: `revision-required`.
- 64×64 showcase: `revision-required`.
- 64×64 portrait: `revision-required`.

## Dome Warden

### Passed

- Normal, Pumped, Overload, Final Round, and Defeated remain recognizably Plastrong-derived.
- No tier scales, cracks, replaces, or damages the rigid shell.
- Seam lighting and gold/green palette establish a distinct presentation identity.
- Defeated is non-graphic and subdued.
- The profile exists only in presentation and asset data; it is absent from the gameplay boss roster.

### Revision findings

- Normal through Final Round escalate mainly through light and color. Stance, harness configuration, exposed-limb tension, expression, and secondary motion are too similar.
- Defeated needs a clearer lowered head, bent limbs, and humbled posture without implying injury.
- The 32×32 menu frame loses most boss equipment.
- Battle actions and tier rows need combined authored motion rather than repeated neutral frames.
- The portrait is a full-body card and does not function as a major introduction portrait.

### Resolution decisions

- Shared 24×24 overworld base: `review`, not eligible for gameplay use.
- 24×24 tier overlay: `revision-required`.
- 32×32 menu: `revision-required`.
- 64×64 battle: `revision-required`.
- 64×64 showcase: `revision-required`.
- 64×64 portrait: `revision-required`.

## Accessory stress review

All eight Plastrong modules resolve against all four directions, producing 32 valid mount points. The automated stress matrix covers 28,800 combinations across five physiques, neutral/pumped/fatigue states, all battle actions, and all presentation contexts.

Manual conclusion:

- Anchor availability passes.
- Generic humanoid belts and chains remain rejected.
- Full accessory pixel art does not pass because most modules are not yet authored as visible species-specific pixels at every resolution.
- Fabric folds, chain links, strap routing, occlusion, and secondary motion remain required corrections.
- At 24×24, only one shell-identity module and one limb-support or ceremonial cue may be visible.
- Champion ribbon and shell chain are hidden at 24×24.
- Harness, belt, wraps, sleeves, and medal use simplified cues.
- Saved accessory IDs are never removed by the visual budget.

See [Accessory Priority Standard](ACCESSORY_PRIORITY_STANDARD.md).

## Cross-resolution identity

- Plastrong retains palette and shell identity, but 32px proportions are more horizontal than its 48px and 64px counterparts.
- Railhorn v3 has the strongest cross-resolution consistency of the batch.
- Cairnox retains palette and rigid-torso identity, but larger contexts do not yet add meaningful action or expression.
- Dome Warden retains character identity between tiers, but not enough tier-specific movement.
- No character changes species, age, or base archetype between contexts.
- Every missing authored profile falls back to a lower-resolution, hybrid, procedural, or safe placeholder path; no missing profile makes a character invisible.

## 24×24 sufficiency

The current 24×24 frame remains sufficient for:

- overworld locomotion;
- primary dome and plastron identity;
- planted stance;
- front/back/side recognition; and
- at most two prioritized accessory cues.

It is not sufficient for:

- full accessory stacks;
- fine seam-light gradients;
- portrait expression;
- detailed joint articulation; or
- physique and pose inspection.

Recommendation: keep 24×24 and its map/collision contract. Domed species require a specialized authored strategy, not a larger universal overworld frame.

## Required corrections before another approval gate

1. Re-author Plastrong battle actions and all named showcase poses.
2. Produce true portrait compositions for all four reviewed characters.
3. Author Plastrong accessory modules at 32px, 48px, and 64px; author simplified 24px cues.
4. Repeat Railhorn v3 extreme accessory review and fix its portrait.
5. Give Cairnox action-specific exposed-limb motion and weight transfer.
6. Give Dome Warden tier-specific posture, harness, expression, breathing, and timing.
7. Re-run native 1×, 2×, and 4× desktop and 390×844 review after correction.

Batch 04 should not use Batch 03 as a final art template until these corrections pass a new manual gate.
