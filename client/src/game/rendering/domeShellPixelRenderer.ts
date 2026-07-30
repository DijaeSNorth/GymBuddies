import {
  createBatch03PresentationPlan,
  getBatch03AnatomyProfile,
  PLASTRONG_DOME_LAYER_IDS,
  type PlastrongDomeLayerId,
} from '../assets/domeShellModules';
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

export type DomeShellPixelLayers = Readonly<
  Record<PlastrongDomeLayerId, readonly BuddyPixelRect[]>
>;

type MutableLayers = Record<PlastrongDomeLayerId, BuddyPixelRect[]>;

function emptyLayers(): MutableLayers {
  return Object.fromEntries(
    PLASTRONG_DOME_LAYER_IDS.map((layerId) => [layerId, []]),
  ) as unknown as MutableLayers;
}

function add(
  layers: MutableLayers,
  layerId: PlastrongDomeLayerId,
  color: string,
  x: number,
  y: number,
  width = 1,
  height = 1,
) {
  const left = Math.max(1, Math.round(x));
  const top = Math.max(1, Math.round(y));
  const right = Math.min(23, Math.round(x + width));
  const bottom = Math.min(22, Math.round(y + height));
  if (right <= left || bottom <= top) return;
  layers[layerId].push({
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    color,
    layer: layerId.includes('effect') ||
      layerId === 'pump-highlights'
      ? 'effect'
      : 'muscle',
  });
}

