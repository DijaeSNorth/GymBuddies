import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import {
  getBuddySpriteImageCacheStats,
} from '../game/assets/buddySpriteCompositor';
import {
  getBuddyPresentationImageCacheStats,
} from '../game/assets/buddyPresentationCompositor';
import {
  getBuddyPresentationAssetKeys,
  resolveBuddyPresentationFrame,
  resolveReactBuddyPresentationFrame,
} from '../game/assets/buddyPresentationResolver';
import {
  resolveBuddyBossOverlayFrame,
  resolveBuddySpriteFrame,
  resolveReactBuddySpriteFrame,
} from '../game/assets/buddySpriteResolver';
import {
  BUDDY_ANATOMY_FAMILIES,
} from '../game/assets/anatomyFamilies';
import {
  ASSET_MANIFEST,
  getAssetByKey,
  getBuddySpriteProfile,
} from '../game/assets/manifest';
import {
  BUDDY_SPRITE_DIRECTIONS,
  BUDDY_SPRITE_POSES,
  BUDDY_BATTLE_POSES,
  BUDDY_SHOWCASE_POSES,
} from '../game/assets/types';
import { validateAssetManifest } from '../game/assets/validation';
import { getBuddyCharacterDesign } from '../game/content/buddyCharacters';
import { BUDDY_SPECIES, getBuddySpeciesById } from '../game/content/buddies';
import {
  resolvePhaserBuddyFrame,
  resolvePhaserBuddyPresentation,
} from '../game/phaser/buddySpriteBridge';
import {
  buddyFrameSignature,
  getBuddyPixelFrameCacheStats,
  renderBuddyPixelFrame,
  resetBuddyPixelFrameCache,
} from '../game/rendering/buddyPixelRenderer';
import { renderPilotBuddyPhysiqueOverlay } from '../game/rendering/pilotBuddyPhysiqueRenderer';
import {
  createBuddyPresentationIdentityReceipt,
} from '../game/rendering/buddyPresentationOverlayRenderer';
import { normalizeBuddyCosmetics } from '../game/systems/buddyCosmetics';

const assetRoot = join(
  process.cwd(),
  'public',
  ASSET_MANIFEST.basePath,
);

const PILOT_V2_SHA256: Record<string, string> = {
  'buddies/handcrafted/bosses/versions/v2/home-watchman-tiers.png':
    'a14ce0b9a1e1d2eda81e7522c56c3423a8317f7a4d9246e00375660c773d746a',
  'buddies/handcrafted/brawny-bear/versions/v2/base-back.png':
    '1831c9f00fb2626739f055b1b7a1ad8ddb5ae0bf6fd9de728cc758a17e3a605f',
  'buddies/handcrafted/brawny-bear/versions/v2/base-front.png':
    'ea9bcf0ab3cc58d4e3bd3d1e162c3e320bfb5dea552bbc8515f8ec413b4b3d22',
  'buddies/handcrafted/brawny-bear/versions/v2/base-left.png':
    '074b97f9fc89f85996bdd176842de436a44369fae7be381107300da3954807e5',
  'buddies/handcrafted/iron-wolf/versions/v2/base-back.png':
    '7e7fc6b4e450abb15b5594b5fb5f0982e5ab6ba48fece42f8f65d934ebcd4ec8',
  'buddies/handcrafted/iron-wolf/versions/v2/base-front.png':
    '19005c0ae40b0b8a1a7fb9eee1b29d025fd539fefae4004089e868346c92d5ad',
  'buddies/handcrafted/iron-wolf/versions/v2/base-left.png':
    '7eedb5c9018762135e0a8b236abc5b6fb8e185814fd157bee846e1962f934ff6',
  'buddies/handcrafted/prismantle/versions/v2/base-back.png':
    'df4e0824cb932f09ab0d19f23de2c16d9393c7413c9992114b62f2b0fa96d489',
  'buddies/handcrafted/prismantle/versions/v2/base-front.png':
    '21a8acaa16732dcd009d764c98a37804284b0b976c6d560ea949479f5d463e77',
  'buddies/handcrafted/prismantle/versions/v2/base-left.png':
    '104c35d85c61f59dbfa6bcc84c08243c1a5a640543b2da7248173cd5b58ec61e',
  'buddies/handcrafted/prismantle/versions/v2/base-right.png':
    '84a5001862ae8d0b3a6d7e0972790fd68697060b689bdd677de85bcf46ac8a49',
};

