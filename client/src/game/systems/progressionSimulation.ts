import {
  BUDDY_LEVEL_CURVE,
  GYM_PROGRESSION_MILESTONES,
  JOURNEY_SIMULATION_BALANCE,
  RECOVERY_PROGRESSION,
} from '../content/progressionBalance';
import type {
  GymProgressionMilestone,
  MachineMasteryProgress,
} from '../types';
import { clamp } from './math';
import {
  calculateCatchUpXpMultiplier,
  calculateChallengeEffectiveLevel,
  calculateEndgameProgress,
  getBuddyExperienceNeeded,
  getMachineMasteryRank,
  recordMachineMastery,
} from './progressionModel';
import {
  createRandomState,
  nextRandom,
  randomInt,
  rollChance,
  type RandomState,
} from './random';

export type JourneySimulationStyle =
  | 'mainline'
  | 'balanced'
  | 'collector'
  | 'optimizer';

type SimBuddy = {
  level: number;
  xp: number;
  sessionsSinceCapture: number;
};

export type JourneySimulationResult = {
  style: JourneySimulationStyle;
  completionMinutes: number;
  postgameMinutes: number;
  completed: boolean;
  finalHighestBuddyLevel: number;
  finalAverageBuddyLevel: number;
  trainerPhysique: number;
  finalFatigue: number;
  finalMomentum: number;
  deloadTokens: number;
  caughtSpecies: number;
  completedGyms: number;
  bossAttempts: number;
  wallEvents: number;
  runawayEvents: number;
  recoveryStops: number;
  rewardShortages: number;
  mandatoryExtraWorkouts: number;
  masteredMachines: number;
  endgameRank: number;
};

export type ProgressionMilestoneDiagnostic = {
  gymId: string;
  journeys: number;
  wallRate: number;
  runawayRate: number;
  averageBossAttempts: number;
};

export type ProgressionSimulationSummary = {
  seed: number;
  journeyCount: number;
  completedJourneys: number;
  completionRate: number;
  averageCompletionMinutes: number;
  medianCompletionMinutes: number;
  p90CompletionMinutes: number;
  averageHighestBuddyLevel: number;
  averageTrainerPhysique: number;
  mandatoryGrindRate: number;
  wallJourneyRate: number;
  runawayJourneyRate: number;
  rewardShortageJourneyRate: number;
  averageRecoveryStops: number;
  averageCaughtSpecies: number;
  averageMasteredMachines: number;
  styleSummaries: Array<{
    style: JourneySimulationStyle;
    journeys: number;
    averageCompletionMinutes: number;
    averageCaughtSpecies: number;
    averageMasteredMachines: number;
    averageEndgameRank: number;
  }>;
  milestones: ProgressionMilestoneDiagnostic[];
  results: JourneySimulationResult[];
};

type SimState = {
  randomState: RandomState;
  buddies: SimBuddy[];
  trainerPhysique: number;
  fatigue: number;
  momentum: number;
  deloadTokens: number;
  caughtSpecies: number;
  seenSpecies: number;
  completedGymIds: string[];
  completedBossVariantIds: string[];
  masteryByMachineId: Record<string, MachineMasteryProgress>;
  completionMinutes: number;
  postgameMinutes: number;
  bossAttempts: number;
  wallEvents: number;
  runawayEvents: number;
  recoveryStops: number;
  rewardShortages: number;
  mandatoryExtraWorkouts: number;
};

function average(values: readonly number[]) {
  return values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;
}

function percentile(values: readonly number[], amount: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[
    Math.min(
      sorted.length - 1,
      Math.max(0, Math.ceil(sorted.length * amount) - 1),
    )
  ]!;
}

function styleForJourney(index: number): JourneySimulationStyle {
  const bucket = index % 20;
  if (bucket < 10) return 'mainline';
  if (bucket < 16) return 'balanced';
  if (bucket < 19) return 'collector';
  return 'optimizer';
}

function rollBetween(state: SimState, minimum: number, maximum: number) {
  const roll = randomInt(state.randomState, minimum, maximum);
  state.randomState = roll.randomState;
  return roll.value;
}

function rollUnit(state: SimState) {
  const roll = nextRandom(state.randomState);
  state.randomState = roll.randomState;
  return roll.value;
}

