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
  MAX_SAVED_APPEARANCE_PRESETS,
  TRAINER_BUILD_ATTRIBUTES,
  TRAINER_PHYSIQUE_PRESETS,
  TRAINER_RANDOMIZATION_FILTERS,
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
  exportTrainerAppearanceJson,
  importTrainerAppearanceJson,
  normalizeTrainerAppearance,
  normalizeTrainerAppearancePresets,
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
  it('provides 26 editable physique presets and 61 independent build controls', () => {
    expect(TRAINER_PHYSIQUE_PRESETS).toHaveLength(26);
    expect(TRAINER_BUILD_ATTRIBUTES).toHaveLength(61);
    expect(
      getTrainerPhysiquePresetById(DEFAULT_TRAINER_PHYSIQUE_PRESET_ID),
    ).toBeDefined();
    TRAINER_PHYSIQUE_PRESETS.forEach((preset) => {
      expect(preset.id).toBeTruthy();
      expect(Object.keys(preset.build)).toHaveLength(61);
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

  it('keeps every controlled randomization filter valid and muscular', () => {
    for (const [filterIndex, filter] of TRAINER_RANDOMIZATION_FILTERS.entries()) {
      for (let sample = 0; sample < 12; sample += 1) {
        const appearance = randomizeTrainerAppearance(
          filterIndex * 100 + sample + 1,
          filter.id,
        );
        expect(validateTrainerAppearance(appearance)).toEqual([]);
        expect(appearance.build.shoulderWidth).toBeGreaterThanOrEqual(5);
        expect(appearance.build.chestSize).toBeGreaterThanOrEqual(5);
        expect(appearance.build.quadSize).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it('normalizes minimum and maximum values for every new regional control', () => {
    const advanced = TRAINER_BUILD_ATTRIBUTES.slice(22);
    expect(advanced).toHaveLength(39);
    for (const attribute of advanced) {
      for (const value of [0, 10]) {
        const appearance = cloneTrainerAppearance(DEFAULT_TRAINER_APPEARANCE);
        appearance.build[attribute.id] = value;
        const normalized = normalizeTrainerAppearance(appearance);
        expect(normalized.appearance.build[attribute.id]).toBe(value);
        expect(normalized.issues).toEqual([]);
      }
    }
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

  it('serializes a completed profile through save schema v19', () => {
    const draft = createTrainerCreationDraft(profile);
    expect(validateTrainerCreationDraft(draft)).toEqual([]);
    const savedProfile = trainerProfileFromCreationDraft(draft);
    expect(savedProfile.appearance.version).toBe(3);
    expect(savedProfile.appearance).toEqual(draft.appearance);
    expect(SAVE_VERSION).toBe('v19');
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

  it('caps, de-duplicates, and repairs saved looks by stable ID', () => {
    const raw = Array.from(
      { length: MAX_SAVED_APPEARANCE_PRESETS + 2 },
      (_, index) => ({
        id: index < 2 ? 'duplicate-look' : `look-${index}`,
        name: `Look ${index}`,
        appearance: {
          ...cloneTrainerAppearance(DEFAULT_TRAINER_APPEARANCE),
          outfit: {
            ...DEFAULT_TRAINER_APPEARANCE.outfit,
            topId: index === 3 ? 'removed-top' : 'tank-stringer',
          },
        },
      }),
    );
    const normalized = normalizeTrainerAppearancePresets(raw);

    expect(normalized.presets).toHaveLength(MAX_SAVED_APPEARANCE_PRESETS);
    expect(new Set(normalized.presets.map(({ id }) => id)).size).toBe(
      MAX_SAVED_APPEARANCE_PRESETS,
    );
    expect(normalized.presets[3]?.appearance.outfit.topId).toBe(
      DEFAULT_TRAINER_APPEARANCE.outfit.topId,
    );
    expect(normalized.issues.length).toBeGreaterThan(1);
  });

  it('exports and imports appearance-only JSON without progression data', () => {
    const appearance = cloneTrainerAppearance(DEFAULT_TRAINER_APPEARANCE);
    appearance.build.latFlare = 10;
    appearance.outfit.topId = 'tank-stringer';
    const json = exportTrainerAppearanceJson(
      appearance,
      '2026-07-29T00:00:00.000Z',
    );
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const imported = importTrainerAppearanceJson(json);

    expect(parsed).not.toHaveProperty('muscles');
    expect(parsed).not.toHaveProperty('team');
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.appearance).toEqual(appearance);
    expect(imported.issues).toEqual([]);
  });

  it('repairs removed IDs in older appearance-only exports', () => {
    const legacy = cloneTrainerAppearance(DEFAULT_TRAINER_APPEARANCE) as unknown as {
      version: number;
      outfit: { topId: string };
    };
    legacy.version = 2;
    legacy.outfit.topId = 'retired-stringer';
    const imported = importTrainerAppearanceJson(
      JSON.stringify({
        format: 'gym-buddies-appearance',
        version: 2,
        exportedAt: '2026-07-29T00:00:00.000Z',
        appearance: legacy,
      }),
    );

    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.appearance.version).toBe(3);
    expect(imported.appearance.outfit.topId).toBe(
      DEFAULT_TRAINER_APPEARANCE.outfit.topId,
    );
    expect(imported.issues.length).toBeGreaterThan(0);
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
