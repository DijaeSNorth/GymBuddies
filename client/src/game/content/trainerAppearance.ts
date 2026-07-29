import type {
  TrainerAppearance,
  TrainerAppearanceOption,
  TrainerBuildAttribute,
  TrainerBuildAttributeId,
  TrainerColorOption,
  TrainerCosmeticBuild,
  TrainerPhysiquePreset,
} from '../types/trainer';

export const TRAINER_BUILD_MIN = 0;
export const TRAINER_BUILD_MAX = 10;
export const TRAINER_APPEARANCE_VERSION = 2 as const;
export const MAX_SAVED_APPEARANCE_PRESETS = 8;

export const TRAINER_BUILD_ATTRIBUTES: TrainerBuildAttribute[] = [
  { id: 'height', key: 'height', label: 'Height', detail: 'Changes the cosmetic vertical silhouette only.', minimumLabel: 'Compact', maximumLabel: 'Towering' },
  { id: 'bodyScale', key: 'bodyScale', label: 'Overall Scale', detail: 'Changes the overall frame while preserving a powerful silhouette.', minimumLabel: 'Trim frame', maximumLabel: 'Broad frame' },
  { id: 'headSize', key: 'headSize', label: 'Head Size', detail: 'Adjusts head proportions without changing gameplay.', minimumLabel: 'Small', maximumLabel: 'Large' },
  { id: 'neckThickness', key: 'neckThickness', label: 'Neck', detail: 'Sets the visual neck thickness beneath the head.', minimumLabel: 'Defined', maximumLabel: 'Thick' },
  { id: 'shoulderWidth', key: 'shoulderWidth', label: 'Shoulders', detail: 'Shapes the upper-body width in every facing direction.', minimumLabel: 'Athletic', maximumLabel: 'Extra wide' },
  { id: 'trapeziusSize', key: 'trapeziusSize', label: 'Trapezius', detail: 'Raises and thickens the upper-back silhouette.', minimumLabel: 'Defined', maximumLabel: 'High-set' },
  { id: 'chestSize', key: 'chestSize', label: 'Chest', detail: 'Changes torso depth and front-facing chest shape.', minimumLabel: 'Athletic', maximumLabel: 'Full' },
  { id: 'upperBackWidth', key: 'upperBackWidth', label: 'Upper Back', detail: 'Changes the back-facing taper and lat width.', minimumLabel: 'Tapered', maximumLabel: 'Wide' },
  { id: 'lowerBackThickness', key: 'lowerBackThickness', label: 'Lower Back', detail: 'Changes the visual thickness above the waist.', minimumLabel: 'Lean', maximumLabel: 'Solid' },
  { id: 'bicepsSize', key: 'bicepsSize', label: 'Biceps', detail: 'Changes the upper-arm curve in front and side views.', minimumLabel: 'Defined', maximumLabel: 'Massive' },
  { id: 'tricepsSize', key: 'tricepsSize', label: 'Triceps', detail: 'Changes the rear upper-arm shape.', minimumLabel: 'Defined', maximumLabel: 'Massive' },
  { id: 'forearmSize', key: 'forearmSize', label: 'Forearms', detail: 'Changes the lower-arm width and grip silhouette.', minimumLabel: 'Lean', maximumLabel: 'Thick' },
  { id: 'handSize', key: 'handSize', label: 'Hands', detail: 'Changes hand and glove proportions.', minimumLabel: 'Compact', maximumLabel: 'Large' },
  { id: 'coreDefinition', key: 'coreDefinition', label: 'Core Definition', detail: 'Adds cosmetic torso definition marks only.', minimumLabel: 'Smooth', maximumLabel: 'Etched' },
  { id: 'waistWidth', key: 'waistWidth', label: 'Waist', detail: 'Changes midsection width while keeping clothing aligned.', minimumLabel: 'Narrow', maximumLabel: 'Wide' },
  { id: 'gluteSize', key: 'gluteSize', label: 'Glutes', detail: 'Changes the rear and side hip silhouette.', minimumLabel: 'Athletic', maximumLabel: 'Powerful' },
  { id: 'quadSize', key: 'quadSize', label: 'Quads', detail: 'Changes front thigh width and stance.', minimumLabel: 'Defined', maximumLabel: 'Powerful' },
  { id: 'hamstringSize', key: 'hamstringSize', label: 'Hamstrings', detail: 'Changes rear and side thigh depth.', minimumLabel: 'Defined', maximumLabel: 'Powerful' },
  { id: 'calfSize', key: 'calfSize', label: 'Calves', detail: 'Changes lower-leg width above shoes.', minimumLabel: 'Defined', maximumLabel: 'Full' },
  { id: 'footSize', key: 'footSize', label: 'Feet', detail: 'Changes shoe length and stance width.', minimumLabel: 'Compact', maximumLabel: 'Large' },
  { id: 'muscleDefinition', key: 'muscleDefinition', label: 'Muscle Definition', detail: 'Controls cosmetic highlight and shadow marks.', minimumLabel: 'Soft shading', maximumLabel: 'Sharp shading' },
  { id: 'bodyMass', key: 'bodyMass', label: 'Body Mass', detail: 'Adds overall visual mass without changing trainer power.', minimumLabel: 'Lean muscular', maximumLabel: 'Heavyweight' },
];

