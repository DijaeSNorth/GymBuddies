import { describe, expect, it } from 'vitest';

import { BOSS_ROSTERS } from '../game/content/bosses';
import { BUDDY_SPECIES } from '../game/content/buddies';
import { CAPTURE_MOVE_BY_ID, CAPTURE_MOVES } from '../game/content/captureMoves';
import { GYMS } from '../game/content/gyms';
import { collectGameContentValidationErrors } from '../game/content/validation';
import {
  calculateBossCaptureTarget,
  calculateBossChallengeStress,
  calculateBossMoveState,
  createBossEncounter,
  getBossChallengeProfile,
} from '../game/systems/bossChallenges';
import {
  advanceBossGameplayTime,
  claimBossSchedule,
  createBossSchedule,
  getBossAvailability,
  markBossCycleRewarded,
  restoreBossSchedule,
} from '../game/systems/bossScheduling';
import { createRandomState } from '../game/systems/random';
import { resolveBossVictoryReward } from '../game/systems/rewards';
import type { Buddy, Match } from '../game/types';

const gym = GYMS.find((entry) => entry.id === 'starter-a')!;
const roster = BOSS_ROSTERS.find((entry) => entry.gymId === gym.id)!;
const species = BUDDY_SPECIES.find(
  (entry) => entry.id === roster.bosses[0]!.speciesId,
)!;
const buddy: Buddy = {
  id: 'boss-test-buddy',
  nickname: 'Bracket',
  creature: species,
  level: 14,
  hp: 52,
  maxHp: 60,
  xp: 2,
  form: 15,
  mobility: 13,
  volume: 8,
};

function createBossMatch(bossIndex = 0): Match {
  const encounter = createBossEncounter({
    gym,
    bosses: [roster.bosses[bossIndex]!],
    species: BUDDY_SPECIES,
    scheduleCycle: 1,
    randomState: createRandomState(91),
  }).encounter;
  return {
    encounter,
    status: 'playing',
    round: 1,
    maxRounds: getBossChallengeProfile(gym.type, encounter).maxRounds,
    meter: 50,
    playerStamina: 82,
    opponentStamina: 86,
    playerMoveHistory: [],
    opponentMoveHistory: [],
    opponentIntent: {
      moveId: 'grind',
      tendencyId: 'anchor',
      tendencyLabel: 'Patient anchor',
      tell: 'The boss settles into a centered grip.',
      confidence: 'clear',
    },
    lastRound: null,
    pendingCapturedBuddy: null,
    lines: [],
    isBossChallengeActive: true,
    bossChallengeMachineId: encounter.bossChallengeMachineId ?? null,
    bossChallengeMachineName: encounter.bossChallengeMachineName ?? null,
    bossChallengeMisses: 0,
    bossChallengeMatchStreak: 0,
    bossChallengeNearMisses: 0,
  };
}

describe('boss content and signature challenges', () => {
  it('defines two complete, mechanically distinct variants for all six gyms', () => {
    const bosses = BOSS_ROSTERS.flatMap((entry) => entry.bosses);

    expect(BOSS_ROSTERS).toHaveLength(6);
    expect(BOSS_ROSTERS.every((entry) => entry.bosses.length === 2)).toBe(
      true,
    );
    expect(bosses).toHaveLength(12);
    expect(new Set(bosses.map((boss) => boss.signatureRule.trigger)).size).toBe(
      12,
    );
    expect(
      bosses.every(
        (boss) =>
          boss.personality &&
          boss.visualIdentity &&
          boss.counterplay &&
          boss.arenaEffect.description &&
          boss.rewardTable.buddyXp > 0,
      ),
    ).toBe(true);
    expect(collectGameContentValidationErrors()).toEqual([]);
  });

  it('requires the announced machine and move for a streak', () => {
    const match = createBossMatch();
    const machine = gym.machines.find(
      (entry) => entry.id === match.encounter.bossChallengeMachineId,
    )!;
    const otherMachine = gym.machines.find(
      (entry) => entry.id !== machine.id,
    )!;
    const requiredMove = CAPTURE_MOVE_BY_ID.get(
      match.encounter.bossRequiredMoveId!,
    )!;
    const otherMove = CAPTURE_MOVES.find(
      (entry) => entry.id !== requiredMove.id,
    )!;
    const complete = calculateBossMoveState({
      match,
      gym,
      selectedMachine: machine,
      move: requiredMove,
      buddy,
      isForcedRecovery: false,
      challengeStressPercent: 20,
    });
    const partial = calculateBossMoveState({
      match,
      gym,
      selectedMachine: machine,
      move: otherMove,
      buddy,
      isForcedRecovery: false,
      challengeStressPercent: 20,
    });
    const miss = calculateBossMoveState({
      match,
      gym,
      selectedMachine: otherMachine,
      move: otherMove,
      buddy,
      isForcedRecovery: false,
      challengeStressPercent: 20,
    });

    expect(complete.isChallengeAction).toBe(true);
    expect(complete.nextMatchStreak).toBe(1);
    expect(partial.isNearMiss).toBe(true);
    expect(partial.nextNearMisses).toBe(1);
    expect(partial.nextMisses).toBe(0);
    expect(miss.isCompleteMiss).toBe(true);
    expect(miss.nextMisses).toBe(1);
    expect(miss.nextMatchStreak).toBe(0);
  });

  it('activates overload and applies variant-specific dynamic targets', () => {
    const first = createBossMatch(0);
    const second = createBossMatch(1);
    const profile = getBossChallengeProfile(gym.type, first.encounter);
    const wrongMachine = gym.machines.find(
      (entry) => entry.id !== first.encounter.bossChallengeMachineId,
    )!;
    const overloaded = {
      ...first,
      bossChallengeMisses: profile.overloadMissLimit,
    };
    const secondWrongMachine = gym.machines.find(
      (entry) => entry.id !== second.encounter.bossChallengeMachineId,
    )!;
    const secondWrongMove = CAPTURE_MOVES.find(
      (entry) => entry.id !== second.encounter.bossRequiredMoveId,
    )!;
    const signatureMiss = calculateBossMoveState({
      match: second,
      gym,
      selectedMachine: secondWrongMachine,
      move: secondWrongMove,
      buddy,
      isForcedRecovery: false,
      challengeStressPercent: 40,
    });

    expect(
      calculateBossChallengeStress(overloaded, wrongMachine, gym.type).tone,
    ).toBe('overload');
    expect(signatureMiss.signatureEffect.active).toBe(true);
    expect(signatureMiss.signatureEffect.ruleId).toBe('rule-lane-oath');
    expect(signatureMiss.moveFatigueDrain).toBeGreaterThan(
      signatureMiss.moveProfile.staminaDrain,
    );
    expect(
      calculateBossCaptureTarget({
        gym,
        encounter: first.encounter,
        isChallengeAligned: true,
        buddy,
      }),
    ).not.toBe(
      calculateBossCaptureTarget({
        gym,
        encounter: second.encounter,
        isChallengeAligned: true,
        buddy,
      }),
    );
  });
});

