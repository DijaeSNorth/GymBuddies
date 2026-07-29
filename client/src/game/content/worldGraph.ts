import type {
  GymZoneId,
  OverworldLocationId,
  OverworldProgressionSnapshot,
  WorldJourneyConnection,
} from '../types';

export const JOURNEY_GYM_ZONE_IDS: GymZoneId[] = [
  'home',
  'starter-a',
  'starter-b',
  'higher-1',
  'higher-2',
  'higher-3',
];

export const JOURNEY_GYM_LOCATION_IDS: OverworldLocationId[] = [
  'home-gym',
  'starter-gym-a',
  'starter-gym-b',
  'iron-gym',
  'apex-gym',
  'glory-gym',
];

export const JOURNEY_ROUTE_LOCATION_IDS: OverworldLocationId[] = [
  'route-1',
  'route-2',
  'route-3',
  'route-4',
  'route-5',
];

export const JOURNEY_CRITICAL_PATH: OverworldLocationId[] = [
  'home-gym',
  'route-1',
  'starter-gym-a',
  'route-2',
  'starter-gym-b',
  'route-3',
  'iron-gym',
  'route-4',
  'apex-gym',
  'route-5',
  'glory-gym',
];

export const WORLD_JOURNEY_CONNECTIONS: WorldJourneyConnection[] = [
  {
    id: 'warm-up-path',
    kind: 'journey-route',
    fromLocationId: 'home-gym',
    viaLocationId: 'route-1',
    toLocationId: 'starter-gym-a',
    fromZoneId: 'home',
    toZoneId: 'starter-a',
    routeName: 'Warm Up Path',
    travelFatigue: 0.3,
    encounterBoost: 0,
    difficultyRank: 1,
    rewardQuality: 'foundation',
    preview: 'Sunlit track lanes, gentle pulse turf, and foundation-level Buddy activity.',
    requirement: {
      type: 'always',
      description: 'Open after trainer creation.',
    },
  },
  {
    id: 'starter-link-road',
    kind: 'journey-route',
    fromLocationId: 'starter-gym-a',
    viaLocationId: 'route-2',
    toLocationId: 'starter-gym-b',
    fromZoneId: 'starter-a',
    toZoneId: 'starter-b',
    routeName: 'Starter Link Road',
    travelFatigue: 0.65,
    encounterBoost: 0.02,
    difficultyRank: 2,
    rewardQuality: 'improved',
    preview: 'Cool-blue training lanes with control markers and stronger technique-focused Buddies.',
    requirement: {
      type: 'visited-zone',
      zoneId: 'starter-a',
      description: 'Visit Starter Gym A to open Starter Link Road.',
    },
  },
  {
    id: 'iron-gate-trail',
    kind: 'journey-route',
    fromLocationId: 'starter-gym-b',
    viaLocationId: 'route-3',
    toLocationId: 'iron-gym',
    fromZoneId: 'starter-b',
    toZoneId: 'higher-1',
    routeName: 'Iron Gate Trail',
    travelFatigue: 1,
    encounterBoost: 0.04,
    difficultyRank: 3,
    rewardQuality: 'strong',
    preview: 'Weathered plate markers, chain posts, and a sheltered recovery bay before Iron Gym.',
    requirement: {
      type: 'visited-zone',
      zoneId: 'starter-b',
      description: 'Visit Starter Gym B to open Iron Gate Trail.',
    },
  },
  {
    id: 'forge-stretch',
    kind: 'journey-route',
    fromLocationId: 'iron-gym',
    viaLocationId: 'route-4',
    toLocationId: 'apex-gym',
    fromZoneId: 'higher-1',
    toZoneId: 'higher-2',
    routeName: 'Forge Stretch',
    travelFatigue: 1.2,
    encounterBoost: 0.05,
    difficultyRank: 4,
    rewardQuality: 'elite',
    preview: 'Violet dusk, warm steam vents, and elite Buddy signals around the forge pylons.',
    requirement: {
      type: 'visited-zone',
      zoneId: 'higher-1',
      description: 'Visit Iron Gym to open Forge Stretch.',
    },
  },
  {
    id: 'champion-ascent',
    kind: 'journey-route',
    fromLocationId: 'apex-gym',
    viaLocationId: 'route-5',
    toLocationId: 'glory-gym',
    fromZoneId: 'higher-2',
    toZoneId: 'higher-3',
    routeName: 'Champion Ascent',
    travelFatigue: 1.6,
    encounterBoost: 0.07,
    difficultyRank: 5,
    rewardQuality: 'champion',
    preview: 'High-altitude fans, gold trail banners, rare summit turf, and champion-quality rewards.',
    requirement: {
      type: 'visited-zone',
      zoneId: 'higher-2',
      description: 'Visit Apex Gym to open Champion Ascent.',
    },
  },
  {
    id: 'recovery-circuit-shortcut',
    kind: 'shortcut',
    fromLocationId: 'home-gym',
    toLocationId: 'starter-gym-b',
    fromZoneId: 'home',
    toZoneId: 'starter-b',
    routeName: 'Recovery Circuit',
    travelFatigue: 0.25,
    encounterBoost: 0,
    difficultyRank: 2,
    rewardQuality: 'improved',
    preview: 'A staff-only recovery tram linking Home Gym and Starter Gym B.',
    requirement: {
      type: 'boss-completed',
      zoneId: 'starter-b',
      description: 'Defeat a Starter Gym B boss to unlock the Recovery Circuit shortcut.',
    },
  },
  {
    id: 'glory-lift-shortcut',
    kind: 'shortcut',
    fromLocationId: 'iron-gym',
    toLocationId: 'glory-gym',
    fromZoneId: 'higher-1',
    toZoneId: 'higher-3',
    routeName: 'Glory Lift',
    travelFatigue: 0.55,
    encounterBoost: 0,
    difficultyRank: 5,
    rewardQuality: 'champion',
    preview: 'A counterweighted lift that bypasses the summit switchbacks.',
    requirement: {
      type: 'boss-completed',
      zoneId: 'higher-2',
      description: 'Defeat an Apex Gym boss to unlock the Glory Lift shortcut.',
    },
  },
];

