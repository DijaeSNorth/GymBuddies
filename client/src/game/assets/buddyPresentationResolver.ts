import type {
  BossPresentationTier,
  BuddyFacingDirection,
  BuddyPose,
} from '../types';
import { resolveAssetKeyUrl } from './assetUrl';
import {
  resolveBuddySpriteFrame,
  resolvePreferredSpriteAsset,
  type BuddySpriteRendererPreference,
  type ResolvedBuddySpriteFrame,
} from './buddySpriteResolver';
import {
  ASSET_MANIFEST,
  getAssetStandard,
  getBuddyPresentationProfile,
} from './manifest';
import type {
  AssetLoadGroup,
  AssetStatus,
  BuddyBattlePose,
  BuddyBossSpriteTier,
  BuddyMultiResolutionCharacterProfile,
  BuddyPresentationAssetProfile,
  BuddyPresentationContext,
  BuddyShowcasePose,
  ImageAssetStandard,
} from './types';

export type BuddyPresentationSource =
  | 'authored-context'
  | 'authored-lower-resolution'
  | 'hybrid'
  | 'procedural'
  | 'placeholder';

export type ResolvedBuddyPresentationFrame = Readonly<{
  characterId: string;
  speciesId: string;
  bossId?: string;
  bossTier?: BossPresentationTier;
  requestedDirection: BuddyFacingDirection;
  requestedBattlePose?: BuddyBattlePose;
  requestedShowcasePose?: BuddyShowcasePose;
  requestedContext: BuddyPresentationContext;
  selectedContext: BuddyPresentationContext;
  source: BuddyPresentationSource;
  frameWidth: number;
  frameHeight: number;
  sourceFrame: number;
  frameCount: number;
  durationMs: number;
  assetKey?: string;
  assetUrl?: string;
  assetStatus?: AssetStatus;
  assetVersion?: string;
  loadGroup: AssetLoadGroup;
  selectedPoseId: string;
  fallbackReason?: string;
  overworldFrame?: ResolvedBuddySpriteFrame;
}>;

export type ResolveBuddyPresentationFrameInput = Readonly<{
  speciesId: string;
  bossId?: string;
  context: BuddyPresentationContext;
  direction?: BuddyFacingDirection;
  pose?: BuddyPose;
  battlePose?: BuddyBattlePose;
  showcasePose?: BuddyShowcasePose;
  bossTier?: BossPresentationTier;
  animationFrame?: number;
  rendererPreference?: BuddySpriteRendererPreference;
  availableAssetKeys?: ReadonlySet<string>;
}>;

const PROFILE_KEY_BY_CONTEXT = {
  menu: 'menuSpriteProfile',
  battle: 'battleSpriteProfile',
  showcase: 'showcaseSpriteProfile',
  dialogue: 'dialoguePortraitProfile',
} as const;

const LOWER_CONTEXTS: Record<
  Exclude<BuddyPresentationContext, 'overworld'>,
  readonly Exclude<BuddyPresentationContext, 'overworld'>[]
> = {
  menu: ['menu'],
  battle: ['battle', 'menu'],
  showcase: ['showcase', 'battle', 'menu'],
  dialogue: ['dialogue', 'showcase', 'battle', 'menu'],
};

const BATTLE_TO_OVERWORLD_POSE: Record<BuddyBattlePose, BuddyPose> = {
  'neutral-battle': 'idle',
  'attack-preparation': 'capture',
  'shoulder-burst': 'training',
  'iron-grind': 'capture',
  'snapping-hook': 'side-pose',
  counter: 'side-pose',
  'stamina-loss': 'fatigue',
  'near-pin': 'fatigue',
  victory: 'victory',
  'capture-success': 'capture',
  escape: 'running',
  defeat: 'fatigue',
};

const SHOWCASE_TO_OVERWORLD_POSE: Record<BuddyShowcasePose, BuddyPose> = {
  'front-relaxed': 'idle',
  'back-relaxed': 'idle',
  'front-double-biceps': 'front-flex',
  'back-double-biceps': 'back-flex',
  'side-chest': 'side-pose',
  'side-triceps': 'side-pose',
  'most-muscular': 'front-flex',
  'abs-and-thigh': 'front-flex',
  'victory-pose': 'victory',
  'fatigue-pose': 'fatigue',
};

