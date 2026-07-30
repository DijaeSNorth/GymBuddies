import { getBuddyPaletteHex } from '../content/buddyCharacters';
import { normalizeBuddyCosmetics } from '../systems/buddyCosmetics';
import type {
  BuddyCosmetics,
  BuddyFacingDirection,
  BuddyPose,
  BuddySpecies,
} from '../types';
import type {
  BuddyPixelFrame,
  BuddyPixelRect,
} from './buddyPixelRenderer';

const PILOT_SPECIES_IDS = new Set([
  'brawny-bear',
  'iron-wolf',
  'prismantle',
]);

function add(
  rects: BuddyPixelRect[],
  color: string,
  x: number,
  y: number,
  width = 1,
  height = 1,
) {
  if (x < 1 || y < 1 || x + width > 23 || y + height > 22) return;
  rects.push({ x, y, width, height, color, layer: 'muscle' });
}

function emphasis(value: string) {
  return value === 'pronounced' ? 2 : value === 'restrained' ? 0 : 1;
}

function poseY(pose: BuddyPose, animationFrame: number) {
  if (pose === 'fatigue') return 1;
  if (
    (pose === 'boss-entrance' ||
      pose === 'rare-entrance' ||
      pose === 'entrance') &&
    animationFrame % 2 === 1
  ) {
    return -1;
  }
  return 0;
}

function paletteFor(species: BuddySpecies, cosmetics: BuddyCosmetics) {
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
  };
}

function presetKind(presetId: string) {
  if (presetId.endsWith('-compact')) return 'compact';
  if (presetId.endsWith('-balanced')) return 'balanced';
  if (presetId.endsWith('-broad')) return 'broad';
  if (presetId.endsWith('-specialized')) return 'specialized';
  return 'species';
}

function drawBramblift(
  rects: BuddyPixelRect[],
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  direction: BuddyFacingDirection,
  pose: BuddyPose,
  animationFrame: number,
) {
  const colors = paletteFor(species, cosmetics);
  const side = direction === 'left' || direction === 'right';
  const back = direction === 'back';
  const y = poseY(pose, animationFrame);
  const mass =
    cosmetics.physique.overallMassId === 'heavy-mass'
      ? 2
      : cosmetics.physique.overallMassId === 'compact-density'
        ? 0
        : 1;
  const shoulder = emphasis(cosmetics.physique.shoulderEmphasisId);
  const arms = emphasis(cosmetics.physique.armEmphasisId);
  const legs = emphasis(cosmetics.physique.legEmphasisId);
  const kind = presetKind(cosmetics.physiquePresetId);

  if (side) {
    const facing = direction === 'right' ? -1 : 1;
    add(rects, colors.primary, facing > 0 ? 15 : 7, 10 + y, 2 + mass, 3);
    add(rects, colors.secondary, facing > 0 ? 8 : 14, 11 + y, 2, 5);
    if (shoulder > 0) {
      add(rects, colors.primary, facing > 0 ? 14 : 8, 9 + y, 2, 2);
    }
    if (arms > 1) {
      add(rects, colors.primary, facing > 0 ? 17 : 5, 13 + y, 2, 3);
    }
  } else {
    const shoulderX = 4 - Math.min(1, shoulder);
    const shoulderWidth = 3 + mass + Math.min(1, shoulder);
    add(rects, colors.primary, shoulderX, 10 + y, shoulderWidth, 3);
    add(
      rects,
      colors.primary,
      24 - shoulderX - shoulderWidth,
      10 + y,
      shoulderWidth,
      3,
    );
    if (arms > 0) {
      add(rects, colors.primary, 3 - Math.min(1, arms - 1), 13 + y, 3, 4);
      add(rects, colors.primary, 18 + Math.min(1, arms - 1), 13 + y, 3, 4);
    }
    add(rects, colors.secondary, back ? 8 : 9, 11 + y, back ? 8 : 6, 2);
    if (legs > 0) {
      add(rects, colors.primary, 7, 17 + y, 3 + Math.min(1, legs), 3);
      add(
        rects,
        colors.primary,
        14 - Math.min(1, legs),
        17 + y,
        3 + Math.min(1, legs),
        3,
      );
    }
  }

  if (kind === 'compact') add(rects, colors.secondary, 9, 15 + y, 6, 2);
  if (kind === 'balanced') add(rects, colors.accent, 11, 13 + y, 2, 1);
  if (kind === 'broad') {
    add(rects, colors.primary, 2, 12 + y, 2, 2);
    add(rects, colors.primary, 20, 12 + y, 2, 2);
  }
  if (kind === 'specialized') {
    add(rects, colors.accent, side ? 16 : 4, 14 + y, 2, 1);
    if (!side) add(rects, colors.accent, 18, 14 + y, 2, 1);
  }
  if (kind === 'species') {
    add(rects, colors.accent, side ? 15 : 3, 15 + y, 2, 2);
    if (!side) add(rects, colors.accent, 19, 15 + y, 2, 2);
  }
}

