import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TRAINER_APPEARANCE,
  TRAINER_BOTTOMS,
  TRAINER_BUILD_ATTRIBUTES,
  TRAINER_PHYSIQUE_PRESETS,
  TRAINER_SHOES,
  TRAINER_TOPS,
  cloneTrainerAppearance,
} from '../game/content/trainerAppearance';
import { TRAINER_POSE_DEFINITIONS } from '../game/content/bodybuilding';
import {
  getTrainerBodyMetrics,
  getTrainerPixelFrameCacheStats,
  renderTrainerPixelFrame,
  resetTrainerPixelFrameCache,
  type TrainerBodyMetrics,
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
const poses: TrainerPose[] = TRAINER_POSE_DEFINITIONS.map(({ id }) => id);

const regionalMetricCases: Array<{
  attribute: keyof typeof DEFAULT_TRAINER_APPEARANCE.build;
  direction: TrainerFacingDirection;
  metric: keyof TrainerBodyMetrics;
  pose: TrainerPose;
}> = [
  { attribute: 'shoulderWidth', direction: 'front', metric: 'shoulderSpan', pose: 'front-relaxed' },
  { attribute: 'trapeziusSize', direction: 'back', metric: 'trapeziusRise', pose: 'back-relaxed' },
  { attribute: 'chestSize', direction: 'front', metric: 'chestSpan', pose: 'side-chest' },
  { attribute: 'upperBackWidth', direction: 'back', metric: 'upperBackSpan', pose: 'back-double-biceps' },
  { attribute: 'lowerBackThickness', direction: 'back', metric: 'lowerBackSpan', pose: 'back-relaxed' },
  { attribute: 'bicepsSize', direction: 'front', metric: 'bicepsWidth', pose: 'front-double-biceps' },
  { attribute: 'tricepsSize', direction: 'right', metric: 'tricepsWidth', pose: 'side-triceps' },
  { attribute: 'forearmSize', direction: 'front', metric: 'forearmWidth', pose: 'most-muscular' },
  { attribute: 'coreDefinition', direction: 'front', metric: 'coreDefinitionMarks', pose: 'abs-and-thigh' },
  { attribute: 'waistWidth', direction: 'front', metric: 'waistSpan', pose: 'front-relaxed' },
  { attribute: 'gluteSize', direction: 'back', metric: 'gluteSpan', pose: 'back-relaxed' },
  { attribute: 'quadSize', direction: 'front', metric: 'quadWidth', pose: 'abs-and-thigh' },
  { attribute: 'hamstringSize', direction: 'back', metric: 'hamstringWidth', pose: 'back-relaxed' },
  { attribute: 'calfSize', direction: 'back', metric: 'calfWidth', pose: 'back-double-biceps' },
  { attribute: 'bodyMass', direction: 'front', metric: 'bodyMassBand', pose: 'most-muscular' },
  { attribute: 'muscleDefinition', direction: 'front', metric: 'muscleDefinitionMarks', pose: 'front-relaxed' },
];

function geometrySignature(
  frame: ReturnType<typeof renderTrainerPixelFrame>,
) {
  return frame.rects
    .map(
      ({ layer, x, y, width, height }) =>
        `${layer}:${x},${y},${width},${height}`,
    )
    .join('|');
}

describe('layered trainer pixel renderer', () => {
  it(
    'renders every physique, direction, and pose inside the shared frame',
    () => {
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
    },
    25_000,
  );

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

  it('makes low, middle, and high values visibly distinct for every requested body region', () => {
    const failures: string[] = [];
    for (const testCase of regionalMetricCases) {
      const metrics: number[] = [];
      const silhouettes = new Set<string>();
      for (const value of [0, 5, 10]) {
        const appearance = cloneTrainerAppearance(
          DEFAULT_TRAINER_APPEARANCE,
        );
        appearance.build[testCase.attribute] = value;
        metrics.push(
          getTrainerBodyMetrics(appearance, testCase.direction)[
            testCase.metric
          ],
        );
        silhouettes.add(
          geometrySignature(
            renderTrainerPixelFrame(
              appearance,
              testCase.direction,
              testCase.pose,
              0,
            ),
          ),
        );
      }
      if (new Set(metrics).size !== 3) {
        failures.push(`${testCase.attribute}: metric bands`);
      }
      if (silhouettes.size !== 3) {
        failures.push(`${testCase.attribute}: rendered geometry`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('renders every advanced control at minimum and maximum without losing its visual response', () => {
    const advanced = TRAINER_BUILD_ATTRIBUTES.slice(22);
    const failures: string[] = [];
    expect(advanced).toHaveLength(39);

    for (const attribute of advanced) {
      const signatures = new Set<string>();
      for (const value of [0, 10]) {
        const appearance = cloneTrainerAppearance(
          DEFAULT_TRAINER_APPEARANCE,
        );
        appearance.build[attribute.id] = value;
        const pose: TrainerPose =
          attribute.region === 'upper-body'
            ? 'front-double-biceps'
            : attribute.region === 'core'
              ? 'abs-and-thigh'
              : attribute.region === 'lower-body'
                ? 'front-relaxed'
                : 'most-muscular';
        const frames = (['front', 'back'] as const).map((direction) =>
          renderTrainerPixelFrame(appearance, direction, pose, 0),
        );
        frames.forEach((frame) =>
          frame.rects.forEach((rect) => {
            expect(rect.x).toBeGreaterThanOrEqual(0);
            expect(rect.y).toBeGreaterThanOrEqual(0);
            expect(rect.x + rect.width).toBeLessThanOrEqual(
              TRAINER_PIXEL_WIDTH,
            );
            expect(rect.y + rect.height).toBeLessThanOrEqual(
              TRAINER_PIXEL_HEIGHT,
            );
          }),
        );
        signatures.add(frames.map(geometrySignature).join('||'));
      }
      if (signatures.size !== 2) {
        failures.push(attribute.id);
      }
    }
    expect(failures).toEqual([]);
  });

  it('keeps maximum builds readable instead of filling their entire silhouette box', () => {
    const appearance = cloneTrainerAppearance(
      DEFAULT_TRAINER_APPEARANCE,
    );
    for (const attribute of TRAINER_BUILD_ATTRIBUTES) {
      appearance.build[attribute.id] = 10;
    }
    const frame = renderTrainerPixelFrame(
      appearance,
      'front',
      'most-muscular',
      0,
    );
    const bodyRects = frame.rects.filter((rect) =>
      ['legs', 'torso', 'arms', 'head', 'clothing'].includes(rect.layer),
    );
    const left = Math.min(...bodyRects.map((rect) => rect.x));
    const right = Math.max(...bodyRects.map((rect) => rect.x + rect.width));
    const top = Math.min(...bodyRects.map((rect) => rect.y));
    const bottom = Math.max(...bodyRects.map((rect) => rect.y + rect.height));
    const occupied = new Set<string>();
    bodyRects.forEach((rect) => {
      for (let y = rect.y; y < rect.y + rect.height; y += 1) {
        for (let x = rect.x; x < rect.x + rect.width; x += 1) {
          occupied.add(`${x},${y}`);
        }
      }
    });
    const boundingArea = (right - left) * (bottom - top);

    expect(occupied.size / boundingArea).toBeLessThan(0.82);
    expect(right - left).toBeLessThanOrEqual(TRAINER_PIXEL_WIDTH);
    expect(bottom - top).toBeLessThanOrEqual(TRAINER_PIXEL_HEIGHT);
  });

  it('uses different front and back geometry to emphasize chest, back, glutes, and hamstrings', () => {
    const appearance = cloneTrainerAppearance(
      DEFAULT_TRAINER_APPEARANCE,
    );
    appearance.build.chestSize = 10;
    appearance.build.upperBackWidth = 10;
    appearance.build.gluteSize = 10;
    appearance.build.hamstringSize = 10;

    const front = renderTrainerPixelFrame(
      appearance,
      'front',
      'front-double-biceps',
      0,
    );
    const back = renderTrainerPixelFrame(
      appearance,
      'back',
      'back-double-biceps',
      0,
    );

    expect(geometrySignature(front)).not.toBe(geometrySignature(back));
    expect(getTrainerBodyMetrics(appearance, 'back').upperBackSpan).toBeGreaterThan(
      getTrainerBodyMetrics(DEFAULT_TRAINER_APPEARANCE, 'back').upperBackSpan,
    );
    expect(getTrainerBodyMetrics(appearance, 'back').gluteSpan).toBeGreaterThan(
      getTrainerBodyMetrics(DEFAULT_TRAINER_APPEARANCE, 'back').gluteSpan,
    );
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

  it('keeps every top, bottom, and lifting-shoe option present on extreme builds', () => {
    for (const buildValue of [0, 10]) {
      const base = cloneTrainerAppearance(DEFAULT_TRAINER_APPEARANCE);
      for (const attribute of TRAINER_BUILD_ATTRIBUTES) {
        base.build[attribute.id] = buildValue;
      }
      for (const option of TRAINER_TOPS) {
        const appearance = cloneTrainerAppearance(base);
        appearance.outfit.topId = option.id;
        const frame = renderTrainerPixelFrame(appearance, 'front', 'front-relaxed');
        expect(
          frame.rects.filter(({ layer }) => layer === 'clothing').length,
          `${option.id} did not render attached clothing`,
        ).toBeGreaterThan(8);
      }
      for (const option of TRAINER_BOTTOMS) {
        const appearance = cloneTrainerAppearance(base);
        appearance.outfit.bottomsId = option.id;
        const frame = renderTrainerPixelFrame(appearance, 'back', 'back-relaxed');
        expect(
          frame.rects.some(({ layer }) => layer === 'clothing'),
          `${option.id} did not render`,
        ).toBe(true);
      }
      for (const option of TRAINER_SHOES) {
        const appearance = cloneTrainerAppearance(base);
        appearance.outfit.shoesId = option.id;
        const frame = renderTrainerPixelFrame(appearance, 'front', 'idle');
        expect(
          frame.rects.some(({ layer }) => layer === 'shoes'),
          `${option.id} did not render`,
        ).toBe(true);
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