function palette(species: BuddySpecies, cosmetics: BuddyCosmetics) {
  return {
    outline: '#101b24',
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

function drawPlastrong(
  layers: MutableLayers,
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  direction: BuddyFacingDirection,
  pose: BuddyPose,
) {
  const plan = createBatch03PresentationPlan(species.id, cosmetics)!;
  const colors = palette(species, cosmetics);
  const geometry = plan.geometry;
  const side = direction === 'left' || direction === 'right';
  const fatigue = pose === 'fatigue' ? 1 : 0;
  const stance = geometry.stanceWidth >= 1.1 ? 1 : 0;
  const limb = geometry.limbThickness >= 1.12 ? 3 : 2;
  const shellWidth =
    geometry.shellWidth >= 1.07
      ? 18
      : geometry.shellWidth <= 0.95
        ? 15
        : 16;
  const shellLeft = Math.floor((24 - shellWidth) / 2);

  if (side) {
    const facing = direction === 'left' ? -1 : 1;
    add(layers, 'upper-dome', colors.outline, 4, 7 + fatigue, 16, 8);
    add(layers, 'upper-dome', colors.secondary, 5, 8 + fatigue, 14, 6);
    add(layers, 'upper-dome', colors.primary, 7, 6 + fatigue, 10, 2);
    add(layers, 'front-plastron', colors.accent, 8, 13 + fatigue, 8, 2);
    add(
      layers,
      'neck-opening',
      colors.outline,
      facing < 0 ? 4 : 18,
      9 + fatigue,
      2,
      3,
    );
    add(
      layers,
      'flexible-joint-tissue',
      colors.primary,
      facing < 0 ? 2 : 19,
      8 + fatigue,
      3,
      4,
    );
    add(
      layers,
      'exposed-limb-musculature',
      colors.primary,
      4,
      14 + fatigue,
      limb + 1,
      6 - fatigue,
    );
    add(
      layers,
      'exposed-limb-musculature',
      colors.primary,
      17 - limb,
      15 + fatigue,
      limb + 1,
      5 - fatigue,
    );
    add(layers, 'shoulder-openings', colors.detail, 5, 11 + fatigue, 2, 1);
    add(layers, 'hip-openings', colors.detail, 16, 13 + fatigue, 2, 1);
    add(layers, 'shell-seams', colors.accent, 9, 8 + fatigue, 1, 5);
    add(layers, 'shell-seams', colors.accent, 14, 8 + fatigue, 1, 5);
  } else {
    add(
      layers,
      'upper-dome',
      colors.outline,
      shellLeft,
      6 + fatigue,
      shellWidth,
      10,
    );
    add(
      layers,
      'upper-dome',
      colors.secondary,
      shellLeft + 1,
      7 + fatigue,
      shellWidth - 2,
      8,
    );
    add(
      layers,
      'upper-dome',
      colors.primary,
      shellLeft + 3,
      5 + fatigue,
      shellWidth - 6,
      3,
    );
    if (direction === 'front') {
      const gap = geometry.plastronSpacing >= 1.08 ? 2 : 1;
      add(layers, 'front-plastron', colors.outline, 8, 10 + fatigue, 8, 6);
      add(layers, 'front-plastron', colors.accent, 9, 11 + fatigue, 3, 4);
      add(
        layers,
        'front-plastron',
        colors.accent,
        12 + gap,
        11 + fatigue,
        3 - Math.max(0, gap - 1),
        4,
      );
      add(layers, 'shell-seams', colors.accent, 8, 8 + fatigue, 8, 1);
      add(layers, 'shell-seams', colors.accent, 11, 7 + fatigue, 2, 3);
    } else {
      add(layers, 'shell-seams', colors.accent, 8, 9 + fatigue, 8, 1);
      add(layers, 'shell-seams', colors.accent, 11, 7 + fatigue, 2, 7);
    }
    add(layers, 'neck-opening', colors.outline, 9, 4 + fatigue, 6, 4);
    add(
      layers,
      'flexible-joint-tissue',
      colors.primary,
      geometry.neckThickness >= 1.1 ? 9 : 10,
      3 + fatigue,
      geometry.neckThickness >= 1.1 ? 6 : 4,
      4,
    );
    const opening = geometry.shoulderOpeningWidth >= 1.1 ? 3 : 2;
    add(
      layers,
      'shoulder-openings',
      colors.outline,
      shellLeft,
      10 + fatigue,
      opening,
      4,
    );
    add(
      layers,
      'shoulder-openings',
      colors.outline,
      shellLeft + shellWidth - opening,
      10 + fatigue,
      opening,
      4,
    );
    add(
      layers,
      'exposed-limb-musculature',
      colors.primary,
      3 - stance,
      12 + fatigue,
      limb + 1,
      6 - fatigue,
    );
    add(
      layers,
      'exposed-limb-musculature',
      colors.primary,
      20 + stance - limb,
      12 + fatigue,
      limb + 1,
      6 - fatigue,
    );
    add(
      layers,
      'exposed-limb-musculature',
      colors.primary,
      7 - stance,
      16 + fatigue,
      limb + 1,
      5 - fatigue,
    );
    add(
      layers,
      'exposed-limb-musculature',
      colors.primary,
      16 + stance - limb,
      16 + fatigue,
      limb + 1,
      5 - fatigue,
    );
    add(layers, 'hip-openings', colors.outline, 7, 14 + fatigue, 3, 2);
    add(layers, 'hip-openings', colors.outline, 14, 14 + fatigue, 3, 2);
  }

  add(layers, 'equipment-mounts', colors.detail, 6, 14 + fatigue, 2, 1);
  add(layers, 'equipment-mounts', colors.detail, 16, 14 + fatigue, 2, 1);
  if (plan.pumpIntensity > 0) {
    add(layers, 'pump-highlights', colors.detail, 4, 14 + fatigue, 2, 1);
    add(layers, 'pump-highlights', colors.detail, 18, 14 + fatigue, 2, 1);
    add(layers, 'pump-highlights', colors.detail, 11, 7 + fatigue, 2, 1);
  }
  if (cosmetics.rareTraitId !== 'rare-none') {
    add(layers, 'rare-trait-effects', colors.accent, 2, 7, 1, 1);
    add(layers, 'rare-trait-effects', colors.accent, 21, 6, 1, 1);
  }
}

function drawCompanion(
  layers: MutableLayers,
  species: BuddySpecies,
  cosmetics: BuddyCosmetics,
  direction: BuddyFacingDirection,
  pose: BuddyPose,
) {
  const plan = createBatch03PresentationPlan(species.id, cosmetics)!;
  const colors = palette(species, cosmetics);
  const side = direction === 'left' || direction === 'right';
  const fatigue = pose === 'fatigue' ? 1 : 0;
  const width = plan.geometry.shellWidth >= 1.07 ? 18 : 16;
  const left = Math.floor((24 - width) / 2);
  const limb = plan.geometry.limbThickness >= 1.12 ? 3 : 2;

  if (species.id === 'ripped-rhino') {
    add(layers, 'upper-dome', colors.outline, left, 7 + fatigue, width, 8);
    add(layers, 'upper-dome', colors.secondary, left + 1, 8 + fatigue, width - 2, 6);
    add(layers, 'flexible-joint-tissue', colors.primary, 4, 12 + fatigue, 3, 3);
    add(layers, 'flexible-joint-tissue', colors.primary, 17, 12 + fatigue, 3, 3);
    add(layers, 'exposed-limb-musculature', colors.primary, 3, 14 + fatigue, limb + 1, 6 - fatigue);
    add(layers, 'exposed-limb-musculature', colors.primary, 20 - limb, 14 + fatigue, limb + 1, 6 - fatigue);
    if (!side && direction === 'front') {
      add(layers, 'rare-trait-effects', colors.detail, 11, 2 + fatigue, 2, 5);
    } else if (side) {
      add(
        layers,
        'rare-trait-effects',
        colors.detail,
        direction === 'left' ? 2 : 19,
        7 + fatigue,
        3,
        1,
      );
    }
  } else {
    add(layers, 'upper-dome', colors.outline, left, 6 + fatigue, width, 10);
    add(layers, 'upper-dome', colors.secondary, left + 1, 7 + fatigue, width - 2, 8);
    add(layers, 'shell-seams', colors.accent, 8, 8 + fatigue, 8, 1);
    add(layers, 'shell-seams', colors.accent, 10, 10 + fatigue, 4, 1);
    add(layers, 'flexible-joint-tissue', colors.primary, 5, 13 + fatigue, 3, 2);
    add(layers, 'flexible-joint-tissue', colors.primary, 16, 13 + fatigue, 3, 2);
    add(layers, 'exposed-limb-musculature', colors.primary, 4, 15 + fatigue, limb + 1, 5 - fatigue);
    add(layers, 'exposed-limb-musculature', colors.primary, 19 - limb, 15 + fatigue, limb + 1, 5 - fatigue);
    add(layers, 'exposed-limb-musculature', colors.primary, 8, 15 + fatigue, limb, 6 - fatigue);
    add(layers, 'exposed-limb-musculature', colors.primary, 14, 15 + fatigue, limb, 6 - fatigue);
  }
  add(layers, 'equipment-mounts', colors.detail, 7, 13 + fatigue, 2, 1);
  add(layers, 'equipment-mounts', colors.detail, 15, 13 + fatigue, 2, 1);
  if (plan.pumpIntensity > 0) {
    add(layers, 'pump-highlights', colors.detail, 4, 16 + fatigue, 2, 1);
    add(layers, 'pump-highlights', colors.detail, 18, 16 + fatigue, 2, 1);
  }
}

export function renderDomeShellPixelLayers(
  species: BuddySpecies,
  value: Partial<BuddyCosmetics> | null | undefined,
  direction: BuddyFacingDirection,
  pose: BuddyPose,
): DomeShellPixelLayers | undefined {
  if (!getBatch03AnatomyProfile(species.id)) return undefined;
  const cosmetics = normalizeBuddyCosmetics(species.id, value);
  const layers = emptyLayers();
  if (species.id === 'titan-tortoise') {
    drawPlastrong(layers, species, cosmetics, direction, pose);
  } else {
    drawCompanion(layers, species, cosmetics, direction, pose);
  }
  return layers;
}

export function renderDomeShellPixelOverlay(
  species: BuddySpecies,
  value: Partial<BuddyCosmetics> | null | undefined,
  direction: BuddyFacingDirection,
  pose: BuddyPose,
): BuddyPixelFrame | undefined {
  const layers = renderDomeShellPixelLayers(
    species,
    value,
    direction,
    pose,
  );
  if (!layers) return undefined;
  return {
    width: 24,
    height: 24,
    rects: PLASTRONG_DOME_LAYER_IDS.flatMap(
      (layerId) => layers[layerId],
    ),
  };
}
