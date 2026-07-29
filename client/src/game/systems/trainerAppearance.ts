import {
  DEFAULT_TRAINER_APPEARANCE,
  MAX_SAVED_APPEARANCE_PRESETS,
  TRAINER_APPEARANCE_OPTION_GROUPS,
  TRAINER_APPEARANCE_VERSION,
  TRAINER_BUILD_ATTRIBUTES,
  TRAINER_BUILD_MAX,
  TRAINER_BUILD_MIN,
  TRAINER_COLOR_OPTIONS,
  TRAINER_SKIN_TONES,
  cloneTrainerAppearance,
} from '../content/trainerAppearance';
import type {
  TrainerAppearance,
  TrainerAppearancePreset,
  TrainerBuildAttributeId,
  TrainerColorAppearance,
  TrainerFaceAppearance,
  TrainerHairAppearance,
  TrainerOutfitAppearance,
  TrainerAccessoryAppearance,
} from '../types';
import { clamp } from './math';

type UnknownRecord = Record<string, unknown>;

export type TrainerAppearanceNormalizationResult = {
  appearance: TrainerAppearance;
  issues: string[];
};

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function knownId(
  value: unknown,
  options: readonly { id: string }[],
  fallback: string,
  issues: string[],
  label: string,
) {
  if (
    typeof value === 'string' &&
    options.some((option) => option.id === value)
  ) {
    return value;
  }
  if (value !== undefined) {
    issues.push(`${label} option was unavailable and was replaced.`);
  }
  return fallback;
}

function normalizeObjectIds<T extends Record<string, string>>(
  raw: unknown,
  fallback: T,
  groups: { [K in keyof T]: readonly { id: string }[] },
  issues: string[],
  prefix: string,
): T {
  const source = isRecord(raw) ? raw : {};
  return Object.fromEntries(
    (Object.keys(fallback) as Array<keyof T>).map((key) => [
      key,
      knownId(
        source[String(key)],
        groups[key],
        fallback[key],
        issues,
        `${prefix} ${String(key)}`,
      ),
    ]),
  ) as T;
}

