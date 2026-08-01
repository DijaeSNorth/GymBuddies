import { expect, test } from '@playwright/test';

import { startWithEmptyStorage } from './support/gameTestSupport';

test('idle gameplay bounds React work, save writes, input polling, and Phaser canvases', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const audit = {
      gamepadPolls: 0,
      reactCommits: 0,
      saveWrites: 0,
    };
    Object.defineProperty(window, '__gymBuddiesPerformanceAudit', {
      configurable: true,
      value: audit,
    });
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => {
        audit.gamepadPolls += 1;
        return [];
      },
    });
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      checkDCE() {},
      inject(renderer: unknown) {
        void renderer;
        return 1;
      },
      onCommitFiberRoot() {
        audit.reactCommits += 1;
      },
      onCommitFiberUnmount() {},
      renderers: new Map(),
      supportsFiber: true,
    };
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function trackedSetItem(key, value) {
      if (String(key).startsWith('gym-buddies')) audit.saveWrites += 1;
      return setItem.call(this, key, value);
    };
  });
  await startWithEmptyStorage(page);

  await page.goto('/');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const audit = window.__gymBuddiesPerformanceAudit;
    audit.gamepadPolls = 0;
    audit.reactCommits = 0;
    audit.saveWrites = 0;
  });
  await page.waitForTimeout(2_200);
  const openingAudit = await page.evaluate(
    () => window.__gymBuddiesPerformanceAudit,
  );
  expect(openingAudit.saveWrites).toBe(0);

  await page.getByLabel('Trainer name').fill('Performance');
  await page.getByLabel('Opening').selectOption('normal');
  await page
    .getByRole('button', { name: 'Start Journey' })
    .click();
  await expect(page.locator('.gb-phaser-host canvas')).toHaveCount(1);

  await page.waitForTimeout(4_000);
  await page.evaluate(() => {
    const audit = window.__gymBuddiesPerformanceAudit;
    audit.gamepadPolls = 0;
    audit.reactCommits = 0;
    audit.saveWrites = 0;
  });
  await page.waitForTimeout(5_200);

  const idleAudit = await page.evaluate(
    () => window.__gymBuddiesPerformanceAudit,
  );
  expect(idleAudit.reactCommits).toBeLessThanOrEqual(8);
  expect(idleAudit.saveWrites).toBeLessThanOrEqual(4);
  expect(idleAudit.gamepadPolls).toBeLessThanOrEqual(8);

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await page.getByRole('button', { name: 'Open system menu' }).click();
    await page.getByRole('button', { name: 'Edit Trainer' }).first().click();
    await expect(page.locator('.gb-phaser-host canvas')).toHaveCount(0);
    if (cycle === 0) {
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        const audit = window.__gymBuddiesPerformanceAudit;
        audit.gamepadPolls = 0;
        audit.reactCommits = 0;
        audit.saveWrites = 0;
      });
      await page.waitForTimeout(2_200);
      const inactiveAudit = await page.evaluate(
        () => window.__gymBuddiesPerformanceAudit,
      );
      expect(inactiveAudit.saveWrites).toBeLessThanOrEqual(1);
    }
    await page.getByRole('button', { name: 'Cancel Changes' }).click();
    await expect(page.locator('.gb-phaser-host canvas')).toHaveCount(1);
  }
});

test('a journey UI failure preserves save export and recovery actions', async ({
  page,
}) => {
  await startWithEmptyStorage(page);
  await page.goto('/');
  await page.getByLabel('Trainer name').fill('Recovery');
  await page.getByLabel('Opening').selectOption('normal');
  await page
    .getByRole('button', { name: 'Start Journey' })
    .click();
  await expect(page.locator('.gb-phaser-host canvas')).toHaveCount(1);

  await page.goto('/?debug=journey-error');
  await expect(
    page.getByRole('heading', {
      name: 'The journey interface stopped safely.',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Retry interface' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Return to trainer setup' }),
  ).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export save' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    'gym-buddies-save.json',
  );
});

declare global {
  interface Window {
    __gymBuddiesPerformanceAudit: {
      gamepadPolls: number;
      reactCommits: number;
      saveWrites: number;
    };
    __REACT_DEVTOOLS_GLOBAL_HOOK__: {
      checkDCE: () => void;
      inject: (renderer: unknown) => number;
      onCommitFiberRoot: () => void;
      onCommitFiberUnmount: () => void;
      renderers: Map<unknown, unknown>;
      supportsFiber: boolean;
    };
  }
}
