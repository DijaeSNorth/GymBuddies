import {
  CURRENT_SAVE_SCHEMA_VERSION,
  LEGACY_PRESENTATION_SETTINGS_KEY,
  LEGACY_SAVE_KEYS,
  SAVE_BACKUP_KEY,
  SAVE_EXPORT_FORMAT,
  SAVE_IMPORT_MAX_BYTES,
  SAVE_KEY,
} from '../content/save';
import type {
  SaveAccessibilitySettings,
  SaveData,
  SaveExportEnvelope,
  SerializedSaveState,
} from '../types';
import {
  detectSaveSchemaVersion,
  migrateSaveToCurrent,
} from './saveMigrations';
import {
  createDefaultSaveData,
  getDefaultAccessibilitySettings,
} from './saveDefaults';
import {
  normalizeSaveData,
  validateSaveData,
} from './saveValidation';

export type SaveStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
>;

export type SaveLoadSource =
  | 'primary'
  | 'previous'
  | 'legacy-v12'
  | 'default';

export type SaveLoadResult = {
  save: SaveData;
  source: SaveLoadSource;
  canAutosave: boolean;
  recovered: boolean;
  issues: string[];
  message: string;
};

export type SaveWriteResult =
  | {
      ok: true;
      backupCreated: boolean;
    }
  | {
      ok: false;
      message: string;
      issues: string[];
    };

export type SaveImportResult =
  | {
      ok: true;
      save: SaveData;
      issues: string[];
      appliedMigrations: string[];
      fromVersion: number;
    }
  | {
      ok: false;
      message: string;
      issues: string[];
    };

type DecodedSave =
  | {
      ok: true;
      save: SaveData;
      issues: string[];
      appliedMigrations: string[];
      fromVersion: number;
    }
  | {
      ok: false;
      message: string;
      issues: string[];
      unsupportedFutureVersion: boolean;
    };

export function getBrowserSaveStorage(): SaveStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readLegacyAccessibility(
  storage: SaveStorage | null,
): SaveAccessibilitySettings {
  const fallback = getDefaultAccessibilitySettings();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(LEGACY_PRESENTATION_SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SaveAccessibilitySettings>;
    return {
      reducedMotion:
        typeof parsed.reducedMotion === 'boolean'
          ? parsed.reducedMotion
          : fallback.reducedMotion,
      screenShake:
        typeof parsed.screenShake === 'boolean'
          ? parsed.screenShake
          : fallback.screenShake,
      highContrast:
        typeof parsed.highContrast === 'boolean'
          ? parsed.highContrast
          : fallback.highContrast,
      sustainedInputMode:
        parsed.sustainedInputMode === 'toggle' ||
        parsed.sustainedInputMode === 'hold'
          ? parsed.sustainedInputMode
          : fallback.sustainedInputMode,
      textSpeed:
        parsed.textSpeed === 'slow' ||
        parsed.textSpeed === 'standard' ||
        parsed.textSpeed === 'fast' ||
        parsed.textSpeed === 'instant'
          ? parsed.textSpeed
          : fallback.textSpeed,
    };
  } catch {
    return fallback;
  }
}

function decodeSaveJson(
  text: string,
  fallback: SaveData,
  accessibility: SaveAccessibilitySettings,
): DecodedSave {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      message: 'Save JSON could not be parsed.',
      issues: ['The JSON text is incomplete or corrupted.'],
      unsupportedFutureVersion: false,
    };
  }
  const detectedVersion = detectSaveSchemaVersion(parsed);
  const migration = migrateSaveToCurrent(parsed, { accessibility });
  if (!migration.ok) {
    return {
      ok: false,
      message: migration.message,
      issues: [migration.message],
      unsupportedFutureVersion:
        typeof detectedVersion === 'number' &&
        detectedVersion > CURRENT_SAVE_SCHEMA_VERSION,
    };
  }
  try {
    const normalized = normalizeSaveData(migration.payload, fallback);
    const validation = validateSaveData(normalized.save);
    if (!validation.valid) {
      return {
        ok: false,
        message: 'Save data failed schema validation.',
        issues: validation.issues,
        unsupportedFutureVersion: false,
      };
    }
    return {
      ok: true,
      save: normalized.save,
      issues: [...migration.warnings, ...normalized.issues],
      appliedMigrations: migration.appliedMigrations,
      fromVersion: migration.fromVersion,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : 'Save data could not be normalized.',
      issues: ['The save root or required identity data was invalid.'],
      unsupportedFutureVersion: false,
    };
  }
}

