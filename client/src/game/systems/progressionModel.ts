import { BUDDY_STAT_LIMITS, FATIGUE_BALANCE } from '../content/balance';
import {
  BUDDY_INDEX_MILESTONES,
  BUDDY_LEVEL_CURVE,
  CATCH_UP_CURVE,
  CHALLENGE_LEVEL_CURVE,
  DISCIPLINE_STRENGTH_CURVE,
  ENDGAME_ACTIVITIES,
  ENDGAME_PROGRESSION_CURVE,
  GYM_PROGRESSION_MILESTONES,
  MACHINE_MASTERY_CURVE,
  MACHINE_MASTERY_RANKS,
  RECOVERY_PROGRESSION,
  getGymProgressionMilestone,
} from '../content/progressionBalance';
import {
  WORLD_JOURNEY_CONNECTIONS,
  isWorldConnectionAccessible,
} from '../content/worldGraph';
import type {
  Buddy,
  BuddyBaseStatKey,
  BuddyDiscipline,
  BuddyDisciplineStrengths,
  EndgameProgress,
  GymZoneId,
  MachineMasteryProgress,
  MachineMasteryRank,
  WorkoutOutcome,
} from '../types';
import { clamp, clamp01 } from './math';

export function getBuddyExperienceNeeded(level: number) {
  const boundedLevel = clamp(
    Math.floor(level),
    BUDDY_LEVEL_CURVE.minimumLevel,
    BUDDY_LEVEL_CURVE.maximumLevel,
  );
  const lateLevels = Math.max(
    0,
    boundedLevel - BUDDY_LEVEL_CURVE.lateRampStartLevel,
  );
  return Math.ceil(
    BUDDY_LEVEL_CURVE.baseXp +
      boundedLevel * BUDDY_LEVEL_CURVE.linearXpPerLevel +
      lateLevels * BUDDY_LEVEL_CURVE.lateXpPerLevel,
  );
}

export function getBuddyExperienceToLevel(
  startingLevel: number,
  targetLevel: number,
) {
  let total = 0;
  const start = clamp(
    Math.floor(startingLevel),
    BUDDY_LEVEL_CURVE.minimumLevel,
    BUDDY_LEVEL_CURVE.maximumLevel,
  );
  const target = clamp(
    Math.floor(targetLevel),
    start,
    BUDDY_LEVEL_CURVE.maximumLevel,
  );
  for (let level = start; level < target; level += 1) {
    total += getBuddyExperienceNeeded(level);
  }
  return total;
}

export function calculateBuddyMaximumHp(
  speciesBaseHp: number,
  level: number,
) {
  return Math.round(
    BUDDY_LEVEL_CURVE.maxHpBase +
      speciesBaseHp * BUDDY_LEVEL_CURVE.maxHpSpeciesScale +
      clamp(level, 1, BUDDY_LEVEL_CURVE.maximumLevel) *
        BUDDY_LEVEL_CURVE.maxHpPerLevel,
  );
}

export function calculateCatchUpXpMultiplier(input: {
  buddyLevel: number;
  expectedLevel: number;
  sessionsSinceCapture?: number;
}) {
  const missingLevels = Math.max(
    0,
    input.expectedLevel -
      input.buddyLevel -
      CATCH_UP_CURVE.startsBelowExpectedByLevels,
  );
  const levelMultiplier = Math.min(
    CATCH_UP_CURVE.maximumXpMultiplier,
    1 + missingLevels * CATCH_UP_CURVE.bonusPerMissingLevel,
  );
  const newcomerMultiplier =
    (input.sessionsSinceCapture ?? CATCH_UP_CURVE.newcomerSessions) <
    CATCH_UP_CURVE.newcomerSessions
      ? CATCH_UP_CURVE.newcomerXpMultiplier
      : 1;
  return Math.min(
    CATCH_UP_CURVE.maximumXpMultiplier,
    levelMultiplier * newcomerMultiplier,
  );
}

export function calculateChallengeEffectiveLevel(
  level: number,
  gymId: string,
) {
  const milestone = getGymProgressionMilestone(gymId);
  if (!milestone) return level;
  const softCeiling =
    milestone.expectedBuddyLevel.max +
    CHALLENGE_LEVEL_CURVE.graceLevelsAboveExpected;
  if (level <= softCeiling) return level;
  return (
    softCeiling +
    (level - softCeiling) * CHALLENGE_LEVEL_CURVE.overlevelContribution
  );
}

