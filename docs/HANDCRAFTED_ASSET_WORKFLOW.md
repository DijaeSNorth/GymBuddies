# Gym Buddies Handcrafted Asset Workflow

## Goal

This workflow replaces Buddy art one species at a time without destabilizing
gameplay, customization, saves, React, Phaser, or GitHub Pages. An authored
asset is additive: the procedural renderer remains available until the
replacement is complete and validated.

## Pilot scope

The current pilot includes:

- Bramblift (`brawny-bear`), broad-mammal hybrid;
- Rivetjack (`iron-wolf`), lean-quadruped hybrid;
- Prismantle (`prismantle`), winged-mythic handcrafted base;
- Mat Watchman (`home-watchman`), a five-tier Bramblift boss overlay.

The v2 pilot PNGs are final runtime assets. The retained v1 PNGs remain review
assets for rollback and comparison. The resolver ranks `final`, `approved`,
and `review` candidates in that order before using the procedural fallback.
Placeholder assets remain visible in development tools but are never promoted
into production resolution.

## Source-reference generation

Reference sheets were generated as complete character pose sheets rather than
as unrelated isolated frames. Each prompt required:

- one original named Gym Buddies character;
- the complete state order;
- a consistent bottom-center anchor;
- a limited original palette;
- hard pixel edges;
- a flat `#ff00ff` chroma background;
- no franchise imitation, logos, text, or copied silhouettes.

The generated reference PNGs are stored in
`client/art-source/pilot/`. They are not loaded by the game. Runtime pilot
sprites are deterministic, indexed, exact-size PNGs generated from the local
authoring script.

## Project-local tools

| Tool | Purpose |
| --- | --- |
| `scripts/sprites/build_sprite_edit_canvas.py` | Places an approved seed in a multi-slot transparent edit canvas |
| `scripts/sprites/chroma_key_transparency.py` | Removes an exact flat authoring background |
| `scripts/sprites/normalize_sprite_strip.py` | Applies one shared scale and bottom-center alignment to a whole strip |
| `scripts/sprites/render_sprite_preview_sheet.py` | Builds a checkerboard review contact sheet |
| `scripts/generate-pilot-sprite-strips.mjs` | Rebuilds exact-size indexed pilot runtime strips |
| `scripts/generate-final-pilot-sprite-strips.mjs` | Rebuilds the versioned final v2 pilot strips |
| `scripts/validate-authored-sprites.mjs` | Validates dimensions, alpha bounds, ground line, frame occupancy, profiles, and mirror safety |

The Python utilities require Pillow. Use a project-approved Python environment;
do not add Pillow to the browser runtime.

## Authoring sequence

### 1. Lock the species contract

Before drawing, record:

- species stable ID;
- anatomy family;
- protected silhouette features;
- renderer mode;
- asymmetrical features;
- physique preset strategy;
- direction requirements;
- equipment and appendage anchors;
- rare and boss requirements.

### 2. Approve a seed

Choose an idle frame with a clear silhouette and readable negative space.
Verify it at 1× and 4×. Do not proceed from a seed that clips or loses the
species at 24×24.

### 3. Build one whole strip

Create the complete 12-state strip for one direction in a single coordinated
pass. Keep character scale, proportions, outline thickness, and anchor stable
across all slots.

Example edit-canvas command:

```text
python scripts/sprites/build_sprite_edit_canvas.py --seed seed.png --out work/front-edit.png --frames 12 --slot-size 64 --canvas-size 1024
```

### 4. Remove the authoring key

For a flat magenta source:

```text
python scripts/sprites/chroma_key_transparency.py --input raw.png --out transparent.png --key ff00ff --tolerance 0
```

Use tolerance `0` for indexed art. A nonzero tolerance can erase legitimate
colors and requires visual review.

### 5. Normalize the whole strip

Use one shared scale across all frames. Never fit every slot independently.

```text
python scripts/sprites/normalize_sprite_strip.py --input transparent.png --out-dir work/front-frames --frames 12 --frame-size 24
```

If an approved frame must remain exact, use `--anchor` with `--lock-frame1`.

### 6. Inspect a preview

```text
python scripts/sprites/render_sprite_preview_sheet.py --frames-dir work/front-frames --out work/front-review.png --columns 6 --gap 8
```

Review the contact sheet at:

- 1× native size;
- 2× and 4×;
- light background;
- dark background;
- checkerboard alpha background;
- 240×160 game context.

### 7. Assemble runtime strips

Place the 24 final frames in the order defined by
`docs/SPRITE_STRIP_STANDARD.md`. Use the exact marker palette for customizable
regions.

The pilot can be rebuilt with:

```text
npm run sprites:generate-pilots
npm run sprites:generate-final-pilots
```

### 8. Register stable assets

Add image entries and a species profile to
`client/src/game/assets/asset-manifest.json`. Never use array position as a
runtime identity.

Select the renderer mode:

- `procedural`: no authored base is required;
- `hybrid`: authored base plus modular procedural or authored overlays;
- `handcrafted`: authored base is required, with procedural fallback only for
  missing or invalid runtime files.

Always set:

- anatomy family;
- directional base keys;
- versioned candidate keys in preferred order;
- safe mirror policy;
- asymmetry IDs;
- layer bindings;
- procedural fallback.

### 9. Validate

```text
npm run typecheck
npm run assets:validate
npm run sprites:validate
npm run test:unit -- src/tests/buddySpritePipeline.test.ts
npm run test:e2e -- e2e/sprite-strip-lab.pw.ts
npm run build
```

Do not promote an asset to `final` while any check fails.

### 10. Review in the Sprite Strip Lab

Start development and open:

```text
?debug=sprites
```

The lab is development-only. It can:

- select species, physique preset, direction, pose, and renderer;
- toggle every layer group;
- display frame bounds and the anatomy anchor;
- preview at 1×, 2×, 4×, and 6×;
- compare procedural and authored results;
- test route, gym, battle, light, dark, and checker backgrounds;
- isolate a silhouette-only view;
- export a review contact sheet.

## Fallback behavior

The resolver selects an authored base only when:

- the species profile requests hybrid or handcrafted rendering;
- the direction has an authored strip or a safe mirror;
- the asset key exists;
- the image loads;
- the sheet dimensions are exactly 576×24.

Any failure immediately renders the existing procedural sprite. Valid saves are
never changed or deleted. Cosmetic normalization still uses stable option IDs.

## React and Phaser use

Both presentation layers consume the same pure `ResolvedBuddySpriteFrame`.
React composites the frame into a 24×24 canvas. Phaser can preload the same
manifest keys and uses the same source-frame receipt. Neither layer owns Buddy
progression or save state.

## GitHub Pages

All runtime URLs resolve through `import.meta.env.BASE_URL` and the manifest
base path. Do not add root-relative `/assets/...` references.

## Promotion to final

Every `approved` or `final` asset also records an asset version, approval date,
artist source, and reviewer note. Change `status` from `review` to `final` only
after:

- a human pixel artist approves the silhouette and animation;
- all directions and poses pass;
- every physique preset remains distinct;
- accessories and appendages remain attached;
- mobile playtesting confirms readability;
- originality review is complete;
- the source and license record is present.