export function normalizeTrainerAppearance(
  raw: unknown,
  fallback = DEFAULT_TRAINER_APPEARANCE,
): TrainerAppearanceNormalizationResult {
  const issues: string[] = [];
  const source = isRecord(raw) ? raw : {};
  if (!isRecord(raw)) {
    issues.push('Trainer cosmetic appearance was missing; restored defaults.');
  }
  const rawBuild = isRecord(source.build) ? source.build : {};
  const build = Object.fromEntries(
    TRAINER_BUILD_ATTRIBUTES.map((attribute) => {
      const value = rawBuild[attribute.id];
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        if (value !== undefined) {
          issues.push(`${attribute.label} appearance value was repaired.`);
        }
        return [attribute.id, fallback.build[attribute.id]];
      }
      return [
        attribute.id,
        clamp(Math.round(value), TRAINER_BUILD_MIN, TRAINER_BUILD_MAX),
      ];
    }),
  ) as TrainerAppearance['build'];

  const face = normalizeObjectIds<TrainerFaceAppearance>(
    source.face,
    fallback.face,
    {
      shapeId: TRAINER_APPEARANCE_OPTION_GROUPS.faceShapes,
      eyesId: TRAINER_APPEARANCE_OPTION_GROUPS.eyes,
      eyebrowsId: TRAINER_APPEARANCE_OPTION_GROUPS.eyebrows,
      noseId: TRAINER_APPEARANCE_OPTION_GROUPS.noses,
      mouthId: TRAINER_APPEARANCE_OPTION_GROUPS.mouths,
      earsId: TRAINER_APPEARANCE_OPTION_GROUPS.ears,
      facialHairId: TRAINER_APPEARANCE_OPTION_GROUPS.facialHair,
      scarId: TRAINER_APPEARANCE_OPTION_GROUPS.scars,
      frecklesId: TRAINER_APPEARANCE_OPTION_GROUPS.freckles,
      tattooId: TRAINER_APPEARANCE_OPTION_GROUPS.tattoos,
      facePaintId: TRAINER_APPEARANCE_OPTION_GROUPS.facePaint,
    },
    issues,
    'Face',
  );
  const hair = normalizeObjectIds<TrainerHairAppearance>(
    source.hair,
    fallback.hair,
    {
      styleId: TRAINER_APPEARANCE_OPTION_GROUPS.hairStyles,
      lengthId: TRAINER_APPEARANCE_OPTION_GROUPS.hairLengths,
      colorId: TRAINER_COLOR_OPTIONS,
      highlightColorId: TRAINER_COLOR_OPTIONS,
    },
    issues,
    'Hair',
  );
  if (hair.styleId === 'bald') hair.lengthId = 'none';

  const outfit = normalizeObjectIds<TrainerOutfitAppearance>(
    source.outfit,
    fallback.outfit,
    {
      topId: TRAINER_APPEARANCE_OPTION_GROUPS.tops,
      bottomsId: TRAINER_APPEARANCE_OPTION_GROUPS.bottoms,
      shoesId: TRAINER_APPEARANCE_OPTION_GROUPS.shoes,
      socksId: TRAINER_APPEARANCE_OPTION_GROUPS.socks,
      glovesId: TRAINER_APPEARANCE_OPTION_GROUPS.gloves,
      wristWrapsId: TRAINER_APPEARANCE_OPTION_GROUPS.wristWraps,
      elbowSleevesId: TRAINER_APPEARANCE_OPTION_GROUPS.elbowSleeves,
      kneeSleevesId: TRAINER_APPEARANCE_OPTION_GROUPS.kneeSleeves,
    },
    issues,
    'Outfit',
  );
  const colors = normalizeObjectIds<TrainerColorAppearance>(
    source.colors,
    fallback.colors,
    {
      skinToneId: TRAINER_SKIN_TONES,
      topPrimaryId: TRAINER_COLOR_OPTIONS,
      topSecondaryId: TRAINER_COLOR_OPTIONS,
      topAccentId: TRAINER_COLOR_OPTIONS,
      bottomPrimaryId: TRAINER_COLOR_OPTIONS,
      bottomSecondaryId: TRAINER_COLOR_OPTIONS,
      shoePrimaryId: TRAINER_COLOR_OPTIONS,
      shoeAccentId: TRAINER_COLOR_OPTIONS,
      accessoryPrimaryId: TRAINER_COLOR_OPTIONS,
      accessoryAccentId: TRAINER_COLOR_OPTIONS,
    },
    issues,
    'Color',
  );
  const accessories = normalizeObjectIds<TrainerAccessoryAppearance>(
    source.accessories,
    fallback.accessories,
    {
      headwearId: TRAINER_APPEARANCE_OPTION_GROUPS.headwear,
      beltId: TRAINER_APPEARANCE_OPTION_GROUPS.belts,
      gymBagId: TRAINER_APPEARANCE_OPTION_GROUPS.gymBags,
      jewelryId: TRAINER_APPEARANCE_OPTION_GROUPS.jewelry,
      fantasyId: TRAINER_APPEARANCE_OPTION_GROUPS.fantasy,
    },
    issues,
    'Accessory',
  );

  return {
    appearance: {
      version: TRAINER_APPEARANCE_VERSION,
      build,
      face,
      hair,
      outfit,
      colors,
      accessories,
    },
    issues,
  };
}

export function validateTrainerAppearance(appearance: TrainerAppearance) {
  return normalizeTrainerAppearance(
    appearance,
    DEFAULT_TRAINER_APPEARANCE,
  ).issues;
}

export function cloneTrainerAppearancePresets(
  presets: readonly TrainerAppearancePreset[],
): TrainerAppearancePreset[] {
  return presets.map((preset) => ({
    ...preset,
    appearance: cloneTrainerAppearance(preset.appearance),
  }));
}

export function normalizeTrainerAppearancePresets(
  raw: unknown,
): { presets: TrainerAppearancePreset[]; issues: string[] } {
  if (!Array.isArray(raw)) return { presets: [], issues: [] };
  const issues: string[] = [];
  const usedIds = new Set<string>();
  const presets = raw.slice(0, MAX_SAVED_APPEARANCE_PRESETS).flatMap(
    (entry, index) => {
      if (!isRecord(entry)) {
        issues.push(`Appearance preset ${index + 1} was invalid and was skipped.`);
        return [];
      }
      const safeId =
        typeof entry.id === 'string' &&
        /^[a-z0-9][a-z0-9._-]{0,47}$/i.test(entry.id) &&
        !usedIds.has(entry.id)
          ? entry.id
          : `recovered-preset-${index + 1}`;
      usedIds.add(safeId);
      const name =
        typeof entry.name === 'string' && entry.name.trim()
          ? entry.name.trim().slice(0, 24)
          : `Saved Look ${index + 1}`;
      const normalized = normalizeTrainerAppearance(entry.appearance);
      issues.push(...normalized.issues.map((issue) => `${name}: ${issue}`));
      return [{ id: safeId, name, appearance: normalized.appearance }];
    },
  );
  if (raw.length > MAX_SAVED_APPEARANCE_PRESETS) {
    issues.push(
      `Only the first ${MAX_SAVED_APPEARANCE_PRESETS} appearance presets were kept.`,
    );
  }
  return { presets, issues };
}

