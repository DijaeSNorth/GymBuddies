import { useEffect, useMemo, useRef, useState } from 'react';

type PixelPalette = {
  skin: string;
  core: string;
  detail: string;
  accent: string;
};

type Creature = {
  dex: number;
  name: string;
  speciesHint: string;
  flavor: string;
  isExotic: boolean;
  power: number;
  sprite: string[];
  palette: PixelPalette;
};

type Buddy = {
  id: string;
  nickname: string;
  creature: Creature;
  level: number;
  hp: number;
  maxHp: number;
  xp: number;
  form: number;
  mobility: number;
  volume: number;
};

type GymArea = {
  id: string;
  name: string;
  machines: GymMachine[];
  type: 'home' | 'starter' | 'higher';
  levelMin: number;
  levelMax: number;
  blurb: string;
};

type Encounter = {
  creature: Creature;
  level: number;
  zoneId: string;
  catchChance: number;
  isBoss: boolean;
  bossName?: string;
  bossPowerBonus?: number;
  bossChallengeMachineId?: string;
  bossChallengeMachineName?: string;
  bossChallengeTier?: 'low' | 'normal' | 'high';
};

type Move = {
  id: 'burst' | 'grind' | 'snap';
  title: string;
  tactic: string;
  power: number;
  control: number;
};

type WorkoutLoadTier = 'easy' | 'steady' | 'hard' | 'max';

type Match = {
  encounter: Encounter;
  status: 'idle' | 'playing' | 'won' | 'escape' | 'failed' | 'full';
  round: number;
  maxRounds: number;
  meter: number;
  lines: string[];
  isBossChallengeActive: boolean;
  bossChallengeMachineId: string | null;
  bossChallengeMachineName: string | null;
  bossChallengeMisses: number;
  bossChallengeMatchStreak: number;
  bossChallengeNearMisses: number;
};

type BossChallengeStress = {
  percent: number;
  tone: 'safe' | 'caution' | 'danger' | 'overload';
  label: string;
  detail: string;
};

type GymMachine = {
  id: string;
  name: string;
  detail: string;
  focus: string;
  xpMin: number;
  xpMax: number;
  xpMultiplier: number;
  steroidChance: number;
  hpRestore: number;
  fatigueCost: number;
};

type BossSchedule = {
  nextBossAt: number;
  defeated?: number;
};

type GymBoss = {
  id: string;
  name: string;
  creature: Creature;
  levelShift: number;
  catchMultiplier: number;
  powerBoost: number;
};

type SaveData = {
  version: string;
  trainingFatigue: number;
  workoutMomentum: number;
  deloadTokens: number;
  hasStarterSet: boolean;
  unlockedZoneIds: string[];
  trainer: TrainerProfile;
  steroids: number;
  activeIndex: number;
  activeZoneId: string;
  team: Buddy[];
  seenDex: number[];
  caughtDex: number[];
  selectedMachineByZone: Record<string, string>;
  bossSchedules: Record<string, BossSchedule>;
  tutorialStep: number;
  audio: SaveAudioSettings;
};

type TrainerProfile = {
  name: string;
  skin: string;
  hair: string;
  top: string;
  shoes: string;
  glove: string;
  muscles: {
    shoulders: number;
    chest: number;
    arms: number;
    triceps: number;
    core: number;
    quads: number;
    calves: number;
    back: number;
  };
};

type ZoneTransit = {
  from: string;
  to: string;
  icon: string;
  routeName?: string;
  routeFatigue?: number;
  routeEncounterBoost?: number;
  routeScoutChance?: number;
};

type TrainerEmote = 'neutral' | 'grind' | 'focus' | 'level' | 'victory' | 'drained' | 'ready' | 'pump';

type FocusMuscleBoost = {
  muscle: keyof TrainerProfile['muscles'];
  weight: number;
};

type SaveAudioSettings = {
  enabled: boolean;
  musicVolume: number;
  sfxVolume: number;
};

type MusicZoneState = 'home' | 'ambient' | 'fight' | 'boss';
type MusicIntensity = 'home' | 'starter' | 'higher';
type CardinalDirection = 'up' | 'down' | 'left' | 'right';

type AudioEngine = {
  context: AudioContext;
  masterGain: GainNode;
  musicGain: GainNode;
  sfxGain: GainNode;
  musicTicker: ReturnType<typeof setInterval> | null;
  enabled: boolean;
  zone: MusicZoneState;
  intensity: MusicIntensity;
  step: number;
  stepNotes: number[];
  setEnabled: (value: boolean) => void;
  setVolumes: (music: number, sfx: number) => void;
  startMusic: (zone: MusicZoneState, intensity: MusicIntensity) => void;
  stopMusic: () => void;
  pulseTone: (frequency: number, duration: number, gain: number, wave?: OscillatorType) => void;
  emitSfx: (event: string, intensity?: number) => void;
  dispose: () => void;
};

type TrainingPhase = 'running' | 'spot' | 'resolved';

type WorkoutSession = {
  id: number;
  phase: TrainingPhase;
  zoneType: 'home' | 'starter' | 'higher';
  buddyId: string;
  machineId: string;
  willFail: boolean;
  startedAt: number;
  durationMs: number;
  failCheckAt: number;
  spotWindowMs: number;
  spotWindowStart: number;
  spotWindowEnd: number;
  failChance: number;
  buddyLevelBefore: number;
  hpLossOnFail: number;
  staminaChange: number;
  xpGain: number;
  steroidsAwarded: boolean;
  resolved: boolean;
  spotChanceBase: number;
  readiness: number;
  readinessLabel: string;
  loadPressure: number;
  loadTier: WorkoutLoadTier;
  setStress: number;
  movementConsistency: number;
  volumePreparedness: number;
  sessionQuality: number;
};

const MAX_MUSCLE_LEVEL = 14;
const WORKOUT_DURATION_MS = 2800;
const WORKOUT_SPOT_WINDOW_MS = 1600;
const WORKOUT_AUTO_FAILURE_MS = 1250;
const MAX_BUDDY_FORM = 24;
const MAX_BUDDY_MOBILITY = 24;
const MAX_BUDDY_VOLUME = 12;
const MAX_TRAINING_FATIGUE = 120;
const FATIGUE_COOLDOWN_PER_TICK = 2;
const FATIGUE_COOLDOWN_HOME_BONUS = 1;
const REST_ACTION_RECOVERY = 26;
const REST_ACTION_BUDDY_HEAL = 9;
const REST_ACTION_COOLDOWN_MS = 12500;
const BASE_TRAIN_FAIL_CHANCE = 0.5;
const BASE_SPOT_SUCCESS_CHANCE = 0.5;
const WORKOUT_DELOAD_MAX = 4;
const WORKOUT_DELOAD_RECOVERY_DIVISOR = 28;
const WORKOUT_DELOAD_LOAD_REDUCTION = 0.18;
const WORKOUT_DELOAD_READINESS_BONUS = 0.035;
const WORKOUT_MOMENTUM_MAX = 30;
const WORKOUT_MOMENTUM_RECOVERY = 1;
const WORKOUT_REST_STAT_RECOVERY_DIVISOR = 12;
const WORKOUT_REST_DELOAD_STAT_BONUS = 1;
const WORKOUT_DELOAD_BY_TIER: Record<WorkoutLoadTier, number> = {
  easy: 0,
  steady: 1,
  hard: 1,
  max: 2,
};
const BOSS_ZONE_CATCH_SCALE: Record<'home' | 'starter' | 'higher', number> = {
  home: 0.96,
  starter: 1.02,
  higher: 0.73,
};
type BossChallengeTier = 'low' | 'normal' | 'high';
type BossChallengeDifficultyProfile = {
  matchMachineBonus: number;
  focusMatchBonus: number;
  focusMismatchPenalty: number;
  maxRounds: number;
  streakLimit: number;
  missResetGrace: number;
};
const BOSS_CAPTURE_WEIGHTS: Record<
  'home' | 'starter' | 'higher',
  { trainerWeight: number; buddyWeight: number; bossPenaltyScale: number; maxCatch: number; minCatch: number }
> = {
  home: { trainerWeight: 1.2, buddyWeight: 1.03, bossPenaltyScale: 0.34, maxCatch: 0.96, minCatch: 0.1 },
  starter: { trainerWeight: 1.16, buddyWeight: 1.0, bossPenaltyScale: 0.46, maxCatch: 0.88, minCatch: 0.08 },
  higher: { trainerWeight: 1.11, buddyWeight: 0.98, bossPenaltyScale: 0.58, maxCatch: 0.78, minCatch: 0.06 },
};
const BOSS_CAPTURE_ALIGNMENT: Record<
  'home' | 'starter' | 'higher',
  {
    alignedShift: number;
    misalignedShift: number;
    unknownShift: number;
    consistencyScale: number;
    missShift: number;
    nearShift: number;
    streakShift: number;
    zoneShift: number;
  }
> = {
  home: {
    alignedShift: -6,
    misalignedShift: 5,
    unknownShift: 3,
    consistencyScale: 7,
    missShift: 1.3,
    nearShift: 1.6,
    streakShift: 2.2,
    zoneShift: 0,
  },
  starter: {
    alignedShift: -5,
    misalignedShift: 7,
    unknownShift: 4,
    consistencyScale: 6.3,
    missShift: 1.7,
    nearShift: 2.0,
    streakShift: 2.5,
    zoneShift: 2,
  },
  higher: {
    alignedShift: -4,
    misalignedShift: 10,
    unknownShift: 5,
    consistencyScale: 8.2,
    missShift: 2.2,
    nearShift: 2.3,
    streakShift: 3.1,
    zoneShift: 3,
  },
};
const BOSS_CHALLENGE_PRESSURE: Record<
  'home' | 'starter' | 'higher',
  BossChallengeDifficultyProfile
> = {
  home: { matchMachineBonus: 4, focusMatchBonus: 1, focusMismatchPenalty: -2, maxRounds: 4, streakLimit: 2, missResetGrace: 2 },
  starter: { matchMachineBonus: 6, focusMatchBonus: 3, focusMismatchPenalty: -7, maxRounds: 5, streakLimit: 3, missResetGrace: 1 },
  higher: { matchMachineBonus: 9, focusMatchBonus: 5, focusMismatchPenalty: -9, maxRounds: 6, streakLimit: 4, missResetGrace: 1 },
};
const BOSS_CHALLENGE_TIER: Record<BossChallengeTier, BossChallengeDifficultyProfile> = {
  low: { matchMachineBonus: 3, focusMatchBonus: 1, focusMismatchPenalty: -2, maxRounds: 4, streakLimit: 2, missResetGrace: 2 },
  normal: { matchMachineBonus: 5, focusMatchBonus: 2, focusMismatchPenalty: -6, maxRounds: 5, streakLimit: 3, missResetGrace: 1 },
  high: { matchMachineBonus: 8, focusMatchBonus: 4, focusMismatchPenalty: -10, maxRounds: 6, streakLimit: 4, missResetGrace: 1 },
};
const BOSS_CAPTURE_TARGET: Record<'home' | 'starter' | 'higher', number> = {
  home: 70,
  starter: 74,
  higher: 78,
};
const BOSS_CAPTURE_TARGET_FLOOR = 64;
const BOSS_CAPTURE_TARGET_CEILING = 92;
const BOSS_CHALLENGE_MOVE_MODIFIERS: Record<Move['id'], { alignmentBonus: number; mismatchPenalty: number; staminaDrain: number }> = {
  burst: { alignmentBonus: 1, mismatchPenalty: 2, staminaDrain: 2 },
  grind: { alignmentBonus: 3, mismatchPenalty: -1, staminaDrain: 1 },
  snap: { alignmentBonus: 0, mismatchPenalty: 3, staminaDrain: 2 },
};
const BOSS_CHALLENGE_PENALTY_BASE: Record<'home' | 'starter' | 'higher', number> = {
  home: 6,
  starter: 8,
  higher: 10,
};
const BOSS_CHALLENGE_PENALTY_SCALE: Record<'home' | 'starter' | 'higher', number> = {
  home: 0.82,
  starter: 0.94,
  higher: 1.16,
};
const BOSS_MATCH_FATIGUE_SCALE: Record<'home' | 'starter' | 'higher', number> = {
  home: 0.75,
  starter: 1,
  higher: 1.25,
};
const BOSS_POWER_BONUS_SCALE: Record<'home' | 'starter' | 'higher', number> = {
  home: 0.55,
  starter: 0.72,
  higher: 1.08,
};
const BOSS_METER_CATCH_SCALE: Record<'home' | 'starter' | 'higher', number> = {
  home: 188,
  starter: 174,
  higher: 206,
};
const BOSS_CAPTURE_READINESS_SCALE: Record<'home' | 'starter' | 'higher', number> = {
  home: 28,
  starter: 26,
  higher: 24,
};

type WorldRouteConnection = {
  from: string;
  to: string;
  routeName: string;
  travelFatigue: number;
  encounterBoost: number;
};

function machineDifficultyMultiplier(type: 'home' | 'starter' | 'higher') {
  if (type === 'higher') return 1.2;
  if (type === 'starter') return 1.08;
  return 0.95;
}

function spotCurveMultiplier(type: 'home' | 'starter' | 'higher') {
  if (type === 'higher') return 0.36;
  if (type === 'starter') return 0.42;
  return 0.48;
}

function machineFocusScore(machine: GymMachine, trainer: TrainerProfile) {
  const focusBoosts = FOCUSED_MUSCLES[machine.focus.toLowerCase()] ?? [];
  const totalWeight = focusBoosts.reduce((sum, focus) => sum + focus.weight, 0);
  if (!focusBoosts.length || !totalWeight) {
    return 0.1;
  }

  const focusScore =
    focusBoosts.reduce((sum, focus) => {
      const value = trainer.muscles[focus.muscle] / MAX_MUSCLE_LEVEL;
      return sum + value * focus.weight;
    }, 0) / totalWeight;

  return clamp(focusScore, 0, 1);
}

function trainerWorkoutAdvantage(machine: GymMachine, trainer: TrainerProfile, type: 'home' | 'starter' | 'higher') {
  const focusScore = machineFocusScore(machine, trainer);
  const focusVariance = 1 - focusScore;

  const overallBody = Object.values(trainer.muscles).reduce((total, value) => total + value / MAX_MUSCLE_LEVEL, 0) / 8;
  const tierScale = type === 'higher' ? 1.22 : type === 'starter' ? 1.05 : 0.95;

  const failReduction = clamp((focusScore * 0.2 + overallBody * 0.12) * (1 + focusVariance * 0.08), 0, 0.3) * tierScale;
  const spotBonus = clamp((focusScore * 0.22 + overallBody * 0.12), 0.02, 0.3) * (type === 'home' ? 0.9 : 1);

  return {
    failReduction: clamp(failReduction * 0.9, 0, 0.35),
    spotBaseBonus: clamp(spotBonus * tierScale, 0, 0.35),
  };
}

function getBossChallengeMachine(encounter: Encounter, zone: GymArea) {
  if (!encounter.bossChallengeMachineId) {
    return null;
  }
  return zone.machines.find((machine) => machine.id === encounter.bossChallengeMachineId) ?? null;
}

function bossChallengeProfileForZone(zoneType: 'home' | 'starter' | 'higher', encounter?: Encounter) {
  if (encounter?.bossChallengeTier && BOSS_CHALLENGE_TIER[encounter.bossChallengeTier]) {
    return BOSS_CHALLENGE_TIER[encounter.bossChallengeTier];
  }
  return BOSS_CHALLENGE_PRESSURE[zoneType];
}

function bossChallengeTierFromEncounter(encounter: Encounter, zoneType: 'home' | 'starter' | 'higher'): BossChallengeTier {
  if (encounter.bossChallengeTier) return encounter.bossChallengeTier;
  if (encounter.bossPowerBonus == null) return 'low';
  if (zoneType === 'higher' || encounter.bossPowerBonus >= 24) return 'high';
  if (zoneType === 'starter' || encounter.bossPowerBonus >= 16) return 'normal';
  return 'low';
}

function bossChallengeThresholdText(tier: BossChallengeTier, zoneType: 'home' | 'starter' | 'higher') {
  if (tier === 'high' || zoneType === 'higher') return 'high';
  if (tier === 'normal') return 'medium';
  return 'low';
}

function bossChallengeSummary(encounter: Encounter, zone: GymArea, machine: GymMachine | null) {
  const machineProfile = getBossChallengeMachine(encounter, zone);
  if (!encounter.isBoss || !machineProfile || !machine) {
    return {
      isActive: false,
      isAligned: false,
      isFocusAligned: false,
      tier: 'low' as const,
      profile: BOSS_CHALLENGE_PRESSURE[zone.type],
      machineProfile: null as GymMachine | null,
      bonus: 0,
      bonusLabel: '+0',
    };
  }
  const tier = bossChallengeTierFromEncounter(encounter, zone.type);
  const profile = bossChallengeProfileForZone(zone.type, encounter);
  const isAligned = machineProfile.id === machine.id;
  const isFocusAligned = machine.focus.toLowerCase() === machineProfile.focus.toLowerCase();
  const challengeDelta = isAligned
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
    bonus: challengeDelta,
    bonusLabel: `${challengeDelta >= 0 ? '+' : ''}${challengeDelta}`,
  };
}

function bossChallengeCapturePenalty(
  match: Match,
  zone: GymArea,
  activeMachine: GymMachine | null,
  meter: number,
  buddy?: Buddy,
) {
  if (!match.encounter.isBoss || !match.isBossChallengeActive) {
    return {
      isActive: false,
      isAligned: false,
      penalty: 0,
      streakBonus: 0,
      nearPenalty: 0,
      nearMissOverload: 0,
      profile: BOSS_CHALLENGE_PRESSURE[zone.type],
      machine: null as GymMachine | null,
      nearWarn: false,
      penaltyLabel: '0%',
      meterPressure: 0,
    };
  }
  const summary = bossChallengeSummary(match.encounter, zone, activeMachine);
  if (!summary.isActive || !summary.machineProfile) {
    return {
      isActive: false,
      isAligned: false,
      penalty: 0,
      streakBonus: 0,
      nearPenalty: 0,
      nearMissOverload: 0,
      profile: summary.profile,
      machine: null as GymMachine | null,
      nearWarn: false,
      penaltyLabel: '0%',
      meterPressure: 0,
    };
  }
  const profile = summary.profile;
  const nearOver = Math.max(0, match.bossChallengeNearMisses - profile.missResetGrace);
  const penaltyScale = BOSS_CHALLENGE_PENALTY_SCALE[zone.type];
  const missPenalty = (match.bossChallengeMisses * BOSS_CHALLENGE_PENALTY_BASE[zone.type] * penaltyScale) / 100;
  const nearPenalty = (nearOver * 1.9 * penaltyScale) / 100;
  const streakMultiplier = Math.min(match.bossChallengeMatchStreak, profile.streakLimit);
  const streakBonus = (summary.isAligned ? Math.max(0, streakMultiplier) * 0.012 : 0) + (meter > 78 ? 0.018 : 0);
  const buddyProfile = buddy ? workoutBuddyProfile(buddy) : null;
  const buddyShield = buddyProfile ? buddyProfile.bossSteady + buddyProfile.failureSafety * 0.2 : 0;
  const basePenalty = clamp(missPenalty + nearPenalty - streakBonus - buddyShield, 0, 0.34);
  const nearWarn = nearOver >= 1;
  const isAligned = summary.isAligned;
  const pressure = isAligned ? 1 : -1;
  return {
    isActive: true,
    isAligned,
    penalty: basePenalty,
    streakBonus,
    nearPenalty,
    nearMissOverload: nearOver,
    profile,
    machine: summary.machineProfile,
    nearWarn,
    penaltyLabel: `${Math.round(basePenalty * 100)}%`,
    meterPressure: pressure,
  };
}

function matchMovePenalty(
  moveMismatchPenalty: number,
  isChallengeMachine: boolean,
  nearMisses: number,
  streak: number,
) {
  if (isChallengeMachine) {
    return 0;
  }
  const nearPenalty = clamp(Math.max(0, nearMisses - 1) * 1.1, 0, 8);
  const streakShield = Math.min(streak, 3) * 1.2;
  return clamp(Math.max(1, moveMismatchPenalty) + nearPenalty - streakShield, 0, 16);
}

function trainerArenaPressure(trainer: TrainerProfile, machine: GymMachine | null, zone: GymArea) {
  const activeMachine = machine ?? zone.machines[0] ?? null;
  if (!activeMachine) return 0;
  const focusScore = machineFocusScore(activeMachine, trainer);
  const overallBody = Object.values(trainer.muscles).reduce((total, value) => total + value / MAX_MUSCLE_LEVEL, 0) / 8;
  const zoneScale = zone.type === 'higher' ? 1.18 : zone.type === 'starter' ? 1.06 : 0.95;
  const base = 10 + focusScore * 18 + overallBody * 17 + (zoneScale - 1) * 12;
  return clamp(Math.round(base), 0, 36);
}

function matchReadinessModifier(trainer: TrainerProfile, buddy: Buddy, zoneType: 'home' | 'starter' | 'higher') {
  const buddyFormRatio = clamp01(buddy.form / MAX_BUDDY_FORM);
  const buddyMobilityRatio = clamp01(buddy.mobility / MAX_BUDDY_MOBILITY);
  const buddyVolumeRatio = clamp01(buddy.volume / MAX_BUDDY_VOLUME);
  const trainerForm = Object.values(trainer.muscles).reduce((sum, value) => sum + value / MAX_MUSCLE_LEVEL, 0) / 8;
  const buddyHpRatio = clamp01(buddy.hp / Math.max(1, buddy.maxHp));
  const trainerEdge = Math.round((trainerForm - 0.42) * 22 * (zoneType === 'higher' ? 1.15 : zoneType === 'starter' ? 1.02 : 1));
  const buddyReadinessEdge = Math.round((buddyFormRatio - 0.55) * 12 + (buddyMobilityRatio - 0.5) * 8 + (buddyVolumeRatio - 0.5) * 5);
  const buddyEdge = clamp(Math.round((buddyHpRatio - 0.5) * 10 + buddyReadinessEdge), -12, 12);
  return {
    trainerForm,
    trainerEdge: clamp(trainerEdge, -12, 12),
    buddyEdge: clamp(buddyEdge, -8, 8),
    total: clamp(trainerEdge + buddyEdge, -18, 18),
    zoneType,
  };
}

