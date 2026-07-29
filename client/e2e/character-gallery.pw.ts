import { expect, test } from '@playwright/test';

import {
  collectRuntimeErrors,
  expectHealthyGameShell,
} from './support/gameTestSupport';

test('development character gallery renders every major design family', async ({
  page,
}, testInfo) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await page.goto('/?debug=characters');
  await expectHealthyGameShell(page);

  await expect(
    page.getByRole('heading', { name: 'Every body archetype' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Animations and outfit modules' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Leaders, rivals, and route trainers',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Buddy variation matrix' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Boss character gallery' }),
  ).toBeVisible();

  await expect(page.locator('.major-character-gallery article')).toHaveCount(14);
  await expect(page.locator('.buddy-debug-gallery article')).toHaveCount(16);
  await expect(page.locator('.boss-character-gallery article')).toHaveCount(12);
  await expect(page.locator('.character-animation-gallery figure')).toHaveCount(
    14,
  );

  const buddySection = page.locator('section', {
    has: page.getByRole('heading', { name: 'Buddy variation matrix' }),
  });
  await buddySection.screenshot({
    path: testInfo.outputPath('buddy-variation-gallery.png'),
  });
  const majorCharacterSection = page.locator('section', {
    has: page.getByRole('heading', {
      name: 'Leaders, rivals, and route trainers',
    }),
  });
  await majorCharacterSection.screenshot({
    path: testInfo.outputPath('major-character-gallery.png'),
  });

  expect(runtimeErrors).toEqual([]);
});