const BALANCED_BUILD: TrainerCosmeticBuild = {
  height: 5,
  bodyScale: 5,
  headSize: 5,
  neckThickness: 6,
  shoulderWidth: 7,
  trapeziusSize: 6,
  chestSize: 7,
  upperBackWidth: 7,
  lowerBackThickness: 6,
  bicepsSize: 7,
  tricepsSize: 7,
  forearmSize: 6,
  handSize: 5,
  coreDefinition: 6,
  waistWidth: 5,
  gluteSize: 6,
  quadSize: 7,
  hamstringSize: 7,
  calfSize: 6,
  footSize: 5,
  muscleDefinition: 6,
  bodyMass: 7,
};

function buildWith(
  overrides: Partial<TrainerCosmeticBuild>,
): TrainerCosmeticBuild {
  return { ...BALANCED_BUILD, ...overrides };
}

export const TRAINER_PHYSIQUE_PRESETS: TrainerPhysiquePreset[] = [
  {
    id: 'balanced-athlete',
    label: 'Balanced Athlete',
    description: 'A broad-shouldered, evenly developed all-round silhouette.',
    build: buildWith({}),
  },
  {
    id: 'classic-bodybuilder',
    label: 'Classic Bodybuilder',
    description: 'Wide shoulders, a tight waist, and pronounced upper-body definition.',
    build: buildWith({ shoulderWidth: 9, chestSize: 9, upperBackWidth: 9, waistWidth: 3, bicepsSize: 9, tricepsSize: 9, coreDefinition: 9, muscleDefinition: 9 }),
  },
  {
    id: 'heavy-powerlifter',
    label: 'Heavy Powerlifter',
    description: 'A dense, grounded frame with a thick torso and powerful legs.',
    build: buildWith({ bodyScale: 8, neckThickness: 8, lowerBackThickness: 9, waistWidth: 8, gluteSize: 9, quadSize: 9, hamstringSize: 9, bodyMass: 10 }),
  },
  {
    id: 'strongman',
    label: 'Strongman',
    description: 'A towering heavyweight build with a high-set back and large hands.',
    build: buildWith({ height: 9, bodyScale: 9, neckThickness: 9, trapeziusSize: 10, chestSize: 9, upperBackWidth: 10, handSize: 9, bodyMass: 10 }),
  },
  {
    id: 'lean-fighter',
    label: 'Lean Fighter',
    description: 'Long, mobile proportions with crisp definition and compact mass.',
    build: buildWith({ height: 7, bodyScale: 3, shoulderWidth: 6, waistWidth: 3, quadSize: 6, calfSize: 7, coreDefinition: 10, muscleDefinition: 10, bodyMass: 3 }),
  },
  {
    id: 'compact-powerhouse',
    label: 'Compact Powerhouse',
    description: 'A shorter frame packed with thick arms, legs, and torso mass.',
    build: buildWith({ height: 1, bodyScale: 8, neckThickness: 8, bicepsSize: 9, tricepsSize: 9, forearmSize: 9, quadSize: 9, calfSize: 8, bodyMass: 9 }),
  },
  {
    id: 'lower-body-specialist',
    label: 'Lower-Body Specialist',
    description: 'A balanced torso over especially powerful hips, thighs, and calves.',
    build: buildWith({ bodyScale: 6, shoulderWidth: 5, chestSize: 5, gluteSize: 10, quadSize: 10, hamstringSize: 10, calfSize: 9, footSize: 7 }),
  },
  {
    id: 'upper-body-specialist',
    label: 'Upper-Body Specialist',
    description: 'A dramatic upper-body taper with substantial arms and back width.',
    build: buildWith({ shoulderWidth: 10, trapeziusSize: 9, chestSize: 10, upperBackWidth: 10, bicepsSize: 10, tricepsSize: 10, forearmSize: 8, waistWidth: 3 }),
  },
];