function applySimExperience(
  buddy: SimBuddy,
  baseXp: number,
  expectedLevel: number,
) {
  const multiplier = calculateCatchUpXpMultiplier({
    buddyLevel: buddy.level,
    expectedLevel,
    sessionsSinceCapture: buddy.sessionsSinceCapture,
  });
  let xp = buddy.xp + Math.max(1, Math.round(baseXp * multiplier));
  let level = buddy.level;
  while (
    level < BUDDY_LEVEL_CURVE.maximumLevel &&
    xp >= getBuddyExperienceNeeded(level)
  ) {
    xp -= getBuddyExperienceNeeded(level);
    level += 1;
  }
  return {
    level,
    xp,
    sessionsSinceCapture: buddy.sessionsSinceCapture + 1,
  };
}

function chooseTrainingBuddy(
  buddies: readonly SimBuddy[],
  expectedLevel: number,
) {
  let selected = 0;
  let largestGap = -Infinity;
  buddies.forEach((buddy, index) => {
    const newcomerBias = Math.max(
      0,
      8 - buddy.sessionsSinceCapture,
    );
    const gap = expectedLevel - buddy.level + newcomerBias * 0.35;
    if (gap > largestGap) {
      selected = index;
      largestGap = gap;
    }
  });
  return selected;
}

function addCapturedBuddy(
  state: SimState,
  milestone: GymProgressionMilestone,
) {
  const level = rollBetween(
    state,
    milestone.expectedBuddyLevel.min,
    milestone.expectedBuddyLevel.target,
  );
  const buddy = { level, xp: 0, sessionsSinceCapture: 0 };
  if (state.buddies.length < 6) {
    state.buddies.push(buddy);
  } else {
    const lowestIndex = state.buddies.reduce(
      (selected, candidate, index, all) =>
        candidate.level < all[selected]!.level ? index : selected,
      0,
    );
    if (level > state.buddies[lowestIndex]!.level) {
      state.buddies[lowestIndex] = buddy;
    }
  }
  state.caughtSpecies = Math.min(16, state.caughtSpecies + 1);
  state.seenSpecies = Math.min(
    16,
    Math.max(state.seenSpecies, state.caughtSpecies + 1),
  );
}

function recoverIfNeeded(state: SimState) {
  if (state.fatigue <= RECOVERY_PROGRESSION.fatigueComfortCeiling) return;
  state.recoveryStops += 1;
  if (state.deloadTokens > 0) {
    state.deloadTokens -= 1;
    state.fatigue = Math.max(0, state.fatigue - 34);
  } else {
    if (state.fatigue >= RECOVERY_PROGRESSION.emergencyFatigueCeiling) {
      state.rewardShortages += 1;
    }
    state.fatigue = Math.max(0, state.fatigue - 48);
    state.completionMinutes +=
      JOURNEY_SIMULATION_BALANCE.recoveryStopMinutes;
  }
  state.momentum = Math.max(0, state.momentum - 3);
}

function simulateWorkout(
  state: SimState,
  milestone: GymProgressionMilestone,
  machineSlot: number,
) {
  const buddyIndex = chooseTrainingBuddy(
    state.buddies,
    milestone.expectedBuddyLevel.target,
  );
  const xpVariance = 0.82 + rollUnit(state) * 0.36;
  const xp =
    JOURNEY_SIMULATION_BALANCE.workoutXpByGym[milestone.gymId] *
    xpVariance;
  state.buddies[buddyIndex] = applySimExperience(
    state.buddies[buddyIndex]!,
    xp,
    milestone.expectedBuddyLevel.target,
  );
  const quality = 0.52 + rollUnit(state) * 0.42;
  const machineId = `${milestone.gymId}.machine-${machineSlot}`;
  state.masteryByMachineId[machineId] = recordMachineMastery({
    current: state.masteryByMachineId[machineId],
    outcome: quality >= 0.58 ? 'success' : 'rescued',
    quality,
  });
  state.fatigue = clamp(
    state.fatigue +
      JOURNEY_SIMULATION_BALANCE.workoutFatigueByGym[milestone.gymId] -
      Math.round(quality * 3),
    0,
    120,
  );
  state.momentum = clamp(
    state.momentum + (quality >= 0.72 ? 3 : 1),
    0,
    30,
  );
  state.trainerPhysique = clamp(
    state.trainerPhysique + 0.48 + quality * 0.28,
    1,
    40,
  );
  const deloadRoll = rollChance(
    state.randomState,
    RECOVERY_PROGRESSION.mainPathDeloadDropChance,
  );
  state.randomState = deloadRoll.randomState;
  if (deloadRoll.value) {
    state.deloadTokens = Math.min(
      RECOVERY_PROGRESSION.maximumDeloadTokens,
      state.deloadTokens + 1,
    );
  }
  recoverIfNeeded(state);
}

