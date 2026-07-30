import {
  getBuddyCharacterDesign,
  getBuddyPaletteHex,
} from '../content/buddyCharacters';
import type {
  BuddyCosmetics,
  BuddyFacingDirection,
  BuddyPose,
  BuddySpecies,
} from '../types';
import { normalizeBuddyCosmetics } from '../systems/buddyCosmetics';

export const BUDDY_PIXEL_WIDTH = 24;
export const BUDDY_PIXEL_HEIGHT = 24;
const BUDDY_FRAME_CACHE_LIMIT = 512;

export const BUDDY_PIXEL_LAYERS = [
  'shadow',
  'body',
  'muscle',
  'marking',
  'appendage',
  'accessory',
  'face',
  'effect',
] as const;

export type BuddyPixelLayer = (typeof BUDDY_PIXEL_LAYERS)[number];

export type BuddyPixelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  layer: BuddyPixelLayer;
};

export type BuddyPixelFrame = {
  width: number;
  height: number;
  rects: readonly BuddyPixelRect[];
};

const frameCache = new Map<string, BuddyPixelFrame>();
let cacheHits = 0;
let cacheMisses = 0;

function addRect(
  rects: BuddyPixelRect[],
  layer: BuddyPixelLayer,
  color: string,
  x: number,
  y: number,
  width = 1,
  height = 1,
) {
  const left = Math.max(0, Math.round(x));
  const top = Math.max(0, Math.round(y));
  const right = Math.min(BUDDY_PIXEL_WIDTH, Math.round(x + width));
  const bottom = Math.min(BUDDY_PIXEL_HEIGHT, Math.round(y + height));
  if (right <= left || bottom <= top) return;
  rects.push({
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    color,
    layer,
  });
}

function paletteFor(
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
) {
  return {
    primary: getBuddyPaletteHex(
      cosmetics.primaryPaletteId,
      species.palette.skin,
    ),
    secondary: getBuddyPaletteHex(
      cosmetics.secondaryPaletteId,
      species.palette.core,
    ),
    accent: getBuddyPaletteHex(
      cosmetics.accentPaletteId,
      species.palette.accent,
    ),
    detail: species.palette.detail,
    shadow: '#101b24',
  };
}

function poseOffset(pose: BuddyPose, frame: number) {
  if (pose === 'walking') return frame % 2 === 0 ? 0 : -1;
  if (pose === 'running') return frame % 2 === 0 ? -1 : 0;
  if (pose === 'fatigue') return 2;
  if (
    pose === 'entrance' ||
    pose === 'boss-entrance' ||
    pose === 'rare-entrance'
  ) return frame % 2 === 0 ? 0 : -2;
  if (
    pose === 'victory' ||
    pose === 'front-flex' ||
    pose === 'back-flex' ||
    pose === 'side-pose'
  ) return -1;
  return 0;
}

function drawBaseSilhouette(
  rects: BuddyPixelRect[],
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  direction: BuddyFacingDirection,
  pose: BuddyPose,
  frame: number,
) {
  const palette = paletteFor(species, cosmetics);
  const horizontalScale =
    cosmetics.bodySizeId === 'compact'
      ? 1.75
      : cosmetics.bodySizeId === 'broad'
        ? 2.25
        : 2;
  const sideScale =
    direction === 'left' || direction === 'right' ? 0.82 : 1;
  const effectiveScale = horizontalScale * sideScale;
  const width = 8 * effectiveScale;
  const startX = (BUDDY_PIXEL_WIDTH - width) / 2;
  const postureOffset =
    cosmetics.physique.postureId === 'coiled'
      ? 1
      : cosmetics.physique.postureId === 'towering'
        ? -1
        : 0;
  const yOffset = 4 + poseOffset(pose, frame) + postureOffset;
  const mirror = direction === 'right';

  for (let rowIndex = 0; rowIndex < species.sprite.length; rowIndex += 1) {
    const row = species.sprite[rowIndex] ?? '';
    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const cell = row[columnIndex];
      if (!cell || cell === '.') continue;
      const sourceColumn = mirror ? row.length - columnIndex - 1 : columnIndex;
      const x = startX + sourceColumn * effectiveScale;
      const y = yOffset + rowIndex * 2;
      const isBackFace =
        direction === 'back' && (cell === 'E' || cell === 'A');
      const color = isBackFace
        ? palette.primary
        : cell === 'M'
          ? palette.primary
          : cell === 'D'
            ? palette.secondary
            : cell === 'A'
              ? palette.accent
              : palette.detail;
      const layer: BuddyPixelLayer =
        cell === 'E' ? 'face' : cell === 'A' ? 'appendage' : 'body';
      addRect(
        rects,
        layer,
        color,
        x,
        y,
        Math.max(1, Math.ceil(effectiveScale)),
        2,
      );
    }
  }
}

