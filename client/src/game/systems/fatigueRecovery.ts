import { BUDDY_STAT_LIMITS, FATIGUE_BALANCE, WORKOUT_BALANCE } from '../content/balance';
import type { Buddy } from '../types';
import {
  calculateBuddyWorkoutProfile,
  clampBuddyStat,
} from './buddyProgression';
import { clamp, clamp01 } from './math';

export type FatigueMomentumState = {
  trainingFatigue: number;
  workoutMomentum: number;
};

export function getFatigueRatio(trainingFatigue: number) {
  return clamp01(trainingFatigue / FATIGUE_BALANCE.maximum);
}

/** Input: fatigue and signed delta. Output: bounded fatigue. */
export function applyFatigueChange(trainingFatigue: number, delta: number) {
  return clamp(trainingFatigue + delta, 0, FATIGUE_BALANCE.maximum);
}

/** Input: fatigue/momentum state and location. Output: passively recovered state. */
export function applyPassiveRecovery(
  state: FatigueMomentumState,
  isHomeGym: boolean,
): FatigueMomentumState {
  const recovery =
    FATIGUE_BALANCE.passiveRecoveryPerTick +
    (isHomeGym ? FATIGUE_BALANCE.homePassiveRecoveryBonus : 0);
  return {
    trainingFatigue: applyFatigueChange(state.trainingFatigue, -recovery),
    workoutMomentum: clamp(
      state.workoutMomentum - WORKOUT_BALANCE.passiveMomentumRecovery,
      0,
      WORKOUT_BALANCE.maximumMomentum,
    ),
  };
}

/** Input: active Buddy and recovery state. Output: immutable recovered values and deltas. */
export function calculateRestRecovery(input: {
  buddy: Buddy;
  trainingFatigue: number;
  deloadTokens: number;
}) {
  const buddyProfile = calculateBuddyWorkoutProfile(input.buddy);
  const fatigueRatio = getFatigueRatio(input.trainingFatigue);
  const recoveryEfficiency = clamp(
    1 + buddyProfile.fatigueRecoveryBonus / 40,
    0.72,
    1.44,
  );
  const bonusRecovery = Math.round(
    FATIGUE_BALANCE.restRecovery * (1 - fatigueRatio) * recoveryEfficiency,
  );
  const actualRecovery = Math.max(2, bonusRecovery);
  const nextTrainingFatigue = applyFatigueChange(
    input.trainingFatigue,
    -(FATIGUE_BALANCE.restRecovery + actualRecovery),
  );
  const fatigueRecovered =
    Math.min(FATIGUE_BALANCE.maximum, input.trainingFatigue) -
    Math.max(
      0,
      input.trainingFatigue -
        (FATIGUE_BALANCE.restRecovery + actualRecovery),
    );
  const deloadGainRaw = Math.floor(
    fatigueRecovered / WORKOUT_BALANCE.deloadRecoveryDivisor,
  );
  const baseStatRecovery = clamp(
    Math.round(
      (FATIGUE_BALANCE.restRecovery + actualRecovery) /
        WORKOUT_BALANCE.restStatRecoveryDivisor,
    ),
    1,
    3,
  );
  const deloadStatRecovery = clamp(
    Math.round(deloadGainRaw * WORKOUT_BALANCE.restDeloadStatBonus),
    0,
    2,
  );
  const statRecovery = clamp(baseStatRecovery + deloadStatRecovery, 1, 4);
  const targetHeal =
    FATIGUE_BALANCE.restBuddyHeal * (1 + buddyProfile.bossSteady);
  const actualHeal = Math.min(
    Math.round(targetHeal),
    input.buddy.maxHp - input.buddy.hp + input.buddy.hp * 0.04,
  );
  const deloadGain = clamp(
    Math.min(
      deloadGainRaw,
      WORKOUT_BALANCE.maximumDeloadTokens - input.deloadTokens,
    ),
    0,
    WORKOUT_BALANCE.maximumDeloadTokens,
  );
  const buddy: Buddy = {
    ...input.buddy,
    hp: clamp(input.buddy.hp + actualHeal, 1, input.buddy.maxHp),
    form: clampBuddyStat(
      input.buddy.form + statRecovery,
      BUDDY_STAT_LIMITS.form,
    ),
    mobility: clampBuddyStat(
      input.buddy.mobility + statRecovery,
      BUDDY_STAT_LIMITS.mobility,
    ),
    volume: clampBuddyStat(
      input.buddy.volume + Math.max(1, statRecovery - 1),
      BUDDY_STAT_LIMITS.volume,
    ),
  };

  return {
    buddy,
    trainingFatigue: nextTrainingFatigue,
    deloadTokens: clamp(
      input.deloadTokens + deloadGain,
      0,
      WORKOUT_BALANCE.maximumDeloadTokens,
    ),
    actualRecovery,
    actualHeal,
    statRecovery,
    deloadGain,
  };
}
