# Journey Information Hierarchy

## Principle

The journey interface reveals information according to immediate player intent. Gameplay state remains in `useJourneyController` and pure game systems. Workspace components consume that state; they do not create parallel gameplay state or recalculate outcomes.

## Level 1: always visible

These elements answer “where am I, how am I doing, and what can I do now?”

- Phaser playfield and current location
- fatigue and conditional pump/momentum
- active Buddy identity and HP
- compact six-slot party summary
- up to four state-specific actions
- one dialogue, result, tutorial, or objective message
- Play, Map, Team, Index, and Settings access
- relevant boss-ready indicator and System access

No full statistics, management forms, route matrices, save controls, or audio sliders belong at this level.

## Level 2: one action away

These are focused gameplay planning surfaces:

- Map and travel preview
- Team details and Buddy styling
- Training selection and workout interaction
- Buddy Index
- Physique Review
- encounter and boss detail presented only while relevant

Only one full Level 2 workspace can be visible. Opening another route first closes the previous layer by replacing the single `activeWorkspace` value.

## Level 3: system management

These controls live outside the normal play composition:

- audio and accessibility settings
- keyboard remapping and gamepad profile information
- fullscreen and sustained-input preferences
- save export/import/restore
- trainer editing and tutorial restart
- destructive journey restart and opening return
- optional alpha playtest tools and privacy explanation

Settings owns presentation and input preferences. System owns journey data and lifecycle controls. Destructive operations keep their existing confirmation steps.

## State ownership

| Concern | Owner | Workspace behavior |
| --- | --- | --- |
| progression, encounters, workouts, captures, bosses, rewards | existing controller and pure systems | read values and call existing commands |
| Phaser location, player tile, animation, collision, camera | existing presentation controller | remains mounted; movement locks while a management layer is active |
| saved trainer, team, audio, accessibility, input | versioned save service/controller | same setters and migrations as before |
| active secondary workspace | `JourneyWorkspace` React state | ephemeral UI-only state; never serialized |
| message-history expansion | `DialogueBar` React state | ephemeral presentation state |
| map/team selection inside a workspace | individual overlay React state or existing active selection | does not create new game identity or rules |

## Action precedence

The action rail resolves state in this order:

1. active capture match
2. capture result/full-party resolution
3. encounter introduction
4. active workout
5. route exploration
6. Home Gym
7. another gym

This prevents unrelated actions from competing with an unresolved encounter or workout. The rail never renders more than four buttons.

## Tutorial and narration

Tutorial guidance uses the compact dialogue/objective bar, not a blocking page overlay. Back, Next, and Skip remain available. The internal feature-cadence plan is absent from the player journey. Recent activity is opt-in through the Log control and limited to the newest entries.

## Input paths

- Keyboard: existing movement/actions; `M`, `T`, `I`; Escape closes the current layer.
- Touch: existing D-pad and action buttons; persistent navigation; large contextual buttons; bottom sheets.
- Gamepad: existing gameplay mapping; overlay D-pad focus, confirm/interact activation, cancel/menu close.
- Screen reader: named regions, named dialogs, meters, current state, `aria-pressed`, and live narration remain available without relying on color alone.
