import { describe, expect, it } from 'vitest';

import { createRetroAudioEngine } from '../game/audio/retroAudioEngine';
import {
  AUDIO_CUES,
  MUSIC_TRACKS,
} from '../game/content/audio';
import type {
  AudioCueId,
  MusicTrackId,
} from '../game/types';

class FakeAudioParam {
  value = 0;

  setValueAtTime(value: number) {
    this.value = value;
    return this as unknown as AudioParam;
  }

  exponentialRampToValueAtTime(value: number) {
    this.value = value;
    return this as unknown as AudioParam;
  }
}

class FakeGainNode {
  readonly gain = new FakeAudioParam();
  disconnected = false;

  connect() {
    return undefined;
  }

  disconnect() {
    this.disconnected = true;
  }
}

class FakeOscillatorNode {
  readonly frequency = new FakeAudioParam();
  type: OscillatorType = 'sine';
  onended: (() => void) | null = null;
  disconnected = false;
  scheduledStop = false;

  connect() {
    return undefined;
  }

  disconnect() {
    this.disconnected = true;
  }

  start() {
    return undefined;
  }

  stop(when?: number) {
    if (when !== undefined) {
      this.scheduledStop = true;
      return;
    }
    this.onended?.();
  }
}

class FakeAudioContext {
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  state: AudioContextState = 'suspended';
  resumeCalls = 0;
  suspendCalls = 0;
  closeCalls = 0;
  readonly oscillators: FakeOscillatorNode[] = [];
  readonly gains: FakeGainNode[] = [];

  createGain() {
    const gain = new FakeGainNode();
    this.gains.push(gain);
    return gain as unknown as GainNode;
  }

  createOscillator() {
    const oscillator = new FakeOscillatorNode();
    this.oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  }

  async resume() {
    this.resumeCalls += 1;
    this.state = 'running';
  }

  async suspend() {
    this.suspendCalls += 1;
    this.state = 'suspended';
  }

  async close() {
    this.closeCalls += 1;
    this.state = 'closed';
  }
}

function createTimerHarness() {
  let nextId = 1;
  const callbacks = new Map<number, () => void>();
  return {
    callbacks,
    setIntervalFn(callback: () => void) {
      const id = nextId;
      nextId += 1;
      callbacks.set(id, callback);
      return id as unknown as ReturnType<typeof globalThis.setInterval>;
    },
    clearIntervalFn(
      handle: ReturnType<typeof globalThis.setInterval>,
    ) {
      callbacks.delete(handle as unknown as number);
    },
  };
}

function createHarnessedEngine() {
  const context = new FakeAudioContext();
  const timers = createTimerHarness();
  let contextCreations = 0;
  const engine = createRetroAudioEngine({
    contextFactory: () => {
      contextCreations += 1;
      return context as unknown as AudioContext;
    },
    setIntervalFn: timers.setIntervalFn,
    clearIntervalFn: timers.clearIntervalFn,
  });
  return {
    context,
    engine,
    getContextCreations: () => contextCreations,
    timers,
  };
}