function defaultLoadResult(
  fallback: SaveData,
  options?: {
    canAutosave?: boolean;
    issues?: string[];
    message?: string;
  },
): SaveLoadResult {
  return {
    save: fallback,
    source: 'default',
    canAutosave: options?.canAutosave ?? true,
    recovered: false,
    issues: options?.issues ?? [],
    message: options?.message ?? 'Started a new local journey.',
  };
}

export function loadGameSave(
  storage: SaveStorage | null = getBrowserSaveStorage(),
): SaveLoadResult {
  const accessibility = readLegacyAccessibility(storage);
  const fallback = createDefaultSaveData({ accessibility });
  if (!storage) {
    return defaultLoadResult(fallback, {
      canAutosave: false,
      issues: ['Browser storage is unavailable.'],
      message:
        'Started an in-memory journey because browser storage is unavailable.',
    });
  }

  const issues: string[] = [];
  let unsupportedPrimary = false;
  const candidates: Array<{
    key: string;
    source: Exclude<SaveLoadSource, 'default'>;
  }> = [
    { key: SAVE_KEY, source: 'primary' },
    { key: SAVE_BACKUP_KEY, source: 'previous' },
    ...LEGACY_SAVE_KEYS.map((key) => ({
      key,
      source: 'legacy-v12' as const,
    })),
  ];
  let sawStoredData = false;

  for (const candidate of candidates) {
    let raw: string | null;
    try {
      raw = storage.getItem(candidate.key);
    } catch {
      return defaultLoadResult(fallback, {
        canAutosave: false,
        issues: ['Browser storage could not be read.'],
        message:
          'Started an in-memory journey because browser storage could not be read.',
      });
    }
    if (!raw) continue;
    sawStoredData = true;
    const decoded = decodeSaveJson(raw, fallback, accessibility);
    if (!decoded.ok) {
      issues.push(`${candidate.source}: ${decoded.message}`);
      if (
        candidate.source === 'primary' &&
        decoded.unsupportedFutureVersion
      ) {
        unsupportedPrimary = true;
      }
      continue;
    }
    const migrated = decoded.appliedMigrations.length > 0;
    const recovered = candidate.source !== 'primary';
    return {
      save: decoded.save,
      source: candidate.source,
      canAutosave: !unsupportedPrimary,
      recovered,
      issues: [...issues, ...decoded.issues],
      message:
        candidate.source === 'primary'
          ? migrated
            ? `Loaded and migrated save schema ${decoded.fromVersion} to ${CURRENT_SAVE_SCHEMA_VERSION}.`
            : decoded.issues.length
              ? `Loaded save schema ${CURRENT_SAVE_SCHEMA_VERSION} with safe field recovery.`
              : `Loaded save schema ${CURRENT_SAVE_SCHEMA_VERSION}.`
          : candidate.source === 'previous'
            ? 'Recovered the previous valid save because the primary save could not be used.'
            : 'Recovered and migrated the legacy v12 Gym Buddies save.',
    };
  }

  return defaultLoadResult(fallback, {
    canAutosave: !sawStoredData,
    issues,
    message: sawStoredData
      ? 'Stored save data could not be used. It was left untouched; import a valid save or confirm a reset.'
      : 'No existing save was found. Started a new journey.',
  });
}

function createEnvelope(
  save: SaveData,
  now = new Date(),
): SaveExportEnvelope {
  return {
    format: SAVE_EXPORT_FORMAT,
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    savedAt: now.toISOString(),
    state: toSerializableSaveState(save),
  };
}

export function toSerializableSaveState(
  save: SaveData,
): SerializedSaveState {
  const { team, ...state } = save;
  return {
    ...state,
    team: team.map(({ creature, ...buddy }) => ({
      ...buddy,
      speciesId: creature.id,
    })),
  };
}

