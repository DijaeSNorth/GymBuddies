import {
  BOSS_CAPTURE_ALIGNMENT,
  BOSS_CAPTURE_TARGET,
  BOSS_CAPTURE_TARGET_CEILING,
  BOSS_CAPTURE_TARGET_FLOOR,
  BOSS_CHALLENGE_MOVE_MODIFIERS,
  BOSS_CHALLENGE_PENALTY_BASE,
  BOSS_CHALLENGE_PENALTY_SCALE,
  BOSS_CHALLENGE_PRESSURE,
  BOSS_CHALLENGE_TIER,
  BOSS_ZONE_CATCH_SCALE,
} from '../content/balance';
import { getBossById } from '../content/bosses';
import { CAPTURE_MOVE_BY_ID } from '../content/captureMoves';
import type {
  BossChallengeTier,
  Buddy,
  BuddySpecies,
  CaptureMove,
  Encounter,
  GymArea,
  GymBoss,
  GymKind,
  GymMachine,
  Match,
} from '../types';
import { calculateBuddyWorkoutProfile } from './buddyProgression';
import { clamp } from './math';
import {
  randomChoice,
  randomInt,
  type RandomState,
} from './random';
import { getBaseCatchChance } from './routeEncounters';

export function getBossChallengeMachine(
  encounter: Encounter,
  gym: GymArea,
) {
  if (!encounter.bossChallengeMachineId) return null;
  return (
    gym.machines.find(
      (machine) => machine.id === encounter.bossChallengeMachineId,
    ) ?? null
  );
}

export function getBossChallengeProfile(
  gymKind: GymKind,
  encounter?: Encounter,
) {
  if (
    encounter?.bossChallengeTier &&
    BOSS_CHALLENGE_TIER[encounter.bossChallengeTier]
  ) {
    return BOSS_CHALLENGE_TIER[encounter.bossChallengeTier];
  }
  return BOSS_CHALLENGE_PRESSURE[gymKind];
}

export function getBossChallengeTier(
  encounter: Encounter,
  gymKind: GymKind,
): BossChallengeTier {
  if (encounter.bossChallengeTier) return encounter.bossChallengeTier;
  if (encounter.bossPowerBonus == null) return 'low';
  if (gymKind === 'higher' || encounter.bossPowerBonus >= 24) return 'high';
  if (gymKind === 'starter' || encounter.bossPowerBonus >= 16) return 'normal';
  return 'low';
}

export function getBossDifficultyTier(
  gym: GymArea,
  boss: GymBoss,
): BossChallengeTier {
  return boss.powerBoost >= 24 || gym.type === 'higher'
    ? 'high'
    : boss.powerBoost >= 16 || gym.type === 'starter'
      ? 'normal'
      : 'low';
}

/** Input: gym machines, tier, and RNG state. Output: selected challenge machine and next RNG state. */
export function chooseBossChallengeMachine(
  gym: GymArea,
  tier: BossChallengeTier,
  randomState: RandomState,
) {
  const candidates = gym.machines;
  if (!candidates.length) {
    return { machine: null, randomState };
  }
  if (tier === 'high' && candidates.length > 1) {
    const roll = randomInt(randomState, 0, candidates.length - 1);
    return {
      machine: candidates[roll.value % candidates.length] ?? null,
      randomState: roll.randomState,
    };
  }
  if (tier === 'normal' && candidates.length > 1) {
    const roll = randomInt(randomState, 0, candidates.length - 1);
    return {
      machine:
        roll.value % 2 === 0 ? candidates[0] ?? null : candidates.at(-1) ?? null,
      randomState: roll.randomState,
    };
  }
  return {
    machine:
      candidates[Math.floor(candidates.length / 2)] ?? candidates[0] ?? null,
    randomState,
  };
}

