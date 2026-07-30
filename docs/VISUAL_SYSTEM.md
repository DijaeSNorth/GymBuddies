# Gym Buddies Visual System

## Purpose

Gym Buddies uses the constraints of handheld pixel games as a compositional tool, not as a template from another franchise. The presentation should feel energetic, tactile, and gym-built: clipped training-plate silhouettes, offset seams, pulse marks, compact instrumentation, and a restrained color system.

The current presentation layer is an incremental bridge. React owns the accessible shell, dialogue, menus, HUD, settings, fullscreen, and touchscreen controls. Phaser owns the pixel playfield. Existing gameplay systems and save state remain the authority for movement, encounters, workouts, capture calculations, and progression.

Characters use two crisp procedural standards during the placeholder phase:
trainers and muscular humanoids render at 28×36 logical pixels, while Gym
Buddies render at 24×24. Both use integer-aligned rectangles, bottom-center
anchors, disabled smoothing, bounded frame caches, and modular palette-aware
layers. Cosmetic muscle proportions remain separate from gameplay statistics.

## Resolution and framing

| Surface | Logical size | Aspect ratio | Purpose |
| --- | ---: | ---: | --- |
| Phaser playfield | 240 × 160 | 3:2 | World, sprites, camera, encounter effects, and transitions |
| Presentation frame | 240 × 180 | 4:3 | Playfield plus 10-pixel top and bottom letterbox bands |
| Safe gameplay area | 224 × 144 | — | Keep critical actors and effects at least 8 pixels from the playfield edge |

The 240 × 160 canvas is centered inside a 240 × 180 presentation frame. Ten logical pixels of letterboxing sit above and below the playfield. Letterbox bands may carry restrained decorative seams, but they must not hold critical information.

Phaser is configured with:

- Canvas rendering at exactly 240 × 160 logical pixels.
- Antialiasing disabled.
- Pixel-art and rounded-pixel rendering enabled.
- Nearest-neighbor CSS scaling through `image-rendering: pixelated`.
- No responsive resize of the internal game simulation.

## Responsive scaling

The frame chooses the largest integer scale that fits both the available width and 72% of the viewport height:

`scale = floor(min(available width / 240, available height / 180))`

When even 1× cannot fit, a bounded fractional scale is allowed so the presentation remains usable instead of overflowing. This is the only normal fractional-scaling case.

Reference sizes:

| Scale | Frame | Phaser canvas | Typical use |
| ---: | ---: | ---: | --- |
| 1× | 240 × 180 | 240 × 160 | Narrow phone or embedded panel |
| 2× | 480 × 360 | 480 × 320 | Large phone, tablet portrait, small desktop panel |
| 3× | 720 × 540 | 720 × 480 | Tablet landscape and desktop |
| 4× | 960 × 720 | 960 × 640 | Large desktop or fullscreen |

Desktop and fine-pointer layouts keep touch controls hidden. Coarse-pointer devices and viewports up to 760 CSS pixels show a separate touch deck below the protected 4:3 frame. This prevents controls from covering the playable view and keeps touch targets at least 48 CSS pixels.

Fullscreen expands the containing presentation surface, not the Phaser resolution. The same integer-scaling calculation is reapplied, with the canvas remaining at 240 × 160 internally.

## Pixel grid, tiles, and sprites

### Tile sizes

- Base overworld tile: 8 × 8 logical pixels.
- Large environment module: 16 × 16 logical pixels, assembled from four base tiles.
- Collision and movement grid: gameplay-owned; the renderer reads current world coordinates and does not redefine route rules.
- Decorative seams and floor checks: align to the 8-pixel grid.

### Sprite sizes

| Asset role | Base bounds | Notes |
| --- | ---: | --- |
| Trainer layered source | 28 × 36 | Shared bottom-center anchor; rendered at 0.5× in the overworld |
| Trainer overworld footprint | 14 × 18 | Four directions and discrete muscular silhouette modules |
| Buddy overworld | 16 × 16 or 24 × 24 | Larger silhouette allowed for species readability |
| Machine prop | 16 × 24 or 24 × 24 | Keep an 8-pixel interaction footprint |
| Boss encounter figure | up to 48 × 48 | May break the normal scale hierarchy |
| Effect burst | 8 × 8 to 32 × 32 | Draw on whole pixels; no filtered scaling |
| Menu icon | 8 × 8 or 12 × 12 | Original geometric marks only |

Sprites should prioritize silhouette, stance, and one identifying feature over surface detail. Buddy species must remain distinguishable in monochrome before palette is applied.

### Bodybuilding silhouette grammar

