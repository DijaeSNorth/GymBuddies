import {
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { basename, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const buildRoot = resolve(projectRoot, 'dist');
const assetRoot = resolve(buildRoot, 'assets');
const indexHtml = readFileSync(resolve(buildRoot, 'index.html'), 'utf8');
const scriptMatch = indexHtml.match(
  /<script[^>]+src="[^"]*\/assets\/([^"]+\.js)"/,
);
if (!scriptMatch) {
  throw new Error('Production index does not reference a JavaScript entry.');
}

const mainChunkName = basename(scriptMatch[1]);
const mainChunkPath = resolve(assetRoot, mainChunkName);
const mainChunkBytes = statSync(mainChunkPath).size;
const baselineMainBytes = 735_273;
const maximumMainBytes = Math.floor(baselineMainBytes * 0.85);
if (mainChunkBytes > maximumMainBytes) {
  throw new Error(
    `Main chunk is ${mainChunkBytes} bytes; the 15% reduction guard requires ${maximumMainBytes} bytes or fewer.`,
  );
}

const javascriptFiles = readdirSync(assetRoot).filter((name) =>
  name.endsWith('.js'),
);
const productionSource = javascriptFiles
  .map((name) => readFileSync(resolve(assetRoot, name), 'utf8'))
  .join('\n');
const forbiddenDebugLabels = [
  'Batch 03 deliverable',
  'Formal Batch 02',
  'Gym Buddies Asset Deck',
  'Sprite Strip Lab',
  'Developer Audio Lab',
  'Developer Test Saves',
  'Playtest Report Viewer',
  'Intentional development journey boundary check.',
  'Plastrong accessory priority and all 32 mount points',
  'Resolution-specific approval ledger',
];
const leakedLabels = forbiddenDebugLabels.filter((label) =>
  productionSource.includes(label),
);
if (leakedLabels.length > 0) {
  throw new Error(
    `Debug-only labels leaked into production: ${leakedLabels.join(', ')}`,
  );
}

const requiredLazyChunks = [
  'JourneyGame-',
  'BuddySprite-',
  'BuddyIndex-',
  'BuddyCustomizer-',
  'PhysiqueReviewPanel-',
  'GamePresentation-',
  'createGamePresentation-',
  'AlphaPlaytestPanel-',
];
const missingLazyChunks = requiredLazyChunks.filter(
  (prefix) => !javascriptFiles.some((name) => name.startsWith(prefix)),
);
if (missingLazyChunks.length > 0) {
  throw new Error(
    `Expected lazy chunks are missing: ${missingLazyChunks.join(', ')}`,
  );
}
const staticallyReferencedLazyChunks = requiredLazyChunks.filter((prefix) =>
  indexHtml.includes(prefix),
);
if (staticallyReferencedLazyChunks.length > 0) {
  throw new Error(
    `Lazy chunks were referenced by index.html: ${staticallyReferencedLazyChunks.join(', ')}`,
  );
}

process.stdout.write(
  `Production bundle verified: ${mainChunkName} is ${mainChunkBytes} bytes (${(
    (1 - mainChunkBytes / baselineMainBytes) *
    100
  ).toFixed(1)}% below baseline); debug labels absent; ${requiredLazyChunks.length} lazy boundaries present.\n`,
);
