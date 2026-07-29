import {
  AUDIO_CUE_BY_ID,
  MUSIC_TRACK_BY_ID,
} from '../content/audio';
import type {
  AudioCueId,
  AudioEngine,
  AudioEngineSnapshot,
  AudioToneDefinition,
  MusicTrackId,
} from '../types';

type TimerHandle = ReturnType<typeof globalThis.setInterval>;

type ManagedTone = {
  gain: GainNode;
  kind: 'music' | 'sfx';
  oscillator: OscillatorNode;
};

export type RetroAudioEngineOptions = {
  contextFactory?: () => AudioContext;
  setIntervalFn?: (
    callback: () => void,
    delayMs: number,
  ) => TimerHandle;
  clearIntervalFn?: (handle: TimerHandle) => void;
};

function clampVolume(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function browserContextFactory(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextConstructor =
    window.AudioContext ??
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;
  return AudioContextConstructor ? new AudioContextConstructor() : null;
}

export function createRetroAudioEngine(
  options: RetroAudioEngineOptions = {},
): AudioEngine {
  const setIntervalFn =
    options.setIntervalFn ??
    ((callback, delayMs) => globalThis.setInterval(callback, delayMs));
  const clearIntervalFn =
    options.clearIntervalFn ??
    ((handle) => globalThis.clearInterval(handle));
  const supported =
    Boolean(options.contextFactory) ||
    (typeof window !== 'undefined' &&
      Boolean(
        window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext?: typeof AudioContext;
            }
          ).webkitAudioContext,
      ));

  let context: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let musicGain: GainNode | null = null;
  let sfxGain: GainNode | null = null;
  let musicTicker: TimerHandle | null = null;
  let currentTrackId: MusicTrackId | null = null;
  let musicStep = 0;
  let musicLoopStarts = 0;
  let musicVolume = 0.5;
  let sfxVolume = 0.82;
  let enabled = true;
  let hidden = false;
  let unlocked = false;
  let disposed = false;
  let unlockPromise: Promise<boolean> | null = null;
  const activeTones = new Set<ManagedTone>();

  const ensureContext = () => {
    if (context || disposed || !supported) return context;
    context = options.contextFactory?.() ?? browserContextFactory();
    if (!context) return null;
    masterGain = context.createGain();
    musicGain = context.createGain();
    sfxGain = context.createGain();
    musicGain.connect(masterGain);
    sfxGain.connect(masterGain);
    masterGain.connect(context.destination);
    masterGain.gain.value = enabled && !hidden ? 1 : 0;
    musicGain.gain.value = musicVolume;
    sfxGain.gain.value = sfxVolume;
    return context;
  };

  const syncGains = () => {
    if (!masterGain || !musicGain || !sfxGain) return;
    masterGain.gain.value = enabled && !hidden ? 1 : 0;
    musicGain.gain.value = musicVolume;
    sfxGain.gain.value = sfxVolume;
  };

  const removeTone = (managed: ManagedTone) => {
    if (!activeTones.delete(managed)) return;
    try {
      managed.oscillator.disconnect();
    } catch {
      // The browser may already have disconnected a completed oscillator.
    }
    try {
      managed.gain.disconnect();
    } catch {
      // The browser may already have disconnected a completed gain node.
    }
  };

  const stopTones = (kind?: ManagedTone['kind']) => {
    [...activeTones].forEach((managed) => {
      if (kind && managed.kind !== kind) return;
      try {
        managed.oscillator.stop();
      } catch {
        // A scheduled node may already have ended.
      }
      removeTone(managed);
    });
  };

  const scheduleTone = (
    definition: AudioToneDefinition,
    destination: GainNode,
    kind: ManagedTone['kind'],
    intensity = 1,
  ) => {
    if (
      !context ||
      context.state !== 'running' ||
      disposed ||
      hidden ||
      !enabled
    ) {
      return;
    }
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startAt =
      context.currentTime + Math.max(0, definition.offsetMs ?? 0) / 1000;
    const duration = Math.max(0.02, definition.durationMs / 1000);
    const endAt = startAt + duration;
    const peak = Math.max(
      0.0001,
      clampVolume(definition.gain * Math.max(0, intensity)),
    );
    oscillator.type = definition.wave;
    oscillator.frequency.setValueAtTime(definition.frequency, startAt);
    if (definition.slideToFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(
        definition.slideToFrequency,
        endAt,
      );
    }
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(
      peak,
      Math.min(endAt, startAt + 0.012),
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
    oscillator.connect(gain);
    gain.connect(destination);
    const managed: ManagedTone = { gain, kind, oscillator };
    activeTones.add(managed);
    oscillator.onended = () => removeTone(managed);
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.015);
  };

  const stopMusicLoop = () => {
    if (musicTicker !== null) {
      clearIntervalFn(musicTicker);
      musicTicker = null;
    }
    stopTones('music');
  };

  const playMusicStep = () => {
    if (
      !currentTrackId ||
      !musicGain ||
      !context ||
      context.state !== 'running' ||
      !enabled ||
      hidden ||
      disposed
    ) {
      return;
    }
    const track = MUSIC_TRACK_BY_ID[currentTrackId];
    const step = track.steps[musicStep % track.steps.length];
    step.tones.forEach((entry) =>
      scheduleTone(entry, musicGain!, 'music'),
    );
    musicStep = (musicStep + 1) % track.steps.length;
  };

  const startMusicLoop = () => {
    if (
      !currentTrackId ||
      !unlocked ||
      !context ||
      context.state !== 'running' ||
      !enabled ||
      hidden ||
      disposed ||
      musicTicker !== null
    ) {
      return;
    }
    const track = MUSIC_TRACK_BY_ID[currentTrackId];
    playMusicStep();
    musicTicker = setIntervalFn(playMusicStep, track.stepMs);
    musicLoopStarts += 1;
  };

  const engine: AudioEngine = {
    async unlock() {
      if (disposed || !enabled || hidden || !supported) return false;
      if (unlocked && context?.state === 'running') {
        startMusicLoop();
        return true;
      }
      if (unlockPromise) return unlockPromise;
      unlockPromise = (async () => {
        const nextContext = ensureContext();
        if (!nextContext) return false;
        try {
          await nextContext.resume();
          unlocked = nextContext.state === 'running';
          syncGains();
          if (unlocked) startMusicLoop();
          return unlocked;
        } catch {
          unlocked = false;
          return false;
        } finally {
          unlockPromise = null;
        }
      })();
      return unlockPromise;
    },
    setEnabled(value) {
      if (disposed) return;
      enabled = value;
      syncGains();
      if (!enabled) {
        stopMusicLoop();
        stopTones();
      } else {
        startMusicLoop();
      }
    },
    setVolumes(music, sfx) {
      if (disposed) return;
      musicVolume = clampVolume(music);
      sfxVolume = clampVolume(sfx);
      syncGains();
    },
    setMusic(trackId) {
      if (disposed) return;
      if (currentTrackId === trackId) {
        startMusicLoop();
        return;
      }
      stopMusicLoop();
      currentTrackId = trackId;
      musicStep = 0;
      startMusicLoop();
    },
    stopMusic() {
      if (disposed) return;
      stopMusicLoop();
      currentTrackId = null;
      musicStep = 0;
    },
    emitSfx(cueId, intensity = 1) {
      if (
        disposed ||
        !enabled ||
        hidden ||
        !unlocked ||
        !context ||
        context.state !== 'running' ||
        !sfxGain
      ) {
        return;
      }
      const cue = AUDIO_CUE_BY_ID[cueId];
      cue.tones.forEach((entry) =>
        scheduleTone(entry, sfxGain!, 'sfx', intensity),
      );
    },
    setPageHidden(value) {
      if (disposed || hidden === value) return;
      hidden = value;
      syncGains();
      if (hidden) {
        stopMusicLoop();
        stopTones();
        if (context?.state === 'running') {
          void context.suspend().catch(() => undefined);
        }
        return;
      }
      if (!enabled || !unlocked || !context) return;
      void context
        .resume()
        .then(() => {
          syncGains();
          startMusicLoop();
        })
        .catch(() => undefined);
    },
    getSnapshot(): AudioEngineSnapshot {
      return {
        supported,
        unlocked,
        enabled,
        hidden,
        disposed,
        currentTrackId,
        activeNodeCount: activeTones.size,
        musicLoopStarts,
      };
    },
    dispose() {
      if (disposed) return;
      stopMusicLoop();
      stopTones();
      disposed = true;
      unlocked = false;
      try {
        musicGain?.disconnect();
        sfxGain?.disconnect();
        masterGain?.disconnect();
      } catch {
        // Disconnection is best-effort during application teardown.
      }
      if (context && context.state !== 'closed') {
        void context.close().catch(() => undefined);
      }
      context = null;
      masterGain = null;
      musicGain = null;
      sfxGain = null;
    },
  };

  return engine;
}
