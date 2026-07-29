import { describe, expect, it } from 'vitest';

import {
  DEFAULT_KEYBOARD_BINDINGS,
  GAMEPAD_PROFILE_LABELS,
  detectGamepadProfile,
  gamepadActions,
  keyboardCodeToAction,
  keyboardEventToAction,
  normalizeKeyboardBindings,
  remapKeyboardBinding,
  validateKeyboardBindings,
} from '../game/input/actionMap';
import { shiftWorkoutSessionTiming } from '../game/systems/workoutResolution';
import type { WorkoutSession } from '../game/types';

describe('unified input configuration', () => {
  it('maps keyboard events through stable physical key codes', () => {
    expect(
      keyboardEventToAction({ code: 'KeyW', key: 'w' }),
    ).toBe('move-up');
    expect(
      keyboardEventToAction({ code: 'Enter', key: 'Enter' }),
    ).toBe('confirm');
    expect(
      keyboardEventToAction({ code: 'Space', key: ' ' }),
    ).toBe('interact');
    expect(
      keyboardEventToAction({ code: 'KeyP', key: 'p' }),
    ).toBe('pause');
  });

  it('remaps a primary key and swaps a displaced binding without duplicates', () => {
    const remapped = remapKeyboardBinding(
      DEFAULT_KEYBOARD_BINDINGS,
      'confirm',
      'KeyE',
    );

    expect(keyboardCodeToAction('KeyE', remapped)).toBe('confirm');
    expect(keyboardCodeToAction('Enter', remapped)).toBe('interact');
    expect(validateKeyboardBindings(remapped)).toEqual([]);
  });

  it('repairs missing, duplicated, and blocked imported bindings', () => {
    const normalized = normalizeKeyboardBindings({
      confirm: ['KeyQ'],
      cancel: ['KeyQ'],
      pause: ['F5'],
    });

    expect(keyboardCodeToAction('Enter', normalized)).toBe('confirm');
    expect(keyboardCodeToAction('KeyQ', normalized)).toBeNull();
    expect(normalized.cancel.length).toBeGreaterThan(0);
    expect(normalized.pause).not.toContain('F5');
    expect(validateKeyboardBindings(normalized)).toEqual([]);
  });

  it('maps the standard layout and identifies controller label profiles', () => {
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false }));
    buttons[0] = { pressed: true };
    buttons[4] = { pressed: true };
    buttons[15] = { pressed: true };

    expect(gamepadActions(buttons, [0, -0.8])).toEqual(
      new Set(['confirm', 'ability-1', 'move-right', 'move-up']),
    );
    expect(detectGamepadProfile('Xbox Wireless Controller')).toBe('xbox');
    expect(detectGamepadProfile('DualSense Wireless Controller')).toBe(
      'playstation',
    );
    expect(detectGamepadProfile('Generic USB Pad')).toBe('standard');
    expect(GAMEPAD_PROFILE_LABELS.xbox.confirm).toBe('A');
    expect(GAMEPAD_PROFILE_LABELS.playstation.confirm).toBe('Cross');
  });

  it('shifts active workout deadlines without mutating the session', () => {
    const session = {
      resolved: false,
      startedAt: 1_000,
      repStartedAt: 1_200,
      spotWindowStart: 1_500,
      spotWindowEnd: 1_800,
      spotSaveDeadline: 1_700,
    } as WorkoutSession;
    const shifted = shiftWorkoutSessionTiming(session, 750);

    expect(shifted).not.toBe(session);
    expect(shifted.startedAt).toBe(1_750);
    expect(shifted.repStartedAt).toBe(1_950);
    expect(shifted.spotWindowEnd).toBe(2_550);
    expect(session.startedAt).toBe(1_000);
  });
});