function drawRivetjack(
  rects: BuddyPixelRect[],
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  direction: BuddyFacingDirection,
  pose: BuddyPose,
  animationFrame: number,
) {
  const colors = paletteFor(species, cosmetics);
  const side = direction === 'left' || direction === 'right';
  const back = direction === 'back';
  const y = poseY(pose, animationFrame);
  const backSize = emphasis(cosmetics.physique.backEmphasisId);
  const shoulder = emphasis(cosmetics.physique.shoulderEmphasisId);
  const legs = emphasis(cosmetics.physique.legEmphasisId);
  const kind = presetKind(cosmetics.physiquePresetId);

  if (side) {
    const facingLeft = direction === 'left';
    const shoulderX = facingLeft ? 7 : 14;
    add(rects, colors.primary, shoulderX, 10 + y, 3, 2 + shoulder);
    add(rects, colors.secondary, facingLeft ? 10 : 8, 11 + y, 6, 2);
    if (backSize > 0) {
      add(rects, colors.secondary, facingLeft ? 11 : 9, 9 + y, 5, 2);
    }
    add(rects, colors.primary, facingLeft ? 13 : 8, 16 + y, 2, 3 + legs);
  } else {
    add(rects, colors.primary, 6 - Math.min(1, shoulder), 10 + y, 3, 3);
    add(
      rects,
      colors.primary,
      15 + Math.min(1, shoulder),
      10 + y,
      3,
      3,
    );
    add(rects, colors.secondary, 8 - Math.min(1, backSize), 10 + y, 8 + backSize, 3);
    if (back) add(rects, colors.primary, 11, 9 + y, 2, 6);
    if (legs > 0) {
      add(rects, colors.primary, 7, 17 + y, 3, 3);
      add(rects, colors.primary, 14, 17 + y, 3, 3);
    }
  }

  if (kind === 'compact') add(rects, colors.secondary, 10, 15 + y, 4, 2);
  if (kind === 'balanced') add(rects, colors.accent, 11, 13 + y, 2, 1);
  if (kind === 'broad') {
    add(rects, colors.primary, side ? 6 : 5, 12 + y, 2, 2);
    if (!side) add(rects, colors.primary, 17, 12 + y, 2, 2);
  }
  if (kind === 'specialized') {
    add(rects, colors.accent, side ? 9 : 8, 10 + y, 3, 1);
    if (!side) add(rects, colors.accent, 13, 10 + y, 3, 1);
  }
  if (kind === 'species') {
    add(rects, colors.accent, side ? 13 : 7, 18 + y, 2, 1);
    if (!side) add(rects, colors.accent, 15, 18 + y, 2, 1);
  }
}

function drawPrismantle(
  rects: BuddyPixelRect[],
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  direction: BuddyFacingDirection,
  pose: BuddyPose,
  animationFrame: number,
) {
  const colors = paletteFor(species, cosmetics);
  const side = direction === 'left' || direction === 'right';
  const back = direction === 'back';
  const y = poseY(pose, animationFrame);
  const fins = emphasis(cosmetics.physique.shoulderEmphasisId);
  const facet = emphasis(cosmetics.physique.coreEmphasisId);
  const spread = emphasis(cosmetics.physique.backEmphasisId);
  const kind = presetKind(cosmetics.physiquePresetId);

  if (side) {
    const facingLeft = direction === 'left';
    add(rects, colors.secondary, facingLeft ? 8 : 13, 9 + y, 3, 7);
    add(rects, colors.primary, facingLeft ? 6 : 16, 11 + y, 2 + fins, 2);
    if (spread > 0) {
      add(rects, colors.primary, facingLeft ? 15 : 7, 8 + y, 2, 5);
    }
    add(rects, colors.accent, facingLeft ? 10 : 12, 10 + y, 2, 4 + facet);
  } else {
    const wingWidth = 2 + fins;
    add(rects, colors.primary, 4 - Math.min(1, spread), 9 + y, wingWidth, 5);
    add(
      rects,
      colors.primary,
      20 - wingWidth + Math.min(1, spread),
      9 + y,
      wingWidth,
      5,
    );
    add(rects, colors.secondary, 8, 8 + y, 8, 8);
    add(rects, colors.accent, 10, 9 + y, 4, 5 + facet);
    if (back) add(rects, colors.primary, 11, 6 + y, 2, 3);
  }

  if (kind === 'compact') add(rects, colors.secondary, 9, 15 + y, 6, 2);
  if (kind === 'balanced') add(rects, colors.accent, 11, 12 + y, 2, 2);
  if (kind === 'broad') {
    add(rects, colors.primary, 3, 11 + y, 2, 2);
    add(rects, colors.primary, 19, 11 + y, 2, 2);
  }
  if (kind === 'specialized') {
    add(rects, colors.accent, direction === 'right' ? 17 : 5, 8 + y, 2, 1);
  }
  if (kind === 'species') {
    add(rects, colors.accent, direction === 'right' ? 18 : 4, 7 + y, 2, 2);
    add(rects, colors.accent, direction === 'right' ? 5 : 17, 14 + y, 1, 2);
  }
}

export function renderPilotBuddyPhysiqueOverlay(
  species: BuddySpecies,
  value: Partial<BuddyCosmetics> | null | undefined,
  direction: BuddyFacingDirection,
  pose: BuddyPose,
  animationFrame: number,
): BuddyPixelFrame | undefined {
  if (!PILOT_SPECIES_IDS.has(species.id)) return undefined;
  const cosmetics = normalizeBuddyCosmetics(species.id, value);
  const rects: BuddyPixelRect[] = [];
  if (species.id === 'brawny-bear') {
    drawBramblift(rects, species, cosmetics, direction, pose, animationFrame);
  } else if (species.id === 'iron-wolf') {
    drawRivetjack(rects, species, cosmetics, direction, pose, animationFrame);
  } else {
    drawPrismantle(rects, species, cosmetics, direction, pose, animationFrame);
  }
  return { width: 24, height: 24, rects };
}
