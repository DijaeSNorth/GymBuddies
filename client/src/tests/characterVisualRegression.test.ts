import { describe, expect, it } from 'vitest';

import {
  BUDDY_BODY_SIZE_OPTIONS,
  BUDDY_CHARACTER_DESIGNS,
  BUDDY_DEFINITION_OPTIONS,
  BUDDY_EMPHASIS_OPTIONS,
  BUDDY_POSE_OPTIONS,
} from '../game/content/buddyCharacters';
import {
  BOSS_CHARACTER_DESIGNS,
  bossBuddyCosmetics,
} from '../game/content/bossCharacters';
import { BUDDY_SPECIES, getBuddySpeciesById } from '../game/content/buddies';
import { getBossById } from '../game/content/bosses';
import { TRAINER_POSE_DEFINITIONS } from '../game/content/bodybuilding';
import {
  GYM_LEADER_CHARACTER_DESIGNS,
  MUSCULAR_BODY_ARCHETYPES,
  NPC_CHARACTER_SEEDS,
  NPC_OUTFIT_COMBINATIONS,
  RIVAL_CHARACTER_DESIGNS,
} from '../game/content/characters';
import { TRAINER_BUILD_ATTRIBUTES } from '../game/content/trainerAppearance';
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
  ...BUDDY_POSE_OPTIONS.map((entry) => entry.id as BuddyPose),
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

