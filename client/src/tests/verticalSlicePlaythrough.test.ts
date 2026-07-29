import { describe, expect, it } from 'vitest';

import { BOSS_ROSTERS, getBossById } from '../game/content/bosses';
import { BUDDY_SPECIES, FANCY_NAMES } from '../game/content/buddies';
import { CAPTURE_MOVES } from '../game/content/captureMoves';
import { GYMS } from '../game/content/gyms';
import { getOverworldMap } from '../game/content/maps/journeyMaps';
import { WORLD_ROUTES } from '../game/content/routes';
import { TEAM_SIZE } from '../game/content/save';
import { TUTORIAL_STEPS } from '../game/content/tutorial';
import {
  JOURNEY_GYM_LOCATION_IDS,
  JOURNEY_GYM_ZONE_IDS,
  JOURNEY_ROUTE_LOCATION_IDS,
  getAccessibleLocationIds,
} from '../game/content/worldGraph';
import { createDefaultSaveData } from '../game/save/saveDefaults';
import {
  importSaveJson,
  loadGameSave,
  writeGameSave,
  type SaveStorage,
} from '../game/save/saveService';
import {
  createBossEncounter,
  getBossChallengeProfile,
} from '../game/systems/bossChallenges';
import {
  claimBossSchedule,
  createBossSchedule,
  getBossAvailability,
  markBossCycleRewarded,
} from '../game/systems/bossScheduling';
import { createCapturedBuddy } from '../game/systems/buddyProgression';
import {
  calculateCaptureAttempt,
  calculateCaptureStartingStamina,
  calculateOpponentStartingStamina,
  selectCaptureOpponentIntent,
} from '../game/systems/captureBattles';
import { planCapturePartyPlacement } from '../game/systems/captureParty';
import { calculateRestRecovery } from '../game/systems/fatigueRecovery';
import {
  createOverworldState,
  resolveOverworldAction,
} from '../game/systems/overworldMovement';
import { createRandomState } from '../game/systems/random';
import {
  applyExperienceReward,
  getExperienceNeeded,
  resolveBossVictoryReward,
} from '../game/systems/rewards';
import { createWildEncounter } from '../game/systems/routeEncounters';
import {
  createTrainerCreationDraft,
  saveTrainerProfileToJourney,
  validateTrainerCreationDraft,
} from '../game/systems/trainerCreation';
import { unlockAdjacentZones } from '../game/systems/unlockProgression';
import {
  calculateWorkoutResolution,
  createWorkoutSession,
  resolveWorkoutRep,
} from '../game/systems/workoutResolution';
import type {
  Encounter,
  GymZoneId,
  Match,
  OverworldLocationId,
  SaveData,
  WorkoutSession,
} from '../game/types';
import { createRepresentativeSaveFixtures } from './fixtures/saveFixtures';

class MemoryStorage implements SaveStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

