import type { SaveAudioSettings } from './audio';
import type { BossSchedule } from './boss';
import type { Buddy } from './buddy';
import type { CaptureBattleSpeed } from './capture';
import type {
  SaveInputSettings,
  SustainedInputMode,
  TextSpeed,
} from './input';
import type {
  TrainerEquipmentBonuses,
  TrainerProfile,
} from './trainer';
import type { MachineTrainingHistory } from './training';
import type { TrainerVisualProgressionState } from './visualProgression';

export type SaveAccessibilitySettings = {
  reducedMotion: boolean;
  screenShake: boolean;
  highContrast: boolean;
  sustainedInputMode: SustainedInputMode;
  textSpeed: TextSpeed;
};

export type SaveData = {
  schemaVersion: 19;
  version: 'v19';
  trainingFatigue: number;
  workoutMomentum: number;
  deloadTokens: number;
  captureBattleSpeed: CaptureBattleSpeed;
  machineTrainingHistory: MachineTrainingHistory;
  visualProgression: TrainerVisualProgressionState;
  hasStarterSet: boolean;
  unlockedZoneIds: string[];
  visitedZoneIds: string[];
  trainer: TrainerProfile;
  trainerEquipmentBonuses: TrainerEquipmentBonuses;
  steroids: number;
  activeIndex: number;
  activeZoneId: string;
  team: Buddy[];
  seenDex: number[];
  caughtDex: number[];
  selectedMachineByZone: Record<string, string>;
  bossGameplayTimeMs: number;
  bossSchedules: Record<string, BossSchedule>;
  tutorialStep: number;
  audio: SaveAudioSettings;
  accessibility: SaveAccessibilitySettings;
  input: SaveInputSettings;
};

export type SerializedBuddyState = Omit<Buddy, 'creature'> & {
  speciesId: string;
};

export type SerializedSaveState = Omit<SaveData, 'team'> & {
  team: SerializedBuddyState[];
};

export type SaveExportEnvelope = {
  format: 'gym-buddies-save';
  schemaVersion: 19;
  savedAt: string;
  state: SerializedSaveState;
};
