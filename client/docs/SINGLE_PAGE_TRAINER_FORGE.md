# Single-Page Trainer Forge

## Outcome

Trainer Forge is now one fixed `100dvh` customization studio. The live pixel trainer remains mounted and visible while the player moves between body regions, cosmetics, poses, and gameplay attributes. The prior three-card, document-scrolling layout is no longer rendered.

This was a presentation and information-architecture migration. It did not change trainer appearance data, cosmetic IDs, the pixel renderer, physique math, gameplay muscles, saved-look payloads, randomization algorithms, save schemas, progression, or balance.

## Before and after

| Before | After |
| --- | --- |
| Large preview, customization, and journey-start cards in a scrolling page | Compact header, three-part studio workspace, and fixed action footer |
| Long tab panels containing broad control families | Body-region navigator plus contextual inspector groups |
| Physique presets inside the same scrolling build panel as sliders | Persistent compact preset rail in the left navigator |
| Gameplay muscles embedded below cosmetic build controls | Dedicated **Gameplay** inspector and physique level in the footer |
| Saved looks occupying a normal customization tab | Focus-trapped side drawer on desktop and bottom sheet on mobile |
| Randomizer filter permanently occupying toolbar space | Focus-trapped Randomize drawer |
| Journey start choices using a large third column | Compact opening selector and confirmation in the footer |

## Studio composition

- `TrainerStudioHeader` owns the wordmark, trainer name, current preset, undo, redo, Randomize, Saved Looks, current-section reset, and Help.
- `BuildNavigator` owns Quick/Detail mode, all existing physique presets, and the body-region map.
- `TrainerPreviewWorkbench` remains the single live preview instance. Inspector changes do not unmount it.
- `CustomizationInspector` routes the existing controls into Build, Face, Hair, Outfit, Colors, Accessories, Poses, and Gameplay contexts.
- `TrainerStudioFooter` owns pose, direction, gameplay physique level, validation, opening mode, cancel, and confirmation.
- `TrainerStudioDrawer` supplies focus trapping, Escape dismissal, backdrop dismissal, and focus restoration for secondary tools.

The studio uses the parent `TrainerCreationDraft` as its only authoritative draft. No parallel appearance state was introduced.

## Quick Forge

Quick Forge exposes all physique presets and ten silhouette controls:

1. Overall scale
2. Shoulder width
3. Chest
4. Upper back
5. Biceps
6. Waist
7. Quads
8. Body mass
9. Muscle definition
10. Posture

The ten controls are split into two five-control segments, **Upper frame** and **Balance and finish**, so mobile never exposes an oversized slider group. Face, Hair, Outfit, Colors, Accessories, Randomize, and confirmation remain one action away. Switching to Quick Forge never clears Detail Forge values.

## Detail Forge

Detail Forge enables the front/back body-region navigator and exposes every approved build control in groups of no more than six sliders. Regions select related controls instead of requiring the player to scan a long master list. Regions with more than six values use a compact secondary group strip.

The rendered controls still use the existing stable attribute IDs, ranges, labels, descriptions, update system, and normalized appearance object. Each range includes decrease, slider, numeric band, reset-this-control, and increase operations.

## Preview tools

The persistent preview supports:

- front, right, back, and left directions;
- the full existing bodybuilding pose catalog;
- creator, battle/showcase, and overworld scales;
- single, before/after, front/back, mirrored, silhouette, regional highlight, and posing-outfit comparison views;
- neutral, gym, and stage lighting;
- local reduced-motion preview and automatic rotation when motion is allowed.

The clothing comparison uses the existing non-explicit competition posing outfit. It does not remove clothing or alter the saved appearance.

## History, randomization, and saved looks

Undo and redo retain the existing 32-entry behavior. Preset application and randomization still enter the same history path. The Randomize drawer exposes the existing approved filters and calls the unchanged randomizer, so seeded outcomes and normalization remain compatible.

Saved Looks reuses the existing component and behavior: save, name, duplicate, rename, apply, compare, delete, appearance-only export, and validated appearance-only import. Applying a look does not touch gameplay progression.

Per-category randomization scopes were not added because the current randomizer defines complete-character outcomes. Introducing partial scopes would change approved randomization behavior and belongs in a separate systems task.

## Existing-trainer editing

Edit mode displays **Progress Preserved**, replaces journey start with **Save Appearance**, keeps cancel available, and removes the guided/normal choice. The destructive journey reset remains behind the Help/system-management drawer and its existing confirmation dialog.

Browser coverage verifies that saving an edited appearance preserves the active zone, team, caught Index entries, fatigue, momentum, visited zones, and accessibility state.

## Migration status

The new shell was built around existing state and controls, parity-tested, and then made the sole rendered Trainer Forge. The obsolete tabbed page composition is not shipped as a second production interface. There is no runtime route transition or duplicate appearance state to maintain.

## Known usability limits

- Face and outfit options remain compact native selects rather than authored thumbnail grids because no additional icon assets were approved for this UI-only pass.
- The current Randomize filters operate on whole valid appearances; partial category randomization is intentionally deferred.
- At 1024px desktop width, long preset names and top-bar tool names ellipsize and expose their complete meaning through accessible names or titles.
- Very long option collections rely on the inspector's internal scroll. The preview and confirm action remain fixed.

## Validation and bundle impact

The final production entry is 416.39 kB minified / 128.88 kB gzip. Relative to the immediately preceding single-screen journey build (405.45 kB / 126.09 kB), the complete Forge shell, navigation configuration, drawers, and inspector add approximately 10.94 kB minified and 2.79 kB gzip. The bundle guard still reports the entry 43.4% below its audited baseline, with all eight lazy boundaries intact and debug labels absent.

Final gates: TypeScript passed; 235 Vitest cases passed; the Playwright matrix finished with 60 passed and one intentionally skipped case; manifest and authored-sprite validation passed; the GitHub Pages refresh/offline cases passed; and the production build completed.
