import type {
  BuddyAnatomyProfile,
  BuddyCharacterDesign,
  BuddyCosmetics,
  BuddyPhysiquePreset,
  BuddyPhysiqueRegion,
  BuddyPhysiqueSettings,
  BuddyVisualOption,
} from '../types';

export const BUDDY_COSMETIC_VERSION = 2 as const;

export const BUDDY_PALETTE_COLORS = [
  { id: 'bark', label: 'Bark', hex: '#9a6c4a' },
  { id: 'clay', label: 'Clay', hex: '#bc7154' },
  { id: 'sand', label: 'Sand', hex: '#dfc68b' },
  { id: 'moss', label: 'Moss', hex: '#55754d' },
  { id: 'fern', label: 'Fern', hex: '#78a56a' },
  { id: 'slate', label: 'Slate', hex: '#687985' },
  { id: 'iron', label: 'Iron', hex: '#354650' },
  { id: 'midnight', label: 'Midnight', hex: '#182733' },
  { id: 'tide', label: 'Tide', hex: '#397688' },
  { id: 'mint', label: 'Mint', hex: '#69c6ac' },
  { id: 'violet', label: 'Violet', hex: '#7567aa' },
  { id: 'plum', label: 'Plum', hex: '#503555' },
  { id: 'coral', label: 'Coral', hex: '#d46763' },
  { id: 'amber', label: 'Amber', hex: '#e5b95b' },
  { id: 'chalk', label: 'Chalk', hex: '#e8e3cb' },
  { id: 'glow', label: 'Glow', hex: '#a8e3ba' },
] as const;

export const BUDDY_BODY_SIZE_OPTIONS: BuddyVisualOption[] = [
  { id: 'compact', label: 'Compact' },
  { id: 'standard', label: 'Balanced' },
  { id: 'broad', label: 'Broad' },
];

export const BUDDY_DEFINITION_OPTIONS: BuddyVisualOption[] = [
  { id: 'smooth', label: 'Smooth Power' },
  { id: 'defined', label: 'Defined' },
  { id: 'etched', label: 'Etched' },
];

export const BUDDY_PATTERN_OPTIONS: BuddyVisualOption[] = [
  { id: 'pattern-none', label: 'Clean Coat' },
  { id: 'pattern-center-stripe', label: 'Center Stripe' },
  { id: 'pattern-shoulder-bands', label: 'Shoulder Bands' },
  { id: 'pattern-speckle', label: 'Training Speckles' },
  { id: 'pattern-training-scars', label: 'Training Marks' },
  { id: 'pattern-strength-lines', label: 'Strength Lines' },
];

export const BUDDY_ACCESSORY_OPTIONS: BuddyVisualOption[] = [
  { id: 'accessory-none', label: 'No Accessory' },
  { id: 'accessory-gloves', label: 'Grip Gloves', slot: 'hands' },
  { id: 'accessory-wraps', label: 'Training Wraps', slot: 'hands' },
  { id: 'accessory-elbow-sleeves', label: 'Joint Bands', slot: 'elbows' },
  { id: 'accessory-knee-sleeves', label: 'Stance Sleeves', slot: 'knees' },
  { id: 'accessory-belt', label: 'Training Belt', slot: 'waist' },
  { id: 'accessory-chain', label: 'Ceremonial Chain', slot: 'neck' },
  { id: 'accessory-headband', label: 'Focus Headband', slot: 'head' },
  {
    id: 'accessory-victory-medal',
    label: 'Victory Crest',
    slot: 'victory',
  },
  {
    id: 'accessory-champion-ribbon',
    label: 'Champion Ribbon',
    slot: 'victory',
  },
];

export const BUDDY_EMPHASIS_OPTIONS: BuddyVisualOption[] = [
  { id: 'restrained', label: 'Restrained' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'pronounced', label: 'Pronounced' },
];

export const BUDDY_MASS_OPTIONS: BuddyVisualOption[] = [
  { id: 'compact-density', label: 'Compact Density' },
  { id: 'balanced-mass', label: 'Balanced Mass' },
  { id: 'heavy-mass', label: 'Heavy Mass' },
];

