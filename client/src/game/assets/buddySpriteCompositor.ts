import {
  getBuddyPaletteHex,
} from '../content/buddyCharacters';
import {
  BUDDY_PIXEL_HEIGHT,
  BUDDY_PIXEL_WIDTH,
  drawBuddyFrameToCanvas,
  renderBuddyPixelFrame,
  type BuddyPixelLayer,
} from '../rendering/buddyPixelRenderer';
import { renderPilotBuddyPhysiqueOverlay } from '../rendering/pilotBuddyPhysiqueRenderer';
import { renderArmoredHeavyPixelOverlay } from '../rendering/armoredHeavyPixelRenderer';
import { renderDomeShellPixelOverlay } from '../rendering/domeShellPixelRenderer';
import { normalizeBuddyCosmetics } from '../systems/buddyCosmetics';
import type {
  BossPresentationTier,
  BuddyCosmetics,
  BuddySpecies,
} from '../types';
import { applyPaletteSwap } from './paletteSwap';
import {
  resolveBuddyBossOverlayFrame,
  type ResolvedBuddySpriteFrame,
} from './buddySpriteResolver';
import type { BuddySpriteLayer } from './types';

const BUDDY_IMAGE_CACHE_LIMIT = 32;
const BUDDY_BASE_MARKERS = {
  outline: '#061519',
  primary: '#68d39b',
  secondary: '#285057',
  detail: '#eef2d0',
  accent: '#f2c14e',
} as const;
const SHADOW_LAYER = new Set<BuddyPixelLayer>(['shadow']);
const AUTHORED_OVERLAY_LAYERS = new Set<BuddyPixelLayer>([
  'muscle',
  'marking',
  'appendage',
  'accessory',
  'face',
  'effect',
]);

function proceduralLayersFor(
  layers?: ReadonlySet<BuddySpriteLayer>,
): ReadonlySet<BuddyPixelLayer> | undefined {
  if (!layers) return undefined;
  const mapped = new Set<BuddyPixelLayer>();
  if (layers.has('shadow')) mapped.add('shadow');
  if (layers.has('base-body')) mapped.add('body');
  if (layers.has('physique-overlay')) mapped.add('muscle');
  if (layers.has('appendage-variant')) mapped.add('appendage');
  if (layers.has('marking')) mapped.add('marking');
  if (layers.has('equipment') || layers.has('accessory')) {
    mapped.add('accessory');
  }
  if (layers.has('expression')) mapped.add('face');
  if (
    layers.has('pump') ||
    layers.has('rare-trait') ||
    layers.has('boss-tier')
  ) {
    mapped.add('effect');
  }
  return mapped;
}

type ImageCacheEntry = {
  promise: Promise<HTMLImageElement>;
  lastUsed: number;
};

const imageCache = new Map<string, ImageCacheEntry>();
let imageCacheClock = 0;
let imageCacheHits = 0;
let imageCacheMisses = 0;

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbKey(value: string) {
  return hexToRgb(value).join(',');
}

function trimImageCache() {
  while (imageCache.size > BUDDY_IMAGE_CACHE_LIMIT) {
    let oldestKey: string | undefined;
    let oldestUse = Number.POSITIVE_INFINITY;
    imageCache.forEach((entry, key) => {
      if (entry.lastUsed < oldestUse) {
        oldestUse = entry.lastUsed;
        oldestKey = key;
      }
    });
    if (!oldestKey) break;
    imageCache.delete(oldestKey);
  }
}

export function loadBuddySpriteImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url);
  imageCacheClock += 1;
  if (cached) {
    imageCacheHits += 1;
    cached.lastUsed = imageCacheClock;
    return cached.promise;
  }
  imageCacheMisses += 1;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => {
      imageCache.delete(url);
      reject(new Error(`Could not load Buddy sprite asset "${url}".`));
    };
    image.src = url;
  });
  imageCache.set(url, { promise, lastUsed: imageCacheClock });
  trimImageCache();
  return promise;
}

