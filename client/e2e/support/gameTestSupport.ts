import { expect, type Page } from '@playwright/test';

import { LEGACY_SAVE_KEYS, SAVE_BACKUP_KEY, SAVE_KEY } from '../../src/game/content/save';
import { exportSaveJson } from '../../src/game/save/saveService';
import type { SaveData } from '../../src/game/types';

const FIXED_SAVE_DATE = new Date('2026-01-15T12:00:00.000Z');
const SEED_MARKER = 'gym-buddies.e2e.storage-seeded';

export async function startWithEmptyStorage(page: Page) {
  await page.addInitScript((marker) => {
    if (window.sessionStorage.getItem(marker)) return;
    window.localStorage.clear();
    window.sessionStorage.setItem(marker, 'true');
  }, SEED_MARKER);
}

export async function startWithCurrentSave(page: Page, save: SaveData) {
  const json = exportSaveJson(save, FIXED_SAVE_DATE);
  await page.addInitScript(
    ({ key, value, marker }) => {
      if (window.sessionStorage.getItem(marker)) return;
      window.localStorage.clear();
      window.localStorage.setItem(key, value);
      window.sessionStorage.setItem(marker, 'true');
    },
    { key: SAVE_KEY, value: json, marker: SEED_MARKER },
  );
}

export async function startWithLegacySave(
  page: Page,
  legacySave: Record<string, unknown>,
) {
  await page.addInitScript(
    ({ key, value, marker }) => {
      if (window.sessionStorage.getItem(marker)) return;
      window.localStorage.clear();
      window.localStorage.setItem(key, value);
      window.sessionStorage.setItem(marker, 'true');
    },
    {
      key: LEGACY_SAVE_KEYS[0],
      value: JSON.stringify(legacySave),
      marker: SEED_MARKER,
    },
  );
}

export async function startWithCorruptedPrimary(
  page: Page,
  corruptedPrimary: string,
  validBackupJson: string,
) {
  await page.addInitScript(
    ({ currentKey, backupKey, corrupted, backup, marker }) => {
      if (window.sessionStorage.getItem(marker)) return;
      window.localStorage.clear();
      window.localStorage.setItem(currentKey, corrupted);
      window.localStorage.setItem(backupKey, backup);
      window.sessionStorage.setItem(marker, 'true');
    },
    {
      currentKey: SAVE_KEY,
      backupKey: SAVE_BACKUP_KEY,
      corrupted: corruptedPrimary,
      backup: validBackupJson,
      marker: SEED_MARKER,
    },
  );
}

export async function readCurrentSaveState(page: Page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      state?: Record<string, unknown>;
    } & Record<string, unknown>;
    return parsed.state ?? parsed;
  }, SAVE_KEY);
}

export function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

export async function expectHealthyGameShell(page: Page) {
  await expect(page).toHaveTitle('Gym Buddies');
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page.getByText(/failed to load config|internal server error/i)).toHaveCount(0);
}
