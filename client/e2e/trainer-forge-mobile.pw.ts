import { expect, test } from '@playwright/test';

import {
  collectRuntimeErrors,
  expectHealthyGameShell,
  startWithEmptyStorage,
} from './support/gameTestSupport';

test('mobile Forge keeps preview and confirm fixed while the inspector scrolls internally', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startWithEmptyStorage(page);
  const runtimeErrors = collectRuntimeErrors(page);
  await page.goto('/');
  await expectHealthyGameShell(page);

  await expect(page.locator('.trainer-studio-inspector-scroll input[type="range"]')).toHaveCount(5);
  await page.getByRole('button', { name: /Detail Forge/i }).tap();
  await page.getByRole('button', { name: 'Shoulders', exact: true }).tap();
  const sliderCount = await page.locator('.trainer-studio-inspector-scroll input[type="range"]:visible').count();
  expect(sliderCount).toBeLessThanOrEqual(6);

  await page.getByRole('tab', { name: 'Face', exact: true }).tap();
  const inspector = page.locator('.trainer-studio-inspector-scroll');
  await inspector.evaluate((element) => element.scrollTo(0, element.scrollHeight));
  const metrics = await page.evaluate(() => {
    const studio = document.querySelector<HTMLElement>('.trainer-studio-v3');
    const preview = document.querySelector<HTMLElement>('.trainer-studio-preview');
    const inspector = document.querySelector<HTMLElement>('.trainer-studio-inspector-scroll');
    const confirm = document.querySelector<HTMLElement>('.trainer-studio-confirm');
    const visibleTargets = Array.from(
      document.querySelectorAll<HTMLElement>('.trainer-studio-v3 button, .trainer-studio-v3 select, .trainer-studio-v3 input'),
    ).filter((element) => element.offsetParent !== null);
    return {
      bodyScrollTop: document.scrollingElement?.scrollTop ?? -1,
      documentWidth: document.documentElement.scrollWidth,
      inspectorClientHeight: inspector?.clientHeight ?? 0,
      inspectorScrollHeight: inspector?.scrollHeight ?? 0,
      inspectorScrollTop: inspector?.scrollTop ?? 0,
      preview: preview?.getBoundingClientRect().toJSON(),
      confirm: confirm?.getBoundingClientRect().toJSON(),
      smallestTarget: Math.min(...visibleTargets.map((element) => element.getBoundingClientRect().height)),
      studioWidth: studio?.getBoundingClientRect().width ?? Number.POSITIVE_INFINITY,
    };
  });
  expect(metrics.bodyScrollTop).toBe(0);
  expect(metrics.documentWidth).toBeLessThanOrEqual(390);
  expect(metrics.studioWidth).toBeLessThanOrEqual(390);
  expect(metrics.inspectorScrollHeight).toBeGreaterThan(metrics.inspectorClientHeight);
  expect(metrics.inspectorScrollTop).toBeGreaterThan(0);
  expect(metrics.preview?.top ?? -1).toBeGreaterThanOrEqual(0);
  expect(metrics.preview?.bottom ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(844);
  expect(metrics.confirm?.bottom ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(844);
  expect(metrics.smallestTarget).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: testInfo.outputPath('trainer-forge-mobile-face.png'), fullPage: false });

  await page.getByRole('tab', { name: 'Outfit', exact: true }).tap();
  await expect(page.getByLabel('Top')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('trainer-forge-mobile-outfit.png'), fullPage: false });

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByLabel('Top')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel('Top')).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test('mobile Saved Looks and Randomize use focus-trapped bottom sheets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startWithEmptyStorage(page);
  await page.goto('/');
  await expectHealthyGameShell(page);

  const savedLooks = page.getByRole('button', { name: 'Saved Looks', exact: true });
  await savedLooks.tap();
  const savedDrawer = page.getByRole('dialog', { name: 'Saved Looks' });
  await expect(savedDrawer).toBeVisible();
  const drawerBox = await savedDrawer.boundingBox();
  expect(drawerBox?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(390);
  expect((drawerBox?.y ?? Number.POSITIVE_INFINITY) + (drawerBox?.height ?? 0)).toBeLessThanOrEqual(844);
  await page.keyboard.press('Escape');
  await expect(savedLooks).toBeFocused();

  await page.getByRole('button', { name: 'Randomize', exact: true }).tap();
  await expect(page.getByRole('dialog', { name: 'Controlled Randomizer' })).toBeVisible();
  await page.keyboard.press('Escape');
});
