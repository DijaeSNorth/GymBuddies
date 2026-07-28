export type MusicZoneState = 'home' | 'ambient' | 'fight' | 'boss';

export type MusicIntensity = 'home' | 'starter' | 'higher';

export type AudioCueId =
  | 'train'
  | 'steroid'
  | 'matchStart'
  | 'moveGood'
  | 'moveBad'
  | 'catchAlmost'
  | 'catchWin'
  | 'bossAlert'
  | 'teamFull'
  | 'escape'
  | 'zoneShift';

export type SaveAudioSettings = {
  enabled: boolean;
  musicVolume: number;
  sfxVolume: number;
};

export type AudioCueDefinition = {
  id: AudioCueId;
  label: string;
};

export type MusicProfile = {
  id: MusicIntensity;
  ambient: number[];
  scout: number[];
  boss: number[];
  interval: number;
};

export type AudioEngine = {
  context: AudioContext;
  masterGain: GainNode;
  musicGain: GainNode;
  sfxGain: GainNode;
  musicTicker: ReturnType<typeof setInterval> | null;
  enabled: boolean;
  zone: MusicZoneState;
  intensity: MusicIntensity;
  step: number;
  stepNotes: number[];
  setEnabled: (value: boolean) => void;
  setVolumes: (music: number, sfx: number) => void;
  startMusic: (zone: MusicZoneState, intensity: MusicIntensity) => void;
  stopMusic: () => void;
  pulseTone: (frequency: number, duration: number, gain: number, wave?: OscillatorType) => void;
  emitSfx: (event: AudioCueId, intensity?: number) => void;
  dispose: () => void;
};
