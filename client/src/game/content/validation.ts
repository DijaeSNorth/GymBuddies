import { AUDIO_CUES, MUSIC_TRACKS } from './audio';
import {
  BUDDY_SPECIES,
  BUDDY_SPECIES_BY_ID,
  LEGACY_BUDDY_SPECIES_ID_MAP,
  STARTER_BUDDIES,
} from './buddies';
import { collectBuddyRosterValidationErrors } from './buddyValidation';
import {
  BUDDY_CHARACTER_DESIGNS,
  BUDDY_PALETTE_COLORS,
} from './buddyCharacters';
import { BOSS_ROSTERS } from './bosses';
import { BOSS_CHARACTER_DESIGNS } from './bossCharacters';
import {
  GYM_LEADER_CHARACTER_DESIGNS,
  HANDCRAFTED_CHARACTER_DESIGNS,
  MUSCULAR_BODY_ARCHETYPES,
  NPC_APPEARANCE_TEMPLATES,
  NPC_CHARACTER_SEEDS,
  RIVAL_CHARACTER_DESIGNS,
} from './characters';
import {
  CAPTURE_BATTLE_SPEEDS,
  CAPTURE_OPPONENT_TENDENCIES,
} from './captureBalance';
import { CAPTURE_MOVES } from './captureMoves';
import {
  DEFAULT_BOSS_GYM_ID,
  GYM_DEFINITIONS,
  STARTING_ZONE_ID,
  WORLD_ZONE_POSITIONS,
  ZONE_VIBES,
} from './gyms';
import { ALL_TRAINING_MACHINES } from './machines';
import {
  BUDDY_INDEX_MILESTONES,
  BUDDY_LEVEL_CURVE,
  ENDGAME_ACTIVITIES,
  GYM_PROGRESSION_MILESTONES,
  MACHINE_MASTERY_RANKS,
} from './progressionBalance';
import { WORLD_ROUTE_PATHS } from './routes';
import { DEFAULT_TRAINER_PRESET_ID, TRAINER_FOCUS_DEFINITIONS, TRAINER_MUSCLES, TRAINER_PRESETS } from './trainer';
import {
  DEFAULT_TRAINER_APPEARANCE,
  TRAINER_APPEARANCE_OPTION_GROUPS,
  TRAINER_BUILD_ATTRIBUTES,
  TRAINER_BUILD_MAX,
  TRAINER_BUILD_MIN,
  TRAINER_COLOR_OPTIONS,
  TRAINER_PHYSIQUE_PRESETS,
  TRAINER_SKIN_TONES,
} from './trainerAppearance';
import { STARTING_TUTORIAL_GYM_ID, TUTORIAL_STEPS } from './tutorial';
import { WORKOUT_LOAD_DEFINITIONS } from './workoutLoads';
import { TEAM_SIZE } from './save';
import { BUDDY_DISCIPLINES } from '../types';
import { validateTrainerAppearance } from '../systems/trainerAppearance';
import {
  createNpcCharacterDesign,
  trainerAppearanceFromCharacterDesign,
} from '../systems/characterDesign';
import {
  normalizeBuddyCosmetics,
  validateBuddyCosmetics,
} from '../systems/buddyCosmetics';
import { OVERWORLD_MAPS } from './maps/journeyMaps';

type Identified = {
  id: string;
};

function validateUniqueIds(label: string, entries: readonly Identified[], errors: string[]) {
  const ids = new Set<string>();
  for (const entry of entries) {
    if (!entry.id.trim()) {
      errors.push(`${label} contains an empty ID.`);
      continue;
    }
    if (ids.has(entry.id)) {
      errors.push(`${label} contains duplicate ID "${entry.id}".`);
    }
    ids.add(entry.id);
  }
}

