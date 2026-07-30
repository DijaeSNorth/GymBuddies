import {
  getBuddyCharacterDesign,
  getBuddyPaletteHex,
} from '../content/buddyCharacters';
import { normalizeBuddyCosmetics } from '../systems/buddyCosmetics';
import type { BuddyCosmetics, BuddySpecies } from '../types';

export type BuddyPresentationIdentityReceipt = Readonly<{
  speciesId: string;
  primaryPaletteId: string;
  secondaryPaletteId: string;
  accentPaletteId: string;
  patternId: string;
  appendageVariantId: string;
  accessoryIds: readonly string[];
  rareTraitId: string;
  expressionId: string;
  physiquePresetId: string;
  bodySizeId: string;
  muscleDefinitionId: string;
  pumpEffectId: string;
  identityKey: string;
}>;

export function createBuddyPresentationIdentityReceipt(
  speciesId: string,
  value?: Partial<BuddyCosmetics> | null,
): BuddyPresentationIdentityReceipt {
  const cosmetics = normalizeBuddyCosmetics(speciesId, value);
  const stableParts = [
    speciesId,
    cosmetics.primaryPaletteId,
    cosmetics.secondaryPaletteId,
    cosmetics.accentPaletteId,
    cosmetics.patternId,
    cosmetics.appendageVariantId,
    ...[...cosmetics.accessoryIds].sort(),
    cosmetics.rareTraitId,
    cosmetics.expressionId,
    cosmetics.physiquePresetId,
    cosmetics.bodySizeId,
    cosmetics.muscleDefinitionId,
    cosmetics.physique.pumpEffectId,
  ];
  return {
    speciesId,
    primaryPaletteId: cosmetics.primaryPaletteId,
    secondaryPaletteId: cosmetics.secondaryPaletteId,
    accentPaletteId: cosmetics.accentPaletteId,
    patternId: cosmetics.patternId,
    appendageVariantId: cosmetics.appendageVariantId,
    accessoryIds: [...cosmetics.accessoryIds],
    rareTraitId: cosmetics.rareTraitId,
    expressionId: cosmetics.expressionId,
    physiquePresetId: cosmetics.physiquePresetId,
    bodySizeId: cosmetics.bodySizeId,
    muscleDefinitionId: cosmetics.muscleDefinitionId,
    pumpEffectId: cosmetics.physique.pumpEffectId,
    identityKey: stableParts.join('|'),
  };
}

function stableIndex(value: string, modulo: number) {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0) % modulo;
}

function drawPattern(
  context: CanvasRenderingContext2D,
  receipt: BuddyPresentationIdentityReceipt,
  size: number,
  accent: string,
) {
  if (receipt.patternId.includes('none') || size < 32) return;
  context.fillStyle = accent;
  const offset = stableIndex(receipt.patternId, 3);
  if (receipt.patternId.includes('stripe')) {
    context.fillRect(
      Math.floor(size * 0.42) + offset,
      Math.floor(size * 0.42),
      Math.max(1, Math.floor(size / 32)),
      Math.floor(size * 0.2),
    );
    return;
  }
  const pixel = Math.max(1, Math.floor(size / 32));
  context.fillRect(
    Math.floor(size * 0.38) + offset,
    Math.floor(size * 0.47),
    pixel,
    pixel,
  );
  context.fillRect(
    Math.floor(size * 0.57) - offset,
    Math.floor(size * 0.53),
    pixel,
    pixel,
  );
}