function drawMuscleDefinition(
  rects: BuddyPixelRect[],
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  direction: BuddyFacingDirection,
) {
  const design = getBuddyCharacterDesign(species.id);
  const primary = getBuddyPaletteHex(
    cosmetics.primaryPaletteId,
    species.palette.skin,
  );
  const accent = getBuddyPaletteHex(
    cosmetics.accentPaletteId,
    species.palette.accent,
  );
  const color =
    cosmetics.muscleDefinitionId === 'smooth' ? primary : accent;
  const points: Record<typeof design.musclePlacement, [number, number][]> = {
    shoulders: [[6, 10], [16, 10]],
    chest: [[9, 11], [13, 11]],
    back: [[7, 12], [15, 12]],
    core: [[11, 12], [11, 15]],
    forearms: [[5, 14], [17, 14]],
    legs: [[8, 17], [14, 17]],
  };
  const directionalPoints =
    direction === 'back'
      ? design.musclePlacement === 'chest'
        ? [[7, 11], [15, 11]] as [number, number][]
        : points[design.musclePlacement]
      : direction === 'left' || direction === 'right'
        ? points[design.musclePlacement].slice(0, 1)
        : points[design.musclePlacement];
  const definitionLength =
    cosmetics.muscleDefinitionId === 'etched' ? 3 : 2;
  for (const [x, y] of directionalPoints) {
    addRect(rects, 'muscle', color, x, y, definitionLength, 1);
  }
  if (cosmetics.muscleDefinitionId === 'etched') {
    addRect(rects, 'muscle', color, 11, 13, 1, 4);
  }
}

