import type {
  FocusMuscleBoost,
  TrainerFocusDefinition,
  TrainerMuscleAttribute,
  TrainerPreset,
} from '../types';

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
  { id: 'shoulders', key: 'shoulders', label: 'Shoulders', detail: 'Capsule and deltoid depth' },
  { id: 'chest', key: 'chest', label: 'Chest', detail: 'Upper chest and pec sweep' },
  { id: 'arms', key: 'arms', label: 'Biceps/Forearm', detail: 'Forearm + curl width' },
  { id: 'triceps', key: 'triceps', label: 'Triceps', detail: 'Posterior elbow mass' },
  { id: 'back', key: 'back', label: 'Back', detail: 'Lats and upper torso width' },
  { id: 'core', key: 'core', label: 'Core', detail: 'Ab and oblique block' },
  { id: 'quads', key: 'quads', label: 'Quads', detail: 'Upper leg drive mass' },
  { id: 'calves', key: 'calves', label: 'Calves', detail: 'Lower-leg density' },
];

export const TRAINER_PRESETS: TrainerPreset[] = [
  {
    id: 'rogue-rex',
    profile: {
      name: 'Rogue Rex',
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