function bossSuccessChance(
  state: SimState,
  milestone: GymProgressionMilestone,
) {
  const highestLevel = Math.max(
    ...state.buddies.map((buddy) => buddy.level),
  );
  const effectiveLevel = calculateChallengeEffectiveLevel(
    highestLevel,
    milestone.gymId,
  );
  const levelFit =
    effectiveLevel / milestone.expectedBuddyLevel.target;
  const trainerFit =
    state.trainerPhysique /
    milestone.expectedTrainerPhysique.target;
  const rosterSupport = Math.min(0.08, (state.buddies.length - 2) * 0.02);
  return clamp(
    0.84 +
      (levelFit - 1) * 0.32 +
      (trainerFit - 1) * 0.14 +
      rosterSupport -
      (state.fatigue / 120) * 0.16,
    0.42,
    0.94,
  );
}

function simulateBoss(
  state: SimState,
  milestone: GymProgressionMilestone,
) {
  let attempts = 0;
  let completed = false;
  while (!completed) {
    attempts += 1;
    state.bossAttempts += 1;
    state.completionMinutes +=
      JOURNEY_SIMULATION_BALANCE.bossAttemptMinutes;
    const forcedProtection =
      attempts > RECOVERY_PROGRESSION.bossFailureProtectionAfter;
    completed =
      forcedProtection || rollUnit(state) < bossSuccessChance(state, milestone);
    if (!completed) {
      state.fatigue = clamp(state.fatigue + 9, 0, 120);
      if (
        attempts ===
        RECOVERY_PROGRESSION.bossFailureProtectionAfter
      ) {
        state.wallEvents += 1;
        state.fatigue = Math.max(
          0,
          state.fatigue -
            RECOVERY_PROGRESSION.protectedFatigueRecovery,
        );
      }
    }
  }
  const strongestIndex = state.buddies.reduce(
    (selected, buddy, index, all) =>
      buddy.level > all[selected]!.level ? index : selected,
    0,
  );
  state.buddies[strongestIndex] = applySimExperience(
    state.buddies[strongestIndex]!,
    JOURNEY_SIMULATION_BALANCE.bossXpByGym[milestone.gymId],
    milestone.expectedBuddyLevel.target,
  );
  state.completedGymIds.push(milestone.gymId);
  state.completedBossVariantIds.push(`${milestone.gymId}.variant-a`);
  state.fatigue = Math.max(0, state.fatigue - 10);
  state.momentum = clamp(state.momentum + 4, 0, 30);
}

function simulatePostgame(
  state: SimState,
  style: JourneySimulationStyle,
) {
  if (style === 'collector') {
    state.postgameMinutes += (16 - state.caughtSpecies) * 9;
    state.caughtSpecies = 16;
    state.seenSpecies = 16;
    state.completedBossVariantIds.push(
      'higher-1.variant-b',
      'higher-2.variant-b',
    );
  } else if (style === 'optimizer') {
    const machineIds = [
      'higher-1.machine-0',
      'higher-1.machine-1',
      'higher-2.machine-0',
      'higher-3.machine-0',
    ];
    machineIds.forEach((machineId) => {
      for (let session = 0; session < 16; session += 1) {
        state.masteryByMachineId[machineId] = recordMachineMastery({
          current: state.masteryByMachineId[machineId],
          outcome: 'success',
          quality: 0.86,
        });
      }
    });
    state.postgameMinutes += 150;
    state.completedBossVariantIds.push(
      'starter-a.variant-b',
      'starter-b.variant-b',
      'higher-1.variant-b',
      'higher-2.variant-b',
      'higher-3.variant-b',
    );
  } else if (style === 'balanced') {
    state.postgameMinutes += 55;
    state.caughtSpecies = Math.min(16, state.caughtSpecies + 3);
    state.completedBossVariantIds.push('higher-3.variant-b');
  }
}

