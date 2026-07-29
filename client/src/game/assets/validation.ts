import { ASSET_CATEGORIES, type AssetManifest, type AssetValidationIssue } from './types';

const STABLE_KEY_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const SAFE_PATH_PATTERN = /^[a-z0-9][a-z0-9/_-]*\.(?:png|wav)$/;

export function validateAssetManifest(manifest: AssetManifest): AssetValidationIssue[] {
  const issues: AssetValidationIssue[] = [];
  const keys = new Set<string>();
  const paths = new Set<string>();
  const categories = new Set<string>(ASSET_CATEGORIES);

  Object.entries(manifest.standards).forEach(([standardKey, standard]) => {
    if (standard.id !== standardKey) {
      issues.push({
        code: 'invalid-standard',
        message: `Standard map key "${standardKey}" does not match id "${standard.id}".`,
      });
    }
    if (
      standard.mediaType === 'image' &&
      (standard.frameWidth <= 0 ||
        standard.frameHeight <= 0 ||
        standard.columns <= 0 ||
        standard.rows <= 0 ||
        standard.frameCount <= 0 ||
        standard.frameCount > standard.columns * standard.rows)
    ) {
      issues.push({
        code: 'invalid-standard',
        message: `Image standard "${standard.id}" has invalid frame geometry.`,
      });
    }
  });

  manifest.assets.forEach((asset) => {
    if (keys.has(asset.key)) {
      issues.push({ code: 'duplicate-key', message: `Duplicate asset key "${asset.key}".` });
    }
    keys.add(asset.key);

    if (paths.has(asset.path)) {
      issues.push({ code: 'duplicate-path', message: `Duplicate asset path "${asset.path}".` });
    }
    paths.add(asset.path);

    if (!STABLE_KEY_PATTERN.test(asset.key)) {
      issues.push({ code: 'invalid-key', message: `Asset key "${asset.key}" is not stable-key safe.` });
    }
    if (!categories.has(asset.category)) {
      issues.push({ code: 'invalid-category', message: `Unknown category "${asset.category}".` });
    }
    if (
      !SAFE_PATH_PATTERN.test(asset.path) ||
      asset.path.startsWith('/') ||
      asset.path.includes('..') ||
      !asset.path.startsWith(`${asset.category}/`)
    ) {
      issues.push({
        code: 'invalid-path',
        message: `Asset "${asset.key}" has unsafe or miscategorized path "${asset.path}".`,
      });
    }

    const standard = manifest.standards[asset.standardId];
    if (!standard) {
      issues.push({
        code: 'missing-standard',
        message: `Asset "${asset.key}" references missing standard "${asset.standardId}".`,
      });
      return;
    }

    if (standard.mediaType === 'image') {
      if (!('paletteId' in asset)) {
        issues.push({
          code: 'media-mismatch',
          message: `Image asset "${asset.key}" has no palette.`,
        });
      } else if (!manifest.palettes[asset.paletteId]) {
        issues.push({
          code: 'missing-palette',
          message: `Asset "${asset.key}" references missing palette "${asset.paletteId}".`,
        });
      }
      if (!asset.path.endsWith('.png')) {
        issues.push({
          code: 'media-mismatch',
          message: `Image asset "${asset.key}" must use a PNG path.`,
        });
      }
    } else if (!asset.path.endsWith('.wav') || !('durationMs' in asset)) {
      issues.push({
        code: 'media-mismatch',
        message: `Audio asset "${asset.key}" must use WAV and declare durationMs.`,
      });
    }
  });

  return issues;
}

export function assertAssetManifestValid(manifest: AssetManifest) {
  const issues = validateAssetManifest(manifest);
  if (issues.length > 0) {
    throw new Error(
      `Asset manifest validation failed:\n${issues.map((issue) => `- ${issue.message}`).join('\n')}`,
    );
  }
}
