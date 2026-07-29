import { describe, expect, it } from 'vitest';

import { WORKOUT_BALANCE } from '../game/content/balance';
import { BUDDY_SPECIES } from '../game/content/buddies';
import { GYMS } from '../game/content/gyms';
import {
  WORKOUT_LOAD_BY_ID,
  WORKOUT_LOAD_ORDER,
} from '../game/content/workoutLoads';
import { TRAINER_PRESETS } from '../game/content/trainer';
import {
  advanceWorkoutSession,
  calculateWorkoutPreview,
  calculateWorkoutResolution,
  createWorkoutSession,
  resolveWorkoutRep,
  resolveWorkoutSpot,
} from '../game/systems/workoutResolution';
import { createRandomState } from '../game/systems/random';
import type {
  Buddy,
  WorkoutLoadTier,
  WorkoutSession,
} from '../game/types';

const trainer = TRAINER_PRESETS[0]!.profile;
const gym = GYMS.find((entry) => entry.id === 'starter-a')!;
const machine = gym.machines[0]!;
const buddy: Buddy = {
  id: 'workout-test-buddy',
  nickname: 'Tempo',
  creature: BUDDY_SPECIES[0]!,
  level: 5,
  hp: 50,
  maxHp: 54,
  xp: 2,
  form: 14,
  mobility: 13,
  volume: 7,
};

function createSession(load: WorkoutLoadTier, seed = 99) {
  return createWorkoutSession({
    buddy,
    machine,
    trainer,
    gymKind: gym.type,
    trainingFatigue: 20,
    workoutMomentum: 8,
    deloadTokens: 4,
    selectedLoad: load,
    startedAt: 1_000,
    randomState: createRandomState(seed),
  });
}

function completeWithTiming(
  initial: WorkoutSession,
  timingOffset: number,
) {
  let session = initial;
  while (!session.resolved) {
    const inputAt =
      session.repStartedAt +
      session.repDurationMs *
        (session.timingTarget + timingOffset * session.goodWindow);
    session = resolveWorkoutRep(session, inputAt);
  }
  return session;
}

describe('skill workout load profiles', () => {
  it.each(WORKOUT_LOAD_ORDER)(
    'creates deterministic %s sessions and resolves a perfect set',
    (load) => {
      const first = createSession(load, 144);
      const replay = createSession(load, 144);
      const completed = completeWithTiming(first.session, 0);
      const resolution = calculateWorkoutResolution({
        session: completed,
        buddy,
        machine,
        trainer,
        steroids: 0,
        workoutMomentum: 8,
        trainingFatigue: 20,
      });

      expect(first).toEqual(replay);
      expect(first.session.loadTier).toBe(load);
      expect(first.session.repCount).toBe(WORKOUT_LOAD_BY_ID[load].repCount);
      expect(completed.outcome).toBe('success');
      expect(completed.repResults).toHaveLength(
        WORKOUT_LOAD_BY_ID[load].repCount,
      );
      expect(completed.repResults.every((rep) => rep.grade === 'perfect')).toBe(
        true,
      );
      expect(resolution.outcome).toBe('success');
      expect(resolution.xpAwarded).toBeGreaterThan(0);
    },
  );

  it('calculates every requested forecast metric before the set', () => {
    const preview = calculateWorkoutPreview({
      buddy,
      machine,
      trainer,
      gymKind: gym.type,
      selectedLoad: 'hard',
      trainingFatigue: 20,
      workoutMomentum: 8,
      deloadTokens: 4,
    });

    expect(preview.readiness).toBeGreaterThanOrEqual(0);
    expect(preview.failureProbability).toBeGreaterThan(0);
    expect(preview.repTimingMs).toBe(WORKOUT_LOAD_BY_ID.hard.repDurationMs);
    expect(preview.formConsistency).toBeGreaterThanOrEqual(0);
    expect(preview.setStress).toBeGreaterThanOrEqual(0);
    expect(preview.volumePreparedness).toBeGreaterThanOrEqual(0);
    expect(preview.trainerMachineAlignment).toBeGreaterThanOrEqual(0);
    expect(preview.buddyDisciplineAlignment).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(preview.expectedFatigueChange)).toBe(true);
    expect(Number.isFinite(preview.expectedHpChange)).toBe(true);
    expect(preview.expectedXp).toBeGreaterThan(0);
    expect(preview.deloadUsed).toBe(1);
  });

  it('raises risk with load and rewards consistent technique with momentum', () => {
    const previews = WORKOUT_LOAD_ORDER.map((selectedLoad) =>
      calculateWorkoutPreview({
        buddy,
        machine,
        trainer,
        gymKind: gym.type,
        selectedLoad,
        trainingFatigue: 20,
        workoutMomentum: 8,
        deloadTokens: 0,
      }),
    );
    const steady = calculateWorkoutResolution({
      session: completeWithTiming(createSession('steady').session, 0),
      buddy,
      machine,
      trainer,
      steroids: 0,
      workoutMomentum: 8,
      trainingFatigue: 20,
    });
    const roughMax = calculateWorkoutResolution({
      session: completeWithTiming(createSession('max').session, 1.3),
      buddy,
      machine,
      trainer,
      steroids: 0,
      workoutMomentum: 8,
      trainingFatigue: 20,
    });

    expect(previews.map((preview) => preview.failureProbability)).toEqual(
      [...previews]
        .sort((a, b) => a.failureProbability - b.failureProbability)
        .map((preview) => preview.failureProbability),
    );
    expect(steady.momentumDelta).toBeGreaterThan(roughMax.momentumDelta);
    expect(steady.fatigueDelta).toBeLessThan(roughMax.fatigueDelta);
  });
});

