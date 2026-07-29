import type {
  FocusMuscleBoost,
  TrainerFocusDefinition,
  TrainerBodyPreset,
  TrainerMuscleAttribute,
  TrainerPreset,
} from '../types';
import {
  createLegacyTrainerAppearance,
} from './trainerAppearance';

export const MAX_MUSCLE_LEVEL = 14;

export const TRAINER_FOCUS_DEFINITIONS: TrainerFocusDefinition[] = [
  { id: 'recovery', boosts: [{ muscle: 'core', weight: 1 }] },
  { id: 'stability', boosts: [{ muscle: 'shoulders', weight: 1 }, { muscle: 'core', weight: 1 }] },
  { id: 'control', boosts: [{ muscle: 'arms', weight: 1 }, { muscle: 'triceps', weight: 1 }] },
  { id: 'endurance', boosts: [{ muscle: 'quads', weight: 1 }, { muscle: 'calves', weight: 1 }] },
  {
    id: 'power',
    boosts: [
      { muscle: 'chest', weight: 2 },
      { muscle: 'arms', weight: 2 },
      { muscle: 'shoulders', weight: 1 },
      { muscle: 'triceps', weight: 1 },
    ],
  },
  { id: 'grip', boosts: [{ muscle: 'arms', weight: 3 }] },
  {
    id: 'lockout',
    boosts: [
      { muscle: 'chest', weight: 1 },
      { muscle: 'triceps', weight: 2 },
      { muscle: 'core', weight: 1 },
    ],
  },
  { id: 'pull power', boosts: [{ muscle: 'back', weight: 3 }, { muscle: 'arms', weight: 1 }] },
  { id: 'base drive', boosts: [{ muscle: 'quads', weight: 2 }, { muscle: 'core', weight: 2 }] },
  { id: 'tempo', boosts: [{ muscle: 'core', weight: 1 }, { muscle: 'quads', weight: 1 }] },
  {
    id: 'timing',
    boosts: [
      { muscle: 'core', weight: 1 },
      { muscle: 'shoulders', weight: 1 },
      { muscle: 'back', weight: 1 },
    ],
  },
  {
    id: 'strength',
    boosts: [
      { muscle: 'chest', weight: 2 },
      { muscle: 'back', weight: 1 },
      { muscle: 'arms', weight: 2 },
    ],
  },
  {
    id: 'durability',
    boosts: [
      { muscle: 'quads', weight: 1 },
      { muscle: 'calves', weight: 1 },
      { muscle: 'core', weight: 1 },
    ],
  },
  {
    id: 'precision',
    boosts: [
      { muscle: 'triceps', weight: 1 },
      { muscle: 'shoulders', weight: 1 },
      { muscle: 'core', weight: 1 },
    ],
  },
  { id: 'rhythm', boosts: [{ muscle: 'core', weight: 1 }, { muscle: 'calves', weight: 1 }] },
  {
    id: 'leverage',
    boosts: [
      { muscle: 'back', weight: 2 },
      { muscle: 'chest', weight: 1 },
      { muscle: 'core', weight: 1 },
    ],
  },
  { id: 'back pressure', boosts: [{ muscle: 'back', weight: 3 }, { muscle: 'core', weight: 1 }] },
  { id: 'raw strength', boosts: [{ muscle: 'chest', weight: 2 }, { muscle: 'arms', weight: 2 }] },
  { id: 'posture', boosts: [{ muscle: 'shoulders', weight: 1 }, { muscle: 'core', weight: 2 }] },
  { id: 'core transfer', boosts: [{ muscle: 'core', weight: 2 }, { muscle: 'quads', weight: 1 }] },
  {
    id: 'ground break',
    boosts: [
      { muscle: 'quads', weight: 2 },
      { muscle: 'calves', weight: 2 },
      { muscle: 'core', weight: 1 },
    ],
  },
];

export const FOCUSED_MUSCLES = Object.fromEntries(
  TRAINER_FOCUS_DEFINITIONS.map((definition) => [definition.id, definition.boosts]),
) as Record<string, FocusMuscleBoost[]>;

export const TRAINER_MUSCLES: TrainerMuscleAttribute[] = [
  {
    id: 'shoulders',
    key: 'shoulders',
    label: 'Shoulders',
    detail: 'Improves Stability, Timing, Power, and Precision machine focus.',
  },
  {
    id: 'chest',
    key: 'chest',
    label: 'Chest',
    detail: 'Improves Power, Lockout, Strength, Leverage, and Raw Strength focus.',
  },
  {
    id: 'arms',
    key: 'arms',
    label: 'Arms',
    detail: 'Improves Control, Grip, Pull Power, Strength, and capture pressure.',
  },
  {
    id: 'triceps',
    key: 'triceps',
    label: 'Triceps',
    detail: 'Improves Control, Lockout, Precision, and Power machine focus.',
  },
  {
    id: 'back',
    key: 'back',
    label: 'Back',
    detail: 'Improves Pull Power, Leverage, Back Pressure, Timing, and Strength focus.',
  },
  {
    id: 'core',
    key: 'core',
    label: 'Core',
    detail: 'Supports Recovery, Stability, Lockout, Timing, Base Drive, and workout consistency.',
  },
  {
    id: 'quads',
    key: 'quads',
    label: 'Quads',
    detail: 'Improves Endurance, Tempo, Base Drive, Durability, and Ground Break focus.',
  },
  {
    id: 'calves',
    key: 'calves',
    label: 'Calves',
    detail: 'Improves Endurance, Rhythm, Durability, and Ground Break focus.',
  },
];

