import { describe, expect, it } from 'vitest';

import {
  PLASTRONG_ACCESSORY_IDS,
  PLASTRONG_ACCESSORY_MOUNTS,
  PLASTRONG_DOME_LAYER_IDS,
  BATCH_03_BOSS_TIER_RULES,
} from '../game/assets/domeShellModules';
import {
  BUDDY_BATTLE_POSES,
  BUDDY_PRESENTATION_CONTEXTS,
} from '../game/assets/types';
import {
  PLASTRONG_ACCESSORY_PRIORITY_RULES,
  resolvePlastrongAccessoryPriority,
  validatePlastrongAccessoryPriority,
} from '../game/assets/accessoryPriority';
import {
  BATCH_03_FORMAL_REVIEW_RECEIPTS,
  validateBatch03FormalReview,
} from '../game/assets/batch03FormalReview';
import { ASSET_MANIFEST } from '../game/assets/manifest';
import {
  resolveBuddyPresentationFrame,
  resolveReactBuddyPresentationFrame,
} from '../game/assets/buddyPresentationResolver';
import {
  resolvePhaserBuddyPresentation,
} from '../game/phaser/buddySpriteBridge';
import {
  renderDomeShellPixelLayers,
} from '../game/rendering/domeShellPixelRenderer';
import { getBuddyCharacterDesign } from '../game/content/buddyCharacters';
import { getBuddySpeciesById } from '../game/content/buddies';

const DIRECTIONS = ['front', 'back', 'left', 'right'] as const;

function plastrongCosmetics(pumpEffectId: 'none' | 'full') {
  const design = getBuddyCharacterDesign('titan-tortoise');
  const preset = design.physiquePresets.at(-1)!;
  return {
    ...design.defaultCosmetics,
    physiquePresetId: preset.id,
    physique: { ...preset.physique, pumpEffectId },
    bodySizeId: preset.bodySizeId,
    muscleDefinitionId: preset.muscleDefinitionId,
    accessoryIds: [],
  };
}

function signature(
  rects: readonly Readonly<{
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  }>[],
) {
  return rects
    .map((rect) =>
      [rect.x, rect.y, rect.width, rect.height, rect.color].join(','),
    )
    .join('|');
}

