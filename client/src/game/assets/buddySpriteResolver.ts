import type {
  BossPresentationTier,
  BuddyFacingDirection,
  BuddyPose,
} from '../types';
import { resolveAssetKeyUrl } from './assetUrl';
import { getBuddyAnatomyFamily } from './anatomyFamilies';
import {
  ASSET_BY_KEY,
  ASSET_MANIFEST,
  getBuddyBossOverlay,
  getBuddySpriteProfile,
} from './manifest';
import type {
  AssetManifestEntry,
  AssetStatus,
  BuddyAnatomyFamilyId,
  BuddyRendererMode,
  BuddySpritePose,
} from './types';

export type BuddySpriteRendererPreference =
  | 'auto'
  | 'procedural'
  | 'authored';

export type ResolvedBuddySpriteFrame = Readonly<{
  speciesId: string;
  requestedDirection: BuddyFacingDirection;
  sourceDirection: BuddyFacingDirection;
  pose: BuddyPose;
  authoredPose: BuddySpritePose;
  animationFrame: number;
  sourceFrame: number;
  durationMs: number;
  rendererMode: BuddyRendererMode;
  baseSource: 'procedural' | 'authored';
  assetKey?: string;
  assetUrl?: string;
  assetStatus?: AssetStatus;
  assetVersion?: string;
  mirrorX: boolean;
  anatomyFamilyId: BuddyAnatomyFamilyId;
  anchor: Readonly<{ x: number; y: number }>;
  groundLineY: number;
  fallbackReason?: string;
}>;

const ASSET_STATUS_PRIORITY: Record<AssetStatus, number> = {
  final: 4,
  approved: 3,
  review: 2,
  'revision-required': 1,
  placeholder: 0,
};

export function resolvePreferredSpriteAsset(
  assetKeys: readonly string[],
  availableAssetKeys?: ReadonlySet<string>,
): AssetManifestEntry | undefined {
  const candidates = assetKeys
    .map((assetKey) => ASSET_BY_KEY.get(assetKey))
    .filter((asset): asset is AssetManifestEntry => Boolean(asset))
    .filter((asset) => asset.status !== 'placeholder')
    .filter(
      (asset) =>
        !availableAssetKeys || availableAssetKeys.has(asset.key),
    );
  return candidates.reduce<AssetManifestEntry | undefined>(
    (preferred, candidate) =>
      !preferred ||
      ASSET_STATUS_PRIORITY[candidate.status] >
        ASSET_STATUS_PRIORITY[preferred.status]
        ? candidate
        : preferred,
    undefined,
  );
}

function directionCandidates(
  speciesId: string,
  direction: BuddyFacingDirection,
) {
  const profile = getBuddySpriteProfile(speciesId);
  if (!profile) return [];
  const candidates = profile.baseStripCandidates?.[direction];
  if (candidates && candidates.length > 0) return candidates;
  const legacy = profile.baseStrips[direction];
  return legacy ? [legacy] : [];
}

export type ResolveBuddySpriteFrameInput = Readonly<{
  speciesId: string;
  direction: BuddyFacingDirection;
  pose: BuddyPose;
  animationFrame?: number;
  rendererPreference?: BuddySpriteRendererPreference;
  availableAssetKeys?: ReadonlySet<string>;
}>;

const PROCEDURAL_FAMILY_BY_LEGACY_RENDER_FAMILY: Record<
  string,
  BuddyAnatomyFamilyId
> = {
  quadruped: 'broad-mammal',
  shell: 'armored-shelled',
  primate: 'heavy-biped',
  runner: 'lean-quadruped',
  winged: 'winged-mythic',
  serpentine: 'serpentine',
  armored: 'armored-shelled',
  'many-limbed': 'multi-limbed',
};

function authoredPoseFor(pose: BuddyPose): BuddySpritePose {
  return pose === 'entrance' ? 'rare-entrance' : pose;
}

