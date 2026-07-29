import { describe, expect, it } from 'vitest';

import {
  CAPTURE_BATTLE_SPEEDS,
  WILD_CAPTURE_CONTROL_TARGET,
} from '../game/content/captureBalance';
import {
  CAPTURE_MOVE_BY_ID,
  CAPTURE_MOVES,
} from '../game/content/captureMoves';
import { BUDDY_SPECIES } from '../game/content/buddies';
import {
  DEFAULT_TRAINER_APPEARANCE,
  cloneTrainerAppearance,
} from '../game/content/trainerAppearance';
import { GYMS, getDefaultGymMachine } from '../game/content/gyms';
import {
  calculateCaptureAttempt,
  calculateCaptureCounterState,
  calculateCaptureMove,
  calculateCaptureMovePrediction,
  calculateCaptureMuscleAlignment,
  calculateCaptureStartingStamina,
  calculateOpponentStartingStamina,
  selectCaptureOpponentIntent,
} from '../game/systems/captureBattles';
import {
  planCapturePartyPlacement,
  replacePartyBuddy,
} from '../game/systems/captureParty';
import { createRandomState } from '../game/systems/random';
import type {
  Buddy,
  CaptureMoveId,
  Encounter,
  Match,
  TrainerProfile,
} from '../game/types';

const starterGym = GYMS.find((gym) => gym.id === 'starter-a')!;
const species = BUDDY_SPECIES.find(
  (entry) => entry.primaryDiscipline === 'power',
)!;
const encounter: Encounter = {
  creature: species,
  level: 12,
  zoneId: starterGym.id,
  catchChance: 0.68,
  isBoss: false,
};
const trainer: TrainerProfile = {
  name: 'Seed Tester',
  appearance: cloneTrainerAppearance(DEFAULT_TRAINER_APPEARANCE),
  appearancePresets: [],
  skin: '#c68c65',
  hair: '#252525',
  top: '#2e66af',
  glove: '#f2bd56',
  shoes: '#1f2937',
  muscles: {
    shoulders: 11,
    chest: 10,
    arms: 9,
    triceps: 10,
    back: 8,
    core: 9,
    quads: 7,
    calves: 7,
  },
};

function buddy(id = 'active'): Buddy {
  return {
    id,
    nickname: `Buddy ${id}`,
    creature: species,
    level: 12,
    hp: 54,
    maxHp: 60,
    xp: 0,
    form: 15,
    mobility: 14,
    volume: 8,
  };
}

function match(input?: {
  meter?: number;
  playerStamina?: number;
  opponentStamina?: number;
  opponentMoveId?: CaptureMoveId;
  playerMoveHistory?: CaptureMoveId[];
  opponentMoveHistory?: CaptureMoveId[];
}): Match {
  const opponentMoveId = input?.opponentMoveId ?? 'grind';
  return {
    encounter,
    status: 'playing',
    round: 1,
    maxRounds: 5,
    meter: input?.meter ?? 50,
    playerStamina: input?.playerStamina ?? 86,
    opponentStamina: input?.opponentStamina ?? 88,
    playerMoveHistory: input?.playerMoveHistory ?? [],
    opponentMoveHistory: input?.opponentMoveHistory ?? [],
    opponentIntent: {
      moveId: opponentMoveId,
      tendencyId: 'anchor',
      tendencyLabel: 'Patient anchor',
      tell: 'The opponent settles into a readable grip.',
      confidence: 'clear',
    },
    lastRound: null,
    pendingCapturedBuddy: null,
    lines: [],
    isBossChallengeActive: false,
    bossChallengeMachineId: null,
    bossChallengeMachineName: null,
    bossChallengeMisses: 0,
    bossChallengeMatchStreak: 0,
    bossChallengeNearMisses: 0,
  };
}

