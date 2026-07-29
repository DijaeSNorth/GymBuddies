import { describe, expect, it } from 'vitest';

import { getOverworldMap } from '../game/content/maps/journeyMaps';
import {
  getAccessibleLocationIds,
  JOURNEY_CRITICAL_PATH,
  JOURNEY_GYM_ZONE_IDS,
  validateWorldJourneyGraph,
  WORLD_JOURNEY_CONNECTIONS,
} from '../game/content/worldGraph';
import {
  createOverworldState,
  resolveOverworldAction,
} from '../game/systems/overworldMovement';
import type {
  GymZoneId,
  OverworldLocationId,
  OverworldProgressionSnapshot,
} from '../game/types';

describe('complete Gym Buddies journey graph', () => {
  it('keeps every progressively unlocked location reachable from Home Gym', () => {
    expect(validateWorldJourneyGraph()).toEqual([]);
    const visited: GymZoneId[] = ['home'];

    JOURNEY_GYM_ZONE_IDS.forEach((zoneId) => {
      if (!visited.includes(zoneId)) visited.push(zoneId);
      const reachable = getAccessibleLocationIds('home-gym', {
        visitedZoneIds: visited,
        defeatedGymIds: [],
      });
      expect(reachable.has('home-gym')).toBe(true);
      visited.forEach((visitedZoneId) => {
        const location = WORLD_JOURNEY_CONNECTIONS.find(
          ({ toZoneId }) => toZoneId === visitedZoneId,
        )?.toLocationId;
        if (location) expect(reachable.has(location)).toBe(true);
      });
    });
  });

  it('traverses the intended five-route critical path in order', () => {
    const mainline = WORLD_JOURNEY_CONNECTIONS.filter(
      (connection) => connection.kind === 'journey-route',
    );
    const visitedZoneIds: GymZoneId[] = ['home'];
    const visitedLocations: OverworldLocationId[] = ['home-gym'];
    let state = createOverworldState('home-gym');
    let now = 1_000;

    mainline.forEach((connection) => {
      const progression: OverworldProgressionSnapshot = {
        visitedZoneIds,
        defeatedGymIds: [],
      };
      const gymMap = getOverworldMap(connection.fromLocationId);
      const departure = gymMap.transitions.find(
        (transition) =>
          transition.connectionId === connection.id &&
          transition.targetLocationId === connection.viaLocationId,
      );
      expect(departure).toBeDefined();

      state = {
        ...state,
        locationId: connection.fromLocationId,
        position: { x: departure!.position.x, y: departure!.position.y - 1 },
        facing: 'down',
        nextMoveAt: 0,
      };
      const routeResult = resolveOverworldAction({
        state,
        action: 'interact',
        now,
        progression,
      });
      expect(routeResult.events[0]?.type).toBe('transition');
      expect(routeResult.state.locationId).toBe(connection.viaLocationId);
      visitedLocations.push(routeResult.state.locationId);

      state = {
        ...routeResult.state,
        position: { x: 50, y: 10 },
        facing: 'right',
        nextMoveAt: 0,
      };
      now += 1_000;
      const gymResult = resolveOverworldAction({
        state,
        action: 'move-right',
        now,
        progression,
      });
      expect(gymResult.events[0]?.type).toBe('transition');
      expect(gymResult.state.locationId).toBe(connection.toLocationId);
      visitedLocations.push(gymResult.state.locationId);

      const routeFatigue = [...routeResult.events, ...gymResult.events].reduce(
        (total, event) =>
          event.type === 'transition'
            ? total + event.transition.fatigueCost
            : total,
        0,
      );
      expect(routeFatigue).toBeCloseTo(connection.travelFatigue);
      visitedZoneIds.push(connection.toZoneId);
      state = gymResult.state;
      now += 1_000;
    });

    expect(visitedLocations).toEqual(JOURNEY_CRITICAL_PATH);
    expect(state.locationId).toBe('glory-gym');
  });

  it('reports route requirements and unlocks boss-gated shortcuts', () => {
    const starterAMap = getOverworldMap('starter-gym-a');
    const starterLinkDoor = starterAMap.transitions.find(
      ({ connectionId }) => connectionId === 'starter-link-road',
    );
    const lockedMainline = resolveOverworldAction({
      state: {
        ...createOverworldState('starter-gym-a'),
        position: {
          x: starterLinkDoor!.position.x,
          y: starterLinkDoor!.position.y - 1,
        },
        facing: 'down',
      },
      action: 'interact',
      now: 1_000,
      progression: { visitedZoneIds: ['home'], defeatedGymIds: [] },
    });
    expect(lockedMainline.state.locationId).toBe('starter-gym-a');
    expect(lockedMainline.events[0]).toMatchObject({
      type: 'locked-transition',
      requirement: {
        type: 'visited-zone',
        zoneId: 'starter-a',
      },
    });

    const homeMap = getOverworldMap('home-gym');
    const shortcutDoor = homeMap.transitions.find(
      ({ connectionId }) => connectionId === 'recovery-circuit-shortcut',
    );
    const shortcutState = {
      ...createOverworldState('home-gym'),
      position: {
        x: shortcutDoor!.position.x,
        y: shortcutDoor!.position.y - 1,
      },
      facing: 'down' as const,
    };
    const lockedShortcut = resolveOverworldAction({
      state: shortcutState,
      action: 'interact',
      now: 2_000,
      progression: { visitedZoneIds: ['home'], defeatedGymIds: [] },
    });
    expect(lockedShortcut.events[0]?.type).toBe('locked-transition');

    const openShortcut = resolveOverworldAction({
      state: shortcutState,
      action: 'interact',
      now: 2_000,
      progression: {
        visitedZoneIds: ['home', 'starter-a', 'starter-b'],
        defeatedGymIds: ['starter-b'],
      },
    });
    expect(openShortcut.state.locationId).toBe('starter-gym-b');
    expect(openShortcut.events[0]?.type).toBe('transition');
  });

  it('raises route fatigue, difficulty, encounter quality, and reward quality', () => {
    const routes = WORLD_JOURNEY_CONNECTIONS.filter(
      (connection) => connection.kind === 'journey-route',
    );
    expect(routes.map(({ difficultyRank }) => difficultyRank)).toEqual([1, 2, 3, 4, 5]);
    expect(routes.map(({ travelFatigue }) => travelFatigue)).toEqual([
      0.3,
      0.65,
      1,
      1.2,
      1.6,
    ]);
    expect(routes.map(({ encounterBoost }) => encounterBoost)).toEqual([
      0,
      0.02,
      0.04,
      0.05,
      0.07,
    ]);
    expect(routes.map(({ rewardQuality }) => rewardQuality)).toEqual([
      'foundation',
      'improved',
      'strong',
      'elite',
      'champion',
    ]);
    routes.forEach((connection) => {
      const routeMap = getOverworldMap(connection.viaLocationId!);
      expect(routeMap.encounterAreas.some(({ rarity }) => rarity === 'rare')).toBe(true);
    });
  });
});
