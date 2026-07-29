import { describe, expect, it } from 'vitest';

import {
  PRESENTATION_EFFECT_TIMING,
  getPresentationSequenceDuration,
  trainerEmoteLabel,
} from '../game/phaser/presentationEffects';

describe('presentation effect configuration', () => {
  it('keeps reduced-motion sequences brief and deterministic', () => {
    expect(
      getPresentationSequenceDuration(760, 'deliberate', true),
    ).toBe(PRESENTATION_EFFECT_TIMING.reducedMotionSequenceMs);
  });

  it('lets players accelerate repeated presentation beats without changing outcomes', () => {
    const swift = getPresentationSequenceDuration(760, 'swift', false);
    const standard = getPresentationSequenceDuration(760, 'standard', false);
    const deliberate = getPresentationSequenceDuration(760, 'deliberate', false);

    expect(swift).toBeLessThan(standard);
    expect(standard).toBeLessThan(deliberate);
    expect(deliberate).toBeLessThan(1000);
  });

  it('provides compact trainer emotes that remain legible at 240 by 160', () => {
    expect(trainerEmoteLabel('focus')).toBe('!');
    expect(trainerEmoteLabel('victory')).toBe('WIN');
    expect(trainerEmoteLabel('neutral')).toBe('');
  });
});
