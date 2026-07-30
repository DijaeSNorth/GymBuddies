import manifestJson from './asset-manifest.json';
import type {
  AssetManifest,
  AssetManifestEntry,
  AssetStandard,
  BuddyBossSpriteOverlay,
  BuddyMultiResolutionCharacterProfile,
  BuddySpriteRenderProfile,
  ImageAssetManifestEntry,
} from './types';

export const ASSET_MANIFEST = manifestJson as unknown as AssetManifest;

export const ASSET_BY_KEY = new Map(
  ASSET_MANIFEST.assets.map((asset) => [asset.key, asset]),
);

export const BUDDY_SPRITE_PROFILE_BY_SPECIES_ID = new Map(
  ASSET_MANIFEST.buddySpritePipeline.profiles.map((profile) => [
    profile.speciesId,
    profile,
  ]),
);

export const BUDDY_BOSS_OVERLAY_BY_BOSS_ID = new Map(
  ASSET_MANIFEST.buddySpritePipeline.bossOverlays.map((overlay) => [
    overlay.bossId,
    overlay,
  ]),
);

export const BUDDY_PRESENTATION_PROFILE_BY_CHARACTER_ID = new Map(
  (ASSET_MANIFEST.buddySpritePipeline.presentationProfiles ?? []).map(
    (profile) => [profile.characterId, profile],
  ),
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

export function getBuddySpriteProfile(
  speciesId: string,
): BuddySpriteRenderProfile | undefined {
  return BUDDY_SPRITE_PROFILE_BY_SPECIES_ID.get(speciesId);
}

export function getBuddyBossOverlay(
  bossId: string,
): BuddyBossSpriteOverlay | undefined {
  return BUDDY_BOSS_OVERLAY_BY_BOSS_ID.get(bossId);
}

export function getBuddyPresentationProfile(
  characterId: string,
): BuddyMultiResolutionCharacterProfile | undefined {
  return BUDDY_PRESENTATION_PROFILE_BY_CHARACTER_ID.get(characterId);
}
