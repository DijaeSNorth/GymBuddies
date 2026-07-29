import { useState } from 'react';

import {
  AUDIO_CUES,
  MUSIC_TRACKS,
} from '../../game/content/audio';
import type {
  AudioCueId,
  MusicTrackId,
} from '../../game/types';

type AudioTestPanelProps = {
  onPlayCue: (cueId: AudioCueId) => void;
  onPlayTrack: (trackId: MusicTrackId) => void;
  onRestoreGameMix: () => void;
  onStopMusic: () => void;
};

export function AudioTestPanel({
  onPlayCue,
  onPlayTrack,
  onRestoreGameMix,
  onStopMusic,
}: AudioTestPanelProps) {
  const [status, setStatus] = useState(
    'Choose a project-original track or cue to audition.',
  );

  return (
    <details className="audio-test-panel">
      <summary>Developer Audio Lab</summary>
      <div className="audio-test-body">
        <p className="small-note">
          Development only. Playback still requires a user gesture and uses
          the saved music, SFX, and mute settings.
        </p>

        <section aria-labelledby="audio-test-music-title">
          <div className="audio-test-heading">
            <h3 id="audio-test-music-title">Music loops</h3>
            <div className="action-row">
              <button
                className="secondary-btn micro-btn"
                onClick={() => {
                  onRestoreGameMix();
                  setStatus('Restored the music selected by current gameplay.');
                }}
                type="button"
              >
                Restore Game Mix
              </button>
              <button
                className="secondary-btn micro-btn"
                onClick={() => {
                  onStopMusic();
                  setStatus('Stopped music. Sound effects remain available.');
                }}
                type="button"
              >
                Stop Music
              </button>
            </div>
          </div>
          <div className="audio-test-grid">
            {MUSIC_TRACKS.map((track) => (
              <button
                className="audio-test-option"
                key={track.id}
                onClick={() => {
                  onPlayTrack(track.id);
                  setStatus(`Auditioning ${track.label}.`);
                }}
                title={track.description}
                type="button"
              >
                <strong>{track.label}</strong>
                <small>
                  {track.steps.length} steps · {track.stepMs} ms cadence
                </small>
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="audio-test-cues-title">
          <h3 id="audio-test-cues-title">Sound-effect cues</h3>
          <div className="audio-test-grid audio-test-cue-grid">
            {AUDIO_CUES.map((cue) => (
              <button
                className="audio-test-option"
                key={cue.id}
                onClick={() => {
                  onPlayCue(cue.id);
                  setStatus(`Played ${cue.label}.`);
                }}
                title={cue.description}
                type="button"
              >
                <strong>{cue.label}</strong>
                <small>{cue.tones.length} tone layers</small>
              </button>
            ))}
          </div>
        </section>

        <p aria-live="polite" className="small-note">
          {status}
        </p>
      </div>
    </details>
  );
}
