# Gym Buddies Pixel-Art Asset Pipeline

## Goals

The asset pipeline gives every runtime asset a stable key, a declared format, an expected frame layout, and a validation path. It supports original placeholders now and allows final art to replace them without changing gameplay code.

The pipeline is intentionally separate from simulation. Asset definitions describe presentation files only; Buddy stats, machine balance, encounters, and saves do not depend on PNG layout.

Trainer, NPC, leader, rival, Buddy, and boss placeholders may be assembled by
the procedural modular renderers while final sheets are in production. Trainer
frames use a 28×36 bottom-center anchor; Buddy frames use a 24×24 bottom-center
anchor. Buddy modules are layered as shadow, body, muscle, marking, appendage,
accessory, face, and effect. Final PNG replacements must preserve those anchors,
stable manifest keys, direction order, and species silhouette identity.

The development character gallery is available at `?debug=characters`. Review
every body archetype, direction, pose, outfit module, Buddy variation, and boss
design there before promoting replacement art from `review` to `final`.

## Runtime layout

Runtime files live under:

```text
client/public/assets/gym-buddies/
  trainer/
  buddies/
    bosses/
  environments/
  gym-machines/
  ui/
  effects/
  audio/
```

These folders map directly to the manifest categories:

| Manifest category | Folder | Content |
| --- | --- | --- |
| `trainer` | `trainer/` | Customizable trainer sheets |
| `buddies` | `buddies/` | Buddy overworld sheets, battle portraits, and boss portraits |
| `environments` | `environments/` | Tiles, props, backgrounds, and environmental animation |
| `gym-machines` | `gym-machines/` | Machine animation sheets |
| `ui` | `ui/` | Original interface icons and cursors |
| `effects` | `effects/` | Training, capture, transition, and battle effects |
| `audio` | `audio/` | Original music and sound files |

Do not place source documents, editor autosaves, layered working files, or export scratch files in the runtime tree.

## Manifest

The canonical registry is:

`client/src/game/assets/asset-manifest.json`

Each asset declares:

- A stable lowercase key such as `buddy.brawny-bear.overworld`.
- One category.
- A category-relative runtime path.
- A sprite or audio standard.
- A limited palette for images.
- A lifecycle status: `placeholder`, `review`, or `final`.
- A short purpose description.

Stable keys are public runtime identity. Once code or saved content refers to a key:

- Do not rename it merely because the filename changes.
- Do not reuse it for a different character or purpose.
- Update only its path when replacing or moving the associated file.
- Add a new key when the semantic asset is different.

`contentBindings.ts` records the current vertical-slice relationships between content IDs and asset keys. Its tests reject unknown content IDs and missing manifest keys.

## Sprite standards

All sheets use transparent PNG, RGBA color, nearest-neighbor display, whole-pixel positioning, and no padding outside the declared frame cells.

### Trainer overworld

- Runtime source frame: 28 × 36 logical pixels.
- Overworld draw scale: 0.5, producing an approximately 14 × 18 footprint.
- Direction order: front, back, left, right.
- Pose set: idle, walking, running, training, victory, fatigue, capture, and
  boss introduction.
- Anchor: bottom-center at the feet.
- Default preview timing: 280 ms per frame; running uses 150 ms.
- Palette: stable curated color IDs resolved to limited pixel colors.
- Construction: twelve ordered procedural layers with discrete body modules.
- Cache: bounded to 512 complete direction/pose/appearance combinations.

The trainer silhouette, outfit proportions, frame bounds, and foot anchor must
remain consistent across every generated frame. Clothing uses the current body
geometry rather than one stretched overlay. Palette customization does not
require separate sheets for each color combination.

The original 16 × 16 base sheet remains a manifest-validated fallback and
palette-pipeline reference. It is not the current character-creation renderer.

### Buddy overworld

- Frame: 16 × 16 pixels.
- Sheet: one horizontal four-frame strip, 64 × 16 pixels total.
- Anchor: bottom-center.
- Default timing: 180 ms per frame.
- Animation intent: idle, anticipation, exertion, settle.

Buddy silhouettes must be readable at 1× and distinguishable without color. Larger species may use a future 24 × 24 standard, but that requires a new standard ID rather than silently changing this one.

### Battle portraits

- Frame and sheet: 48 × 48 pixels.
- Anchor: center.
- Pose: upper-body or full silhouette chosen for arm-wrestling readability.
- Keep facial features and identifying shapes away from the outer two-pixel safe edge.

Battle portraits are not enlarged overworld sprites. They are purpose-built portraits using the same character language and palette family.

### Machine animations

- Frame: 16 × 24 pixels.
- Sheet: one horizontal four-frame strip, 64 × 24 pixels total.
- Anchor: bottom-center.
- Default timing: 120 ms per frame.
- Animation intent: ready, load, peak, release.

The machine base and interaction point remain stationary. Moving handles, plates, cables, or pads must share one anchor across the entire strip.

### Boss portraits

- Frame and sheet: 64 × 64 pixels.
- Anchor: center.
- Safe edge: four pixels.
- Boss identity should come from original posture, equipment, training motif, and shape language—not from copied creature silhouettes.

Boss portraits can use the Kinetic Slate palette with one approved zone remap. They should not introduce an unrestricted full-color palette.

### Environment, UI, and effects

