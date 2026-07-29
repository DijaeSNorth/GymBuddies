import { describe, expect, it } from 'vitest';

import { BUDDY_SPECIES } from '../game/content/buddies';
import {
  BUDDY_LEVEL_CURVE,
  CATCH_UP_CURVE,
  GYM_PROGRESSION_MILESTONES,
  MACHINE_MASTERY_RANKS,
} from '../game/content/progressionBalance';
import type { Buddy } from '../game/types';
import {
  calculateBossFailureProtection,
  calculateBuddyDisciplineStrengths,
  calculateCatchUpXpMultiplier,
  calculateChallengeEffectiveLevel,
  calculateEndgameProgress,
  calculateProgressionUnlocks,
  getBuddyExperienceNeeded,
  getMachineMasteryBenefits,
  getMachineMasteryRank,
  recordMachineMastery,
} from '../game/systems/progressionModel';
import { simulateProgressionJourneys } from '../game/systems/progressionSimulation';

function createBuddy(overrides: Partial<Buddy> = {}): Buddy {
  const creature = BUDDY_SPECIES[0]!;
  return {
    id: 'progression-test-buddy',
    nickname: 'Tempo',
    creature,
    level: 8,
    hp: 42,
    maxHp: 50,
    xp: 0,
    form: 14,
    mobility: 13,
    volume: 6,
    ...overrides,
  };
}

