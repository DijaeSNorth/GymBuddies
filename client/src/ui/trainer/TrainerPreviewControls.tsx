import { useRef, useState } from 'react';

import {
  MAX_SAVED_APPEARANCE_PRESETS,
  cloneTrainerAppearance,
} from '../../game/content/trainerAppearance';
import type {
  TrainerAppearance,
  TrainerAppearancePreset,
  TrainerFacingDirection,
  TrainerPose,
} from '../../game/types';
import { TrainerPixelSprite } from './TrainerPixelSprite';

export const TRAINER_DIRECTIONS: TrainerFacingDirection[] = [
  'front',
  'right',
  'back',
  'left',
];

export const TRAINER_POSES: Array<{ id: TrainerPose; label: string }> = [
  { id: 'idle', label: 'Idle' },
  { id: 'walking', label: 'Walk' },
  { id: 'running', label: 'Run' },
  { id: 'training', label: 'Train' },
  { id: 'victory', label: 'Victory' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'capture', label: 'Capture' },
  { id: 'boss-introduction', label: 'Boss Intro' },
];

export function TrainerPreviewControls({
  appearance,
  appearancePresets,
  direction,
  onAppearanceLoad,
  onAppearancePresetsChange,
  onDirectionChange,
  onPoseChange,
  pose,
}: {
  appearance: TrainerAppearance;
  appearancePresets: readonly TrainerAppearancePreset[];
  direction: TrainerFacingDirection;
  onAppearanceLoad: (appearance: TrainerAppearance) => void;
  onAppearancePresetsChange: (
    presets: readonly TrainerAppearancePreset[],
  ) => void;
  onDirectionChange: (direction: TrainerFacingDirection) => void;
  onPoseChange: (pose: TrainerPose) => void;
  pose: TrainerPose;
}) {
  const savedPresetSequenceRef = useRef(0);
  const [presetName, setPresetName] = useState('');

  const savePreset = () => {
    const name =
      presetName.trim().slice(0, 24) ||
      `Saved Look ${appearancePresets.length + 1}`;
    savedPresetSequenceRef.current += 1;
    const preset: TrainerAppearancePreset = {
      id: `trainer-look-${Date.now().toString(36)}-${savedPresetSequenceRef.current}`,
      name,
      appearance: cloneTrainerAppearance(appearance),
    };
    onAppearancePresetsChange(
      [...appearancePresets, preset].slice(
        -MAX_SAVED_APPEARANCE_PRESETS,
      ),
    );
    setPresetName('');
  };

  return (
    <div className="trainer-preview-tab">
      <section className="trainer-custom-section">
        <div className="trainer-custom-copy">
          <h3>Movement directions</h3>
          <p>
            Check the shared bottom-center anchor and silhouette in every
            direction.
          </p>
        </div>
        <div className="trainer-direction-gallery">
          {TRAINER_DIRECTIONS.map((facing) => (
            <button
              aria-pressed={direction === facing}
              className={direction === facing ? 'active' : ''}
              data-setup-control="true"
              key={facing}
              onClick={() => onDirectionChange(facing)}
              type="button"
            >
              <TrainerPixelSprite
                animated={false}
                appearance={appearance}
                direction={facing}
                label={`${facing} trainer`}
                pose={pose}
                reducedMotion
                scale={2}
              />
              <span>{facing}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="trainer-custom-section">
        <div className="trainer-custom-copy">
          <h3>Animation poses</h3>
          <p>
            Preview idle, travel, training, victory, fatigue, capture, and boss
            presentation poses.
          </p>
        </div>
        <div className="trainer-pose-grid">
          {TRAINER_POSES.map((entry) => (
            <button
              aria-pressed={pose === entry.id}
              className={pose === entry.id ? 'active' : ''}
              data-setup-control="true"
              key={entry.id}
              onClick={() => onPoseChange(entry.id)}
              type="button"
            >
              {entry.label}
            </button>
          ))}
        </div>
      </section>
      <section className="trainer-custom-section">
        <div className="trainer-custom-copy">
          <h3>Saved appearance presets</h3>
          <p>
            Presets store cosmetics only. Progression attributes and journey
            state never change when a look is loaded.
          </p>
        </div>
        <div className="trainer-save-preset">
          <input
            aria-label="Appearance preset name"
            data-setup-control="true"
            maxLength={24}
            onChange={(event) => setPresetName(event.target.value)}
            placeholder={`Saved Look ${appearancePresets.length + 1}`}
            value={presetName}
          />
          <button
            data-setup-control="true"
            disabled={
              appearancePresets.length >= MAX_SAVED_APPEARANCE_PRESETS
            }
            onClick={savePreset}
            type="button"
          >
            Save Current Look
          </button>
        </div>
        {appearancePresets.length > 0 ? (
          <div className="trainer-saved-presets">
            {appearancePresets.map((preset) => (
              <article key={preset.id}>
                <TrainerPixelSprite
                  animated={false}
                  appearance={preset.appearance}
                  label={preset.name}
                  reducedMotion
                  scale={1.6}
                />
                <strong>{preset.name}</strong>
                <button
                  data-setup-control="true"
                  onClick={() => onAppearanceLoad(preset.appearance)}
                  type="button"
                >
                  Load
                </button>
                <button
                  aria-label={`Delete ${preset.name}`}
                  className="trainer-delete-preset"
                  data-setup-control="true"
                  onClick={() =>
                    onAppearancePresetsChange(
                      appearancePresets.filter(
                        (entry) => entry.id !== preset.id,
                      ),
                    )
                  }
                  type="button"
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="trainer-empty-presets">
            No saved looks yet. You can store up to{' '}
            {MAX_SAVED_APPEARANCE_PRESETS}.
          </p>
        )}
      </section>
    </div>
  );
}
