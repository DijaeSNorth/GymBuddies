import {
  BUDDY_BODY_SIZE_OPTIONS,
  BUDDY_CHARACTER_DESIGN_BY_SPECIES_ID,
  BUDDY_DEFINITION_OPTIONS,
  BUDDY_EMPHASIS_OPTIONS,
  BUDDY_MASS_OPTIONS,
  BUDDY_PALETTE_COLORS,
  BUDDY_POSTURE_OPTIONS,
  BUDDY_PUMP_OPTIONS,
  BUDDY_STANCE_OPTIONS,
  BUDDY_SYMMETRY_OPTIONS,
  getBuddyCharacterDesign,
} from '../content/buddyCharacters';
import type {
  BuddyCharacterDesign,
  BuddyCosmetics,
  BuddySpecies,
  BuddyVisualOption,
} from '../types';
import {
  randomChoice,
  rollChance,
  type RandomState,
} from './random';

function hasOption(
  options: readonly BuddyVisualOption[],
  id: unknown,
): id is string {
  return typeof id === 'string' && options.some((entry) => entry.id === id);
}

function validPaletteId(id: unknown): id is string {
  return (
    typeof id === 'string' &&
    BUDDY_PALETTE_COLORS.some((entry) => entry.id === id)
  );
}

function validAccessoryIds(
  design: BuddyCharacterDesign,
  value: unknown,
) {
  if (!Array.isArray(value)) return [...design.defaultCosmetics.accessoryIds];
  const available = new Set(design.accessoryOptions.map((entry) => entry.id));
  const candidates = [
    ...new Set(
      value.filter(
        (entry): entry is string =>
          typeof entry === 'string' && available.has(entry),
      ),
    ),
  ];
  const usedSlots = new Set<string>();
  const normalized = candidates.filter((id) => {
    if (id === 'accessory-none') return candidates.length === 1;
    const slot = design.accessoryOptions.find((entry) => entry.id === id)?.slot;
    if (!slot || usedSlots.has(slot)) return false;
    usedSlots.add(slot);
    return true;
  }).slice(0, 4);
  return normalized.length > 0
    ? normalized
    : [...design.defaultCosmetics.accessoryIds];
}

export function cloneBuddyCosmetics(
  cosmetics: BuddyCosmetics,
): BuddyCosmetics {
  return {
    ...cosmetics,
    accessoryIds: [...cosmetics.accessoryIds],
    physique: { ...cosmetics.physique },
  };
}

export function normalizeBuddyCosmetics(
  speciesId: string,
  value?: Partial<BuddyCosmetics> | null,
): BuddyCosmetics {
  const design = getBuddyCharacterDesign(speciesId);
  const defaults = design.defaultCosmetics;
  const preset = design.physiquePresets.find(
    (entry) => entry.id === value?.physiquePresetId,
  ) ?? design.physiquePresets.find(
    (entry) => entry.id === defaults.physiquePresetId,
  )!;
  const sourcePhysique = value?.physique;
  const normalizePhysiqueOption = <
    T extends string
  >(
    options: readonly BuddyVisualOption[],
    valueId: unknown,
    fallback: T,
  ) => hasOption(options, valueId) ? valueId as T : fallback;
  return {
    version: 2,
    primaryPaletteId: validPaletteId(value?.primaryPaletteId)
      ? value.primaryPaletteId
      : defaults.primaryPaletteId,
    secondaryPaletteId: validPaletteId(value?.secondaryPaletteId)
      ? value.secondaryPaletteId
      : defaults.secondaryPaletteId,
    accentPaletteId: validPaletteId(value?.accentPaletteId)
      ? value.accentPaletteId
      : defaults.accentPaletteId,
    patternId: hasOption(design.patternOptions, value?.patternId)
      ? value.patternId
      : defaults.patternId,
    muscleDefinitionId: hasOption(
      BUDDY_DEFINITION_OPTIONS,
      value?.muscleDefinitionId,
    )
      ? value.muscleDefinitionId as BuddyCosmetics['muscleDefinitionId']
      : defaults.muscleDefinitionId,
    bodySizeId: hasOption(BUDDY_BODY_SIZE_OPTIONS, value?.bodySizeId)
      ? value.bodySizeId as BuddyCosmetics['bodySizeId']
      : defaults.bodySizeId,
    appendageVariantId: hasOption(
      design.appendageOptions,
      value?.appendageVariantId,
    )
      ? value.appendageVariantId
      : defaults.appendageVariantId,
    accessoryIds: validAccessoryIds(design, value?.accessoryIds),
    rareTraitId: hasOption(design.rareTraitOptions, value?.rareTraitId)
      ? value.rareTraitId
      : defaults.rareTraitId,
    expressionId: hasOption(design.expressionOptions, value?.expressionId)
      ? value.expressionId as BuddyCosmetics['expressionId']
      : defaults.expressionId,
    victoryPoseId: hasOption(
      design.victoryPoseOptions,
      value?.victoryPoseId,
    )
      ? value.victoryPoseId
      : defaults.victoryPoseId,
    entranceAnimationId: hasOption(
      design.entranceAnimationOptions,
      value?.entranceAnimationId,
    )
      ? value.entranceAnimationId
      : defaults.entranceAnimationId,
    physiquePresetId: preset.id,
    physique: {
      shoulderEmphasisId: normalizePhysiqueOption(
        BUDDY_EMPHASIS_OPTIONS,
        sourcePhysique?.shoulderEmphasisId,
        preset.physique.shoulderEmphasisId,
      ),
      chestEmphasisId: normalizePhysiqueOption(
        BUDDY_EMPHASIS_OPTIONS,
        sourcePhysique?.chestEmphasisId,
        preset.physique.chestEmphasisId,
      ),
      backEmphasisId: normalizePhysiqueOption(
        BUDDY_EMPHASIS_OPTIONS,
        sourcePhysique?.backEmphasisId,
        preset.physique.backEmphasisId,
      ),
      armEmphasisId: normalizePhysiqueOption(
        BUDDY_EMPHASIS_OPTIONS,
        sourcePhysique?.armEmphasisId,
        preset.physique.armEmphasisId,
      ),
      coreEmphasisId: normalizePhysiqueOption(
        BUDDY_EMPHASIS_OPTIONS,
        sourcePhysique?.coreEmphasisId,
        preset.physique.coreEmphasisId,
      ),
      legEmphasisId: normalizePhysiqueOption(
        BUDDY_EMPHASIS_OPTIONS,
        sourcePhysique?.legEmphasisId,
        preset.physique.legEmphasisId,
      ),
      overallMassId: normalizePhysiqueOption(
        BUDDY_MASS_OPTIONS,
        sourcePhysique?.overallMassId,
        preset.physique.overallMassId,
      ),
      symmetryId: normalizePhysiqueOption(
        BUDDY_SYMMETRY_OPTIONS,
        sourcePhysique?.symmetryId,
        preset.physique.symmetryId,
      ),
      stanceId: normalizePhysiqueOption(
        BUDDY_STANCE_OPTIONS,
        sourcePhysique?.stanceId,
        preset.physique.stanceId,
      ),
      postureId: normalizePhysiqueOption(
        BUDDY_POSTURE_OPTIONS,
        sourcePhysique?.postureId,
        preset.physique.postureId,
      ),
      pumpEffectId: normalizePhysiqueOption(
        BUDDY_PUMP_OPTIONS,
        sourcePhysique?.pumpEffectId,
        preset.physique.pumpEffectId,
      ),
    },
  };
}

