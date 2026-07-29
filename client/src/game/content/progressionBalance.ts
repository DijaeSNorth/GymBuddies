import type {
  BuddyDiscipline,
  BuddyIndexMilestone,
  EndgameActivityDefinition,
  GymProgressionMilestone,
  GymZoneId,
  MachineMasteryRank,
} from '../types';

/**
 * Progression curves live here so journey pacing can be tuned without changing
 * React, Phaser scenes, or the pure rules that consume the values.
 */
export const BUDDY_LEVEL_CURVE = {
  id: 'curve.buddy-level.v1',
  minimumLevel: 1,
  maximumLevel: 60,
  baseXp: 8,
  linearXpPerLevel: 0.72,
  lateRampStartLevel: 40,
  lateXpPerLevel: 0.55,
  maxHpBase: 30,
  maxHpSpeciesScale: 1,
  maxHpPerLevel: 2.2,
  levelUpHeal: 0.18,
} as const;

export const TRAINER_PHYSIQUE_CURVE = {
  id: 'curve.trainer-physique.v1',
  minimumLevel: 1,
  maximumLevel: 40,
  curveExponent: 1,
  workoutGrowthSoftCap: 3,
} as const;

export const CATCH_UP_CURVE = {
  id: 'curve.buddy-catch-up.v1',
  startsBelowExpectedByLevels: 3,
  bonusPerMissingLevel: 0.12,
  maximumXpMultiplier: 2.2,
  newcomerSessions: 8,
  newcomerXpMultiplier: 1.15,
} as const;

export const CHALLENGE_LEVEL_CURVE = {
  id: 'curve.challenge-level.v1',
  graceLevelsAboveExpected: 2,
  overlevelContribution: 0.28,
} as const;

export const MACHINE_MASTERY_RANKS: MachineMasteryRank[] = [
  { id: 'new', minimumXp: 0, readinessBonus: 0, xpMultiplier: 1 },
  {
    id: 'familiar',
    minimumXp: 18,
    readinessBonus: 0.01,
    xpMultiplier: 1.02,
  },
  {
    id: 'skilled',
    minimumXp: 50,
    readinessBonus: 0.025,
    xpMultiplier: 1.05,
  },
  {
    id: 'mastered',
    minimumXp: 110,
    readinessBonus: 0.04,
    xpMultiplier: 1.08,
  },
];

export const MACHINE_MASTERY_CURVE = {
  id: 'curve.machine-mastery.v1',
  failedSessionXp: 1,
  rescuedSessionXp: 3,
  successfulSessionBaseXp: 5,
  qualityXpScale: 5,
  maximumQuality: 1,
} as const;

export const DISCIPLINE_STRENGTH_CURVE = {
  id: 'curve.discipline-strength.v1',
  levelScale: 0.7,
  primaryBonus: 14,
  secondaryBonus: 7,
  dynamicStatScale: 0.8,
  maximum: 100,
  statWeights: {
    power: { power: 0.58, form: 0.22, volume: 0.2 },
    technique: { control: 0.5, form: 0.34, mobility: 0.16 },
    endurance: { stamina: 0.52, volume: 0.3, form: 0.18 },
    mobility: { mobility: 0.62, form: 0.2, control: 0.18 },
    recovery: { stamina: 0.34, mobility: 0.28, form: 0.38 },
  } satisfies Record<
    BuddyDiscipline,
    Partial<Record<'power' | 'control' | 'stamina' | 'form' | 'mobility' | 'volume', number>>
  >,
} as const;

export const GYM_PROGRESSION_MILESTONES: GymProgressionMilestone[] = [
  {
    id: 'progression.home',
    gymId: 'home',
    order: 1,
    expectedBuddyLevel: { min: 3, target: 4, max: 6 },
    expectedTrainerPhysique: { min: 7, target: 9, max: 12 },
    expectedCumulativeMinutes: { min: 18, target: 25, max: 35 },
    mainPathWorkoutSessions: 2,
    mainPathEncounters: 0,
    expectedBossWins: 1,
  },
  {
    id: 'progression.starter-a',
    gymId: 'starter-a',
    order: 2,
    expectedBuddyLevel: { min: 7, target: 10, max: 12 },
    expectedTrainerPhysique: { min: 9, target: 12, max: 15 },
    expectedCumulativeMinutes: { min: 52, target: 65, max: 82 },
    mainPathWorkoutSessions: 5,
    mainPathEncounters: 1,
    expectedBossWins: 1,
  },
  {
    id: 'progression.starter-b',
    gymId: 'starter-b',
    order: 3,
    expectedBuddyLevel: { min: 16, target: 20, max: 23 },
    expectedTrainerPhysique: { min: 13, target: 17, max: 20 },
    expectedCumulativeMinutes: { min: 100, target: 120, max: 145 },
    mainPathWorkoutSessions: 7,
    mainPathEncounters: 1,
    expectedBossWins: 1,
  },
  {
    id: 'progression.higher-1',
    gymId: 'higher-1',
    order: 4,
    expectedBuddyLevel: { min: 26, target: 30, max: 33 },
    expectedTrainerPhysique: { min: 19, target: 23, max: 27 },
    expectedCumulativeMinutes: { min: 160, target: 185, max: 215 },
    mainPathWorkoutSessions: 8,
    mainPathEncounters: 1,
    expectedBossWins: 1,
  },
  {
    id: 'progression.higher-2',
    gymId: 'higher-2',
    order: 5,
    expectedBuddyLevel: { min: 36, target: 40, max: 43 },
    expectedTrainerPhysique: { min: 25, target: 30, max: 34 },
    expectedCumulativeMinutes: { min: 225, target: 255, max: 295 },
    mainPathWorkoutSessions: 9,
    mainPathEncounters: 1,
    expectedBossWins: 1,
  },
  {
    id: 'progression.higher-3',
    gymId: 'higher-3',
    order: 6,
    expectedBuddyLevel: { min: 46, target: 50, max: 53 },
    expectedTrainerPhysique: { min: 32, target: 36, max: 39 },
    expectedCumulativeMinutes: { min: 285, target: 330, max: 390 },
    mainPathWorkoutSessions: 10,
    mainPathEncounters: 2,
    expectedBossWins: 1,
  },
];

