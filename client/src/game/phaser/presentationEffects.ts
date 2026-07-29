import type { CaptureBattleSpeed, TrainerEmote } from '../types';

export type PresentationEffectKind =
  | 'arm-impact'
  | 'boss-entrance'
  | 'capture-failure'
  | 'capture-success'
  | 'level-up'
  | 'rep-failure'
  | 'rep-success';

export type PresentationEffectTone =
  | 'advance'
  | 'counter'
  | 'failure'
  | 'neutral'
  | 'resisted'
  | 'success';

export interface PresentationEffectCue {
  kind: PresentationEffectKind;
  label: string;
  sequence: number;
  tone: PresentationEffectTone;
}

export interface DialoguePortrait {
  accent: string;
  base: string;
  initial: string;
  kind: 'boss' | 'buddy' | 'trainer';
  name: string;
}

export interface BossEntranceCue {
  bossName: string;
  gymName: string;
  sequence: number;
  signature: string;
}

export const PRESENTATION_EFFECT_TIMING = {
  ambientFrameMs: 180,
  bossEntranceMs: 760,
  routeTransitionMs: 1200,
  reducedMotionSequenceMs: 80,
} as const;

const SEQUENCE_SPEED_SCALE: Record<CaptureBattleSpeed, number> = {
  swift: 0.68,
  standard: 1,
  deliberate: 1.18,
};

export function getPresentationSequenceDuration(
  baseMs: number,
  battleSpeed: CaptureBattleSpeed,
  reducedMotion: boolean,
) {
  if (reducedMotion) return PRESENTATION_EFFECT_TIMING.reducedMotionSequenceMs;
  return Math.round(baseMs * SEQUENCE_SPEED_SCALE[battleSpeed]);
}

export function trainerEmoteLabel(emote: TrainerEmote) {
  const labels: Record<TrainerEmote, string> = {
    neutral: '',
    grind: '>>',
    focus: '!',
    level: '+1',
    victory: 'WIN',
    drained: '...',
    ready: 'OK',
    pump: '^',
  };
  return labels[emote];
}