const PRESENTATION_V1_SHA256: Record<string, string> = {
  'buddies/handcrafted/presentation/v1/brawny-bear/battle-48.png':
    '7172a5fe02343256c0995a42aa7ecba3e56dd645124b6d1c1f045e87e223034a',
  'buddies/handcrafted/presentation/v1/brawny-bear/menu-32.png':
    '57e48e802eab3e257b96dda3f3763cb85d72a010efb21c2e13f9f53330f5d9aa',
  'buddies/handcrafted/presentation/v1/brawny-bear/portrait-64.png':
    '4a7931ba9f6c1a11ad1c88f0353514a30c20e91fa3435cd720fb39b78423afb4',
  'buddies/handcrafted/presentation/v1/brawny-bear/showcase-64.png':
    'cf1a983f81d34f335c9b4ca38c486794e7973a683e6a730c43f27e28f53baae3',
  'buddies/handcrafted/presentation/v1/home-watchman/battle-64.png':
    'e9c8c539c14fc644c62d7b673568a85a0c9746761c7610b05376af24fd591a07',
  'buddies/handcrafted/presentation/v1/home-watchman/menu-32.png':
    'f03838286dc9c599ae802ee25835f98a38bcaa4ab959bd44acd91a3fc8f8a796',
  'buddies/handcrafted/presentation/v1/home-watchman/portrait-64.png':
    'dbee93140f4354de1b3d980ea335c89ef965efab94f10054fac4f0342fd37a4a',
  'buddies/handcrafted/presentation/v1/home-watchman/showcase-64.png':
    '4309468505d48dc9ed19d6490eb5abed761d8bc6f1a5bbf67dd76eefec5286cf',
  'buddies/handcrafted/presentation/v1/iron-wolf/battle-48.png':
    '97c2b7321e23ef05589d876e25b5353fcc688b35e000cf878dcbdc000a11f93e',
  'buddies/handcrafted/presentation/v1/iron-wolf/menu-32.png':
    '8aa1048b5fd2648b87052d0621d573c59ad7aa39865d6b84292b1727df1fbb69',
  'buddies/handcrafted/presentation/v1/iron-wolf/portrait-64.png':
    '86d9eff27f3f3488d1d3f15056536c6c0e2fa59009bbf026d3dff7c115496ae8',
  'buddies/handcrafted/presentation/v1/iron-wolf/showcase-64.png':
    'f8e815556dabea4c62d4ac7a223b4f15edfc0991c3a4adcde2960a4c50c95211',
  'buddies/handcrafted/presentation/v1/prismantle/battle-48.png':
    '3649e40f582985eaf50f1e942c062502264da8d22454a6b9f3e587b920533a77',
  'buddies/handcrafted/presentation/v1/prismantle/menu-32.png':
    '10b068efa180aa8aa64b8e6062df834458e9ef7eb08b29061bf509cd8052ca73',
  'buddies/handcrafted/presentation/v1/prismantle/portrait-64.png':
    '5fcf8820c2365cc569c6c06888af1e10f39907bd10babd7d064d986eda8ebb7c',
  'buddies/handcrafted/presentation/v1/prismantle/showcase-64.png':
    'fbf945320c3f464656dbac0841cd853b0f5b7dc0e05eb63d3531168bedeb3fe2',
};