describe('Spot Now rescue outcomes', () => {
  function openSpotWindow() {
    const session = createSession('hard').session;
    return resolveWorkoutRep(session, session.repStartedAt);
  }

  it('partially saves a failing set inside the deterministic rescue window', () => {
    const spotSession = openSpotWindow();
    const spot = resolveWorkoutSpot({
      session: spotSession,
      inputAt: spotSession.spotWindowStart + WORKOUT_BALANCE.spotSaveMs,
    });
    const resolution = calculateWorkoutResolution({
      session: spot.session,
      buddy,
      machine,
      trainer,
      steroids: 0,
      workoutMomentum: 8,
      trainingFatigue: 20,
    });

    expect(spot.succeeded).toBe(true);
    expect(spot.reactionMs).toBe(WORKOUT_BALANCE.spotSaveMs);
    expect(spot.session.outcome).toBe('rescued');
    expect(resolution.xpAwarded).toBeGreaterThan(0);
    expect(resolution.hpChange).toBeLessThan(0);
    expect(resolution.feedbackCodes).toContain('spot-saved');
  });

  it('applies the full fictional HP, fatigue, and form consequences after a late spot', () => {
    const spotSession = openSpotWindow();
    const saved = resolveWorkoutSpot({
      session: spotSession,
      inputAt: spotSession.spotWindowStart + 100,
    });
    const missed = resolveWorkoutSpot({
      session: spotSession,
      inputAt: spotSession.spotSaveDeadline + 1,
    });
    const savedResolution = calculateWorkoutResolution({
      session: saved.session,
      buddy,
      machine,
      trainer,
      steroids: 0,
      workoutMomentum: 8,
      trainingFatigue: 20,
    });
    const missedResolution = calculateWorkoutResolution({
      session: missed.session,
      buddy,
      machine,
      trainer,
      steroids: 0,
      workoutMomentum: 8,
      trainingFatigue: 20,
    });

    expect(missed.succeeded).toBe(false);
    expect(missed.session.outcome).toBe('failure');
    expect(missedResolution.xpAwarded).toBe(0);
    expect(missedResolution.hpChange).toBeLessThan(savedResolution.hpChange);
    expect(missedResolution.fatigueDelta).toBeGreaterThan(
      savedResolution.fatigueDelta,
    );
    expect(missedResolution.growth.form).toBeLessThanOrEqual(
      savedResolution.growth.form,
    );
    expect(missedResolution.feedbackCodes).toContain('spot-missed');
  });

  it('resolves an untouched rescue window as a deterministic miss', () => {
    const spotSession = openSpotWindow();
    const timedOut = advanceWorkoutSession(
      spotSession,
      spotSession.spotWindowEnd + 1,
    );

    expect(timedOut.resolved).toBe(true);
    expect(timedOut.outcome).toBe('failure');
    expect(timedOut.feedbackCodes).toContain('spot-missed');
  });
});