function chooseOption(
  randomState: RandomState,
  options: readonly BuddyVisualOption[],
) {
  const result = randomChoice(randomState, options);
  return {
    id: result.value.id,
    randomState: result.randomState,
  };
}

function choosePalette(randomState: RandomState) {
  const result = randomChoice(randomState, BUDDY_PALETTE_COLORS);
  return {
    id: result.value.id,
    randomState: result.randomState,
  };
}

export function randomizeBuddyCosmetics(
  species: Pick<BuddySpecies, 'id'>,
  randomState: RandomState,
) {
  const design = getBuddyCharacterDesign(species.id);
  const primary = choosePalette(randomState);
  const secondary = choosePalette(primary.randomState);
  const accent = choosePalette(secondary.randomState);
  const pattern = chooseOption(accent.randomState, design.patternOptions);
  const preset = chooseOption(pattern.randomState, design.physiquePresets);
  const appendage = chooseOption(preset.randomState, design.appendageOptions);
  const accessory = chooseOption(
    appendage.randomState,
    design.accessoryOptions,
  );
  const expression = chooseOption(
    accessory.randomState,
    design.expressionOptions,
  );
  const victory = chooseOption(
    expression.randomState,
    design.victoryPoseOptions,
  );
  const entrance = chooseOption(
    victory.randomState,
    design.entranceAnimationOptions,
  );
  const rareRoll = rollChance(entrance.randomState, 0.08);
  const rareOptions = rareRoll.value
    ? design.rareTraitOptions.slice(1)
    : design.rareTraitOptions.slice(0, 1);
  const rare = chooseOption(rareRoll.randomState, rareOptions);
  return {
    cosmetics: normalizeBuddyCosmetics(species.id, {
      primaryPaletteId: primary.id,
      secondaryPaletteId: secondary.id,
      accentPaletteId: accent.id,
      patternId: pattern.id,
      muscleDefinitionId: design.physiquePresets.find(
        (entry) => entry.id === preset.id,
      )!.muscleDefinitionId,
      bodySizeId: design.physiquePresets.find(
        (entry) => entry.id === preset.id,
      )!.bodySizeId,
      appendageVariantId: appendage.id,
      accessoryIds: [accessory.id],
      rareTraitId: rare.id,
      expressionId: expression.id as BuddyCosmetics['expressionId'],
      victoryPoseId: victory.id,
      entranceAnimationId: entrance.id,
      physiquePresetId: preset.id,
      physique: design.physiquePresets.find(
        (entry) => entry.id === preset.id,
      )!.physique,
    }),
    randomState: rare.randomState,
  };
}

export function validateBuddyCosmetics(
  speciesId: string,
  cosmetics: BuddyCosmetics,
) {
  if (!BUDDY_CHARACTER_DESIGN_BY_SPECIES_ID.has(speciesId)) {
    if (speciesId.startsWith('legacy-')) {
      const normalized = normalizeBuddyCosmetics(speciesId, cosmetics);
      return JSON.stringify(normalized) === JSON.stringify(cosmetics)
        ? []
        : [`Buddy cosmetics for "${speciesId}" contain invalid option IDs.`];
    }
    return [`Unknown Buddy species design "${speciesId}".`];
  }
  const normalized = normalizeBuddyCosmetics(speciesId, cosmetics);
  return JSON.stringify(normalized) === JSON.stringify(cosmetics)
    ? []
    : [`Buddy cosmetics for "${speciesId}" contain invalid option IDs.`];
}

export function stableBuddyCosmeticSeed(id: string) {
  let hash = 2_166_136_261;
  for (const character of id) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}