export const DEFAULT_TRAINER_PHYSIQUE_PRESET_ID = 'balanced-athlete';

function options(entries: Array<[string, string, string?]>): TrainerAppearanceOption[] {
  return entries.map(([id, label, description]) => ({ id, label, description }));
}

export const TRAINER_FACE_SHAPES = options([
  ['square-strong', 'Strong Square'],
  ['oval-athletic', 'Athletic Oval'],
  ['round-power', 'Power Round'],
  ['diamond-defined', 'Defined Diamond'],
  ['long-angular', 'Long Angular'],
  ['broad-soft', 'Broad Soft'],
]);
export const TRAINER_EYES = options([
  ['focused-round', 'Focused Round'],
  ['calm-wide', 'Calm Wide'],
  ['sharp-upturn', 'Sharp Upturn'],
  ['steady-downturn', 'Steady Downturn'],
  ['deep-set', 'Deep Set'],
  ['single-lid', 'Single Lid'],
  ['bright-arc', 'Bright Arc'],
  ['determined-narrow', 'Determined Narrow'],
]);
export const TRAINER_EYEBROWS = options([
  ['straight-bold', 'Straight Bold'],
  ['soft-arc', 'Soft Arc'],
  ['high-arc', 'High Arc'],
  ['angled-focus', 'Angled Focus'],
  ['short-thick', 'Short Thick'],
  ['fine-line', 'Fine Line'],
]);
export const TRAINER_NOSES = options([
  ['compact', 'Compact'],
  ['rounded', 'Rounded'],
  ['straight', 'Straight'],
  ['broad', 'Broad'],
  ['angular', 'Angular'],
  ['soft', 'Soft'],
]);
export const TRAINER_MOUTHS = options([
  ['steady', 'Steady'],
  ['small-smile', 'Small Smile'],
  ['wide-grin', 'Wide Grin'],
  ['determined', 'Determined'],
  ['soft-neutral', 'Soft Neutral'],
  ['bold-smirk', 'Bold Smirk'],
]);
export const TRAINER_EARS = options([
  ['close', 'Close Set'],
  ['rounded', 'Rounded'],
  ['angular', 'Angular'],
  ['prominent', 'Prominent'],
]);
export const TRAINER_FACIAL_HAIR = options([
  ['none', 'None'],
  ['stubble', 'Stubble'],
  ['goatee', 'Goatee'],
  ['short-boxed', 'Short Boxed'],
  ['full-beard', 'Full Beard'],
  ['mustache', 'Mustache'],
  ['chin-strap', 'Chin Strap'],
]);
export const TRAINER_SCARS = options([
  ['none', 'None'],
  ['brow-notch', 'Brow Notch'],
  ['cheek-line', 'Cheek Line'],
  ['double-cheek', 'Double Cheek'],
  ['chin-mark', 'Chin Mark'],
]);
export const TRAINER_FRECKLES = options([
  ['none', 'None'],
  ['light', 'Light'],
  ['nose-bridge', 'Nose Bridge'],
  ['full', 'Full'],
]);
export const TRAINER_TATTOOS = options([
  ['none', 'None'],
  ['arm-bands', 'Arm Bands'],
  ['shoulder-sun', 'Shoulder Sun'],
  ['geometric-sleeve', 'Geometric Sleeve'],
  ['back-chevron', 'Back Chevron'],
  ['leg-stripes', 'Leg Stripes'],
]);
export const TRAINER_FACE_PAINT = options([
  ['none', 'None'],
  ['under-eye-stripe', 'Under-Eye Stripe'],
  ['temple-bars', 'Temple Bars'],
  ['split-chevron', 'Split Chevron'],
  ['competition-dots', 'Competition Dots'],
]);
export const TRAINER_HAIR_STYLES = options([
  ['bald', 'Bald'],
  ['buzz', 'Buzz Cut'],
  ['close-crop', 'Close Crop'],
  ['fade-curl', 'Fade Curls'],
  ['coils-high', 'High Coils'],
  ['waves', 'Waves'],
  ['braids-back', 'Braids Back'],
  ['locs-tied', 'Tied Locs'],
  ['mohawk-soft', 'Soft Mohawk'],
  ['side-sweep', 'Side Sweep'],
  ['ponytail', 'Ponytail'],
  ['top-knot', 'Top Knot'],
]);
export const TRAINER_HAIR_LENGTHS = options([
  ['none', 'None'],
  ['short', 'Short'],
  ['medium', 'Medium'],
  ['long', 'Long'],
]);

