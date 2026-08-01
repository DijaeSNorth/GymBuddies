import { expect, test, type Page } from '@playwright/test';

import { createRepresentativeSaveFixtures, createStartedJourneyFixture } from '../src/tests/fixtures/saveFixtures';
import {
  collectRuntimeErrors,
  expectHealthyGameShell,
  readCurrentSaveState,
  startWithCurrentSave,
} from './support/gameTestSupport';

const desktopViewports = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

async function expectSingleScreenWorkspace(page: Page) {
  await expect(page.getByTestId('journey-status-bar')).toBeVisible();
  await expect(page.getByRole('region', { name: /Gym Buddies game playfield/i })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Journey navigation' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Party' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Context actions' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Dialogue and current objective' })).toBeVisible();
  await expect(page.locator('.gb-phaser-host canvas')).toHaveCount(1);

  const metrics = await page.evaluate(() => ({
    bodyOverflow: document.body.scrollHeight - document.body.clientHeight,
    documentOverflow: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  expect(metrics.bodyOverflow).toBeLessThanOrEqual(1);
  expect(metrics.documentOverflow).toBeLessThanOrEqual(1);
  expect(metrics.horizontalOverflow).toBeLessThanOrEqual(1);

  const actionCount = await page.locator('.journey-context-actions > button').count();
  expect(actionCount).toBeGreaterThan(0);
  expect(actionCount).toBeLessThanOrEqual(4);
}

for (const viewport of desktopViewports) {
  test(`journey workspace fits ${viewport.width}x${viewport.height} without page scrolling`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await startWithCurrentSave(page, createStartedJourneyFixture(`Forge ${viewport.width}`));
    const runtimeErrors = collectRuntimeErrors(page);

    await page.goto('/');
    await expectHealthyGameShell(page);
    await expectSingleScreenWorkspace(page);

    const playfield = page.getByRole('region', { name: /Gym Buddies game playfield/i });
    const box = await playfield.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);

    if (viewport.width === 1440) {
      await page.screenshot({ path: testInfo.outputPath('journey-home-1440x900.png') });
    }
    expect(runtimeErrors).toEqual([]);
  });
}

