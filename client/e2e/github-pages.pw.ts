import { expect, test } from '@playwright/test';

import deployment from '../deployment.config.json' with { type: 'json' };
import {
  collectRuntimeErrors,
  expectHealthyGameShell,
  readCurrentSaveState,
  startWithEmptyStorage,
} from './support/gameTestSupport';

type PublicAssetManifest = {
  basePath: string;
  assets: Array<{
    key: string;
    path: string;
  }>;
};

test('deployment smoke: release shell, manifests, and every asset load from the exact repository path', async ({
  page,
  request,
}) => {
  test.setTimeout(45_000);
  const runtimeErrors = collectRuntimeErrors(page);
  const failedResponses: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  const response = await page.goto(deployment.basePath);
  expect(response?.status()).toBe(200);
  await expectHealthyGameShell(page);
  await expect(
    page.getByRole('heading', { name: 'GYM BUDDIES' }),
  ).toBeVisible();

  const assetUrls = await page
    .locator('script[src], link[rel="stylesheet"][href]')
    .evaluateAll((elements) =>
      elements.map(
        (element) =>
          (element as HTMLScriptElement).src ||
          (element as HTMLLinkElement).href,
      ),
    );
  expect(assetUrls.length).toBeGreaterThan(1);
  expect(
    assetUrls.every((url) =>
      new URL(url).pathname.startsWith(`${deployment.basePath}assets/`),
    ),
  ).toBe(true);

  const manifestResponse = await request.get(
    new URL(
      `${deployment.basePath}manifest.webmanifest`,
      page.url(),
    ).href,
  );
  expect(manifestResponse.status()).toBe(200);
  expect(manifestResponse.headers()['content-type']).toContain(
    'application/manifest+json',
  );
  const pwaManifest = (await manifestResponse.json()) as {
    name: string;
    scope: string;
    start_url: string;
    icons: Array<{ sizes: string; src: string }>;
  };
  expect(pwaManifest).toMatchObject({
    name: 'Gym Buddies',
    scope: './',
    start_url: './',
  });
  expect(pwaManifest.icons.map((icon) => icon.sizes)).toEqual([
    '192x192',
    '512x512',
  ]);

  for (const icon of pwaManifest.icons) {
    const iconResponse = await request.get(
      new URL(icon.src, manifestResponse.url()).href,
    );
    expect(iconResponse.status(), icon.src).toBe(200);
    const buffer = await iconResponse.body();
    const expectedSize = Number.parseInt(icon.sizes, 10);
    expect(buffer.readUInt32BE(16), icon.src).toBe(expectedSize);
    expect(buffer.readUInt32BE(20), icon.src).toBe(expectedSize);
  }

  const publicAssetManifestUrl = new URL(
    `${deployment.basePath}assets/gym-buddies/asset-manifest.json`,
    page.url(),
  );
  const assetManifestResponse = await request.get(
    publicAssetManifestUrl.href,
  );
  expect(assetManifestResponse.status()).toBe(200);
  const publicAssetManifest =
    (await assetManifestResponse.json()) as PublicAssetManifest;

  const assetResults = await Promise.all(
    publicAssetManifest.assets.map(async (asset) => {
      const assetUrl = new URL(
        `${deployment.basePath}${publicAssetManifest.basePath}/${asset.path}`,
        page.url(),
      );
      const assetResponse = await request.get(assetUrl.href);
      return {
        key: asset.key,
        status: assetResponse.status(),
        type: assetResponse.headers()['content-type'],
      };
    }),
  );
  expect(
    assetResults.filter((asset) => asset.status !== 200),
  ).toEqual([]);
  expect(
    assetResults.every((asset) =>
      /^(audio\/wav|image\/png)/.test(asset.type ?? ''),
    ),
  ).toBe(true);

  const serviceWorkerResponse = await request.get(
    new URL(`${deployment.basePath}sw.js`, page.url()).href,
  );
  expect(serviceWorkerResponse.status()).toBe(200);
  expect(serviceWorkerResponse.headers()['cache-control']).toContain(
    'no-cache',
  );
  const serviceWorkerSource = await serviceWorkerResponse.text();
  expect(serviceWorkerSource).toMatch(
    /gym-buddies-core-[a-f0-9]{16}/,
  );
  const precacheSource =
    serviceWorkerSource.match(
      /const PRECACHE_URLS = ([\s\S]*?);\nconst DEFERRED_URLS/,
    )?.[1] ?? '';
  expect(precacheSource).not.toContain('/battle-48.png');
  expect(precacheSource).not.toContain('/battle-64.png');
  expect(precacheSource).not.toContain('/showcase-64.png');
  expect(precacheSource).not.toContain('/portrait-64.png');
  expect(serviceWorkerSource).toContain(
    '/presentation/v1/brawny-bear/battle-48.png',
  );

  const reloadedResponse = await page.reload();
  expect(reloadedResponse?.status()).toBe(200);
  await expectHealthyGameShell(page);
  await expect(
    page.getByRole('heading', { name: 'GYM BUDDIES' }),
  ).toBeVisible();
  expect(failedResponses).toEqual([]);
  expect(runtimeErrors).toEqual([]);
});

test('the Pages fallback renders after a direct nested visit and refresh', async ({
  page,
}) => {
  const nestedPath = `${deployment.basePath}play/`;
  const directResponse = await page.goto(nestedPath);
  expect(directResponse?.status()).toBe(404);
  await expectHealthyGameShell(page);
  await expect(
    page.getByRole('heading', { name: 'GYM BUDDIES' }),
  ).toBeVisible();

  const refreshResponse = await page.reload();
  expect(refreshResponse?.status()).toBe(404);
  await expectHealthyGameShell(page);
  await expect(
    page.getByRole('heading', { name: 'GYM BUDDIES' }),
  ).toBeVisible();
});

test('installed release loads its core game and local save while offline', async ({
  context,
  page,
}) => {
  test.setTimeout(45_000);
  await startWithEmptyStorage(page);
  const runtimeErrors = collectRuntimeErrors(page);

  await page.goto(deployment.basePath);
  await page.getByLabel('Trainer name').fill('Offline Avery');
  await page.getByText('Normal Start', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Confirm & Start Journey' })
    .click();
  await expect(page.locator('.gb-phaser-host canvas')).toHaveCount(1);
  await expect
    .poll(async () => {
      const state = await readCurrentSaveState(page);
      return (state?.trainer as { name?: string } | undefined)?.name;
    })
    .toBe('Offline Avery');

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.locator('.gb-phaser-host canvas')).toHaveCount(1);
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expectHealthyGameShell(page);
  await expect(page.locator('.gb-phaser-host canvas')).toHaveCount(1);
  await expect(page.getByText(/Offline Avery · Physique Level/)).toBeVisible();
  expect(
    (await readCurrentSaveState(page))?.trainer,
  ).toMatchObject({ name: 'Offline Avery' });

  const cacheAudit = await page.evaluate(async () => {
    const keys = await caches.keys();
    const urls = (
      await Promise.all(
        keys.map(async (key) => {
          const cache = await caches.open(key);
          return (await cache.keys()).map((request) => request.url);
        }),
      )
    ).flat();
    return { keys, urls };
  });
  expect(cacheAudit.keys).toHaveLength(1);
  expect(cacheAudit.keys[0]).toMatch(/^gym-buddies-core-[a-f0-9]{16}$/);
  expect(
    cacheAudit.urls.some((url) => /save|localstorage/i.test(url)),
  ).toBe(false);

  await context.setOffline(false);
  expect(runtimeErrors).toEqual([]);
});
