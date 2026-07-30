import { expect, test, type Page } from '@playwright/test';

import { createStartedJourneyFixture } from '../src/tests/fixtures/saveFixtures';
import {
  collectRuntimeErrors,
  expectHealthyGameShell,
  readCurrentSaveState,
  startWithCurrentSave,
} from './support/gameTestSupport';

async function openReview(page: Page) {
  const open = page.getByTestId('open-physique-review');
  await open.scrollIntoViewIfNeeded();
  await open.click();
  await expect(page.getByTestId('physique-review')).toBeVisible();
}

test('Home Gym Physique Review preserves cosmetics and saves visual settings, snapshots, and challenges', async ({
  page,
}) => {
  const startingSave = createStartedJourneyFixture('Parker');
  const startingAppearance = structuredClone(startingSave.trainer.appearance);
  await startWithCurrentSave(page, startingSave);
  const runtimeErrors = collectRuntimeErrors(page);

  await page.goto('/');
  await expectHealthyGameShell(page);
  await openReview(page);

  await page
    .getByLabel('Visible training development')
    .selectOption('exaggerated');
  await page.getByText('Workout pump highlights').click();
  await page
    .getByRole('button', { name: 'Take in-game pixel portrait' })
    .click();
  await expect(
    page.getByText(/Pixel portrait stored in this save/i),
  ).toBeVisible();

  await page.getByLabel('Challenge').selectOption('stage-presence');
  await page.getByLabel(/Timing marker/i).fill('76');
  await page.getByLabel(/Preparation/i).fill('90');
  await page.getByLabel('Outfit alignment').selectOption('92');
  await page.getByRole('button', { name: /Enter Stage Command/i }).click();
  await expect(
    page.getByText(/Stage Command|challenge/i).last(),
  ).toBeVisible();

  await expect
    .poll(async () => {
      const state = await readCurrentSaveState(page);
      const progression = state?.visualProgression as
        | {
            preferences?: {
              developmentLevel?: string;
              showPumpEffects?: boolean;
            };
            snapshots?: unknown[];
            challenges?: {
              attemptsByChallengeId?: Record<string, number>;
            };
          }
        | undefined;
      return {
        appearance: state?.trainer
          ? (state.trainer as typeof startingSave.trainer).appearance
          : null,
        developmentLevel: progression?.preferences?.developmentLevel,
        pump: progression?.preferences?.showPumpEffects,
        snapshots: progression?.snapshots?.length,
        attempts:
          progression?.challenges?.attemptsByChallengeId?.['stage-presence'],
      };
    })
    .toEqual({
      appearance: startingAppearance,
      developmentLevel: 'exaggerated',
      pump: false,
      snapshots: 1,
      attempts: 1,
    });

  await page.getByRole('button', { name: 'Close review' }).click();
  await expect(page.getByTestId('physique-review')).toHaveCount(0);
  expect(runtimeErrors).toEqual([]);
});

test('Physique Review remains bounded on a phone and accepts standard gamepad navigation', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startWithCurrentSave(page, createStartedJourneyFixture('Rin'));
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 16 }, () => ({
      pressed: false,
      touched: false,
      value: 0,
    }));
    Object.defineProperty(window, '__reviewGamepadButtons', {
      configurable: true,
      value: buttons,
    });
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => [
        {
          axes: [0, 0, 0, 0],
          buttons,
          connected: true,
          id: 'Gym Buddies Review Pad',
          index: 0,
          mapping: 'standard',
          timestamp: performance.now(),
          vibrationActuator: null,
        },
      ],
    });
  });

  await page.goto('/');
  await expectHealthyGameShell(page);
  await openReview(page);

  const metrics = await page.getByTestId('physique-review').evaluate((panel) => {
    const smallestTarget = Math.min(
      ...Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, select, input:not([type="checkbox"]), .physique-review-toggle',
        ),
      )
        .filter((element) => element.offsetParent !== null)
        .map((element) => element.getBoundingClientRect().height),
    );
    return {
      panelWidth: panel.getBoundingClientRect().width,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      smallestTarget,
    };
  });
  expect(metrics.panelWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.smallestTarget).toBeGreaterThanOrEqual(38);

  await page.evaluate(() => {
    const buttons = (
      window as unknown as {
        __reviewGamepadButtons: Array<{ pressed: boolean; value: number }>;
      }
    ).__reviewGamepadButtons;
    buttons[13]!.pressed = true;
    buttons[13]!.value = 1;
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.activeElement?.getAttribute('aria-label') ?? '',
      ),
    )
    .toBe('Physique review pose');
  await page.evaluate(() => {
    const button = (
      window as unknown as {
        __reviewGamepadButtons: Array<{ pressed: boolean; value: number }>;
      }
    ).__reviewGamepadButtons[13]!;
    button.pressed = false;
    button.value = 0;
  });

  await page.screenshot({
    path: testInfo.outputPath('physique-review-390x844.png'),
    fullPage: false,
  });
});