function simulateJourney(
  seed: number,
  style: JourneySimulationStyle,
  milestoneDiagnostics: Map<
    string,
    { journeys: number; walls: number; runaways: number; bossAttempts: number }
  >,
): JourneySimulationResult {
  const state: SimState = {
    randomState: createRandomState(seed),
    buddies: Array.from(
      { length: JOURNEY_SIMULATION_BALANCE.startingBuddyCount },
      () => ({
        level: JOURNEY_SIMULATION_BALANCE.startingBuddyLevel,
        xp: 0,
        sessionsSinceCapture: 0,
      }),
    ),
    trainerPhysique: 9,
    fatigue: 0,
    momentum: 0,
    deloadTokens: 1,
    caughtSpecies: JOURNEY_SIMULATION_BALANCE.startingCaughtSpecies,
    seenSpecies: JOURNEY_SIMULATION_BALANCE.startingCaughtSpecies,
    completedGymIds: [],
    completedBossVariantIds: [],
    masteryByMachineId: {},
    completionMinutes: 0,
    postgameMinutes: 0,
    bossAttempts: 0,
    wallEvents: 0,
    runawayEvents: 0,
    recoveryStops: 0,
    rewardShortages: 0,
    mandatoryExtraWorkouts: 0,
  };

  for (const milestone of GYM_PROGRESSION_MILESTONES) {
    const diagnostics = milestoneDiagnostics.get(milestone.gymId)!;
    diagnostics.journeys += 1;
    const stageStartAttempts = state.bossAttempts;
    const stageStartWalls = state.wallEvents;
    const stageStartRunaways = state.runawayEvents;
    const optionalWorkouts =
      JOURNEY_SIMULATION_BALANCE.optionalWorkoutsByStyle[style];
    const optionalEncounters =
      JOURNEY_SIMULATION_BALANCE.optionalEncountersByStyle[style];
    const encounters =
      milestone.mainPathEncounters + optionalEncounters;
    for (let encounter = 0; encounter < encounters; encounter += 1) {
      state.seenSpecies = Math.min(16, state.seenSpecies + 1);
      const catchChance =
        style === 'collector' ? 0.94 : style === 'mainline' ? 0.78 : 0.86;
      if (rollUnit(state) < catchChance) {
        addCapturedBuddy(state, milestone);
      }
    }
    const workouts =
      milestone.mainPathWorkoutSessions + optionalWorkouts;
    for (let workout = 0; workout < workouts; workout += 1) {
      const machineSlot =
        style === 'optimizer' ? workout % 2 : workout % 4;
      simulateWorkout(state, milestone, machineSlot);
    }

    const highestLevel = Math.max(
      ...state.buddies.map((buddy) => buddy.level),
    );
    if (highestLevel > milestone.expectedBuddyLevel.max + 4) {
      state.runawayEvents += 1;
    }

    const previousTarget =
      GYM_PROGRESSION_MILESTONES[milestone.order - 2]
        ?.expectedCumulativeMinutes.target ?? 0;
    const stageTarget =
      milestone.expectedCumulativeMinutes.target - previousTarget;
    const variance =
      rollUnit(state) *
        JOURNEY_SIMULATION_BALANCE.stageExplorationVarianceMinutes *
        2 -
      JOURNEY_SIMULATION_BALANCE.stageExplorationVarianceMinutes;
    const optionalMinutes =
      optionalWorkouts * JOURNEY_SIMULATION_BALANCE.workoutMinutes +
      optionalEncounters * JOURNEY_SIMULATION_BALANCE.encounterMinutes;
    state.completionMinutes += Math.max(
      8,
      stageTarget -
        JOURNEY_SIMULATION_BALANCE.bossAttemptMinutes +
        variance +
        optionalMinutes,
    );
    simulateBoss(state, milestone);

    diagnostics.walls += state.wallEvents - stageStartWalls;
    diagnostics.runaways +=
      state.runawayEvents - stageStartRunaways;
    diagnostics.bossAttempts +=
      state.bossAttempts - stageStartAttempts;
  }

  const mainJourneyMinutes = state.completionMinutes;
  simulatePostgame(state, style);
  const endgame = calculateEndgameProgress({
    completedGymIds: state.completedGymIds,
    completedBossVariantIds: state.completedBossVariantIds,
    caughtDex: Array.from(
      { length: state.caughtSpecies },
      (_, index) => index + 1,
    ),
    masteryByMachineId: state.masteryByMachineId,
  });
  const buddyLevels = state.buddies.map((buddy) => buddy.level);
  return {
    style,
    completionMinutes: mainJourneyMinutes,
    postgameMinutes: state.postgameMinutes,
    completed:
      state.completedGymIds.length ===
      GYM_PROGRESSION_MILESTONES.length,
    finalHighestBuddyLevel: Math.max(...buddyLevels),
    finalAverageBuddyLevel: average(buddyLevels),
    trainerPhysique: state.trainerPhysique,
    finalFatigue: state.fatigue,
    finalMomentum: state.momentum,
    deloadTokens: state.deloadTokens,
    caughtSpecies: state.caughtSpecies,
    completedGyms: state.completedGymIds.length,
    bossAttempts: state.bossAttempts,
    wallEvents: state.wallEvents,
    runawayEvents: state.runawayEvents,
    recoveryStops: state.recoveryStops,
    rewardShortages: state.rewardShortages,
    mandatoryExtraWorkouts: state.mandatoryExtraWorkouts,
    masteredMachines: Object.values(state.masteryByMachineId).filter(
      (progress) => getMachineMasteryRank(progress.xp).id === 'mastered',
    ).length,
    endgameRank: endgame.rank,
  };
}

