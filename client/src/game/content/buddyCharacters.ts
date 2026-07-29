import type {
  BuddyCharacterDesign,
  BuddyCosmetics,
  BuddyVisualOption,
} from '../types';

export const BUDDY_COSMETIC_VERSION = 1 as const;

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
];

export const BUDDY_ACCESSORY_OPTIONS: BuddyVisualOption[] = [
  { id: 'accessory-none', label: 'No Accessory' },
  { id: 'accessory-gloves', label: 'Grip Gloves' },
  { id: 'accessory-wraps', label: 'Wrist Wraps' },
  { id: 'accessory-belt', label: 'Training Belt' },
  { id: 'accessory-chain', label: 'Ceremonial Chain' },
  { id: 'accessory-headband', label: 'Focus Headband' },
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
  appendageLabel: string;
  appendageAltLabel: string;
  colors: [string, string, string];
  defaultPattern?: string;
  defaultAccessory?: string;
};

function createDesign(seed: DesignSeed): BuddyCharacterDesign {
  const appendageOptions = [
    { id: `${seed.speciesId}-appendage-classic`, label: seed.appendageLabel },
    { id: `${seed.speciesId}-appendage-trainer`, label: seed.appendageAltLabel },
  ];
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
  };
  return {
    id: `buddy-design-${seed.speciesId}`,
    speciesId: seed.speciesId,
    buildLabel: seed.buildLabel,
    trainingSpecialization: seed.specialization,
    silhouetteModuleId: seed.silhouetteModuleId,
    musclePlacement: seed.musclePlacement,
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