export const BUDDY_SYMMETRY_OPTIONS: BuddyVisualOption[] = [
  { id: 'natural', label: 'Natural Balance' },
  { id: 'balanced', label: 'Even Balance' },
  { id: 'stage', label: 'Stage Symmetry' },
];

export const BUDDY_STANCE_OPTIONS: BuddyVisualOption[] = [
  { id: 'narrow', label: 'Narrow' },
  { id: 'athletic', label: 'Athletic' },
  { id: 'planted', label: 'Planted' },
  { id: 'wide', label: 'Wide' },
];

export const BUDDY_POSTURE_OPTIONS: BuddyVisualOption[] = [
  { id: 'coiled', label: 'Coiled' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'proud', label: 'Proud' },
  { id: 'towering', label: 'Towering' },
];

export const BUDDY_PUMP_OPTIONS: BuddyVisualOption[] = [
  { id: 'none', label: 'No Pump' },
  { id: 'warm', label: 'Warm Pump' },
  { id: 'full', label: 'Full Pump' },
];

export const BUDDY_POSE_OPTIONS: BuddyVisualOption[] = [
  { id: 'idle', label: 'Idle' },
  { id: 'walking', label: 'Walk' },
  { id: 'running', label: 'Run' },
  { id: 'front-flex', label: 'Front Flex' },
  { id: 'back-flex', label: 'Back Flex' },
  { id: 'side-pose', label: 'Side Pose' },
  { id: 'victory', label: 'Victory Pose' },
  { id: 'training', label: 'Training Pose' },
  { id: 'capture', label: 'Capture Stance' },
  { id: 'fatigue', label: 'Fatigue Stance' },
  { id: 'boss-entrance', label: 'Boss Entrance' },
  { id: 'rare-entrance', label: 'Rare Encounter Entrance' },
];

export const BUDDY_EXPRESSION_OPTIONS: BuddyVisualOption[] = [
  { id: 'steady', label: 'Steady' },
  { id: 'cheerful', label: 'Cheerful' },
  { id: 'focused', label: 'Focused' },
  { id: 'fierce', label: 'Fierce' },
  { id: 'sleepy', label: 'Rested' },
  { id: 'playful', label: 'Playful' },
];

export const BUDDY_VICTORY_POSE_OPTIONS: BuddyVisualOption[] = [
  { id: 'victory-flex', label: 'Double Flex' },
  { id: 'victory-grounded', label: 'Grounded Salute' },
  { id: 'victory-spring', label: 'Spring Step' },
];

export const BUDDY_ENTRANCE_OPTIONS: BuddyVisualOption[] = [
  { id: 'entrance-stride', label: 'Power Stride' },
  { id: 'entrance-brace', label: 'Brace and Set' },
  { id: 'entrance-spin', label: 'Quick Turn' },
];

export const BUDDY_RARE_TRAIT_OPTIONS: BuddyVisualOption[] = [
  { id: 'rare-none', label: 'Standard Trait' },
  { id: 'rare-glow-lines', label: 'Glow Lines' },
  { id: 'rare-metallic-tip', label: 'Metallic Tips' },
  { id: 'rare-star-mark', label: 'Summit Star' },
];

type DesignSeed = {
  speciesId: string;
  buildLabel: string;
  specialization: string;
  silhouetteModuleId: string;
  musclePlacement: BuddyCharacterDesign['musclePlacement'];
  renderFamily: BuddyAnatomyProfile['renderFamily'];
  regionLabels?: Partial<Record<BuddyPhysiqueRegion, string>>;
  protectedFeatures: string[];
  specialtyPreset: string;
  secondaryPlacement?: BuddyPhysiqueRegion;
  appendageLabel: string;
  appendageAltLabel: string;
  colors: [string, string, string];
  defaultPattern?: string;
  defaultAccessory?: string;
};

const DEFAULT_REGION_LABELS: Record<BuddyPhysiqueRegion, string> = {
  shoulders: 'Shoulder structure',
  chest: 'Front-body power',
  back: 'Back span',
  arms: 'Working limbs',
  core: 'Center-body density',
  legs: 'Driving limbs',
};

