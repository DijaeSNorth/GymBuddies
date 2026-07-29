export type RetroWaveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

export type MusicTrackId =
  | 'home-gym'
  | 'route-exploration'
  | 'wild-encounter'
  | 'boss-challenge'
  | 'training';

export type AudioCueId =
  | 'train'
  | 'rep-success'
  | 'rep-failure'
  | 'spot-now'
  | 'capture-success'
  | 'capture-failure'
  | 'level-up'
  | 'rare-encounter'
  | 'menu-navigate'
  | 'route-transition'
  | 'wild-alert'
  | 'boss-alert'
  | 'capture-advance'
  | 'capture-resisted'
  | 'team-full'
  | 'recovery';

export type SaveAudioSettings = {
  enabled: boolean;
  musicVolume: number;
  sfxVolume: number;
};

export type AudioToneDefinition = {
  frequency: number;
  durationMs: number;
  gain: number;
  wave: RetroWaveform;
  offsetMs?: number;
  slideToFrequency?: number;
};

export type AudioCueDefinition = {
  id: AudioCueId;
  label: string;
  description: string;
  tones: AudioToneDefinition[];
};

export type MusicPatternStep = {
  tones: AudioToneDefinition[];
};

export type MusicTrackDefinition = {
  id: MusicTrackId;
  label: string;
  description: string;
  stepMs: number;
  steps: MusicPatternStep[];
};

export type AudioEngineSnapshot = {
  supported: boolean;
  unlocked: boolean;
  enabled: boolean;
  hidden: boolean;
  disposed: boolean;
  currentTrackId: MusicTrackId | null;
  activeNodeCount: number;
  musicLoopStarts: number;
};

export type AudioEngine = {
  unlock: () => Promise<boolean>;
  setEnabled: (enabled: boolean) => void;
  setVolumes: (music: number, sfx: number) => void;
  setMusic: (trackId: MusicTrackId) => void;
  stopMusic: () => void;
  emitSfx: (cueId: AudioCueId, intensity?: number) => void;
  setPageHidden: (hidden: boolean) => void;
  getSnapshot: () => AudioEngineSnapshot;
  dispose: () => void;
};