describe('complete progression model', () => {
  it('defines an increasing expected band and time target for all six gyms', () => {
    expect(
      GYM_PROGRESSION_MILESTONES.map((milestone) => milestone.gymId),
    ).toEqual([
      'home',
      'starter-a',
      'starter-b',
      'higher-1',
      'higher-2',
      'higher-3',
    ]);
    expect(
      GYM_PROGRESSION_MILESTONES.map(
        (milestone) => milestone.expectedBuddyLevel.target,
      ),
    ).toEqual([4, 10, 20, 30, 40, 50]);
    expect(
      GYM_PROGRESSION_MILESTONES.map(
        (milestone) => milestone.expectedCumulativeMinutes.target,
      ),
    ).toEqual([25, 65, 120, 185, 255, 330]);
  });

  it('keeps the XP curve bounded, increasing, and fast enough for roster rotation', () => {
    const thresholds = Array.from({ length: 60 }, (_, index) =>
      getBuddyExperienceNeeded(index + 1),
    );
    expect(thresholds.every((value) => value >= 8)).toBe(true);
    expect(
      thresholds.every(
        (value, index) => index === 0 || value >= thresholds[index - 1]!,
      ),
    ).toBe(true);
    expect(BUDDY_LEVEL_CURVE.maximumLevel).toBe(60);
    expect(thresholds.at(-1)).toBeLessThan(70);
  });

  it('accelerates low-level newcomers without exceeding the catch-up cap', () => {
    const normal = calculateCatchUpXpMultiplier({
      buddyLevel: 28,
      expectedLevel: 30,
      sessionsSinceCapture: 10,
    });
    const newcomer = calculateCatchUpXpMultiplier({
      buddyLevel: 12,
      expectedLevel: 30,
      sessionsSinceCapture: 0,
    });
    expect(normal).toBe(1);
    expect(newcomer).toBeGreaterThan(1);
    expect(newcomer).toBeLessThanOrEqual(
      CATCH_UP_CURVE.maximumXpMultiplier,
    );
  });

  it('uses diminishing challenge contribution instead of deleting overlevels', () => {
    const onBand = calculateChallengeEffectiveLevel(12, 'starter-a');
    const overleveled = calculateChallengeEffectiveLevel(40, 'starter-a');
    expect(onBand).toBe(12);
    expect(overleveled).toBeGreaterThan(14);
    expect(overleveled).toBeLessThan(40);
  });

  it('tracks mastery immutably and keeps its benefits under the configured cap', () => {
    const original = {
      xp: 0,
      sessions: 0,
      successfulSessions: 0,
      bestQuality: 0,
    };
    const progressed = recordMachineMastery({
      current: original,
      outcome: 'success',
      quality: 0.9,
    });
    expect(progressed).not.toBe(original);
    expect(original.xp).toBe(0);
    expect(progressed.xp).toBeGreaterThan(0);
    expect(
      getMachineMasteryRank(MACHINE_MASTERY_RANKS.at(-1)!.minimumXp).id,
    ).toBe('mastered');
    expect(
      getMachineMasteryBenefits(10_000).xpMultiplier,
    ).toBeLessThanOrEqual(1.1);
  });

  it('derives five discipline strengths from species identity and live stats', () => {
    const buddy = createBuddy();
    const strengths = calculateBuddyDisciplineStrengths(buddy);
    expect(Object.keys(strengths).sort()).toEqual([
      'endurance',
      'mobility',
      'power',
      'recovery',
      'technique',
    ]);
    expect(strengths[buddy.creature.primaryDiscipline]).toBeGreaterThan(20);
    expect(Object.values(strengths).every((value) => value <= 100)).toBe(
      true,
    );
  });

  it('keeps main routes visit-gated and shortcuts boss-gated', () => {
    const beforeBoss = calculateProgressionUnlocks({
      visitedGymIds: ['home', 'starter-a', 'starter-b'],
      completedGymIds: [],
    });
    const afterBoss = calculateProgressionUnlocks({
      visitedGymIds: ['home', 'starter-a', 'starter-b'],
      completedGymIds: ['starter-b'],
    });
    expect(beforeBoss.unlockedGymIds).toContain('higher-1');
    expect(beforeBoss.routeIds).not.toContain('recovery-circuit-shortcut');
    expect(afterBoss.routeIds).toContain('recovery-circuit-shortcut');
  });

  it('provides a non-destructive comeback after repeated boss failures', () => {
    const buddy = createBuddy({ hp: 3 });
    const first = calculateBossFailureProtection({
      consecutiveFailures: 1,
      trainingFatigue: 100,
      buddy,
    });
    const protectedResult = calculateBossFailureProtection({
      consecutiveFailures: 2,
      trainingFatigue: 100,
      buddy,
    });
    expect(first.protected).toBe(false);
    expect(protectedResult.protected).toBe(true);
    expect(protectedResult.trainingFatigue).toBeLessThan(100);
    expect(protectedResult.buddy.hp).toBeGreaterThan(buddy.hp);
    expect(buddy.hp).toBe(3);
  });

  it('unlocks meaningful postgame tracks without raising the party limit', () => {
    const mastery = Object.fromEntries(
      Array.from({ length: 4 }, (_, index) => [
        `machine-${index}`,
        {
          xp: 110,
          sessions: 14,
          successfulSessions: 14,
          bestQuality: 0.9,
        },
      ]),
    );
    const progress = calculateEndgameProgress({
      completedGymIds: [
        'home',
        'starter-a',
        'starter-b',
        'higher-1',
        'higher-2',
        'higher-3',
      ],
      completedBossVariantIds: ['a', 'b', 'c', 'd', 'e', 'f'],
      caughtDex: Array.from({ length: 12 }, (_, index) => index + 1),
      masteryByMachineId: mastery,
    });
    expect(progress.unlocked).toBe(true);
    expect(progress.availableActivityIds).toEqual(
      expect.arrayContaining([
        'endgame.rematch-circuit',
        'endgame.mastery-board',
        'endgame.index-expeditions',
        'endgame-balanced-team-trials',
      ]),
    );
  });

  it('simulates at least 1,000 complete journeys deterministically', () => {
    const first = simulateProgressionJourneys({
      seed: 123_456,
      journeyCount: 1_000,
    });
    const second = simulateProgressionJourneys({
      seed: 123_456,
      journeyCount: 1_000,
    });
    expect(first.completedJourneys).toBe(1_000);
    expect(first.mandatoryGrindRate).toBe(0);
    expect(first.averageCompletionMinutes).toBe(
      second.averageCompletionMinutes,
    );
    expect(first.milestones).toEqual(second.milestones);
  });
});
