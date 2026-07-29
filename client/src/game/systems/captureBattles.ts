import {
  BOSS_CAPTURE_READINESS_SCALE,
  BOSS_CAPTURE_WEIGHTS,
  BOSS_MATCH_FATIGUE_SCALE,
  BOSS_METER_CATCH_SCALE,
  BOSS_POWER_BONUS_SCALE,
  BUDDY_STAT_LIMITS,
  FATIGUE_BALANCE,
} from '../content/balance';
import {
  CAPTURE_DISCIPLINE_TENDENCY,
  CAPTURE_ESCAPE_METER,
  CAPTURE_METER_MAX,
  CAPTURE_METER_MIN,
  CAPTURE_MOVE_TELLS,
  CAPTURE_OPPONENT_TENDENCIES,
  CAPTURE_ROUND_RULES,
  CAPTURE_STAMINA_MAX,
  CAPTURE_ZONE_DIFFICULTY,
  WILD_CAPTURE_CONTROL_TARGET,
} from '../content/captureBalance';
import { getBossById } from '../content/bosses';
import { CAPTURE_MOVE_BY_ID } from '../content/captureMoves';
import { getDefaultGymMachine } from '../content/gyms';
import { MAX_MUSCLE_LEVEL } from '../content/trainer';
import type {
  Buddy,
  CaptureCounterState,
  CaptureMove,
  CaptureMoveId,
  CaptureMovePrediction,
  CaptureOpponentIntent,
  Encounter,
  GymArea,
  GymMachine,
  Match,
  TrainerProfile,
} from '../types';
import {
  calculateBossCaptureTarget,
  calculateBossChallengeCapturePenalty,
  calculateBossChallengePressure,
  calculateBossChallengeSummary,
  calculateBossMoveState,
  getBossChallengeMachine,
} from './bossChallenges';
import { applyFatigueChange } from './fatigueRecovery';
import { clamp, clamp01 } from './math';
import { calculateChallengeEffectiveLevel } from './progressionModel';
import { nextRandom, randomInt, type RandomState } from './random';
import { calculateMachineFocusScore } from './trainerProgression';

export function calculateTrainerArenaPressure(
  trainer: TrainerProfile,
  machine: GymMachine | null,
  gym: GymArea,
) {
  const activeMachine = machine ?? getDefaultGymMachine(gym);
  const focusScore = calculateMachineFocusScore(activeMachine, trainer);
  const overallBody =
    Object.values(trainer.muscles).reduce(
      (total, value) => total + value / MAX_MUSCLE_LEVEL,
      0,
    ) / 8;
  const zoneScale =
    gym.type === 'higher' ? 1.18 : gym.type === 'starter' ? 1.06 : 0.95;
  const base =
    10 + focusScore * 18 + overallBody * 17 + (zoneScale - 1) * 12;
  return clamp(Math.round(base), 0, 36);
}

export function calculateMatchReadinessModifier(
  trainer: TrainerProfile,
  buddy: Buddy,
  gym: GymArea,
) {
  const buddyFormRatio = clamp01(buddy.form / BUDDY_STAT_LIMITS.form);
  const buddyMobilityRatio = clamp01(
    buddy.mobility / BUDDY_STAT_LIMITS.mobility,
  );
  const buddyVolumeRatio = clamp01(buddy.volume / BUDDY_STAT_LIMITS.volume);
  const trainerForm =
    Object.values(trainer.muscles).reduce(
      (sum, value) => sum + value / MAX_MUSCLE_LEVEL,
      0,
    ) / 8;
  const buddyHpRatio = clamp01(buddy.hp / Math.max(1, buddy.maxHp));
  const trainerEdge = Math.round(
    (trainerForm - 0.42) *
      22 *
      (gym.type === 'higher' ? 1.15 : gym.type === 'starter' ? 1.02 : 1),
  );
  const buddyReadinessEdge = Math.round(
    (buddyFormRatio - 0.55) * 12 +
      (buddyMobilityRatio - 0.5) * 8 +
      (buddyVolumeRatio - 0.5) * 5,
  );
  const buddyEdge = clamp(
    Math.round((buddyHpRatio - 0.5) * 10 + buddyReadinessEdge),
    -12,
    12,
  );
  return {
    trainerForm,
    trainerEdge: clamp(trainerEdge, -12, 12),
    buddyEdge: clamp(buddyEdge, -8, 8),
    total: clamp(trainerEdge + buddyEdge, -18, 18),
    zoneType: gym.type,
  };
}