function buddyArenaPressure(buddy: Buddy) {
  const hpRatio = clamp01(buddy.hp / Math.max(1, buddy.maxHp));
  const formRatio = clamp01(buddy.form / MAX_BUDDY_FORM);
  const mobilityRatio = clamp01(buddy.mobility / MAX_BUDDY_MOBILITY);
  const volumeRatio = clamp01(buddy.volume / MAX_BUDDY_VOLUME);
  const powerEdge = buddy.creature.power * 0.5;
  const healthEdge = hpRatio * 10;
  const fatiguePenalty = (1 - hpRatio) * 6;
  return clamp(
    Math.round(
      buddy.level * 1.4 +
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

function bossChallengePressure(encounter: Encounter, zone: GymArea, selectedMachine: GymMachine | null) {
  if (!encounter.isBoss) return 0;
  const challengeMachine = getBossChallengeMachine(encounter, zone);
  if (!challengeMachine || !selectedMachine) return 0;
  const summary = bossChallengeSummary(encounter, zone, selectedMachine);
  return summary.bonus;
}

function matchCatchModifier(
  encounter: Encounter,
  zone: GymArea,
  machine: GymMachine | null,
  trainer: TrainerProfile,
  buddy: Buddy,
  meter: number,
  trainingFatigue = 0,
) {
  const trainerPressure = trainerArenaPressure(trainer, machine, zone);
  const buddyPressure = buddyArenaPressure(buddy);
  const fatigueScale = BOSS_MATCH_FATIGUE_SCALE[zone.type];
  const fatiguePenalty = clamp01(trainingFatigue / MAX_TRAINING_FATIGUE) * 3 * fatigueScale;
  const machinePressure = bossChallengePressure(encounter, zone, machine);
  const bossPenalty = encounter.isBoss ? (encounter.bossPowerBonus ?? 0) : 0;
  const profile = BOSS_CAPTURE_WEIGHTS[zone.type];
  const zonePenaltyMultiplier = encounter.isBoss ? profile.bossPenaltyScale : 0;
  const readiness = matchReadinessModifier(trainer, buddy, zone.type);
  const trainerWeight = profile.trainerWeight;
  const buddyWeight = profile.buddyWeight;
  const raw =
    trainerPressure * trainerWeight +
    buddyPressure * buddyWeight +
    machinePressure -
    bossPenalty * zonePenaltyMultiplier -
    fatiguePenalty +
    readiness.total;
  return {
    raw,
    meterDelta: clamp((meter - 50) / 150, -0.25, 0.22),
    bossPressure: machinePressure,
    trainerPressure,
    buddyPressure,
    trainerEdge: readiness.trainerEdge,
    buddyEdge: readiness.buddyEdge,
    readinessTotal: readiness.total,
  };
}

function bossCaptureTarget(
  zone: GymArea,
  encounter: Encounter,
  isChallengeAligned: boolean | null,
  missCount = 0,
  nearMissCount = 0,
  matchStreak = 0,
  buddy?: Buddy,
) {
  if (!encounter.isBoss) {
    return BOSS_CAPTURE_TARGET.home;
  }
  const alignmentProfile = BOSS_CAPTURE_ALIGNMENT[zone.type];
  const profile = BOSS_CHALLENGE_PRESSURE[zone.type];
  const base = BOSS_CAPTURE_TARGET[zone.type];
  const consistencyShift = buddy
    ? Math.round((0.55 - workoutBuddyProfile(buddy).movementConsistency) * alignmentProfile.consistencyScale)
    : 0;
  const alignmentShift = isChallengeAligned
    ? alignmentProfile.alignedShift
    : isChallengeAligned === false
      ? alignmentProfile.misalignedShift
      : alignmentProfile.unknownShift;
  const missShift = missCount * alignmentProfile.missShift;
  const nearShift = Math.max(0, nearMissCount - profile.missResetGrace) * alignmentProfile.nearShift;
  const streakShift = matchStreak * alignmentProfile.streakShift;
  const zoneShift = alignmentProfile.zoneShift;
  return clamp(
    Math.round(base + zoneShift + alignmentShift + consistencyShift + missShift + nearShift - streakShift),
    BOSS_CAPTURE_TARGET_FLOOR,
    BOSS_CAPTURE_TARGET_CEILING,
  );
}

function clampBuddyStats(value: number, max: number, min = 0) {
  return clamp(Math.round(value), min, max);
}

function buddyStatBand(value: number, max: number) {
  if (value <= 0) return 'Raw';
  if (value >= max * 0.82) return 'Explosive';
  if (value >= max * 0.64) return 'Strong';
  if (value >= max * 0.46) return 'Ready';
  if (value >= max * 0.28) return 'Steady';
  return 'Raw';
}

function buddyGrowthFromWorkout(
  machine: GymMachine,
  readiness: number,
  zoneType: 'home' | 'starter' | 'higher',
  succeeded: boolean,
) {
  const focus = machine.focus.toLowerCase();
  const zoneScale = zoneType === 'higher' ? 1.15 : zoneType === 'starter' ? 1.05 : 0.95;
  const formBias = focus.includes('precision') ? 1.25 : focus.includes('control') ? 0.85 : 0.38;
  const mobilityBias = focus.includes('mobility') || focus.includes('stability') ? 1.1 : 0.4;
  const volumeBias = zoneType === 'higher' ? 0.95 : zoneType === 'starter' ? 0.7 : 0.55;
  const form = (succeeded ? 4.1 : -2.1) + readiness * 4.8 + formBias;
  const mobility = (succeeded ? 3.4 : -1.8) + readiness * 3.8 + mobilityBias;
  const volume = (succeeded ? volumeBias * 2.6 : -0.8);
  const fatigueSafety = succeeded ? 0.7 : -0.6;
  const multiplier = zoneScale * (succeeded ? 0.8 : 0.6);

  return {
    form: clampBuddyStats(form * multiplier, MAX_BUDDY_FORM, succeeded ? 0 : -6),
    mobility: clampBuddyStats(mobility * multiplier + fatigueSafety, MAX_BUDDY_MOBILITY, succeeded ? 0 : -5),
    volume: clampBuddyStats(volume * multiplier, MAX_BUDDY_VOLUME, succeeded ? 0 : -4),
  };
}

const FOCUSED_MUSCLES: Record<string, FocusMuscleBoost[]> = {
  recovery: [{ muscle: 'core', weight: 1 }],
  stability: [{ muscle: 'shoulders', weight: 1 }, { muscle: 'core', weight: 1 }],
  control: [{ muscle: 'arms', weight: 1 }, { muscle: 'triceps', weight: 1 }],
  endurance: [{ muscle: 'quads', weight: 1 }, { muscle: 'calves', weight: 1 }],
  power: [{ muscle: 'chest', weight: 2 }, { muscle: 'arms', weight: 2 }, { muscle: 'shoulders', weight: 1 }, { muscle: 'triceps', weight: 1 }],
  grip: [{ muscle: 'arms', weight: 3 }],
  lockout: [{ muscle: 'chest', weight: 1 }, { muscle: 'triceps', weight: 2 }, { muscle: 'core', weight: 1 }],
  'pull power': [{ muscle: 'back', weight: 3 }, { muscle: 'arms', weight: 1 }],
  'base drive': [{ muscle: 'quads', weight: 2 }, { muscle: 'core', weight: 2 }],
  tempo: [{ muscle: 'core', weight: 1 }, { muscle: 'quads', weight: 1 }],
  timing: [{ muscle: 'core', weight: 1 }, { muscle: 'shoulders', weight: 1 }, { muscle: 'back', weight: 1 }],
  strength: [{ muscle: 'chest', weight: 2 }, { muscle: 'back', weight: 1 }, { muscle: 'arms', weight: 2 }],
  durability: [{ muscle: 'quads', weight: 1 }, { muscle: 'calves', weight: 1 }, { muscle: 'core', weight: 1 }],
  precision: [{ muscle: 'triceps', weight: 1 }, { muscle: 'shoulders', weight: 1 }, { muscle: 'core', weight: 1 }],
  rhythm: [{ muscle: 'core', weight: 1 }, { muscle: 'calves', weight: 1 }],
  leverage: [{ muscle: 'back', weight: 2 }, { muscle: 'chest', weight: 1 }, { muscle: 'core', weight: 1 }],
  'back pressure': [{ muscle: 'back', weight: 3 }, { muscle: 'core', weight: 1 }],
  'raw strength': [{ muscle: 'chest', weight: 2 }, { muscle: 'arms', weight: 2 }],
  posture: [{ muscle: 'shoulders', weight: 1 }, { muscle: 'core', weight: 2 }],
  'core transfer': [{ muscle: 'core', weight: 2 }, { muscle: 'quads', weight: 1 }],
  'ground break': [{ muscle: 'quads', weight: 2 }, { muscle: 'calves', weight: 2 }, { muscle: 'core', weight: 1 }],
};

const TRAINER_MUSCLES: Array<{ key: keyof TrainerProfile['muscles']; label: string; detail: string }> = [
  { key: 'shoulders', label: 'Shoulders', detail: 'Capsule and deltoid depth' },
  { key: 'chest', label: 'Chest', detail: 'Upper chest and pec sweep' },
  { key: 'arms', label: 'Biceps/Forearm', detail: 'Forearm + curl width' },
  { key: 'triceps', label: 'Triceps', detail: 'Posterior elbow mass' },
  { key: 'back', label: 'Back', detail: 'Lats and upper torso width' },
  { key: 'core', label: 'Core', detail: 'Ab and oblique block' },
  { key: 'quads', label: 'Quads', detail: 'Upper leg drive mass' },
  { key: 'calves', label: 'Calves', detail: 'Lower-leg density' },
];

const SAVE_KEY = 'gymbuddies-save-v7';
const TEAM_SIZE = 6;
const BOSS_MIN_MS = 5 * 60 * 1000;
const BOSS_MAX_MS = 10 * 60 * 1000;

const HOME_MACHINES: GymMachine[] = [
  {
    id: 'home_recovery',
    name: 'Recovery Rack',
    detail: 'Low-load activation, shoulder re-training, and mobility flow.',
    focus: 'Recovery',
    xpMin: 1,
    xpMax: 3,
    xpMultiplier: 1.0,
    steroidChance: 0.26,
    hpRestore: 5,
    fatigueCost: 0,
  },
  {
    id: 'home_dumbbells',
    name: 'Mobility Dumbbells',
    detail: 'Slow, controlled presses to tighten lock angles and control.',
    focus: 'Stability',
    xpMin: 1,
    xpMax: 4,
    xpMultiplier: 1.06,
    steroidChance: 0.22,
    hpRestore: 3,
    fatigueCost: 1,
  },
  {
    id: 'home_plate',
    name: 'Technique Plate Stack',
    detail: 'Mini-overload sets for clean elbow path and wrist lock.',
    focus: 'Control',
    xpMin: 1,
    xpMax: 5,
    xpMultiplier: 1.12,
    steroidChance: 0.18,
    hpRestore: 2,
    fatigueCost: 1,
  },
  {
    id: 'home_bike',
    name: 'Foam Roller Bike',
    detail: 'Light cardio + bloodflow recovery for training volume.',
    focus: 'Endurance',
    xpMin: 1,
    xpMax: 4,
    xpMultiplier: 1.05,
    steroidChance: 0.2,
    hpRestore: 4,
    fatigueCost: 1,
  },
];

const STARTER_A_MACHINES: GymMachine[] = [
  {
    id: 'starter_a_bench',
    name: 'Flat Bench Press Rack',
    detail: 'Heavy pressing intervals for shoulder-endurance.',
    focus: 'Power',
    xpMin: 2,
    xpMax: 5,
    xpMultiplier: 1.18,
    steroidChance: 0.2,
    hpRestore: 2,
    fatigueCost: 2,
  },
  {
    id: 'starter_a_ropes',
    name: 'Rope Pulley Station',
    detail: 'Cable arcs teach wrist alignment and short reset speed.',
    focus: 'Grip',
    xpMin: 1,
    xpMax: 5,
    xpMultiplier: 1.15,
    steroidChance: 0.24,
    hpRestore: 2,
    fatigueCost: 2,
  },
  {
    id: 'starter_a_machine',
    name: 'Iso-Lock Cables',
    detail: 'Isometric holds for control under compression pressure.',
    focus: 'Lockout',
    xpMin: 2,
    xpMax: 6,
    xpMultiplier: 1.2,
    steroidChance: 0.18,
    hpRestore: 1,
    fatigueCost: 2,
  },
  {
    id: 'starter_a_rows',
    name: 'Hammer Strength Row',
    detail: 'Back and elbow path work for high-pressure grapples.',
    focus: 'Pull Power',
    xpMin: 2,
    xpMax: 6,
    xpMultiplier: 1.22,
    steroidChance: 0.2,
    hpRestore: 1,
    fatigueCost: 3,
  },
];

const STARTER_B_MACHINES: GymMachine[] = [
  {
    id: 'starter_b_leg',
    name: 'Hack Squat Machine',
    detail: 'Lower-body chains for stable stance and power transfer.',
    focus: 'Base Drive',
    xpMin: 3,
    xpMax: 6,
    xpMultiplier: 1.23,
    steroidChance: 0.2,
    hpRestore: 1,
    fatigueCost: 3,
  },
  {
    id: 'starter_b_cable',
    name: 'Selectorized Pulley',
    detail: 'Continuous arcs for controlled acceleration work.',
    focus: 'Tempo',
    xpMin: 2,
    xpMax: 6,
    xpMultiplier: 1.16,
    steroidChance: 0.18,
    hpRestore: 2,
    fatigueCost: 2,
  },
  {
    id: 'starter_b_pulley',
    name: 'Pulley Wall Rig',
    detail: 'High-tension pulling with precision lockout timing.',
    focus: 'Timing',
    xpMin: 3,
    xpMax: 5,
    xpMultiplier: 1.21,
    steroidChance: 0.22,
    hpRestore: 2,
    fatigueCost: 2,
  },
  {
    id: 'starter_b_leg_pulse',
    name: 'Leg Press Power Stack',
    detail: 'Pump and recover in short rounds to raise fight-stamina.',
    focus: 'Endurance',
    xpMin: 3,
    xpMax: 7,
    xpMultiplier: 1.25,
    steroidChance: 0.18,
    hpRestore: 1,
    fatigueCost: 4,
  },
];

const IRON_MACHINES: GymMachine[] = [
  {
    id: 'iron_armor',
    name: 'Smith Cage Press',
    detail: 'Guided barbell overload for dense, repeatable max-reps.',
    focus: 'Strength',
    xpMin: 3,
    xpMax: 8,
    xpMultiplier: 1.28,
    steroidChance: 0.2,
    hpRestore: 1,
    fatigueCost: 3,
  },
  {
    id: 'iron_row',
    name: 'Hammer Row Dynamo',
    detail: 'Engine-like back cycles for long fight rounds.',
    focus: 'Durability',
    xpMin: 4,
    xpMax: 7,
    xpMultiplier: 1.14,
    steroidChance: 0.22,
    hpRestore: 2,
    fatigueCost: 3,
  },
  {
    id: 'iron_chain',
    name: 'Chain Cable Stack',
    detail: 'Variable resistance for explosive lockout simulation.',
    focus: 'Lockout',
    xpMin: 4,
    xpMax: 8,
    xpMultiplier: 1.22,
    steroidChance: 0.17,
    hpRestore: 1,
    fatigueCost: 3,
  },
  {
    id: 'iron_grip',
    name: 'Fat Gripper Tower',
    detail: 'Thick handles and squeeze holds for late-round control.',
    focus: 'Grip',
    xpMin: 4,
    xpMax: 8,
    xpMultiplier: 1.24,
    steroidChance: 0.19,
    hpRestore: 1,
    fatigueCost: 4,
  },
];

const APEX_MACHINES: GymMachine[] = [
  {
    id: 'apex_platform',
    name: 'Plate-Loaded Squeeze Press',
    detail: 'Near-perfect tension under fatigue, controlled plate microloads.',
    focus: 'Precision',
    xpMin: 4,
    xpMax: 9,
    xpMultiplier: 1.31,
    steroidChance: 0.2,
    hpRestore: 1,
    fatigueCost: 4,
  },
  {
    id: 'apex_blink',
    name: 'Functional Row Matrix',
    detail: 'Short cycles with explosive resets and reset speed.',
    focus: 'Rhythm',
    xpMin: 3,
    xpMax: 9,
    xpMultiplier: 1.23,
    steroidChance: 0.24,
    hpRestore: 2,
    fatigueCost: 3,
  },
  {
    id: 'apex_harness',
    name: 'Weighted Harness',
    detail: 'Belt-loaded leverage control for long-match carry-over.',
    focus: 'Leverage',
    xpMin: 5,
    xpMax: 10,
    xpMultiplier: 1.35,
    steroidChance: 0.18,
    hpRestore: 1,
    fatigueCost: 4,
  },
  {
    id: 'apex_lat',
    name: 'Cable Lat Press',
    detail: 'Overhead and mid-back control for high-compression resistance.',
    focus: 'Back Pressure',
    xpMin: 5,
    xpMax: 10,
    xpMultiplier: 1.34,
    steroidChance: 0.2,
    hpRestore: 2,
    fatigueCost: 5,
  },
];

const GLORY_MACHINES: GymMachine[] = [
  {
    id: 'glory_crusher',
    name: 'Atlas Crusher',
    detail: 'Maximum overload cycles meant for late-game gym leaders.',
    focus: 'Raw Strength',
    xpMin: 6,
    xpMax: 10,
    xpMultiplier: 1.4,
    steroidChance: 0.24,
    hpRestore: 2,
    fatigueCost: 5,
  },
  {
    id: 'glory_mill',
    name: 'Spine Mill',
    detail: 'Precision endurance work to stay composed under pain.',
    focus: 'Posture',
    xpMin: 5,
    xpMax: 11,
    xpMultiplier: 1.28,
    steroidChance: 0.2,
    hpRestore: 2,
    fatigueCost: 4,
  },
  {
    id: 'glory_torso',
    name: 'Torso Matrix',
    detail: 'Machine-driven carryover for repeated clutch bursts.',
    focus: 'Core Transfer',
    xpMin: 6,
    xpMax: 12,
    xpMultiplier: 1.33,
    steroidChance: 0.23,
    hpRestore: 2,
    fatigueCost: 5,
  },
  {
    id: 'glory_deadlift',
    name: 'Monorail Deadlift Stack',
    detail: 'Boss-grade deadlift paths that punish weak stance.',
    focus: 'Ground Break',
    xpMin: 7,
    xpMax: 12,
    xpMultiplier: 1.38,
    steroidChance: 0.22,
    hpRestore: 1,
    fatigueCost: 6,
  },
];

const AREAS: GymArea[] = [
  {
    id: 'home',
    name: 'Home Gym',
    machines: HOME_MACHINES,
    type: 'home',
    levelMin: 1,
    levelMax: 1,
    blurb: 'Train and heal your team before entering encounters.',
  },
  {
    id: 'starter-a',
    name: 'Starter Gym A',
    machines: STARTER_A_MACHINES,
    type: 'starter',
    levelMin: 1,
    levelMax: 15,
    blurb: 'Low-risk captures and friendly arena pressure.',
  },
  {
    id: 'starter-b',
    name: 'Starter Gym B',
    machines: STARTER_B_MACHINES,
    type: 'starter',
    levelMin: 16,
    levelMax: 25,
    blurb: 'Mid-game catches. Your control matters more here.',
  },
  {
    id: 'higher-1',
    name: 'Iron Gym',
    machines: IRON_MACHINES,
    type: 'higher',
    levelMin: 26,
    levelMax: 35,
    blurb: 'Higher pressure and stronger opponents.',
  },
  {
    id: 'higher-2',
    name: 'Apex Gym',
    machines: APEX_MACHINES,
    type: 'higher',
    levelMin: 36,
    levelMax: 45,
    blurb: 'Late-band creatures, better prediction beats brute force.',
  },
  {
    id: 'higher-3',
    name: 'Glory Gym',
    machines: GLORY_MACHINES,
    type: 'higher',
    levelMin: 36,
    levelMax: 55,
    blurb: 'Rare encounters and mythological pressure matches.',
  },
];
const ALL_GYM_MACHINES = AREAS.flatMap((area) => area.machines);

const GYM_BOSSES: Record<string, GymBoss[]> = {};

const MOVES: Move[] = [
  { id: 'burst', title: 'Shoulder Burst', tactic: 'fast elbow drive', power: 16, control: -4 },
  { id: 'grind', title: 'Iron Grind', tactic: 'constant center-line pressure', power: 10, control: 10 },
  { id: 'snap', title: 'Snapping Hook', tactic: 'quick short push', power: 13, control: -1 },
];

const CREATURES: Creature[] = [
  {
    dex: 1,
    name: 'Brawny Bear',
    speciesHint: 'Bear',
    flavor: 'A real bear turned into a grappler with a loud chest slam.',
    isExotic: false,
    power: 26,
    sprite: ['..SSSS..', '.SSMMSS.', 'SSMMMMSS', 'SMMDDMMS', 'SMMMMMMS', 'SMMMMMMS', 'SMMSMMSM', '..SSSS..'],
    palette: { skin: '#f2c48c', core: '#5f3a26', detail: '#f7e0a8', accent: '#7b4e24' },
  },
  {
    dex: 2,
    name: 'Titan Tortoise',
    speciesHint: 'Tortoise',
    flavor: 'Shell first, then a heavy shoulder lock with little mercy.',
    isExotic: false,
    power: 22,
    sprite: ['..GGGG..', '.GGMMGG.', 'GGHHHHGG', 'GWWHHWWG', 'GWWHHWWG', 'GGHHHHGG', '.GGGGGG.', '..GGGG..'],
    palette: { skin: '#dbc39e', core: '#4f7345', detail: '#f5dd8f', accent: '#8d5f2d' },
  },
  {
    dex: 3,
    name: 'Iron Wolf',
    speciesHint: 'Wolf',
    flavor: 'It waits until your hands tremble, then hits the center line.',
    isExotic: false,
    power: 24,
    sprite: ['..EEE...', '..EHHH..', '.EHHHHH.', 'EMMHHHHE', 'EMMHHMHE', 'EEMMHHHE', '.EEMMHE.', '..EE....'],
    palette: { skin: '#d6c8a0', core: '#4d4f58', detail: '#2f2e6b', accent: '#f1c45f' },
  },
  {
    dex: 4,
    name: 'Muscled Boar',
    speciesHint: 'Boar',
    flavor: 'Short range, high pressure, no room for sloppy grips.',
    isExotic: false,
    power: 23,
    sprite: ['.RRRRRR.', 'RRRRRRRR', 'RRMMMMRR', 'RMMMMMMR', 'RMMMDDRR', 'RRMDDMRR', '.RRRMMR.', '..RRRR..'],
    palette: { skin: '#f2b074', core: '#7b2d1f', detail: '#7a4f2b', accent: '#6c8b45' },
  },
  {
    dex: 5,
    name: 'Ripped Rhino',
    speciesHint: 'Rhino',
    flavor: 'One horn-like push can decide the entire encounter.',
    isExotic: false,
    power: 29,
    sprite: ['..HHHH..', '.HHHHHH.', 'HHHHHHHH', 'HHMMMMHH', 'HHMMMMHH', 'HMMMMMMH', '.HHHHHH.', '..HHHH..'],
    palette: { skin: '#eadbc0', core: '#7a7d84', detail: '#8e4e38', accent: '#c58a56' },
  },
  {
    dex: 6,
    name: 'Boulder Bison',
    speciesHint: 'Bison',
    flavor: 'Burst first, squeeze until your wrists burn, then keep it tight.',
    isExotic: false,
    power: 27,
    sprite: ['..PPPP..', '.PPPPPP.', 'PPWWWWPP', 'PWWMMWWP', 'PWWMMWWP', 'PWWWWWWP', '.PWWWWP.', '..PPPP..'],
    palette: { skin: '#efe3bc', core: '#7f5a38', detail: '#6c4d2e', accent: '#c7a84e' },
  },
  {
    dex: 7,
    name: 'Buff Otter',
    speciesHint: 'Otter',
    flavor: 'Looks easygoing, but its core locks are deceptive.',
    isExotic: false,
    power: 21,
    sprite: ['..GGGG..', '.GGMMGG.', 'GGMWWMGG', 'GMWWWWMG', 'GMGGGGMG', 'GMGMMGMG', 'GGMMMMGG', '..GGGG..'],
    palette: { skin: '#d3aa86', core: '#53709b', detail: '#925c37', accent: '#f6dfa1' },
  },
  {
    dex: 50,
    name: 'Slycera Griffin',
    speciesHint: 'Griffin',
    flavor: 'A mythic winged body that refuses cheap captures.',
    isExotic: true,
    power: 34,
    sprite: ['..AAAA..', '.AAMMEE.', 'AAMMWWAA', 'AAWWWWAA', 'AAMWWWAA', 'AAWWWWAA', '.AAMWAA.', '..AAAA..'],
    palette: { skin: '#f7d28f', core: '#c23b50', detail: '#ffefba', accent: '#5a4ed6' },
  },
  {
    dex: 51,
    name: 'Cinder Manticore',
    speciesHint: 'Manticore',
    flavor: 'Mythic cat-body reflexes with heavy core resistance.',
    isExotic: true,
    power: 38,
    sprite: ['..FFFF..', 'FFFFFFFF', 'FFMMMMFF', 'FMMWWWFF', 'FMMWWWFF', 'FMWWWWMF', 'F.MWWWF.', '..FFFF..'],
    palette: { skin: '#f4c67a', core: '#4c4cd9', detail: '#f8f1bf', accent: '#ad3f6c' },
  },
  {
    dex: 52,
    name: 'Hydra Lurcher',
    speciesHint: 'Hydra',
    flavor: 'Mythic stamina and repeated counters in the final rounds.',
    isExotic: true,
    power: 40,
    sprite: ['..BBBB..', '.BBBBBB.', 'BBBBBBBB', 'BBMBBMBB', 'BBMMMMBB', 'BMMMBBMB', '.BBBBBB.', '..BBBB..'],
    palette: { skin: '#f6ab63', core: '#302f64', detail: '#b84848', accent: '#a25f34' },
  },
  {
    dex: 53,
    name: 'Pygmy Sable Pegasus',
    speciesHint: 'Pegasus',
    flavor: 'It uses elegant footwork to escape until you find a seam.',
    isExotic: true,
    power: 36,
    sprite: ['..CCCC..', '.CCMMCC.', 'CCMMMMCC', 'CMWWWWMC', 'CMWMMWMC', 'CMWMMWMC', '.CMWWMC.', '..CCCC..'],
    palette: { skin: '#f3cc97', core: '#385db3', detail: '#fbe5b0', accent: '#8d71eb' },
  },
  {
    dex: 54,
    name: 'Titan Gorilla',
    speciesHint: 'Gorilla',
    flavor: 'Quiet, low-gear pressure. Then a brutal last pull.',
    isExotic: false,
    power: 30,
    sprite: ['..BBBB..', '.BBBBBB.', 'BBMMMMBB', 'BBMDDMBB', 'BBMMMMBB', 'BBMMMMBB', '.BBBBBB.', '..BBBB..'],
    palette: { skin: '#d6ad7b', core: '#5f4d33', detail: '#b67a46', accent: '#8b4f2e' },
  },
];

Object.assign(GYM_BOSSES, {
  home: [
    { id: 'home-watchman', name: 'Mat Watchman', creature: CREATURES[0], levelShift: 4, catchMultiplier: 0.7, powerBoost: 9 },
    { id: 'home-librarian', name: 'Steel Desk Warden', creature: CREATURES[6], levelShift: 3, catchMultiplier: 0.7, powerBoost: 7 },
  ],
  'starter-a': [
    { id: 'a-rhino', name: 'Bench Rhino', creature: CREATURES[4], levelShift: 7, catchMultiplier: 0.62, powerBoost: 14 },
    { id: 'a-bison', name: 'Redline Bison', creature: CREATURES[5], levelShift: 8, catchMultiplier: 0.58, powerBoost: 16 },
  ],
  'starter-b': [
    { id: 'b-wolf', name: 'Iron Wolf Brute', creature: CREATURES[2], levelShift: 9, catchMultiplier: 0.55, powerBoost: 18 },
    { id: 'b-boar', name: 'Bull Boar Prime', creature: CREATURES[3], levelShift: 8, catchMultiplier: 0.56, powerBoost: 17 },
  ],
  'higher-1': [
    { id: 'h1-gryphon', name: 'Iron Griffon', creature: CREATURES[7], levelShift: 12, catchMultiplier: 0.52, powerBoost: 22 },
    { id: 'h1-gorilla', name: 'Glory Gorilla Mk.I', creature: CREATURES[10], levelShift: 11, catchMultiplier: 0.5, powerBoost: 24 },
  ],
  'higher-2': [
    { id: 'h2-hydra', name: 'Apex Hydra', creature: CREATURES[8], levelShift: 13, catchMultiplier: 0.5, powerBoost: 25 },
    { id: 'h2-manticore', name: 'Apex Manticore', creature: CREATURES[9], levelShift: 12, catchMultiplier: 0.48, powerBoost: 27 },
  ],
  'higher-3': [
    { id: 'h3-pegasus', name: 'Glory Pegasus', creature: CREATURES[10], levelShift: 14, catchMultiplier: 0.48, powerBoost: 28 },
    { id: 'h3-pegas', name: 'Glory Twin Pegasus', creature: CREATURES[7], levelShift: 15, catchMultiplier: 0.45, powerBoost: 30 },
  ],
});

const FANCY_NAMES = [
  'Muscle Mommy',
  'Bench Bro',
  'Squat Siren',
  'Curl Captain',
  'Plate Whisperer',
  'Wrist-Railer',
  'Grip Guru',
  'Dumbbell Diva',
  'Snatch Ninja',
  'Rope Rebel',
  'Tough Toad',
  'Pectoral Pete',
  'Iron Mama',
];

const TRAINER_PRESETS: TrainerProfile[] = [
  {
    name: 'Rogue Rex',
    skin: '#f2c48c',
    hair: '#4f3a20',
    top: '#2e66af',
    shoes: '#252525',
    glove: '#f3c56b',
    muscles: { shoulders: 4, chest: 3, arms: 3, triceps: 2, back: 2, core: 2, quads: 1, calves: 1 },
  },
  {
    name: 'Neon Nova',
    skin: '#d9b88f',
    hair: '#262626',
    top: '#6c2f8f',
    shoes: '#0f1020',
    glove: '#ffd166',
    muscles: { shoulders: 3, chest: 2, arms: 4, triceps: 3, back: 2, core: 3, quads: 1, calves: 2 },
  },
  {
    name: 'Copper Coil',
    skin: '#d6ad7b',
    hair: '#5a3520',
    top: '#b84f39',
    shoes: '#26262a',
    glove: '#ff7f50',
    muscles: { shoulders: 2, chest: 5, arms: 2, triceps: 2, back: 3, core: 2, quads: 2, calves: 1 },
  },
  {
    name: 'Iron Jade',
    skin: '#f0d0a3',
    hair: '#1f1f17',
    top: '#2f8f75',
    shoes: '#2f2f38',
    glove: '#97d700',
    muscles: { shoulders: 5, chest: 4, arms: 3, triceps: 3, back: 4, core: 4, quads: 3, calves: 2 },
  },
];

const TUTORIAL_STEPS = [
  'Move to Home Gym, pick a trainer name, and select your gear colors.',
  'Train your active Buddy on Home Gym machines to earn XP and Steroids.',
  'Scout a wild Buddy in Starter Gym A/B, then start a match.',
  'Press moves until the meter hits your side and lock in a catch.',
  'Watch for boss encounters in any gym every 5 to 10 minutes and beat them for progress.',
];

type WorldPosition = {
  x: number;
  y: number;
};

const WORLD_MOVE_COOLDOWN_MS = 220;
const WORLD_ROUTE_ENCOUNTER_COOLDOWN_MS = 1800;
const WORLD_GRID_WIDTH = 23;
const WORLD_GRID_HEIGHT = 10;
const WORLD_GRID_PADDING = 8;
const WORLD_TILE_PX = 19;
const WORLD_TILE_GAP = 2;
const WORLD_TILE_PITCH = WORLD_TILE_PX + WORLD_TILE_GAP;

const zoneNames = Object.fromEntries(AREAS.map((a) => [a.id, a.name])) as Record<string, string>;
const ZONE_VIBES: Record<
  string,
  { icon: string; mood: string; theme: string; accent: string }
> = {
  home: { icon: '🏠', mood: 'Home warm-up hall', theme: 'calm baseline', accent: 'Recovery' },
  'starter-a': { icon: '🏋', mood: 'Starter pressure room', theme: 'steady overload', accent: 'Momentum' },
  'starter-b': { icon: '🛡', mood: 'Starter control pit', theme: 'grip discipline', accent: 'Tension' },
  'higher-1': { icon: '⚔', mood: 'Higher gate', theme: 'first gauntlet', accent: 'Grip war' },
  'higher-2': { icon: '🔥', mood: 'Higher forge', theme: 'mythic trials', accent: 'Resolve' },
  'higher-3': { icon: '🏆', mood: 'Final deck', theme: 'late-game pressure', accent: 'Dominance' },
};

const WORLD_ROUTES: Record<string, string[]> = {
  home: ['starter-a'],
  'starter-a': ['home', 'starter-b'],
  'starter-b': ['starter-a', 'higher-1'],
  'higher-1': ['starter-b', 'higher-2'],
  'higher-2': ['higher-1', 'higher-3'],
  'higher-3': ['higher-2'],
};

const WORLD_ZONE_POSITIONS: Record<string, WorldPosition> = {
  home: { x: 2, y: 6 },
  'starter-a': { x: 6, y: 6 },
  'starter-b': { x: 10, y: 6 },
  'higher-1': { x: 10, y: 3 },
  'higher-2': { x: 14, y: 3 },
  'higher-3': { x: 18, y: 3 },
};

const WORLD_DIRECTION_VECTORS: Record<CardinalDirection, WorldPosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const WORLD_TILE_KEY = (pos: WorldPosition) => `${pos.x},${pos.y}`;

function addPathTile(setRef: Set<string>, from: WorldPosition, to: WorldPosition) {
  let x = from.x;
  let y = from.y;
  const deltaX = clamp(Math.sign(to.x - from.x), -1, 1);
  const deltaY = clamp(Math.sign(to.y - from.y), -1, 1);
  setRef.add(WORLD_TILE_KEY({ x, y }));
  while (x !== to.x || y !== to.y) {
    if (x !== to.x) {
      x += deltaX;
    } else if (y !== to.y) {
      y += deltaY;
    }
    setRef.add(WORLD_TILE_KEY({ x, y }));
  }
}

function buildWorldWalkableMap() {
  const walkable = new Set<string>();
  const zoneAt = new Map<string, string>();
  Object.entries(WORLD_ZONE_POSITIONS).forEach(([zoneId, position]) => {
    const key = WORLD_TILE_KEY(position);
    walkable.add(key);
    zoneAt.set(key, zoneId);
  });

  const seenEdges = new Set<string>();
  for (const [from, to] of WORLD_PATH_LINKS) {
    const edgeKey = [from, to].sort().join('::');
    if (seenEdges.has(edgeKey)) continue;
    seenEdges.add(edgeKey);
    const fromPos = WORLD_ZONE_POSITIONS[from];
    const toPos = WORLD_ZONE_POSITIONS[to];
    if (!fromPos || !toPos) continue;
    addPathTile(walkable, fromPos, toPos);
  }

  return {
    walkable,
    zoneAt,
  };
}

const WORLD_WALKABLE = buildWorldWalkableMap();
const WORLD_WALKABLE_TILES = WORLD_WALKABLE.walkable;
const WORLD_ZONE_BY_TILE = WORLD_WALKABLE.zoneAt;

function worldTileZoneId(pos: WorldPosition) {
  return WORLD_ZONE_BY_TILE.get(WORLD_TILE_KEY(pos)) ?? null;
}

function isWorldTileWalkable(pos: WorldPosition) {
  const key = WORLD_TILE_KEY(pos);
  return (
    Number.isInteger(pos.x) &&
    Number.isInteger(pos.y) &&
    pos.x >= 0 &&
    pos.y >= 0 &&
    pos.x < WORLD_GRID_WIDTH &&
    pos.y < WORLD_GRID_HEIGHT &&
    WORLD_WALKABLE_TILES.has(key)
  );
}

function worldTileToStyle(pos: WorldPosition) {
  return {
    left: WORLD_GRID_PADDING + pos.x * WORLD_TILE_PITCH,
    top: WORLD_GRID_PADDING + pos.y * WORLD_TILE_PITCH,
  };
}

function routeProfileFromZones(fromZoneId: string | null, toZoneId: string | null) {
  if (!fromZoneId || !toZoneId || fromZoneId === toZoneId) return null;
  return WORLD_ROUTE_PATH_MAP[getOrderedRouteKey(fromZoneId, toZoneId)] ?? null;
}

function routeFatigueCost(fromZoneId: string | null, toZoneId: string | null, zoneType: 'home' | 'starter' | 'higher') {
  const profile = routeProfileFromZones(fromZoneId, toZoneId);
  return profile?.travelFatigue ?? WORLD_ROUTE_FATIGUE_BY_ZONETYPE[zoneType];
}

function routeEncounterBoost(fromZoneId: string | null, toZoneId: string | null) {
  const profile = routeProfileFromZones(fromZoneId, toZoneId);
  return profile?.encounterBoost ?? 0;
}

const WORLD_ROUTE_ENCOUNTER_RATE: Record<'home' | 'starter' | 'higher', number> = {
  home: 0,
  starter: 0.16,
  higher: 0.22,
};
const WORLD_ROUTE_FATIGUE_BY_ZONETYPE: Record<'home' | 'starter' | 'higher', number> = {
  home: 0.5,
  starter: 0.9,
  higher: 1.2,
};
const WORLD_PATH_LINKS: Array<[string, string]> = [
  ['home', 'starter-a'],
  ['starter-a', 'starter-b'],
  ['starter-b', 'higher-1'],
  ['higher-1', 'higher-2'],
  ['higher-2', 'higher-3'],
];
function getOrderedRouteKey(fromZoneId: string, toZoneId: string) {
  return [fromZoneId, toZoneId].sort().join('|');
}
const WORLD_ROUTE_PATHS: WorldRouteConnection[] = [
  {
    from: 'home',
    to: 'starter-a',
    routeName: 'Warm Up Path',
    travelFatigue: 0.3,
    encounterBoost: 0,
  },
  {
    from: 'starter-a',
    to: 'starter-b',
    routeName: 'Starter Link Road',
    travelFatigue: 0.65,
    encounterBoost: 0.02,
  },
  {
    from: 'starter-b',
    to: 'higher-1',
    routeName: 'Iron Gate Trail',
    travelFatigue: 1,
    encounterBoost: 0.04,
  },
  {
    from: 'higher-1',
    to: 'higher-2',
    routeName: 'Forge Stretch',
    travelFatigue: 1.2,
    encounterBoost: 0.05,
  },
  {
    from: 'higher-2',
    to: 'higher-3',
    routeName: 'Champion Ascent',
    travelFatigue: 1.6,
    encounterBoost: 0.07,
  },
];
const WORLD_ROUTE_PATH_MAP = Object.fromEntries(
  WORLD_ROUTE_PATHS.map((entry) => [getOrderedRouteKey(entry.from, entry.to), entry]),
) as Record<string, WorldRouteConnection>;

const STARTING_ZONE_ID = 'home';
const FALLBACK_UNLOCKED_ZONES = [STARTING_ZONE_ID, ...(WORLD_ROUTES[STARTING_ZONE_ID] ?? [])];

function uniqueStrings(items: string[]) {
  return [...new Set(items)];
}

function normalizeUnlockedZones(raw: string[] | undefined, fallback: string[] = FALLBACK_UNLOCKED_ZONES) {
  const zoneSet = new Set(AREAS.map((zone) => zone.id));
  const normalized = uniqueStrings([...fallback, ...(raw ?? [])]).filter((zoneId) => zoneSet.has(zoneId));
  return normalized.length > 0 ? normalized : [STARTING_ZONE_ID];
}

function unlockAdjacentZones(known: string[], zoneId: string) {
  const expanded = [...(known ?? []), zoneId, ...(WORLD_ROUTES[zoneId] ?? [])];
  return normalizeUnlockedZones(expanded, FALLBACK_UNLOCKED_ZONES);
}

function formatRemainingTime(ms: number) {
  const left = Math.max(0, Math.ceil(ms / 1000));
  if (left <= 0) return 'ready';
  const minutes = Math.floor(left / 60);
  const seconds = left % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(items: T[]) {
  return items[randInt(0, items.length - 1)];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function workoutFailureChance(
  machine: GymMachine,
  buddy: Buddy,
  zoneType: 'home' | 'starter' | 'higher',
  trainerBonus: number,
  readiness = 1,
) {
  const buddyProfile = workoutBuddyProfile(buddy);
  const stress = clamp((machine.fatigueCost - machine.hpRestore + 1) / 8, 0, 0.25);
  const wear = buddy.hp <= 0 ? 0.25 : clamp((buddy.maxHp - buddy.hp) / buddy.maxHp, 0, 0.28);
  const readinessFactor = clamp(1.4 - readiness * 0.6, 0.6, 1.4);
  const base =
    (BASE_TRAIN_FAIL_CHANCE + stress + wear) * machineDifficultyMultiplier(zoneType) * readinessFactor -
    trainerBonus -
    buddyProfile.failureSafety;
  return clamp(base, 0.15, 0.85);
}

function workoutReadinessLabel(readiness: number) {
  if (readiness >= 0.85) return 'Peak';
  if (readiness >= 0.68) return 'Solid';
  if (readiness >= 0.52) return 'Worn';
  return 'Depleted';
}

function workoutMomentumFactor(workoutMomentum = 0) {
  return clamp01(workoutMomentum / WORKOUT_MOMENTUM_MAX);
}

function workoutMomentumLabel(workoutMomentum = 0) {
  if (workoutMomentum >= 24) return 'Flow state';
  if (workoutMomentum >= 16) return 'Strong rhythm';
  if (workoutMomentum >= 8) return 'Building';
  if (workoutMomentum >= 4) return 'Warming up';
  return 'Cold';
}

function workoutLoadPressure(
  machine: GymMachine,
  buddy: Buddy,
  zoneType: 'home' | 'starter' | 'higher',
  readiness: number,
  trainingFatigue = 0,
  workoutMomentum = 0,
) {
  const profile = workoutBuddyProfile(buddy);
  const momentumFactor = workoutMomentumFactor(workoutMomentum);
  const fatigueRatio = clamp01(trainingFatigue / MAX_TRAINING_FATIGUE);
  const baseEffort = clamp((machine.fatigueCost + machine.xpMultiplier) / 10, 0.09, 0.85);
  const recoveryDrag = clamp((machine.fatigueCost - machine.hpRestore) / 10, 0, 0.5);
  const zoneDrag = zoneType === 'higher' ? 0.22 : zoneType === 'starter' ? 0.11 : 0.05;
  const movementDrag = clamp(0.42 - profile.movementConsistency, 0, 0.36);
  const volumeDrag = clamp((MAX_BUDDY_VOLUME - buddy.volume) / MAX_BUDDY_VOLUME, 0, 0.14);
  const readinessBuffer = readiness * 0.45;
  return clamp(baseEffort + recoveryDrag + zoneDrag + movementDrag + volumeDrag - readinessBuffer - momentumFactor * 0.24 + fatigueRatio * 0.18, 0, 1);
}

function workoutLoadTier(pressure: number): WorkoutLoadTier {
  if (pressure >= 0.8) return 'max';
  if (pressure >= 0.64) return 'hard';
  if (pressure >= 0.47) return 'steady';
  return 'easy';
}

function workoutSetStress(
  loadPressure: number,
  readiness: number,
  trainingFatigue = 0,
  zoneType: 'home' | 'starter' | 'higher' = 'starter',
  loadTier: WorkoutLoadTier = 'easy',
) {
  const fatigueRatio = clamp01(trainingFatigue / MAX_TRAINING_FATIGUE);
  const zoneDrag = zoneType === 'higher' ? 0.09 : zoneType === 'starter' ? 0.03 : 0;
  const tierDrag = loadTier === 'max' ? 0.22 : loadTier === 'hard' ? 0.11 : 0;
  const readinessRecovery = readiness * 0.35;
  return clamp(loadPressure + fatigueRatio * 0.3 + zoneDrag + tierDrag - readinessRecovery, 0, 1);
}

function workoutSetStressLabel(setStress: number) {
  if (setStress >= 0.86) return 'Critical overload';
  if (setStress >= 0.7) return 'High strain';
  if (setStress >= 0.52) return 'Moderate strain';
  if (setStress >= 0.34) return 'Controlled';
  return 'Light';
}

function workoutReadiness(
  machine: GymMachine,
  buddy: Buddy,
  trainer: TrainerProfile,
  zoneType: 'home' | 'starter' | 'higher',
  trainingFatigue = 0,
  workoutMomentum = 0,
) {
  const buddyProfile = workoutBuddyProfile(buddy);
  const hpRatio = clamp01(buddy.hp / Math.max(1, buddy.maxHp));
  const formRatio = clamp01(buddy.form / MAX_BUDDY_FORM);
  const mobilityRatio = clamp01(buddy.mobility / MAX_BUDDY_MOBILITY);
  const machineRecoveryBias = clamp((machine.hpRestore - machine.fatigueCost + 4) / 10, -0.6, 0.6);
  const trainerDensity = Object.values(trainer.muscles).reduce((sum, value) => sum + value, 0) / (8 * MAX_MUSCLE_LEVEL);
  const focusMatch = machineFocusScore(machine, trainer) * 0.16;
  const zoneDifficulty = zoneType === 'higher' ? 0.16 : zoneType === 'starter' ? 0.08 : 0;
  const fatiguePenalty = clamp01(trainingFatigue / MAX_TRAINING_FATIGUE) * 0.34;
  const buddyFormBonus = formRatio * 0.14 + mobilityRatio * 0.1;
  const momentumBonus = workoutMomentumFactor(workoutMomentum) * 0.12;

  return clamp01(
    0.22 +
      hpRatio * 0.48 +
      machineRecoveryBias * 0.32 +
      trainerDensity * 0.24 +
      focusMatch +
      buddyFormBonus +
      buddyProfile.readinessSupport -
      zoneDifficulty +
      momentumBonus -
      fatiguePenalty,
  );
}

function workoutBuddyProfile(buddy: Buddy) {
  const formRatio = clamp01(buddy.form / MAX_BUDDY_FORM);
  const mobilityRatio = clamp01(buddy.mobility / MAX_BUDDY_MOBILITY);
  const volumeRatio = clamp01(buddy.volume / MAX_BUDDY_VOLUME);
  const movementConsistency = clamp01(formRatio * 0.45 + mobilityRatio * 0.4 + volumeRatio * 0.15);

  return {
    formRatio,
    mobilityRatio,
    volumeRatio,
    movementConsistency,
    failureSafety: clamp((movementConsistency - 0.45) * 0.34, -0.14, 0.16),
    readinessSupport: clamp((movementConsistency - 0.4) * 0.08, -0.03, 0.08),
    fatigueRecoveryBonus: clamp((movementConsistency - 0.45) * 11, -5, 10),
    hpLossResistance: clamp((movementConsistency - 0.45) * 0.28, -0.22, 0.3),
    bossSteady: clamp((mobilityRatio - 0.45) * 0.12, -0.06, 0.06),
  };
}

function workoutSpotSuccessChance(
  windowMsRemaining: number,
  base = BASE_SPOT_SUCCESS_CHANCE,
  zoneType: 'home' | 'starter' | 'higher' = 'starter',
) {
  const ratio = clamp01(windowMsRemaining / WORKOUT_SPOT_WINDOW_MS);
  const multiplier = spotCurveMultiplier(zoneType);
  return clamp(base + ratio * multiplier, zoneType === 'higher' ? 0.35 : 0.4, 0.95);
}

function roundForDisplay(value: number) {
  return `${Math.max(0, value)}`;
}

const BGM_NOTES: Record<
  MusicIntensity,
  {
    ambient: number[];
    scout: number[];
    boss: number[];
    interval: number;
  }
> = {
  home: {
    ambient: [110, 131, 146, 164],
    scout: [123, 146, 164, 146],
    boss: [88, 110, 123, 131],
    interval: 470,
  },
  starter: {
    ambient: [147, 165, 196, 175],
    scout: [165, 196, 220, 247, 220],
    boss: [220, 247, 262, 294, 247],
    interval: 360,
  },
  higher: {
    ambient: [196, 220, 247, 294],
    scout: [220, 247, 262, 294, 262],
    boss: [294, 330, 349, 392, 330],
    interval: 255,
  },
};

function clamp01(value: number) {
  return clamp(value, 0, 1);
}

function createTone() {
  const audioCtx = window.AudioContext || (window as any).webkitAudioContext;
  return new audioCtx();
}

function scheduleTone(context: AudioContext, destination: GainNode, frequency: number, duration: number, intensity: number, wave: OscillatorType = 'triangle') {
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const amp = clamp01(intensity);
  oscillator.type = wave;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(amp * 0.26, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.05);
}

function createAudioEngine(): AudioEngine {
  const context = createTone() as AudioContext;
  const masterGain = context.createGain();
  const musicGain = context.createGain();
  const sfxGain = context.createGain();
  masterGain.connect(context.destination);
  musicGain.connect(masterGain);
  sfxGain.connect(masterGain);
  masterGain.gain.value = 1;
  musicGain.gain.value = 0.48;
  sfxGain.gain.value = 0.82;

  const engine: AudioEngine = {
    context,
    masterGain,
    musicGain,
    sfxGain,
    musicTicker: null,
    enabled: true,
    zone: 'ambient',
    intensity: 'starter',
    step: 0,
    stepNotes: BGM_NOTES.starter.ambient,
    setEnabled(value) {
      this.enabled = value;
      this.masterGain.gain.value = value ? 1 : 0;
      if (!value) {
        this.stopMusic();
      }
    },
    setVolumes(music, sfx) {
      this.musicGain.gain.value = clamp01(music);
      this.sfxGain.gain.value = clamp01(sfx);
    },
    stopMusic() {
      if (this.musicTicker) {
        clearInterval(this.musicTicker);
      }
      this.musicTicker = null;
      this.step = 0;
    },
    startMusic(zone, intensity) {
      this.stopMusic();
      if (!this.enabled) return;
      this.zone = zone;
      this.intensity = intensity;
      const profile = BGM_NOTES[intensity];
      const base = zone === 'home' ? profile.ambient : zone === 'boss' ? profile.boss : profile.scout;
      this.stepNotes = zone === 'fight' ? profile.scout : base;
      this.context.resume();
      if (this.context.state !== 'running') {
        return;
      }
      this.musicTicker = setInterval(() => {
        if (this.context.state !== 'running' || !this.enabled) {
          return;
        }
        const current = this.stepNotes[this.step % this.stepNotes.length];
        scheduleTone(this.context, this.musicGain, current * (zone === 'boss' ? 1.12 : 1), 0.15, 0.4, this.intensity === 'home' ? 'sine' : 'triangle');
        scheduleTone(this.context, this.musicGain, current * 1.9, 0.09, 0.22, 'sawtooth');
        if (this.intensity === 'higher' || zone === 'boss') {
          scheduleTone(this.context, this.musicGain, current * 1.18, 0.065, 0.16, 'triangle');
        }
        this.step += 1;
      }, this.intensity === 'higher' ? 230 : profile.interval);
    },
    pulseTone(frequency, duration, gainValue, wave = 'triangle') {
      if (!this.enabled || this.context.state !== 'running') return;
      scheduleTone(this.context, this.sfxGain, frequency, duration, gainValue, wave);
    },
    emitSfx(event, intensity = 1) {
      if (!this.enabled || this.context.state !== 'running') return;
      const baseGain = 0.2 + Math.min(intensity, 1.4);
      if (event === 'train') {
        this.pulseTone(220, 0.06, baseGain * 0.6, 'triangle');
        this.pulseTone(275, 0.08, baseGain * 0.4, 'triangle');
      } else if (event === 'steroid') {
        this.pulseTone(330, 0.14, baseGain * 0.55, 'sawtooth');
        this.pulseTone(440, 0.09, baseGain * 0.4, 'triangle');
      } else if (event === 'matchStart') {
        this.pulseTone(164, 0.12, baseGain * 0.52, 'sine');
        this.pulseTone(220, 0.12, baseGain * 0.55, 'sine');
        this.pulseTone(294, 0.09, baseGain * 0.44, 'triangle');
      } else if (event === 'moveGood') {
        this.pulseTone(349, 0.05, baseGain * 0.45, 'triangle');
      } else if (event === 'moveBad') {
        this.pulseTone(196, 0.07, baseGain * 0.38, 'triangle');
      } else if (event === 'catchAlmost') {
        this.pulseTone(262, 0.12, baseGain * 0.5, 'triangle');
      } else if (event === 'catchWin') {
        scheduleTone(this.context, this.sfxGain, 330, 0.1, baseGain * 0.5, 'triangle');
        scheduleTone(this.context, this.sfxGain, 392, 0.1, baseGain * 0.55, 'triangle');
        scheduleTone(this.context, this.sfxGain, 523, 0.17, baseGain * 0.35, 'sine');
      } else if (event === 'bossAlert') {
        this.pulseTone(523, 0.16, baseGain * 0.35, 'square');
        this.pulseTone(466, 0.11, baseGain * 0.32, 'square');
      } else if (event === 'teamFull') {
        this.pulseTone(147, 0.11, baseGain * 0.36, 'triangle');
      } else if (event === 'escape') {
        this.pulseTone(164, 0.09, baseGain * 0.4, 'sine');
      } else if (event === 'zoneShift') {
        this.pulseTone(246, 0.09, baseGain * 0.3, 'sine');
        this.pulseTone(185, 0.07, baseGain * 0.33, 'triangle');
      }
    },
    dispose() {
      this.stopMusic();
      this.context.close();
    },
  };

  return engine;
}

function getCatchChance(level: number, isExotic: boolean) {
  if (isExotic) return 0.4;
  if (level <= 15) return 0.9;
  if (level <= 25) return 0.85;
  if (level <= 35) return 0.8;
  return 0.7;
}

function nowMs() {
  return Date.now();
}

function bossInterval() {
  return randInt(Math.floor(BOSS_MIN_MS / 60000), Math.floor(BOSS_MAX_MS / 60000)) * 60 * 1000;
}

function bossForZone(zoneId: string): GymBoss[] {
  return GYM_BOSSES[zoneId] ?? GYM_BOSSES[AREAS[1].id];
}

function xpNeeded(level: number) {
  return Math.max(8, level * 5);
}

function seedBuddy(seed: number, creature: Creature, level = 4): Buddy {
  const maxHp = 34 + level * 4;
  return {
    id: `seed-${seed}`,
    nickname: `${randomChoice(FANCY_NAMES)} #${seed}`,
    creature,
    level,
    hp: maxHp,
    maxHp,
    xp: 0,
    form: clampBuddyStats(8 + Math.min(8, level), MAX_BUDDY_FORM),
    mobility: clampBuddyStats(9 + Math.min(6, level), MAX_BUDDY_MOBILITY),
    volume: clampBuddyStats(1 + Math.max(1, Math.floor(level / 2)), MAX_BUDDY_VOLUME),
  };
}

function classForPixel(cell: string) {
  switch (cell) {
    case 'M':
    case 'S':
      return 'pixel-main';
    case 'D':
      return 'pixel-core';
    case 'E':
      return 'pixel-detail';
    case 'W':
      return 'pixel-core';
    case 'H':
    case 'P':
      return 'pixel-accent';
    case 'R':
      return 'pixel-detail';
    default:
      return 'pixel-empty';
  }
}

function trainerTemplate() {
  return [
    '.HHH.....',
    'HHSHH....',
    '.SSCCSS..',
    'SSSTTCC.',
    '.UUBBB..',
    '.UGGGA..',
    '.PAA....',
    '.P..AA..',
  ];
}

function hexToRgb(hex: string) {
  const sanitized = hex.replace('#', '');
  const value = parseInt(sanitized.length === 3 ? sanitized.split('').map((c) => c + c).join('') : sanitized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex(value: number) {
  return `#${value.toString(16).padStart(6, '0')}`;
}

function blendHex(base: string, blend: string, ratio: number) {
  const source = hexToRgb(base);
  const target = hexToRgb(blend);
  const mixed = {
    r: Math.round(source.r + (target.r - source.r) * ratio),
    g: Math.round(source.g + (target.g - source.g) * ratio),
    b: Math.round(source.b + (target.b - source.b) * ratio),
  };
  return rgbToHex(((mixed.r << 16) | (mixed.g << 8) | mixed.b) >>> 0);
}

function clampMuscles(muscles: TrainerProfile['muscles']) {
  const next = { ...muscles } as TrainerProfile['muscles'];
  (Object.keys(next) as Array<keyof TrainerProfile['muscles']>).forEach((key) => {
    next[key] = clamp(next[key], 0, MAX_MUSCLE_LEVEL);
  });
  return next;
}

function trainerFromFocus(focus: string) {
  const key = focus.toLowerCase();
  return FOCUSED_MUSCLES[key] ?? FOCUSED_MUSCLES[Object.keys(FOCUSED_MUSCLES).find((k) => key.includes(k)) ?? 'control'];
}

function applyTrainerGrowth(trainer: TrainerProfile, focus: string, intensity: number, bonus: number) {
  const gains = trainerFromFocus(focus);
  const gainTotal = Math.max(1, intensity + bonus);
  const totalWeight = gains.reduce((acc, item) => acc + item.weight, 0);
  const profile = { ...trainer.muscles };
  let distributed = 0;

  gains.forEach((entry) => {
    const raw = Math.floor((gainTotal * entry.weight) / totalWeight);
    const amount = Math.max(0, Math.min(3, raw));
    profile[entry.muscle] += amount;
    distributed += amount;
  });

  const remainder = gainTotal - distributed;
  if (remainder > 0) {
    const leader = gains[0];
    if (leader) {
      profile[leader.muscle] += Math.max(1, remainder);
    }
  }

  return {
    ...trainer,
    muscles: clampMuscles(profile),
  };
}

function trainerPhysiqueLevel(muscles: TrainerProfile['muscles']) {
  const total = Object.values(muscles).reduce((sum, value) => sum + value, 0);
  const max = Object.keys(muscles).length * MAX_MUSCLE_LEVEL;
  return clamp(Math.floor((total / max) * 40), 1, 40);
}


function PixelCreature({ creature }: { creature: Creature }) {
  return (
    <div
      className="pixel-sprite"
      style={{
        '--skin': creature.palette.skin,
        '--core': creature.palette.core,
        '--detail': creature.palette.detail,
        '--accent': creature.palette.accent,
      } as Record<string, string>}
    >
      {creature.sprite.map((row, r) => (
        <div className="pixel-row" key={`r-${r}`}>
          {[...row].map((cell, c) => (
            <span key={`${r}-${c}`} className={`pixel ${classForPixel(cell)}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

function TrainerSprite({ trainer, emote = 'neutral' }: { trainer: TrainerProfile; emote?: TrainerEmote }) {
  const sprite = trainerTemplate();
  const emotePalette: Record<TrainerEmote, string> = {
    neutral: '😐',
    focus: '👀',
    grind: '😤',
    pump: '🔥',
    level: '✨',
    victory: '🏆',
    drained: '😵',
    ready: '⚡',
  };
  const physique = trainerPhysiqueLevel(trainer.muscles);

  function muscleTone(group: keyof TrainerProfile['muscles']) {
    const base = trainer.muscles[group];
    const intensity = clamp(base / MAX_MUSCLE_LEVEL, 0, 1);
    const colorBias =
      group === 'shoulders' || group === 'chest' || group === 'triceps'
        ? trainer.top
        : group === 'arms'
          ? trainer.glove
          : group === 'core' || group === 'back'
            ? trainer.skin
            : trainer.shoes;
    const accent = blendHex(trainer.skin, colorBias, intensity * 0.55);
    return base > 0 ? accent : trainer.skin;
  }

  function pixelFor(cell: string) {
    switch (cell) {
      case 'H':
        return trainer.hair;
      case 'S':
        return trainer.skin;
      case 'T':
        return trainer.top;
      case 'G':
        return trainer.glove;
      case 'P':
        return trainer.shoes;
      case 'A':
        return muscleTone('arms');
      case 'C':
        return muscleTone('chest');
      case 'B':
        return muscleTone('shoulders');
      case 'Q':
        return muscleTone('quads');
      case 'U':
        return muscleTone('core');
      default:
        return 'transparent';
    }
  }

  return (
    <div className="trainer-sprite-wrap">
      <div className="trainer-emote" title={`Physique: ${physique}`}>
        {emotePalette[emote]}
      </div>
      <div className="trainer-sprite" style={{ '--trainer-name': trainer.name } as Record<string, string>}>
        {sprite.map((row, r) => (
          <div className="pixel-row" key={`trainer-row-${r}`}>
            {[...row].map((cell, c) => (
              <span
                key={`${r}-${c}`}
                className="pixel"
                style={{ backgroundColor: pixelFor(cell) }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="trainer-muscle-summary">
        Physique Lvl {String(physique).padStart(2, '0')}
      </div>
    </div>
  );
}

function createOpponent(zone: GymArea): Encounter {
  const mythicChance = zone.type === 'higher' ? 0.22 : zone.type === 'starter' ? 0.1 : 0;
  const pool = CREATURES.filter((c) => c.isExotic === (Math.random() < mythicChance));
  const source = pool.length > 0 ? pool : CREATURES.filter((c) => !c.isExotic);
  const creature = randomChoice(source);
  const level = randInt(zone.levelMin, zone.levelMax);
  return { creature, level, zoneId: zone.id, catchChance: getCatchChance(level, creature.isExotic), isBoss: false };
}

function bossChallengeDifficultyForBoss(zone: GymArea, boss: GymBoss) {
  const tierByPower = boss.powerBoost >= 24 || zone.type === 'higher' ? 'high' : boss.powerBoost >= 16 || zone.type === 'starter' ? 'normal' : 'low';
  return tierByPower as BossChallengeTier;
}

function bossMachineByDifficulty(zone: GymArea, tier: BossChallengeTier) {
  const candidates = zone.machines;
  if (!candidates.length) return null;
  if (tier === 'high' && candidates.length > 1) {
    const index = randInt(0, candidates.length - 1);
    const priority = candidates[index % candidates.length];
    return priority;
  }
  if (tier === 'normal' && candidates.length > 1) {
    return randInt(0, candidates.length - 1) % 2 === 0 ? candidates[0] : candidates[candidates.length - 1];
  }
  return candidates[Math.floor(candidates.length / 2)] ?? candidates[0]!;
}

function createBoss(zone: GymArea): Encounter {
  const pool = bossForZone(zone.id);
  const boss = randomChoice(pool);
  const creature = boss.creature;
  const level = randInt(zone.levelMin + boss.levelShift, zone.levelMax + boss.levelShift);
  const baseChance = getCatchChance(level, creature.isExotic);
  const zoneMultiplier = BOSS_ZONE_CATCH_SCALE[zone.type];
  const tier = bossChallengeDifficultyForBoss(zone, boss);
  const machine = bossMachineByDifficulty(zone, tier);
  return {
    creature,
    level,
    zoneId: zone.id,
    catchChance: clamp(baseChance * boss.catchMultiplier * zoneMultiplier, 0.05, 0.6),
    isBoss: true,
    bossName: `${boss.name} — ${creature.name}`,
    bossPowerBonus: boss.powerBoost,
    bossChallengeTier: tier,
    bossChallengeMachineId: machine?.id,
    bossChallengeMachineName: machine?.name,
  };
}

function applyXpGain(buddy: Buddy, bonus: number) {
  let xp = buddy.xp + bonus;
  let level = buddy.level;
  let maxHp = buddy.maxHp;
  let leveled = false;

  while (xp >= xpNeeded(level)) {
    xp -= xpNeeded(level);
    level += 1;
    maxHp += 3;
    leveled = true;
  }

  return {
    leveled,
    buddy: {
      ...buddy,
      xp,
      level,
      maxHp,
      form: clampBuddyStats(buddy.form, MAX_BUDDY_FORM),
      mobility: clampBuddyStats(buddy.mobility, MAX_BUDDY_MOBILITY),
      volume: clampBuddyStats(buddy.volume, MAX_BUDDY_VOLUME),
      hp: clamp(buddy.hp + (leveled ? 12 : 5), 1, maxHp),
    },
  };
}

function initialSaveData(): SaveData {
  const preset = { ...TRAINER_PRESETS[0], name: 'Trainer' };
  const fallback: SaveData = {
    version: 'v11',
    trainingFatigue: 0,
    workoutMomentum: 0,
    deloadTokens: 0,
    hasStarterSet: false,
    unlockedZoneIds: FALLBACK_UNLOCKED_ZONES,
    trainer: {
      ...preset,
    },
    steroids: 3,
    activeIndex: 0,
    activeZoneId: 'home',
      team: [seedBuddy(1, CREATURES[0], 5), seedBuddy(2, CREATURES[1], 4)],
      seenDex: [1, 2],
      caughtDex: [1, 2],
    selectedMachineByZone: Object.fromEntries(AREAS.map((zone) => [zone.id, zone.machines[0]?.id ?? ''])),
    bossSchedules: Object.fromEntries(
      AREAS.map((zone) => [zone.id, { nextBossAt: nowMs() + bossInterval(), defeated: 0 }]),
    ) as Record<string, BossSchedule>,
    audio: {
      enabled: true,
      musicVolume: 0.5,
      sfxVolume: 0.82,
    },
    tutorialStep: 0,
  };

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as Partial<SaveData>;
      if (
        !parsed ||
        (parsed.version !== 'v3' &&
          parsed.version !== 'v4' &&
          parsed.version !== 'v5' &&
          parsed.version !== 'v6' &&
          parsed.version !== 'v7' &&
          parsed.version !== 'v8' &&
          parsed.version !== 'v9' &&
          parsed.version !== 'v10' &&
          parsed.version !== 'v11')
      ) {
      return fallback;
    }

    const team = (parsed.team ?? fallback.team).slice(0, TEAM_SIZE).map((buddy) => ({
      ...buddy,
      level: Math.max(1, buddy.level),
      hp: Math.max(1, Math.min(buddy.maxHp, buddy.hp)),
      maxHp: Math.max(18, buddy.maxHp),
      xp: Math.max(0, buddy.xp),
      form: clampBuddyStats(Math.round(buddy.form), MAX_BUDDY_FORM, 1),
      mobility: clampBuddyStats(Math.round(buddy.mobility), MAX_BUDDY_MOBILITY, 1),
      volume: clampBuddyStats(Math.round(buddy.volume), MAX_BUDDY_VOLUME, 1),
    }));

    return {
      ...fallback,
      ...parsed,
      hasStarterSet: parsed.hasStarterSet ?? false,
      trainer: {
        ...fallback.trainer,
        ...parsed.trainer,
        name: parsed.trainer?.name?.trim() ? parsed.trainer.name : fallback.trainer.name,
        muscles: clampMuscles({
          ...fallback.trainer.muscles,
          ...parsed.trainer?.muscles,
        } as TrainerProfile['muscles']),
      },
      team,
      selectedMachineByZone: {
        ...fallback.selectedMachineByZone,
        ...(parsed.selectedMachineByZone ?? {}),
      },
      bossSchedules: {
        ...fallback.bossSchedules,
        ...(parsed.bossSchedules ?? {}),
      },
      activeIndex: clamp(parsed.activeIndex ?? 0, 0, Math.max(0, team.length - 1)),
      steroids: Math.max(0, parsed.steroids ?? 3),
      trainingFatigue: clamp(Math.max(0, parsed.trainingFatigue ?? 0), 0, MAX_TRAINING_FATIGUE),
      workoutMomentum: clamp(Math.max(0, parsed.workoutMomentum ?? 0), 0, WORKOUT_MOMENTUM_MAX),
      deloadTokens: clamp(Math.max(0, parsed.deloadTokens ?? 0), 0, WORKOUT_DELOAD_MAX),
      seenDex: parsed.seenDex ?? fallback.seenDex,
      caughtDex: parsed.caughtDex ?? fallback.caughtDex,
      activeZoneId: parsed.activeZoneId ?? 'home',
      unlockedZoneIds: normalizeUnlockedZones(
        parsed.unlockedZoneIds,
        parsed.activeZoneId && WORLD_ROUTES[parsed.activeZoneId] ? [parsed.activeZoneId, ...WORLD_ROUTES[parsed.activeZoneId]] : FALLBACK_UNLOCKED_ZONES,
      ),
      audio: {
        ...fallback.audio,
        ...parsed.audio,
        musicVolume: clamp01(parsed.audio?.musicVolume ?? fallback.audio.musicVolume),
        sfxVolume: clamp01(parsed.audio?.sfxVolume ?? fallback.audio.sfxVolume),
      },
      tutorialStep: parsed.tutorialStep ?? 0,
    };
  } catch {
    return fallback;
  }
}

export default function App() {
  const [save, setSave] = useState<SaveData>(initialSaveData);
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(null);
  const [workoutFrame, setWorkoutFrame] = useState(nowMs);
  const [message, setMessage] = useState('Welcome to Gym Buddies. Start from Home Gym and build your team.');
  const [tick, setTick] = useState(nowMs);
  const [log, setLog] = useState<string[]>([
    'Home Gym open. Team and capture loop ready.',
    '6 Gym world loaded. Steroids work like level-up candies.',
  ]);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [zoneTransit, setZoneTransit] = useState<ZoneTransit | null>(null);
  const [trainerFacing, setTrainerFacing] = useState<CardinalDirection>('down');
  const [worldPlayerPos, setWorldPlayerPos] = useState<WorldPosition>(() => WORLD_ZONE_POSITIONS[save.activeZoneId] ?? WORLD_ZONE_POSITIONS.home);
  const [worldMoveLockUntil, setWorldMoveLockUntil] = useState(0);
  const [lastRouteEncounterMs, setLastRouteEncounterMs] = useState(0);
  const [previewZoneId, setPreviewZoneId] = useState<string | null>(null);
  const [showTrainerPanel, setShowTrainerPanel] = useState(false);
  const [draftTrainer, setDraftTrainer] = useState<TrainerProfile>(() => ({ ...save.trainer }));
  const [trainerEmote, setTrainerEmote] = useState<TrainerEmote>('neutral');
  const [trainerEmoteUntil, setTrainerEmoteUntil] = useState(0);
  const [nextRestAvailableMs, setNextRestAvailableMs] = useState(0);
  const audioRef = useRef<AudioEngine | null>(null);

  const activeZone = useMemo(
    () => AREAS.find((area) => area.id === save.activeZoneId) ?? AREAS[0],
    [save.activeZoneId],
  );

  const activeBuddy = save.team[save.activeIndex] ?? null;
  const seenDex = useMemo(() => [...save.seenDex].sort((a, b) => a - b), [save.seenDex]);
  const caughtDex = useMemo(() => [...save.caughtDex].sort((a, b) => a - b), [save.caughtDex]);
  const activeMachine = useMemo(() => {
    const id = save.selectedMachineByZone[activeZone.id];
    return activeZone.machines.find((machine) => machine.id === id) ?? activeZone.machines[0] ?? null;
  }, [activeZone, save.selectedMachineByZone]);
  const bossSchedule = save.bossSchedules[activeZone.id];
  const bossTicker = formatRemainingTime((bossSchedule?.nextBossAt ?? tick) - tick);
  const trainer = save.trainer;
  const unlockedZoneSet = useMemo(() => new Set(save.unlockedZoneIds), [save.unlockedZoneIds]);
  const encounterZone = encounter ? AREAS.find((area) => area.id === encounter.zoneId) ?? activeZone : activeZone;
  const encounterChallengeMachine = encounter?.isBoss ? getBossChallengeMachine(encounter, encounterZone) : null;
  const encounterTrainerPressure = encounter ? trainerArenaPressure(trainer, activeMachine, encounterZone) : 0;
  const encounterBuddyPressure = encounter && activeBuddy ? buddyArenaPressure(activeBuddy) : 0;
  const encounterMachineBonus =
    encounter && encounter.isBoss && activeMachine ? bossChallengePressure(encounter, encounterZone, activeMachine) : 0;
  const isMatchChallengeAligned = match?.isBossChallengeActive && match.bossChallengeMachineId && activeMachine
    ? activeMachine.id === match.bossChallengeMachineId
    : null;
  const activeMatchChallengeSummary = match ? bossChallengeSummary(match.encounter, encounterZone, activeMachine ?? null) : null;
  const activeMatchChallengeProfile = match
    ? bossChallengeProfileForZone(encounterZone.type, match.encounter)
    : BOSS_CHALLENGE_PRESSURE[encounterZone.type];
  const matchChallengeMissCount = match?.bossChallengeMisses ?? 0;
  const matchChallengeNearMissCount = match?.bossChallengeNearMisses ?? 0;
  const activeMatchCaptureTarget = match?.encounter?.isBoss
    ? bossCaptureTarget(
        encounterZone,
        match.encounter,
        isMatchChallengeAligned,
        match.bossChallengeMisses,
        match.bossChallengeNearMisses,
        match.bossChallengeMatchStreak,
        activeBuddy ?? undefined,
      )
    : BOSS_CAPTURE_TARGET.home;
  const isMatchChallengeStreakReady =
    match?.isBossChallengeActive &&
    isMatchChallengeAligned === true &&
    (match?.bossChallengeMatchStreak ?? 0) >= activeMatchChallengeProfile.streakLimit;
  const isMatchChallengeInDanger =
    match?.isBossChallengeActive &&
    !isMatchChallengeAligned &&
    matchChallengeMissCount >= Math.max(1, Math.ceil(activeMatchChallengeProfile.streakLimit / 1.6));
  const isMatchChallengeNearWarn =
    match?.isBossChallengeActive &&
    matchChallengeNearMissCount > activeMatchChallengeProfile.missResetGrace;
  const isMatchChallengeOverload = match?.isBossChallengeActive
    ? match.bossChallengeMisses >= Math.max(2, activeMatchChallengeProfile.streakLimit + 1)
    : false;
  const isMatchChallengeForcedRecovery =
    isMatchChallengeOverload && match?.encounter?.isBoss && isMatchChallengeAligned === false;
  const activeMatchChallengeStress: BossChallengeStress = match?.encounter?.isBoss && match?.isBossChallengeActive
    ? (() => {
        const rawAlignmentPenalty =
          match.bossChallengeMachineId && activeMachine?.id
            ? match.bossChallengeMachineId === activeMachine.id
              ? 10
              : 38
            : 24;
        const missPressure = Math.min(4, matchChallengeMissCount) * 12;
        const nearPressure =
          Math.max(0, matchChallengeNearMissCount - activeMatchChallengeProfile.missResetGrace) * 8;
        const overloadBoost = isMatchChallengeOverload ? 28 : 0;
        const nearWarnBoost = isMatchChallengeNearWarn ? 6 : 0;
        const streakRecovery = (match.bossChallengeMatchStreak / Math.max(1, activeMatchChallengeProfile.streakLimit)) * 12;
        const percent = clamp(
          Math.round(12 + rawAlignmentPenalty + missPressure + nearPressure + nearWarnBoost + overloadBoost - streakRecovery),
          0,
          100,
        );
        const tone = percent > 84 ? 'overload' : percent > 70 ? 'danger' : percent > 35 ? 'caution' : 'safe';
        return {
          percent,
          tone,
          label:
            percent > 84
              ? 'Overload'
              : percent > 70
                ? 'Danger'
                : percent > 35
                  ? 'Caution'
                  : 'Stable',
          detail:
            match.bossChallengeMisses + matchChallengeNearMissCount > 0
              ? `${matchChallengeMissCount} misses · ${matchChallengeNearMissCount} near misses`
              : 'No pressure events yet',
        };
      })()
    : { percent: 0, tone: 'safe', label: 'No stress', detail: 'No active boss challenge pressure' };
  const challengeAlignmentText =
    match?.isBossChallengeActive && match.bossChallengeMachineId && isMatchChallengeAligned !== null
      ? isMatchChallengeAligned
        ? `Holding challenge machine: ${match.bossChallengeMachineName ?? 'required machine'}`
        : `Not on required machine: ${match.bossChallengeMachineName ?? 'required machine'}`
      : null;
  const tutorialActive = save.tutorialStep < TUTORIAL_STEPS.length;
  const currentTutorialText = TUTORIAL_STEPS[Math.min(save.tutorialStep, TUTORIAL_STEPS.length - 1)] ?? '';
  const zoneVibe = ZONE_VIBES[activeZone.id] ?? { icon: '🗺', mood: 'Unknown', theme: 'open gym', accent: 'Unknown' };
  const activeEmote: TrainerEmote = trainerEmoteUntil > tick ? trainerEmote : 'neutral';
  const trainerPhysique = trainerPhysiqueLevel(trainer.muscles);
  const draftTrainerPhysique = trainerPhysiqueLevel(draftTrainer.muscles);
  const fatigueRatio = clamp01(save.trainingFatigue / MAX_TRAINING_FATIGUE);
  const canRest = activeBuddy && !workoutSession && !encounter && !match && nowMs() >= nextRestAvailableMs;
  const restCooldownSeconds = Math.max(0, Math.ceil((nextRestAvailableMs - tick) / 1000));
  const connectedZones = WORLD_ROUTES[save.activeZoneId] ?? [];
  const worldPlayerZone = worldTileZoneId(worldPlayerPos);
  const playerHasUnresolvedZoneEntry = worldPlayerZone !== null && worldPlayerZone !== save.activeZoneId;
  const worldPlayerPixelPos = worldTileToStyle(worldPlayerPos);
  const isTraveling = Boolean(zoneTransit);
  const isWorldMoving = playerHasUnresolvedZoneEntry || isTraveling;
  const trainingFatigueLevel = workoutReadinessLabel(clamp(1 - save.trainingFatigue / MAX_TRAINING_FATIGUE, 0, 1));
  const connectedWalks = (Object.entries(WORLD_DIRECTION_VECTORS) as Array<[CardinalDirection, WorldPosition]>)
    .map(([direction, delta]) => {
      const next: WorldPosition = {
        x: worldPlayerPos.x + delta.x,
        y: worldPlayerPos.y + delta.y,
      };
      const blocked = !isWorldTileWalkable(next);
      const destinationZone = worldTileZoneId(next);
      if (blocked) return null;
      if (destinationZone && !isZoneUnlocked(destinationZone)) return null;
      const fromZone = worldTileZoneId(worldPlayerPos);
      const routeFatigue = routeFatigueCost(fromZone, destinationZone, activeZone.type);
      const routeInfo = routeProfileFromZones(fromZone, destinationZone);
      return {
        direction,
        next,
        destinationZone,
        routeName: routeInfo?.routeName ?? 'Route tile',
        routeFatigue,
        encounterBoost: routeEncounterBoost(fromZone, destinationZone),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  const movementHint = connectedWalks.length
    ? connectedWalks
        .map(
          ({ direction, destinationZone, routeName, routeFatigue, encounterBoost }) =>
            `${direction.toUpperCase()}: ${routeName} → ${destinationZone ? zoneNames[destinationZone] ?? destinationZone : 'Path'} (+${routeFatigue} fatigue${
              encounterBoost ? `, +${Math.round(encounterBoost * 100)}% encounter` : ''
            })`,
        )
        .join(' · ')
    : 'No exits available';
  const worldMoveCooldownRemaining = Math.max(0, worldMoveLockUntil - tick);
  const worldMovePercent = clamp01(1 - worldMoveCooldownRemaining / WORLD_MOVE_COOLDOWN_MS);
  const worldMoveBlocked = nowMs() < worldMoveLockUntil;
  const routeScoutCooldownRemaining = Math.max(0, WORLD_ROUTE_ENCOUNTER_COOLDOWN_MS - (tick - lastRouteEncounterMs));
  const isZoneUnlocked = (zoneId: string) => unlockedZoneSet.has(zoneId);
  const workoutProgress =
    !workoutSession || workoutSession.phase === 'resolved'
      ? 0
      : workoutSession.phase === 'running'
        ? clamp(
            Math.round(((workoutFrame - workoutSession.startedAt) / (workoutSession.durationMs || 1)) * 100),
            0,
            100,
          )
        : clamp(Math.round(((workoutSession.spotWindowEnd - workoutFrame) / (workoutSession.spotWindowMs || 1)) * 100), 0, 100);
  const workoutSpotRemainingMs = workoutSession?.phase === 'spot' ? Math.max(0, workoutSession.spotWindowEnd - workoutFrame) : 0;
  const canSpot = workoutSession?.phase === 'spot' && !workoutSession.resolved && workoutSession.buddyId === activeBuddy?.id;

  function getAudioEngine() {
    if (audioRef.current) {
      return audioRef.current;
    }
    const engine = createAudioEngine();
    audioRef.current = engine;
    return engine;
  }

  function activateAudioEngine() {
    const engine = getAudioEngine();
    engine.setEnabled(save.audio.enabled);
    engine.setVolumes(save.audio.musicVolume, save.audio.sfxVolume);
    void engine.context.resume();
    return engine;
  }

  function updateMusic() {
    const engine = activateAudioEngine();
    const zone: MusicZoneState =
      activeZone.type === 'home' ? 'home' : encounter?.isBoss ? 'boss' : match?.status === 'playing' ? 'fight' : 'ambient';
    const intensity = activeZone.type === 'home' ? 'home' : activeZone.type === 'starter' ? 'starter' : 'higher';
    engine.startMusic(zone, intensity);
  }

  function setAudioEnabled(enabled: boolean) {
    setSave((state) => ({
      ...state,
      audio: {
        ...state.audio,
        enabled,
      },
    }));
    const engine = getAudioEngine();
    engine.setEnabled(enabled);
    if (enabled) {
      updateMusic();
    }
  }

  function setMusicVolume(value: number) {
    const volume = clamp01(value);
    setSave((state) => ({
      ...state,
      audio: {
        ...state.audio,
        musicVolume: volume,
      },
    }));
    if (!audioRef.current) return;
    audioRef.current.musicGain.gain.value = volume;
  }

  function setSfxVolume(value: number) {
    const volume = clamp01(value);
    setSave((state) => ({
      ...state,
      audio: {
        ...state.audio,
        sfxVolume: volume,
      },
    }));
    if (!audioRef.current) return;
    audioRef.current.sfxGain.gain.value = volume;
  }

  function getGymBossTicker(zone: GymArea) {
    const nextAt = save.bossSchedules[zone.id]?.nextBossAt ?? tick;
    const remaining = nextAt - tick;
    return remaining <= 0 ? 'READY' : formatRemainingTime(remaining);
  }

  function trySpawnRouteEncounter(zone: GymArea, encounterBoost = 0, routeName = 'Route') {
    const now = nowMs();
    if (zone.type === 'home') return;
    if (now - lastRouteEncounterMs < WORLD_ROUTE_ENCOUNTER_COOLDOWN_MS) {
      return;
    }
    const wasBossDue = (save.bossSchedules[zone.id]?.nextBossAt ?? 0) <= now;
    const encounterChance = WORLD_ROUTE_ENCOUNTER_RATE[zone.type] * (1 + encounterBoost) * (1 + clamp01(save.trainingFatigue / MAX_TRAINING_FATIGUE) * 0.2);
    if (
      !wasBossDue &&
      !encounter &&
      !match &&
      !workoutSession &&
      Math.random() < Math.min(0.55, encounterChance)
    ) {
      const next = createOpponent(zone);
      setEncounter(next);
      setMatch(null);
      setSave((state) => ({
        ...state,
        seenDex: state.seenDex.includes(next.creature.dex) ? state.seenDex : [...state.seenDex, next.creature.dex],
      }));
      setMessage(`A wild ${next.creature.name} stepped out via ${routeName} near ${zone.name}.`);
      pushLog(`Scouted ${next.creature.name} Lv.${next.level} via ${routeName} at ${zone.name}.`);
      setLastRouteEncounterMs(now);
    }
  }

  function triggerBossSpawn(gym: GymArea) {
    if (!encounter && !match) {
        const now = nowMs();
        const schedule = save.bossSchedules[gym.id];
        if (schedule && now >= schedule.nextBossAt) {
          const boss = createBoss(gym);
          setEncounter(boss);
          setMatch(null);
        activateAudioEngine().emitSfx('bossAlert', 1.2);
        setSave((state) => ({
          ...state,
          bossSchedules: {
            ...state.bossSchedules,
            [gym.id]: {
              nextBossAt: now + bossInterval(),
              defeated: (state.bossSchedules[gym.id]?.defeated ?? 0) + 1,
            },
          },
        })); 
        const challenge = boss.bossChallengeMachineName ?? 'a random machine';
        setMessage(`A gym boss appeared at ${gym.name}: ${boss.bossName}! Hold at ${challenge}.`);
        pushLog(`Boss spawn in ${gym.name}: ${boss.bossName} Lv.${boss.level} at ${challenge}.`);
      }
    }
  }

  useEffect(() => {
    if (!zoneTransit) return;
    const id = window.setTimeout(() => setZoneTransit(null), 1200);
    return () => clearTimeout(id);
  }, [zoneTransit]);

  useEffect(() => {
    const activeTile = WORLD_ZONE_POSITIONS[save.activeZoneId];
    if (!activeTile) return;
    const playerZoneAtPos = worldTileZoneId(worldPlayerPos);
    if (!isTraveling && playerZoneAtPos && playerZoneAtPos !== save.activeZoneId) {
      setWorldPlayerPos((state) => {
        if (worldTileZoneId(state) === save.activeZoneId) return state;
        return activeTile;
      });
    }
  }, [save.activeZoneId, isTraveling, worldPlayerPos.x, worldPlayerPos.y]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWorkoutFrame(nowMs());
    }, 90);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!workoutSession || workoutSession.resolved) return;
    const timer = window.setInterval(() => {
      setWorkoutSession((current) => {
        if (!current || current.resolved) return current;
        const now = nowMs();

        if (current.phase === 'running') {
          if (current.willFail && now >= current.failCheckAt) {
            return {
              ...current,
              phase: 'spot',
              spotWindowStart: now,
              spotWindowEnd: now + current.spotWindowMs,
            };
          }
          if (now >= current.startedAt + current.durationMs) {
            const complete: WorkoutSession = {
              ...current,
              phase: 'resolved',
              resolved: true,
            };
            queueMicrotask(() => resolveWorkoutSession(complete, true));
            return complete;
          }
          return current;
        }

        if (current.phase === 'spot' && now > current.spotWindowEnd) {
          const failed: WorkoutSession = {
            ...current,
            phase: 'resolved',
            resolved: true,
          };
          queueMicrotask(() => resolveWorkoutSession(failed, false));
          return failed;
        }
        return current;
      });
    }, 90);
    return () => clearInterval(timer);
  }, [workoutSession]);

  useEffect(() => {
    if (!workoutSession || !workoutSession.resolved) return;
    const timeout = window.setTimeout(() => setWorkoutSession((current) => (current?.resolved ? null : current)), 1000);
    return () => clearTimeout(timeout);
  }, [workoutSession]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick(nowMs());
      triggerBossSpawn(activeZone);
    }, 1000);
    return () => clearInterval(timer);
  }, [save.activeZoneId, save.bossSchedules, encounter, match]);

  useEffect(() => {
    if (save.trainingFatigue <= 0 || encounter || match || workoutSession) return;
    const recovery = FATIGUE_COOLDOWN_PER_TICK + (activeZone.id === 'home' ? FATIGUE_COOLDOWN_HOME_BONUS : 0);
    const timer = window.setInterval(() => {
      setSave((state) => ({
        ...state,
        trainingFatigue: clamp(state.trainingFatigue - recovery, 0, MAX_TRAINING_FATIGUE),
        workoutMomentum: clamp(state.workoutMomentum - WORKOUT_MOMENTUM_RECOVERY, 0, WORKOUT_MOMENTUM_MAX),
      }));
    }, 5000);
    return () => clearInterval(timer);
  }, [activeZone.id, encounter, match, workoutSession, save.trainingFatigue]);

  useEffect(() => {
    if (!save.audio.enabled) {
      const engine = getAudioEngine();
      engine.setEnabled(false);
      return;
    }

    const engine = activateAudioEngine();
    engine.setVolumes(save.audio.musicVolume, save.audio.sfxVolume);
    updateMusic();
    return () => {};
  }, [
    activeZone.id,
    activeZone.type,
    save.audio.enabled,
    save.audio.musicVolume,
    save.audio.sfxVolume,
    encounter?.isBoss,
    match?.status,
  ]);

  useEffect(() => {
    if (!save.hasStarterSet) return;
    function onKeyDown(event: KeyboardEvent) {
      if (showRoadmap) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;

      const key = event.key.toLowerCase();
      const directionByKey: Record<string, CardinalDirection | undefined> = {
        arrowup: 'up',
        w: 'up',
        arrowdown: 'down',
        s: 'down',
        arrowleft: 'left',
        a: 'left',
        arrowright: 'right',
        d: 'right',
      };
      const direction = directionByKey[key];
      if (!direction) return;

      event.preventDefault();
      moveTrainerByDirection(direction);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [save.hasStarterSet, showRoadmap, isTraveling, moveTrainerByDirection]);

  useEffect(() => {
    return () => {
      if (!audioRef.current) return;
      audioRef.current.dispose();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }, [save]);

  function resetTutorial() {
    setSave((state) => ({ ...state, tutorialStep: 0 }));
  }

  function nextTutorialStep() {
    setSave((state) => {
      const next = Math.min(state.tutorialStep + 1, TUTORIAL_STEPS.length);
      if (next >= TUTORIAL_STEPS.length) {
        setMessage('Tutorial complete. Start training and scouting for buddies.');
      }
      return {
        ...state,
        tutorialStep: next,
      };
    });
  }

  function finishTutorialNow() {
    setSave((state) => ({ ...state, tutorialStep: TUTORIAL_STEPS.length }));
    setMessage('Tutorial skipped. Good luck, trainer.');
  }

  function setTrainerName(event: { target: { value: string } }) {
    setSave((state) => ({
      ...state,
      trainer: {
        ...state.trainer,
        name: event.target.value.slice(0, 14) || 'Trainer',
      },
    }));
  }

  function setTrainerPreset(profile: TrainerProfile) {
    setSave((state) => ({ ...state, trainer: { ...profile } }));
  }

  function setTrainerColor(part: keyof Omit<TrainerProfile, 'name' | 'muscles'>, value: string) {
    setSave((state) => ({
      ...state,
      trainer: {
        ...state.trainer,
        [part]: value,
      },
    }));
  }

  function setTrainerMuscle(group: keyof TrainerProfile['muscles'], value: number) {
    setSave((state) => ({
      ...state,
      trainer: {
        ...state.trainer,
        muscles: {
          ...state.trainer.muscles,
          [group]: clamp(Number.isFinite(value) ? value : 0, 0, MAX_MUSCLE_LEVEL),
        },
      },
    }));
    setTrainerEmote('pump');
    setTrainerEmoteUntil(nowMs() + 900);
  }

  function setDraftTrainerName(event: { target: { value: string } }) {
    setDraftTrainer((state) => ({
      ...state,
      name: event.target.value.slice(0, 14) || 'Trainer',
    }));
  }

  function setDraftTrainerColor(part: keyof Omit<TrainerProfile, 'name' | 'muscles'>, value: string) {
    setDraftTrainer((state) => ({
      ...state,
      [part]: value,
    }));
  }

  function setDraftTrainerMuscle(group: keyof TrainerProfile['muscles'], value: number) {
    setDraftTrainer((state) => ({
      ...state,
      muscles: {
        ...state.muscles,
        [group]: clamp(Number.isFinite(value) ? value : 0, 0, MAX_MUSCLE_LEVEL),
      },
    }));
  }

  function setDraftTrainerPreset(profile: TrainerProfile) {
    setDraftTrainer({
      ...profile,
    });
  }

  function launchTrainer() {
    setSave((state) => ({
      ...state,
      hasStarterSet: true,
      trainer: {
        ...draftTrainer,
        name: draftTrainer.name.trim() || 'Trainer',
      },
    }));
    activateAudioEngine().emitSfx('matchStart', 0.9);
    setMessage(`Welcome to your journey, ${draftTrainer.name || 'Trainer'}.`);
  }

  function reopenTrainerSetup() {
    setDraftTrainer(save.trainer);
    setSave((state) => ({
      ...state,
      hasStarterSet: false,
    }));
    setMessage('Trainer setup reopened. Finish your custom gear and build your body stats again.');
  }

  function moveTrainerByDirection(direction: CardinalDirection) {
    if (isWorldMoving) {
      setMessage('Wait for the zone transition to settle.');
      return;
    }

    const now = nowMs();
    if (now < worldMoveLockUntil) {
      return;
    }

    const next = {
      x: worldPlayerPos.x + WORLD_DIRECTION_VECTORS[direction].x,
      y: worldPlayerPos.y + WORLD_DIRECTION_VECTORS[direction].y,
    };
    const nextZoneId = worldTileZoneId(next);
    const fromZoneId = worldTileZoneId(worldPlayerPos) ?? save.activeZoneId;
    const routeProfile = routeProfileFromZones(fromZoneId, nextZoneId);
    const fatigueGain = routeFatigueCost(fromZoneId, nextZoneId, activeZone.type);
    const routeName = routeProfile?.routeName ?? 'Route tile';

    if (!isWorldTileWalkable(next)) {
      setMessage(`No clear path for ${direction.toUpperCase()}.`);
      return;
    }

    if (nextZoneId && !isZoneUnlocked(nextZoneId)) {
      setMessage(`This route to ${zoneNames[nextZoneId] ?? nextZoneId} is not unlocked yet.`);
      return;
    }

    const routeBoost = routeProfile?.encounterBoost ?? 0;

    setSave((state) => ({
      ...state,
      trainingFatigue: clamp(state.trainingFatigue + fatigueGain, 0, MAX_TRAINING_FATIGUE),
    }));
    setTrainerFacing(direction);
    setWorldPlayerPos(next);
    setWorldMoveLockUntil(now + WORLD_MOVE_COOLDOWN_MS);
    setMessage(
      `Moved ${direction.toUpperCase()} via ${routeName}. Fatigue +${Math.round(fatigueGain * 10) / 10}.`,
    );
    if (nextZoneId && nextZoneId !== save.activeZoneId) {
      travelToZone(nextZoneId);
    } else if (!isWorldMoving) {
      trySpawnRouteEncounter(activeZone, routeBoost, routeName);
    }
  }

  function mapPointForZone(zoneId: string) {
    const point = WORLD_ZONE_POSITIONS[zoneId];
    if (!point) return null;
    return worldTileToStyle(point);
  }

  function routeSignPosition(route: WorldRouteConnection) {
    const fromPos = WORLD_ZONE_POSITIONS[route.from];
    const toPos = WORLD_ZONE_POSITIONS[route.to];
    if (!fromPos || !toPos) return null;
    const fromStyle = worldTileToStyle(fromPos);
    const toStyle = worldTileToStyle(toPos);
    return {
      left: fromStyle.left + (toStyle.left - fromStyle.left) / 2,
      top: fromStyle.top + (toStyle.top - fromStyle.top) / 2,
    };
  }

  function getRouteTransitionPreview(zoneId: string) {
    const zone = AREAS.find((entry) => entry.id === zoneId);
    if (!zone) return null;

    const routePath = (() => {
      if (zoneId === save.activeZoneId) return [save.activeZoneId];
      const queue: string[] = [save.activeZoneId];
      const previous = new Map<string, string | null>([[save.activeZoneId, null]]);
      const visited = new Set<string>([save.activeZoneId]);
      let pointer = 0;
      let targetReached = false;

      while (pointer < queue.length && !targetReached) {
        const current = queue[pointer++];
        const neighbors = WORLD_ROUTES[current] ?? [];

        for (const next of neighbors) {
          if (visited.has(next)) continue;
          if (!isZoneUnlocked(next) && next !== zoneId) continue;

          visited.add(next);
          previous.set(next, current);
          queue.push(next);

          if (next === zoneId) {
            targetReached = true;
            break;
          }
        }
      }

      if (!targetReached) return null;

      const path: string[] = [];
      let cursor: string | null = zoneId;
      while (cursor) {
        path.unshift(cursor);
        cursor = previous.get(cursor) ?? null;
      }
      return path;
    })();

    const routeProfile = routeProfileFromZones(save.activeZoneId, zoneId);
    const isDirect = WORLD_ROUTES[save.activeZoneId]?.includes(zoneId);
    const isUnlocked = isZoneUnlocked(zoneId);
    const routePathLength = routePath?.length ?? 0;
    const routeDistance = Math.max(0, routePathLength - 1);
    const routePathName =
      routePathLength > 1 ? routePath!.map((entry) => zoneNames[entry] ?? entry).join(' → ') : zoneNames[zoneId] ?? zoneId;
    let pathFatigueCost = 0;
    let pathEncounterBoost = 0;

    if (routePath && routePathLength > 1) {
      for (let index = 0; index < routePathLength - 1; index += 1) {
        const from = routePath[index];
        const to = routePath[index + 1];
        pathFatigueCost += routeFatigueCost(from, to, activeZone.type);
        pathEncounterBoost += routeProfileFromZones(from, to)?.encounterBoost ?? 0;
      }
    }

    const normalizedEncounterChance = routeDistance
      ? Math.min(
          0.55,
          WORLD_ROUTE_ENCOUNTER_RATE[zone.type] *
            (1 + pathEncounterBoost / Math.max(1, routeDistance)) *
            (1 + clamp01(save.trainingFatigue / MAX_TRAINING_FATIGUE) * 0.2),
        )
      : 0;
    const fatigueCost = routeDistance > 0 ? pathFatigueCost / routeDistance : pathFatigueCost;
    return {
      zone,
      isDirect,
      isUnlocked,
      routePath: routePath ?? null,
      routeDistance,
      routePathName,
      routeName: routeDistance > 1 ? `${routeDistance}-hop route` : routeProfile?.routeName ?? 'Route',
      fatigueCost,
      encounterBoost: routeProfile?.encounterBoost ?? 0,
      encounterChance: normalizedEncounterChance,
      canTravelNow: isUnlocked && routePathLength > 0,
      bossTicker: getGymBossTicker(zone),
    };
  }

  function travelToZone(zoneId: string) {
    if (isTraveling || isWorldMoving) {
      setMessage('Keep moving with a steady stride before changing lanes again.');
      return;
    }
    const zone = AREAS.find((entry) => entry.id === zoneId);
    if (!zone) return;
    if (zoneId !== save.activeZoneId && !WORLD_ROUTES[save.activeZoneId]?.includes(zoneId)) {
      setMessage('No direct open-world path to that gym yet. Travel through connected routes.');
      return;
    }
    if (!isZoneUnlocked(zoneId)) {
      setMessage(`${zone.name} has not been unlocked yet. Visit nearby routes first.`);
      return;
    }

    const zonePos = WORLD_ZONE_POSITIONS[zoneId];
    if (!zonePos) {
      setMessage('That destination is not mapped yet.');
      return;
    }
    const routeProfile = routeProfileFromZones(save.activeZoneId, zoneId);
    const currentPos = WORLD_ZONE_POSITIONS[save.activeZoneId];
    if (currentPos) {
      const directionX = Math.sign(zonePos.x - currentPos.x);
      const directionY = Math.sign(zonePos.y - currentPos.y);
      if (directionX > 0) setTrainerFacing('right');
      else if (directionX < 0) setTrainerFacing('left');
      else if (directionY > 0) setTrainerFacing('down');
      else if (directionY < 0) setTrainerFacing('up');
    }

    if (zonePos) {
      setWorldPlayerPos(zonePos);
    }
    window.setTimeout(() => {
      switchArea(zoneId);
    }, 220);
  }

  function pulseTrainerEmote(state: TrainerEmote, ttl = 1800) {
    setTrainerEmote(state);
    setTrainerEmoteUntil(nowMs() + ttl);
  }

  function pushLog(entry: string) {
    setLog((prev) => [entry, ...prev].slice(0, 12));
  }

  function switchArea(id: string) {
    if (id === save.activeZoneId) return;
    const allowed = WORLD_ROUTES[save.activeZoneId]?.includes(id) || id === save.activeZoneId;
    if (!isZoneUnlocked(id)) {
      setMessage(`${zoneNames[id] ?? id} has not unlocked yet.`);
      return;
    }
    if (!allowed) {
      setMessage('No direct open-world path to that gym yet. Travel through connected routes.');
      return;
    }

    const zone = AREAS.find((area) => area.id === id);
    if (!zone) return;
    if (workoutSession && !workoutSession.resolved) {
      setWorkoutSession(null);
      setMessage('You left while your Buddy was in training. The set ends.');
    }

    const zoneTile = WORLD_ZONE_POSITIONS[id];
    if (zoneTile) {
      setWorldPlayerPos(zoneTile);
    }

    setSave((state) => ({
      ...state,
      activeZoneId: id,
      unlockedZoneIds: unlockAdjacentZones(state.unlockedZoneIds, id),
    }));
    const routeProfile = routeProfileFromZones(save.activeZoneId, id);
    const routeEncounterBonus = routeProfile?.encounterBoost ?? 0;
    const routeFatigue = routeFatigueCost(activeZone.id, id, activeZone.type);
    const baseEncounterChance = WORLD_ROUTE_ENCOUNTER_RATE[zone.type] * (1 + routeEncounterBonus);
    const encounterChance = Math.min(
      0.55,
      baseEncounterChance * (1 + clamp01(save.trainingFatigue / MAX_TRAINING_FATIGUE) * 0.2),
    );
    setZoneTransit({
      from: activeZone.name,
      to: zone.name,
      icon: ZONE_VIBES[id]?.icon ?? '🗺',
      routeName: routeProfile?.routeName,
      routeFatigue,
      routeEncounterBoost: routeEncounterBonus,
      routeScoutChance: routeEncounterBonus > 0 || encounterChance ? encounterChance : undefined,
    });
    setEncounter(null);
    setMatch(null);
    activateAudioEngine().emitSfx('zoneShift', 0.6);
    const machineName = zone.machines[0]?.name ?? 'no machine';
    setMessage(`Moved to ${zone.name}. Current machine: ${machineName}.`);
    pulseTrainerEmote('focus', 1600);
    triggerBossSpawn(zone);
    const routeBoost = routeEncounterBoost(save.activeZoneId, id);
    trySpawnRouteEncounter(zone, routeBoost, routeProfile?.routeName ?? 'Route');
  }

  function selectBuddy(index: number) {
    if (!save.team[index]) return;
    if (workoutSession && !workoutSession.resolved) {
      setMessage('Finish the active training set before swapping Buddy slots.');
      return;
    }
    setSave((state) => ({ ...state, activeIndex: index }));
    setMessage(`Selected ${save.team[index].nickname}.`);
  }
  function selectMachine(id: string) {
    setSave((state) => ({
      ...state,
      selectedMachineByZone: {
        ...state.selectedMachineByZone,
        [activeZone.id]: id,
      },
    }));
    const machine = activeZone.machines.find((entry) => entry.id === id);
    if (machine) {
      setMessage(`Selected ${machine.name} in ${activeZone.name}.`);
    }
  }

  function renderStarterSetup() {
    return (
      <div className="app-shell starter-shell">
        <header className="top-banner">
          <h1>GYM BUDDIES</h1>
          <p>GBA-style open-world trainer setup. Pick your character and step into the gym map.</p>
          <div className="panel-head-row">
            <span className="chip">Step 1: Build your trainer</span>
          </div>
        </header>

      <main className="game-grid setup-grid">
        <section className="panel">
          <h2>Character Creation</h2>
            <p className="small-note">
              Create your trainer body build, colors, and name before entering the route map.
            </p>
            <div className="starter-layout">
              <div className="trainer-panel">
                <div className="trainer-panel-left">
                  <TrainerSprite trainer={draftTrainer} emote={activeEmote} />
                  <div className="trainer-fields">
                    <label>
                      Name:
                      <input value={draftTrainer.name} onChange={setDraftTrainerName} maxLength={14} />
                    </label>
                    <div className="trainer-muscle-summary">Physique Lvl {String(draftTrainerPhysique).padStart(2, '0')}</div>
                    <small className="small-note">
                      You will use this body build in every gym. You can tweak in-game after the trip starts.
                    </small>
                  </div>
                </div>

                <div className="trainer-presets">
                  {TRAINER_PRESETS.map((profile) => (
                    <button
                      key={profile.name}
                      className={`trainer-preset ${draftTrainer.name === profile.name ? 'active' : ''}`}
                      onClick={() => setDraftTrainerPreset(profile)}
                    >
                      {profile.name}
                    </button>
                  ))}
                </div>

                <div className="trainer-sliders">
                  <div className="muscle-sliders">
                    {TRAINER_MUSCLES.map((entry) => (
                      <label className="muscle-slider" key={entry.key}>
                        <span>{entry.label}</span>
                        <div className="muscle-slider-row">
                          <input
                            type="range"
                            min="0"
                            max={MAX_MUSCLE_LEVEL}
                            value={draftTrainer.muscles[entry.key]}
                            onChange={(event) => setDraftTrainerMuscle(entry.key, Number(event.target.value))}
                          />
                          <span>{draftTrainer.muscles[entry.key]}</span>
                        </div>
                        <small>{entry.detail}</small>
                      </label>
                    ))}
                  </div>
                  <div className="trainer-row">
                    <span>Hair</span>
                    <input type="color" value={draftTrainer.hair} onChange={(event) => setDraftTrainerColor('hair', event.target.value)} />
                    <span>Skin</span>
                    <input type="color" value={draftTrainer.skin} onChange={(event) => setDraftTrainerColor('skin', event.target.value)} />
                  </div>
                  <div className="trainer-row">
                    <span>Top</span>
                    <input type="color" value={draftTrainer.top} onChange={(event) => setDraftTrainerColor('top', event.target.value)} />
                    <span>Gloves</span>
                    <input type="color" value={draftTrainer.glove} onChange={(event) => setDraftTrainerColor('glove', event.target.value)} />
                  </div>
                  <div className="trainer-row">
                    <span>Shoes</span>
                    <input
                      type="color"
                      value={draftTrainer.shoes}
                      onChange={(event) => setDraftTrainerColor('shoes', event.target.value)}
                    />
                  </div>
                </div>
                <div className="action-row">
                  <button className="primary-btn" onClick={launchTrainer} disabled={!draftTrainer.name.trim()}>
                    Start Journey
                  </button>
                </div>
              </div>
            </div>
          </section>
          <section className="panel">
            <h2>Open World Preview</h2>
            <p className="small-note">Connected routes unlock as you move zone-to-zone.</p>
            <div className="world-map">
              {Object.keys(WORLD_ROUTES).map((zoneId) => {
                const zone = AREAS.find((entry) => entry.id === zoneId);
                if (!zone) return null;
                return (
                  <div key={zoneId} className="world-node">
                    <div className={`world-node-title ${zone.type}`}>
                      {ZONE_VIBES[zoneId]?.icon ?? '🗺'} {zone.name}
                    </div>
                    <small>Routes: {WORLD_ROUTES[zoneId]?.join(', ') ?? 'none'}</small>
                  </div>
                );
              })}
            </div>
              <h3>Trainer Path Preview</h3>
              <div
                className="world-mini-grid world-overworld-map"
                style={{
                  width: WORLD_GRID_WIDTH * WORLD_TILE_PITCH + WORLD_GRID_PADDING * 2,
                  height: WORLD_GRID_HEIGHT * WORLD_TILE_PITCH + WORLD_GRID_PADDING * 2,
                }}
              >
              {AREAS.map((zone) => {
                const linked = connectedZones.includes(zone.id);
                const isActive = save.activeZoneId === zone.id;
                const isUnlocked = isZoneUnlocked(zone.id);
                const isRouteReady = (linked && isUnlocked) || isActive;
                const mapPos = mapPointForZone(zone.id);
                if (!mapPos) return null;
                return (
                  <button
                    key={`setup-${zone.id}`}
                    className={`world-mini-node ${isActive ? 'active' : ''} ${isRouteReady ? 'route-ready' : 'route-locked'}`}
                    style={{
                      left: mapPos.left - WORLD_TILE_PX / 2,
                      top: mapPos.top - WORLD_TILE_PX / 2,
                    }}
                    onClick={() => travelToZone(zone.id)}
                    disabled={!isRouteReady || isTraveling || isWorldMoving}
                  >
                    {zone.name}
                    {!isUnlocked && !isActive ? ' 🔒' : ''}
                  </button>
                );
              })}
              {worldPlayerPixelPos ? (
                <div
                  className={`world-mini-trainer trainer-facing-${trainerFacing}`}
                  style={{
                    left: worldPlayerPixelPos.left - WORLD_TILE_PX / 3,
                    top: worldPlayerPixelPos.top - WORLD_TILE_PX / 3,
                  }}
                >
                  {ZONE_VIBES[activeZone.id]?.icon ?? '🧍'}
                </div>
              ) : null}
              </div>
          </section>
        </main>
      </div>
    );
  }
  function resolveWorkoutSession(session: WorkoutSession, succeeded: boolean) {
    const machine = ALL_GYM_MACHINES.find((entry) => entry.id === session.machineId);
    if (!machine) {
      setWorkoutSession(null);
      return;
    }

    if (!session.resolved) return;

    if (succeeded) {
      const sourceBuddy = save.team.find((buddy) => buddy.id === session.buddyId);
      if (!sourceBuddy) {
        setWorkoutSession(null);
        return;
      }
      const profile = workoutBuddyProfile(sourceBuddy);
      const qualityLabel =
        session.sessionQuality >= 0.82
          ? 'Excellent prep'
          : session.sessionQuality >= 0.64
            ? 'Solid prep'
            : session.sessionQuality >= 0.45
              ? 'Good prep'
              : 'Rushed prep';
      const qualityGrowth = session.sessionQuality * 0.2;
      const qualityStrainShield = clamp(Math.round(session.sessionQuality * 3), 0, 3);
      const qualityMomentum = clamp(Math.round(session.sessionQuality * 2), 0, 2);

      const growthMultiplier = clamp(
        1 + session.loadPressure * 0.32 - session.setStress * 0.28 + qualityGrowth,
        0.55,
        1.35,
      );
      const growth = buddyGrowthFromWorkout(
        machine,
        session.readiness,
        session.zoneType,
        true,
      );
      const strainFatigue = clamp(
        Math.round((session.setStress + session.loadPressure) * 6) - qualityStrainShield,
        0,
        5,
      );
      const formTax = clamp(Math.round(0.55 + session.setStress * 2 + session.loadPressure * 2) - qualityStrainShield, 0, 3);
      const mobilityTax = clamp(Math.round(0.35 + session.setStress * 2.4 + session.loadPressure * 2.1) - qualityStrainShield, 0, 4);
      const volumeTax = clamp(Math.round(0.3 + session.setStress * 3 + session.loadPressure * 2.8) - qualityStrainShield, 0, 5);
      const result = applyXpGain(sourceBuddy, session.xpGain);
      const resultBuddy: Buddy = {
        ...result.buddy,
        form: clampBuddyStats(
          result.buddy.form + Math.max(-3, Math.round(growth.form * growthMultiplier) - Math.max(formTax, strainFatigue * 0.55)),
          MAX_BUDDY_FORM,
        ),
        mobility: clampBuddyStats(
          result.buddy.mobility +
            Math.max(
              -4,
              Math.round(growth.mobility * growthMultiplier) - Math.max(mobilityTax, strainFatigue * 0.7),
            ),
          MAX_BUDDY_MOBILITY,
        ),
        volume: clampBuddyStats(
          result.buddy.volume + Math.max(-4, Math.round(growth.volume * growthMultiplier) - Math.max(volumeTax, strainFatigue)),
          MAX_BUDDY_VOLUME,
        ),
        hp: clamp(result.buddy.hp + session.staminaChange, 0, result.buddy.maxHp),
      };
      const momentumGain = clamp(
        Math.round(
          session.readiness * 10 -
            session.loadPressure * 3 -
            session.setStress * 3 +
            (session.staminaChange > 0 ? 2 : 0) +
            qualityMomentum,
        ),
        0,
        7,
      );
      const trainerStaminaGain = Math.max(
        1,
        Math.floor(session.xpGain / (3.2 - session.loadPressure * 1.2)),
      );
      const leveled = result.leveled;
      const fatigueRecoveryPenalty = Math.round(session.loadPressure * 9 + session.setStress * 8);
      const fatigueRecovery = Math.max(
        6,
        Math.round(
          (session.readiness * 16) +
            machine.hpRestore +
            profile.fatigueRecoveryBonus +
            profile.hpLossResistance * 10 -
            Math.round(session.sessionQuality * 4) +
            Math.abs(session.hpLossOnFail - 1) * 0.5,
        ) - fatigueRecoveryPenalty,
      );

      setSave((state) => ({
        ...state,
        trainer: applyTrainerGrowth(state.trainer, machine.focus, trainerStaminaGain, leveled ? 1 : 0),
        steroids: state.steroids + (session.steroidsAwarded ? 1 : 0),
        workoutMomentum: clamp(state.workoutMomentum + momentumGain, 0, WORKOUT_MOMENTUM_MAX),
        trainingFatigue: clamp(state.trainingFatigue - fatigueRecovery, 0, MAX_TRAINING_FATIGUE),
        team: state.team.map((buddy) =>
          buddy.id === session.buddyId
            ? {
                ...buddy,
                ...resultBuddy,
                hp: clamp(resultBuddy.hp, 0, buddy.maxHp),
              }
            : buddy,
        ),
      }));
      setMessage(
      `${resultBuddy.nickname} finished training on ${machine.name}: +${session.xpGain}XP${leveled ? ' and leveled up.' : ''} · ${machine.focus} · `
          + `Readiness ${session.readinessLabel} ${percent(session.readiness)} · Stamina ${session.staminaChange >= 0 ? '+' : ''}${session.staminaChange}`
          + ` · Form ${resultBuddy.form} (${buddyStatBand(resultBuddy.form, MAX_BUDDY_FORM)})`
          + ` · Mobility ${resultBuddy.mobility} (${buddyStatBand(resultBuddy.mobility, MAX_BUDDY_MOBILITY)})`
          + ` · Volume ${resultBuddy.volume} (${buddyStatBand(resultBuddy.volume, MAX_BUDDY_VOLUME)})`
          + ` · Session ${qualityLabel} (${percent(session.sessionQuality)})`
          + ` · Set strain ${workoutSetStressLabel(session.setStress)} · ${percent(session.setStress)}`
          + `${session.steroidsAwarded ? ' · Found one Steroid.' : ''}`,
      );
      pushLog(`${resultBuddy.nickname} completed training on ${machine.name} at ${activeZone.name}.`);
      activateAudioEngine().emitSfx('train', Math.min(1.6, session.xpGain / machine.xpMax));
      pulseTrainerEmote('level', leveled ? 1200 : 900);
      return;
    }

    const target = save.team.find((entry) => entry.id === session.buddyId);
    const sourceProfile = target ? workoutBuddyProfile(target) : null;
    const fatiguePenalty = clamp(Math.round((1 - session.readiness) * 18), 4, 18);
    const resistancePenalty = sourceProfile ? clamp(Math.round((1 - sourceProfile.movementConsistency) * 8), 0, 6) : 0;
    const stressFailurePenalty = Math.round(session.setStress * 14);
    const qualityPenaltyReduction = clamp(Math.round(session.sessionQuality * 6), 0, 6);
    const failFatiguePenalty = clamp(
      fatiguePenalty + resistancePenalty + Math.round(session.loadPressure * 16) + stressFailurePenalty - qualityPenaltyReduction,
      4,
      30,
    );
    const momentumLoss = clamp(
      Math.round((1.4 - session.readiness) * 8 + session.loadPressure * 2 + session.setStress * 2 + 1) - Math.round(session.sessionQuality * 2),
      2,
      8,
    );
    const failQualityGrowth = clamp(session.sessionQuality * 0.28, 0, 0.2);
    const failGrowthScale = clamp(1 + session.setStress * 0.18 + failQualityGrowth, 0.45, 1.3);
    const failHpMitigation = clamp(Math.round(session.sessionQuality * 4), 0, 6);
    const growth = buddyGrowthFromWorkout(
      machine,
      session.readiness,
      session.zoneType,
      false,
    );
      const failureStrainFatigue = clamp(
        Math.round((session.setStress + session.loadPressure) * 5 + session.staminaChange * 0.2),
        1,
        8,
      );
      const sessionQualityFatigue = Math.max(0, session.hpLossOnFail + Math.round(session.loadPressure * 4) + Math.round(session.setStress * 4) - failHpMitigation);

    setSave((state) => ({
        ...state,
        workoutMomentum: clamp(state.workoutMomentum - momentumLoss, 0, WORKOUT_MOMENTUM_MAX),
        trainingFatigue: clamp(
          state.trainingFatigue +
            Math.round(sessionQualityFatigue * 1.2) +
            failFatiguePenalty +
            Math.round(session.hpLossOnFail * (1 - (sourceProfile?.movementConsistency ?? 0.5))),
          0,
          MAX_TRAINING_FATIGUE,
        ),
      team: state.team.map((buddy) =>
        buddy.id === session.buddyId
          ? {
              ...buddy,
                form: clampBuddyStats(
                  buddy.form + Math.round(growth.form * failGrowthScale * (1 + session.loadPressure * 0.45)),
                  MAX_BUDDY_FORM,
                -8,
              ),
              mobility: clampBuddyStats(
                buddy.mobility + Math.round(growth.mobility * failGrowthScale * (1 + session.loadPressure * 0.45)),
                MAX_BUDDY_MOBILITY,
                -8,
              ),
              volume: clampBuddyStats(
                buddy.volume +
                  Math.max(-4, Math.round(growth.volume * failGrowthScale * (1 + session.loadPressure * 0.45) - failureStrainFatigue * 0.35)),
                MAX_BUDDY_VOLUME,
                -5,
                ),
                hp: clamp(
                  buddy.hp - sessionQualityFatigue,
                  0,
                  buddy.maxHp,
                ),
            }
          : buddy,
      ),
    }));
    setMessage(
      `${target?.nickname ?? 'Buddy'} failed ${machine.name} and was spot-needed.`
        + ` Tough set: ${growth.form < 0 ? `Form -${Math.abs(growth.form)}` : `Form +${growth.form}`}`
        + `, Mobility ${growth.mobility < 0 ? `-${Math.abs(growth.mobility)}` : `+${growth.mobility}`}`
        + `, Volume ${growth.volume < 0 ? `-${Math.abs(growth.volume)}` : `+${growth.volume}`}`
        + ` · Session ${session.sessionQuality >= 0.82 ? 'Excellent prep' : session.sessionQuality >= 0.64 ? 'Solid prep' : session.sessionQuality >= 0.45 ? 'Good prep' : 'Rushed prep'} (${percent(
          session.sessionQuality,
        )})`
        + `. Set stress: ${workoutSetStressLabel(session.setStress)} (${percent(session.setStress)}).`,
    );
    pushLog(`${target?.nickname ?? 'Buddy'} failed training on ${machine.name} at ${activeZone.name}.`);
    pulseTrainerEmote('drained', 900);
    activateAudioEngine().emitSfx('moveBad', 1);
    setTrainerEmote('drained');
    setTrainerEmoteUntil(nowMs() + 900);
  }

  function sendToWorkout() {
    if (workoutSession && !workoutSession.resolved) {
      setMessage('A training set is already running.');
      return;
    }
    if (!activeBuddy) return;
    if (!activeMachine) {
      setMessage('No machine selected in this gym.');
      return;
    }
    if (activeBuddy.hp <= activeMachine.fatigueCost) {
      setMessage(
        `${activeBuddy.nickname} is too worn down to push ${activeMachine.name} right now. Rest or pick a low-fatigue machine.`,
      );
      return;
    }
    if (encounter) {
      setMessage('Finish the active encounter before training.');
      return;
    }

    const gain = randInt(activeMachine.xpMin, activeMachine.xpMax);
    const adjusted = Math.max(1, Math.ceil(gain * activeMachine.xpMultiplier));
    const staminaChange = activeMachine.hpRestore - activeMachine.fatigueCost;
    const buddyProfile = workoutBuddyProfile(activeBuddy);
    const readiness = workoutReadiness(
      activeMachine,
      activeBuddy,
      trainer,
      activeZone.type,
      save.trainingFatigue,
      save.workoutMomentum,
    );
    const readinessLabel = workoutReadinessLabel(readiness);
    const movementConsistency = buddyProfile.movementConsistency;
    const volumePreparedness = clamp01(activeBuddy.volume / MAX_BUDDY_VOLUME);
    const loadPressure = workoutLoadPressure(
      activeMachine,
      activeBuddy,
      activeZone.type,
      readiness,
      save.trainingFatigue,
      save.workoutMomentum,
    );
    const loadTier = workoutLoadTier(loadPressure);
    const deloadUsed = clamp(
      Math.min(save.deloadTokens, WORKOUT_DELOAD_BY_TIER[loadTier]),
      0,
      WORKOUT_DELOAD_MAX,
    );
    const deloadLoadPressure = clamp(loadPressure - deloadUsed * WORKOUT_DELOAD_LOAD_REDUCTION, 0.05, 1);
    const deloadReadiness = clamp(
      readiness + deloadUsed * WORKOUT_DELOAD_READINESS_BONUS,
      0,
      1,
    );
    const sessionQuality = clamp(
      movementConsistency * 0.6 + deloadReadiness * 0.22 + volumePreparedness * 0.18,
      0,
      1,
    );
    const setStress = workoutSetStress(
      deloadLoadPressure,
      deloadReadiness,
      save.trainingFatigue,
      activeZone.type,
      loadTier,
    );
    const sessionStaminaChange = Math.max(
      -8,
      Math.min(
        8,
        staminaChange +
          Math.round(
            (deloadReadiness - 0.5) * 2 + buddyProfile.fatigueRecoveryBonus * 0.15 + buddyProfile.readinessSupport * 20,
          ) -
          Math.round(deloadLoadPressure * 3),
      ),
    );
    const trainerAdvantage = trainerWorkoutAdvantage(activeMachine, trainer, activeZone.type);
    const failChance = clamp(
      workoutFailureChance(activeMachine, activeBuddy, activeZone.type, trainerAdvantage.failReduction, deloadReadiness) +
        clamp(setStress * 0.22, 0, 0.22) -
        workoutMomentumFactor(save.workoutMomentum) * 0.12 -
        sessionQuality * 0.16,
      0.12,
      0.9,
    );
    const spotBase = clamp(
      (BASE_SPOT_SUCCESS_CHANCE + trainerAdvantage.spotBaseBonus + (activeZone.type === 'higher' ? -0.05 : 0)) *
        (0.68 + deloadReadiness * 0.33 + sessionQuality * 0.1),
      0.5,
      0.9,
    );
    const adjustedXpGain = Math.max(
      1,
      Math.floor(
        adjusted *
          (0.75 + deloadReadiness * 0.5) *
          (0.9 + deloadLoadPressure * 0.25) *
          (0.9 + sessionQuality * 0.18) *
          (1 + workoutMomentumFactor(save.workoutMomentum) * 0.18),
      ),
    );
    const willFail = Math.random() < failChance;
    const now = nowMs();
    const loadLoss = clamp(
      Math.ceil(
        activeMachine.fatigueCost * (1.1 + (1 - deloadReadiness) * 0.6) +
          (1 - buddyProfile.movementConsistency) * 2 -
          buddyProfile.fatigueRecoveryBonus * 0.2 +
          Math.round(deloadLoadPressure * 5) -
          Math.round(sessionQuality * 1.6),
      ),
      1,
      activeBuddy.maxHp,
    );
    const hpLossOnFail = clamp(
      loadLoss + Math.round(deloadLoadPressure * 6) + Math.round(setStress * 6),
      1,
      activeBuddy.maxHp,
    );

    if (deloadUsed > 0) {
      setSave((state) => ({
        ...state,
        deloadTokens: clamp(state.deloadTokens - deloadUsed, 0, WORKOUT_DELOAD_MAX),
      }));
    }

    setWorkoutSession({
      id: now,
      phase: 'running',
      zoneType: activeZone.type,
      buddyId: activeBuddy.id,
      machineId: activeMachine.id,
      willFail,
      startedAt: now,
      durationMs: WORKOUT_DURATION_MS,
      failCheckAt: now + WORKOUT_AUTO_FAILURE_MS,
      spotWindowMs: WORKOUT_SPOT_WINDOW_MS,
      spotWindowStart: 0,
      spotWindowEnd: 0,
      failChance,
      buddyLevelBefore: activeBuddy.level,
      hpLossOnFail,
      xpGain: adjustedXpGain,
      spotChanceBase: spotBase,
      steroidsAwarded: Math.random() < activeMachine.steroidChance,
      staminaChange: sessionStaminaChange,
      resolved: false,
      readiness: deloadReadiness,
      readinessLabel,
      loadPressure: deloadLoadPressure,
      loadTier,
      setStress,
      movementConsistency,
      volumePreparedness,
      sessionQuality,
    });
    const deloadLabel = deloadUsed > 0 ? `Deload used: ${deloadUsed} · ` : '';

    setMessage(
      `${activeBuddy.nickname} starts a full-set on ${activeMachine.name}: ${loadTier.toUpperCase()} load (${percent(
        deloadLoadPressure,
      )}). ${deloadLabel}Readiness ${readinessLabel} ${percent(deloadReadiness)} · ${workoutSetStressLabel(setStress)} strain (${percent(
        setStress,
      )}). Spot if rep form breaks!`,
    );
    pulseTrainerEmote('focus', 900);
    activateAudioEngine().emitSfx('train', 0.6);
    pushLog(`${activeBuddy.nickname} began training on ${activeMachine.name} with ${percent(failChance)} fail chance.`);
  }

  function spotWorkout() {
    if (!canSpot || !workoutSession || !workoutSession.willFail) return;
    const successChance = workoutSpotSuccessChance(
      workoutSpotRemainingMs,
      workoutSession.spotChanceBase,
      workoutSession.zoneType,
    );
    const success = Math.random() < successChance;
    setWorkoutSession((current) =>
      current && current.id === workoutSession.id && !current.resolved
        ? {
            ...current,
            phase: 'resolved',
            resolved: true,
          }
        : current,
    );
    resolveWorkoutSession({ ...workoutSession, phase: 'resolved', resolved: true }, success);
    setMessage(
      success ? `You rushed in and held the set (${percent(successChance)}).` : 'You were a beat too late for the spot.',
    );
    activateAudioEngine().emitSfx(success ? 'train' : 'moveBad', 1);
  }

  function useSteroid() {
    if (!activeBuddy) return;
    if (save.steroids <= 0) {
      setMessage('No Steroids left. Train more to earn one.');
      return;
    }

    const result = applyXpGain(activeBuddy, 4);
    const steroidGrowth = {
      form: clampBuddyStats(2, MAX_BUDDY_FORM, 1),
      mobility: clampBuddyStats(1, MAX_BUDDY_MOBILITY, 1),
      volume: clampBuddyStats(1, MAX_BUDDY_VOLUME, 1),
    };
    setSave((state) => ({
      ...state,
      trainer: applyTrainerGrowth(state.trainer, 'Power', 2, result.leveled ? 1 : 0),
      steroids: Math.max(0, state.steroids - 1),
      team: state.team.map((buddy, index) =>
        index === state.activeIndex
          ? {
              ...result.buddy,
              form: clampBuddyStats(result.buddy.form + steroidGrowth.form, MAX_BUDDY_FORM),
              mobility: clampBuddyStats(result.buddy.mobility + steroidGrowth.mobility, MAX_BUDDY_MOBILITY),
              volume: clampBuddyStats(result.buddy.volume + steroidGrowth.volume, MAX_BUDDY_VOLUME),
            }
          : buddy,
      ),
    }));

    setMessage(
      `${activeBuddy.nickname} used 1 Steroid.${result.leveled ? ' Leveled up to Lv ' + result.buddy.level + '.' : ''} ` +
        `Form +${steroidGrowth.form} · Mobility +${steroidGrowth.mobility} · Volume +${steroidGrowth.volume}.`,
    );
    pulseTrainerEmote('ready', 1400);
    activateAudioEngine().emitSfx('steroid', 1);
    pushLog(`Used Steroid on ${activeBuddy.nickname}.`);
  }

  function recoverWithRest() {
    if (!activeBuddy) {
      setMessage('No active buddy to recover.');
      return;
    }
    if (workoutSession && !workoutSession.resolved) {
      setMessage('Finish the active set before taking a recovery break.');
      return;
    }
    if (encounter || match) {
      setMessage('Finish battle flow before resting.');
      return;
    }
    if (!canRest) {
      setMessage(
        `Rest is in cooldown. ${Math.max(0, Math.ceil((nextRestAvailableMs - nowMs()) / 1000))}s until your next planned break.`,
      );
      return;
    }
    if (save.trainingFatigue <= 0 && activeBuddy.hp === activeBuddy.maxHp) {
      setMessage('You already feel sharp and recovered.');
      return;
    }

    const buddyProfile = workoutBuddyProfile(activeBuddy);
    const recoverEfficiency = clamp(1 + buddyProfile.fatigueRecoveryBonus / 40, 0.72, 1.44);
    const bonusRecover = Math.round(REST_ACTION_RECOVERY * (1 - fatigueRatio) * recoverEfficiency);
    const actualRecover = Math.max(2, bonusRecover);
    const fatigueRecovered = Math.max(
      0,
      Math.min(MAX_TRAINING_FATIGUE, save.trainingFatigue) - Math.max(0, save.trainingFatigue - (REST_ACTION_RECOVERY + actualRecover)),
    );
    const deloadGainRaw = Math.floor(fatigueRecovered / WORKOUT_DELOAD_RECOVERY_DIVISOR);
    const baseStatRecovery = clamp(Math.round((REST_ACTION_RECOVERY + actualRecover) / WORKOUT_REST_STAT_RECOVERY_DIVISOR), 1, 3);
    const deloadStatRecovery = clamp(Math.round(deloadGainRaw * WORKOUT_REST_DELOAD_STAT_BONUS), 0, 2);
    const statRecovery = clamp(baseStatRecovery + deloadStatRecovery, 1, 4);
    const targetHeal = REST_ACTION_BUDDY_HEAL * (1 + buddyProfile.bossSteady);
    const actualHeal = Math.min(
      Math.round(targetHeal),
      activeBuddy.maxHp - activeBuddy.hp + activeBuddy.hp * 0.04,
    );

    setSave((state) => ({
      ...state,
      trainingFatigue: clamp(state.trainingFatigue - (REST_ACTION_RECOVERY + actualRecover), 0, MAX_TRAINING_FATIGUE),
      deloadTokens: clamp(
        state.deloadTokens + Math.min(deloadGainRaw, WORKOUT_DELOAD_MAX - state.deloadTokens),
        0,
        WORKOUT_DELOAD_MAX,
      ),
      team: state.team.map((buddy, index) =>
        index === state.activeIndex
          ? {
              ...buddy,
              hp: clamp(buddy.hp + actualHeal, 1, buddy.maxHp),
              form: clampBuddyStats(buddy.form + statRecovery, MAX_BUDDY_FORM),
              mobility: clampBuddyStats(buddy.mobility + statRecovery, MAX_BUDDY_MOBILITY),
              volume: clampBuddyStats(buddy.volume + Math.max(1, statRecovery - 1), MAX_BUDDY_VOLUME),
            }
          : buddy,
      ),
    }));
    setNextRestAvailableMs(nowMs() + REST_ACTION_COOLDOWN_MS);
    const deloadGain = clamp(Math.min(deloadGainRaw, WORKOUT_DELOAD_MAX - save.deloadTokens), 0, WORKOUT_DELOAD_MAX);
    const deloadText = deloadGain > 0 ? ` and +${deloadGain} Deload` : '';
    setMessage(
      `${activeBuddy.nickname} takes a controlled reset. Recovery +${actualRecover} fatigue, +${actualHeal} HP and +${statRecovery} load-readiness stat` +
      `${statRecovery === 1 ? '' : 's'}${deloadText}.`,
    );
    activateAudioEngine().emitSfx('teamFull', 0.72);
    pulseTrainerEmote('ready', 900);
  }

  function beginEncounter() {
    if (activeZone.type === 'home') {
      setMessage('Leave Home Gym to scout a wild buddy.');
      return;
    }
    if (workoutSession && !workoutSession.resolved) {
      setMessage('Finish the current training set before scouting.');
      return;
    }
    if (encounter || match) {
      setMessage('Finish the active battle before scouting again.');
      return;
    }
    if (!activeBuddy) {
      setMessage('Pick an active buddy before scouting.');
      return;
    }
    const next = createOpponent(activeZone);
    setEncounter(next);
    setMatch(null);
    activateAudioEngine().emitSfx('catchAlmost', 0.7);
    setSave((state) => ({
      ...state,
      seenDex: state.seenDex.includes(next.creature.dex)
        ? state.seenDex
        : [...state.seenDex, next.creature.dex],
    }));
    setMessage(`${zoneNames[next.zoneId]}: wild ${next.creature.name} Lv.${next.level} appeared.`);
    pushLog(`Spawned ${next.creature.name} Lv.${next.level} (${zoneNames[next.zoneId]}).`);
    pulseTrainerEmote('neutral', 300);
  }

  function startMatch() {
    if (!encounter || !activeBuddy) return;
    if (match) return;
    const trainerPressure = trainerArenaPressure(trainer, activeMachine, activeZone);
    const buddyPressure = buddyArenaPressure(activeBuddy);
    const readiness = matchReadinessModifier(trainer, activeBuddy, activeZone.type);
    const challengeMachine = getBossChallengeMachine(encounter, activeZone);
    const machinePressure = bossChallengePressure(encounter, activeZone, activeMachine);
    const challengeSummary = bossChallengeSummary(encounter, activeZone, activeMachine);
    const challengeProfile = bossChallengeProfileForZone(activeZone.type, encounter);
    const challengeTier = bossChallengeTierFromEncounter(encounter, activeZone.type);
    const maxRounds = Math.max(4, challengeProfile.maxRounds - (encounterMachineBonus >= 4 ? 1 : 0));
    const openingBonus = encounter.isBoss ? challengeProfile.matchMachineBonus : 0;
    const activeCaptureTarget = encounter.isBoss
      ? bossCaptureTarget(
          activeZone,
          encounter,
          challengeSummary.isAligned,
          0,
          0,
          0,
          activeBuddy,
        )
      : BOSS_CAPTURE_TARGET.home;
    const opening =
      encounter.isBoss && challengeMachine
        ? `${encounter.bossName} (${bossChallengeThresholdText(challengeSummary.tier, activeZone.type)}) is anchored on ${challengeMachine.name}. `
          + `Hold ${challengeMachine.name} ${challengeSummary.isFocusAligned ? 'with focus alignment' : 'at least consistently'} and build ${challengeProfile.streakLimit} move streak for +${openingBonus}% control recovery.`
        : 'Keep the pressure steady and rotate your grip each round.';
    const fatigueState = workoutReadinessLabel(clamp01(1 - save.trainingFatigue / MAX_TRAINING_FATIGUE));
    const pressureSummary = `Trainer pressure ${trainerPressure} · Buddy pressure ${buddyPressure} · Challenge bonus ${
      machinePressure >= 0 ? `+${machinePressure}` : `${machinePressure}`
    }`;
    const fatigueSummary = `Fatigue ${fatigueState}`;
    const readinessSummary = `${readiness.total >= 0 ? '+' : ''}${readiness.total} team-readiness edge`;

    setMatch({
      encounter,
      status: 'playing',
      round: 1,
      maxRounds,
      meter: 50,
      isBossChallengeActive: encounter.isBoss && !!challengeMachine,
      bossChallengeMachineId: challengeMachine?.id ?? null,
      bossChallengeMachineName: challengeMachine?.name ?? null,
      bossChallengeMisses: 0,
      bossChallengeMatchStreak: 0,
      bossChallengeNearMisses: 0,
      lines: [
        'You and the wild buddy hit the mat, shoulders tight, and go flat on your stomachs.',
        `${opening}`,
        `Challenge difficulty: ${challengeTier.toUpperCase()} tier · ${challengeSummary.bonusLabel} machine bias.`,
        `${encounter.isBoss ? 'BOSS' : 'WILD'} pressure check: ${pressureSummary}.`,
        `${fatigueSummary}.`,
        `Readiness edge: ${readinessSummary}.`,
        `Boss lock target: ${activeCaptureTarget}% (higher is tighter ${activeCaptureTarget > 74 ? 'on this gym tier' : 'for boss only'}).`,
        'The hold starts at a neutral meter. Push to your side to pin.',
      ],
    });
    pulseTrainerEmote('focus', 1200);
    setMessage(encounter.isBoss ? `${encounter.bossName} engages the challenge machine.` : 'Arm-wrestle match started.');
    activateAudioEngine().emitSfx('matchStart', 1);
    updateMusic();
  }

function resolveMatch(meter: number, playerWonLine: string[]) {
    if (!match) return;
    if (!activeBuddy) return;

    const zone = AREAS.find((entry) => entry.id === match.encounter.zoneId) ?? activeZone;
    const activeMachineForMatch = activeMachine ?? zone.machines[0] ?? null;
    const challengeMachine = getBossChallengeMachine(match.encounter, zone);
    const zoneMachine = activeMachineForMatch;
    const modifier = matchCatchModifier(match.encounter, zone, zoneMachine, trainer, activeBuddy, meter, save.trainingFatigue);
    const challengeProfile = bossChallengeProfileForZone(zone.type, match.encounter);
    const challengePenaltyState = bossChallengeCapturePenalty(match, zone, zoneMachine, meter, activeBuddy);
    const captureTarget = bossCaptureTarget(
      zone,
      match.encounter,
      challengePenaltyState.isActive ? challengePenaltyState.isAligned : null,
      match.bossChallengeMisses,
      match.bossChallengeNearMisses,
      match.bossChallengeMatchStreak,
      activeBuddy,
    );
    const zoneCatchProfile = BOSS_CAPTURE_WEIGHTS[zone.type];
    const base = clamp(match.encounter.catchChance + modifier.meterDelta, 0.08, 0.97);
    const bonus = clamp(modifier.raw / BOSS_METER_CATCH_SCALE[zone.type], -0.24, 0.32);
    const readinessBonus = clamp(modifier.readinessTotal / BOSS_CAPTURE_READINESS_SCALE[zone.type], -0.12, 0.12);
    const isChallengeMachine = !!(challengeMachine && zoneMachine && zoneMachine.id === challengeMachine.id);
    const challengeMissPenaltyFactor = match.encounter.isBoss && match.isBossChallengeActive ? challengePenaltyState.penalty : 0;
    const finalChance = clamp(
      base + bonus + readinessBonus - challengeMissPenaltyFactor,
      zoneCatchProfile.minCatch,
      zoneCatchProfile.maxCatch,
    );

    const passHold = match.encounter.isBoss ? meter >= captureTarget : meter >= 72;

    const lines = [...playerWonLine];
    if (match.encounter.isBoss && challengeMachine && zoneMachine) {
      lines.push(
        zoneMachine.id === challengeMachine.id
          ? `You stay on ${challengeMachine.name}, matching the boss challenge`
          : `The boss requested ${challengeMachine.name}; you are fighting off that angle elsewhere.`,
      );
    }
    if (challengePenaltyState.isActive) {
      lines.push(
        `Challenge state: ${match.bossChallengeMatchStreak}/${challengeProfile.streakLimit} streak · ${match.bossChallengeMisses} misses · ${match.bossChallengeNearMisses} near misses.`,
      );
    }
    if (
      match.encounter.isBoss &&
      match.bossChallengeMisses >= Math.max(2, challengeProfile.streakLimit + 1)
    ) {
      lines.push('Challenge overload: misses stacked; return to the required machine or pressure escalates.');
    }
    if (match.encounter.isBoss && match.isBossChallengeActive && challengePenaltyState.penalty > 0.005) {
      lines.push(`Capture penalty: -${challengePenaltyState.penaltyLabel} (streak bonus ${Math.round(challengePenaltyState.streakBonus * 100)}%).`);
    }
    if (match.encounter.isBoss) {
      const thresholdText = match.meter >= captureTarget ? 'met' : 'not met';
      lines.push(`Capture target ${captureTarget}% ${thresholdText}: current ${meter}%.`);
    }

    if (!passHold) {
      const escape = meter <= 24;
      setMatch((current) =>
        current
          ? {
              ...current,
              status: escape ? 'escape' : 'failed',
              lines: [...lines, escape ? 'It slips out at the end.' : 'You are close, but not enough.'],
              meter,
            }
          : current,
      );
      setMessage(
        escape
          ? match.encounter.isBoss
            ? 'The boss escaped the pin at the end.'
            : 'The wild buddy breaks loose.'
          : 'You missed the pin.',
      );
      activateAudioEngine().emitSfx(escape ? 'escape' : 'moveBad', escape ? 1 : 0.9);
      pulseTrainerEmote(escape ? 'drained' : 'grind', escape ? 1300 : 1100);
      setEncounter(escape ? null : encounter);
      return;
    }
    const roll = Math.random();
    if (roll > finalChance) {
      if (match.encounter.isBoss && challengePenaltyState.isActive && challengePenaltyState.nearWarn) {
        lines.push('Challenge discipline dropped. Re-center the required machine or your grip loses edge.');
      }
      setMatch((current) =>
        current
          ? {
              ...current,
              status: 'failed',
              meter,
              lines: [...lines, 'You almost had it, but its final twitch breaks the pin.'],
            }
          : current,
      );
      setMessage('The hold was almost won, but catch failed.');
      activateAudioEngine().emitSfx('catchAlmost', 1);
      pulseTrainerEmote('drained', 1200);
      return;
    }

    const newBuddy: Buddy = {
      id: `${encounter!.creature.dex}-${Date.now()}`,
      nickname: `${randomChoice(FANCY_NAMES)} #${encounter!.creature.dex}`,
      creature: encounter!.creature,
      level: encounter!.level,
      hp: 32 + encounter!.level * 2,
      maxHp: 42 + encounter!.level * 2,
      xp: 0,
      form: clampBuddyStats(11 + Math.round(encounter!.level * 0.45), MAX_BUDDY_FORM, 1),
      mobility: clampBuddyStats(12 + Math.round(encounter!.level * 0.4), MAX_BUDDY_MOBILITY, 1),
      volume: clampBuddyStats(4 + Math.round(encounter!.level * 0.08), MAX_BUDDY_VOLUME, 1),
    };

    const teamIsFull = save.team.length >= TEAM_SIZE;
    if (teamIsFull) {
      setMatch((current) =>
        current
          ? {
              ...current,
              status: 'full',
              meter,
              lines: [...lines, 'You win the pin, but your team is already full.'],
            }
          : current,
      );
      setMessage('Captured, but team is full.');
      activateAudioEngine().emitSfx('teamFull', 0.9);
      return;
    }

    setSave((state) => ({
      ...state,
      team: [...state.team, newBuddy],
      caughtDex: state.caughtDex.includes(encounter!.creature.dex)
        ? state.caughtDex
        : [...state.caughtDex, encounter!.creature.dex],
      activeIndex: state.activeIndex >= state.team.length ? state.team.length - 1 : state.activeIndex,
    }));

    setMatch((current) =>
      current
        ? {
            ...current,
            status: 'won',
            meter,
            lines: [
              ...lines,
              'You flatten your bodies, elbows locked, and drag the pressure down.',
              `YOU WIN THE ARMWRESTLE. ${encounter!.creature.name} cries like a baby and joins your squad.`,
            ],
          }
        : current,
    );
    setEncounter(null);
    activateAudioEngine().emitSfx('catchWin', 1.1);
    pulseTrainerEmote('victory', 1600);
    setMessage(`Captured ${encounter!.creature.name} as ${newBuddy.nickname}.`);
    pushLog(`Captured ${encounter!.creature.name} Lv.${encounter!.level}.`);
  }

  function performMove(move: Move) {
    if (!match || !match.encounter || match.status !== 'playing' || !activeBuddy) {
      return;
    }

    const zone = AREAS.find((entry) => entry.id === match.encounter.zoneId) ?? activeZone;
    const selectedMachine = activeMachine ?? zone.machines[0] ?? null;
    const modifier = matchCatchModifier(
      match.encounter,
      zone,
      selectedMachine,
      trainer,
      activeBuddy,
      match.meter,
      save.trainingFatigue,
    );
    const fatiguePressure = Math.round(fatigueRatio * 8);
    const trainerPressure = Math.round(modifier.trainerPressure * 1.12);
    const buddyPressure = Math.round(modifier.buddyPressure * 0.93);
    const challengePressure = modifier.bossPressure;
    const activeMachineForMatch = selectedMachine ?? zone.machines[0] ?? null;
    const challengeMachine = match.encounter.isBoss ? getBossChallengeMachine(match.encounter, zone) : null;
    const isChallengeMachine = !!(challengeMachine && activeMachineForMatch && activeMachineForMatch.id === challengeMachine.id);
    const isForcedChallengeRecovery = match.encounter.isBoss && match.isBossChallengeActive && isMatchChallengeOverload && !isChallengeMachine;
    const challengeProfile = bossChallengeProfileForZone(zone.type, match.encounter);
    const challengeMove = BOSS_CHALLENGE_MOVE_MODIFIERS[move.id];
    const battleProfile = workoutBuddyProfile(activeBuddy);
    const overloadRecoveryPenalty = isForcedChallengeRecovery
      ? clamp(Math.floor(activeMatchChallengeStress.percent / 10) + 8, 8, 18)
      : 0;
    const moveFatigueDrain = Math.max(
      0,
      Math.round(challengeMove.staminaDrain + (0.5 - battleProfile.movementConsistency) * 1.5 + overloadRecoveryPenalty),
    );
    const closeControl = Math.abs(match.meter - 50);
    const moveAlignmentBonus = isChallengeMachine ? challengeMove.alignmentBonus : 0;
    const moveMismatchPenalty = isChallengeMachine
      ? 0
      : clamp(
          Math.abs(challengeMove.mismatchPenalty) +
            Math.min(10, Math.floor((match.bossChallengeMisses + match.bossChallengeNearMisses) / 2)) +
            (isForcedChallengeRecovery ? 12 : 0),
          1,
          30,
        );

    setSave((state) => ({
      ...state,
      trainingFatigue: clamp(state.trainingFatigue + moveFatigueDrain, 0, MAX_TRAINING_FATIGUE),
    }));
    const nearMissNow = !isChallengeMachine && (isForcedChallengeRecovery || closeControl <= 10) ? 1 : 0;
    const challengeAlignmentNote =
      challengeMachine && match.encounter.isBoss && match.isBossChallengeActive
        ? isChallengeMachine
          ? 'You stay locked on the boss challenge machine.'
          : `Challenge break: ${challengeMachine.name} was expected.`
        : null;
    const nextMisses = match.encounter.isBoss && match.isBossChallengeActive
      ? isChallengeMachine
        ? Math.max(0, match.bossChallengeMisses - 1)
        : match.bossChallengeMisses + (isForcedChallengeRecovery ? 2 : 1)
      : match.bossChallengeMisses;
    const nextNearMisses = match.encounter.isBoss && match.isBossChallengeActive
      ? isChallengeMachine
        ? Math.max(0, match.bossChallengeNearMisses - 1)
        : match.bossChallengeNearMisses + nearMissNow
      : match.bossChallengeNearMisses;
    const nextMatchStreak = match.encounter.isBoss && match.isBossChallengeActive
      ? isChallengeMachine
        ? clamp(match.bossChallengeMatchStreak + 1, 0, challengeProfile.streakLimit)
        : 0
      : match.bossChallengeMatchStreak;
    const bossPowerScale = BOSS_POWER_BONUS_SCALE[zone.type];
    const bossBonus = (match.encounter.bossPowerBonus ?? 0) * bossPowerScale;
    const streakPressure = nextMatchStreak ? nextMatchStreak : 0;
    const moveMomentumPenalty = matchMovePenalty(moveMismatchPenalty, isChallengeMachine, nextNearMisses, nextMatchStreak);
    const readinessShift = clamp(Math.round(modifier.readinessTotal * 0.6), -8, 8);
    const nearMissPenalty = isChallengeMachine
      ? 0
      : clamp(4 + (match.bossChallengeNearMisses > challengeProfile.missResetGrace ? 2 : 0), 0, 16);
    const formEdge = clamp(Math.round((activeBuddy.form / MAX_BUDDY_FORM - 0.45) * 8), -2, 5);
    const mobilityEdge = clamp(Math.round((activeBuddy.mobility / MAX_BUDDY_MOBILITY - 0.45) * 7), -2, 4);
    const volumeEdge = clamp(Math.round((activeBuddy.volume / MAX_BUDDY_VOLUME - 0.55) * 10), -3, 3);
    const playerBase =
      activeBuddy.level * 1.75 +
      move.power +
      move.control +
      (0 - fatiguePressure) +
      trainerPressure +
      buddyPressure +
      challengePressure +
      (match.encounter.isBoss && isChallengeMachine ? 4 + moveAlignmentBonus + streakPressure : match.encounter.isBoss ? -moveMismatchPenalty : 0) -
      (match.encounter.isBoss && !isChallengeMachine ? nearMissPenalty : 0) +
      formEdge +
      mobilityEdge +
      volumeEdge +
      readinessShift +
      -challengeMove.staminaDrain +
      -overloadRecoveryPenalty * (isForcedChallengeRecovery ? 2 : 1) +
      randInt(-5, 9);
    const wildBase =
      match.encounter.level * 2.05 +
      match.encounter.creature.power +
      bossBonus -
      challengePressure +
      randInt(-4, 12) -
      clamp(Math.round(modifier.buddyEdge * 0.4), -4, 4);
    const delta = playerBase - wildBase;
    const nextMeter = clamp(match.meter + Math.floor((delta - moveMomentumPenalty) / 2), 20, 92);
    const round = match.round + 1;

    const line =
      delta >= 8
        ? `${move.title}: you crush the first edge and pull control.`
        : delta >= 0
          ? `${move.title}: pressure stays balanced; keep it up.`
          : `${move.title}: wild buddy resisted and pushed back.`;

    const nextLines = [
      ...match.lines,
      `${line} (${move.tactic}).`,
      ...(challengeAlignmentNote
        ? [
            isChallengeMachine
              ? `${challengeAlignmentNote} +${moveAlignmentBonus} bonus. ${nextMatchStreak >= challengeProfile.streakLimit ? 'Streak lock active.' : ''}`
              : `${challengeAlignmentNote} -${moveMismatchPenalty} penalty.`,
          ]
        : []),
      ...(isForcedChallengeRecovery
        ? ['You stay in overload: only the required machine can quickly recover pressure.']
        : []),
      ...(challengeMachine
        ? [`Challenge pressure: ${nextMisses}/${Math.max(5, challengeProfile.maxRounds)} misses · ${nextNearMisses} near-miss points.`]
        : []),
      `Round ${match.round}: meter ${nextMeter}%${
        isChallengeMachine ? '' : ` · challenge misses ${nextMisses}`
      }.`,
    ];
    if (nextMeter >= 84) {
      nextLines.push('It is almost yours. One clean burst and the pin lands.');
    }
    if (nextMeter <= 28) {
      nextLines.push('Danger: hold is fading. Keep it moving.');
    }
    activateAudioEngine().emitSfx(delta >= 0 ? 'moveGood' : 'moveBad', 0.5 + (Math.abs(delta) / 20));

    if (nextMeter >= 76) {
      pulseTrainerEmote('level', 900);
    } else if (match.encounter.isBoss && match.bossChallengeMisses >= challengeProfile.streakLimit + 1) {
      pulseTrainerEmote('drained', 850);
    } else if (nextMeter <= 34) {
      pulseTrainerEmote('focus', 800);
    } else {
      pulseTrainerEmote('grind', 700);
    }

    if (match.round >= match.maxRounds || nextMeter >= 92 || nextMeter <= 20) {
      resolveMatch(nextMeter, nextLines);
      return;
    }

    setMatch((current) =>
      current
            ? {
            ...current,
            round,
            meter: nextMeter,
            bossChallengeMisses: nextMisses,
            bossChallengeMatchStreak: nextMatchStreak,
            bossChallengeNearMisses: nextNearMisses,
            lines: nextLines,
          }
            : current,
    );
    setMessage(
      isForcedChallengeRecovery
        ? 'Overload lock active — return to the required machine before your next controlled pull.'
        : 'Round complete. Push once more.',
    );
  }

  function hpPercent(value: number, max: number) {
    return Math.round((value / max) * 100);
  }

  return !save.hasStarterSet ? renderStarterSetup() : (
    <div className="app-shell">
      {zoneTransit && (
        <div className="zone-transition">
          <div className="zone-transition-card">
            <div className="zone-transition-row">
              <span>{zoneTransit.icon}</span>
              <span>{zoneTransit.from}</span>
              <span>→</span>
              <span>{zoneTransit.to}</span>
            </div>
            <div className="zone-transition-subrow">
              <p className="small-note">Fresh gym air, new layout, and a different pressure profile load in.</p>
              {zoneTransit.routeName ? <p className="small-note">Route: {zoneTransit.routeName}</p> : null}
              {zoneTransit.routeFatigue !== undefined ? (
                <p className="small-note">Route fatigue: {zoneTransit.routeFatigue.toFixed(1)}</p>
              ) : null}
              {zoneTransit.routeEncounterBoost ? (
                <p className="small-note">Route scouting bonus: +{Math.round(zoneTransit.routeEncounterBoost * 100)}%</p>
              ) : null}
              {zoneTransit.routeScoutChance !== undefined ? (
                <p className="small-note">
                  Approx. route scouting chance: {Math.round(zoneTransit.routeScoutChance * 100)}%
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
      {tutorialActive && (
        <div className="tutorial-overlay">
          <div className="tutorial-card">
            <div className="panel-head-row">
              <h2>Tutorial</h2>
              <button className="secondary-btn" onClick={() => setShowRoadmap((open) => !open)}>
                {showRoadmap ? 'Hide plan' : 'Roadmap'}
              </button>
            </div>
            <p className="small-note">Step {Math.min(save.tutorialStep + 1, TUTORIAL_STEPS.length)} of {TUTORIAL_STEPS.length}</p>
            <p>{currentTutorialText}</p>
            <p className="small-note">You can still play, but finishing tutorial gives full control tips.</p>
            <div className="action-row">
              <button className="primary-btn" onClick={nextTutorialStep}>
                {save.tutorialStep >= TUTORIAL_STEPS.length - 1 ? 'Finish Tutorial' : 'Next'}
              </button>
              <button className="secondary-btn" onClick={finishTutorialNow}>
                Skip
              </button>
            </div>
            {showRoadmap && (
              <div className="roadmap">
                <h3>Feature cadence plan</h3>
                <small>Phase 1 (now): Controls, machine depth, beginner combat.</small>
                <small>Phase 2 (+2h): Boss prep items, gym challenges, rewards.</small>
                <small>Phase 3 (+4h): Late-game forms, rare trainer events.</small>
                <small>Phase 4 (+6h): Full gym-boss meta and balancing pass.</small>
              </div>
            )}
          </div>
        </div>
      )}
      <header className="top-banner">
        <h1>GYM BUDDIES</h1>
        <p>Pokémon-style world map, open-world gym travel, and capture battles.</p>
        <div className="panel-head-row">
          <span className="chip">Trainer: {trainer.name}</span>
          <span className="chip">Fatigue {trainingFatigueLevel} · {percent(1 - fatigueRatio)}</span>
          <div className="action-row">
            <button className="secondary-btn micro-btn" onClick={reopenTrainerSetup}>
              Reopen Setup
            </button>
            <button className="secondary-btn" onClick={resetTutorial}>
              Restart Tutorial
            </button>
          </div>
        </div>
        <div className="audio-controls">
          <button
            className="secondary-btn micro-btn"
            onClick={() => setAudioEnabled(!save.audio.enabled)}
            aria-pressed={save.audio.enabled}
          >
            {save.audio.enabled ? '🎧 Music: On' : '🎧 Music: Off'}
          </button>
          <label className="audio-control">
            <span>Music {Math.round(save.audio.musicVolume * 100)}%</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={save.audio.musicVolume}
              onChange={(event) => setMusicVolume(Number(event.target.value))}
            />
          </label>
          <label className="audio-control">
            <span>SFX {Math.round(save.audio.sfxVolume * 100)}%</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={save.audio.sfxVolume}
              onChange={(event) => setSfxVolume(Number(event.target.value))}
            />
          </label>
        </div>
      </header>

      <main className="game-grid">
        <section className="panel">
          <div className="panel-head-row">
            <h2>Gym Map</h2>
            <span className="chip">Party {save.team.length}/{TEAM_SIZE}</span>
          </div>
          <div className="zone-hero">
            <div>
              <div className="zone-hero-title">
                {zoneVibe.icon} {activeZone.name}
              </div>
              <p className="small-note">
                {zoneVibe.mood} · {zoneVibe.theme}
              </p>
            </div>
            <span className="chip">Zone Accent: {zoneVibe.accent}</span>
          </div>
          <p className="small-note">Current: {activeZone.name}</p>
          <p className="small-note">Boss in this gym: {bossTicker} until spawn · active interval 5-10 min</p>
          <p className="small-note">{activeZone.blurb}</p>
          <p className="small-note">
            Move with WASD or arrow keys: {movementHint || 'No exits available'}
          </p>
          <p className="small-note">
            Route scouting cooldown: {routeScoutCooldownRemaining <= 0 ? 'ready' : `${(routeScoutCooldownRemaining / 1000).toFixed(1)}s`}
          </p>
          {connectedWalks.length > 0 ? (
            <div className="world-move-controls">
              {connectedWalks.map(({ direction, destinationZone, routeName, routeFatigue, encounterBoost }) => (
                <button
                  key={`${direction}-${destinationZone ?? 'path'}`}
                  className="secondary-btn micro-btn"
                  onClick={() => moveTrainerByDirection(direction)}
                  disabled={isTraveling || isWorldMoving}
                >
                  {direction.toUpperCase()} · {routeName} → {destinationZone ? zoneNames[destinationZone] ?? destinationZone : 'Path'} · +{routeFatigue.toFixed(1)} fatigue{encounterBoost ? ` · +${Math.round(encounterBoost * 100)}% encounter` : ''}
                </button>
              ))}
            </div>
          ) : null}
          {worldMoveBlocked ? (
            <div className="world-move-progress-wrap">
              <div className="world-move-progress">
                <div className="world-move-progress-fill" style={{ width: `${Math.round(worldMovePercent * 100)}%` }} />
              </div>
              <small className="small-note">
                Stride lock: {Math.max(0, worldMoveCooldownRemaining) / WORLD_MOVE_COOLDOWN_MS < 0.01
                  ? 'free'
                  : `${(Math.ceil(worldMoveCooldownRemaining / 10) / 100).toFixed(2)}s`}
              </small>
            </div>
          ) : null}
          <div className="world-route-list">
            <div className="world-route-pill">
              Available routes:{' '}
              {connectedZones.map((zoneId) => zoneNames[zoneId] ?? zoneId).join(' · ') || 'none'}
            </div>
            <div
              className="world-mini-grid world-overworld-map"
              style={{
                width: WORLD_GRID_WIDTH * WORLD_TILE_PITCH + WORLD_GRID_PADDING * 2,
                height: WORLD_GRID_HEIGHT * WORLD_TILE_PITCH + WORLD_GRID_PADDING * 2,
              }}
            >
              {Array.from({ length: WORLD_GRID_WIDTH * WORLD_GRID_HEIGHT }, (_, index) => {
                const x = index % WORLD_GRID_WIDTH;
                const y = Math.floor(index / WORLD_GRID_WIDTH);
                const point = { x, y };
                const walkable = isWorldTileWalkable(point);
                if (!walkable) return null;
                const zoneId = worldTileZoneId(point);
                const base = worldTileToStyle(point);
                return (
                  <span
                    key={`cell-${x}-${y}`}
                    className={`world-grid-cell ${zoneId ? 'world-gym-tile' : 'world-route-tile'}`}
                    style={{ left: base.left, top: base.top }}
                    aria-hidden="true"
                  />
                );
              })}
              {AREAS.map((zone) => {
                const mapPos = mapPointForZone(zone.id);
                if (!mapPos) return null;
                const isActive = zone.id === save.activeZoneId;
                const linked = connectedZones.includes(zone.id);
                const isUnlocked = isZoneUnlocked(zone.id);
                const isRouteReady = (linked && isUnlocked) || isActive;
                const nearby = WORLD_PATH_LINKS.some(([from, to]) => [from, to].includes(zone.id) && [from, to].includes(save.activeZoneId));
                return (
                  <button
                    key={`main-${zone.id}`}
                    className={`world-mini-node ${zone.type} ${isActive ? 'active' : ''} ${isRouteReady ? 'route-ready' : 'route-locked'} ${
                      nearby ? 'route-nearby' : ''
                    }`}
                    style={{
                      left: mapPos.left - (WORLD_TILE_PX / 2),
                      top: mapPos.top - (WORLD_TILE_PX / 2),
                    }}
                    onClick={() => travelToZone(zone.id)}
                    disabled={!isRouteReady || isTraveling || isWorldMoving}
                  >
                    {zone.type === 'home' ? '🏠' : '🏋'}
                      <small>{zone.name}</small>
                      <small>{zone.blurb}</small>
                      {!isUnlocked && !isActive ? '🔒' : ''}
                  </button>
                );
              })}
              {WORLD_ROUTE_PATHS.map((route) => {
                const signPos = routeSignPosition(route);
                if (!signPos) return null;
                return (
                  <div
                    key={`${route.from}-${route.to}-sign`}
                    className="world-route-sign"
                    style={{
                      left: signPos.left,
                      top: signPos.top,
                    }}
                    title={`${route.routeName}: +${route.travelFatigue.toFixed(1)} fatigue · +${Math.round(
                      route.encounterBoost * 100,
                    )}% scouting`}
                  >
                    {route.routeName}
                  </div>
                );
              })}
              <div
                className={`world-mini-trainer trainer-facing-${trainerFacing}`}
                style={{
                  left: worldTileToStyle(worldPlayerPos).left - (WORLD_TILE_PX / 3),
                  top: worldTileToStyle(worldPlayerPos).top - (WORLD_TILE_PX / 3),
                }}
              >
                {trainer.name?.[0]?.toUpperCase() ?? 'T'}
              </div>
            </div>
            <div className="gym-grid">
              {AREAS.map((area) => {
                const linked = connectedZones.includes(area.id);
                const isActive = save.activeZoneId === area.id;
                const isUnlocked = isZoneUnlocked(area.id);
                const isHomeNode = area.id === 'home';
                const routeProfile = routeProfileFromZones(save.activeZoneId, area.id);
                const routeDetail = routeProfile
                  ? `${routeProfile.routeName} • +${routeProfile.travelFatigue.toFixed(1)} fatigue · +${Math.round(routeProfile.encounterBoost * 100)}% scouting`
                  : isActive
                    ? 'Current location'
                    : linked
                      ? 'Connected'
                      : 'Route not yet unlocked';
                const topMachines = area.machines
                  .slice(0, 2)
                  .map((entry) => entry.name.split(' ').at(0))
                  .join(' + ');
                return (
                  <button
                    key={area.id}
                    className={`gym-btn ${area.type} ${isActive ? 'active' : ''} ${
                      linked && isUnlocked ? 'route-ready' : isHomeNode ? '' : 'route-locked'
                    }`}
                    onClick={() => switchArea(area.id)}
                    disabled={(!linked && !isActive) || (!isUnlocked && !isActive)}
                    onMouseEnter={() => setPreviewZoneId(area.id)}
                    onMouseLeave={() => setPreviewZoneId((current) => (current === area.id ? null : current))}
                    onFocus={() => setPreviewZoneId(area.id)}
                    onBlur={() => setPreviewZoneId((current) => (current === area.id ? null : current))}
                    aria-label={`Travel to ${area.name}`}
                    title={
                      isActive
                        ? 'Current location'
                        : !isUnlocked
                          ? 'Locked: visit nearby gyms to unlock'
                          : linked
                            ? `Travel to ${area.name}`
                            : 'Explore map route to unlock this route'
                    }
                  >
                    <strong>{area.name}</strong>
                    <span>{area.type.toUpperCase()} · {ZONE_VIBES[area.id]?.accent ?? area.type}</span>
                    <small>Route: {routeDetail}</small>
                    <small>Machines: {topMachines || 'Mixed lifts'} · Boss {getGymBossTicker(area)}</small>
                  </button>
                );
              })}
              {previewZoneId && (() => {
                const preview = getRouteTransitionPreview(previewZoneId);
                if (!preview) return null;
                return (
                  <div className="route-preview-card" key={`preview-${preview.zone.id}`}>
                    <div className="route-preview-title">
                      {zoneNames[preview.zone.id] ?? preview.zone.id}
                    </div>
                    <small className="small-note">
                      {preview.canTravelNow
                        ? preview.isDirect
                          ? 'Direct travel route active'
                          : `Unlocked ${preview.routeDistance}-hop route`
                        : 'Route not unlocked yet'}
                    </small>
                    <small className="small-note">Route: {preview.routeName}</small>
                    <small className="small-note">Path: {preview.routePathName}</small>
                    <small className="small-note">Fatigue cost: {preview.fatigueCost.toFixed(1)}</small>
                    <small className="small-note">Scouting chance: {Math.round(preview.encounterChance * 100)}%</small>
                    <small className="small-note">Boss timer: {preview.bossTicker}</small>
                    {!preview.isUnlocked ? <small className="small-note route-preview-lock">Locked zone</small> : null}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="panel-head-row">
            <h3>Trainer Customization</h3>
            <button
              className="secondary-btn micro-btn"
              onClick={() => setShowTrainerPanel((open) => !open)}
            >
              {showTrainerPanel ? 'Hide' : 'Open'}
            </button>
          </div>
          <p className="small-note">Name: {trainer.name} · click Open for color edits.</p>

          {showTrainerPanel && (
            <div className="trainer-panel">
              <div className="trainer-panel-left">
                <TrainerSprite trainer={trainer} emote={activeEmote} />
                <div className="trainer-fields">
                  <label>
                    Name:
                    <input value={trainer.name} onChange={setTrainerName} maxLength={14} />
                  </label>
                  <div className="trainer-muscle-summary">
                    Physique Lvl {String(trainerPhysique).padStart(2, '0')}
                  </div>
                </div>
              </div>
              <div className="trainer-presets">
                {TRAINER_PRESETS.map((profile) => (
                  <button
                    key={profile.name}
                    className={`trainer-preset ${trainer.name === profile.name ? 'active' : ''}`}
                    onClick={() => setTrainerPreset(profile)}
                  >
                    {profile.name}
                  </button>
                ))}
              </div>
              <div className="trainer-sliders">
                <div className="muscle-sliders">
                  {TRAINER_MUSCLES.map((entry) => (
                    <label className="muscle-slider" key={entry.key}>
                      <span>{entry.label}</span>
                      <div className="muscle-slider-row">
                        <input
                          type="range"
                          min="0"
                          max={MAX_MUSCLE_LEVEL}
                          value={trainer.muscles[entry.key]}
                          onChange={(event) => setTrainerMuscle(entry.key, Number(event.target.value))}
                        />
                        <span>{trainer.muscles[entry.key]}</span>
                      </div>
                      <small>{entry.detail}</small>
                    </label>
                  ))}
                </div>
                <div className="trainer-row">
                  <span>Hair</span>
                  <input
                    type="color"
                    value={trainer.hair}
                    onChange={(event) => setTrainerColor('hair', event.target.value)}
                  />
                  <span>Skin</span>
                  <input
                    type="color"
                    value={trainer.skin}
                    onChange={(event) => setTrainerColor('skin', event.target.value)}
                  />
                </div>
                <div className="trainer-row">
                  <span>Top</span>
                  <input
                    type="color"
                    value={trainer.top}
                    onChange={(event) => setTrainerColor('top', event.target.value)}
                  />
                  <span>Gloves</span>
                  <input
                    type="color"
                    value={trainer.glove}
                    onChange={(event) => setTrainerColor('glove', event.target.value)}
                  />
                </div>
                <div className="trainer-row">
                  <span>Shoes</span>
                  <input
                    type="color"
                    value={trainer.shoes}
                    onChange={(event) => setTrainerColor('shoes', event.target.value)}
                  />
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <h3>Machines</h3>
          <p className="small-note">Selected machine boosts efficiency and fatigue tradeoff.</p>
          <div className="machine-grid">
            {activeZone.machines.map((machine) => (
              <button
                key={machine.id}
                className={`machine-btn ${activeMachine?.id === machine.id ? 'active' : ''}`}
                onClick={() => selectMachine(machine.id)}
              >
                  <strong>{machine.name}</strong>
                  <small>{machine.detail}</small>
                  <small>
                    XP {machine.xpMin}-{machine.xpMax} | x{machine.xpMultiplier.toFixed(2)} · Steroid +
                    {Math.round(machine.steroidChance * 100)}%
                    {' | '}
                    Focus: {machine.focus} · Stamina {machine.fatigueCost > 0 ? `-${machine.fatigueCost}` : '+0'}
                    {machine.hpRestore ? ` · Recovery +${machine.hpRestore}` : ''}
                    {activeBuddy
                      ? ` · Readiness ${percent(
                          workoutReadiness(
                            machine,
                            activeBuddy,
                            trainer,
                            activeZone.type,
                            save.trainingFatigue,
                            save.workoutMomentum,
                          ),
                        )}`
                      : ''}
                  </small>
                </button>
              ))}
            </div>

          <div className="team-area">
            <h3>Team Slots (up to 6)</h3>
            <div className="team-slots">
              {Array.from({ length: TEAM_SIZE }).map((_, i) => {
                const buddy = save.team[i];
                const active = save.activeIndex === i;
                return (
                  <button
                    key={`slot-${i}`}
                    className={`team-slot ${active ? 'active' : ''}`}
                    disabled={!buddy}
                    onClick={() => selectBuddy(i)}
                  >
                    <strong>{`#${String(i + 1).padStart(2, '0')}`}</strong>
                    {buddy ? (
                      <>
                        <span>{buddy.nickname}</span>
                        <small>{buddy.creature.name}</small>
                        <em>
                          Lv {buddy.level} | HP {buddy.hp}/{buddy.maxHp} ({hpPercent(buddy.hp, buddy.maxHp)}%)
                        </em>
                      </>
                    ) : (
                      <span className="empty">EMPTY</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {activeBuddy ? (
            <>
              <h3>Active Buddy</h3>
              <div className="active-card">
                <div
                  className={
                    `workout-rig ${
                      workoutSession?.phase === 'running'
                        ? 'workout-rig-running'
                        : workoutSession?.phase === 'spot'
                          ? 'workout-rig-spot'
                          : workoutSession?.phase === 'resolved'
                            ? 'workout-rig-resolved'
                            : ''
                    }`
                  }
                >
                  <PixelCreature creature={activeBuddy.creature} />
                </div>
                <div className="active-copy">
                  <strong>{activeBuddy.nickname}</strong>
                  <p>{activeBuddy.creature.flavor}</p>
                  <div>Lv {activeBuddy.level}</div>
                  <div>
                    HP {activeBuddy.hp}/{activeBuddy.maxHp}
                  </div>
                  <div className="buddy-metric-grid">
                    <div>Form: {activeBuddy.form} / {MAX_BUDDY_FORM}</div>
                    <div>Mobility: {activeBuddy.mobility} / {MAX_BUDDY_MOBILITY}</div>
                    <div>Volume: {activeBuddy.volume} / {MAX_BUDDY_VOLUME}</div>
                    <div>Band: {buddyStatBand(activeBuddy.form, MAX_BUDDY_FORM)}</div>
                  </div>
                  <div>
                    Momentum: {save.workoutMomentum}/{WORKOUT_MOMENTUM_MAX} · {workoutMomentumLabel(save.workoutMomentum)}
                  </div>
                  <div>
                    Deload Tokens: {save.deloadTokens}/{WORKOUT_DELOAD_MAX}
                  </div>
                  <div>Recovery: {activeBuddy.hp >= activeBuddy.maxHp ? 'ready' : `+${REST_ACTION_BUDDY_HEAL} at next rest`}</div>
                  <div>Rest cooldown: {canRest ? 'Ready' : `${restCooldownSeconds}s`}</div>
                  <div>
                    Readiness state: {trainingFatigueLevel} ({percent(clamp01(1 - save.trainingFatigue / MAX_TRAINING_FATIGUE))})
                  </div>
                  <div>XP {activeBuddy.xp}/{xpNeeded(activeBuddy.level)}</div>
                </div>
              </div>
              {workoutSession && (
                <div className="workout-console">
                  <div className="workout-progress-row">
                    <span className="small-note">
                      {workoutSession.phase === 'running'
                        ? 'Training rep in progress'
                        : workoutSession.phase === 'spot'
                          ? 'Rep slip detected: Spot the set'
                          : workoutSession.willFail
                            ? 'Spot attempt resolved'
                            : workoutSession.phase === 'resolved'
                              ? (activeBuddy
                                ? `${activeBuddy.nickname} stabilized`
                                : 'Set stabilized')
                              : 'Set complete'}
                    </span>
                      <span className="small-note">
                        Fail {percent(workoutSession.failChance)} · Spot bonus {percent(workoutSession.spotChanceBase)}
                      </span>
                      <span className="small-note">
                        Readiness {percent(workoutSession.readiness)} · {workoutSession.readinessLabel}
                      </span>
                      <span className="small-note">
                        Quality {percent(workoutSession.sessionQuality)} · Consistency {percent(workoutSession.movementConsistency)} · Volume {percent(
                          workoutSession.volumePreparedness,
                        )}
                      </span>
                      <span className="small-note">
                        Load {workoutSession.loadTier.toUpperCase()} · {percent(workoutSession.loadPressure)}
                      </span>
                    <span className="small-note">
                      Set strain {workoutSetStressLabel(workoutSession.setStress)} · {percent(workoutSession.setStress)}
                    </span>
                  </div>

                  <div className="workout-meter">
                    <div
                      className={`workout-meter-fill ${workoutSession.phase === 'spot' ? 'workout-meter-fill-danger' : ''}`}
                      style={{ width: `${workoutProgress}%` }}
                    />
                    <div className="workout-meter-cursor" />
                  </div>
                  <div className="workout-readiness-track">
                    <div
                      className="workout-readiness-fill"
                      style={{ width: `${workoutSession.readiness * 100}%` }}
                    />
                  </div>
                  <small className="small-note">
                    Set recovery {workoutSession.staminaChange >= 0 ? '+' : ''}
                    {workoutSession.staminaChange} HP expected ·
                    {workoutSession.readiness >= 0.68 ? ' Balanced form' : ' Form drift risk'}
                  </small>

                  {workoutSession.phase === 'running' && (
                    <>
                      <small className="small-note">
                         Hold steady: {Math.max(0, Math.ceil((workoutSession.startedAt + WORKOUT_DURATION_MS - workoutFrame) / 1000))}s
                      </small>
                      {workoutSession.willFail && (
                        <small className="small-note warning">Risk window opens soon — form is weakening.</small>
                      )}
                    </>
                  )}

                  {workoutSession.phase === 'spot' && (
                    <div className="workout-spot-wrap">
                      <div className="workout-spot-meter">
                        <div
                          className="workout-spot-meter-window"
                          style={{
                            left: `${Math.max(0, Math.min(100, (workoutSpotRemainingMs / workoutSession.spotWindowMs) * 100))}%`,
                          }}
                        />
                        <div
                          className="workout-spot-meter-pin"
                          style={{ left: `${Math.max(0, Math.min(100, ((workoutSession.spotWindowMs - workoutSpotRemainingMs) / workoutSession.spotWindowMs) * 100))}%` }}
                        />
                      </div>
                      <div className="workout-spot-action">
                        <button
                          className="secondary-btn trainer-spot-btn"
                          onClick={spotWorkout}
                          disabled={!canSpot}
                        >
                          {canSpot ? 'Rush + Spot Now' : 'Too Late'}
                        </button>
                          <small className="small-note">
                          Window left: {Math.max(0, Math.ceil(workoutSpotRemainingMs / 100) / 10)}s — Spot success {percent(
                            workoutSpotSuccessChance(workoutSpotRemainingMs, workoutSession.spotChanceBase, workoutSession.zoneType),
                          )}
                        </small>
                        <small className="small-note warning">
                          Need to click while phase is active. Miss window → +fatigue + HP drop.
                        </small>
                      </div>
                      <div className="trainer-spot-callout">
                        <div className="trainer-spot-sprite" aria-hidden="true">
                          <span>🏋️</span>
                        </div>
                        <p>Trainer is sprinting to spot.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="action-row">
                <button className="secondary-btn" onClick={recoverWithRest} disabled={!canRest}>
                  Recover
                </button>
                <button
                  className="primary-btn"
                  onClick={sendToWorkout}
                  disabled={
                    !activeBuddy ||
                    !!encounter ||
                    !!match ||
                    !!workoutSession ||
                    !activeMachine
                  }
                >
                  Train (+XP)
                </button>
                <button
                  className="primary-btn"
                  onClick={useSteroid}
                  disabled={!activeBuddy || save.steroids <= 0}
                >
                  Use Steroid (x{save.steroids})
                </button>
              </div>
            </>
          ) : (
            <p className="small-note">No active buddy selected.</p>
          )}

          <div className="xp-track">
            <div className="xp-fill" style={{ width: `${(save.team.length / TEAM_SIZE) * 100}%` }} />
          </div>

          <button className="primary-btn" onClick={beginEncounter} disabled={activeZone.type === 'home'}>
            Scout Wild Buddy
          </button>
        </section>

        <section className="panel">
          <h2>Capture Arena</h2>
          {!encounter ? (
            <p className="small-note">No encounter active. Move to a gym and press Scout or wait for a boss timer.</p>
          ) : (
            <>
              <div
                className={`combat-stage ${
                  encounter.isBoss
                    ? `combat-stage-boss ${
                        isMatchChallengeForcedRecovery
                          ? 'combat-stage-overload'
                          : isMatchChallengeAligned === false
                            ? 'combat-stage-drift'
                            : isMatchChallengeInDanger
                              ? 'combat-stage-danger'
                              : isMatchChallengeStreakReady || (match && match.meter >= activeMatchCaptureTarget - 6)
                                ? 'combat-stage-ready'
                              : isMatchChallengeAligned
                                ? 'combat-stage-lock'
                                : ''
                      } ${isMatchChallengeInDanger ? 'combat-stage-danger' : ''} `
                    : ''
                }`}
              >
                <div className="combat-row">
                  <div className={`combat-figure ${encounter.isBoss ? 'combat-figure-fighter' : ''}`}>
                    {activeBuddy ? <PixelCreature creature={activeBuddy.creature} /> : <span>None</span>}
                    <span>You</span>
                  </div>
                  <div className="combat-vs">VS</div>
                  <div className={`combat-figure ${encounter.isBoss ? 'combat-figure-opponent' : ''}`}>
                    <PixelCreature creature={encounter.creature} />
                    <span>{encounter.creature.name}</span>
                  </div>
                </div>

                <div className="encounter-data">
                  <div>Location: {zoneNames[encounter.zoneId]}</div>
                  <div>
                    Lv {encounter.level} · {encounter.isBoss ? 'Boss' : 'Wild'}{' '}
                    {encounter.bossName ? `(${encounter.bossName})` : ''} · Catch Chance {percent(encounter.catchChance)}
                    {encounter.creature.isExotic ? ' (Exotic)' : ''}
                  </div>
                  {encounter.isBoss && encounterChallengeMachine ? (
                    <small>
                      Machine challenge: {encounterChallengeMachine.name} · Challenge bonus {encounterMachineBonus >= 0 ? '+' : ''}
                      {encounterMachineBonus}
                    </small>
                  ) : null}
                  {match?.encounter?.isBoss ? <small>Boss capture target: {activeMatchCaptureTarget}%</small> : null}
                  {match?.encounter?.isBoss && match.isBossChallengeActive ? (
                    <small>
                      Challenge stress: {activeMatchChallengeStress.label} · {activeMatchChallengeStress.percent}% ·{' '}
                      {activeMatchChallengeStress.detail}
                    </small>
                  ) : null}
                  {activeMatchChallengeSummary?.isActive ? (
                    <small>
                      Challenge tier: {bossChallengeThresholdText(activeMatchChallengeSummary.tier, encounterZone.type)}
                    </small>
                  ) : null}
                  {challengeAlignmentText ? <small>{challengeAlignmentText}</small> : null}
                  {activeBuddy ? (
                    <small>
                      Trainer power {encounterTrainerPressure} · Buddy power {encounterBuddyPressure}
                    </small>
                  ) : null}
                  {match?.isBossChallengeActive && match.encounter?.isBoss ? (
                    <small>
                      Challenge misses: {match.bossChallengeMisses} · Near misses: {match.bossChallengeNearMisses} ·
                      Required machine: {match.bossChallengeMachineName ?? 'locked'}
                    </small>
                  ) : null}
                  {isMatchChallengeOverload ? <small>Boss challenge overload: return to required machine immediately.</small> : null}
                  {isMatchChallengeForcedRecovery ? (
                    <small className="overload-action-callout">
                      Forced recovery lock: every non-required move increases pressure and fatigue.
                    </small>
                  ) : null}
                  {match?.isBossChallengeActive && activeMatchChallengeSummary?.isActive ? (
                    <small>
                      Streak {match?.bossChallengeMatchStreak ?? 0}/{activeMatchChallengeProfile.streakLimit} ·
                      Grace {activeMatchChallengeProfile.missResetGrace}
                    </small>
                  ) : null}
                  {match?.encounter?.isBoss && match.isBossChallengeActive ? (
                    <div className="challenge-stress-track">
                      <div
                        className={`challenge-stress-fill challenge-stress-${activeMatchChallengeStress.tone}`}
                        style={{ width: `${activeMatchChallengeStress.percent}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              {!match ? (
                <button className="primary-btn" onClick={startMatch}>
                  Go flat and arm wrestle
                </button>
              ) : (
                <>
                  <div className="meter-track">
                  <div
                      className={`meter-fill ${
                        match.encounter.isBoss
                          ? isMatchChallengeOverload
                            ? 'meter-fill-challenge-overload'
                            : isMatchChallengeAligned === false
                            ? 'meter-fill-challenge-miss'
                            : isMatchChallengeInDanger
                              ? 'meter-fill-challenge-danger'
                              : isMatchChallengeStreakReady
                                ? 'meter-fill-challenge-lock'
                                : match.meter >= activeMatchCaptureTarget - 8
                                  ? 'meter-fill-challenge-ready'
                                  : isMatchChallengeAligned
                                    ? 'meter-fill-challenge-lock'
                                    : ''
                          : ''
                      }`}
                      style={{ width: `${match.meter}%` }}
                    />
                    <div className="meter-center" />
                    <div className="meter-pin" />
                  </div>
                  <div className="small-note">Round {match.round}/{match.maxRounds}</div>

                  {match.status === 'playing' && (
                    <div className="action-grid">
                      {MOVES.map((move) => (
                        <button
                          key={move.id}
                          className={`primary-btn ${isMatchChallengeForcedRecovery ? 'combat-move-recovery' : ''}`}
                          onClick={() => performMove(move)}
                          disabled={isMatchChallengeOverload && !isMatchChallengeAligned}
                        >
                          <span>{move.title}</span>
                          <small>{move.tactic}</small>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="narration">
                    {match.lines.map((line, index) => (
                      <p key={`${match.round}-${index}`}>{line}</p>
                    ))}
                  </div>

                  {match.status !== 'playing' && (
                    <div className="result-block">
                      {match.status === 'won' && <p className="crying">Creature is crying like a baby.</p>}
                      <p>
                        {match.status === 'won'
                          ? 'Capture complete.'
                          : match.status === 'full'
                            ? 'Team full.'
                            : match.status === 'escape'
                              ? 'Escaped.'
                              : 'Not caught.'}
                      </p>
                      <button
                        className="secondary-btn"
                        onClick={() => {
                          setMatch(null);
                          setEncounter(null);
                          setMessage('Arena reset. Scout again when ready.');
                        }}
                      >
                        Continue
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        <section className="panel">
          <h2>Gym Buddy Index</h2>
          <div className="dex-list">
            {CREATURES.map((creature) => {
              const seen = seenDex.includes(creature.dex);
              const caught = caughtDex.includes(creature.dex);
              return (
                <div key={creature.dex} className={`dex-item ${seen ? 'seen' : ''}`}>
                  <span className="dex-num">#{String(creature.dex).padStart(3, '0')}</span>
                  <div>
                    {seen ? creature.name : 'Unknown'}
                    <small>{caught ? 'Caught' : seen ? 'Seen' : 'Hidden'}</small>
                    <small>{creature.isExotic ? ' / Exotic' : ''}</small>
                  </div>
                </div>
              );
            })}
          </div>

          <h3>Log</h3>
          <ul className="log-list">
            {log.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="status-bar">
        <strong>Broadcast:</strong> {message}
      </footer>
    </div>
  );
}

