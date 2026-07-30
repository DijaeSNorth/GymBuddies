import { getBatch02AnatomyProfile } from '../assets/armoredHeavyModules';
import { getBuddyPaletteHex } from '../content/buddyCharacters';
import { normalizeBuddyCosmetics } from '../systems/buddyCosmetics';
import type {
  BuddyCosmetics,
  BuddyFacingDirection,
  BuddyPose,
  BuddySpecies,
} from '../types';
import type { BuddyPixelFrame, BuddyPixelRect } from './buddyPixelRenderer';

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

function presetKind(presetId: string) {
  if (presetId.endsWith('-compact')) return 'compact';
  if (presetId.endsWith('-balanced')) return 'balanced';
  if (presetId.endsWith('-broad')) return 'broad';
  if (presetId.endsWith('-specialized')) return 'specialized';
  return 'species-specific';
}

function palette(species: BuddySpecies, cosmetics: BuddyCosmetics) {
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
  };
}

function drawRailhorn(
  rects: BuddyPixelRect[],
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  direction: BuddyFacingDirection,
  pose: BuddyPose,
) {
  const colors = palette(species, cosmetics);
  const profile = getBatch02AnatomyProfile(species.id)!;
  const geometry = profile.presetGeometry[presetKind(cosmetics.physiquePresetId)];
  const side = direction === 'left' || direction === 'right';
  const fatigue = pose === 'fatigue' ? 1 : 0;
  const kind = presetKind(cosmetics.physiquePresetId);
  const plateWidth = geometry.shellWidth > 1.07 ? 10 : geometry.shellWidth < 0.96 ? 8 : 9;
  const stance = geometry.stanceWidth > 1.08 ? 1 : 0;
  const limb = geometry.limbThickness > 1.08 ? 3 : 2;

  if (side) {
    add(rects, colors.secondary, 7, 8 + fatigue, plateWidth, 4);
    add(rects, colors.accent, 8, 10 + fatigue, plateWidth - 2, 1);
    add(rects, colors.primary, direction === 'left' ? 5 : 16, 11 + fatigue, limb, 6);
    add(rects, colors.primary, direction === 'left' ? 15 : 6, 12 + fatigue, limb, 5);
    add(rects, colors.detail, direction === 'left' ? 3 : 19, 6 + fatigue, 3, 1);
  } else {
    const plateX = Math.floor((24 - plateWidth) / 2);
    add(rects, colors.secondary, plateX, 8 + fatigue, plateWidth, 4);
    add(rects, colors.accent, plateX + 1, 10 + fatigue, plateWidth - 2, 1);
    add(rects, colors.secondary, 5 - stance, 10 + fatigue, 4, 3);
    add(rects, colors.secondary, 15 + stance, 10 + fatigue, 4, 3);
    add(rects, colors.primary, 4 - stance, 13 + fatigue, limb, 5);
    add(rects, colors.primary, 20 + stance - limb, 13 + fatigue, limb, 5);
    add(rects, colors.primary, 8 - stance, 17 + fatigue, 3, 4 - fatigue);
    add(rects, colors.primary, 13 + stance, 17 + fatigue, 3, 4 - fatigue);
    if (direction === 'back') {
      add(rects, colors.detail, plateX + 2, 9 + fatigue, plateWidth - 4, 1);
    } else {
      add(rects, colors.detail, 11, 2 + fatigue, 2, 4);
    }
  }
  if (kind === 'compact') {
    add(rects, colors.secondary, 9, 14 + fatigue, 6, 2);
  } else if (kind === 'balanced') {
    add(rects, colors.accent, 11, 12 + fatigue, 2, 1);
  } else if (kind === 'broad') {
    add(rects, colors.secondary, 2, 11 + fatigue, 2, 2);
    add(rects, colors.secondary, 20, 11 + fatigue, 2, 2);
  } else if (kind === 'specialized') {
    add(rects, colors.detail, 4, 15 + fatigue, 2, 1);
    add(rects, colors.detail, 18, 15 + fatigue, 2, 1);
  } else {
    add(rects, colors.accent, 9, 7 + fatigue, 6, 1);
  }
}