export function calculateBuddyArenaPressure(buddy: Buddy, gymId?: string) {
  const hpRatio = clamp01(buddy.hp / Math.max(1, buddy.maxHp));
  const formRatio = clamp01(buddy.form / BUDDY_STAT_LIMITS.form);
  const mobilityRatio = clamp01(buddy.mobility / BUDDY_STAT_LIMITS.mobility);
  const volumeRatio = clamp01(buddy.volume / BUDDY_STAT_LIMITS.volume);
  const powerEdge = buddy.creature.power * 0.5;
  const healthEdge = hpRatio * 10;
  const fatiguePenalty = (1 - hpRatio) * 6;
  const effectiveLevel = gymId
    ? calculateChallengeEffectiveLevel(buddy.level, gymId)
    : buddy.level;
  return clamp(
    Math.round(
      effectiveLevel * 1.4 +
        powerEdge +
        healthEdge +
        formRatio * 12 +
        mobilityRatio * 10 +
        volumeRatio * 6 -
        fatiguePenalty,
    ),
    8,
    58,
  );
}

function captureMove(moveId: CaptureMoveId) {
  const move = CAPTURE_MOVE_BY_ID.get(moveId);
  if (!move) {
    throw new Error(`Unknown capture move "${moveId}".`);
  }
  return move;
}

function repeatedMoveCount(
  history: readonly CaptureMoveId[],
  moveId: CaptureMoveId,
) {
  let count = 0;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index] !== moveId) break;
    count += 1;
  }
  return count;
}

export function calculateCaptureCounterState(
  playerMoveId: CaptureMoveId,
  opponentMoveId: CaptureMoveId,
): CaptureCounterState {
  const playerMove = captureMove(playerMoveId);
  if (playerMove.counters === opponentMoveId) return 'counter';
  if (playerMove.counteredBy === opponentMoveId) return 'countered';
  return 'neutral';
}

export function calculateCaptureMuscleAlignment(
  trainer: TrainerProfile,
  move: CaptureMove,
) {
  return clamp01(
    move.trainerMuscles.reduce(
      (sum, muscle) =>
        sum +
        clamp01(trainer.muscles[muscle.id] / MAX_MUSCLE_LEVEL) *
          muscle.weight,
      0,
    ),
  );
}

export function calculateBuddyCaptureAlignment(
  buddy: Buddy,
  move: CaptureMove,
) {
  const species = buddy.creature;
  const disciplineMatch =
    Number(move.buddyDisciplines.includes(species.primaryDiscipline)) +
    Number(
      Boolean(
        species.secondaryDiscipline &&
          move.buddyDisciplines.includes(species.secondaryDiscipline),
      ),
    ) *
      0.55;
  const disciplineRatio = clamp01(disciplineMatch / 1.55);
  const formRatio = clamp01(buddy.form / BUDDY_STAT_LIMITS.form);
  const mobilityRatio = clamp01(
    buddy.mobility / BUDDY_STAT_LIMITS.mobility,
  );
  const volumeRatio = clamp01(buddy.volume / BUDDY_STAT_LIMITS.volume);
  const speciesSkill =
    move.id === 'burst'
      ? species.power * 0.55 + species.stamina * 0.3 + species.mobility * 0.15
      : move.id === 'grind'
        ? species.control * 0.5 + species.stamina * 0.3 + species.form * 0.2
        : species.mobility * 0.45 +
          species.control * 0.3 +
          species.power * 0.25;
  const speciesRatio = clamp01(speciesSkill / 24);
  return clamp01(
    disciplineRatio * 0.34 +
      speciesRatio * 0.34 +
      formRatio * 0.12 +
      mobilityRatio * 0.12 +
      volumeRatio * 0.08,
  );
}

