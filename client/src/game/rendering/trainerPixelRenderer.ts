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
  const heightOffset = Math.round((build.height - 5) / 3);
  const bodyScaleTier = tier(build.bodyScale);
  const massTier = tier(build.bodyMass);
  const headTier = tier(build.headSize, 2);
  const shoulderTier = tier(
    isBack ? build.upperBackWidth : build.shoulderWidth,
    3,
  );
  const chestTier = tier(
    isBack ? build.lowerBackThickness : build.chestSize,
    3,
  );
  const waistTier = tier(build.waistWidth, 3);
  const armTier = Math.max(tier(build.bicepsSize), tier(build.tricepsSize));
  const forearmTier = tier(build.forearmSize, 2);
  const handTier = tier(build.handSize, 2);
  const thighTier = Math.max(tier(build.quadSize), tier(build.hamstringSize));
  const calfTier = tier(build.calfSize, 2);
  const footTier = tier(build.footSize, 2);
  const definitionTier = tier(
    Math.max(build.coreDefinition, build.muscleDefinition),
    3,
  );

  const poseBob =
    pose === 'walking' || pose === 'running'
      ? animationFrame % 2
      : pose === 'fatigue'
        ? 2
        : 0;
  const topY = 4 - heightOffset + poseBob;
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
    ? 3 + Math.min(1, shoulderTier)
    : 5 + shoulderTier + Math.min(1, bodyScaleTier);
  const torsoBottom = 22 + heightOffset + Math.min(1, bodyScaleTier);
  const waistHalf = 3 + Math.min(2, waistTier) + Math.min(1, massTier);
  const torsoHalf = Math.max(
    waistHalf,
    isSide
      ? 3 + Math.min(2, chestTier + massTier)
      : 4 + chestTier + Math.min(1, massTier),
  );
  const shoulderX = center - shoulderHalf;
  const shoulderWidth = shoulderHalf * 2;
  const torsoX = center - torsoHalf;
  const torsoWidth = torsoHalf * 2;
  const waistX = center - waistHalf;
  const waistWidth = waistHalf * 2;
  const hipY = torsoBottom - 2;
  const legTop = hipY;
  const ankleY = 32 + heightOffset;
  const legHeight = Math.max(6, ankleY - legTop);
  const thighWidth = 2 + Math.min(2, thighTier) + Math.min(1, massTier);
  const calfWidth = 2 + Math.min(1, calfTier);
  const stance = Math.max(2, Math.min(4, waistHalf - 1));
  const walkStride =
    pose === 'running'
      ? animationFrame % 2 === 0
        ? 2
        : -2
      : pose === 'walking'
        ? animationFrame % 2 === 0
          ? 1
          : -1
        : 0;
  const leftLegX = center - stance - Math.floor(thighWidth / 2) + walkStride;
  const rightLegX = center + stance - Math.ceil(thighWidth / 2) - walkStride;

  const skin = getTrainerSkinToneHex(appearance.colors.skinToneId);
  const skinShadow = blendColor(skin, '#17262b', 0.24);
  const skinHighlight = blendColor(skin, '#ffffff', 0.18);
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

  // 1. Shadow
  const shadowWidth = 10 + bodyScaleTier * 2 + massTier;
  add('shadow', center - shadowWidth / 2, 34, shadowWidth, 1, '#061519');
  add('shadow', center - shadowWidth / 2 + 2, 33, shadowWidth - 4, 1, '#1d3537');

  // 2. Legs
  add('legs', leftLegX - 1, legTop, thighWidth + 2, legHeight, outline);
  add('legs', rightLegX - 1, legTop, thighWidth + 2, legHeight, outline);
  add('legs', leftLegX, legTop, thighWidth, Math.ceil(legHeight * 0.58), skin);
  add('legs', rightLegX, legTop, thighWidth, Math.ceil(legHeight * 0.58), skin);
  add('legs', leftLegX, legTop + Math.ceil(legHeight * 0.54), calfWidth, Math.floor(legHeight * 0.46), skinShadow);
  add('legs', rightLegX + thighWidth - calfWidth, legTop + Math.ceil(legHeight * 0.54), calfWidth, Math.floor(legHeight * 0.46), skinShadow);

  // 3. Torso
  add('torso', shoulderX - 1, torsoTop - 1, shoulderWidth + 2, 4, outline);
  add('torso', torsoX - 1, torsoTop + 2, torsoWidth + 2, torsoBottom - torsoTop, outline);
  add('torso', shoulderX, torsoTop, shoulderWidth, 3, skin);
  add('torso', torsoX, torsoTop + 2, torsoWidth, torsoBottom - torsoTop - 2, skin);
  add('torso', waistX, torsoBottom - 3, waistWidth, 3, skinShadow);
  if (definitionTier >= 2 && !isBack) {
    add('torso', center - 1, torsoTop + 5, 1, torsoBottom - torsoTop - 7, skinShadow);
    add('torso', center + 2, torsoTop + 6, 1, torsoBottom - torsoTop - 8, skinHighlight);
  }
  if (definitionTier >= 3 && !isSide) {
    add('torso', center - 3, torsoTop + 7, 2, 1, skinShadow);
    add('torso', center + 2, torsoTop + 7, 2, 1, skinShadow);
  }

  // 4. Arms
  const upperArmWidth = 2 + Math.min(2, armTier);
  const lowerArmWidth = 2 + Math.min(1, forearmTier);
  const armBaseY = torsoTop + 2;
  const armLift =
    pose === 'victory'
      ? -7
      : pose === 'training'
        ? -4
        : pose === 'boss-introduction'
          ? -2
          : 0;
  const armSpread =
    pose === 'boss-introduction' || pose === 'victory' ? 2 : 0;
  const captureReach = pose === 'capture' ? 4 : 0;
  const leftArmX = shoulderX - upperArmWidth - armSpread;
  const rightArmX = shoulderX + shoulderWidth + armSpread;
  const armHeight = 6 + Math.min(2, bodyScaleTier);
  add('arms', leftArmX - 1, armBaseY + armLift, upperArmWidth + 2, armHeight + 1, outline);
  add('arms', rightArmX - 1 + captureReach, armBaseY + armLift, upperArmWidth + 2, armHeight + 1, outline);
  add('arms', leftArmX, armBaseY + armLift, upperArmWidth, armHeight, skin);
  add('arms', rightArmX + captureReach, armBaseY + armLift, upperArmWidth, armHeight, skin);
  add('arms', leftArmX, armBaseY + armLift + armHeight - 1, lowerArmWidth, 4, skinShadow);
  add('arms', rightArmX + upperArmWidth - lowerArmWidth + captureReach, armBaseY + armLift + armHeight - 1, lowerArmWidth, 4, skinShadow);
  const handSize = 1 + Math.min(2, handTier);
  add('arms', leftArmX - Math.max(0, handSize - lowerArmWidth), armBaseY + armLift + armHeight + 2, handSize, 2, skin);
  add('arms', rightArmX + captureReach + upperArmWidth - lowerArmWidth, armBaseY + armLift + armHeight + 2, handSize, 2, skin);

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
  const sleeveless =
    appearance.outfit.topId === 'tank-racer' ||
    appearance.outfit.topId === 'hoodie-sleeveless';
  const topInset = sleeveless ? 2 : 0;
  add(
    'clothing',
    shoulderX + topInset,
    torsoTop + 1,
    shoulderWidth - topInset * 2,
    3,
    topPrimary,
  );
  add('clothing', torsoX, torsoTop + 4, torsoWidth, torsoBottom - torsoTop - 4, topPrimary);
  add('clothing', waistX, torsoBottom - 3, waistWidth, 2, topSecondary);
  add('clothing', center - 1, torsoTop + 3, 2, Math.max(2, torsoBottom - torsoTop - 7), topAccent);
  if (!sleeveless) {
    add('clothing', leftArmX, armBaseY + armLift, upperArmWidth, 3, topPrimary);
    add('clothing', rightArmX + captureReach, armBaseY + armLift, upperArmWidth, 3, topPrimary);
  }
  if (appearance.outfit.topId.includes('hoodie')) {
    add('clothing', neckX - 1, neckY + 1, neckWidth + 2, 2, topSecondary);
  }
  const bottomLength =
    appearance.outfit.bottomsId.includes('joggers') ||
    appearance.outfit.bottomsId.includes('leggings')
      ? legHeight - 2
      : Math.max(3, Math.round(legHeight * 0.42));
  add('clothing', center - waistHalf, hipY - 1, waistHalf * 2, 3, bottomPrimary);
  add('clothing', leftLegX, legTop + 1, thighWidth, bottomLength, bottomPrimary);
  add('clothing', rightLegX, legTop + 1, thighWidth, bottomLength, bottomPrimary);
  add('clothing', leftLegX, legTop + 2, 1, Math.max(1, bottomLength - 2), bottomSecondary);
  add('clothing', rightLegX + thighWidth - 1, legTop + 2, 1, Math.max(1, bottomLength - 2), bottomSecondary);
  if (appearance.outfit.elbowSleevesId !== 'none') {
    add('clothing', leftArmX, armBaseY + armLift + 4, upperArmWidth, 2, accessoryPrimary);
    add('clothing', rightArmX + captureReach, armBaseY + armLift + 4, upperArmWidth, 2, accessoryPrimary);
  }
  if (appearance.outfit.kneeSleevesId !== 'none') {
    add('clothing', leftLegX, legTop + Math.floor(legHeight * 0.45), thighWidth, 2, accessoryPrimary);
    add('clothing', rightLegX, legTop + Math.floor(legHeight * 0.45), thighWidth, 2, accessoryPrimary);
  }

  // 9. Shoes
  const shoeWidth = 3 + Math.min(2, footTier);
  add('shoes', leftLegX - 1, ankleY, shoeWidth, 3, outline);
  add('shoes', rightLegX - 1, ankleY, shoeWidth, 3, outline);
  add('shoes', leftLegX, ankleY, shoeWidth - 1, 2, shoePrimary);
  add('shoes', rightLegX, ankleY, shoeWidth - 1, 2, shoePrimary);
  add('shoes', leftLegX + shoeWidth - 2, ankleY + 1, 1, 1, shoeAccent);
  add('shoes', rightLegX + shoeWidth - 2, ankleY + 1, 1, 1, shoeAccent);

  // 10. Accessories
  if (appearance.outfit.glovesId !== 'none') {
    add('accessories', leftArmX, armBaseY + armLift + armHeight + 2, handSize, 2, accessoryPrimary);
    add('accessories', rightArmX + captureReach + upperArmWidth - lowerArmWidth, armBaseY + armLift + armHeight + 2, handSize, 2, accessoryPrimary);
  }
  if (appearance.outfit.wristWrapsId !== 'none') {
    add('accessories', leftArmX, armBaseY + armLift + armHeight, lowerArmWidth, 1, accessoryAccent);
    add('accessories', rightArmX + captureReach + upperArmWidth - lowerArmWidth, armBaseY + armLift + armHeight, lowerArmWidth, 1, accessoryAccent);
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
    add('accessories', leftArmX, armBaseY + armLift + 2, 1, 2, accessoryAccent);
    if (appearance.face.tattooId !== 'arm-bands') {
      add('accessories', rightArmX + captureReach + upperArmWidth - 1, armBaseY + armLift + 1, 1, 3, accessoryAccent);
    }
  }
  if (appearance.accessories.jewelryId !== 'none' && !isBack) {
    add('accessories', center - 1, neckY + 2, 2, 1, accessoryAccent);
  }

  // 11. Equipment
  if (appearance.accessories.gymBagId !== 'none') {
    const bagWidth = appearance.accessories.gymBagId === 'duffel-large' ? 6 : 4;
    const bagX = direction === 'left' ? center + 5 : center - 5 - bagWidth;
    add('equipment', bagX, torsoBottom - 1, bagWidth, 5, accessoryPrimary);
    add('equipment', bagX + 1, torsoBottom, bagWidth - 2, 1, accessoryAccent);
  }
  if (appearance.accessories.fantasyId !== 'none') {
    const capeHeight =
      appearance.accessories.fantasyId === 'cape-banner' ? 12 : 8;
    const capeX = isSide ? center + 3 : shoulderX + 1;
    add('equipment', capeX, torsoTop + 2, isSide ? 3 : shoulderWidth - 2, capeHeight, accessoryPrimary);
    add('equipment', capeX, torsoTop + capeHeight, isSide ? 3 : shoulderWidth - 2, 1, accessoryAccent);
  }

  // 12. Effects
  if (pose === 'victory' || pose === 'boss-introduction') {
    add('effects', 2, 5 + (animationFrame % 2), 1, 1, topAccent);
    add('effects', TRAINER_PIXEL_WIDTH - 3, 8 - (animationFrame % 2), 1, 1, accessoryAccent);
    add('effects', center + 6, 2, 1, 2, '#eef2d0');
  }
  if (pose === 'fatigue') {
    add('effects', center + 5, headY + 1, 2, 1, '#79c6e8');
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
