import {
  CURRENT_SAVE_SCHEMA_VERSION,
  SAVE_EXPORT_FORMAT,
  SAVE_VERSION,
} from '../content/save';
import { DEFAULT_KEYBOARD_BINDINGS } from '../input/actionMap';
import { createLegacyTrainerAppearance } from '../content/trainerAppearance';
import { BUDDY_CHARACTER_DESIGN_BY_SPECIES_ID } from '../content/buddyCharacters';
import { normalizeBuddyCosmetics } from '../systems/buddyCosmetics';
import type { SaveAccessibilitySettings } from '../types';

type UnknownRecord = Record<string, unknown>;

export type SupportedSaveSchemaVersion =
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19;

export type SaveMigrationResult =
  | {
      ok: true;
      payload: UnknownRecord;
      fromVersion: SupportedSaveSchemaVersion;
      appliedMigrations: string[];
      warnings: string[];
    }
  | {
      ok: false;
      reason: 'invalid-root' | 'unsupported-version';
      message: string;
      detectedVersion: number | null;
    };

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function unwrapSaveExport(value: unknown) {
  if (
    isRecord(value) &&
    value.format === SAVE_EXPORT_FORMAT &&
    isRecord(value.state)
  ) {
    return value.state;
  }
  return value;
}

export function detectSaveSchemaVersion(
  value: unknown,
): SupportedSaveSchemaVersion | number | null {
  const payload = unwrapSaveExport(value);
  if (!isRecord(payload)) return null;
  if (
    typeof payload.schemaVersion === 'number' &&
    Number.isInteger(payload.schemaVersion)
  ) {
    return payload.schemaVersion;
  }
  if (payload.version === 'v13') return 13;
  if (payload.version === 'v14') return 14;
  if (payload.version === 'v15') return 15;
  if (payload.version === 'v16') return 16;
  if (payload.version === 'v17') return 17;
  if (payload.version === 'v18') return 18;
  if (payload.version === 'v19') return 19;
  if (payload.version === 'v12') return 12;
  if (
    'trainer' in payload ||
    'team' in payload ||
    'bossSchedules' in payload
  ) {
    return 12;
  }
  return null;
}

function migrateV12ToV13(
  raw: UnknownRecord,
  accessibility: SaveAccessibilitySettings,
) {
  return {
    ...raw,
    schemaVersion: 13,
    version: 'v13',
    accessibility: isRecord(raw.accessibility)
      ? raw.accessibility
      : accessibility,
  };
}

function migrateV13ToV14(
  raw: UnknownRecord,
  accessibility: SaveAccessibilitySettings,
) {
  const rawAccessibility = isRecord(raw.accessibility)
    ? raw.accessibility
    : {};
  return {
    ...raw,
    schemaVersion: 14,
    version: 'v14',
    accessibility: {
      ...accessibility,
      ...rawAccessibility,
    },
    input: isRecord(raw.input)
      ? raw.input
      : {
          keyboardBindings: Object.fromEntries(
            Object.entries(DEFAULT_KEYBOARD_BINDINGS).map(
              ([action, codes]) => [action, [...codes]],
            ),
          ),
        },
  };
}

function migrateV14ToV15(raw: UnknownRecord) {
  const rawTrainer = isRecord(raw.trainer) ? raw.trainer : {};
  return {
    ...raw,
    schemaVersion: 15,
    version: 'v15',
    trainer: {
      ...rawTrainer,
      appearance: isRecord(rawTrainer.appearance)
        ? rawTrainer.appearance
        : createLegacyTrainerAppearance(rawTrainer),
      appearancePresets: Array.isArray(rawTrainer.appearancePresets)
        ? rawTrainer.appearancePresets
        : [],
    },
    trainerEquipmentBonuses: isRecord(raw.trainerEquipmentBonuses)
      ? raw.trainerEquipmentBonuses
      : {
          power: 0,
          technique: 0,
          endurance: 0,
          mobility: 0,
          recovery: 0,
        },
  };
}

function migrateV15ToV16(raw: UnknownRecord) {
  const team = Array.isArray(raw.team)
    ? raw.team.map((entry) => {
        if (!isRecord(entry)) return entry;
        const creature = isRecord(entry.creature) ? entry.creature : null;
        const speciesId =
          typeof entry.speciesId === 'string'
            ? entry.speciesId
            : creature && typeof creature.id === 'string'
              ? creature.id
              : null;
        if (
          !speciesId ||
          !BUDDY_CHARACTER_DESIGN_BY_SPECIES_ID.has(speciesId)
        ) {
          return entry;
        }
        return {
          ...entry,
          cosmetics: normalizeBuddyCosmetics(
            speciesId,
            isRecord(entry.cosmetics) ? entry.cosmetics : undefined,
          ),
        };
      })
    : raw.team;
  return {
    ...raw,
    schemaVersion: 16,
    version: 'v16',
    team,
  };
}

