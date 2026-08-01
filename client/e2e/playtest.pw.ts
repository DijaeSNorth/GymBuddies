import { expect, test } from '@playwright/test';

import {
  createPlaytestReport,
  createPlaytestSession,
  PLAYTEST_STORAGE_KEY,
} from '../src/game/playtest/playtestService';
import { SAVE_KEY } from '../src/game/content/save';
import { createStartedJourneyFixture } from '../src/tests/fixtures/saveFixtures';
import {
  collectRuntimeErrors,
  expectHealthyGameShell,
  startWithCurrentSave,
  startWithEmptyStorage,
} from './support/gameTestSupport';

async function readDownloadJson(
  download: import('@playwright/test').Download,
) {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<
    string,
    unknown
  >;
}

test('playtest mode is opt-in, local-only, and exports a redacted preview', async ({
  page,
}) => {
  await startWithEmptyStorage(page);
  const runtimeErrors = collectRuntimeErrors(page);
  const mutatingRequests: string[] = [];
  page.on('request', (request) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      mutatingRequests.push(`${request.method()} ${request.url()}`);
    }
  });

  await page.goto('/');
  await expectHealthyGameShell(page);
  expect(
    await page.evaluate(
      (key) => window.localStorage.getItem(key),
      PLAYTEST_STORAGE_KEY,
    ),
  ).toBeNull();
  const saveBefore = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    SAVE_KEY,
  );

  await page.getByTestId('playtest-note-launcher').click();
  await expect(
    page.getByText('No account and no automatic upload.'),
  ).toBeVisible();
  await page.getByTestId('enable-alpha-playtest').click();
  await page
    .getByLabel('Playtest note category')
    .selectOption('liked');
  await page
    .getByRole('textbox', { name: 'Playtest note' })
    .fill('The creator preview was easy to understand.');
  await page.getByTestId('save-playtest-note').click();
  await expect(
    page.getByText('Playtest note stored locally.'),
  ).toBeVisible();

  const preview = page.getByTestId('playtest-report-preview');
  await expect(preview).toContainText('Player-created notes included: 1');
  await preview
    .getByLabel(/Include coarse environment/)
    .uncheck();
  await preview
    .getByLabel(/Include bounded event timeline/)
    .uncheck();
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-playtest-report').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^gym-buddies-playtest-0\.12\.0-.+\.json$/,
  );
  const exported = await readDownloadJson(download);
  const exportedSession = exported.session as Record<string, unknown>;
  expect(exportedSession.environment).toBeUndefined();
  expect(exportedSession.timeline).toBeUndefined();
  expect(exportedSession.feedback).toHaveLength(1);

  expect(
    await page.evaluate(
      (key) => window.localStorage.getItem(key),
      SAVE_KEY,
    ),
  ).toBe(saveBefore);
  expect(mutatingRequests).toEqual([]);
  expect(runtimeErrors).toEqual([]);
});

test('trainer milestone waits for the journey and mobile feedback remains keyboard-operable', async ({
  page,
}, testInfo) => {
  await startWithEmptyStorage(page);
  await page.goto('/');
  await page.getByTestId('playtest-note-launcher').click();
  await page.getByTestId('enable-alpha-playtest').click();
  await page
    .getByRole('button', { name: 'Close Alpha Playtest Mode' })
    .click();
  await page.getByLabel('Trainer name').fill('Alpha');
  await page.locator('#root').evaluate((root) => {
    root.scrollTo(0, root.scrollHeight);
  });
  await page
    .getByRole('button', { name: 'Start Guided Journey' })
    .click();

  await expect(page.getByTestId('journey-status-bar')).toBeVisible();
  const launcher = page.getByTestId('playtest-note-launcher');
  await expect(launcher).toBeHidden();
  await page.getByRole('button', { name: 'Open system menu' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Open playtest tools' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('alpha-playtest-panel')).toBeVisible();
  await expect(page.getByText(/trainer creation/i).first()).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('alpha-playtest-panel.png'),
    fullPage: false,
  });
});

test('journey error diagnostics preserve the current save', async ({
  page,
}) => {
  await startWithCurrentSave(
    page,
    createStartedJourneyFixture('Diagnostic'),
  );
  await page.goto('/');
  await expectHealthyGameShell(page);
  await page.getByRole('button', { name: 'Open system menu' }).click();
  await page.getByRole('button', { name: 'Open playtest tools' }).click();
  await page.getByTestId('enable-alpha-playtest').click();
  await page
    .getByRole('button', { name: 'Close Alpha Playtest Mode' })
    .click();
  const saveBefore = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    SAVE_KEY,
  );

  await page.goto('/?debug=journey-error');
  await expect(
    page.getByRole('heading', {
      name: 'The journey interface stopped safely.',
    }),
  ).toBeVisible();
  await page.getByTestId('playtest-note-launcher').click();
  await expect(page.getByTestId('playtest-report-preview')).toContainText(
    'Errors included: 1',
  );
  expect(
    await page.evaluate(
      (key) => window.localStorage.getItem(key),
      SAVE_KEY,
    ),
  ).toBe(saveBefore);
});

test('development report viewer validates imports and exposes triage views', async ({
  page,
}) => {
  await page.goto('/?debug=playtest-reports');
  await expect(
    page.getByRole('heading', { name: 'Playtest Report Viewer' }),
  ).toBeVisible();
  const fileInput = page.locator('input[type=file]');
  await fileInput.setInputFiles({
    name: 'malformed.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{not json'),
  });
  await expect(page.getByText(/Rejected:.*valid JSON/)).toBeVisible();

  const report = createPlaytestReport(
    createPlaytestSession({
      gameVersion: '0.12.0',
      buildId: 'viewer-test',
      saveSchemaVersion: 19,
      environment: {
        browserFamily: 'chrome',
        operatingSystemFamily: 'windows',
        screenWidth: 1280,
        screenHeight: 720,
        touchAvailable: false,
        gamepadAvailable: false,
      },
    }),
    { includeEnvironment: true, includeTimeline: true },
    {
      currentGym: 'home',
      currentRoute: null,
      trainerLevel: 3,
      activeBuddyLevel: 4,
      partySize: 2,
      fatigueRange: 'rested',
      tutorialStep: 1,
      completedBosses: 0,
    },
  );
  await fileInput.setInputFiles({
    name: 'valid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(report)),
  });
  await expect(page.getByTestId('report-summary')).toContainText(
    'viewer-test',
  );
  await expect(
    page.getByRole('heading', { name: 'Milestone funnel' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Duplicate-issue grouping' }),
  ).toBeVisible();
});
