import { describe, expect, it } from 'vitest';

import {
  BOSS_CAPTURE_TARGET,
  BUDDY_STAT_LIMITS,
  FATIGUE_BALANCE,
  WORKOUT_BALANCE,
} from '../game/content/balance';
import { BOSS_ROSTERS } from '../game/content/bosses';
import { BUDDY_SPECIES, FANCY_NAMES } from '../game/content/buddies';
import { CAPTURE_MOVES } from '../game/content/captureMoves';
import { GYMS } from '../game/content/gyms';
import { TRAINER_PRESETS } from '../game/content/trainer';
import { createDefaultSaveData } from '../game/save/saveDefaults';
import type { Buddy, Match, SaveData } from '../game/types';
import {
  calculateBossCaptureTarget,
  calculateBossChallengeStress,
  createBossEncounter,
} from '../game/systems/bossChallenges';
import {
  calculateBuddyWorkoutProfile,
  createCapturedBuddy,
  createSeedBuddy,
} from '../game/systems/buddyProgression';
import {
  calculateCaptureAttempt,
  calculateCaptureMove,
} from '../game/systems/captureBattles';
import {
  applyPassiveRecovery,
  calculateRestRecovery,
} from '../game/systems/fatigueRecovery';
import {
  createRandomState,
  nextRandom,
  randomInt,
} from '../game/systems/random';
import { applyExperienceReward, applySteroidReward } from '../game/systems/rewards';
import {
  calculateRouteEncounterChance,
  createWildEncounter,
  rollRouteEncounter,
} from '../game/systems/routeEncounters';
import {
  applyTrainerGrowth,
  calculateMachineFocusScore,
} from '../game/systems/trainerProgression';
import {
  normalizeUnlockedZones,
  unlockAdjacentZones,
} from '../game/systems/unlockProgression';
import {
  advanceWorkoutSession,
  calculateWorkoutResolution,
  createWorkoutSession,
  resolveWorkoutSpot,
} from '../game/systems/workoutResolution';

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach((entry) => deepFreeze(entry));
  }
  return value;
}

const trainer = TRAINER_PRESETS[0]!.profile;
const starterGym = GYMS.find((gym) => gym.id === 'starter-a')!;
const homeGym = GYMS.find((gym) => gym.id === 'home')!;
const starterMachine = starterGym.machines[0]!;

function createBuddy(overrides: Partial<Buddy> = {}): Buddy {
  return {
    id: 'test-buddy',
    nickname: 'Test Buddy',
    creature: BUDDY_SPECIES[0]!,
    level: 5,
    hp: 48,
    maxHp: 54,
    xp: 3,
    form: 13,
    mobility: 14,
    volume: 5,
    ...overrides,
  };
}

function createMatch(
  encounter = createWildEncounter({
    gym: starterGym,
    species: BUDDY_SPECIES,
    randomState: createRandomState(77),
  }).encounter,
): Match {
  return {
    encounter,
    status: 'playing',
    round: 1,
    maxRounds: 5,
    meter: 78,
    playerStamina: 82,
    opponentStamina: 84,
    playerMoveHistory: [],
    opponentMoveHistory: [],
    opponentIntent: {
      moveId: 'grind',
      tendencyId: 'anchor',
      tendencyLabel: 'Patient anchor',
      tell: 'Its elbow settles into steady pressure.',
      confidence: 'clear',
    },
    lastRound: null,
    pendingCapturedBuddy: null,
    lines: [],
    isBossChallengeActive: encounter.isBoss,
    bossChallengeMachineId: encounter.bossChallengeMachineId ?? null,
    bossChallengeMachineName: encounter.bossChallengeMachineName ?? null,
    bossChallengeMisses: 0,
    bossChallengeMatchStreak: 0,
    bossChallengeNearMisses: 0,
  };
}

