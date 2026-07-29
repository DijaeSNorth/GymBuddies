import { describe, expect, it } from 'vitest';

import {
  BUDDY_BODY_SIZE_OPTIONS,
  BUDDY_CHARACTER_DESIGNS,
  BUDDY_DEFINITION_OPTIONS,
} from '../game/content/buddyCharacters';
import {
  BOSS_CHARACTER_DESIGNS,
  bossBuddyCosmetics,
} from '../game/content/bossCharacters';
import { BUDDY_SPECIES, getBuddySpeciesById } from '../game/content/buddies';
import { getBossById } from '../game/content/bosses';
import {
  GYM_LEADER_CHARACTER_DESIGNS,
  MUSCULAR_BODY_ARCHETYPES,
  NPC_CHARACTER_SEEDS,
  RIVAL_CHARACTER_DESIGNS,
} from '../game/content/characters';
import {
  BUDDY_PIXEL_HEIGHT,
  BUDDY_PIXEL_WIDTH,
  buddyFrameSignature,
  getBuddyPixelFrameCacheStats,
  renderBuddyPixelFrame,
  resetBuddyPixelFrameCache,
} from '../game/rendering/buddyPixelRenderer';
import { renderTrainerPixelFrame } from '../game/rendering/trainerPixelRenderer';
import {
  createNpcCharacterDesign,
  trainerAppearanceFromCharacterDesign,
} from '../game/systems/characterDesign';
import {
  normalizeBuddyCosmetics,
  randomizeBuddyCosmetics,
} from '../game/systems/buddyCosmetics';
import { createRandomState } from '../game/systems/random';
import type {
  BuddyFacingDirection,
  BuddyPose,
} from '../game/types';

const DIRECTIONS: BuddyFacingDirection[] = [
  'front',
  'back',
  'left',
  'right',
];
const POSES: BuddyPose[] = [
  'idle',
  'walking',
  'running',
  'training',
  'victory',
  'fatigue',
  'capture',
  'entrance',
];

