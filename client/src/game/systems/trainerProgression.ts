import { FOCUSED_MUSCLES, MAX_MUSCLE_LEVEL } from '../content/trainer';
import { TRAINER_PHYSIQUE_CURVE } from '../content/progressionBalance';
import type { GymKind, GymMachine, TrainerProfile } from '../types';
import { clamp } from './math';

/** Input: machine focus and trainer muscles. Output: normalized focus proficiency from 0 to 1. */
export function calculateMachineFocusScore(
  machine: GymMachine,
  trainer: TrainerProfile,
) {
  const focusBoosts = FOCUSED_MUSCLES[machine.focus.toLowerCase()] ?? [];
  const totalWeight = focusBoosts.reduce((sum, focus) => sum + focus.weight, 0);
  if (!focusBoosts.length || !totalWeight) {
    return 0.1;
  }

  const focusScore =
    focusBoosts.reduce((sum, focus) => {
      const value = trainer.muscles[focus.muscle] / MAX_MUSCLE_LEVEL;
      return sum + value * focus.weight;
    }, 0) / totalWeight;

  return clamp(focusScore, 0, 1);
}

/** Input: machine, trainer, and gym tier. Output: failure reduction and spot bonus. */
export function calculateTrainerWorkoutAdvantage(
  machine: GymMachine,
  trainer: TrainerProfile,
  gymKind: GymKind,
) {
  const focusScore = calculateMachineFocusScore(machine, trainer);
  const focusVariance = 1 - focusScore;
  const overallBody =
    Object.values(trainer.muscles).reduce(
      (total, value) => total + value / MAX_MUSCLE_LEVEL,
      0,
    ) / 8;
  const tierScale = gymKind === 'higher' ? 1.22 : gymKind === 'starter' ? 1.05 : 0.95;
  const failReduction =
    clamp(
      (focusScore * 0.2 + overallBody * 0.12) * (1 + focusVariance * 0.08),
      0,
      0.3,
    ) * tierScale;
  const spotBonus =
    clamp(focusScore * 0.22 + overallBody * 0.12, 0.02, 0.3) *
    (gymKind === 'home' ? 0.9 : 1);

  return {
    failReduction: clamp(failReduction * 0.9, 0, 0.35),
    spotBaseBonus: clamp(spotBonus * tierScale, 0, 0.35),
  };
}

/** Input: muscle values. Output: a new profile clamped to the configured range. */
export function clampTrainerMuscles(
  muscles: TrainerProfile['muscles'],
): TrainerProfile['muscles'] {
  const next = { ...muscles };
  (Object.keys(next) as Array<keyof TrainerProfile['muscles']>).forEach((key) => {
    next[key] = clamp(next[key], 0, MAX_MUSCLE_LEVEL);
  });
  return next;
}

export function getTrainerFocusGrowth(focus: string) {
  const key = focus.toLowerCase();
  const fallbackKey =
    Object.keys(FOCUSED_MUSCLES).find((entry) => key.includes(entry)) ?? 'control';
  return FOCUSED_MUSCLES[key] ?? FOCUSED_MUSCLES[fallbackKey] ?? [];
}

/** Input: trainer, workout focus, intensity, and bonus. Output: a new grown trainer. */
export function applyTrainerGrowth(
  trainer: TrainerProfile,
  focus: string,
  intensity: number,
  bonus: number,
): TrainerProfile {
  const gains = getTrainerFocusGrowth(focus);
  const gainTotal = Math.max(1, intensity + bonus);
  const totalWeight = gains.reduce((total, item) => total + item.weight, 0);
  const muscles = { ...trainer.muscles };
  let distributed = 0;

  gains.forEach((entry) => {
    const raw = Math.floor((gainTotal * entry.weight) / totalWeight);
    const amount = Math.max(0, Math.min(3, raw));
    muscles[entry.muscle] += amount;
    distributed += amount;
  });

  const remainder = gainTotal - distributed;
  const leader = gains[0];
  if (remainder > 0 && leader) {
    muscles[leader.muscle] += Math.max(1, remainder);
  }

  return {
    ...trainer,
    muscles: clampTrainerMuscles(muscles),
  };
}

/** Input: trainer muscles. Output: the existing 1–40 physique level. */
export function calculateTrainerPhysiqueLevel(
  muscles: TrainerProfile['muscles'],
) {
  const total = Object.values(muscles).reduce((sum, value) => sum + value, 0);
  const maximum = Object.keys(muscles).length * MAX_MUSCLE_LEVEL;
  const normalized = total / maximum;
  return clamp(
    Math.floor(
      Math.pow(normalized, TRAINER_PHYSIQUE_CURVE.curveExponent) *
        TRAINER_PHYSIQUE_CURVE.maximumLevel,
    ),
    TRAINER_PHYSIQUE_CURVE.minimumLevel,
    TRAINER_PHYSIQUE_CURVE.maximumLevel,
  );
}
