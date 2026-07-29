import type {
  AudioCueDefinition,
  AudioCueId,
  AudioToneDefinition,
  MusicPatternStep,
  MusicTrackDefinition,
  MusicTrackId,
  RetroWaveform,
} from '../types';

function tone(
  frequency: number,
  durationMs: number,
  gain: number,
  wave: RetroWaveform,
  options?: {
    offsetMs?: number;
    slideToFrequency?: number;
  },
): AudioToneDefinition {
  return {
    frequency,
    durationMs,
    gain,
    wave,
    ...options,
  };
}

function musicStep(
  lead?: number,
  bass?: number,
  harmony?: number,
  accent = false,
): MusicPatternStep {
  const tones: AudioToneDefinition[] = [];
  if (bass) tones.push(tone(bass, 150, 0.12, 'square'));
  if (lead) tones.push(tone(lead, 130, 0.17, 'triangle'));
  if (harmony) {
    tones.push(
      tone(harmony, 105, 0.08, 'sine', {
        offsetMs: 18,
      }),
    );
  }
  if (accent) {
    tones.push(
      tone(lead ? lead * 2 : 116.54, 42, 0.055, 'sawtooth'),
    );
  }
  return { tones };
}

/**
 * Project-original melodic cells composed for Gym Buddies. Frequencies are
 * stored directly so the Web Audio runtime does not depend on external music.
 */
export const MUSIC_TRACKS: MusicTrackDefinition[] = [
  {
    id: 'home-gym',
    label: 'Home Gym · Open Mat',
    description:
      'A relaxed asymmetric warm-up loop with soft triangle lead and square bass.',
    stepMs: 280,
    steps: [
      musicStep(220, 73.42, 277.18, true),
      musicStep(246.94),
      musicStep(293.66, 82.41),
      musicStep(undefined, 82.41),
      musicStep(261.63, 65.41, 329.63),
      musicStep(220),
      musicStep(329.63, 73.42, undefined, true),
      musicStep(277.18),
      musicStep(196, 61.74, 246.94),
      musicStep(undefined),
      musicStep(246.94, 73.42),
      musicStep(293.66),
      musicStep(277.18, 69.3, 349.23, true),
      musicStep(233.08),
      musicStep(207.65, 65.41),
      musicStep(undefined, 55),
    ],
  },
  {
    id: 'route-exploration',
    label: 'Routes · Moving Circuit',
    description:
      'A forward-leaning seven-beat phrase with alternating footfall accents.',
    stepMs: 205,
    steps: [
      musicStep(261.63, 87.31, undefined, true),
      musicStep(311.13),
      musicStep(349.23, 98),
      musicStep(293.66),
      musicStep(392, 87.31, 493.88, true),
      musicStep(undefined),
      musicStep(329.63, 110),
      musicStep(277.18),
      musicStep(369.99, 92.5, undefined, true),
      musicStep(415.3),
      musicStep(311.13, 82.41),
      musicStep(undefined),
      musicStep(349.23, 98, 440),
      musicStep(293.66),
    ],
  },
  {
    id: 'wild-encounter',
    label: 'Wild Encounter · Grip Signal',
    description:
      'A syncopated contest loop that alternates open space with short control pulses.',
    stepMs: 158,
    steps: [
      musicStep(233.08, 77.78, undefined, true),
      musicStep(349.23),
      musicStep(undefined, 92.5),
      musicStep(277.18, undefined, 369.99),
      musicStep(415.3, 77.78, undefined, true),
      musicStep(311.13),
      musicStep(261.63, 69.3),
      musicStep(undefined),
      musicStep(293.66, 87.31, 392, true),
      musicStep(440),
      musicStep(329.63, 73.42),
      musicStep(246.94),
    ],
  },
  {
    id: 'boss-challenge',
    label: 'Boss Challenge · Loaded Platform',
    description:
      'A compact pressure cycle built from descending tritones and an offset rally response.',
    stepMs: 126,
    steps: [
      musicStep(466.16, 58.27, undefined, true),
      musicStep(349.23),
      musicStep(261.63, 69.3),
      musicStep(392, undefined, 523.25),
      musicStep(311.13, 58.27, undefined, true),
      musicStep(undefined),
      musicStep(415.3, 77.78),
      musicStep(277.18),
      musicStep(369.99, 61.74, 493.88, true),
      musicStep(246.94),
      musicStep(329.63, 73.42),
      musicStep(undefined),
    ],
  },
  {
    id: 'training',
    label: 'Training · Rep Cadence',
    description:
      'A clipped call-and-response loop paced around controlled repetitions.',
    stepMs: 176,
    steps: [
      musicStep(196, 65.41, undefined, true),
      musicStep(undefined),
      musicStep(293.66, 73.42),
      musicStep(246.94),
      musicStep(329.63, 82.41, undefined, true),
      musicStep(undefined),
      musicStep(261.63, 65.41, 392),
      musicStep(311.13),
      musicStep(220, 55, undefined, true),
      musicStep(277.18),
      musicStep(undefined, 69.3),
      musicStep(349.23),
    ],
  },
];

