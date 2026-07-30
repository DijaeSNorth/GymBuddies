import { useRef, useState } from 'react';

import { TRAINER_POSE_DEFINITIONS } from '../../game/content/bodybuilding';
import {
  MAX_SAVED_APPEARANCE_PRESETS,
  cloneTrainerAppearance,
} from '../../game/content/trainerAppearance';
import {
  TRAINER_APPEARANCE_IMPORT_MAX_BYTES,
  exportTrainerAppearanceJson,
  importTrainerAppearanceJson,
} from '../../game/systems/trainerAppearance';
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

export const TRAINER_POSES: Array<{ id: TrainerPose; label: string }> =
  TRAINER_POSE_DEFINITIONS.map(({ id, label }) => ({ id, label }));

type TrainerPreviewControlsProps = {
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
  section: 'poses' | 'saved-looks';
};

function downloadAppearance(appearance: TrainerAppearance) {
  const payload = exportTrainerAppearanceJson(appearance);
  const url = URL.createObjectURL(
    new Blob([payload], { type: 'application/json' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'gym-buddies-appearance.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function TrainerPreviewControls({
  appearance,
  appearancePresets,
  direction,
  onAppearanceLoad,
  onAppearancePresetsChange,
  onDirectionChange,
  onPoseChange,
  pose,
  section,
}: TrainerPreviewControlsProps) {
  const savedPresetSequenceRef = useRef(0);
  const importRef = useRef<HTMLInputElement>(null);
  const [presetName, setPresetName] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [compareLeftId, setCompareLeftId] = useState('');
  const [compareRightId, setCompareRightId] = useState('');
  const [transferStatus, setTransferStatus] = useState('');

  const nextPresetId = () => {
    savedPresetSequenceRef.current += 1;
    return `trainer-look-${Date.now().toString(36)}-${savedPresetSequenceRef.current}`;
  };

  const savePreset = () => {
    const name =
      presetName.trim().slice(0, 24) ||
      `Saved Look ${appearancePresets.length + 1}`;
    const preset: TrainerAppearancePreset = {
      id: nextPresetId(),
      name,
      appearance: cloneTrainerAppearance(appearance),
    };
    onAppearancePresetsChange([...appearancePresets, preset]);
    setPresetName('');
  };

  const duplicatePreset = (preset: TrainerAppearancePreset) => {
    if (appearancePresets.length >= MAX_SAVED_APPEARANCE_PRESETS) return;
    onAppearancePresetsChange([
      ...appearancePresets,
      {
        id: nextPresetId(),
        name: `${preset.name} Copy`.slice(0, 24),
        appearance: cloneTrainerAppearance(preset.appearance),
      },
    ]);
  };

  const saveRename = (preset: TrainerAppearancePreset) => {
    const name = renameValue.trim().slice(0, 24) || preset.name;
    onAppearancePresetsChange(
      appearancePresets.map((entry) =>
        entry.id === preset.id ? { ...entry, name } : entry,
      ),
    );
    setRenameId(null);
    setRenameValue('');
  };

  const importAppearance = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > TRAINER_APPEARANCE_IMPORT_MAX_BYTES) {
      setTransferStatus(
        'Appearance JSON is larger than the 64 KB safety limit.',
      );
      if (importRef.current) importRef.current.value = '';
      return;
    }
    const result = importTrainerAppearanceJson(await file.text());
    if (!result.ok) {
      setTransferStatus(result.message);
      return;
    }
    onAppearanceLoad(result.appearance);
    setTransferStatus(
      result.issues.length > 0
        ? `Appearance imported with ${result.issues.length} repaired option${result.issues.length === 1 ? '' : 's'}.`
        : 'Appearance imported. Progression was not changed.',
    );
    if (importRef.current) importRef.current.value = '';
  };

  if (section === 'poses') {
    return (
      <div className="trainer-preview-tab">
        <section className="trainer-custom-section">
          <div className="trainer-custom-copy">
            <h3>Movement directions</h3>
            <p>
              Check the shared bottom-center anchor and muscular silhouette in
              every direction.
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
            <h3>Pose inspection</h3>
            <p>
              Cycle travel, training, recovery, and bodybuilding poses without
              changing the saved appearance.
            </p>
          </div>
          <div className="trainer-pose-grid">
            {TRAINER_POSES.map((entry) => (
              <button
                aria-pressed={pose === entry.id}
                className={pose === entry.id ? 'active' : ''}
                data-setup-control="true"
                data-trainer-pose={entry.id}
                key={entry.id}
                onClick={() => onPoseChange(entry.id)}
                type="button"
              >
                {entry.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  const leftPreset =
    appearancePresets.find((entry) => entry.id === compareLeftId) ??
    appearancePresets[0];
  const rightPreset =
    appearancePresets.find((entry) => entry.id === compareRightId) ??
    appearancePresets[1] ??
    appearancePresets[0];

  return (
    <div className="trainer-preview-tab">
      <section className="trainer-custom-section">
        <div className="trainer-custom-copy">
          <h3>Appearance-only transfer</h3>
          <p>
            Export or import cosmetics without including levels, Buddies,
            fatigue, equipment bonuses, or journey progress.
          </p>
        </div>
        <div className="trainer-appearance-transfer">
          <button
            data-setup-control="true"
            onClick={() => downloadAppearance(appearance)}
            type="button"
          >
            Export Current Appearance
          </button>
          <button
            data-setup-control="true"
            onClick={() => importRef.current?.click()}
            type="button"
          >
            Import Appearance JSON
          </button>
          <input
            accept="application/json,.json"
            aria-label="Choose appearance JSON"
            hidden
            onChange={(event) => void importAppearance(event.target.files?.[0])}
            ref={importRef}
            type="file"
          />
        </div>
        {transferStatus ? (
          <p className="trainer-transfer-status" role="status">
            {transferStatus}
          </p>
        ) : null}
      </section>

      <section className="trainer-custom-section">
        <div className="trainer-custom-copy">
          <h3>Saved looks</h3>
          <p>
            Store, duplicate, rename, apply, compare, or delete up to{' '}
            {MAX_SAVED_APPEARANCE_PRESETS} cosmetic looks.
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
                {renameId === preset.id ? (
                  <input
                    aria-label={`Rename ${preset.name}`}
                    data-setup-control="true"
                    maxLength={24}
                    onChange={(event) => setRenameValue(event.target.value)}
                    value={renameValue}
                  />
                ) : (
                  <strong>{preset.name}</strong>
                )}
                <div className="trainer-saved-look-actions">
                  <button
                    data-setup-control="true"
                    onClick={() =>
                      onAppearanceLoad(
                        cloneTrainerAppearance(preset.appearance),
                      )
                    }
                    type="button"
                  >
                    Apply
                  </button>
                  <button
                    data-setup-control="true"
                    disabled={
                      appearancePresets.length >=
                      MAX_SAVED_APPEARANCE_PRESETS
                    }
                    onClick={() => duplicatePreset(preset)}
                    type="button"
                  >
                    Duplicate
                  </button>
                  {renameId === preset.id ? (
                    <button
                      data-setup-control="true"
                      onClick={() => saveRename(preset)}
                      type="button"
                    >
                      Save Name
                    </button>
                  ) : (
                    <button
                      data-setup-control="true"
                      onClick={() => {
                        setRenameId(preset.id);
                        setRenameValue(preset.name);
                      }}
                      type="button"
                    >
                      Rename
                    </button>
                  )}
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
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="trainer-empty-presets">
            No saved looks yet. Your current cosmetics remain in the versioned
            journey save.
          </p>
        )}
      </section>

      {appearancePresets.length >= 2 && leftPreset && rightPreset ? (
        <section className="trainer-custom-section">
          <div className="trainer-custom-copy">
            <h3>Compare two looks</h3>
            <p>Comparison never applies either look until you choose Apply.</p>
          </div>
          <div className="trainer-look-compare-selects">
            <label>
              Left look
              <select
                data-setup-control="true"
                onChange={(event) => setCompareLeftId(event.target.value)}
                value={leftPreset.id}
              >
                {appearancePresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Right look
              <select
                data-setup-control="true"
                onChange={(event) => setCompareRightId(event.target.value)}
                value={rightPreset.id}
              >
                {appearancePresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="trainer-look-comparison">
            {[leftPreset, rightPreset].map((preset) => (
              <figure key={preset.id}>
                <TrainerPixelSprite
                  animated={false}
                  appearance={preset.appearance}
                  direction={direction}
                  label={preset.name}
                  pose={pose}
                  reducedMotion
                  scale={2.5}
                />
                <figcaption>{preset.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
