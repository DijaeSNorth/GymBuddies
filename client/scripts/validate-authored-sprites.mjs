import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { inflateSync } from 'node:zlib';

const clientRoot = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(
  readFileSync(
    join(clientRoot, 'src', 'game', 'assets', 'asset-manifest.json'),
    'utf8',
  ),
);
const assetRoot = join(clientRoot, 'public', manifest.basePath);
const assetByKey = new Map(manifest.assets.map((asset) => [asset.key, asset]));
const errors = [];

function decodePng(path) {
  const source = readFileSync(path);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!source.subarray(0, 8).equals(signature)) {
    throw new Error('not a PNG');
  }
  const width = source.readUInt32BE(16);
  const height = source.readUInt32BE(20);
  const chunks = [];
  let offset = 8;
  while (offset < source.length) {
    const length = source.readUInt32BE(offset);
    const type = source.subarray(offset + 4, offset + 8).toString('ascii');
    if (type === 'IDAT') {
      chunks.push(source.subarray(offset + 8, offset + 8 + length));
    }
    offset += length + 12;
  }
  const scanlines = inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  const rgba = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const sourceOffset = y * (stride + 1);
    if (scanlines[sourceOffset] !== 0) {
      throw new Error('PNG uses a filter other than 0');
    }
    scanlines.copy(
      rgba,
      y * stride,
      sourceOffset + 1,
      sourceOffset + 1 + stride,
    );
  }
  return { width, height, rgba };
}

function alphaBounds(
  image,
  frameIndex,
  frameWidth,
  frameHeight,
  columns,
) {
  const frameColumn = frameIndex % columns;
  const frameRow = Math.floor(frameIndex / columns);
  let left = frameWidth;
  let top = frameHeight;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < frameHeight; y += 1) {
    for (let x = 0; x < frameWidth; x += 1) {
      const alpha =
        image.rgba[
          ((frameRow * frameHeight + y) * image.width +
            frameColumn * frameWidth +
            x) *
            4 +
            3
        ];
      if (alpha === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return right < 0 ? undefined : { left, top, right, bottom };
}

function validateAsset(assetKey, expectedStandardId, groundLine) {
  const asset = assetByKey.get(assetKey);
  if (!asset) {
    errors.push(`${assetKey}: missing manifest asset`);
    return;
  }
  if (asset.standardId !== expectedStandardId) {
    errors.push(
      `${assetKey}: expected standard ${expectedStandardId}, got ${asset.standardId}`,
    );
    return;
  }
  const standard = manifest.standards[asset.standardId];
  const path = join(assetRoot, asset.path);
  if (!existsSync(path)) {
    errors.push(`${assetKey}: missing file ${path}`);
    return;
  }
  try {
    const image = decodePng(path);
    const expectedWidth = standard.frameWidth * standard.columns;
    const expectedHeight = standard.frameHeight * standard.rows;
    if (image.width !== expectedWidth || image.height !== expectedHeight) {
      errors.push(
        `${assetKey}: expected ${expectedWidth}x${expectedHeight}, got ${image.width}x${image.height}`,
      );
      return;
    }
    for (let frame = 0; frame < standard.frameCount; frame += 1) {
      const bounds = alphaBounds(
        image,
        frame,
        standard.frameWidth,
        standard.frameHeight,
        standard.columns,
      );
      if (!bounds) {
        errors.push(`${assetKey}: frame ${frame} is empty`);
        continue;
      }
      if (
        bounds.left <= 0 ||
        bounds.right >= standard.frameWidth - 1 ||
        bounds.top <= 0
      ) {
        errors.push(
          `${assetKey}: frame ${frame} touches a side/top edge (${JSON.stringify(bounds)})`,
        );
      }
      if (bounds.bottom > groundLine) {
        errors.push(
          `${assetKey}: frame ${frame} crosses ground line ${groundLine}`,
        );
      }
    }
  } catch (error) {
    errors.push(`${assetKey}: ${error.message}`);
  }
}

const pipeline = manifest.buddySpritePipeline;
const profileIds = new Set();
const validatedAssetKeys = new Set();
function validateOnce(assetKey, expectedStandardId, groundLine) {
  if (validatedAssetKeys.has(assetKey)) return;
  validatedAssetKeys.add(assetKey);
  validateAsset(assetKey, expectedStandardId, groundLine);
}

for (const profile of pipeline.profiles) {
  if (profileIds.has(profile.speciesId)) {
    errors.push(`${profile.speciesId}: duplicate sprite profile`);
  }
  profileIds.add(profile.speciesId);
  if (
    profile.mirrorRightFromLeft &&
    profile.asymmetricFeatureIds.length > 0
  ) {
    errors.push(`${profile.speciesId}: unsafe asymmetric mirroring`);
  }
  const authoredCandidates = [
    ...Object.values(profile.baseStrips),
    ...Object.values(profile.baseStripCandidates ?? {}).flat(),
  ];
  for (const assetKey of authoredCandidates) {
    validateOnce(assetKey, 'buddy-authored-strip', 21);
  }
}
for (const overlay of pipeline.bossOverlays) {
  for (const assetKey of [
    overlay.assetKey,
    ...(overlay.assetCandidates ?? []),
  ]) {
    validateOnce(assetKey, 'buddy-boss-tier-overlay', 21);
  }
}
for (const profile of pipeline.presentationProfiles ?? []) {
  for (const profileKey of [
    'menuSpriteProfile',
    'battleSpriteProfile',
    'showcaseSpriteProfile',
    'dialoguePortraitProfile',
  ]) {
    const presentation = profile[profileKey];
    if (!presentation) continue;
    const standard = manifest.standards[presentation.standardId];
    if (!standard || standard.mediaType !== 'image') {
      errors.push(
        `${profile.characterId}/${profileKey}: missing image standard ${presentation.standardId}`,
      );
      continue;
    }
    if (
      presentation.frameOrder.length !== standard.columns ||
      (presentation.tierFrameOrder?.length ?? standard.rows) !== standard.rows
    ) {
      errors.push(
        `${profile.characterId}/${profileKey}: frame/tier order does not match ${standard.columns}x${standard.rows} standard`,
      );
    }
    for (const assetKey of presentation.assetCandidates) {
      validateOnce(
        assetKey,
        presentation.standardId,
        standard.frameHeight - 3,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(
    `Authored sprite validation failed:\n${errors
      .map((error) => `- ${error}`)
      .join('\n')}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${pipeline.profiles.length} overworld profiles, ${pipeline.presentationProfiles?.length ?? 0} presentation profiles, ${pipeline.bossOverlays.length} boss overlay, and all authored frames.`,
  );
}