export const TRAINER_TOPS = options([
  ['tee-panel', 'Panel Shirt'],
  ['tank-racer', 'Racer Tank'],
  ['hoodie-sleeveless', 'Sleeveless Hoodie'],
  ['hoodie-training', 'Training Hoodie'],
  ['compression-short', 'Compression Top'],
  ['compression-long', 'Long Compression Top'],
]);
export const TRAINER_BOTTOMS = options([
  ['shorts-split', 'Split Shorts'],
  ['shorts-training', 'Training Shorts'],
  ['joggers-taper', 'Tapered Joggers'],
  ['leggings-panel', 'Panel Leggings'],
]);
export const TRAINER_SHOES = options([
  ['trainer-low', 'Low Trainers'],
  ['trainer-high', 'High Trainers'],
  ['lifting-flat', 'Flat Lifters'],
  ['runner-light', 'Light Runners'],
  ['boot-strong', 'Strong Boots'],
  ['wrap-shoes', 'Wrap Shoes'],
]);
export const TRAINER_SOCKS = options([
  ['none', 'No Visible Socks'],
  ['ankle', 'Ankle'],
  ['crew', 'Crew'],
  ['knee', 'Knee High'],
]);
export const TRAINER_GLOVES = options([
  ['none', 'None'],
  ['fingerless', 'Fingerless'],
  ['full-grip', 'Full Grip'],
  ['padded', 'Padded'],
  ['taped', 'Taped Hands'],
]);
export const TRAINER_WRIST_WRAPS = options([
  ['none', 'None'],
  ['single', 'Single Wrap'],
  ['double', 'Double Wrap'],
  ['long', 'Long Wrap'],
]);
export const TRAINER_ELBOW_SLEEVES = options([
  ['none', 'None'],
  ['short', 'Short Sleeve'],
  ['reinforced', 'Reinforced'],
]);
export const TRAINER_KNEE_SLEEVES = options([
  ['none', 'None'],
  ['short', 'Short Sleeve'],
  ['reinforced', 'Reinforced'],
]);
export const TRAINER_HEADWEAR = options([
  ['none', 'None'],
  ['headband', 'Headband'],
  ['wide-headband', 'Wide Headband'],
  ['cap-forward', 'Training Cap'],
  ['beanie', 'Gym Beanie'],
]);
export const TRAINER_BELTS = options([
  ['none', 'None'],
  ['slim', 'Slim Belt'],
  ['lifting-wide', 'Wide Lifting Belt'],
  ['champion-sash', 'Champion Sash'],
]);
export const TRAINER_GYM_BAGS = options([
  ['none', 'None'],
  ['duffel-small', 'Compact Duffel'],
  ['duffel-large', 'Heavy Duffel'],
  ['sling-pack', 'Sling Pack'],
]);
export const TRAINER_JEWELRY = options([
  ['none', 'None'],
  ['studs', 'Studs'],
  ['small-hoops', 'Small Hoops'],
  ['chain-short', 'Short Chain'],
  ['bracelet', 'Bracelet'],
]);
export const TRAINER_FANTASY_ACCESSORIES = options([
  ['none', 'None'],
  ['cape-short', 'Short Victory Cape'],
  ['cape-banner', 'Banner Cape'],
  ['aura-ribbon', 'Aura Ribbon'],
  ['shoulder-mantle', 'Champion Mantle'],
]);

export const TRAINER_SKIN_TONES: TrainerColorOption[] = [
  { id: 'porcelain-warm', label: 'Porcelain Warm', hex: '#f3d7c3' },
  { id: 'ivory-neutral', label: 'Ivory Neutral', hex: '#eac7ae' },
  { id: 'sand-gold', label: 'Sand Gold', hex: '#ddb28c' },
  { id: 'honey-warm', label: 'Honey Warm', hex: '#cf966a' },
  { id: 'amber-neutral', label: 'Amber Neutral', hex: '#bd7d57' },
  { id: 'copper-rich', label: 'Copper Rich', hex: '#aa6849' },
  { id: 'umber-warm', label: 'Umber Warm', hex: '#92543d' },
  { id: 'mahogany-neutral', label: 'Mahogany Neutral', hex: '#783f31' },
  { id: 'espresso-cool', label: 'Espresso Cool', hex: '#603127' },
  { id: 'deep-ebony', label: 'Deep Ebony', hex: '#47231e' },
  { id: 'rose-brown', label: 'Rose Brown', hex: '#9d665b' },
  { id: 'olive-gold', label: 'Olive Gold', hex: '#b18b62' },
];

