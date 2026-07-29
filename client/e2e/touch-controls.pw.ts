import { expect, test } from '@playwright/test';

import { createStartedJourneyFixture } from '../src/tests/fixtures/saveFixtures';
import {
  collectRuntimeErrors,
  expectHealthyGameShell,
  startWithCurrentSave,
} from './support/gameTestSupport';

test('touch movement, menus, and Buddy styling work on a phone viewport', async ({
  page,
}) => {
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
    page.getByRole('dialog', { name: 'Controls & accessibility' }),
  ).toBeVisible();
  await expect(page.getByLabel('Touchscreen game controls')).toBeVisible();
  await page.getByRole('button', { name: 'Resume route' }).tap();

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
