# Single-Screen Journey UI

## Outcome

The active journey now uses one `100dvh` gameplay workspace instead of a vertically scrolling dashboard. The Phaser overworld remains mounted as the dominant central surface. React presents compact status, party, actions, dialogue, navigation, and one mutually exclusive secondary workspace.

This is a presentation-only refactor. It does not alter gameplay calculations, balance, progression, save schemas, stable IDs, maps, encounter rates, boss scheduling, audio behavior, input mappings, Phaser gameplay behavior, lazy-loading boundaries, or deployment behavior.

## Before and after

| Before | After |
| --- | --- |
| Large title, trainer controls, audio, save tools, map, gym cards, machines, party, encounters, Index, log, and dialogue shared one long page. | A compact status row, party summary, Phaser playfield, contextual action rail, dialogue/objective row, and quick navigation fit one viewport. |
| Multiple complete management systems rendered simultaneously. | One secondary workspace can be open at a time. |
| The DOM map competed with the Phaser map. | Phaser is authoritative during movement; route details live in the Map workspace. |
| Audio, save, restart, and playtest tools were permanently exposed. | Settings owns presentation/input controls; System owns journey management and optional playtest tools. |
| Full Buddy Index and activity log were permanent sections. | Index is lazy and optional; the log is a compact message-history popover. |

The former `JourneyManagementPanel` and `JourneyEncounterPanel` production paths were removed after their actions were represented in the workspace and regression coverage passed.

## Permanent structure

1. `CompactStatusBar` shows the compact brand, location, trainer, fatigue, conditional pump, active Buddy HP, relevant boss-ready status, and System trigger.
2. `PartyRail` shows six slots with sprite, HP, level, active state, and compact status. Selection remains immediate; secondary click, double click, or long press opens Team/customization.
3. `GamePresentation` stays mounted in condensed mode. Its 240x160 Phaser stage, integer scaling, touch deck, fullscreen behavior, gamepad support, and gameplay input mapping are reused.
4. `ContextActionRail` exposes no more than four actions. Its content changes for Home Gym, another gym, a route, a wild/boss encounter, a capture match, and an active workout.
5. `DialogueBar` shows one current message or objective, speaker treatment, input hint, contextual tutorial controls, and an expandable six-entry history.
6. `QuickNavigation` provides Play, Map, Team, Index, and Settings. Existing gameplay keys remain unchanged; `M`, `T`, and `I` open their workspaces outside editable controls.

## Layered workspaces

- Map: world graph, position, routes, locks, fatigue, encounter chance, boss readiness, and travel confirmation.
- Team: party order, active Buddy, stats, equipment, cosmetics, and lazy Buddy customization.
- Training: machine list, muscles, alignment/readiness forecast, load selection, and the existing workout mini-game.
- Buddy Index: the existing lazy Index in a focused overlay.
- Settings: audio, battle/text speed, motion, shake, contrast, remapping, sustained input, visual-development preferences, and fullscreen.
- System: save import/export/restore, trainer editing, tutorial restart, journey reset, opening return, privacy copy, and opt-in playtest tools.
- Physique Review: keeps its existing lazy modal and progression behavior.

Map, Team, Index, Settings, System, and Training use a shared modal host. Desktop uses a centered window; mobile uses a bottom sheet. Focus is trapped within the active layer and restored to its trigger when closed. Gamepad D-pad moves overlay focus, A confirms, and B/Menu closes.

Training is a deliberate exception to overlay pausing: overworld movement remains locked, but the existing timing mini-game continues to receive input and time. Other secondary workspaces pause gameplay through the existing presentation pause callback.

## Context-action mapping

| State | Actions |
| --- | --- |
| Home Gym | Train, Recover, Physique, Team |
| Other gym | Train, Scout, Boss, Travel |
| Route | Interact, Scout, Team, Map |
| Encounter intro | Take the Grip, Team |
| Capture match | Shoulder Burst, Iron Grind, Snapping Hook |
| Match result | Continue, Team |
| Workout | Rep/Spot input, Training |

Disabled actions retain their existing rules and explain the reason through the button title and the rail hint.

## Visual review

Automated Playwright captures cover:

- `journey-home-1440x900.png`
- `journey-route.png`
- `journey-encounter-stage.png`
- `journey-workout-overlay.png`
- `journey-boss-ready.png`
- `journey-map-overlay.png`
- `journey-team-overlay.png`
- `journey-mobile-exploration.png`
- `journey-mobile-encounter.png`
- `journey-mobile-team-sheet.png`
- `journey-high-contrast-reduced-motion.png`

Review findings: the playfield is the largest desktop surface; the next action is isolated in the right rail; ordinary exploration no longer scrolls; mobile retains the Phaser stage, touch deck, actions, objective, and navigation in one viewport; secondary content scrolls only inside its sheet. The remaining visual constraint is that a full six-slot mobile Team sheet requires internal sheet scrolling, by design.

## Bundle impact

The main entry remains effectively flat at 405.45 kB minified / 126.09 kB gzip / 107.55 kB brotli. The lazy Journey chunk is 192.69 kB minified / 58.82 kB gzip / 50.40 kB brotli, an increase of about 7.5 kB minified and 1.3 kB gzip from the previous journey-shell baseline. No debug-only production modules or duplicate cross-chunk modules were detected, and all eight lazy boundaries remain present.

Phaser remains the separately lazy `createGamePresentation` chunk. The redesign does not eagerly load Buddy Index, Buddy customization, Physique Review, playtest tools, or Phaser before their existing boundaries request them.

## Known usability risks

- The compact desktop party rail truncates long nicknames; Team shows the complete identity and statistics.
- Very long translated action labels may require later localization-specific typography review.
- Mobile landscape was not a primary target; the layout remains bounded but portrait is the intended phone presentation.
- Boss-ready status is intentionally passive; the contextual Boss action remains the authoritative challenge trigger.
