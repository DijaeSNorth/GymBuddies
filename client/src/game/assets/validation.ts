import {
  ASSET_CATEGORIES,
  BUDDY_ANATOMY_FAMILY_IDS,
  BUDDY_BATTLE_POSES,
  BUDDY_SHOWCASE_POSES,
  BUDDY_SPRITE_DIRECTIONS,
  BUDDY_SPRITE_LAYERS,
  BUDDY_SPRITE_POSES,
  type AssetManifest,
  type AssetValidationIssue,
} from './types';

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
      (asset.status === 'approved' || asset.status === 'final') &&
      (!asset.assetVersion ||
        !asset.approval ||
        !/^\d{4}-\d{2}-\d{2}$/.test(asset.approval.approvalDate) ||
        asset.approval.artistSource.trim().length === 0 ||
        asset.approval.reviewerNote.trim().length === 0)
    ) {
      issues.push({
        code: 'invalid-asset-approval',
        message: `Asset "${asset.key}" is ${asset.status} without complete version and approval metadata.`,
      });
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

  const pipeline = manifest.buddySpritePipeline;
  if (
    pipeline.frameWidth <= 0 ||
    pipeline.frameHeight <= 0 ||
    pipeline.anchor !== 'bottom-center'
  ) {
    issues.push({
      code: 'invalid-sprite-profile',
      message: 'Buddy sprite pipeline frame geometry or anchor is invalid.',
    });
  }
  if (!manifest.palettes[pipeline.markerPaletteId]) {
    issues.push({
      code: 'missing-palette',
      message: `Buddy sprite pipeline references missing marker palette "${pipeline.markerPaletteId}".`,
    });
  }
  if (
    pipeline.layerOrder.length !== BUDDY_SPRITE_LAYERS.length ||
    new Set(pipeline.layerOrder).size !== BUDDY_SPRITE_LAYERS.length ||
    BUDDY_SPRITE_LAYERS.some(
      (layer, index) => pipeline.layerOrder[index] !== layer,
    )
  ) {
    issues.push({
      code: 'invalid-layer-order',
      message: 'Buddy sprite pipeline layer order is missing, duplicated, or out of contract order.',
    });
  }

  const authoredStandard = manifest.standards['buddy-authored-strip'];
  BUDDY_SPRITE_POSES.forEach((pose) => {
    const definition = pipeline.poseLayout[pose];
    if (
      !definition ||
      definition.startFrame < 0 ||
      definition.frameCount <= 0 ||
      definition.durationMs <= 0 ||
      (authoredStandard?.mediaType === 'image' &&
        definition.startFrame + definition.frameCount >
          authoredStandard.frameCount)
    ) {
      issues.push({
        code: 'invalid-pose-layout',
        message: `Buddy pose "${pose}" has invalid frame bounds or timing.`,
      });
    }
  });

  const profileSpeciesIds = new Set<string>();
  const anatomyFamilyIds = new Set<string>(BUDDY_ANATOMY_FAMILY_IDS);
  pipeline.profiles.forEach((profile) => {
    if (profileSpeciesIds.has(profile.speciesId)) {
      issues.push({
        code: 'duplicate-sprite-profile',
        message: `Duplicate Buddy sprite profile for "${profile.speciesId}".`,
      });
    }
    profileSpeciesIds.add(profile.speciesId);
    if (
      !STABLE_KEY_PATTERN.test(profile.speciesId) ||
      !anatomyFamilyIds.has(profile.anatomyFamilyId) ||
      profile.fallbackRenderer !== 'procedural'
    ) {
      issues.push({
        code: 'invalid-sprite-profile',
        message: `Buddy sprite profile "${profile.speciesId}" has an invalid id, anatomy family, or fallback.`,
      });
    }

    const candidateKeysForDirection = (direction: string) => {
      const candidates =
        profile.baseStripCandidates?.[
          direction as keyof typeof profile.baseStripCandidates
        ];
      if (candidates && candidates.length > 0) return candidates;
      const legacy =
        profile.baseStrips[
          direction as keyof typeof profile.baseStrips
        ];
      return legacy ? [legacy] : [];
    };
    const authoredDirections = BUDDY_SPRITE_DIRECTIONS.filter(
      (direction) => candidateKeysForDirection(direction).length > 0,
    );
    if (
      profile.rendererMode === 'procedural' &&
      authoredDirections.length > 0
    ) {
      issues.push({
        code: 'invalid-sprite-profile',
        message: `Procedural profile "${profile.speciesId}" must not bind an authored base strip.`,
      });
    }
    if (
      profile.rendererMode !== 'procedural' &&
      !BUDDY_SPRITE_DIRECTIONS.every(
        (direction) =>
          candidateKeysForDirection(direction).length > 0 ||
          (direction === 'right' &&
            profile.mirrorRightFromLeft &&
            candidateKeysForDirection('left').length > 0),
      )
    ) {
      issues.push({
        code: 'invalid-sprite-profile',
        message: `Authored profile "${profile.speciesId}" does not cover all four directions.`,
      });
    }
    if (
      profile.mirrorRightFromLeft &&
      profile.asymmetricFeatureIds.length > 0
    ) {
      issues.push({
        code: 'unsafe-sprite-mirror',
        message: `Profile "${profile.speciesId}" mirrors an asymmetric design.`,
      });
    }

    Object.keys(profile.baseStripCandidates ?? {}).forEach((direction) => {
      if (!BUDDY_SPRITE_DIRECTIONS.includes(direction as never)) {
        issues.push({
          code: 'invalid-sprite-profile',
          message: `Profile "${profile.speciesId}" declares unknown candidate direction "${direction}".`,
        });
      }
    });

    BUDDY_SPRITE_DIRECTIONS.forEach((direction) => {
      const directionKeys = candidateKeysForDirection(direction);
      if (new Set(directionKeys).size !== directionKeys.length) {
        issues.push({
          code: 'duplicate-asset-candidate',
          message: `Profile "${profile.speciesId}" repeats a candidate for "${direction}".`,
        });
      }
      directionKeys.forEach((assetKey) => {
        if (!BUDDY_SPRITE_DIRECTIONS.includes(direction as never)) {
          issues.push({
            code: 'invalid-sprite-profile',
            message: `Profile "${profile.speciesId}" declares unknown direction "${direction}".`,
          });
          return;
        }
        const asset = manifest.assets.find((entry) => entry.key === assetKey);
        if (!asset) {
          issues.push({
            code: 'missing-sprite-asset',
            message: `Profile "${profile.speciesId}" references missing strip "${assetKey}".`,
          });
        } else if (
          asset.standardId !== 'buddy-authored-strip' ||
          manifest.standards[asset.standardId]?.mediaType !== 'image'
        ) {
          issues.push({
            code: 'sprite-standard-mismatch',
            message: `Profile "${profile.speciesId}" base "${assetKey}" does not use buddy-authored-strip.`,
          });
        }
      });
    });

    Object.values(profile.layerBindings).flat().forEach((binding) => {
      if (
        (!binding.assetKey && !binding.rendererId) ||
        (binding.rendererId &&
          !STABLE_KEY_PATTERN.test(binding.rendererId))
      ) {
        issues.push({
          code: 'invalid-sprite-profile',
          message: `Profile "${profile.speciesId}" has an invalid modular layer binding.`,
        });
      }
      if (
        binding.assetKey &&
        !manifest.assets.some((entry) => entry.key === binding.assetKey)
      ) {
        issues.push({
          code: 'missing-sprite-asset',
          message: `Profile "${profile.speciesId}" references missing layer "${binding.assetKey}".`,
        });
      }
    });
  });

  const presentationCharacterIds = new Set<string>();
  const presentationProfileIds = new Set<string>();
  const expectedFrameOrders = {
    menuSpriteProfile: BUDDY_SPRITE_DIRECTIONS,
    battleSpriteProfile: BUDDY_BATTLE_POSES,
    showcaseSpriteProfile: BUDDY_SHOWCASE_POSES,
    dialoguePortraitProfile: ['portrait'],
  } as const;
  const expectedLoadGroups = {
    menuSpriteProfile: 'core',
    battleSpriteProfile: 'battle',
    showcaseSpriteProfile: 'showcase',
    dialoguePortraitProfile: 'portrait',
  } as const;

  (pipeline.presentationProfiles ?? []).forEach((profile) => {
    if (presentationCharacterIds.has(profile.characterId)) {
      issues.push({
        code: 'duplicate-presentation-profile',
        message: `Duplicate Buddy presentation profile for "${profile.characterId}".`,
      });
    }
    presentationCharacterIds.add(profile.characterId);
    if (
      !STABLE_KEY_PATTERN.test(profile.characterId) ||
      !profileSpeciesIds.has(profile.speciesId) ||
      profile.overworldSpriteProfile.speciesId !== profile.speciesId ||
      !STABLE_KEY_PATTERN.test(profile.overworldSpriteProfile.profileId)
    ) {
      issues.push({
        code: 'invalid-presentation-profile',
        message: `Presentation profile "${profile.characterId}" has an invalid character, species, or overworld reference.`,
      });
    }

    (
      Object.keys(expectedFrameOrders) as Array<
        keyof typeof expectedFrameOrders
      >
    ).forEach((field) => {
      const assetProfile = profile[field];
      if (!assetProfile) return;
      if (
        !STABLE_KEY_PATTERN.test(assetProfile.profileId) ||
        presentationProfileIds.has(assetProfile.profileId) ||
        assetProfile.assetCandidates.length === 0 ||
        new Set(assetProfile.assetCandidates).size !==
          assetProfile.assetCandidates.length
      ) {
        issues.push({
          code: 'invalid-presentation-profile',
          message: `Presentation asset profile "${assetProfile.profileId}" has an invalid or duplicate id/candidate list.`,
        });
      }
      presentationProfileIds.add(assetProfile.profileId);
      const standard = manifest.standards[assetProfile.standardId];
      const expectedOrder = expectedFrameOrders[field];
      const frameOrderMatches =
        assetProfile.frameOrder.length === expectedOrder.length &&
        assetProfile.frameOrder.every(
          (frameId, index) => frameId === expectedOrder[index],
        );
      const tierRows = assetProfile.tierFrameOrder?.length ?? 1;
      if (
        !standard ||
        standard.mediaType !== 'image' ||
        standard.columns !== expectedOrder.length ||
        standard.rows !== tierRows ||
        standard.frameCount !== standard.columns * standard.rows ||
        !frameOrderMatches
      ) {
        issues.push({
          code: 'presentation-standard-mismatch',
          message: `Presentation asset profile "${assetProfile.profileId}" does not match its frame-order or image standard.`,
        });
      }
      assetProfile.assetCandidates.forEach((assetKey) => {
        const asset = manifest.assets.find(
          (entry) => entry.key === assetKey,
        );
        if (
          !asset ||
          asset.standardId !== assetProfile.standardId ||
          asset.loadGroup !== expectedLoadGroups[field]
        ) {
          issues.push({
            code: 'presentation-standard-mismatch',
            message: `Presentation asset "${assetKey}" does not match profile "${assetProfile.profileId}" or its load group.`,
          });
        }
      });
    });
  });

  const bossIds = new Set<string>();
  pipeline.bossOverlays.forEach((overlay) => {
    if (bossIds.has(overlay.bossId)) {
      issues.push({
        code: 'duplicate-boss-overlay',
        message: `Duplicate boss sprite overlay for "${overlay.bossId}".`,
      });
    }
    bossIds.add(overlay.bossId);
    const candidateKeys =
      overlay.assetCandidates?.length
        ? overlay.assetCandidates
        : [overlay.assetKey];
    if (new Set(candidateKeys).size !== candidateKeys.length) {
      issues.push({
        code: 'duplicate-asset-candidate',
        message: `Boss overlay "${overlay.bossId}" repeats an asset candidate.`,
      });
    }
    const assets = candidateKeys
      .map((assetKey) =>
        manifest.assets.find((entry) => entry.key === assetKey),
      )
      .filter(Boolean);
    if (
      !profileSpeciesIds.has(overlay.speciesId) ||
      assets.length !== candidateKeys.length ||
      assets.some(
        (asset) => asset?.standardId !== 'buddy-boss-tier-overlay',
      )
    ) {
      issues.push({
        code: 'invalid-boss-overlay',
        message: `Boss overlay "${overlay.bossId}" has a missing species, asset, or tier standard.`,
      });
    }
    if (
      new Set(overlay.tierFrameOrder).size !== 5 ||
      overlay.tierFrameOrder.join('|') !==
        'normal|pumped|overload|final-round|defeated'
    ) {
      issues.push({
        code: 'invalid-boss-overlay',
        message: `Boss overlay "${overlay.bossId}" has an invalid tier frame order.`,
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
