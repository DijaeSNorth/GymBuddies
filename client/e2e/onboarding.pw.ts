import { expect, test } from '@playwright/test';

import {
  createRepresentativeSaveFixtures,
  createStartedJourneyFixture,
} from '../src/tests/fixtures/saveFixtures';
import { SAVE_IMPORT_MAX_BYTES } from '../src/game/content/save';
import { createDefaultSaveData } from '../src/game/save/saveDefaults';
import {
  collectRuntimeErrors,
  expectHealthyGameShell,
  readCurrentSaveState,
  startWithCorruptedPrimary,
  startWithCurrentSave,
  startWithEmptyStorage,
  startWithLegacySave,
} from './support/gameTestSupport';

test('new-game onboarding creates a versioned guided-journey save', async ({
  page,
}) => {
  await startWithEmptyStorage(page);
  const runtimeErrors = collectRuntimeErrors(page);

  await page.goto('/');
  await expectHealthyGameShell(page);
  await expect(
    page.getByRole('heading', { name: 'GYM BUDDIES' }),
  ).toBeVisible();

  await page.getByLabel('Trainer name').fill('Morgan');
  await page.getByRole('tab', { name: 'Gameplay', exact: true }).click();
  await page.getByRole('button', { name: /Control Specialist/i }).click();
  await page.locator('#root').evaluate((root) => {
    root.scrollTo(0, root.scrollHeight);
  });
  await page
    .getByRole('button', { name: 'Start Guided Journey' })
    .click();

  await expect(page.getByTestId('journey-status-bar')).toBeVisible();
  await expect
    .poll(() => page.locator('#root').evaluate((root) => root.scrollTop))
    .toBe(0);
  await expect(page.locator('.journey-dialogue-bar')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();

  await expect
    .poll(async () => {
      const state = await readCurrentSaveState(page);
      return {
        hasStarterSet: state?.hasStarterSet,
        name: (state?.trainer as { name?: string } | undefined)?.name,
        schemaVersion: state?.schemaVersion,
        tutorialStep: state?.tutorialStep,
      };
    }, { timeout: 8_000 })
    .toEqual({
      hasStarterSet: true,
      name: 'Morgan',
      schemaVersion: 19,
      tutorialStep: 0,
    });

  await page.getByRole('button', { name: 'Next' }).click();
  await expect
    .poll(async () => (await readCurrentSaveState(page))?.tutorialStep)
    .toBe(1);
  expect(runtimeErrors).toEqual([]);
});

test('legacy saves migrate in the rendered application', async ({
  page,
}) => {
  const fixtures = createRepresentativeSaveFixtures();
  await startWithLegacySave(page, fixtures.legacyV12);

  await page.goto('/');
  await expectHealthyGameShell(page);
  await expect(page.getByTestId('journey-status-bar')).toBeVisible();
  await expect
    .poll(async () => (await readCurrentSaveState(page))?.schemaVersion)
    .toBe(19);
});

test('Trainer Forge supports keyboard and standard gamepad navigation', async ({
  page,
}) => {
  await startWithEmptyStorage(page);
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 16 }, () => ({
      pressed: false,
      touched: false,
      value: 0,
    }));
    Object.defineProperty(window, '__trainerForgeGamepadButtons', {
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
          id: 'Gym Buddies Test Controller',
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
  const name = page.getByLabel('Trainer name');
  await name.focus();
  await page.keyboard.press('Tab');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.activeElement?.getAttribute('data-setup-control') ??
          'missing',
      ),
    )
    .toBe('true');

  await name.focus();
  await page.evaluate(() => {
    const buttons = (
      window as unknown as {
        __trainerForgeGamepadButtons: Array<{ pressed: boolean; value: number }>;
      }
    ).__trainerForgeGamepadButtons;
    buttons[13]!.pressed = true;
    buttons[13]!.value = 1;
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.activeElement?.getAttribute('aria-label') ?? '',
      ),
    )
    .not.toBe('Trainer name');
  await page.evaluate(() => {
    const button = (
      window as unknown as {
        __trainerForgeGamepadButtons: Array<{ pressed: boolean; value: number }>;
      }
    ).__trainerForgeGamepadButtons[13]!;
    button.pressed = false;
    button.value = 0;
  });
});