type DecodedPng = {
  width: number;
  height: number;
  rgba: Buffer;
};

function decodeGeneratedPng(path: string): DecodedPng {
  const source = readFileSync(path);
  const width = source.readUInt32BE(16);
  const height = source.readUInt32BE(20);
  const chunks: Buffer[] = [];
  let offset = 8;
  while (offset < source.length) {
    const length = source.readUInt32BE(offset);
    const type = source.subarray(offset + 4, offset + 8).toString('ascii');
    if (type === 'IDAT') {
      chunks.push(source.subarray(offset + 8, offset + 8 + length));
    }
    offset += 12 + length;
  }
  const scanlines = inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  const rgba = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const sourceOffset = y * (stride + 1);
    expect(scanlines[sourceOffset], 'Pilot PNG must use filter 0').toBe(0);
    scanlines.copy(
      rgba,
      y * stride,
      sourceOffset + 1,
      sourceOffset + 1 + stride,
    );
  }
  return { width, height, rgba };
}

function frameAlphaSignature(
  image: DecodedPng,
  sourceFrame: number,
) {
  const values: string[] = [];
  for (let y = 0; y < 24; y += 1) {
    for (let x = 0; x < 24; x += 1) {
      const pixelOffset =
        (y * image.width + sourceFrame * 24 + x) * 4;
      if (image.rgba[pixelOffset + 3] > 0) {
        values.push(
          `${x},${y}:${image.rgba[pixelOffset]},${image.rgba[pixelOffset + 1]},${image.rgba[pixelOffset + 2]}`,
        );
      }
    }
  }
  return values.join('|');
}