describe('seeded random number generation', () => {
  it('replays an identical sequence from the same serializable seed', () => {
    const first = nextRandom(createRandomState(42));
    const second = nextRandom(first.randomState);
    const replayFirst = nextRandom(createRandomState(42));
    const replaySecond = nextRandom(replayFirst.randomState);

    expect([first.value, second.value]).toEqual([
      replayFirst.value,
      replaySecond.value,
    ]);
    expect(Number.isInteger(second.randomState)).toBe(true);
    expect(JSON.parse(JSON.stringify(second.randomState))).toBe(
      second.randomState,
    );
  });

  it('keeps inclusive integer rolls within their requested bounds', () => {
    let state = createRandomState(9);
    const values: number[] = [];
    for (let index = 0; index < 100; index += 1) {
      const roll = randomInt(state, -5, 9);
      values.push(roll.value);
      state = roll.randomState;
    }
    expect(Math.min(...values)).toBeGreaterThanOrEqual(-5);
    expect(Math.max(...values)).toBeLessThanOrEqual(9);
  });
});

describe('trainer and Buddy progression', () => {
  it('grows a cloned trainer without mutating the source profile', () => {
    const source = deepFreeze(structuredClone(trainer));
    const before = structuredClone(source);
    const result = applyTrainerGrowth(source, starterMachine.focus, 3, 1);

    expect(source).toEqual(before);
    expect(result).not.toBe(source);
    expect(Object.values(result.muscles).every((value) => value <= 14)).toBe(
      true,
    );
    expect(calculateMachineFocusScore(starterMachine, result)).toBeGreaterThan(
      0,
    );
  });

  it('derives immutable Buddy profiles and deterministic Buddy identities', () => {
    const source = deepFreeze(createBuddy());
    const profile = calculateBuddyWorkoutProfile(source);
    const first = createSeedBuddy({
      seed: 1,
      species: source.creature,
      level: 5,
      names: FANCY_NAMES,
      randomState: createRandomState(123),
    });
    const replay = createSeedBuddy({
      seed: 1,
      species: source.creature,
      level: 5,
      names: FANCY_NAMES,
      randomState: createRandomState(123),
    });

    expect(profile.movementConsistency).toBeGreaterThan(0);
    expect(first).toEqual(replay);
    expect(first.buddy.id).toBe('seed-1');
    expect(source.form).toBe(13);
  });
});

describe('fatigue, recovery, rewards, and unlocking', () => {
  it('applies passive and active recovery without mutating the Buddy', () => {
    const buddy = deepFreeze(createBuddy({ hp: 30 }));
    const passive = applyPassiveRecovery(
      { trainingFatigue: 50, workoutMomentum: 12 },
      true,
    );
    const rest = calculateRestRecovery({
      buddy,
      trainingFatigue: 80,
      deloadTokens: 1,
    });

    expect(passive).toEqual({ trainingFatigue: 47, workoutMomentum: 11 });
    expect(rest.buddy).not.toBe(buddy);
    expect(rest.buddy.hp).toBeGreaterThan(buddy.hp);
    expect(rest.trainingFatigue).toBeLessThan(80);
    expect(buddy.hp).toBe(30);
  });

  it('applies XP and steroid rewards as immutable results', () => {
    const buddy = deepFreeze(createBuddy({ level: 5, xp: 24 }));
    const experience = applyExperienceReward(buddy, 4);
    const steroid = applySteroidReward({
      buddy,
      trainer: deepFreeze(structuredClone(trainer)),
      steroids: 3,
    });

    expect(experience.leveled).toBe(true);
    expect(experience.buddy.level).toBe(7);
    expect(steroid.steroids).toBe(2);
    expect(buddy.level).toBe(5);
  });

  it('normalizes and expands only valid zone IDs', () => {
    const validZoneIds = GYMS.map((gym) => gym.id);
    const normalized = normalizeUnlockedZones({
      raw: ['starter-a', 'starter-a', 'missing'],
      fallback: ['home'],
      validZoneIds,
      startingZoneId: 'home',
    });
    const expanded = unlockAdjacentZones({
      known: normalized,
      zoneId: 'starter-a',
      routes: {
        home: ['starter-a'],
        'starter-a': ['home', 'starter-b'],
      },
      fallback: ['home'],
      validZoneIds,
      startingZoneId: 'home',
    });

    expect(normalized).toEqual(['home', 'starter-a']);
    expect(expanded).toEqual(['home', 'starter-a', 'starter-b']);
  });
});

