import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  BATCH_02_ANATOMY_PROFILES,
  BATCH_02_BOSS_TIER_RULES,
  validateBatch02AnatomyProfiles,
} from '../game/assets/armoredHeavyModules';
import {
  BATCH_02_FORMAL_REVIEW_RECEIPTS,
  validateBatch02FormalReview,
} from '../game/assets/batch02FormalReview';
import {
  ASSET_MANIFEST,
  getAssetByKey,
  getBuddySpriteProfile,
} from '../game/assets/manifest';
import {
  resolveBuddyPresentationFrame,
  resolveReactBuddyPresentationFrame,
} from '../game/assets/buddyPresentationResolver';
import {
  resolveBuddyBossOverlayFrame,
  resolveBuddySpriteFrame,
} from '../game/assets/buddySpriteResolver';
import { getBuddyCharacterDesign } from '../game/content/buddyCharacters';
import { BUDDY_ACCESSORY_OPTIONS } from '../game/content/buddyCharacters';
import {
  resolvePhaserBuddyFrame,
  resolvePhaserBuddyPresentation,
} from '../game/phaser/buddySpriteBridge';
import {
  createArmoredHeavyPresentationPlan,
} from '../game/rendering/armoredHeavyPresentationRenderer';
import { renderArmoredHeavyPixelOverlay } from '../game/rendering/armoredHeavyPixelRenderer';
import {
  buddyFrameSignature,
  renderBuddyPixelFrame,
} from '../game/rendering/buddyPixelRenderer';
import { getBuddySpeciesById } from '../game/content/buddies';

const BATCH_SPECIES = [
  'ripped-rhino',
  'spotmole',
  'titan-gorilla',
] as const;

