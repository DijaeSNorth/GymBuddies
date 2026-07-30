import {
  drawBuddyFrameToCanvas,
  renderBuddyPixelFrame,
} from '../rendering/buddyPixelRenderer';
import {
  drawBuddyPresentationIdentityOverlays,
} from '../rendering/buddyPresentationOverlayRenderer';
import {
  drawArmoredHeavyPresentationOverlays,
} from '../rendering/armoredHeavyPresentationRenderer';
import {
  drawDomeShellPresentationOverlays,
} from '../rendering/domeShellPresentationRenderer';
import type {
  BossPresentationTier,
  BuddyCosmetics,
  BuddySpecies,
} from '../types';
import { applyPaletteSwap } from './paletteSwap';
import {
  createBuddyPaletteMap,
  renderResolvedBuddySprite,
} from './buddySpriteCompositor';
import {
  resolveBuddyPresentationFrame,
  type ResolvedBuddyPresentationFrame,
} from './buddyPresentationResolver';
import { ASSET_MANIFEST } from './manifest';
import type { BuddySpriteLayer } from './types';

const PRESENTATION_CACHE_ENTRY_LIMIT = 12;
const PRESENTATION_CACHE_BYTE_LIMIT = 4 * 1024 * 1024;

type PresentationCacheEntry = {
  promise: Promise<HTMLImageElement>;
  image?: HTMLImageElement;
  decodedBytes: number;
  lastUsed: number;
};

const presentationImageCache = new Map<
  string,
  PresentationCacheEntry
>();
let presentationCacheClock = 0;
let presentationCacheHits = 0;
let presentationCacheMisses = 0;
let presentationCacheEvictions = 0;

function totalDecodedBytes() {
  let total = 0;
  presentationImageCache.forEach((entry) => {
    total += entry.decodedBytes;
  });
  return total;
}

function trimPresentationCache() {
  while (
    presentationImageCache.size > PRESENTATION_CACHE_ENTRY_LIMIT ||
    totalDecodedBytes() > PRESENTATION_CACHE_BYTE_LIMIT
  ) {
    let oldestKey: string | undefined;
    let oldestUse = Number.POSITIVE_INFINITY;
    presentationImageCache.forEach((entry, key) => {
      if (entry.image && entry.lastUsed < oldestUse) {
        oldestUse = entry.lastUsed;
        oldestKey = key;
      }
    });
    if (!oldestKey) break;
    const evicted = presentationImageCache.get(oldestKey);
    if (evicted?.image) evicted.image.src = '';
    presentationImageCache.delete(oldestKey);
    presentationCacheEvictions += 1;
  }
}

export function loadBuddyPresentationImage(
  url: string,
): Promise<HTMLImageElement> {
  presentationCacheClock += 1;
  const cached = presentationImageCache.get(url);
  if (cached) {
    presentationCacheHits += 1;
    cached.lastUsed = presentationCacheClock;
    return cached.promise;
  }
  presentationCacheMisses += 1;
  const entry: PresentationCacheEntry = {
    decodedBytes: 0,
    lastUsed: presentationCacheClock,
    promise: Promise.resolve(undefined as never),
  };
  entry.promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      entry.image = image;
      entry.decodedBytes =
        image.naturalWidth * image.naturalHeight * 4;
      trimPresentationCache();
      resolve(image);
    };
    image.onerror = () => {
      presentationImageCache.delete(url);
      reject(
        new Error(`Could not load Buddy presentation asset "${url}".`),
      );
    };
    image.src = url;
  });
  presentationImageCache.set(url, entry);
  trimPresentationCache();
  return entry.promise;
}

export function releaseBuddyPresentationImage(url: string) {
  const entry = presentationImageCache.get(url);
  if (!entry) return;
  if (entry.image) entry.image.src = '';
  presentationImageCache.delete(url);
}