Trainer and important-character sprites use three discrete visual bands for
each major body region: athletic, developed, and showcase. The renderer changes
actual geometry for shoulder span, trapezius rise, chest and back width, upper-
and lower-arm thickness, waist width, glute and thigh depth, calf width, body
mass, and muscle separation. The minimum band must still read as deliberately
muscular; the maximum band must preserve gaps between arms, torso, and legs.

Direction controls emphasis:

- front views prioritize chest, biceps, core, quads, and shoulder-to-waist taper;
- back views prioritize trapezius, lats, lower back, triceps, glutes,
  hamstrings, and calves; and
- side views prioritize torso depth, biceps or triceps according to pose,
  glutes, hamstrings, and calf shape.

Stable pose IDs cover front/back relaxed, front/back double biceps, side chest,
side triceps, most muscular, abs-and-thigh, victory flex, warmup, post-set pump,
fatigued stance, confident walk, and boss entrance. Poses share the same
bottom-center anchor and remain inside 28×36 logical pixels.

Clothing follows the geometry that generated the body. Sleeves are derived from
upper-arm and forearm segments; tanks expose shoulder and back geometry;
compression tops follow the current torso taper; shorts and leggings follow
glute, quad, and hamstring bounds; belts follow waist width; and wraps and
sleeves use limb anchors. A garment must never replace the outer muscular
silhouette with a generic rectangle.

## Palette

The default palette is **Kinetic Slate**, an eight-color system:

| Token | Hex | Use |
| --- | --- | --- |
| Midnight | `#061519` | Deep background, outlines, letterbox |
| Deep Teal | `#0C2B2F` | Ground, menu surfaces |
| Iron | `#285057` | Secondary structure, inactive routes |
| Mist | `#B9D8C4` | Secondary text, borders |
| Chalk | `#EEF2D0` | Primary text and high-contrast detail |
| Mint | `#68D39B` | Positive state, navigation, healthy status |
| Coral | `#EF6A5B` | Action, encounters, warning emphasis |
| Amber | `#F2C14E` | Focus, selection, timing, rare emphasis |

Rules:

- A normal screen should use Midnight, Deep Teal, Iron, and no more than three accent colors.
- Chalk is reserved for primary text and small high-value sprite details.
- Coral must not be the sole indicator of danger; pair it with a label, icon change, or animation.
- Mint and Coral are functional opposites, not faction or creature-type colors.
- Zone variation should remap emphasis within this system rather than introduce unrestricted new colors.
- Alpha may be used in DOM overlays; Phaser pixel art should prefer solid colors and deliberate dithering.

This palette, its training-oriented meaning, and its plate-and-pulse geometry are original to Gym Buddies. Do not recreate recognizable palettes from existing creature-collection games.

## Shape and icon language

Interface surfaces use:

- Clipped corners that suggest weight plates and equipment housings.
- Asymmetric seams and offset notches rather than double-line fantasy frames.
- Diamond route nodes with a central pin.
- A rotated “pulse seed” mark for dialogue.
- Open-corner fullscreen marks and uneven three-bar menu marks.
- Directional wedges for movement and circular training-action controls.

Avoid capsule-heavy mobile dashboard styling, copied cartridge-era battle frames, familiar capture-device silhouettes, borrowed elemental symbols, or layouts that reproduce another game's command arrangement.

Icons must be understandable with a visible label or accessible name. Emoji are not part of the core presentation icon set.

## Typography

The presentation uses locally available font stacks and does not depend on a franchise-associated face:

- Display and menu labels: `"Trebuchet MS", "Arial Narrow", system-ui, sans-serif`.
- Pixel instrumentation and Phaser labels: `"Lucida Console", "Courier New", monospace`.
- Body text inside the presentation: the display stack at normal casing, or the instrumentation stack for compact status text.

Typography rules:

- Uppercase is limited to short headings, zone labels, and instrumentation.
- Minimum intended DOM text size is 11 CSS pixels at comfortable scales and 7 CSS pixels only inside the smallest 1× playfield overlay.
- Touch-control labels remain at least 7 CSS pixels and always have a complete accessible name.
- Text must never be baked into sprites when it can be represented in the React layer.
- Do not imitate existing creature-RPG logo lettering, menu fonts, or dialogue typography.

## UI spacing

The system uses a 4-pixel logical spacing rhythm:

| Token | Logical pixels | Typical use |
| --- | ---: | --- |
| Hairline | 1 | Pixel border, seam |
| Tight | 2 | Icon internal spacing |
| Base | 4 | Compact HUD gap |
| Comfortable | 8 | Panel inset, safe area |
| Section | 12 | Menu grouping |
| Large | 16 | Major separation |

DOM controls can scale beyond this rhythm to meet touch and accessibility needs. Touch targets are at least 48 × 48 CSS pixels. Keyboard focus outlines sit outside component borders so they do not change layout.

## Interface surfaces

