import type { WorkoutLoadDefinition, WorkoutLoadTier } from '../types';

export const WORKOUT_LOAD_DEFINITIONS: WorkoutLoadDefinition[] = [
  {
    id: 'easy',
    label: 'Easy',
    description: 'Wide timing window, low stress, steady technique practice.',
    minimumPressure: 0,
    intensity: 0.28,
    repCount: 3,
    repDurationMs: 2_400,
    timingTarget: 0.62,
    perfectWindow: 0.075,
    goodWindow: 0.18,
    failureModifier: -0.16,
    fatigueMultiplier: 0.65,
    hpMultiplier: 0.5,
    xpMultiplier: 0.78,
    momentumMultiplier: 1,
    deloadTokens: 0,
  },
  {
    id: 'steady',
    label: 'Steady',
    description: 'Balanced timing and the best momentum for consistent form.',
    minimumPressure: 0.47,
    intensity: 0.48,
    repCount: 3,
    repDurationMs: 2_100,
    timingTarget: 0.62,
    perfectWindow: 0.06,
    goodWindow: 0.14,
    failureModifier: -0.04,
    fatigueMultiplier: 1,
    hpMultiplier: 0.75,
    xpMultiplier: 1,
    momentumMultiplier: 1.25,
    deloadTokens: 0,
  },
  {
    id: 'hard',
    label: 'Hard',
    description: 'Tighter timing and higher growth, softened by one deload token.',
    minimumPressure: 0.64,
    intensity: 0.7,
    repCount: 4,
    repDurationMs: 1_850,
    timingTarget: 0.62,
    perfectWindow: 0.048,
    goodWindow: 0.11,
    failureModifier: 0.12,
    fatigueMultiplier: 1.35,
    hpMultiplier: 1,
    xpMultiplier: 1.18,
    momentumMultiplier: 1.05,
    deloadTokens: 1,
  },
  {
    id: 'max',
    label: 'Max',
    description: 'Very tight timing and high stress; precision matters more than load.',
    minimumPressure: 0.8,
    intensity: 0.92,
    repCount: 4,
    repDurationMs: 1_600,
    timingTarget: 0.62,
    perfectWindow: 0.038,
    goodWindow: 0.085,
    failureModifier: 0.28,
    fatigueMultiplier: 1.75,
    hpMultiplier: 1.35,
    xpMultiplier: 1.3,
    momentumMultiplier: 0.55,
    deloadTokens: 2,
  },
];

export const WORKOUT_LOAD_ORDER: WorkoutLoadTier[] = [
  'easy',
  'steady',
  'hard',
  'max',
];

export const WORKOUT_LOAD_BY_ID = Object.fromEntries(
  WORKOUT_LOAD_DEFINITIONS.map((definition) => [definition.id, definition]),
) as Record<WorkoutLoadTier, WorkoutLoadDefinition>;

export const WORKOUT_DELOAD_BY_TIER = Object.fromEntries(
  WORKOUT_LOAD_DEFINITIONS.map((definition) => [definition.id, definition.deloadTokens]),
) as Record<WorkoutLoadTier, number>;

export function getWorkoutLoadTier(pressure: number): WorkoutLoadTier {
  return [...WORKOUT_LOAD_DEFINITIONS]
    .reverse()
    .find((definition) => pressure >= definition.minimumPressure)?.id ?? 'easy';
}