describe('route encounters and workouts', () => {
  it('preserves route probability balance and deterministic encounter rolls', () => {
    const chance = calculateRouteEncounterChance({
      gymKind: 'starter',
      encounterBoost: 0.02,
      trainingFatigue: 60,
    });
    const first = rollRouteEncounter(createRandomState(10), chance);
    const replay = rollRouteEncounter(createRandomState(10), chance);
    const encounter = createWildEncounter({
      gym: starterGym,
      species: BUDDY_SPECIES,
      randomState: createRandomState(10),
    });
    let expectedState = createRandomState(10);
    for (let draw = 0; draw < BUDDY_SPECIES.length + 2; draw += 1) {
      expectedState = nextRandom(expectedState).randomState;
    }

    expect(chance).toBeCloseTo(0.17952, 8);
    expect(first).toEqual(replay);
    expect(encounter.randomState).toBe(expectedState);
    expect(encounter.encounter.level).toBeGreaterThanOrEqual(starterGym.levelMin);
    expect(encounter.encounter.level).toBeLessThanOrEqual(starterGym.levelMax);
  });

  it('creates and resolves a workout deterministically without input mutation', () => {
    const buddy = deepFreeze(createBuddy());
    const trainerInput = deepFreeze(structuredClone(trainer));
    const first = createWorkoutSession({
      buddy,
      machine: starterMachine,
      trainer: trainerInput,
      gymKind: starterGym.type,
      trainingFatigue: 18,
      workoutMomentum: 7,
      deloadTokens: 2,
      startedAt: 1_000,
      randomState: createRandomState(1234),
    });
    const replay = createWorkoutSession({
      buddy,
      machine: starterMachine,
      trainer: trainerInput,
      gymKind: starterGym.type,
      trainingFatigue: 18,
      workoutMomentum: 7,
      deloadTokens: 2,
      startedAt: 1_000,
      randomState: createRandomState(1234),
    });
    const session = deepFreeze({
      ...first.session,
      phase: 'resolved' as const,
      resolved: true,
      outcome: 'success' as const,
    });
    const resolution = calculateWorkoutResolution({
      session,
      buddy,
      machine: starterMachine,
      trainer: trainerInput,
      steroids: 3,
      workoutMomentum: 7,
      trainingFatigue: 18,
    });
    const spotSession = advanceWorkoutSession(
      first.session,
      first.session.repStartedAt + first.session.repDurationMs,
    );
    const spot = resolveWorkoutSpot({
      session: spotSession,
      inputAt: spotSession.spotWindowStart + 200,
    });

    expect(first).toEqual(replay);
    expect(resolution.buddy).not.toBe(buddy);
    expect(resolution.outcome).toBe('success');
    expect(spot.succeeded).toBe(true);
    expect(spot.session.outcome).toBe('rescued');
    expect(buddy.xp).toBe(3);
  });
});