function nextRandom(seed: number) {
  const nextSeed = (Math.imul(seed >>> 0, 1664525) + 1013904223) >>> 0;
  return { seed: nextSeed, value: nextSeed / 0x1_0000_0000 };
}

function pick<T>(values: readonly T[], state: { seed: number }) {
  const next = nextRandom(state.seed);
  state.seed = next.seed;
  return values[Math.floor(next.value * values.length)]!;
}

export function randomizeTrainerAppearance(
  seed: number,
): TrainerAppearance {
  const state = { seed: seed >>> 0 || 0x47594d42 };
  const build = Object.fromEntries(
    TRAINER_BUILD_ATTRIBUTES.map((attribute) => [
      attribute.id,
      2 + Math.floor(pick([0, 1, 2, 3, 4, 5, 6, 7, 8], state)),
    ]),
  ) as TrainerAppearance['build'];
  // Every randomized result remains intentionally athletic and muscular.
  build.shoulderWidth = Math.max(5, build.shoulderWidth);
  build.chestSize = Math.max(5, build.chestSize);
  build.bicepsSize = Math.max(5, build.bicepsSize);
  build.tricepsSize = Math.max(5, build.tricepsSize);
  build.quadSize = Math.max(5, build.quadSize);
  build.bodyMass = Math.max(3, build.bodyMass);

  const appearance: TrainerAppearance = {
    version: TRAINER_APPEARANCE_VERSION,
    build,
    face: {
      shapeId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.faceShapes, state).id,
      eyesId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.eyes, state).id,
      eyebrowsId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.eyebrows, state).id,
      noseId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.noses, state).id,
      mouthId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.mouths, state).id,
      earsId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.ears, state).id,
      facialHairId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.facialHair, state).id,
      scarId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.scars, state).id,
      frecklesId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.freckles, state).id,
      tattooId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.tattoos, state).id,
      facePaintId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.facePaint, state).id,
    },
    hair: {
      styleId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.hairStyles, state).id,
      lengthId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.hairLengths, state).id,
      colorId: pick(TRAINER_COLOR_OPTIONS, state).id,
      highlightColorId: pick(TRAINER_COLOR_OPTIONS, state).id,
    },
    outfit: {
      topId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.tops, state).id,
      bottomsId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.bottoms, state).id,
      shoesId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.shoes, state).id,
      socksId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.socks, state).id,
      glovesId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.gloves, state).id,
      wristWrapsId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.wristWraps, state).id,
      elbowSleevesId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.elbowSleeves, state).id,
      kneeSleevesId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.kneeSleeves, state).id,
    },
    colors: {
      skinToneId: pick(TRAINER_SKIN_TONES, state).id,
      topPrimaryId: pick(TRAINER_COLOR_OPTIONS, state).id,
      topSecondaryId: pick(TRAINER_COLOR_OPTIONS, state).id,
      topAccentId: pick(TRAINER_COLOR_OPTIONS, state).id,
      bottomPrimaryId: pick(TRAINER_COLOR_OPTIONS, state).id,
      bottomSecondaryId: pick(TRAINER_COLOR_OPTIONS, state).id,
      shoePrimaryId: pick(TRAINER_COLOR_OPTIONS, state).id,
      shoeAccentId: pick(TRAINER_COLOR_OPTIONS, state).id,
      accessoryPrimaryId: pick(TRAINER_COLOR_OPTIONS, state).id,
      accessoryAccentId: pick(TRAINER_COLOR_OPTIONS, state).id,
    },
    accessories: {
      headwearId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.headwear, state).id,
      beltId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.belts, state).id,
      gymBagId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.gymBags, state).id,
      jewelryId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.jewelry, state).id,
      fantasyId: pick(TRAINER_APPEARANCE_OPTION_GROUPS.fantasy, state).id,
    },
  };
  if (appearance.hair.styleId === 'bald') appearance.hair.lengthId = 'none';
  return appearance;
}

export function updateTrainerBuildValue(
  appearance: TrainerAppearance,
  key: TrainerBuildAttributeId,
  value: number,
): TrainerAppearance {
  return {
    ...appearance,
    build: {
      ...appearance.build,
      [key]: clamp(
        Math.round(Number.isFinite(value) ? value : appearance.build[key]),
        TRAINER_BUILD_MIN,
        TRAINER_BUILD_MAX,
      ),
    },
  };
}
