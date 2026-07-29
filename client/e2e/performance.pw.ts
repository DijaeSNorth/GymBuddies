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
  await page.getByLabel('Trainer name').fill('Performance');
  await page.getByText('Normal Start', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Confirm & Start Journey' })
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
    await page.getByRole('button', { name: 'Edit Trainer' }).first().click();
    await page.getByRole('button', { name: 'Cancel Changes' }).click();
    await expect(page.locator('.gb-phaser-host canvas')).toHaveCount(1);
  }
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