- Base environment tile: 8 × 8 pixels.
- UI icon: 8 × 8 pixels.
- Standard effect frame: 16 × 16 pixels.
- Normal effect strips use six horizontal frames at 70 ms per frame.

If an asset cannot fit a current standard without distortion, define a new named standard in the manifest. Do not modify a shared standard to accommodate a single exception.

## Palettes

The default environment, Buddy, UI, and effect palette is Kinetic Slate:

```text
#061519  Midnight
#0C2B2F  Deep Teal
#285057  Iron
#B9D8C4  Mist
#EEF2D0  Chalk
#68D39B  Mint
#EF6A5B  Coral
#F2C14E  Amber
```

Normal sprites should stay within one declared palette plus transparency. A reviewed zone-specific palette may replace functional accents, but health, warning, focus, and navigation colors must remain understandable.

### Trainer palette swaps

The base trainer sheet uses exact marker colors:

| Slot | Marker |
| --- | --- |
| Outline | `#061519` |
| Hair | `#18343A` |
| Skin | `#F2C38B` |
| Top | `#EF6A5B` |
| Shoes | `#285057` |
| Glove | `#68D39B` |
| Highlight | `#EEF2D0` |

`paletteSwap.ts` replaces exact RGB marker matches while preserving alpha and
unrelated pixels for imported or fallback sheets. The modular runtime renderer
resolves the same palette roles from stable IDs before drawing. Final imported
trainer sheets must use the markers exactly—do not antialias,
color-profile-shift, or partially blend them.

## Original placeholders

The checked-in placeholders are deterministic, code-generated pixel art. They use geometric training motifs and do not trace or derive from third-party sprites.

Generate missing placeholders with:

```powershell
npm run assets:generate-placeholders
```

The generator:

- Reads the manifest.
- Writes only entries marked `placeholder`.
- Creates directories when needed.
- Preserves every existing file by default.
- Generates transparent PNG strips and short original WAV cues.

To deliberately regenerate existing placeholder files:

```powershell
npm run assets:generate-placeholders -- --force
```

Never use forced regeneration after an entry has been changed to `review` or `final`. The generator always skips non-placeholder entries even when `--force` is supplied.

## Creating and importing final PNG sheets

1. Select one approved in-game seed frame with the final silhouette, palette family, outfit, and proportions.
2. Produce the entire animation as one strip. Do not generate or commission unrelated frames independently.
3. Keep the same character, facing direction, silhouette family, palette family, readable features, and outfit proportions in every cell.
4. Normalize the full strip with one shared scale and one shared anchor, normally bottom-center.
5. If continuity is important, restore frame one from the approved shipped seed after normalization.
6. Export a transparent RGBA PNG at the manifest's exact sheet dimensions.
7. Disable resampling, smoothing, color reduction, and automatic trimming during export.
8. Place the PNG at the registered path under `client/public/assets/gym-buddies/`.
9. Preview it at 1× and enlarged nearest-neighbor scales.
10. Change the manifest status from `placeholder` to `review`.
11. Run asset validation, typecheck, tests, and the production build.
12. After visual approval in-engine, change the status to `final`.

Replacing a placeholder does not require changing its stable key or gameplay content ID.

## Adding a new asset

1. Add one manifest entry with a new stable key.
2. Reuse a standard only when its geometry and anchor genuinely match.
3. Add or select a limited palette.
4. Add a content binding if gameplay content will refer to the asset.
5. Add the PNG or WAV file, or generate an original placeholder.
6. Run:

```powershell
npm run assets:validate
npm run typecheck
npm test
npm run build
```

The production build automatically runs focused asset validation first.

## Validation

`npm run assets:validate` checks:

- Duplicate keys and paths.
- Stable key syntax.
- Category and folder agreement.
- Path traversal and unsupported extensions.
- Missing standards and palettes.
- Invalid frame geometry.
- Broken content bindings.
- Missing files.
- PNG signatures and exact sheet dimensions.
- WAV signatures and declared sample rates.
- Trainer palette-swap behavior.

The browser performs structural manifest validation in the asset viewer. Filesystem checks remain in the Node test because the browser cannot inspect the public directory.

## Development asset viewer

Start the normal development server:

```powershell
npm run dev
```

Open:

```text
http://localhost:5173/?debug=assets
```

The viewer provides:

- Search and category filtering.
- Stable keys, paths, status, standards, sheet sizes, and anchors.
- Nearest-neighbor PNG previews.
- WAV playback.
- Trainer palette-swap previews.
- Structural manifest health.

The route is gated by `import.meta.env.DEV`. A production build ignores `?debug=assets` and renders the normal game. Do not add development-only state or controls to save data.

## Originality and provenance

- Do not copy, trace, recolor, or silhouette-match sprites from Pokémon or any other game.
- Do not use third-party sprite sheets as pose, proportion, animation, or layout templates.
- Generic technical constraints such as 16 × 16 frames are allowed; distinctive artistic expression is not.
- Record the creator and license for commissioned or licensed work before changing an asset to `final`.
- Reject assets whose origin cannot be established.
- Audio must be original or explicitly licensed for the project. Never approximate or interpolate a recognizable melody.

Before approval, inspect every strip at 1×, compare frame bounds and anchors, and review it in the game rather than approving a large standalone image.