function drawStrengthSilhouette(
  rects: BuddyPixelRect[],
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  direction: BuddyFacingDirection,
  pose: BuddyPose,
) {
  const design = getBuddyCharacterDesign(species.id);
  const primary = getBuddyPaletteHex(
    cosmetics.primaryPaletteId,
    species.palette.skin,
  );
  const secondary = getBuddyPaletteHex(
    cosmetics.secondaryPaletteId,
    species.palette.core,
  );
  const size =
    cosmetics.bodySizeId === 'broad'
      ? 2
      : cosmetics.bodySizeId === 'compact'
        ? 0
        : 1;
  const side = direction === 'left' || direction === 'right';
  const back = direction === 'back';
  const width = side ? 2 + Math.min(1, size) : 2 + size;

  if (design.musclePlacement === 'shoulders') {
    addRect(rects, 'muscle', primary, side ? 5 : 3, 10, width + 1, 3);
    if (!side) addRect(rects, 'muscle', primary, 20 - width, 10, width + 1, 3);
    addRect(rects, 'muscle', secondary, 10, back ? 8 : 9, 4, 2);
  } else if (design.musclePlacement === 'chest') {
    const y = back ? 11 : 10;
    addRect(rects, 'muscle', secondary, side ? 9 : 7, y, 4 + size, 3);
    if (!side) addRect(rects, 'muscle', secondary, 13, y, 4 + size, 3);
  } else if (design.musclePlacement === 'back') {
    addRect(rects, 'muscle', secondary, side ? 7 : 5, 10, 3 + size, 5);
    if (!side) addRect(rects, 'muscle', secondary, 16 - size, 10, 3 + size, 5);
    if (back) addRect(rects, 'muscle', primary, 11, 8, 2, 7);
  } else if (design.musclePlacement === 'core') {
    addRect(rects, 'muscle', secondary, side ? 9 : 8, 12, 2 + size, 5);
    if (!side) addRect(rects, 'muscle', secondary, 14, 12, 2 + size, 5);
    if (!back) addRect(rects, 'muscle', primary, 11, 12, 2, 5);
  } else if (design.musclePlacement === 'forearms') {
    addRect(rects, 'muscle', primary, side ? 4 : 3, 13, 3 + size, 4);
    if (!side) addRect(rects, 'muscle', primary, 18 - size, 13, 3 + size, 4);
  } else {
    addRect(rects, 'muscle', primary, side ? 7 : 6, 16, 3 + size, 4);
    if (!side) addRect(rects, 'muscle', primary, 15 - size, 16, 3 + size, 4);
    addRect(rects, 'muscle', secondary, side ? 8 : 7, 19, 2 + size, 3);
    if (!side) addRect(rects, 'muscle', secondary, 16 - size, 19, 2 + size, 3);
  }

  if (
    pose === 'victory' ||
    pose === 'front-flex' ||
    pose === 'back-flex'
  ) {
    addRect(rects, 'muscle', primary, 3, 7, 3 + size, 3);
    addRect(rects, 'muscle', primary, 18 - size, 7, 3 + size, 3);
  } else if (
    pose === 'training' ||
    pose === 'capture' ||
    pose === 'side-pose'
  ) {
    addRect(rects, 'muscle', primary, side ? 3 : 4, 12, 4 + size, 3);
  } else if (
    pose === 'entrance' ||
    pose === 'boss-entrance' ||
    pose === 'rare-entrance'
  ) {
    addRect(rects, 'muscle', secondary, 5, 18, 4 + size, 2);
  }
}

