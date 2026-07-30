import {
  DEVELOPMENT_PRESENTATION_LEVELS,
  MACHINE_VISUAL_DEVELOPMENT_PATTERNS,
  PHYSIQUE_SNAPSHOT_LIMIT,
  PUMP_DECAY_MS,
  PUMP_LEVEL_CAP,
  RECENT_TRAINING_LIMIT,
  TRAINER_DEVELOPMENT_GROUPS,
  TRAINING_MOVEMENT_PATTERNS,
  VISUAL_DEVELOPMENT_CAP,
} from '../content/visualProgression';
import {
  TRAINER_BUILD_MAX,
  TRAINER_BUILD_MIN,
  cloneTrainerAppearance,
} from '../content/trainerAppearance';
import { FATIGUE_BALANCE } from '../content/balance';
import type {
  DevelopmentPresentationLevel,
  PhysiqueProgressSnapshot,
  PhysiqueRatings,
  TrainerAppearance,
  TrainerBuildAttributeId,
  TrainerDevelopmentGroupId,
  TrainerDevelopmentValues,
  TrainerProfile,
  TrainerVisualPresentation,
  TrainerVisualProgressionState,
  WorkoutDevelopmentRecord,
  WorkoutLoadTier,
  WorkoutOutcome,
} from '../types';
import { clamp, clamp01 } from './math';

const LOAD_DEVELOPMENT_FACTOR: Record<WorkoutLoadTier, number> = {
  easy: 0.72,
  steady: 1,
  hard: 1.16,
  max: 1.08,
};

const LOAD_PUMP_FACTOR: Record<WorkoutLoadTier, number> = {
  easy: 0.72,
  steady: 1,
  hard: 1.18,
  max: 1.28,
};

const OUTCOME_FACTOR: Record<WorkoutOutcome, number> = {
  success: 1,
  rescued: 0.64,
  failure: 0.22,
};

export function createEmptyDevelopmentValues(): TrainerDevelopmentValues {
  return Object.fromEntries(
    TRAINER_DEVELOPMENT_GROUPS.map(({ id }) => [id, 0]),
  ) as TrainerDevelopmentValues;
}

function mapDevelopmentValues(
  mapper: (value: number, group: TrainerDevelopmentGroupId) => number,
  source: TrainerDevelopmentValues,
): TrainerDevelopmentValues {
  return Object.fromEntries(
    TRAINER_DEVELOPMENT_GROUPS.map(({ id }) => [id, mapper(source[id], id)]),
  ) as TrainerDevelopmentValues;
}

export function createDefaultVisualProgressionState(
  appearance: TrainerAppearance,
): TrainerVisualProgressionState {
  return {
    baselineAppearance: cloneTrainerAppearance(appearance),
    development: createEmptyDevelopmentValues(),
    pump: {
      levels: createEmptyDevelopmentValues(),
      updatedAtGameplayMs: 0,
    },
    recentTraining: [],
    snapshots: [],
    nextSnapshotSequence: 1,
    preferences: {
      developmentLevel: 'standard',
      showPumpEffects: true,
      showFatigueEffects: true,
    },
    challenges: {
      attemptsByChallengeId: {},
      bestScoreByChallengeId: {},
      completedChallengeIds: [],
      unlockedRewardIds: [],
    },
  };
}

export function decayTrainerPump(
  levels: TrainerDevelopmentValues,
  elapsedGameplayMs: number,
  deepRecovery = false,
): TrainerDevelopmentValues {
  const safeElapsed = Math.max(0, elapsedGameplayMs);
  const standardDecay = clamp01(1 - safeElapsed / PUMP_DECAY_MS);
  const recoveryFactor = deepRecovery ? 0.38 : 1;
  return mapDevelopmentValues(
    (value) => clamp(value * standardDecay * recoveryFactor, 0, PUMP_LEVEL_CAP),
    levels,
  );
}

export function getCurrentPump(
  state: TrainerVisualProgressionState,
  gameplayTimeMs: number,
): TrainerDevelopmentValues {
  return decayTrainerPump(
    state.pump.levels,
    gameplayTimeMs - state.pump.updatedAtGameplayMs,
  );
}

