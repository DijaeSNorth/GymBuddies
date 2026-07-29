import {
  BUDDY_BODY_SIZE_OPTIONS,
  BUDDY_CHARACTER_DESIGN_BY_SPECIES_ID,
  BUDDY_DEFINITION_OPTIONS,
  BUDDY_PALETTE_COLORS,
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
  const normalized = [
    ...new Set(
      value.filter(
        (entry): entry is string =>
          typeof entry === 'string' && available.has(entry),
      ),
    ),
  ].slice(0, 2);
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
  };
}

export function normalizeBuddyCosmetics(
  speciesId: string,
  value?: Partial<BuddyCosmetics> | null,
): BuddyCosmetics {
  const design = getBuddyCharacterDesign(speciesId);
  const defaults = design.defaultCosmetics;
  return {
    version: 1,
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
  const definition = chooseOption(
    pattern.randomState,
    BUDDY_DEFINITION_OPTIONS,
  );
  const size = chooseOption(definition.randomState, BUDDY_BODY_SIZE_OPTIONS);
  const appendage = chooseOption(size.randomState, design.appendageOptions);
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
      muscleDefinitionId:
        definition.id as BuddyCosmetics['muscleDefinitionId'],
      bodySizeId: size.id as BuddyCosmetics['bodySizeId'],
      appendageVariantId: appendage.id,
      accessoryIds: [accessory.id],
      rareTraitId: rare.id,
      expressionId: expression.id as BuddyCosmetics['expressionId'],
      victoryPoseId: victory.id,
      entranceAnimationId: entrance.id,
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