export const WORLD_JOURNEY_CONNECTION_BY_ID = new Map(
  WORLD_JOURNEY_CONNECTIONS.map((connection) => [connection.id, connection]),
);

export function getWorldJourneyConnection(connectionId: string) {
  const connection = WORLD_JOURNEY_CONNECTION_BY_ID.get(connectionId);
  if (!connection) throw new Error(`Unknown world connection "${connectionId}".`);
  return connection;
}

export function isWorldConnectionAccessible(
  connection: WorldJourneyConnection,
  progression: OverworldProgressionSnapshot,
) {
  if (connection.requirement.type === 'always') return true;
  if (connection.requirement.type === 'visited-zone') {
    return progression.visitedZoneIds.includes(connection.requirement.zoneId);
  }
  return progression.defeatedGymIds.includes(connection.requirement.zoneId);
}

export function getAccessibleLocationIds(
  startLocationId: OverworldLocationId,
  progression: OverworldProgressionSnapshot,
) {
  const neighbors = new Map<OverworldLocationId, OverworldLocationId[]>();
  const connect = (from: OverworldLocationId, to: OverworldLocationId) => {
    neighbors.set(from, [...(neighbors.get(from) ?? []), to]);
    neighbors.set(to, [...(neighbors.get(to) ?? []), from]);
  };

  WORLD_JOURNEY_CONNECTIONS.forEach((connection) => {
    if (!isWorldConnectionAccessible(connection, progression)) return;
    if (connection.viaLocationId) {
      connect(connection.fromLocationId, connection.viaLocationId);
      connect(connection.viaLocationId, connection.toLocationId);
    } else {
      connect(connection.fromLocationId, connection.toLocationId);
    }
  });

  const reached = new Set<OverworldLocationId>([startLocationId]);
  const queue: OverworldLocationId[] = [startLocationId];
  for (let index = 0; index < queue.length; index += 1) {
    for (const neighbor of neighbors.get(queue[index]) ?? []) {
      if (reached.has(neighbor)) continue;
      reached.add(neighbor);
      queue.push(neighbor);
    }
  }
  return reached;
}

