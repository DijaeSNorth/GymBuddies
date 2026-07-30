export type TrainerMuscleId =
  | 'shoulders'
  | 'chest'
  | 'arms'
  | 'triceps'
  | 'core'
  | 'quads'
  | 'calves'
  | 'back';

export type TrainerMuscles = Record<TrainerMuscleId, number>;

export type TrainerEquipmentBonuses = {
  power: number;
  technique: number;
  endurance: number;
  mobility: number;
  recovery: number;
};

export type TrainerBuildAttributeId =
  | 'height'
  | 'bodyScale'
  | 'headSize'
  | 'neckThickness'
  | 'shoulderWidth'
  | 'trapeziusSize'
  | 'chestSize'
  | 'upperBackWidth'
  | 'lowerBackThickness'
  | 'bicepsSize'
  | 'tricepsSize'
  | 'forearmSize'
  | 'handSize'
  | 'coreDefinition'
  | 'waistWidth'
  | 'gluteSize'
  | 'quadSize'
  | 'hamstringSize'
  | 'calfSize'
  | 'footSize'
  | 'muscleDefinition'
  | 'bodyMass'
  | 'clavicleWidth'
  | 'shoulderRoundness'
  | 'frontDeltSize'
  | 'sideDeltSize'
  | 'rearDeltSize'
  | 'upperChestFullness'
  | 'lowerChestFullness'
  | 'latWidth'
  | 'latFlare'
  | 'midBackThickness'
  | 'trapeziusHeight'
  | 'trapeziusWidth'
  | 'bicepsPeak'
  | 'bicepsThickness'
  | 'tricepsHorseshoeDefinition'
  | 'forearmThickness'
  | 'forearmVascularDefinition'
  | 'ribcageWidth'
  | 'waistTaper'
  | 'abdominalDefinition'
  | 'obliqueDefinition'
  | 'serratusDefinition'
  | 'midsectionThickness'
  | 'hipWidth'
  | 'gluteFullness'
  | 'quadSweep'
  | 'innerThighThickness'
  | 'hamstringDrop'
  | 'calfWidth'
  | 'calfHeight'
  | 'ankleThickness'
  | 'bodyFatPresentation'
  | 'muscleFullness'
  | 'muscleSeparation'
  | 'vascularity'
  | 'pumpLevel'
  | 'posture'
  | 'stanceWidth'
  | 'symmetryPreference';

export type TrainerCosmeticBuild = Record<TrainerBuildAttributeId, number>;

export type TrainerFaceAppearance = {
  shapeId: string;
  eyesId: string;
  eyebrowsId: string;
  noseId: string;
  mouthId: string;
  earsId: string;
  facialHairId: string;
  scarId: string;
  frecklesId: string;
  tattooId: string;
  facePaintId: string;
};

export type TrainerHairAppearance = {
  styleId: string;
  lengthId: string;
  colorId: string;
  highlightColorId: string;
};

export type TrainerOutfitAppearance = {
  topId: string;
  bottomsId: string;
  shoesId: string;
  socksId: string;
  glovesId: string;
  wristWrapsId: string;
  elbowSleevesId: string;
  kneeSleevesId: string;
  logoShapeId: string;
  chalkMarksId: string;
};

export type TrainerAccessoryAppearance = {
  headwearId: string;
  beltId: string;
  gymBagId: string;
  jewelryId: string;
  fantasyId: string;
  towelId: string;
};

export type TrainerColorAppearance = {
  skinToneId: string;
  topPrimaryId: string;
  topSecondaryId: string;
  topAccentId: string;
  bottomPrimaryId: string;
  bottomSecondaryId: string;
  shoePrimaryId: string;
  shoeAccentId: string;
  accessoryPrimaryId: string;
  accessoryAccentId: string;
  trimColorId: string;
  logoColorId: string;
};

export type TrainerAppearance = {
  version: 3;
  build: TrainerCosmeticBuild;
  face: TrainerFaceAppearance;
  hair: TrainerHairAppearance;
  outfit: TrainerOutfitAppearance;
  colors: TrainerColorAppearance;
  accessories: TrainerAccessoryAppearance;
};

export type TrainerAppearanceCategory =
  | 'build'
  | 'upper-body'
  | 'core'
  | 'lower-body'
  | 'face'
  | 'hair'
  | 'outfit'
  | 'colors'
  | 'accessories'
  | 'poses'
  | 'saved-looks';

