import { describe, expect, it } from 'vitest';

import {
  GAME_LOGICAL_HEIGHT,
  GAME_LOGICAL_WIDTH,
  PRESENTATION_ASPECT_RATIO,
  calculatePresentationScale,
} from '../game/phaser/presentationConfig';

describe('game presentation configuration', () => {
  it('keeps the Phaser playfield at the required logical resolution', () => {
    expect([GAME_LOGICAL_WIDTH, GAME_LOGICAL_HEIGHT]).toEqual([240, 160]);
    expect(PRESENTATION_ASPECT_RATIO).toBe(4 / 3);
  });

  it('chooses the largest integer scale that fits', () => {
    expect(calculatePresentationScale(1024, 768)).toMatchObject({
      width: 960,
      height: 720,
      scale: 4,
      isInteger: true,
    });
    expect(calculatePresentationScale(700, 500)).toMatchObject({
      width: 480,
      height: 360,
      scale: 2,
      isInteger: true,
    });
  });

  it('uses a bounded fractional scale only when a 1x presentation cannot fit', () => {
    const result = calculatePresentationScale(180, 120);
    expect(result.scale).toBeCloseTo(2 / 3);
    expect(result.width).toBeCloseTo(160);
    expect(result.height).toBeCloseTo(120);
    expect(result.isInteger).toBe(false);
  });
});
