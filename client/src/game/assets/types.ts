export const ASSET_CATEGORIES = [
  'trainer',
  'buddies',
  'environments',
  'gym-machines',
  'ui',
  'effects',
  'audio',
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];
export type AssetStatus = 'placeholder' | 'review' | 'final';
export type AssetMediaType = 'image' | 'audio';
export type SpriteAnchor = 'bottom-center' | 'center' | 'top-left';

export interface AssetPalette {
  id: string;
  colors: string[];
  slots?: Record<string, string>;
}

export interface ImageAssetStandard {
  id: string;
  mediaType: 'image';
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  frameCount: number;
  durationMs?: number;
  anchor: SpriteAnchor;
  directions?: string[];
}

export interface AudioAssetStandard {
  id: string;
  mediaType: 'audio';
  sampleRate: number;
  channels: number;
}

export type AssetStandard = ImageAssetStandard | AudioAssetStandard;

interface AssetManifestEntryBase {
  key: string;
  category: AssetCategory;
  path: string;
  standardId: string;
  status: AssetStatus;
  description: string;
}

export interface ImageAssetManifestEntry extends AssetManifestEntryBase {
  paletteId: string;
}

export interface AudioAssetManifestEntry extends AssetManifestEntryBase {
  durationMs: number;
}

export type AssetManifestEntry = ImageAssetManifestEntry | AudioAssetManifestEntry;

export interface AssetManifest {
  version: number;
  basePath: string;
  palettes: Record<string, AssetPalette>;
  standards: Record<string, AssetStandard>;
  assets: AssetManifestEntry[];
}

export interface AssetValidationIssue {
  code:
    | 'duplicate-key'
    | 'duplicate-path'
    | 'invalid-category'
    | 'invalid-key'
    | 'invalid-path'
    | 'missing-palette'
    | 'missing-standard'
    | 'media-mismatch'
    | 'invalid-standard';
  message: string;
}
