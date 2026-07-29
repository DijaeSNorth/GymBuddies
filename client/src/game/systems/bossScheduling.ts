import {
  BOSS_LEGACY_MIGRATION_GRACE_MS,
  BOSS_MAX_MS,
} from '../content/bosses';
import type { BossSchedule } from '../types';
import { clamp } from './math';

export type BossAvailability =
  | {
      status: 'ready';
      remainingMs: 0;
    }
  | {
      status: 'cooldown';
      remainingMs: number;
    };

type StoredBossSchedule = Partial<BossSchedule> & {
  nextBossAt?: number;
};

export function normalizeBossGameplayTime(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : 0;
}

export function createBossSchedule(
  readyAtGameplayMs: number,
  defeated = 0,
): BossSchedule {
  return {
    readyAtGameplayMs: Math.max(0, Math.round(readyAtGameplayMs)),
    defeated: Math.max(0, Math.round(defeated)),
    cycle: 0,
    lastRewardedCycle: 0,
  };
}

/**
 * Restores only gameplay-time values. Legacy wall-clock timestamps receive a
 * short, fixed gameplay-time grace period and never influence future cycles.
 */
export function restoreBossSchedule(
  stored: StoredBossSchedule | null | undefined,
  gameplayTimeMs: number,
  fallbackDelayMs: number,
): BossSchedule {
  const clock = normalizeBossGameplayTime(gameplayTimeMs);
  const defeated = Math.max(0, Math.round(stored?.defeated ?? 0));
  const cycle = Math.max(0, Math.round(stored?.cycle ?? defeated));
  const lastRewardedCycle = clamp(
    Math.max(0, Math.round(stored?.lastRewardedCycle ?? defeated)),
    0,
    cycle,
  );
  const hasGameplayTimer =
    typeof stored?.readyAtGameplayMs === 'number' &&
    Number.isFinite(stored.readyAtGameplayMs);
  const legacyTimer =
    !hasGameplayTimer &&
    typeof stored?.nextBossAt === 'number' &&
    Number.isFinite(stored.nextBossAt);
  const delay = legacyTimer
    ? BOSS_LEGACY_MIGRATION_GRACE_MS
    : clamp(Math.round(fallbackDelayMs), 0, BOSS_MAX_MS);
  const readyAtGameplayMs = hasGameplayTimer
    ? clamp(
        Math.round(stored.readyAtGameplayMs!),
        0,
        clock + BOSS_MAX_MS,
      )
    : clock + delay;

  return {
    readyAtGameplayMs,
    defeated,
    cycle,
    lastRewardedCycle,
    ...(stored?.lastBossId ? { lastBossId: stored.lastBossId } : {}),
  };
}

export function advanceBossGameplayTime(
  currentGameplayTimeMs: number,
  elapsedMs: number,
  isGameplayActive: boolean,
) {
  const current = normalizeBossGameplayTime(currentGameplayTimeMs);
  if (!isGameplayActive) return current;
  return current + clamp(Math.round(elapsedMs), 0, 1_500);
}

export function getBossAvailability(
  schedule: BossSchedule | null | undefined,
  gameplayTimeMs: number,
): BossAvailability {
  if (!schedule) {
    return { status: 'cooldown', remainingMs: BOSS_LEGACY_MIGRATION_GRACE_MS };
  }
  const remainingMs = Math.max(
    0,
    schedule.readyAtGameplayMs - normalizeBossGameplayTime(gameplayTimeMs),
  );
  return remainingMs <= 0
    ? { status: 'ready', remainingMs: 0 }
    : { status: 'cooldown', remainingMs };
}

export function claimBossSchedule(input: {
  schedule: BossSchedule;
  gameplayTimeMs: number;
  nextIntervalMs: number;
  bossId: string;
}) {
  if (
    getBossAvailability(input.schedule, input.gameplayTimeMs).status !== 'ready'
  ) {
    return {
      claimed: false as const,
      cycle: input.schedule.cycle,
      schedule: { ...input.schedule },
    };
  }
  const cycle = input.schedule.cycle + 1;
  return {
    claimed: true as const,
    cycle,
    schedule: {
      ...input.schedule,
      readyAtGameplayMs:
        normalizeBossGameplayTime(input.gameplayTimeMs) +
        clamp(Math.round(input.nextIntervalMs), 0, BOSS_MAX_MS),
      cycle,
      lastBossId: input.bossId,
    },
  };
}

export function markBossCycleRewarded(
  schedule: BossSchedule,
  cycle: number,
): {
  awarded: boolean;
  schedule: BossSchedule;
} {
  const normalizedCycle = Math.max(0, Math.round(cycle));
  if (
    normalizedCycle <= schedule.lastRewardedCycle ||
    normalizedCycle !== schedule.cycle
  ) {
    return { awarded: false, schedule: { ...schedule } };
  }
  return {
    awarded: true,
    schedule: {
      ...schedule,
      defeated: schedule.defeated + 1,
      lastRewardedCycle: normalizedCycle,
    },
  };
}
