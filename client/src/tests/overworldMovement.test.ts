import { describe, expect, it } from 'vitest';

import {
  OVERWORLD_ENCOUNTER_COOLDOWN_MS,
  OVERWORLD_MOVE_COOLDOWN_MS,
  OVERWORLD_MAPS,
  getOverworldMap,
  validateOverworldMaps,
} from '../game/content/maps/journeyMaps';
import { getWorldJourneyConnection } from '../game/content/worldGraph';
import {
  gamepadActions,
  inputActionToDirection,
  keyboardKeyToAction,
} from '../game/input/actionMap';
import {
  createOverworldState,
  findFacingInteractable,
  isOverworldPositionBlocked,
  resolveOverworldAction,
} from '../game/systems/overworldMovement';

describe('complete-journey overworld movement', () => {
  it('defines six gyms and five routes as validated data-driven tile maps', () => {
    expect(validateOverworldMaps()).toEqual([]);
    expect(OVERWORLD_MAPS.filter((map) => map.kind === 'gym')).toHaveLength(6);
    expect(OVERWORLD_MAPS.filter((map) => map.kind === 'route')).toHaveLength(5);
    OVERWORLD_MAPS.forEach((map) => {
      expect(map.tileSize).toBe(8);
      expect(map.width).toBeGreaterThan(30);
      expect(map.height).toBeGreaterThanOrEqual(20);
      expect(map.transitions.length).toBeGreaterThan(0);
      expect(map.palette.id).toBeTruthy();
      expect(map.props.length).toBeGreaterThan(0);
      expect(map.lights.length).toBeGreaterThan(0);
    });

    const kinds = new Set(
      OVERWORLD_MAPS.flatMap((map) => map.interactables.map((entry) => entry.kind)),
    );
    expect(kinds).toEqual(new Set(['door', 'machine', 'npc', 'recovery', 'sign']));
    expect(getOverworldMap('route-1').encounterAreas.length).toBeGreaterThan(0);
    expect(
      getOverworldMap('route-1').transitions.every(
        (transition) => transition.kind === 'route-exit',
      ),
    ).toBe(true);
  });

  it('blocks map boundaries and solid interaction footprints while preserving facing', () => {
    const map = getOverworldMap('home-gym');
    expect(isOverworldPositionBlocked(map, { x: 0, y: 8 })).toBe(true);
    expect(isOverworldPositionBlocked(map, { x: 8, y: 10 })).toBe(true);
    expect(isOverworldPositionBlocked(map, { x: 20, y: 20 })).toBe(false);

    const state = {
      ...createOverworldState('home-gym'),
      position: { x: 1, y: 8 },
    };
    const result = resolveOverworldAction({ state, action: 'move-left', now: 1000 });
    expect(result.state.position).toEqual({ x: 1, y: 8 });
    expect(result.state.facing).toBe('left');
    expect(result.events[0]?.type).toBe('blocked');
  });

  it('uses a short deterministic movement cooldown', () => {
    const state = createOverworldState('home-gym');
    const first = resolveOverworldAction({ state, action: 'move-up', now: 1000 });
    expect(first.state.position).toEqual({ x: 20, y: 19 });
    expect(first.state.nextMoveAt).toBe(1000 + OVERWORLD_MOVE_COOLDOWN_MS);

    const tooSoon = resolveOverworldAction({
      state: first.state,
      action: 'move-up',
      now: 1000 + OVERWORLD_MOVE_COOLDOWN_MS - 1,
    });
    expect(tooSoon.state.position).toEqual({ x: 20, y: 19 });
    expect(tooSoon.events[0]?.type).toBe('cooldown');

    const ready = resolveOverworldAction({
      state: first.state,
      action: 'move-up',
      now: 1000 + OVERWORLD_MOVE_COOLDOWN_MS,
    });
    expect(ready.state.position).toEqual({ x: 20, y: 18 });
  });

  it('resolves machine and sign interactions from the facing tile', () => {
    const machineState = {
      ...createOverworldState('home-gym'),
      position: { x: 8, y: 12 },
      facing: 'up' as const,
    };
    expect(findFacingInteractable(getOverworldMap('home-gym'), machineState)?.machineId).toBe(
      'home_recovery',
    );
    const machine = resolveOverworldAction({
      state: machineState,
      action: 'interact',
      now: 1000,
    });
    expect(machine.events[0]).toMatchObject({
      type: 'interaction',
      interactable: { kind: 'machine', machineId: 'home_recovery' },
    });

    const signState = {
      ...createOverworldState('route-1'),
      position: { x: 6, y: 9 },
      facing: 'up' as const,
    };
    const sign = resolveOverworldAction({
      state: signState,
      action: 'interact',
      now: 2000,
    });
    expect(sign.events[0]).toMatchObject({
      type: 'interaction',
      interactable: { kind: 'sign', id: 'route-1-preview-sign' },
    });
  });

  it('transitions through Route 1 and preserves the configured total fatigue cost', () => {
    const atHomeDoor = {
      ...createOverworldState('home-gym'),
      position: { x: 27, y: 21 },
      facing: 'down' as const,
    };
    const route = resolveOverworldAction({
      state: atHomeDoor,
      action: 'interact',
      now: 1000,
    });
    expect(route.state).toMatchObject({
      locationId: 'route-1',
      position: { x: 2, y: 10 },
      facing: 'right',
    });
    const firstTransition = route.events.find((event) => event.type === 'transition');
    expect(firstTransition?.type === 'transition' && firstTransition.transition.kind).toBe(
      'door',
    );

    const atStarterExit = {
      ...route.state,
      position: { x: 50, y: 10 },
      facing: 'right' as const,
      nextMoveAt: 0,
    };
    const starter = resolveOverworldAction({
      state: atStarterExit,
      action: 'move-right',
      now: 2000,
    });
    expect(starter.state).toMatchObject({
      locationId: 'starter-gym-a',
      position: { x: 10, y: 21 },
      facing: 'up',
    });
    const secondTransition = starter.events.find((event) => event.type === 'transition');
    const totalFatigue =
      (firstTransition?.type === 'transition' ? firstTransition.transition.fatigueCost : 0) +
      (secondTransition?.type === 'transition' ? secondTransition.transition.fatigueCost : 0);
    expect(totalFatigue).toBeCloseTo(
      getWorldJourneyConnection('warm-up-path').travelFatigue,
    );
  });

  it('requests encounters only after entering designated tiles and observes cooldown', () => {
    const state = {
      ...createOverworldState('route-1'),
      position: { x: 8, y: 2 },
      facing: 'down' as const,
    };
    const entering = resolveOverworldAction({
      state,
      action: 'move-down',
      now: 5000,
    });
    expect(entering.events.some((event) => event.type === 'encounter-check')).toBe(true);

    const withinCooldown = resolveOverworldAction({
      state: entering.state,
      action: 'move-right',
      now: 5000 + OVERWORLD_MOVE_COOLDOWN_MS,
    });
    expect(withinCooldown.events.some((event) => event.type === 'encounter-check')).toBe(false);

    const afterCooldown = resolveOverworldAction({
      state: {
        ...withinCooldown.state,
        position: { x: 9, y: 2 },
        nextMoveAt: 0,
      },
      action: 'move-down',
      now: 5000 + OVERWORLD_ENCOUNTER_COOLDOWN_MS,
    });
    expect(afterCooldown.events.some((event) => event.type === 'encounter-check')).toBe(true);

    const plainRoute = resolveOverworldAction({
      state: {
        ...createOverworldState('route-1'),
        position: { x: 3, y: 9 },
      },
      action: 'move-down',
      now: 9000,
    });
    expect(plainRoute.events.some((event) => event.type === 'encounter-check')).toBe(false);
  });
});

describe('central input action map', () => {
  it('maps keyboard, gamepad D-pad, analog stick, and confirm inputs to actions', () => {
    expect(keyboardKeyToAction('W')).toBe('move-up');
    expect(keyboardKeyToAction('ArrowRight')).toBe('move-right');
    expect(keyboardKeyToAction('Enter')).toBe('confirm');
    expect(keyboardKeyToAction('1')).toBe('ability-1');
    expect(keyboardKeyToAction('2')).toBe('ability-2');
    expect(keyboardKeyToAction('3')).toBe('ability-3');
    expect(inputActionToDirection('move-left')).toBe('left');
    expect(inputActionToDirection('confirm')).toBeNull();

    const buttons = Array.from({ length: 16 }, () => ({ pressed: false }));
    buttons[12] = { pressed: true };
    buttons[0] = { pressed: true };
    expect(gamepadActions(buttons, [0.7, 0])).toEqual(
      new Set(['confirm', 'move-up', 'move-right']),
    );
    buttons[1] = { pressed: true };
    buttons[2] = { pressed: true };
    expect(gamepadActions(buttons, [0, 0])).toEqual(
      new Set(['confirm', 'cancel', 'interact', 'move-up']),
    );
  });
});
