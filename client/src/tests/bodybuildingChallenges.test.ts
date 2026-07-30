import { describe, expect, it } from 'vitest';

import { BODYBUILDING_CHALLENGES } from '../game/content/visualProgression';
import { createDefaultSaveData } from '../game/save/saveDefaults';
import {
  recordBodybuildingChallengeResult,
  resolveBodybuildingChallenge,
} from '../game/systems/bodybuildingChallenges';
import { createRandomState } from '../game/systems/random';

describe('optional bodybuilding challenges', () => {
  it('resolves every challenge deterministically from explicit choices and a seed', () => {
    const save = createDefaultSaveData();
    const development = Object.fromEntries(
      Object.keys(save.visualProgression.development).map((group) => [
        group,
        82,
      ]),
    ) as typeof save.visualProgression.development;
    const pump = Object.fromEntries(
      Object.keys(save.visualProgression.pump.levels).map((group) => [
        group,
        70,
      ]),
    ) as typeof save.visualProgression.pump.levels;

    for (const challenge of BODYBUILDING_CHALLENGES) {
      const input = {
        challengeId: challenge.id,
        selectedPose: challenge.preferredPoses[0]!,
        timingPrecision: challenge.targetTiming,
        preparation: 0.9,
        outfitAlignment: 0.9,
        fatigue: 15,
        development,
        pump,
        trainingHistory: [],
        trainerMuscles: save.trainer.muscles,
      };
      const first = resolveBodybuildingChallenge(
        input,
        createRandomState(42),
      );
      const second = resolveBodybuildingChallenge(
        input,
        createRandomState(42),
      );

      expect(second).toEqual(first);
      expect(first.completed).toBe(true);
      expect(first.rewardId).toBe(challenge.reward.id);
    }
  });

  it('makes timing, pose, preparation, recovery, outfit, pump, and history meaningful', () => {
    const save = createDefaultSaveData();
    const challenge = BODYBUILDING_CHALLENGES[0]!;
    const base = {
      challengeId: challenge.id,
      selectedPose: challenge.preferredPoses[0]!,
      timingPrecision: challenge.targetTiming,
      preparation: 1,
      outfitAlignment: 1,
      fatigue: 0,
      development: Object.fromEntries(
        Object.keys(save.visualProgression.development).map((group) => [
          group,
          65,
        ]),
      ) as typeof save.visualProgression.development,
      pump: Object.fromEntries(
        Object.keys(save.visualProgression.pump.levels).map((group) => [
          group,
          65,
        ]),
      ) as typeof save.visualProgression.pump.levels,
      trainingHistory: [],
      trainerMuscles: save.trainer.muscles,
    };
    const prepared = resolveBodybuildingChallenge(
      base,
      createRandomState(7),
    );
    const unprepared = resolveBodybuildingChallenge(
      {
        ...base,
        selectedPose: 'fatigued-stance' as const,
        timingPrecision: 0,
        preparation: 0,
        outfitAlignment: 0,
        fatigue: 100,
        pump: save.visualProgression.pump.levels,
      },
      createRandomState(7),
    );

    expect(prepared.score).toBeGreaterThan(unprepared.score);
    expect(prepared.factors.pose).toBe(1);
    expect(unprepared.factors.pose).toBeLessThan(1);
  });

  it('records attempts, best scores, completion, and rewards immutably', () => {
    const save = createDefaultSaveData();
    const result = {
      challengeId: 'stage-presence' as const,
      score: 91,
      rating: 'champion' as const,
      completed: true,
      rewardId: 'reward.cape.home-champion',
      factors: {
        timing: 1,
        preparation: 1,
        pose: 1,
        training: 1,
        pump: 1,
        recovery: 1,
        outfit: 1,
        controlledVariation: 0,
      },
      randomState: 9,
    };
    const next = recordBodybuildingChallengeResult(
      save.visualProgression,
      result,
    );
    const repeated = recordBodybuildingChallengeResult(next, {
      ...result,
      score: 72,
    });

    expect(save.visualProgression.challenges.completedChallengeIds).toEqual(
      [],
    );
    expect(repeated.challenges.attemptsByChallengeId['stage-presence']).toBe(
      2,
    );
    expect(repeated.challenges.bestScoreByChallengeId['stage-presence']).toBe(
      91,
    );
    expect(repeated.challenges.completedChallengeIds).toEqual([
      'stage-presence',
    ]);
    expect(repeated.challenges.unlockedRewardIds).toEqual([
      'reward.cape.home-champion',
    ]);
  });
});