export function simulateProgressionJourneys(input?: {
  seed?: number;
  journeyCount?: number;
}): ProgressionSimulationSummary {
  const seed = input?.seed ?? 20_260_728;
  const journeyCount =
    input?.journeyCount ??
    JOURNEY_SIMULATION_BALANCE.defaultJourneyCount;
  if (
    !Number.isInteger(journeyCount) ||
    journeyCount < JOURNEY_SIMULATION_BALANCE.minimumJourneyCount
  ) {
    throw new Error(
      `Progression simulation requires at least ${JOURNEY_SIMULATION_BALANCE.minimumJourneyCount} complete journeys.`,
    );
  }
  const milestoneDiagnostics = new Map(
    GYM_PROGRESSION_MILESTONES.map((milestone) => [
      milestone.gymId,
      { journeys: 0, walls: 0, runaways: 0, bossAttempts: 0 },
    ]),
  );
  const results = Array.from({ length: journeyCount }, (_, index) =>
    simulateJourney(
      seed + Math.imul(index + 1, 2_654_435_761),
      styleForJourney(index),
      milestoneDiagnostics,
    ),
  );
  const completionMinutes = results.map(
    (result) => result.completionMinutes,
  );
  const styleSummaries = (
    ['mainline', 'balanced', 'collector', 'optimizer'] as const
  ).map((style) => {
    const local = results.filter((result) => result.style === style);
    return {
      style,
      journeys: local.length,
      averageCompletionMinutes: average(
        local.map((result) => result.completionMinutes),
      ),
      averageCaughtSpecies: average(
        local.map((result) => result.caughtSpecies),
      ),
      averageMasteredMachines: average(
        local.map((result) => result.masteredMachines),
      ),
      averageEndgameRank: average(
        local.map((result) => result.endgameRank),
      ),
    };
  });
  const countWith = (
    predicate: (result: JourneySimulationResult) => boolean,
  ) => results.filter(predicate).length / results.length;

  return {
    seed,
    journeyCount,
    completedJourneys: results.filter((result) => result.completed).length,
    completionRate: countWith((result) => result.completed),
    averageCompletionMinutes: average(completionMinutes),
    medianCompletionMinutes: percentile(completionMinutes, 0.5),
    p90CompletionMinutes: percentile(completionMinutes, 0.9),
    averageHighestBuddyLevel: average(
      results.map((result) => result.finalHighestBuddyLevel),
    ),
    averageTrainerPhysique: average(
      results.map((result) => result.trainerPhysique),
    ),
    mandatoryGrindRate: countWith(
      (result) => result.mandatoryExtraWorkouts > 0,
    ),
    wallJourneyRate: countWith((result) => result.wallEvents > 0),
    runawayJourneyRate: countWith(
      (result) => result.runawayEvents > 0,
    ),
    rewardShortageJourneyRate: countWith(
      (result) => result.rewardShortages > 0,
    ),
    averageRecoveryStops: average(
      results.map((result) => result.recoveryStops),
    ),
    averageCaughtSpecies: average(
      results.map((result) => result.caughtSpecies),
    ),
    averageMasteredMachines: average(
      results.map((result) => result.masteredMachines),
    ),
    styleSummaries,
    milestones: [...milestoneDiagnostics.entries()].map(
      ([gymId, diagnostic]) => ({
        gymId,
        journeys: diagnostic.journeys,
        wallRate: diagnostic.walls / diagnostic.journeys,
        runawayRate: diagnostic.runaways / diagnostic.journeys,
        averageBossAttempts:
          diagnostic.bossAttempts / diagnostic.journeys,
      }),
    ),
    results,
  };
}
