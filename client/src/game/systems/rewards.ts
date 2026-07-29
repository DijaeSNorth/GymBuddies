import {
  BUDDY_STAT_LIMITS,
  FATIGUE_BALANCE,
  WORKOUT_BALANCE,
} from '../content/balance';
import type { BossRewardTable, Buddy, TrainerProfile } from '../types';
import { clampBuddyStat } from './buddyProgression';
import { clamp } from './math';
import { nextRandom, type RandomState } from './random';
import { applyTrainerGrowth } from './trainerProgression';
import {
  calculateBuddyMaximumHp,
  calculateCatchUpXpMultiplier,
  getBuddyExperienceNeeded,
} from './progressionModel';
import { BUDDY_LEVEL_CURVE } from '../content/progressionBalance';

export function getExperienceNeeded(level: number) {
  return getBuddyExperienceNeeded(level);
}

/** Input: Buddy and XP reward. Output: a new Buddy plus level-up metadata. */
export function applyExperienceReward(
  buddy: Buddy,
  bonus: number,
  catchUp?: {
    expectedLevel: number;
    sessionsSinceCapture?: number;
  },
) {
  const catchUpMultiplier = catchUp
    ? calculateCatchUpXpMultiplier({
        buddyLevel: buddy.level,
        expectedLevel: catchUp.expectedLevel,
        sessionsSinceCapture:
          catchUp.sessionsSinceCapture ?? buddy.trainingSessions ?? 0,
      })
    : 1;
  const experienceAwarded = Math.max(
    0,
    Math.round(bonus * catchUpMultiplier),
  );
  let experience = buddy.xp + experienceAwarded;
  let level = buddy.level;
  let maximumHp = buddy.maxHp;
  let leveled = false;

  while (
    level < BUDDY_LEVEL_CURVE.maximumLevel &&
    experience >= getExperienceNeeded(level)
  ) {
    experience -= getExperienceNeeded(level);
    level += 1;
    maximumHp = Math.max(
      maximumHp,
      calculateBuddyMaximumHp(buddy.creature.baseHp, level),
    );
    leveled = true;
  }
  if (level >= BUDDY_LEVEL_CURVE.maximumLevel) {
    experience = Math.min(
      experience,
      getExperienceNeeded(BUDDY_LEVEL_CURVE.maximumLevel) - 1,
    );
  }
  const levelUpHeal = leveled
    ? Math.max(
        12,
        Math.round(maximumHp * BUDDY_LEVEL_CURVE.levelUpHeal),
      )
    : 5;

  return {
    leveled,
    experienceAwarded,
    catchUpMultiplier,
    buddy: {
      ...buddy,
      xp: experience,
      trainingSessions: catchUp
        ? (buddy.trainingSessions ?? 0) + 1
        : buddy.trainingSessions,
      level,
      maxHp: maximumHp,
      form: clampBuddyStat(buddy.form, BUDDY_STAT_LIMITS.form),
      mobility: clampBuddyStat(buddy.mobility, BUDDY_STAT_LIMITS.mobility),
      volume: clampBuddyStat(buddy.volume, BUDDY_STAT_LIMITS.volume),
      hp: clamp(buddy.hp + levelUpHeal, 1, maximumHp),
    },
  };
}

/** Input: Buddy, trainer, and inventory. Output: immutable steroid reward results. */
export function applySteroidReward(input: {
  buddy: Buddy;
  trainer: TrainerProfile;
  steroids: number;
}) {
  const experience = applyExperienceReward(input.buddy, 4);
  const growth = {
    form: clampBuddyStat(2, BUDDY_STAT_LIMITS.form, 1),
    mobility: clampBuddyStat(1, BUDDY_STAT_LIMITS.mobility, 1),
    volume: clampBuddyStat(1, BUDDY_STAT_LIMITS.volume, 1),
  };
  return {
    buddy: {
      ...experience.buddy,
      form: clampBuddyStat(
        experience.buddy.form + growth.form,
        BUDDY_STAT_LIMITS.form,
      ),
      mobility: clampBuddyStat(
        experience.buddy.mobility + growth.mobility,
        BUDDY_STAT_LIMITS.mobility,
      ),
      volume: clampBuddyStat(
        experience.buddy.volume + growth.volume,
        BUDDY_STAT_LIMITS.volume,
      ),
    },
    trainer: applyTrainerGrowth(
      input.trainer,
      'Power',
      2,
      experience.leveled ? 1 : 0,
    ),
    steroids: Math.max(0, input.steroids - 1),
    growth,
    leveled: experience.leveled,
  };
}

/**
 * Resolves one boss reward table against serializable journey state.
 * The seeded bonus roll and active-Buddy XP update are both immutable.
 */
export function resolveBossVictoryReward(input: {
  rewardTable: BossRewardTable;
  team: readonly Buddy[];
  activeIndex: number;
  trainingFatigue: number;
  workoutMomentum: number;
  deloadTokens: number;
  randomState: RandomState;
}) {
  const bonusRoll = nextRandom(input.randomState);
  const bonusDeload =
    bonusRoll.value < input.rewardTable.bonusDeloadChance ? 1 : 0;
  const requestedDeload =
    input.rewardTable.deloadTokens + bonusDeload;
  const deloadTokens = clamp(
    input.deloadTokens + requestedDeload,
    0,
    WORKOUT_BALANCE.maximumDeloadTokens,
  );
  const activeBuddy = input.team[input.activeIndex];
  let leveled = false;
  const team = input.team.map((buddy, index) => {
    if (!activeBuddy || index !== input.activeIndex) return { ...buddy };
    const experience = applyExperienceReward(
      buddy,
      input.rewardTable.buddyXp,
    );
    leveled = experience.leveled;
    return experience.buddy;
  });

  return {
    team,
    trainingFatigue: clamp(
      input.trainingFatigue - input.rewardTable.fatigueRecovery,
      0,
      FATIGUE_BALANCE.maximum,
    ),
    workoutMomentum: clamp(
      input.workoutMomentum + input.rewardTable.momentum,
      0,
      WORKOUT_BALANCE.maximumMomentum,
    ),
    deloadTokens,
    reward: {
      id: input.rewardTable.id,
      buddyXp: activeBuddy ? input.rewardTable.buddyXp : 0,
      fatigueRecovered: Math.min(
        input.trainingFatigue,
        input.rewardTable.fatigueRecovery,
      ),
      momentumGained: Math.min(
        WORKOUT_BALANCE.maximumMomentum - input.workoutMomentum,
        input.rewardTable.momentum,
      ),
      deloadTokensGained: Math.max(0, deloadTokens - input.deloadTokens),
      bonusDeload,
      leveled,
    },
    randomState: bonusRoll.randomState,
  };
}