function signatureHash(signature: string) {
  let hash = 2_166_136_261;
  for (const character of signature) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function trainerSignatureHash(
  design: (typeof GYM_LEADER_CHARACTER_DESIGNS)[number],
) {
  const frame = renderTrainerPixelFrame(
    trainerAppearanceFromCharacterDesign(design),
    'front',
    design.signaturePose,
    0,
  );
  return signatureHash(
    frame.rects
      .map(
        (rect) =>
          `${rect.layer}:${rect.x},${rect.y},${rect.width},${rect.height},${rect.color}`,
      )
      .join('|'),
  );
}

describe('modular character visual regression', () => {
  it('keeps every Buddy frame visible, bounded, and species-distinct', () => {
    const defaultSignatures = new Set<string>();
    for (const species of BUDDY_SPECIES) {
      const design = BUDDY_CHARACTER_DESIGNS.find(
        (entry) => entry.speciesId === species.id,
      )!;
      for (const direction of DIRECTIONS) {
        for (const pose of POSES) {
          const frame = renderBuddyPixelFrame(
            species,
            design.defaultCosmetics,
            direction,
            pose,
            0,
          );
          expect(frame.rects.length).toBeGreaterThan(8);
          for (const rect of frame.rects) {
            expect(rect.x).toBeGreaterThanOrEqual(0);
            expect(rect.y).toBeGreaterThanOrEqual(0);
            expect(rect.x + rect.width).toBeLessThanOrEqual(BUDDY_PIXEL_WIDTH);
            expect(rect.y + rect.height).toBeLessThanOrEqual(
              BUDDY_PIXEL_HEIGHT,
            );
          }
        }
      }
      defaultSignatures.add(
        buddyFrameSignature(
          renderBuddyPixelFrame(
            species,
            design.defaultCosmetics,
            'front',
            'idle',
            0,
          ),
        ),
      );
    }
    expect(defaultSignatures.size).toBe(BUDDY_SPECIES.length);
  });

  it('accepts every species-scoped body, definition, pattern, and appendage combination', () => {
    for (const species of BUDDY_SPECIES) {
      const design = BUDDY_CHARACTER_DESIGNS.find(
        (entry) => entry.speciesId === species.id,
      )!;
      for (const bodySize of BUDDY_BODY_SIZE_OPTIONS) {
        for (const definition of BUDDY_DEFINITION_OPTIONS) {
          for (const pattern of design.patternOptions) {
            for (const appendage of design.appendageOptions) {
              const cosmetics = normalizeBuddyCosmetics(species.id, {
                ...design.defaultCosmetics,
                bodySizeId:
                  bodySize.id as typeof design.defaultCosmetics.bodySizeId,
                muscleDefinitionId:
                  definition.id as typeof design.defaultCosmetics.muscleDefinitionId,
                patternId: pattern.id,
                appendageVariantId: appendage.id,
              });
              expect(
                renderBuddyPixelFrame(
                  species,
                  cosmetics,
                  'front',
                  'idle',
                  0,
                ).rects.length,
              ).toBeGreaterThan(8);
            }
          }
        }
      }
    }
  });

  it('locks representative frame signatures against accidental visual drift', () => {
    const bramblift = getBuddySpeciesById('brawny-bear');
    const prismantle = getBuddySpeciesById('prismantle');
    const manyfold = getBuddySpeciesById('manyfold');
    const brambliftDesign = BUDDY_CHARACTER_DESIGNS.find(
      (entry) => entry.speciesId === bramblift.id,
    )!;
    const prismDesign = BUDDY_CHARACTER_DESIGNS.find(
      (entry) => entry.speciesId === prismantle.id,
    )!;
    const manyfoldDesign = BUDDY_CHARACTER_DESIGNS.find(
      (entry) => entry.speciesId === manyfold.id,
    )!;
    const signatures = {
      brambliftDefault: signatureHash(
        buddyFrameSignature(
          renderBuddyPixelFrame(
            bramblift,
            brambliftDesign.defaultCosmetics,
            'front',
            'idle',
            0,
          ),
        ),
      ),
      brambliftBroadVictory: signatureHash(
        buddyFrameSignature(
          renderBuddyPixelFrame(
            bramblift,
            {
              ...brambliftDesign.defaultCosmetics,
              bodySizeId: 'broad',
              appendageVariantId:
                brambliftDesign.appendageOptions[1]!.id,
              patternId: 'pattern-shoulder-bands',
            },
            'left',
            'victory',
            1,
          ),
        ),
      ),
      prismRareEntrance: signatureHash(
        buddyFrameSignature(
          renderBuddyPixelFrame(
            prismantle,
            {
              ...prismDesign.defaultCosmetics,
              rareTraitId: 'rare-glow-lines',
              accessoryIds: ['accessory-chain'],
            },
            'right',
            'entrance',
            1,
          ),
        ),
      ),
      manyfoldCompactTraining: signatureHash(
        buddyFrameSignature(
          renderBuddyPixelFrame(
            manyfold,
            {
              ...manyfoldDesign.defaultCosmetics,
              bodySizeId: 'compact',
              muscleDefinitionId: 'etched',
            },
            'back',
            'training',
            0,
          ),
        ),
      ),
    };
    expect(signatures).toEqual({
      brambliftDefault: '399f8579',
      brambliftBroadVictory: '91efbe7e',
      prismRareEntrance: '02a2fadc',
      manyfoldCompactTraining: 'dc141256',
    });
  });

  it('keeps randomization deterministic, valid, and cosmetic-only', () => {
    const species = getBuddySpeciesById('loopstride');
    const first = randomizeBuddyCosmetics(
      species,
      createRandomState(0x1020_3040),
    );
    const second = randomizeBuddyCosmetics(
      species,
      createRandomState(0x1020_3040),
    );
    expect(first).toEqual(second);
    expect(normalizeBuddyCosmetics(species.id, first.cosmetics)).toEqual(
      first.cosmetics,
    );
    expect(species.power).toBe(getBuddySpeciesById('loopstride').power);
  });

  it('keeps the render cache bounded on mobile-scale combination sweeps', () => {
    resetBuddyPixelFrameCache();
    const species = getBuddySpeciesById('brawny-bear');
    const design = BUDDY_CHARACTER_DESIGNS[0]!;
    for (let index = 0; index < 900; index += 1) {
      renderBuddyPixelFrame(
        species,
        {
          ...design.defaultCosmetics,
          primaryPaletteId: index % 2 === 0 ? 'bark' : 'coral',
          bodySizeId: BUDDY_BODY_SIZE_OPTIONS[
            index % BUDDY_BODY_SIZE_OPTIONS.length
          ]!.id as typeof design.defaultCosmetics.bodySizeId,
        },
        DIRECTIONS[index % DIRECTIONS.length],
        POSES[index % POSES.length],
        index,
      );
    }
    expect(getBuddyPixelFrameCacheStats().entries).toBeLessThanOrEqual(
      getBuddyPixelFrameCacheStats().limit,
    );
  });

  it('renders every archetype, leader, rival, seeded NPC, and boss design', () => {
    const allHumanoids = [
      ...GYM_LEADER_CHARACTER_DESIGNS,
      ...RIVAL_CHARACTER_DESIGNS,
      ...NPC_CHARACTER_SEEDS.map(createNpcCharacterDesign),
    ];
    expect(MUSCULAR_BODY_ARCHETYPES).toHaveLength(10);
    expect(new Set(allHumanoids.map(trainerSignatureHash)).size).toBeGreaterThan(
      9,
    );
    expect(BOSS_CHARACTER_DESIGNS).toHaveLength(12);
    for (const design of BOSS_CHARACTER_DESIGNS) {
      const boss = getBossById(design.bossId)!;
      const species = getBuddySpeciesById(boss.speciesId);
      expect(
        renderBuddyPixelFrame(
          species,
          bossBuddyCosmetics(design),
          'front',
          'entrance',
          0,
          design.entranceAnimationId,
        ).rects.length,
      ).toBeGreaterThan(8);
      expect(
        buddyFrameSignature(
          renderBuddyPixelFrame(
            species,
            bossBuddyCosmetics(design),
            'front',
            'entrance',
            0,
            design.entranceAnimationId,
          ),
        ),
      ).not.toBe(
        buddyFrameSignature(
          renderBuddyPixelFrame(
            species,
            bossBuddyCosmetics(design),
            'front',
            'victory',
            0,
            design.victoryAnimationId,
          ),
        ),
      );
    }
  });
});
