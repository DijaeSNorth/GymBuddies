import { expect, test } from '@playwright/test';

import { createStartedJourneyFixture } from '../src/tests/fixtures/saveFixtures';
import {
  collectRuntimeErrors,
  expectHealthyGameShell,
  startWithCurrentSave,
  startWithEmptyStorage,
} from './support/gameTestSupport';

test('touch movement, menus, and Buddy styling work on a phone viewport', async ({
  page,
}, testInfo) => {
  await startWithCurrentSave(page, createStartedJourneyFixture('Tessa'));
  const runtimeErrors = collectRuntimeErrors(page);

  await page.goto('/');
  await expectHealthyGameShell(page);
  const playfield = page.getByRole('region', {
    name: /Gym Buddies game playfield/i,
  });
  const startingPosition = {
    x: Number(await playfield.getAttribute('data-player-x')),
    y: Number(await playfield.getAttribute('data-player-y')),
  };
  const moveButton = page
    .getByLabel(/^Move (up|down|left|right)$/)
    .and(page.locator(':not([disabled])'))
    .first();
  await expect(moveButton).toBeVisible();
  await moveButton.tap();
  await expect
    .poll(async () => ({
      x: Number(await playfield.getAttribute('data-player-x')),
      y: Number(await playfield.getAttribute('data-player-y')),
    }))
    .not.toEqual(startingPosition);

  await page.getByRole('button', { name: 'Menu', exact: true }).tap();
  await expect(
    page.getByRole('dialog', { name: 'System Menu' }),
  ).toBeVisible();
  await expect(page.getByLabel('Touchscreen game controls')).toBeVisible();
  await page.getByRole('button', { name: 'Close System Menu' }).tap();
  await page.screenshot({
    path: testInfo.outputPath('journey-game-390x844.png'),
    fullPage: false,
  });

  await page.getByTestId('journey-nav-team').tap();
  const customize = page.getByRole('button', { name: 'Customize Buddy' });
  await customize.scrollIntoViewIfNeeded();
  await customize.tap();
  await page.getByLabel('Body variation').selectOption('compact');
  await page.getByRole('button', { name: 'Focus Headband' }).tap();
  const customizer = page.locator('.buddy-customizer');
  await expect(customizer).toBeVisible();
  const customizerBox = await customizer.boundingBox();
  const viewport = page.viewportSize();
  expect(customizerBox?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(
    viewport?.width ?? 393,
  );
  await expect(
    page.locator('.buddy-customizer .buddy-pixel-canvas'),
  ).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test('Trainer Forge stays usable at a 390 by 844 phone viewport', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startWithEmptyStorage(page);
  const runtimeErrors = collectRuntimeErrors(page);

  await page.goto('/');
  await expectHealthyGameShell(page);
  const forge = page.locator('.trainer-studio-v3');
  await expect(forge).toBeVisible();
  await page.getByRole('button', { name: /Detail Forge/i }).tap();
  await page.getByRole('button', { name: 'Back', exact: true }).tap();
  const latControl = page.locator('#trainer-build-latWidth');
  await latControl.scrollIntoViewIfNeeded();
  await latControl.fill('10');
  await expect(latControl).toHaveValue('10');

  await page.getByRole('button', { name: 'Front / Back' }).tap();
  const preview = page.getByLabel('Live animated trainer preview');
  await expect(preview.getByText('Front', { exact: true })).toBeVisible();
  await expect(preview.getByText('Back', { exact: true })).toBeVisible();
  await page.getByText('Preview tools', { exact: true }).tap();
  await page.getByRole('button', { name: 'In-Game Size' }).tap();

  const layout = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    pageWidth: document.documentElement.scrollWidth,
    forgeWidth:
      document.querySelector('.trainer-studio-v3')?.getBoundingClientRect()
        .width ?? Number.POSITIVE_INFINITY,
    smallestTarget: Math.min(
      ...Array.from(
        document.querySelectorAll<HTMLElement>(
          '.trainer-preview-tool-strip button',
        ),
      )
        .filter((element) => element.offsetParent !== null)
        .map((element) => element.getBoundingClientRect().height),
    ),
  }));
  expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.forgeWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.smallestTarget).toBeGreaterThanOrEqual(44);
  await page.screenshot({
    path: testInfo.outputPath('trainer-forge-390x844.png'),
    fullPage: false,
  });
  expect(runtimeErrors).toEqual([]);
});
