# Gym Buddies Handcrafted Batch 03: Complete Domed Shells

## Status

Batch 03 is a review batch. No asset in this batch is approved or final.
The formal 2026-07-30 gate records 9 profiles as `review` and 12 as
`revision-required`; see
[DOME_SHELL_BATCH_03_REVIEW.md](DOME_SHELL_BATCH_03_REVIEW.md) and
[ASSET_APPROVAL_LEDGER.md](ASSET_APPROVAL_LEDGER.md).

- Asset version: `3.0.0`
- Asset status: profile-specific `review` or `revision-required`
- Primary species: Plastrong (`titan-tortoise`)
- Low-profile armored control: Railhorn (`ripped-rhino`)
- Rigid-torso/exposed-limb control: Cairnox (`boulder-bison`)
- Presentation-only Plastrong boss: Dome Warden (`dome-warden`)
- Gameplay content changed: none
- Save schema changed: none
- Stable species IDs changed: none
- Combat, progression, encounter, and physique calculations changed: none

Dome Warden is deliberately registered only in the character-art manifest. It is not added to the gameplay boss roster, schedule, rewards, or progression graph.

## Pipeline question and result

The Batch 03 pipeline can represent a complete domed shell without treating the shell as soft tissue, but it needs anatomy-specific authored rules.

The successful rules are:

1. Keep the dome and front plastron as separate rigid layers.
2. Expose flexible neck, shoulder, and hip openings between those rigid layers and the limbs.
3. Put pump, fatigue, and physique variation into exposed limbs, neck tissue, stance, posture, safe shell variants, and seam light.
4. Author left and right views independently. Mirroring a generic shell loses the front plastron edge and near/far limb order.
5. Mount equipment to named shell or limb anchors; do not infer its position from a generic humanoid belt line.
6. Preserve a fixed rigid-shell scale for pump and every boss tier.

The result remains recognizable in all four directions. At 24×24, the dome, plastron, neck, stance, and limb mass are readable. Fine seam paths, multiple accessories, subtle pump definition, and detailed joint articulation are not reliably readable and belong in 32-, 48-, and 64-pixel contexts.

## Character selection

### Plastrong

Plastrong is the complete-domed-shell reference. Its bodybuilding identity comes from a dense core, powerful exposed limbs, a thick but flexible neck, and a controlled planted stance. The upper dome stays visually rigid.

Direction responsibilities:

- Front: split front plastron, shoulder openings, neck opening, and planted forelimbs.
- Back: uninterrupted rear dome, structural seams, hip openings, and rear-limb support.
- Left: authored dome arc, front plastron edge, neck opening, and ordered near/far limbs.
- Right: separately authored inverse anatomy rather than a mirrored left frame.

### Railhorn v3

Railhorn is the low-profile armored control. It tests a shallow wedge carapace, projecting horn, low center of gravity, and armored mass that is wider than it is tall. The v3 candidate does not replace the revision-required v1 files; both remain in the manifest, with the review-status v3 candidate selected ahead of the older revision candidate.

### Cairnox

Cairnox is the rigid-torso/exposed-limb control. Its stacked stone torso does not expand. Physique and pump are communicated by pillar-limb thickness, stance, neck posture, and exposed joint tissue. Its four ground contacts are intentionally retained in side and front views.

### Dome Warden

Dome Warden is a Plastrong-derived presentation profile used to test boss-tier art. It is not gameplay content. The boss keeps one shell volume across:

- Normal
- Pumped
- Overload
- Final Round
- Defeated

Escalation uses posture, seam lighting, bracing equipment, expression, and animation intensity. Defeated lowers its head and equipment and dims its seams; it does not show cracks, wounds, or damage.

## Independent Plastrong layers

The runtime renderer and review isolation sheet define these stable layer IDs:

1. `upper-dome`
2. `front-plastron`
3. `shoulder-openings`
4. `hip-openings`
5. `neck-opening`
6. `flexible-joint-tissue`
7. `exposed-limb-musculature`
8. `shell-seams`
9. `equipment-mounts`
10. `pump-highlights`
11. `rare-trait-effects`

