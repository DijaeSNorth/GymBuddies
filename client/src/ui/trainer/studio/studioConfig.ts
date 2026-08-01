import type { TrainerBuildAttributeId } from '../../../game/types';

export type TrainerStudioSection =
  | 'build'
  | 'face'
  | 'hair'
  | 'outfit'
  | 'colors'
  | 'accessories'
  | 'poses'
  | 'gameplay';

export type TrainerStudioDrawerId = 'saved-looks' | 'randomize' | 'help';

export type TrainerBodyRegionId =
  | 'overall'
  | 'head-neck'
  | 'shoulders'
  | 'chest'
  | 'back'
  | 'arms'
  | 'core'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'hands-feet';

export type TrainerBodyControlGroup = Readonly<{
  id: string;
  label: string;
  attributeIds: readonly TrainerBuildAttributeId[];
}>;

export type TrainerBodyRegionDefinition = Readonly<{
  id: TrainerBodyRegionId;
  label: string;
  shortLabel: string;
  previewRegion: 'upper-body' | 'core' | 'lower-body' | undefined;
  groups: readonly TrainerBodyControlGroup[];
}>;

export const QUICK_FORGE_BUILD_IDS: readonly TrainerBuildAttributeId[] = [
  'bodyScale',
  'shoulderWidth',
  'chestSize',
  'upperBackWidth',
  'bicepsSize',
  'waistWidth',
  'quadSize',
  'bodyMass',
  'muscleDefinition',
  'posture',
];

export const QUICK_FORGE_GROUPS: readonly TrainerBodyControlGroup[] = [
  {
    id: 'quick-upper-frame',
    label: 'Upper frame',
    attributeIds: ['bodyScale', 'shoulderWidth', 'chestSize', 'upperBackWidth', 'bicepsSize'],
  },
  {
    id: 'quick-balance-finish',
    label: 'Balance and finish',
    attributeIds: ['waistWidth', 'quadSize', 'bodyMass', 'muscleDefinition', 'posture'],
  },
];