function trainerGeometrySignature(
  design: (typeof GYM_LEADER_CHARACTER_DESIGNS)[number],
) {
  return renderTrainerPixelFrame(
    trainerAppearanceFromCharacterDesign(design),
    'front',
    design.signaturePose,
    0,
  ).rects
    .map(
      (rect) =>
        `${rect.layer}:${rect.x},${rect.y},${rect.width},${rect.height}`,
    )
    .join('|');
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

  it('keeps every species physique preset valid, bounded, and silhouette-distinct', () => {
    for (const species of BUDDY_SPECIES) {
      const design = BUDDY_CHARACTER_DESIGNS.find(
        (entry) => entry.speciesId === species.id,
      )!;
      expect(design.physiquePresets.length).toBeGreaterThanOrEqual(5);
      expect(design.anatomyProfile.protectedFeatures.length).toBeGreaterThan(2);
      const signatures = new Set<string>();
      for (const preset of design.physiquePresets) {
        const cosmetics = normalizeBuddyCosmetics(species.id, {
          ...design.defaultCosmetics,
          physiquePresetId: preset.id,
          bodySizeId: preset.bodySizeId,
          muscleDefinitionId: preset.muscleDefinitionId,
          physique: preset.physique,
        });
        expect(cosmetics.physiquePresetId).toBe(preset.id);
        const frame = renderBuddyPixelFrame(
          species,
          cosmetics,
          'front',
          'front-flex',
          0,
        );
        for (const rect of frame.rects) {
          expect(rect.x).toBeGreaterThanOrEqual(0);
          expect(rect.y).toBeGreaterThanOrEqual(0);
          expect(rect.x + rect.width).toBeLessThanOrEqual(BUDDY_PIXEL_WIDTH);
          expect(rect.y + rect.height).toBeLessThanOrEqual(
            BUDDY_PIXEL_HEIGHT,
          );
        }
        signatures.add(buddyFrameSignature(frame));
      }
      expect(signatures.size).toBeGreaterThanOrEqual(4);
    }
  });

  it('makes every regional Buddy physique control visually observable', () => {
    const species = getBuddySpeciesById('brawny-bear');
    const design = BUDDY_CHARACTER_DESIGNS.find(
      (entry) => entry.speciesId === species.id,
    )!;
    const fields = [
      'shoulderEmphasisId',
      'chestEmphasisId',
      'backEmphasisId',
      'armEmphasisId',
      'coreEmphasisId',
      'legEmphasisId',
    ] as const;
    for (const field of fields) {
      const restrained = renderBuddyPixelFrame(
        species,
        {
          ...design.defaultCosmetics,
          physique: {
            ...design.defaultCosmetics.physique,
            [field]: BUDDY_EMPHASIS_OPTIONS[0]!.id,
          },
        },
        field === 'backEmphasisId' ? 'back' : 'front',
        'front-flex',
        0,
      );
      const pronounced = renderBuddyPixelFrame(
        species,
        {
          ...design.defaultCosmetics,
          physique: {
            ...design.defaultCosmetics.physique,
            [field]: BUDDY_EMPHASIS_OPTIONS[2]!.id,
          },
        },
        field === 'backEmphasisId' ? 'back' : 'front',
        'front-flex',
        0,
      );
      expect(buddyFrameSignature(pronounced)).not.toBe(
        buddyFrameSignature(restrained),
      );
    }
  });

  it('normalizes species appendages and accessory slots safely', () => {
    for (const species of BUDDY_SPECIES) {
      const design = BUDDY_CHARACTER_DESIGNS.find(
        (entry) => entry.speciesId === species.id,
      )!;
      const normalized = normalizeBuddyCosmetics(species.id, {
        ...design.defaultCosmetics,
        appendageVariantId: 'another-species-appendage',
        accessoryIds: [
          'accessory-gloves',
          'accessory-wraps',
          'accessory-elbow-sleeves',
          'accessory-knee-sleeves',
          'accessory-victory-medal',
        ],
      });
      expect(
        design.appendageOptions.some(
          (entry) => entry.id === normalized.appendageVariantId,
        ),
      ).toBe(true);
      const selectedSlots = normalized.accessoryIds
        .map(
          (id) =>
            design.accessoryOptions.find((option) => option.id === id)?.slot,
        )
        .filter(Boolean);
      expect(new Set(selectedSlots).size).toBe(selectedSlots.length);
      expect(normalized.accessoryIds.length).toBeLessThanOrEqual(4);
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
      brambliftDefault: 'feeb6260',
      brambliftBroadVictory: '179901a4',
      prismRareEntrance: '1828b3f0',
      manyfoldCompactTraining: '748bc12b',
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
    expect(MUSCULAR_BODY_ARCHETYPES).toHaveLength(16);
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

  it('gives every boss five readable presentation tiers without scaling the frame', () => {
    for (const design of BOSS_CHARACTER_DESIGNS) {
      const species = getBuddySpeciesById(design.speciesId);
      expect(design.presentationTiers.map((entry) => entry.tier)).toEqual([
        'normal',
        'pumped',
        'overload',
        'final-round',
        'defeated',
      ]);
      const signatures = new Set(
        design.presentationTiers.map((tier) =>
          buddyFrameSignature(
            renderBuddyPixelFrame(
              species,
              bossBuddyCosmetics(design, tier.tier),
              'front',
              tier.poseId,
              0,
            ),
          ),
        ),
      );
      expect(signatures.size).toBe(5);
      for (const tier of design.presentationTiers) {
        const frame = renderBuddyPixelFrame(
          species,
          bossBuddyCosmetics(design, tier.tier),
          'front',
          tier.poseId,
          0,
        );
        expect(frame.width).toBe(BUDDY_PIXEL_WIDTH);
        expect(frame.height).toBe(BUDDY_PIXEL_HEIGHT);
      }
    }
  });

  it('keeps seeded route trainers stable and restricted to valid regional outfits', () => {
    const outfitIds = new Set(NPC_OUTFIT_COMBINATIONS.map((entry) => entry.id));
    const firstPass = NPC_CHARACTER_SEEDS.map(createNpcCharacterDesign);
    const secondPass = NPC_CHARACTER_SEEDS.map(createNpcCharacterDesign);
    expect(secondPass).toEqual(firstPass);
    for (const trainer of firstPass) {
      expect(outfitIds.has(trainer.signatureOutfitId)).toBe(true);
      expect(trainer.regionalMuscleEmphasis.length).toBeGreaterThanOrEqual(2);
      expect(trainer.warmupAnimationId).toContain(trainer.id);
      expect(trainer.sponsorPatch.id).toContain(trainer.id);
    }
    expect(new Set(firstPass.map(trainerGeometrySignature)).size).toBe(
      firstPass.length,
    );
  });

  it('gives every important human and boss explicit strength-design metadata', () => {
    const importantHumans = [
      ...GYM_LEADER_CHARACTER_DESIGNS,
      ...RIVAL_CHARACTER_DESIGNS,
    ];
    const archetypeIds = new Set(
      MUSCULAR_BODY_ARCHETYPES.map((archetype) => archetype.id),
    );
    const muscleIds = new Set(
      TRAINER_BUILD_ATTRIBUTES.map((attribute) => attribute.id),
    );
    const poseIds = new Set(
      TRAINER_POSE_DEFINITIONS.map((pose) => pose.id),
    );

    for (const character of importantHumans) {
      expect(archetypeIds.has(character.appearance.archetypeId)).toBe(true);
      expect(muscleIds.has(character.primaryMuscleEmphasis)).toBe(true);
      expect(poseIds.has(character.signaturePose)).toBe(true);
      expect(character.idleAnimationId.length).toBeGreaterThan(4);
      expect(character.warmupAnimationId.length).toBeGreaterThan(4);
      expect(character.lossReactionId.length).toBeGreaterThan(4);
      expect(character.regionalMuscleEmphasis.length).toBeGreaterThanOrEqual(2);
      expect(character.signatureClothing.length).toBeGreaterThan(4);
      expect(character.signatureEquipment.length).toBeGreaterThan(4);
      expect(character.alternateLateGameOutfit.id.length).toBeGreaterThan(4);
      expect(character.sponsorPatch.id.length).toBeGreaterThan(4);
      expect(character.trainingPhilosophy.length).toBeGreaterThan(12);
    }
    expect(
      new Set(importantHumans.map(trainerGeometrySignature)).size,
    ).toBeGreaterThanOrEqual(8);

    for (const boss of BOSS_CHARACTER_DESIGNS) {
      expect(boss.buildLabel.length).toBeGreaterThan(4);
      expect(boss.primaryMuscleEmphasis.length).toBeGreaterThan(2);
      expect(boss.signaturePoseId.length).toBeGreaterThan(4);
      expect(boss.signatureEquipment.length).toBeGreaterThan(4);
      expect(boss.trainingPhilosophy.length).toBeGreaterThan(12);
      expect(boss.presentationTiers).toHaveLength(5);
    }
  });
});
