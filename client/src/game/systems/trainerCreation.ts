import { MAX_MUSCLE_LEVEL } from '../content/trainer';
import {
  DEFAULT_TRAINER_APPEARANCE,
  MAX_SAVED_APPEARANCE_PRESETS,
  cloneTrainerAppearance,
  trainerAppearanceLegacyPalette,
} from '../content/trainerAppearance';
import type {
  TrainerAppearance,
  TrainerAppearanceCategory,
  TrainerAppearancePreset,
  TrainerBodyPreset,
  TrainerCreationDraft,
  TrainerMuscleId,
  TrainerPhysiquePreset,
  TrainerProfile,
  SaveData,
} from '../types';
import { clamp } from './math';
import {
  cloneTrainerAppearancePresets,
  normalizeTrainerAppearance,
  validateTrainerAppearance,
} from './trainerAppearance';

/** Converts the versioned save profile into a creation-only draft with separated cosmetics. */
export function createTrainerCreationDraft(
  profile: TrainerProfile,
  bodyPresetId: string | null = null,
): TrainerCreationDraft {
  return {
    name: profile.name,
    appearance: cloneTrainerAppearance(
      profile.appearance ??
        normalizeTrainerAppearance(undefined).appearance,
    ),
    appearancePresets: cloneTrainerAppearancePresets(
      profile.appearancePresets ?? [],
    ),
    muscles: { ...profile.muscles },
    bodyPresetId,
    physiquePresetId: null,
  };
}

/** Converts the separated creation draft back to the serializable v12 trainer profile. */
export function trainerProfileFromCreationDraft(
  draft: TrainerCreationDraft,
): TrainerProfile {
  const appearance = normalizeTrainerAppearance(draft.appearance).appearance;
  return {
    name: draft.name.trim() || 'Trainer',
    ...trainerAppearanceLegacyPalette(appearance),
    appearance,
    appearancePresets: cloneTrainerAppearancePresets(
      draft.appearancePresets,
    ),
    muscles: Object.fromEntries(
      Object.entries(draft.muscles).map(([key, value]) => [
        key,
        clamp(Math.round(Number.isFinite(value) ? value : 0), 0, MAX_MUSCLE_LEVEL),
      ]),
    ) as TrainerProfile['muscles'],
  };
}

/** Body presets change fictional gameplay attributes only; name and cosmetics are preserved. */
export function applyTrainerBodyPreset(
  draft: TrainerCreationDraft,
  preset: TrainerBodyPreset,
): TrainerCreationDraft {
  return {
    ...draft,
    appearance: cloneTrainerAppearance(draft.appearance),
    appearancePresets: cloneTrainerAppearancePresets(
      draft.appearancePresets,
    ),
    bodyPresetId: preset.id,
    muscles: { ...preset.muscles },
  };
}

export function applyTrainerPhysiquePreset(
  draft: TrainerCreationDraft,
  preset: TrainerPhysiquePreset,
): TrainerCreationDraft {
  return {
    ...draft,
    appearance: {
      ...draft.appearance,
      build: { ...preset.build },
    },
    physiquePresetId: preset.id,
  };
}

export function replaceTrainerDraftAppearance(
  draft: TrainerCreationDraft,
  appearance: TrainerAppearance,
): TrainerCreationDraft {
  return {
    ...draft,
    appearance: cloneTrainerAppearance(appearance),
    physiquePresetId: null,
  };
}

export function resetTrainerAppearanceCategory(
  draft: TrainerCreationDraft,
  category: TrainerAppearanceCategory,
): TrainerCreationDraft {
  if (category === 'preview') return draft;
  if (category === 'build') {
    return {
      ...draft,
      appearance: {
        ...draft.appearance,
        build: { ...DEFAULT_TRAINER_APPEARANCE.build },
      },
      physiquePresetId: null,
    };
  }
  return {
    ...draft,
    appearance: {
      ...draft.appearance,
      [category]: {
        ...DEFAULT_TRAINER_APPEARANCE[category],
      },
    },
  };
}

export function saveAppearancePresetToDraft(
  draft: TrainerCreationDraft,
  preset: TrainerAppearancePreset,
): TrainerCreationDraft {
  const existing = draft.appearancePresets.filter(
    (entry) => entry.id !== preset.id,
  );
  return {
    ...draft,
    appearancePresets: [
      ...existing,
      {
        ...preset,
        name: preset.name.trim().slice(0, 24) || 'Saved Look',
        appearance: cloneTrainerAppearance(preset.appearance),
      },
    ].slice(-MAX_SAVED_APPEARANCE_PRESETS),
  };
}

export function removeAppearancePresetFromDraft(
  draft: TrainerCreationDraft,
  presetId: string,
): TrainerCreationDraft {
  return {
    ...draft,
    appearancePresets: draft.appearancePresets.filter(
      (preset) => preset.id !== presetId,
    ),
  };
}

export function updateTrainerDraftMuscle(
  draft: TrainerCreationDraft,
  key: TrainerMuscleId,
  value: number,
): TrainerCreationDraft {
  return {
    ...draft,
    bodyPresetId: null,
    muscles: {
      ...draft.muscles,
      [key]: clamp(
        Math.round(Number.isFinite(value) ? value : 0),
        0,
        MAX_MUSCLE_LEVEL,
      ),
    },
  };
}

export function validateTrainerCreationDraft(draft: TrainerCreationDraft) {
  const issues: string[] = [];
  const name = draft.name.trim();
  if (!name) issues.push('Enter a trainer name.');
  if (name.length > 14) issues.push('Trainer names can use up to 14 characters.');

  issues.push(...validateTrainerAppearance(draft.appearance));
  if (draft.appearancePresets.length > MAX_SAVED_APPEARANCE_PRESETS) {
    issues.push(
      `Save up to ${MAX_SAVED_APPEARANCE_PRESETS} trainer appearance presets.`,
    );
  }

  (Object.entries(draft.muscles) as Array<[TrainerMuscleId, number]>).forEach(
    ([key, value]) => {
      if (!Number.isFinite(value) || value < 0 || value > MAX_MUSCLE_LEVEL) {
        issues.push(
          `Trainer ${key} must be between 0 and ${MAX_MUSCLE_LEVEL}.`,
        );
      }
    },
  );
  return issues;
}

/** Replaces only the trainer profile, preserving every other serializable journey field. */
export function saveTrainerProfileToJourney(
  save: SaveData,
  draft: TrainerCreationDraft,
): SaveData {
  return {
    ...save,
    trainer: trainerProfileFromCreationDraft(draft),
  };
}