function physique(
  overrides: Partial<BuddyPhysiqueSettings> = {},
): BuddyPhysiqueSettings {
  return {
    shoulderEmphasisId: 'balanced',
    chestEmphasisId: 'balanced',
    backEmphasisId: 'balanced',
    armEmphasisId: 'balanced',
    coreEmphasisId: 'balanced',
    legEmphasisId: 'balanced',
    overallMassId: 'balanced-mass',
    symmetryId: 'balanced',
    stanceId: 'athletic',
    postureId: 'neutral',
    pumpEffectId: 'warm',
    ...overrides,
  };
}

function emphasizedSettings(
  primary: BuddyPhysiqueRegion,
  secondary: BuddyPhysiqueRegion,
) {
  const settings = physique({
    symmetryId: 'stage',
    postureId: 'proud',
    pumpEffectId: 'full',
  });
  const fieldByRegion = {
    shoulders: 'shoulderEmphasisId',
    chest: 'chestEmphasisId',
    back: 'backEmphasisId',
    arms: 'armEmphasisId',
    core: 'coreEmphasisId',
    legs: 'legEmphasisId',
  } as const;
  settings[fieldByRegion[primary]] = 'pronounced';
  settings[fieldByRegion[secondary]] = 'pronounced';
  return settings;
}

function createPhysiquePresets(seed: DesignSeed): BuddyPhysiquePreset[] {
  const primary = seed.musclePlacement === 'forearms'
    ? 'arms'
    : seed.musclePlacement;
  const secondary = seed.secondaryPlacement ?? (
    primary === 'legs' ? 'core' : primary === 'core' ? 'back' : 'legs'
  );
  return [
    {
      id: `${seed.speciesId}-physique-compact`,
      label: 'Compact',
      description: `Dense ${seed.regionLabels?.[primary] ?? DEFAULT_REGION_LABELS[primary]} with the protected species outline intact.`,
      bodySizeId: 'compact',
      muscleDefinitionId: 'defined',
      physique: physique({
        overallMassId: 'compact-density',
        stanceId: 'planted',
      }),
    },
    {
      id: `${seed.speciesId}-physique-balanced`,
      label: 'Balanced',
      description: 'Even development across every species-safe strength feature.',
      bodySizeId: 'standard',
      muscleDefinitionId: 'defined',
      physique: physique(),
    },
    {
      id: `${seed.speciesId}-physique-broad`,
      label: 'Broad',
      description: 'A wider, heavier presentation without obscuring signature anatomy.',
      bodySizeId: 'broad',
      muscleDefinitionId: 'smooth',
      physique: physique({
        overallMassId: 'heavy-mass',
        stanceId: 'wide',
        postureId: 'proud',
      }),
    },
    {
      id: `${seed.speciesId}-physique-specialized`,
      label: 'Specialized',
      description: `Prioritizes ${seed.regionLabels?.[primary] ?? DEFAULT_REGION_LABELS[primary]} and ${seed.regionLabels?.[secondary] ?? DEFAULT_REGION_LABELS[secondary]}.`,
      bodySizeId: 'standard',
      muscleDefinitionId: 'etched',
      physique: emphasizedSettings(primary, secondary),
    },
    {
      id: `${seed.speciesId}-physique-${seed.specialtyPreset.toLowerCase().replaceAll(' ', '-')}`,
      label: seed.specialtyPreset,
      description: `${seed.specialization}; tuned to this species' own anatomy.`,
      bodySizeId: primary === 'legs' ? 'compact' : 'broad',
      muscleDefinitionId: 'etched',
      physique: {
        ...emphasizedSettings(primary, secondary),
        overallMassId: primary === 'legs' ? 'compact-density' : 'heavy-mass',
        stanceId: primary === 'legs' ? 'athletic' : 'planted',
      },
    },
  ];
}