const BATCH_02_SHA256: Record<string, string> = {
  'art-source/review/batch-02-armored-heavy/batch-02-contact-sheet.png':
    '69a38f062f7d7a343edc02261c5b5096196400f878f43e554383add421ad91d3',
  'art-source/review/batch-02-formal/a-rhino-formal-contact-sheet.png':
    '029ab5392c0a6aca5d556ef1c81f1ce58b2045db8c78ffb033f8464b6183e345',
  'art-source/review/batch-02-formal/ripped-rhino-formal-contact-sheet.png':
    'ef246cb6651aaf5416ddafebd5eb6a8069315a20b13ff6153e45737935418ea6',
  'art-source/review/batch-02-formal/spotmole-formal-contact-sheet.png':
    'c80064b86fe649e89f50eaff827a9a1023f1e0bcd26a15e82a506bb78c25c677',
  'art-source/review/batch-02-formal/titan-gorilla-formal-contact-sheet.png':
    'c68d709e6ccb406c81925d1482332c81a2fa905cfd17845ec4d80772c712c47e',
  'public/assets/gym-buddies/buddies/handcrafted/bosses/versions/v1/a-rhino-tiers.png':
    'e99561b17fdaeb1665f3821dd3e34295f0e71419baa9eac46a893561c63665f6',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1/a-rhino/battle-64.png':
    'c186b3f79e305d1e57810b2a4c752b7e30da844360da5324b79066822f1f4c4d',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1/a-rhino/menu-32.png':
    '1d5cd4de1d44a07288ff643975c2ab8720add50a34dfc61d69c5221aa66d24e5',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1/a-rhino/portrait-64.png':
    '1964bbc597613f81b5a31c4e89bd2cf1c41f4a16cf491d2be16d4af6fc10d7ef',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1/a-rhino/showcase-64.png':
    '5b0e801bea67d8d73d7dd0106ffa7c4315c928459ed25d2b55d270ba3e774ce7',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1/ripped-rhino/battle-48.png':
    '282f454ac0368ad065034def96afdca45ae9e28e8b165f7ce6547f113b0ac1d9',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1/ripped-rhino/menu-32.png':
    '97e3b6960a039cde4918bc06404e218c0261b69f3c37a8addbaeeefc1478226c',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1/ripped-rhino/portrait-64.png':
    '98bc03ab989d63f94a0a0689a51f92d5e46a1c14e85ec433f93544ccbacbcaf2',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1/ripped-rhino/showcase-64.png':
    'd71a7c05986e29e3b0c3daab793a18655881d7a86153eb0f4ac18b1a01c3690e',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1/spotmole/battle-48.png':
    '3cfb0040749e991dde88e6c0ade7fa6f21bff59318eba608b4049fded769948b',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1/spotmole/menu-32.png':
    'd35af80fc638c8c681521596e8e44bf35760eefc1912dea46c2ff7ddbd1070b7',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1/spotmole/portrait-64.png':
    '4d22f7bbb4301692d7f003efd553ad6e4550c0012be22fd5d47c137be42ccdaa',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1/spotmole/showcase-64.png':
    'a3fea721846150df1c673e073fb337473adc17d3a89be25f6562708be4d9dc74',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1/titan-gorilla/battle-48.png':
    'efb417ae6b2e3daff7d6523ff0fdbec8ede0007cb229ce421295b5347004d4db',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1/titan-gorilla/menu-32.png':
    '32ae5c8179cb74e112abcf6980c710a89c1df5b786c84c7e755e65dcffb50b92',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1/titan-gorilla/portrait-64.png':
    '594b916b4932d56fa5e2eb2fc36306119e07831fa20174672f8bb4c33580177d',
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1/titan-gorilla/showcase-64.png':
    '19a9919e927f95b7d356b19011284a2ecf3d48c9d97247dd4be3a40bca1c8ca6',
  'public/assets/gym-buddies/buddies/handcrafted/ripped-rhino/versions/v1/base-back.png':
    'dd637205e81ed47785ad259b8bbc194f668af96b600952323f68d71b6135e9cd',
  'public/assets/gym-buddies/buddies/handcrafted/ripped-rhino/versions/v1/base-front.png':
    'ceff2876b3de84d0574e6edbf20190f90bb92213a76d111c04c60498bbcf47b3',
  'public/assets/gym-buddies/buddies/handcrafted/ripped-rhino/versions/v1/base-left.png':
    'f710744eb33ad156d30fe829be72f0833718d0767712dba124d83f5c5cd269de',
  'public/assets/gym-buddies/buddies/handcrafted/ripped-rhino/versions/v1/base-right.png':
    '8371359bca124e3f0a365cd566b9310c064eab88392c9132a2c28a86daaf52d2',
  'public/assets/gym-buddies/buddies/handcrafted/spotmole/versions/v1/base-back.png':
    'd41c1bbd00e76cd9c9c9bf47756e84dea9c1a197b186396d51446b0f9c4e8833',
  'public/assets/gym-buddies/buddies/handcrafted/spotmole/versions/v1/base-front.png':
    'b61223809b698ba1ce43235d021210378d9d08840f7b4c54aaf91dcac199ec6c',
  'public/assets/gym-buddies/buddies/handcrafted/spotmole/versions/v1/base-left.png':
    'cc2bb4d24cd73d70cc5b78f91d498a1a3ff83d6505821d215a4b24860cfb86bd',
  'public/assets/gym-buddies/buddies/handcrafted/spotmole/versions/v1/base-right.png':
    '63be22ad9252509616318fd02ae6e736f3c234bf32b23e55e7264e12a2106104',
  'public/assets/gym-buddies/buddies/handcrafted/titan-gorilla/versions/v1/base-back.png':
    'dda5630eb287c20021dedc84050fbb80090c01c54a05794f14ef1eab21dfdd4f',
  'public/assets/gym-buddies/buddies/handcrafted/titan-gorilla/versions/v1/base-front.png':
    '49666025052bda5c9a3167df02292666f3192187623280de1e81424eb5faa23e',
  'public/assets/gym-buddies/buddies/handcrafted/titan-gorilla/versions/v1/base-left.png':
    '1763866c65b4de90ab7ae6d6eb988846a7640e334d6770d2399e9ad1741e23a3',
  'public/assets/gym-buddies/buddies/handcrafted/titan-gorilla/versions/v1/base-right.png':
    '1c5e1cd5899f18bd80d3750383f9a115c81af35cc07c306054c99eb1677f842e',
};

