import type { GymArea, GymDefinition, WorldPosition, ZoneVibe } from '../types';
import { getTrainingMachineById } from './machines';

export const STARTING_ZONE_ID = 'home';
export const DEFAULT_BOSS_GYM_ID = 'starter-a';

export const GYM_DEFINITIONS: GymDefinition[] = [
  {
    id: 'home',
    name: 'Home Gym',
    machineIds: ['home_recovery', 'home_dumbbells', 'home_plate', 'home_bike'],
    defaultMachineId: 'home_recovery',
    type: 'home',
    levelMin: 1,
    levelMax: 1,
    blurb: 'Train and heal your team before entering encounters.',
  },
  {
    id: 'starter-a',
    name: 'Starter Gym A',
    machineIds: ['starter_a_bench', 'starter_a_ropes', 'starter_a_machine', 'starter_a_rows'],
    defaultMachineId: 'starter_a_bench',
    type: 'starter',
    levelMin: 1,
    levelMax: 15,
    blurb: 'Low-risk captures and friendly arena pressure.',
  },
  {
    id: 'starter-b',
    name: 'Starter Gym B',
    machineIds: ['starter_b_leg', 'starter_b_cable', 'starter_b_pulley', 'starter_b_leg_pulse'],
    defaultMachineId: 'starter_b_leg',
    type: 'starter',
    levelMin: 16,
    levelMax: 25,
    blurb: 'Mid-game catches. Your control matters more here.',
  },
  {
    id: 'higher-1',
    name: 'Iron Gym',
    machineIds: ['iron_armor', 'iron_row', 'iron_chain', 'iron_grip'],
    defaultMachineId: 'iron_armor',
    type: 'higher',
    levelMin: 26,
    levelMax: 35,
    blurb: 'Higher pressure and stronger opponents.',
  },
  {
    id: 'higher-2',
    name: 'Apex Gym',
    machineIds: ['apex_platform', 'apex_blink', 'apex_harness', 'apex_lat'],
    defaultMachineId: 'apex_platform',
    type: 'higher',
    levelMin: 36,
    levelMax: 45,
    blurb: 'Late-band creatures, better prediction beats brute force.',
  },
  {
    id: 'higher-3',
    name: 'Glory Gym',
    machineIds: ['glory_crusher', 'glory_mill', 'glory_torso', 'glory_deadlift'],
    defaultMachineId: 'glory_crusher',
    type: 'higher',
    levelMin: 36,
    levelMax: 55,
    blurb: 'Rare encounters and mythological pressure matches.',
  },
];

export const GYMS: GymArea[] = GYM_DEFINITIONS.map((gym) => ({
  ...gym,
  machines: gym.machineIds.map(getTrainingMachineById),
}));

export const GYM_BY_ID = new Map(GYMS.map((gym) => [gym.id, gym]));

export const ZONE_NAMES = Object.fromEntries(GYMS.map((gym) => [gym.id, gym.name])) as Record<string, string>;

export const ZONE_VIBES: Record<string, ZoneVibe> = {
  home: { id: 'home', icon: '🏠', mood: 'Home warm-up hall', theme: 'calm baseline', accent: 'Recovery' },
  'starter-a': {
    id: 'starter-a',
    icon: '🏋',
    mood: 'Starter pressure room',
    theme: 'steady overload',
    accent: 'Momentum',
  },
  'starter-b': {
    id: 'starter-b',
    icon: '🛡',
    mood: 'Starter control pit',
    theme: 'grip discipline',
    accent: 'Tension',
  },
  'higher-1': { id: 'higher-1', icon: '⚔', mood: 'Higher gate', theme: 'first gauntlet', accent: 'Grip war' },
  'higher-2': { id: 'higher-2', icon: '🔥', mood: 'Higher forge', theme: 'mythic trials', accent: 'Resolve' },
  'higher-3': {
    id: 'higher-3',
    icon: '🏆',
    mood: 'Final deck',
    theme: 'late-game pressure',
    accent: 'Dominance',
  },
};

export const WORLD_ZONE_POSITIONS: Record<string, WorldPosition> = {
  home: { x: 2, y: 6 },
  'starter-a': { x: 6, y: 6 },
  'starter-b': { x: 10, y: 6 },
  'higher-1': { x: 10, y: 3 },
  'higher-2': { x: 14, y: 3 },
  'higher-3': { x: 18, y: 3 },
};

export function getGymById(id: string) {
  const gym = GYM_BY_ID.get(id);
  if (!gym) {
    throw new Error(`Unknown gym "${id}".`);
  }
  return gym;
}

export function getDefaultGymMachine(gym: GymArea) {
  return getTrainingMachineById(gym.defaultMachineId);
}
