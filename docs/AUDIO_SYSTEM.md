# Gym Buddies Retro Audio System

## Scope

Gym Buddies uses a project-original retro audio language implemented with the
Web Audio API. Music and sound effects are synthesized at runtime from
declarative tone patterns. The runtime does not require recorded samples,
third-party music, or a streaming service.

The system is intentionally compact and GBA-era in spirit, but its melodies,
rhythms, cue shapes, orchestration, and timing patterns were composed for Gym
Buddies rather than transcribed, traced, interpolated, or rearranged from
another game.

## Audio identity

The sound palette uses:

- short triangle leads for readable melodic direction;
- low square pulses for weight and machine rhythm;
- restrained sine harmonies for recovery and successful outcomes;
- brief sawtooth accents for strain, urgency, and boss pressure; and
- deliberate rests so the mix remains clear on phone speakers.

Frequency, duration, gain, waveform, offset, and pitch-slide values live in
`client/src/game/content/audio.ts`. The audio engine interprets this content;
gameplay components do not contain synthesis or balance constants.

## Original music loops

| Stable ID | Use | Composition identity |
| --- | --- | --- |
| `home-gym` | Home Gym | Relaxed asymmetric warm-up phrase with soft bass space. |
| `route-exploration` | Routes and travel | Forward seven-beat movement cell with alternating footfall accents. |
| `wild-encounter` | Wild Buddy encounters | Syncopated contest phrase with short control pulses. |
| `boss-challenge` | Gym boss challenges | Descending pressure cycle with an offset rally response. |
| `training` | Active machine sessions | Clipped call-and-response cadence paced around controlled reps. |

Each loop is a short original melodic cell designed for repetition. Track
changes retain only one active interval. Requesting the current track again is
a no-op rather than another playback instance.

## Gameplay sound cues

| Stable ID | Trigger |
| --- | --- |
| `train` | Machine session begins. |
| `rep-success` | A controlled rep or rescued set succeeds. |
| `rep-failure` | A rep sequence ends after a missed rescue. |
| `spot-now` | The Spot Now rescue window opens. |
| `capture-success` | A Buddy accepts the completed challenge bond. |
| `capture-failure` | Escape, failed pin, or near-capture. |
| `level-up` | Workout or progression reward causes a level increase. |
| `rare-encounter` | An exotic Buddy encounter appears. |
| `menu-navigate` | Party or machine selection changes. |
| `route-transition` | Travel completes between locations. |
| `wild-alert` | A standard wild encounter begins. |
| `boss-alert` | A boss challenge is claimed or engaged. |
| `capture-advance` | A capture move gains control. |
| `capture-resisted` | A capture move loses control. |
| `team-full` | Capture succeeds with all six party positions occupied. |
| `recovery` | The active Buddy takes a recovery break. |

Cue patterns are short enough to remain readable over music. Gain values in
content are normalized and are multiplied by the event intensity before they
reach the saved SFX channel.

## Runtime architecture

`client/src/game/audio/retroAudioEngine.ts` owns all browser audio resources.
React communicates with it through the small `AudioEngine` interface:

- `unlock()`
- `setEnabled()`
- `setVolumes()`
- `setMusic()`
- `stopMusic()`
- `emitSfx()`
- `setPageHidden()`
- `dispose()`

The engine is presentation infrastructure, not simulation state. No
`AudioContext`, oscillator, gain node, interval handle, or audio-engine object
is written to a save.

### Autoplay

Constructing the engine does not create an `AudioContext`. `setMusic()` records
the desired track but does not start playback. Context creation and
`resume()` occur only through `unlock()`, which the React shell calls from a
player interaction such as enabling audio, starting an activity, or pressing
an audio-test button.

If the browser refuses playback, the promise resolves safely without affecting
gameplay. A later player gesture can try again.

### Music ownership and duplicates

The engine owns one desired music track and at most one music interval:

1. a repeated request for the same active track is ignored;
2. a different track clears the old interval and its music oscillators;
3. muting or hiding the page stops the interval without forgetting the desired
   track; and
4. returning or unmuting restarts only that desired track.

### Visibility

The React shell forwards `document.visibilityState` changes. When the page is
hidden, the engine:

- sets master output to silence;
- clears the music interval;
- stops active music and SFX oscillators; and
- suspends the `AudioContext`.

After a previously unlocked page becomes visible, the engine resumes the
context and starts one copy of the desired loop.

### Cleanup

Every generated oscillator has an `onended` cleanup handler that disconnects
both oscillator and per-tone gain. The engine also tracks active nodes so
track changes, mute, visibility changes, and application teardown can stop and
disconnect them early.

`dispose()` clears the interval, stops all active nodes, disconnects channel
gains, and closes the `AudioContext`. It is idempotent.

## Player controls and persistence

The header exposes:

- master audio mute/unmute;
- independent music volume; and
- independent SFX volume.

These settings remain in versioned save state:

```json
{
  "audio": {
    "enabled": true,
    "musicVolume": 0.5,
    "sfxVolume": 0.82
  }
}
```

Loaded volumes are validated and clamped from 0 to 1. Existing v12 settings are
restored through the save migration path. Journey reset keeps audio and
accessibility preferences.

## Development audio lab

Development builds expose **Developer Audio Lab** beneath Save Management. It
contains keyboard-focusable buttons for every music loop and cue, plus:

- Stop Music; and
- Restore Game Mix.

The lab uses the same saved mute and channel volumes as gameplay and follows
the same user-gesture unlock path. It is removed from production UI through
`import.meta.env.DEV`.

## Licensing and attribution

### Runtime Web Audio compositions

- **Creator/source:** Gym Buddies project implementation.
- **Method:** Original declarative frequency and timing patterns synthesized by
  project code.
- **Third-party samples:** None.
- **Third-party melodies or arrangements:** None.
- **License:** Covered by the repository’s current MIT project license unless
  the project owner later assigns an asset-specific license.
- **Attribution required in-game:** None for the current internally authored
  patterns.

### Existing placeholder WAV files

The asset manifest currently contains `audio.ui-confirm`,
`audio.route-step`, and `audio.capture-lock`. They are deterministic
project-generated placeholders created by
`client/scripts/generate-placeholder-assets.mjs`, not downloaded recordings.
They are not required by the Web Audio runtime introduced here.

- **Creator/source:** Gym Buddies placeholder-generation script.
- **Third-party samples:** None.
- **License:** Covered by the repository’s current MIT project license.
- **Status:** Placeholder; do not represent them as commissioned final audio.

### Future imported audio

Before adding a recorded or externally produced file, record:

1. stable asset key and filename;
2. title and creator;
3. source URL or delivery record;
4. exact license and version;
5. required attribution text;
6. modification permission;
7. commercial-use permission; and
8. whether redistribution with the repository is allowed.

Files without verified provenance must not enter the runtime asset tree.
Recognizable melodies, close melodic paraphrases, traced sound patterns, and
unlicensed samples are prohibited even if they are technically re-recorded.

## Validation

`client/src/tests/audioSystem.test.ts` verifies:

- required music and cue coverage;
- stable unique IDs and bounded tone definitions;
- no context creation before explicit unlock;
- duplicate-music prevention;
- visibility suspension and single-loop restoration;
- immediate mute behavior; and
- timer, node, and context cleanup on disposal.

The normal content validator also rejects empty or malformed tone patterns and
invalid music loop shapes.
