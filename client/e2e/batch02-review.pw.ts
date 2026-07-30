import { expect, test } from '@playwright/test';

import {
  collectRuntimeErrors,
  expectHealthyGameShell,
} from './support/gameTestSupport';

test('formal Batch 02 review deck renders every required matrix', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const runtimeErrors = collectRuntimeErrors(page);
  await page.goto('/?debug=batch02-review', {
    waitUntil: 'networkidle',
  });
  await expectHealthyGameShell(page);

  const sheets = page.locator('[data-review-character]');
  await expect(sheets).toHaveCount(4);
  await expect(
    page.locator('[data-review-preset]'),
  ).toHaveCount(20);
  await expect(
    page.locator('[data-boss-review-tier]'),
  ).toHaveCount(5);
  await expect(
    page.locator('[data-extreme-accessory]'),
  ).toHaveCount(66);

  const railhorn = page.locator(
    '[data-review-character="ripped-rhino"]',
  );
  await expect(
    railhorn.getByRole('heading', {
      name: 'Railhorn extreme accessory matrix',
    }),
  ).toBeVisible();
  await expect(
    railhorn.locator('[data-extreme-accessory] canvas'),
  ).toHaveCount(132);

  const canvases = page.locator(
    '[data-review-character] .buddy-pixel-canvas',
  );
  await expect(canvases).toHaveCount(573);
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
    .toBe(573);

  await page.locator('[data-review-character="a-rhino"]').screenshot({
    animations: 'disabled',
    path: testInfo.outputPath('a-rhino-formal-review.png'),
  });
  expect(runtimeErrors).toEqual([]);
});
