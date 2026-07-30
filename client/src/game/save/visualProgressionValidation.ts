import { ALL_TRAINING_MACHINES } from '../content/machines';
import {
  BODYBUILDING_CHALLENGES,
  PHYSIQUE_SNAPSHOT_LIMIT,
  PUMP_LEVEL_CAP,
  RECENT_TRAINING_LIMIT,
  TRAINER_DEVELOPMENT_GROUPS,
  VISUAL_DEVELOPMENT_CAP,
} from '../content/visualProgression';
import { cloneTrainerAppearance } from '../content/trainerAppearance';
import { clamp, clamp01 } from '../systems/math';
import { normalizeTrainerAppearance } from '../systems/trainerAppearance';
import type {
  BodybuildingChallengeId,
  DevelopmentPresentationLevel,
  TrainerAppearance,
  TrainerDevelopmentValues,
  TrainerVisualProgressionState,
  WorkoutLoadTier,
  WorkoutOutcome,
} from '../types';

type UnknownRecord = Record<string, unknown>;

const PRESENTATION_LEVELS = new Set<DevelopmentPresentationLevel>([
  'cosmetic-only',
  'subtle',
  'standard',
  'exaggerated',
]);
const LOAD_TIERS = new Set<WorkoutLoadTier>([
  'easy',
  'steady',
  'hard',
  'max',
]);
const OUTCOMES = new Set<WorkoutOutcome>([
  'success',
  'rescued',
  'failure',
]);
const MACHINE_IDS = new Set(
  ALL_TRAINING_MACHINES.map((machine) => machine.id),
);
const CHALLENGE_IDS = new Set<BodybuildingChallengeId>(
  BODYBUILDING_CHALLENGES.map((challenge) => challenge.id),
);
const REWARD_IDS = new Set<string>(
  BODYBUILDING_CHALLENGES.map((challenge) => challenge.reward.id),
);

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeValues(
  value: unknown,
  fallback: TrainerDevelopmentValues,
  maximum: number,
): TrainerDevelopmentValues {
  const record = isRecord(value) ? value : {};
  return Object.fromEntries(
    TRAINER_DEVELOPMENT_GROUPS.map(({ id }) => [
      id,
      clamp(finiteNumber(record[id], fallback[id]), 0, maximum),
    ]),
  ) as TrainerDevelopmentValues;
}

