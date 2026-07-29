# Gym Buddies Control Map

## Input architecture

Gym Buddies uses one action vocabulary for every device. React translates
keyboard, touch, and Gamepad API input into actions. Pure TypeScript systems
resolve gameplay. Phaser receives state snapshots and presentation feedback;
it does not own player progression or device bindings.

The twelve player actions have stable string IDs:

`move-up`, `move-down`, `move-left`, `move-right`, `confirm`, `cancel`,
`menu`, `interact`, `ability-1`, `ability-2`, `ability-3`, and `pause`.

The development-only `debug-toggle` action is fixed to F2 and is not part of
saved or remappable player controls.

## Default control map

| Action | Keyboard | Touch | Standard gamepad | Xbox-style | PlayStation-style |
| --- | --- | --- | --- | --- | --- |
| Move up | Arrow Up / W | D-pad up | D-pad / left stick up | D-pad / left stick up | D-pad / left stick up |
| Move down | Arrow Down / S | D-pad down | D-pad / left stick down | D-pad / left stick down | D-pad / left stick down |
| Move left | Arrow Left / A | D-pad left | D-pad / left stick left | D-pad / left stick left | D-pad / left stick left |
| Move right | Arrow Right / D | D-pad right | D-pad / left stick right | D-pad / left stick right | D-pad / left stick right |
| Confirm | Enter | A / action button | South button | A | Cross |
| Cancel | Escape | B / Cancel | East button | B | Circle |
| Menu | M | Menu | North button or Select | Y or View | Triangle or Create |
| Interact | Space / E | X / Interact | West button | X | Square |
| Ability 1 | 1 | 1 | Left shoulder | LB | L1 |
| Ability 2 | 2 | 2 | Right shoulder | RB | R1 |
| Ability 3 | 3 | 3 | Right trigger | RT | R2 |
| Pause | P | Pause | Start | Menu | Options |

Gamepad mappings use the browser Standard Gamepad layout. Controller names are
used only to display familiar Xbox-style or PlayStation-style labels; gameplay
button indices remain standards-based. Unknown controllers receive neutral
labels such as “South button.”

The left stick uses a 0.55 deadzone. Held movement repeats every 115 ms and
held gamepad commands every 280 ms.

## Context rules

- In the overworld, movement changes the trainer tile and facing direction.
  Confirm and Interact use the facing interactable.
- In a workout, Confirm or Interact performs the rep or Spot Now action. Left
  and Right change the selected load before a set starts.
- In a capture encounter, Abilities 1–3 choose the three capture moves.
  Confirm and Interact use the primary move where a single primary action is
  offered.
- In menus, directional input moves focus, Confirm activates the focused
  control, and Cancel closes the current field menu.
- Pause holds route and workout timers. If an active workout is paused, all
  timing deadlines shift by the paused duration.
- The first Confirm or Interact press while dialogue is typing reveals the
  complete line. A later press performs the contextual gameplay action.

Standard web-menu navigation remains available: Tab and Shift+Tab move focus,
Enter or Space activates native controls, and visible focus rings identify the
current control. This remains available even when gameplay keys are remapped.

## Keyboard remapping

Open **Field menu → Controls & accessibility → Keyboard controls and
remapping**. Select an action’s Remap button and press the desired key. The
new key becomes that action’s primary binding.

If the key already belongs to another action, the two primary bindings are
swapped. This prevents ambiguous input. Restore Keyboard Defaults resets the
entire map.

Bindings use physical `KeyboardEvent.code` values, so a saved layout follows
key position consistently. Modifier-only keys, Tab, and F1–F12 are reserved
for browser, operating-system, focus, or development behavior and cannot be
assigned. Invalid or duplicated imported bindings are replaced safely with the
default map during save validation.

## Touch controls

Touch controls appear on coarse-pointer devices and at narrow viewport widths.
Every interactive target is at least 44 CSS pixels in its unscaled layout.
The control deck includes the four-way D-pad, Confirm, Cancel, Interact, all
three abilities, Menu, and Pause. Buttons contain text or symbols plus
accessible names; meaning never depends on color alone.

**Sustained touch movement** supports two modes:

- **Hold button:** movement repeats while a direction remains pressed.
- **Tap to toggle:** tapping a direction starts repeated movement; tapping it
  again stops, and tapping another direction transfers movement.

Opening a menu, pausing, reaching a blocked tile, or disabling movement stops
sustained travel. The playfield and touch deck use contained touch behavior so
directional play does not scroll the browser page.

## Accessibility settings

The field menu persists these settings in save schema 14:

- Text speed: Slow, Standard, Fast, or Instant.
- Battle speed: the existing configured capture-battle speed choices.
- Reduced motion: disables interface animation and makes dialogue instant.
- Screen shake: independently adjustable and automatically disabled when
  Reduced Motion is enabled.
- High-contrast interface: raises foreground/background contrast and
  strengthens control and focus outlines.
- Sustained touch movement: Hold or Toggle.
- Remappable keyboard controls.

HUD status includes explicit labels and values such as `HP`, `Fatigue`, and
`Team`. Capture outcomes, boss stress, workout grades, meter thresholds, and
availability states also include text; color is supplemental.

Dialogue uses a larger mobile text treatment and scrolls rather than clipping
long lines. Screen-reader announcements use the complete line instead of
announcing every typewriter character.

## Focus and pause behavior

The browser pauses field gameplay when its window loses focus or its tab is
hidden. Audio is suspended or reduced through the existing audio service.
Returning to the tab leaves a clear Paused overlay so resumption is deliberate.

The field menu and pause overlay trap forward/backward Tab navigation. Gamepad
focus navigation works inside both overlays. Gameplay controls outside the
playfield are inert while paused, while the top-level audio and save controls
remain available.

## Validation responsibilities

- `client/src/game/input/actionMap.ts` owns action IDs, default bindings,
  controller labels, repeat timing, remapping, and binding validation.
- `client/src/game/types/input.ts` owns serializable input-setting types.
- `client/src/ui/game/GamePresentation.tsx` owns contextual device dispatch,
  focus boundaries, pause presentation, dialogue pacing, and touch repetition.
- `client/src/game/save/` owns schema migration, normalization, and persistence.
- `client/src/tests/inputAccessibility.test.ts` covers keyboard mapping,
  conflict-safe remapping, invalid-binding recovery, controller profiles, and
  pause-safe workout timing.
