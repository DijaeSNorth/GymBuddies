# Gym Buddies Save Format

## Purpose

Gym Buddies uses an explicit, versioned JSON save format. The save service
preserves the complete v12 prototype where its data is recognizable, repairs
recoverable fields, refuses unknown future formats, and never deletes stored
data as a side effect of a failed load.

The current schema is **19** (`version: "v19"`).

## Storage slots

| Purpose | Browser storage key |
| --- | --- |
| Current validated save | `gym-buddies.save.current` |
| Previous validated save | `gym-buddies.save.previous` |
| Read-only v12 compatibility source | `gymbuddies-save-v12` |
| Legacy presentation settings source | `gym-buddies.presentation.settings.v1` |

The legacy keys are read for migration but are not removed. A normal write
copies the existing current save to the previous slot only when that current
save can itself be decoded and validated. Corrupted data is never promoted to
the backup slot.

## Export envelope

Manual exports and newly written browser saves use this envelope:

```json
{
  "format": "gym-buddies-save",
  "schemaVersion": 19,
  "savedAt": "2026-07-28T12:00:00.000Z",
  "state": {
    "schemaVersion": 19,
    "version": "v19"
  }
}
```

`savedAt` is export metadata only. Gameplay does not use wall-clock time from
the envelope.

The importer also accepts an unwrapped state object for compatibility with
older and developer-authored saves.

## Schema 19 state

All fields below are JSON primitives, arrays, or plain objects.

| Field | Type | Meaning and validation |
| --- | --- | --- |
| `schemaVersion` | `19` | Numeric schema identity. |
| `version` | `"v19"` | Human-readable compatibility marker. |
| `trainingFatigue` | number | Clamped to the configured fatigue range. |
| `workoutMomentum` | number | Clamped to the configured momentum range. |
| `deloadTokens` | integer | Clamped to the configured token limit. |
| `captureBattleSpeed` | string | Must match a configured battle-speed ID. |
| `machineTrainingHistory` | object | Last machine ID, repeated uses, and validated mastery by stable machine ID. |
| `visualProgression` | object | Cosmetic baseline, capped long-term development, temporary pump, compact recent-training records, progress snapshots, presentation preferences, and optional challenge progress. |
| `hasStarterSet` | boolean | Whether the mandatory opening is complete. |
| `unlockedZoneIds` | string array | Normalized against current world content and reachability rules. |
| `visitedZoneIds` | string array | Known journey gym IDs; inferred progress is retained where possible. |
| `trainer` | object | Name, stable-ID cosmetic appearance, saved appearance presets, legacy palette mirrors, and separate fictional RPG muscle attributes. |
| `trainerEquipmentBonuses` | object | Separate bounded Power, Technique, Endurance, Mobility, and Recovery modifiers; cosmetic equipment never writes these values. |
| `steroids` | integer | Existing v12 progression-resource counter; retained for compatibility. |
| `activeIndex` | integer | Active party slot, clamped to the loaded party. |
| `activeZoneId` | string | Stable gym ID, with Home Gym as the recovery fallback. |
| `team` | array | Up to six mutable Buddy records using stable `speciesId` references. |
| `seenDex` | number array | Validated, de-duplicated Gym Buddy Index numbers. |
| `caughtDex` | number array | Validated, de-duplicated Gym Buddy Index numbers. |
| `selectedMachineByZone` | object | Stable gym IDs mapped to valid machine IDs. |
| `bossGameplayTimeMs` | number | Monotonic gameplay time, never a system-clock timestamp. |
| `bossSchedules` | object | Validated schedule per gym. |
| `tutorialStep` | integer | Clamped to the configured tutorial length. |
| `audio` | object | `enabled`, `musicVolume`, and `sfxVolume`; volumes are clamped from 0 to 1. |
| `accessibility` | object | Saved `reducedMotion`, `screenShake`, `highContrast`, `textSpeed`, and `sustainedInputMode` preferences. |
| `input` | object | Serializable keyboard bindings keyed by stable input-action ID. |

### Serialized Buddy state

New schema-19 files do not duplicate static species content. Each party entry
stores:

