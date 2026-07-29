import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TRAINER_APPEARANCE,
  TRAINER_BUILD_ATTRIBUTES,
  TRAINER_PHYSIQUE_PRESETS,
  cloneTrainerAppearance,
} from '../game/content/trainerAppearance';
import {
  getTrainerPixelFrameCacheStats,
  renderTrainerPixelFrame,
  resetTrainerPixelFrameCache,
  TRAINER_PIXEL_HEIGHT,
  TRAINER_PIXEL_LAYERS,
  TRAINER_PIXEL_WIDTH,
} from '../game/rendering/trainerPixelRenderer';
import { randomizeTrainerAppearance } from '../game/systems/trainerAppearance';
import type {
  TrainerFacingDirection,
  TrainerPose,
} from '../game/types';

const directions: TrainerFacingDirection[] = [
  'front',
  'back',
  'left',
  'right',
];
const poses: TrainerPose[] = [
  'idle',
  'walking',
  'running',
  'training',
  'victory',
  'fatigue',
  'capture',
  'boss-introduction',
];

describe('layered trainer pixel renderer', () => {
  it('renders every physique, direction, and pose inside the shared frame', () => {
    for (const preset of TRAINER_PHYSIQUE_PRESETS) {
      const appearance = cloneTrainerAppearance(
        DEFAULT_TRAINER_APPEARANCE,
      );
      appearance.build = { ...preset.build };
      for (const direction of directions) {
        for (const pose of poses) {
          const frame = renderTrainerPixelFrame(
            appearance,
            direction,
            pose,
            1,
          );
          expect(frame.width).toBe(TRAINER_PIXEL_WIDTH);
          expect(frame.height).toBe(TRAINER_PIXEL_HEIGHT);
          expect(frame.rects.length).toBeGreaterThan(20);
          frame.rects.forEach((rect) => {
            expect(TRAINER_PIXEL_LAYERS).toContain(rect.layer);
            expect(rect.x).toBeGreaterThanOrEqual(0);
            expect(rect.y).toBeGreaterThanOrEqual(0);
            expect(rect.x + rect.width).toBeLessThanOrEqual(
              TRAINER_PIXEL_WIDTH,
            );
            expect(rect.y + rect.height).toBeLessThanOrEqual(
              TRAINER_PIXEL_HEIGHT,
            );
          });
          expect(
            frame.rects.some(
              (rect) =>
                rect.layer === 'head' ||
                rect.layer === 'torso' ||
                rect.layer === 'legs',
            ),
          ).toBe(true);
        }
      }
    }
  });

  it('keeps minimum and maximum builds muscular, visible, and distinct', () => {
    const minimum = cloneTrainerAppearance(
      DEFAULT_TRAINER_APPEARANCE,
    );
    const maximum = cloneTrainerAppearance(
      DEFAULT_TRAINER_APPEARANCE,
    );
    for (const attribute of TRAINER_BUILD_ATTRIBUTES) {
      minimum.build[attribute.id] = 0;
      maximum.build[attribute.id] = 10;
    }
    const minimumFrame = renderTrainerPixelFrame(
      minimum,
      'front',
      'idle',
    );
    const maximumFrame = renderTrainerPixelFrame(
      maximum,
      'front',
      'idle',
    );
    const minimumBody = minimumFrame.rects.filter((rect) =>
      ['torso', 'arms', 'legs'].includes(rect.layer),
    );
    const maximumBody = maximumFrame.rects.filter((rect) =>
      ['torso', 'arms', 'legs'].includes(rect.layer),
    );
    const widthOf = (rects: typeof minimumBody) => {
      const left = Math.min(...rects.map((rect) => rect.x));
      const right = Math.max(
        ...rects.map((rect) => rect.x + rect.width),
      );
      return right - left;
    };

    expect(minimumBody.length).toBeGreaterThan(10);
    expect(maximumBody.length).toBeGreaterThan(10);
    expect(widthOf(minimumBody)).toBeGreaterThanOrEqual(14);
    expect(widthOf(maximumBody)).toBeGreaterThan(widthOf(minimumBody));
  });

  it('renders a broad deterministic sample of valid combinations without invisible body parts', () => {
    for (let seed = 1; seed <= 128; seed += 1) {
      const appearance = randomizeTrainerAppearance(seed);
      const direction = directions[seed % directions.length]!;
      const pose = poses[seed % poses.length]!;
      const frame = renderTrainerPixelFrame(
        appearance,
        direction,
        pose,
        seed % 2,
      );
      for (const requiredLayer of ['legs', 'torso', 'arms', 'head', 'clothing', 'shoes'] as const) {
        expect(
          frame.rects.some((rect) => rect.layer === requiredLayer),
          `${requiredLayer} missing for seed ${seed}`,
        ).toBe(true);
      }
    }
  });

  it('keeps adaptive clothing attached at extreme body proportions', () => {
    for (const buildValue of [0, 10]) {
      const appearance = cloneTrainerAppearance(
        DEFAULT_TRAINER_APPEARANCE,
      );
      for (const attribute of TRAINER_BUILD_ATTRIBUTES) {
        appearance.build[attribute.id] = buildValue;
      }
      for (const direction of directions) {
        const frame = renderTrainerPixelFrame(
          appearance,
          direction,
          'walking',
          1,
        );
        const clothing = frame.rects.filter(
          (rect) => rect.layer === 'clothing',
        );
        const body = frame.rects.filter((rect) =>
          ['legs', 'torso', 'arms'].includes(rect.layer),
        );
        expect(clothing.length).toBeGreaterThan(8);
        for (const garment of clothing) {
          expect(
            body.some(
              (part) =>
                garment.x < part.x + part.width &&
                garment.x + garment.width > part.x &&
                garment.y < part.y + part.height &&
                garment.y + garment.height > part.y,
            ),
          ).toBe(true);
        }
      }
    }
  });

  it('caches identical generated combinations within a bounded store', () => {
    resetTrainerPixelFrameCache();
    const appearance = cloneTrainerAppearance(
      DEFAULT_TRAINER_APPEARANCE,
    );
    const first = renderTrainerPixelFrame(
      appearance,
      'front',
      'victory',
      0,
    );
    const second = renderTrainerPixelFrame(
      appearance,
      'front',
      'victory',
      0,
    );
    const stats = getTrainerPixelFrameCacheStats();

    expect(second).toBe(first);
    expect(stats.entries).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hits).toBe(1);
    expect(stats.entries).toBeLessThanOrEqual(stats.limit);
  });
});