describe('original retro audio content', () => {
  it('defines every required music environment with unique stable IDs', () => {
    const required = new Set<MusicTrackId>([
      'home-gym',
      'route-exploration',
      'wild-encounter',
      'boss-challenge',
      'training',
    ]);
    const ids = MUSIC_TRACKS.map((track) => track.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(required);
    MUSIC_TRACKS.forEach((track) => {
      expect(track.steps.length).toBeGreaterThanOrEqual(4);
      expect(track.stepMs).toBeGreaterThanOrEqual(80);
      expect(
        track.steps.some((step) => step.tones.length > 0),
      ).toBe(true);
    });
  });

  it('defines all required gameplay cues as bounded synthesized patterns', () => {
    const required = new Set<AudioCueId>([
      'train',
      'rep-success',
      'rep-failure',
      'spot-now',
      'capture-success',
      'capture-failure',
      'level-up',
      'rare-encounter',
      'menu-navigate',
      'route-transition',
    ]);
    const ids = AUDIO_CUES.map((cue) => cue.id);

    expect(new Set(ids).size).toBe(ids.length);
    required.forEach((id) => expect(ids).toContain(id));
    AUDIO_CUES.forEach((cue) => {
      expect(cue.tones.length).toBeGreaterThan(0);
      cue.tones.forEach((tone) => {
        expect(tone.frequency).toBeGreaterThan(0);
        expect(tone.durationMs).toBeGreaterThan(0);
        expect(tone.gain).toBeGreaterThan(0);
        expect(tone.gain).toBeLessThanOrEqual(1);
      });
    });
  });
});

describe('retro audio engine lifecycle', () => {
  it('does not create or resume Web Audio before an explicit unlock', async () => {
    const harness = createHarnessedEngine();
    harness.engine.setMusic('home-gym');
    harness.engine.emitSfx('menu-navigate');

    expect(harness.getContextCreations()).toBe(0);
    expect(harness.timers.callbacks.size).toBe(0);
    expect(harness.engine.getSnapshot().unlocked).toBe(false);

    await expect(harness.engine.unlock()).resolves.toBe(true);
    expect(harness.getContextCreations()).toBe(1);
    expect(harness.context.resumeCalls).toBe(1);
    expect(harness.timers.callbacks.size).toBe(1);
  });

  it('keeps one loop when the same music is requested repeatedly', async () => {
    const harness = createHarnessedEngine();
    harness.engine.setMusic('route-exploration');
    await harness.engine.unlock();

    harness.engine.setMusic('route-exploration');
    harness.engine.setMusic('route-exploration');

    expect(harness.timers.callbacks.size).toBe(1);
    expect(harness.engine.getSnapshot().musicLoopStarts).toBe(1);

    harness.engine.setMusic('wild-encounter');
    expect(harness.timers.callbacks.size).toBe(1);
    expect(harness.engine.getSnapshot().currentTrackId).toBe(
      'wild-encounter',
    );
    expect(harness.engine.getSnapshot().musicLoopStarts).toBe(2);
  });

  it('pauses on hidden tabs and resumes only the desired loop', async () => {
    const harness = createHarnessedEngine();
    harness.engine.setMusic('boss-challenge');
    await harness.engine.unlock();

    harness.engine.setPageHidden(true);
    await Promise.resolve();
    expect(harness.timers.callbacks.size).toBe(0);
    expect(harness.context.suspendCalls).toBe(1);
    expect(harness.engine.getSnapshot().hidden).toBe(true);

    harness.engine.setPageHidden(false);
    await Promise.resolve();
    await Promise.resolve();
    expect(harness.timers.callbacks.size).toBe(1);
    expect(harness.context.resumeCalls).toBe(2);
    expect(harness.engine.getSnapshot().currentTrackId).toBe(
      'boss-challenge',
    );
  });

  it('stops active nodes, clears timers, and closes context on dispose', async () => {
    const harness = createHarnessedEngine();
    harness.engine.setMusic('training');
    await harness.engine.unlock();
    harness.engine.emitSfx('spot-now');

    expect(harness.engine.getSnapshot().activeNodeCount).toBeGreaterThan(0);
    expect(harness.timers.callbacks.size).toBe(1);

    harness.engine.dispose();
    await Promise.resolve();

    expect(harness.timers.callbacks.size).toBe(0);
    expect(harness.engine.getSnapshot()).toMatchObject({
      activeNodeCount: 0,
      disposed: true,
      unlocked: false,
    });
    expect(harness.context.closeCalls).toBe(1);
  });

  it('mutes immediately without forgetting the desired music', async () => {
    const harness = createHarnessedEngine();
    harness.engine.setMusic('home-gym');
    await harness.engine.unlock();

    harness.engine.setEnabled(false);
    expect(harness.timers.callbacks.size).toBe(0);
    expect(harness.engine.getSnapshot()).toMatchObject({
      currentTrackId: 'home-gym',
      enabled: false,
    });

    harness.engine.setEnabled(true);
    expect(harness.timers.callbacks.size).toBe(1);
    expect(harness.engine.getSnapshot().musicLoopStarts).toBe(2);
  });
});
