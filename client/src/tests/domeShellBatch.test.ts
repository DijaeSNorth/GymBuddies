import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  BATCH_03_ANATOMY_PROFILES,
  BATCH_03_BOSS_TIER_RULES,
  createBatch03PresentationPlan,
  isPlastrongAccessoryAccepted,
  PLASTRONG_ACCESSORY_IDS,
  PLASTRONG_ACCESSORY_MOUNTS,
  PLASTRONG_DOME_LAYER_IDS,
  PLASTRONG_REJECTED_GENERIC_ACCESSORIES,
  validateBatch03DomeShellData,
} from '../game/assets/domeShellModules';
import {
  ASSET_MANIFEST,
  getAssetByKey,
  getBuddyPresentationProfile,
} from '../game/assets/manifest';
import {
  resolveBuddyPresentationFrame,
  resolveReactBuddyPresentationFrame,
} from '../game/assets/buddyPresentationResolver';
import {
  resolveBuddyBossOverlayFrame,
  resolveBuddySpriteFrame,
} from '../game/assets/buddySpriteResolver';
import { joinAssetUrl } from '../game/assets/assetUrl';
import { getBossById } from '../game/content/bosses';
import { getBuddyCharacterDesign } from '../game/content/buddyCharacters';
import { getBuddySpeciesById } from '../game/content/buddies';
import {
  resolvePhaserBuddyFrame,
  resolvePhaserBuddyPresentation,
} from '../game/phaser/buddySpriteBridge';
import {
  renderDomeShellPixelLayers,
  renderDomeShellPixelOverlay,
} from '../game/rendering/domeShellPixelRenderer';
import { buddyFrameSignature } from '../game/rendering/buddyPixelRenderer';

const BATCH_SPECIES = [
  'titan-tortoise',
  'ripped-rhino',
  'boulder-bison',
] as const;
const DIRECTIONS = ['front', 'back', 'left', 'right'] as const;
const PRESENTATION_CONTEXTS = [
  ['menu', 32],
  ['battle', 48],
  ['showcase', 64],
  ['dialogue', 64],
] as const;
const BATCH_03_VISUAL_SHA256: Readonly<Record<string, string>> = {
  'public/assets/gym-buddies/buddies/handcrafted/titan-tortoise/versions/v3/base-front.png':
    'bda4b75350e7a3913620ec4335315f41e457c4764fcbfa4d47bdb009919f53f7',
  'public/assets/gym-buddies/buddies/handcrafted/titan-tortoise/versions/v3/base-back.png':
    '99bd589acb3c4de5784ae48bffd0c221f13ac531b2ae186c663f1ec27d042544',
  'public/assets/gym-buddies/buddies/handcrafted/titan-tortoise/versions/v3/base-left.png':
    '252e112abbc15f439b185e2a991978a63e46e3938f468590902d5892bdf60fe2',
  'public/assets/gym-buddies/buddies/handcrafted/titan-tortoise/versions/v3/base-right.png':
    'f40fe6a47944a9cf5693efaae520f715b1cbac40d8ab27c26a91ef00a43f3c2d',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v3/titan-tortoise/menu-32.png':
    'b8c1fa15bc12f6263346aaa3f2f3d89e605da01c7b4f518cf6852f771a064766',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v3/titan-tortoise/battle-48.png':
    '6ab0c04e044105cf8a8a6afd39937eea1805adc70db1ad3565872d82b4a5e2a0',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v3/titan-tortoise/showcase-64.png':
    '011245134b044abff7d915d4c850fd30ed1b154bbee662a950efd253c41a03c8',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v3/titan-tortoise/portrait-64.png':
    'dccfff1d7c9aa1cbbdd536c4eef4d1c41601adcd559fb2d02f36e51392d76210',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v3/ripped-rhino/battle-48.png':
    '3c4cbf938b8da6d26699a95e0869a79553e1725f77316f64cea736fac09fb548',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v3/boulder-bison/battle-48.png':
    'a66cd6e69ae20ca946b0baa8451cc4767ff09d66716809ee1f4b92f6c85b8482',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v3/dome-warden/battle-64.png':
    'a5a26e2e1e9b96f5b9f8adaabc61c6cdcc7389c5313ce9523aa37518f454cd12',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v3/dome-warden/showcase-64.png':
    '64ee0a092072c3a82aa515869beeb3542d79d787bae31ada45065fd81403fde7',
  'art-source/review/batch-03-dome-shell/cross-resolution.png':
    '4e438b96adab8cce12c5cdbbcb70a66113eab98642d64f4cf7073efceb1ef9cb',
  'art-source/review/batch-03-dome-shell/armor-layers.png':
    '2dfc098b7d79a747f9355af64a87f6235c6d288567e916b1fed475d94a70a619',
  'art-source/review/batch-03-dome-shell/anchors.png':
    '2676575d306a42aee9665b4fb667185350d96c6b2c99bf8e300192af24b51906',
  'art-source/review/batch-03-dome-shell/mobile.png':
    '983994bef453ac778c5b01a190cc56a8e4987dcc6838d69c550a3a9b8cbec5e5',
  'art-source/review/batch-03-dome-shell/silhouettes.png':
    'bea3f1cd3b07fadfaef49e255267ef5e3a12317a3e3e4e98b17f715b5266b809',
  'art-source/review/batch-03-dome-shell/boss-tiers.png':
    '80310894f1474e90b428a9b2caa00e91a41daa7fdb46a56e8aa16d5443860ae1',
};

