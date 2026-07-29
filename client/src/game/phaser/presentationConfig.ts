import type {
  CardinalDirection,
  GymZoneId,
  OverworldLocationId,
  TrainerAppearance,
  TrainerEmote,
} from '../types';
import type { PresentationEffectCue } from './presentationEffects';

export const GAME_LOGICAL_WIDTH = 240;
export const GAME_LOGICAL_HEIGHT = 160;
export const PRESENTATION_LOGICAL_WIDTH = 240;
export const PRESENTATION_LOGICAL_HEIGHT = 180;
export const PRESENTATION_ASPECT_RATIO = 4 / 3;
export const WORLD_TILE_SIZE = 8;
export const BASE_SPRITE_SIZE = 16;

export const PRESENTATION_PALETTE = {
  midnight: '#061519',
  deepTeal: '#0c2b2f',
  iron: '#285057',
  mist: '#b9d8c4',
  chalk: '#eef2d0',
  mint: '#68d39b',
  coral: '#ef6a5b',
  amber: '#f2c14e',
} as const;

export const PRESENTATION_PALETTE_NUMBERS = {
  midnight: 0x061519,
  deepTeal: 0x0c2b2f,
  iron: 0x285057,
  mist: 0xb9d8c4,
  chalk: 0xeef2d0,
  mint: 0x68d39b,
  coral: 0xef6a5b,
  amber: 0xf2c14e,
} as const;

export interface PresentationMotionSettings {
  reducedMotion: boolean;
  screenShake: boolean;
}

export interface GamePresentationSnapshot {
  activeZoneName: string;
  activeZoneType: 'home' | 'starter' | 'higher' | 'route';
  buddyHp: number;
  buddyMaxHp: number;
  buddyName: string;
  encounterActive: boolean;
  effect: PresentationEffectCue | null;
  defeatedGymIds: readonly GymZoneId[];
  facing: CardinalDirection;
  fatigueRatio: number;
  locationId: OverworldLocationId;
  movementSequence: number;
  playerTileX: number;
  playerTileY: number;
  transitionSequence: number;
  trainerEmote: TrainerEmote;
  trainerInitial: string;
  trainerColors: {
    hair: string;
    shirt: string;
    skin: string;
  };
  trainerAppearance: TrainerAppearance;
  visitedZoneIds: readonly GymZoneId[];
  motion: PresentationMotionSettings;
}

export interface PresentationScale {
  height: number;
  isInteger: boolean;
  scale: number;
  width: number;
}

export function calculatePresentationScale(
  availableWidth: number,
  availableHeight: number,
): PresentationScale {
  const safeWidth = Math.max(1, availableWidth);
  const safeHeight = Math.max(1, availableHeight);
  const maximumScale = Math.min(
    safeWidth / PRESENTATION_LOGICAL_WIDTH,
    safeHeight / PRESENTATION_LOGICAL_HEIGHT,
  );
  const integerScale = Math.floor(maximumScale);
  const scale = integerScale >= 1 ? integerScale : Math.max(0.25, maximumScale);

  return {
    height: PRESENTATION_LOGICAL_HEIGHT * scale,
    isInteger: Number.isInteger(scale),
    scale,
    width: PRESENTATION_LOGICAL_WIDTH * scale,
  };
}
