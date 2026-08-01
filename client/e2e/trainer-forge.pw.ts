import { expect, test } from '@playwright/test';

import { TRAINER_PHYSIQUE_PRESETS } from '../src/game/content/trainerAppearance';
import { createStartedJourneyFixture } from '../src/tests/fixtures/saveFixtures';
import {
  collectRuntimeErrors,
  expectHealthyGameShell,
  readCurrentSaveState,
  startWithCurrentSave,
  startWithEmptyStorage,
} from './support/gameTestSupport';

const DESKTOP_VIEWPORTS = [
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

test('single-page Trainer Forge fits desktop viewports without document scrolling', async ({
  page,
}, testInfo) => {
  await startWithEmptyStorage(page);
  const runtimeErrors = collectRuntimeErrors(page);
  await page.goto('/');
  await expectHealthyGameShell(page);

  const forge = page.locator('.trainer-studio-v3');
  const preview = page.locator('.trainer-studio-preview');
  const footer = page.locator('.trainer-studio-footer');
  await expect(forge).toBeVisible();
  await expect(page.locator('.trainer-studio-v2')).toHaveCount(0);

  for (const viewport of DESKTOP_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await expect(preview).toBeVisible();
    await expect(footer).toBeVisible();
    const metrics = await page.evaluate(() => {
      const studio = document.querySelector<HTMLElement>('.trainer-studio-v3');
      const preview = document.querySelector<HTMLElement>('.trainer-studio-preview');
      const footer = document.querySelector<HTMLElement>('.trainer-studio-footer');
      return {
        bodyScroll: document.body.scrollHeight - window.innerHeight,
        documentScroll: document.documentElement.scrollHeight - window.innerHeight,
        studio: studio?.getBoundingClientRect().toJSON(),
        preview: preview?.getBoundingClientRect().toJSON(),
        footer: footer?.getBoundingClientRect().toJSON(),
      };
    });
    expect(metrics.bodyScroll).toBeLessThanOrEqual(1);
    expect(metrics.documentScroll).toBeLessThanOrEqual(1);
    expect(metrics.studio?.bottom ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(viewport.height + 1);
    expect(metrics.preview?.height ?? 0).toBeGreaterThan(250);
    expect(metrics.footer?.bottom ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(viewport.height + 1);
    await page.screenshot({
      path: testInfo.outputPath(`trainer-forge-quick-${viewport.width}x${viewport.height}.png`),
      fullPage: false,
    });
  }

  expect(runtimeErrors).toEqual([]);
});

test('Quick and Detail Forge preserve values and keep the live preview mounted', async ({
  page,
}, testInfo) => {
  await startWithEmptyStorage(page);
  const runtimeErrors = collectRuntimeErrors(page);
  await page.goto('/');
  await expectHealthyGameShell(page);

  const previewCanvas = page.locator('.trainer-studio-preview .trainer-pixel-canvas').first();
  const previewHandle = await previewCanvas.elementHandle();
  await page.getByRole('button', { name: /Detail Forge/i }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.locator('#trainer-build-latWidth').fill('10');
  await page.getByRole('button', { name: /Quick Forge/i }).click();
  await expect(page.locator('#trainer-build-latWidth')).toHaveCount(0);
  await page.getByRole('button', { name: /Detail Forge/i }).click();
  await expect(page.locator('#trainer-build-latWidth')).toHaveValue('10');
  expect(await previewHandle?.evaluate((element) => element.isConnected)).toBe(true);

  for (const section of ['Face', 'Hair', 'Outfit', 'Colors', 'Accessories', 'Poses', 'Gameplay']) {
    await page.getByRole('tab', { name: section, exact: true }).click();
    await expect(page.locator('.trainer-studio-preview')).toBeVisible();
    expect(await previewHandle?.evaluate((element) => element.isConnected)).toBe(true);
    if (section === 'Face') {
      await page.getByLabel('Face shape').selectOption('diamond-defined');
      await page.screenshot({ path: testInfo.outputPath('trainer-forge-face.png'), fullPage: false });
    } else if (section === 'Outfit') {
      await page.getByLabel('Top').selectOption('compression-long');
      await page.getByLabel('Bottoms').selectOption('leggings-panel');
      await page.screenshot({ path: testInfo.outputPath('trainer-forge-outfit.png'), fullPage: false });
    } else if (section === 'Colors') {
      await page.getByRole('button', { name: 'Skin tone: Deep Ebony' }).click();
      await page.screenshot({ path: testInfo.outputPath('trainer-forge-deep-skin-compression-outfit.png'), fullPage: false });
    }
  }
  await expect(page.getByText('Separate gameplay attributes')).toBeVisible();
  await page.getByRole('tab', { name: 'Poses', exact: true }).click();
  await page.getByRole('button', { name: 'Front Double Biceps', exact: true }).click();
  await page.getByLabel('Direction').selectOption('back');
  await expect(page.locator('.trainer-studio-footer').getByLabel('Pose')).toHaveValue('front-double-biceps');
  await expect(page.locator('.trainer-studio-footer').getByLabel('Direction')).toHaveValue('back');

  await page.screenshot({ path: testInfo.outputPath('trainer-forge-detail-back-pose.png'), fullPage: false });
  expect(runtimeErrors).toEqual([]);
});

test('presets, history, reset, randomizer, and Saved Looks remain functional', async ({
  page,
}, testInfo) => {
  await startWithEmptyStorage(page);
  const runtimeErrors = collectRuntimeErrors(page);
  await page.goto('/');
  await expectHealthyGameShell(page);

  for (const preset of TRAINER_PHYSIQUE_PRESETS) {
    await page.getByRole('button', { name: preset.label, exact: true }).click();
    await expect(page.getByText(preset.label, { exact: true }).first()).toBeVisible();
  }

  await page.getByRole('button', { name: /Detail Forge/i }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  const latWidth = page.locator('#trainer-build-latWidth');
  const initial = await latWidth.inputValue();
  await latWidth.fill(initial === '10' ? '9' : '10');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(latWidth).toHaveValue(initial);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(latWidth).not.toHaveValue(initial);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();

  const randomizeButton = page.getByRole('button', { name: 'Randomize', exact: true });
  await randomizeButton.focus();
  await randomizeButton.click();
  const randomizer = page.getByRole('dialog', { name: 'Controlled Randomizer' });
  await expect(randomizer).toBeVisible();
  await page.getByLabel('Random style').selectOption('heavy-builds');
  await page.getByRole('button', { name: 'Randomize Appearance' }).click();
  await page.keyboard.press('Escape');
  await expect(randomizer).toBeHidden();
  await expect(randomizeButton).toBeFocused();

  await page.getByRole('button', { name: 'Saved Looks', exact: true }).click();
  await page.getByLabel('Appearance preset name').fill('Viewport Look');
  await page.getByRole('button', { name: 'Save Current Look' }).click();
  await expect(page.getByText('Viewport Look', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('trainer-forge-saved-looks-drawer.png'), fullPage: false });
  await page.getByRole('button', { name: 'Close Saved Looks' }).click();

  await page.getByRole('button', { name: /Quick Forge/i }).click();
  const quickControls = page.locator('.trainer-studio-inspector-scroll input[type="range"]');
  await page.getByRole('button', { name: 'Upper frame', exact: true }).click();
  for (const range of await quickControls.all()) await range.fill('1');
  await page.getByRole('button', { name: 'Balance and finish', exact: true }).click();
  for (const range of await quickControls.all()) await range.fill('1');
  await page.screenshot({ path: testInfo.outputPath('trainer-forge-minimum-athletic-build.png'), fullPage: false });
  await page.getByRole('button', { name: 'Upper frame', exact: true }).click();
  for (const range of await quickControls.all()) await range.fill('10');
  await page.getByRole('button', { name: 'Balance and finish', exact: true }).click();
  for (const range of await quickControls.all()) await range.fill('10');
  await page.screenshot({ path: testInfo.outputPath('trainer-forge-maximum-muscular-build.png'), fullPage: false });
  expect(runtimeErrors).toEqual([]);
});

test('editing an existing trainer preserves journey progression and accessibility state', async ({
  page,
}, testInfo) => {
  const fixture = createStartedJourneyFixture('Preserved Avery');
  fixture.trainingFatigue = 37;
  fixture.workoutMomentum = 22;
  fixture.accessibility.highContrast = true;
  fixture.accessibility.reducedMotion = true;
  await startWithCurrentSave(page, fixture);
  const runtimeErrors = collectRuntimeErrors(page);
  await page.goto('/');
  await expectHealthyGameShell(page);

  await page.getByRole('button', { name: 'Open system menu' }).click();
  await page.getByRole('button', { name: 'Edit Trainer' }).click();
  await expect(page.getByText('PROGRESS PRESERVED', { exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-gb-high-contrast', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-gb-reduced-motion', 'true');
  await page.getByRole('button', { name: /Detail Forge/i }).click();
  await page.getByRole('button', { name: 'Shoulders', exact: true }).click();
  const shoulders = page.locator('#trainer-build-shoulderWidth');
  const nextShoulders = (Number(await shoulders.inputValue()) === 10 ? 9 : 10).toString();
  await shoulders.fill(nextShoulders);
  await page.screenshot({ path: testInfo.outputPath('trainer-forge-existing-high-contrast-reduced-motion.png'), fullPage: false });
  await page.getByRole('button', { name: 'Save Appearance' }).click();
  await expect(page.getByTestId('journey-status-bar')).toBeVisible();

  await expect.poll(async () => {
    const state = await readCurrentSaveState(page);
    const trainer = state?.trainer as { appearance?: { build?: { shoulderWidth?: number } } } | undefined;
    return {
      activeZoneId: state?.activeZoneId,
      caughtDex: state?.caughtDex,
      hasStarterSet: state?.hasStarterSet,
      highContrast: (state?.accessibility as { highContrast?: boolean } | undefined)?.highContrast,
      reducedMotion: (state?.accessibility as { reducedMotion?: boolean } | undefined)?.reducedMotion,
      shoulderWidth: trainer?.appearance?.build?.shoulderWidth,
      teamLength: Array.isArray(state?.team) ? state.team.length : -1,
      trainingFatigue: state?.trainingFatigue,
      visitedZoneIds: state?.visitedZoneIds,
      workoutMomentum: state?.workoutMomentum,
    };
  }).toEqual({
    activeZoneId: fixture.activeZoneId,
    caughtDex: fixture.caughtDex,
    hasStarterSet: true,
    highContrast: true,
    reducedMotion: true,
    shoulderWidth: Number(nextShoulders),
    teamLength: fixture.team.length,
    trainingFatigue: 37,
    visitedZoneIds: fixture.visitedZoneIds,
    workoutMomentum: 22,
  });
  expect(runtimeErrors).toEqual([]);
});
