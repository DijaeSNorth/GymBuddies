import type { SaveAudioSettings } from './audio';
import type { BossSchedule } from './boss';
import type { Buddy } from './buddy';
import type { TrainerProfile } from './trainer';

export type SaveData = {
  version: string;
  trainingFatigue: number;
  workoutMomentum: number;
  deloadTokens: number;
  hasStarterSet: boolean;
  unlockedZoneIds: string[];
  trainer: TrainerProfile;
  steroids: number;
  activeIndex: number;
  activeZoneId: string;
  team: Buddy[];
  seenDex: number[];
  caughtDex: number[];
  selectedMachineByZone: Record<string, string>;
  bossSchedules: Record<string, BossSchedule>;
  tutorialStep: number;
  audio: SaveAudioSettings;
};
