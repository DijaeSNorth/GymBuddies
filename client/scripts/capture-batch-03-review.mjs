import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const clientRoot = resolve(import.meta.dirname, '..');
const outputRoot = resolve(
  clientRoot,
  'art-source/review/batch-03-dome-shell',
);
const port = 4183;
const baseUrl = `http://127.0.0.1:${port}`;
const characters = [
  'titan-tortoise',
  'ripped-rhino',
  'boulder-bison',
  'dome-warden',
];
const deliverables = [
  'cross-resolution',
  'silhouettes',
  'armor-layers',
  'anchors',
  'mobile',
  'boss-tiers',
];

mkdirSync(outputRoot, { recursive: true });

const server = spawn(
  process.execPath,
  [
    resolve(clientRoot, 'node_modules/vite/bin/vite.js'),
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '--strictPort',
  ],
  {
    cwd: clientRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  },
);

let serverOutput = '';
server.stdout.on('data', (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  serverOutput += chunk.toString();
});

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(
        `Review server exited before capture.\n${serverOutput}`,
      );
    }
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 150));
  }
  throw new Error(`Review server did not start.\n${serverOutput}`);
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    colorScheme: 'dark',
    deviceScaleFactor: 1,
    viewport: { width: 1800, height: 6000 },
  });
  page.setDefaultTimeout(90_000);
  await page.goto(`${baseUrl}/?debug=batch03-review`, {
    waitUntil: 'networkidle',
  });
  await page.waitForFunction(
    () => {
      const canvases = [
        ...document.querySelectorAll(
          '.batch03-review-shell .buddy-pixel-canvas, .batch03-layer-canvas',
        ),
      ];
      if (canvases.length < 250) return false;
      return canvases.every((canvas) => {
        const context = canvas.getContext('2d');
        if (!context || canvas.width === 0 || canvas.height === 0) {
          return false;
        }
        const pixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data;
        for (let index = 3; index < pixels.length; index += 4) {
          if (pixels[index] > 0) return true;
        }
        return false;
      });
    },
    undefined,
    { timeout: 90_000 },
  );

  for (const characterId of characters) {
    await page
      .locator(`[data-batch03-character="${characterId}"]`)
      .screenshot({
        animations: 'disabled',
        path: resolve(
          outputRoot,
          `${characterId}-review-contact-sheet.png`,
        ),
      });
  }
  for (const deliverableId of deliverables) {
    await page
      .locator(`[data-review-deliverable="${deliverableId}"]`)
      .screenshot({
        animations: 'disabled',
        path: resolve(outputRoot, `${deliverableId}.png`),
      });
  }
  process.stdout.write(
    `Captured ${characters.length} character sheets and ${deliverables.length} Batch 03 review deliverables in ${outputRoot}.\n`,
  );
} finally {
  if (browser) await browser.close();
  server.kill();
}
