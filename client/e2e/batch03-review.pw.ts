import { expect, test } from '@playwright/test';

import {
  collectRuntimeErrors,
  expectHealthyGameShell,
} from './support/gameTestSupport';

test('Batch 03 review deck renders every dome-shell deliverable', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const runtimeErrors = collectRuntimeErrors(page);
  await page.goto('/?debug=batch03-review', {
    waitUntil: 'networkidle',
  });
  await expectHealthyGameShell(page);

  await expect(
    page.locator('[data-batch03-character]'),
  ).toHaveCount(4);
  await expect(page.locator('[data-batch03-preset]')).toHaveCount(20);
  await expect(
    page.locator('[data-batch03-boss-tier]'),
  ).toHaveCount(5);
  await expect(
    page.locator('[data-review-deliverable]'),
  ).toHaveCount(6);
  await expect(
    page.locator('[data-review-deliverable="armor-layers"] canvas'),
  ).toHaveCount(12);
  await expect(
    page.locator('[data-review-deliverable="anchors"] svg'),
  ).toHaveCount(4);

  const canvases = page.locator(
    '.batch03-review-shell .buddy-pixel-canvas, .batch03-layer-canvas',
  );
  expect(await canvases.count()).toBeGreaterThan(250);
  await expect
    .poll(async () =>
      canvases.evaluateAll((elements) =>
        elements.filter((element) => {
          const canvas = element as HTMLCanvasElement;
          const context = canvas.getContext('2d');
          if (!context) return false;
          const pixels = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          ).data;
          for (let index = 3; index < pixels.length; index += 4) {
            if (pixels[index] > 0) return true;
          }
          return false;
        }).length,
      ),
    )
    .toBe(await canvases.count());

  await page
    .locator('[data-review-deliverable="cross-resolution"]')
    .screenshot({
      animations: 'disabled',
      path: testInfo.outputPath('batch03-cross-resolution.png'),
    });
  expect(runtimeErrors).toEqual([]);
});

test('Batch 03 review deck remains navigable at a phone viewport', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-touch',
    'Phone-width layout is covered by the mobile-touch project.',
  );
  const runtimeErrors = collectRuntimeErrors(page);
  await page.goto('/?debug=batch03-review', {
    waitUntil: 'networkidle',
  });
  await expectHealthyGameShell(page);
  await expect(
    page.locator('[data-review-deliverable="mobile"]'),
  ).toBeVisible();
  const viewport = page.viewportSize();
  expect(viewport?.width).toBeLessThanOrEqual(420);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  expect(runtimeErrors).toEqual([]);
});
