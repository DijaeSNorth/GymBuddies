# React State Ownership

## Rule

Serializable gameplay truth remains in `SaveData` and the existing pure game systems. React coordinates views and temporary interaction state. Phaser consumes presentation snapshots and emits actions; it does not own progression.

## Ownership map

| Classification | Owner | Representative state | Lifetime |
| --- | --- | --- | --- |
| Application bootstrap | `App.tsx` | load result, persistence availability, load messages/issues, previous-save availability | Application |
| Persistent save | `App.tsx` plus versioned save service | trainer, party, progression, fatigue, pump, boss schedules, accessibility, input, audio, tutorial | Serialized and migrated |
| Application mode | `App.tsx` | opening versus journey, new/edit trainer mode, trainer draft, start mode, restart confirmation, journey revision | Application/session |
| Active journey | `useJourneyController` | world position, facing, travel transition, preview zone, movement lock, current message/log, pause state | Mounted journey |
| Temporary encounter | `useJourneyController` | encounter, capture match, capture animation, boss entrance, workout session/result | Current interaction |
| Temporary UI | `useJourneyController` and `useJourneyOverlays` | roadmap, active overlay, emote, local timing frames | Mounted journey |
| Phaser presentation | `GamePresentation` and Phaser controller | menu/pause, dialogue reveal, fullscreen, debug overlay, gamepad profile, held/toggled direction, scene objects | Playfield mount |
| Development only | DEV-folded lazy modules and query-routed galleries | asset/audio/save tools and review screens | Development build only |

## Persistent-state flow

```text
versioned save service
        ↓ validated load/migration
      App save
        ↓ props                         ↑ explicit state update
  Journey controller ── pure systems ──┘
        ↓ snapshot/actions
 React presentation + Phaser
```

There is one application-level `SaveData` value. The journey receives the value and the existing typed React dispatcher. System functions accept explicit state and return results; the rendering layers do not create parallel progression stores.

## Overlay model

Buddy Customizer and Physique Review are mutually exclusive and use:

```ts
type JourneyOverlay =
  | { type: 'none' }
  | { type: 'buddy-customizer' }
  | { type: 'physique-review' };
```

The reducer-like transition function preserves a currently open overlay when a stale close callback arrives for a different overlay. This prevents independent booleans from showing both surfaces or closing a newly opened surface.

Other surfaces remain independent where their current semantics require it:

- the tutorial may coexist with the journey;
- the roadmap is nested tutorial help;
- encounter, capture, boss, and workout states represent gameplay activity, not cosmetic dialogs;
- the playfield pause/menu is owned at the presentation boundary;
- trainer editing is an application mode because it must suspend the journey without discarding progress.

## Journey clock

`useJourneyClock` is mounted only inside the lazy journey controller.

- It creates one interval only when `active` is true.
- It does no work while gameplay is paused or the document is hidden.
- Callback and pause refs keep the interval stable instead of recreating it each render.
- Cleanup clears the interval when the journey becomes inactive or unmounts.
- The existing one-second cadence and progression callback are preserved.
- Opening and trainer-creation modes do not import the journey module, so they cannot receive journey-clock updates or save writes.

## Presentation isolation

`GamePresentation` owns only view mechanics such as dialogue reveal, fullscreen, input-held state, and the Phaser controller. On cleanup it destroys the current controller and clears the reference. Re-entering after trainer editing produces one canvas. The application owns the audio engine so the same engine is reused across journey mode transitions.

## Future extraction boundary

The next safe refactor is to split `useJourneyController.tsx` by coherent orchestration domain—world travel, workout session, encounter/capture, boss challenge, and presentation derivation—while retaining the single save dispatcher and pure-system calls. It should not introduce a general global store or put calculations into components.
