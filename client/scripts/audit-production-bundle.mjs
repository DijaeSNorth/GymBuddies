import { build } from 'vite';
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, relative, resolve, sep } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const projectRoot = resolve(import.meta.dirname, '..');
const outputArgumentIndex = process.argv.indexOf('--output');
const reportPath = resolve(
  projectRoot,
  outputArgumentIndex >= 0 && process.argv[outputArgumentIndex + 1]
    ? process.argv[outputArgumentIndex + 1]
    : '.bundle-audit/latest.json',
);
const temporaryBuildRoot = resolve(
  tmpdir(),
  `gym-buddies-bundle-audit-${process.pid}`,
);

function normalizeSource(source) {
  const normalized = source.split('\\').join('/');
  const clientMarker = '/client/';
  const clientIndex = normalized.lastIndexOf(clientMarker);
  return clientIndex >= 0
    ? normalized.slice(clientIndex + clientMarker.length)
    : normalized;
}

function compressedSizes(bytes) {
  return {
    minifiedBytes: bytes.length,
    gzipBytes: gzipSync(bytes, { level: 9 }).length,
    brotliBytes: brotliCompressSync(bytes, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11,
      },
    }).length,
  };
}

function formatKb(bytes) {
  return `${(bytes / 1000).toFixed(2)} kB`;
}

try {
  await build({
    root: projectRoot,
    configFile: resolve(projectRoot, 'vite.config.ts'),
    logLevel: 'warn',
    build: {
      emptyOutDir: true,
      manifest: true,
      outDir: temporaryBuildRoot,
      sourcemap: true,
    },
  });

  const assetRoot = resolve(temporaryBuildRoot, 'assets');
  const manifest = JSON.parse(
    readFileSync(
      resolve(temporaryBuildRoot, '.vite/manifest.json'),
      'utf8',
    ),
  );
  const chunks = readdirSync(assetRoot)
    .filter((name) => name.endsWith('.js'))
    .sort()
    .map((name) => {
      const bytes = readFileSync(resolve(assetRoot, name));
      const map = JSON.parse(
        readFileSync(resolve(assetRoot, `${name}.map`), 'utf8'),
      );
      const modules = map.sources
        .map((source, index) => ({
          id: normalizeSource(source),
          sourceBytes: Buffer.byteLength(
            map.sourcesContent[index] ?? '',
          ),
        }))
        .sort(
          (left, right) =>
            right.sourceBytes - left.sourceBytes ||
            left.id.localeCompare(right.id),
        );
      return {
        name,
        ...compressedSizes(bytes),
        modules,
      };
    });

  const manifestEntries = Object.entries(manifest).map(
    ([id, entry]) => ({
      id,
      file: entry.file,
      imports: entry.imports ?? [],
      dynamicImports: entry.dynamicImports ?? [],
      isEntry: Boolean(entry.isEntry),
      isDynamicEntry: Boolean(entry.isDynamicEntry),
    }),
  );
  const mainEntry = manifestEntries.find((entry) => entry.isEntry);
  const mainChunk = chunks.find(
    (chunk) => chunk.name === basename(mainEntry?.file ?? ''),
  );
  const moduleOwners = new Map();
  for (const chunk of chunks) {
    for (const module of chunk.modules) {
      const owners = moduleOwners.get(module.id) ?? [];
      owners.push(chunk.name);
      moduleOwners.set(module.id, owners);
    }
  }
  const duplicateModules = [...moduleOwners.entries()]
    .filter(([, owners]) => owners.length > 1)
    .map(([id, owners]) => ({ id, chunks: owners }));
  const debugPattern =
    /(?:^|\/)(?:e2e|tests?|debug|art-source)(?:\/|$)|Batch0[23]Review|AssetPreview|SpriteStripLab|AudioTestPanel/i;
  const debugOnlyModules = chunks.flatMap((chunk) =>
    chunk.modules
      .filter((module) => debugPattern.test(module.id))
      .map((module) => ({ chunk: chunk.name, module: module.id })),
  );
  const mainModules = mainChunk?.modules ?? [];
  const report = {
    generatedAt: new Date().toISOString(),
    command:
      'npm run bundle:audit -- --output .bundle-audit/latest.json',
    mainChunk: mainChunk?.name,
    totals: chunks.reduce(
      (totals, chunk) => ({
        minifiedBytes: totals.minifiedBytes + chunk.minifiedBytes,
        gzipBytes: totals.gzipBytes + chunk.gzipBytes,
        brotliBytes: totals.brotliBytes + chunk.brotliBytes,
      }),
      { minifiedBytes: 0, gzipBytes: 0, brotliBytes: 0 },
    ),
    chunks,
    manifestEntries,
    duplicateModules,
    debugOnlyModules,
    characterContentLoadedAtStartup: mainModules
      .filter((module) =>
        /src\/game\/(?:content\/(?:buddies|buddyCharacters|bossCharacters|characters)|assets\/)/.test(
          module.id,
        ),
      )
      .map((module) => module.id),
    spriteRendererCodeLoadedAtStartup: mainModules
      .filter((module) =>
        /src\/game\/rendering\/|src\/ui\/buddies\/BuddySprite/.test(
          module.id,
        ),
      )
      .map((module) => module.id),
    testOrFixtureCodeInProduction: chunks.flatMap((chunk) =>
      chunk.modules
        .filter((module) =>
          /(?:^|\/)(?:e2e|tests?|fixtures)(?:\/|$)/.test(module.id),
        )
        .map((module) => ({ chunk: chunk.name, module: module.id })),
    ),
  };

  mkdirSync(resolve(reportPath, '..'), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  process.stdout.write(
    [
      `Bundle report: ${relative(projectRoot, reportPath).split(sep).join('/')}`,
      ...chunks.map(
        (chunk) =>
          `${chunk.name}: ${formatKb(chunk.minifiedBytes)} min / ${formatKb(chunk.gzipBytes)} gzip / ${formatKb(chunk.brotliBytes)} brotli / ${chunk.modules.length} modules`,
      ),
      `Debug-only production modules: ${debugOnlyModules.length}`,
      `Duplicate modules across chunks: ${duplicateModules.length}`,
    ].join('\n') + '\n',
  );
} finally {
  rmSync(temporaryBuildRoot, { recursive: true, force: true });
}