test('secondary workspaces are exclusive, focus trapped, and leave one live playfield', async ({ page }, testInfo) => {
  await startWithCurrentSave(page, createStartedJourneyFixture('Layer Tester'));
  const runtimeErrors = collectRuntimeErrors(page);

  await page.goto('/');
  await expectHealthyGameShell(page);
  const mapTrigger = page.getByTestId('journey-nav-map');
  await mapTrigger.focus();
  await mapTrigger.click();

  const mapDialog = page.getByRole('dialog', { name: 'World Map' });
  await expect(mapDialog).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.locator('.gb-phaser-host canvas')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('journey-map-overlay.png') });

  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(mapDialog).toHaveCount(0);
  await expect(mapTrigger).toBeFocused();

  await page.keyboard.press('KeyT');
  const teamDialog = page.getByRole('dialog', { name: 'Team' });
  await expect(teamDialog).toBeVisible();
  await expect(page.getByText('PARTY ORDER')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('journey-team-overlay.png') });
  await page.keyboard.press('Escape');

  await page.keyboard.press('KeyI');
  await expect(page.getByRole('dialog', { name: 'Buddy Index' })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByTestId('journey-nav-settings').click();
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  await expect(page.getByText('Sound mix')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Open system menu' }).click();
  await expect(page.getByRole('dialog', { name: 'System Menu' })).toBeVisible();
  await expect(page.getByText('Journey data')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open playtest tools' })).toBeVisible();
  await page.keyboard.press('Escape');

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.gb-phaser-host canvas')).toHaveCount(1);
  expect(runtimeErrors).toEqual([]);
});

test('gym context exposes training, encounter, boss, and travel without dashboard duplication', async ({ page }, testInfo) => {
  await startWithCurrentSave(page, createRepresentativeSaveFixtures().starterBossReady);
  const runtimeErrors = collectRuntimeErrors(page);

  await page.goto('/');
  await expectHealthyGameShell(page);
  await expect(page.getByTestId('journey-status-bar')).toContainText('Starter Gym A');
  await expect(page.getByTestId('journey-action-gym-train')).toBeVisible();
  await expect(page.getByTestId('journey-action-gym-scout')).toBeVisible();
  await expect(page.getByTestId('journey-action-gym-boss')).toBeEnabled();
  await expect(page.getByTestId('journey-action-gym-map')).toBeVisible();
  await expect(page.getByText('BOSS READY', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('journey-boss-ready.png') });

  await page.getByTestId('journey-action-gym-train').click();
  await expect(page.getByRole('dialog', { name: 'Training' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Selected workout' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('journey-training-overlay.png') });
  await page.keyboard.press('Escape');
  await page.getByTestId('journey-action-gym-scout').click();
  await expect(page.getByTestId('journey-encounter-stage')).toBeVisible();
  await expect(page.getByTestId('journey-action-start-match')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('journey-encounter-stage.png') });
  await page.getByTestId('journey-action-start-match').click();
  await expect(page.getByTestId('journey-action-burst')).toBeVisible();
  await expect(page.locator('.journey-context-actions > button')).toHaveCount(3);
  await expect(page.locator('.gb-phaser-host canvas')).toHaveCount(1);
  expect(runtimeErrors).toEqual([]);
});

test('an active workout replaces gym actions with focused rep controls', async ({ page }, testInfo) => {
  await startWithCurrentSave(page, createStartedJourneyFixture('Workout Tester'));
  await page.goto('/');
  await expectHealthyGameShell(page);
  await page.getByTestId('journey-action-home-train').click();
  await page.getByRole('button', { name: /Start .* Set/i }).click();
  await expect(page.getByRole('region', { name: 'Machine workout mini-game' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('journey-workout-overlay.png') });
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('journey-action-workout-input')).toBeVisible();
  await expect(page.getByTestId('journey-action-workout-details')).toBeVisible();
  await expect(page.locator('.journey-context-actions > button')).toHaveCount(2);
});

test('route context replaces gym actions after an in-world door transition', async ({ page }, testInfo) => {
  await startWithCurrentSave(page, createStartedJourneyFixture('Route Tester'));
  await page.goto('/');
  await expectHealthyGameShell(page);

  const playfield = page.getByRole('region', { name: /Gym Buddies game playfield/i });
  await playfield.focus();
  for (let step = 0; step < 10; step += 1) {
    if (Number(await playfield.getAttribute('data-player-x')) >= 27) break;
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(95);
  }
  await expect(playfield).toHaveAttribute('data-player-x', '27');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(95);
  await page.keyboard.press('KeyE');

  await expect(playfield).toHaveAttribute('data-location-id', 'route-1');
  await expect(page.getByTestId('journey-action-route-interact')).toBeVisible();
  await expect(page.getByTestId('journey-action-route-scout')).toBeVisible();
  await expect(page.getByTestId('journey-action-route-team')).toBeVisible();
  await expect(page.getByTestId('journey-action-route-map')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('journey-route.png') });
});

test('contextual tutorial stays below the playfield and preserves critical controls', async ({ page }) => {
  const save = createStartedJourneyFixture('Tutorial Tester');
  save.tutorialStep = 0;
  await startWithCurrentSave(page, save);
  await page.goto('/');
  await expectHealthyGameShell(page);

  await expect(page.getByRole('region', { name: /Gym Buddies game playfield/i })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Context actions' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back' })).toBeDisabled();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('overlay gamepad navigation moves focus and cancel closes the workspace', async ({ page }) => {
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, touched: false, value: 0 }));
    Object.defineProperty(window, '__journeyGamepadButtons', { configurable: true, value: buttons });
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => [{
        axes: [0, 0, 0, 0],
        buttons,
        connected: true,
        id: 'Gym Buddies Test Controller',
        index: 0,
        mapping: 'standard',
        timestamp: performance.now(),
      }],
    });
  });
  await startWithCurrentSave(page, createStartedJourneyFixture('Gamepad Tester'));
  await page.goto('/');
  await expectHealthyGameShell(page);
  await page.getByTestId('journey-nav-map').click();
  const dialog = page.getByRole('dialog', { name: 'World Map' });
  await expect(dialog).toBeVisible();

  const initialText = await page.evaluate(() => document.activeElement?.textContent ?? '');
  await page.evaluate(() => {
    const button = (window as unknown as { __journeyGamepadButtons: Array<{ pressed: boolean; value: number }> }).__journeyGamepadButtons[13]!;
    button.pressed = true;
    button.value = 1;
  });
  await expect.poll(() => page.evaluate(() => document.activeElement?.textContent ?? '')).not.toBe(initialText);
  await page.evaluate(() => {
    const button = (window as unknown as { __journeyGamepadButtons: Array<{ pressed: boolean; value: number }> }).__journeyGamepadButtons[13]!;
    button.pressed = false;
    button.value = 0;
  });
  await page.waitForTimeout(80);
  await page.evaluate(() => {
    const button = (window as unknown as { __journeyGamepadButtons: Array<{ pressed: boolean; value: number }> }).__journeyGamepadButtons[1]!;
    button.pressed = true;
    button.value = 1;
  });
  await expect(dialog).toHaveCount(0);
});

test('high contrast and reduced motion preserve the same single-screen hierarchy', async ({ page }, testInfo) => {
  const save = createStartedJourneyFixture('Accessible Tester');
  save.accessibility.highContrast = true;
  save.accessibility.reducedMotion = true;
  save.accessibility.screenShake = false;
  await startWithCurrentSave(page, save);
  await page.goto('/');
  await expectHealthyGameShell(page);
  await expectSingleScreenWorkspace(page);
  await expect(page.locator('html')).toHaveAttribute('data-gb-reduced-motion', 'true');
  await page.screenshot({ path: testInfo.outputPath('journey-high-contrast-reduced-motion.png') });

  const state = await readCurrentSaveState(page);
  expect((state?.accessibility as { highContrast?: boolean }).highContrast).toBe(true);
});