describe('armored and heavy handcrafted review batch', () => {
  it('keeps stable content IDs while retaining Batch 02 revision assets behind newer candidates', () => {
    for (const speciesId of BATCH_SPECIES) {
      expect(getBuddySpeciesById(speciesId).id).toBe(speciesId);
      const profile = getBuddySpriteProfile(speciesId)!;
      expect(profile.rendererMode).toBe('handcrafted');
      for (const direction of ['front', 'back', 'left', 'right'] as const) {
        const receipt = resolveBuddySpriteFrame({
          speciesId,
          direction,
          pose: 'idle',
        });
        expect(receipt.baseSource).toBe('authored');
        expect(receipt.assetStatus).toBe(
          speciesId === 'ripped-rhino'
            ? 'review'
            : 'revision-required',
        );
        expect(receipt.assetVersion).toBe(
          speciesId === 'ripped-rhino' ? '3.0.0' : '1.0.0',
        );
        expect(receipt.mirrorX).toBe(false);
      }
    }
    expect(resolveBuddyBossOverlayFrame('a-rhino', 'final-round')).toMatchObject({
      assetStatus: 'revision-required',
      assetVersion: '1.0.0',
      sourceFrame: 3,
    });
  });

  it('validates material separation and never inflates rigid armor', () => {
    expect(validateBatch02AnatomyProfiles()).toEqual([]);
    const railhorn = BATCH_02_ANATOMY_PROFILES.find(
      (profile) => profile.speciesId === 'ripped-rhino',
    )!;
    expect(
      railhorn.modules
        .filter((module) => module.kind === 'hard-shell')
        .every((module) => module.rigid),
    ).toBe(true);
    expect(
      railhorn.modules
        .filter(
          (module) =>
            module.kind === 'flexible-joint' ||
            module.kind === 'under-shell-muscle',
        )
        .every((module) => !module.rigid),
    ).toBe(true);
    expect(
      Object.values(BATCH_02_BOSS_TIER_RULES).every(
        (tier) => tier.armorScale === 1,
      ),
    ).toBe(true);
  });

  it('keeps every physique preset distinct without pump-driven armor scaling', () => {
    for (const speciesId of BATCH_SPECIES) {
      const species = getBuddySpeciesById(speciesId);
      const design = getBuddyCharacterDesign(speciesId);
      const signatures = new Set(
        design.physiquePresets.map((preset) => {
          const cosmetics = {
            ...design.defaultCosmetics,
            physiquePresetId: preset.id,
            physique: preset.physique,
            bodySizeId: preset.bodySizeId,
            muscleDefinitionId: preset.muscleDefinitionId,
          };
          const plan = createArmoredHeavyPresentationPlan(
            speciesId,
            cosmetics,
          )!;
          expect(plan.rigidArmorScale).toBe(1);
          expect(plan.pumpChangesRigidArmor).toBe(false);
          expect(plan.fatigueUsesDamageMarks).toBe(false);
          return buddyFrameSignature(
            renderArmoredHeavyPixelOverlay(
              species,
              cosmetics,
              'front',
              'front-flex',
            )!,
          );
        }),
      );
      expect(signatures.size).toBe(design.physiquePresets.length);
    }
    const design = getBuddyCharacterDesign('ripped-rhino');
    const base = design.defaultCosmetics;
    const noPump = createArmoredHeavyPresentationPlan('ripped-rhino', {
      ...base,
      physique: { ...base.physique, pumpEffectId: 'none' },
    })!;
    const fullPump = createArmoredHeavyPresentationPlan('ripped-rhino', {
      ...base,
      physique: { ...base.physique, pumpEffectId: 'full' },
    })!;
    expect(fullPump.shellWidth).toBe(noPump.shellWidth);
    expect(fullPump.rigidArmorScale).toBe(noPump.rigidArmorScale);
    expect(fullPump.pumpSeamIntensity).toBeGreaterThan(noPump.pumpSeamIntensity);
  });

  it('selects native context art equally in React and Phaser and falls back safely', () => {
    for (const speciesId of BATCH_SPECIES) {
      const input = {
        speciesId,
        context: 'battle',
        battlePose: 'snapping-hook',
      } as const;
      const receipt = resolveBuddyPresentationFrame(input);
      expect(receipt.source).toBe('authored-context');
      expect(receipt.frameWidth).toBe(48);
      expect(resolveReactBuddyPresentationFrame(input)).toEqual(
        resolvePhaserBuddyPresentation(input),
      );
      expect(
        resolveBuddyPresentationFrame({
          ...input,
          availableAssetKeys: new Set(),
        }).source,
      ).toBe('procedural');
      expect(
        resolvePhaserBuddyFrame({
          speciesId,
          direction: 'right',
          pose: 'running',
        }),
      ).toEqual(
        resolveBuddySpriteFrame({
          speciesId,
          direction: 'right',
          pose: 'running',
        }),
      );
    }
    const boss = resolveBuddyPresentationFrame({
      speciesId: 'ripped-rhino',
      bossId: 'a-rhino',
      bossTier: 'final-round',
      context: 'battle',
      battlePose: 'counter',
    });
    expect(boss.frameWidth).toBe(64);
    expect(boss.sourceFrame).toBe(3 * 12 + 5);
  });

  it('keeps review source outside runtime and all runtime paths Pages-safe', () => {
    const runtimeAssets = ASSET_MANIFEST.assets.filter(
      (asset) =>
        asset.key.includes('ripped-rhino') ||
        asset.key.includes('spotmole') ||
        asset.key.includes('titan-gorilla') ||
        asset.key.includes('a-rhino'),
    );
    expect(runtimeAssets.length).toBeGreaterThanOrEqual(29);
    runtimeAssets.forEach((asset) => {
      expect(asset.path.startsWith('/')).toBe(false);
      expect(asset.path.includes('art-source')).toBe(false);
      expect(existsSync(join(process.cwd(), 'public', ASSET_MANIFEST.basePath, asset.path))).toBe(true);
    });
    expect(
      existsSync(
        join(
          process.cwd(),
          'art-source/review/batch-02-armored-heavy/batch-02-contact-sheet.png',
        ),
      ),
    ).toBe(true);
  });

  it('pins every generated review asset and contact sheet', () => {
    for (const [path, expectedHash] of Object.entries(BATCH_02_SHA256)) {
      const source = readFileSync(join(process.cwd(), path));
      expect(createHash('sha256').update(source).digest('hex'), path).toBe(
        expectedHash,
      );
    }
  });

  it('resolves every formal review receipt without accidental promotion', () => {
    expect(validateBatch02FormalReview(ASSET_MANIFEST)).toEqual([]);
    expect(BATCH_02_FORMAL_REVIEW_RECEIPTS).toHaveLength(21);
    for (const receipt of BATCH_02_FORMAL_REVIEW_RECEIPTS) {
      expect(receipt.status).toBe('revision-required');
      expect(receipt.assetVersion).toBe('1.0.0');
      expect(receipt.reviewDate).toBe('2026-07-30');
      expect(receipt.reviewerNote.length).toBeGreaterThan(20);
      expect(receipt.knownLimitation.length).toBeGreaterThan(20);
      expect(receipt.requiredRevision.length).toBeGreaterThan(20);
      expect(receipt.proceduralFallbackEnabled).toBe(true);
      receipt.assetKeys.forEach((key) => {
        expect(getAssetByKey(key).status).toBe('revision-required');
      });
    }
    const batchAssets = ASSET_MANIFEST.assets.filter(
      (asset) =>
        asset.assetVersion === '1.0.0' &&
        (asset.key.includes('ripped-rhino') ||
          asset.key.includes('spotmole') ||
          asset.key.includes('titan-gorilla') ||
          asset.key.includes('a-rhino')),
    );
    expect(batchAssets).toHaveLength(29);
    expect(
      batchAssets.some(
        (asset) =>
          asset.status === 'approved' || asset.status === 'final',
      ),
    ).toBe(false);
  });

  it('keeps every extreme Railhorn accessory render bounded', () => {
    const species = getBuddySpeciesById('ripped-rhino');
    const design = getBuddyCharacterDesign(species.id);
    const extremePresets = design.physiquePresets.filter(
      (preset) =>
        preset.id.endsWith('-compact') ||
        preset.id.endsWith('-broad') ||
        preset.id.endsWith('-specialized'),
    );
    const accessoryCases = [
      ...BUDDY_ACCESSORY_OPTIONS.map((option) => [option.id]),
      [
        'accessory-wraps',
        'accessory-elbow-sleeves',
        'accessory-belt',
        'accessory-chain',
        'accessory-victory-medal',
      ],
    ];
    for (const preset of extremePresets) {
      for (const accessoryIds of accessoryCases) {
        for (const direction of ['front', 'back', 'left', 'right'] as const) {
          const frame = renderBuddyPixelFrame(
            species,
            {
              ...design.defaultCosmetics,
              physiquePresetId: preset.id,
              physique: {
                ...preset.physique,
                pumpEffectId: 'full',
              },
              bodySizeId: preset.bodySizeId,
              muscleDefinitionId: preset.muscleDefinitionId,
              accessoryIds,
            },
            direction,
            'idle',
          );
          frame.rects.forEach((rect) => {
            expect(rect.x).toBeGreaterThanOrEqual(0);
            expect(rect.y).toBeGreaterThanOrEqual(0);
            expect(rect.x + rect.width).toBeLessThanOrEqual(frame.width);
            expect(rect.y + rect.height).toBeLessThanOrEqual(frame.height);
          });
        }
      }
    }
  });

  it('keeps Railhorn horn, shell, chain, and harness anchors inside their technical zones', () => {
    const species = getBuddySpeciesById('ripped-rhino');
    const design = getBuddyCharacterDesign(species.id);
    const base = design.defaultCosmetics;
    for (const direction of ['front', 'left', 'right'] as const) {
      const overlay = renderArmoredHeavyPixelOverlay(
        species,
        base,
        direction,
        'idle',
      )!;
      const horn = overlay.rects.find(
        (rect) => rect.color === species.palette.detail,
      );
      expect(horn, `${direction} horn`).toBeDefined();
      overlay.rects.forEach((rect) => {
        expect(rect.x + rect.width).toBeLessThanOrEqual(24);
        expect(rect.y + rect.height).toBeLessThanOrEqual(24);
      });
    }
    const equipped = renderBuddyPixelFrame(
      species,
      {
        ...base,
        accessoryIds: ['accessory-chain', 'accessory-belt'],
      },
      'front',
      'idle',
    );
    const accessories = equipped.rects.filter(
      (rect) => rect.layer === 'accessory',
    );
    expect(
      accessories.some(
        (rect) => rect.y >= 11 && rect.y <= 12,
      ),
    ).toBe(true);
    expect(
      accessories.some(
        (rect) => rect.y >= 16 && rect.width >= 10,
      ),
    ).toBe(true);
  });

  it('keeps side-action frames and boss tiers addressable while preserving fallback', () => {
    const hook = resolveBuddyPresentationFrame({
      speciesId: 'ripped-rhino',
      context: 'battle',
      battlePose: 'snapping-hook',
    });
    const counter = resolveBuddyPresentationFrame({
      speciesId: 'ripped-rhino',
      context: 'battle',
      battlePose: 'counter',
    });
    expect(hook.sourceFrame).not.toBe(counter.sourceFrame);
    expect(hook.assetStatus).toBe('review');
    expect(hook.assetVersion).toBe('3.0.0');
    expect(
      resolveBuddyPresentationFrame({
        speciesId: 'ripped-rhino',
        context: 'battle',
        battlePose: 'snapping-hook',
        availableAssetKeys: new Set(),
      }).source,
    ).toBe('procedural');

    const tierKeys = new Set<string>();
    for (const [tier, sourceFrame] of [
      ['normal', 0],
      ['pumped', 1],
      ['overload', 2],
      ['final-round', 3],
      ['defeated', 4],
    ] as const) {
      const resolved = resolveBuddyBossOverlayFrame('a-rhino', tier)!;
      expect(resolved.sourceFrame).toBe(sourceFrame);
      expect(resolved.assetStatus).toBe('revision-required');
      tierKeys.add(resolved.assetKey);
    }
    expect(tierKeys).toEqual(
      new Set(['boss.a-rhino.authored.v1.tiers']),
    );
  });

  it('keeps the Batch 02 palette stable across every authored resolution', () => {
    const coveredKeys = new Set(
      BATCH_02_FORMAL_REVIEW_RECEIPTS.flatMap((receipt) =>
        receipt.assetKeys,
      ),
    );
    const paletteIds = new Set(
      [...coveredKeys].map((key) => {
        const asset = getAssetByKey(key);
        return 'paletteId' in asset ? asset.paletteId : undefined;
      }),
    );
    expect(paletteIds).toEqual(new Set(['kinetic-slate']));
  });
});