/** Input: boss catalog, species catalog, gym, and RNG state. Output: boss encounter and next state. */
export function createBossEncounter(input: {
  gym: GymArea;
  bosses: readonly GymBoss[];
  species: readonly BuddySpecies[];
  scheduleCycle?: number;
  randomState: RandomState;
}) {
  const bossRoll = randomChoice(input.randomState, input.bosses);
  const boss = bossRoll.value;
  const species = input.species.find((entry) => entry.id === boss.speciesId);
  if (!species) {
    throw new Error(
      `Boss "${boss.id}" references missing Buddy species "${boss.speciesId}".`,
    );
  }
  const levelRoll = randomInt(
    bossRoll.randomState,
    input.gym.levelMin + boss.levelShift,
    input.gym.levelMax + boss.levelShift,
  );
  const tier = getBossDifficultyTier(input.gym, boss);
  const machineRoll = chooseBossChallengeMachine(
    input.gym,
    tier,
    levelRoll.randomState,
  );
  const baseChance = getBaseCatchChance(levelRoll.value, species.isExotic);
  const requiredMove = CAPTURE_MOVE_BY_ID.get(
    boss.signatureRule.requiredMoveId,
  );
  const encounter: Encounter = {
    creature: species,
    level: levelRoll.value,
    zoneId: input.gym.id,
    catchChance: clamp(
      baseChance *
        boss.catchMultiplier *
        BOSS_ZONE_CATCH_SCALE[input.gym.type],
      0.05,
      0.6,
    ),
    isBoss: true,
    bossName: `${boss.name} - ${species.name}`,
    bossId: boss.id,
    bossPowerBonus: boss.powerBoost,
    bossScheduleCycle: Math.max(0, Math.round(input.scheduleCycle ?? 0)),
    bossChallengeTier: tier,
    bossChallengeMachineId: machineRoll.machine?.id,
    bossChallengeMachineName: machineRoll.machine?.name,
    bossRequiredMoveId: boss.signatureRule.requiredMoveId,
    bossRequiredMoveName: requiredMove?.title,
    bossSignatureRuleId: boss.signatureRule.id,
    bossArenaEffectId: boss.arenaEffect.id,
  };
  return {
    encounter,
    randomState: machineRoll.randomState,
  };
}

export function calculateBossChallengeSummary(
  encounter: Encounter,
  gym: GymArea,
  machine: GymMachine | null,
) {
  const machineProfile = getBossChallengeMachine(encounter, gym);
  if (!encounter.isBoss || !machineProfile || !machine) {
    return {
      isActive: false,
      isAligned: false,
      isFocusAligned: false,
      tier: 'low' as const,
      profile: BOSS_CHALLENGE_PRESSURE[gym.type],
      machineProfile: null,
      bonus: 0,
    };
  }
  const tier = getBossChallengeTier(encounter, gym.type);
  const profile = getBossChallengeProfile(gym.type, encounter);
  const isAligned = machineProfile.id === machine.id;
  const isFocusAligned =
    machine.focus.toLowerCase() === machineProfile.focus.toLowerCase();
  const bonus = isAligned
    ? profile.matchMachineBonus
    : isFocusAligned
      ? profile.focusMatchBonus
      : profile.focusMismatchPenalty;
  return {
    isActive: true,
    isAligned,
    isFocusAligned,
    tier,
    profile,
    machineProfile,
    bonus,
  };
}

export function calculateBossChallengePressure(
  encounter: Encounter,
  gym: GymArea,
  selectedMachine: GymMachine | null,
) {
  if (!encounter.isBoss) return 0;
  const challengeMachine = getBossChallengeMachine(encounter, gym);
  if (!challengeMachine || !selectedMachine) return 0;
  return calculateBossChallengeSummary(encounter, gym, selectedMachine).bonus;
}