function presentationFrameBounds(
  image: DecodedPng,
  sourceFrame: number,
  frameWidth: number,
  frameHeight: number,
  columns: number,
) {
  const column = sourceFrame % columns;
  const row = Math.floor(sourceFrame / columns);
  let left = frameWidth;
  let right = -1;
  let top = frameHeight;
  let bottom = -1;
  let visible = 0;
  for (let y = 0; y < frameHeight; y += 1) {
    for (let x = 0; x < frameWidth; x += 1) {
      const alpha =
        image.rgba[
          ((row * frameHeight + y) * image.width +
            column * frameWidth +
            x) *
            4 +
            3
        ];
      if (alpha === 0) continue;
      visible += 1;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return { bottom, left, right, top, visible };
}

describe('handcrafted Buddy sprite pipeline', () => {
  it('covers every species with a valid stable profile and safe fallback', () => {
    expect(validateAssetManifest(ASSET_MANIFEST)).toEqual([]);
    expect(ASSET_MANIFEST.buddySpritePipeline.profiles).toHaveLength(
      BUDDY_SPECIES.length,
    );
    expect(
      new Set(
        ASSET_MANIFEST.buddySpritePipeline.profiles.map(
          (profile) => profile.speciesId,
        ),
      ),
    ).toEqual(new Set(BUDDY_SPECIES.map((species) => species.id)));
    ASSET_MANIFEST.buddySpritePipeline.profiles.forEach((profile) => {
      expect(profile.fallbackRenderer).toBe('procedural');
    });
  });

  it('resolves procedural, hybrid, handcrafted, and missing-asset fallback modes', () => {
    expect(
      resolveBuddySpriteFrame({
        speciesId: 'muscled-boar',
        direction: 'front',
        pose: 'idle',
      }).baseSource,
    ).toBe('procedural');
    expect(
      resolveBuddySpriteFrame({
        speciesId: 'brawny-bear',
        direction: 'front',
        pose: 'front-flex',
      }).baseSource,
    ).toBe('authored');
    const prism = resolveBuddySpriteFrame({
      speciesId: 'prismantle',
      direction: 'right',
      pose: 'rare-entrance',
    });
    expect(prism.rendererMode).toBe('handcrafted');
    expect(prism.baseSource).toBe('authored');
    expect(prism.mirrorX).toBe(false);

    const fallback = resolveBuddySpriteFrame({
      speciesId: 'brawny-bear',
      direction: 'front',
      pose: 'idle',
      availableAssetKeys: new Set(),
    });
    expect(fallback.baseSource).toBe('procedural');
    expect(fallback.fallbackReason).toBe('missing-direction-strip');
  });

  it('ranks v2 final assets ahead of legacy review assets while retaining rollback candidates', () => {
    for (const speciesId of ['brawny-bear', 'iron-wolf', 'prismantle']) {
      const profile = getBuddySpriteProfile(speciesId)!;
      const current = resolveBuddySpriteFrame({
        speciesId,
        direction: 'front',
        pose: 'idle',
      });
      expect(current.assetKey).toContain('.authored.v2.');
      expect(current.assetStatus).toBe('final');
      expect(current.assetVersion).toBe('2.0.0');

      const legacyKeys = new Set(Object.values(profile.baseStrips));
      const rollback = resolveBuddySpriteFrame({
        speciesId,
        direction: 'front',
        pose: 'idle',
        availableAssetKeys: legacyKeys,
      });
      expect(rollback.baseSource).toBe('authored');
      expect(rollback.assetKey).toBe(profile.baseStrips.front);
      expect(rollback.assetVersion).toBeUndefined();
    }
  });

  it('uses the same immutable frame receipt for React and Phaser', () => {
    const input = {
      speciesId: 'iron-wolf',
      direction: 'right',
      pose: 'running',
      animationFrame: 1,
    } as const;
    expect(resolveReactBuddySpriteFrame(input)).toEqual(
      resolvePhaserBuddyFrame(input),
    );
    expect(resolveReactBuddySpriteFrame(input).mirrorX).toBe(true);
  });

  it('selects the authored context and keeps React and Phaser receipts equivalent', () => {
    const input = {
      speciesId: 'brawny-bear',
      context: 'battle',
      battlePose: 'shoulder-burst',
    } as const;
    const receipt = resolveBuddyPresentationFrame(input);
    expect(receipt.selectedContext).toBe('battle');
    expect(receipt.source).toBe('authored-context');
    expect(receipt.frameWidth).toBe(48);
    expect(receipt.frameHeight).toBe(48);
    expect(receipt.loadGroup).toBe('battle');
    expect(resolveReactBuddyPresentationFrame(input)).toEqual(
      resolvePhaserBuddyPresentation(input),
    );
    expect(getBuddyPresentationAssetKeys('battle', ['brawny-bear'])).toEqual(
      ['buddy.brawny-bear.presentation.v1.battle'],
    );
  });

  it('uses 32px menus, 48px battles, and 64px showcase and boss frames', () => {
    for (const speciesId of [
      'brawny-bear',
      'iron-wolf',
      'prismantle',
    ]) {
      expect(
        resolveBuddyPresentationFrame({
          speciesId,
          context: 'menu',
          direction: 'right',
        }).frameWidth,
      ).toBe(32);
      expect(
        resolveBuddyPresentationFrame({
          speciesId,
          context: 'battle',
          battlePose: 'iron-grind',
        }).frameWidth,
      ).toBe(48);
      expect(
        resolveBuddyPresentationFrame({
          speciesId,
          context: 'showcase',
          showcasePose: 'most-muscular',
        }).frameWidth,
      ).toBe(64);
    }
    const watchman = resolveBuddyPresentationFrame({
      speciesId: 'brawny-bear',
      bossId: 'home-watchman',
      bossTier: 'final-round',
      context: 'battle',
      battlePose: 'counter',
    });
    expect(watchman.frameWidth).toBe(64);
    expect(watchman.sourceFrame).toBe(3 * 12 + 5);
  });

  it('falls back from an unavailable battle sheet to menu, hybrid, then procedural', () => {
    const menuOnly = new Set([
      'buddy.brawny-bear.presentation.v1.menu',
    ]);
    const lower = resolveBuddyPresentationFrame({
      speciesId: 'brawny-bear',
      context: 'battle',
      availableAssetKeys: menuOnly,
    });
    expect(lower.source).toBe('authored-lower-resolution');
    expect(lower.selectedContext).toBe('menu');
    expect(lower.frameWidth).toBe(32);

    const overworldProfile = getBuddySpriteProfile('brawny-bear')!;
    const overworldOnly = new Set(
      Object.values(overworldProfile.baseStripCandidates ?? {}).flat(),
    );
    const hybrid = resolveBuddyPresentationFrame({
      speciesId: 'brawny-bear',
      context: 'battle',
      availableAssetKeys: overworldOnly,
    });
    expect(hybrid.source).toBe('hybrid');
    expect(hybrid.frameWidth).toBe(24);

    const procedural = resolveBuddyPresentationFrame({
      speciesId: 'brawny-bear',
      context: 'battle',
      rendererPreference: 'procedural',
      availableAssetKeys: new Set(),
    });
    expect(procedural.source).toBe('procedural');
    expect(procedural.frameWidth).toBe(24);
  });

  it('keeps identity-bearing cosmetics stable across every resolution', () => {
    for (const speciesId of [
      'brawny-bear',
      'iron-wolf',
      'prismantle',
    ]) {
      const design = getBuddyCharacterDesign(speciesId);
      const cosmetics = normalizeBuddyCosmetics(
        speciesId,
        design.defaultCosmetics,
      );
      const expected = createBuddyPresentationIdentityReceipt(
        speciesId,
        cosmetics,
      );
      for (const context of [
        'overworld',
        'menu',
        'battle',
        'showcase',
        'dialogue',
      ] as const) {
        resolveBuddyPresentationFrame({ speciesId, context });
        expect(
          createBuddyPresentationIdentityReceipt(
            speciesId,
            cosmetics,
          ),
        ).toEqual(expected);
      }
    }
  });

  it('keeps every authored battle and showcase pose populated and in bounds', () => {
    for (const character of [
      { speciesId: 'brawny-bear' },
      { speciesId: 'iron-wolf' },
      { speciesId: 'prismantle' },
      { speciesId: 'brawny-bear', bossId: 'home-watchman' },
    ] as const) {
      for (const context of ['battle', 'showcase'] as const) {
        const poses =
          context === 'battle'
            ? BUDDY_BATTLE_POSES
            : BUDDY_SHOWCASE_POSES;
        const tiers = character.bossId
          ? ([
              'normal',
              'pumped',
              'overload',
              'final-round',
              'defeated',
            ] as const)
          : ([undefined] as const);
        for (const bossTier of tiers) {
          for (const selectedPose of poses) {
            const receipt = resolveBuddyPresentationFrame({
              ...character,
              bossTier,
              context,
              battlePose:
                context === 'battle' ? selectedPose as never : undefined,
              showcasePose:
                context === 'showcase' ? selectedPose as never : undefined,
            });
            const asset = getAssetByKey(receipt.assetKey!);
            const standard = ASSET_MANIFEST.standards[
              asset.standardId
            ]!;
            expect(standard.mediaType).toBe('image');
            if (standard.mediaType !== 'image') continue;
            const image = decodeGeneratedPng(join(assetRoot, asset.path));
            const bounds = presentationFrameBounds(
              image,
              receipt.sourceFrame,
              receipt.frameWidth,
              receipt.frameHeight,
              standard.columns,
            );
            expect(
              bounds.visible,
              `${receipt.characterId} ${bossTier ?? ''} ${selectedPose}`,
            ).toBeGreaterThan(20);
            expect(bounds.left).toBeGreaterThan(0);
            expect(bounds.right).toBeLessThan(receipt.frameWidth - 1);
            expect(bounds.top).toBeGreaterThan(0);
            expect(bounds.bottom).toBeLessThanOrEqual(
              receipt.frameHeight - 3,
            );
          }
        }
      }
    }
  });

  it('keeps authored frames in bounds, grounded, and populated for every pose and direction', () => {
    for (const speciesId of ['brawny-bear', 'iron-wolf', 'prismantle']) {
      for (const direction of BUDDY_SPRITE_DIRECTIONS) {
        for (const pose of BUDDY_SPRITE_POSES) {
          const receipt = resolveBuddySpriteFrame({
            speciesId,
            direction,
            pose,
            animationFrame: 0,
          });
          expect(receipt.baseSource).toBe('authored');
          expect(receipt.assetVersion).toBe('2.0.0');
          const asset = getAssetByKey(receipt.assetKey!);
          const image = decodeGeneratedPng(join(assetRoot, asset.path));
          const signature = frameAlphaSignature(image, receipt.sourceFrame);
          expect(signature.length, `${speciesId} ${direction} ${pose}`).toBeGreaterThan(0);
          const ys = signature
            .split('|')
            .map((pixel) => Number(pixel.split(',')[1]!.split(':')[0]));
          expect(Math.max(...ys)).toBeLessThanOrEqual(receipt.groundLineY);
          expect(Math.max(...ys)).toBeGreaterThanOrEqual(
            receipt.groundLineY - 1,
          );
        }
      }
    }
  });

  it('keeps every pilot physique preset visually distinct through modular overlays', () => {
    for (const speciesId of ['brawny-bear', 'iron-wolf', 'prismantle']) {
      const species = getBuddySpeciesById(speciesId);
      const design = getBuddyCharacterDesign(speciesId);
      const signatures = new Set(
        design.physiquePresets.map((preset) =>
          buddyFrameSignature(
            renderBuddyPixelFrame(
              species,
              {
                ...design.defaultCosmetics,
                physiquePresetId: preset.id,
                physique: preset.physique,
                bodySizeId: preset.bodySizeId,
                muscleDefinitionId: preset.muscleDefinitionId,
              },
              'front',
              'front-flex',
              0,
            ),
          ),
        ),
      );
      expect(signatures.size).toBe(design.physiquePresets.length);
      const authoredOverlaySignatures = new Set(
        design.physiquePresets.map((preset) =>
          buddyFrameSignature(
            renderPilotBuddyPhysiqueOverlay(
              species,
              {
                ...design.defaultCosmetics,
                physiquePresetId: preset.id,
                physique: preset.physique,
                bodySizeId: preset.bodySizeId,
                muscleDefinitionId: preset.muscleDefinitionId,
              },
              'front',
              'front-flex',
              0,
            )!,
          ),
        ),
      );
      expect(authoredOverlaySignatures.size).toBe(
        design.physiquePresets.length,
      );
    }
  });

  it('preserves valid cosmetics exactly during pipeline resolution', () => {
    for (const speciesId of ['brawny-bear', 'iron-wolf', 'prismantle']) {
      const design = getBuddyCharacterDesign(speciesId);
      const valid = normalizeBuddyCosmetics(
        speciesId,
        design.defaultCosmetics,
      );
      const before = JSON.stringify(valid);
      resolveBuddySpriteFrame({
        speciesId,
        direction: 'back',
        pose: 'victory',
      });
      expect(JSON.stringify(valid)).toBe(before);
      expect(normalizeBuddyCosmetics(speciesId, valid)).toEqual(valid);
    }
  });

  it('keeps anatomy pivots, ground lines, and deformation budgets inside the 24x24 frame', () => {
    expect(BUDDY_ANATOMY_FAMILIES).toHaveLength(9);
    BUDDY_ANATOMY_FAMILIES.forEach((family) => {
      expect(family.canvas).toEqual({ width: 24, height: 24 });
      expect(family.pivot).toEqual({ x: 12, y: 21 });
      expect(family.groundLineY).toBe(21);
      expect(family.safeDeformation.horizontalPx).toBeLessThanOrEqual(3);
      expect(family.safeDeformation.verticalPx).toBeLessThanOrEqual(2);
    });
  });

  it('makes every boss presentation tier a distinct bounded overlay', () => {
    const overlay = ASSET_MANIFEST.buddySpritePipeline.bossOverlays[0]!;
    const resolved = resolveBuddyBossOverlayFrame(
      overlay.bossId,
      overlay.tierFrameOrder[0]!,
    )!;
    expect(resolved.assetVersion).toBe('2.0.0');
    expect(resolved.assetStatus).toBe('final');
    const asset = getAssetByKey(resolved.assetKey);
    const image = decodeGeneratedPng(join(assetRoot, asset.path));
    expect(image.width).toBe(120);
    expect(image.height).toBe(24);
    const signatures = new Set(
      overlay.tierFrameOrder.map((_, index) =>
        frameAlphaSignature(image, index),
      ),
    );
    expect(signatures.size).toBe(5);
  });

  it('keeps procedural and decoded-image caches bounded', () => {
    resetBuddyPixelFrameCache();
    const species = getBuddySpeciesById('brawny-bear');
    const design = getBuddyCharacterDesign(species.id);
    for (let index = 0; index < 800; index += 1) {
      renderBuddyPixelFrame(
        species,
        {
          ...design.defaultCosmetics,
          patternId:
            design.patternOptions[index % design.patternOptions.length]!.id,
        },
        BUDDY_SPRITE_DIRECTIONS[index % 4]!,
        BUDDY_SPRITE_POSES[index % BUDDY_SPRITE_POSES.length]!,
        index % 2,
        `cache-${index}`,
      );
    }
    expect(getBuddyPixelFrameCacheStats().entries).toBeLessThanOrEqual(512);
    expect(getBuddySpriteImageCacheStats().limit).toBe(32);
    expect(getBuddySpriteImageCacheStats().entries).toBeLessThanOrEqual(32);
    expect(
      getBuddyPresentationImageCacheStats().entries,
    ).toBeLessThanOrEqual(
      getBuddyPresentationImageCacheStats().entryLimit,
    );
    expect(
      getBuddyPresentationImageCacheStats().decodedBytes,
    ).toBeLessThanOrEqual(
      getBuddyPresentationImageCacheStats().byteLimit,
    );
  });

  it('declares authored strips through application-base-safe asset keys', () => {
    for (const speciesId of ['brawny-bear', 'iron-wolf', 'prismantle']) {
      const profile = getBuddySpriteProfile(speciesId)!;
      Object.values(profile.baseStrips).forEach((assetKey) => {
        const asset = getAssetByKey(assetKey);
        expect(asset.path.startsWith('buddies/handcrafted/')).toBe(true);
        expect(asset.path.startsWith('/')).toBe(false);
      });
      Object.values(profile.baseStripCandidates ?? {})
        .flat()
        .forEach((assetKey) => {
          const asset = getAssetByKey(assetKey);
          expect(asset.path.startsWith('buddies/handcrafted/')).toBe(true);
          expect(asset.path.startsWith('/')).toBe(false);
        });
    }
  });

  it('pins intentional visual signatures for every v2 pilot strip', () => {
    for (const [path, expectedHash] of Object.entries(PILOT_V2_SHA256)) {
      const source = readFileSync(join(assetRoot, path));
      expect(createHash('sha256').update(source).digest('hex'), path).toBe(
        expectedHash,
      );
    }
  });

  it('pins every native multi-resolution pilot sheet', () => {
    for (const [path, expectedHash] of Object.entries(
      PRESENTATION_V1_SHA256,
    )) {
      const source = readFileSync(join(assetRoot, path));
      expect(createHash('sha256').update(source).digest('hex'), path).toBe(
        expectedHash,
      );
    }
  });
});