function drawAuthoredPresentationFrame(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  resolution: ResolvedBuddyPresentationFrame,
) {
  const columns = Math.max(
    1,
    Math.floor(image.naturalWidth / resolution.frameWidth),
  );
  const sourceColumn = resolution.sourceFrame % columns;
  const sourceRow = Math.floor(resolution.sourceFrame / columns);
  context.drawImage(
    image,
    sourceColumn * resolution.frameWidth,
    sourceRow * resolution.frameHeight,
    resolution.frameWidth,
    resolution.frameHeight,
    0,
    0,
    resolution.frameWidth,
    resolution.frameHeight,
  );
}

function recolorPresentationFrame(
  context: CanvasRenderingContext2D,
  resolution: ResolvedBuddyPresentationFrame,
  species: BuddySpecies,
  cosmetics?: Partial<BuddyCosmetics> | null,
) {
  const imageData = context.getImageData(
    0,
    0,
    resolution.frameWidth,
    resolution.frameHeight,
  );
  const recolored = applyPaletteSwap(
    imageData.data,
    createBuddyPaletteMap(species, cosmetics),
  );
  context.putImageData(
    new ImageData(
      recolored,
      resolution.frameWidth,
      resolution.frameHeight,
    ),
    0,
    0,
  );
}

function drawSafePlaceholder(
  context: CanvasRenderingContext2D,
  species: BuddySpecies,
  resolution: ResolvedBuddyPresentationFrame,
) {
  const { frameWidth: width, frameHeight: height } = resolution;
  const unit = Math.max(1, Math.floor(Math.min(width, height) / 16));
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#101b24';
  context.fillRect(
    Math.floor(width * 0.25),
    Math.floor(height * 0.25),
    Math.floor(width * 0.5),
    Math.floor(height * 0.65),
  );
  context.fillStyle = species.palette.skin;
  context.fillRect(
    Math.floor(width * 0.31),
    Math.floor(height * 0.31),
    Math.floor(width * 0.38),
    Math.floor(height * 0.5),
  );
  context.fillStyle = species.palette.accent;
  context.fillRect(
    Math.floor(width * 0.5) - unit,
    Math.floor(height * 0.47),
    unit * 2,
    unit * 2,
  );
}

export type RenderBuddyPresentationInput = Readonly<{
  context: CanvasRenderingContext2D;
  resolution: ResolvedBuddyPresentationFrame;
  species: BuddySpecies;
  cosmetics?: Partial<BuddyCosmetics> | null;
  animationCueId?: string;
  bossId?: string;
  bossTier?: BossPresentationTier;
  visibleLayers?: ReadonlySet<BuddySpriteLayer>;
  failedAssetKeys?: ReadonlySet<string>;
}>;

export async function renderResolvedBuddyPresentation({
  context,
  resolution,
  species,
  cosmetics,
  animationCueId,
  bossId,
  bossTier,
  visibleLayers,
  failedAssetKeys,
}: RenderBuddyPresentationInput): Promise<
  'authored' | 'hybrid' | 'procedural' | 'placeholder'
