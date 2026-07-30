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
    page.getByRole('heading', { name: 'Bodybuilding pose library' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Minimum, middle, and maximum builds' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Clothing stress tests' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '240×160 mobile-scale preview' }),
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
  await expect(
    page.locator('.major-character-outfit-pair .trainer-pixel-canvas'),
  ).toHaveCount(28);
  await expect(page.locator('.buddy-debug-gallery article')).toHaveCount(16);
  await expect(page.locator('.boss-character-gallery article')).toHaveCount(12);
  await expect(page.locator('[data-buddy-preset]')).toHaveCount(80);
  await expect(page.locator('[data-buddy-pose]')).toHaveCount(192);
  await expect(page.locator('[data-boss-tier]')).toHaveCount(60);
  await expect(
    page.locator('.buddy-background-checks .silhouette-only'),
  ).toHaveCount(32);
  await expect(page.locator('.buddy-mobile-check')).toHaveCount(16);
  await expect(page.locator('.character-animation-gallery figure')).toHaveCount(
    22,
  );
  await expect(page.locator('.body-range-gallery article')).toHaveCount(3);
  await expect(page.locator('.clothing-stress-gallery article')).toHaveCount(9);
  await expect(page.locator('.mobile-character-preview figure')).toHaveCount(3);

  const buddySection = page.locator('section', {
    has: page.getByRole('heading', { name: 'Buddy variation matrix' }),
  });
  await buddySection.locator('article').first().screenshot({
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
  const bossSection = page.locator('section', {
    has: page.getByRole('heading', { name: 'Boss character gallery' }),
  });
  await bossSection.screenshot({
    path: testInfo.outputPath('boss-tier-gallery.png'),
  });
  const rangeSection = page.locator('section', {
    has: page.getByRole('heading', {
      name: 'Minimum, middle, and maximum builds',
    }),
  });
  await rangeSection.screenshot({
    path: testInfo.outputPath('body-range-gallery.png'),
  });
  const poseSection = page.locator('section', {
    has: page.getByRole('heading', { name: 'Bodybuilding pose library' }),
  });
  await poseSection.screenshot({
    path: testInfo.outputPath('bodybuilding-pose-gallery.png'),
  });
  const clothingSection = page.locator('section', {
    has: page.getByRole('heading', { name: 'Clothing stress tests' }),
  });
  await clothingSection.screenshot({
    path: testInfo.outputPath('clothing-stress-gallery.png'),
  });
  const mobileSection = page.locator('section', {
    has: page.getByRole('heading', { name: '240×160 mobile-scale preview' }),
  });
  await mobileSection.screenshot({
    path: testInfo.outputPath('mobile-scale-gallery.png'),
  });

  expect(runtimeErrors).toEqual([]);
});