function cosmeticsForPreset(speciesId: (typeof BATCH_SPECIES)[number], index: number) {
  const design = getBuddyCharacterDesign(speciesId);
  const preset = design.physiquePresets[index]!;
  return {
    ...design.defaultCosmetics,
    physiquePresetId: preset.id,
    physique: preset.physique,
    bodySizeId: preset.bodySizeId,
    muscleDefinitionId: preset.muscleDefinitionId,
    accessoryIds: [],
  };
}

function layerSignature(
  layer: readonly {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  }[],
) {
  return layer
    .map(
      (rect) =>
        `${rect.x},${rect.y},${rect.width},${rect.height},${rect.color}`,
    )
    .join('|');
}

describe('Handcrafted Batch 03 complete dome-shell pipeline', () => {
  it('keeps existing species IDs and the presentation-only boss out of gameplay', () => {
    expect(
      BATCH_03_ANATOMY_PROFILES.map((profile) => profile.speciesId),
    ).toEqual(BATCH_SPECIES);
    for (const speciesId of BATCH_SPECIES) {
      expect(getBuddySpeciesById(speciesId).id).toBe(speciesId);
    }
    expect(getBossById('dome-warden')).toBeNull();
  });

  it('validates every independent dome layer and rigid material rule', () => {
    expect(validateBatch03DomeShellData()).toEqual([]);
    const plastrong = BATCH_03_ANATOMY_PROFILES[0]!;
    expect(plastrong.anatomyFamily).toBe('complete-domed-shell');
    expect(plastrong.speciesSpecificPresetLabel).toBe('Dome Fortress');
    expect(plastrong.modules.map((module) => module.layerId)).toEqual(
      PLASTRONG_DOME_LAYER_IDS,
    );
    expect(
      plastrong.modules
        .filter((module) => module.material === 'rigid-shell')
        .every((module) => module.rigid),
    ).toBe(true);
    expect(
      plastrong.modules
        .filter(
          (module) =>
            module.material === 'flexible-tissue' ||
            module.material === 'soft-muscle',
        )
        .every((module) => !module.rigid),
    ).toBe(true);
  });

  it('keeps the dome and plastron separate while joints and limbs stay visible', () => {
    const species = getBuddySpeciesById('titan-tortoise');
    const cosmetics = cosmeticsForPreset('titan-tortoise', 1);
    for (const direction of DIRECTIONS) {
      const layers = renderDomeShellPixelLayers(
        species,
        cosmetics,
        direction,
        'idle',
      )!;
      expect(layers['upper-dome'].length).toBeGreaterThan(0);
      if (direction === 'back') {
        expect(layers['front-plastron']).toHaveLength(0);
      } else {
        expect(layers['front-plastron'].length).toBeGreaterThan(0);
      }
      expect(layers['neck-opening'].length).toBeGreaterThan(0);
      expect(layers['flexible-joint-tissue'].length).toBeGreaterThan(0);
      expect(layers['exposed-limb-musculature'].length).toBeGreaterThan(0);
      if (direction !== 'back') {
        expect(layerSignature(layers['upper-dome'])).not.toBe(
          layerSignature(layers['front-plastron']),
        );
      }
      for (const layer of Object.values(layers)) {
        for (const rect of layer) {
          expect(rect.x).toBeGreaterThanOrEqual(1);
          expect(rect.y).toBeGreaterThanOrEqual(1);
          expect(rect.x + rect.width).toBeLessThanOrEqual(23);
          expect(rect.y + rect.height).toBeLessThanOrEqual(22);
        }
      }
    }
  });

  it('authors distinct front, back, and side silhouettes without mirroring', () => {
    const species = getBuddySpeciesById('titan-tortoise');
    const cosmetics = cosmeticsForPreset('titan-tortoise', 1);
    const signatures = new Map(
      DIRECTIONS.map((direction) => {
        const frame = renderDomeShellPixelOverlay(
          species,
          cosmetics,
          direction,
          'idle',
        )!;
        return [direction, buddyFrameSignature(frame)] as const;
      }),
    );
    expect(new Set(signatures.values()).size).toBe(4);
    expect(signatures.get('front')).not.toBe(signatures.get('back'));
    expect(signatures.get('left')).not.toBe(signatures.get('right'));
    for (const direction of DIRECTIONS) {
      expect(
        resolveBuddySpriteFrame({
          speciesId: species.id,
          direction,
          pose: 'idle',
        }).mirrorX,
      ).toBe(false);
    }
  });

  it('keeps all five physique presets distinct without scaling the rigid dome for pump', () => {
    const species = getBuddySpeciesById('titan-tortoise');
    const design = getBuddyCharacterDesign(species.id);
    const signatures = new Set(
      design.physiquePresets.map((_, index) => {
        const cosmetics = cosmeticsForPreset('titan-tortoise', index);
        const plan = createBatch03PresentationPlan(
          species.id,
          cosmetics,
        )!;
        expect(plan.rigidShellScale).toBe(1);
        expect(plan.pumpRigidShellDelta).toBe(0);
        return buddyFrameSignature(
          renderDomeShellPixelOverlay(
            species,
            cosmetics,
            'front',
            'idle',
          )!,
        );
      }),
    );
    expect(signatures.size).toBe(5);

    const neutral = cosmeticsForPreset('titan-tortoise', 4);
    const pumped = {
      ...neutral,
      physique: { ...neutral.physique, pumpEffectId: 'full' as const },
    };
    const neutralLayers = renderDomeShellPixelLayers(
      species,
      neutral,
      'front',
      'idle',
    )!;
    const pumpedLayers = renderDomeShellPixelLayers(
      species,
      pumped,
      'front',
      'idle',
    )!;
    expect(layerSignature(pumpedLayers['upper-dome'])).toBe(
      layerSignature(neutralLayers['upper-dome']),
    );
    expect(layerSignature(pumpedLayers['front-plastron'])).toBe(
      layerSignature(neutralLayers['front-plastron']),
    );
    expect(pumpedLayers['pump-highlights'].length).toBeGreaterThan(0);
  });

  it('uses explicit species-safe accessory mounts and rejects generic belts and chains', () => {
    expect(PLASTRONG_ACCESSORY_IDS).toHaveLength(8);
    expect(PLASTRONG_ACCESSORY_MOUNTS).toHaveLength(32);
    for (const accessoryId of PLASTRONG_ACCESSORY_IDS) {
      expect(isPlastrongAccessoryAccepted(accessoryId)).toBe(true);
      for (const direction of DIRECTIONS) {
        const mount = PLASTRONG_ACCESSORY_MOUNTS.find(
          (entry) =>
            entry.accessoryId === accessoryId &&
            entry.direction === direction,
        );
        expect(mount).toBeDefined();
        expect(mount!.anchor.x).toBeGreaterThan(0);
        expect(mount!.anchor.x).toBeLessThan(24);
        expect(mount!.anchor.y).toBeGreaterThan(0);
        expect(mount!.anchor.y).toBeLessThan(24);
      }
    }
    for (const accessoryId of PLASTRONG_REJECTED_GENERIC_ACCESSORIES) {
      expect(isPlastrongAccessoryAccepted(accessoryId)).toBe(false);
    }
  });

  it('escalates the Dome Warden without changing shell scale or implying damage', () => {
    expect(
      Object.values(BATCH_03_BOSS_TIER_RULES).every(
        (tier) => tier.shellScale === 1,
      ),
    ).toBe(true);
    expect(BATCH_03_BOSS_TIER_RULES.defeated.equipmentState).toBe(
      'lowered',
    );
    expect(BATCH_03_BOSS_TIER_RULES.defeated.seamLight).toBe(0);
    for (const [index, tier] of [
      'normal',
      'pumped',
      'overload',
      'final-round',
      'defeated',
    ].entries()) {
      expect(
        resolveBuddyBossOverlayFrame(
          'dome-warden',
          tier as keyof typeof BATCH_03_BOSS_TIER_RULES,
        ),
      ).toMatchObject({
        assetStatus: 'review',
        assetVersion: '3.0.0',
        sourceFrame: index,
        speciesId: 'titan-tortoise',
      });
    }
  });

  it('selects review-only authored assets by context with React and Phaser parity', () => {
    for (const speciesId of BATCH_SPECIES) {
      for (const direction of DIRECTIONS) {
        const input = { speciesId, direction, pose: 'idle' as const };
        const react = resolveBuddySpriteFrame(input);
        const phaser = resolvePhaserBuddyFrame(input);
        expect(react).toEqual(phaser);
        expect(react).toMatchObject({
          baseSource: 'authored',
          assetStatus: 'review',
          assetVersion: '3.0.0',
          sourceDirection: direction,
        });
      }
      for (const [context, size] of PRESENTATION_CONTEXTS) {
        const input = { speciesId, context };
        const react = resolveReactBuddyPresentationFrame(input);
        const phaser = resolvePhaserBuddyPresentation(input);
        expect(react).toEqual(phaser);
        expect(react.assetStatus).toBe('review');
        expect(react.assetVersion).toBe('3.0.0');
        expect(react.frameWidth).toBe(size);
        expect(react.frameHeight).toBe(size);
      }
    }
    const boss = resolveBuddyPresentationFrame({
      speciesId: 'titan-tortoise',
      bossId: 'dome-warden',
      bossTier: 'final-round',
      context: 'battle',
      battlePose: 'shoulder-burst',
    });
    expect(boss).toMatchObject({
      characterId: 'dome-warden',
      frameWidth: 64,
      frameHeight: 64,
      assetStatus: 'review',
      assetVersion: '3.0.0',
    });
  });

  it('falls back safely when higher-resolution or overworld assets are unavailable', () => {
    expect(
      resolveBuddyPresentationFrame({
        speciesId: 'titan-tortoise',
        context: 'battle',
        battlePose: 'iron-grind',
        availableAssetKeys: new Set(),
      }),
    ).toMatchObject({
      source: 'procedural',
      selectedContext: 'overworld',
      fallbackReason: 'missing-battle-profile',
    });
    expect(
      resolveBuddySpriteFrame({
        speciesId: 'titan-tortoise',
        direction: 'left',
        pose: 'walking',
        availableAssetKeys: new Set(),
      }),
    ).toMatchObject({
      baseSource: 'procedural',
      fallbackReason: 'missing-direction-strip',
    });
  });

  it('keeps every v3 runtime asset review-only, present, and Pages-safe', () => {
    const assets = ASSET_MANIFEST.assets.filter(
      (asset) => asset.assetVersion === '3.0.0',
    );
    expect(assets).toHaveLength(29);
    for (const asset of assets) {
      expect(asset.status).toBe('review');
      expect(
        existsSync(join(process.cwd(), 'public', ASSET_MANIFEST.basePath, asset.path)),
      ).toBe(true);
      const pagesUrl = joinAssetUrl(
        '/GymBuddies/',
        ASSET_MANIFEST.basePath,
        asset.path,
      );
      expect(pagesUrl).toMatch(/^\/GymBuddies\/assets\/gym-buddies\//);
      expect(pagesUrl).not.toContain('//assets');
      expect(getAssetByKey(asset.key)).toBe(asset);
    }
    for (const characterId of [
      ...BATCH_SPECIES,
      'dome-warden',
    ]) {
      expect(getBuddyPresentationProfile(characterId)).toBeDefined();
    }
  });

  it('pins representative authored and review-output pixels for regression review', () => {
    for (const [relativePath, expectedHash] of Object.entries(
      BATCH_03_VISUAL_SHA256,
    )) {
      const bytes = readFileSync(join(process.cwd(), relativePath));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(
        expectedHash,
      );
    }
  });
});
