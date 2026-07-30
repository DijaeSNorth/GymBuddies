import {
  BATCH_02_BOSS_TIER_RULES,
  getBatch02AnatomyProfile,
  type Batch02PhysiqueKind,
} from '../assets/armoredHeavyModules';
import { getBuddyPaletteHex } from '../content/buddyCharacters';
import { normalizeBuddyCosmetics } from '../systems/buddyCosmetics';
import type {
  BossPresentationTier,
  BuddyCosmetics,
  BuddySpecies,
} from '../types';

function presetKind(presetId: string): Batch02PhysiqueKind {
  if (presetId.endsWith('-compact')) return 'compact';
  if (presetId.endsWith('-balanced')) return 'balanced';
  if (presetId.endsWith('-broad')) return 'broad';
  if (presetId.endsWith('-specialized')) return 'specialized';
  return 'species-specific';
}

export type ArmoredHeavyPresentationPlan = Readonly<{
  speciesId: string;
  presetKind: Batch02PhysiqueKind;
  rigidArmorScale: 1;
  shellWidth: number;
  limbThickness: number;
  stanceWidth: number;
  plateSpacing: number;
  exposedMuscle: number;
  pumpChangesRigidArmor: false;
  pumpSeamIntensity: number;
  fatigueUsesDamageMarks: false;
  bossTierId?: string;
}>;

export function createArmoredHeavyPresentationPlan(
  speciesId: string,
  value?: Partial<BuddyCosmetics> | null,
  bossTier?: BossPresentationTier,
): ArmoredHeavyPresentationPlan | undefined {
  const profile = getBatch02AnatomyProfile(speciesId);
  if (!profile) return undefined;
  const cosmetics = normalizeBuddyCosmetics(speciesId, value);
  const kind = presetKind(cosmetics.physiquePresetId);
  const geometry = profile.presetGeometry[kind];
  const pumpSeamIntensity =
    cosmetics.physique.pumpEffectId === 'full'
      ? 2
      : cosmetics.physique.pumpEffectId === 'warm'
        ? 1
        : 0;
  return {
    speciesId,
    presetKind: kind,
    rigidArmorScale: 1,
    shellWidth: geometry.shellWidth,
    limbThickness: geometry.limbThickness,
    stanceWidth: geometry.stanceWidth,
    plateSpacing: geometry.plateSpacing,
    exposedMuscle: geometry.exposedMuscle,
    pumpChangesRigidArmor: false,
    pumpSeamIntensity,
    fatigueUsesDamageMarks: false,
    bossTierId: bossTier
      ? BATCH_02_BOSS_TIER_RULES[bossTier].id
      : undefined,
  };
}

export function drawArmoredHeavyPresentationOverlays(
  context: CanvasRenderingContext2D,
  species: BuddySpecies,
  value: Partial<BuddyCosmetics> | null | undefined,
  width: number,
  height: number,
  bossTier?: BossPresentationTier,
) {
  const plan = createArmoredHeavyPresentationPlan(
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
  const size = Math.min(width, height);
  const unit = Math.max(1, Math.floor(size / 32));
  const center = Math.floor(width / 2);
  context.save();
  context.imageSmoothingEnabled = false;

  if (species.id === 'ripped-rhino') {
    context.fillStyle = accent;
    const seamY = Math.floor(height * 0.43);
    const seamInset =
      plan.presetKind === 'compact'
        ? unit * 2
        : plan.presetKind === 'broad'
          ? -unit
          : 0;
    context.fillRect(
      Math.floor(width * 0.3) + seamInset,
      seamY,
      unit * 3,
      unit,
    );
    context.fillRect(
      Math.floor(width * 0.64) - seamInset,
      seamY,
      unit * 3,
      unit,
    );
    if (
      plan.presetKind === 'broad' ||
      plan.presetKind === 'species-specific'
    ) {
      context.fillRect(
        Math.floor(width * 0.2),
        Math.floor(height * 0.39),
        unit * 2,
        unit * 2,
      );
      context.fillRect(
        Math.floor(width * 0.75),
        Math.floor(height * 0.39),
        unit * 2,
        unit * 2,
      );
    }
    if (
      plan.presetKind === 'specialized' ||
      plan.presetKind === 'species-specific'
    ) {
      context.fillStyle = species.palette.detail;
      context.fillRect(
        Math.floor(width * 0.23),
        Math.floor(height * 0.57),
        unit * 2,
        unit,
      );
      context.fillRect(
        Math.floor(width * 0.72),
        Math.floor(height * 0.57),
        unit * 2,
        unit,
      );
    }
    if (plan.pumpSeamIntensity > 0) {
      context.globalAlpha =
        plan.pumpSeamIntensity === 2 ? 0.9 : 0.55;
      context.fillStyle = species.palette.detail;
      context.fillRect(center - unit * 3, seamY + unit * 2, unit * 2, unit);
      context.fillRect(center + unit, seamY + unit * 2, unit * 2, unit);
      context.globalAlpha = 1;
    }
  } else if (species.id === 'spotmole') {
    context.fillStyle = accent;
    const wrapWidth =
      plan.limbThickness > 1.1 ? unit * 3 : unit * 2;
    context.fillRect(
      Math.floor(width * 0.18),
      Math.floor(height * 0.57),
      wrapWidth,
      unit,
    );
    context.fillRect(
      Math.floor(width * 0.77) - wrapWidth,
      Math.floor(height * 0.57),
      wrapWidth,
      unit,
    );
  } else {
    context.fillStyle = accent;
    const wrapWidth =
      plan.limbThickness > 1.1 ? unit * 3 : unit * 2;
    context.fillRect(
      Math.floor(width * 0.13),
      Math.floor(height * 0.76),
      wrapWidth,
      unit,
    );
    context.fillRect(
      Math.floor(width * 0.82),
      Math.floor(height * 0.76),
      wrapWidth,
      unit,
    );
  }

  if (bossTier) {
    const tierRule = BATCH_02_BOSS_TIER_RULES[bossTier];
    const tierColor =
      bossTier === 'overload' || bossTier === 'final-round'
        ? '#ef6a5b'
        : accent;
    context.globalAlpha =
      bossTier === 'defeated'
        ? 0.35
        : Math.min(1, 0.35 + tierRule.seamEnergy * 0.2);
    context.fillStyle = tierColor;
    context.fillRect(
      center - unit * 5,
      Math.floor(height * 0.34),
      unit * 2,
      unit,
    );
    context.fillRect(
      center + unit * 3,
      Math.floor(height * 0.34),
      unit * 2,
      unit,
    );
  }
  context.restore();
  return plan;
}