describe('gameplay-time boss availability and save restoration', () => {
  it('advances only active gameplay and exposes a stable ready state', () => {
    const schedule = createBossSchedule(5_000);

    expect(advanceBossGameplayTime(1_000, 900_000, false)).toBe(1_000);
    expect(advanceBossGameplayTime(1_000, 900_000, true)).toBe(2_500);
    expect(getBossAvailability(schedule, 4_999).status).toBe('cooldown');
    expect(getBossAvailability(schedule, 5_000)).toEqual({
      status: 'ready',
      remainingMs: 0,
    });
  });

  it('ignores legacy wall-clock magnitude and safely restores current cycles', () => {
    const oldPast = restoreBossSchedule(
      { nextBossAt: 1, defeated: 3 },
      20_000,
      300_000,
    );
    const oldFuture = restoreBossSchedule(
      { nextBossAt: Number.MAX_SAFE_INTEGER, defeated: 3 },
      20_000,
      300_000,
    );
    const current = restoreBossSchedule(
      {
        readyAtGameplayMs: 26_000,
        defeated: 2,
        cycle: 4,
        lastRewardedCycle: 2,
        lastBossId: 'a-rhino',
      },
      20_000,
      300_000,
    );

    expect(oldPast).toEqual(oldFuture);
    expect(oldPast.readyAtGameplayMs).toBe(80_000);
    expect(current).toEqual({
      readyAtGameplayMs: 26_000,
      defeated: 2,
      cycle: 4,
      lastRewardedCycle: 2,
      lastBossId: 'a-rhino',
    });
    expect(JSON.parse(JSON.stringify(current))).toEqual(current);
  });

  it('claims one encounter cycle and prevents duplicate cycle rewards', () => {
    const ready = createBossSchedule(0);
    const claim = claimBossSchedule({
      schedule: ready,
      gameplayTimeMs: 10_000,
      nextIntervalMs: 300_000,
      bossId: 'a-rhino',
    });

    expect(claim.claimed).toBe(true);
    expect(claim.cycle).toBe(1);
    expect(getBossAvailability(claim.schedule, 10_000).status).toBe(
      'cooldown',
    );
    const firstReward = markBossCycleRewarded(claim.schedule, claim.cycle);
    const duplicate = markBossCycleRewarded(
      firstReward.schedule,
      claim.cycle,
    );
    expect(firstReward.awarded).toBe(true);
    expect(firstReward.schedule.defeated).toBe(1);
    expect(duplicate.awarded).toBe(false);
    expect(duplicate.schedule.defeated).toBe(1);
  });
});

describe('boss rewards', () => {
  it('resolves seeded rewards immutably and respects resource caps', () => {
    const rewardTable = roster.bosses[0]!.rewardTable;
    const input = {
      rewardTable,
      team: [buddy],
      activeIndex: 0,
      trainingFatigue: 30,
      workoutMomentum: 28,
      deloadTokens: 3,
      randomState: createRandomState(44),
    };
    const first = resolveBossVictoryReward(input);
    const replay = resolveBossVictoryReward(input);

    expect(first).toEqual(replay);
    expect(first.team).not.toBe(input.team);
    expect(first.team[0]).not.toBe(buddy);
    expect(first.trainingFatigue).toBeLessThan(input.trainingFatigue);
    expect(first.workoutMomentum).toBeLessThanOrEqual(30);
    expect(first.deloadTokens).toBeLessThanOrEqual(4);
    expect(first.reward.id).toBe(rewardTable.id);
    expect(buddy.xp).toBe(2);
  });
});
