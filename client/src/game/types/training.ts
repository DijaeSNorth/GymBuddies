import type { AudioCueId } from './audio';
import type { BuddyDiscipline } from './buddy';
import type { GymZoneId } from './overworld';
import type { MachineMasteryProgress } from './progression';
import type { TrainerMuscleId } from './trainer';

export type GymKind = 'home' | 'starter' | 'higher';

export type WorkoutLoadTier = 'easy' | 'steady' | 'hard' | 'max';

export type WorkoutLoadDefinition = {
  id: WorkoutLoadTier;
  label: string;
  description: string;
  minimumPressure: number;
  intensity: number;
  repCount: number;
  repDurationMs: number;
  timingTarget: number;
  perfectWindow: number;
  goodWindow: number;
  failureModifier: number;
  fatigueMultiplier: number;
  hpMultiplier: number;
  xpMultiplier: number;
  momentumMultiplier: number;
  deloadTokens: number;
};

export type MachineDifficulty = 1 | 2 | 3 | 4 | 5;

export type MachineRewardTable = {
  id: string;
  buddyXp: {
    min: number;
    max: number;
    multiplier: number;
  };
  trainerGrowthMultiplier: number;
};

export type MachineDropProbabilities = {
  boostToken: number;
  deloadToken: number;
};

export type MachineTrainingHistory = {
  lastMachineId: string | null;
  repeatedUses: number;
  masteryByMachineId: Record<string, MachineMasteryProgress>;
};

export type GymMachine = {
  id: string;
  gymId: GymZoneId;
  name: string;
  visualConcept: string;
  detail: string;
  focus: string;
  primaryMuscleGroups: TrainerMuscleId[];
  buddyDisciplines: BuddyDiscipline[];
  rewardTable: MachineRewardTable;
  hpEffect: number;
  fatigueCost: number;
  momentumEffect: number;
  difficulty: MachineDifficulty;
  dropProbabilities: MachineDropProbabilities;
  recommendedTrainerLevel: {
    min: number;
    max: number;
  };
  repeatSoftCap: number;
  animationCueId: string;
  soundCueId: AudioCueId;
};

export type TrainingPhase = 'rep' | 'spot' | 'resolved';

export type WorkoutRepGrade = 'perfect' | 'good' | 'rough' | 'failed';

export type WorkoutOutcome = 'success' | 'rescued' | 'failure';

export type WorkoutFeedbackCode =
  | 'readiness-strong'
  | 'readiness-low'
  | 'trainer-aligned'
  | 'trainer-misaligned'
  | 'buddy-aligned'
  | 'buddy-misaligned'
  | 'volume-ready'
  | 'volume-low'
  | 'load-controlled'
  | 'load-demanding'
  | 'repeat-diminished'
  | 'technique-consistent'
  | 'technique-inconsistent'
  | 'spot-saved'
  | 'spot-missed';

export type WorkoutRepResult = {
  rep: number;
  inputAt: number;
  timingPosition: number;
  timingError: number;
  timingScore: number;
  grade: WorkoutRepGrade;
};

export type WorkoutPreview = {
  selectedLoad: WorkoutLoadTier;
  readiness: number;
  readinessLabel: string;
  failureProbability: number;
  repTimingMs: number;
  timingTarget: number;
  perfectWindow: number;
  goodWindow: number;
  formConsistency: number;
  setStress: number;
  volumePreparedness: number;
  trainerMachineAlignment: number;
  buddyDisciplineAlignment: number;
  expectedFatigueChange: number;
  expectedHpChange: number;
  expectedXp: number;
  loadPressure: number;
  deloadUsed: number;
  rewardEfficiency: number;
  feedbackCodes: WorkoutFeedbackCode[];
};

export type WorkoutSession = {
  id: number;
  phase: TrainingPhase;
  zoneType: GymKind;
  buddyId: string;
  machineId: string;
  startedAt: number;
  repStartedAt: number;
  currentRep: number;
  repCount: number;
  repDurationMs: number;
  timingTarget: number;
  perfectWindow: number;
  goodWindow: number;
  repResults: WorkoutRepResult[];
  durationMs: number;
  spotWindowMs: number;
  spotWindowStart: number;
  spotWindowEnd: number;
  spotSaveDeadline: number;
  failChance: number;
  buddyLevelBefore: number;
  hpLossOnFail: number;
  staminaChange: number;
  xpGain: number;
  steroidsAwarded: boolean;
  deloadTokensAwarded: number;
  resolved: boolean;
  outcome: WorkoutOutcome | null;
  readiness: number;
  readinessLabel: string;
  loadPressure: number;
  loadTier: WorkoutLoadTier;
  deloadUsed: number;
  setStress: number;
  movementConsistency: number;
  formConsistency: number;
  volumePreparedness: number;
  trainerMachineAlignment: number;
  buddyDisciplineAlignment: number;
  expectedFatigueChange: number;
  rewardEfficiency: number;
  sessionQuality: number;
  feedbackCodes: WorkoutFeedbackCode[];
};