function proceduralResult(
  input: ResolveBuddySpriteFrameInput,
  anatomyFamilyId: BuddyAnatomyFamilyId,
  fallbackReason?: string,
): ResolvedBuddySpriteFrame {
  const anatomy = getBuddyAnatomyFamily(anatomyFamilyId);
  const authoredPose = authoredPoseFor(input.pose);
  const layout =
    ASSET_MANIFEST.buddySpritePipeline.poseLayout[authoredPose];
  const animationFrame =
    Math.max(0, Math.floor(input.animationFrame ?? 0)) % layout.frameCount;
  return {
    speciesId: input.speciesId,
    requestedDirection: input.direction,
    sourceDirection: input.direction,
    pose: input.pose,
    authoredPose,
    animationFrame,
    sourceFrame: layout.startFrame + animationFrame,
    durationMs: layout.durationMs,
    rendererMode: 'procedural',
    baseSource: 'procedural',
    mirrorX: false,
    anatomyFamilyId,
    anchor: anatomy.pivot,
    groundLineY: anatomy.groundLineY,
    fallbackReason,
  };
}

export function anatomyFamilyForLegacyRenderFamily(
  renderFamily: string,
): BuddyAnatomyFamilyId {
  return (
    PROCEDURAL_FAMILY_BY_LEGACY_RENDER_FAMILY[renderFamily] ??
    'compact-powerhouse'
  );
}

export function resolveBuddySpriteFrame(
  input: ResolveBuddySpriteFrameInput,
): ResolvedBuddySpriteFrame {
  const profile = getBuddySpriteProfile(input.speciesId);
  const anatomyFamilyId =
    profile?.anatomyFamilyId ?? 'compact-powerhouse';
  if (!profile) {
    return proceduralResult(input, anatomyFamilyId, 'missing-profile');
  }
  if (
    profile.rendererMode === 'procedural' ||
    input.rendererPreference === 'procedural'
  ) {
    return proceduralResult(input, anatomyFamilyId);
  }

  const requestedDirection = input.direction;
  const directCandidates = directionCandidates(
    input.speciesId,
    requestedDirection,
  );
  const canMirror =
    requestedDirection === 'right' &&
    profile.mirrorRightFromLeft &&
    profile.asymmetricFeatureIds.length === 0;
  const mirroredCandidates = canMirror
    ? directionCandidates(input.speciesId, 'left')
    : [];
  const asset = resolvePreferredSpriteAsset(
    directCandidates.length > 0
      ? directCandidates
      : mirroredCandidates,
    input.availableAssetKeys,
  );
  if (!asset) {
    return proceduralResult(
      input,
      anatomyFamilyId,
      'missing-direction-strip',
    );
  }

  const authoredPose = authoredPoseFor(input.pose);
  const layout =
    ASSET_MANIFEST.buddySpritePipeline.poseLayout[authoredPose];
  const animationFrame =
    Math.max(0, Math.floor(input.animationFrame ?? 0)) % layout.frameCount;
  const anatomy = getBuddyAnatomyFamily(anatomyFamilyId);
  return {
    speciesId: input.speciesId,
    requestedDirection,
    sourceDirection:
      directCandidates.length > 0 ? requestedDirection : 'left',
    pose: input.pose,
    authoredPose,
    animationFrame,
    sourceFrame: layout.startFrame + animationFrame,
    durationMs: layout.durationMs,
    rendererMode: profile.rendererMode,
    baseSource: 'authored',
    assetKey: asset.key,
    assetUrl: resolveAssetKeyUrl(asset.key),
    assetStatus: asset.status,
    assetVersion: asset.assetVersion,
    mirrorX: directCandidates.length === 0 && canMirror,
    anatomyFamilyId,
    anchor: anatomy.pivot,
    groundLineY: anatomy.groundLineY,
  };
}

export function resolveReactBuddySpriteFrame(
  input: ResolveBuddySpriteFrameInput,
) {
  return resolveBuddySpriteFrame(input);
}

export function resolvePhaserBuddySpriteFrame(
  input: ResolveBuddySpriteFrameInput,
) {
  return resolveBuddySpriteFrame(input);
}

export function resolveBuddyBossOverlayFrame(
  bossId: string,
  tier: BossPresentationTier,
) {
  const overlay = getBuddyBossOverlay(bossId);
  if (!overlay) return undefined;
  const asset = resolvePreferredSpriteAsset(
    overlay.assetCandidates?.length
      ? overlay.assetCandidates
      : [overlay.assetKey],
  );
  if (!asset) return undefined;
  const sourceFrame = overlay.tierFrameOrder.indexOf(tier);
  if (sourceFrame < 0) return undefined;
  return {
    assetKey: asset.key,
    assetUrl: resolveAssetKeyUrl(asset.key),
    assetStatus: asset.status,
    assetVersion: asset.assetVersion,
    sourceFrame,
    speciesId: overlay.speciesId,
  } as const;
}
