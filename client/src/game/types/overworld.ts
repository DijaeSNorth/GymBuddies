import type { CardinalDirection } from './world';

export type GymZoneId =
  | 'home'
  | 'starter-a'
  | 'starter-b'
  | 'higher-1'
  | 'higher-2'
  | 'higher-3';

export type OverworldLocationId =
  | 'home-gym'
  | 'route-1'
  | 'starter-gym-a'
  | 'route-2'
  | 'starter-gym-b'
  | 'route-3'
  | 'iron-gym'
  | 'route-4'
  | 'apex-gym'
  | 'route-5'
  | 'glory-gym';

export type OverworldInteractionKind =
  | 'door'
  | 'sign'
  | 'machine'
  | 'npc'
  | 'recovery';

export type OverworldPropKind =
  | 'banner'
  | 'bench'
  | 'chain-post'
  | 'chalk-mark'
  | 'fan'
  | 'hydration'
  | 'light-post'
  | 'plate-stack'
  | 'planter'
  | 'steam-vent'
  | 'trophy';

export type RouteRewardQuality =
  | 'foundation'
  | 'improved'
  | 'strong'
  | 'elite'
  | 'champion';

export interface OverworldTilePosition {
  x: number;
  y: number;
}

export interface OverworldTileRect extends OverworldTilePosition {
  width: number;
  height: number;
}

export interface OverworldPalette {
  id: string;
  ground: string;
  groundAlternate: string;
  wall: string;
  accent: string;
  encounter: string;
  rareEncounter: string;
  light: string;
}

export interface OverworldProp {
  id: string;
  kind: OverworldPropKind;
  position: OverworldTilePosition;
  story: string;
}

export interface OverworldLightArea extends OverworldTileRect {
  id: string;
  color: string;
  alpha: number;
}

export type WorldConnectionRequirement =
  | {
      type: 'always';
      description: string;
    }
  | {
      type: 'visited-zone';
      zoneId: GymZoneId;
      description: string;
    }
  | {
      type: 'boss-completed';
      zoneId: GymZoneId;
      description: string;
    };

export interface WorldJourneyConnection {
  id: string;
  kind: 'journey-route' | 'shortcut';
  fromLocationId: OverworldLocationId;
  toLocationId: OverworldLocationId;
  viaLocationId?: OverworldLocationId;
  fromZoneId: GymZoneId;
  toZoneId: GymZoneId;
  routeName: string;
  travelFatigue: number;
  encounterBoost: number;
  difficultyRank: number;
  rewardQuality: RouteRewardQuality;
  preview: string;
  requirement: WorldConnectionRequirement;
}

export interface OverworldProgressionSnapshot {
  visitedZoneIds: readonly GymZoneId[];
  defeatedGymIds: readonly GymZoneId[];
}

export interface OverworldInteractable {
  id: string;
  kind: OverworldInteractionKind;
  position: OverworldTilePosition;
  footprint?: OverworldTileRect;
  blocksMovement: boolean;
  label: string;
  message: string;
  machineId?: string;
  transitionId?: string;
  characterId?: string;
}

export interface OverworldTransition {
  id: string;
  connectionId: string;
  kind: 'door' | 'route-exit';
  trigger: 'interact' | 'step';
  position: OverworldTilePosition;
  targetLocationId: OverworldLocationId;
  targetPosition: OverworldTilePosition;
  targetFacing: CardinalDirection;
  targetZoneId?: GymZoneId;
  routeName: string;
  fatigueCost: number;
}

export interface OverworldEncounterArea extends OverworldTileRect {
  id: string;
  gymId: Exclude<GymZoneId, 'home'>;
  routeName: string;
  encounterBoost: number;
  rarity: 'standard' | 'rare';
  rewardQuality: RouteRewardQuality;
}

export interface OverworldMapConfig {
  id: OverworldLocationId;
  name: string;
  zoneId: GymZoneId | null;
  kind: 'gym' | 'route';
  width: number;
  height: number;
  tileSize: number;
  defaultSpawn: OverworldTilePosition;
  floorStyle: 'gym-grid' | 'route-lane';
  palette: OverworldPalette;
  collisionRects: OverworldTileRect[];
  interactables: OverworldInteractable[];
  transitions: OverworldTransition[];
  encounterAreas: OverworldEncounterArea[];
  props: OverworldProp[];
  lights: OverworldLightArea[];
}

export interface OverworldState {
  locationId: OverworldLocationId;
  position: OverworldTilePosition;
  facing: CardinalDirection;
  nextMoveAt: number;
  lastEncounterAt: number;
  movementSequence: number;
  transitionSequence: number;
}

export type OverworldEvent =
  | {
      type: 'blocked';
      direction: CardinalDirection;
      position: OverworldTilePosition;
    }
  | {
      type: 'cooldown';
      remainingMs: number;
    }
  | {
      type: 'moved';
      direction: CardinalDirection;
      from: OverworldTilePosition;
      to: OverworldTilePosition;
    }
  | {
      type: 'interaction';
      interactable: OverworldInteractable;
    }
  | {
      type: 'nothing-to-interact';
      position: OverworldTilePosition;
    }
  | {
      type: 'encounter-check';
      area: OverworldEncounterArea;
    }
  | {
      type: 'transition';
      transition: OverworldTransition;
      fromLocationId: OverworldLocationId;
      toLocationId: OverworldLocationId;
    }
  | {
      type: 'locked-transition';
      transition: OverworldTransition;
      requirement: WorldConnectionRequirement;
    };

export interface OverworldActionResult {
  state: OverworldState;
  events: OverworldEvent[];
}