export function collectGameContentValidationErrors() {
  const errors: string[] = [];

  validateUniqueIds('Trainer presets', TRAINER_PRESETS, errors);
  validateUniqueIds('Trainer muscle attributes', TRAINER_MUSCLES, errors);
  validateUniqueIds('Trainer focus definitions', TRAINER_FOCUS_DEFINITIONS, errors);
  validateUniqueIds('Trainer cosmetic build attributes', TRAINER_BUILD_ATTRIBUTES, errors);
  validateUniqueIds('Trainer physique presets', TRAINER_PHYSIQUE_PRESETS, errors);
  validateUniqueIds('Trainer skin tones', TRAINER_SKIN_TONES, errors);
  validateUniqueIds('Trainer palette colors', TRAINER_COLOR_OPTIONS, errors);
  Object.entries(TRAINER_APPEARANCE_OPTION_GROUPS).forEach(
    ([group, entries]) => {
      validateUniqueIds(`Trainer ${group} options`, entries, errors);
    },
  );
  if (TRAINER_PHYSIQUE_PRESETS.length !== 8) {
    errors.push(
      `Trainer cosmetics must define eight physique presets; found ${TRAINER_PHYSIQUE_PRESETS.length}.`,
    );
  }
  const buildIds = TRAINER_BUILD_ATTRIBUTES.map((attribute) => attribute.id);
  for (const preset of TRAINER_PHYSIQUE_PRESETS) {
    if (
      Object.keys(preset.build).length !== buildIds.length ||
      buildIds.some(
        (id) =>
          !Number.isFinite(preset.build[id]) ||
          preset.build[id] < TRAINER_BUILD_MIN ||
          preset.build[id] > TRAINER_BUILD_MAX,
      )
    ) {
      errors.push(
        `Trainer physique preset "${preset.id}" has incomplete or out-of-range build values.`,
      );
    }
  }
  errors.push(
    ...validateTrainerAppearance(DEFAULT_TRAINER_APPEARANCE).map(
      (issue) => `Default trainer appearance: ${issue}`,
    ),
  );
  validateUniqueIds('Buddy species', BUDDY_SPECIES, errors);
  validateUniqueIds('Buddy character designs', BUDDY_CHARACTER_DESIGNS, errors);
  validateUniqueIds('Buddy palette colors', BUDDY_PALETTE_COLORS, errors);
  validateUniqueIds('Muscular body archetypes', MUSCULAR_BODY_ARCHETYPES, errors);
  validateUniqueIds('NPC appearance templates', NPC_APPEARANCE_TEMPLATES, errors);
  validateUniqueIds('NPC character seeds', NPC_CHARACTER_SEEDS, errors);
  validateUniqueIds(
    'Handcrafted character designs',
    HANDCRAFTED_CHARACTER_DESIGNS,
    errors,
  );
  validateUniqueIds('Boss character designs', BOSS_CHARACTER_DESIGNS, errors);
  validateUniqueIds('Starting Buddies', STARTER_BUDDIES, errors);
  validateUniqueIds('Gyms', GYM_DEFINITIONS, errors);
  validateUniqueIds('Training machines', ALL_TRAINING_MACHINES, errors);
  validateUniqueIds(
    'Training machine reward tables',
    ALL_TRAINING_MACHINES.map((machine) => machine.rewardTable),
    errors,
  );
  validateUniqueIds('Routes', WORLD_ROUTE_PATHS, errors);
  validateUniqueIds('Workout loads', WORKOUT_LOAD_DEFINITIONS, errors);
  validateUniqueIds('Capture moves', CAPTURE_MOVES, errors);
  validateUniqueIds('Capture battle speeds', CAPTURE_BATTLE_SPEEDS, errors);
  validateUniqueIds(
    'Capture opponent tendencies',
    Object.values(CAPTURE_OPPONENT_TENDENCIES),
    errors,
  );
  validateUniqueIds('Boss rosters', BOSS_ROSTERS, errors);
  const bosses = BOSS_ROSTERS.flatMap((roster) => roster.bosses);
  validateUniqueIds('Bosses', bosses, errors);
  validateUniqueIds(
    'Boss signature rules',
    bosses.map((boss) => boss.signatureRule),
    errors,
  );
  validateUniqueIds(
    'Boss arena effects',
    bosses.map((boss) => boss.arenaEffect),
    errors,
  );
  validateUniqueIds(
    'Boss reward tables',
    bosses.map((boss) => boss.rewardTable),
    errors,
  );
  validateUniqueIds('Audio cues', AUDIO_CUES, errors);
  validateUniqueIds('Music tracks', MUSIC_TRACKS, errors);
  for (const cue of AUDIO_CUES) {
    if (cue.tones.length === 0) {
      errors.push(`Audio cue "${cue.id}" has no tone pattern.`);
    }
    for (const entry of cue.tones) {
      if (
        entry.frequency <= 0 ||
        entry.durationMs <= 0 ||
        entry.gain <= 0 ||
        entry.gain > 1 ||
        (entry.offsetMs ?? 0) < 0
      ) {
        errors.push(`Audio cue "${cue.id}" has an invalid tone definition.`);
      }
    }
  }
  for (const track of MUSIC_TRACKS) {
    if (track.stepMs < 80 || track.steps.length < 4) {
      errors.push(`Music track "${track.id}" has an invalid loop shape.`);
    }
    if (track.steps.every((step) => step.tones.length === 0)) {
      errors.push(`Music track "${track.id}" is entirely silent.`);
    }
  }
  validateUniqueIds('Tutorial steps', TUTORIAL_STEPS, errors);
  validateUniqueIds(
    'Gym progression milestones',
    GYM_PROGRESSION_MILESTONES,
    errors,
  );
  validateUniqueIds(
    'Machine mastery ranks',
    MACHINE_MASTERY_RANKS,
    errors,
  );
  validateUniqueIds(
    'Buddy Index milestones',
    BUDDY_INDEX_MILESTONES,
    errors,
  );
  validateUniqueIds('Endgame activities', ENDGAME_ACTIVITIES, errors);
  errors.push(...collectBuddyRosterValidationErrors(BUDDY_SPECIES));

  const speciesIds = new Set(BUDDY_SPECIES.map((entry) => entry.id));
  const buddyDesignSpeciesIds = new Set(
    BUDDY_CHARACTER_DESIGNS.map((entry) => entry.speciesId),
  );
  if (
    BUDDY_CHARACTER_DESIGNS.length !== BUDDY_SPECIES.length ||
    [...speciesIds].some((id) => !buddyDesignSpeciesIds.has(id))
  ) {
    errors.push(
      'Every Buddy species must have exactly one modular character design.',
    );
  }
  if (
    new Set(
      BUDDY_CHARACTER_DESIGNS.map((entry) => entry.silhouetteModuleId),
    ).size !== BUDDY_CHARACTER_DESIGNS.length
  ) {
    errors.push(
      'Buddy silhouette module IDs must remain unique across species.',
    );
  }
  for (const design of BUDDY_CHARACTER_DESIGNS) {
    if (!speciesIds.has(design.speciesId)) {
      errors.push(
        `Buddy character design "${design.id}" references missing species "${design.speciesId}".`,
      );
    }
    for (const [label, options] of [
      ['body variations', design.bodyVariations],
      ['patterns', design.patternOptions],
      ['appendages', design.appendageOptions],
      ['accessories', design.accessoryOptions],
      ['rare traits', design.rareTraitOptions],
      ['expressions', design.expressionOptions],
      ['victory poses', design.victoryPoseOptions],
      ['entrances', design.entranceAnimationOptions],
    ] as const) {
      if (options.length < 2) {
        errors.push(
          `Buddy character design "${design.id}" needs multiple ${label}.`,
        );
      }
      validateUniqueIds(
        `Buddy character design "${design.id}" ${label}`,
        options,
        errors,
      );
    }
    errors.push(
      ...validateBuddyCosmetics(
        design.speciesId,
        design.defaultCosmetics,
      ).map((issue) => `${design.id}: ${issue}`),
    );
  }

  if (
    GYM_LEADER_CHARACTER_DESIGNS.length !== 6 ||
    RIVAL_CHARACTER_DESIGNS.length < 3 ||
    RIVAL_CHARACTER_DESIGNS.some((entry) => !entry.handcrafted)
  ) {
    errors.push(
      'Character content must define six handcrafted gym leaders and at least three handcrafted rivals.',
    );
  }
  const archetypeIds = new Set(
    MUSCULAR_BODY_ARCHETYPES.map((entry) => entry.id),
  );
  for (const design of HANDCRAFTED_CHARACTER_DESIGNS) {
    if (!archetypeIds.has(design.appearance.archetypeId)) {
      errors.push(
        `Character "${design.id}" references missing body archetype "${design.appearance.archetypeId}".`,
      );
      continue;
    }
    errors.push(
      ...validateTrainerAppearance(
        trainerAppearanceFromCharacterDesign(design),
      ).map((issue) => `Character "${design.id}": ${issue}`),
    );
  }
  const npcTemplateIds = new Set(
    NPC_APPEARANCE_TEMPLATES.map((entry) => entry.id),
  );
  for (const seed of NPC_CHARACTER_SEEDS) {
    if (!npcTemplateIds.has(seed.templateId)) {
      errors.push(
        `NPC "${seed.id}" references missing template "${seed.templateId}".`,
      );
      continue;
    }
    const generated = createNpcCharacterDesign(seed);
    errors.push(
      ...validateTrainerAppearance(
        trainerAppearanceFromCharacterDesign(generated),
      ).map((issue) => `Generated NPC "${seed.id}": ${issue}`),
    );
  }
  const worldCharacterIds = new Set([
    ...HANDCRAFTED_CHARACTER_DESIGNS.map((entry) => entry.id),
    ...NPC_CHARACTER_SEEDS.map((entry) => entry.id),
  ]);
  for (const interactable of OVERWORLD_MAPS.flatMap(
    (map) => map.interactables,
  )) {
    if (
      interactable.kind === 'npc' &&
      (!interactable.characterId ||
        !worldCharacterIds.has(interactable.characterId))
    ) {
      errors.push(
        `Overworld NPC "${interactable.id}" has no valid character design.`,
      );
    }
  }

  if (TEAM_SIZE !== 6) {
    errors.push(`Gym Buddy party limit must remain six; found "${TEAM_SIZE}".`);
  }

  for (const [legacyId, canonicalId] of Object.entries(
    LEGACY_BUDDY_SPECIES_ID_MAP,
  )) {
    if (BUDDY_SPECIES_BY_ID.has(legacyId)) {
      errors.push(`Legacy Buddy species ID "${legacyId}" collides with the live roster.`);
    }
    if (!BUDDY_SPECIES_BY_ID.has(canonicalId)) {
      errors.push(
        `Legacy Buddy species ID "${legacyId}" references missing species "${canonicalId}".`,
      );
    }
  }

  const muscleIds = new Set(TRAINER_MUSCLES.map((muscle) => muscle.id));
  for (const focus of TRAINER_FOCUS_DEFINITIONS) {
    for (const boost of focus.boosts) {
      if (!muscleIds.has(boost.muscle)) {
        errors.push(`Trainer focus "${focus.id}" references missing muscle "${boost.muscle}".`);
      }
    }
  }

  if (!TRAINER_PRESETS.some((preset) => preset.id === DEFAULT_TRAINER_PRESET_ID)) {
    errors.push(`Default trainer preset "${DEFAULT_TRAINER_PRESET_ID}" does not exist.`);
  }

  const machineIds = new Set(ALL_TRAINING_MACHINES.map((machine) => machine.id));
  const machineById = new Map(ALL_TRAINING_MACHINES.map((machine) => [machine.id, machine]));
  const assignedMachineIds = new Set<string>();
  const focusIds = new Set(TRAINER_FOCUS_DEFINITIONS.map((focus) => focus.id));
  const disciplineIds = new Set(BUDDY_DISCIPLINES);
  const audioCueIds = new Set(AUDIO_CUES.map((cue) => cue.id));
  const animationCueIds = new Set<string>();

  const captureMoveIds = new Set(CAPTURE_MOVES.map((move) => move.id));
  for (const move of CAPTURE_MOVES) {
    if (!move.summary.trim() || !move.tactic.trim()) {
      errors.push(`Capture move "${move.id}" is missing readable intent text.`);
    }
    if (move.staminaCost <= 0 || move.staminaCost > 100) {
      errors.push(`Capture move "${move.id}" has an invalid stamina cost.`);
    }
    if (move.randomSwing.min > move.randomSwing.max) {
      errors.push(`Capture move "${move.id}" has an inverted random range.`);
    }
    if (
      !captureMoveIds.has(move.counters) ||
      !captureMoveIds.has(move.counteredBy)
    ) {
      errors.push(`Capture move "${move.id}" has a broken counter reference.`);
    }
    const muscleWeight = move.trainerMuscles.reduce(
      (sum, entry) => sum + entry.weight,
      0,
    );
    if (
      move.trainerMuscles.length === 0 ||
      Math.abs(muscleWeight - 1) > 0.001
    ) {
      errors.push(
        `Capture move "${move.id}" trainer-muscle weights must total 1.`,
      );
    }
    for (const muscle of move.trainerMuscles) {
      if (!muscleIds.has(muscle.id) || muscle.weight <= 0) {
        errors.push(
          `Capture move "${move.id}" references invalid muscle "${muscle.id}".`,
        );
      }
    }
    for (const discipline of move.buddyDisciplines) {
      if (!disciplineIds.has(discipline)) {
        errors.push(
          `Capture move "${move.id}" references invalid discipline "${discipline}".`,
        );
      }
    }
  }

  for (const machine of ALL_TRAINING_MACHINES) {
    if (!focusIds.has(machine.focus.toLowerCase())) {
      errors.push(`Training machine "${machine.id}" references missing focus "${machine.focus}".`);
    }
    if (!machine.visualConcept.trim()) {
      errors.push(`Training machine "${machine.id}" is missing a visual concept.`);
    }
    if (!machine.primaryMuscleGroups.length) {
      errors.push(`Training machine "${machine.id}" has no primary muscle groups.`);
    }
    for (const muscle of machine.primaryMuscleGroups) {
      if (!muscleIds.has(muscle)) {
        errors.push(`Training machine "${machine.id}" references missing muscle "${muscle}".`);
      }
    }
    if (!machine.buddyDisciplines.length) {
      errors.push(`Training machine "${machine.id}" has no Buddy disciplines.`);
    }
    for (const discipline of machine.buddyDisciplines) {
      if (!disciplineIds.has(discipline)) {
        errors.push(`Training machine "${machine.id}" references missing discipline "${discipline}".`);
      }
    }
    const xp = machine.rewardTable.buddyXp;
    if (
      xp.min < 1 ||
      xp.max < xp.min ||
      xp.multiplier <= 0 ||
      machine.rewardTable.trainerGrowthMultiplier <= 0
    ) {
      errors.push(`Training machine "${machine.id}" has an invalid reward table.`);
    }
    if (
      machine.dropProbabilities.boostToken < 0 ||
      machine.dropProbabilities.boostToken > 1 ||
      machine.dropProbabilities.deloadToken < 0 ||
      machine.dropProbabilities.deloadToken > 1
    ) {
      errors.push(`Training machine "${machine.id}" has an invalid drop probability.`);
    }
    if (
      machine.recommendedTrainerLevel.min < 1 ||
      machine.recommendedTrainerLevel.max < machine.recommendedTrainerLevel.min
    ) {
      errors.push(`Training machine "${machine.id}" has an invalid recommended trainer level.`);
    }
    if (machine.repeatSoftCap < 1 || !Number.isInteger(machine.repeatSoftCap)) {
      errors.push(`Training machine "${machine.id}" has an invalid repeat soft cap.`);
    }
    if (!machine.animationCueId.trim() || animationCueIds.has(machine.animationCueId)) {
      errors.push(`Training machine "${machine.id}" has a missing or duplicate animation cue ID.`);
    }
    animationCueIds.add(machine.animationCueId);
    if (!audioCueIds.has(machine.soundCueId)) {
      errors.push(`Training machine "${machine.id}" references missing sound cue "${machine.soundCueId}".`);
    }
  }

  const gymIds = new Set(GYM_DEFINITIONS.map((gym) => gym.id));
  let previousProgressionMinutes = 0;
  let previousMasteryXp = -1;
  for (const [index, milestone] of GYM_PROGRESSION_MILESTONES.entries()) {
    if (!gymIds.has(milestone.gymId)) {
      errors.push(
        `Progression milestone "${milestone.id}" references missing gym "${milestone.gymId}".`,
      );
    }
    if (milestone.order !== index + 1) {
      errors.push(
        `Progression milestone "${milestone.id}" has non-sequential order "${milestone.order}".`,
      );
    }
    if (
      milestone.expectedBuddyLevel.min >
        milestone.expectedBuddyLevel.target ||
      milestone.expectedBuddyLevel.target >
        milestone.expectedBuddyLevel.max ||
      milestone.expectedTrainerPhysique.min >
        milestone.expectedTrainerPhysique.target ||
      milestone.expectedTrainerPhysique.target >
        milestone.expectedTrainerPhysique.max ||
      milestone.expectedCumulativeMinutes.min >
        milestone.expectedCumulativeMinutes.target ||
      milestone.expectedCumulativeMinutes.target >
        milestone.expectedCumulativeMinutes.max
    ) {
      errors.push(
        `Progression milestone "${milestone.id}" has an inverted expected range.`,
      );
    }
    if (
      milestone.expectedCumulativeMinutes.target <=
      previousProgressionMinutes
    ) {
      errors.push(
        `Progression milestone "${milestone.id}" does not increase expected completion time.`,
      );
    }
    previousProgressionMinutes =
      milestone.expectedCumulativeMinutes.target;
  }
  if (GYM_PROGRESSION_MILESTONES.length !== GYM_DEFINITIONS.length) {
    errors.push(
      `Progression must define one milestone per gym; found ${GYM_PROGRESSION_MILESTONES.length} milestones for ${GYM_DEFINITIONS.length} gyms.`,
    );
  }
  for (const rank of MACHINE_MASTERY_RANKS) {
    if (rank.minimumXp <= previousMasteryXp) {
      errors.push(
        `Machine mastery rank "${rank.id}" has a non-increasing XP threshold.`,
      );
    }
    if (
      rank.readinessBonus < 0 ||
      rank.readinessBonus > 0.05 ||
      rank.xpMultiplier < 1 ||
      rank.xpMultiplier > 1.1
    ) {
      errors.push(
        `Machine mastery rank "${rank.id}" exceeds the anti-dominance benefit caps.`,
      );
    }
    previousMasteryXp = rank.minimumXp;
  }
  if (
    BUDDY_LEVEL_CURVE.maximumLevel < 55 ||
    BUDDY_LEVEL_CURVE.maximumLevel > 100
  ) {
    errors.push('Buddy level cap must support Glory Gym without runaway growth.');
  }
  for (const gym of GYM_DEFINITIONS) {
    const localMachineIds = new Set<string>();
    if (gym.machineIds.length !== 4) {
      errors.push(`Gym "${gym.id}" must contain exactly four training machines.`);
    }
    for (const machineId of gym.machineIds) {
      if (localMachineIds.has(machineId)) {
        errors.push(`Gym "${gym.id}" contains duplicate machine reference "${machineId}".`);
      }
      localMachineIds.add(machineId);
      assignedMachineIds.add(machineId);
      if (!machineIds.has(machineId)) {
        errors.push(`Gym "${gym.id}" references missing machine "${machineId}".`);
      } else if (machineById.get(machineId)?.gymId !== gym.id) {
        errors.push(`Training machine "${machineId}" declares gym "${machineById.get(machineId)?.gymId}" but is assigned to "${gym.id}".`);
      }
    }
    if (!localMachineIds.has(gym.defaultMachineId)) {
      errors.push(`Gym "${gym.id}" default machine "${gym.defaultMachineId}" is not assigned to that gym.`);
    }
  }

  for (const machineId of machineIds) {
    if (!assignedMachineIds.has(machineId)) {
      errors.push(`Training machine "${machineId}" is not assigned to a gym.`);
    }
  }

  if (!gymIds.has(STARTING_ZONE_ID)) {
    errors.push(`Starting gym "${STARTING_ZONE_ID}" does not exist.`);
  }
  if (!gymIds.has(DEFAULT_BOSS_GYM_ID)) {
    errors.push(`Default boss gym "${DEFAULT_BOSS_GYM_ID}" does not exist.`);
  }
  if (!gymIds.has(STARTING_TUTORIAL_GYM_ID)) {
    errors.push(`Tutorial gym "${STARTING_TUTORIAL_GYM_ID}" does not exist.`);
  }

  for (const gym of GYM_DEFINITIONS) {
    if (!WORLD_ZONE_POSITIONS[gym.id]) {
      errors.push(`Gym "${gym.id}" has no world position.`);
    }
    if (!ZONE_VIBES[gym.id]) {
      errors.push(`Gym "${gym.id}" has no zone presentation definition.`);
    } else if (ZONE_VIBES[gym.id].id !== gym.id) {
      errors.push(`Gym "${gym.id}" has mismatched zone presentation ID "${ZONE_VIBES[gym.id].id}".`);
    }
  }

  const routeEdges = new Set<string>();
  for (const route of WORLD_ROUTE_PATHS) {
    if (!gymIds.has(route.from)) {
      errors.push(`Route "${route.id}" references missing origin gym "${route.from}".`);
    }
    if (!gymIds.has(route.to)) {
      errors.push(`Route "${route.id}" references missing destination gym "${route.to}".`);
    }
    if (route.from === route.to) {
      errors.push(`Route "${route.id}" connects gym "${route.from}" to itself.`);
    }
    const edge = [route.from, route.to].sort().join('|');
    if (routeEdges.has(edge)) {
      errors.push(`Routes contain duplicate connection "${edge}".`);
    }
    routeEdges.add(edge);
  }

  for (const starter of STARTER_BUDDIES) {
    if (!BUDDY_SPECIES_BY_ID.has(starter.speciesId)) {
      errors.push(`Starting Buddy "${starter.id}" references missing Buddy species "${starter.speciesId}".`);
    }
  }

  for (const roster of BOSS_ROSTERS) {
    if (!gymIds.has(roster.gymId)) {
      errors.push(`Boss roster "${roster.id}" references missing gym "${roster.gymId}".`);
    }
    if (roster.bosses.length !== 2) {
      errors.push(
        `Boss roster "${roster.id}" must contain exactly two boss variants.`,
      );
    }
    for (const boss of roster.bosses) {
      if (!BUDDY_SPECIES_BY_ID.has(boss.speciesId)) {
        errors.push(`Boss "${boss.id}" references missing Buddy species "${boss.speciesId}".`);
      }
      if (
        !boss.personality.trim() ||
        !boss.visualIdentity.trim() ||
        !boss.counterplay.trim()
      ) {
        errors.push(`Boss "${boss.id}" is missing readable identity content.`);
      }
      if (
        !captureMoveIds.has(boss.preferredTactic) ||
        !captureMoveIds.has(boss.signatureRule.requiredMoveId)
      ) {
        errors.push(`Boss "${boss.id}" references an invalid capture move.`);
      }
      if (
        !boss.signatureRule.name.trim() ||
        !boss.signatureRule.description.trim() ||
        !boss.signatureRule.warning.trim()
      ) {
        errors.push(`Boss "${boss.id}" has incomplete signature-rule text.`);
      }
      if (
        !boss.arenaEffect.name.trim() ||
        !boss.arenaEffect.description.trim() ||
        !/^[a-z0-9-]+$/.test(boss.arenaEffect.className)
      ) {
        errors.push(`Boss "${boss.id}" has an invalid arena effect.`);
      }
      const reward = boss.rewardTable;
      if (
        reward.buddyXp < 1 ||
        reward.fatigueRecovery < 0 ||
        reward.momentum < 0 ||
        reward.deloadTokens < 0 ||
        reward.bonusDeloadChance < 0 ||
        reward.bonusDeloadChance > 1
      ) {
        errors.push(`Boss "${boss.id}" has an invalid reward table.`);
      }
    }
  }
  if (BOSS_ROSTERS.length !== 6 || bosses.length !== 12) {
    errors.push(
      `Boss content must define six gym rosters and twelve variants; found ${BOSS_ROSTERS.length} rosters and ${bosses.length} variants.`,
    );
  }
  const bossCharacterBossIds = new Set(
    BOSS_CHARACTER_DESIGNS.map((entry) => entry.bossId),
  );
  if (
    BOSS_CHARACTER_DESIGNS.length !== bosses.length ||
    bosses.some((boss) => !bossCharacterBossIds.has(boss.id))
  ) {
    errors.push(
      'Every boss variant must have exactly one distinctive character design.',
    );
  }
  for (const design of BOSS_CHARACTER_DESIGNS) {
    const boss = bosses.find((entry) => entry.id === design.bossId);
    if (!boss) {
      errors.push(
        `Boss character design "${design.id}" references missing boss "${design.bossId}".`,
      );
      continue;
    }
    const cosmetics = normalizeBuddyCosmetics(boss.speciesId, {
      version: 1,
      primaryPaletteId: design.primaryPaletteId,
      secondaryPaletteId: design.secondaryPaletteId,
      accentPaletteId: design.accentPaletteId,
      patternId: design.patternId,
      muscleDefinitionId: design.muscleDefinitionId,
      bodySizeId: design.bodySizeId,
      appendageVariantId: design.appendageVariantId,
      accessoryIds: design.accessoryIds,
      rareTraitId: design.rareTraitId,
      expressionId: design.expressionId,
      victoryPoseId: design.signaturePoseId,
      entranceAnimationId: design.entranceAnimationId,
    });
    if (
      cosmetics.primaryPaletteId !== design.primaryPaletteId ||
      cosmetics.appendageVariantId !== design.appendageVariantId
    ) {
      errors.push(
        `Boss character design "${design.id}" contains invalid species cosmetics.`,
      );
    }
    if (
      !design.trainingPhilosophy.trim() ||
      !design.signatureClothing.trim() ||
      !design.signatureEquipment.trim() ||
      !design.battleStance.trim() ||
      !design.entranceAnimationId.trim() ||
      !design.victoryAnimationId.trim()
    ) {
      errors.push(
        `Boss character design "${design.id}" has incomplete signature presentation.`,
      );
    }
  }
  if (
    new Set(bosses.map((boss) => boss.signatureRule.trigger)).size !==
    bosses.length
  ) {
    errors.push('Each boss variant must use a distinct signature trigger.');
  }

  const expectedWorkoutLoads = new Set(['easy', 'steady', 'hard', 'max']);
  for (const load of WORKOUT_LOAD_DEFINITIONS) {
    expectedWorkoutLoads.delete(load.id);
    if (load.repCount < 1 || !Number.isInteger(load.repCount)) {
      errors.push(`Workout load "${load.id}" must define a positive whole rep count.`);
    }
    if (load.repDurationMs < 500) {
      errors.push(`Workout load "${load.id}" has an invalid rep duration.`);
    }
    if (
      load.timingTarget <= 0 ||
      load.timingTarget >= 1 ||
      load.perfectWindow <= 0 ||
      load.goodWindow <= load.perfectWindow ||
      load.timingTarget - load.goodWindow < 0 ||
      load.timingTarget + load.goodWindow > 1
    ) {
      errors.push(`Workout load "${load.id}" has invalid timing windows.`);
    }
    if (
      load.intensity <= 0 ||
      load.fatigueMultiplier <= 0 ||
      load.hpMultiplier <= 0 ||
      load.xpMultiplier <= 0 ||
      load.momentumMultiplier <= 0
    ) {
      errors.push(`Workout load "${load.id}" has a non-positive balance multiplier.`);
    }
  }
  for (const missingLoad of expectedWorkoutLoads) {
    errors.push(`Workout load "${missingLoad}" is missing.`);
  }

  return errors;
}

export function assertGameContentValid() {
  const errors = collectGameContentValidationErrors();
  if (errors.length > 0) {
    throw new Error(`Gym Buddies content validation failed:\n- ${errors.join('\n- ')}`);
  }
}

export function validateGameContentInDevelopment() {
if (import.meta.env?.DEV) {
    assertGameContentValid();
  }
}
