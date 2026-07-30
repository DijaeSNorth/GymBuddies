import { BODYBUILDING_CHALLENGES } from '../content/visualProgression';
import type {
  BodybuildingChallengeId,
  BodybuildingChallengeInput,
  BodybuildingChallengeResult,
  TrainerPose,
  TrainerVisualProgressionState,
} from '../types';
import { clamp, clamp01 } from './math';
import { nextRandom, type RandomState } from './random';

export function getBodybuildingChallenge(challengeId: BodybuildingChallengeId) {
  const challenge = BODYBUILDING_CHALLENGES.find(
    (entry) => entry.id === challengeId,
  );
  if (!challenge) {
    throw new Error(`Unknown bodybuilding challenge "${challengeId}".`);
  }
  return challenge;
}

function average(values: readonly number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

export function resolveBodybuildingChallenge(
  input: BodybuildingChallengeInput,
  randomState: RandomState,
): BodybuildingChallengeResult {
  const challenge = getBodybuildingChallenge(input.challengeId);
  const roll = nextRandom(randomState);
  const timing = clamp01(
    1 - Math.abs(clamp01(input.timingPrecision) - challenge.targetTiming) * 2,
  );
  const preparation = clamp01(input.preparation);
  const pose = new Set<TrainerPose>(challenge.preferredPoses).has(
    input.selectedPose,
  )
    ? 1
    : 0.42;
  const training = clamp01(
    average(
      challenge.focusGroups.map(
        (group) => input.development[group] / 100,
      ),
    ) *
      0.72 +
      Math.min(0.28, input.trainingHistory.length / 30),
  );
  const pump = clamp01(
    average(challenge.focusGroups.map((group) => input.pump[group] / 100)),
  );
  const recovery = clamp01(
    1 -
      clamp01(input.fatigue / 100) *
        (1.1 - challenge.fatigueTolerance * 0.45),
  );
  const outfit = clamp01(input.outfitAlignment);
  const muscleFoundation = clamp01(
    average(Object.values(input.trainerMuscles)) / 10,
  );
  const controlledVariation = (roll.value - 0.5) * 0.08;
  const score = Math.round(
    clamp(
      (timing * 0.22 +
        preparation * 0.14 +
        pose * 0.16 +
        training * 0.17 +
        pump * 0.11 +
        recovery * 0.1 +
        outfit * 0.06 +
        muscleFoundation * 0.04 +
        controlledVariation) *
        100,
      0,
      100,
    ),
  );
  const completed = score >= 66;

  return {
    challengeId: challenge.id,
    score,
    rating:
      score >= 88
        ? 'champion'
        : score >= 76
          ? 'standout'
          : score >= 60
            ? 'solid'
            : 'developing',
    completed,
    rewardId: completed ? challenge.reward.id : null,
    factors: {
      timing,
      preparation,
      pose,
      training,
      pump,
      recovery,
      outfit,
      controlledVariation,
    },
    randomState: roll.randomState,
  };
}

export function recordBodybuildingChallengeResult(
  state: TrainerVisualProgressionState,
  result: BodybuildingChallengeResult,
): TrainerVisualProgressionState {
  const attempts =
    (state.challenges.attemptsByChallengeId[result.challengeId] ?? 0) + 1;
  const previousBest =
    state.challenges.bestScoreByChallengeId[result.challengeId] ?? 0;
  return {
    ...state,
    challenges: {
      attemptsByChallengeId: {
        ...state.challenges.attemptsByChallengeId,
        [result.challengeId]: attempts,
      },
      bestScoreByChallengeId: {
        ...state.challenges.bestScoreByChallengeId,
        [result.challengeId]: Math.max(previousBest, result.score),
      },
      completedChallengeIds:
        result.completed &&
        !state.challenges.completedChallengeIds.includes(result.challengeId)
          ? [...state.challenges.completedChallengeIds, result.challengeId]
          : state.challenges.completedChallengeIds,
      unlockedRewardIds:
        result.rewardId &&
        !state.challenges.unlockedRewardIds.includes(result.rewardId)
          ? [...state.challenges.unlockedRewardIds, result.rewardId]
          : state.challenges.unlockedRewardIds,
    },
  };
}