export function getMachineMasteryRank(
  masteryXp: number,
): MachineMasteryRank {
  return (
    [...MACHINE_MASTERY_RANKS]
      .reverse()
      .find((rank) => masteryXp >= rank.minimumXp) ??
    MACHINE_MASTERY_RANKS[0]
  );
}

export function getMachineMasteryBenefits(masteryXp = 0) {
  const rank = getMachineMasteryRank(masteryXp);
  return {
    rank,
    readinessBonus: rank.readinessBonus,
    xpMultiplier: rank.xpMultiplier,
  };
}

export function recordMachineMastery(input: {
  current?: MachineMasteryProgress;
  outcome: WorkoutOutcome;
  quality: number;
}): MachineMasteryProgress {
  const current = input.current ?? {
    xp: 0,
    sessions: 0,
    successfulSessions: 0,
    bestQuality: 0,
  };
  const quality = clamp01(input.quality);
  const xpGain =
    input.outcome === 'failure'
      ? MACHINE_MASTERY_CURVE.failedSessionXp
      : input.outcome === 'rescued'
        ? MACHINE_MASTERY_CURVE.rescuedSessionXp
        : Math.round(
            MACHINE_MASTERY_CURVE.successfulSessionBaseXp +
              quality * MACHINE_MASTERY_CURVE.qualityXpScale,
          );
  return {
    xp: current.xp + xpGain,
    sessions: current.sessions + 1,
    successfulSessions:
      current.successfulSessions + (input.outcome === 'success' ? 1 : 0),
    bestQuality: Math.max(current.bestQuality, quality),
  };
}

function buddyStatValue(buddy: Buddy, stat: BuddyBaseStatKey) {
  if (stat === 'form') return buddy.form;
  if (stat === 'mobility') return buddy.mobility;
  if (stat === 'volume') return buddy.volume;
  return buddy.creature[stat];
}

function dynamicStatRatio(buddy: Buddy, stat: BuddyBaseStatKey) {
  if (stat === 'form') return buddyStatValue(buddy, stat) / BUDDY_STAT_LIMITS.form;
  if (stat === 'mobility') {
    return buddyStatValue(buddy, stat) / BUDDY_STAT_LIMITS.mobility;
  }
  if (stat === 'volume') {
    return buddyStatValue(buddy, stat) / BUDDY_STAT_LIMITS.volume;
  }
  return buddyStatValue(buddy, stat) / 20;
}

export function calculateBuddyDisciplineStrengths(
  buddy: Buddy,
): BuddyDisciplineStrengths {
  const entries = Object.entries(
    DISCIPLINE_STRENGTH_CURVE.statWeights,
  ) as Array<
    [
      BuddyDiscipline,
      Partial<Record<BuddyBaseStatKey, number>>,
    ]
  >;
  return Object.fromEntries(
    entries.map(([discipline, weights]) => {
      const statScore = Object.entries(weights).reduce(
        (sum, [stat, weight]) =>
          sum +
          clamp01(dynamicStatRatio(buddy, stat as BuddyBaseStatKey)) *
            (weight ?? 0) *
            50,
        0,
      );
      const identityBonus =
        buddy.creature.primaryDiscipline === discipline
          ? DISCIPLINE_STRENGTH_CURVE.primaryBonus
          : buddy.creature.secondaryDiscipline === discipline
            ? DISCIPLINE_STRENGTH_CURVE.secondaryBonus
            : 0;
      return [
        discipline,
        clamp(
          Math.round(
            buddy.level * DISCIPLINE_STRENGTH_CURVE.levelScale +
              statScore * DISCIPLINE_STRENGTH_CURVE.dynamicStatScale +
              identityBonus,
          ),
          1,
          DISCIPLINE_STRENGTH_CURVE.maximum,
        ),
      ];
    }),
  ) as BuddyDisciplineStrengths;
}

export function getReachedBuddyIndexMilestoneIds(
  seenCount: number,
  caughtCount: number,
) {
  return BUDDY_INDEX_MILESTONES.filter(
    (milestone) =>
      seenCount >= milestone.seenRequired &&
      caughtCount >= milestone.caughtRequired,
  ).map((milestone) => milestone.id);
}

