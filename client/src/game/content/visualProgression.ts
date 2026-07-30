import type {
  BodybuildingChallengeDefinition,
  DevelopmentPresentationLevel,
  TrainerDevelopmentGroupId,
  TrainerDevelopmentValues,
} from '../types';

export const TRAINER_DEVELOPMENT_GROUPS = [
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'forearms', label: 'Forearms' },
  { id: 'core', label: 'Core' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'quads', label: 'Quads' },
  { id: 'hamstrings', label: 'Hamstrings' },
  { id: 'calves', label: 'Calves' },
] as const satisfies readonly {
  id: TrainerDevelopmentGroupId;
  label: string;
}[];

export const DEVELOPMENT_PRESENTATION_LEVELS = [
  {
    id: 'cosmetic-only',
    label: 'Cosmetic only',
    description: 'Keep the exact Trainer Forge proportions.',
    scale: 0,
  },
  {
    id: 'subtle',
    label: 'Subtle development',
    description: 'Show restrained, gradual training changes.',
    scale: 0.45,
  },
  {
    id: 'standard',
    label: 'Standard development',
    description: 'Show clear development while preserving the chosen build.',
    scale: 0.78,
  },
  {
    id: 'exaggerated',
    label: 'Exaggerated arcade development',
    description: 'Use the strongest readable pixel-art progression.',
    scale: 1.2,
  },
] as const satisfies readonly {
  id: DevelopmentPresentationLevel;
  label: string;
  description: string;
  scale: number;
}[];

export type TrainingMovementPatternId =
  | 'press'
  | 'pull'
  | 'squat'
  | 'hinge'
  | 'calf'
  | 'core'
  | 'mobility'
  | 'recovery';

const weights = (
  partial: Partial<TrainerDevelopmentValues>,
): TrainerDevelopmentValues =>
  Object.fromEntries(
    TRAINER_DEVELOPMENT_GROUPS.map(({ id }) => [id, partial[id] ?? 0]),
  ) as TrainerDevelopmentValues;

export const TRAINING_MOVEMENT_PATTERNS = {
  press: weights({
    chest: 1,
    shoulders: 0.78,
    triceps: 0.72,
    core: 0.18,
  }),
  pull: weights({
    back: 1,
    biceps: 0.76,
    forearms: 0.62,
    core: 0.14,
  }),
  squat: weights({
    quads: 1,
    glutes: 0.82,
    hamstrings: 0.38,
    calves: 0.18,
    core: 0.28,
  }),
  hinge: weights({
    hamstrings: 1,
    glutes: 0.88,
    back: 0.62,
    forearms: 0.22,
    core: 0.3,
  }),
  calf: weights({
    calves: 1,
    quads: 0.16,
    hamstrings: 0.12,
  }),
  core: weights({
    core: 1,
    back: 0.24,
    shoulders: 0.1,
    quads: 0.1,
  }),
  mobility: weights({
    shoulders: 0.22,
    back: 0.2,
    core: 0.38,
    glutes: 0.16,
    hamstrings: 0.16,
  }),
  recovery: weights({}),
} as const satisfies Record<TrainingMovementPatternId, TrainerDevelopmentValues>;

export const MACHINE_VISUAL_DEVELOPMENT_PATTERNS = {
  home_recovery: 'recovery',
  home_dumbbells: 'mobility',
  home_plate: 'press',
  home_bike: 'mobility',
  starter_a_bench: 'press',
  starter_a_ropes: 'pull',
  starter_a_machine: 'press',
  starter_a_rows: 'pull',
  starter_b_leg: 'squat',
  starter_b_cable: 'mobility',
  starter_b_pulley: 'core',
  starter_b_leg_pulse: 'squat',
  iron_armor: 'press',
  iron_row: 'pull',
  iron_chain: 'hinge',
  iron_grip: 'pull',
  apex_platform: 'squat',
  apex_blink: 'mobility',
  apex_harness: 'hinge',
  apex_lat: 'pull',
  glory_crusher: 'press',
  glory_mill: 'calf',
  glory_torso: 'core',
  glory_deadlift: 'hinge',
} as const satisfies Record<string, TrainingMovementPatternId>;

export const BODYBUILDING_CHALLENGES = [
  {
    id: 'pose-sequence',
    name: 'Pose Circuit',
    description: 'Link three readable poses with controlled transitions.',
    focusGroups: ['shoulders', 'biceps', 'quads'],
    preferredPoses: ['front-double-biceps', 'side-chest', 'abs-and-thigh'],
    targetTiming: 0.72,
    fatigueTolerance: 0.58,
    reward: {
      id: 'reward.pose.victory-flow',
      kind: 'pose',
      label: 'Victory Flow pose set',
    },
  },
  {
    id: 'symmetry',
    name: 'Balanced Frame',
    description: 'Present a deliberate, balanced silhouette from front and back.',
    focusGroups: ['shoulders', 'back', 'quads', 'calves'],
    preferredPoses: ['front-relaxed', 'back-relaxed'],
    targetTiming: 0.54,
    fatigueTolerance: 0.68,
    reward: {
      id: 'reward.frame.balance-grid',
      kind: 'trainer-card-frame',
      label: 'Balance Grid trainer-card frame',
    },
  },
  {
    id: 'muscle-showcase',
    name: 'Specialist Spotlight',
    description: 'Choose a pose that clearly presents your trained specialty.',
    focusGroups: ['chest', 'back', 'biceps', 'triceps', 'quads'],
    preferredPoses: ['most-muscular', 'back-double-biceps', 'side-triceps'],
    targetTiming: 0.64,
    fatigueTolerance: 0.52,
    reward: {
      id: 'reward.outfit.spotlight-stripes',
      kind: 'posing-outfit',
      label: 'Spotlight Stripe posing outfit',
    },
  },
  {
    id: 'conditioning',
    name: 'Conditioning Check',
    description: 'Balance recovery, definition, and steady presentation.',
    focusGroups: ['core', 'hamstrings', 'calves'],
    preferredPoses: ['abs-and-thigh', 'side-chest'],
    targetTiming: 0.46,
    fatigueTolerance: 0.38,
    reward: {
      id: 'reward.palette.mint-copper',
      kind: 'rare-palette',
      label: 'Mint-Copper rare palette',
    },
  },
  {
    id: 'pump-timing',
    name: 'Peak Window',
    description: 'Enter the stage while the trained areas are still pumped.',
    focusGroups: ['chest', 'shoulders', 'biceps', 'triceps'],
    preferredPoses: ['post-set-pump', 'most-muscular'],
    targetTiming: 0.86,
    fatigueTolerance: 0.5,
    reward: {
      id: 'reward.aura.tempo-glow',
      kind: 'aura',
      label: 'Tempo Glow aura',
    },
  },
  {
    id: 'stage-presence',
    name: 'Stage Command',
    description: 'Combine timing, outfit, pose choice, and a confident finish.',
    focusGroups: ['shoulders', 'chest', 'back', 'quads'],
    preferredPoses: ['victory-flex', 'front-double-biceps', 'side-chest'],
    targetTiming: 0.76,
    fatigueTolerance: 0.62,
    reward: {
      id: 'reward.cape.home-champion',
      kind: 'champion-cape',
      label: 'Home Champion cape',
    },
  },
] as const satisfies readonly BodybuildingChallengeDefinition[];

export const VISUAL_DEVELOPMENT_CAP = 100;
export const PUMP_LEVEL_CAP = 100;
export const RECENT_TRAINING_LIMIT = 40;
export const PHYSIQUE_SNAPSHOT_LIMIT = 12;
export const PUMP_DECAY_MS = 12 * 60 * 1000;