export const TRAINER_COLOR_OPTIONS: TrainerColorOption[] = [
  { id: 'ink', label: 'Ink', hex: '#17262b' },
  { id: 'chalk', label: 'Chalk', hex: '#eef2d0' },
  { id: 'mint', label: 'Mint', hex: '#68d39b' },
  { id: 'coral', label: 'Coral', hex: '#ef765f' },
  { id: 'amber', label: 'Amber', hex: '#f2c14e' },
  { id: 'ocean', label: 'Ocean', hex: '#3787c8' },
  { id: 'sky', label: 'Sky', hex: '#79c6e8' },
  { id: 'plum', label: 'Plum', hex: '#80558f' },
  { id: 'orchid', label: 'Orchid', hex: '#c38ad4' },
  { id: 'brick', label: 'Brick', hex: '#a84646' },
  { id: 'moss', label: 'Moss', hex: '#5c7842' },
  { id: 'teal', label: 'Teal', hex: '#287b78' },
  { id: 'navy', label: 'Navy', hex: '#263d63' },
  { id: 'copper', label: 'Copper', hex: '#b66a3c' },
  { id: 'rose', label: 'Rose', hex: '#d56f91' },
  { id: 'silver', label: 'Silver', hex: '#9eabb0' },
  { id: 'gold', label: 'Gold', hex: '#d7a72f' },
  { id: 'violet', label: 'Violet', hex: '#5e4bb2' },
];

export const TRAINER_APPEARANCE_OPTION_GROUPS = {
  faceShapes: TRAINER_FACE_SHAPES,
  eyes: TRAINER_EYES,
  eyebrows: TRAINER_EYEBROWS,
  noses: TRAINER_NOSES,
  mouths: TRAINER_MOUTHS,
  ears: TRAINER_EARS,
  facialHair: TRAINER_FACIAL_HAIR,
  scars: TRAINER_SCARS,
  freckles: TRAINER_FRECKLES,
  tattoos: TRAINER_TATTOOS,
  facePaint: TRAINER_FACE_PAINT,
  hairStyles: TRAINER_HAIR_STYLES,
  hairLengths: TRAINER_HAIR_LENGTHS,
  tops: TRAINER_TOPS,
  bottoms: TRAINER_BOTTOMS,
  shoes: TRAINER_SHOES,
  socks: TRAINER_SOCKS,
  gloves: TRAINER_GLOVES,
  wristWraps: TRAINER_WRIST_WRAPS,
  elbowSleeves: TRAINER_ELBOW_SLEEVES,
  kneeSleeves: TRAINER_KNEE_SLEEVES,
  headwear: TRAINER_HEADWEAR,
  belts: TRAINER_BELTS,
  gymBags: TRAINER_GYM_BAGS,
  jewelry: TRAINER_JEWELRY,
  fantasy: TRAINER_FANTASY_ACCESSORIES,
} as const;

export const DEFAULT_TRAINER_APPEARANCE: TrainerAppearance = {
  version: TRAINER_APPEARANCE_VERSION,
  build: { ...BALANCED_BUILD },
  face: {
    shapeId: 'square-strong',
    eyesId: 'focused-round',
    eyebrowsId: 'straight-bold',
    noseId: 'straight',
    mouthId: 'small-smile',
    earsId: 'rounded',
    facialHairId: 'none',
    scarId: 'none',
    frecklesId: 'none',
    tattooId: 'none',
    facePaintId: 'none',
  },
  hair: {
    styleId: 'close-crop',
    lengthId: 'short',
    colorId: 'ink',
    highlightColorId: 'copper',
  },
  outfit: {
    topId: 'tank-racer',
    bottomsId: 'shorts-training',
    shoesId: 'trainer-low',
    socksId: 'ankle',
    glovesId: 'fingerless',
    wristWrapsId: 'single',
    elbowSleevesId: 'none',
    kneeSleevesId: 'none',
  },
  colors: {
    skinToneId: 'honey-warm',
    topPrimaryId: 'ocean',
    topSecondaryId: 'navy',
    topAccentId: 'amber',
    bottomPrimaryId: 'ink',
    bottomSecondaryId: 'teal',
    shoePrimaryId: 'chalk',
    shoeAccentId: 'coral',
    accessoryPrimaryId: 'amber',
    accessoryAccentId: 'mint',
  },
  accessories: {
    headwearId: 'none',
    beltId: 'slim',
    gymBagId: 'none',
    jewelryId: 'none',
    fantasyId: 'none',
  },
};

