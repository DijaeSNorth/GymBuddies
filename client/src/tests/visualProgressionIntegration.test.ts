import { describe, expect, it } from 'vitest';

import { GYMS } from '../game/content/gyms';
import { createDefaultSaveData } from '../game/save/saveDefaults';
import { createRandomState } from '../game/systems/random';
import { applyWorkoutVisualProgression } from '../game/systems/visualProgression';
import {
  calculateWorkoutResolution,
  createWorkoutSession,
  resolveWorkoutRep,
} from '../game/systems/workoutResolution';
import type { WorkoutSession } from '../game/types';

describe('workout to visible development integration', () => {
  it('turns a deterministic completed machine set into gameplay growth plus independent visual history', () => {
    const save = createDefaultSaveData();
    const gym = GYMS.find((entry) => entry.id === 'starter-a')!;
    const machine = gym.machines.find(
      (entry) => entry.id === 'starter_a_bench',
    )!;
    const buddy = save.team[0]!;
    const created = createWorkoutSession({
      buddy,
      machine,
      trainer: save.trainer,
      gymKind: gym.type,
      trainingFatigue: 0,
      workoutMomentum: 10,
      deloadTokens: 0,
      selectedLoad: 'steady',
      startedAt: 1_000,
      randomState: createRandomState(2026),
    });
    let session: WorkoutSession = created.session;
    while (!session.resolved) {
      session = resolveWorkoutRep(
        session,
        session.repStartedAt +
          session.repDurationMs * session.timingTarget,
      );
    }
    const outcome = session.outcome ?? 'failure';
    const resolution = calculateWorkoutResolution({
      session,
      outcome,
      buddy,
      machine,
      trainer: save.trainer,
      steroids: save.steroids,
      workoutMomentum: save.workoutMomentum,
      trainingFatigue: save.trainingFatigue,
    });
    const visualProgression = applyWorkoutVisualProgression({
      state: save.visualProgression,
      machineId: machine.id,
      gameplayTimeMs: 25_000,
      loadTier: session.loadTier,
      outcome,
      quality: session.sessionQuality,
      volume: session.repResults.length,
    });

    expect(resolution.trainer.muscles.chest).toBeGreaterThanOrEqual(
      save.trainer.muscles.chest,
    );
    expect(visualProgression.development.chest).toBeGreaterThan(0);
    expect(visualProgression.development.triceps).toBeGreaterThan(0);
    expect(visualProgression.recentTraining[0]?.machineId).toBe(machine.id);
    expect(save.visualProgression.recentTraining).toEqual([]);
    expect(save.trainer.appearance).toEqual(
      visualProgression.baselineAppearance,
    );
  });
});