export const TRAINER_BODY_PRESETS: TrainerBodyPreset[] = [
  {
    id: 'balanced-foundation',
    label: 'Balanced Foundation',
    description: 'Even starting values for learning every machine family.',
    muscles: {
      shoulders: 3,
      chest: 3,
      arms: 3,
      triceps: 3,
      back: 3,
      core: 3,
      quads: 3,
      calves: 3,
    },
  },
  {
    id: 'control-specialist',
    label: 'Control Specialist',
    description: 'Starts stronger in grip, timing, stability, and precise lockouts.',
    muscles: {
      shoulders: 4,
      chest: 2,
      arms: 4,
      triceps: 4,
      back: 3,
      core: 4,
      quads: 2,
      calves: 2,
    },
  },
  {
    id: 'power-starter',
    label: 'Power Starter',
    description: 'Starts stronger in pressing, pulling, and decisive arena pressure.',
    muscles: {
      shoulders: 4,
      chest: 5,
      arms: 4,
      triceps: 3,
      back: 4,
      core: 2,
      quads: 2,
      calves: 1,
    },
  },
  {
    id: 'endurance-starter',
    label: 'Endurance Starter',
    description: 'Starts stronger in sustained sets, rhythm, recovery support, and base drive.',
    muscles: {
      shoulders: 2,
      chest: 2,
      arms: 2,
      triceps: 2,
      back: 3,
      core: 4,
      quads: 5,
      calves: 4,
    },
  },
];

export const DEFAULT_TRAINER_BODY_PRESET_ID = 'balanced-foundation';

export function getTrainerBodyPresetById(id: string) {
  const preset = TRAINER_BODY_PRESETS.find((entry) => entry.id === id);
  if (!preset) throw new Error(`Unknown trainer body preset "${id}".`);
  return preset;
}

export const TRAINER_APPEARANCE_COLORS = {
  hair: ['#262626', '#4f3a20', '#8a5a36', '#d7b56d', '#6a426f', '#234f5a'],
  skin: ['#f4d3b3', '#e4b98b', '#c98f65', '#9f6748', '#70452f', '#442a20'],
  top: ['#2e66af', '#2f8f75', '#b84f39', '#6c2f8f', '#d28a2e', '#385060'],
  glove: ['#f3c56b', '#ef765f', '#69b8ff', '#68d39b', '#d8a8ff', '#eef2d0'],
  shoes: ['#252525', '#31495c', '#6d3f36', '#3e405f', '#52613d', '#ece2c1'],
} as const;

export const TRAINER_PRESETS: TrainerPreset[] = [
  {
    id: 'rogue-rex',
    profile: {
      name: 'Rogue Rex',
      appearance: createLegacyTrainerAppearance({
        skin: '#f2c48c',
        hair: '#4f3a20',
        top: '#2e66af',
        shoes: '#252525',
        glove: '#f3c56b',
      }),
      appearancePresets: [],
      skin: '#f2c48c',
      hair: '#4f3a20',
      top: '#2e66af',
      shoes: '#252525',
      glove: '#f3c56b',
      muscles: { shoulders: 4, chest: 3, arms: 3, triceps: 2, back: 2, core: 2, quads: 1, calves: 1 },
    },
  },
  {
    id: 'neon-nova',
    profile: {
      name: 'Neon Nova',
      appearance: createLegacyTrainerAppearance({
        skin: '#d9b88f',
        hair: '#262626',
        top: '#6c2f8f',
        shoes: '#0f1020',
        glove: '#ffd166',
      }),
      appearancePresets: [],
      skin: '#d9b88f',
      hair: '#262626',
      top: '#6c2f8f',
      shoes: '#0f1020',
      glove: '#ffd166',
      muscles: { shoulders: 3, chest: 2, arms: 4, triceps: 3, back: 2, core: 3, quads: 1, calves: 2 },
    },
  },
  {
    id: 'copper-coil',
    profile: {
      name: 'Copper Coil',
      appearance: createLegacyTrainerAppearance({
        skin: '#d6ad7b',
        hair: '#5a3520',
        top: '#b84f39',
        shoes: '#26262a',
        glove: '#ff7f50',
      }),
      appearancePresets: [],
      skin: '#d6ad7b',
      hair: '#5a3520',
      top: '#b84f39',
      shoes: '#26262a',
      glove: '#ff7f50',
      muscles: { shoulders: 2, chest: 5, arms: 2, triceps: 2, back: 3, core: 2, quads: 2, calves: 1 },
    },
  },
  {
    id: 'iron-jade',
    profile: {
      name: 'Iron Jade',
      appearance: createLegacyTrainerAppearance({
        skin: '#f0d0a3',
        hair: '#1f1f17',
        top: '#2f8f75',
        shoes: '#2f2f38',
        glove: '#97d700',
      }),
      appearancePresets: [],
      skin: '#f0d0a3',
      hair: '#1f1f17',
      top: '#2f8f75',
      shoes: '#2f2f38',
      glove: '#97d700',
      muscles: { shoulders: 5, chest: 4, arms: 3, triceps: 3, back: 4, core: 4, quads: 3, calves: 2 },
    },
  },
];

export const DEFAULT_TRAINER_PRESET_ID = 'rogue-rex';

export function getTrainerPresetById(id: string) {
  const preset = TRAINER_PRESETS.find((entry) => entry.id === id);
  if (!preset) {
    throw new Error(`Unknown trainer preset "${id}".`);
  }
  return preset;
}