export function calculateBossChallengeCapturePenalty(input: {
  match: Match;
  gym: GymArea;
  activeMachine: GymMachine | null;
  meter: number;
  buddy?: Buddy;
}) {
  if (!input.match.encounter.isBoss || !input.match.isBossChallengeActive) {
    return {
      isActive: false,
      isAligned: false,
      penalty: 0,
      streakBonus: 0,
      nearPenalty: 0,
      nearMissOverload: 0,
      profile: BOSS_CHALLENGE_PRESSURE[input.gym.type],
      machine: null,
      nearWarn: false,
      meterPressure: 0,
    };
  }
  const summary = calculateBossChallengeSummary(
    input.match.encounter,
    input.gym,
    input.activeMachine,
  );
  if (!summary.isActive || !summary.machineProfile) {
    return {
      isActive: false,
      isAligned: false,
      penalty: 0,
      streakBonus: 0,
      nearPenalty: 0,
      nearMissOverload: 0,
      profile: summary.profile,
      machine: null,
      nearWarn: false,
      meterPressure: 0,
    };
  }
  const nearOver = Math.max(
    0,
    input.match.bossChallengeNearMisses - summary.profile.missResetGrace,
  );
  const penaltyScale = BOSS_CHALLENGE_PENALTY_SCALE[input.gym.type];
  const missPenalty =
    (input.match.bossChallengeMisses *
      BOSS_CHALLENGE_PENALTY_BASE[input.gym.type] *
      penaltyScale) /
    100;
  const nearPenalty = nearOver * 1.9 * penaltyScale / 100;
  const streakMultiplier = Math.min(
    input.match.bossChallengeMatchStreak,
    summary.profile.streakLimit,
  );
  const streakBonus =
    (summary.isAligned ? Math.max(0, streakMultiplier) * 0.012 : 0) +
    (input.meter > 78 ? 0.018 : 0);
  const buddyProfile = input.buddy
    ? calculateBuddyWorkoutProfile(input.buddy)
    : null;
  const buddyShield = buddyProfile
    ? buddyProfile.bossSteady + buddyProfile.failureSafety * 0.2
    : 0;
  const penalty = clamp(
    missPenalty + nearPenalty - streakBonus - buddyShield,
    0,
    0.34,
  );
  return {
    isActive: true,
    isAligned: summary.isAligned,
    penalty,
    streakBonus,
    nearPenalty,
    nearMissOverload: nearOver,
    profile: summary.profile,
    machine: summary.machineProfile,
    nearWarn: nearOver >= 1,
    meterPressure: summary.isAligned ? 1 : -1,
  };
}

export function calculateBossCaptureTarget(input: {
  gym: GymArea;
  encounter: Encounter;
  isChallengeAligned: boolean | null;
  missCount?: number;
  nearMissCount?: number;
  matchStreak?: number;
  buddy?: Buddy;
}) {
  if (!input.encounter.isBoss) return BOSS_CAPTURE_TARGET.home;
  const boss = getBossById(input.encounter.bossId);
  const alignment = BOSS_CAPTURE_ALIGNMENT[input.gym.type];
  const profile = BOSS_CHALLENGE_PRESSURE[input.gym.type];
  const consistencyShift = input.buddy
    ? Math.round(
        (0.55 -
          calculateBuddyWorkoutProfile(input.buddy).movementConsistency) *
          alignment.consistencyScale,
      )
    : 0;
  const alignmentShift = input.isChallengeAligned
    ? alignment.alignedShift
    : input.isChallengeAligned === false
      ? alignment.misalignedShift
      : alignment.unknownShift;
  const missShift = (input.missCount ?? 0) * alignment.missShift;
  const nearShift =
    Math.max(0, (input.nearMissCount ?? 0) - profile.missResetGrace) *
    alignment.nearShift;
  const streakShift = (input.matchStreak ?? 0) * alignment.streakShift;
  return clamp(
    Math.round(
      BOSS_CAPTURE_TARGET[input.gym.type] +
        (boss?.signatureRule.targetShift ?? 0) +
        alignment.zoneShift +
        alignmentShift +
        consistencyShift +
        missShift +
        nearShift -
        streakShift,
    ),
    BOSS_CAPTURE_TARGET_FLOOR,
    BOSS_CAPTURE_TARGET_CEILING,
  );
}

