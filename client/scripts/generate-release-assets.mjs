import { createHash } from 'node:crypto';
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { deflateSync } from 'node:zlib';

const projectRoot = resolve('.');
const buildRoot = resolve(projectRoot, 'dist');
const deployment = JSON.parse(
  readFileSync(resolve(projectRoot, 'deployment.config.json'), 'utf8'),
);
const packageJson = JSON.parse(
  readFileSync(resolve(projectRoot, 'package.json'), 'utf8'),
);
const assetManifestSource = resolve(
  projectRoot,
  'src/game/assets/asset-manifest.json',
);
const assetManifest = JSON.parse(readFileSync(assetManifestSource, 'utf8'));

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([size, typeBuffer, data, checksum]);
}

function createPwaIcon(size) {
  const colors = {
    midnight: [6, 21, 25, 255],
    slate: [40, 80, 87, 255],
    mint: [104, 211, 155, 255],
    cream: [238, 242, 208, 255],
    amber: [242, 193, 78, 255],
    coral: [239, 106, 91, 255],
  };
  const pixels = Buffer.alloc((size * 4 + 1) * size);
  const unit = size / 32;

  for (let y = 0; y < size; y += 1) {
    const rowOffset = y * (size * 4 + 1);
    pixels[rowOffset] = 0;
    for (let x = 0; x < size; x += 1) {
      const px = x / unit;
      const py = y / unit;
      const border =
        px >= 3 && px < 29 && py >= 3 && py < 29 &&
        (px < 5 || px >= 27 || py < 5 || py >= 27);
      const bar = px >= 8 && px < 24 && py >= 14 && py < 18;
      const leftPlate = px >= 6 && px < 10 && py >= 10 && py < 22;
      const rightPlate = px >= 22 && px < 26 && py >= 10 && py < 22;
      const leftCap = px >= 4 && px < 7 && py >= 12 && py < 20;
      const rightCap = px >= 25 && px < 28 && py >= 12 && py < 20;
      const pulse =
        (px >= 13 && px < 15 && py >= 8 && py < 14) ||
        (px >= 15 && px < 17 && py >= 6 && py < 10) ||
        (px >= 17 && px < 19 && py >= 8 && py < 14);
      const floorGlow = px >= 11 && px < 21 && py >= 23 && py < 25;

      let color = colors.midnight;
      if (border) color = colors.slate;
      if (bar) color = colors.amber;
      if (leftPlate || rightPlate) color = colors.mint;
      if (leftCap || rightCap) color = colors.cream;
      if (pulse) color = colors.coral;
      if (floorGlow) color = colors.slate;

      const offset = rowOffset + 1 + x * 4;
      pixels.set(color, offset);
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(pixels, { level: 9 })),
    pngChunk('IEND'),
  ]);
}

function writeBuildFile(relativePath, contents) {
  const target = resolve(buildRoot, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function listBuildFiles(directory = buildRoot) {
  const files = [];
  for (const name of readdirSync(directory)) {
    const absolutePath = join(directory, name);
    if (statSync(absolutePath).isDirectory()) {
      files.push(...listBuildFiles(absolutePath));
    } else {
      files.push(relative(buildRoot, absolutePath).split(sep).join('/'));
    }
  }
  return files.sort();
}

const indexPath = resolve(buildRoot, 'index.html');
if (!statSync(indexPath).isFile()) {
  throw new Error('Run Vite before generating Gym Buddies release assets.');
}

writeBuildFile('icons/icon-192.png', createPwaIcon(192));
writeBuildFile('icons/icon-512.png', createPwaIcon(512));
writeBuildFile('.nojekyll', '');
copyFileSync(indexPath, resolve(buildRoot, '404.html'));

const publicAssetManifestPath = `${assetManifest.basePath}/asset-manifest.json`;
mkdirSync(dirname(resolve(buildRoot, publicAssetManifestPath)), {
  recursive: true,
});
copyFileSync(
  assetManifestSource,
  resolve(buildRoot, publicAssetManifestPath),
);

const releaseFiles = listBuildFiles().filter((path) => path !== 'sw.js');
const deferredAssetPaths = new Set(
  assetManifest.assets
    .filter(
      (asset) =>
        asset.loadGroup &&
        asset.loadGroup !== 'core',
    )
    .map((asset) => `${assetManifest.basePath}/${asset.path}`),
);
const deferredRuntimePrefixes = [
  'assets/JourneyGame-',
  'assets/GamePresentation-',
  'assets/createGamePresentation-',
  'assets/BuddySprite-',
  'assets/BuddyIndex-',
  'assets/BuddyCustomizer-',
  'assets/PhysiqueReviewPanel-',
  'assets/AlphaPlaytestPanel-',
];
const deferredRuntimePaths = releaseFiles.filter((path) =>
  deferredRuntimePrefixes.some((prefix) => path.startsWith(prefix)),
);
const deferredPaths = new Set([
  ...deferredAssetPaths,
  ...deferredRuntimePaths,
]);
const filesToCache = releaseFiles.filter(
  (path) => !deferredPaths.has(path),
);
const releaseHash = createHash('sha256');
releaseHash.update(packageJson.version);
releaseHash.update(deployment.basePath);
for (const path of releaseFiles) {
  releaseHash.update(path);
  releaseHash.update(readFileSync(resolve(buildRoot, path)));
}
const cacheVersion = releaseHash.digest('hex').slice(0, 16);
const cacheName = `gym-buddies-core-${cacheVersion}`;
const precacheUrls = filesToCache.map((path) => `./${path}`);
const deferredUrls = [...deferredPaths]
  .filter((path) => releaseFiles.includes(path))
  .map((path) => `./${path}`);

const serviceWorker = `/* Gym Buddies ${packageJson.version}; cache ${cacheVersion}. */
const CACHE_PREFIX = 'gym-buddies-core-';
const CACHE_NAME = ${JSON.stringify(cacheName)};
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};
const DEFERRED_URLS = new Set(${JSON.stringify(deferredUrls, null, 2)}.map((path) => new URL(path, self.registration.scope).href));
const OFFLINE_DOCUMENT = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  if (
    requestUrl.origin !== self.location.origin ||
    !requestUrl.pathname.startsWith(scopeUrl.pathname)
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_DOCUMENT)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response.ok || !DEFERRED_URLS.has(request.url)) {
          return response;
        }
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    }),
  );
});
`;

writeBuildFile('sw.js', serviceWorker);

process.stdout.write(
  `Release assets generated for ${deployment.basePath} (${cacheName}, ${filesToCache.length} precached files, ${deferredUrls.length} lazy runtime files).\n`,
);
