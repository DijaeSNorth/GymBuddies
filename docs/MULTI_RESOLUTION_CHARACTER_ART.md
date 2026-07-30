# Gym Buddies Multi-Resolution Character Art

## Purpose

Gym Buddies uses the smallest authored sprite that materially improves a
character's readability in its current context. The existing 24×24 overworld
pipeline remains the authoritative movement representation and is never
replaced by a scaled battle or showcase asset.

## Context ladder

| Context | Logical frame | Intended use | Load group |
| --- | ---: | --- | --- |
| Overworld | 24×24 | movement, route encounters, map interactions | core |
| Menu | 32×32 | Buddy Index, party cards, compact selection | core |
| Battle | 48×48 | wild captures and standard arm-wrestling rounds | battle |
| Boss battle | 64×64 | Mat Watchman and future major bosses | battle |
| Showcase | 64×64 | Buddy customization, Physique Review, challenge cards | showcase |
| Dialogue | 64×64 static | major introductions where a portrait adds value | portrait |

The menu tier uses 32×32 rather than 40×40 because the pilot silhouettes and
key equipment remain readable at 32 pixels. The saved bytes and decoded-memory
reduction are more valuable than the small additional detail available at
40×40.

## Manifest contract

Each character presentation entry has a stable `characterId`, `speciesId`, and
the following optional profile fields:

- `overworldSpriteProfile`
- `menuSpriteProfile`
- `battleSpriteProfile`
- `showcaseSpriteProfile`
- `dialoguePortraitProfile`

Mat Watchman uses `home-watchman` as its character ID and retains
`brawny-bear` as its species ID. This allows Mat to share Bramblift cosmetics
and species anatomy while resolving distinct boss art.

Every authored profile declares a stable profile ID, image standard, ordered
asset candidates, frame order, and optional boss-tier row order. Runtime code
uses stable IDs and never treats manifest array position as identity.

## Fallback order

When the requested presentation asset is unavailable, selection proceeds:

1. authored art from the closest appropriate lower-resolution context;
2. the existing hybrid 24×24 resolver;
3. the existing procedural Buddy renderer;
4. a bounded safe placeholder.

Fallback drawing keeps the selected asset's native logical dimensions. A
missing 48×48 sprite therefore does not manufacture battle art by stretching
an overworld frame.

## Cosmetic continuity

All authored resolutions use the same marker palette slots:

- outline;
- primary;
- secondary;
- detail;
- accent.

The presentation compositor normalizes the same `BuddyCosmetics` object used
by the overworld renderer. Palette, pattern, appendage, accessory, physique
preset, muscle definition, pump, rare trait, and boss tier are presentation
inputs only; no alternate gameplay or save state is created.

## Loading and caches

- Overworld and menu assets are eligible for the core offline cache.
- Battle assets are requested only when a battle sprite mounts.
- Showcase assets are requested only when customization, review, or the debug
  gallery mounts.
- Portrait assets are requested only by portrait consumers.
- Art-source reference sheets never live below `public/` and are never copied
  into production output.
- Decoded presentation images use an LRU bounded by both entry count and
  estimated decoded RGBA bytes.
- Non-core decoded images are released when their final mounted consumer
  unmounts; subsequent use can decode them again from the browser HTTP cache.
- The service worker precaches only the four 32Ã—32 menu sheets from this
  presentation set. The twelve battle, showcase, and portrait sheets enter the
  runtime cache only after their first requested context.

## Pilot measurements

The validated v1 pilot set contains sixteen PNG sheets:

| Group | Files | Encoded bytes | Decoded RGBA bytes |
| --- | ---: | ---: | ---: |
| Menu 32Ã—32 | 4 | 2,205 | 65,536 |
| Standard battle 48Ã—48 | 3 | 4,731 | 331,776 |
| Mat battle 64Ã—64, five tiers | 1 | 11,981 | 983,040 |
| Showcase 64Ã—64 | 4 | 16,730 | 1,310,720 |
| Portrait 64Ã—64 | 4 | 1,854 | 65,536 |
| **Total** | **16** | **37,501** | **2,756,608** |

The decoded presentation cache is capped at twelve entries and 4 MiB. The
complete current pilot set is 2.63 MiB decoded, but the entry cap still forces
old sheets out when every context is inspected. Battle, showcase, and portrait
art accounts for 35,296 encoded bytes and is absent from the initial
precache.

## React and Phaser

React and Phaser call the same pure presentation resolver. React owns DOM and
canvas display. Phaser may preload only the requested context keys; entering an
overworld scene does not queue battle or showcase art. Neither presentation
layer owns cosmetics, progression, captures, or saves.

## Pilot coverage

- Bramblift: 24×24 overworld, 32×32 menu, 48×48 battle, 64×64 showcase and
  portrait.
- Rivetjack: 24×24 overworld, 32×32 menu, 48×48 battle, 64×64 showcase and
  portrait.
- Prismantle: 24×24 overworld, 32×32 menu, 48×48 battle, 64×64 showcase and
  portrait.
- Mat Watchman: Bramblift-based 24×24 overworld fallback, 32×32 menu, 64×64
  five-tier battle and showcase sheets, and a 64×64 portrait.

## Validation

Release validation covers profile references, asset standards, frame bounds,
marker palette compatibility, context selection, fallback order, cosmetic
signatures, React/Phaser parity, lazy network requests, cache limits, decoded
memory, mobile rendering, and GitHub Pages base-path resolution.

The v1 sheets remain manifest status `review`: they are production-safe,
original pilot art with pinned hashes, but a final pixel artist may refine
anatomy, facial acting, cloth folds, and Mat Watchman's equipment without
changing the runtime contract or stable IDs.

## Resolution recommendation

Keep 32Ã—32 for compact menus, 48Ã—48 for standard captures, and 64Ã—64 for
bosses and deliberate physique inspection. At the measured 37,501 encoded
bytes, moving regular battles to 64Ã—64 would spend more sheet area and decoded
memory without enough additional readability at the 240Ã—160 playfield.
Likewise, reducing showcases to 48Ã—48 would make back, core, expression, and
accessory differences harder to inspect. The current split is the smallest
useful set for the pilot.
