import type {
  BossChallengeDifficultyProfile,
  BossChallengeTier,
  CaptureMoveId,
  GymKind,
} from '../types';

export const BUDDY_STAT_LIMITS = {
  form: 24,
  mobility: 24,
  volume: 12,
} as const;

export const FATIGUE_BALANCE = {
  maximum: 120,
  passiveRecoveryPerTick: 2,
  homePassiveRecoveryBonus: 1,
  restRecovery: 26,
  restBuddyHeal: 9,
  restCooldownMs: 12_500,
  passiveRecoveryTickMs: 5_000,
} as const;

export const WORKOUT_BALANCE = {
  durationMs: 2_100,
  spotWindowMs: 1_200,
  spotSaveMs: 850,
  resolvedDisplayMs: 2_400,
  baseFailureChance: 0.5,
  baseSpotSuccessChance: 0.5,
  maximumDeloadTokens: 4,
  deloadRecoveryDivisor: 28,
  deloadLoadReduction: 0.18,
  deloadReadinessBonus: 0.035,
  maximumMomentum: 30,
  passiveMomentumRecovery: 1,
  restStatRecoveryDivisor: 12,
  restDeloadStatBonus: 1,
} as const;

export const BOSS_ZONE_CATCH_SCALE: Record<GymKind, number> = {
  home: 0.96,
  starter: 1.02,
  higher: 0.73,
};

export const BOSS_CAPTURE_WEIGHTS: Record<
  GymKind,
  {
    trainerWeight: number;
    buddyWeight: number;
    bossPenaltyScale: number;
    maxCatch: number;
    minCatch: number;
  }
> = {
  home: { trainerWeight: 1.2, buddyWeight: 1.03, bossPenaltyScale: 0.34, maxCatch: 0.96, minCatch: 0.1 },
  starter: { trainerWeight: 1.16, buddyWeight: 1, bossPenaltyScale: 0.46, maxCatch: 0.88, minCatch: 0.08 },
  higher: { trainerWeight: 1.11, buddyWeight: 0.98, bossPenaltyScale: 0.58, maxCatch: 0.78, minCatch: 0.06 },
};

export const BOSS_CAPTURE_ALIGNMENT: Record<
  GymKind,
  {
    alignedShift: number;
    misalignedShift: number;
    unknownShift: number;
    consistencyScale: number;
    missShift: number;
    nearShift: number;
    streakShift: number;
    zoneShift: number;
  }
> = {
  home: {
    alignedShift: -6,
    misalignedShift: 5,
    unknownShift: 3,
    consistencyScale: 7,
    missShift: 1.3,
    nearShift: 1.6,
    streakShift: 2.2,
    zoneShift: 0,
  },
  starter: {
    alignedShift: -5,
    misalignedShift: 7,
    unknownShift: 4,
    consistencyScale: 6.3,
    missShift: 1.7,
    nearShift: 2,
    streakShift: 2.5,
    zoneShift: 2,
  },
  higher: {
    alignedShift: -4,
    misalignedShift: 10,
    unknownShift: 5,
    consistencyScale: 8.2,
    missShift: 2.2,
    nearShift: 2.3,
    streakShift: 3.1,
    zoneShift: 3,
  },
};

export const BOSS_CHALLENGE_PRESSURE: Record<GymKind, BossChallengeDifficultyProfile> = {
  home: {
    matchMachineBonus: 4,
    focusMatchBonus: 1,
    focusMismatchPenalty: -2,
    maxRounds: 4,
    streakLimit: 2,
    missResetGrace: 2,
    overloadMissLimit: 4,
  },
  starter: {
    matchMachineBonus: 6,
    focusMatchBonus: 3,
    focusMismatchPenalty: -7,
    maxRounds: 5,
    streakLimit: 3,
    missResetGrace: 1,
    overloadMissLimit: 4,
  },
  higher: {
    matchMachineBonus: 9,
    focusMatchBonus: 5,
    focusMismatchPenalty: -9,
    maxRounds: 6,
    streakLimit: 4,
    missResetGrace: 1,
    overloadMissLimit: 5,
  },
};

export const BOSS_CHALLENGE_TIER: Record<BossChallengeTier, BossChallengeDifficultyProfile> = {
  low: {
    matchMachineBonus: 3,
    focusMatchBonus: 1,
    focusMismatchPenalty: -2,
    maxRounds: 4,
    streakLimit: 2,
    missResetGrace: 2,
    overloadMissLimit: 4,
  },
  normal: {
    matchMachineBonus: 5,
    focusMatchBonus: 2,
    focusMismatchPenalty: -6,
    maxRounds: 5,
    streakLimit: 3,
    missResetGrace: 1,
    overloadMissLimit: 4,
  },
  high: {
    matchMachineBonus: 8,
    focusMatchBonus: 4,
    focusMismatchPenalty: -10,
    maxRounds: 6,
    streakLimit: 4,
    missResetGrace: 1,
    overloadMissLimit: 5,
  },
};

export const BOSS_CAPTURE_TARGET: Record<GymKind, number> = {
  home: 70,
  starter: 74,
  higher: 78,
};

export const BOSS_CAPTURE_TARGET_FLOOR = 64;
export const BOSS_CAPTURE_TARGET_CEILING = 92;

export const BOSS_CHALLENGE_MOVE_MODIFIERS: Record<
  CaptureMoveId,
  { alignmentBonus: number; mismatchPenalty: number; staminaDrain: number }
> = {
  burst: { alignmentBonus: 1, mismatchPenalty: 2, staminaDrain: 2 },
  grind: { alignmentBonus: 3, mismatchPenalty: -1, staminaDrain: 1 },
  snap: { alignmentBonus: 0, mismatchPenalty: 3, staminaDrain: 2 },
};

export const BOSS_CHALLENGE_PENALTY_BASE: Record<GymKind, number> = {
  home: 6,
  starter: 8,
  higher: 10,
};

export const BOSS_CHALLENGE_PENALTY_SCALE: Record<GymKind, number> = {
  home: 0.82,
  starter: 0.94,
  higher: 1.16,
};

export const BOSS_MATCH_FATIGUE_SCALE: Record<GymKind, number> = {
  home: 0.75,
  starter: 1,
  higher: 1.25,
};

export const BOSS_POWER_BONUS_SCALE: Record<GymKind, number> = {
  home: 0.55,
  starter: 0.72,
  higher: 1.08,
};

export const BOSS_METER_CATCH_SCALE: Record<GymKind, number> = {
  home: 188,
  starter: 174,
  higher: 206,
};

export const BOSS_CAPTURE_READINESS_SCALE: Record<GymKind, number> = {
  home: 28,
  starter: 26,
  higher: 24,
};
