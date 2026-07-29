import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TRAINER_BODY_PRESET_ID,
  TRAINER_BODY_PRESETS,
  TRAINER_MUSCLES,
  getTrainerBodyPresetById,
} from '../game/content/trainer';
import {
  DEFAULT_TRAINER_APPEARANCE,
  DEFAULT_TRAINER_PHYSIQUE_PRESET_ID,
  TRAINER_BUILD_ATTRIBUTES,
  TRAINER_PHYSIQUE_PRESETS,
  cloneTrainerAppearance,
  getTrainerPhysiquePresetById,
} from '../game/content/trainerAppearance';
import { SAVE_VERSION } from '../game/content/save';
import { createDefaultSaveData } from '../game/save/saveDefaults';
import {
  applyTrainerBodyPreset,
  applyTrainerPhysiquePreset,
  createTrainerCreationDraft,
  replaceTrainerDraftAppearance,
  saveAppearancePresetToDraft,
  saveTrainerProfileToJourney,
  trainerProfileFromCreationDraft,
  updateTrainerDraftMuscle,
  validateTrainerCreationDraft,
} from '../game/systems/trainerCreation';
import {
  normalizeTrainerAppearance,
  randomizeTrainerAppearance,
  validateTrainerAppearance,
} from '../game/systems/trainerAppearance';
import type { SaveData, TrainerProfile } from '../game/types';

const profile: TrainerProfile = {
  name: 'Ari',
  hair: '#17262b',
  skin: '#bd7d57',
  top: '#3787c8',
  glove: '#f2c14e',
  shoes: '#eef2d0',
  appearance: cloneTrainerAppearance(DEFAULT_TRAINER_APPEARANCE),
  appearancePresets: [],
  muscles: {
    shoulders: 3,
    chest: 3,
    arms: 3,
    triceps: 3,
    back: 3,
    core: 3,
    quads: 3,
    calves: 3,
  },
};