function drawRegionalPhysique(
  rects: BuddyPixelRect[],
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  direction: BuddyFacingDirection,
) {
  const design = getBuddyCharacterDesign(species.id);
  const family = design.anatomyProfile.renderFamily;
  const primary = getBuddyPaletteHex(
    cosmetics.primaryPaletteId,
    species.palette.skin,
  );
  const secondary = getBuddyPaletteHex(
    cosmetics.secondaryPaletteId,
    species.palette.core,
  );
  const accent = getBuddyPaletteHex(
    cosmetics.accentPaletteId,
    species.palette.accent,
  );
  const side = direction === 'left' || direction === 'right';
  const back = direction === 'back';
  const naturalOffset = cosmetics.physique.symmetryId === 'natural' ? 1 : 0;
  const pronounced = (value: string) => value === 'pronounced';

  if (cosmetics.physique.overallMassId === 'heavy-mass') {
    addRect(rects, 'muscle', secondary, side ? 6 : 4, 12, 2, 5);
    if (!side) addRect(rects, 'muscle', secondary, 18, 12, 2, 5);
  } else if (cosmetics.physique.overallMassId === 'compact-density') {
    addRect(rects, 'muscle', secondary, 9, 13, 6, 3);
  }

  if (pronounced(cosmetics.physique.shoulderEmphasisId)) {
    if (family === 'winged') {
      addRect(rects, 'muscle', primary, 2, 8, 5, 2);
      if (!side) addRect(rects, 'muscle', primary, 17, 8, 5, 2);
    } else if (family === 'shell') {
      addRect(rects, 'muscle', primary, 4, 12, 4, 2);
      if (!side) addRect(rects, 'muscle', primary, 16, 12, 4, 2);
    } else {
      addRect(rects, 'muscle', primary, side ? 4 : 3, 9, 4, 3);
      if (!side) addRect(rects, 'muscle', primary, 17, 9, 4, 3);
    }
  }
  if (pronounced(cosmetics.physique.chestEmphasisId)) {
    if (family === 'shell' || family === 'armored') {
      addRect(rects, 'muscle', secondary, side ? 8 : 7, 10, side ? 5 : 10, 2);
    } else if (family === 'winged') {
      addRect(rects, 'muscle', secondary, 10, 9, 4, 5);
    } else {
      addRect(rects, 'muscle', secondary, side ? 8 : 7, back ? 11 : 10, side ? 5 : 10, 3);
    }
  }
  if (pronounced(cosmetics.physique.backEmphasisId)) {
    const y = back ? 9 : 11;
    if (family === 'serpentine') {
      addRect(rects, 'muscle', secondary, 10, 8, 4, 9);
    } else {
      addRect(rects, 'muscle', secondary, side ? 6 : 5, y, 4, 5);
      if (!side) addRect(rects, 'muscle', secondary, 15, y, 4, 5);
    }
  }
  if (pronounced(cosmetics.physique.armEmphasisId)) {
    const longLimbs = family === 'primate' || family === 'many-limbed';
    addRect(rects, 'muscle', primary, side ? 2 : longLimbs ? 2 : 4, 12, longLimbs ? 4 : 3, longLimbs ? 6 : 4);
    if (!side) addRect(rects, 'muscle', primary, longLimbs ? 18 : 17, 12 + naturalOffset, longLimbs ? 4 : 3, longLimbs ? 6 : 4);
    if (family === 'many-limbed') {
      addRect(rects, 'muscle', primary, 4, 8, 3, 3);
      addRect(rects, 'muscle', primary, 17, 8, 3, 3);
    }
  }
  if (pronounced(cosmetics.physique.coreEmphasisId)) {
    if (family === 'shell') {
      addRect(rects, 'muscle', secondary, 7, 12, 10, 4);
      addRect(rects, 'marking', accent, 11, 12, 2, 4);
    } else if (family === 'serpentine') {
      addRect(rects, 'muscle', primary, 10, 10, 4, 8);
    } else {
      addRect(rects, 'muscle', secondary, side ? 9 : 8, 12, side ? 5 : 8, 5);
    }
  }
  if (pronounced(cosmetics.physique.legEmphasisId)) {
    const spread =
      cosmetics.physique.stanceId === 'wide'
        ? 1
        : cosmetics.physique.stanceId === 'narrow'
          ? -1
          : 0;
    addRect(rects, 'muscle', primary, side ? 7 : 6 - spread, 16, 4, 5);
    if (!side) addRect(rects, 'muscle', primary, 14 + spread, 16 + naturalOffset, 4, 5);
  }
  if (cosmetics.physique.pumpEffectId === 'full') {
    addRect(rects, 'effect', accent, 5, 11, 2, 1);
    addRect(rects, 'effect', accent, 17, 11, 2, 1);
    addRect(rects, 'effect', accent, 10, 15, 4, 1);
  }
}

function drawPattern(
  rects: BuddyPixelRect[],
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
) {
  const color = getBuddyPaletteHex(
    cosmetics.accentPaletteId,
    species.palette.accent,
  );
  if (cosmetics.patternId === 'pattern-center-stripe') {
    addRect(rects, 'marking', color, 11, 7, 2, 9);
  } else if (cosmetics.patternId === 'pattern-shoulder-bands') {
    addRect(rects, 'marking', color, 6, 10, 4, 1);
    addRect(rects, 'marking', color, 14, 10, 4, 1);
  } else if (cosmetics.patternId === 'pattern-speckle') {
    addRect(rects, 'marking', color, 8, 9, 1, 1);
    addRect(rects, 'marking', color, 14, 12, 1, 1);
    addRect(rects, 'marking', color, 10, 16, 1, 1);
  } else if (cosmetics.patternId === 'pattern-training-scars') {
    addRect(rects, 'marking', color, 7, 11, 3, 1);
    addRect(rects, 'marking', color, 15, 14, 2, 1);
  } else if (cosmetics.patternId === 'pattern-strength-lines') {
    addRect(rects, 'marking', color, 6, 9, 3, 1);
    addRect(rects, 'marking', color, 15, 9, 3, 1);
    addRect(rects, 'marking', color, 11, 13, 2, 3);
  }
}