export function calculateCaptureStartingStamina(input: {
  buddy: Buddy;
  trainingFatigue: number;
}) {
  const speciesStamina = input.buddy.creature.stamina;
  const fatigueRatio = clamp01(
    input.trainingFatigue / FATIGUE_BALANCE.maximum,
  );
  const restedStamina = clamp(
    Math.round(
      46 + speciesStamina * 0.55 + input.buddy.volume * 0.85,
    ),
    62,
    CAPTURE_STAMINA_MAX,
  );
  return clamp(
    Math.round(restedStamina - fatigueRatio * 24),
    48,
    CAPTURE_STAMINA_MAX,
  );
}

export function calculateOpponentStartingStamina(encounter: Encounter) {
  return clamp(
    Math.round(
      62 +
        encounter.creature.stamina * 1.15 +
        encounter.level * 0.35 +
        encounter.creature.captureDifficulty * 2,
    ),
    54,
    CAPTURE_STAMINA_MAX,
  );
}

function weightedOpponentMove(
  weights: Record<CaptureMoveId, number>,
  randomState: RandomState,
) {
  const total = Object.values(weights).reduce(
    (sum, weight) => sum + Math.max(0, weight),
    0,
  );
  const roll = nextRandom(randomState);
  let cursor = roll.value * total;
  for (const moveId of ['burst', 'grind', 'snap'] as const) {
    cursor -= Math.max(0, weights[moveId]);
    if (cursor <= 0) {
      return { moveId, randomState: roll.randomState };
    }
  }
  return { moveId: 'grind' as const, randomState: roll.randomState };
}

/** Produces a seeded opponent plan from species tendencies and recent player choices. */
export function selectCaptureOpponentIntent(input: {
  encounter: Encounter;
  meter: number;
  opponentStamina: number;
  playerMoveHistory: readonly CaptureMoveId[];
  opponentMoveHistory: readonly CaptureMoveId[];
  randomState: RandomState;
}) {
  const tendencyId =
    CAPTURE_DISCIPLINE_TENDENCY[input.encounter.creature.primaryDiscipline] ??
    'balanced';
  const tendency = CAPTURE_OPPONENT_TENDENCIES[tendencyId];
  const weights = { ...tendency.moveWeights };
  const boss = getBossById(input.encounter.bossId);
  if (boss) {
    weights[boss.preferredTactic] += 0.36;
  }
  const lastPlayerMove =
    input.playerMoveHistory[input.playerMoveHistory.length - 1];
  const repeatedPlayerMove =
    lastPlayerMove &&
    repeatedMoveCount(input.playerMoveHistory, lastPlayerMove) >= 2;

  if (repeatedPlayerMove && lastPlayerMove) {
    weights[captureMove(lastPlayerMove).counteredBy] += 0.34;
  }
  if (input.meter >= 70) {
    weights.burst += 0.16;
    weights.snap += 0.08;
  } else if (input.meter <= 34) {
    weights.grind += 0.18;
  }
  if (input.opponentStamina < 34) {
    weights.burst *= 0.35;
    weights.grind += 0.18;
  }
  const lastOpponentMove =
    input.opponentMoveHistory[input.opponentMoveHistory.length - 1];
  if (
    lastOpponentMove &&
    repeatedMoveCount(input.opponentMoveHistory, lastOpponentMove) >= 2
  ) {
    weights[lastOpponentMove] *= 0.48;
  }

  const selected = weightedOpponentMove(weights, input.randomState);
  const totalWeight = Object.values(weights).reduce(
    (sum, weight) => sum + weight,
    0,
  );
  const confidence =
    repeatedPlayerMove ||
    weights[selected.moveId] / Math.max(0.001, totalWeight) >= 0.48
      ? 'clear'
      : 'mixed';
  const intent: CaptureOpponentIntent = {
    moveId: selected.moveId,
    tendencyId,
    tendencyLabel: boss
      ? `${boss.name}: ${tendency.label}`
      : tendency.label,
    tell: CAPTURE_MOVE_TELLS[selected.moveId][confidence],
    confidence,
  };
  return {
    intent,
    randomState: selected.randomState,
  };
}