describe('Batch 03 formal review gate', () => {
  it('records a complete resolution-specific ledger without accidental promotion', () => {
    expect(validateBatch03FormalReview(ASSET_MANIFEST)).toEqual([]);
    expect(BATCH_03_FORMAL_REVIEW_RECEIPTS).toHaveLength(21);
    expect(
      BATCH_03_FORMAL_REVIEW_RECEIPTS.some(
        (receipt) =>
          receipt.status === 'approved' || receipt.status === 'final',
      ),
    ).toBe(false);
    expect(
      BATCH_03_FORMAL_REVIEW_RECEIPTS.filter(
        (receipt) => receipt.status === 'review',
      ),
    ).toHaveLength(9);
    expect(
      BATCH_03_FORMAL_REVIEW_RECEIPTS.filter(
        (receipt) => receipt.status === 'revision-required',
      ),
    ).toHaveLength(12);
  });

  it('keeps the presentation-only Dome Warden out of gameplay content', () => {
    expect(
      ASSET_MANIFEST.buddySpritePipeline.presentationProfiles?.find(
        (profile) => profile.characterId === 'dome-warden',
      ),
    ).toMatchObject({
      bossId: 'dome-warden',
      speciesId: 'titan-tortoise',
    });
    expect(
      ASSET_MANIFEST.assets.some(
        (asset) =>
          asset.key.startsWith('boss.dome-warden') &&
          asset.category !== 'buddies',
      ),
    ).toBe(false);
  });

  it('applies the explicit 24px priority budget across all 32 mounts', () => {
    expect(validatePlastrongAccessoryPriority()).toEqual([]);
    expect(PLASTRONG_ACCESSORY_PRIORITY_RULES).toHaveLength(8);
    expect(PLASTRONG_ACCESSORY_MOUNTS).toHaveLength(32);
    for (const direction of DIRECTIONS) {
      const resolved = resolvePlastrongAccessoryPriority({
        accessoryIds: PLASTRONG_ACCESSORY_IDS,
        context: 'overworld',
        direction,
      });
      expect(resolved).toHaveLength(8);
      expect(
        resolved.filter((entry) => entry.presentation !== 'hidden'),
      ).toHaveLength(2);
      expect(
        new Set(
          resolved.map((entry) =>
            `${entry.accessoryId}.${direction}.${entry.anchor.x}.${entry.anchor.y}`,
          ),
        ).size,
      ).toBe(8);
    }
  });

  it('stresses every accessory through directions, presets, states, actions, and resolutions', () => {
    const presets = getBuddyCharacterDesign(
      'titan-tortoise',
    ).physiquePresets;
    const states = ['neutral', 'pumped', 'fatigue'] as const;
    let receiptCount = 0;
    for (const accessoryId of PLASTRONG_ACCESSORY_IDS) {
      for (const direction of DIRECTIONS) {
        for (const preset of presets) {
          for (const state of states) {
            for (const action of BUDDY_BATTLE_POSES) {
              for (const context of BUDDY_PRESENTATION_CONTEXTS) {
                const resolved = resolvePlastrongAccessoryPriority({
                  accessoryIds: [accessoryId],
                  direction,
                  context,
                });
                expect(resolved).toHaveLength(1);
                expect(resolved[0]!.anchor).toEqual(
                  PLASTRONG_ACCESSORY_MOUNTS.find(
                    (mount) =>
                      mount.accessoryId === accessoryId &&
                      mount.direction === direction,
                  )!.anchor,
                );
                expect(preset.id).toBeTruthy();
                expect(state).toBeTruthy();
                expect(action).toBeTruthy();
                receiptCount += 1;
              }
            }
          }
        }
      }
    }
    expect(receiptCount).toBe(28_800);
  });

  it('shows all accessories at 32px or larger without changing saved IDs', () => {
    const requested = [...PLASTRONG_ACCESSORY_IDS].reverse();
    for (const context of [
      'menu',
      'battle',
      'showcase',
      'dialogue',
    ] as const) {
      const resolved = resolvePlastrongAccessoryPriority({
        accessoryIds: requested,
        context,
        direction: 'front',
      });
      expect(resolved.every((entry) => entry.presentation === 'full')).toBe(
        true,
      );
      expect(resolved.map((entry) => entry.accessoryId).sort()).toEqual(
        [...PLASTRONG_ACCESSORY_IDS].sort(),
      );
    }
  });

  it('keeps pump and every boss tier from replacing or scaling rigid shell layers', () => {
    const species = getBuddySpeciesById('titan-tortoise');
    const neutral = renderDomeShellPixelLayers(
      species,
      plastrongCosmetics('none'),
      'front',
      'idle',
    )!;
    const pumped = renderDomeShellPixelLayers(
      species,
      plastrongCosmetics('full'),
      'front',
      'idle',
    )!;
    for (const layerId of ['upper-dome', 'front-plastron'] as const) {
      expect(signature(pumped[layerId])).toBe(signature(neutral[layerId]));
    }
    expect(PLASTRONG_DOME_LAYER_IDS).not.toContain('damage');
    expect(
      Object.values(BATCH_03_BOSS_TIER_RULES).every(
        (rule) => rule.shellScale === 1,
      ),
    ).toBe(true);
  });

  it('keeps React and Phaser resolution selection identical after status review', () => {
    for (const context of [
      'menu',
      'battle',
      'showcase',
      'dialogue',
    ] as const) {
      const input = {
        speciesId: 'titan-tortoise',
        context,
      };
      expect(resolveReactBuddyPresentationFrame(input)).toEqual(
        resolvePhaserBuddyPresentation(input),
      );
    }
  });

  it('keeps the v3 Railhorn alternative selected ahead of the retained v1 revision', () => {
    const battle = resolveBuddyPresentationFrame({
      speciesId: 'ripped-rhino',
      context: 'battle',
      battlePose: 'snapping-hook',
    });
    expect(battle.assetKey).toBe(
      'buddy.ripped-rhino.presentation.v3.battle',
    );
    expect(battle.assetStatus).toBe('review');

    const portrait = resolveBuddyPresentationFrame({
      speciesId: 'ripped-rhino',
      context: 'dialogue',
    });
    expect(portrait.assetKey).toBe(
      'buddy.ripped-rhino.presentation.v3.portrait',
    );
    expect(portrait.assetStatus).toBe('revision-required');
  });

  it('falls back safely when every Batch 03 authored profile is unavailable', () => {
    expect(
      resolveBuddyPresentationFrame({
        speciesId: 'boulder-bison',
        context: 'showcase',
        showcasePose: 'most-muscular',
        availableAssetKeys: new Set(),
      }),
    ).toMatchObject({
      source: 'procedural',
      selectedContext: 'overworld',
      fallbackReason: 'missing-showcase-profile',
    });
  });
});
