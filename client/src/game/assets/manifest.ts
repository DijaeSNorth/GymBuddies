import manifestJson from './asset-manifest.json';
import type {
  AssetManifest,
  AssetManifestEntry,
  AssetStandard,
  ImageAssetManifestEntry,
} from './types';

export const ASSET_MANIFEST = manifestJson as AssetManifest;

export const ASSET_BY_KEY = new Map(
  ASSET_MANIFEST.assets.map((asset) => [asset.key, asset]),
);

export function getAssetByKey(key: string): AssetManifestEntry {
  const asset = ASSET_BY_KEY.get(key);
  if (!asset) throw new Error(`Unknown asset key "${key}".`);
  return asset;
}

export function getAssetStandard(asset: AssetManifestEntry): AssetStandard {
  const standard = ASSET_MANIFEST.standards[asset.standardId];
  if (!standard) throw new Error(`Missing standard "${asset.standardId}" for "${asset.key}".`);
  return standard;
}

export function isImageAsset(
  asset: AssetManifestEntry,
): asset is ImageAssetManifestEntry {
  return getAssetStandard(asset).mediaType === 'image';
}
