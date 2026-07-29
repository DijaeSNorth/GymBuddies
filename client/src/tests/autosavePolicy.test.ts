import { describe, expect, it } from 'vitest';

import {
  AUTOSAVE_MIN_INTERVAL_MS,
  getAutosaveDelayMs,
  hasOnlyAllowedTopLevelChanges,
} from '../game/save/autosavePolicy';

describe('autosave performance policy', () => {
  it('allows the first persistence immediately', () => {
    expect(getAutosaveDelayMs(0, AUTOSAVE_MIN_INTERVAL_MS)).toBe(0);
  });

  it('limits repeated persistence to the configured interval', () => {
    expect(getAutosaveDelayMs(10_000, 12_000)).toBe(3_000);
    expect(getAutosaveDelayMs(10_000, 15_000)).toBe(0);
  });

  it('handles non-monotonic clocks without returning a negative delay', () => {
    expect(getAutosaveDelayMs(12_000, 10_000)).toBe(
      AUTOSAVE_MIN_INTERVAL_MS,
    );
    expect(getAutosaveDelayMs(12_000, 10_000, -1)).toBe(0);
  });

  it('distinguishes deferrable clock updates from meaningful save changes', () => {
    const previous = { bossClock: 1_000, trainerName: 'Avery' };
    expect(
      hasOnlyAllowedTopLevelChanges(
        previous,
        { ...previous, bossClock: 2_000 },
        ['bossClock'],
      ),
    ).toBe(true);
    expect(
      hasOnlyAllowedTopLevelChanges(
        previous,
        { ...previous, trainerName: 'Morgan' },
        ['bossClock'],
      ),
    ).toBe(false);
    expect(
      hasOnlyAllowedTopLevelChanges(previous, previous, ['bossClock']),
    ).toBe(false);
  });
});
