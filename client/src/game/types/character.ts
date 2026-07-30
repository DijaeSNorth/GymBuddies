import type { BuddyDiscipline } from './buddy';
import type {
  TrainerBuildAttributeId,
  TrainerFacingDirection,
  TrainerPose,
} from './trainer';

export type MuscularBodyArchetypeId =
  | 'classic-bodybuilder'
  | 'heavy-powerlifter'
  | 'strongman'
  | 'balanced-athlete'
  | 'lean-fighter'
  | 'compact-powerhouse'
  | 'lower-body-specialist'
  | 'upper-body-specialist'
  | 'mobility-specialist'
  | 'heavyweight-anchor'
  | 'open-bodybuilder'
  | 'taper-performer'
  | 'sculpted-physique'
  | 'figure-balance'
  | 'platform-lifter'
  | 'lean-athlete';

export type MuscularBodyArchetype = {
  id: MuscularBodyArchetypeId;
  label: string;
  physiquePresetId: string;
  silhouette: string;
  strengthLanguage: string;
  posture: 'upright' | 'grounded' | 'forward' | 'open' | 'coiled';
};

export type CharacterExpressionId =
  | 'steady'
  | 'warm'
  | 'focused'
  | 'bold'
  | 'playful'
  | 'reserved'
  | 'fierce'
  | 'measured';

export type CharacterAppearanceRecipe = {
  archetypeId: MuscularBodyArchetypeId;
  heightShift: number;
  skinToneId: string;
  faceShapeId: string;
  eyesId: string;
  eyebrowsId: string;
  noseId: string;
  mouthId: string;
  facialHairId: string;
  hairStyleId: string;
  hairLengthId: string;
  hairColorId: string;
  topId: string;
  bottomsId: string;
  shoesId: string;
  glovesId: string;
  wristWrapsId: string;
  headwearId: string;
  beltId: string;
  primaryColorId: string;
  secondaryColorId: string;
  accentColorId: string;
};

export type CharacterOutfitVariant = {
  id: string;
  label: string;
  topId: string;
  bottomsId: string;
  primaryColorId: string;
  secondaryColorId: string;
  accentColorId: string;
};

export type CharacterSponsorPatch = {
  id: string;
  label: string;
  symbol: 'anchor' | 'arc' | 'knot' | 'spark' | 'summit';
};

export type WorldCharacterKind =
  | 'npc-trainer'
  | 'rival'
  | 'gym-leader';

export type WorldCharacterDesign = {
  id: string;
  name: string;
  kind: WorldCharacterKind;
  discipline: BuddyDiscipline;
  appearance: CharacterAppearanceRecipe;
  idlePose: TrainerPose;
  expressionId: CharacterExpressionId;
  primaryMuscleEmphasis: TrainerBuildAttributeId;
  regionalMuscleEmphasis: TrainerBuildAttributeId[];
  trainingPhilosophy: string;
  signaturePose: TrainerPose;
  warmupAnimationId: string;
  victoryPose: TrainerPose;
  lossReactionId: string;
  signatureClothing: string;
  signatureOutfitId: string;
  alternateLateGameOutfit: CharacterOutfitVariant;
  signatureEquipment: string;
  gymAccessoryId: string;
  sponsorPatch: CharacterSponsorPatch;
  battleStance: string;
  entranceAnimationId: string;
  idleAnimationId: string;
  victoryAnimationId: string;
  handcrafted: boolean;
};

export type NpcAppearanceTemplate = {
  id: string;
  label: string;
  archetypeIds: MuscularBodyArchetypeId[];
  disciplineIds: BuddyDiscipline[];
  skinToneIds: string[];
  faceShapeIds: string[];
  hairStyleIds: string[];
  topIds: string[];
  bottomIds: string[];
  accessoryIds: string[];
  facialHairIds: string[];
  eyebrowIds: string[];
  regionalOutfitIds: string[];
  trainingSpecialtyIds: string[];
  posePreferenceIds: TrainerPose[];
  expressionIds: CharacterExpressionId[];
  idlePoseIds: TrainerPose[];
};

export type NpcOutfitCombination = {
  id: string;
  regionId: string;
  topId: string;
  bottomsId: string;
  shoesId: string;
  accessoryId: string;
};

export type NpcCharacterSeed = {
  id: string;
  name: string;
  templateId: string;
  seed: number;
  trainingPhilosophy: string;
};

export type CharacterGalleryFrame = {
  id: string;
  direction: TrainerFacingDirection;
  pose: TrainerPose;
};
