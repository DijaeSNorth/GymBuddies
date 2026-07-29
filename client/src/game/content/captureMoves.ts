import type { CaptureMove } from '../types';

export const CAPTURE_MOVES: CaptureMove[] = [
  {
    id: 'burst',
    title: 'Shoulder Burst',
    tactic: 'explosive shoulder drive',
    summary: 'High immediate power with wider variance and heavy stamina use.',
    power: 20,
    control: -5,
    staminaCost: 28,
    randomSwing: { min: -4, max: 5 },
    counters: 'grind',
    counteredBy: 'snap',
    trainerMuscles: [
      { id: 'shoulders', weight: 0.42 },
      { id: 'chest', weight: 0.33 },
      { id: 'triceps', weight: 0.25 },
    ],
    buddyDisciplines: ['power', 'endurance'],
  },
  {
    id: 'grind',
    title: 'Iron Grind',
    tactic: 'measured center-line pressure',
    summary: 'Reliable control with moderate stamina use and low variance.',
    power: 10,
    control: 12,
    staminaCost: 17,
    randomSwing: { min: -2, max: 3 },
    counters: 'snap',
    counteredBy: 'burst',
    trainerMuscles: [
      { id: 'arms', weight: 0.34 },
      { id: 'back', weight: 0.34 },
      { id: 'core', weight: 0.32 },
    ],
    buddyDisciplines: ['technique', 'endurance', 'recovery'],
  },
  {
    id: 'snap',
    title: 'Snapping Hook',
    tactic: 'reactive wrist turn',
    summary: 'Tactical counter with variable payoff when the tell is read well.',
    power: 14,
    control: 2,
    staminaCost: 22,
    randomSwing: { min: -6, max: 8 },
    counters: 'burst',
    counteredBy: 'grind',
    trainerMuscles: [
      { id: 'arms', weight: 0.4 },
      { id: 'triceps', weight: 0.34 },
      { id: 'shoulders', weight: 0.26 },
    ],
    buddyDisciplines: ['mobility', 'technique'],
  },
];

export const CAPTURE_MOVE_BY_ID = new Map(
  CAPTURE_MOVES.map((move) => [move.id, move]),
);
