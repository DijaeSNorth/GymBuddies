import { AUDIO_CUES, MUSIC_PROFILES } from './audio';
import {
  BUDDY_SPECIES,
  BUDDY_SPECIES_BY_ID,
  STARTER_BUDDIES,
} from './buddies';
import { BOSS_ROSTERS } from './bosses';
import { CAPTURE_MOVES } from './captureMoves';
import {
  DEFAULT_BOSS_GYM_ID,
  GYM_DEFINITIONS,
  STARTING_ZONE_ID,
  WORLD_ZONE_POSITIONS,
  ZONE_VIBES,
} from './gyms';
import { ALL_TRAINING_MACHINES } from './machines';
import { WORLD_ROUTE_PATHS } from './routes';
import { DEFAULT_TRAINER_PRESET_ID, TRAINER_FOCUS_DEFINITIONS, TRAINER_MUSCLES, TRAINER_PRESETS } from './trainer';
import { STARTING_TUTORIAL_GYM_ID, TUTORIAL_STEPS } from './tutorial';
import { WORKOUT_LOAD_DEFINITIONS } from './workoutLoads';

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
  validateUniqueIds('Buddy species', BUDDY_SPECIES, errors);
  validateUniqueIds('Starting Buddies', STARTER_BUDDIES, errors);
  validateUniqueIds('Gyms', GYM_DEFINITIONS, errors);
  validateUniqueIds('Training machines', ALL_TRAINING_MACHINES, errors);
  validateUniqueIds('Routes', WORLD_ROUTE_PATHS, errors);
  validateUniqueIds('Workout loads', WORKOUT_LOAD_DEFINITIONS, errors);
  validateUniqueIds('Capture moves', CAPTURE_MOVES, errors);
  validateUniqueIds('Boss rosters', BOSS_ROSTERS, errors);
  validateUniqueIds('Bosses', BOSS_ROSTERS.flatMap((roster) => roster.bosses), errors);
  validateUniqueIds('Audio cues', AUDIO_CUES, errors);
  validateUniqueIds('Music profiles', MUSIC_PROFILES, errors);
  validateUniqueIds('Tutorial steps', TUTORIAL_STEPS, errors);

  const dexNumbers = new Set<number>();
  for (const species of BUDDY_SPECIES) {
    if (dexNumbers.has(species.dex)) {
      errors.push(`Buddy species contains duplicate dex number "${species.dex}".`);
    }
    dexNumbers.add(species.dex);
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
  const assignedMachineIds = new Set<string>();
  const focusIds = new Set(TRAINER_FOCUS_DEFINITIONS.map((focus) => focus.id));

  for (const machine of ALL_TRAINING_MACHINES) {
    if (!focusIds.has(machine.focus.toLowerCase())) {
      errors.push(`Training machine "${machine.id}" references missing focus "${machine.focus}".`);
    }
  }

  const gymIds = new Set(GYM_DEFINITIONS.map((gym) => gym.id));
  for (const gym of GYM_DEFINITIONS) {
    const localMachineIds = new Set<string>();
    for (const machineId of gym.machineIds) {
      if (localMachineIds.has(machineId)) {
        errors.push(`Gym "${gym.id}" contains duplicate machine reference "${machineId}".`);
      }
      localMachineIds.add(machineId);
      assignedMachineIds.add(machineId);
      if (!machineIds.has(machineId)) {
        errors.push(`Gym "${gym.id}" references missing machine "${machineId}".`);
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
    for (const boss of roster.bosses) {
      if (!BUDDY_SPECIES_BY_ID.has(boss.speciesId)) {
        errors.push(`Boss "${boss.id}" references missing Buddy species "${boss.speciesId}".`);
      }
    }
  }

  const expectedWorkoutLoads = new Set(['easy', 'steady', 'hard', 'max']);
  for (const load of WORKOUT_LOAD_DEFINITIONS) {
    expectedWorkoutLoads.delete(load.id);
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
  if (import.meta.env.DEV) {
    assertGameContentValid();
  }
}