export function calculateBossChallengeStress(
  match: Match | null,
  activeMachine: GymMachine | null,
  gymKind: GymKind,
) {
  if (!match?.encounter.isBoss || !match.isBossChallengeActive) {
    return { percent: 0, tone: 'safe' as const };
  }
  const profile = getBossChallengeProfile(gymKind, match.encounter);
  const boss = getBossById(match.encounter.bossId);
  const isAligned =
    match.bossChallengeMachineId && activeMachine?.id
      ? match.bossChallengeMachineId === activeMachine.id
      : null;
  const isNearWarn =
    match.bossChallengeNearMisses > profile.missResetGrace;
  const isOverload =
    match.bossChallengeMisses >= profile.overloadMissLimit;
  const rawAlignmentPenalty =
    isAligned === true ? 10 : isAligned === false ? 38 : 24;
  const missPressure = Math.min(4, match.bossChallengeMisses) * 12;
  const nearPressure =
    Math.max(0, match.bossChallengeNearMisses - profile.missResetGrace) * 8;
  const overloadBoost = isOverload ? 28 : 0;
  const nearWarnBoost = isNearWarn ? 6 : 0;
  const streakRecovery =
    (match.bossChallengeMatchStreak / Math.max(1, profile.streakLimit)) * 12;
  const percent = clamp(
    Math.round(
      12 +
        rawAlignmentPenalty +
        missPressure +
        nearPressure +
        nearWarnBoost +
        overloadBoost -
        streakRecovery +
        (boss?.signatureRule.stressShift ?? 0),
    ),
    0,
    100,
  );
  return {
    percent,
    tone:
      percent > 84
        ? ('overload' as const)
        : percent > 70
          ? ('danger' as const)
          : percent > 35
            ? ('caution' as const)
            : ('safe' as const),
  };
}