export type TrainerBuildRegion =
  | 'build'
  | 'upper-body'
  | 'core'
  | 'lower-body';

export type TrainerForgeMode = 'quick' | 'detail';

export type TrainerRandomizationFilter =
  | 'any-physique'
  | 'heavy-builds'
  | 'lean-builds'
  | 'upper-body-dominant'
  | 'lower-body-dominant'
  | 'balanced'
  | 'fantasy-gym-champion'
  | 'realistic-athletic'
  | 'wild-colors'
  | 'neutral-colors';

export type TrainerPreviewMode =
  | 'single'
  | 'before-after'
  | 'front-back'
  | 'mirrored'
  | 'silhouette'
  | 'muscle-highlight'
  | 'clothing-compare';

export type TrainerPreviewLighting = 'neutral' | 'stage' | 'gym';

export type TrainerMuscleHighlightRegion =
  | 'upper-body'
  | 'core'
  | 'lower-body';

export type TrainerFacingDirection = 'front' | 'back' | 'left' | 'right';

export type TrainerPose =
  | 'idle'
  | 'walking'
  | 'running'
  | 'training'
  | 'victory'
  | 'fatigue'
  | 'capture'
  | 'boss-introduction'
  | 'front-relaxed'
  | 'back-relaxed'
  | 'front-double-biceps'
  | 'back-double-biceps'
  | 'side-chest'
  | 'side-triceps'
  | 'most-muscular'
  | 'abs-and-thigh'
  | 'victory-flex'
  | 'pre-workout-warmup'
  | 'post-set-pump'
  | 'fatigued-stance'
  | 'confident-walk'
  | 'boss-entrance-pose';

export type TrainerPoseDefinition = {
  id: TrainerPose;
  label: string;
  category: 'movement' | 'gameplay' | 'bodybuilding';
  defaultDirection: TrainerFacingDirection;
  silhouetteCue: string;
};

export type TrainerAppearancePreset = {
  id: string;
  name: string;
  appearance: TrainerAppearance;
};

export type TrainerProfile = {
  name: string;
  muscles: TrainerMuscles;
  appearance: TrainerAppearance;
  appearancePresets: TrainerAppearancePreset[];
  /** Legacy palette mirrors retained for old presentation consumers. */
  skin: string;
  hair: string;
  top: string;
  shoes: string;
  glove: string;
};

export type TrainerCreationDraft = {
  name: string;
  appearance: TrainerAppearance;
  appearancePresets: TrainerAppearancePreset[];
  muscles: TrainerMuscles;
  bodyPresetId: string | null;
  physiquePresetId: string | null;
};

export type TrainerBodyPreset = {
  id: string;
  label: string;
  description: string;
  muscles: TrainerMuscles;
};

export type TrainerBuildAttribute = {
  id: TrainerBuildAttributeId;
  key: TrainerBuildAttributeId;
  label: string;
  detail: string;
  minimumLabel: string;
  maximumLabel: string;
  region: TrainerBuildRegion;
  quick: boolean;
};

export type TrainerPhysiquePreset = {
  id: string;
  label: string;
  description: string;
  build: TrainerCosmeticBuild;
};

export type TrainerAppearanceExportEnvelope = {
  format: 'gym-buddies-appearance';
  version: 3;
  exportedAt: string;
  appearance: TrainerAppearance;
};

export type TrainerAppearanceOption = {
  id: string;
  label: string;
  description?: string;
};

export type TrainerColorOption = TrainerAppearanceOption & {
  hex: string;
};

export type TrainerStartMode = 'guided' | 'normal';

export type TrainerPreset = {
  id: string;
  profile: TrainerProfile;
};

export type TrainerMuscleAttribute = {
  id: TrainerMuscleId;
  key: TrainerMuscleId;
  label: string;
  detail: string;
};

export type FocusMuscleBoost = {
  muscle: TrainerMuscleId;
  weight: number;
};

export type TrainerFocusDefinition = {
  id: string;
  boosts: FocusMuscleBoost[];
};

export type TrainerEmote = 'neutral' | 'grind' | 'focus' | 'level' | 'victory' | 'drained' | 'ready' | 'pump';
