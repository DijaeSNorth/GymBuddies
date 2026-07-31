# Gym Buddies Asset Approval Ledger

## Gate rules

- Valid statuses are `placeholder`, `review`, `revision-required`, `approved`, and `final`.
- Automated validation never promotes an asset.
- Approval is profile- and resolution-specific.
- A review asset may move to `approved` only after a recorded manual gate.
- An asset may never move directly from `review` to `final`.
- Procedural fallback remains enabled until the corresponding authored profile is approved and stable.

## Batch 03 formal gate

Review date: 2026-07-30
Asset version: `3.0.0`
Reviewer: Codex visual review using generated native-scale contact sheets
Result: 9 `review`, 12 `revision-required`, 0 `approved`, 0 `final`

| Character | Profile | Resolution | Status | May ship in alpha | Fallback | Known limitation / required correction |
| --- | --- | --- | --- | --- | --- | --- |
| Plastrong | Overworld | 24×24 | review | yes | enabled | Compact/Balanced are close; strengthen side plastron and preset stance. |
| Plastrong | Menu | 32×32 | review | yes | enabled | Reconcile horizontal menu proportions with taller battle/showcase anatomy. |
| Plastrong | Battle | 48×48 | revision-required | no | enabled | Re-author action-specific limb drive, neck angle, stance, and plastron perspective. |
| Plastrong | Showcase | 64×64 | revision-required | no | enabled | Named poses need clearly different limb flex, shell perspective, and posture. |
| Plastrong | Portrait | 64×64 | revision-required | no | enabled | Replace full-body card framing with an expression-led portrait. |
| Railhorn v3 | Overworld | 24×24 | review | yes | enabled | Repeat extreme accessory pass and separate Broad from Specialized. |
| Railhorn v3 | Menu | 32×32 | review | yes | enabled | Open shoulder gaps and clarify chest segmentation. |
| Railhorn v3 | Battle | 48×48 | review | yes | enabled | Refine front actions, fatigue, facial tells, pump seams, and equipment clearance. |
| Railhorn v3 | Showcase | 64×64 | review | yes | enabled | Refine flexible joints, dorsal depth, fatigue weight shift, and equipment motion. |
| Railhorn v3 | Portrait | 64×64 | revision-required | no | enabled | Author a close, expressive portrait with horn clearance. |
| Cairnox | Overworld | 24×24 | review | yes | enabled | Clarify front/back mass and preset distinction without scaling the torso block. |
| Cairnox | Menu | 32×32 | review | yes | enabled | Strengthen limb contrast, rear markings, and side depth. |
| Cairnox | Battle | 48×48 | revision-required | no | enabled | Twelve actions currently share one silhouette; author limb drive and torso control. |
| Cairnox | Showcase | 64×64 | revision-required | no | enabled | Create species-specific poses through limb spread, torso angle, and weight shift. |
| Cairnox | Portrait | 64×64 | revision-required | no | enabled | Author close facial, horn-base, stone-texture, and neck-transition detail. |
| Dome Warden | Overworld base | 24×24 | review | no | enabled | Shared Plastrong base needs boss-safe overlays before any gameplay use. |
| Dome Warden | Boss-tier overlay | 24×24 | revision-required | no | enabled | Increase posture, harness, limb bend, expression, and timing differences. |
| Dome Warden | Menu | 32×32 | revision-required | no | enabled | Harness and insignia are not sufficiently readable at native scale. |
| Dome Warden | Battle | 64×64 | revision-required | no | enabled | Add tier- and action-specific secondary motion without scaling the dome. |
| Dome Warden | Showcase | 64×64 | revision-required | no | enabled | Escalation needs stronger stance, neck, harness, limb, and Defeated posture changes. |
| Dome Warden | Portrait | 64×64 | revision-required | no | enabled | Replace full-body framing with an expressive boss introduction portrait. |

The authoritative machine-readable ledger is `client/src/game/assets/batch03FormalReview.ts`. Each receipt records the exact asset keys, version, review date, reviewer note, known limitation, correction, fallback status, and alpha decision.

## Railhorn version decision

Railhorn v3 remains the preferred review alternative because it improves horn clearance, side action silhouettes, pose variety, and plate taper over Batch 02 v1. Batch 02 v1 remains in the manifest as `revision-required`; it is not deleted or overwritten. V3 has not replaced v1 as an approved production standard because the v3 portrait and complete accessory stress art still require revision.

## Shipping interpretation

`May ship in alpha: yes` means the profile is readable enough for internal or public alpha testing while procedural fallback remains available. It does not mean approved final art. Dome Warden is presentation-only and may not enter gameplay regardless of visual status.
