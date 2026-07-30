import type {
  TrainerAppearance,
  TrainerMuscles,
  TrainerPose,
} from './trainer';
import type {
  WorkoutLoadTier,
  WorkoutOutcome,
} from './training';

export type TrainerDevelopmentGroupId =
  | 'shoulders'
  | 'chest'
  | 'back'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves';

export type TrainerDevelopmentValues = Record<
  TrainerDevelopmentGroupId,
  number
>;

export type DevelopmentPresentationLevel =
  | 'cosmetic-only'
  | 'subtle'
  | 'standard'
  | 'exaggerated';

export type TrainerVisualProgressionPreferences = {
  developmentLevel: DevelopmentPresentationLevel;
  showPumpEffects: boolean;
  showFatigueEffects: boolean;
};

export type TrainerPumpState = {
  levels: TrainerDevelopmentValues;
  updatedAtGameplayMs: number;
};

export type WorkoutDevelopmentRecord = {
  id: string;
  gameplayTimeMs: number;
  machineId: string;
  loadTier: WorkoutLoadTier;
  outcome: WorkoutOutcome;
  quality: number;
  volume: number;
  developmentGains: TrainerDevelopmentValues;
  pumpGains: TrainerDevelopmentValues;
};

export type PhysiqueProgressSnapshot = {
  id: string;
  label: string;
  gameplayTimeMs: number;
  baseAppearance: TrainerAppearance;
  development: TrainerDevelopmentValues;
  pump: TrainerDevelopmentValues;
  fatigue: number;
};

export type BodybuildingChallengeId =
  | 'pose-sequence'
  | 'symmetry'
  | 'muscle-showcase'
  | 'conditioning'
  | 'pump-timing'
  | 'stage-presence';

export type BodybuildingChallengeRewardKind =
  | 'pose'
  | 'posing-outfit'
  | 'stage-lighting'
  | 'accessory'
  | 'title'
  | 'gym-banner'
  | 'trainer-card-frame'
  | 'victory-animation'
  | 'aura'
  | 'champion-cape'
  | 'rare-palette';

export type BodybuildingChallengeReward = {
  id: string;
  kind: BodybuildingChallengeRewardKind;
  label: string;
};

export type BodybuildingChallengeDefinition = {
  id: BodybuildingChallengeId;
  name: string;
  description: string;
  focusGroups: readonly TrainerDevelopmentGroupId[];
  preferredPoses: readonly TrainerPose[];
  targetTiming: number;
  fatigueTolerance: number;
  reward: BodybuildingChallengeReward;
};

export type BodybuildingChallengeProgress = {
  attemptsByChallengeId: Partial<Record<BodybuildingChallengeId, number>>;
  bestScoreByChallengeId: Partial<Record<BodybuildingChallengeId, number>>;
  completedChallengeIds: BodybuildingChallengeId[];
  unlockedRewardIds: string[];
};

export type TrainerVisualProgressionState = {
  baselineAppearance: TrainerAppearance;
  development: TrainerDevelopmentValues;
  pump: TrainerPumpState;
  recentTraining: WorkoutDevelopmentRecord[];
  snapshots: PhysiqueProgressSnapshot[];
  nextSnapshotSequence: number;
  preferences: TrainerVisualProgressionPreferences;
  challenges: BodybuildingChallengeProgress;
};

export type TrainerRecoveryPresentation = {
  fatigueRatio: number;
  stance: 'ready' | 'worked' | 'fatigued' | 'recovering';
  shoulderDrop: number;
  breathingIntensity: number;
  posingConfidence: number;
  showSweat: boolean;
  showRecoveryWraps: boolean;
};

export type TrainerVisualPresentation = {
  appearance: TrainerAppearance;
  developmentOffsets: TrainerDevelopmentValues;
  pumpOffsets: TrainerDevelopmentValues;
  pumpIntensity: number;
  recovery: TrainerRecoveryPresentation;
};

export type PhysiqueRatings = {
  balance: number;
  symmetry: number;
  conditioning: number;
  presentation: number;
  power: number;
  mobility: number;
  recovery: number;
};

export type BodybuildingChallengeInput = {
  challengeId: BodybuildingChallengeId;
  selectedPose: TrainerPose;
  timingPrecision: number;
  preparation: number;
  outfitAlignment: number;
  fatigue: number;
  development: TrainerDevelopmentValues;
  pump: TrainerDevelopmentValues;
  trainingHistory: readonly WorkoutDevelopmentRecord[];
  trainerMuscles: TrainerMuscles;
};

export type BodybuildingChallengeResult = {
  challengeId: BodybuildingChallengeId;
  score: number;
  rating: 'developing' | 'solid' | 'standout' | 'champion';
  completed: boolean;
  rewardId: string | null;
  factors: {
    timing: number;
    preparation: number;
    pose: number;
    training: number;
    pump: number;
    recovery: number;
    outfit: number;
    controlledVariation: number;
  };
  randomState: number;
};
