import { describe, expect, it } from 'vitest';

import { BOSS_LEGACY_MIGRATION_GRACE_MS } from '../game/content/bosses';
import {
  LEGACY_PRESENTATION_SETTINGS_KEY,
  LEGACY_SAVE_KEYS,
  SAVE_BACKUP_KEY,
  SAVE_IMPORT_MAX_BYTES,
  SAVE_KEY,
} from '../game/content/save';
import { createRepresentativeTestSaves } from '../game/debug/representativeSaves';
import {
  DEFAULT_TRAINER_APPEARANCE,
  TRAINER_BUILD_ATTRIBUTES,
} from '../game/content/trainerAppearance';
import { remapKeyboardBinding } from '../game/input/actionMap';
import { createDefaultSaveData } from '../game/save/saveDefaults';
import {
  exportSaveJson,
  importSaveJson,
  loadGameSave,
  writeGameSave,
  type SaveStorage,
} from '../game/save/saveService';
import { validateSerializableState } from '../game/save/saveValidation';
import type { SaveData } from '../game/types';

class MemoryStorage implements SaveStorage {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

function representativeJson(id: string) {
  const entry = createRepresentativeTestSaves(
    createDefaultSaveData({
      accessibility: {
        reducedMotion: false,
        screenShake: true,
        highContrast: false,
        sustainedInputMode: 'hold',
        textSpeed: 'standard',
      },
    }),
  ).find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Missing representative save "${id}".`);
  return entry.json;
}

describe('versioned save migrations', () => {
  it('migrates v18 Buddy cosmetics to species-safe v2 defaults', () => {
    const current = createDefaultSaveData();
    const legacy = JSON.parse(JSON.stringify(current)) as Record<string, any>;
    legacy.schemaVersion = 18;
    legacy.version = 'v18';
    legacy.team[0].cosmetics.version = 1;
    delete legacy.team[0].cosmetics.physiquePresetId;
    delete legacy.team[0].cosmetics.physique;
    const originalPower = legacy.team[0].creature.power;

    const imported = importSaveJson(JSON.stringify(legacy));

    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.appliedMigrations).toEqual(['v18-to-v19']);
    expect(imported.save.team[0]!.cosmetics?.version).toBe(2);
    expect(imported.save.team[0]!.cosmetics?.physiquePresetId).toContain(
      imported.save.team[0]!.creature.id,
    );
    expect(imported.save.team[0]!.cosmetics?.physique).toBeDefined();
    expect(imported.save.team[0]!.creature.power).toBe(originalPower);
  });

  it('migrates v17 to visual progression without changing the trainer appearance', () => {
    const current = createDefaultSaveData();
    const legacy = JSON.parse(JSON.stringify(current)) as Record<string, any>;
    const appearance = structuredClone(legacy.trainer.appearance);
    legacy.schemaVersion = 17;
    legacy.version = 'v17';
    delete legacy.visualProgression;

    const imported = importSaveJson(JSON.stringify(legacy));

    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.appliedMigrations).toEqual([
      'v17-to-v18',
      'v18-to-v19',
    ]);
    expect(imported.save.schemaVersion).toBe(19);
    expect(imported.save.trainer.appearance).toEqual(appearance);
    expect(imported.save.visualProgression.baselineAppearance).toEqual(
      appearance,
    );
    expect(imported.save.visualProgression.development.chest).toBe(0);
    expect(imported.save.visualProgression.preferences.developmentLevel).toBe(
      'standard',
    );
  });

  it('migrates a v16 trainer appearance to v3 without changing progression', () => {
    const current = createDefaultSaveData();
    const legacy = JSON.parse(JSON.stringify(current)) as Record<string, any>;
    legacy.schemaVersion = 16;
    legacy.version = 'v16';
    legacy.trainingFatigue = 43;
    legacy.trainer.appearance.version = 2;
    legacy.trainer.appearance.build.shoulderWidth = 9;
    for (const attribute of TRAINER_BUILD_ATTRIBUTES.slice(22)) {
      delete legacy.trainer.appearance.build[attribute.id];
    }
    delete legacy.trainer.appearance.outfit.logoShapeId;
    delete legacy.trainer.appearance.outfit.chalkMarksId;
    delete legacy.trainer.appearance.colors.trimColorId;
    delete legacy.trainer.appearance.colors.logoColorId;
    delete legacy.trainer.appearance.accessories.towelId;

    const imported = importSaveJson(JSON.stringify(legacy));

    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.appliedMigrations).toEqual([
      'v16-to-v17',
      'v17-to-v18',
      'v18-to-v19',
    ]);
    expect(imported.save.schemaVersion).toBe(19);
    expect(imported.save.trainer.appearance.version).toBe(3);
    expect(imported.save.trainer.appearance.build.shoulderWidth).toBe(9);
    expect(imported.save.trainer.appearance.build.latWidth).toBe(
      DEFAULT_TRAINER_APPEARANCE.build.latWidth,
    );
    expect(imported.save.trainingFatigue).toBe(43);
  });

  it('migrates a v14 flat-color trainer into stable cosmetic option IDs', () => {
    const current = createDefaultSaveData();
    const legacyTrainer = {
      ...current.trainer,
      skin: '#70452f',
      hair: '#262626',
      top: '#6c2f8f',
      shoes: '#252525',
      glove: '#f3c56b',
    } as Record<string, unknown>;
    delete legacyTrainer.appearance;
    delete legacyTrainer.appearancePresets;
    const v14 = {
      ...current,
      schemaVersion: 14,
      version: 'v14',
      trainer: legacyTrainer,
    };

    const imported = importSaveJson(JSON.stringify(v14));

    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.fromVersion).toBe(14);
    expect(imported.appliedMigrations).toEqual([
      'v14-to-v15',
      'v15-to-v16',
      'v16-to-v17',
      'v17-to-v18',
      'v18-to-v19',
    ]);
    expect(imported.save.schemaVersion).toBe(19);
    expect(imported.save.team.every((buddy) => buddy.cosmetics?.version === 2))
      .toBe(true);
    expect(imported.save.trainer.appearance.version).toBe(3);
    expect(imported.save.trainer.appearance.colors.skinToneId).toBeTruthy();
    expect(imported.save.trainer.appearance.hair.colorId).toBeTruthy();
    expect(imported.save.trainer.appearancePresets).toEqual([]);
    expect(imported.save.trainerEquipmentBonuses).toEqual({
      power: 0,
      technique: 0,
      endurance: 0,
      mobility: 0,
      recovery: 0,
    });
  });

  it('migrates v15 Buddies to stable cosmetic IDs without changing stats', () => {
    const current = createDefaultSaveData();
    const original = current.team[0]!;
    const v15 = {
      ...current,
      schemaVersion: 15,
      version: 'v15',
      team: [
        {
          ...original,
          cosmetics: undefined,
        },
      ],
    };

    const imported = importSaveJson(JSON.stringify(v15));

    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.appliedMigrations).toEqual([
      'v15-to-v16',
      'v16-to-v17',
      'v17-to-v18',
      'v18-to-v19',
    ]);
    expect(imported.save.team[0]!.cosmetics?.version).toBe(2);
    expect(imported.save.team[0]!.level).toBe(original.level);
    expect(imported.save.team[0]!.xp).toBe(original.xp);
    expect(imported.save.team[0]!.form).toBe(original.form);
  });

  it('adds unified input and accessibility defaults to a v13 save', () => {
    const current = createDefaultSaveData();
    const legacyAccessibility = {
      reducedMotion: true,
      screenShake: false,
    };
    const v13 = {
      ...current,
      schemaVersion: 13,
      version: 'v13',
      accessibility: legacyAccessibility,
    } as Record<string, unknown>;
    delete v13.input;

    const imported = importSaveJson(JSON.stringify(v13));

    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.fromVersion).toBe(13);
    expect(imported.appliedMigrations).toEqual([
      'v13-to-v14',
      'v14-to-v15',
      'v15-to-v16',
      'v16-to-v17',
      'v17-to-v18',
      'v18-to-v19',
    ]);
    expect(imported.save.accessibility).toEqual({
      ...legacyAccessibility,
      highContrast: false,
      sustainedInputMode: 'hold',
      textSpeed: 'standard',
    });
    expect(imported.save.input.keyboardBindings.confirm).toEqual(['Enter']);
  });

  it('migrates a complete v12 save and restores legacy presentation settings', () => {
    const storage = new MemoryStorage();
    const legacy = JSON.parse(
      representativeJson('representative.v12-complete'),
    ) as Record<string, unknown>;
    legacy.audio = {
      enabled: false,
      musicVolume: 0.18,
      sfxVolume: 0.44,
    };
    storage.setItem(LEGACY_SAVE_KEYS[0]!, JSON.stringify(legacy));
    storage.setItem(
      LEGACY_PRESENTATION_SETTINGS_KEY,
      JSON.stringify({ reducedMotion: true, screenShake: false }),
    );

    const result = loadGameSave(storage);

    expect(result.source).toBe('legacy-v12');
    expect(result.recovered).toBe(true);
    expect(result.canAutosave).toBe(true);
    expect(result.save.schemaVersion).toBe(19);
    expect(result.save.version).toBe('v19');
    expect(result.save.trainer.appearance.version).toBe(3);
    expect(result.save.accessibility).toEqual({
      reducedMotion: true,
      screenShake: false,
      highContrast: false,
      sustainedInputMode: 'hold',
      textSpeed: 'standard',
    });
    expect(result.save.audio).toEqual({
      enabled: false,
      musicVolume: 0.18,
      sfxVolume: 0.44,
    });
    expect(result.save.team).toHaveLength(
      createDefaultSaveData().team.length,
    );
  });

  it('repairs a partial v12 save without trusting its wall-clock boss timer', () => {
    const imported = importSaveJson(
      representativeJson('representative.v12-partial'),
      {
        accessibility: {
          reducedMotion: false,
          screenShake: true,
          highContrast: false,
          sustainedInputMode: 'hold',
          textSpeed: 'standard',
        },
      },
    );

    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.appliedMigrations).toEqual([
      'v12-to-v13',
      'v13-to-v14',
      'v14-to-v15',
      'v15-to-v16',
      'v16-to-v17',
      'v17-to-v18',
      'v18-to-v19',
    ]);
    expect(imported.issues.length).toBeGreaterThan(0);
    expect(imported.save.team).toHaveLength(1);
    expect(imported.save.bossSchedules['starter-a']?.readyAtGameplayMs).toBe(
      imported.save.bossGameplayTimeMs + BOSS_LEGACY_MIGRATION_GRACE_MS,
    );
    expect(
      imported.save.bossSchedules['starter-a']?.readyAtGameplayMs,
    ).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });

  it('infers a versionless v12-shaped save and reports that inference', () => {
    const legacy = JSON.parse(
      representativeJson('representative.v12-complete'),
    ) as Record<string, unknown>;
    delete legacy.version;

    const imported = importSaveJson(JSON.stringify(legacy));

    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.fromVersion).toBe(12);
    expect(imported.issues.join(' ')).toContain('shape was inferred');
  });

  it('restores the default party when every stored party member is unreadable', () => {
    const partial = JSON.parse(
      representativeJson('representative.v12-complete'),
    ) as Record<string, unknown>;
    partial.team = [{ id: 'broken', speciesId: 'missing-species' }];

    const imported = importSaveJson(JSON.stringify(partial));

    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.save.team).toHaveLength(
      createDefaultSaveData().team.length,
    );
    expect(imported.issues.join(' ')).toContain(
      'No playable party members could be recovered',
    );
  });

  it('refuses unsupported future schemas without changing stored data', () => {
    const storage = new MemoryStorage();
    const future = JSON.stringify({
      format: 'gym-buddies-save',
      schemaVersion: 99,
      state: { schemaVersion: 99, version: 'v99' },
    });
    storage.setItem(SAVE_KEY, future);

    const loaded = loadGameSave(storage);
    const write = writeGameSave(storage, createDefaultSaveData());

    expect(loaded.source).toBe('default');
    expect(loaded.canAutosave).toBe(false);
    expect(write.ok).toBe(false);
    expect(storage.getItem(SAVE_KEY)).toBe(future);
  });
});

describe('save recovery and backups', () => {
  it('recovers a valid previous save when the primary JSON is corrupted', () => {
    const storage = new MemoryStorage();
    const previous = createDefaultSaveData();
    previous.trainer.name = 'Backup Ari';
    storage.setItem(SAVE_KEY, '{"schemaVersion":13');
    storage.setItem(SAVE_BACKUP_KEY, exportSaveJson(previous));

    const loaded = loadGameSave(storage);

    expect(loaded.source).toBe('previous');
    expect(loaded.recovered).toBe(true);
    expect(loaded.save.trainer.name).toBe('Backup Ari');
    expect(storage.getItem(SAVE_KEY)).toBe('{"schemaVersion":13');
  });

  it('keeps corrupted data untouched and pauses autosave when no recovery exists', () => {
    const storage = new MemoryStorage();
    const corrupted = '{"version":"v12","trainer":';
    storage.setItem(SAVE_KEY, corrupted);

    const loaded = loadGameSave(storage);

    expect(loaded.source).toBe('default');
    expect(loaded.canAutosave).toBe(false);
    expect(loaded.message).toContain('left untouched');
    expect(storage.getItem(SAVE_KEY)).toBe(corrupted);
  });

  it('copies a valid current save to the previous slot before replacing it', () => {
    const storage = new MemoryStorage();
    const current = createDefaultSaveData();
    current.trainer.name = 'Before';
    const currentJson = exportSaveJson(
      current,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    storage.setItem(SAVE_KEY, currentJson);
    const next: SaveData = {
      ...current,
      trainer: { ...current.trainer, name: 'After' },
    };

    const written = writeGameSave(storage, next, {
      now: new Date('2026-01-02T00:00:00.000Z'),
    });

    expect(written).toEqual({ ok: true, backupCreated: true });
    expect(storage.getItem(SAVE_BACKUP_KEY)).toBe(currentJson);
    expect(loadGameSave(storage).save.trainer.name).toBe('After');
  });

  it('does not rotate the previous backup when only envelope metadata changes', () => {
    const storage = new MemoryStorage();
    const save = createDefaultSaveData();
    const previous = exportSaveJson({
      ...save,
      trainer: { ...save.trainer, name: 'Meaningful Backup' },
    });
    storage.setItem(
      SAVE_KEY,
      exportSaveJson(save, new Date('2026-01-01T00:00:00.000Z')),
    );
    storage.setItem(SAVE_BACKUP_KEY, previous);

    const written = writeGameSave(storage, save, {
      now: new Date('2026-01-02T00:00:00.000Z'),
    });

    expect(written).toEqual({ ok: true, backupCreated: false });
    expect(storage.getItem(SAVE_BACKUP_KEY)).toBe(previous);
  });

  it('leaves the current save readable when browser storage rejects a replacement', () => {
    const storage = new MemoryStorage();
    const current = createDefaultSaveData();
    const currentJson = exportSaveJson(current);
    storage.setItem(SAVE_KEY, currentJson);
    const failingStorage: SaveStorage = {
      getItem: (key) => storage.getItem(key),
      removeItem: (key) => storage.removeItem(key),
      setItem: (key, value) => {
        if (key === SAVE_KEY) throw new Error('Simulated quota failure.');
        storage.setItem(key, value);
      },
    };

    const written = writeGameSave(failingStorage, {
      ...current,
      trainer: { ...current.trainer, name: 'Not Written' },
    });

    expect(written.ok).toBe(false);
    expect(storage.getItem(SAVE_KEY)).toBe(currentJson);
    expect(loadGameSave(storage).save.trainer.name).not.toBe('Not Written');
  });

  it('can explicitly replace a future save while preserving recoverable state rules', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({ schemaVersion: 99, version: 'v99' }),
    );

    const written = writeGameSave(storage, createDefaultSaveData(), {
      allowOverwriteUnsupported: true,
    });

    expect(written.ok).toBe(true);
    expect(loadGameSave(storage).source).toBe('primary');
  });
});

describe('manual save transfer and serialization boundaries', () => {
  it('round-trips audio, accessibility, progression, and boss state through export/import', () => {
    const defaults = createDefaultSaveData();
    const save: SaveData = {
      ...defaults,
      trainingFatigue: 47,
      bossGameplayTimeMs: 72_000,
      audio: {
        enabled: false,
        musicVolume: 0.2,
        sfxVolume: 0.35,
      },
      accessibility: {
        reducedMotion: true,
        screenShake: false,
        highContrast: true,
        sustainedInputMode: 'toggle',
        textSpeed: 'fast',
      },
      input: {
        keyboardBindings: remapKeyboardBinding(
          defaults.input.keyboardBindings,
          'confirm',
          'KeyQ',
        ),
      },
    };

    const exported = exportSaveJson(
      save,
      new Date('2026-01-03T00:00:00.000Z'),
    );
    const envelope = JSON.parse(exported) as {
      state: { team: Array<Record<string, unknown>> };
    };
    const imported = importSaveJson(exported);

    expect(envelope.state.team[0]?.speciesId).toBe(
      save.team[0]?.creature.id,
    );
    expect(envelope.state.team[0]?.creature).toBeUndefined();
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.save.trainingFatigue).toBe(47);
    expect(imported.save.bossGameplayTimeMs).toBe(72_000);
    expect(imported.save.audio).toEqual(save.audio);
    expect(imported.save.accessibility).toEqual(save.accessibility);
    expect(imported.save.input).toEqual(save.input);
  });

  it('rejects malformed imports without writing or replacing the current save', () => {
    const storage = new MemoryStorage();
    const current = exportSaveJson(createDefaultSaveData());
    storage.setItem(SAVE_KEY, current);

    const imported = importSaveJson('{"version":"v12"');

    expect(imported.ok).toBe(false);
    expect(storage.getItem(SAVE_KEY)).toBe(current);
  });

  it('rejects save text above the import limit before parsing', () => {
    const imported = importSaveJson(
      ' '.repeat(SAVE_IMPORT_MAX_BYTES + 1),
    );

    expect(imported.ok).toBe(false);
    if (imported.ok) return;
    expect(imported.message).toContain('1 MiB');
  });

  it('recovers unknown legacy Buddies with trusted render data', () => {
    const save = createDefaultSaveData();
    const original = save.team[0]!;
    const crafted = {
      ...save,
      team: [
        {
          ...original,
          creature: {
            dex: 999,
            name: 'Archive Friend',
            palette: null,
            sprite: {},
            animations: null,
          },
        },
      ],
    };

    const imported = importSaveJson(JSON.stringify(crafted));

    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    const creature = imported.save.team[0]!.creature;
    expect(creature.id).toBe('legacy-dex-999');
    expect(creature.name).toBe('Archive Friend');
    expect(Array.isArray(creature.sprite)).toBe(true);
    expect(creature.palette).toEqual(
      createDefaultSaveData().team[0]!.creature.palette,
    );
    expect(creature.animations.idle).toBe('buddy.legacy-dex-999.idle');
  });

  it('rejects runtime objects and callable values from simulation state', () => {
    const withRuntimeObjects = {
      ...createDefaultSaveData(),
      phaserScene: new Date(),
      audioNode: () => undefined,
    };

    const validation = validateSerializableState(withRuntimeObjects);

    expect(validation.valid).toBe(false);
    expect(validation.issues.join(' ')).toContain('runtime object');
    expect(validation.issues.join(' ')).toContain('function');
  });

  it('keeps representative developer fixtures aligned with the importer', () => {
    const results = createRepresentativeTestSaves().map((entry) => ({
      id: entry.id,
      result: importSaveJson(entry.json),
    }));

    for (const entry of results) {
      expect(entry.result.ok).toBe(
        entry.id !== 'representative.corrupted',
      );
    }
  });
});
