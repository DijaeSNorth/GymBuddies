import {
  BUDDY_STAT_LIMITS,
  FATIGUE_BALANCE,
  WORKOUT_BALANCE,
} from '../content/balance';
import { getGymProgressionMilestone } from '../content/progressionBalance';
import {
  WORKOUT_DELOAD_BY_TIER,
  WORKOUT_LOAD_BY_ID,
} from '../content/workoutLoads';
import { MAX_MUSCLE_LEVEL } from '../content/trainer';
import type {
  Buddy,
  GymKind,
  GymMachine,
  TrainerProfile,
  WorkoutFeedbackCode,
  WorkoutLoadTier,
  WorkoutOutcome,
  WorkoutPreview,
  WorkoutRepGrade,
  WorkoutRepResult,
  WorkoutSession,
} from '../types';
import {
  calculateBuddyWorkoutGrowth,
  calculateBuddyWorkoutProfile,
  clampBuddyStat,
} from './buddyProgression';
import { applyFatigueChange } from './fatigueRecovery';
import { clamp, clamp01 } from './math';
import { randomInt, rollChance, type RandomState } from './random';
import { applyExperienceReward } from './rewards';
import { getMachineMasteryBenefits } from './progressionModel';
import { applyTrainerGrowth } from './trainerProgression';

function gymDifficulty(gymKind: GymKind) {
  if (gymKind === 'higher') return 0.12;
  if (gymKind === 'starter') return 0.05;
  return 0;
}

