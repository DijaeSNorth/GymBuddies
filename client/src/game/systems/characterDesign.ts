import {
  HANDCRAFTED_CHARACTER_BY_ID,
  MUSCULAR_BODY_ARCHETYPE_BY_ID,
  NPC_APPEARANCE_TEMPLATE_BY_ID,
  NPC_CHARACTER_SEED_BY_ID,
} from '../content/characters';
import {
  DEFAULT_TRAINER_APPEARANCE,
  TRAINER_BELTS,
  TRAINER_HEADWEAR,
  TRAINER_WRIST_WRAPS,
  cloneTrainerAppearance,
  getTrainerPhysiquePresetById,
} from '../content/trainerAppearance';
import type {
  CharacterAppearanceRecipe,
  NpcCharacterSeed,
  TrainerAppearance,
  WorldCharacterDesign,
} from '../types';
import { clamp } from './math';
import {
  createRandomState,
  randomChoice,
  type RandomState,
} from './random';

function choose<T>(state: RandomState, values: readonly T[]) {
  return randomChoice(state, values);
}

export function createNpcCharacterDesign(
  seed: NpcCharacterSeed,
): WorldCharacterDesign {
  const template = NPC_APPEARANCE_TEMPLATE_BY_ID.get(seed.templateId);
  if (!template) {
    throw new Error(
      `NPC character "${seed.id}" references missing template "${seed.templateId}".`,
    );
  }
  let state = createRandomState(seed.seed);
  const archetype = choose(state, template.archetypeIds);
  state = archetype.randomState;
  const discipline = choose(state, template.disciplineIds);
  state = discipline.randomState;
  const skin = choose(state, template.skinToneIds);
  state = skin.randomState;
  const face = choose(state, template.faceShapeIds);
  state = face.randomState;
  const hair = choose(state, template.hairStyleIds);
  state = hair.randomState;
  const top = choose(state, template.topIds);
  state = top.randomState;
  const bottoms = choose(state, template.bottomIds);
  state = bottoms.randomState;
  const accessory = choose(state, template.accessoryIds);
  state = accessory.randomState;
  const expression = choose(state, template.expressionIds);
  state = expression.randomState;
  const idlePose = choose(state, template.idlePoseIds);
  const appearance: CharacterAppearanceRecipe = {
    archetypeId: archetype.value,
    heightShift: (seed.seed % 3) - 1,
    skinToneId: skin.value,
    faceShapeId: face.value,
    eyesId: expression.value === 'focused'
      ? 'determined-narrow'
      : expression.value === 'warm'
        ? 'bright-arc'
        : 'focused-round',
    hairStyleId: hair.value,
    hairLengthId:
      hair.value === 'bald'
        ? 'none'
        : ['locs-tied', 'braids-back', 'ponytail', 'top-knot'].includes(
              hair.value,
            )
          ? 'long'
          : 'short',
    hairColorId: seed.seed % 2 === 0 ? 'ink' : 'copper',
    topId: top.value,
    bottomsId: bottoms.value,
    shoesId:
      discipline.value === 'mobility' ? 'runner-light' : 'trainer-low',
    glovesId:
      discipline.value === 'power' ? 'fingerless' : 'none',
    wristWrapsId: TRAINER_WRIST_WRAPS.some(
      (entry) => entry.id === accessory.value,
    )
      ? accessory.value
      : 'none',
    headwearId: TRAINER_HEADWEAR.some(
      (entry) => entry.id === accessory.value,
    )
      ? accessory.value
      : 'none',
    beltId: TRAINER_BELTS.some((entry) => entry.id === accessory.value)
      ? accessory.value
      : 'none',
    primaryColorId: ['teal', 'coral', 'ocean', 'moss', 'plum'][
      seed.seed % 5
    ]!,
    secondaryColorId: seed.seed % 2 === 0 ? 'ink' : 'navy',
    accentColorId: ['amber', 'mint', 'sky'][seed.seed % 3]!,
  };
  return {
    id: seed.id,
    name: seed.name,
    kind: 'npc-trainer',
    discipline: discipline.value,
    appearance,
    idlePose: idlePose.value,
    expressionId: expression.value,
    trainingPhilosophy: seed.trainingPhilosophy,
    signaturePose: 'training',
    signatureClothing: `${template.label} modular training kit`,
    signatureEquipment: `${discipline.value} route kit`,
    battleStance:
      archetype.value === 'heavyweight-anchor'
        ? 'Grounded and patient'
        : 'Athletic route-ready stance',
    entranceAnimationId: `${seed.id}-route-arrival`,
    victoryAnimationId: `${seed.id}-route-salute`,
    handcrafted: false,
  };
}

export function getWorldCharacterDesign(id: string) {
  const handcrafted = HANDCRAFTED_CHARACTER_BY_ID.get(id);
  if (handcrafted) return handcrafted;
  const seed = NPC_CHARACTER_SEED_BY_ID.get(id);
  return seed ? createNpcCharacterDesign(seed) : null;
}

export function trainerAppearanceFromCharacterDesign(
  design: WorldCharacterDesign,
): TrainerAppearance {
  const archetype = MUSCULAR_BODY_ARCHETYPE_BY_ID.get(
    design.appearance.archetypeId,
  );
  const preset = getTrainerPhysiquePresetById(
    archetype?.physiquePresetId ?? 'balanced-athlete',
  );
  const appearance = cloneTrainerAppearance(DEFAULT_TRAINER_APPEARANCE);
  appearance.build = { ...preset.build };
  appearance.build.height = clamp(
    appearance.build.height + design.appearance.heightShift,
    0,
    10,
  );
  appearance.face.shapeId = design.appearance.faceShapeId;
  appearance.face.eyesId = design.appearance.eyesId;
  appearance.face.mouthId =
    design.expressionId === 'warm'
      ? 'small-smile'
      : design.expressionId === 'playful'
        ? 'bold-smirk'
        : design.expressionId === 'fierce'
          ? 'determined'
          : 'steady';
  appearance.hair.styleId = design.appearance.hairStyleId;
  appearance.hair.lengthId = design.appearance.hairLengthId;
  appearance.hair.colorId = design.appearance.hairColorId;
  appearance.outfit.topId = design.appearance.topId;
  appearance.outfit.bottomsId = design.appearance.bottomsId;
  appearance.outfit.shoesId = design.appearance.shoesId;
  appearance.outfit.glovesId = design.appearance.glovesId;
  appearance.outfit.wristWrapsId = design.appearance.wristWrapsId;
  appearance.accessories.headwearId = design.appearance.headwearId;
  appearance.accessories.beltId = design.appearance.beltId;
  appearance.colors.skinToneId = design.appearance.skinToneId;
  appearance.colors.topPrimaryId = design.appearance.primaryColorId;
  appearance.colors.topSecondaryId = design.appearance.secondaryColorId;
  appearance.colors.topAccentId = design.appearance.accentColorId;
  appearance.colors.bottomPrimaryId = design.appearance.secondaryColorId;
  appearance.colors.bottomSecondaryId = design.appearance.primaryColorId;
  appearance.colors.shoePrimaryId = design.appearance.secondaryColorId;
  appearance.colors.shoeAccentId = design.appearance.accentColorId;
  appearance.colors.accessoryPrimaryId = design.appearance.accentColorId;
  appearance.colors.accessoryAccentId = design.appearance.primaryColorId;
  return appearance;
}