function captureRepetitionPenalty(
  history: readonly CaptureMoveId[],
  moveId: CaptureMoveId,
) {
  return clamp(
    Math.max(0, repeatedMoveCount(history, moveId) - 1) *
      CAPTURE_ROUND_RULES.repeatPenaltyStep,
    0,
    CAPTURE_ROUND_RULES.repeatPenaltyMaximum,
  );
}

/** Returns a qualitative forecast without consuming RNG or exposing the final roll. */
export function calculateCaptureMovePrediction(input: {
  match: Match;
  gym: GymArea;
  trainer: TrainerProfile;
  buddy: Buddy;
  trainingFatigue: number;
  move: CaptureMove;
  selectedMachine?: GymMachine | null;
}): CaptureMovePrediction {
  const counterState = calculateCaptureCounterState(
    input.move.id,
    input.match.opponentIntent.moveId,
  );
  const muscleAlignment = calculateCaptureMuscleAlignment(
    input.trainer,
    input.move,
  );
  const buddyAlignment = calculateBuddyCaptureAlignment(
    input.buddy,
    input.move,
  );
  const repeatPenalty = captureRepetitionPenalty(
    input.match.playerMoveHistory,
    input.move.id,
  );
  const staminaAfter = clamp(
    input.match.playerStamina -
      input.move.staminaCost +
      CAPTURE_ROUND_RULES.playerRecovery,
    0,
    CAPTURE_STAMINA_MAX,
  );
  const fatigueRatio = clamp01(
    input.trainingFatigue / FATIGUE_BALANCE.maximum,
  );
  const zonePressure = CAPTURE_ZONE_DIFFICULTY[input.gym.type].opponentPressure;
  const isBossChallenge = Boolean(
    input.match.encounter.isBoss &&
      input.match.encounter.bossChallengeMachineId &&
      input.match.encounter.bossRequiredMoveId,
  );
  const bossMachineAligned = Boolean(
    isBossChallenge &&
      input.selectedMachine?.id ===
        input.match.encounter.bossChallengeMachineId,
  );
  const bossMoveAligned = Boolean(
    isBossChallenge &&
      input.move.id === input.match.encounter.bossRequiredMoveId,
  );
  const bossActionScore = !isBossChallenge
    ? 0
    : bossMachineAligned && bossMoveAligned
      ? 3.2
      : bossMachineAligned || bossMoveAligned
        ? -0.8
        : -2.4;
  const score =
    (counterState === 'counter'
      ? 3.5
      : counterState === 'countered'
        ? -3.5
        : 0) +
    (muscleAlignment - 0.5) * 4.5 +
    (buddyAlignment - 0.5) * 4.5 +
    (staminaAfter >= 42 ? 1 : staminaAfter < 18 ? -2.5 : 0) -
    repeatPenalty * 0.32 -
    fatigueRatio * 2 -
    zonePressure * 0.12 +
    bossActionScore;
  const advantage =
    score >= 3.2
      ? 'strong'
      : score >= 1
        ? 'favored'
        : score <= -2.2
          ? 'risky'
          : 'even';
  const reasons: string[] = [];
  if (isBossChallenge && bossMachineAligned && bossMoveAligned) {
    reasons.push('Completes the required boss action');
  } else if (isBossChallenge && bossMoveAligned) {
    reasons.push('Right move, wrong challenge machine');
  } else if (isBossChallenge && bossMachineAligned) {
    reasons.push('Right machine, wrong required move');
  }
  if (counterState === 'counter') reasons.push('Answers the visible tell');
  if (counterState === 'countered') reasons.push('The tell threatens this move');
  if (muscleAlignment >= 0.66) reasons.push('Trainer alignment is strong');
  if (buddyAlignment >= 0.66) reasons.push('Buddy discipline fits');
  if (repeatPenalty > 0) reasons.push('Opponent is adapting to repetition');
  if (staminaAfter < 18) reasons.push('Would leave stamina nearly spent');
  if (reasons.length === 0) reasons.push('No clear matchup edge');
  return {
    moveId: input.move.id,
    advantage,
    counterState,
    staminaAfter,
    staminaTone:
      staminaAfter >= 42 ? 'ready' : staminaAfter >= 18 ? 'strained' : 'spent',
    reasons: reasons.slice(0, 3),
  };
}