> {
  if (resolution.overworldFrame) {
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = 24;
    sourceCanvas.height = 24;
    const sourceContext = sourceCanvas.getContext('2d', {
      willReadFrequently: true,
    });
    if (!sourceContext) {
      drawSafePlaceholder(context, species, resolution);
      return 'placeholder';
    }
    await renderResolvedBuddySprite({
      context: sourceContext,
      resolution: resolution.overworldFrame,
      species,
      cosmetics,
      animationCueId,
      bossId,
      bossTier,
      visibleLayers,
    });
    context.clearRect(
      0,
      0,
      resolution.frameWidth,
      resolution.frameHeight,
    );
    context.imageSmoothingEnabled = false;
    context.drawImage(sourceCanvas, 0, 0);
    return resolution.source === 'procedural'
      ? 'procedural'
      : 'hybrid';
  }

  if (!resolution.assetUrl) {
    const procedural = renderBuddyPixelFrame(
      species,
      cosmetics,
      'front',
      'idle',
      0,
      animationCueId,
    );
    if (resolution.frameWidth === 24 && resolution.frameHeight === 24) {
      drawBuddyFrameToCanvas(context, procedural);
      return 'procedural';
    }
    drawSafePlaceholder(context, species, resolution);
    return 'placeholder';
  }

  try {
    const image = await loadBuddyPresentationImage(
      resolution.assetUrl,
    );
    const expectedArea =
      resolution.frameWidth *
      resolution.frameHeight *
      resolution.frameCount;
    if (image.naturalWidth * image.naturalHeight !== expectedArea) {
      throw new Error('Presentation sheet dimensions do not match.');
    }
    context.clearRect(
      0,
      0,
      resolution.frameWidth,
      resolution.frameHeight,
    );
    context.imageSmoothingEnabled = false;
    drawAuthoredPresentationFrame(context, image, resolution);
    recolorPresentationFrame(context, resolution, species, cosmetics);
    drawBuddyPresentationIdentityOverlays(
      context,
      species,
      cosmetics,
      resolution.frameWidth,
      resolution.frameHeight,
    );
    if (resolution.assetVersion === '3.0.0') {
      drawDomeShellPresentationOverlays(
        context,
        species,
        cosmetics,
        resolution.frameWidth,
        resolution.frameHeight,
        bossTier,
      );
    } else {
      drawArmoredHeavyPresentationOverlays(
        context,
        species,
        cosmetics,
        resolution.frameWidth,
        resolution.frameHeight,
        bossTier,
      );
    }
    return 'authored';
  } catch {
    const nextFailedAssetKeys = new Set(failedAssetKeys);
    if (resolution.assetKey) {
      nextFailedAssetKeys.add(resolution.assetKey);
    }
    const availableAssetKeys = new Set(
      ASSET_MANIFEST.assets
        .filter(
          (asset) =>
            asset.status !== 'placeholder' &&
            !nextFailedAssetKeys.has(asset.key),
        )
        .map((asset) => asset.key),
    );
    const fallback = resolveBuddyPresentationFrame({
      speciesId: resolution.speciesId,
      bossId: resolution.bossId,
      bossTier: resolution.bossTier,
      context: resolution.requestedContext,
      direction: resolution.requestedDirection,
      battlePose: resolution.requestedBattlePose,
      showcasePose: resolution.requestedShowcasePose,
      availableAssetKeys,
    });
    if (
      fallback.assetKey &&
      nextFailedAssetKeys.has(fallback.assetKey)
    ) {
      drawSafePlaceholder(context, species, resolution);
      return 'placeholder';
    }
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = fallback.frameWidth;
    fallbackCanvas.height = fallback.frameHeight;
    const fallbackContext = fallbackCanvas.getContext('2d', {
      willReadFrequently: true,
    });
    if (!fallbackContext) {
      drawSafePlaceholder(context, species, resolution);
      return 'placeholder';
    }
    const result = await renderResolvedBuddyPresentation({
      context: fallbackContext,
      resolution: fallback,
      species,
      cosmetics,
      animationCueId,
      bossId,
      bossTier,
      visibleLayers,
      failedAssetKeys: nextFailedAssetKeys,
    });
    context.clearRect(
      0,
      0,
      resolution.frameWidth,
      resolution.frameHeight,
    );
    context.imageSmoothingEnabled = false;
    context.drawImage(
      fallbackCanvas,
      Math.floor((resolution.frameWidth - fallback.frameWidth) / 2),
      resolution.frameHeight - fallback.frameHeight,
    );
    return result;
  }
}

export function getBuddyPresentationImageCacheStats() {
  return {
    entries: presentationImageCache.size,
    decodedBytes: totalDecodedBytes(),
    hits: presentationCacheHits,
    misses: presentationCacheMisses,
    evictions: presentationCacheEvictions,
    entryLimit: PRESENTATION_CACHE_ENTRY_LIMIT,
    byteLimit: PRESENTATION_CACHE_BYTE_LIMIT,
  };
}

export function resetBuddyPresentationImageCache() {
  presentationImageCache.forEach((entry) => {
    if (entry.image) entry.image.src = '';
  });
  presentationImageCache.clear();
  presentationCacheClock = 0;
  presentationCacheHits = 0;
  presentationCacheMisses = 0;
  presentationCacheEvictions = 0;
}
