import {
  getBuddySpeciesById,
  normalizeBuddyDexList,
  resolveBuddySpeciesIdentity,
} from '../content/buddies';
import { CAPTURE_BATTLE_SPEEDS } from '../content/captureBalance';
import { GYMS, STARTING_ZONE_ID } from '../content/gyms';
import { ALL_TRAINING_MACHINES } from '../content/machines';
import { FALLBACK_UNLOCKED_ZONES, WORLD_ROUTES } from '../content/routes';
import {
  CURRENT_SAVE_SCHEMA_VERSION,
  SAVE_VERSION,
  TEAM_SIZE,
} from '../content/save';
import { TUTORIAL_STEPS } from '../content/tutorial';
import {
  JOURNEY_GYM_ZONE_IDS,
  inferVisitedZoneIds,
} from '../content/worldGraph';
import { BUDDY_STAT_LIMITS, FATIGUE_BALANCE, WORKOUT_BALANCE } from '../content/balance';
import {
  cloneTrainerAppearance,
  createLegacyTrainerAppearance,
  trainerAppearanceLegacyPalette,
} from '../content/trainerAppearance';
import { restoreBossSchedule, normalizeBossGameplayTime } from '../systems/bossScheduling';
import { clampBuddyStat } from '../systems/buddyProgression';
import {
  normalizeBuddyCosmetics,
  validateBuddyCosmetics,
} from '../systems/buddyCosmetics';
import { clamp, clamp01 } from '../systems/math';
import { clampTrainerMuscles } from '../systems/trainerProgression';
import {
  normalizeKeyboardBindings,
  validateKeyboardBindings,
} from '../input/actionMap';
import { normalizeUnlockedZones } from '../systems/unlockProgression';
import {
  cloneTrainerAppearancePresets,
  normalizeTrainerAppearance,
  normalizeTrainerAppearancePresets,
  validateTrainerAppearance,
} from '../systems/trainerAppearance';
import { normalizeVisualProgression } from './visualProgressionValidation';
import type {
  BossSchedule,
  Buddy,
  CaptureBattleSpeed,
  GymZoneId,
  SaveData,
  TrainerProfile,
} from '../types';

type UnknownRecord = Record<string, unknown>;

export type SaveNormalizationResult = {
  save: SaveData;
  issues: string[];
};

export type SerializableValidationResult = {
  valid: boolean;
  issues: string[];
};

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback;
}

