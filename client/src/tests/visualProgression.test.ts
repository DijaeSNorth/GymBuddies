import { describe, expect, it } from 'vitest';

import {
  MACHINE_VISUAL_DEVELOPMENT_PATTERNS,
  PUMP_DECAY_MS,
} from '../game/content/visualProgression';
import { createDefaultSaveData } from '../game/save/saveDefaults';
import {
  applyDeepRecoveryToVisualProgression,
  applyWorkoutVisualProgression,
  calculatePhysiqueRatings,
  createPhysiqueSnapshot,
  decayTrainerPump,
  deriveTrainerVisualPresentation,
  getCurrentPump,
} from '../game/systems/visualProgression';

describe('visible bodybuilding progression', () => {
  it('maps every machine to a stable visual training specialization', () => {
    expect(Object.keys(MACHINE_VISUAL_DEVELOPMENT_PATTERNS)).toHaveLength(24);
    expect(MACHINE_VISUAL_DEVELOPMENT_PATTERNS.starter_a_bench).toBe(
      'press',
    );
    expect(MACHINE_VISUAL_DEVELOPMENT_PATTERNS.starter_a_rows).toBe(
      'pull',
    );
    expect(MACHINE_VISUAL_DEVELOPMENT_PATTERNS.starter_b_leg).toBe(
      'squat',
    );
    expect(MACHINE_VISUAL_DEVELOPMENT_PATTERNS.glory_deadlift).toBe(
      'hinge',
    );
    expect(MACHINE_VISUAL_DEVELOPMENT_PATTERNS.glory_mill).toBe(
      'calf',
    );
    expect(MACHINE_VISUAL_DEVELOPMENT_PATTERNS.glory_torso).toBe(
      'core',
    );
  });

  it('builds chest, shoulders, triceps, and pump after a successful press without mutating input', () => {
    const save = createDefaultSaveData();
    const before = structuredClone(save.visualProgression);
    const next = applyWorkoutVisualProgression({
      state: save.visualProgression,
      machineId: 'starter_a_bench',
      gameplayTimeMs: 20_000,
      loadTier: 'hard',
      outcome: 'success',
      quality: 0.92,
      volume: 5,
    });

    expect(next).not.toBe(save.visualProgression);
    expect(save.visualProgression).toEqual(before);
    expect(next.development.chest).toBeGreaterThan(0);
    expect(next.development.shoulders).toBeGreaterThan(0);
    expect(next.development.triceps).toBeGreaterThan(0);
    expect(next.development.quads).toBe(0);
    expect(next.pump.levels.chest).toBeGreaterThan(
      next.development.chest,
    );
    expect(next.recentTraining[0]).toMatchObject({
      machineId: 'starter_a_bench',
      loadTier: 'hard',
      outcome: 'success',
    });
  });

  it('rewards quality over repeatedly choosing max and keeps rescued sets partial', () => {
    const save = createDefaultSaveData();
    const cleanSteady = applyWorkoutVisualProgression({
      state: save.visualProgression,
      machineId: 'starter_a_rows',
      gameplayTimeMs: 1_000,
      loadTier: 'steady',
      outcome: 'success',
      quality: 1,
      volume: 5,
    });
    const roughMax = applyWorkoutVisualProgression({
      state: save.visualProgression,
      machineId: 'starter_a_rows',
      gameplayTimeMs: 1_000,
      loadTier: 'max',
      outcome: 'failure',
      quality: 0.2,
      volume: 5,
    });
    const rescued = applyWorkoutVisualProgression({
      state: save.visualProgression,
      machineId: 'starter_a_rows',
      gameplayTimeMs: 1_000,
      loadTier: 'steady',
      outcome: 'rescued',
      quality: 0.7,
      volume: 5,
    });

    expect(cleanSteady.development.back).toBeGreaterThan(
      roughMax.development.back,
    );
    expect(rescued.development.back).toBeGreaterThan(
      roughMax.development.back,
    );
    expect(rescued.development.back).toBeLessThan(
      cleanSteady.development.back,
    );
  });

  it('decays pump by active gameplay time and accelerates decay during deep recovery', () => {
    const save = createDefaultSaveData();
    const trained = applyWorkoutVisualProgression({
      state: save.visualProgression,
      machineId: 'starter_b_leg',
      gameplayTimeMs: 10_000,
      loadTier: 'hard',
      outcome: 'success',
      quality: 0.9,
      volume: 6,
    });
    const halfway = getCurrentPump(
      trained,
      10_000 + PUMP_DECAY_MS / 2,
    );
    const recovered = applyDeepRecoveryToVisualProgression(
      trained,
      10_000 + PUMP_DECAY_MS / 2,
    );

    expect(halfway.quads).toBeCloseTo(trained.pump.levels.quads / 2);
    expect(recovered.pump.levels.quads).toBeLessThan(halfway.quads);
    expect(
      decayTrainerPump(trained.pump.levels, PUMP_DECAY_MS * 2).quads,
    ).toBe(0);
  });

  it('derives visible offsets without overwriting base cosmetics and respects all presentation levels', () => {
    const save = createDefaultSaveData();
    const base = structuredClone(save.trainer.appearance);
    const trained = {
      ...save.visualProgression,
      development: Object.fromEntries(
        Object.keys(save.visualProgression.development).map((group) => [
          group,
          100,
        ]),
      ) as typeof save.visualProgression.development,
    };
    const cosmeticOnly = deriveTrainerVisualPresentation({
      baseAppearance: save.trainer.appearance,
      state: {
        ...trained,
        preferences: {
          ...trained.preferences,
          developmentLevel: 'cosmetic-only',
          showPumpEffects: false,
        },
      },
      gameplayTimeMs: 0,
      fatigue: 0,
    });
    const standard = deriveTrainerVisualPresentation({
      baseAppearance: save.trainer.appearance,
      state: trained,
      gameplayTimeMs: 0,
      fatigue: 0,
    });
    const exaggerated = deriveTrainerVisualPresentation({
      baseAppearance: save.trainer.appearance,
      state: {
        ...trained,
        preferences: {
          ...trained.preferences,
          developmentLevel: 'exaggerated',
        },
      },
      gameplayTimeMs: 0,
      fatigue: 0,
    });

    expect(cosmeticOnly.appearance).toEqual(base);
    expect(standard.appearance.build.shoulderWidth).toBeGreaterThan(
      base.build.shoulderWidth,
    );
    expect(exaggerated.appearance.build.shoulderWidth).toBeGreaterThanOrEqual(
      standard.appearance.build.shoulderWidth,
    );
    expect(save.trainer.appearance).toEqual(base);
  });

  it('adds non-persistent recovery accessories and stores serializable progress snapshots', () => {
    const save = createDefaultSaveData();
    const presentation = deriveTrainerVisualPresentation({
      baseAppearance: save.trainer.appearance,
      state: save.visualProgression,
      gameplayTimeMs: 0,
      fatigue: 100,
    });
    const snapshotted = createPhysiqueSnapshot({
      state: save.visualProgression,
      appearance: save.trainer.appearance,
      gameplayTimeMs: 8_000,
      fatigue: 90,
      label: 'Home review',
    });

    expect(presentation.recovery.stance).toBe('fatigued');
    expect(presentation.appearance.accessories.towelId).toBe(
      'shoulder-small',
    );
    expect(save.trainer.appearance.accessories.towelId).toBe('none');
    expect(snapshotted.snapshots[0]).toMatchObject({
      id: 'physique-snapshot-1',
      label: 'Home review',
      gameplayTimeMs: 8_000,
    });
    expect(() => JSON.stringify(snapshotted)).not.toThrow();
  });

  it('produces bounded fictional ratings from gameplay and visual state', () => {
    const save = createDefaultSaveData();
    const ratings = calculatePhysiqueRatings({
      trainer: save.trainer,
      development: save.visualProgression.development,
      pump: save.visualProgression.pump.levels,
      fatigue: save.trainingFatigue,
      recentTrainingCount: 0,
    });

    expect(Object.keys(ratings)).toEqual([
      'balance',
      'symmetry',
      'conditioning',
      'presentation',
      'power',
      'mobility',
      'recovery',
    ]);
    Object.values(ratings).forEach((rating) => {
      expect(rating).toBeGreaterThanOrEqual(0);
      expect(rating).toBeLessThanOrEqual(100);
    });
  });
});
