import { expect, test } from '@playwright/test';

import { createRepresentativeSaveFixtures, createStartedJourneyFixture } from '../src/tests/fixtures/saveFixtures';
import {
  collectRuntimeErrors,
  expectHealthyGameShell,
  startWithCurrentSave,
} from './support/gameTestSupport';

test.use({ viewport: { width: 390, height: 844 } });

test('mobile journey keeps play, actions, dialogue, and navigation in one viewport', async ({ page }, testInfo) => {
  await startWithCurrentSave(page, createStartedJourneyFixture('Mobile Forge'));
  const runtimeErrors = collectRuntimeErrors(page);

  await page.goto('/');
  await expectHealthyGameShell(page);
  await expect(page.getByTestId('journey-status-bar')).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Party' })).toBeVisible();
  await expect(page.getByRole('region', { name: /Gym Buddies game playfield/i })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Context actions' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Dialogue and current objective' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Journey navigation' })).toBeVisible();

  const layout = await page.evaluate(() => ({
    widthOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    heightOverflow: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    actionHeights: Array.from(document.querySelectorAll<HTMLElement>('.journey-context-actions button')).map((button) => button.getBoundingClientRect().height),
    navHeights: Array.from(document.querySelectorAll<HTMLElement>('.journey-quick-nav button')).map((button) => button.getBoundingClientRect().height),
  }));
  expect(layout.widthOverflow).toBeLessThanOrEqual(1);
  expect(layout.heightOverflow).toBeLessThanOrEqual(1);
  expect(layout.actionHeights.every((height) => height >= 44)).toBe(true);
  expect(layout.navHeights.every((height) => height >= 44)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('journey-mobile-exploration.png') });

  await page.getByTestId('journey-nav-team').click();
  const teamDialog = page.getByRole('dialog', { name: 'Team' });
  await expect(teamDialog).toBeVisible();
  const sheet = await teamDialog.boundingBox();
  expect(sheet).not.toBeNull();
  expect(sheet!.width).toBeLessThanOrEqual(390);
  expect(sheet!.y).toBeGreaterThan(0);
  expect(sheet!.y + sheet!.height).toBeLessThanOrEqual(845);
  await page.screenshot({ path: testInfo.outputPath('journey-mobile-team-sheet.png') });
  await page.keyboard.press('Escape');

  await page.getByTestId('journey-nav-map').click();
  await expect(page.getByRole('dialog', { name: 'World Map' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('.gb-phaser-host canvas')).toHaveCount(1);
  expect(runtimeErrors).toEqual([]);
});

test('mobile navigation remains keyboard operable and restores focus after a sheet closes', async ({ page }) => {
  await startWithCurrentSave(page, createStartedJourneyFixture('Focus Forge'));
  await page.goto('/');
  await expectHealthyGameShell(page);

  const settingsTrigger = page.getByTestId('journey-nav-settings');
  await settingsTrigger.focus();
  await page.keyboard.press('Enter');
  const settingsDialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(settingsDialog).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(settingsDialog).toHaveCount(0);
  await expect(settingsTrigger).toBeFocused();
});

test('mobile encounter keeps the arena and context moves within the viewport', async ({ page }, testInfo) => {
  await startWithCurrentSave(page, createRepresentativeSaveFixtures().starterBossReady);
  await page.goto('/');
  await expectHealthyGameShell(page);
  await page.getByTestId('journey-action-gym-scout').click();
  await expect(page.getByTestId('journey-encounter-stage')).toBeVisible();
  await page.getByTestId('journey-action-start-match').click();
  await expect(page.getByTestId('journey-action-burst')).toBeVisible();
  const arena = await page.getByTestId('journey-encounter-stage').boundingBox();
  expect(arena).not.toBeNull();
  expect(arena!.x).toBeGreaterThanOrEqual(0);
  expect(arena!.x + arena!.width).toBeLessThanOrEqual(391);
  await page.screenshot({ path: testInfo.outputPath('journey-mobile-encounter.png') });
});