`upper-dome`, `front-plastron`, structural seams, and equipment mounts are rigid. Flexible openings, joint tissue, and exposed muscle are non-rigid. Highlight and rare-trait layers are effects and never modify the dome bounds.

## Physique presets

All three species retain their existing five stable cosmetic preset IDs. Batch 03 maps their fifth, species-specific preset to a review label without changing the saved ID:

- Compact
- Balanced
- Broad
- Specialized
- Dome Fortress for Plastrong
- Rail Drive for Railhorn
- Cairn Carry for Cairnox

Dome Fortress uses a safe broad-shell variant, thicker limbs and neck, wider openings, lower center of gravity, wider planted stance, and denser exposed musculature. It is not a uniform sprite scale.

The shell-width authoring envelope is 0.90–1.10 of the family reference, and shell height is limited to 0.94–1.06. Within those bounds, geometry resolves to discrete authored silhouettes rather than browser scaling.

## Accessory modules and anchors

Plastrong-specific modules:

- Shell-mounted belt
- Forelimb wraps
- Reinforced knee sleeves
- Training harness
- Shell chain
- Victory medal
- Champion ribbon
- Boss insignia

Each module has explicit front, back, left, and right anchors, producing 32 validated mounts. Wraps and sleeves mount to exposed limb musculature. The belt, harness, chain, medal, ribbon, and insignia mount to shell equipment hard points.

Generic belt and chain IDs are rejected for Plastrong because their humanoid anchor assumptions intersect the dome or float away from the shell.

## Pump and fatigue

Pump may change:

- Exposed limb highlight
- Neck highlight
- Flexible joint presentation
- Stance
- Muscle definition
- Shell-seam light

Pump cannot change:

- Dome width or height
- Plastron volume
- Rigid plate size
- Equipment hard-point coordinates

Fatigue lowers the head, bends the exposed limbs, narrows the stance, dims seams, and reduces animation intensity. It does not add shell cracks or injury marks.

## Multi-resolution deliverables

Runtime assets:

- 24×24 overworld strips for all four directions
- 32×32 menu direction sheets
- 48×48 battle action sheets for Plastrong, Railhorn, and Cairnox
- 64×64 Dome Warden battle tiers
- 64×64 showcase pose sheets
- 64×64 portraits
- 24×24 Dome Warden tier overlay

Every battle sheet contains:

- Neutral battle
- Attack preparation
- Shoulder Burst
- Iron Grind
- Snapping Hook
- Counter
- Stamina loss
- Near pin
- Victory
- Capture success
- Escape
- Defeat

Every showcase sheet contains:

- Front relaxed
- Back relaxed
- Front double biceps
- Back double biceps
- Side chest
- Side triceps
- Most muscular
- Abs and thigh
- Victory
- Fatigue

The v3 runtime PNG set contains 29 files. It is approximately 42 KB compressed and 3.27 MiB decoded if every Batch 03 image is resident simultaneously. The core overworld strips account for approximately 0.63 MiB decoded. Battle and showcase groups remain lazy-loaded by context, so normal overworld play does not decode the full set.

## Review deliverables

All review images are generated from the same React resolver and compositors used by the game:

- [Cross-resolution comparison](../client/art-source/review/batch-03-dome-shell/cross-resolution.png)
- [Silhouette sheet](../client/art-source/review/batch-03-dome-shell/silhouettes.png)
- [Armor-layer isolation](../client/art-source/review/batch-03-dome-shell/armor-layers.png)
- [Anchor diagrams](../client/art-source/review/batch-03-dome-shell/anchors.png)
- [Mobile previews](../client/art-source/review/batch-03-dome-shell/mobile.png)
- [Boss-tier comparison](../client/art-source/review/batch-03-dome-shell/boss-tiers.png)
- [Plastrong contact sheet](../client/art-source/review/batch-03-dome-shell/titan-tortoise-review-contact-sheet.png)
- [Railhorn v3 contact sheet](../client/art-source/review/batch-03-dome-shell/ripped-rhino-review-contact-sheet.png)
- [Cairnox contact sheet](../client/art-source/review/batch-03-dome-shell/boulder-bison-review-contact-sheet.png)
- [Dome Warden contact sheet](../client/art-source/review/batch-03-dome-shell/dome-warden-review-contact-sheet.png)