function characterIdFor(input: ResolveBuddyPresentationFrameInput) {
  return input.bossId ?? input.speciesId;
}

function presentationProfileFor(
  input: ResolveBuddyPresentationFrameInput,
): BuddyMultiResolutionCharacterProfile | undefined {
  return (
    getBuddyPresentationProfile(characterIdFor(input)) ??
    getBuddyPresentationProfile(input.speciesId)
  );
}

function assetProfileFor(
  profile: BuddyMultiResolutionCharacterProfile,
  context: Exclude<BuddyPresentationContext, 'overworld'>,
): BuddyPresentationAssetProfile | undefined {
  return profile[PROFILE_KEY_BY_CONTEXT[context]];
}

function poseIdFor(
  input: ResolveBuddyPresentationFrameInput,
  context: BuddyPresentationContext,
) {
  if (context === 'menu') return input.direction ?? 'front';
  if (context === 'battle') return input.battlePose ?? 'neutral-battle';
  if (context === 'showcase') {
    return input.showcasePose ?? 'front-relaxed';
  }
  if (context === 'dialogue') return 'portrait';
  return input.pose ?? 'idle';
}

function legacyDirection(input: ResolveBuddyPresentationFrameInput) {
  if (
    input.context === 'showcase' &&
    (input.showcasePose === 'back-relaxed' ||
      input.showcasePose === 'back-double-biceps')
  ) {
    return 'back';
  }
  if (
    input.context === 'showcase' &&
    (input.showcasePose === 'side-chest' ||
      input.showcasePose === 'side-triceps')
  ) {
    return 'left';
  }
  return input.direction ?? 'front';
}

function legacyPose(input: ResolveBuddyPresentationFrameInput): BuddyPose {
  if (input.context === 'battle') {
    return BATTLE_TO_OVERWORLD_POSE[
      input.battlePose ?? 'neutral-battle'
    ];
  }
  if (input.context === 'showcase') {
    return SHOWCASE_TO_OVERWORLD_POSE[
      input.showcasePose ?? 'front-relaxed'
    ];
  }
  return input.pose ?? 'idle';
}

function resolveAuthoredProfile(
  input: ResolveBuddyPresentationFrameInput,
  profile: BuddyPresentationAssetProfile,
  selectedContext: Exclude<BuddyPresentationContext, 'overworld'>,
): ResolvedBuddyPresentationFrame | undefined {
  const asset = resolvePreferredSpriteAsset(
    profile.assetCandidates,
    input.availableAssetKeys,
  );
  if (!asset) return undefined;
  const standard = getAssetStandard(asset);
  if (standard.mediaType !== 'image') return undefined;
  const imageStandard = standard as ImageAssetStandard;
  const selectedPoseId = poseIdFor(input, selectedContext);
  const frameIndex = profile.frameOrder.indexOf(selectedPoseId);
  const safeFrameIndex = frameIndex >= 0 ? frameIndex : 0;
  const tierOrder = profile.tierFrameOrder ?? [];
  const tierIndex =
    tierOrder.length > 0
      ? Math.max(
          0,
          tierOrder.indexOf(
            (input.bossTier ?? 'normal') as BuddyBossSpriteTier,
          ),
        )
      : 0;
  const sourceFrame = tierIndex * imageStandard.columns + safeFrameIndex;
  return {
    characterId: characterIdFor(input),
    speciesId: input.speciesId,
    bossId: input.bossId,
    bossTier: input.bossTier,
    requestedDirection: input.direction ?? 'front',
    requestedBattlePose: input.battlePose,
    requestedShowcasePose: input.showcasePose,
    requestedContext: input.context,
    selectedContext,
    source:
      selectedContext === input.context
        ? 'authored-context'
        : 'authored-lower-resolution',
    frameWidth: imageStandard.frameWidth,
    frameHeight: imageStandard.frameHeight,
    sourceFrame,
    frameCount: imageStandard.frameCount,
    durationMs: imageStandard.durationMs ?? 260,
    assetKey: asset.key,
    assetUrl: resolveAssetKeyUrl(asset.key),
    assetStatus: asset.status,
    assetVersion: asset.assetVersion,
    loadGroup: asset.loadGroup ?? 'core',
    selectedPoseId:
      profile.frameOrder[safeFrameIndex] ?? selectedPoseId,
    fallbackReason:
      frameIndex < 0 ? `missing-${selectedContext}-pose` : undefined,
  };
}