export function createBuddyPaletteMap(
  species: BuddySpecies,
  value?: Partial<BuddyCosmetics> | null,
) {
  const cosmetics = normalizeBuddyCosmetics(species.id, value);
  return new Map<string, readonly [number, number, number]>([
    [rgbKey(BUDDY_BASE_MARKERS.outline), hexToRgb('#101b24')],
    [
      rgbKey(BUDDY_BASE_MARKERS.primary),
      hexToRgb(
        getBuddyPaletteHex(
          cosmetics.primaryPaletteId,
          species.palette.skin,
        ),
      ),
    ],
    [
      rgbKey(BUDDY_BASE_MARKERS.secondary),
      hexToRgb(
        getBuddyPaletteHex(
          cosmetics.secondaryPaletteId,
          species.palette.core,
        ),
      ),
    ],
    [
      rgbKey(BUDDY_BASE_MARKERS.detail),
      hexToRgb(species.palette.detail),
    ],
    [
      rgbKey(BUDDY_BASE_MARKERS.accent),
      hexToRgb(
        getBuddyPaletteHex(
          cosmetics.accentPaletteId,
          species.palette.accent,
        ),
      ),
    ],
  ]);
}

function drawFrameFromStrip(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  sourceFrame: number,
  mirrorX: boolean,
) {
  const sourceX = sourceFrame * BUDDY_PIXEL_WIDTH;
  context.save();
  context.imageSmoothingEnabled = false;
  if (mirrorX) {
    context.translate(BUDDY_PIXEL_WIDTH, 0);
    context.scale(-1, 1);
  }
  context.drawImage(
    image,
    sourceX,
    0,
    BUDDY_PIXEL_WIDTH,
    BUDDY_PIXEL_HEIGHT,
    0,
    0,
    BUDDY_PIXEL_WIDTH,
    BUDDY_PIXEL_HEIGHT,
  );
  context.restore();
}

function recolorCanvas(
  context: CanvasRenderingContext2D,
  species: BuddySpecies,
  cosmetics?: Partial<BuddyCosmetics> | null,
) {
  const source = context.getImageData(
    0,
    0,
    BUDDY_PIXEL_WIDTH,
    BUDDY_PIXEL_HEIGHT,
  );
  const recolored = applyPaletteSwap(
    source.data,
    createBuddyPaletteMap(species, cosmetics),
  );
  context.putImageData(
    new ImageData(recolored, BUDDY_PIXEL_WIDTH, BUDDY_PIXEL_HEIGHT),
    0,
    0,
  );
}

export type RenderBuddySpriteInput = Readonly<{
  context: CanvasRenderingContext2D;
  resolution: ResolvedBuddySpriteFrame;
  species: BuddySpecies;
  cosmetics?: Partial<BuddyCosmetics> | null;
  animationCueId?: string;
  bossId?: string;
  bossTier?: BossPresentationTier;
  visibleLayers?: ReadonlySet<BuddySpriteLayer>;
}>;

