# Gym Buddies Sprite Strip Standard

## Status

This document defines the production contract for replacing the procedural
24×24 Buddy renderer with authored pixel art incrementally. The procedural
renderer remains the required fallback until an authored profile passes every
validation check.

The Bramblift, Rivetjack, Prismantle, and Mat Watchman v2 pilot sheets are
marked `final`. Their v1 sheets remain marked `review` for rollback and visual
comparison. This is not a claim that the full roster has final art.

The production runtime ranking is `final` → `approved` → `review` →
procedural fallback. Placeholder entries remain available to development
preview tools but are not selected as authored production bases. Candidate
order breaks ties. `approved` and `final` entries must provide `assetVersion`,
`approvalDate`, `artistSource`, and a `reviewerNote`.

## Runtime frame

| Property | Standard |
| --- | --- |
| Logical frame | 24×24 RGBA PNG |
| Runtime scale | Integer nearest-neighbor only |
| Origin | Bottom-center |
| Pivot | x 12, y 21 |
| Ground line | y 21 |
| Safe border | At least one transparent pixel on top, left, and right |
| Alpha | Straight transparent RGBA; no chroma color in shipped PNG |
| Base strip | 24 frames, 576×24 |
| Boss tier overlay | 5 frames, 120×24 |

Frames must never be scaled non-uniformly to simulate a larger chest, back,
limb, shell, wing, or other physique region. Major shape changes use authored
replacement modules or additional frames.

## Pose and frame order

Every directional base strip contains two frames for each state in this exact
order:

| Frames | Pose | Default frame duration |
| --- | --- | --- |
| 0–1 | idle | 300 ms |
| 2–3 | walking | 170 ms |
| 4–5 | running | 120 ms |
| 6–7 | training | 200 ms |
| 8–9 | fatigue | 420 ms |
| 10–11 | capture | 180 ms |
| 12–13 | victory | 260 ms |
| 14–15 | front flex | 320 ms |
| 16–17 | back flex | 320 ms |
| 18–19 | side pose | 300 ms |
| 20–21 | boss entrance | 220 ms |
| 22–23 | rare entrance | 200 ms |

The authoritative values live in
`client/src/game/assets/asset-manifest.json`. A generic legacy `entrance` cue
maps to `rare-entrance`; the save format and gameplay cue IDs are unchanged.

## Direction standard

The standard directions are:

1. Front
2. Back
3. Left
4. Right

Right may mirror the left strip only when all of the following are true:

- the profile explicitly sets `mirrorRightFromLeft`;
- `asymmetricFeatureIds` is empty;
- markings, equipment, appendages, and expressions remain semantically correct
  when mirrored;
- the validator reports no unsafe mirror issue.

Prismantle has authored left and right strips because its offset prism fins are
intentionally asymmetric. A species with a one-sided scar, logo, horn, fin,
tool, or marking must also author both sides.

## Layer order

The runtime composites these layers from back to front:

1. `shadow`
2. `base-body`
3. `physique-overlay`
4. `appendage-variant`
5. `marking`
6. `equipment`
7. `accessory`
8. `expression`
9. `pump`
10. `rare-trait`
11. `boss-tier`

Every layer uses the same 24×24 frame, bottom-center pivot, direction, pose,
and frame number as the base. An overlay must not introduce its own local
ground line.

The hybrid renderer combines authored base strips with modular overlays.
Bramblift, Rivetjack, and Prismantle v2 use pilot-specific physique modules so
species anatomy is preserved; the remaining markings, appendages, accessories,
expressions, pump effects, and rare traits continue through the shared modular
renderer.

## Marker palette

Pilot authored bases use exact marker colors before runtime palette swapping:

| Slot | Marker |
| --- | --- |
| Outline | `#061519` |
| Primary | `#68d39b` |
| Secondary | `#285057` |
| Detail | `#eef2d0` |
| Accent | `#f2c14e` |

Only exact RGB matches are swapped. Alpha is preserved. Artists may use other
colors for fixed details, but those colors will not be customizable.

## Naming

Runtime asset keys:

```text
buddy.<species-id>.authored.front
buddy.<species-id>.authored.back
buddy.<species-id>.authored.left
buddy.<species-id>.authored.right
boss.<boss-id>.authored.tiers
buddy.<species-id>.authored.v<version>.<direction>
boss.<boss-id>.authored.v<version>.tiers
```

Runtime paths:

```text
client/public/assets/gym-buddies/buddies/handcrafted/<species-id>/base-<direction>.png
client/public/assets/gym-buddies/buddies/handcrafted/bosses/<boss-id>-tiers.png
client/public/assets/gym-buddies/buddies/handcrafted/<species-id>/versions/v<version>/base-<direction>.png
client/public/assets/gym-buddies/buddies/handcrafted/bosses/versions/v<version>/<boss-id>-tiers.png
```

Source references that are not loaded by the game live under:

```text
client/art-source/pilot/
```

They must never be referenced as runtime URLs.

## Acceptance checks

An authored strip is accepted only when:

- its manifest key and file path are stable and unique;
- dimensions match its declared standard;
- every required pose frame contains visible pixels;
- the sprite remains inside its 24×24 frame;
- no frame touches the top, left, or right edge;
- no frame crosses the y 21 ground line;
- the same pivot is used in every direction;
- animation timing is declared;
- required accessory and appendage anchors exist in the anatomy family;
- mirroring is explicitly safe;
- the procedural fallback resolves when an authored file is unavailable;
- the sprite loads through the Vite application base URL.

Run:

```text
npm run sprites:validate
npm run assets:validate
npm run test:unit -- src/tests/buddySpritePipeline.test.ts
```
