import {
  getTrainerColorHex,
  getTrainerSkinToneHex,
} from '../content/trainerAppearance';
import type {
  TrainerAppearance,
  TrainerFacingDirection,
  TrainerPose,
} from '../types';

export const TRAINER_PIXEL_WIDTH = 28;
export const TRAINER_PIXEL_HEIGHT = 36;

export const TRAINER_PIXEL_LAYERS = [
  'shadow',
  'legs',
  'torso',
  'arms',
  'head',
  'hair',
  'facial-details',
  'clothing',
  'shoes',
  'accessories',
  'equipment',
  'effects',
] as const;

export type TrainerPixelLayer = (typeof TRAINER_PIXEL_LAYERS)[number];

export type TrainerPixelRect = {
  color: string;
  height: number;
  layer: TrainerPixelLayer;
  width: number;
  x: number;
  y: number;
};

export type TrainerPixelFrame = {
  height: number;
  rects: readonly TrainerPixelRect[];
  width: number;
};

export type TrainerBodyMetrics = {
  shoulderSpan: number;
  trapeziusRise: number;
  chestSpan: number;
  upperBackSpan: number;
  lowerBackSpan: number;
  bicepsWidth: number;
  tricepsWidth: number;
  forearmWidth: number;
  coreDefinitionMarks: number;
  waistSpan: number;
  gluteSpan: number;
  quadWidth: number;
  hamstringWidth: number;
  calfWidth: number;
  bodyMassBand: number;
  muscleDefinitionMarks: number;
  shoulderRoundnessBand: number;
  frontDeltBand: number;
  rearDeltBand: number;
  upperChestBand: number;
  lowerChestBand: number;
  latFlareBand: number;
  midBackBand: number;
  trapeziusWidthBand: number;
  bicepsPeakBand: number;
  tricepsDefinitionMarks: number;
  forearmVascularMarks: number;
  obliqueMarks: number;
  serratusMarks: number;
  hipSpan: number;
  quadSweepBand: number;
  innerThighBand: number;
  hamstringDropBand: number;
  calfHeightBand: number;
  ankleWidth: number;
  bodyFatBand: number;
  muscleFullnessBand: number;
  pumpBand: number;
  postureBand: number;
  stanceBand: number;
  symmetryBand: number;
  vascularityMarks: number;
};

const FRAME_CACHE_LIMIT = 512;
const frameCache = new Map<string, TrainerPixelFrame>();
let cacheHits = 0;
let cacheMisses = 0;