describe('trainer creation foundation', () => {
  it('provides eight cosmetic physique presets and 22 independent build controls', () => {
    expect(TRAINER_PHYSIQUE_PRESETS).toHaveLength(8);
    expect(TRAINER_BUILD_ATTRIBUTES).toHaveLength(22);
    expect(
      getTrainerPhysiquePresetById(DEFAULT_TRAINER_PHYSIQUE_PRESET_ID),
    ).toBeDefined();
    TRAINER_PHYSIQUE_PRESETS.forEach((preset) => {
      expect(preset.id).toBeTruthy();
      expect(Object.keys(preset.build)).toHaveLength(22);
      Object.values(preset.build).forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(10);
      });
    });
  });

  it('preserves the four gameplay presets as separate progression data', () => {
    expect(TRAINER_BODY_PRESETS).toHaveLength(4);
    expect(
      getTrainerBodyPresetById(DEFAULT_TRAINER_BODY_PRESET_ID),
    ).toBeDefined();
    TRAINER_BODY_PRESETS.forEach((preset) => {
      expect(Object.keys(preset.muscles)).toHaveLength(8);
    });
  });

  it('applies a gameplay preset without changing cosmetic appearance', () => {
    const draft = createTrainerCreationDraft(profile);
    const preset = getTrainerBodyPresetById('control-specialist');
    const next = applyTrainerBodyPreset(draft, preset);

    expect(next.name).toBe(profile.name);
    expect(next.appearance).toEqual(draft.appearance);
    expect(next.appearance).not.toBe(draft.appearance);
    expect(next.muscles).toEqual(preset.muscles);
  });

  it('applies a cosmetic physique preset without changing gameplay muscles', () => {
    const draft = createTrainerCreationDraft(profile);
    const preset = getTrainerPhysiquePresetById('heavy-powerlifter');
    const next = applyTrainerPhysiquePreset(draft, preset);

    expect(next.appearance.build).toEqual(preset.build);
    expect(next.muscles).toEqual(draft.muscles);
    expect(next.physiquePresetId).toBe(preset.id);
  });

  it('keeps cosmetic and gameplay edits isolated and immutable', () => {
    const draft = createTrainerCreationDraft(profile);
    const cosmetic = cloneTrainerAppearance(draft.appearance);
    cosmetic.build.shoulderWidth = 10;
    cosmetic.face.shapeId = 'diamond-defined';
    const cosmeticEdit = replaceTrainerDraftAppearance(draft, cosmetic);

    expect(cosmeticEdit.appearance.build.shoulderWidth).toBe(10);
    expect(cosmeticEdit.muscles).toEqual(draft.muscles);
    expect(draft.appearance.build.shoulderWidth).not.toBe(10);

    const statEdit = updateTrainerDraftMuscle(
      cosmeticEdit,
      'shoulders',
      cosmeticEdit.muscles.shoulders + 1,
    );
    expect(statEdit.muscles.shoulders).toBe(
      cosmeticEdit.muscles.shoulders + 1,
    );
    expect(statEdit.appearance).toEqual(cosmeticEdit.appearance);
    expect(statEdit.bodyPresetId).toBeNull();
  });

  it('randomizes deterministically and always produces a valid muscular appearance', () => {
    const first = randomizeTrainerAppearance(12345);
    const second = randomizeTrainerAppearance(12345);
    const different = randomizeTrainerAppearance(54321);

    expect(first).toEqual(second);
    expect(first).not.toEqual(different);
    expect(validateTrainerAppearance(first)).toEqual([]);
    expect(first.build.shoulderWidth).toBeGreaterThanOrEqual(5);
    expect(first.build.chestSize).toBeGreaterThanOrEqual(5);
    expect(first.build.bicepsSize).toBeGreaterThanOrEqual(5);
    expect(first.build.quadSize).toBeGreaterThanOrEqual(5);
  });

  it('repairs missing or removed stable option IDs with safe defaults', () => {
    const malformed = cloneTrainerAppearance(DEFAULT_TRAINER_APPEARANCE);
    malformed.face.shapeId = 'removed-face';
    malformed.hair.styleId = 'removed-hair';
    malformed.outfit.topId = 'removed-top';
    const result = normalizeTrainerAppearance(malformed);

    expect(result.appearance.face.shapeId).toBe(
      DEFAULT_TRAINER_APPEARANCE.face.shapeId,
    );
    expect(result.appearance.hair.styleId).toBe(
      DEFAULT_TRAINER_APPEARANCE.hair.styleId,
    );
    expect(result.appearance.outfit.topId).toBe(
      DEFAULT_TRAINER_APPEARANCE.outfit.topId,
    );
    expect(result.issues).toHaveLength(3);
  });

  it('serializes a completed profile through save schema v16', () => {
    const draft = createTrainerCreationDraft(profile);
    expect(validateTrainerCreationDraft(draft)).toEqual([]);
    const savedProfile = trainerProfileFromCreationDraft(draft);
    expect(savedProfile.appearance.version).toBe(2);
    expect(savedProfile.appearance).toEqual(draft.appearance);
    expect(SAVE_VERSION).toBe('v16');
    expect(JSON.parse(JSON.stringify(savedProfile))).toEqual(savedProfile);

    expect(
      validateTrainerCreationDraft({ ...draft, name: '   ' }),
    ).toContain('Enter a trainer name.');
  });

  it('stores appearance presets by stable ID and without sharing mutable data', () => {
    const draft = createTrainerCreationDraft(profile);
    const next = saveAppearancePresetToDraft(draft, {
      id: 'player-look.power-blue',
      name: 'Power Blue',
      appearance: draft.appearance,
    });

    expect(next.appearancePresets[0]?.id).toBe('player-look.power-blue');
    expect(next.appearancePresets[0]?.appearance).toEqual(draft.appearance);
    expect(next.appearancePresets[0]?.appearance).not.toBe(draft.appearance);
  });

  it('saves an edited appearance without resetting journey progression', () => {
    const save: SaveData = {
      ...createDefaultSaveData(),
      trainingFatigue: 37,
      workoutMomentum: 12,
      deloadTokens: 2,
      hasStarterSet: true,
      unlockedZoneIds: ['home', 'starter-a', 'starter-b', 'higher-1'],
      visitedZoneIds: ['home', 'starter-a', 'starter-b'],
      trainer: profile,
      steroids: 5,
      activeZoneId: 'starter-b',
      seenDex: [1, 2],
      caughtDex: [1],
      tutorialStep: 3,
    };
    const appearance = cloneTrainerAppearance(profile.appearance);
    appearance.colors.topPrimaryId = 'plum';
    const draft = replaceTrainerDraftAppearance(
      createTrainerCreationDraft(profile),
      appearance,
    );
    const next = saveTrainerProfileToJourney(save, draft);
    const { trainer: previousTrainer, ...previousJourney } = save;
    const { trainer: nextTrainer, ...nextJourney } = next;

    expect(nextTrainer.appearance.colors.topPrimaryId).toBe('plum');
    expect(nextJourney).toEqual(previousJourney);
    expect(previousTrainer.appearance.colors.topPrimaryId).toBe(
      profile.appearance.colors.topPrimaryId,
    );
  });

  it('describes every gameplay attribute without body-shaming language', () => {
    expect(TRAINER_MUSCLES).toHaveLength(8);
    TRAINER_MUSCLES.forEach((attribute) => {
      expect(attribute.detail).toMatch(/Improves|Supports/);
      expect(attribute.detail.toLowerCase()).not.toMatch(
        /diagnos|medical|healthy|unhealthy|obese|underweight|overweight/,
      );
    });
  });
});