export const TRAINER_BODY_REGIONS: readonly TrainerBodyRegionDefinition[] = [
  {
    id: 'overall',
    label: 'Overall',
    shortLabel: 'ALL',
    previewRegion: undefined,
    groups: [
      {
        id: 'overall-frame',
        label: 'Frame',
        attributeIds: ['height', 'bodyScale', 'bodyMass', 'muscleDefinition', 'muscleFullness', 'bodyFatPresentation'],
      },
      {
        id: 'overall-stage',
        label: 'Stage presentation',
        attributeIds: ['muscleSeparation', 'vascularity', 'pumpLevel', 'posture', 'stanceWidth', 'symmetryPreference'],
      },
    ],
  },
  {
    id: 'head-neck',
    label: 'Head & Neck',
    shortLabel: 'HEAD',
    previewRegion: 'upper-body',
    groups: [
      {
        id: 'head-neck-shape',
        label: 'Head and neck',
        attributeIds: ['headSize', 'neckThickness', 'trapeziusSize', 'trapeziusHeight', 'trapeziusWidth'],
      },
    ],
  },
  {
    id: 'shoulders',
    label: 'Shoulders',
    shortLabel: 'DELTS',
    previewRegion: 'upper-body',
    groups: [
      {
        id: 'shoulder-frame',
        label: 'Shoulder frame',
        attributeIds: ['shoulderWidth', 'clavicleWidth', 'shoulderRoundness', 'trapeziusSize'],
      },
      {
        id: 'shoulder-delts',
        label: 'Delt development',
        attributeIds: ['frontDeltSize', 'sideDeltSize', 'rearDeltSize', 'trapeziusHeight', 'trapeziusWidth'],
      },
    ],
  },
  {
    id: 'chest',
    label: 'Chest',
    shortLabel: 'CHEST',
    previewRegion: 'upper-body',
    groups: [
      {
        id: 'chest-development',
        label: 'Chest development',
        attributeIds: ['chestSize', 'upperChestFullness', 'lowerChestFullness', 'ribcageWidth', 'clavicleWidth'],
      },
    ],
  },
  {
    id: 'back',
    label: 'Back',
    shortLabel: 'BACK',
    previewRegion: 'upper-body',
    groups: [
      {
        id: 'back-width',
        label: 'Width and flare',
        attributeIds: ['upperBackWidth', 'latWidth', 'latFlare', 'trapeziusWidth'],
      },
      {
        id: 'back-thickness',
        label: 'Thickness',
        attributeIds: ['lowerBackThickness', 'midBackThickness', 'trapeziusSize', 'trapeziusHeight'],
      },
    ],
  },
  {
    id: 'arms',
    label: 'Arms',
    shortLabel: 'ARMS',
    previewRegion: 'upper-body',
    groups: [
      {
        id: 'upper-arms',
        label: 'Upper arms',
        attributeIds: ['bicepsSize', 'bicepsPeak', 'bicepsThickness', 'tricepsSize', 'tricepsHorseshoeDefinition'],
      },
      {
        id: 'forearms-grip',
        label: 'Forearms and grip',
        attributeIds: ['forearmSize', 'forearmThickness', 'forearmVascularDefinition', 'handSize'],
      },
    ],
  },
  {
    id: 'core',
    label: 'Core',
    shortLabel: 'CORE',
    previewRegion: 'core',
    groups: [
      {
        id: 'core-silhouette',
        label: 'Core silhouette',
        attributeIds: ['coreDefinition', 'waistWidth', 'waistTaper', 'ribcageWidth', 'midsectionThickness'],
      },
      {
        id: 'core-detail',
        label: 'Core detail',
        attributeIds: ['abdominalDefinition', 'obliqueDefinition', 'serratusDefinition', 'lowerBackThickness'],
      },
    ],
  },
  {
    id: 'glutes',
    label: 'Glutes',
    shortLabel: 'GLUTES',
    previewRegion: 'lower-body',
    groups: [
      {
        id: 'glute-development',
        label: 'Glute development',
        attributeIds: ['gluteSize', 'gluteFullness', 'hipWidth', 'stanceWidth'],
      },
    ],
  },
  {
    id: 'quads',
    label: 'Quads',
    shortLabel: 'QUADS',
    previewRegion: 'lower-body',
    groups: [
      {
        id: 'quad-development',
        label: 'Quad development',
        attributeIds: ['quadSize', 'quadSweep', 'innerThighThickness', 'hipWidth'],
      },
    ],
  },
  {
    id: 'hamstrings',
    label: 'Hamstrings',
    shortLabel: 'HAMS',
    previewRegion: 'lower-body',
    groups: [
      {
        id: 'hamstring-development',
        label: 'Posterior development',
        attributeIds: ['hamstringSize', 'hamstringDrop', 'gluteSize', 'gluteFullness'],
      },
    ],
  },
  {
    id: 'calves',
    label: 'Calves',
    shortLabel: 'CALVES',
    previewRegion: 'lower-body',
    groups: [
      {
        id: 'calf-development',
        label: 'Calf development',
        attributeIds: ['calfSize', 'calfWidth', 'calfHeight', 'ankleThickness'],
      },
    ],
  },
  {
    id: 'hands-feet',
    label: 'Hands & Feet',
    shortLabel: 'ENDS',
    previewRegion: undefined,
    groups: [
      {
        id: 'hands-feet-scale',
        label: 'Hands and feet',
        attributeIds: ['handSize', 'footSize', 'ankleThickness', 'forearmThickness'],
      },
    ],
  },
];

export const TRAINER_STUDIO_SECTIONS: ReadonlyArray<{
  id: TrainerStudioSection;
  label: string;
}> = [
  { id: 'build', label: 'Build' },
  { id: 'face', label: 'Face' },
  { id: 'hair', label: 'Hair' },
  { id: 'outfit', label: 'Outfit' },
  { id: 'colors', label: 'Colors' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'poses', label: 'Poses' },
  { id: 'gameplay', label: 'Gameplay' },
];

export function getBodyRegion(regionId: TrainerBodyRegionId) {
  return TRAINER_BODY_REGIONS.find((region) => region.id === regionId) ?? TRAINER_BODY_REGIONS[0]!;
}

export function getBodyControlGroup(regionId: TrainerBodyRegionId, groupId: string) {
  const region = getBodyRegion(regionId);
  return region.groups.find((group) => group.id === groupId) ?? region.groups[0]!;
}
