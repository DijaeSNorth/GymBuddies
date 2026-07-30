import type { CaptureMoveId } from './capture';
import type {
  BuddyBodySizeId,
  BuddyExpressionId,
  BuddyMusclePlacement,
  BuddyMuscleDefinitionId,
} from './buddy';

export type BossPresentationTier =
  | 'normal'
  | 'pumped'
  | 'overload'
  | 'final-round'
  | 'defeated';

export type BossPresentationTierDesign = {
  id: string;
  tier: BossPresentationTier;
  label: string;
  poseId:
    | 'boss-entrance'
    | 'front-flex'
    | 'back-flex'
    | 'side-pose'
    | 'fatigue';
  equipmentCue: string;
  arenaLightingClass: string;
  motionCue: string;
};

export type BossSchedule = {
  readyAtGameplayMs: number;
  defeated: number;
  cycle: number;
  lastRewardedCycle: number;
  lastBossId?: string;
};

export type BossSignatureTrigger =
  | 'opening'
  | 'player-repeat'
  | 'low-stamina'
  | 'machine-mismatch'
  | 'near-target'
  | 'required-action'
  | 'final-round'
  | 'miss'
  | 'opponent-low-stamina'
  | 'near-miss'
  | 'high-stress'
  | 'overload';

export type BossSignatureRule = {
  id: string;
  name: string;
  description: string;
  warning: string;
  trigger: BossSignatureTrigger;
  requiredMoveId: CaptureMoveId;
  openingMeterShift: number;
  meterShift: number;
  fatigueShift: number;
  targetShift: number;
  stressShift: number;
};

export type BossArenaEffect = {
  id: string;
  name: string;
  description: string;
  className: string;
};

export type BossRewardTable = {
  id: string;
  buddyXp: number;
  fatigueRecovery: number;
  momentum: number;
  deloadTokens: number;
  bonusDeloadChance: number;
};

export type GymBoss = {
  id: string;
  name: string;
  speciesId: string;
  levelShift: number;
  catchMultiplier: number;
  powerBoost: number;
  personality: string;
  visualIdentity: string;
  preferredTactic: CaptureMoveId;
  counterplay: string;
  signatureRule: BossSignatureRule;
  arenaEffect: BossArenaEffect;
  rewardTable: BossRewardTable;
};

export type GymBossRoster = {
  id: string;
  gymId: string;
  bosses: GymBoss[];
};

export type BossCharacterDesign = {
  id: string;
  bossId: string;
  speciesId: string;
  buildLabel: string;
  primaryMuscleEmphasis: BuddyMusclePlacement;
  trainingPhilosophy: string;
  signaturePoseId: string;
  signatureClothing: string;
  signatureEquipment: string;
  primaryPaletteId: string;
  secondaryPaletteId: string;
  accentPaletteId: string;
  patternId: string;
  bodySizeId: BuddyBodySizeId;
  muscleDefinitionId: BuddyMuscleDefinitionId;
  appendageVariantId: string;
  accessoryIds: string[];
  rareTraitId: string;
  expressionId: BuddyExpressionId;
  battleStance: string;
  entranceAnimationId: string;
  victoryAnimationId: string;
  presentationTiers: BossPresentationTierDesign[];
};