function resolveLegacyFrame(
  input: ResolveBuddyPresentationFrameInput,
): ResolvedBuddyPresentationFrame {
  const overworldFrame = resolveBuddySpriteFrame({
    speciesId: input.speciesId,
    direction: legacyDirection(input),
    pose: legacyPose(input),
    animationFrame: input.animationFrame,
    rendererPreference: input.rendererPreference,
    availableAssetKeys: input.availableAssetKeys,
  });
  return {
    characterId: characterIdFor(input),
    speciesId: input.speciesId,
    bossId: input.bossId,
    bossTier: input.bossTier,
    requestedDirection: input.direction ?? 'front',
    requestedBattlePose: input.battlePose,
    requestedShowcasePose: input.showcasePose,
    requestedContext: input.context,
    selectedContext: 'overworld',
    source:
      overworldFrame.baseSource === 'authored' ? 'hybrid' : 'procedural',
    frameWidth: ASSET_MANIFEST.buddySpritePipeline.frameWidth,
    frameHeight: ASSET_MANIFEST.buddySpritePipeline.frameHeight,
    sourceFrame: overworldFrame.sourceFrame,
    frameCount:
      ASSET_MANIFEST.standards['buddy-authored-strip']?.mediaType ===
      'image'
        ? ASSET_MANIFEST.standards['buddy-authored-strip'].frameCount
        : 24,
    durationMs: overworldFrame.durationMs,
    assetKey: overworldFrame.assetKey,
    assetUrl: overworldFrame.assetUrl,
    assetStatus: overworldFrame.assetStatus,
    assetVersion: overworldFrame.assetVersion,
    loadGroup: 'core',
    selectedPoseId: overworldFrame.authoredPose,
    fallbackReason:
      input.context === 'overworld'
        ? overworldFrame.fallbackReason
        : `missing-${input.context}-profile`,
    overworldFrame,
  };
}

export function resolveBuddyPresentationFrame(
  input: ResolveBuddyPresentationFrameInput,
): ResolvedBuddyPresentationFrame {
  if (input.context === 'overworld') return resolveLegacyFrame(input);
  const profile = presentationProfileFor(input);
  if (profile && input.rendererPreference !== 'procedural') {
    for (const context of LOWER_CONTEXTS[input.context]) {
      const assetProfile = assetProfileFor(profile, context);
      if (!assetProfile) continue;
      const resolved = resolveAuthoredProfile(input, assetProfile, context);
      if (resolved) return resolved;
    }
  }
  return resolveLegacyFrame(input);
}

export function resolveReactBuddyPresentationFrame(
  input: ResolveBuddyPresentationFrameInput,
) {
  return resolveBuddyPresentationFrame(input);
}

export function resolvePhaserBuddyPresentationFrame(
  input: ResolveBuddyPresentationFrameInput,
) {
  return resolveBuddyPresentationFrame(input);
}

export function getBuddyPresentationAssetKeys(
  context: Exclude<BuddyPresentationContext, 'overworld'>,
  characterIds: readonly string[],
) {
  const keys = new Set<string>();
  characterIds.forEach((characterId) => {
    const profile = getBuddyPresentationProfile(characterId);
    const assetProfile = profile
      ? assetProfileFor(profile, context)
      : undefined;
    assetProfile?.assetCandidates.forEach((assetKey) => keys.add(assetKey));
  });
  return [...keys];
}