function drawAppendageVariation(
  rects: BuddyPixelRect[],
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  direction: BuddyFacingDirection,
) {
  const design = getBuddyCharacterDesign(species.id);
  if (cosmetics.appendageVariantId === design.appendageOptions[0]?.id) return;
  const color = getBuddyPaletteHex(
    cosmetics.accentPaletteId,
    species.palette.accent,
  );
  const side = direction === 'left' ? 4 : 18;
  addRect(rects, 'appendage', color, side, 7, 2, 3);
  addRect(rects, 'appendage', color, BUDDY_PIXEL_WIDTH - side - 2, 8, 2, 2);
}

function drawAccessories(
  rects: BuddyPixelRect[],
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  direction: BuddyFacingDirection,
) {
  const family = getBuddyCharacterDesign(
    species.id,
  ).anatomyProfile.renderFamily;
  const side = direction === 'left' || direction === 'right';
  const color = getBuddyPaletteHex(
    cosmetics.accentPaletteId,
    species.palette.accent,
  );
  for (const accessoryId of cosmetics.accessoryIds) {
    if (accessoryId === 'accessory-gloves') {
      const x = family === 'winged' ? 2 : family === 'primate' ? 3 : 4;
      const y = family === 'shell' ? 16 : 15;
      addRect(rects, 'accessory', color, side ? x + 1 : x, y, 3, 2);
      if (!side) addRect(rects, 'accessory', color, 21 - x, y, 3, 2);
    } else if (accessoryId === 'accessory-wraps') {
      const x = family === 'many-limbed' ? 4 : 5;
      addRect(rects, 'accessory', color, x, 14, 3, 1);
      if (!side) addRect(rects, 'accessory', color, 21 - x, 14, 3, 1);
      if (family === 'many-limbed') {
        addRect(rects, 'accessory', color, 5, 10, 2, 1);
        addRect(rects, 'accessory', color, 17, 10, 2, 1);
      }
    } else if (accessoryId === 'accessory-belt') {
      addRect(
        rects,
        'accessory',
        color,
        family === 'serpentine' ? 9 : 7,
        family === 'shell' ? 17 : 16,
        family === 'serpentine' ? 6 : 10,
        1,
      );
    } else if (accessoryId === 'accessory-chain') {
      addRect(rects, 'accessory', color, 9, 11, 1, 1);
      addRect(rects, 'accessory', color, 10, 12, 4, 1);
      addRect(rects, 'accessory', color, 14, 11, 1, 1);
    } else if (accessoryId === 'accessory-headband') {
      addRect(rects, 'accessory', color, 8, 7, 8, 1);
    } else if (accessoryId === 'accessory-elbow-sleeves') {
      addRect(rects, 'accessory', color, side ? 5 : 4, 12, 3, 2);
      if (!side) addRect(rects, 'accessory', color, 17, 12, 3, 2);
    } else if (accessoryId === 'accessory-knee-sleeves') {
      if (family === 'serpentine') {
        addRect(rects, 'accessory', color, 9, 18, 6, 1);
      } else {
        addRect(rects, 'accessory', color, side ? 8 : 7, 17, 3, 2);
        if (!side) addRect(rects, 'accessory', color, 14, 17, 3, 2);
      }
    } else if (accessoryId === 'accessory-victory-medal') {
      addRect(rects, 'accessory', color, 11, 12, 2, 3);
    } else if (accessoryId === 'accessory-champion-ribbon') {
      addRect(rects, 'accessory', color, 18, 9, 2, 5);
    }
  }
}

function drawExpression(
  rects: BuddyPixelRect[],
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  direction: BuddyFacingDirection,
) {
  if (direction === 'back') return;
  const color =
    cosmetics.expressionId === 'fierce'
      ? getBuddyPaletteHex(
          cosmetics.accentPaletteId,
          species.palette.accent,
        )
      : '#101b24';
  const eyeY =
    cosmetics.expressionId === 'sleepy' || cosmetics.expressionId === 'focused'
      ? 10
      : 9;
  addRect(rects, 'face', color, 9, eyeY, 1, 1);
  addRect(rects, 'face', color, 14, eyeY, 1, 1);
  if (
    cosmetics.expressionId === 'cheerful' ||
    cosmetics.expressionId === 'playful'
  ) {
    addRect(rects, 'face', color, 11, 12, 3, 1);
  }
}