export function cloneTrainerAppearance(
  appearance: TrainerAppearance,
): TrainerAppearance {
  return {
    ...appearance,
    build: { ...appearance.build },
    face: { ...appearance.face },
    hair: { ...appearance.hair },
    outfit: { ...appearance.outfit },
    colors: { ...appearance.colors },
    accessories: { ...appearance.accessories },
  };
}

export function getTrainerPhysiquePresetById(id: string) {
  const preset = TRAINER_PHYSIQUE_PRESETS.find((entry) => entry.id === id);
  if (!preset) throw new Error(`Unknown trainer physique preset "${id}".`);
  return preset;
}

export function getTrainerColorHex(id: string, fallbackId = 'ink') {
  return (
    TRAINER_COLOR_OPTIONS.find((entry) => entry.id === id) ??
    TRAINER_COLOR_OPTIONS.find((entry) => entry.id === fallbackId) ??
    TRAINER_COLOR_OPTIONS[0]!
  ).hex;
}

export function getTrainerSkinToneHex(id: string) {
  return (
    TRAINER_SKIN_TONES.find((entry) => entry.id === id) ??
    TRAINER_SKIN_TONES.find((entry) => entry.id === DEFAULT_TRAINER_APPEARANCE.colors.skinToneId) ??
    TRAINER_SKIN_TONES[0]!
  ).hex;
}

function colorDistance(left: string, right: string) {
  const rgb = (hex: string) => {
    const value = Number.parseInt(hex.replace('#', ''), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255] as const;
  };
  const [lr, lg, lb] = rgb(left);
  const [rr, rg, rb] = rgb(right);
  return (lr - rr) ** 2 + (lg - rg) ** 2 + (lb - rb) ** 2;
}

export function closestTrainerColorId(
  hex: string,
  palette: readonly TrainerColorOption[] = TRAINER_COLOR_OPTIONS,
) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return palette[0]!.id;
  return [...palette].sort(
    (left, right) =>
      colorDistance(hex, left.hex) - colorDistance(hex, right.hex),
  )[0]!.id;
}

export function createLegacyTrainerAppearance(colors: {
  skin?: unknown;
  hair?: unknown;
  top?: unknown;
  shoes?: unknown;
  glove?: unknown;
}): TrainerAppearance {
  const next = cloneTrainerAppearance(DEFAULT_TRAINER_APPEARANCE);
  if (typeof colors.skin === 'string') {
    next.colors.skinToneId = closestTrainerColorId(colors.skin, TRAINER_SKIN_TONES);
  }
  if (typeof colors.hair === 'string') {
    next.hair.colorId = closestTrainerColorId(colors.hair);
  }
  if (typeof colors.top === 'string') {
    next.colors.topPrimaryId = closestTrainerColorId(colors.top);
  }
  if (typeof colors.shoes === 'string') {
    next.colors.shoePrimaryId = closestTrainerColorId(colors.shoes);
  }
  if (typeof colors.glove === 'string') {
    next.colors.accessoryPrimaryId = closestTrainerColorId(colors.glove);
  }
  return next;
}

export function trainerAppearanceLegacyPalette(appearance: TrainerAppearance) {
  return {
    skin: getTrainerSkinToneHex(appearance.colors.skinToneId),
    hair:
      appearance.hair.styleId === 'bald'
        ? getTrainerSkinToneHex(appearance.colors.skinToneId)
        : getTrainerColorHex(appearance.hair.colorId),
    top: getTrainerColorHex(appearance.colors.topPrimaryId, 'ocean'),
    shoes: getTrainerColorHex(appearance.colors.shoePrimaryId, 'chalk'),
    glove: getTrainerColorHex(appearance.colors.accessoryPrimaryId, 'amber'),
  };
}

export function trainerBuildKeys(): TrainerBuildAttributeId[] {
  return TRAINER_BUILD_ATTRIBUTES.map((attribute) => attribute.id);
}
