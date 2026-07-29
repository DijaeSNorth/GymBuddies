import {
  OVERWORLD_ENCOUNTER_COOLDOWN_MS,
  OVERWORLD_MOVE_COOLDOWN_MS,
  OVERWORLD_TRANSITION_COOLDOWN_MS,
  getOverworldMap,
  isPositionInRect,
} from '../content/maps/journeyMaps';
import {
  getWorldJourneyConnection,
  isWorldConnectionAccessible,
} from '../content/worldGraph';
import {
  inputActionToDirection,
  type InputAction,
} from '../input/actionMap';
import type {
  CardinalDirection,
  OverworldActionResult,
  OverworldInteractable,
  OverworldLocationId,
  OverworldMapConfig,
  OverworldProgressionSnapshot,
  OverworldState,
  OverworldTilePosition,
  OverworldTransition,
} from '../types';
import { WORLD_DIRECTION_VECTORS } from '../content/routes';

export const INITIAL_OVERWORLD_PROGRESSION: OverworldProgressionSnapshot = {
  visitedZoneIds: ['home'],
  defeatedGymIds: [],
};

export function createOverworldState(
  locationId: OverworldLocationId = 'home-gym',
): OverworldState {
  const map = getOverworldMap(locationId);
  return {
    locationId,
    position: { ...map.defaultSpawn },
    facing: 'down',
    nextMoveAt: 0,
    lastEncounterAt: 0,
    movementSequence: 0,
    transitionSequence: 0,
  };
}

export function isOverworldPositionBlocked(
  map: OverworldMapConfig,
  position: OverworldTilePosition,
) {
  if (
    position.x < 0 ||
    position.y < 0 ||
    position.x >= map.width ||
    position.y >= map.height
  ) {
    return true;
  }
  if (map.collisionRects.some((rect) => isPositionInRect(position, rect))) return true;
  return map.interactables.some(
    (interactable) =>
      interactable.blocksMovement &&
      isPositionInRect(
        position,
        interactable.footprint ?? {
          ...interactable.position,
          width: 1,
          height: 1,
        },
      ),
  );
}

export function positionInFacingDirection(
  position: OverworldTilePosition,
  direction: CardinalDirection,
) {
  const vector = WORLD_DIRECTION_VECTORS[direction];
  return {
    x: position.x + vector.x,
    y: position.y + vector.y,
  };
}

export function findFacingInteractable(
  map: OverworldMapConfig,
  state: Pick<OverworldState, 'position' | 'facing'>,
): OverworldInteractable | null {
  const target = positionInFacingDirection(state.position, state.facing);
  return (
    map.interactables.find((interactable) =>
      isPositionInRect(
        target,
        interactable.footprint ?? {
          ...interactable.position,
          width: 1,
          height: 1,
        },
      ),
    ) ?? null
  );
}

export function getOverworldDirectionAvailability(
  state: OverworldState,
): Record<CardinalDirection, boolean> {
  const map = getOverworldMap(state.locationId);
  return {
    up: !isOverworldPositionBlocked(map, positionInFacingDirection(state.position, 'up')),
    down: !isOverworldPositionBlocked(map, positionInFacingDirection(state.position, 'down')),
    left: !isOverworldPositionBlocked(map, positionInFacingDirection(state.position, 'left')),
    right: !isOverworldPositionBlocked(map, positionInFacingDirection(state.position, 'right')),
  };
}

export function resolveOverworldAction(input: {
  state: OverworldState;
  action: InputAction;
  now: number;
  progression?: OverworldProgressionSnapshot;
}): OverworldActionResult {
  const direction = inputActionToDirection(input.action);
  const progression = input.progression ?? INITIAL_OVERWORLD_PROGRESSION;
  if (direction) return resolveMove(input.state, direction, input.now, progression);
  if (input.action === 'interact') {
    return resolveInteraction(input.state, input.now, progression);
  }
  return { state: input.state, events: [] };
}

function resolveMove(
  state: OverworldState,
  direction: CardinalDirection,
  now: number,
  progression: OverworldProgressionSnapshot,
): OverworldActionResult {
  if (now < state.nextMoveAt) {
    return {
      state,
      events: [{ type: 'cooldown', remainingMs: state.nextMoveAt - now }],
    };
  }

  const map = getOverworldMap(state.locationId);
  const nextPosition = positionInFacingDirection(state.position, direction);
  const facingState = {
    ...state,
    facing: direction,
  };
  if (isOverworldPositionBlocked(map, nextPosition)) {
    return {
      state: {
        ...facingState,
        nextMoveAt: now + Math.ceil(OVERWORLD_MOVE_COOLDOWN_MS / 2),
      },
      events: [{ type: 'blocked', direction, position: nextPosition }],
    };
  }

  const stepTransition = map.transitions.find(
    (transition) =>
      transition.trigger === 'step' &&
      transition.position.x === nextPosition.x &&
      transition.position.y === nextPosition.y,
  );
  if (stepTransition) {
    return transitionResult(state, stepTransition, now, progression);
  }

  const nextState: OverworldState = {
    ...facingState,
    position: nextPosition,
    nextMoveAt: now + OVERWORLD_MOVE_COOLDOWN_MS,
    movementSequence: state.movementSequence + 1,
  };
  const events: OverworldActionResult['events'] = [
    {
      type: 'moved',
      direction,
      from: { ...state.position },
      to: { ...nextPosition },
    },
  ];
  const encounterArea = map.encounterAreas.find((area) =>
    isPositionInRect(nextPosition, area),
  );
  if (encounterArea && now - state.lastEncounterAt >= OVERWORLD_ENCOUNTER_COOLDOWN_MS) {
    nextState.lastEncounterAt = now;
    events.push({ type: 'encounter-check', area: encounterArea });
  }

  return { state: nextState, events };
}

function resolveInteraction(
  state: OverworldState,
  now: number,
  progression: OverworldProgressionSnapshot,
): OverworldActionResult {
  const map = getOverworldMap(state.locationId);
  const interactable = findFacingInteractable(map, state);
  if (!interactable) {
    return {
      state,
      events: [{ type: 'nothing-to-interact', position: { ...state.position } }],
    };
  }
  if (interactable.kind === 'door' && interactable.transitionId) {
    const transition = map.transitions.find(
      (entry) =>
        entry.id === interactable.transitionId &&
        entry.trigger === 'interact',
    );
    if (transition) return transitionResult(state, transition, now, progression);
  }
  return {
    state,
    events: [{ type: 'interaction', interactable }],
  };
}

function transitionResult(
  state: OverworldState,
  transition: OverworldTransition,
  now: number,
  progression: OverworldProgressionSnapshot,
): OverworldActionResult {
  const connection = getWorldJourneyConnection(transition.connectionId);
  if (!isWorldConnectionAccessible(connection, progression)) {
    return {
      state,
      events: [
        {
          type: 'locked-transition',
          transition,
          requirement: connection.requirement,
        },
      ],
    };
  }
  const nextState: OverworldState = {
    ...state,
    locationId: transition.targetLocationId,
    position: { ...transition.targetPosition },
    facing: transition.targetFacing,
    nextMoveAt: now + OVERWORLD_TRANSITION_COOLDOWN_MS,
    movementSequence: state.movementSequence + 1,
    transitionSequence: state.transitionSequence + 1,
  };
  return {
    state: nextState,
    events: [
      {
        type: 'transition',
        transition,
        fromLocationId: state.locationId,
        toLocationId: transition.targetLocationId,
      },
    ],
  };
}
