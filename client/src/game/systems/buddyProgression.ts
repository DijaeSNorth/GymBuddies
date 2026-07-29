import { BUDDY_STAT_LIMITS } from '../content/balance';
import type { Buddy, BuddySpecies, GymKind, GymMachine } from '../types';
import { randomizeBuddyCosmetics } from './buddyCosmetics';
import { clamp, clamp01 } from './math';
import { calculateBuddyMaximumHp } from './progressionModel';
import { randomChoice, type RandomState } from './random';

export type BuddyWorkoutProfile = {
  formRatio: number;
  mobilityRatio: number;
  volumeRatio: number;
  movementConsistency: number;
  failureSafety: number;
  readinessSupport: number;
  fatigueRecoveryBonus: number;
  hpLossResistance: number;
  bossSteady: number;
};

export type BuddyWorkoutGrowth = {
  form: number;
  mobility: number;
  volume: number;
};

export function clampBuddyStat(value: number, maximum: number, minimum = 0) {
  return clamp(Math.round(value), minimum, maximum);
}

/** Input: one Buddy. Output: normalized readiness and resistance statistics. */
export function calculateBuddyWorkoutProfile(buddy: Buddy): BuddyWorkoutProfile {
  const formRatio = clamp01(buddy.form / BUDDY_STAT_LIMITS.form);
  const mobilityRatio = clamp01(buddy.mobility / BUDDY_STAT_LIMITS.mobility);
  const volumeRatio = clamp01(buddy.volume / BUDDY_STAT_LIMITS.volume);
  const movementConsistency = clamp01(
    formRatio * 0.45 + mobilityRatio * 0.4 + volumeRatio * 0.15,
  );

  return {
    formRatio,
    mobilityRatio,
    volumeRatio,
    movementConsistency,
    failureSafety: clamp((movementConsistency - 0.45) * 0.34, -0.14, 0.16),
    readinessSupport: clamp((movementConsistency - 0.4) * 0.08, -0.03, 0.08),
    fatigueRecoveryBonus: clamp((movementConsistency - 0.45) * 11, -5, 10),
    hpLossResistance: clamp((movementConsistency - 0.45) * 0.28, -0.22, 0.3),
    bossSteady: clamp((mobilityRatio - 0.45) * 0.12, -0.06, 0.06),
  };
}

/** Input: workout context. Output: raw Buddy form, mobility, and volume deltas. */
export function calculateBuddyWorkoutGrowth(
  machine: GymMachine,
  readiness: number,
  gymKind: GymKind,
  succeeded: boolean,
): BuddyWorkoutGrowth {
  const focus = machine.focus.toLowerCase();
  const zoneScale = gymKind === 'higher' ? 1.15 : gymKind === 'starter' ? 1.05 : 0.95;
  const formBias = focus.includes('precision')
    ? 1.25
    : focus.includes('control')
      ? 0.85
      : 0.38;
  const mobilityBias =
    focus.includes('mobility') || focus.includes('stability') ? 1.1 : 0.4;
  const volumeBias = gymKind === 'higher' ? 0.95 : gymKind === 'starter' ? 0.7 : 0.55;
  const form = (succeeded ? 4.1 : -2.1) + readiness * 4.8 + formBias;
  const mobility = (succeeded ? 3.4 : -1.8) + readiness * 3.8 + mobilityBias;
  const volume = succeeded ? volumeBias * 2.6 : -0.8;
  const fatigueSafety = succeeded ? 0.7 : -0.6;
  const multiplier = zoneScale * (succeeded ? 0.8 : 0.6);

  return {
    form: clampBuddyStat(form * multiplier, BUDDY_STAT_LIMITS.form, succeeded ? 0 : -6),
    mobility: clampBuddyStat(
      mobility * multiplier + fatigueSafety,
      BUDDY_STAT_LIMITS.mobility,
      succeeded ? 0 : -5,
    ),
    volume: clampBuddyStat(
      volume * multiplier,
      BUDDY_STAT_LIMITS.volume,
      succeeded ? 0 : -4,
    ),
  };
}

export function getBuddyStatBand(value: number, maximum: number) {
  if (value <= 0) return 'Raw';
  if (value >= maximum * 0.82) return 'Explosive';
  if (value >= maximum * 0.64) return 'Strong';
  if (value >= maximum * 0.46) return 'Ready';
  if (value >= maximum * 0.28) return 'Steady';
  return 'Raw';
}

/** Input: seed definition, species, names, and RNG state. Output: a new Buddy and next RNG state. */
export function createSeedBuddy(input: {
  seed: number;
  species: BuddySpecies;
  level?: number;
  names: readonly string[];
  randomState: RandomState;
}) {
  const level = input.level ?? 4;
  const name = randomChoice(input.randomState, input.names);
  const cosmetics = randomizeBuddyCosmetics(input.species, name.randomState);
  const maximumHp = calculateBuddyMaximumHp(input.species.baseHp, level);
  return {
    buddy: {
      id: `seed-${input.seed}`,
      nickname: `${name.value} #${input.seed}`,
      creature: input.species,
      cosmetics: cosmetics.cosmetics,
      level,
      hp: maximumHp,
      maxHp: maximumHp,
      xp: 0,
      trainingSessions: 0,
      form: clampBuddyStat(8 + Math.min(8, level), BUDDY_STAT_LIMITS.form),
      mobility: clampBuddyStat(9 + Math.min(6, level), BUDDY_STAT_LIMITS.mobility),
      volume: clampBuddyStat(
        1 + Math.max(1, Math.floor(level / 2)),
        BUDDY_STAT_LIMITS.volume,
      ),
    } satisfies Buddy,
    randomState: cosmetics.randomState,
  };
}

/** Input: a captured encounter identity and RNG state. Output: a new Buddy and next RNG state. */
export function createCapturedBuddy(input: {
  species: BuddySpecies;
  level: number;
  capturedAtMs: number;
  names: readonly string[];
  randomState: RandomState;
}) {
  const name = randomChoice(input.randomState, input.names);
  const cosmetics = randomizeBuddyCosmetics(input.species, name.randomState);
  const maximumHp = calculateBuddyMaximumHp(
    input.species.baseHp,
    input.level,
  );
  return {
    buddy: {
      id: `${input.species.dex}-${input.capturedAtMs}`,
      nickname: `${name.value} #${input.species.dex}`,
      creature: input.species,
      cosmetics: cosmetics.cosmetics,
      level: input.level,
      hp: Math.max(1, Math.round(maximumHp * 0.78)),
      maxHp: maximumHp,
      xp: 0,
      trainingSessions: 0,
      form: clampBuddyStat(
        11 + Math.round(input.level * 0.45),
        BUDDY_STAT_LIMITS.form,
        1,
      ),
      mobility: clampBuddyStat(
        12 + Math.round(input.level * 0.4),
        BUDDY_STAT_LIMITS.mobility,
        1,
      ),
      volume: clampBuddyStat(
        4 + Math.round(input.level * 0.08),
        BUDDY_STAT_LIMITS.volume,
        1,
      ),
    } satisfies Buddy,
    randomState: cosmetics.randomState,
  };
}