export function normalizeVisualProgression(
  value: unknown,
  fallback: TrainerVisualProgressionState,
  currentAppearance: TrainerAppearance,
  gameplayTimeMs: number,
  issues: string[],
): TrainerVisualProgressionState {
  if (!isRecord(value)) {
    issues.push(
      'Visual training development was missing; preserved the trainer appearance and initialized progression.',
    );
    return {
      ...fallback,
      baselineAppearance: cloneTrainerAppearance(currentAppearance),
    };
  }

  const baseline = normalizeTrainerAppearance(
    value.baselineAppearance,
    currentAppearance,
  );
  issues.push(
    ...baseline.issues.map(
      (issue) => `Visual progression baseline: ${issue}`,
    ),
  );
  const rawPump = isRecord(value.pump) ? value.pump : {};
  const rawPreferences = isRecord(value.preferences)
    ? value.preferences
    : {};
  const rawChallenges = isRecord(value.challenges) ? value.challenges : {};
  const attempts = isRecord(rawChallenges.attemptsByChallengeId)
    ? rawChallenges.attemptsByChallengeId
    : {};
  const bestScores = isRecord(rawChallenges.bestScoreByChallengeId)
    ? rawChallenges.bestScoreByChallengeId
    : {};

  const recentTraining = Array.isArray(value.recentTraining)
    ? value.recentTraining
        .filter(isRecord)
        .filter(
          (entry) =>
            typeof entry.id === 'string' &&
            typeof entry.machineId === 'string' &&
            MACHINE_IDS.has(entry.machineId) &&
            LOAD_TIERS.has(entry.loadTier as WorkoutLoadTier) &&
            OUTCOMES.has(entry.outcome as WorkoutOutcome),
        )
        .slice(0, RECENT_TRAINING_LIMIT)
        .map((entry) => ({
          id: String(entry.id).slice(0, 96),
          gameplayTimeMs: clamp(
            finiteNumber(entry.gameplayTimeMs, 0),
            0,
            gameplayTimeMs,
          ),
          machineId: String(entry.machineId),
          loadTier: entry.loadTier as WorkoutLoadTier,
          outcome: entry.outcome as WorkoutOutcome,
          quality: clamp01(finiteNumber(entry.quality, 0)),
          volume: clamp(Math.round(finiteNumber(entry.volume, 1)), 1, 12),
          developmentGains: normalizeValues(
            entry.developmentGains,
            fallback.development,
            VISUAL_DEVELOPMENT_CAP,
          ),
          pumpGains: normalizeValues(
            entry.pumpGains,
            fallback.pump.levels,
            PUMP_LEVEL_CAP,
          ),
        }))
    : [];

  const snapshots = Array.isArray(value.snapshots)
    ? value.snapshots
        .filter(isRecord)
        .slice(0, PHYSIQUE_SNAPSHOT_LIMIT)
        .map((entry, index) => {
          const appearance = normalizeTrainerAppearance(
            entry.baseAppearance,
            currentAppearance,
          );
          issues.push(
            ...appearance.issues.map(
              (issue) => `Physique snapshot ${index + 1}: ${issue}`,
            ),
          );
          return {
            id:
              typeof entry.id === 'string' && entry.id.trim()
                ? entry.id.slice(0, 96)
                : `physique-snapshot-recovered-${index + 1}`,
            label:
              typeof entry.label === 'string' && entry.label.trim()
                ? entry.label.trim().slice(0, 28)
                : `Progress ${index + 1}`,
            gameplayTimeMs: clamp(
              finiteNumber(entry.gameplayTimeMs, 0),
              0,
              gameplayTimeMs,
            ),
            baseAppearance: appearance.appearance,
            development: normalizeValues(
              entry.development,
              fallback.development,
              VISUAL_DEVELOPMENT_CAP,
            ),
            pump: normalizeValues(
              entry.pump,
              fallback.pump.levels,
              PUMP_LEVEL_CAP,
            ),
            fatigue: clamp(finiteNumber(entry.fatigue, 0), 0, 100),
          };
        })
    : [];

  const completedChallengeIds = Array.isArray(
    rawChallenges.completedChallengeIds,
  )
    ? [
        ...new Set(
          rawChallenges.completedChallengeIds.filter(
            (id): id is BodybuildingChallengeId =>
              typeof id === 'string' &&
              CHALLENGE_IDS.has(id as BodybuildingChallengeId),
          ),
        ),
      ]
    : [];
  const unlockedRewardIds = Array.isArray(rawChallenges.unlockedRewardIds)
    ? [
        ...new Set(
          rawChallenges.unlockedRewardIds.filter(
            (id): id is string =>
              typeof id === 'string' && REWARD_IDS.has(id),
          ),
        ),
      ]
    : [];

  return {
    baselineAppearance: baseline.appearance,
    development: normalizeValues(
      value.development,
      fallback.development,
      VISUAL_DEVELOPMENT_CAP,
    ),
    pump: {
      levels: normalizeValues(
        rawPump.levels,
        fallback.pump.levels,
        PUMP_LEVEL_CAP,
      ),
      updatedAtGameplayMs: clamp(
        finiteNumber(rawPump.updatedAtGameplayMs, 0),
        0,
        gameplayTimeMs,
      ),
    },
    recentTraining,
    snapshots,
    nextSnapshotSequence: Math.max(
      1,
      Math.round(
        finiteNumber(value.nextSnapshotSequence, snapshots.length + 1),
      ),
    ),
    preferences: {
      developmentLevel: PRESENTATION_LEVELS.has(
        rawPreferences.developmentLevel as DevelopmentPresentationLevel,
      )
        ? (rawPreferences.developmentLevel as DevelopmentPresentationLevel)
        : fallback.preferences.developmentLevel,
      showPumpEffects: booleanValue(
        rawPreferences.showPumpEffects,
        fallback.preferences.showPumpEffects,
      ),
      showFatigueEffects: booleanValue(
        rawPreferences.showFatigueEffects,
        fallback.preferences.showFatigueEffects,
      ),
    },
    challenges: {
      attemptsByChallengeId: Object.fromEntries(
        [...CHALLENGE_IDS].flatMap((id) => {
          const count = Math.max(0, Math.round(finiteNumber(attempts[id], 0)));
          return count > 0 ? [[id, count]] : [];
        }),
      ),
      bestScoreByChallengeId: Object.fromEntries(
        [...CHALLENGE_IDS].flatMap((id) => {
          const score = clamp(
            Math.round(finiteNumber(bestScores[id], 0)),
            0,
            100,
          );
          return score > 0 ? [[id, score]] : [];
        }),
      ),
      completedChallengeIds,
      unlockedRewardIds,
    },
  };
}