export function applyWorkoutVisualProgression(input: {
  state: TrainerVisualProgressionState;
  machineId: string;
  gameplayTimeMs: number;
  loadTier: WorkoutLoadTier;
  outcome: WorkoutOutcome;
  quality: number;
  volume: number;
}): TrainerVisualProgressionState {
  const movement =
    MACHINE_VISUAL_DEVELOPMENT_PATTERNS[
      input.machineId as keyof typeof MACHINE_VISUAL_DEVELOPMENT_PATTERNS
    ];
  if (!movement) return input.state;

  const pattern = TRAINING_MOVEMENT_PATTERNS[movement];
  const quality = clamp01(input.quality);
  const volume = clamp(input.volume, 1, 12);
  const volumeFactor = clamp(volume / 5, 0.5, 1.5);
  const developmentBase =
    OUTCOME_FACTOR[input.outcome] *
    LOAD_DEVELOPMENT_FACTOR[input.loadTier] *
    (0.35 + quality * 0.65) *
    volumeFactor;
  const pumpBase =
    OUTCOME_FACTOR[input.outcome] *
    LOAD_PUMP_FACTOR[input.loadTier] *
    (3.5 + quality * 5.5) *
    volumeFactor;
  const currentPump = getCurrentPump(input.state, input.gameplayTimeMs);
  const developmentGains = mapDevelopmentValues(
    (_value, group) => pattern[group] * developmentBase,
    pattern,
  );
  const pumpGains = mapDevelopmentValues(
    (_value, group) => pattern[group] * pumpBase,
    pattern,
  );
  const development = mapDevelopmentValues(
    (value, group) => {
      const remaining = 1 - value / VISUAL_DEVELOPMENT_CAP;
      return clamp(
        value + developmentGains[group] * Math.max(0.16, remaining),
        0,
        VISUAL_DEVELOPMENT_CAP,
      );
    },
    input.state.development,
  );
  const pumpLevels = mapDevelopmentValues(
    (value, group) =>
      clamp(value + pumpGains[group], 0, PUMP_LEVEL_CAP),
    currentPump,
  );
  const record: WorkoutDevelopmentRecord = {
    id: `training-${input.gameplayTimeMs}-${input.machineId}-${input.state.recentTraining.length}`,
    gameplayTimeMs: input.gameplayTimeMs,
    machineId: input.machineId,
    loadTier: input.loadTier,
    outcome: input.outcome,
    quality,
    volume,
    developmentGains,
    pumpGains,
  };

  return {
    ...input.state,
    development,
    pump: {
      levels: pumpLevels,
      updatedAtGameplayMs: input.gameplayTimeMs,
    },
    recentTraining: [record, ...input.state.recentTraining].slice(
      0,
      RECENT_TRAINING_LIMIT,
    ),
  };
}

export function applyDeepRecoveryToVisualProgression(
  state: TrainerVisualProgressionState,
  gameplayTimeMs: number,
): TrainerVisualProgressionState {
  return {
    ...state,
    pump: {
      levels: decayTrainerPump(
        state.pump.levels,
        gameplayTimeMs - state.pump.updatedAtGameplayMs,
        true,
      ),
      updatedAtGameplayMs: gameplayTimeMs,
    },
  };
}

const GROUP_BUILD_ATTRIBUTES: Record<
  TrainerDevelopmentGroupId,
  readonly TrainerBuildAttributeId[]
> = {
  shoulders: [
    'shoulderWidth',
    'shoulderRoundness',
    'frontDeltSize',
    'sideDeltSize',
    'rearDeltSize',
  ],
  chest: ['chestSize', 'upperChestFullness', 'lowerChestFullness'],
  back: [
    'upperBackWidth',
    'lowerBackThickness',
    'latWidth',
    'latFlare',
    'midBackThickness',
  ],
  biceps: ['bicepsSize', 'bicepsPeak', 'bicepsThickness'],
  triceps: ['tricepsSize', 'tricepsHorseshoeDefinition'],
  forearms: [
    'forearmSize',
    'forearmThickness',
    'forearmVascularDefinition',
  ],
  core: [
    'coreDefinition',
    'abdominalDefinition',
    'obliqueDefinition',
    'serratusDefinition',
  ],
  glutes: ['gluteSize', 'gluteFullness'],
  quads: ['quadSize', 'quadSweep', 'innerThighThickness'],
  hamstrings: ['hamstringSize', 'hamstringDrop'],
  calves: ['calfSize', 'calfWidth', 'calfHeight'],
};

function getPresentationScale(level: DevelopmentPresentationLevel) {
  return (
    DEVELOPMENT_PRESENTATION_LEVELS.find((entry) => entry.id === level)
      ?.scale ?? 0
  );
}