function migrateV16ToV17(raw: UnknownRecord) {
  return {
    ...raw,
    schemaVersion: 17,
    version: 'v17',
  };
}

function migrateV17ToV18(raw: UnknownRecord) {
  return {
    ...raw,
    schemaVersion: 18,
    version: 'v18',
    visualProgression: isRecord(raw.visualProgression)
      ? raw.visualProgression
      : null,
  };
}

function migrateV18ToV19(raw: UnknownRecord) {
  const team = Array.isArray(raw.team)
    ? raw.team.map((entry) => {
        if (!isRecord(entry)) return entry;
        const creature = isRecord(entry.creature) ? entry.creature : null;
        const speciesId =
          typeof entry.speciesId === 'string'
            ? entry.speciesId
            : creature && typeof creature.id === 'string'
              ? creature.id
              : null;
        if (
          !speciesId ||
          !BUDDY_CHARACTER_DESIGN_BY_SPECIES_ID.has(speciesId)
        ) return entry;
        return {
          ...entry,
          cosmetics: normalizeBuddyCosmetics(
            speciesId,
            isRecord(entry.cosmetics) ? entry.cosmetics : undefined,
          ),
        };
      })
    : raw.team;
  return {
    ...raw,
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    version: SAVE_VERSION,
    team,
  };
}

export function migrateSaveToCurrent(
  value: unknown,
  context: {
    accessibility: SaveAccessibilitySettings;
  },
): SaveMigrationResult {
  const payload = unwrapSaveExport(value);
  if (!isRecord(payload)) {
    return {
      ok: false,
      reason: 'invalid-root',
      message: 'Save JSON must contain an object.',
      detectedVersion: null,
    };
  }
  const detectedVersion = detectSaveSchemaVersion(payload);
  if (detectedVersion === null) {
    return {
      ok: false,
      reason: 'unsupported-version',
      message:
        'Save schema version could not be identified. The data was left untouched.',
      detectedVersion,
    };
  }
  if (detectedVersion > CURRENT_SAVE_SCHEMA_VERSION) {
    return {
      ok: false,
      reason: 'unsupported-version',
      message: `Save schema ${detectedVersion} is newer than supported schema ${CURRENT_SAVE_SCHEMA_VERSION}. The data was left untouched.`,
      detectedVersion,
    };
  }
  if (detectedVersion < 12) {
    return {
      ok: false,
      reason: 'unsupported-version',
      message: `Save schema ${detectedVersion} is no longer supported. The data was left untouched.`,
      detectedVersion,
    };
  }

  let current = payload;
  const appliedMigrations: string[] = [];
  const warnings: string[] = [];
  if (
    payload.schemaVersion === undefined &&
    payload.version === undefined
  ) {
    warnings.push(
      'The legacy save had no explicit version; its v12 shape was inferred.',
    );
  }
  if (detectedVersion === 12) {
    current = migrateV12ToV13(current, context.accessibility);
    appliedMigrations.push('v12-to-v13');
  }
  if (detectedVersion <= 13) {
    current = migrateV13ToV14(current, context.accessibility);
    appliedMigrations.push('v13-to-v14');
  }
  if (detectedVersion <= 14) {
    current = migrateV14ToV15(current);
    appliedMigrations.push('v14-to-v15');
  }
  if (detectedVersion <= 15) {
    current = migrateV15ToV16(current);
    appliedMigrations.push('v15-to-v16');
  }
  if (detectedVersion <= 16) {
    current = migrateV16ToV17(current);
    appliedMigrations.push('v16-to-v17');
  }
  if (detectedVersion <= 17) {
    current = migrateV17ToV18(current);
    appliedMigrations.push('v17-to-v18');
  }
  if (detectedVersion <= 18) {
    current = migrateV18ToV19(current);
    appliedMigrations.push('v18-to-v19');
  }
  return {
    ok: true,
    payload: current,
    fromVersion: detectedVersion as SupportedSaveSchemaVersion,
    appliedMigrations,
    warnings,
  };
}
