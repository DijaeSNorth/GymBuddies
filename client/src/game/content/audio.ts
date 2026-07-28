import type { AudioCueDefinition, MusicIntensity, MusicProfile } from '../types';

export const AUDIO_CUES: AudioCueDefinition[] = [
  { id: 'train', label: 'Training impact' },
  { id: 'steroid', label: 'Steroid boost' },
  { id: 'matchStart', label: 'Match start' },
  { id: 'moveGood', label: 'Strong move' },
  { id: 'moveBad', label: 'Resisted move' },
  { id: 'catchAlmost', label: 'Near capture' },
  { id: 'catchWin', label: 'Capture success' },
  { id: 'bossAlert', label: 'Boss alert' },
  { id: 'teamFull', label: 'Team full' },
  { id: 'escape', label: 'Escape' },
  { id: 'zoneShift', label: 'Zone transition' },
];

export const MUSIC_PROFILES: MusicProfile[] = [
  {
    id: 'home',
    ambient: [110, 131, 146, 164],
    scout: [123, 146, 164, 146],
    boss: [88, 110, 123, 131],
    interval: 470,
  },
  {
    id: 'starter',
    ambient: [147, 165, 196, 175],
    scout: [165, 196, 220, 247, 220],
    boss: [220, 247, 262, 294, 247],
    interval: 360,
  },
  {
    id: 'higher',
    ambient: [196, 220, 247, 294],
    scout: [220, 247, 262, 294, 262],
    boss: [294, 330, 349, 392, 330],
    interval: 255,
  },
];

export const BGM_NOTES = Object.fromEntries(
  MUSIC_PROFILES.map((profile) => [profile.id, profile]),
) as Record<MusicIntensity, MusicProfile>;
