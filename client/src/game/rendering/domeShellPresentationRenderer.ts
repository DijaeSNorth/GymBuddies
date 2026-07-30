import {
  BATCH_03_BOSS_TIER_RULES,
  createBatch03PresentationPlan,
} from '../assets/domeShellModules';
import { getBuddyPaletteHex } from '../content/buddyCharacters';
import { normalizeBuddyCosmetics } from '../systems/buddyCosmetics';
import type {
  BossPresentationTier,
  BuddyCosmetics,
  BuddySpecies,
} from '../types';

export function drawDomeShellPresentationOverlays(
  context: CanvasRenderingContext2D,
  species: BuddySpecies,
  value: Partial<BuddyCosmetics> | null | undefined,
  width: number,
  height: number,
  bossTier?: BossPresentationTier,
) {
  const plan = createBatch03PresentationPlan(
    species.id,
    value,
    bossTier,
  );
  if (!plan) return undefined;
  const cosmetics = normalizeBuddyCosmetics(species.id, value);
  const accent = getBuddyPaletteHex(
    cosmetics.accentPaletteId,
    species.palette.accent,
  );
  const unit = Math.max(1, Math.floor(Math.min(width, height) / 32));
  const center = Math.floor(width / 2);
  const seamY = Math.floor(height * 0.39);
  context.save();
  context.imageSmoothingEnabled = false;

  if (species.id === 'titan-tortoise') {
    context.fillStyle = accent;
    context.fillRect(
      Math.floor(width * 0.3),
      seamY,
      unit * 3,
      unit,
    );
    context.fillRect(
      Math.floor(width * 0.62),
      seamY,
      unit * 3,
      unit,
    );
    context.fillStyle = species.palette.detail;
    const openingWidth =
      plan.geometry.shoulderOpeningWidth >= 1.1
        ? unit * 3
        : unit * 2;
    context.fillRect(
      Math.floor(width * 0.18),
      Math.floor(height * 0.51),
      openingWidth,
      unit,
    );
    context.fillRect(
      width - Math.floor(width * 0.18) - openingWidth,
      Math.floor(height * 0.51),
      openingWidth,
      unit,
    );
    if (plan.pumpIntensity > 0) {
      context.globalAlpha = plan.pumpIntensity === 2 ? 0.9 : 0.55;
      context.fillRect(
        Math.floor(width * 0.16),
        Math.floor(height * 0.64),
        unit * 3,
        unit,
      );
      context.fillRect(
        Math.floor(width * 0.73),
        Math.floor(height * 0.64),
        unit * 3,
        unit,
      );
      context.fillRect(center - unit, seamY - unit * 2, unit * 2, unit);
    }
  } else {
    context.fillStyle = accent;
    context.fillRect(
      Math.floor(width * 0.25),
      seamY,
      unit * 3,
      unit,
    );
    context.fillRect(
      Math.floor(width * 0.66),
      seamY,
      unit * 3,
      unit,
    );
  }

  if (bossTier) {
    const tier = BATCH_03_BOSS_TIER_RULES[bossTier];
    context.globalAlpha =
      bossTier === 'defeated'
        ? 0.3
        : Math.min(1, 0.35 + tier.seamLight * 0.15);
    context.fillStyle =
      bossTier === 'overload' || bossTier === 'final-round'
        ? '#ef6a5b'
        : accent;
    context.fillRect(
      center - unit * 5,
      seamY - unit,
      unit * 3,
      unit,
    );
    context.fillRect(
      center + unit * 2,
      seamY - unit,
      unit * 3,
      unit,
    );
  }
  context.restore();
  return plan;
}
