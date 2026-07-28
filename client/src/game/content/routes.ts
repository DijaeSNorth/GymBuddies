import type { CardinalDirection, GymKind, WorldPosition, WorldRouteConnection } from '../types';
import { STARTING_ZONE_ID } from './gyms';

export const WORLD_MOVE_COOLDOWN_MS = 220;
export const WORLD_ROUTE_ENCOUNTER_COOLDOWN_MS = 1800;
export const WORLD_GRID_WIDTH = 23;
export const WORLD_GRID_HEIGHT = 10;
export const WORLD_GRID_PADDING = 8;
export const WORLD_TILE_PX = 19;
export const WORLD_TILE_GAP = 2;
export const WORLD_TILE_PITCH = WORLD_TILE_PX + WORLD_TILE_GAP;

export const WORLD_DIRECTION_VECTORS: Record<CardinalDirection, WorldPosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const WORLD_ROUTE_ENCOUNTER_RATE: Record<GymKind, number> = {
  home: 0,
  starter: 0.16,
  higher: 0.22,
};

export const WORLD_ROUTE_FATIGUE_BY_ZONETYPE: Record<GymKind, number> = {
  home: 0.5,
  starter: 0.9,
  higher: 1.2,
};

export const WORLD_ROUTE_PATHS: WorldRouteConnection[] = [
  {
    id: 'warm-up-path',
    from: 'home',
    to: 'starter-a',
    routeName: 'Warm Up Path',
    travelFatigue: 0.3,
    encounterBoost: 0,
  },
  {
    id: 'starter-link-road',
    from: 'starter-a',
    to: 'starter-b',
    routeName: 'Starter Link Road',
    travelFatigue: 0.65,
    encounterBoost: 0.02,
  },
  {
    id: 'iron-gate-trail',
    from: 'starter-b',
    to: 'higher-1',
    routeName: 'Iron Gate Trail',
    travelFatigue: 1,
    encounterBoost: 0.04,
  },
  {
    id: 'forge-stretch',
    from: 'higher-1',
    to: 'higher-2',
    routeName: 'Forge Stretch',
    travelFatigue: 1.2,
    encounterBoost: 0.05,
  },
  {
    id: 'champion-ascent',
    from: 'higher-2',
    to: 'higher-3',
    routeName: 'Champion Ascent',
    travelFatigue: 1.6,
    encounterBoost: 0.07,
  },
];

export const WORLD_PATH_LINKS: Array<[string, string]> = WORLD_ROUTE_PATHS.map(
  ({ from, to }) => [from, to],
);

export const WORLD_ROUTES = WORLD_ROUTE_PATHS.reduce<Record<string, string[]>>((routes, route) => {
  routes[route.from] ??= [];
  routes[route.to] ??= [];
  routes[route.from].push(route.to);
  routes[route.to].push(route.from);
  return routes;
}, {});

export function getOrderedRouteKey(fromZoneId: string, toZoneId: string) {
  return [fromZoneId, toZoneId].sort().join('|');
}

export const WORLD_ROUTE_PATH_MAP = Object.fromEntries(
  WORLD_ROUTE_PATHS.map((entry) => [getOrderedRouteKey(entry.from, entry.to), entry]),
) as Record<string, WorldRouteConnection>;

export const FALLBACK_UNLOCKED_ZONES = [
  STARTING_ZONE_ID,
  ...(WORLD_ROUTES[STARTING_ZONE_ID] ?? []),
];