export const BUDDY_INDEX_MILESTONES: BuddyIndexMilestone[] = [
  {
    id: 'index.first-four',
    seenRequired: 4,
    caughtRequired: 4,
    deloadTokensAwarded: 1,
  },
  {
    id: 'index.half-roster',
    seenRequired: 10,
    caughtRequired: 8,
    deloadTokensAwarded: 1,
  },
  {
    id: 'index-field-expert',
    seenRequired: 14,
    caughtRequired: 12,
    deloadTokensAwarded: 1,
  },
  {
    id: 'index-complete',
    seenRequired: 16,
    caughtRequired: 16,
    deloadTokensAwarded: 2,
  },
];

export const RECOVERY_PROGRESSION = {
  id: 'progression.recovery-resources.v1',
  fatigueComfortCeiling: 78,
  emergencyFatigueCeiling: 102,
  bossFailureProtectionAfter: 2,
  protectedFatigueRecovery: 24,
  protectedBuddyHpRatio: 0.35,
  maximumDeloadTokens: 4,
  mainPathDeloadDropChance: 0.16,
} as const;

export const ENDGAME_ACTIVITIES: EndgameActivityDefinition[] = [
  {
    id: 'endgame.rematch-circuit',
    name: 'Boss Rematch Circuit',
    unlock: 'main-journey',
    description:
      'Replay all six gyms with rotating machine, move-streak, and fatigue constraints.',
  },
  {
    id: 'endgame.mastery-board',
    name: 'Machine Mastery Board',
    unlock: 'mastery',
    description:
      'Master distinct machines without repeating one low-risk reward loop.',
  },
  {
    id: 'endgame.index-expeditions',
    name: 'Index Expeditions',
    unlock: 'index',
    description:
      'Use rare route areas and team roles to finish seen and caught records.',
  },
  {
    id: 'endgame-balanced-team-trials',
    name: 'Balanced Team Trials',
    unlock: 'all-bosses',
    description:
      'Clear optional rulesets with all five disciplines represented in the party.',
  },
];

export const ENDGAME_PROGRESSION_CURVE = {
  id: 'curve.endgame-rank.v1',
  maximumRank: 25,
  baseRankXp: 50,
  rankXpGrowth: 18,
  bossVariantXp: 18,
  masteredMachineXp: 12,
  caughtSpeciesXp: 4,
  requiredGymCompletions: 6,
} as const;

export const JOURNEY_SIMULATION_BALANCE = {
  id: 'simulation.complete-journey.v1',
  defaultJourneyCount: 2_000,
  minimumJourneyCount: 1_000,
  startingBuddyLevel: 4,
  startingBuddyCount: 2,
  startingCaughtSpecies: 2,
  workoutMinutes: 3.4,
  encounterMinutes: 4.2,
  bossAttemptMinutes: 7.5,
  recoveryStopMinutes: 2.5,
  stageExplorationVarianceMinutes: 8,
  workoutXpByGym: {
    home: 4,
    'starter-a': 6,
    'starter-b': 8,
    'higher-1': 10,
    'higher-2': 11,
    'higher-3': 12,
  } satisfies Record<GymZoneId, number>,
  workoutFatigueByGym: {
    home: 5,
    'starter-a': 7,
    'starter-b': 8,
    'higher-1': 10,
    'higher-2': 11,
    'higher-3': 12,
  } satisfies Record<GymZoneId, number>,
  bossXpByGym: {
    home: 8,
    'starter-a': 12,
    'starter-b': 16,
    'higher-1': 20,
    'higher-2': 24,
    'higher-3': 30,
  } satisfies Record<GymZoneId, number>,
  optionalWorkoutsByStyle: {
    mainline: 0,
    balanced: 2,
    collector: 1,
    optimizer: 5,
  },
  optionalEncountersByStyle: {
    mainline: 0,
    balanced: 1,
    collector: 4,
    optimizer: 1,
  },
} as const;

export const GYM_PROGRESSION_BY_ID = new Map(
  GYM_PROGRESSION_MILESTONES.map((milestone) => [
    milestone.gymId,
    milestone,
  ]),
);

export function getGymProgressionMilestone(gymId: string) {
  return GYM_PROGRESSION_BY_ID.get(gymId as GymZoneId);
}