export function calculateProgressionUnlocks(input: {
  visitedGymIds: readonly GymZoneId[];
  completedGymIds: readonly GymZoneId[];
}) {
  const visited = new Set(input.visitedGymIds);
  const highestVisitedOrder = GYM_PROGRESSION_MILESTONES.reduce(
    (highest, milestone) =>
      visited.has(milestone.gymId)
        ? Math.max(highest, milestone.order)
        : highest,
    1,
  );
  const unlockedGymIds = GYM_PROGRESSION_MILESTONES.filter(
    (milestone) => milestone.order <= highestVisitedOrder + 1,
  ).map((milestone) => milestone.gymId);
  const routeIds = WORLD_JOURNEY_CONNECTIONS.filter((connection) =>
    isWorldConnectionAccessible(connection, {
      visitedZoneIds: [...input.visitedGymIds],
      defeatedGymIds: [...input.completedGymIds],
    }),
  ).map((connection) => connection.id);
  return { unlockedGymIds, routeIds };
}

export function calculateBossFailureProtection(input: {
  consecutiveFailures: number;
  trainingFatigue: number;
  buddy: Buddy;
}) {
  if (
    input.consecutiveFailures <
    RECOVERY_PROGRESSION.bossFailureProtectionAfter
  ) {
    return {
      protected: false,
      trainingFatigue: input.trainingFatigue,
      buddy: { ...input.buddy },
    };
  }
  return {
    protected: true,
    trainingFatigue: clamp(
      input.trainingFatigue -
        RECOVERY_PROGRESSION.protectedFatigueRecovery,
      0,
      FATIGUE_BALANCE.maximum,
    ),
    buddy: {
      ...input.buddy,
      hp: Math.max(
        input.buddy.hp,
        Math.ceil(
          input.buddy.maxHp *
            RECOVERY_PROGRESSION.protectedBuddyHpRatio,
        ),
      ),
    },
  };
}

function calculateEndgameRank(rankXp: number) {
  let rank = 1;
  let remaining = rankXp;
  while (rank < ENDGAME_PROGRESSION_CURVE.maximumRank) {
    const needed =
      ENDGAME_PROGRESSION_CURVE.baseRankXp +
      (rank - 1) * ENDGAME_PROGRESSION_CURVE.rankXpGrowth;
    if (remaining < needed) break;
    remaining -= needed;
    rank += 1;
  }
  return { rank, rankXp: remaining };
}

export function calculateEndgameProgress(input: {
  completedGymIds: readonly string[];
  completedBossVariantIds: readonly string[];
  caughtDex: readonly number[];
  masteryByMachineId: Readonly<Record<string, MachineMasteryProgress>>;
}): EndgameProgress {
  const completedGymCount = new Set(input.completedGymIds).size;
  const completedBossVariantCount = new Set(
    input.completedBossVariantIds,
  ).size;
  const indexCaught = new Set(input.caughtDex).size;
  const masteredMachineCount = Object.values(
    input.masteryByMachineId,
  ).filter(
    (progress) => getMachineMasteryRank(progress.xp).id === 'mastered',
  ).length;
  const unlocked =
    completedGymCount >=
    ENDGAME_PROGRESSION_CURVE.requiredGymCompletions;
  const rawRankXp =
    completedBossVariantCount *
      ENDGAME_PROGRESSION_CURVE.bossVariantXp +
    masteredMachineCount *
      ENDGAME_PROGRESSION_CURVE.masteredMachineXp +
    indexCaught * ENDGAME_PROGRESSION_CURVE.caughtSpeciesXp;
  const rank = calculateEndgameRank(rawRankXp);
  const availableActivityIds = ENDGAME_ACTIVITIES.filter((activity) => {
    if (activity.unlock === 'main-journey') return unlocked;
    if (activity.unlock === 'all-bosses') {
      return (
        completedGymCount >=
        ENDGAME_PROGRESSION_CURVE.requiredGymCompletions
      );
    }
    if (activity.unlock === 'index') return indexCaught >= 12;
    return masteredMachineCount >= 4;
  }).map((activity) => activity.id);

  return {
    unlocked,
    rank: rank.rank,
    rankXp: rank.rankXp,
    completedGymCount,
    completedBossVariantCount,
    indexCaught,
    masteredMachineCount,
    availableActivityIds,
  };
}