function canonicalJson(value: unknown): string {
  const canonicalize = (entry: unknown): unknown => {
    if (Array.isArray(entry)) return entry.map(canonicalize);
    if (!entry || typeof entry !== 'object') return entry;
    return Object.fromEntries(
      Object.entries(entry)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  };
  return JSON.stringify(canonicalize(value));
}

export function exportSaveJson(save: SaveData, now = new Date()) {
  const validation = validateSaveData(save);
  if (!validation.valid) {
    throw new Error(
      `Cannot export invalid save data: ${validation.issues.join(' ')}`,
    );
  }
  return JSON.stringify(createEnvelope(save, now), null, 2);
}

export function importSaveJson(
  text: string,
  options?: {
    fallback?: SaveData;
    accessibility?: SaveAccessibilitySettings;
  },
): SaveImportResult {
  if (text.length > SAVE_IMPORT_MAX_BYTES) {
    return {
      ok: false,
      message: 'Save JSON exceeds the 1 MiB import limit.',
      issues: [
        'Choose a Gym Buddies save file smaller than 1 MiB.',
      ],
    };
  }
  const accessibility =
    options?.accessibility ?? getDefaultAccessibilitySettings();
  const fallback =
    options?.fallback ?? createDefaultSaveData({ accessibility });
  const decoded = decodeSaveJson(text, fallback, accessibility);
  if (!decoded.ok) {
    return {
      ok: false,
      message: decoded.message,
      issues: decoded.issues,
    };
  }
  return {
    ok: true,
    save: decoded.save,
    issues: decoded.issues,
    appliedMigrations: decoded.appliedMigrations,
    fromVersion: decoded.fromVersion,
  };
}

export function writeGameSave(
  storage: SaveStorage | null,
  save: SaveData,
  options?: {
    allowOverwriteUnsupported?: boolean;
    now?: Date;
  },
): SaveWriteResult {
  if (!storage) {
    return {
      ok: false,
      message: 'Browser storage is unavailable.',
      issues: ['No writable save storage was provided.'],
    };
  }
  const validation = validateSaveData(save);
  if (!validation.valid) {
    return {
      ok: false,
      message: 'Save data was not written because validation failed.',
      issues: validation.issues,
    };
  }

  const accessibility = save.accessibility;
  const fallback = createDefaultSaveData({ accessibility });
  const serialized = JSON.stringify(
    createEnvelope(save, options?.now),
  );
  let backupCreated = false;
  try {
    const current = storage.getItem(SAVE_KEY);
    if (current) {
      const currentVersion = (() => {
        try {
          return detectSaveSchemaVersion(JSON.parse(current));
        } catch {
          return null;
        }
      })();
      if (
        typeof currentVersion === 'number' &&
        currentVersion > CURRENT_SAVE_SCHEMA_VERSION &&
        !options?.allowOverwriteUnsupported
      ) {
        return {
          ok: false,
          message:
            'A newer save schema is stored locally. It was not overwritten.',
          issues: [
            `Stored schema ${currentVersion} is newer than supported schema ${CURRENT_SAVE_SCHEMA_VERSION}.`,
          ],
        };
      }
      const decodedCurrent = decodeSaveJson(
        current,
        fallback,
        accessibility,
      );
      const currentStateChanged =
        decodedCurrent.ok &&
        canonicalJson(toSerializableSaveState(decodedCurrent.save)) !==
          canonicalJson(toSerializableSaveState(save));
      const currentNeedsMigration =
        currentVersion !== CURRENT_SAVE_SCHEMA_VERSION ||
        (decodedCurrent.ok && decodedCurrent.issues.length > 0);
      if (
        decodedCurrent.ok &&
        (currentStateChanged || currentNeedsMigration)
      ) {
        storage.setItem(SAVE_BACKUP_KEY, current);
        backupCreated = true;
      }
    }
    storage.setItem(SAVE_KEY, serialized);
    const verification = storage.getItem(SAVE_KEY);
    if (!verification) {
      throw new Error('Save verification read returned no data.');
    }
    const decoded = decodeSaveJson(
      verification,
      fallback,
      accessibility,
    );
    if (!decoded.ok) {
      throw new Error(decoded.message);
    }
    return { ok: true, backupCreated };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : 'Browser storage rejected the save.',
      issues: ['The previous valid save and backup were not deleted.'],
    };
  }
}

export function loadPreviousSave(
  storage: SaveStorage | null,
  fallback?: SaveData,
): SaveImportResult {
  if (!storage) {
    return {
      ok: false,
      message: 'Browser storage is unavailable.',
      issues: [],
    };
  }
  try {
    const raw = storage.getItem(SAVE_BACKUP_KEY);
    if (!raw) {
      return {
        ok: false,
        message: 'No previous save backup is available.',
        issues: [],
      };
    }
    return importSaveJson(raw, {
      fallback,
      accessibility: fallback?.accessibility,
    });
  } catch {
    return {
      ok: false,
      message: 'The previous save backup could not be read.',
      issues: [],
    };
  }
}

export function hasPreviousSave(storage: SaveStorage | null) {
  if (!storage) return false;
  try {
    return Boolean(storage.getItem(SAVE_BACKUP_KEY));
  } catch {
    return false;
  }
}