function drawSpotmole(
  rects: BuddyPixelRect[],
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  direction: BuddyFacingDirection,
  pose: BuddyPose,
) {
  const colors = palette(species, cosmetics);
  const profile = getBatch02AnatomyProfile(species.id)!;
  const geometry = profile.presetGeometry[presetKind(cosmetics.physiquePresetId)];
  const fatigue = pose === 'fatigue' ? 1 : 0;
  const kind = presetKind(cosmetics.physiquePresetId);
  const width = geometry.stanceWidth > 1.08 ? 16 : geometry.stanceWidth < 0.94 ? 12 : 14;
  const left = Math.floor((24 - width) / 2);
  add(rects, colors.primary, left, 9 + fatigue, width, 6);
  add(rects, colors.secondary, left + 1, 8 + fatigue, width - 2, 2);
  const hand = geometry.limbThickness > 1.1 ? 4 : 3;
  add(rects, colors.secondary, 2, 12 + fatigue, hand, 4);
  add(rects, colors.secondary, 22 - hand, 12 + fatigue, hand, 4);
  add(rects, colors.accent, 3, 14 + fatigue, hand - 1, 1);
  add(rects, colors.accent, 21 - hand, 14 + fatigue, hand - 1, 1);
  if (direction === 'back') {
    add(rects, colors.detail, 9, 10 + fatigue, 6, 1);
  }
  if (kind === 'compact') {
    add(rects, colors.primary, 9, 15 + fatigue, 6, 2);
  } else if (kind === 'balanced') {
    add(rects, colors.accent, 11, 12 + fatigue, 2, 1);
  } else if (kind === 'broad') {
    add(rects, colors.secondary, 1, 12 + fatigue, 2, 3);
    add(rects, colors.secondary, 21, 12 + fatigue, 2, 3);
  } else if (kind === 'specialized') {
    add(rects, colors.detail, 3, 11 + fatigue, 3, 1);
    add(rects, colors.detail, 18, 11 + fatigue, 3, 1);
  } else {
    add(rects, colors.accent, 8, 8 + fatigue, 8, 1);
  }
}

function drawKnuckledge(
  rects: BuddyPixelRect[],
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  direction: BuddyFacingDirection,
  pose: BuddyPose,
) {
  const colors = palette(species, cosmetics);
  const profile = getBatch02AnatomyProfile(species.id)!;
  const geometry = profile.presetGeometry[presetKind(cosmetics.physiquePresetId)];
  const fatigue = pose === 'fatigue' ? 1 : 0;
  const kind = presetKind(cosmetics.physiquePresetId);
  const shoulder = geometry.shellWidth > 1.05 ? 1 : 0;
  const armWidth = geometry.limbThickness > 1.08 ? 3 : 2;
  add(rects, colors.primary, 6 - shoulder, 8 + fatigue, 12 + shoulder * 2, 6);
  add(rects, colors.secondary, 8, 9 + fatigue, 8, 2);
  add(rects, colors.secondary, 3 - shoulder, 10 + fatigue, armWidth, 9);
  add(rects, colors.secondary, 21 + shoulder - armWidth, 10 + fatigue, armWidth, 9);
  add(rects, colors.primary, 2 - shoulder, 17 + fatigue, 4, 3);
  add(rects, colors.primary, 18 + shoulder, 17 + fatigue, 4, 3);
  add(rects, colors.accent, 2 - shoulder, 18 + fatigue, 3, 1);
  add(rects, colors.accent, 19 + shoulder, 18 + fatigue, 3, 1);
  if (direction === 'back') {
    add(rects, colors.detail, 9, 9 + fatigue, 6, 1);
  }
  if (kind === 'compact') {
    add(rects, colors.primary, 9, 14 + fatigue, 6, 2);
  } else if (kind === 'balanced') {
    add(rects, colors.accent, 11, 12 + fatigue, 2, 1);
  } else if (kind === 'broad') {
    add(rects, colors.primary, 4, 8 + fatigue, 2, 3);
    add(rects, colors.primary, 18, 8 + fatigue, 2, 3);
  } else if (kind === 'specialized') {
    add(rects, colors.detail, 2, 16 + fatigue, 4, 1);
    add(rects, colors.detail, 18, 16 + fatigue, 4, 1);
  } else {
    add(rects, colors.accent, 7, 8 + fatigue, 10, 1);
  }
}

export function renderArmoredHeavyPixelOverlay(
  species: BuddySpecies,
  value: Partial<BuddyCosmetics> | null | undefined,
  direction: BuddyFacingDirection,
  pose: BuddyPose,
): BuddyPixelFrame | undefined {
  if (!getBatch02AnatomyProfile(species.id)) return undefined;
  const cosmetics = normalizeBuddyCosmetics(species.id, value);
  const rects: BuddyPixelRect[] = [];
  if (species.id === 'ripped-rhino') {
    drawRailhorn(rects, species, cosmetics, direction, pose);
  } else if (species.id === 'spotmole') {
    drawSpotmole(rects, species, cosmetics, direction, pose);
  } else {
    drawKnuckledge(rects, species, cosmetics, direction, pose);
  }
  return { width: 24, height: 24, rects };
}
