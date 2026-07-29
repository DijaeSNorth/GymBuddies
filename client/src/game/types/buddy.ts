export type PixelPalette = {
  skin: string;
  core: string;
  detail: string;
  accent: string;
};

export const BUDDY_DISCIPLINES = [
  'power',
  'technique',
  'endurance',
  'mobility',
  'recovery',
] as const;

export type BuddyDiscipline = (typeof BUDDY_DISCIPLINES)[number];

export const BUDDY_BASE_STAT_KEYS = [
  'baseHp',
  'power',
  'control',
  'stamina',
  'form',
  'mobility',
  'volume',
] as const;

export type BuddyBaseStatKey = (typeof BUDDY_BASE_STAT_KEYS)[number];

export type BuddyGrowthCurve = 'early-surge' | 'steady' | 'late-bloom';

export type BuddyGrowthProfile = {
  id: string;
  curve: BuddyGrowthCurve;
  emphasizedStats: BuddyBaseStatKey[];
  description: string;
};

export type BuddyPassiveAbility = {
  id: string;
  name: string;
  description: string;
};

export type BuddySignatureMove = {
  id: string;
  name: string;
  discipline: BuddyDiscipline;
  description: string;
};

export type BuddyAnimationReferences = {
  idle: string;
  walk: string;
  battle: string;
  hurt: string;
  victory: string;
  signature: string;
};

export type BuddyBodySizeId = 'compact' | 'standard' | 'broad';
export type BuddyMuscleDefinitionId = 'smooth' | 'defined' | 'etched';
export type BuddyExpressionId =
  | 'steady'
  | 'cheerful'
  | 'focused'
  | 'fierce'
  | 'sleepy'
  | 'playful';
export type BuddyFacingDirection = 'front' | 'back' | 'left' | 'right';
export type BuddyPose =
  | 'idle'
  | 'walking'
  | 'running'
  | 'training'
  | 'victory'
  | 'fatigue'
  | 'capture'
  | 'entrance';

export type BuddyCosmetics = {
  version: 1;
  primaryPaletteId: string;
  secondaryPaletteId: string;
  accentPaletteId: string;
  patternId: string;
  muscleDefinitionId: BuddyMuscleDefinitionId;
  bodySizeId: BuddyBodySizeId;
  appendageVariantId: string;
  accessoryIds: string[];
  rareTraitId: string;
  expressionId: BuddyExpressionId;
  victoryPoseId: string;
  entranceAnimationId: string;
};

export type BuddyVisualOption = {
  id: string;
  label: string;
};

export type BuddyMusclePlacement =
  | 'shoulders'
  | 'chest'
  | 'back'
  | 'core'
  | 'forearms'
  | 'legs';

export type BuddyCharacterDesign = {
  id: string;
  speciesId: string;
  buildLabel: string;
  trainingSpecialization: string;
  silhouetteModuleId: string;
  musclePlacement: BuddyMusclePlacement;
  bodyVariations: BuddyVisualOption[];
  patternOptions: BuddyVisualOption[];
  appendageOptions: BuddyVisualOption[];
  accessoryOptions: BuddyVisualOption[];
  rareTraitOptions: BuddyVisualOption[];
  expressionOptions: BuddyVisualOption[];
  victoryPoseOptions: BuddyVisualOption[];
  entranceAnimationOptions: BuddyVisualOption[];
  defaultCosmetics: BuddyCosmetics;
};

export type BuddySpecies = {
  id: string;
  dex: number;
  name: string;
  primaryDiscipline: BuddyDiscipline;
  secondaryDiscipline?: BuddyDiscipline;
  visualConcept: string;
  silhouette: string;
  personality: string;
  habitat: string;
  gameplayRole: string;
  baseHp: number;
  control: number;
  stamina: number;
  form: number;
  mobility: number;
  volume: number;
  growthProfile: BuddyGrowthProfile;
  captureDifficulty: 1 | 2 | 3 | 4 | 5;
  passiveAbility: BuddyPassiveAbility;
  signatureMove: BuddySignatureMove;
  animations: BuddyAnimationReferences;
  flavor: string;
  isExotic: boolean;
  power: number;
  sprite: string[];
  palette: PixelPalette;
};

export type Buddy = {
  id: string;
  nickname: string;
  creature: BuddySpecies;
  /** Cosmetic-only profile. Older in-memory fixtures are normalized on render/save. */
  cosmetics?: BuddyCosmetics;
  level: number;
  hp: number;
  maxHp: number;
  xp: number;
  trainingSessions?: number;
  form: number;
  mobility: number;
  volume: number;
};

export type StarterBuddyDefinition = {
  id: string;
  speciesId: string;
  seed: number;
  level: number;
};