function createDesign(seed: DesignSeed): BuddyCharacterDesign {
  const appendageOptions = [
    { id: `${seed.speciesId}-appendage-classic`, label: seed.appendageLabel },
    { id: `${seed.speciesId}-appendage-trainer`, label: seed.appendageAltLabel },
  ];
  const physiquePresets = createPhysiquePresets(seed);
  const defaultCosmetics: BuddyCosmetics = {
    version: BUDDY_COSMETIC_VERSION,
    primaryPaletteId: seed.colors[0],
    secondaryPaletteId: seed.colors[1],
    accentPaletteId: seed.colors[2],
    patternId: seed.defaultPattern ?? 'pattern-none',
    muscleDefinitionId: 'defined',
    bodySizeId: 'standard',
    appendageVariantId: appendageOptions[0].id,
    accessoryIds: [seed.defaultAccessory ?? 'accessory-none'],
    rareTraitId: 'rare-none',
    expressionId: 'steady',
    victoryPoseId: 'victory-flex',
    entranceAnimationId: 'entrance-stride',
    physiquePresetId: physiquePresets[1]!.id,
    physique: { ...physiquePresets[1]!.physique },
  };
  return {
    id: `buddy-design-${seed.speciesId}`,
    speciesId: seed.speciesId,
    buildLabel: seed.buildLabel,
    trainingSpecialization: seed.specialization,
    silhouetteModuleId: seed.silhouetteModuleId,
    musclePlacement: seed.musclePlacement,
    anatomyProfile: {
      id: `anatomy-${seed.speciesId}`,
      renderFamily: seed.renderFamily,
      regionLabels: {
        ...DEFAULT_REGION_LABELS,
        ...seed.regionLabels,
      },
      protectedFeatures: [...seed.protectedFeatures],
    },
    physiquePresets,
    bodyVariations: BUDDY_BODY_SIZE_OPTIONS,
    patternOptions: BUDDY_PATTERN_OPTIONS,
    appendageOptions,
    accessoryOptions: BUDDY_ACCESSORY_OPTIONS,
    rareTraitOptions: BUDDY_RARE_TRAIT_OPTIONS,
    expressionOptions: BUDDY_EXPRESSION_OPTIONS,
    victoryPoseOptions: BUDDY_VICTORY_POSE_OPTIONS,
    entranceAnimationOptions: BUDDY_ENTRANCE_OPTIONS,
    defaultCosmetics,
  };
}