```json
{
  "id": "seed-1",
  "nickname": "Bramblift",
  "speciesId": "brawny-bear",
  "cosmetics": {
    "version": 2,
    "primaryPaletteId": "bark",
    "secondaryPaletteId": "moss",
    "accentPaletteId": "sand",
    "patternId": "pattern-none",
    "muscleDefinitionId": "defined",
    "bodySizeId": "standard",
    "appendageVariantId": "brawny-bear-appendage-classic",
    "accessoryIds": ["accessory-wraps"],
    "rareTraitId": "rare-none",
    "expressionId": "steady",
    "victoryPoseId": "victory-flex",
    "entranceAnimationId": "entrance-stride",
    "physiquePresetId": "brawny-bear-physique-balanced",
    "physique": {
      "shoulderEmphasisId": "balanced",
      "chestEmphasisId": "balanced",
      "backEmphasisId": "balanced",
      "armEmphasisId": "balanced",
      "coreEmphasisId": "balanced",
      "legEmphasisId": "balanced",
      "overallMassId": "balanced-mass",
      "symmetryId": "balanced",
      "stanceId": "athletic",
      "postureId": "neutral",
      "pumpEffectId": "warm"
    }
  },
  "level": 4,
  "hp": 30,
  "maxHp": 30,
  "xp": 0,
  "trainingSessions": 0,
  "form": 6,
  "mobility": 3,
  "volume": 5
}
```

At load time, `speciesId` is resolved against the current original Gym Buddies
content catalog. The v12 form containing an embedded `creature` object remains
accepted; the migration resolves its stable species identity and writes the
compact schema-19 form on the next safe save.

## Migration support

### v12 to v13

The explicit `v12-to-v13` migration:

1. preserves all recognized gameplay fields;
2. adds `schemaVersion: 13` and `version: "v13"`;
3. restores accessibility preferences from the legacy presentation-settings
   key when they are absent;
4. resolves embedded Buddy definitions to current stable species identities;
5. normalizes partial fields through current content and balance limits; and
6. converts boss scheduling to safe gameplay-time schedules during validation.

### v13 to v14

The explicit `v13-to-v14` migration:

1. preserves all recognized v13 gameplay, audio, and motion settings;
2. adds `schemaVersion: 14` and `version: "v14"`;
3. adds safe defaults for text speed, high contrast, and sustained touch
   movement;
4. adds the complete default keyboard binding map; and
5. normalizes and validates all bindings before the save can be loaded.

### v14 to v15

The explicit `v14-to-v15` migration:

1. preserves all recognized progression, world, party, boss, audio,
   accessibility, and input data;
2. adds `schemaVersion: 15` and `version: "v15"`;
3. creates a version-2 cosmetic appearance from legacy trainer palette values;
4. maps legacy colors to the nearest curated stable color or skin-tone ID;
5. adds an empty player-saved appearance-preset collection when absent; and
6. validates every cosmetic build value and content reference before loading.

Trainer cosmetics are stored independently from `trainer.muscles`. Appearance
contains stable IDs for face, hair, outfit, colors, and accessories plus 22
bounded cosmetic build values. Saved looks have stable string IDs and contain
cosmetics only. Missing or removed content references recover to safe defaults
without changing progression.

### v15 to v16

The explicit `v15-to-v16` migration:

1. preserves every trainer, world, combat, progression, and Buddy statistic;
2. adds `schemaVersion: 16` and `version: "v16"`;
3. adds a cosmetic-only profile to each party Buddy using stable option IDs;
4. validates each profile against that Buddy's species-scoped visual options;
5. replaces missing or removed cosmetic IDs with safe species defaults; and
6. preserves archived legacy Buddy records with the compatible fallback
   silhouette instead of discarding the save.

Buddy colors, markings, body-size variation, muscle definition, appendage
variation, accessories, expressions, victory pose, and entrance animation are
presentation data. They never modify level, HP, Power, Form, Mobility, Volume,
fatigue, equipment bonuses, or discipline calculations.

### v16 to v17

The explicit `v16-to-v17` migration:

1. preserves all trainer, Buddy, route, gym, workout, boss, audio, input, and
   accessibility state;
2. adds `schemaVersion: 17` and `version: "v17"`;
3. upgrades trainer appearance to version 3;
4. fills the 39 new fictional regional proportion controls from safe,
   muscular defaults while retaining all original 22 values;
5. adds stable IDs for trim and fictional logo colors, logo shape, chalk
   marks, and gym towel; and
6. normalizes saved looks independently, replacing unavailable content IDs
   without modifying progression.

Appearance-only exports use their own `gym-buddies-appearance` envelope and a
64 KB import limit. They contain cosmetics only and cannot change gameplay
muscles, equipment bonuses, fatigue, levels, Buddies, or journey progress.

### v17 to v18

The explicit `v17-to-v18` migration:

1. preserves the complete version-3 Trainer Forge appearance exactly;
2. copies that appearance into a comparison-only visual baseline;
3. initializes capped development and temporary pump values at zero;
4. adds visual intensity, pump, and fatigue-presentation preferences;
5. adds compact stable-ID training records, physique snapshots, and optional
   bodybuilding-challenge progress; and
6. stores no rendered frames, Phaser objects, DOM references, audio nodes, or
   wall-clock timers.

Changing Trainer Forge cosmetics later never deletes development. Hiding
development or pump only changes presentation preferences. The beginning
baseline and saved snapshots are normal JSON appearance records and are
repaired with the same safe stable-ID defaults as the live trainer.