export async function renderResolvedBuddySprite({
  context,
  resolution,
  species,
  cosmetics,
  animationCueId,
  bossId,
  bossTier,
  visibleLayers,
}: RenderBuddySpriteInput): Promise<'authored' | 'procedural-fallback'> {
  const proceduralFrame = renderBuddyPixelFrame(
    species,
    cosmetics,
    resolution.requestedDirection,
    resolution.pose,
    resolution.animationFrame,
    animationCueId,
  );
  if (resolution.baseSource !== 'authored' || !resolution.assetUrl) {
    drawBuddyFrameToCanvas(context, proceduralFrame, {
      layers: proceduralLayersFor(visibleLayers),
    });
    return 'procedural-fallback';
  }

  try {
    const image = await loadBuddySpriteImage(resolution.assetUrl);
    const requiredWidth =
      BUDDY_PIXEL_WIDTH *
      ASSET_FRAME_COUNT;
    if (
      image.naturalWidth !== requiredWidth ||
      image.naturalHeight !== BUDDY_PIXEL_HEIGHT
    ) {
      throw new Error('Buddy strip dimensions do not match the authored standard.');
    }
    context.clearRect(0, 0, BUDDY_PIXEL_WIDTH, BUDDY_PIXEL_HEIGHT);
    if (!visibleLayers || visibleLayers.has('shadow')) {
      drawBuddyFrameToCanvas(context, proceduralFrame, {
        clear: false,
        layers: SHADOW_LAYER,
      });
    }
    if (!visibleLayers || visibleLayers.has('base-body')) {
      drawFrameFromStrip(
        context,
        image,
        resolution.sourceFrame,
        resolution.mirrorX,
      );
      recolorCanvas(context, species, cosmetics);
    }
    const requestedOverlayLayers = proceduralLayersFor(visibleLayers);
    const enabledOverlayLayers = requestedOverlayLayers
      ? new Set(
          [...requestedOverlayLayers].filter((layer) =>
            AUTHORED_OVERLAY_LAYERS.has(layer),
          ),
        )
      : new Set(AUTHORED_OVERLAY_LAYERS);
    const pilotPhysiqueFrame =
      resolution.assetVersion === '2.0.0'
        ? renderPilotBuddyPhysiqueOverlay(
            species,
            cosmetics,
            resolution.requestedDirection,
            resolution.pose,
            resolution.animationFrame,
          )
        : undefined;
    const armoredHeavyFrame = renderArmoredHeavyPixelOverlay(
      species,
      cosmetics,
      resolution.requestedDirection,
      resolution.pose,
    );
    const domeShellFrame =
      resolution.assetVersion === '3.0.0'
        ? renderDomeShellPixelOverlay(
            species,
            cosmetics,
            resolution.requestedDirection,
            resolution.pose,
          )
        : undefined;
    const specializedPhysiqueFrame =
      domeShellFrame ?? pilotPhysiqueFrame ?? armoredHeavyFrame;
    if (specializedPhysiqueFrame) {
      enabledOverlayLayers.delete('muscle');
      if (!visibleLayers || visibleLayers.has('physique-overlay')) {
        drawBuddyFrameToCanvas(context, specializedPhysiqueFrame, {
          clear: false,
        });
      }
    }
    drawBuddyFrameToCanvas(context, proceduralFrame, {
      clear: false,
      layers: enabledOverlayLayers,
    });

    if (
      bossId &&
      bossTier &&
      (!visibleLayers || visibleLayers.has('boss-tier'))
    ) {
      const overlay = resolveBuddyBossOverlayFrame(bossId, bossTier);
      if (overlay) {
        const overlayImage = await loadBuddySpriteImage(overlay.assetUrl);
        if (
          overlayImage.naturalWidth === BUDDY_PIXEL_WIDTH * 5 &&
          overlayImage.naturalHeight === BUDDY_PIXEL_HEIGHT
        ) {
          drawFrameFromStrip(
            context,
            overlayImage,
            overlay.sourceFrame,
            false,
          );
          recolorCanvas(context, species, cosmetics);
        }
      }
    }
    return 'authored';
  } catch {
    drawBuddyFrameToCanvas(context, proceduralFrame, {
      layers: proceduralLayersFor(visibleLayers),
    });
    return 'procedural-fallback';
  }
}

const ASSET_FRAME_COUNT = 24;

export function getBuddySpriteImageCacheStats() {
  return {
    entries: imageCache.size,
    hits: imageCacheHits,
    misses: imageCacheMisses,
    limit: BUDDY_IMAGE_CACHE_LIMIT,
  };
}

export function resetBuddySpriteImageCache() {
  imageCache.clear();
  imageCacheClock = 0;
  imageCacheHits = 0;
  imageCacheMisses = 0;
}