export const BUDDY_CHARACTER_DESIGNS: BuddyCharacterDesign[] = [
  createDesign({
    speciesId: 'brawny-bear',
    buildLabel: 'Compact woodland strongman',
    specialization: 'Loaded carries and recovery bracing',
    silhouetteModuleId: 'silhouette-square-bear',
    musclePlacement: 'forearms',
    renderFamily: 'quadruped',
    regionLabels: {
      shoulders: 'Shoulder shelf',
      chest: 'Upper-body thickness',
      arms: 'Paw and forelimb density',
    },
    protectedFeatures: ['round ears', 'square muzzle', 'bear paw stance'],
    specialtyPreset: 'Grappler',
    secondaryPlacement: 'shoulders',
    appendageLabel: 'Round Ears',
    appendageAltLabel: 'Notched Ears',
    colors: ['bark', 'moss', 'sand'],
    defaultAccessory: 'accessory-wraps',
  }),
  createDesign({
    speciesId: 'titan-tortoise',
    buildLabel: 'Heavyweight endurance anchor',
    specialization: 'Long isometric holds',
    silhouetteModuleId: 'silhouette-plated-tortoise',
    musclePlacement: 'back',
    renderFamily: 'shell',
    regionLabels: {
      chest: 'Front shell density',
      back: 'Shell arch',
      core: 'Plastron strength',
      arms: 'Limb density',
    },
    protectedFeatures: ['dome shell', 'low head', 'four grounded limbs'],
    specialtyPreset: 'Tank',
    secondaryPlacement: 'core',
    appendageLabel: 'Dome Shell',
    appendageAltLabel: 'Ridged Shell',
    colors: ['fern', 'moss', 'amber'],
    defaultPattern: 'pattern-center-stripe',
  }),
  createDesign({
    speciesId: 'iron-wolf',
    buildLabel: 'Lean technical puller',
    specialization: 'Grip switching and centerline control',
    silhouetteModuleId: 'silhouette-rivet-wolf',
    musclePlacement: 'back',
    renderFamily: 'quadruped',
    regionLabels: {
      shoulders: 'Running shoulders',
      back: 'Rivet back line',
      legs: 'Athletic haunches',
    },
    protectedFeatures: ['long muzzle', 'pointed ears', 'rivet tail'],
    specialtyPreset: 'Sprinter',
    secondaryPlacement: 'legs',
    appendageLabel: 'Straight Rivet Tail',
    appendageAltLabel: 'Forked Rivet Tail',
    colors: ['slate', 'iron', 'amber'],
    defaultAccessory: 'accessory-gloves',
  }),
  createDesign({
    speciesId: 'muscled-boar',
    buildLabel: 'Low-set powerlifter',
    specialization: 'Hip drive and explosive starts',
    silhouetteModuleId: 'silhouette-kettle-boar',
    musclePlacement: 'chest',
    renderFamily: 'quadruped',
    regionLabels: {
      chest: 'Kettle chest',
      core: 'Braced barrel',
      legs: 'Hip-drive legs',
    },
    protectedFeatures: ['tusks', 'low barrel', 'short planted legs'],
    specialtyPreset: 'Power Puller',
    secondaryPlacement: 'core',
    appendageLabel: 'Hooked Tusks',
    appendageAltLabel: 'Short Plate Tusks',
    colors: ['clay', 'bark', 'sand'],
    defaultAccessory: 'accessory-belt',
  }),
  createDesign({
    speciesId: 'ripped-rhino',
    buildLabel: 'Upper-body specialist',
    specialization: 'Straight-line pressing power',
    silhouetteModuleId: 'silhouette-rail-rhino',
    musclePlacement: 'shoulders',
    renderFamily: 'armored',
    regionLabels: {
      shoulders: 'Neck and shoulder armor',
      chest: 'Rail chest',
      legs: 'Planted pillar legs',
    },
    protectedFeatures: ['rail horn', 'armored neck', 'planted stance'],
    specialtyPreset: 'Tank',
    secondaryPlacement: 'chest',
    appendageLabel: 'Long Rail Horn',
    appendageAltLabel: 'Twin Rail Horns',
    colors: ['slate', 'iron', 'sand'],
    defaultPattern: 'pattern-shoulder-bands',
  }),
  createDesign({
    speciesId: 'boulder-bison',
    buildLabel: 'Broad strongman',
    specialization: 'Durable carries and pacing',
    silhouetteModuleId: 'silhouette-cairn-bison',
    musclePlacement: 'back',
    renderFamily: 'quadruped',
    regionLabels: {
      shoulders: 'Cairn hump',
      back: 'Carry back',
      legs: 'Anchor legs',
    },
    protectedFeatures: ['loop horns', 'high hump', 'heavy forequarters'],
    specialtyPreset: 'Power Puller',
    secondaryPlacement: 'shoulders',
    appendageLabel: 'Loop Horns',
    appendageAltLabel: 'Swept Horns',
    colors: ['bark', 'iron', 'sand'],
    defaultAccessory: 'accessory-chain',
  }),
  createDesign({
    speciesId: 'buff-otter',
    buildLabel: 'Mobility-focused swimmer',
    specialization: 'Fluid regrips and fast recovery',
    silhouetteModuleId: 'silhouette-ripple-otter',
    musclePlacement: 'core',
    renderFamily: 'runner',
    regionLabels: {
      shoulders: 'Swimming shoulders',
      core: 'Ripple midline',
      legs: 'Paddle-drive legs',
    },
    protectedFeatures: ['curl tail', 'streamlined head', 'long torso'],
    specialtyPreset: 'Endurance Frame',
    secondaryPlacement: 'shoulders',
    appendageLabel: 'Curl Tail',
    appendageAltLabel: 'Paddle Tail',
    colors: ['bark', 'tide', 'mint'],
    defaultPattern: 'pattern-center-stripe',
  }),
  createDesign({
    speciesId: 'titan-gorilla',
    buildLabel: 'Long-armed technique powerhouse',
    specialization: 'Leverage, bridges, and controlled turns',
    silhouetteModuleId: 'silhouette-bridge-gorilla',
    musclePlacement: 'forearms',
    renderFamily: 'primate',
    regionLabels: {
      shoulders: 'Bridge shoulders',
      back: 'Lever back',
      arms: 'Long leverage arms',
    },
    protectedFeatures: ['long arms', 'flat knuckles', 'high shoulder line'],
    specialtyPreset: 'Climber',
    secondaryPlacement: 'back',
    appendageLabel: 'Flat Knuckles',
    appendageAltLabel: 'Wrapped Knuckles',
    colors: ['bark', 'midnight', 'chalk'],
    defaultAccessory: 'accessory-wraps',
  }),
  createDesign({
    speciesId: 'loopstride',
    buildLabel: 'Lower-body spring specialist',
    specialization: 'Footwork loops and reactive jumps',
    silhouetteModuleId: 'silhouette-loop-runner',
    musclePlacement: 'legs',
    renderFamily: 'runner',
    regionLabels: {
      shoulders: 'Counterbalance shoulders',
      core: 'Spring center',
      legs: 'Loop-drive legs',
    },
    protectedFeatures: ['loop ears', 'spring legs', 'narrow torso'],
    specialtyPreset: 'Sprinter',
    secondaryPlacement: 'core',
    appendageLabel: 'Loop Ears',
    appendageAltLabel: 'Split Loop Ears',
    colors: ['sand', 'slate', 'mint'],
    defaultAccessory: 'accessory-headband',
  }),
  createDesign({
    speciesId: 'mendlume',
    buildLabel: 'Soft-mass recovery specialist',
    specialization: 'Cooldown breathing and restorative holds',
    silhouetteModuleId: 'silhouette-lantern-mender',
    musclePlacement: 'core',
    renderFamily: 'armored',
    regionLabels: {
      shoulders: 'Lantern mantle',
      core: 'Recovery glow chamber',
      legs: 'Rooted supports',
    },
    protectedFeatures: ['lantern crest', 'glow chamber', 'soft rooted feet'],
    specialtyPreset: 'Endurance Frame',
    secondaryPlacement: 'back',
    appendageLabel: 'Lantern Crest',
    appendageAltLabel: 'Twin Lantern Crest',
    colors: ['fern', 'moss', 'glow'],
    defaultPattern: 'pattern-speckle',
  }),
  createDesign({
    speciesId: 'cadenswoop',
    buildLabel: 'Lean endurance flyer',
    specialization: 'Cadence control and long intervals',
    silhouetteModuleId: 'silhouette-cadence-wing',
    musclePlacement: 'chest',
    renderFamily: 'winged',
    regionLabels: {
      shoulders: 'Wing roots',
      chest: 'Flight keel',
      arms: 'Wing-span strength',
    },
    protectedFeatures: ['long wings', 'flight keel', 'cadence tail'],
    specialtyPreset: 'Stage Champion',
    secondaryPlacement: 'shoulders',
    appendageLabel: 'Long Wings',
    appendageAltLabel: 'Split Training Wings',
    colors: ['slate', 'iron', 'amber'],
    defaultAccessory: 'accessory-headband',
  }),
  createDesign({
    speciesId: 'spotmole',
    buildLabel: 'Compact spotting powerhouse',
    specialization: 'Rescue timing and ground bracing',
    silhouetteModuleId: 'silhouette-spot-mole',
    musclePlacement: 'forearms',
    renderFamily: 'quadruped',
    regionLabels: {
      chest: 'Spotting chest',
      arms: 'Shovel-hand density',
      core: 'Ground brace',
    },
    protectedFeatures: ['shovel hands', 'low snout', 'compact digging stance'],
    specialtyPreset: 'Grappler',
    secondaryPlacement: 'core',
    appendageLabel: 'Shovel Hands',
    appendageAltLabel: 'Wide Spot Hands',
    colors: ['bark', 'plum', 'coral'],
    defaultAccessory: 'accessory-gloves',
  }),
  createDesign({
    speciesId: 'prismantle',
    buildLabel: 'Angular exotic technician',
    specialization: 'Facet reads and position changes',
    silhouetteModuleId: 'silhouette-prism-mantle',
    musclePlacement: 'shoulders',
    renderFamily: 'winged',
    regionLabels: {
      shoulders: 'Prism fin roots',
      back: 'Facet spread',
      arms: 'Mantle fins',
    },
    protectedFeatures: ['diamond center', 'prism fins', 'angular mantle'],
    specialtyPreset: 'Stage Champion',
    secondaryPlacement: 'back',
    appendageLabel: 'Diamond Fins',
    appendageAltLabel: 'Forked Prism Fins',
    colors: ['violet', 'plum', 'mint'],
    defaultPattern: 'pattern-shoulder-bands',
  }),
  createDesign({
    speciesId: 'vaultwyrm',
    buildLabel: 'Coiled exotic endurance anchor',
    specialization: 'Vaulted holds and shelter arcs',
    silhouetteModuleId: 'silhouette-vault-wyrm',
    musclePlacement: 'core',
    renderFamily: 'serpentine',
    regionLabels: {
      shoulders: 'Crest base',
      back: 'Vaulted spine',
      core: 'Coil density',
      legs: 'Tail drive',
    },
    protectedFeatures: ['vaulted coil', 'crest', 'clasp tail'],
    specialtyPreset: 'Tank',
    secondaryPlacement: 'back',
    appendageLabel: 'Clasp Tail',
    appendageAltLabel: 'Double-Clasp Tail',
    colors: ['moss', 'iron', 'glow'],
    defaultPattern: 'pattern-center-stripe',
  }),
  createDesign({
    speciesId: 'crownquill',
    buildLabel: 'Crowned exotic power athlete',
    specialization: 'Honor sets and foreleg drive',
    silhouetteModuleId: 'silhouette-crown-quill',
    musclePlacement: 'chest',
    renderFamily: 'armored',
    regionLabels: {
      shoulders: 'Crown roots',
      chest: 'Armored forebody',
      arms: 'Foreleg drive',
    },
    protectedFeatures: ['radial crown', 'quill armor', 'powerful forelegs'],
    specialtyPreset: 'Stage Champion',
    secondaryPlacement: 'shoulders',
    appendageLabel: 'Radial Crown',
    appendageAltLabel: 'Split Summit Crown',
    colors: ['coral', 'plum', 'amber'],
    defaultAccessory: 'accessory-belt',
  }),
  createDesign({
    speciesId: 'manyfold',
    buildLabel: 'Four-armed exotic recovery specialist',
    specialization: 'Alternating resets and spare-hand support',
    silhouetteModuleId: 'silhouette-many-fold',
    musclePlacement: 'shoulders',
    renderFamily: 'many-limbed',
    regionLabels: {
      shoulders: 'Four-arm hubs',
      back: 'Folded mantle',
      arms: 'Alternating arm pairs',
    },
    protectedFeatures: ['four arms', 'folded center', 'offset limb rhythm'],
    specialtyPreset: 'Power Puller',
    secondaryPlacement: 'arms',
    appendageLabel: 'Four Fold Arms',
    appendageAltLabel: 'Offset Fold Arms',
    colors: ['violet', 'iron', 'mint'],
    defaultPattern: 'pattern-speckle',
  }),
];

export const BUDDY_CHARACTER_DESIGN_BY_SPECIES_ID = new Map(
  BUDDY_CHARACTER_DESIGNS.map((design) => [design.speciesId, design]),
);

export function getBuddyCharacterDesign(speciesId: string) {
  const design = BUDDY_CHARACTER_DESIGN_BY_SPECIES_ID.get(speciesId);
  if (!design && speciesId.startsWith('legacy-')) {
    return BUDDY_CHARACTER_DESIGN_BY_SPECIES_ID.get('brawny-bear')!;
  }
  if (!design) {
    throw new Error(`Missing Buddy character design for species "${speciesId}".`);
  }
  return design;
}

export function getBuddyPaletteHex(id: string, fallback = '#e8e3cb') {
  return (
    BUDDY_PALETTE_COLORS.find((entry) => entry.id === id)?.hex ?? fallback
  );
}
