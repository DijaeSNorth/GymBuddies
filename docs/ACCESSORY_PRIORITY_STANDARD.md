# Gym Buddies Accessory Priority Standard

## Purpose

This standard prevents modular equipment from overwhelming a character at small authored resolutions. It is a presentation rule only: it does not remove saved cosmetic IDs, change equipment bonuses, or alter gameplay.

The first covered anatomy is Plastrong's complete domed shell. The same priority model may be adapted for later species, but anchor slots and visibility rules must remain species-specific.

## 24×24 budget

At overworld size, Plastrong may show at most:

- one shell-identity module; and
- one limb-support or ceremonial cue.

This is a two-module visual budget, not a two-item inventory limit. Lower-priority equipment remains saved and returns in menu, battle, showcase, and portrait contexts.

Priority order:

| Accessory | Priority | Slot | 24×24 treatment | Reason |
| --- | ---: | --- | --- | --- |
| Boss insignia | 1 | shell identity | full | Boss identity must survive reduction. |
| Shell-mounted belt | 1 | shell identity | simplified | One shell band is readable without crossing hip openings. |
| Forelimb wraps | 1 | limb support | simplified | One contrasting limb cue remains readable. |
| Training harness | 2 | shell identity | simplified | Show only the central mount; straps need more pixels. |
| Reinforced knee sleeves | 2 | limb support | simplified | Show one knee cue only if the limb slot is free. |
| Victory medal | 2 | ceremonial | simplified | Reduce to one medal glint during victory presentation. |
| Champion ribbon | 3 | ceremonial | hidden | Ribbon folds cover the shell edge at 24×24. |
| Shell chain | 4 | ceremonial | hidden | Links and joint clearance are not legible at 24×24. |

For equal priorities, stable accessory ID ordering resolves the winner. This makes the result deterministic across React, Phaser, saves, and tests.

## 32×32 and larger

Menu, battle, showcase, and dialogue contexts may request the full authored modules. Their renderers must still:

- mount only to the 32 explicit species anchors;
- keep neck, shoulder, and hip openings visible;
- reject humanoid generic belts and chains;
- preserve the rigid dome and plastron bounds;
- preserve near/far limb order in side views;
- keep the bottom-center anchor and ground line stable; and
- fall back safely if a module is missing.

Permission to request a full module is not art approval. Batch 03 currently provides validated anchor positions but not final authored fabric, chain-link, strap, and fold pixels for every combination.

## Simplification rules

Simplified art must retain the item's category, not its full detail:

- Belt: one uninterrupted shell-mounted band; never a floating waist line.
- Harness: central mount only; omit unreadable straps.
- Wraps: one contrasting pixel cluster on the exposed forelimb.
- Knee sleeves: one stable cue on the limb, clear of the hip opening.
- Medal: a single glint; omit the ribbon loop.
- Boss insignia: a high-contrast identity mark that does not replace shell seams.

Hidden modules must not leave detached pixels, shadows, or empty attachment lines.

## Conflict rules

1. Boss identity wins the shell-identity slot.
2. Species-safe mounts win over generic cosmetic placement.
3. Joint visibility wins over equipment completeness.
4. The shell outline wins over decorative silhouette growth.
5. The character's stable markings win over optional accessories.
6. Fatigue, pump, and boss-tier effects do not reorder accessories.
7. When a module cannot be simplified safely, hide it and preserve its saved ID.

## Review and validation

The formal review deck at `?debug=batch03-review` shows:

- all eight accessory rules;
- every front, back, left, and right mount;
- the chosen 24×24 treatment;
- the full-module policy for larger contexts; and
- the resolution-specific approval ledger.

Automated validation covers all 32 mount points and 28,800 combinations of accessory, direction, physique preset, pump/fatigue state, battle action, and presentation context. This proves deterministic selection and safe anchor availability; it does not substitute for a human pixel-art review.

Implementation: `client/src/game/assets/accessoryPriority.ts`.