export const AUDIO_CUES: AudioCueDefinition[] = [
  {
    id: 'train',
    label: 'Training start',
    description: 'Two clipped machine contacts begin a set.',
    tones: [
      tone(174.61, 72, 0.38, 'triangle', {
        slideToFrequency: 220,
      }),
      tone(293.66, 58, 0.24, 'square', { offsetMs: 48 }),
    ],
  },
  {
    id: 'rep-success',
    label: 'Successful rep',
    description: 'A tight upward technique confirmation.',
    tones: [
      tone(329.63, 55, 0.3, 'triangle'),
      tone(440, 82, 0.25, 'sine', { offsetMs: 45 }),
    ],
  },
  {
    id: 'rep-failure',
    label: 'Failed rep',
    description: 'A descending unstable load response.',
    tones: [
      tone(246.94, 85, 0.34, 'sawtooth', {
        slideToFrequency: 174.61,
      }),
      tone(116.54, 110, 0.19, 'square', { offsetMs: 44 }),
    ],
  },
  {
    id: 'spot-now',
    label: 'Spot Now',
    description: 'Three urgent alternating rescue ticks.',
    tones: [
      tone(523.25, 45, 0.23, 'square'),
      tone(392, 45, 0.25, 'square', { offsetMs: 62 }),
      tone(587.33, 70, 0.2, 'triangle', { offsetMs: 124 }),
    ],
  },
  {
    id: 'capture-success',
    label: 'Capture success',
    description: 'An original rising lock-and-release flourish.',
    tones: [
      tone(261.63, 80, 0.24, 'triangle'),
      tone(369.99, 90, 0.27, 'triangle', { offsetMs: 74 }),
      tone(554.37, 170, 0.2, 'sine', { offsetMs: 150 }),
    ],
  },
  {
    id: 'capture-failure',
    label: 'Capture failure',
    description: 'A grip-slip fall with a muted final pulse.',
    tones: [
      tone(349.23, 80, 0.25, 'triangle', {
        slideToFrequency: 233.08,
      }),
      tone(155.56, 120, 0.16, 'square', { offsetMs: 74 }),
    ],
  },
  {
    id: 'level-up',
    label: 'Level up',
    description: 'A five-note staggered growth fanfare.',
    tones: [
      tone(220, 70, 0.22, 'triangle'),
      tone(277.18, 70, 0.24, 'triangle', { offsetMs: 60 }),
      tone(349.23, 70, 0.25, 'triangle', { offsetMs: 120 }),
      tone(415.3, 85, 0.23, 'sine', { offsetMs: 180 }),
      tone(554.37, 170, 0.18, 'sine', { offsetMs: 245 }),
    ],
  },
  {
    id: 'rare-encounter',
    label: 'Rare encounter',
    description: 'A suspended shimmer that resolves into a low pulse.',
    tones: [
      tone(659.25, 120, 0.16, 'sine'),
      tone(830.61, 150, 0.13, 'sine', { offsetMs: 42 }),
      tone(185, 180, 0.2, 'triangle', { offsetMs: 135 }),
    ],
  },
  {
    id: 'menu-navigate',
    label: 'Menu navigation',
    description: 'A short neutral cursor notch.',
    tones: [tone(311.13, 38, 0.18, 'square')],
  },
  {
    id: 'route-transition',
    label: 'Route transition',
    description: 'A soft falling footstep pair for location changes.',
    tones: [
      tone(277.18, 72, 0.2, 'sine'),
      tone(207.65, 92, 0.22, 'triangle', { offsetMs: 54 }),
    ],
  },
  {
    id: 'wild-alert',
    label: 'Wild encounter alert',
    description: 'A three-part challenge signal with no borrowed motif.',
    tones: [
      tone(196, 75, 0.27, 'square'),
      tone(293.66, 75, 0.23, 'triangle', { offsetMs: 58 }),
      tone(233.08, 110, 0.2, 'sine', { offsetMs: 118 }),
    ],
  },
  {
    id: 'boss-alert',
    label: 'Boss challenge alert',
    description: 'A low warning strike answered by a high square pulse.',
    tones: [
      tone(92.5, 170, 0.32, 'sawtooth'),
      tone(466.16, 90, 0.22, 'square', { offsetMs: 92 }),
      tone(311.13, 130, 0.2, 'triangle', { offsetMs: 162 }),
    ],
  },
  {
    id: 'capture-advance',
    label: 'Capture advantage',
    description: 'A concise upward control tick.',
    tones: [tone(392, 65, 0.22, 'triangle', { slideToFrequency: 466.16 })],
  },
  {
    id: 'capture-resisted',
    label: 'Capture resisted',
    description: 'A concise downward resistance tick.',
    tones: [tone(233.08, 78, 0.23, 'triangle', { slideToFrequency: 174.61 })],
  },
  {
    id: 'team-full',
    label: 'Full party',
    description: 'A successful lock followed by a gentle capacity warning.',
    tones: [
      tone(293.66, 72, 0.22, 'triangle'),
      tone(440, 95, 0.2, 'sine', { offsetMs: 62 }),
      tone(146.83, 130, 0.18, 'square', { offsetMs: 145 }),
    ],
  },
  {
    id: 'recovery',
    label: 'Recovery',
    description: 'A low, soft breath-like recovery pair.',
    tones: [
      tone(174.61, 150, 0.14, 'sine', { slideToFrequency: 196 }),
      tone(261.63, 150, 0.11, 'sine', { offsetMs: 90 }),
    ],
  },
];

export const MUSIC_TRACK_BY_ID = Object.fromEntries(
  MUSIC_TRACKS.map((track) => [track.id, track]),
) as Record<MusicTrackId, MusicTrackDefinition>;

export const AUDIO_CUE_BY_ID = Object.fromEntries(
  AUDIO_CUES.map((cue) => [cue.id, cue]),
) as Record<AudioCueId, AudioCueDefinition>;
