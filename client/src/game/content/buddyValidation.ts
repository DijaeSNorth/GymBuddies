import {
  BUDDY_BASE_STAT_KEYS,
  BUDDY_DISCIPLINES,
  type BuddySpecies,
} from '../types';

const STABLE_ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const SPRITE_PIXEL_PATTERN = /^[.MDEA]{8}$/;
const EXPECTED_STANDARD_SPECIES = 12;
const EXPECTED_EXOTIC_SPECIES = 4;

function isStableId(value: string) {
  return STABLE_ID_PATTERN.test(value);
}

function validateUniqueValue(
  label: string,
  value: string,
  values: Set<string>,
  errors: string[],
) {
  if (values.has(value)) {
    errors.push(`Buddy roster contains duplicate ${label} "${value}".`);
  }
  values.add(value);
}

export function collectBuddyRosterValidationErrors(
  roster: readonly BuddySpecies[],
) {
  const errors: string[] = [];
  const ids = new Set<string>();
  const dexNumbers = new Set<number>();
  const silhouettes = new Set<string>();
  const paletteSignatures = new Set<string>();
  const growthIds = new Set<string>();
  const passiveIds = new Set<string>();
  const moveIds = new Set<string>();
  const animationIds = new Set<string>();
  const disciplines = new Set<string>(BUDDY_DISCIPLINES);
  const statKeys = new Set<string>(BUDDY_BASE_STAT_KEYS);
  const primaryDisciplineCounts = new Map(
    BUDDY_DISCIPLINES.map((discipline) => [discipline, 0]),
  );

  const standardCount = roster.filter((species) => !species.isExotic).length;
  const exoticCount = roster.filter((species) => species.isExotic).length;
  if (standardCount !== EXPECTED_STANDARD_SPECIES) {
    errors.push(
      `Buddy roster must contain ${EXPECTED_STANDARD_SPECIES} standard species; found ${standardCount}.`,
    );
  }
  if (exoticCount !== EXPECTED_EXOTIC_SPECIES) {
    errors.push(
      `Buddy roster must contain ${EXPECTED_EXOTIC_SPECIES} exotic species; found ${exoticCount}.`,
    );
  }

  for (const species of roster) {
    if (!isStableId(species.id)) {
      errors.push(`Buddy species ID "${species.id}" is not stable-key safe.`);
    }
    validateUniqueValue('species ID', species.id, ids, errors);

    if (!Number.isInteger(species.dex) || species.dex <= 0) {
      errors.push(`Buddy species "${species.id}" has invalid Index number "${species.dex}".`);
    }
    if (dexNumbers.has(species.dex)) {
      errors.push(`Buddy roster contains duplicate Index number "${species.dex}".`);
    }
    dexNumbers.add(species.dex);

    const requiredText: Array<[string, string]> = [
      ['name', species.name],
      ['visual concept', species.visualConcept],
      ['silhouette', species.silhouette],
      ['personality', species.personality],
      ['habitat', species.habitat],
      ['gameplay role', species.gameplayRole],
      ['flavor text', species.flavor],
      ['growth description', species.growthProfile.description],
      ['passive name', species.passiveAbility.name],
      ['passive description', species.passiveAbility.description],
      ['signature move name', species.signatureMove.name],
      ['signature move description', species.signatureMove.description],
    ];
    for (const [label, value] of requiredText) {
      if (!value.trim()) {
        errors.push(`Buddy species "${species.id}" has empty ${label}.`);
      }
    }

    if (!disciplines.has(species.primaryDiscipline)) {
      errors.push(
        `Buddy species "${species.id}" has unknown primary discipline "${species.primaryDiscipline}".`,
      );
    } else {
      primaryDisciplineCounts.set(
        species.primaryDiscipline,
        (primaryDisciplineCounts.get(species.primaryDiscipline) ?? 0) + 1,
      );
    }
    if (
      species.secondaryDiscipline &&
      !disciplines.has(species.secondaryDiscipline)
    ) {
      errors.push(
        `Buddy species "${species.id}" has unknown secondary discipline "${species.secondaryDiscipline}".`,
      );
    }
    if (species.secondaryDiscipline === species.primaryDiscipline) {
      errors.push(
        `Buddy species "${species.id}" repeats its primary discipline as its secondary discipline.`,
      );
    }
    if (
      species.signatureMove.discipline !== species.primaryDiscipline &&
      species.signatureMove.discipline !== species.secondaryDiscipline
    ) {
      errors.push(
        `Buddy species "${species.id}" signature move uses unrelated discipline "${species.signatureMove.discipline}".`,
      );
    }

    const rangedStats: Array<[string, number, number, number]> = [
      ['baseHp', species.baseHp, 20, 80],
      ['power', species.power, 1, 50],
      ['control', species.control, 1, 100],
      ['stamina', species.stamina, 1, 100],
      ['form', species.form, 1, 24],
      ['mobility', species.mobility, 1, 24],
      ['volume', species.volume, 1, 12],
    ];
    for (const [stat, value, minimum, maximum] of rangedStats) {
      if (!Number.isInteger(value) || value < minimum || value > maximum) {
        errors.push(
          `Buddy species "${species.id}" has ${stat} ${value}; expected an integer from ${minimum} to ${maximum}.`,
        );
      }
    }
    if (
      !Number.isInteger(species.captureDifficulty) ||
      species.captureDifficulty < 1 ||
      species.captureDifficulty > 5
    ) {
      errors.push(
        `Buddy species "${species.id}" has invalid capture difficulty "${species.captureDifficulty}".`,
      );
    }
    if (species.isExotic && species.captureDifficulty < 4) {
      errors.push(
        `Exotic Buddy species "${species.id}" must have capture difficulty 4 or 5.`,
      );
    }

    const growth = species.growthProfile;
    if (!isStableId(growth.id)) {
      errors.push(`Buddy species "${species.id}" has invalid growth ID "${growth.id}".`);
    }
    validateUniqueValue('growth ID', growth.id, growthIds, errors);
    if (
      growth.curve !== 'early-surge' &&
      growth.curve !== 'steady' &&
      growth.curve !== 'late-bloom'
    ) {
      errors.push(
        `Buddy species "${species.id}" has unknown growth curve "${growth.curve}".`,
      );
    }
    if (growth.emphasizedStats.length === 0) {
      errors.push(`Buddy species "${species.id}" has no emphasized growth stats.`);
    }
    const emphasizedStats = new Set<string>();
    for (const stat of growth.emphasizedStats) {
      if (!statKeys.has(stat)) {
        errors.push(
          `Buddy species "${species.id}" emphasizes unknown stat "${stat}".`,
        );
      }
      if (emphasizedStats.has(stat)) {
        errors.push(
          `Buddy species "${species.id}" repeats emphasized stat "${stat}".`,
        );
      }
      emphasizedStats.add(stat);
    }

    if (!isStableId(species.passiveAbility.id)) {
      errors.push(
        `Buddy species "${species.id}" has invalid passive ID "${species.passiveAbility.id}".`,
      );
    }
    validateUniqueValue(
      'passive ID',
      species.passiveAbility.id,
      passiveIds,
      errors,
    );
    if (!isStableId(species.signatureMove.id)) {
      errors.push(
        `Buddy species "${species.id}" has invalid move ID "${species.signatureMove.id}".`,
      );
    }
    validateUniqueValue(
      'signature move ID',
      species.signatureMove.id,
      moveIds,
      errors,
    );

    if (
      species.sprite.length !== 8 ||
      species.sprite.some((row) => !SPRITE_PIXEL_PATTERN.test(row))
    ) {
      errors.push(
        `Buddy species "${species.id}" must have an 8x8 sprite using only ".", "M", "D", "E", and "A".`,
      );
    }
    validateUniqueValue(
      'sprite silhouette',
      species.sprite.join('/'),
      silhouettes,
      errors,
    );

    const paletteSignature = Object.values(species.palette).join('/');
    validateUniqueValue(
      'palette',
      paletteSignature,
      paletteSignatures,
      errors,
    );
    for (const color of Object.values(species.palette)) {
      if (!HEX_COLOR_PATTERN.test(color)) {
        errors.push(`Buddy species "${species.id}" has invalid color "${color}".`);
      }
    }

    for (const [animationName, animationId] of Object.entries(
      species.animations,
    )) {
      if (
        !isStableId(animationId) ||
        !animationId.startsWith(`buddy.${species.id}.`)
      ) {
        errors.push(
          `Buddy species "${species.id}" has invalid ${animationName} animation reference "${animationId}".`,
        );
      }
      validateUniqueValue('animation ID', animationId, animationIds, errors);
    }
  }

  for (const [discipline, count] of primaryDisciplineCounts) {
    if (count === 0) {
      errors.push(`Buddy roster has no primary ${discipline} species.`);
    }
  }

  return errors;
}