export function deriveTrainerVisualPresentation(input: {
  baseAppearance: TrainerAppearance;
  state: TrainerVisualProgressionState;
  gameplayTimeMs: number;
  fatigue: number;
}): TrainerVisualPresentation {
  const appearance = cloneTrainerAppearance(input.baseAppearance);
  const presentationScale = getPresentationScale(
    input.state.preferences.developmentLevel,
  );
  const currentPump = input.state.preferences.showPumpEffects
    ? getCurrentPump(input.state, input.gameplayTimeMs)
    : createEmptyDevelopmentValues();
  const developmentOffsets = mapDevelopmentValues(
    (value) => (value / VISUAL_DEVELOPMENT_CAP) * 2.1 * presentationScale,
    input.state.development,
  );
  const pumpOffsets = mapDevelopmentValues(
    (value) => (value / PUMP_LEVEL_CAP) * 0.9,
    currentPump,
  );
  for (const { id: group } of TRAINER_DEVELOPMENT_GROUPS) {
    const offset = developmentOffsets[group] + pumpOffsets[group];
    for (const attributeId of GROUP_BUILD_ATTRIBUTES[group]) {
      appearance.build[attributeId] = clamp(
        appearance.build[attributeId] + offset,
        TRAINER_BUILD_MIN,
        TRAINER_BUILD_MAX,
      );
    }
  }
  const pumpIntensity =
    Math.max(...Object.values(currentPump)) / PUMP_LEVEL_CAP;
  appearance.build.pumpLevel = clamp(
    appearance.build.pumpLevel + pumpIntensity * 2.2,
    TRAINER_BUILD_MIN,
    TRAINER_BUILD_MAX,
  );
  appearance.build.muscleFullness = clamp(
    appearance.build.muscleFullness + pumpIntensity * 1.3,
    TRAINER_BUILD_MIN,
    TRAINER_BUILD_MAX,
  );
  appearance.build.vascularity = clamp(
    appearance.build.vascularity + pumpIntensity * 1.1,
    TRAINER_BUILD_MIN,
    TRAINER_BUILD_MAX,
  );

  const fatigueRatio = input.state.preferences.showFatigueEffects
    ? clamp01(input.fatigue / FATIGUE_BALANCE.maximum)
    : 0;
  const shoulderDrop = fatigueRatio < 0.3 ? 0 : fatigueRatio * 1.2;
  if (input.state.preferences.showFatigueEffects) {
    appearance.build.posture = clamp(
      appearance.build.posture - shoulderDrop,
      TRAINER_BUILD_MIN,
      TRAINER_BUILD_MAX,
    );
    if (
      fatigueRatio >= 0.52 &&
      appearance.accessories.towelId === 'none'
    ) {
      appearance.accessories.towelId = 'shoulder-small';
    }
    if (
      fatigueRatio >= 0.7 &&
      appearance.outfit.wristWrapsId === 'none'
    ) {
      appearance.outfit.wristWrapsId = 'double';
    }
  }

  return {
    appearance,
    developmentOffsets,
    pumpOffsets,
    pumpIntensity,
    recovery: {
      fatigueRatio,
      stance:
        fatigueRatio >= 0.76
          ? 'fatigued'
          : fatigueRatio >= 0.48
            ? 'worked'
            : fatigueRatio >= 0.2
              ? 'recovering'
              : 'ready',
      shoulderDrop,
      breathingIntensity: fatigueRatio,
      posingConfidence: clamp01(1 - fatigueRatio * 0.68),
      showSweat: fatigueRatio >= 0.52,
      showRecoveryWraps: fatigueRatio >= 0.7,
    },
  };
}

function average(values: readonly number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

export function calculatePhysiqueRatings(input: {
  trainer: TrainerProfile;
  development: TrainerDevelopmentValues;
  pump: TrainerDevelopmentValues;
  fatigue: number;
  recentTrainingCount: number;
}): PhysiqueRatings {
  const developmentValues = Object.values(input.development);
  const mean = average(developmentValues);
  const spread =
    Math.max(...developmentValues) - Math.min(...developmentValues);
  const muscleMean = average(Object.values(input.trainer.muscles));
  const pumpMean = average(Object.values(input.pump));
  const fatigueRatio = clamp01(input.fatigue / FATIGUE_BALANCE.maximum);
  const rating = (value: number) => Math.round(clamp(value, 0, 100));

  return {
    balance: rating(72 + mean * 0.2 - spread * 0.34),
    symmetry: rating(
      58 +
        input.trainer.appearance.build.symmetryPreference * 3.8 -
        spread * 0.16,
    ),
    conditioning: rating(
      52 +
        input.trainer.appearance.build.muscleSeparation * 4 +
        pumpMean * 0.1 -
        fatigueRatio * 22,
    ),
    presentation: rating(
      48 +
        input.trainer.appearance.build.posture * 3.4 +
        Math.min(14, input.recentTrainingCount * 0.6) -
        fatigueRatio * 18,
    ),
    power: rating(38 + muscleMean * 5.8 + mean * 0.16),
    mobility: rating(
      44 +
        input.trainer.muscles.core * 3.4 +
        input.trainer.appearance.build.posture * 2.2 -
        fatigueRatio * 16,
    ),
    recovery: rating(100 - fatigueRatio * 72 + Math.min(10, pumpMean * 0.08)),
  };
}

export function createPhysiqueSnapshot(input: {
  state: TrainerVisualProgressionState;
  appearance: TrainerAppearance;
  gameplayTimeMs: number;
  fatigue: number;
  label?: string;
}): TrainerVisualProgressionState {
  const sequence = input.state.nextSnapshotSequence;
  const snapshot: PhysiqueProgressSnapshot = {
    id: `physique-snapshot-${sequence}`,
    label: input.label?.trim().slice(0, 28) || `Progress ${sequence}`,
    gameplayTimeMs: input.gameplayTimeMs,
    baseAppearance: cloneTrainerAppearance(input.appearance),
    development: { ...input.state.development },
    pump: getCurrentPump(input.state, input.gameplayTimeMs),
    fatigue: input.fatigue,
  };
  return {
    ...input.state,
    nextSnapshotSequence: sequence + 1,
    snapshots: [snapshot, ...input.state.snapshots].slice(
      0,
      PHYSIQUE_SNAPSHOT_LIMIT,
    ),
  };
}