function hexChannels(hex: string) {
  const parsed = Number.parseInt(hex.replace('#', ''), 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function blendColor(source: string, target: string, ratio: number) {
  const left = hexChannels(source);
  const right = hexChannels(target);
  const channel = (start: number, end: number) =>
    Math.max(0, Math.min(255, Math.round(start + (end - start) * ratio)));
  return `#${[
    channel(left.r, right.r),
    channel(left.g, right.g),
    channel(left.b, right.b),
  ]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;
}

function appearanceCacheKey(appearance: TrainerAppearance) {
  return JSON.stringify(appearance);
}

function tier(value: number, steps = 3) {
  return Math.min(steps, Math.max(0, Math.floor((value + 1) / (11 / (steps + 1)))));
}

export function getTrainerBodyMetrics(
  appearance: TrainerAppearance,
  direction: TrainerFacingDirection = 'front',
): TrainerBodyMetrics {
  const build = appearance.build;
  const side = direction === 'left' || direction === 'right';
  const mass = tier(build.bodyMass, 2);
  const bodyScale = tier(build.bodyScale, 2);
  const shoulders = tier(build.shoulderWidth, 3);
  const upperBack = tier(build.upperBackWidth, 3);
  const chest = tier(build.chestSize, 3);
  const lowerBack = tier(build.lowerBackThickness, 3);
  const waist = tier(build.waistWidth, 3);
  const glutes = tier(build.gluteSize, 3);
  const biceps = tier(build.bicepsSize, 3);
  const triceps = tier(build.tricepsSize, 3);
  const forearms = tier(build.forearmSize, 3);
  const quads = tier(build.quadSize, 3);
  const hamstrings = tier(build.hamstringSize, 3);
  const calves = tier(build.calfSize, 3);
  const clavicles = tier(build.clavicleWidth, 3);
  const sideDelts = tier(build.sideDeltSize, 3);
  const upperChest = tier(build.upperChestFullness, 3);
  const lowerChest = tier(build.lowerChestFullness, 3);
  const latWidth = tier(build.latWidth, 3);
  const latFlare = tier(build.latFlare, 3);
  const midBack = tier(build.midBackThickness, 3);
  const ribcage = tier(build.ribcageWidth, 3);
  const waistTaper = tier(build.waistTaper, 3);
  const midsection = tier(build.midsectionThickness, 3);
  const hipWidth = tier(build.hipWidth, 3);
  const gluteFullness = tier(build.gluteFullness, 3);
  const quadSweep = tier(build.quadSweep, 3);
  const innerThigh = tier(build.innerThighThickness, 3);
  const hamstringDrop = tier(build.hamstringDrop, 3);
  const calfWidth = tier(build.calfWidth, 3);
  const muscleFullness = tier(build.muscleFullness, 2);
  const pump = tier(build.pumpLevel, 2);
  const bodyFat = tier(build.bodyFatPresentation, 3);
  const shoulderDetails = Math.max(clavicles, sideDelts);
  const chestDetails = Math.max(upperChest, lowerChest);
  const backDetails = Math.max(latWidth, latFlare);
  const taperReduction = Math.min(2, waistTaper);

  return {
    shoulderSpan: side
      ? 6 + shoulders + Math.floor(Math.max(shoulderDetails, backDetails) / 2) + mass
      : 10 + shoulders * 2 + Math.floor(shoulderDetails / 2) + bodyScale + mass,
    trapeziusRise:
      1 +
      tier(build.trapeziusSize, 3) +
      Math.floor(tier(build.trapeziusHeight, 3) / 2),
    chestSpan: side
      ? 6 + chest + Math.floor(chestDetails / 2) + mass
      : 8 + chest * 2 + Math.floor(chestDetails / 2) + mass,
    upperBackSpan: side
      ? 6 + upperBack + Math.floor(backDetails / 2) + mass
      : 8 + upperBack * 2 + Math.floor(backDetails / 2) + mass,
    lowerBackSpan:
      7 +
      lowerBack +
      Math.floor((midBack + waist + ribcage + midsection) / 3) +
      mass,
    bicepsWidth:
      2 +
      biceps +
      Math.floor(
        Math.max(
          tier(build.bicepsPeak, 3),
          tier(build.bicepsThickness, 3),
        ) / 2,
      ) +
      Math.min(1, mass + pump),
    tricepsWidth:
      2 +
      triceps +
      Math.floor(tier(build.tricepsHorseshoeDefinition, 3) / 2) +
      Math.min(1, mass),
    forearmWidth:
      2 + forearms + Math.floor(tier(build.forearmThickness, 3) / 2),
    coreDefinitionMarks:
      1 +
      tier(build.coreDefinition, 3) +
      Math.floor(tier(build.abdominalDefinition, 3) / 2),
    waistSpan:
      6 +
      Math.max(0, waist * 2 + ribcage + midsection - taperReduction * 2) +
      Math.min(1, mass + bodyFat),
    gluteSpan:
      7 + glutes * 2 + Math.floor((gluteFullness + hipWidth) / 2) + mass,
    quadWidth:
      2 +
      quads +
      Math.floor(Math.max(quadSweep, innerThigh) / 2) +
      Math.min(1, mass + pump),
    hamstringWidth:
      2 +
      hamstrings +
      Math.floor(hamstringDrop / 2) +
      Math.min(1, mass + pump),
    calfWidth: 2 + calves + Math.floor(calfWidth / 2),
    bodyMassBand: Math.min(3, mass + Math.min(1, muscleFullness + pump)),
    muscleDefinitionMarks:
      1 +
      tier(build.muscleDefinition, 3) +
      Math.floor(tier(build.muscleSeparation, 3) / 2),
    shoulderRoundnessBand: tier(build.shoulderRoundness, 3),
    frontDeltBand: tier(build.frontDeltSize, 3),
    rearDeltBand: tier(build.rearDeltSize, 3),
    upperChestBand: upperChest,
    lowerChestBand: lowerChest,
    latFlareBand: latFlare,
    midBackBand: midBack,
    trapeziusWidthBand: tier(build.trapeziusWidth, 3),
    bicepsPeakBand: tier(build.bicepsPeak, 3),
    tricepsDefinitionMarks: tier(build.tricepsHorseshoeDefinition, 3),
    forearmVascularMarks: tier(build.forearmVascularDefinition, 3),
    obliqueMarks: tier(build.obliqueDefinition, 3),
    serratusMarks: tier(build.serratusDefinition, 3),
    hipSpan: 7 + hipWidth * 2 + gluteFullness,
    quadSweepBand: quadSweep,
    innerThighBand: innerThigh,
    hamstringDropBand: hamstringDrop,
    calfHeightBand: tier(build.calfHeight, 3),
    ankleWidth: 1 + tier(build.ankleThickness, 3),
    bodyFatBand: bodyFat,
    muscleFullnessBand: tier(build.muscleFullness, 3),
    pumpBand: pump,
    postureBand: tier(build.posture, 3),
    stanceBand: tier(build.stanceWidth, 3),
    symmetryBand: tier(build.symmetryPreference, 3),
    vascularityMarks: tier(build.vascularity, 3),
  };
}

function drawFrame(
  appearance: TrainerAppearance,
  direction: TrainerFacingDirection,
  pose: TrainerPose,
  animationFrame: number,
): TrainerPixelFrame {
  const rects: TrainerPixelRect[] = [];
  const add = (
    layer: TrainerPixelLayer,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
  ) => {
    const safeX = Math.max(0, Math.round(x));
    const safeY = Math.max(0, Math.round(y));
    const safeWidth = Math.min(
      TRAINER_PIXEL_WIDTH - safeX,
      Math.max(1, Math.round(width)),
    );
    const safeHeight = Math.min(
      TRAINER_PIXEL_HEIGHT - safeY,
      Math.max(1, Math.round(height)),
    );
    if (safeWidth <= 0 || safeHeight <= 0) return;
    rects.push({
      color,
      height: safeHeight,
      layer,
      width: safeWidth,
      x: safeX,
      y: safeY,
    });
  };

  const build = appearance.build;
  const center = Math.floor(TRAINER_PIXEL_WIDTH / 2);
  const isBack = direction === 'back';
  const isSide = direction === 'left' || direction === 'right';
  const metrics = getTrainerBodyMetrics(appearance, direction);
  const heightOffset = Math.round((build.height - 5) / 3);
  const bodyScaleTier = tier(build.bodyScale);
  const massTier = metrics.bodyMassBand;
  const headTier = tier(build.headSize, 2);
  const shoulderWidthTier = tier(build.shoulderWidth, 3);
  const clavicleTier = tier(build.clavicleWidth, 3);
  const bicepsSizeTier = tier(build.bicepsSize, 3);
  const bicepsThicknessTier = tier(build.bicepsThickness, 3);
  const tricepsSizeTier = tier(build.tricepsSize, 3);
  const forearmSizeTier = tier(build.forearmSize, 3);
  const quadSizeTier = tier(build.quadSize, 3);
  const hamstringSizeTier = tier(build.hamstringSize, 3);
  const calfSizeTier = tier(build.calfSize, 3);
  const hipWidthTier = tier(build.hipWidth, 3);
  const gluteFullnessTier = tier(build.gluteFullness, 3);
  const directCoreDefinitionTier = tier(build.coreDefinition, 3);
  const directMuscleDefinitionTier = tier(build.muscleDefinition, 3);
  const upperBackTier = Math.max(
    tier(build.upperBackWidth, 3),
    tier(build.latWidth, 3),
  );
  const chestTier = Math.max(
    tier(build.chestSize, 3),
    metrics.upperChestBand,
    metrics.lowerChestBand,
  );
  const lowerBackTier = Math.max(
    tier(build.lowerBackThickness, 3),
    metrics.midBackBand,
  );
  const trapTier = Math.max(
    tier(build.trapeziusSize, 3),
    metrics.trapeziusRise - 1,
  );
  const forearmTier = Math.max(
    tier(build.forearmSize, 3),
    tier(build.forearmThickness, 3),
  );
  const handTier = tier(build.handSize, 2);
  const quadTier = Math.max(tier(build.quadSize, 3), metrics.quadSweepBand);
  const hamstringTier = Math.max(
    tier(build.hamstringSize, 3),
    metrics.hamstringDropBand,
  );
  const gluteTier = Math.max(
    tier(build.gluteSize, 3),
    tier(build.gluteFullness, 3),
  );
  const calfTier = Math.max(tier(build.calfSize, 3), tier(build.calfWidth, 3));
  const footTier = tier(build.footSize, 2);
  const coreDefinitionTier = Math.max(
    tier(build.coreDefinition, 3),
    tier(build.abdominalDefinition, 3),
  );
  const muscleDefinitionTier = Math.max(
    tier(build.muscleDefinition, 3),
    tier(build.muscleSeparation, 3),
  );

  const poseBob =
    pose === 'walking' ||
    pose === 'running' ||
    pose === 'confident-walk'
      ? animationFrame % 2
      : pose === 'fatigue' || pose === 'fatigued-stance'
        ? 2
        : 0;
  const topY =
    4 -
    heightOffset +
    poseBob -
    Math.max(0, Math.floor((metrics.postureBand - 1) / 2));
  const headWidth = 5 + headTier;
  const headHeight =
    appearance.face.shapeId === 'long-angular'
      ? 7
      : appearance.face.shapeId === 'round-power'
        ? 5
        : 6;
  const headX = center - Math.floor(headWidth / 2);
  const headY = topY;
  const neckWidth = 2 + tier(build.neckThickness, 3);
  const neckX = center - Math.floor(neckWidth / 2);
  const neckY = headY + headHeight - 1;
  const torsoTop = neckY + 2;
  const shoulderHalf = isSide
    ? Math.min(5, Math.max(3, Math.floor(metrics.shoulderSpan / 2)))
    : Math.min(9, Math.max(5, Math.floor(metrics.shoulderSpan / 2)));
  const torsoBottom = 22 + heightOffset + Math.min(1, bodyScaleTier);
  const waistHalf = Math.min(
    isSide ? 5 : 7,
    Math.max(3, Math.floor(metrics.waistSpan / 2)),
  );
  const upperSpan = isBack ? metrics.upperBackSpan : metrics.chestSpan;
  const torsoHalf = Math.max(
    waistHalf,
    Math.min(isSide ? 5 : 8, Math.floor(upperSpan / 2)),
  );
  const lowerTorsoHalf = Math.min(
    isSide ? 5 : 7,
    Math.max(waistHalf, Math.floor(metrics.lowerBackSpan / 2)),
  );
  const hipHalf = Math.min(
    isSide ? 6 : 8,
    Math.max(
      waistHalf,
      Math.floor(Math.max(metrics.gluteSpan, metrics.hipSpan) / 2),
    ),
  );
  const shoulderX = center - shoulderHalf;
  const shoulderWidth = shoulderHalf * 2;
  const torsoX = center - torsoHalf;
  const torsoWidth = torsoHalf * 2;
  const lowerTorsoX = center - lowerTorsoHalf;
  const lowerTorsoWidth = lowerTorsoHalf * 2;
  const waistX = center - waistHalf;
  const waistWidth = waistHalf * 2;
  const hipY = torsoBottom - 2;
  const legTop = hipY;
  const ankleY = 32 + heightOffset;
  const legHeight = Math.max(6, ankleY - legTop);
  const thighWidth = Math.min(
    6,
    (isBack
      ? metrics.hamstringWidth
      : isSide
        ? Math.max(metrics.quadWidth, metrics.hamstringWidth)
        : metrics.quadWidth) +
      Math.floor((metrics.muscleFullnessBand + metrics.pumpBand) / 4),
  );
  const calfWidth = Math.min(5, metrics.calfWidth);
  const stance = Math.max(
    2,
    Math.min(6, hipHalf - 1 + metrics.stanceBand - 1),
  );
  const walkStride =
    pose === 'running'
      ? animationFrame % 2 === 0
        ? 2
        : -2
      : pose === 'walking' || pose === 'confident-walk'
        ? animationFrame % 2 === 0
          ? 1
          : -1
        : pose === 'abs-and-thigh'
          ? 1
        : 0;
  const leftLegX = center - stance - Math.floor(thighWidth / 2) + walkStride;
  const asymmetryOffset = metrics.symmetryBand <= 1 ? 1 : 0;
  const rightLegX =
    center +
    stance -
    Math.ceil(thighWidth / 2) -
    walkStride +
    asymmetryOffset;

  const skin = getTrainerSkinToneHex(appearance.colors.skinToneId);
  const skinShadow = blendColor(
    skin,
    '#17262b',
    Math.max(0.14, 0.3 - metrics.bodyFatBand * 0.04),
  );
  const skinHighlight = blendColor(
    skin,
    '#ffffff',
    Math.max(0.08, 0.22 - metrics.bodyFatBand * 0.03),
  );
  const outline = '#101c21';
  const hair = getTrainerColorHex(appearance.hair.colorId);
  const hairHighlight = getTrainerColorHex(appearance.hair.highlightColorId);
  const topPrimary = getTrainerColorHex(appearance.colors.topPrimaryId, 'ocean');
  const topSecondary = getTrainerColorHex(appearance.colors.topSecondaryId, 'navy');
  const topAccent = getTrainerColorHex(appearance.colors.topAccentId, 'amber');
  const bottomPrimary = getTrainerColorHex(appearance.colors.bottomPrimaryId);
  const bottomSecondary = getTrainerColorHex(appearance.colors.bottomSecondaryId, 'teal');
  const shoePrimary = getTrainerColorHex(appearance.colors.shoePrimaryId, 'chalk');
  const shoeAccent = getTrainerColorHex(appearance.colors.shoeAccentId, 'coral');
  const accessoryPrimary = getTrainerColorHex(
    appearance.colors.accessoryPrimaryId,
    'amber',
  );
  const accessoryAccent = getTrainerColorHex(
    appearance.colors.accessoryAccentId,
    'mint',
  );
  const trimColor = getTrainerColorHex(appearance.colors.trimColorId, 'amber');
  const logoColor = getTrainerColorHex(appearance.colors.logoColorId, 'chalk');

  // 1. Shadow
  const shadowWidth = 10 + bodyScaleTier * 2 + massTier;
  add('shadow', center - shadowWidth / 2, 34, shadowWidth, 1, '#061519');
  add('shadow', center - shadowWidth / 2 + 2, 33, shadowWidth - 4, 1, '#1d3537');

  // 2. Legs
  const thighHeight = Math.max(
    4,
    Math.ceil(legHeight * 0.58) - Math.max(0, metrics.calfHeightBand - 1),
  );
  const calfTop = legTop + thighHeight - 1;
  const calfHeight = Math.max(3, ankleY - calfTop);
  const leftCalfX = leftLegX + Math.floor((thighWidth - calfWidth) / 2);
  const rightCalfX = rightLegX + Math.ceil((thighWidth - calfWidth) / 2);
  if (isBack || isSide || gluteTier >= 2) {
    add('legs', center - hipHalf - 1, hipY - 1, hipHalf * 2 + 2, 4, outline);
    add('legs', center - hipHalf, hipY, hipHalf * 2, 3, skinShadow);
    if (isBack && gluteTier >= 2) {
      add('legs', center - 1, hipY, 1, 3, outline);
      add('legs', center + 2, hipY, 1, 2, skinHighlight);
    }
  }
  add('legs', leftLegX - 1, legTop, thighWidth + 2, thighHeight + 1, outline);
  add('legs', rightLegX - 1, legTop, thighWidth + 2, thighHeight + 1, outline);
  add('legs', leftLegX, legTop, thighWidth, thighHeight, skin);
  add('legs', rightLegX, legTop, thighWidth, thighHeight, skin);
  add('legs', leftCalfX - 1, calfTop, calfWidth + 2, calfHeight + 1, outline);
  add('legs', rightCalfX - 1, calfTop, calfWidth + 2, calfHeight + 1, outline);
  add('legs', leftCalfX, calfTop, calfWidth, calfHeight, skinShadow);
  add('legs', rightCalfX, calfTop, calfWidth, calfHeight, skinShadow);
  if (!isBack && metrics.quadSweepBand >= 2) {
    add('legs', leftLegX - 1, legTop + 2, 1, Math.max(2, thighHeight - 2), skin);
    add('legs', rightLegX + thighWidth, legTop + 2, 1, Math.max(2, thighHeight - 2), skin);
  }
  if (metrics.innerThighBand >= 2) {
    add('legs', leftLegX + thighWidth - 1, legTop + 3, 1, Math.max(2, thighHeight - 3), skinShadow);
    add('legs', rightLegX, legTop + 3, 1, Math.max(2, thighHeight - 3), skinShadow);
  }
  if ((isBack || isSide) && metrics.hamstringDropBand >= 2) {
    add('legs', leftLegX + 1, calfTop - 2, Math.max(1, thighWidth - 2), 2, skinShadow);
    add('legs', rightLegX + 1, calfTop - 2, Math.max(1, thighWidth - 2), 2, skinShadow);
  }
  if (metrics.ankleWidth >= 2) {
    const ankleWidth = Math.min(calfWidth, metrics.ankleWidth);
    add('legs', leftCalfX, ankleY - 1, ankleWidth, 2, skinShadow);
    add('legs', rightCalfX, ankleY - 1, ankleWidth, 2, skinShadow);
  }
  if (muscleDefinitionTier >= 2) {
    const legEmphasis = isBack ? hamstringTier : quadTier;
    if (legEmphasis >= 1) {
      add('legs', leftLegX + Math.max(0, thighWidth - 2), legTop + 2, 1, Math.max(2, thighHeight - 3), skinHighlight);
      add('legs', rightLegX + 1, legTop + 2, 1, Math.max(2, thighHeight - 3), skinHighlight);
    }
    if (calfTier >= 1) {
      add('legs', leftCalfX, calfTop + 1, 1, Math.max(1, calfHeight - 2), skinHighlight);
      add('legs', rightCalfX + calfWidth - 1, calfTop + 1, 1, Math.max(1, calfHeight - 2), skinHighlight);
    }
  }
  if (!isBack) {
    add(
      'legs',
      leftLegX,
      legTop + 1,
      1 + quadSizeTier,
      1,
      skinHighlight,
    );
    add(
      'legs',
      rightLegX + Math.max(0, thighWidth - 1 - quadSizeTier),
      legTop + 1,
      1 + quadSizeTier,
      1,
      skinHighlight,
    );
  } else {
    add(
      'legs',
      leftLegX,
      calfTop - 2,
      1 + hamstringSizeTier,
      1,
      skinHighlight,
    );
    add(
      'legs',
      rightLegX + Math.max(0, thighWidth - 1 - hamstringSizeTier),
      calfTop - 2,
      1 + hamstringSizeTier,
      1,
      skinHighlight,
    );
  }
  add(
    'legs',
    leftCalfX,
    calfTop + 1,
    1,
    Math.min(calfHeight - 1, 1 + calfSizeTier),
    skinHighlight,
  );
  add(
    'legs',
    rightCalfX + calfWidth - 1,
    calfTop + 1,
    1,
    Math.min(calfHeight - 1, 1 + calfSizeTier),
    skinHighlight,
  );
  if (hipWidthTier > 0 || gluteFullnessTier > 0) {
    const hipContour = Math.max(hipWidthTier, gluteFullnessTier);
    add(
      'legs',
      center - hipHalf - 1,
      hipY + Math.max(0, 3 - hipContour),
      1,
      hipContour,
      skinShadow,
    );
    add(
      'legs',
      center + hipHalf,
      hipY + Math.max(0, 3 - hipContour),
      1,
      hipContour,
      skinShadow,
    );
  }

  // 3. Torso
  add('torso', shoulderX - 1, torsoTop - 1, shoulderWidth + 2, 4, outline);
  add('torso', torsoX - 1, torsoTop + 2, torsoWidth + 2, 6, outline);
  add(
    'torso',
    lowerTorsoX - 1,
    torsoTop + 7,
    lowerTorsoWidth + 2,
    torsoBottom - torsoTop - 6,
    outline,
  );
  add('torso', shoulderX, torsoTop, shoulderWidth, 3, skin);
  add(
    'torso',
    shoulderX,
    torsoTop,
    Math.min(shoulderWidth, 1 + shoulderWidthTier * 2),
    1,
    skinHighlight,
  );
  add(
    'torso',
    center - 1 - clavicleTier,
    torsoTop + 1,
    2 + clavicleTier * 2,
    1,
    skinShadow,
  );
  const visibleDeltBand = isBack
    ? metrics.rearDeltBand
    : metrics.frontDeltBand;
  if (metrics.shoulderRoundnessBand >= 1 || visibleDeltBand >= 1) {
    const deltDepth = 1 + Math.min(2, Math.max(metrics.shoulderRoundnessBand, visibleDeltBand));
    add('torso', shoulderX - 1, torsoTop, deltDepth, 3, skinShadow);
    add(
      'torso',
      shoulderX + shoulderWidth - deltDepth + 1,
      torsoTop,
      deltDepth,
      3,
      skinShadow,
    );
  }
  const shoulderContourDepth = Math.max(
    metrics.shoulderRoundnessBand,
    tier(build.sideDeltSize, 3),
  );
  if (shoulderContourDepth > 0) {
    add(
      'torso',
      shoulderX - 1,
      torsoTop + 1,
      1,
      shoulderContourDepth,
      skin,
    );
    add(
      'torso',
      shoulderX + shoulderWidth,
      torsoTop + 1,
      1,
      shoulderContourDepth,
      skin,
    );
  }
  if (visibleDeltBand > 0) {
    add(
      'torso',
      shoulderX + 1,
      torsoTop + 1,
      visibleDeltBand,
      1,
      skinHighlight,
    );
    add(
      'torso',
      shoulderX + shoulderWidth - 1 - visibleDeltBand,
      torsoTop + 1,
      visibleDeltBand,
      1,
      skinHighlight,
    );
  }
  add('torso', torsoX, torsoTop + 2, torsoWidth, 5, skin);
  add(
    'torso',
    lowerTorsoX,
    torsoTop + 7,
    lowerTorsoWidth,
    torsoBottom - torsoTop - 7,
    skin,
  );
  add('torso', waistX, torsoBottom - 3, waistWidth, 3, skinShadow);
  const trapReach = Math.min(
    shoulderHalf - Math.ceil(neckWidth / 2),
    1 + Math.max(trapTier, metrics.trapeziusWidthBand),
  );
  if (trapReach > 0) {
    add('torso', neckX - trapReach, torsoTop - 2, trapReach + 1, 2 + Math.min(2, trapTier), outline);
    add('torso', neckX + neckWidth - 1, torsoTop - 2, trapReach + 1, 2 + Math.min(2, trapTier), outline);
    add('torso', neckX - trapReach + 1, torsoTop - 1, trapReach, 1 + Math.min(2, trapTier), skinShadow);
    add('torso', neckX + neckWidth - 1, torsoTop - 1, trapReach, 1 + Math.min(2, trapTier), skinShadow);
  }
  if (metrics.trapeziusWidthBand > 0) {
    add(
      'torso',
      center - metrics.trapeziusWidthBand - 1,
      torsoTop - 1,
      metrics.trapeziusWidthBand,
      1,
      skinHighlight,
    );
    add(
      'torso',
      center + 2,
      torsoTop - 1,
      metrics.trapeziusWidthBand,
      1,
      skinHighlight,
    );
  }
  if (!isBack && chestTier >= 1) {
    const upperChestY = torsoTop + 2 + Math.max(0, 2 - metrics.upperChestBand);
    const lowerChestY = torsoTop + 4 + Math.min(1, metrics.lowerChestBand);
    add('torso', center - Math.min(4, chestTier + 2), upperChestY, 3, 2, skinHighlight);
    add('torso', center + Math.min(2, chestTier), upperChestY, 3, 2, skinHighlight);
    if (metrics.lowerChestBand >= 2) {
      add('torso', torsoX + 1, lowerChestY, Math.max(2, torsoWidth - 2), 1, skinShadow);
    }
    if (chestTier >= 3 && !isSide) {
      add('torso', torsoX - 1, torsoTop + 3, 1, 3, skin);
      add('torso', torsoX + torsoWidth, torsoTop + 3, 1, 3, skin);
    }
  }
  if (isBack && upperBackTier >= 1) {
    add('torso', torsoX, torsoTop + 4, 2, 4, skinShadow);
    add('torso', torsoX + torsoWidth - 2, torsoTop + 4, 2, 4, skinShadow);
    add('torso', center - 1, torsoTop + 3, 2, 6, skinHighlight);
    if (metrics.latFlareBand >= 2) {
      add('torso', torsoX - 1, torsoTop + 5, 2, 4, skinShadow);
      add('torso', torsoX + torsoWidth - 1, torsoTop + 5, 2, 4, skinShadow);
    }
    if (metrics.midBackBand >= 2) {
      add('torso', center - 2, torsoTop + 6, 4, 3, skinShadow);
    }
    const latWidthBand = tier(build.latWidth, 3);
    if (latWidthBand > 0) {
      add(
        'torso',
        torsoX - 1,
        torsoTop + 4,
        latWidthBand,
        1 + latWidthBand,
        skin,
      );
      add(
        'torso',
        torsoX + torsoWidth + 1 - latWidthBand,
        torsoTop + 4,
        latWidthBand,
        1 + latWidthBand,
        skin,
      );
    }
  }
  if (coreDefinitionTier >= 1 && !isBack) {
    add('torso', center - 1, torsoTop + 6, 1, torsoBottom - torsoTop - 8, skinShadow);
    if (coreDefinitionTier >= 2) {
      add('torso', center + 2, torsoTop + 7, 1, torsoBottom - torsoTop - 9, skinHighlight);
    }
    if (metrics.obliqueMarks >= 2) {
      add('torso', lowerTorsoX, torsoTop + 8, 1, 4, skinShadow);
      add('torso', lowerTorsoX + lowerTorsoWidth - 1, torsoTop + 8, 1, 4, skinShadow);
    }
    if (metrics.serratusMarks >= 2) {
      add('torso', torsoX + 1, torsoTop + 6, 2, 1, skinShadow);
      add('torso', torsoX + torsoWidth - 3, torsoTop + 6, 2, 1, skinShadow);
    }
    for (let mark = 0; mark < Math.min(3, coreDefinitionTier); mark += 1) {
      const markY = torsoTop + 7 + mark * 2;
      add('torso', center - 3, markY, 2, 1, skinShadow);
      add('torso', center + 2, markY, 2, 1, skinShadow);
    }
  }
  if (!isBack) {
    add(
      'torso',
      center - 1,
      torsoTop + 7,
      1,
      1 + directCoreDefinitionTier,
      skinShadow,
    );
  }
  if (metrics.bodyFatBand > 0) {
    add(
      'torso',
      lowerTorsoX - 1,
      torsoBottom - 4,
      metrics.bodyFatBand,
      1 + metrics.bodyFatBand,
      skin,
    );
  }
  if (isBack && lowerBackTier >= 2) {
    add('torso', lowerTorsoX + 1, torsoTop + 8, 2, 3, skinShadow);
    add('torso', lowerTorsoX + lowerTorsoWidth - 3, torsoTop + 8, 2, 3, skinShadow);
  }
  if (muscleDefinitionTier >= 3 && !isSide) {
    add('torso', shoulderX + 1, torsoTop + 1, 2, 1, skinHighlight);
    add('torso', shoulderX + shoulderWidth - 3, torsoTop + 1, 2, 1, skinHighlight);
  }
  if (!isSide && directMuscleDefinitionTier > 0) {
    add(
      'torso',
      torsoX + 1,
      torsoTop + 2,
      1 + directMuscleDefinitionTier,
      1,
      skinHighlight,
    );
  }

  // 4. Arms
  const upperArmWidth = Math.min(
    6,
    (isBack || pose === 'side-triceps'
      ? metrics.tricepsWidth
      : isSide && pose !== 'side-chest'
        ? Math.max(metrics.bicepsWidth, metrics.tricepsWidth)
        : metrics.bicepsWidth) +
      Math.floor((metrics.muscleFullnessBand + metrics.pumpBand) / 4),
  );
  const lowerArmWidth = Math.min(5, metrics.forearmWidth);
  const armBaseY = torsoTop + 2;
  const handSize = 1 + Math.min(2, handTier);
  const armHeight = 5 + Math.min(2, bodyScaleTier);
  type ArmSegment = {
    kind: 'upper' | 'forearm' | 'hand';
    x: number;
    y: number;
    width: number;
    height: number;
  };
  const armSegments: ArmSegment[] = [];
  const segment = (
    kind: ArmSegment['kind'],
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    armSegments.push({ kind, x, y, width, height });
  };
  const verticalArm = (
    side: 'left' | 'right',
    yShift = 0,
    xShift = 0,
  ) => {
    const upperX =
      side === 'left'
        ? shoulderX - upperArmWidth + xShift
        : shoulderX + shoulderWidth + xShift;
    const forearmX =
      side === 'left'
        ? upperX
        : upperX + upperArmWidth - lowerArmWidth;
    segment('upper', upperX, armBaseY + yShift, upperArmWidth, armHeight);
    segment('forearm', forearmX, armBaseY + yShift + armHeight - 1, lowerArmWidth, 4);
    segment(
      'hand',
      side === 'left'
        ? forearmX - Math.max(0, handSize - lowerArmWidth)
        : forearmX + lowerArmWidth - handSize,
      armBaseY + yShift + armHeight + 2,
      handSize,
      2,
    );
  };
  const flexArm = (side: 'left' | 'right', lift = 0) => {
    const upperX =
      side === 'left'
        ? shoulderX - upperArmWidth - 2
        : shoulderX + shoulderWidth - 1;
    const upperSpan = upperArmWidth + 3;
    const forearmX =
      side === 'left' ? upperX : upperX + upperSpan - lowerArmWidth;
    segment('upper', upperX, armBaseY + lift, upperSpan, Math.max(3, upperArmWidth));
    segment('forearm', forearmX, armBaseY - 4 + lift, lowerArmWidth, 5);
    segment('hand', forearmX, armBaseY - 5 + lift, handSize, 2);
  };
  const overheadArm = (side: 'left' | 'right') => {
    const upperX =
      side === 'left'
        ? shoulderX - upperArmWidth
        : shoulderX + shoulderWidth;
    segment('upper', upperX, armBaseY - 3, upperArmWidth, 5);
    segment('forearm', upperX, armBaseY - 7, lowerArmWidth, 5);
    segment('hand', upperX, armBaseY - 8, handSize, 2);
  };
  const horizontalArm = (side: 'left' | 'right', yShift = 0) => {
    const reach = 5 + Math.min(2, forearmTier);
    const startX =
      side === 'left' ? shoulderX - reach : shoulderX + shoulderWidth;
    segment('upper', startX, armBaseY + yShift, reach, Math.max(2, upperArmWidth - 1));
    segment(
      'forearm',
      side === 'left' ? startX - 3 : startX + reach - 1,
      armBaseY + yShift,
      4,
      Math.max(2, lowerArmWidth - 1),
    );
    segment(
      'hand',
      side === 'left' ? startX - 3 : startX + reach + 2,
      armBaseY + yShift,
      handSize,
      2,
    );
  };

  if (
    pose === 'victory' ||
    pose === 'victory-flex' ||
    pose === 'front-double-biceps' ||
    pose === 'back-double-biceps'
  ) {
    flexArm('left');
    flexArm('right');
  } else if (pose === 'most-muscular' || pose === 'post-set-pump') {
    verticalArm('left', -1);
    verticalArm('right', -1);
    segment('forearm', shoulderX - 1, armBaseY + 4, center - shoulderX + 1, lowerArmWidth);
    segment('forearm', center, armBaseY + 4, shoulderX + shoulderWidth - center + 1, lowerArmWidth);
  } else if (pose === 'side-chest') {
    verticalArm('left', -1);
    segment('upper', shoulderX + shoulderWidth - 1, armBaseY, upperArmWidth + 1, 4);
    segment('forearm', center - 1, armBaseY + 3, shoulderHalf + 2, lowerArmWidth);
    segment('hand', center - 1, armBaseY + 3, handSize, 2);
  } else if (pose === 'side-triceps') {
    verticalArm('left', 0, -1);
    verticalArm('right', 1, 1);
    segment('hand', center - 1, torsoBottom - 4, handSize + 1, 2);
  } else if (pose === 'abs-and-thigh') {
    overheadArm('left');
    verticalArm('right', 1, -1);
  } else if (pose === 'pre-workout-warmup') {
    horizontalArm('left', animationFrame % 2);
    horizontalArm('right', animationFrame % 2);
  } else if (
    pose === 'boss-introduction' ||
    pose === 'boss-entrance-pose'
  ) {
    flexArm('left', 1);
    overheadArm('right');
  } else if (pose === 'capture') {
    verticalArm('left', 1);
    segment('upper', shoulderX + shoulderWidth - 1, armBaseY, upperArmWidth + 2, 3);
    segment('forearm', shoulderX + shoulderWidth + upperArmWidth, armBaseY, 5, lowerArmWidth);
    segment('hand', shoulderX + shoulderWidth + upperArmWidth + 4, armBaseY, handSize, 2);
  } else if (pose === 'training') {
    verticalArm('left', -1);
    verticalArm('right', -1);
    segment('forearm', shoulderX - 1, armBaseY + 3, lowerArmWidth, 5);
    segment('forearm', shoulderX + shoulderWidth - lowerArmWidth + 1, armBaseY + 3, lowerArmWidth, 5);
  } else if (pose === 'fatigue' || pose === 'fatigued-stance') {
    verticalArm('left', 2, 1);
    verticalArm('right', 3, -1);
  } else if (pose === 'running') {
    verticalArm('left', animationFrame % 2 === 0 ? -2 : 2, 1);
    verticalArm('right', animationFrame % 2 === 0 ? 2 : -2, -1);
  } else if (pose === 'walking' || pose === 'confident-walk') {
    verticalArm('left', animationFrame % 2 === 0 ? -1 : 1);
    verticalArm('right', animationFrame % 2 === 0 ? 1 : -1);
  } else {
    verticalArm('left');
    verticalArm('right');
  }

  for (const part of armSegments) {
    add('arms', part.x - 1, part.y - 1, part.width + 2, part.height + 2, outline);
    add(
      'arms',
      part.x,
      part.y,
      part.width,
      part.height,
      part.kind === 'forearm' ? skinShadow : skin,
    );
    if (
      muscleDefinitionTier >= 2 &&
      part.kind !== 'hand' &&
      part.height >= 3
    ) {
      add('arms', part.x, part.y + 1, 1, Math.max(1, part.height - 2), skinHighlight);
    }
    if (
      part.kind === 'upper' &&
      metrics.bicepsPeakBand >= 2 &&
      !isBack &&
      pose !== 'side-triceps'
    ) {
      add(
        'arms',
        part.x + Math.max(0, Math.floor(part.width / 2) - 1),
        part.y - 1,
        Math.min(2, part.width),
        1,
        skin,
      );
    }
    if (part.kind === 'upper' && !isBack && pose !== 'side-triceps') {
      add(
        'arms',
        part.x,
        part.y + 1,
        Math.min(part.width, 1 + bicepsSizeTier),
        1,
        skinHighlight,
      );
      if (bicepsThicknessTier > 0) {
        add(
          'arms',
          part.x + Math.max(0, part.width - bicepsThicknessTier),
          part.y + Math.max(1, part.height - 2),
          bicepsThicknessTier,
          1,
          skinShadow,
        );
      }
    }
    if (part.kind === 'upper' && (isBack || pose === 'side-triceps')) {
      add(
        'arms',
        part.x + Math.max(0, part.width - 1 - tricepsSizeTier),
        part.y + Math.max(1, part.height - 2),
        Math.min(part.width, 1 + tricepsSizeTier),
        1,
        skinShadow,
      );
    }
    if (
      part.kind === 'upper' &&
      metrics.tricepsDefinitionMarks >= 2 &&
      (isBack || pose === 'side-triceps')
    ) {
      add(
        'arms',
        part.x + Math.max(0, part.width - 2),
        part.y + 1,
        1,
        Math.max(2, part.height - 2),
        skinShadow,
      );
    }
    if (
      part.kind === 'forearm' &&
      Math.max(metrics.forearmVascularMarks, metrics.vascularityMarks) >= 2
    ) {
      add(
        'arms',
        part.x + Math.floor(part.width / 2),
        part.y + 1,
        1,
        1 + Math.min(1, metrics.pumpBand),
        skinHighlight,
      );
    }
    if (part.kind === 'forearm') {
      add(
        'arms',
        part.x,
        part.y + 1,
        1,
        Math.min(part.height, 1 + forearmSizeTier),
        skinHighlight,
      );
    }
    if (
      part.kind !== 'hand' &&
      metrics.muscleFullnessBand + metrics.pumpBand > 0
    ) {
      const fullnessDepth = Math.min(
        3,
        Math.ceil(
          (metrics.muscleFullnessBand + metrics.pumpBand) / 2,
        ),
      );
      add(
        'arms',
        part.x + Math.max(0, Math.floor((part.width - fullnessDepth) / 2)),
        part.y,
        Math.min(part.width, fullnessDepth),
        1,
        skin,
      );
    }
  }

  // 5. Head
  add('head', neckX - 1, neckY, neckWidth + 2, 4, outline);
  add('head', neckX, neckY, neckWidth, 3, skinShadow);
  add('head', headX - 1, headY - 1, headWidth + 2, headHeight + 2, outline);
  add('head', headX, headY, headWidth, headHeight, skin);
  if (appearance.face.shapeId === 'diamond-defined') {
    add('head', headX, headY + headHeight - 1, 1, 1, outline);
    add('head', headX + headWidth - 1, headY + headHeight - 1, 1, 1, outline);
  }
  if (appearance.face.earsId !== 'close' && !isBack) {
    add('head', headX - 1, headY + 2, 1, 2, skinShadow);
    add('head', headX + headWidth, headY + 2, 1, 2, skinShadow);
  }

  // 6. Hair
  if (appearance.hair.styleId !== 'bald') {
    const longHair =
      appearance.hair.lengthId === 'long'
        ? 5
        : appearance.hair.lengthId === 'medium'
          ? 3
          : 1;
    add('hair', headX, headY, headWidth, 2, hair);
    if (
      appearance.hair.styleId === 'coils-high' ||
      appearance.hair.styleId === 'top-knot'
    ) {
      add('hair', center - 2, headY - 3, 4, 3, hair);
      add('hair', center - 1, headY - 3, 2, 1, hairHighlight);
    }
    if (
      appearance.hair.styleId === 'mohawk-soft' ||
      appearance.hair.styleId === 'side-sweep'
    ) {
      add('hair', center - 1, headY - 2, 4, 2, hair);
      add('hair', center + 1, headY - 2, 2, 1, hairHighlight);
    }
    if (
      appearance.hair.styleId === 'braids-back' ||
      appearance.hair.styleId === 'locs-tied' ||
      appearance.hair.styleId === 'ponytail'
    ) {
      add('hair', headX + headWidth - 1, headY + 2, 2, longHair + 2, hair);
    } else if (isBack && longHair > 1) {
      add('hair', headX, headY + 2, headWidth, longHair, hair);
    }
    if (appearance.hair.styleId === 'fade-curl') {
      add('hair', headX, headY + 1, 1, 2, hairHighlight);
    }
  }

  // 7. Facial details
  if (!isBack) {
    const eyeY = headY + 2;
    const eyeColor = '#10202a';
    if (isSide) {
      add('facial-details', center + 1, eyeY, 1, 1, eyeColor);
      add('facial-details', center + 2, eyeY + 2, 1, 1, skinShadow);
    } else {
      add('facial-details', center - 2, eyeY, 1, 1, eyeColor);
      add('facial-details', center + 1, eyeY, 1, 1, eyeColor);
      if (appearance.face.eyebrowsId.includes('bold') || appearance.face.eyebrowsId.includes('thick')) {
        add('facial-details', center - 2, eyeY - 1, 1, 1, hair);
        add('facial-details', center + 1, eyeY - 1, 1, 1, hair);
      }
    }
    add('facial-details', center, eyeY + 1, 1, 1, skinShadow);
    const mouthColor =
      appearance.face.mouthId === 'wide-grin' ? '#eef2d0' : '#6f3938';
    add(
      'facial-details',
      center - (appearance.face.mouthId === 'wide-grin' ? 1 : 0),
      headY + headHeight - 2,
      appearance.face.mouthId === 'wide-grin' ? 3 : 1,
      1,
      mouthColor,
    );
    if (appearance.face.facialHairId !== 'none') {
      const beardHeight =
        appearance.face.facialHairId === 'full-beard' ? 2 : 1;
      add('facial-details', center - 2, headY + headHeight - beardHeight, 4, beardHeight, hair);
    }
    if (appearance.face.frecklesId !== 'none') {
      add('facial-details', center - 2, eyeY + 2, 1, 1, skinShadow);
      add('facial-details', center + 2, eyeY + 2, 1, 1, skinShadow);
    }
    if (appearance.face.scarId !== 'none') {
      add('facial-details', center + 2, eyeY - 1, 1, 3, '#8f4e48');
    }
    if (appearance.face.facePaintId !== 'none') {
      add('facial-details', center - 3, eyeY + 1, 2, 1, accessoryAccent);
    }
  }

  // 8. Clothing
  const racerbackTank = appearance.outfit.topId === 'tank-racer';
  const stringerTank = appearance.outfit.topId === 'tank-stringer';
  const posingTop = appearance.outfit.topId === 'posing-top';
  const tankTop = racerbackTank || stringerTank || posingTop;
  const sleevelessHoodie = appearance.outfit.topId === 'hoodie-sleeveless';
  const pumpCover = appearance.outfit.topId === 'pump-cover-oversized';
  const sleeveless = tankTop || sleevelessHoodie;
  const longCompression = appearance.outfit.topId === 'compression-long';
  if (tankTop) {
    const strapInset = stringerTank || posingTop ? 3 : 2;
    const strapWidth =
      stringerTank || posingTop
        ? 1
        : Math.max(1, Math.min(2, upperArmWidth - 1));
    add(
      'clothing',
      shoulderX + strapInset,
      torsoTop + 1,
      strapWidth,
      4,
      topPrimary,
    );
    add(
      'clothing',
      shoulderX + shoulderWidth - strapInset - strapWidth,
      torsoTop + 1,
      strapWidth,
      4,
      topPrimary,
    );
    const upperInset = posingTop ? 3 : stringerTank ? 2 : 1;
    add(
      'clothing',
      torsoX + upperInset,
      torsoTop + 3,
      Math.max(3, torsoWidth - upperInset * 2),
      posingTop ? 3 : 4,
      topPrimary,
    );
    add(
      'clothing',
      lowerTorsoX + 1,
      posingTop ? torsoTop + 6 : torsoTop + 7,
      Math.max(3, lowerTorsoWidth - 2),
      posingTop ? torsoBottom - torsoTop - 6 : torsoBottom - torsoTop - 7,
      topPrimary,
    );
  } else {
    const topInset = sleevelessHoodie ? 1 : pumpCover ? -1 : 0;
    add(
      'clothing',
      shoulderX + topInset,
      torsoTop + 1,
      shoulderWidth - topInset * 2,
      pumpCover ? 4 : 3,
      topPrimary,
    );
    add('clothing', torsoX, torsoTop + 3, torsoWidth, 4, topPrimary);
    add(
      'clothing',
      lowerTorsoX,
      torsoTop + 7,
      lowerTorsoWidth,
      torsoBottom - torsoTop - 7,
      topPrimary,
    );
  }
  add('clothing', waistX, torsoBottom - 3, waistWidth, 2, trimColor);
  add('clothing', center - 1, torsoTop + 3, 2, Math.max(2, torsoBottom - torsoTop - 7), topAccent);
  if (!sleeveless) {
    for (const part of armSegments) {
      if (part.kind !== 'upper' && !(longCompression && part.kind === 'forearm')) {
        continue;
      }
      const sleeveDepth = longCompression
        ? part.height
        : Math.min(
            part.height,
            appearance.outfit.topId === 'hoodie-training' || pumpCover ? 4 : 3,
          );
      add('clothing', part.x, part.y, part.width, sleeveDepth, topPrimary);
      if (part.width >= 3) {
        add('clothing', part.x + part.width - 1, part.y, 1, sleeveDepth, trimColor);
      }
    }
  }
  if (appearance.outfit.topId.includes('hoodie')) {
    add('clothing', neckX - 1, neckY + 1, neckWidth + 2, 2, topSecondary);
  }
  const longBottoms =
    appearance.outfit.bottomsId.includes('joggers') ||
    appearance.outfit.bottomsId.includes('leggings');
  const shortLength = Math.max(3, Math.round(thighHeight * 0.58));
  add('clothing', center - hipHalf, hipY - 1, hipHalf * 2, 3, bottomPrimary);
  add('clothing', center - hipHalf, hipY - 1, hipHalf * 2, 1, trimColor);
  add(
    'clothing',
    leftLegX,
    legTop + 1,
    thighWidth,
    longBottoms ? thighHeight - 1 : shortLength,
    bottomPrimary,
  );
  add(
    'clothing',
    rightLegX,
    legTop + 1,
    thighWidth,
    longBottoms ? thighHeight - 1 : shortLength,
    bottomPrimary,
  );
  if (longBottoms) {
    add('clothing', leftCalfX, calfTop, calfWidth, calfHeight, bottomPrimary);
    add('clothing', rightCalfX, calfTop, calfWidth, calfHeight, bottomPrimary);
    add('clothing', leftCalfX, calfTop + 1, 1, Math.max(1, calfHeight - 2), trimColor);
    add('clothing', rightCalfX + calfWidth - 1, calfTop + 1, 1, Math.max(1, calfHeight - 2), trimColor);
  } else {
    add('clothing', leftLegX, legTop + 2, 1, Math.max(1, shortLength - 2), bottomSecondary);
    add('clothing', rightLegX + thighWidth - 1, legTop + 2, 1, Math.max(1, shortLength - 2), trimColor);
  }
  if (appearance.outfit.logoShapeId !== 'none') {
    const logoY = torsoTop + 4;
    if (appearance.outfit.logoShapeId === 'forge-bars') {
      add('clothing', center - 2, logoY, 1, 2, logoColor);
      add('clothing', center, logoY - 1, 1, 3, logoColor);
      add('clothing', center + 2, logoY, 1, 2, logoColor);
    } else if (appearance.outfit.logoShapeId === 'forge-arc') {
      add('clothing', center - 2, logoY, 5, 1, logoColor);
      add('clothing', center - 1, logoY - 1, 3, 1, logoColor);
    } else {
      add('clothing', center, logoY - 1, 1, 3, logoColor);
      add('clothing', center - 1, logoY, 3, 1, logoColor);
    }
  }
  if (appearance.outfit.elbowSleevesId !== 'none') {
    for (const part of armSegments.filter((entry) => entry.kind === 'forearm')) {
      add('clothing', part.x, part.y, part.width, Math.min(2, part.height), accessoryPrimary);
    }
  }
  if (appearance.outfit.kneeSleevesId !== 'none') {
    add('clothing', leftCalfX, calfTop, calfWidth, 2, accessoryPrimary);
    add('clothing', rightCalfX, calfTop, calfWidth, 2, accessoryPrimary);
  }
  if (appearance.outfit.socksId !== 'none') {
    const sockHeight =
      appearance.outfit.socksId === 'knee'
        ? Math.max(2, calfHeight - 1)
        : appearance.outfit.socksId === 'crew'
          ? Math.min(3, calfHeight)
          : 1;
    add('clothing', leftCalfX, ankleY - sockHeight, calfWidth, sockHeight, shoeAccent);
    add('clothing', rightCalfX, ankleY - sockHeight, calfWidth, sockHeight, shoeAccent);
  }

  // 9. Shoes
  const highTop = appearance.outfit.shoesId === 'trainer-high-top';
  const raisedHeel = appearance.outfit.shoesId === 'lifting-raised';
  const flatSole = appearance.outfit.shoesId === 'lifting-flat';
  const shoeWidth = 3 + Math.min(2, footTier) + (flatSole ? 1 : 0);
  const shoeHeight = highTop ? 4 : 3;
  const shoeY = ankleY - (highTop ? 1 : 0);
  add('shoes', leftCalfX - 1, shoeY, shoeWidth, shoeHeight, outline);
  add('shoes', rightCalfX - 1, shoeY, shoeWidth, shoeHeight, outline);
  add('shoes', leftCalfX, shoeY, shoeWidth - 1, shoeHeight - 1, shoePrimary);
  add('shoes', rightCalfX, shoeY, shoeWidth - 1, shoeHeight - 1, shoePrimary);
  add('shoes', leftCalfX + shoeWidth - 2, ankleY + 1, 1, raisedHeel ? 2 : 1, shoeAccent);
  add('shoes', rightCalfX + shoeWidth - 2, ankleY + 1, 1, raisedHeel ? 2 : 1, shoeAccent);

  // 10. Accessories
  if (appearance.outfit.glovesId !== 'none') {
    for (const part of armSegments.filter((entry) => entry.kind === 'hand')) {
      add('accessories', part.x, part.y, part.width, part.height, accessoryPrimary);
    }
  }
  if (appearance.outfit.wristWrapsId !== 'none') {
    for (const part of armSegments.filter((entry) => entry.kind === 'forearm')) {
      if (part.height >= part.width) {
        add('accessories', part.x, part.y + part.height - 1, part.width, 1, accessoryAccent);
      } else {
        add('accessories', part.x + Math.floor(part.width / 2), part.y, 1, part.height, accessoryAccent);
      }
    }
  }
  if (appearance.accessories.headwearId !== 'none') {
    const headwearY = Math.max(0, headY - 1);
    add('accessories', headX - 1, headwearY, headWidth + 2, appearance.accessories.headwearId.includes('headband') ? 1 : 2, accessoryPrimary);
  }
  if (appearance.accessories.beltId !== 'none') {
    add('accessories', waistX - 1, torsoBottom - 2, waistWidth + 2, 2, accessoryPrimary);
    add('accessories', center - 1, torsoBottom - 2, 2, 2, accessoryAccent);
  }
  if (appearance.face.tattooId !== 'none') {
    const upperSegments = armSegments.filter((entry) => entry.kind === 'upper');
    for (const [index, part] of upperSegments.entries()) {
      if (index > 0 && appearance.face.tattooId === 'arm-bands') continue;
      add('accessories', part.x, part.y + 1, 1, Math.min(3, part.height), accessoryAccent);
    }
  }
  if (appearance.accessories.jewelryId !== 'none' && !isBack) {
    add('accessories', center - 1, neckY + 2, 2, 1, accessoryAccent);
  }
  if (appearance.outfit.chalkMarksId !== 'none') {
    const chalk = '#eef2d0';
    for (const part of armSegments.filter((entry) => entry.kind === 'hand')) {
      add('accessories', part.x, part.y, 1, 1, chalk);
    }
    if (appearance.outfit.chalkMarksId === 'shoulder-dust') {
      add('accessories', shoulderX + 1, torsoTop, 2, 1, chalk);
    }
  }

  // 11. Equipment
  if (appearance.accessories.gymBagId !== 'none') {
    const bagWidth = appearance.accessories.gymBagId === 'duffel-large' ? 6 : 4;
    const bagX = direction === 'left' ? center + 5 : center - 5 - bagWidth;
    add('equipment', bagX, torsoBottom - 1, bagWidth, 5, accessoryPrimary);
    add('equipment', bagX + 1, torsoBottom, bagWidth - 2, 1, accessoryAccent);
  }
  if (appearance.accessories.towelId !== 'none') {
    const towelAtShoulder =
      appearance.accessories.towelId !== 'belt-loop';
    const towelX = towelAtShoulder ? shoulderX + 1 : waistX - 1;
    const towelY = towelAtShoulder ? torsoTop + 1 : torsoBottom - 1;
    const towelHeight =
      appearance.accessories.towelId === 'gym-stripe' ? 7 : 5;
    add('equipment', towelX, towelY, 3, towelHeight, accessoryPrimary);
    add('equipment', towelX, towelY + 2, 3, 1, accessoryAccent);
  }
  if (appearance.accessories.fantasyId !== 'none') {
    const capeHeight =
      appearance.accessories.fantasyId === 'cape-banner' ? 12 : 8;
    const capeX = isSide ? center + 3 : shoulderX + 1;
    add('equipment', capeX, torsoTop + 2, isSide ? 3 : shoulderWidth - 2, capeHeight, accessoryPrimary);
    add('equipment', capeX, torsoTop + capeHeight, isSide ? 3 : shoulderWidth - 2, 1, accessoryAccent);
  }

  // 12. Effects
  if (
    pose === 'victory' ||
    pose === 'victory-flex' ||
    pose === 'boss-introduction' ||
    pose === 'boss-entrance-pose'
  ) {
    add('effects', 2, 5 + (animationFrame % 2), 1, 1, topAccent);
    add('effects', TRAINER_PIXEL_WIDTH - 3, 8 - (animationFrame % 2), 1, 1, accessoryAccent);
    add('effects', center + 6, 2, 1, 2, '#eef2d0');
  }
  if (pose === 'fatigue' || pose === 'fatigued-stance') {
    add('effects', center + 5, headY + 1, 2, 1, '#79c6e8');
  }
  if (pose === 'post-set-pump' || pose === 'most-muscular') {
    add('effects', 3, torsoTop + (animationFrame % 2), 1, 1, topAccent);
    add('effects', TRAINER_PIXEL_WIDTH - 4, torsoTop + 2 - (animationFrame % 2), 1, 1, accessoryAccent);
  }

  if (direction === 'right') {
    return {
      height: TRAINER_PIXEL_HEIGHT,
      width: TRAINER_PIXEL_WIDTH,
      rects: rects.map((rect) => ({
        ...rect,
        x: TRAINER_PIXEL_WIDTH - rect.x - rect.width,
      })),
    };
  }
  return {
    height: TRAINER_PIXEL_HEIGHT,
    width: TRAINER_PIXEL_WIDTH,
    rects,
  };
}

export function renderTrainerPixelFrame(
  appearance: TrainerAppearance,
  direction: TrainerFacingDirection = 'front',
  pose: TrainerPose = 'idle',
  animationFrame = 0,
): TrainerPixelFrame {
  const key = `${appearanceCacheKey(appearance)}|${direction}|${pose}|${animationFrame % 2}`;
  const cached = frameCache.get(key);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  const rendered = drawFrame(appearance, direction, pose, animationFrame);
  if (frameCache.size >= FRAME_CACHE_LIMIT) {
    const oldest = frameCache.keys().next().value as string | undefined;
    if (oldest) frameCache.delete(oldest);
  }
  frameCache.set(key, rendered);
  return rendered;
}

export function drawTrainerFrameToCanvas(
  context: CanvasRenderingContext2D,
  frame: TrainerPixelFrame,
) {
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, frame.width, frame.height);
  for (const rect of frame.rects) {
    context.fillStyle = rect.color;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
  }
}

export function resetTrainerPixelFrameCache() {
  frameCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}

export function getTrainerPixelFrameCacheStats() {
  return {
    entries: frameCache.size,
    hits: cacheHits,
    misses: cacheMisses,
    limit: FRAME_CACHE_LIMIT,
  };
}