export function calculateMatchCatchModifier(input: {
  encounter: Encounter;
  gym: GymArea;
  machine: GymMachine | null;
  trainer: TrainerProfile;
  buddy: Buddy;
  meter: number;
  trainingFatigue?: number;
}) {
  const trainerPressure = calculateTrainerArenaPressure(
    input.trainer,
    input.machine,
    input.gym,
  );
  const buddyPressure = calculateBuddyArenaPressure(
    input.buddy,
    input.encounter.zoneId,
  );
  const fatiguePenalty =
    clamp01((input.trainingFatigue ?? 0) / FATIGUE_BALANCE.maximum) *
    3 *
    BOSS_MATCH_FATIGUE_SCALE[input.gym.type];
  const bossPressure = calculateBossChallengePressure(
    input.encounter,
    input.gym,
    input.machine,
  );
  const bossPenalty = input.encounter.isBoss
    ? input.encounter.bossPowerBonus ?? 0
    : 0;
  const profile = BOSS_CAPTURE_WEIGHTS[input.gym.type];
  const readiness = calculateMatchReadinessModifier(
    input.trainer,
    input.buddy,
    input.gym,
  );
  const raw =
    trainerPressure * profile.trainerWeight +
    buddyPressure * profile.buddyWeight +
    bossPressure -
    bossPenalty *
      (input.encounter.isBoss ? profile.bossPenaltyScale : 0) -
    fatiguePenalty +
    readiness.total;
  return {
    raw,
    meterDelta: clamp((input.meter - 50) / 150, -0.25, 0.22),
    bossPressure,
    trainerPressure,
    buddyPressure,
    trainerEdge: readiness.trainerEdge,
    buddyEdge: readiness.buddyEdge,
    readinessTotal: readiness.total,
  };
}

/** Input: capture state and RNG state. Output: mathematical outcome, chance breakdown, and next RNG state. */
export function calculateCaptureAttempt(input: {
  match: Match;
  gym: GymArea;
  machine: GymMachine | null;
  trainer: TrainerProfile;
  buddy: Buddy;
  meter: number;
  trainingFatigue: number;
  randomState: RandomState;
}) {
  const machine = input.machine ?? getDefaultGymMachine(input.gym);
  const modifier = calculateMatchCatchModifier({
    encounter: input.match.encounter,
    gym: input.gym,
    machine,
    trainer: input.trainer,
    buddy: input.buddy,
    meter: input.meter,
    trainingFatigue: input.trainingFatigue,
  });
  const penalty = calculateBossChallengeCapturePenalty({
    match: input.match,
    gym: input.gym,
    activeMachine: machine,
    meter: input.meter,
    buddy: input.buddy,
  });
  const captureTarget = calculateBossCaptureTarget({
    gym: input.gym,
    encounter: input.match.encounter,
    isChallengeAligned: penalty.isActive ? penalty.isAligned : null,
    missCount: input.match.bossChallengeMisses,
    nearMissCount: input.match.bossChallengeNearMisses,
    matchStreak: input.match.bossChallengeMatchStreak,
    buddy: input.buddy,
  });
  const profile = BOSS_CAPTURE_WEIGHTS[input.gym.type];
  const base = clamp(
    input.match.encounter.catchChance + modifier.meterDelta,
    0.08,
    0.97,
  );
  const bonus = clamp(
    modifier.raw / BOSS_METER_CATCH_SCALE[input.gym.type],
    -0.24,
    0.32,
  );
  const readinessBonus = clamp(
    modifier.readinessTotal / BOSS_CAPTURE_READINESS_SCALE[input.gym.type],
    -0.12,
    0.12,
  );
  const finalChance = clamp(
    base +
      bonus +
      readinessBonus -
      (input.match.encounter.isBoss &&
      input.match.isBossChallengeActive
        ? penalty.penalty
        : 0),
    profile.minCatch,
    profile.maxCatch,
  );
  const passHold = input.match.encounter.isBoss
    ? input.meter >= captureTarget
    : input.meter >= WILD_CAPTURE_CONTROL_TARGET;

  if (!passHold) {
    return {
      outcome:
        input.meter <= CAPTURE_ESCAPE_METER
          ? ('escape' as const)
          : ('failed-pin' as const),
      pinWon: false,
      finalChance,
      captureTarget,
      modifier,
      penalty,
      randomState: input.randomState,
    };
  }

  const roll = nextRandom(input.randomState);
  return {
    outcome:
      roll.value > finalChance
        ? ('near-capture' as const)
        : ('captured' as const),
    pinWon: true,
    finalChance,
    captureTarget,
    modifier,
    penalty,
    roll: roll.value,
    randomState: roll.randomState,
  };
}

