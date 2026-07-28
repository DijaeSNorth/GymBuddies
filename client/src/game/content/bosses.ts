import type { GymBossRoster } from '../types';
import { DEFAULT_BOSS_GYM_ID } from './gyms';

export const BOSS_MIN_MS = 5 * 60 * 1000;
export const BOSS_MAX_MS = 10 * 60 * 1000;

export const BOSS_ROSTERS: GymBossRoster[] = [
  {
    id: 'boss-roster-home',
    gymId: 'home',
    bosses: [
      {
        id: 'home-watchman',
        name: 'Mat Watchman',
        speciesId: 'brawny-bear',
        levelShift: 4,
        catchMultiplier: 0.7,
        powerBoost: 9,
      },
      {
        id: 'home-librarian',
        name: 'Steel Desk Warden',
        speciesId: 'buff-otter',
        levelShift: 3,
        catchMultiplier: 0.7,
        powerBoost: 7,
      },
    ],
  },
  {
    id: 'boss-roster-starter-a',
    gymId: 'starter-a',
    bosses: [
      {
        id: 'a-rhino',
        name: 'Bench Rhino',
        speciesId: 'ripped-rhino',
        levelShift: 7,
        catchMultiplier: 0.62,
        powerBoost: 14,
      },
      {
        id: 'a-bison',
        name: 'Redline Bison',
        speciesId: 'boulder-bison',
        levelShift: 8,
        catchMultiplier: 0.58,
        powerBoost: 16,
      },
    ],
  },
  {
    id: 'boss-roster-starter-b',
    gymId: 'starter-b',
    bosses: [
      {
        id: 'b-wolf',
        name: 'Iron Wolf Brute',
        speciesId: 'iron-wolf',
        levelShift: 9,
        catchMultiplier: 0.55,
        powerBoost: 18,
      },
      {
        id: 'b-boar',
        name: 'Bull Boar Prime',
        speciesId: 'muscled-boar',
        levelShift: 8,
        catchMultiplier: 0.56,
        powerBoost: 17,
      },
    ],
  },
  {
    id: 'boss-roster-higher-1',
    gymId: 'higher-1',
    bosses: [
      {
        id: 'h1-gryphon',
        name: 'Iron Griffon',
        speciesId: 'slycera-griffin',
        levelShift: 12,
        catchMultiplier: 0.52,
        powerBoost: 22,
      },
      {
        id: 'h1-gorilla',
        name: 'Glory Gorilla Mk.I',
        speciesId: 'pygmy-sable-pegasus',
        levelShift: 11,
        catchMultiplier: 0.5,
        powerBoost: 24,
      },
    ],
  },
  {
    id: 'boss-roster-higher-2',
    gymId: 'higher-2',
    bosses: [
      {
        id: 'h2-hydra',
        name: 'Apex Hydra',
        speciesId: 'cinder-manticore',
        levelShift: 13,
        catchMultiplier: 0.5,
        powerBoost: 25,
      },
      {
        id: 'h2-manticore',
        name: 'Apex Manticore',
        speciesId: 'hydra-lurcher',
        levelShift: 12,
        catchMultiplier: 0.48,
        powerBoost: 27,
      },
    ],
  },
  {
    id: 'boss-roster-higher-3',
    gymId: 'higher-3',
    bosses: [
      {
        id: 'h3-pegasus',
        name: 'Glory Pegasus',
        speciesId: 'pygmy-sable-pegasus',
        levelShift: 14,
        catchMultiplier: 0.48,
        powerBoost: 28,
      },
      {
        id: 'h3-pegas',
        name: 'Glory Twin Pegasus',
        speciesId: 'slycera-griffin',
        levelShift: 15,
        catchMultiplier: 0.45,
        powerBoost: 30,
      },
    ],
  },
];

export const GYM_BOSSES = Object.fromEntries(
  BOSS_ROSTERS.map((roster) => [roster.gymId, roster.bosses]),
);

export function getBossesForGym(gymId: string) {
  return GYM_BOSSES[gymId] ?? GYM_BOSSES[DEFAULT_BOSS_GYM_ID] ?? [];
}