### v18 to v19

The explicit `v18-to-v19` migration preserves every gameplay value and upgrades
only Buddy presentation records. Each party Buddy receives a species-scoped
physique preset ID plus bounded shoulder, chest, back, limb, core, leg, mass,
symmetry, stance, posture, and pump presentation values. Removed or invalid
cosmetic IDs recover to that species' safe defaults. Species stats, combat
balance, fatigue, progression, and trainer cosmetics are not changed.

A versionless object containing recognizable v12 fields such as `trainer`,
`team`, or `bossSchedules` is treated as inferred v12. The load result records a
warning so this inference is visible rather than silent.

Schemas older than 12 are unsupported. Schemas newer than 19 are preserved
untouched and automatic saving is paused so an older game build cannot destroy
newer data.

Future schema changes must add a new migration function for every supported
step. Migrations should remain deterministic and must not read React, Phaser,
the DOM, audio engines, or wall-clock gameplay values.

## Load and recovery order

The service checks candidates in this order:

1. current save;
2. previous validated save;
3. legacy v12 save;
4. fresh defaults only when no valid stored candidate exists.

Every candidate is parsed, migrated, normalized, and validated before it can be
used. If the current save is corrupted but the previous slot is valid, the
previous save is loaded and the failure is reported in Save Management. The
corrupt current string remains untouched until a later validated write.

If stored data exists but no candidate can be recovered, the game starts an
in-memory default journey with automatic saving paused. The player can then
export evidence, import a known-good file, or explicitly confirm a reset.

Missing or invalid individual fields are replaced with bounded defaults where
that is safe. Recovery details are shown in the Save Management panel. Invalid
party species and invalid machine references are skipped or reset rather than
allowed to crash gameplay.

## Write and backup rules

Before a write:

1. the complete runtime save is checked for JSON-safe values;
2. schema markers and content references are validated;
3. any valid current slot is copied verbatim to the previous slot;
4. the new envelope is written to the current slot; and
5. the written value is read back, decoded, and validated.

An unsupported future current save cannot be overwritten by autosave. Only an
explicitly confirmed replacement flow may request that override.

The previous slot is a single rotating backup, not a historical archive.
Players who need longer retention should use manual JSON export.

## Import, export, restore, and reset

- **Export JSON** downloads the current validated state in a portable envelope.
- **Import JSON** opens a replacement confirmation after file selection. On
  confirmation, it parses and validates the file before changing memory or
  storage. A failed import leaves the current journey unchanged.
- **Restore Previous** requires confirmation. The journey it replaces becomes
  the new previous backup, allowing the player to switch back.
- **Restart Journey** uses the existing confirmation dialog. The prior valid
  journey is backed up before the new opening state is applied. Audio and
  accessibility preferences are retained.

All controls are ordinary keyboard-focusable HTML controls. Confirmation
dialogs trap focus, support Escape to cancel, and never treat file selection by
itself as permission to replace a save.

## Serializable-state boundary

Stored state may contain only:

- finite numbers;
- strings and booleans;
- `null`;
- arrays; and
- plain objects.

The validator rejects functions, `undefined`, symbols, non-finite numbers,
circular references, and class/runtime instances.

The save never contains:

- Phaser games, scenes, sprites, cameras, textures, or tweens;
- React elements or component state unrelated to simulation;
- DOM nodes or browser events;
- `AudioContext`, gain nodes, oscillator nodes, or music interval handles;
- workout animation timers, encounter transition timers, or input handles; or
- generated object references to static Buddy content.

React and Phaser rebuild their presentation state from the validated
simulation state.

## Boss schedule restoration

Boss availability uses `bossGameplayTimeMs` and
`readyAtGameplayMs`. Restoration clamps schedules to the supported gameplay
window and preserves `defeated`, `cycle`, and `lastRewardedCycle` invariants.

The v12 `nextBossAt` wall-clock value is not trusted. A legacy timestamp becomes
a short, fixed gameplay-time grace period. Advancing the computer clock cannot
create unlimited boss rewards, and reward cycles remain protected against
duplicate claims after reload.

## Developer fixtures and tests

In development builds, Save Management exposes representative fixtures for:

- a new schema-18 journey;
- a progressed schema-18 journey;
- a complete v12 journey;
- a partial v12 journey with a legacy boss timestamp; and
- deliberately corrupted JSON.

These fixtures use the same import, migration, validation, and confirmation
path as player files. They are defined in
`client/src/game/debug/representativeSaves.ts` and are excluded from production
UI by `import.meta.env.DEV`.

Migration and recovery tests live in
`client/src/tests/saveService.test.ts`. Any schema change must add fixtures and
tests for the prior version, partial data, corrupt JSON, backup recovery,
future-version refusal, settings restoration, and boss schedule restoration.
