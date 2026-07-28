import type { WorkoutLoadDefinition, WorkoutLoadTier } from '../types';

export const WORKOUT_LOAD_DEFINITIONS: WorkoutLoadDefinition[] = [
  { id: 'max', minimumPressure: 0.8, deloadTokens: 2 },
  { id: 'hard', minimumPressure: 0.64, deloadTokens: 1 },
  { id: 'steady', minimumPressure: 0.47, deloadTokens: 1 },
  { id: 'easy', minimumPressure: 0, deloadTokens: 0 },
];

export const WORKOUT_DELOAD_BY_TIER = Object.fromEntries(
  WORKOUT_LOAD_DEFINITIONS.map((definition) => [definition.id, definition.deloadTokens]),
) as Record<WorkoutLoadTier, number>;

export function getWorkoutLoadTier(pressure: number): WorkoutLoadTier {
  return WORKOUT_LOAD_DEFINITIONS.find((definition) => pressure >= definition.minimumPressure)?.id ?? 'easy';
}
