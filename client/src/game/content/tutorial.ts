import type { TutorialStep } from '../types';

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'train-at-home',
    text: 'You are at Home Gym. Train one Buddy on the home machines to build first-day momentum.',
  },
  {
    id: 'travel-to-starter-gym',
    text: 'Walk to Starter Gym A/B with the route from Home Gym and learn basic scouting.',
  },
  {
    id: 'scout-wild-buddy',
    text: 'Scout a wild Buddy in Starter Gym A/B, then start a match.',
  },
  {
    id: 'complete-capture',
    text: 'Press moves until the meter hits your side and lock in a catch.',
  },
  {
    id: 'watch-for-bosses',
    text: 'Watch for boss encounters in any gym every 5 to 10 minutes and beat them for progress.',
  },
];

export const STARTING_TUTORIAL_GYM_ID = 'starter-a';