function drawPose(
  rects: BuddyPixelRect[],
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  pose: BuddyPose,
  animationCueId?: string,
) {
  const family = getBuddyCharacterDesign(
    species.id,
  ).anatomyProfile.renderFamily;
  const color = getBuddyPaletteHex(
    cosmetics.primaryPaletteId,
    species.palette.skin,
  );
  if (
    pose === 'victory' ||
    pose === 'front-flex' ||
    pose === 'back-flex' ||
    pose === 'side-pose'
  ) {
    const cue = animationCueId ?? cosmetics.victoryPoseId;
    const variant = stableCueVariant(cue);
    if (variant === 0) {
      addRect(rects, 'effect', color, 3, 8, 4, 2);
      addRect(rects, 'effect', color, 17, 8, 4, 2);
    } else if (variant === 1) {
      addRect(rects, 'effect', color, 4, 17, 5, 2);
      addRect(rects, 'effect', '#ffe07a', 17, 19, 3, 1);
    } else {
      addRect(rects, 'effect', color, 7, 4, 3, 5);
      addRect(rects, 'effect', color, 14, 4, 3, 5);
      addRect(rects, 'effect', '#d9ffe8', 3, 18, 2, 1);
      addRect(rects, 'effect', '#d9ffe8', 19, 18, 2, 1);
    }
    if (pose === 'front-flex') {
      if (family === 'winged') {
        addRect(rects, 'effect', color, 1, 7, 5, 1);
        addRect(rects, 'effect', color, 18, 7, 5, 1);
      } else if (family === 'shell') {
        addRect(rects, 'effect', color, 4, 14, 4, 2);
        addRect(rects, 'effect', color, 16, 14, 4, 2);
      }
    } else if (pose === 'back-flex') {
      addRect(rects, 'effect', color, 5, 9, 4, 1);
      addRect(rects, 'effect', color, 15, 9, 4, 1);
    } else if (pose === 'side-pose') {
      addRect(
        rects,
        'effect',
        color,
        family === 'serpentine' ? 9 : 5,
        13,
        family === 'serpentine' ? 7 : 5,
        2,
      );
    }
  } else if (pose === 'training' || pose === 'capture') {
    addRect(rects, 'effect', color, 2, 13, 5, 2);
  } else if (pose === 'fatigue') {
    addRect(rects, 'effect', '#91a7ad', 18, 5, 1, 1);
    addRect(rects, 'effect', '#91a7ad', 20, 3, 1, 1);
  } else if (
    pose === 'entrance' ||
    pose === 'boss-entrance' ||
    pose === 'rare-entrance'
  ) {
    const cue = animationCueId ?? cosmetics.entranceAnimationId;
    const variant = stableCueVariant(cue);
    const effect = getBuddyPaletteHex(
      cosmetics.accentPaletteId,
      species.palette.accent,
    );
    if (variant === 0) {
      addRect(rects, 'effect', effect, 2, 19, 3, 1);
      addRect(rects, 'effect', effect, 19, 19, 3, 1);
    } else if (variant === 1) {
      addRect(rects, 'effect', effect, 5, 20, 14, 1);
      addRect(rects, 'effect', effect, 11, 2, 2, 3);
    } else {
      addRect(rects, 'effect', effect, 3, 8, 2, 1);
      addRect(rects, 'effect', effect, 5, 6, 2, 1);
      addRect(rects, 'effect', effect, 19, 14, 2, 1);
      addRect(rects, 'effect', effect, 17, 16, 2, 1);
    }
    if (pose === 'boss-entrance') {
      addRect(rects, 'effect', effect, 1, 20, 22, 1);
      addRect(rects, 'effect', '#ffe07a', 11, 1, 2, 2);
    } else if (pose === 'rare-entrance') {
      addRect(rects, 'effect', '#d9ffe8', 2, 5, 2, 2);
      addRect(rects, 'effect', '#d9ffe8', 20, 7, 2, 2);
      addRect(rects, 'effect', '#ffe07a', 18, 3, 1, 1);
    }
  }
  if (cosmetics.rareTraitId === 'rare-glow-lines') {
    addRect(rects, 'effect', '#d9ffe8', 11, 6, 2, 10);
  } else if (cosmetics.rareTraitId === 'rare-metallic-tip') {
    addRect(rects, 'effect', '#d5e0e2', 4, 7, 2, 2);
    addRect(rects, 'effect', '#d5e0e2', 18, 7, 2, 2);
  } else if (cosmetics.rareTraitId === 'rare-star-mark') {
    addRect(rects, 'effect', '#ffe07a', 11, 10, 2, 2);
  }
}

