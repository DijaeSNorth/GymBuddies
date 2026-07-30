import { expect, test } from '@playwright/test';

import {
  collectRuntimeErrors,
  expectHealthyGameShell,
} from './support/gameTestSupport';

test('Sprite Strip Lab selects native contexts and loads them lazily', async ({
  page,
}, testInfo) => {
  const runtimeErrors = collectRuntimeErrors(page);
  const presentationRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/presentation/v1/')) {
      presentationRequests.push(request.url());
    }
  });

  await page.goto('/?debug=sprites');
  await expectHealthyGameShell(page);
  await expect(
    page.getByRole('heading', { name: 'Sprite Strip Lab' }),
  ).toBeVisible();
  await expect(
    page.getByTestId('sprite-renderer-comparison'),
  ).toBeVisible();

  await page.getByLabel('Species').selectOption('prismantle');
  await page.getByLabel('Direction').selectOption('right');
  await page.getByLabel('Pose').selectOption('rare-entrance');
  const primaryCanvas = page.locator('.sprite-lab__stage canvas').first();
  await expect(primaryCanvas).toHaveAttribute(
    'data-presentation-context',
    'overworld',
  );
  await expect(primaryCanvas).toHaveAttribute('data-frame-width', '24');
  await expect(page.getByText('handcrafted', { exact: true })).toBeVisible();
  await expect(page.getByText('final', { exact: true })).toBeVisible();
  await expect(page.getByText('2.0.0', { exact: true })).toBeVisible();
  expect(presentationRequests).toEqual([]);

  await page.getByLabel('Presentation context').selectOption('battle');
  await page.getByLabel('Battle pose').selectOption('snapping-hook');
  await expect(primaryCanvas).toHaveAttribute('data-frame-width', '48');
  await expect(primaryCanvas).toHaveAttribute(
    'data-presentation-source',
    'authored-context',
  );
  await expect
    .poll(() =>
      presentationRequests.some((url) =>
        url.endsWith('/prismantle/battle-48.png'),
      ),
    )
    .toBe(true);

  await page.getByLabel('Presentation context').selectOption('showcase');
  await page.getByLabel('Showcase pose').selectOption('most-muscular');
  await expect(primaryCanvas).toHaveAttribute('data-frame-width', '64');
  await expect
    .poll(() =>
      presentationRequests.some((url) =>
        url.endsWith('/prismantle/showcase-64.png'),
      ),
    )
    .toBe(true);

  await page.getByLabel('Species').selectOption('brawny-bear');
  await page.getByText('Mat Watchman profile').click();
  await page.getByLabel('Presentation context').selectOption('battle');
  await expect(primaryCanvas).toHaveAttribute('data-frame-width', '64');
  await expect
    .poll(() =>
      presentationRequests.some((url) =>
        url.endsWith('/home-watchman/battle-64.png'),
      ),
    )
    .toBe(true);

  await page.getByLabel('Species').selectOption('ripped-rhino');
  await expect(
    page.getByText('review', { exact: true }),
  ).toBeVisible();
  await page.getByText('A-Rhino profile').click();
  await page.getByLabel('Presentation context').selectOption('battle');
  await page.getByLabel('Battle pose').selectOption('shoulder-burst');
  await expect(
    page.getByText('revision-required', { exact: true }),
  ).toBeVisible();
  await expect(primaryCanvas).toHaveAttribute('data-frame-width', '64');
  await expect(primaryCanvas).toHaveAttribute(
    'data-presentation-source',
    'authored-context',
  );
  await expect
    .poll(() =>
      presentationRequests.some((url) =>
        url.endsWith('/a-rhino/battle-64.png'),
      ),
    )
    .toBe(true);

  await page.getByLabel('Background').selectOption('gym');
  await page.getByLabel('silhouette only').check();
  await expect(primaryCanvas).toHaveClass(/silhouette-only/);
  await expect
    .poll(() =>
      primaryCanvas.evaluate(
        (canvas) => getComputedStyle(canvas).filter,
      ),
    )
    .not.toBe('none');

  const canvases = page.locator('.buddy-pixel-canvas');
  await expect(canvases).toHaveCount(3);
  await expect
    .poll(async () =>
      primaryCanvas.evaluate((canvas: HTMLCanvasElement) => {
        const context = canvas.getContext('2d');
        if (!context) return 0;
        const pixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data;
        let visible = 0;
        for (let index = 3; index < pixels.length; index += 4) {
          if (pixels[index] > 0) visible += 1;
        }
        return visible;
      }),
    )
    .toBeGreaterThan(20);

  const oneScaleButton = page
    .locator('.sprite-lab__scale button')
    .filter({ hasText: '1' });
  await oneScaleButton.click();
  await expect(oneScaleButton).toHaveAttribute('aria-pressed', 'true');

  await page.screenshot({
    path: testInfo.outputPath('sprite-strip-lab.png'),
    fullPage: true,
  });
  expect(runtimeErrors).toEqual([]);
});

test('a missing battle sheet falls back without hiding the character', async ({
  page,
}) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await page.route('**/brawny-bear/battle-48.png', (route) =>
    route.abort('failed'),
  );
  await page.goto('/?debug=sprites');
  await expectHealthyGameShell(page);
  await page.getByLabel('Species').selectOption('brawny-bear');
  await page.getByLabel('Presentation context').selectOption('battle');
  const canvas = page.locator('.sprite-lab__stage canvas').first();
  await expect(canvas).toHaveAttribute('data-frame-width', '48');
  await expect
    .poll(() =>
      canvas.evaluate((element: HTMLCanvasElement) => {
        const context = element.getContext('2d');
        if (!context) return 0;
        const pixels = context.getImageData(
          0,
          0,
          element.width,
          element.height,
        ).data;
        let visible = 0;
        for (let index = 3; index < pixels.length; index += 4) {
          if (pixels[index] > 0) visible += 1;
        }
        return visible;
      }),
    )
    .toBeGreaterThan(20);
  expect(
    runtimeErrors.filter(
      (error) => !error.includes('net::ERR_FAILED'),
    ),
  ).toEqual([]);
});
