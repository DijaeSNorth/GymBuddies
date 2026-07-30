import type Phaser from 'phaser';

import {
  ASSET_MANIFEST,
  getAssetByKey,
  getAssetStandard,
} from '../assets/manifest';
import {
  getBuddyPresentationAssetKeys,
  resolvePhaserBuddyPresentationFrame,
  type ResolveBuddyPresentationFrameInput,
} from '../assets/buddyPresentationResolver';
import {
  resolveBuddySpriteFrame,
  type ResolveBuddySpriteFrameInput,
} from '../assets/buddySpriteResolver';
import { resolveAssetKeyUrl } from '../assets/assetUrl';
import {
  BUDDY_SPRITE_DIRECTIONS,
  type BuddyPresentationContext,
} from '../assets/types';

/**
 * Phaser consumes the exact same frame descriptor as the React canvas preview.
 * Gameplay and cosmetic state never move into a Scene.
 */
export function resolvePhaserBuddyFrame(
  input: ResolveBuddySpriteFrameInput,
) {
  return resolveBuddySpriteFrame(input);
}

export function resolvePhaserBuddyPresentation(
  input: ResolveBuddyPresentationFrameInput,
) {
  return resolvePhaserBuddyPresentationFrame(input);
}

export function preloadAuthoredBuddyStrips(
  scene: Pick<Phaser.Scene, 'load'>,
  speciesIds: readonly string[],
) {
  const queued = new Set<string>();
  speciesIds.forEach((speciesId) => {
    BUDDY_SPRITE_DIRECTIONS.forEach((direction) => {
      const resolved = resolveBuddySpriteFrame({
        speciesId,
        direction,
        pose: 'idle',
      });
      const assetKey = resolved.assetKey;
      if (!assetKey || queued.has(assetKey)) return;
      queued.add(assetKey);
      scene.load.spritesheet(assetKey, resolveAssetKeyUrl(assetKey), {
        frameWidth: ASSET_MANIFEST.buddySpritePipeline.frameWidth,
        frameHeight: ASSET_MANIFEST.buddySpritePipeline.frameHeight,
      });
    });
  });
}

export function preloadBuddyPresentationAssets(
  scene: Pick<Phaser.Scene, 'load'>,
  context: Exclude<BuddyPresentationContext, 'overworld'>,
  characterIds: readonly string[],
) {
  getBuddyPresentationAssetKeys(context, characterIds).forEach(
    (assetKey) => {
      const asset = getAssetByKey(assetKey);
      const standard = getAssetStandard(asset);
      if (standard.mediaType !== 'image') return;
      scene.load.spritesheet(assetKey, resolveAssetKeyUrl(assetKey), {
        frameWidth: standard.frameWidth,
        frameHeight: standard.frameHeight,
      });
    },
  );
}