describe('capture battles and boss challenges', () => {
  it('builds deterministic boss encounters and boss targets', () => {
    const roster = BOSS_ROSTERS.find(
      (entry) => entry.gymId === starterGym.id,
    )!;
    const first = createBossEncounter({
      gym: starterGym,
      bosses: roster.bosses,
      species: BUDDY_SPECIES,
      randomState: createRandomState(99),
    });
    const replay = createBossEncounter({
      gym: starterGym,
      bosses: roster.bosses,
      species: BUDDY_SPECIES,
      randomState: createRandomState(99),
    });
    const target = calculateBossCaptureTarget({
      gym: starterGym,
      encounter: first.encounter,
      isChallengeAligned: true,
      buddy: createBuddy(),
    });

    expect(first).toEqual(replay);
    expect(first.encounter.isBoss).toBe(true);
    expect(target).toBeGreaterThanOrEqual(64);
    expect(target).toBeLessThanOrEqual(92);
  });

  it('resolves capture rounds and attempts from explicit immutable state', () => {
    const bossRoster = BOSS_ROSTERS.find(
      (entry) => entry.gymId === starterGym.id,
    )!;
    const boss = createBossEncounter({
      gym: starterGym,
      bosses: bossRoster.bosses,
      species: BUDDY_SPECIES,
      randomState: createRandomState(4),
    }).encounter;
    const buddy = deepFreeze(createBuddy());
    const match = deepFreeze(createMatch(boss));
    const selectedMachine =
      starterGym.machines.find(
        (machine) => machine.id === boss.bossChallengeMachineId,
      ) ?? starterMachine;
    const stress = calculateBossChallengeStress(
      match,
      selectedMachine,
      starterGym.type,
    );
    const move = calculateCaptureMove({
      match,
      gym: starterGym,
      selectedMachine,
      trainer,
      buddy,
      trainingFatigue: 20,
      move: CAPTURE_MOVES[0]!,
      isForcedChallengeRecovery: false,
      challengeStressPercent: stress.percent,
      randomState: createRandomState(81),
    });
    const attempt = calculateCaptureAttempt({
      match: { ...match, meter: 90 },
      gym: starterGym,
      machine: selectedMachine,
      trainer,
      buddy,
      meter: 90,
      trainingFatigue: 20,
      randomState: createRandomState(81),
    });
    const captured = createCapturedBuddy({
      species: boss.creature,
      level: boss.level,
      capturedAtMs: 10_000,
      names: FANCY_NAMES,
      randomState: createRandomState(81),
    });

    expect(move.nextMeter).toBeGreaterThanOrEqual(20);
    expect(move.nextMeter).toBeLessThanOrEqual(92);
    expect(['near-capture', 'captured']).toContain(attempt.outcome);
    expect(captured.buddy.id).toBe(`${boss.creature.dex}-10000`);
    expect(match.meter).toBe(78);
  });
});

describe('balance and save serialization boundaries', () => {
  it('retains the established balance constants', () => {
    expect(BUDDY_STAT_LIMITS).toEqual({ form: 24, mobility: 24, volume: 12 });
    expect(FATIGUE_BALANCE.maximum).toBe(120);
    expect(WORKOUT_BALANCE.baseFailureChance).toBe(0.5);
    expect(WORKOUT_BALANCE.baseSpotSuccessChance).toBe(0.5);
    expect(BOSS_CAPTURE_TARGET).toEqual({
      home: 70,
      starter: 74,
      higher: 78,
    });
  });

  it('round-trips save state as JSON with no runtime objects', () => {
    const buddy = createBuddy();
    const save: SaveData = {
      ...createDefaultSaveData(),
      trainingFatigue: 12,
      workoutMomentum: 4,
      deloadTokens: 1,
      captureBattleSpeed: 'standard',
      machineTrainingHistory: {
        lastMachineId: starterMachine.id,
        repeatedUses: 2,
        masteryByMachineId: {},
      },
      hasStarterSet: true,
      unlockedZoneIds: [homeGym.id, starterGym.id],
      visitedZoneIds: [homeGym.id, starterGym.id],
      trainer: structuredClone(trainer),
      steroids: 3,
      activeIndex: 0,
      activeZoneId: starterGym.id,
      team: [buddy],
      seenDex: [buddy.creature.dex],
      caughtDex: [buddy.creature.dex],
      selectedMachineByZone: { [starterGym.id]: starterMachine.id },
      bossGameplayTimeMs: 5_000,
      bossSchedules: {
        [starterGym.id]: {
          readyAtGameplayMs: 10_000,
          defeated: 0,
          cycle: 0,
          lastRewardedCycle: 0,
        },
      },
      tutorialStep: 2,
      audio: { enabled: true, musicVolume: 0.5, sfxVolume: 0.82 },
      accessibility: {
        reducedMotion: false,
        screenShake: true,
        highContrast: false,
        sustainedInputMode: 'hold',
        textSpeed: 'standard',
      },
    };

    expect(JSON.parse(JSON.stringify(save))).toEqual(save);
    expect(JSON.stringify(save)).not.toContain('[object');
  });
});
