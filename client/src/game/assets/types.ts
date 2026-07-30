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
export type AssetStatus =
  | 'placeholder'
  | 'review'
  | 'revision-required'
  | 'approved'
  | 'final';
export type AssetMediaType = 'image' | 'audio';
export type SpriteAnchor = 'bottom-center' | 'center' | 'top-left';
export type AssetLoadGroup =
  | 'core'
  | 'battle'
  | 'showcase'
  | 'portrait';

export const BUDDY_PRESENTATION_CONTEXTS = [
  'overworld',
  'menu',
  'battle',
  'showcase',
  'dialogue',
] as const;
export type BuddyPresentationContext =
  (typeof BUDDY_PRESENTATION_CONTEXTS)[number];

export const BUDDY_BATTLE_POSES = [
  'neutral-battle',
  'attack-preparation',
  'shoulder-burst',
  'iron-grind',
  'snapping-hook',
  'counter',
  'stamina-loss',
  'near-pin',
  'victory',
  'capture-success',
  'escape',
  'defeat',
] as const;
export type BuddyBattlePose = (typeof BUDDY_BATTLE_POSES)[number];

export const BUDDY_SHOWCASE_POSES = [
  'front-relaxed',
  'back-relaxed',
  'front-double-biceps',
  'back-double-biceps',
  'side-chest',
  'side-triceps',
  'most-muscular',
  'abs-and-thigh',
  'victory-pose',
  'fatigue-pose',
] as const;
export type BuddyShowcasePose = (typeof BUDDY_SHOWCASE_POSES)[number];

export const BUDDY_SPRITE_DIRECTIONS = [
  'front',
  'back',
  'left',
  'right',
] as const;
export type BuddySpriteDirection = (typeof BUDDY_SPRITE_DIRECTIONS)[number];

export const BUDDY_SPRITE_POSES = [
  'idle',
  'walking',
  'running',
  'training',
  'fatigue',
  'capture',
  'victory',
  'front-flex',
  'back-flex',
  'side-pose',
  'boss-entrance',
  'rare-entrance',
] as const;
export type BuddySpritePose = (typeof BUDDY_SPRITE_POSES)[number];

export const BUDDY_SPRITE_LAYERS = [
  'shadow',
  'base-body',
  'physique-overlay',
  'appendage-variant',
  'marking',
  'equipment',
  'accessory',
  'expression',
  'pump',
  'rare-trait',
  'boss-tier',
] as const;
export type BuddySpriteLayer = (typeof BUDDY_SPRITE_LAYERS)[number];

export const BUDDY_ANATOMY_FAMILY_IDS = [
  'broad-mammal',
  'lean-quadruped',
  'armored-shelled',
  'compact-powerhouse',
  'winged-mythic',
  'serpentine',
  'multi-limbed',
  'avian',
  'heavy-biped',
] as const;
export type BuddyAnatomyFamilyId =
  (typeof BUDDY_ANATOMY_FAMILY_IDS)[number];

export type BuddyRendererMode =
  | 'procedural'
  | 'hybrid'
  | 'handcrafted';

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
  loadGroup?: AssetLoadGroup;
  assetVersion?: string;
  approval?: {
    approvalDate: string;
    artistSource: string;
    reviewerNote: string;
  };
  description: string;
}

export interface ImageAssetManifestEntry extends AssetManifestEntryBase {
  paletteId: string;
}

export interface AudioAssetManifestEntry extends AssetManifestEntryBase {
  durationMs: number;
}

export type AssetManifestEntry = ImageAssetManifestEntry | AudioAssetManifestEntry;

export interface BuddyPoseFrameDefinition {
  startFrame: number;
  frameCount: number;
  durationMs: number;
}

export interface BuddySpriteLayerBinding {
  assetKey?: string;
  rendererId?: string;
  optional?: boolean;
}

export interface BuddySpriteRenderProfile {
  speciesId: string;
  rendererMode: BuddyRendererMode;
  anatomyFamilyId: BuddyAnatomyFamilyId;
  baseStrips: Partial<Record<BuddySpriteDirection, string>>;
  baseStripCandidates?: Partial<
    Record<BuddySpriteDirection, string[]>
  >;
  layerBindings: Partial<Record<BuddySpriteLayer, BuddySpriteLayerBinding[]>>;
  mirrorRightFromLeft: boolean;
  asymmetricFeatureIds: string[];
  fallbackRenderer: 'procedural';
}

export type BuddyBossSpriteTier =
  | 'normal'
  | 'pumped'
  | 'overload'
  | 'final-round'
  | 'defeated';

export interface BuddyBossSpriteOverlay {
  bossId: string;
  speciesId: string;
  assetKey: string;
  assetCandidates?: string[];
  tierFrameOrder: BuddyBossSpriteTier[];
}

export interface BuddyPresentationAssetProfile {
  profileId: string;
  standardId: string;
  assetCandidates: string[];
  frameOrder: string[];
  tierFrameOrder?: BuddyBossSpriteTier[];
}

export interface BuddyOverworldProfileReference {
  profileId: string;
  speciesId: string;
}

export interface BuddyMultiResolutionCharacterProfile {
  characterId: string;
  speciesId: string;
  bossId?: string;
  overworldSpriteProfile: BuddyOverworldProfileReference;
  menuSpriteProfile?: BuddyPresentationAssetProfile;
  battleSpriteProfile?: BuddyPresentationAssetProfile;
  showcaseSpriteProfile?: BuddyPresentationAssetProfile;
  dialoguePortraitProfile?: BuddyPresentationAssetProfile;
}

export interface BuddySpritePipelineManifest {
  version: number;
  frameWidth: number;
  frameHeight: number;
  anchor: 'bottom-center';
  markerPaletteId: string;
  poseLayout: Record<BuddySpritePose, BuddyPoseFrameDefinition>;
  layerOrder: BuddySpriteLayer[];
  profiles: BuddySpriteRenderProfile[];
  bossOverlays: BuddyBossSpriteOverlay[];
  presentationProfiles?: BuddyMultiResolutionCharacterProfile[];
}

export interface AssetManifest {
  version: number;
  basePath: string;
  palettes: Record<string, AssetPalette>;
  standards: Record<string, AssetStandard>;
  assets: AssetManifestEntry[];
  buddySpritePipeline: BuddySpritePipelineManifest;
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
    | 'invalid-standard'
    | 'duplicate-sprite-profile'
    | 'invalid-sprite-profile'
    | 'missing-sprite-asset'
    | 'sprite-standard-mismatch'
    | 'unsafe-sprite-mirror'
    | 'invalid-pose-layout'
    | 'invalid-layer-order'
    | 'duplicate-boss-overlay'
    | 'invalid-boss-overlay'
    | 'duplicate-presentation-profile'
    | 'invalid-presentation-profile'
    | 'presentation-standard-mismatch'
    | 'invalid-asset-approval'
    | 'duplicate-asset-candidate';
  message: string;
}