describe('round-based capture decisions', () => {
  it('forms a complete counter triangle so no move is universally optimal', () => {
    expect(calculateCaptureCounterState('burst', 'grind')).toBe('counter');
    expect(calculateCaptureCounterState('grind', 'snap')).toBe('counter');
    expect(calculateCaptureCounterState('snap', 'burst')).toBe('counter');
    expect(calculateCaptureCounterState('burst', 'snap')).toBe('countered');
    expect(calculateCaptureCounterState('grind', 'burst')).toBe('countered');
    expect(calculateCaptureCounterState('snap', 'grind')).toBe('countered');
  });

  it('shows qualitative predictions without exposing a roll or exact chance', () => {
    const currentMatch = match({ opponentMoveId: 'grind' });
    const prediction = calculateCaptureMovePrediction({
      match: currentMatch,
      gym: starterGym,
      trainer,
      buddy: buddy(),
      trainingFatigue: 12,
      move: CAPTURE_MOVE_BY_ID.get('burst')!,
    });

    expect(prediction.counterState).toBe('counter');
    expect(['strong', 'favored', 'even', 'risky']).toContain(
      prediction.advantage,
    );
    expect(prediction.reasons).toContain('Answers the visible tell');
    expect(prediction).not.toHaveProperty('roll');
    expect(prediction).not.toHaveProperty('finalChance');
  });

  it('uses explicit muscles, stamina, repetition, and seeded variation', () => {
    const activeBuddy = buddy();
    const selectedMachine = getDefaultGymMachine(starterGym);
    const freshMatch = match({ opponentMoveId: 'grind' });
    const repeatedMatch = match({
      opponentMoveId: 'grind',
      playerMoveHistory: ['burst', 'burst'],
    });
    const move = CAPTURE_MOVE_BY_ID.get('burst')!;
    const first = calculateCaptureMove({
      match: freshMatch,
      gym: starterGym,
      selectedMachine,
      trainer,
      buddy: activeBuddy,
      trainingFatigue: 18,
      move,
      isForcedChallengeRecovery: false,
      challengeStressPercent: 0,
      randomState: createRandomState(904),
    });
    const replay = calculateCaptureMove({
      match: freshMatch,
      gym: starterGym,
      selectedMachine,
      trainer,
      buddy: activeBuddy,
      trainingFatigue: 18,
      move,
      isForcedChallengeRecovery: false,
      challengeStressPercent: 0,
      randomState: createRandomState(904),
    });
    const repeated = calculateCaptureMove({
      match: repeatedMatch,
      gym: starterGym,
      selectedMachine,
      trainer,
      buddy: activeBuddy,
      trainingFatigue: 18,
      move,
      isForcedChallengeRecovery: false,
      challengeStressPercent: 0,
      randomState: createRandomState(904),
    });

    expect(first).toEqual(replay);
    expect(first.playerStamina).toBeLessThan(freshMatch.playerStamina);
    expect(first.roundSummary.counterState).toBe('counter');
    expect(repeated.roundSummary.repetitionPenalty).toBeGreaterThan(0);
    expect(repeated.nextMeter).toBeLessThan(first.nextMeter);
    expect(calculateCaptureMuscleAlignment(trainer, move)).toBeGreaterThan(0.4);
    expect(
      calculateCaptureStartingStamina({
        buddy: activeBuddy,
        trainingFatigue: 100,
      }),
    ).toBeLessThan(
      calculateCaptureStartingStamina({
        buddy: activeBuddy,
        trainingFatigue: 0,
      }),
    );
  });

  it('produces deterministic discipline-driven opponent tells', () => {
    const input = {
      encounter,
      meter: 50,
      opponentStamina: calculateOpponentStartingStamina(encounter),
      playerMoveHistory: [] as CaptureMoveId[],
      opponentMoveHistory: [] as CaptureMoveId[],
      randomState: createRandomState(77),
    };
    const first = selectCaptureOpponentIntent(input);
    const replay = selectCaptureOpponentIntent(input);

    expect(first).toEqual(replay);
    expect(first.intent.tendencyId).toBe('surge');
    expect(first.intent.tell.length).toBeGreaterThan(20);
    expect(CAPTURE_MOVE_BY_ID.has(first.intent.moveId)).toBe(true);
  });
});

describe('capture outcomes and party handling', () => {
  function attempt(meter: number, seed: number) {
    const currentMatch = match({ meter });
    return calculateCaptureAttempt({
      match: currentMatch,
      gym: starterGym,
      machine: getDefaultGymMachine(starterGym),
      trainer,
      buddy: buddy(),
      meter,
      trainingFatigue: 10,
      randomState: createRandomState(seed),
    });
  }

  it('distinguishes escape and failed pin before any capture roll', () => {
    const escape = attempt(20, 42);
    const failedPin = attempt(WILD_CAPTURE_CONTROL_TARGET - 1, 42);

    expect(escape.outcome).toBe('escape');
    expect(escape.pinWon).toBe(false);
    expect(escape.randomState).toBe(createRandomState(42));
    expect(failedPin.outcome).toBe('failed-pin');
    expect(failedPin.pinWon).toBe(false);
  });

  it('distinguishes a pin win with near-capture from successful capture', () => {
    const nearCapture = attempt(92, 1_843);
    const captured = attempt(92, 1_972);

    expect(nearCapture.outcome).toBe('near-capture');
    expect(nearCapture.pinWon).toBe(true);
    expect(captured.outcome).toBe('captured');
    expect(captured.pinWon).toBe(true);
  });

  it('adds to an open party and requests an explicit choice for a full party', () => {
    const candidate = buddy('captured');
    const openTeam = Array.from({ length: 5 }, (_, index) =>
      buddy(`open-${index}`),
    );
    const fullTeam = Array.from({ length: 6 }, (_, index) =>
      buddy(`full-${index}`),
    );
    const added = planCapturePartyPlacement(openTeam, candidate, 6);
    const full = planCapturePartyPlacement(fullTeam, candidate, 6);

    expect(added.kind).toBe('added');
    expect(added.team).toHaveLength(6);
    expect(full.kind).toBe('full-party');
    expect(full.pendingBuddy).toBe(candidate);
    expect(full.team).toEqual(fullTeam);
    expect(full.team).not.toBe(fullTeam);
  });

  it('replaces only the chosen party position without mutating the party', () => {
    const fullTeam = Array.from({ length: 6 }, (_, index) =>
      buddy(`slot-${index}`),
    );
    const candidate = buddy('captured');
    const replaced = replacePartyBuddy(fullTeam, 2, candidate);

    expect(replaced[2]).toBe(candidate);
    expect(replaced[1]).toBe(fullTeam[1]);
    expect(fullTeam[2]!.id).toBe('slot-2');
    expect(() => replacePartyBuddy(fullTeam, 6, candidate)).toThrow(
      'Invalid party replacement index',
    );
  });
});

describe('capture pacing configuration', () => {
  it('keeps all optional animation beats concise and ordered', () => {
    expect(CAPTURE_BATTLE_SPEEDS.map((speed) => speed.id)).toEqual([
      'swift',
      'standard',
      'deliberate',
    ]);
    expect(CAPTURE_BATTLE_SPEEDS.map((speed) => speed.animationMs)).toEqual([
      160,
      280,
      440,
    ]);
    expect(Math.max(...CAPTURE_BATTLE_SPEEDS.map((speed) => speed.animationMs)))
      .toBeLessThan(500);
    expect(CAPTURE_MOVES).toHaveLength(3);
  });
});
