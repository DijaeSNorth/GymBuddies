import { BOSS_MAX_MS, BOSS_MIN_MS } from '../content/bosses';
import {
  FANCY_NAMES,
  STARTER_BUDDIES,
  getBuddySpeciesById,
} from '../content/buddies';
import { GYMS, STARTING_ZONE_ID } from '../content/gyms';
import { FALLBACK_UNLOCKED_ZONES } from '../content/routes';
import {
  CURRENT_SAVE_SCHEMA_VERSION,
  SAVE_VERSION,
} from '../content/save';
import { DEFAULT_KEYBOARD_BINDINGS } from '../input/actionMap';
import {
  DEFAULT_TRAINER_PRESET_ID,
  getTrainerPresetById,
} from '../content/trainer';
import {
  cloneTrainerAppearance,
  trainerAppearanceLegacyPalette,
} from '../content/trainerAppearance';
import { cloneTrainerAppearancePresets } from '../systems/trainerAppearance';
import { createBossSchedule } from '../systems/bossScheduling';
import { createSeedBuddy } from '../systems/buddyProgression';
import { createRandomState } from '../systems/random';
import type {
  BossSchedule,
  SaveAudioSettings,
  SaveAccessibilitySettings,
  SaveData,
} from '../types';

export function getDefaultAccessibilitySettings(
  prefersReducedMotion?: boolean,
): SaveAccessibilitySettings {
  const reducedMotion =
    prefersReducedMotion ??
    (typeof window !== 'undefined' &&
      Boolean(
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
      ));
  return {
    reducedMotion,
    screenShake: !reducedMotion,
    highContrast: false,
    sustainedInputMode: 'hold',
    textSpeed: 'standard',
  };
}

function createStarterTeam() {
  let randomState = createRandomState(0x47594d42);
  return STARTER_BUDDIES.map((starter) => {
    const result = createSeedBuddy({
      seed: starter.seed,
      species: getBuddySpeciesById(starter.speciesId),
      level: starter.level,
      names: FANCY_NAMES,
      randomState,
    });
    randomState = result.randomState;
    return result.buddy;
  });
}

export function createDefaultSaveData(options?: {
  accessibility?: SaveAccessibilitySettings;
  audio?: SaveAudioSettings;
}): SaveData {
  const preset = getTrainerPresetById(DEFAULT_TRAINER_PRESET_ID).profile;
  const starterTeam = createStarterTeam();
  const defaultBossDelay = Math.round((BOSS_MIN_MS + BOSS_MAX_MS) / 2);

  return {
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    version: SAVE_VERSION,
    trainingFatigue: 0,
    workoutMomentum: 0,
    deloadTokens: 0,
    captureBattleSpeed: 'standard',
    machineTrainingHistory: {
      lastMachineId: null,
      repeatedUses: 0,
      masteryByMachineId: {},
    },
    hasStarterSet: false,
    unlockedZoneIds: [...FALLBACK_UNLOCKED_ZONES],
    visitedZoneIds: ['home'],
    trainer: {
      ...preset,
      ...trainerAppearanceLegacyPalette(preset.appearance),
      muscles: { ...preset.muscles },
      appearance: cloneTrainerAppearance(preset.appearance),
      appearancePresets: cloneTrainerAppearancePresets(
        preset.appearancePresets,
      ),
      name: 'Trainer',
    },
    trainerEquipmentBonuses: {
      power: 0,
      technique: 0,
      endurance: 0,
      mobility: 0,
      recovery: 0,
    },
    steroids: 3,
    activeIndex: 0,
    activeZoneId: STARTING_ZONE_ID,
    team: starterTeam,
    seenDex: starterTeam.map((buddy) => buddy.creature.dex),
    caughtDex: starterTeam.map((buddy) => buddy.creature.dex),
    selectedMachineByZone: Object.fromEntries(
      GYMS.map((zone) => [zone.id, zone.defaultMachineId]),
    ),
    bossGameplayTimeMs: 0,
    bossSchedules: Object.fromEntries(
      GYMS.map((zone) => [
        zone.id,
        createBossSchedule(
          zone.id === STARTING_ZONE_ID ? 0 : defaultBossDelay,
        ),
      ]),
    ) as Record<string, BossSchedule>,
    tutorialStep: 0,
    audio:
      options?.audio ?? {
        enabled: true,
        musicVolume: 0.5,
        sfxVolume: 0.82,
      },
    accessibility:
      options?.accessibility ?? getDefaultAccessibilitySettings(),
    input: {
      keyboardBindings: Object.fromEntries(
        Object.entries(DEFAULT_KEYBOARD_BINDINGS).map(([action, codes]) => [
          action,
          [...codes],
        ]),
      ) as SaveData['input']['keyboardBindings'],
    },
  };
}