function calculateMatchMovePenalty(
  moveMismatchPenalty: number,
  isChallengeAction: boolean,
  nearMisses: number,
  streak: number,
) {
  if (isChallengeAction) return 0;
  const nearPenalty = clamp(Math.max(0, nearMisses - 1) * 1.1, 0, 8);
  const streakShield = Math.min(streak, 3) * 1.2;
  return clamp(
    Math.max(1, moveMismatchPenalty) + nearPenalty - streakShield,
    0,
    16,
  );
}

/** Input: active match, move, combatants, and RNG state. Output: one immutable round result. */
export function calculateCaptureMove(input: {
  match: Match;
  gym: GymArea;
  selectedMachine: GymMachine | null;
  trainer: TrainerProfile;
  buddy: Buddy;
  trainingFatigue: number;
  move: CaptureMove;
  isForcedChallengeRecovery: boolean;
  challengeStressPercent: number;
  randomState: RandomState;
}) {
  const selectedMachine =
    input.selectedMachine ?? getDefaultGymMachine(input.gym);
  const modifier = calculateMatchCatchModifier({
    encounter: input.match.encounter,
    gym: input.gym,
    machine: selectedMachine,
    trainer: input.trainer,
    buddy: input.buddy,
    meter: input.match.meter,
    trainingFatigue: input.trainingFatigue,
  });
  const bossState = calculateBossMoveState({
    match: input.match,
    gym: input.gym,
    selectedMachine,
    move: input.move,
    buddy: input.buddy,
    isForcedRecovery: input.isForcedChallengeRecovery,
    challengeStressPercent: input.challengeStressPercent,
  });
  const opponentMove = captureMove(input.match.opponentIntent.moveId);
  const counterState = calculateCaptureCounterState(
    input.move.id,
    opponentMove.id,
  );
  const fatigueRatio = clamp01(
    input.trainingFatigue / FATIGUE_BALANCE.maximum,
  );
  const fatiguePressure = Math.round(fatigueRatio * 13);
  const trainerPressure = Math.round(modifier.trainerPressure * 0.34);
  const buddyPressure = Math.round(modifier.buddyPressure * 0.3);
  const bossBonus =
    (input.match.encounter.bossPowerBonus ?? 0) *
    BOSS_POWER_BONUS_SCALE[input.gym.type];
  const zoneDifficulty = CAPTURE_ZONE_DIFFICULTY[input.gym.type];
  const streakPressure = bossState.nextMatchStreak || 0;
  const moveMomentumPenalty = calculateMatchMovePenalty(
    bossState.moveMismatchPenalty,
    bossState.isChallengeAction,
    bossState.nextNearMisses,
    bossState.nextMatchStreak,
  );
  const readinessShift = clamp(
    Math.round(modifier.readinessTotal * 0.6),
    -8,
    8,
  );
  const nearMissPenalty = bossState.isChallengeAction
    ? 0
    : clamp(
        (bossState.isNearMiss ? 2 : 4) +
          (input.match.bossChallengeNearMisses >
          bossState.profile.missResetGrace
            ? 2
            : 0),
        0,
        16,
      );
  const muscleAlignment = calculateCaptureMuscleAlignment(
    input.trainer,
    input.move,
  );
  const buddyAlignment = calculateBuddyCaptureAlignment(
    input.buddy,
    input.move,
  );
  const repetitionPenalty = captureRepetitionPenalty(
    input.match.playerMoveHistory,
    input.move.id,
  );
  const opponentRepetitionPenalty = captureRepetitionPenalty(
    input.match.opponentMoveHistory,
    opponentMove.id,
  );
  const playerStaminaRatio = clamp01(
    input.match.playerStamina / CAPTURE_STAMINA_MAX,
  );
  const opponentStaminaRatio = clamp01(
    input.match.opponentStamina / CAPTURE_STAMINA_MAX,
  );
  const playerOverreach = Math.max(
    0,
    input.move.staminaCost - input.match.playerStamina,
  );
  const opponentOverreach = Math.max(
    0,
    opponentMove.staminaCost - input.match.opponentStamina,
  );
  const counterShift =
    counterState === 'counter'
      ? CAPTURE_ROUND_RULES.counterBonus
      : counterState === 'countered'
        ? -CAPTURE_ROUND_RULES.counterPenalty
        : 0;
  const species = input.match.encounter.creature;
  const wildDisciplineMatch =
    Number(opponentMove.buddyDisciplines.includes(species.primaryDiscipline)) +
    Number(
      Boolean(
        species.secondaryDiscipline &&
          opponentMove.buddyDisciplines.includes(species.secondaryDiscipline),
      ),
    ) *
      0.55;
  const wildMoveSkill =
    opponentMove.id === 'burst'
      ? species.power * 0.55 +
        species.stamina * 0.3 +
        species.mobility * 0.15
      : opponentMove.id === 'grind'
        ? species.control * 0.5 +
          species.stamina * 0.3 +
          species.form * 0.2
        : species.mobility * 0.45 +
          species.control * 0.3 +
          species.power * 0.25;
  const playerRoll = randomInt(
    input.randomState,
    input.move.randomSwing.min,
    input.move.randomSwing.max,
  );
  const effectiveBuddyLevel = calculateChallengeEffectiveLevel(
    input.buddy.level,
    input.match.encounter.zoneId,
  );
  const playerBase =
    effectiveBuddyLevel * 1.55 +
    input.move.power +
    input.move.control * 0.55 -
    fatiguePressure +
    trainerPressure +
    buddyPressure +
    muscleAlignment * 14 +
    buddyAlignment * 15 +
    playerStaminaRatio * 7 +
    counterShift -
    repetitionPenalty -
    playerOverreach * 0.65 +
    modifier.bossPressure +
    (input.match.encounter.isBoss && bossState.isChallengeAction
      ? 6 + bossState.moveAlignmentBonus + streakPressure
      : input.match.encounter.isBoss && bossState.isChallengeMachine
        ? 1 + bossState.moveAlignmentBonus
      : input.match.encounter.isBoss
        ? -bossState.moveMismatchPenalty
        : 0) -
    (input.match.encounter.isBoss && !bossState.isChallengeAction
      ? nearMissPenalty
      : 0) +
    readinessShift -
    bossState.moveProfile.staminaDrain -
    bossState.overloadRecoveryPenalty *
      (input.isForcedChallengeRecovery ? 2 : 1) +
    playerRoll.value;
  const wildRoll = randomInt(
    playerRoll.randomState,
    Math.max(-5, opponentMove.randomSwing.min),
    Math.min(6, opponentMove.randomSwing.max),
  );
  const wildBase =
    input.match.encounter.level * 1.72 +
    opponentMove.power +
    opponentMove.control * 0.48 +
    wildMoveSkill * 0.52 +
    wildDisciplineMatch * 4 +
    species.captureDifficulty * 1.4 +
    opponentStaminaRatio * 6 +
    zoneDifficulty.opponentPressure +
    zoneDifficulty.opponentControl -
    opponentRepetitionPenalty -
    opponentOverreach * 0.6 +
    bossBonus -
    modifier.bossPressure +
    wildRoll.value -
    clamp(Math.round(modifier.buddyEdge * 0.4), -4, 4);
  const delta =
    playerBase -
    wildBase +
    bossState.signatureEffect.meterShift * 2.6;
  const nextMeter = clamp(
    input.match.meter + Math.round((delta - moveMomentumPenalty) / 2.6),
    CAPTURE_METER_MIN,
    CAPTURE_METER_MAX,
  );
  const round = input.match.round + 1;
  const playerStaminaSpent = Math.min(
    input.match.playerStamina,
    input.move.staminaCost,
  );
  const opponentStaminaCost =
    opponentMove.staminaCost + zoneDifficulty.staminaPressure;
  const opponentStaminaSpent = Math.min(
    input.match.opponentStamina,
    opponentStaminaCost,
  );
  const nextPlayerStamina = clamp(
    input.match.playerStamina -
      input.move.staminaCost +
      CAPTURE_ROUND_RULES.playerRecovery +
      Math.floor(input.buddy.volume / 5),
    0,
    CAPTURE_STAMINA_MAX,
  );
  const nextOpponentStamina = clamp(
    input.match.opponentStamina -
      opponentStaminaCost +
      CAPTURE_ROUND_RULES.opponentRecovery,
    0,
    CAPTURE_STAMINA_MAX,
  );
  const playerMoveHistory = [
    ...input.match.playerMoveHistory,
    input.move.id,
  ].slice(-CAPTURE_ROUND_RULES.maximumHistory);
  const opponentMoveHistory = [
    ...input.match.opponentMoveHistory,
    opponentMove.id,
  ].slice(-CAPTURE_ROUND_RULES.maximumHistory);
  const nextIntentResult = selectCaptureOpponentIntent({
    encounter: input.match.encounter,
    meter: nextMeter,
    opponentStamina: nextOpponentStamina,
    playerMoveHistory,
    opponentMoveHistory,
    randomState: wildRoll.randomState,
  });

  return {
    delta,
    nextMeter,
    round,
    shouldResolve:
      input.match.round >= input.match.maxRounds ||
      nextMeter >= CAPTURE_METER_MAX ||
      nextMeter <= CAPTURE_METER_MIN,
    playerStamina: nextPlayerStamina,
    opponentStamina: nextOpponentStamina,
    playerMoveHistory,
    opponentMoveHistory,
    opponentIntent: nextIntentResult.intent,
    roundSummary: {
      playerMoveId: input.move.id,
      opponentMoveId: opponentMove.id,
      counterState,
      meterDelta: nextMeter - input.match.meter,
      playerStaminaSpent,
      opponentStaminaSpent,
      repetitionPenalty,
      muscleAlignment,
      buddyAlignment,
    },
    trainingFatigue: applyFatigueChange(
      input.trainingFatigue,
      bossState.moveFatigueDrain,
    ),
    modifier,
    ...bossState,
    randomState: nextIntentResult.randomState,
  };
}

export function getDefaultCaptureTarget() {
  return WILD_CAPTURE_CONTROL_TARGET;
}

export function isChallengeMachine(
  encounter: Encounter,
  gym: GymArea,
  machine: GymMachine | null,
) {
  const challenge = getBossChallengeMachine(encounter, gym);
  return Boolean(challenge && machine && challenge.id === machine.id);
}

export function getChallengeSummary(
  encounter: Encounter,
  gym: GymArea,
  machine: GymMachine | null,
) {
  return calculateBossChallengeSummary(encounter, gym, machine);
}