function stableCueVariant(id: string) {
  let hash = 0;
  for (const character of id) {
    hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  }
  return hash % 3;
}

function createFrame(
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  direction: BuddyFacingDirection,
  pose: BuddyPose,
  animationFrame: number,
  animationCueId?: string,
): BuddyPixelFrame {
  const rects: BuddyPixelRect[] = [];
  addRect(rects, 'shadow', '#101b24', 5, 21, 14, 2);
  drawBaseSilhouette(
    rects,
    species,
    cosmetics,
    direction,
    pose,
    animationFrame,
  );
  drawStrengthSilhouette(rects, species, cosmetics, direction, pose);
  drawRegionalPhysique(rects, species, cosmetics, direction);
  drawMuscleDefinition(rects, species, cosmetics, direction);
  drawPattern(rects, species, cosmetics);
  drawAppendageVariation(rects, species, cosmetics, direction);
  drawAccessories(rects, species, cosmetics, direction);
  drawExpression(rects, species, cosmetics, direction);
  drawPose(rects, species, cosmetics, pose, animationCueId);
  return {
    width: BUDDY_PIXEL_WIDTH,
    height: BUDDY_PIXEL_HEIGHT,
    rects,
  };
}

export function renderBuddyPixelFrame(
  species: BuddySpecies,
  value?: Partial<BuddyCosmetics> | null,
  direction: BuddyFacingDirection = 'front',
  pose: BuddyPose = 'idle',
  animationFrame = 0,
  animationCueId?: string,
) {
  const cosmetics = normalizeBuddyCosmetics(species.id, value);
  const key = JSON.stringify([
    species.id,
    cosmetics,
    direction,
    pose,
    animationFrame % 2,
    animationCueId,
  ]);
  const cached = frameCache.get(key);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  const frame = createFrame(
    species,
    cosmetics,
    direction,
    pose,
    animationFrame % 2,
    animationCueId,
  );
  if (frameCache.size >= BUDDY_FRAME_CACHE_LIMIT) {
    const oldestKey = frameCache.keys().next().value;
    if (oldestKey) frameCache.delete(oldestKey);
  }
  frameCache.set(key, frame);
  return frame;
}

export function drawBuddyFrameToCanvas(
  context: CanvasRenderingContext2D,
  frame: BuddyPixelFrame,
  options: {
    clear?: boolean;
    layers?: ReadonlySet<BuddyPixelLayer>;
  } = {},
) {
  context.imageSmoothingEnabled = false;
  if (options.clear !== false) {
    context.clearRect(0, 0, frame.width, frame.height);
  }
  for (const rect of frame.rects) {
    if (options.layers && !options.layers.has(rect.layer)) continue;
    context.fillStyle = rect.color;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
  }
}

export function buddyFrameSignature(frame: BuddyPixelFrame) {
  return frame.rects
    .map(
      (rect) =>
        `${rect.layer}:${rect.x},${rect.y},${rect.width},${rect.height},${rect.color}`,
    )
    .join('|');
}

export function resetBuddyPixelFrameCache() {
  frameCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}

export function getBuddyPixelFrameCacheStats() {
  return {
    entries: frameCache.size,
    hits: cacheHits,
    misses: cacheMisses,
    limit: BUDDY_FRAME_CACHE_LIMIT,
  };
}