export function inferVisitedZoneIds(
  unlockedZoneIds: readonly string[],
  activeZoneId: string,
) {
  const inferred = new Set<GymZoneId>(['home']);
  if (JOURNEY_GYM_ZONE_IDS.includes(activeZoneId as GymZoneId)) {
    inferred.add(activeZoneId as GymZoneId);
  }
  WORLD_JOURNEY_CONNECTIONS.filter(
    (connection) => connection.kind === 'journey-route',
  ).forEach((connection) => {
    if (unlockedZoneIds.includes(connection.toZoneId)) {
      inferred.add(connection.fromZoneId);
    }
  });
  return JOURNEY_GYM_ZONE_IDS.filter((zoneId) => inferred.has(zoneId));
}

export function validateWorldJourneyGraph() {
  const issues: string[] = [];
  const connectionIds = new Set<string>();
  let previousFatigue = -Infinity;
  let previousBoost = -Infinity;
  let previousRank = 0;

  WORLD_JOURNEY_CONNECTIONS.forEach((connection) => {
    if (connectionIds.has(connection.id)) {
      issues.push(`Duplicate world connection id "${connection.id}".`);
    }
    connectionIds.add(connection.id);
    if (connection.fromLocationId === connection.toLocationId) {
      issues.push(`World connection "${connection.id}" loops to itself.`);
    }
    if (connection.travelFatigue < 0) {
      issues.push(`World connection "${connection.id}" has negative fatigue.`);
    }
    if (connection.kind !== 'journey-route') return;
    if (!connection.viaLocationId) {
      issues.push(`Journey route "${connection.id}" has no route location.`);
    }
    if (connection.difficultyRank !== previousRank + 1) {
      issues.push(`Journey route "${connection.id}" has a non-sequential difficulty rank.`);
    }
    if (connection.travelFatigue <= previousFatigue) {
      issues.push(`Journey route "${connection.id}" does not increase fatigue.`);
    }
    if (connection.encounterBoost < previousBoost) {
      issues.push(`Journey route "${connection.id}" lowers encounter quality.`);
    }
    previousRank = connection.difficultyRank;
    previousFatigue = connection.travelFatigue;
    previousBoost = connection.encounterBoost;
  });

  const visited: GymZoneId[] = ['home'];
  for (const zoneId of JOURNEY_GYM_ZONE_IDS) {
    if (!visited.includes(zoneId)) visited.push(zoneId);
    const progression = {
      visitedZoneIds: visited,
      defeatedGymIds: [],
    } satisfies OverworldProgressionSnapshot;
    const reachable = getAccessibleLocationIds('home-gym', progression);
    const accessibleLocations = new Set<OverworldLocationId>(['home-gym']);
    WORLD_JOURNEY_CONNECTIONS.forEach((connection) => {
      if (!isWorldConnectionAccessible(connection, progression)) return;
      accessibleLocations.add(connection.fromLocationId);
      accessibleLocations.add(connection.toLocationId);
      if (connection.viaLocationId) accessibleLocations.add(connection.viaLocationId);
    });
    accessibleLocations.forEach((locationId) => {
      if (!reachable.has(locationId)) {
        issues.push(
          `Unlocked location "${locationId}" is unreachable after visiting "${zoneId}".`,
        );
      }
    });
  }

  return issues;
}

if (import.meta.env?.DEV) {
  const issues = validateWorldJourneyGraph();
  if (issues.length > 0) {
    throw new Error(
      `World graph validation failed:\n${issues.map((issue) => `- ${issue}`).join('\n')}`,
    );
  }
}