The development-only review route is `?debug=batch03-review`.

## Review findings

### Passed for review

- The Plastrong front, back, left, and right silhouettes differ.
- The front plastron is not drawn on the back view.
- The dome and plastron remain separate from flexible tissue.
- All five physique variants have distinct pixel signatures.
- Pump leaves the rigid dome and plastron signatures unchanged.
- Plastrong, Railhorn, and Cairnox maintain their palette and major identity across 24, 32, 48, and 64 pixels.
- Every side strip is authored and resolves without mirroring.
- Dome Warden maintains one shell scale across all five tiers.
- All v3 assets resolve as `review`, never `approved` or `final`.
- React and Phaser resolve the same asset keys, source frames, sizes, and fallback states.
- Missing v3 files fall back to procedural rendering instead of producing an invisible character.
- Asset paths are relative to the configured Gym Buddies base and remain compatible with GitHub Pages.

### Review limitations

- At 24×24, only one primary accessory plus one limb accessory can remain legible without obscuring the shell openings.
- Fine seam-light intensity differences collapse to a few pixels in the overworld view.
- The side-view plastron edge is readable, but it cannot show the same segmentation density as the 48- and 64-pixel art.
- The compact and balanced 24-pixel silhouettes rely more on stance and limb placement than on shell-width differences.
- Dome Warden battle tiers are readable at native scale, but the larger showcase comparison remains the stronger tier-inspection surface.
- These deterministic review assets establish structural rules and anchors; a final pixel artist still needs to refine facial expression, hand/foot anatomy, joint transitions, accessory fabric folds, attack-specific secondary motion, and rare-trait effects.

## Validation coverage

Automated checks cover:

- Domed-shell bounds
- Dome/plastron layer separation
- Joint-opening and exposed-limb visibility
- Explicit accessory mount bounds
- Generic accessory rejection
- Four distinct direction signatures
- Five distinct physique signatures
- Pump-invariant rigid-shell dimensions
- Boss-tier shell invariance
- Review-only manifest status
- Safe procedural fallback
- React/Phaser resolver parity
- Cross-resolution frame sizes
- GitHub Pages URL construction
- Runtime-file existence
- Representative PNG and review-sheet SHA-256 visual regression
- Desktop and 390-pixel-class browser review rendering

## 24×24 recommendation

Keep the existing 24×24 overworld frame. A larger universal overworld frame is not justified and would disrupt map scale, collision presentation, memory assumptions, and the approved sprite pipeline.

Full domed species do, however, need a specialized 24×24 authoring strategy:

1. Individually author all four directions.
2. Use discrete dome-safe physique variants.
3. Reserve a fixed outline budget for the dome arc and plastron edge.
4. Keep shoulder, hip, and neck openings at least one visible pixel.
5. Limit displayed overworld accessories by priority.
6. Move seam, pump, boss-tier, and accessory detail to menu, battle, and showcase contexts.

Therefore, 24×24 is sufficient for overworld identity, locomotion, posture, and the primary domed-shell read. It is not sufficient for complete anatomy inspection. Domed species should retain 24×24 while using the specialized authored strategy and higher-resolution context art introduced by this batch.

## Next art step

Do not promote Batch 03 automatically. The next step is a formal manual review of each resolution and pose, followed by targeted pixel corrections. Batch 04 should not begin until Plastrong’s side plastron edge, compact-versus-balanced overworld distinction, Dome Warden native battle scale, and accessory-priority rules have explicit reviewer decisions.
