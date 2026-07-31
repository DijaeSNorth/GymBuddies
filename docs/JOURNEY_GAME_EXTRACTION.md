# Journey Game Extraction

## Outcome

The post-onboarding Gym Buddies experience is now a production lazy boundary. `App.tsx` is the application bootstrap and mode coordinator; `JourneyGame` owns the active journey surface through a typed controller. The extraction does not change gameplay calculations, balance, save schemas, content IDs, input mappings, audio behavior, Phaser scenes, or authored assets.

## Production structure

```text
client/src/
  App.tsx
  ui/
    errors/
      AppErrorBoundary.tsx
    journey/
      JourneyGame.tsx
      JourneyShell.tsx
      journeyTypes.ts
      journey.css
      useJourneyController.tsx
      encounters/
        JourneyEncounterPanel.tsx
      hooks/
        useJourneyClock.ts
        useJourneyOverlays.ts
      panels/
        JourneyManagementPanel.tsx
    save/
      saveDownload.ts
```

`JourneyGame.tsx` is intentionally small. It establishes the lazy CSS boundary, creates the journey controller, and mounts the shell only while the journey is active.

## Responsibilities

| Module | Responsibility |
| --- | --- |
| `App.tsx` | Initial load, save-service recovery, unsupported-save handling, new/edit trainer modes, journey selection, restart confirmation, shared audio-engine lifetime, and top-level error recovery |
| `journeyTypes.ts` | Typed App-to-journey contract, grouped save services, and grouped audio services |
| `useJourneyController.tsx` | Existing active-journey orchestration and handlers, kept separate from rendering during this behavior-preserving pass |
| `JourneyShell.tsx` | Journey frame, tutorial, settings, save management, playfield, Buddy Index, log, and Physique Review composition |
| `JourneyManagementPanel.tsx` | World, route, gym, machine, party, Buddy customization, workout, and recovery presentation |
| `JourneyEncounterPanel.tsx` | Wild encounter, capture battle, boss challenge, and encounter-result presentation |
| `useJourneyOverlays.ts` | Explicit mutually exclusive Buddy Customizer and Physique Review state |
| `useJourneyClock.ts` | Active-only, visibility-aware journey timing with one interval and deterministic cleanup |
| `AppErrorBoundary.tsx` | Application, journey-module, and Phaser-presentation containment without production stack traces |
| `saveDownload.ts` | Shared safe client-side save export used by normal and recovery UI |

No gameplay-system math was copied into these view modules. The controller continues to call the existing pure simulation, content, progression, save, audio, and input modules.

## Typed journey boundary

`JourneyGameProps` passes one serializable save value, one React state dispatcher, and grouped save/audio services. It also exposes only the application transitions the journey may request:

- edit the trainer appearance;
- restart the journey through confirmation;
- return to the opening/trainer surface.

The application retains one `SaveData` source of truth. Journey state is not duplicated in a global store or Phaser object.

## Error containment

There are three containment levels:

1. The application boundary protects startup and trainer creation.
2. The journey boundary protects the lazy module and active React journey UI.
3. The playfield boundary protects both the React presentation and asynchronous Phaser module creation.

Journey and playfield recovery offer retry, return to opening/trainer setup, save export, and application reload. None of these paths erase or replace the current save. Error details are logged only in development; normal production UI does not show a stack trace.

## Behavioral preservation

- Editing the trainer temporarily makes the journey inactive instead of destroying its local session state.
- Returning from editing remounts one Phaser canvas, not an additional canvas.
- Loading or importing a replacement save increments a journey revision so disposable journey UI is recreated around the new canonical save.
- The audio engine remains application-owned and is not duplicated when the journey sleeps or re-enters.
- Existing Buddy, workout, capture, boss, save, accessibility, and game-presentation components are reused.

## Size result

| Production source | Lines |
| --- | ---: |
| `App.tsx` | 734 |
| `JourneyGame.tsx` | 19 |
| `JourneyShell.tsx` | 399 |
| `JourneyManagementPanel.tsx` | 625 |
| `JourneyEncounterPanel.tsx` | 530 |
| `useJourneyController.tsx` | 3,295 |

No new production component exceeds the approximate 1,200-line target. The controller hook remains large because this pass moved the established orchestration intact instead of redesigning gameplay. Its internal separation is the primary follow-up architecture task.

## Remaining risks

- `useJourneyController.tsx` is still a large change-coupling point even though it no longer renders the interface.
- The root still owns the canonical save state, so legitimate once-per-second progression updates can render the coordinator while a journey is active. The opening/trainer surfaces do not mount the journey clock and therefore do not receive its ticks.
- Additional overlay unification should happen only when current simultaneous gameplay surfaces and their dismissal rules have dedicated regression coverage.
- The Phaser package remains the largest deferred chunk. It is intentionally unchanged in this extraction.
