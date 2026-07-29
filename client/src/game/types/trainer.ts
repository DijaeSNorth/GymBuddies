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
  | 'bodyMass';

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
};

export type TrainerAccessoryAppearance = {
  headwearId: string;
  beltId: string;
  gymBagId: string;
  jewelryId: string;
  fantasyId: string;
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
};

export type TrainerAppearance = {
  version: 2;
  build: TrainerCosmeticBuild;
  face: TrainerFaceAppearance;
  hair: TrainerHairAppearance;
  outfit: TrainerOutfitAppearance;
  colors: TrainerColorAppearance;
  accessories: TrainerAccessoryAppearance;
};

export type TrainerAppearanceCategory =
  | 'build'
  | 'face'
  | 'hair'
  | 'outfit'
  | 'colors'
  | 'accessories'
  | 'preview';

export type TrainerFacingDirection = 'front' | 'back' | 'left' | 'right';

export type TrainerPose =
  | 'idle'
  | 'walking'
  | 'running'
  | 'training'
  | 'victory'
  | 'fatigue'
  | 'capture'
  | 'boss-introduction';

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
};

export type TrainerPhysiquePreset = {
  id: string;
  label: string;
  description: string;
  build: TrainerCosmeticBuild;
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