### Gameplay canvas

The Phaser canvas renders the route, environment, trainer, Buddy, camera effects, and encounter presentation. It receives a serializable view snapshot and must not calculate rewards, captures, fatigue, or unlocks.

### Compact status HUD

The top HUD shows only immediate context:

- Active zone.
- Active Buddy and HP.
- Current training load/fatigue.
- Team count.

Long-form progression and inventory remain in React screens outside the playfield.

### Dialogue box

Dialogue uses an asymmetric clipped panel and an original pulse-seed speaker mark. It is a DOM live region so assistive technology receives updates. The player may temporarily hide and restore it. Keep normal dialogue to one or two short sentences; longer explanations belong in a dedicated React screen.

### Menu overlay

The menu is a DOM modal surface over the stage. It provides:

- Resume.
- Reduced-motion preference.
- Screen-shake preference.
- Enter/exit fullscreen.

Opening the menu moves focus to Resume. Tab stays inside the menu, Enter or Space activates controls, and Escape resumes play and restores playfield focus.

### Touchscreen controls

The touch deck is outside the protected frame and includes:

- Four-direction cross with disabled states for blocked routes.
- Primary action button with a contextual visible label.
- Menu button.

The deck uses `touch-action: none` or `touch-action: manipulation` within the control surface. It must not disable page scrolling outside active gameplay controls.

### Fullscreen control

Fullscreen is available from both the top-right playfield tool and the menu. The control always has a text alternative and reports pressed state.

## Input and accessibility

| Input | Movement | Primary action | Menu |
| --- | --- | --- | --- |
| Keyboard | Arrow keys or WASD | Space or Enter | M or Escape |
| Touch | Direction pad | A action control | M control |
| Gamepad | D-pad | Button 0 / south face button | Button 9 / start |

The playfield is focusable and carries instructions plus `aria-keyshortcuts`. Gameplay keystrokes call `preventDefault` and stop propagation only while the focused presentation is handling them. This prevents arrow keys and Space from scrolling the browser without trapping normal page navigation elsewhere.

Native buttons, labels, checkboxes, focus rings, and DOM text are preferred for accessibility-heavy surfaces. The canvas is marked as presentational because equivalent status and controls exist in the DOM.

Do not trigger movement while a text field or menu control has focus. Direction buttons expose disabled state when a route is unavailable or movement is locked.

## Motion and timing

| Motion | Duration | Notes |
| --- | ---: | --- |
| Button press | 50–80 ms | 1–3 CSS pixel travel; immediate recovery |
| Direction step | 80–120 ms | Renderer feedback only; gameplay cooldown remains authoritative |
| HUD state change | 100–160 ms | Color or width change, no large movement |
| Dialogue reveal | 120–180 ms | Whole panel or fast line reveal; never block reading |
| Route transition | 350–600 ms | Maximum for normal travel |
| Encounter emphasis | 250–450 ms | May combine flash and shake when enabled |
| Idle sprite beat | 640 ms cycle | One-pixel offset, disabled by reduced motion |
| Screen shake | 70–140 ms | Maximum 1–2 logical pixels for routine feedback |

Reduced motion:

- Stops idle bobbing.
- Collapses CSS animation and transition durations.
- Suppresses Phaser camera flashes and shake used by the presentation bridge.
- Must not remove information or delay input.

Screen shake is a separate preference. If reduced motion is enabled, shake remains suppressed even if the stored shake preference is on.

## Implementation boundaries

- `game/phaser/presentationConfig.ts` defines resolution, palette, base sizes, snapshot shape, and scaling.
- `game/phaser/PresentationScene.ts` draws the current procedural route presentation.
- `game/phaser/createGamePresentation.ts` owns Phaser creation and teardown.
- `ui/game/GamePresentation.tsx` owns the DOM HUD, dialogue, menu, fullscreen, focus, touch, keyboard, and gamepad bridge.
- `App.tsx` supplies existing game state and dispatches existing gameplay actions.

Phaser scenes may read content definitions for rendering but may not mutate saves or own progression state. React overlays may request existing actions but may not duplicate their calculations.

## Originality guardrails

Gym Buddies may evoke the technical restraint of GBA-era games, but it must not copy:

- Menu hierarchy or command placement from a known game.
- Battle or dialogue frame geometry.
- Fonts, logos, map layouts, tile arrangements, or signature color pairings.
- Creature silhouettes, trainer designs, capture devices, badges, or recognizable icons.
- Terminology, names, characters, locations, dialogue, sound effects, melodies, or story structures.

Every new visual should pass two checks:

1. Does its form communicate training, recovery, balance, mobility, or companionship?
2. Would it still read as Gym Buddies if all creature-collection comparisons were removed?

If either answer is no, revise before adding the asset.