function mean(values: readonly number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function feedbackForPreview(input: {
  readiness: number;
  trainerAlignment: number;
  buddyAlignment: number;
  volumePreparedness: number;
  setStress: number;
}) {
  const feedback: WorkoutFeedbackCode[] = [
    input.readiness >= 0.68 ? 'readiness-strong' : 'readiness-low',
    input.trainerAlignment >= 0.45 ? 'trainer-aligned' : 'trainer-misaligned',
    input.buddyAlignment >= 0.7 ? 'buddy-aligned' : 'buddy-misaligned',
    input.volumePreparedness >= 0.55 ? 'volume-ready' : 'volume-low',
    input.setStress < 0.66 ? 'load-controlled' : 'load-demanding',
  ];
  return feedback;
}

export function calculateWorkoutMomentumFactor(workoutMomentum = 0) {
  return clamp01(workoutMomentum / WORKOUT_BALANCE.maximumMomentum);
}

/** Input: Buddy, machine, trainer, gym, fatigue, and momentum. Output: readiness from 0 to 1. */
export function calculateWorkoutReadiness(input: {
  machine: GymMachine;
  buddy: Buddy;
  trainer: TrainerProfile;
  gymKind: GymKind;
  trainingFatigue?: number;
  workoutMomentum?: number;
}) {
  const buddyProfile = calculateBuddyWorkoutProfile(input.buddy);
  const hpRatio = clamp01(input.buddy.hp / Math.max(1, input.buddy.maxHp));
  const formRatio = clamp01(input.buddy.form / BUDDY_STAT_LIMITS.form);
  const mobilityRatio = clamp01(
    input.buddy.mobility / BUDDY_STAT_LIMITS.mobility,
  );
  const machineRecoveryBias = clamp(
    (input.machine.hpEffect - input.machine.fatigueCost * 0.25 + 4) / 10,
    -0.6,
    0.6,
  );
  const trainerDensity =
    Object.values(input.trainer.muscles).reduce(
      (sum, value) => sum + value,
      0,
    ) /
    (8 * MAX_MUSCLE_LEVEL);
  const focusMatch =
    calculateTrainerMachineAlignment(input.machine, input.trainer) * 0.16;
  const fatiguePenalty =
    clamp01(
      (input.trainingFatigue ?? 0) / FATIGUE_BALANCE.maximum,
    ) * 0.34;
  const momentumBonus =
    calculateWorkoutMomentumFactor(input.workoutMomentum) * 0.12;

  return clamp01(
    0.22 +
      hpRatio * 0.48 +
      machineRecoveryBias * 0.32 +
      trainerDensity * 0.24 +
      focusMatch +
      formRatio * 0.14 +
      mobilityRatio * 0.1 +
      buddyProfile.readinessSupport -
      gymDifficulty(input.gymKind) +
      momentumBonus -
      fatiguePenalty,
  );
}

export function getWorkoutReadinessLabel(readiness: number) {
  if (readiness >= 0.85) return 'Peak';
  if (readiness >= 0.68) return 'Solid';
  if (readiness >= 0.52) return 'Worn';
  return 'Depleted';
}

export function getWorkoutMomentumLabel(workoutMomentum = 0) {
  if (workoutMomentum >= 24) return 'Flow state';
  if (workoutMomentum >= 16) return 'Strong rhythm';
  if (workoutMomentum >= 8) return 'Building';
  if (workoutMomentum >= 4) return 'Warming up';
  return 'Cold';
}

export function getWorkoutSetStressLabel(setStress: number) {
  if (setStress >= 0.86) return 'Critical overload';
  if (setStress >= 0.7) return 'High strain';
  if (setStress >= 0.52) return 'Moderate strain';
  if (setStress >= 0.34) return 'Controlled';
  return 'Light';
}

export function calculateBuddyDisciplineAlignment(
  buddy: Buddy,
  machine: GymMachine,
) {
  const desired = machine.buddyDisciplines;
  const primaryMatch = desired.includes(buddy.creature.primaryDiscipline);
  const secondaryMatch = buddy.creature.secondaryDiscipline
    ? desired.includes(buddy.creature.secondaryDiscipline)
    : false;
  if (primaryMatch && secondaryMatch) return 1;
  if (primaryMatch) return 0.9;
  if (secondaryMatch) return 0.72;
  return 0.35;
}

export function calculateTrainerMachineAlignment(
  machine: GymMachine,
  trainer: TrainerProfile,
) {
  if (!machine.primaryMuscleGroups.length) return 0;
  return clamp01(
    mean(
      machine.primaryMuscleGroups.map(
        (muscle) => trainer.muscles[muscle] / MAX_MUSCLE_LEVEL,
      ),
    ),
  );
}

export function calculateMachineRepeatEfficiency(
  machine: GymMachine,
  consecutiveMachineUses = 0,
) {
  if (consecutiveMachineUses < machine.repeatSoftCap) return 1;
  const excessUses = consecutiveMachineUses - machine.repeatSoftCap + 1;
  return clamp(1 - excessUses * 0.12, 0.55, 1);
}

export function calculateWorkoutLoadPressure(input: {
  machine: GymMachine;
  buddy: Buddy;
  gymKind: GymKind;
  readiness: number;
  loadTier?: WorkoutLoadTier;
  trainerMachineAlignment?: number;
  buddyDisciplineAlignment?: number;
  trainingFatigue?: number;
  workoutMomentum?: number;
  deloadUsed?: number;
}) {
  const load = WORKOUT_LOAD_BY_ID[input.loadTier ?? 'steady'];
  const machineEffort = clamp(
    (input.machine.fatigueCost - input.machine.hpEffect + 3) / 16,
    0,
    0.26,
  );
  const fatigueDrag =
    clamp01((input.trainingFatigue ?? 0) / FATIGUE_BALANCE.maximum) * 0.18;
  const alignmentBuffer =
    (input.trainerMachineAlignment ?? 0.5) * 0.08 +
    (input.buddyDisciplineAlignment ?? 0.5) * 0.06;
  const momentumBuffer =
    calculateWorkoutMomentumFactor(input.workoutMomentum) * 0.08;
  return clamp(
    load.intensity +
      machineEffort +
      gymDifficulty(input.gymKind) +
      fatigueDrag -
      input.readiness * 0.18 -
      alignmentBuffer -
      momentumBuffer -
      (input.deloadUsed ?? 0) * WORKOUT_BALANCE.deloadLoadReduction,
    0.05,
    1,
  );
}

export function calculateWorkoutSetStress(input: {
  loadPressure: number;
  readiness: number;
  trainingFatigue?: number;
  gymKind?: GymKind;
  loadTier?: WorkoutLoadTier;
}) {
  const load = WORKOUT_LOAD_BY_ID[input.loadTier ?? 'steady'];
  const fatigueRatio = clamp01(
    (input.trainingFatigue ?? 0) / FATIGUE_BALANCE.maximum,
  );
  return clamp(
    input.loadPressure * 0.68 +
      load.intensity * 0.26 +
      fatigueRatio * 0.24 +
      gymDifficulty(input.gymKind ?? 'starter') -
      input.readiness * 0.24,
    0,
    1,
  );
}

export function calculateWorkoutFailureChance(input: {
  machine: GymMachine;
  buddy: Buddy;
  gymKind: GymKind;
  trainerBonus: number;
  readiness?: number;
  loadTier?: WorkoutLoadTier;
  setStress?: number;
  formConsistency?: number;
  buddyDisciplineAlignment?: number;
}) {
  const load = WORKOUT_LOAD_BY_ID[input.loadTier ?? 'steady'];
  const wear = clamp(
    (input.buddy.maxHp - input.buddy.hp) / Math.max(1, input.buddy.maxHp),
    0,
    0.3,
  );
  return clamp(
    0.12 +
      load.failureModifier +
      (input.setStress ?? 0.5) * 0.34 +
      (1 - (input.readiness ?? 0.5)) * 0.24 +
      (1 - (input.formConsistency ?? 0.5)) * 0.18 +
      wear +
      gymDifficulty(input.gymKind) -
      input.trainerBonus -
      (input.buddyDisciplineAlignment ?? 0.5) * 0.08,
    0.05,
    0.92,
  );
}

/** Input: explicit state and selected load. Output: deterministic session forecast. */
export function calculateWorkoutPreview(input: {
  buddy: Buddy;
  machine: GymMachine;
  trainer: TrainerProfile;
  gymKind: GymKind;
  selectedLoad: WorkoutLoadTier;
  trainingFatigue: number;
  workoutMomentum: number;
  deloadTokens: number;
  consecutiveMachineUses?: number;
  machineMasteryXp?: number;
}): WorkoutPreview {
  const load = WORKOUT_LOAD_BY_ID[input.selectedLoad];
  const buddyProfile = calculateBuddyWorkoutProfile(input.buddy);
  const trainerMachineAlignment = calculateTrainerMachineAlignment(
    input.machine,
    input.trainer,
  );
  const buddyDisciplineAlignment = calculateBuddyDisciplineAlignment(
    input.buddy,
    input.machine,
  );
  const deloadUsed = clamp(
    Math.min(input.deloadTokens, WORKOUT_DELOAD_BY_TIER[input.selectedLoad]),
    0,
    WORKOUT_BALANCE.maximumDeloadTokens,
  );
  const mastery = getMachineMasteryBenefits(input.machineMasteryXp);
  const readiness = clamp01(
    calculateWorkoutReadiness(input) +
      deloadUsed * WORKOUT_BALANCE.deloadReadinessBonus +
      mastery.readinessBonus,
  );
  const volumePreparedness = clamp01(
    input.buddy.volume / BUDDY_STAT_LIMITS.volume,
  );
  const formConsistency = clamp01(
    buddyProfile.movementConsistency * 0.46 +
      readiness * 0.2 +
      trainerMachineAlignment * 0.15 +
      buddyDisciplineAlignment * 0.15 +
      volumePreparedness * 0.12 -
      load.intensity * 0.08,
  );
  const loadPressure = calculateWorkoutLoadPressure({
    ...input,
    loadTier: input.selectedLoad,
    readiness,
    trainerMachineAlignment,
    buddyDisciplineAlignment,
    deloadUsed,
  });
  const setStress = calculateWorkoutSetStress({
    loadPressure,
    readiness,
    trainingFatigue: input.trainingFatigue,
    gymKind: input.gymKind,
    loadTier: input.selectedLoad,
  });
  const failureProbability = calculateWorkoutFailureChance({
    machine: input.machine,
    buddy: input.buddy,
    gymKind: input.gymKind,
    trainerBonus: trainerMachineAlignment * 0.16,
    readiness,
    loadTier: input.selectedLoad,
    setStress,
    formConsistency,
    buddyDisciplineAlignment,
  });
  const rewardEfficiency = calculateMachineRepeatEfficiency(
    input.machine,
    input.consecutiveMachineUses,
  );
  const rawFatigue =
    (input.machine.fatigueCost +
      load.intensity * 8 +
      setStress * 7 -
      Math.max(0, input.machine.hpEffect) * 0.65 -
      readiness * 3 -
      buddyProfile.fatigueRecoveryBonus * 0.35) *
    load.fatigueMultiplier;
  const expectedFatigueChange = clamp(Math.round(rawFatigue), -8, 30);
  const expectedHpChange = clamp(
    Math.round(
      input.machine.hpEffect -
        setStress * 4 * load.hpMultiplier +
        readiness * 2 +
        buddyProfile.hpLossResistance * 2,
    ),
    -12,
    8,
  );
  const averageXp =
    (input.machine.rewardTable.buddyXp.min +
      input.machine.rewardTable.buddyXp.max) /
    2;
  const expectedXp = Math.max(
    1,
    Math.round(
      averageXp *
        input.machine.rewardTable.buddyXp.multiplier *
        load.xpMultiplier *
        (0.65 + formConsistency * 0.5) *
        (1 + calculateWorkoutMomentumFactor(input.workoutMomentum) * 0.1) *
        rewardEfficiency *
        mastery.xpMultiplier,
    ),
  );

  return {
    selectedLoad: input.selectedLoad,
    readiness,
    readinessLabel: getWorkoutReadinessLabel(readiness),
    failureProbability,
    repTimingMs: load.repDurationMs,
    timingTarget: load.timingTarget,
    perfectWindow: load.perfectWindow,
    goodWindow: load.goodWindow,
    formConsistency,
    setStress,
    volumePreparedness,
    trainerMachineAlignment,
    buddyDisciplineAlignment,
    expectedFatigueChange,
    expectedHpChange,
    expectedXp,
    loadPressure,
    deloadUsed,
    rewardEfficiency,
    feedbackCodes: [
      ...feedbackForPreview({
        readiness,
        trainerAlignment: trainerMachineAlignment,
        buddyAlignment: buddyDisciplineAlignment,
        volumePreparedness,
        setStress,
      }),
      ...(rewardEfficiency < 1
        ? (['repeat-diminished'] as WorkoutFeedbackCode[])
        : []),
    ],
  };
}

/** Input: complete pre-workout state and RNG state. Output: session, deload use, and next RNG state. */
export function createWorkoutSession(input: {
  buddy: Buddy;
  machine: GymMachine;
  trainer: TrainerProfile;
  gymKind: GymKind;
  trainingFatigue: number;
  workoutMomentum: number;
  deloadTokens: number;
  consecutiveMachineUses?: number;
  machineMasteryXp?: number;
  selectedLoad?: WorkoutLoadTier;
  startedAt: number;
  randomState: RandomState;
}) {
  const selectedLoad = input.selectedLoad ?? 'steady';
  const load = WORKOUT_LOAD_BY_ID[selectedLoad];
  const preview = calculateWorkoutPreview({
    ...input,
    selectedLoad,
  });
  const xpRoll = randomInt(
    input.randomState,
    input.machine.rewardTable.buddyXp.min,
    input.machine.rewardTable.buddyXp.max,
  );
  const rolledXp = Math.max(
    1,
    Math.round(
      xpRoll.value *
        input.machine.rewardTable.buddyXp.multiplier *
        load.xpMultiplier *
        (0.65 + preview.formConsistency * 0.5) *
        (1 + calculateWorkoutMomentumFactor(input.workoutMomentum) * 0.1) *
        preview.rewardEfficiency *
        getMachineMasteryBenefits(input.machineMasteryXp).xpMultiplier,
    ),
  );
  const bonusRoll = rollChance(
    xpRoll.randomState,
    input.machine.dropProbabilities.boostToken *
      preview.rewardEfficiency *
      preview.rewardEfficiency,
  );
  const deloadRoll = rollChance(
    bonusRoll.randomState,
    input.machine.dropProbabilities.deloadToken *
      preview.rewardEfficiency *
      preview.rewardEfficiency,
  );
  const hpLossOnFail = clamp(
    Math.max(1, -preview.expectedHpChange) +
      Math.round(preview.setStress * 6 + load.intensity * 5),
    1,
    input.buddy.maxHp,
  );

  return {
    session: {
      id: input.startedAt,
      phase: 'rep',
      zoneType: input.gymKind,
      buddyId: input.buddy.id,
      machineId: input.machine.id,
      startedAt: input.startedAt,
      repStartedAt: input.startedAt,
      currentRep: 1,
      repCount: load.repCount,
      repDurationMs: load.repDurationMs,
      timingTarget: load.timingTarget,
      perfectWindow: load.perfectWindow,
      goodWindow: load.goodWindow,
      repResults: [],
      durationMs: load.repDurationMs * load.repCount,
      spotWindowMs: WORKOUT_BALANCE.spotWindowMs,
      spotWindowStart: 0,
      spotWindowEnd: 0,
      spotSaveDeadline: 0,
      failChance: preview.failureProbability,
      buddyLevelBefore: input.buddy.level,
      hpLossOnFail,
      staminaChange: preview.expectedHpChange,
      xpGain: rolledXp,
      steroidsAwarded: bonusRoll.value,
      deloadTokensAwarded: deloadRoll.value ? 1 : 0,
      resolved: false,
      outcome: null,
      readiness: preview.readiness,
      readinessLabel: preview.readinessLabel,
      loadPressure: preview.loadPressure,
      loadTier: selectedLoad,
      deloadUsed: preview.deloadUsed,
      setStress: preview.setStress,
      movementConsistency: preview.formConsistency,
      formConsistency: preview.formConsistency,
      volumePreparedness: preview.volumePreparedness,
      trainerMachineAlignment: preview.trainerMachineAlignment,
      buddyDisciplineAlignment: preview.buddyDisciplineAlignment,
      expectedFatigueChange: preview.expectedFatigueChange,
      rewardEfficiency: preview.rewardEfficiency,
      sessionQuality: preview.formConsistency,
      feedbackCodes: preview.feedbackCodes,
    } satisfies WorkoutSession,
    deloadUsed: preview.deloadUsed,
    randomState: deloadRoll.randomState,
  };
}

export function calculateWorkoutTimingPosition(
  session: WorkoutSession,
  at: number,
) {
  return clamp01((at - session.repStartedAt) / session.repDurationMs);
}

export function shiftWorkoutSessionTiming(
  session: WorkoutSession,
  pausedDurationMs: number,
): WorkoutSession {
  const shift = Math.max(0, Math.round(pausedDurationMs));
  if (shift === 0 || session.resolved) return { ...session };
  const shiftWhenActive = (value: number) => (value > 0 ? value + shift : value);
  return {
    ...session,
    startedAt: session.startedAt + shift,
    repStartedAt: shiftWhenActive(session.repStartedAt),
    spotWindowStart: shiftWhenActive(session.spotWindowStart),
    spotWindowEnd: shiftWhenActive(session.spotWindowEnd),
    spotSaveDeadline: shiftWhenActive(session.spotSaveDeadline),
  };
}

export function gradeWorkoutRepTiming(
  session: WorkoutSession,
  inputAt: number,
): WorkoutRepResult {
  const timingPosition = calculateWorkoutTimingPosition(session, inputAt);
  const timingError = Math.abs(timingPosition - session.timingTarget);
  let grade: WorkoutRepGrade = 'failed';
  let timingScore = 0.12;
  if (timingError <= session.perfectWindow) {
    grade = 'perfect';
    timingScore = clamp(
      1 - (timingError / Math.max(0.001, session.perfectWindow)) * 0.08,
      0.92,
      1,
    );
  } else if (timingError <= session.goodWindow) {
    grade = 'good';
    timingScore = clamp(
      0.94 -
        ((timingError - session.perfectWindow) /
          Math.max(0.001, session.goodWindow - session.perfectWindow)) *
          0.16,
      0.78,
      0.94,
    );
  } else if (timingError <= session.goodWindow * 1.55) {
    grade = 'rough';
    timingScore = clamp(
      0.72 -
        ((timingError - session.goodWindow) /
          Math.max(0.001, session.goodWindow * 0.55)) *
          0.25,
      0.45,
      0.72,
    );
  }
  return {
    rep: session.currentRep,
    inputAt,
    timingPosition,
    timingError,
    timingScore,
    grade,
  };
}

function withUpdatedQuality(
  session: WorkoutSession,
  repResults: WorkoutRepResult[],
) {
  const timingQuality = mean(repResults.map((result) => result.timingScore));
  return clamp01(
    timingQuality * 0.72 +
      session.formConsistency * 0.18 +
      session.readiness * 0.1,
  );
}

function beginSpotWindow(
  session: WorkoutSession,
  at: number,
  repResult: WorkoutRepResult,
): WorkoutSession {
  const repResults = [...session.repResults, repResult];
  return {
    ...session,
    phase: 'spot',
    repResults,
    sessionQuality: withUpdatedQuality(session, repResults),
    spotWindowStart: at,
    spotWindowEnd: at + session.spotWindowMs,
    spotSaveDeadline: at + WORKOUT_BALANCE.spotSaveMs,
  };
}

/** Resolves the player's Lock Rep input without RNG. */
export function resolveWorkoutRep(
  session: WorkoutSession,
  inputAt: number,
): WorkoutSession {
  if (session.phase !== 'rep' || session.resolved) return session;
  const result = gradeWorkoutRepTiming(session, inputAt);
  if (result.grade === 'failed') {
    return beginSpotWindow(session, inputAt, result);
  }
  const repResults = [...session.repResults, result];
  const sessionQuality = withUpdatedQuality(session, repResults);
  if (session.currentRep >= session.repCount) {
    return {
      ...session,
      phase: 'resolved',
      repResults,
      sessionQuality,
      resolved: true,
      outcome: 'success',
      feedbackCodes: [
        ...session.feedbackCodes,
        sessionQuality >= 0.72
          ? 'technique-consistent'
          : 'technique-inconsistent',
      ],
    };
  }
  return {
    ...session,
    currentRep: session.currentRep + 1,
    repStartedAt: inputAt,
    repResults,
    sessionQuality,
  };
}

/** Advances timeout-only state. It never rolls a random outcome. */
export function advanceWorkoutSession(
  session: WorkoutSession,
  now: number,
): WorkoutSession {
  if (session.resolved) return session;
  if (
    session.phase === 'rep' &&
    now >= session.repStartedAt + session.repDurationMs
  ) {
    const timedOutAt = session.repStartedAt + session.repDurationMs;
    return beginSpotWindow(
      session,
      timedOutAt,
      gradeWorkoutRepTiming(session, timedOutAt),
    );
  }
  if (session.phase === 'spot' && now > session.spotWindowEnd) {
    return {
      ...session,
      phase: 'resolved',
      resolved: true,
      outcome: 'failure',
      feedbackCodes: [
        ...session.feedbackCodes,
        'technique-inconsistent',
        'spot-missed',
      ],
    };
  }
  return session;
}

/**
 * Resolves Spot Now by reaction time. Pressing by spotSaveDeadline always
 * rescues the set; pressing late or allowing the window to expire always misses.
 */
export function resolveWorkoutSpot(input: {
  session: WorkoutSession;
  inputAt: number;
}) {
  const { session, inputAt } = input;
  if (session.phase !== 'spot' || session.resolved) {
    return {
      session,
      succeeded: false,
      reactionMs: 0,
    };
  }
  const reactionMs = Math.max(0, inputAt - session.spotWindowStart);
  const succeeded =
    inputAt <= session.spotSaveDeadline && inputAt <= session.spotWindowEnd;
  return {
    session: {
      ...session,
      phase: 'resolved' as const,
      resolved: true,
      outcome: succeeded ? ('rescued' as const) : ('failure' as const),
      feedbackCodes: [
        ...session.feedbackCodes,
        'technique-inconsistent' as const,
        succeeded ? ('spot-saved' as const) : ('spot-missed' as const),
      ],
    },
    succeeded,
    reactionMs,
  };
}

export type WorkoutResolutionResult = {
  outcome: WorkoutOutcome;
  buddy: Buddy;
  trainer: TrainerProfile;
  steroidsAwarded: number;
  deloadTokensAwarded: number;
  workoutMomentum: number;
  trainingFatigue: number;
  xpAwarded: number;
  hpChange: number;
  leveled: boolean;
  growth: { form: number; mobility: number; volume: number };
  momentumDelta: number;
  fatigueDelta: number;
  feedbackCodes: WorkoutFeedbackCode[];
};

/** Input: resolved session and current simulation values. Output: all immutable gameplay changes. */
export function calculateWorkoutResolution(input: {
  session: WorkoutSession;
  buddy: Buddy;
  machine: GymMachine;
  trainer: TrainerProfile;
  steroids: number;
  workoutMomentum: number;
  trainingFatigue: number;
  outcome?: WorkoutOutcome;
}): WorkoutResolutionResult {
  const outcome = input.outcome ?? input.session.outcome ?? 'failure';
  const load = WORKOUT_LOAD_BY_ID[input.session.loadTier];
  const technique = clamp01(input.session.sessionQuality);

  if (outcome !== 'failure') {
    const rescued = outcome === 'rescued';
    const rewardScale = rescued ? 0.45 : 1;
    const techniqueReward = 0.55 + technique * 0.75;
    const xpAwarded = Math.max(
      1,
      Math.round(input.session.xpGain * techniqueReward * rewardScale),
    );
    const expectedLevel =
      getGymProgressionMilestone(input.machine.gymId)?.expectedBuddyLevel
        .target ?? input.buddy.level;
    const experience = applyExperienceReward(input.buddy, xpAwarded, {
      expectedLevel,
    });
    const baseGrowth = calculateBuddyWorkoutGrowth(
      input.machine,
      input.session.readiness,
      input.session.zoneType,
      true,
    );
    const growthScale =
      (0.55 + technique * 0.75) *
      (0.78 + input.session.loadPressure * 0.28) *
      (rescued ? 0.45 : 1);
    const formDelta = rescued
      ? Math.min(0, Math.round(baseGrowth.form * growthScale) - 1)
      : Math.round(baseGrowth.form * growthScale);
    const mobilityDelta = rescued
      ? Math.min(0, Math.round(baseGrowth.mobility * growthScale))
      : Math.round(baseGrowth.mobility * growthScale);
    const volumeDelta = rescued
      ? Math.max(-1, Math.round(baseGrowth.volume * growthScale) - 1)
      : Math.round(baseGrowth.volume * growthScale);
    const plannedHpChange = rescued
      ? Math.min(-1, input.session.staminaChange - 2)
      : input.session.staminaChange + Math.round((technique - 0.65) * 4);
    const nextHp = clamp(
      input.buddy.hp + plannedHpChange,
      0,
      experience.buddy.maxHp,
    );
    const hpChange = nextHp - input.buddy.hp;
    const buddy: Buddy = {
      ...experience.buddy,
      hp: nextHp,
      form: clampBuddyStat(
        experience.buddy.form + formDelta,
        BUDDY_STAT_LIMITS.form,
        -8,
      ),
      mobility: clampBuddyStat(
        experience.buddy.mobility + mobilityDelta,
        BUDDY_STAT_LIMITS.mobility,
        -8,
      ),
      volume: clampBuddyStat(
        experience.buddy.volume + volumeDelta,
        BUDDY_STAT_LIMITS.volume,
        -5,
      ),
    };
    const rawMomentum = rescued
      ? -1
      : Math.round(
          ((technique - 0.45) * 10 * load.momentumMultiplier +
            input.session.readiness * 2 +
            input.machine.momentumEffect) *
            input.session.rewardEfficiency,
        );
    const momentumDelta = rescued ? -1 : clamp(rawMomentum, 0, 8);
    const techniqueFatigueAdjustment = Math.round((0.72 - technique) * 8);
    const fatigueDelta = rescued
      ? Math.max(2, input.session.expectedFatigueChange + 4)
      : clamp(
          input.session.expectedFatigueChange + techniqueFatigueAdjustment,
          -8,
          30,
        );
    const trainerStaminaGain = Math.max(
      1,
      Math.round(
        Math.floor(xpAwarded / (rescued ? 6 : 3.4)) *
          input.machine.rewardTable.trainerGrowthMultiplier,
      ),
    );

    return {
      outcome,
      buddy,
      trainer: applyTrainerGrowth(
        input.trainer,
        input.machine.focus,
        trainerStaminaGain,
        experience.leveled ? 1 : 0,
      ),
      steroidsAwarded:
        !rescued && technique >= 0.72 && input.session.steroidsAwarded ? 1 : 0,
      deloadTokensAwarded:
        !rescued && technique >= 0.72
          ? input.session.deloadTokensAwarded
          : 0,
      workoutMomentum: clamp(
        input.workoutMomentum + momentumDelta,
        0,
        WORKOUT_BALANCE.maximumMomentum,
      ),
      trainingFatigue: applyFatigueChange(
        input.trainingFatigue,
        fatigueDelta,
      ),
      xpAwarded: experience.experienceAwarded,
      hpChange,
      leveled: experience.leveled,
      growth: {
        form: formDelta,
        mobility: mobilityDelta,
        volume: volumeDelta,
      },
      momentumDelta,
      fatigueDelta,
      feedbackCodes: input.session.feedbackCodes,
    };
  }

  const formPenalty = -clamp(
    Math.round(1 + input.session.setStress * 3 - technique * 2),
    1,
    4,
  );
  const mobilityPenalty = -clamp(
    Math.round(input.session.setStress * 2 - technique),
    0,
    3,
  );
  const volumePenalty = -clamp(
    Math.round(input.session.loadPressure * 3 - technique),
    1,
    4,
  );
  const nextHp = clamp(
    input.buddy.hp - input.session.hpLossOnFail,
    0,
    input.buddy.maxHp,
  );
  const hpChange = nextHp - input.buddy.hp;
  const fatigueDelta = clamp(
    Math.max(4, input.session.expectedFatigueChange) +
      8 +
      Math.round(input.session.setStress * 5),
    6,
    36,
  );
  const momentumDelta = -clamp(
    Math.round(2 + input.session.setStress * 5),
    2,
    8,
  );

  return {
    outcome: 'failure',
    buddy: {
      ...input.buddy,
      hp: nextHp,
      form: clampBuddyStat(
        input.buddy.form + formPenalty,
        BUDDY_STAT_LIMITS.form,
        -8,
      ),
      mobility: clampBuddyStat(
        input.buddy.mobility + mobilityPenalty,
        BUDDY_STAT_LIMITS.mobility,
        -8,
      ),
      volume: clampBuddyStat(
        input.buddy.volume + volumePenalty,
        BUDDY_STAT_LIMITS.volume,
        -5,
      ),
    },
    trainer: input.trainer,
    steroidsAwarded: 0,
    deloadTokensAwarded: 0,
    workoutMomentum: clamp(
      input.workoutMomentum + momentumDelta,
      0,
      WORKOUT_BALANCE.maximumMomentum,
    ),
    trainingFatigue: applyFatigueChange(
      input.trainingFatigue,
      fatigueDelta,
    ),
    xpAwarded: 0,
    hpChange,
    leveled: false,
    growth: {
      form: formPenalty,
      mobility: mobilityPenalty,
      volume: volumePenalty,
    },
    momentumDelta,
    fatigueDelta,
    feedbackCodes: input.session.feedbackCodes,
  };
}