function drawAppendageVariant(
  context: CanvasRenderingContext2D,
  species: BuddySpecies,
  receipt: BuddyPresentationIdentityReceipt,
  size: number,
  accent: string,
) {
  const design = getBuddyCharacterDesign(species.id);
  const unit = Math.max(1, Math.floor(size / 32));
  const variant = stableIndex(receipt.appendageVariantId, 3);
  context.fillStyle = accent;
  switch (design.anatomyProfile.renderFamily) {
    case 'winged':
      context.fillRect(
        Math.floor(size * 0.18),
        Math.floor(size * (0.34 + variant * 0.02)),
        unit * 3,
        unit,
      );
      context.fillRect(
        Math.floor(size * 0.72),
        Math.floor(size * (0.34 + variant * 0.02)),
        unit * 3,
        unit,
      );
      break;
    case 'shell':
    case 'armored':
      context.fillRect(
        Math.floor(size * 0.29),
        Math.floor(size * (0.31 + variant * 0.02)),
        unit * 2,
        unit,
      );
      context.fillRect(
        Math.floor(size * 0.65),
        Math.floor(size * (0.31 + variant * 0.02)),
        unit * 2,
        unit,
      );
      break;
    case 'quadruped':
    case 'runner':
      context.fillRect(
        Math.floor(size * 0.3),
        Math.floor(size * (0.2 + variant * 0.015)),
        unit,
        unit * 2,
      );
      context.fillRect(
        Math.floor(size * 0.66),
        Math.floor(size * (0.2 + variant * 0.015)),
        unit,
        unit * 2,
      );
      break;
    default:
      context.fillRect(
        Math.floor(size * 0.47),
        Math.floor(size * (0.13 + variant * 0.02)),
        unit * 2,
        unit,
      );
  }
}

function drawAccessories(
  context: CanvasRenderingContext2D,
  receipt: BuddyPresentationIdentityReceipt,
  size: number,
  accent: string,
) {
  const unit = Math.max(1, Math.floor(size / 32));
  context.fillStyle = accent;
  receipt.accessoryIds.forEach((id) => {
    if (id.includes('none')) return;
    if (id.includes('head') || id.includes('band')) {
      context.fillRect(
        Math.floor(size * 0.4),
        Math.floor(size * 0.24),
        Math.floor(size * 0.2),
        unit,
      );
    } else if (id.includes('belt') || id.includes('waist')) {
      context.fillRect(
        Math.floor(size * 0.36),
        Math.floor(size * 0.62),
        Math.floor(size * 0.28),
        unit,
      );
    } else if (id.includes('knee')) {
      context.fillRect(
        Math.floor(size * 0.37),
        Math.floor(size * 0.77),
        unit * 2,
        unit,
      );
      context.fillRect(
        Math.floor(size * 0.59),
        Math.floor(size * 0.77),
        unit * 2,
        unit,
      );
    } else {
      context.fillRect(
        Math.floor(size * 0.22),
        Math.floor(size * 0.51),
        unit * 2,
        unit,
      );
      context.fillRect(
        Math.floor(size * 0.72),
        Math.floor(size * 0.51),
        unit * 2,
        unit,
      );
    }
  });
}

export function drawBuddyPresentationIdentityOverlays(
  context: CanvasRenderingContext2D,
  species: BuddySpecies,
  value: Partial<BuddyCosmetics> | null | undefined,
  width: number,
  height: number,
) {
  const cosmetics = normalizeBuddyCosmetics(species.id, value);
  const receipt = createBuddyPresentationIdentityReceipt(
    species.id,
    cosmetics,
  );
  const size = Math.min(width, height);
  const accent = getBuddyPaletteHex(
    cosmetics.accentPaletteId,
    species.palette.accent,
  );
  context.save();
  context.imageSmoothingEnabled = false;
  drawPattern(context, receipt, size, accent);
  drawAppendageVariant(context, species, receipt, size, accent);
  drawAccessories(context, receipt, size, accent);

  if (receipt.rareTraitId !== 'rare-none') {
    context.fillStyle = accent;
    const unit = Math.max(1, Math.floor(size / 32));
    context.fillRect(unit * 2, Math.floor(size * 0.45), unit, unit);
    context.fillRect(size - unit * 3, Math.floor(size * 0.38), unit, unit);
  }
  if (receipt.pumpEffectId !== 'none') {
    context.globalAlpha =
      receipt.pumpEffectId === 'full' ? 0.9 : 0.55;
    context.fillStyle = species.palette.detail;
    const unit = Math.max(1, Math.floor(size / 32));
    context.fillRect(
      Math.floor(size * 0.3),
      Math.floor(size * 0.4),
      unit * 2,
      unit,
    );
    context.fillRect(
      Math.floor(size * 0.65),
      Math.floor(size * 0.4),
      unit * 2,
      unit,
    );
  }
  context.restore();
  return receipt;
}