test('detailed trainer customization persists stable IDs and saved looks', async ({
  page,
}, testInfo) => {
  await startWithEmptyStorage(page);
  const runtimeErrors = collectRuntimeErrors(page);

  await page.goto('/');
  await expectHealthyGameShell(page);
  await page.getByLabel('Trainer name').fill('Forge Avery');
  await page.getByRole('button', { name: /Detail Forge/i }).click();

  await page
    .getByRole('button', { name: /Classic Bodybuilder/i })
    .click();
  await page.getByRole('button', { name: 'Shoulders' }).click();
  await expect(page.locator('#trainer-build-shoulderWidth')).toHaveValue('9');
  await page.locator('#trainer-build-shoulderWidth').fill('10');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.locator('#trainer-build-latWidth').fill('10');
  await page.getByRole('button', { name: /Quick Forge/i }).click();
  await expect(page.locator('#trainer-build-latWidth')).toHaveCount(0);
  await page.getByRole('button', { name: /Detail Forge/i }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.locator('#trainer-build-latWidth')).toHaveValue('10');

  await page.getByRole('tab', { name: 'Face' }).click();
  await page.getByLabel('Face shape').selectOption('diamond-defined');
  await page.getByLabel('Face paint').selectOption('split-chevron');

  await page.getByRole('tab', { name: 'Hair' }).click();
  await page.getByLabel('Hair style').selectOption('bald');

  await page.getByRole('tab', { name: 'Outfit' }).click();
  await page
    .getByLabel('Top')
    .selectOption('compression-long');
  await page
    .getByLabel('Bottoms')
    .selectOption('leggings-panel');

  await page.getByRole('tab', { name: 'Colors' }).click();
  await page
    .getByRole('button', { name: 'Top primary: Plum' })
    .click();

  await page.getByRole('tab', { name: 'Accessories' }).click();
  await page
    .getByLabel('Headband or hat')
    .selectOption('wide-headband');
  await page.getByLabel('Gym bag').selectOption('duffel-small');

  await page.getByRole('button', { name: 'Randomize' }).click();
  await page.getByRole('button', { name: 'Randomize Appearance' }).click();
  await page.getByRole('button', { name: 'Close Controlled Randomizer' }).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByLabel('Headband or hat')).toHaveValue(
    'wide-headband',
  );

  await page.getByRole('button', { name: 'Before / After' }).click();
  await expect(page.getByText('Before', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Poses' }).click();
  await page.getByRole('button', { name: /right trainer/i }).click();
  await page.getByRole('button', { name: 'Victory', exact: true }).click();
  await page.getByRole('button', { name: 'Saved Looks' }).click();
  await page.getByLabel('Appearance preset name').fill('Arena Look');
  await page.getByRole('button', { name: 'Save Current Look' }).click();
  await expect(page.getByText('Arena Look', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Duplicate' }).click();
  await page.getByRole('button', { name: 'Rename' }).first().click();
  await page.getByLabel('Rename Arena Look').fill('Stage Look');
  await page.getByRole('button', { name: 'Save Name' }).click();
  await expect(
    page.locator('.trainer-saved-presets strong').filter({
      hasText: 'Stage Look',
    }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Compare two looks' }))
    .toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('trainer-forge-saved-looks.png'),
    fullPage: false,
  });
  await page.getByRole('button', { name: 'Close Saved Looks' }).click();

  await page.getByLabel('Opening').selectOption('normal');
  await page
    .getByRole('button', { name: 'Start Journey' })
    .click();
  await expect(page.getByTestId('journey-status-bar')).toBeVisible();

  await expect
    .poll(async () => {
      const state = await readCurrentSaveState(page);
      const trainer = state?.trainer as
        | {
            appearance?: {
              build?: { shoulderWidth?: number; latWidth?: number };
              face?: { shapeId?: string; facePaintId?: string };
              hair?: { styleId?: string; lengthId?: string };
              outfit?: { topId?: string; bottomsId?: string };
              colors?: { topPrimaryId?: string };
              accessories?: {
                headwearId?: string;
                gymBagId?: string;
              };
            };
            appearancePresets?: Array<{ id?: string; name?: string }>;
          }
        | undefined;
      return {
        schemaVersion: state?.schemaVersion,
        shoulderWidth: trainer?.appearance?.build?.shoulderWidth,
        latWidth: trainer?.appearance?.build?.latWidth,
        faceShape: trainer?.appearance?.face?.shapeId,
        facePaint: trainer?.appearance?.face?.facePaintId,
        hairStyle: trainer?.appearance?.hair?.styleId,
        hairLength: trainer?.appearance?.hair?.lengthId,
        top: trainer?.appearance?.outfit?.topId,
        bottoms: trainer?.appearance?.outfit?.bottomsId,
        topColor: trainer?.appearance?.colors?.topPrimaryId,
        headwear: trainer?.appearance?.accessories?.headwearId,
        bag: trainer?.appearance?.accessories?.gymBagId,
        presetNames: trainer?.appearancePresets?.map(({ name }) => name),
        presetHasStableId: Boolean(
          trainer?.appearancePresets?.[0]?.id?.startsWith(
            'trainer-look-',
          ),
        ),
      };
    })
    .toEqual({
      schemaVersion: 19,
      shoulderWidth: 10,
      latWidth: 10,
      faceShape: 'diamond-defined',
      facePaint: 'split-chevron',
      hairStyle: 'bald',
      hairLength: 'none',
      top: 'compression-long',
      bottoms: 'leggings-panel',
      topColor: 'plum',
      headwear: 'wide-headband',
      bag: 'duffel-small',
      presetNames: ['Stage Look', 'Arena Look Copy'],
      presetHasStableId: true,
    });
  expect(runtimeErrors).toEqual([]);
});

test('Buddy customization stays species-readable and persists cosmetic-only IDs', async ({
  page,
}, testInfo) => {
  await startWithCurrentSave(
    page,
    createStartedJourneyFixture('Buddy Stylist'),
  );
  const runtimeErrors = collectRuntimeErrors(page);

  await page.goto('/');
  await expectHealthyGameShell(page);
  await page.getByTestId('journey-nav-team').click();
  const customize = page.getByRole('button', { name: 'Customize Buddy' });
  await customize.scrollIntoViewIfNeeded();
  await customize.click();

  await expect(
    page.getByRole('heading', { name: /Customize/i }),
  ).toBeVisible();
  await page.getByLabel('Nickname').fill('Moss Atlas');
  await page.getByLabel('Primary palette').selectOption('violet');
  await page.getByLabel('Secondary palette').selectOption('chalk');
  await page.getByLabel('Accent palette').selectOption('amber');
  await page.getByLabel('Markings').selectOption('pattern-shoulder-bands');
  await page.getByLabel('Muscle definition').selectOption('etched');
  await page.getByLabel('Body variation').selectOption('broad');
  await page
    .getByRole('button', { name: 'Ceremonial Chain' })
    .click();
  await page.getByLabel('Preview animation').selectOption('victory');
  await page.getByRole('button', { name: 'Rotate Buddy right' }).click();

  const canvas = page.locator('.buddy-customizer .buddy-pixel-canvas');
  await expect(canvas).toBeVisible();
  const pixels = await canvas.evaluate((element) => {
    const canvasElement = element as HTMLCanvasElement;
    const context = canvasElement.getContext('2d');
    const data =
      context?.getImageData(
        0,
        0,
        canvasElement.width,
        canvasElement.height,
      ).data ?? [];
    let opaque = 0;
    const colors = new Set<string>();
    for (let index = 0; index < data.length; index += 4) {
      if ((data[index + 3] ?? 0) === 0) continue;
      opaque += 1;
      colors.add(
        `${data[index]},${data[index + 1]},${data[index + 2]}`,
      );
    }
    return { colors: colors.size, opaque };
  });
  expect(pixels.opaque).toBeGreaterThan(30);
  expect(pixels.colors).toBeGreaterThan(3);

  await page.screenshot({
    path: testInfo.outputPath('buddy-customizer.png'),
    fullPage: true,
  });

  await expect
    .poll(async () => {
      const state = await readCurrentSaveState(page);
      const buddy = (
        state?.team as
          | Array<{
              nickname?: string;
              cosmetics?: Record<string, unknown>;
              level?: number;
            }>
          | undefined
      )?.[0];
      return {
        bodySizeId: buddy?.cosmetics?.bodySizeId,
        level: buddy?.level,
        nickname: buddy?.nickname,
        patternId: buddy?.cosmetics?.patternId,
        primaryPaletteId: buddy?.cosmetics?.primaryPaletteId,
      };
    }, { timeout: 8_000 })
    .toEqual({
      bodySizeId: 'broad',
      level: createStartedJourneyFixture().team[0]!.level,
      nickname: 'Moss Atlas',
      patternId: 'pattern-shoulder-bands',
      primaryPaletteId: 'violet',
    });
  expect(runtimeErrors).toEqual([]);
});

test('a corrupted primary loads the valid previous save without a blank screen', async ({
  page,
}) => {
  const fixtures = createRepresentativeSaveFixtures();
  await startWithCorruptedPrimary(
    page,
    fixtures.corruptedPrimary,
    fixtures.storage.validBackupJson,
  );

  await page.goto('/');
  await expectHealthyGameShell(page);
  await expect(page.getByTestId('journey-status-bar')).toContainText('Backup Avery');
});

test('an oversized save file is rejected before confirmation', async ({
  page,
}) => {
  const save = createDefaultSaveData();
  save.hasStarterSet = true;
  save.tutorialStep = 5;
  await startWithCurrentSave(page, save);

  await page.goto('/');
  await expectHealthyGameShell(page);
  await page.getByRole('button', { name: 'Open system menu' }).click();
  await page.getByText('Save Management').click();
  await page
    .getByLabel('Choose Gym Buddies save JSON')
    .evaluate((element, size) => {
      const transfer = new DataTransfer();
      transfer.items.add(
        new File(
          [new Uint8Array(size)],
          'oversized-save.json',
          { type: 'application/json' },
        ),
      );
      Object.defineProperty(element, 'files', {
        configurable: true,
        value: transfer.files,
      });
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }, SAVE_IMPORT_MAX_BYTES + 1);

  await expect(page.getByText(/larger than the 1 MiB save import limit/i))
    .toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Import this journey?' })).toHaveCount(0);
});

test('storage denial in the optional setup flag does not break startup', async ({
  page,
}) => {
  const save = createDefaultSaveData();
  save.hasStarterSet = true;
  save.tutorialStep = 5;
  await startWithCurrentSave(page, save);
  await page.addInitScript(() => {
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function guardedGetItem(key: string) {
      if (key === 'gymbuddies-force-setup') {
        throw new DOMException('Storage denied for test.', 'SecurityError');
      }
      return originalGetItem.call(this, key);
    };
  });
  const runtimeErrors = collectRuntimeErrors(page);

  await page.goto('/');
  await expectHealthyGameShell(page);
  await expect(page.getByTestId('journey-status-bar')).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});