function createMatch(encounter: Encounter, randomSeed: number): Match {
  const opponent = selectCaptureOpponentIntent({
    encounter,
    meter: 50,
    opponentStamina: calculateOpponentStartingStamina(encounter),
    playerMoveHistory: [],
    opponentMoveHistory: [],
    randomState: createRandomState(randomSeed),
  });
  return {
    encounter,
    status: 'playing',
    round: 1,
    maxRounds: 6,
    meter: 92,
    playerStamina: 100,
    opponentStamina: calculateOpponentStartingStamina(encounter),
    playerMoveHistory: [],
    opponentMoveHistory: [],
    opponentIntent: opponent.intent,
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

function completePerfectWorkout(
  save: SaveData,
  randomSeed: number,
) {
  const homeGym = GYMS.find(({ id }) => id === 'home')!;
  const buddy = save.team[save.activeIndex]!;
  const machine = homeGym.machines[0]!;
  const created = createWorkoutSession({
    buddy,
    machine,
    trainer: save.trainer,
    gymKind: homeGym.type,
    trainingFatigue: save.trainingFatigue,
    workoutMomentum: save.workoutMomentum,
    deloadTokens: save.deloadTokens,
    selectedLoad: 'steady',
    startedAt: 1_000,
    randomState: createRandomState(randomSeed),
  });
  let session: WorkoutSession = created.session;
  while (!session.resolved) {
    session = resolveWorkoutRep(
      session,
      session.repStartedAt +
        session.repDurationMs * session.timingTarget,
    );
  }
  return calculateWorkoutResolution({
    session,
    buddy,
    machine,
    trainer: save.trainer,
    steroids: save.steroids,
    workoutMomentum: save.workoutMomentum,
    trainingFatigue: save.trainingFatigue,
  });
}

function findSuccessfulCaptureSeed(
  match: Match,
  save: SaveData,
) {
  const gym = GYMS.find(({ id }) => id === 'starter-a')!;
  const buddy = save.team[save.activeIndex]!;
  for (let seed = 1; seed <= 10_000; seed += 1) {
    const result = calculateCaptureAttempt({
      match,
      gym,
      machine: gym.machines[0]!,
      trainer: save.trainer,
      buddy,
      meter: match.meter,
      trainingFatigue: save.trainingFatigue,
      randomState: createRandomState(seed),
    });
    if (result.outcome === 'captured') return { result, seed };
  }
  throw new Error('No successful seeded capture found in the bounded fixture range.');
}

function runVerticalSlice(randomSeed: number) {
  let save = createDefaultSaveData({
    accessibility: {
      reducedMotion: false,
      screenShake: true,
      highContrast: false,
      sustainedInputMode: 'hold',
      textSpeed: 'instant',
    },
  });
  const draft = {
    ...createTrainerCreationDraft(save.trainer),
    name: 'Slice Runner',
  };
  expect(validateTrainerCreationDraft(draft)).toEqual([]);
  save = {
    ...saveTrainerProfileToJourney(save, draft),
    hasStarterSet: true,
    tutorialStep: TUTORIAL_STEPS.length,
  };

  const workout = completePerfectWorkout(save, randomSeed);
  const trainedBuddy = {
    ...workout.buddy,
    xp: getExperienceNeeded(workout.buddy.level) - 1,
  };
  const levelUp = applyExperienceReward(trainedBuddy, 1);
  save = {
    ...save,
    team: save.team.map((buddy, index) =>
      index === save.activeIndex ? levelUp.buddy : buddy,
    ),
    trainer: workout.trainer,
    trainingFatigue: workout.trainingFatigue,
    workoutMomentum: workout.workoutMomentum,
  };

  const routeEntry = resolveOverworldAction({
    state: {
      ...createOverworldState('home-gym'),
      position: { x: 27, y: 21 },
      facing: 'down',
    },
    action: 'interact',
    now: 2_000,
    progression: { visitedZoneIds: ['home'], defeatedGymIds: [] },
  });
  const starterArrival = resolveOverworldAction({
    state: {
      ...routeEntry.state,
      position: { x: 50, y: 10 },
      facing: 'right',
      nextMoveAt: 0,
    },
    action: 'move-right',
    now: 3_000,
    progression: { visitedZoneIds: ['home'], defeatedGymIds: [] },
  });
  expect(routeEntry.state.locationId).toBe('route-1');
  expect(starterArrival.state.locationId).toBe('starter-gym-a');

  const starterGym = GYMS.find(({ id }) => id === 'starter-a')!;
  const unlockedZoneIds = unlockAdjacentZones({
    known: save.unlockedZoneIds,
    zoneId: 'starter-a',
    routes: WORLD_ROUTES,
    fallback: ['home'],
    validZoneIds: GYMS.map(({ id }) => id),
    startingZoneId: 'home',
  });
  save = {
    ...save,
    activeZoneId: starterGym.id,
    visitedZoneIds: ['home', 'starter-a'],
    unlockedZoneIds,
    trainingFatigue: workout.trainingFatigue + 0.3,
  };

  const wild = createWildEncounter({
    gym: starterGym,
    species: BUDDY_SPECIES,
    randomState: createRandomState(randomSeed + 1),
  });
  const captureMatch = createMatch(wild.encounter, randomSeed + 2);
  const capture = findSuccessfulCaptureSeed(captureMatch, save);
  const captured = createCapturedBuddy({
    species: wild.encounter.creature,
    level: wild.encounter.level,
    capturedAtMs: 4_000,
    names: FANCY_NAMES,
    randomState: capture.result.randomState,
  });
  const placement = planCapturePartyPlacement(
    save.team,
    captured.buddy,
    TEAM_SIZE,
  );
  expect(placement.kind).toBe('added');
  save = {
    ...save,
    team: placement.team,
    seenDex: [...new Set([...save.seenDex, wild.encounter.creature.dex])],
    caughtDex: [...new Set([...save.caughtDex, wild.encounter.creature.dex])],
  };

  const bossSchedule = createBossSchedule(0);
  expect(getBossAvailability(bossSchedule, 10_000).status).toBe('ready');
  const roster = BOSS_ROSTERS.find(({ gymId }) => gymId === starterGym.id)!;
  const bossEncounter = createBossEncounter({
    gym: starterGym,
    bosses: roster.bosses,
    species: BUDDY_SPECIES,
    scheduleCycle: 1,
    randomState: createRandomState(randomSeed + 3),
  });
  const claimed = claimBossSchedule({
    schedule: bossSchedule,
    gameplayTimeMs: 10_000,
    nextIntervalMs: 300_000,
    bossId: bossEncounter.encounter.bossId!,
  });
  const rewardedSchedule = markBossCycleRewarded(
    claimed.schedule,
    claimed.cycle,
  );
  const boss = getBossById(bossEncounter.encounter.bossId);
  if (!boss) throw new Error('Seeded starter boss content was not found.');
  const reward = resolveBossVictoryReward({
    rewardTable: boss.rewardTable,
    team: save.team,
    activeIndex: save.activeIndex,
    trainingFatigue: save.trainingFatigue,
    workoutMomentum: save.workoutMomentum,
    deloadTokens: save.deloadTokens,
    randomState: bossEncounter.randomState,
  });
  expect(getBossChallengeProfile(starterGym.type, bossEncounter.encounter).maxRounds)
    .toBeGreaterThanOrEqual(4);
  expect(rewardedSchedule.awarded).toBe(true);

  const recovery = calculateRestRecovery({
    buddy: reward.team[save.activeIndex]!,
    trainingFatigue: reward.trainingFatigue,
    deloadTokens: reward.deloadTokens,
  });
  save = {
    ...save,
    team: reward.team.map((buddy, index) =>
      index === save.activeIndex ? recovery.buddy : buddy,
    ),
    trainingFatigue: recovery.trainingFatigue,
    workoutMomentum: reward.workoutMomentum,
    deloadTokens: recovery.deloadTokens,
    bossSchedules: {
      ...save.bossSchedules,
      'starter-a': rewardedSchedule.schedule,
    },
  };

  const storage = new MemoryStorage();
  const write = writeGameSave(storage, save, {
    now: new Date('2026-01-15T12:00:00.000Z'),
  });
  const loaded = loadGameSave(storage);
  return {
    captureSeed: capture.seed,
    caughtDex: loaded.save.caughtDex,
    finalBossDefeated: loaded.save.bossSchedules['starter-a']?.defeated,
    finalBuddyLevel: loaded.save.team[loaded.save.activeIndex]?.level,
    finalFatigue: loaded.save.trainingFatigue,
    locationId: starterArrival.state.locationId,
    saveSource: loaded.source,
    teamSize: loaded.save.team.length,
    trainerName: loaded.save.trainer.name,
    workoutOutcome: workout.outcome,
    writeOk: write.ok,
  };
}

describe('complete deterministic vertical-slice playthrough', () => {
  it('plays onboarding, training, Route 1, capture, boss completion, recovery, and save/load', () => {
    const first = runVerticalSlice(2_026);
    const replay = runVerticalSlice(2_026);

    expect(first).toEqual(replay);
    expect(first).toMatchObject({
      finalBossDefeated: 1,
      locationId: 'starter-gym-a',
      saveSource: 'primary',
      trainerName: 'Slice Runner',
      workoutOutcome: 'success',
      writeOk: true,
    });
    expect(first.teamSize).toBeGreaterThan(
      createDefaultSaveData().team.length,
    );
    expect(first.finalBuddyLevel).toBeGreaterThan(
      createDefaultSaveData().team[0]!.level,
    );
  });
});

describe('representative save fixtures', () => {
  it('keeps current, v12, full-party, boss-ready, and corrupted fixtures testable', () => {
    const fixtures = createRepresentativeSaveFixtures();

    expect(importSaveJson(JSON.stringify(fixtures.currentNew)).ok).toBe(true);
    expect(importSaveJson(JSON.stringify(fixtures.legacyV12)).ok).toBe(true);
    expect(importSaveJson(fixtures.corruptedPrimary).ok).toBe(false);
    expect(fixtures.fullParty.team).toHaveLength(TEAM_SIZE);
    expect(
      getBossAvailability(
        fixtures.starterBossReady.bossSchedules['starter-a']!,
        fixtures.starterBossReady.bossGameplayTimeMs,
      ).status,
    ).toBe('ready');
  });

  it('covers full-party capture handling without mutating the fixture team', () => {
    const fixtures = createRepresentativeSaveFixtures();
    const candidate = {
      ...fixtures.fullParty.team[0]!,
      id: 'pending-fixture-buddy',
    };
    const placement = planCapturePartyPlacement(
      fixtures.fullParty.team,
      candidate,
      TEAM_SIZE,
    );

    expect(placement.kind).toBe('full-party');
    expect(placement.pendingBuddy).toBe(candidate);
    expect(placement.team).toEqual(fixtures.fullParty.team);
    expect(placement.team).not.toBe(fixtures.fullParty.team);
  });
});

describe('complete world reachability', () => {
  it('reaches every gym and never loses access to a previously reachable location', () => {
    let previousReachable = new Set<OverworldLocationId>(['home-gym']);
    const visitedZoneIds: GymZoneId[] = ['home'];
    const defeatedGymIds: GymZoneId[] = [];

    for (const zoneId of JOURNEY_GYM_ZONE_IDS) {
      if (!visitedZoneIds.includes(zoneId)) visitedZoneIds.push(zoneId);
      if (!defeatedGymIds.includes(zoneId)) defeatedGymIds.push(zoneId);
      const reachable = getAccessibleLocationIds('home-gym', {
        visitedZoneIds,
        defeatedGymIds,
      });
      previousReachable.forEach((locationId) => {
        expect(reachable.has(locationId)).toBe(true);
      });
      previousReachable = reachable;
    }

    const everyJourneyLocation: OverworldLocationId[] = [
      ...JOURNEY_GYM_LOCATION_IDS,
      ...JOURNEY_ROUTE_LOCATION_IDS,
    ];
    everyJourneyLocation.forEach((locationId) => {
      expect(previousReachable.has(locationId)).toBe(true);
      expect(getOverworldMap(locationId)).toBeDefined();
    });
  });
});