export function calculateBossMoveState(input: {
  match: Match;
  gym: GymArea;
  selectedMachine: GymMachine;
  move: CaptureMove;
  buddy: Buddy;
  isForcedRecovery: boolean;
  challengeStressPercent: number;
}) {
  const challengeMachine = input.match.encounter.isBoss
    ? getBossChallengeMachine(input.match.encounter, input.gym)
    : null;
  const boss = getBossById(input.match.encounter.bossId);
  const isChallengeMachine = Boolean(
    challengeMachine &&
      input.selectedMachine.id === challengeMachine.id,
  );
  const isRequiredMove = Boolean(
    input.match.encounter.bossRequiredMoveId &&
      input.move.id === input.match.encounter.bossRequiredMoveId,
  );
  const isChallengeAction = isChallengeMachine && isRequiredMove;
  const isNearMiss = isChallengeMachine !== isRequiredMove;
  const isCompleteMiss = !isChallengeMachine && !isRequiredMove;
  const profile = getBossChallengeProfile(
    input.gym.type,
    input.match.encounter,
  );
  const moveProfile = BOSS_CHALLENGE_MOVE_MODIFIERS[input.move.id];
  const buddyProfile = calculateBuddyWorkoutProfile(input.buddy);
  const repeatedMove =
    input.match.playerMoveHistory.at(-1) === input.move.id &&
    input.match.playerMoveHistory.at(-2) === input.move.id;
  const signatureTrigger = boss?.signatureRule.trigger;
  const signatureActive = Boolean(
    boss &&
      (signatureTrigger === 'opening'
        ? input.match.round <= 1
        : signatureTrigger === 'player-repeat'
          ? repeatedMove
          : signatureTrigger === 'low-stamina'
            ? input.match.playerStamina <= 35
            : signatureTrigger === 'machine-mismatch'
              ? !isChallengeMachine
              : signatureTrigger === 'near-target'
                ? input.match.meter >= 68 &&
                  input.match.bossChallengeMatchStreak < profile.streakLimit
                : signatureTrigger === 'required-action'
                  ? isChallengeAction
                  : signatureTrigger === 'final-round'
                    ? input.match.round >= input.match.maxRounds - 1
                    : signatureTrigger === 'miss'
                      ? isCompleteMiss
                      : signatureTrigger === 'opponent-low-stamina'
                        ? input.match.opponentStamina <= 35
                        : signatureTrigger === 'near-miss'
                          ? isNearMiss
                          : signatureTrigger === 'high-stress'
                            ? input.challengeStressPercent >= 70
                            : signatureTrigger === 'overload'
                              ? input.isForcedRecovery
                              : false),
  );
  const signatureEffect = {
    active: signatureActive,
    ruleId: boss?.signatureRule.id ?? null,
    name: boss?.signatureRule.name ?? null,
    warning: boss?.signatureRule.warning ?? null,
    meterShift: signatureActive ? (boss?.signatureRule.meterShift ?? 0) : 0,
    fatigueShift: signatureActive
      ? (boss?.signatureRule.fatigueShift ?? 0)
      : 0,
  };
  const overloadRecoveryPenalty = input.isForcedRecovery
    ? clamp(Math.floor(input.challengeStressPercent / 10) + 8, 8, 18)
    : 0;
  const moveFatigueDrain = Math.max(
    0,
    Math.round(
      moveProfile.staminaDrain +
        (0.5 - buddyProfile.movementConsistency) * 1.5 +
        overloadRecoveryPenalty +
        signatureEffect.fatigueShift,
    ),
  );
  const moveAlignmentBonus = isChallengeAction
    ? moveProfile.alignmentBonus + 2
    : isChallengeMachine || isRequiredMove
      ? 1
      : 0;
  const moveMismatchPenalty = isChallengeAction
    ? 0
    : clamp(
        (isNearMiss ? 2 : Math.abs(moveProfile.mismatchPenalty) + 3) +
          Math.min(
            10,
            Math.floor(
              (input.match.bossChallengeMisses +
                input.match.bossChallengeNearMisses) /
                2,
            ),
          ) +
          (input.isForcedRecovery ? 12 : 0),
        1,
        30,
      );
  const isActive =
    input.match.encounter.isBoss && input.match.isBossChallengeActive;
  const nextMisses = isActive
    ? isChallengeAction
      ? Math.max(0, input.match.bossChallengeMisses - 1)
      : isCompleteMiss
        ? input.match.bossChallengeMisses +
          (input.isForcedRecovery ? 2 : 1)
        : input.match.bossChallengeMisses
    : input.match.bossChallengeMisses;
  const nextNearMisses = isActive
    ? isChallengeAction
      ? Math.max(0, input.match.bossChallengeNearMisses - 1)
      : input.match.bossChallengeNearMisses + (isNearMiss ? 1 : 0)
    : input.match.bossChallengeNearMisses;
  const nextMatchStreak = isActive
    ? isChallengeAction
      ? clamp(
          input.match.bossChallengeMatchStreak + 1,
          0,
          profile.streakLimit,
        )
      : 0
    : input.match.bossChallengeMatchStreak;

  return {
    boss,
    challengeMachine,
    isChallengeMachine,
    isRequiredMove,
    isChallengeAction,
    isNearMiss,
    isCompleteMiss,
    profile,
    moveProfile,
    signatureEffect,
    overloadRecoveryPenalty,
    moveFatigueDrain,
    moveAlignmentBonus,
    moveMismatchPenalty,
    nextMisses,
    nextNearMisses,
    nextMatchStreak,
  };
}

export function calculateBossInterval(
  randomState: RandomState,
  minimumMs: number,
  maximumMs: number,
) {
  const minutes = randomInt(
    randomState,
    Math.floor(minimumMs / 60_000),
    Math.floor(maximumMs / 60_000),
  );
  return {
    intervalMs: minutes.value * 60_000,
    randomState: minutes.randomState,
  };
}
