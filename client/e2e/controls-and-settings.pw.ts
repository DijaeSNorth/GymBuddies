import { expect, test } from '@playwright/test';

import { createStartedJourneyFixture } from '../src/tests/fixtures/saveFixtures';
import {
  collectRuntimeErrors,
  expectHealthyGameShell,
  readCurrentSaveState,
  startWithCurrentSave,
} from './support/gameTestSupport';

test('keyboard movement, menu controls, and audio settings persist', async ({
  page,
}) => {
  await startWithCurrentSave(page, createStartedJourneyFixture('Keyra'));
  const runtimeErrors = collectRuntimeErrors(page);

  await page.goto('/');
  await expectHealthyGameShell(page);
  const playfield = page.getByRole('region', {
    name: /Gym Buddies game playfield/i,
  });
  await expect(playfield).toHaveAttribute('data-location-id', 'home-gym');

  const startingY = Number(await playfield.getAttribute('data-player-y'));
  await playfield.focus();
  await page.keyboard.press('KeyW');
  await expect
    .poll(async () => Number(await playfield.getAttribute('data-player-y')))
    .toBe(startingY - 1);

  await page.keyboard.press('KeyM');
  await expect(
    page.getByRole('dialog', { name: 'Controls & accessibility' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('dialog', { name: 'Controls & accessibility' }),
  ).toHaveCount(0);

  await page.getByRole('button', { name: 'Mute all audio' }).click();
  await expect
    .poll(async () => {
      const state = await readCurrentSaveState(page);
      return (state?.audio as { enabled?: boolean } | undefined)?.enabled;
    })
    .toBe(false);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Unmute all audio' })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});