function integer(value: unknown, fallback: number) {
  return Math.round(finiteNumber(value, fallback));
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function recordIssue(
  issues: string[],
  condition: boolean,
  issue: string,
) {
  if (condition) issues.push(issue);
}

function normalizeTrainer(
  raw: unknown,
  fallback: TrainerProfile,
  issues: string[],
): TrainerProfile {
  if (!isRecord(raw)) {
    issues.push('Trainer profile was missing; restored defaults.');
    return {
      ...fallback,
      muscles: { ...fallback.muscles },
      appearance: cloneTrainerAppearance(fallback.appearance),
      appearancePresets: cloneTrainerAppearancePresets(
        fallback.appearancePresets,
      ),
    };
  }
  const muscles = isRecord(raw.muscles) ? raw.muscles : {};
  const normalizedAppearance = normalizeTrainerAppearance(
    isRecord(raw.appearance)
      ? raw.appearance
      : createLegacyTrainerAppearance(raw),
    fallback.appearance,
  );
  const normalizedPresets = normalizeTrainerAppearancePresets(
    raw.appearancePresets,
  );
  issues.push(...normalizedAppearance.issues, ...normalizedPresets.issues);
  const legacyPalette = trainerAppearanceLegacyPalette(
    normalizedAppearance.appearance,
  );
  return {
    name:
      typeof raw.name === 'string' && raw.name.trim()
        ? raw.name.slice(0, 14)
        : fallback.name,
    ...legacyPalette,
    appearance: normalizedAppearance.appearance,
    appearancePresets: normalizedPresets.presets,
    muscles: clampTrainerMuscles({
      shoulders: finiteNumber(
        muscles.shoulders,
        fallback.muscles.shoulders,
      ),
      chest: finiteNumber(muscles.chest, fallback.muscles.chest),
      arms: finiteNumber(muscles.arms, fallback.muscles.arms),
      triceps: finiteNumber(
        muscles.triceps,
        fallback.muscles.triceps,
      ),
      core: finiteNumber(muscles.core, fallback.muscles.core),
      quads: finiteNumber(muscles.quads, fallback.muscles.quads),
      calves: finiteNumber(muscles.calves, fallback.muscles.calves),
      back: finiteNumber(muscles.back, fallback.muscles.back),
    }),
  };
}

function resolveStoredSpecies(raw: UnknownRecord) {
  const creature = raw.creature;
  if (isRecord(creature) && typeof creature.dex === 'number') {
    return resolveBuddySpeciesIdentity(
      creature as unknown as Parameters<
        typeof resolveBuddySpeciesIdentity
      >[0],
    );
  }
  const speciesId =
    typeof raw.speciesId === 'string'
      ? raw.speciesId
      : isRecord(creature) && typeof creature.id === 'string'
        ? creature.id
        : null;
  if (speciesId) {
    try {
      return getBuddySpeciesById(speciesId);
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeBuddy(
  raw: unknown,
  issues: string[],
  index: number,
): Buddy | null {
  if (!isRecord(raw)) {
    issues.push(`Party entry ${index + 1} was not an object and was skipped.`);
    return null;
  }
  const creature = resolveStoredSpecies(raw);
  if (!creature) {
    issues.push(
      `Party entry ${index + 1} had no recognizable Buddy species and was skipped.`,
    );
    return null;
  }
  const level = clamp(integer(raw.level, 1), 1, 60);
  const maxHp = Math.max(18, integer(raw.maxHp, 18));
  return {
    id: stringValue(raw.id, `recovered-${creature.id}-${index}`),
    nickname: stringValue(raw.nickname, creature.name).slice(0, 32),
    creature,
    cosmetics: normalizeBuddyCosmetics(
      creature.id,
      isRecord(raw.cosmetics) ? raw.cosmetics : undefined,
    ),
    level,
    hp: clamp(integer(raw.hp, maxHp), 1, maxHp),
    maxHp,
    xp: Math.max(0, integer(raw.xp, 0)),
    trainingSessions: Math.max(0, integer(raw.trainingSessions, 0)),
    form: clampBuddyStat(
      integer(raw.form, creature.form),
      BUDDY_STAT_LIMITS.form,
      1,
    ),
    mobility: clampBuddyStat(
      integer(raw.mobility, creature.mobility),
      BUDDY_STAT_LIMITS.mobility,
      1,
    ),
    volume: clampBuddyStat(
      integer(raw.volume, creature.volume),
      BUDDY_STAT_LIMITS.volume,
      1,
    ),
  } satisfies Buddy;
}

function normalizeDexEntries(
  value: unknown,
  fallback: readonly number[],
  issues: string[],
  label: string,
) {
  if (!Array.isArray(value)) {
    issues.push(`${label} was missing; restored known entries.`);
    return [...fallback];
  }
  const numeric = value.filter(
    (entry): entry is number =>
      typeof entry === 'number' && Number.isFinite(entry),
  );
  recordIssue(
    issues,
    numeric.length !== value.length,
    `${label} contained invalid entries; those entries were skipped.`,
  );
  return normalizeBuddyDexList(numeric);
}

function normalizeMastery(
  value: unknown,
  issues: string[],
) {
  if (!isRecord(value)) return {};
  const machineIds = new Set(
    ALL_TRAINING_MACHINES.map((machine) => machine.id),
  );
  const entries = Object.entries(value).flatMap(([machineId, raw]) => {
    if (!machineIds.has(machineId) || !isRecord(raw)) {
      issues.push(
        `Machine mastery entry "${machineId}" was invalid and was skipped.`,
      );
      return [];
    }
    return [
      [
        machineId,
        {
          xp: Math.max(0, integer(raw.xp, 0)),
          sessions: Math.max(0, integer(raw.sessions, 0)),
          successfulSessions: Math.max(
            0,
            integer(raw.successfulSessions, 0),
          ),
          bestQuality: clamp01(finiteNumber(raw.bestQuality, 0)),
        },
      ] as const,
    ];
  });
  return Object.fromEntries(entries);
}

function normalizeSelectedMachines(
  value: unknown,
  fallback: SaveData['selectedMachineByZone'],
  issues: string[],
): Record<string, string> {
  const raw: UnknownRecord = isRecord(value) ? value : {};
  return Object.fromEntries(
    GYMS.map((gym) => {
      const storedMachineId = raw[gym.id];
      const fallbackMachineId = fallback[gym.id];
      const machineId =
        typeof storedMachineId === 'string'
          ? storedMachineId
          : typeof fallbackMachineId === 'string'
            ? fallbackMachineId
            : gym.defaultMachineId;
      const valid = gym.machineIds.includes(machineId);
      if (!valid && raw[gym.id] !== undefined) {
        issues.push(
          `Selected machine for "${gym.id}" was invalid; restored the gym default.`,
        );
      }
      return [gym.id, valid ? machineId : gym.defaultMachineId] as const;
    }),
  ) as Record<string, string>;
}

export function normalizeSaveData(
  raw: unknown,
  fallback: SaveData,
): SaveNormalizationResult {
  if (!isRecord(raw)) {
    throw new Error('Save state must be a JSON object.');
  }
  const issues: string[] = [];
  const validZoneIds = GYMS.map((gym) => gym.id);
  const zoneIdSet = new Set(validZoneIds);
  const activeZoneId =
    typeof raw.activeZoneId === 'string' &&
    zoneIdSet.has(raw.activeZoneId)
      ? raw.activeZoneId
      : STARTING_ZONE_ID;
  recordIssue(
    issues,
    raw.activeZoneId !== undefined && activeZoneId !== raw.activeZoneId,
    'Active gym was invalid; restored Home Gym.',
  );
  const rawUnlocked = Array.isArray(raw.unlockedZoneIds)
    ? raw.unlockedZoneIds.filter(
        (value): value is string => typeof value === 'string',
      )
    : undefined;
  const unlockedZoneIds = normalizeUnlockedZones({
    raw: rawUnlocked,
    fallback:
      activeZoneId in WORLD_ROUTES
        ? [activeZoneId, ...(WORLD_ROUTES[activeZoneId] ?? [])]
        : FALLBACK_UNLOCKED_ZONES,
    validZoneIds,
    startingZoneId: STARTING_ZONE_ID,
  });
  const inferredVisited = inferVisitedZoneIds(
    unlockedZoneIds,
    activeZoneId,
  );
  const rawVisited = Array.isArray(raw.visitedZoneIds)
    ? raw.visitedZoneIds.filter(
        (value): value is GymZoneId =>
          typeof value === 'string' &&
          JOURNEY_GYM_ZONE_IDS.includes(value as GymZoneId),
      )
    : [];
  const visitedZoneIds = [
    ...new Set([...inferredVisited, ...rawVisited]),
  ];

  const rawTeam = Array.isArray(raw.team) ? raw.team : fallback.team;
  recordIssue(
    issues,
    !Array.isArray(raw.team),
    'Party data was missing; restored the default party.',
  );
  const recoveredTeam = rawTeam
    .slice(0, TEAM_SIZE)
    .map((buddy, index) => normalizeBuddy(buddy, issues, index))
    .filter((buddy): buddy is Buddy => Boolean(buddy));
  const team =
    recoveredTeam.length > 0
      ? recoveredTeam
      : fallback.team.map((buddy) => ({ ...buddy }));
  recordIssue(
    issues,
    recoveredTeam.length === 0,
    'No playable party members could be recovered; restored the default party.',
  );
  const trainingHistory = isRecord(raw.machineTrainingHistory)
    ? raw.machineTrainingHistory
    : {};
  const lastMachineId =
    typeof trainingHistory.lastMachineId === 'string' &&
    ALL_TRAINING_MACHINES.some(
      (machine) => machine.id === trainingHistory.lastMachineId,
    )
      ? trainingHistory.lastMachineId
      : null;
  const bossGameplayTimeMs = normalizeBossGameplayTime(
    raw.bossGameplayTimeMs,
  );
  const rawBossSchedules = isRecord(raw.bossSchedules)
    ? raw.bossSchedules
    : {};
  const bossSchedules = Object.fromEntries(
    GYMS.map((gym) => {
      const fallbackSchedule = fallback.bossSchedules[gym.id]!;
      const stored = isRecord(rawBossSchedules[gym.id])
        ? rawBossSchedules[gym.id]
        : undefined;
      return [
        gym.id,
        restoreBossSchedule(
          stored as
            | (Partial<BossSchedule> & { nextBossAt?: number })
            | undefined,
          bossGameplayTimeMs,
          Math.max(
            0,
            fallbackSchedule.readyAtGameplayMs -
              fallback.bossGameplayTimeMs,
          ),
        ),
      ];
    }),
  ) as Record<string, BossSchedule>;
  const rawAudio = isRecord(raw.audio) ? raw.audio : {};
  const rawTrainerEquipmentBonuses = isRecord(
    raw.trainerEquipmentBonuses,
  )
    ? raw.trainerEquipmentBonuses
    : {};
  const rawAccessibility = isRecord(raw.accessibility)
    ? raw.accessibility
    : {};
  const rawInput = isRecord(raw.input) ? raw.input : {};
  const keyboardBindings = normalizeKeyboardBindings(
    rawInput.keyboardBindings,
    fallback.input.keyboardBindings,
  );
  const keyboardBindingIssues = validateKeyboardBindings(keyboardBindings);
  if (keyboardBindingIssues.length > 0) {
    issues.push(
      `Keyboard bindings were repaired: ${keyboardBindingIssues.join(' ')}`,
    );
  }

  const seenDex = normalizeDexEntries(
    raw.seenDex,
    fallback.seenDex,
    issues,
    'Seen Index',
  );
  const caughtDex = normalizeDexEntries(
    raw.caughtDex,
    fallback.caughtDex,
    issues,
    'Caught Index',
  );
  for (const buddy of team) {
    if (!seenDex.includes(buddy.creature.dex)) {
      seenDex.push(buddy.creature.dex);
    }
    if (!caughtDex.includes(buddy.creature.dex)) {
      caughtDex.push(buddy.creature.dex);
    }
  }
  const trainer = normalizeTrainer(raw.trainer, fallback.trainer, issues);
  const visualProgression = normalizeVisualProgression(
    raw.visualProgression,
    fallback.visualProgression,
    trainer.appearance,
    bossGameplayTimeMs,
    issues,
  );

  return {
    save: {
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      version: SAVE_VERSION,
      trainingFatigue: clamp(
        finiteNumber(raw.trainingFatigue, fallback.trainingFatigue),
        0,
        FATIGUE_BALANCE.maximum,
      ),
      workoutMomentum: clamp(
        finiteNumber(raw.workoutMomentum, fallback.workoutMomentum),
        0,
        WORKOUT_BALANCE.maximumMomentum,
      ),
      deloadTokens: clamp(
        integer(raw.deloadTokens, fallback.deloadTokens),
        0,
        WORKOUT_BALANCE.maximumDeloadTokens,
      ),
      captureBattleSpeed: CAPTURE_BATTLE_SPEEDS.some(
        (speed) => speed.id === raw.captureBattleSpeed,
      )
        ? (raw.captureBattleSpeed as CaptureBattleSpeed)
        : fallback.captureBattleSpeed,
      machineTrainingHistory: {
        lastMachineId,
        repeatedUses: clamp(
          integer(trainingHistory.repeatedUses, 0),
          0,
          99,
        ),
        masteryByMachineId: normalizeMastery(
          trainingHistory.masteryByMachineId,
          issues,
        ),
      },
      visualProgression,
      hasStarterSet: booleanValue(
        raw.hasStarterSet,
        fallback.hasStarterSet,
      ),
      unlockedZoneIds,
      visitedZoneIds,
      trainer,
      trainerEquipmentBonuses: {
        power: clamp(
          finiteNumber(
            rawTrainerEquipmentBonuses.power,
            fallback.trainerEquipmentBonuses.power,
          ),
          -100,
          100,
        ),
        technique: clamp(
          finiteNumber(
            rawTrainerEquipmentBonuses.technique,
            fallback.trainerEquipmentBonuses.technique,
          ),
          -100,
          100,
        ),
        endurance: clamp(
          finiteNumber(
            rawTrainerEquipmentBonuses.endurance,
            fallback.trainerEquipmentBonuses.endurance,
          ),
          -100,
          100,
        ),
        mobility: clamp(
          finiteNumber(
            rawTrainerEquipmentBonuses.mobility,
            fallback.trainerEquipmentBonuses.mobility,
          ),
          -100,
          100,
        ),
        recovery: clamp(
          finiteNumber(
            rawTrainerEquipmentBonuses.recovery,
            fallback.trainerEquipmentBonuses.recovery,
          ),
          -100,
          100,
        ),
      },
      steroids: Math.max(0, integer(raw.steroids, fallback.steroids)),
      activeIndex: clamp(
        integer(raw.activeIndex, fallback.activeIndex),
        0,
        Math.max(0, team.length - 1),
      ),
      activeZoneId,
      team,
      seenDex,
      caughtDex,
      selectedMachineByZone: normalizeSelectedMachines(
        raw.selectedMachineByZone,
        fallback.selectedMachineByZone,
        issues,
      ),
      bossGameplayTimeMs,
      bossSchedules,
      tutorialStep: clamp(
        integer(raw.tutorialStep, fallback.tutorialStep),
        0,
        TUTORIAL_STEPS.length,
      ),
      audio: {
        enabled: booleanValue(
          rawAudio.enabled,
          fallback.audio.enabled,
        ),
        musicVolume: clamp01(
          finiteNumber(
            rawAudio.musicVolume,
            fallback.audio.musicVolume,
          ),
        ),
        sfxVolume: clamp01(
          finiteNumber(rawAudio.sfxVolume, fallback.audio.sfxVolume),
        ),
      },
      accessibility: {
        reducedMotion: booleanValue(
          rawAccessibility.reducedMotion,
          fallback.accessibility.reducedMotion,
        ),
        screenShake: booleanValue(
          rawAccessibility.screenShake,
          fallback.accessibility.screenShake,
        ),
        highContrast: booleanValue(
          rawAccessibility.highContrast,
          fallback.accessibility.highContrast,
        ),
        sustainedInputMode:
          rawAccessibility.sustainedInputMode === 'toggle' ||
          rawAccessibility.sustainedInputMode === 'hold'
            ? rawAccessibility.sustainedInputMode
            : fallback.accessibility.sustainedInputMode,
        textSpeed:
          rawAccessibility.textSpeed === 'slow' ||
          rawAccessibility.textSpeed === 'standard' ||
          rawAccessibility.textSpeed === 'fast' ||
          rawAccessibility.textSpeed === 'instant'
            ? rawAccessibility.textSpeed
            : fallback.accessibility.textSpeed,
      },
      input: {
        keyboardBindings,
      },
    },
    issues,
  };
}

export function validateSerializableState(
  value: unknown,
): SerializableValidationResult {
  const issues: string[] = [];
  const ancestors = new WeakSet<object>();

  const visit = (entry: unknown, path: string) => {
    if (
      entry === null ||
      typeof entry === 'string' ||
      typeof entry === 'boolean'
    ) {
      return;
    }
    if (typeof entry === 'number') {
      if (!Number.isFinite(entry)) {
        issues.push(`${path} contains a non-finite number.`);
      }
      return;
    }
    if (typeof entry !== 'object') {
      issues.push(`${path} contains non-serializable ${typeof entry}.`);
      return;
    }
    if (ancestors.has(entry)) {
      issues.push(`${path} contains a circular reference.`);
      return;
    }
    const prototype = Object.getPrototypeOf(entry);
    if (
      !Array.isArray(entry) &&
      prototype !== Object.prototype &&
      prototype !== null
    ) {
      issues.push(
        `${path} contains a runtime object instead of plain state.`,
      );
      return;
    }
    ancestors.add(entry);
    if (Array.isArray(entry)) {
      entry.forEach((item, index) => visit(item, `${path}[${index}]`));
    } else {
      Object.entries(entry).forEach(([key, item]) =>
        visit(item, `${path}.${key}`),
      );
    }
    ancestors.delete(entry);
  };

  visit(value, 'save');
  return { valid: issues.length === 0, issues };
}

export function validateSaveData(save: SaveData) {
  const serializable = validateSerializableState(save);
  const issues = [...serializable.issues];
  if (
    save.schemaVersion !== CURRENT_SAVE_SCHEMA_VERSION ||
    save.version !== SAVE_VERSION
  ) {
    issues.push('Save schema markers do not match the current version.');
  }
  if (!GYMS.some((gym) => gym.id === save.activeZoneId)) {
    issues.push('Active gym is not present in current content.');
  }
  if (save.team.length > TEAM_SIZE) {
    issues.push(`Party exceeds the ${TEAM_SIZE}-Buddy limit.`);
  }
  if (
    save.team.some(
      (buddy) =>
        !buddy.creature.id ||
        !Number.isFinite(buddy.creature.dex),
    )
  ) {
    issues.push('Party contains an invalid Buddy species identity.');
  }
  for (const buddy of save.team) {
    if (buddy.cosmetics) {
      issues.push(
        ...validateBuddyCosmetics(buddy.creature.id, buddy.cosmetics),
      );
    }
  }
  issues.push(...validateTrainerAppearance(save.trainer.appearance));
  issues.push(
    ...validateKeyboardBindings(save.input.keyboardBindings),
  );
  return { valid: issues.length === 0, issues };
}
