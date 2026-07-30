import { useEffect, useMemo, useState } from 'react';

import { TRAINER_POSE_DEFINITIONS } from '../../game/content/bodybuilding';
import { cloneTrainerAppearance } from '../../game/content/trainerAppearance';
import type {
  TrainerAppearance,
  TrainerFacingDirection,
  TrainerPose,
  TrainerPreviewLighting,
  TrainerPreviewMode,
} from '../../game/types';
import { TrainerPixelSprite } from './TrainerPixelSprite';
import { TRAINER_DIRECTIONS } from './TrainerPreviewControls';

const PREVIEW_MODES: Array<{
  id: TrainerPreviewMode;
  label: string;
}> = [
  { id: 'single', label: 'Single' },
  { id: 'before-after', label: 'Before / After' },
  { id: 'front-back', label: 'Front / Back' },
  { id: 'mirrored', label: 'Mirrored' },
  { id: 'silhouette', label: 'Silhouette' },
  { id: 'muscle-highlight', label: 'Muscle Highlight' },
  { id: 'clothing-compare', label: 'Clothing Compare' },
];

const LIGHTING_MODES: Array<{
  id: TrainerPreviewLighting;
  label: string;
}> = [
  { id: 'neutral', label: 'Neutral' },
  { id: 'stage', label: 'Stage' },
  { id: 'gym', label: 'Gym' },
];

type TrainerPreviewWorkbenchProps = {
  appearance: TrainerAppearance;
  direction: TrainerFacingDirection;
  initialAppearance: TrainerAppearance;
  name: string;
  onDirectionChange: (direction: TrainerFacingDirection) => void;
  onPoseChange: (pose: TrainerPose) => void;
  pose: TrainerPose;
  reducedMotion: boolean;
};

export function TrainerPreviewWorkbench({
  appearance,
  direction,
  initialAppearance,
  name,
  onDirectionChange,
  onPoseChange,
  pose,
  reducedMotion,
}: TrainerPreviewWorkbenchProps) {
  const [previewMode, setPreviewMode] =
    useState<TrainerPreviewMode>('single');
  const [lighting, setLighting] =
    useState<TrainerPreviewLighting>('neutral');
  const [previewSize, setPreviewSize] = useState<'small' | 'large'>('large');
  const [autoRotate, setAutoRotate] = useState(false);

  const competitionAppearance = useMemo(() => {
    const next = cloneTrainerAppearance(appearance);
    next.outfit.topId = 'posing-top';
    next.outfit.bottomsId = 'shorts-posing';
    next.outfit.glovesId = 'none';
    next.outfit.elbowSleevesId = 'none';
    next.outfit.kneeSleevesId = 'none';
    next.accessories.gymBagId = 'none';
    next.accessories.fantasyId = 'none';
    next.accessories.towelId = 'none';
    return next;
  }, [appearance]);

  useEffect(() => {
    if (!autoRotate || reducedMotion) return;
    const interval = window.setInterval(() => {
      const current = TRAINER_DIRECTIONS.indexOf(direction);
      onDirectionChange(
        TRAINER_DIRECTIONS[(current + 1) % TRAINER_DIRECTIONS.length]!,
      );
    }, 1_600);
    return () => window.clearInterval(interval);
  }, [autoRotate, direction, onDirectionChange, reducedMotion]);

  const rotate = (step: -1 | 1) => {
    const current = TRAINER_DIRECTIONS.indexOf(direction);
    onDirectionChange(
      TRAINER_DIRECTIONS[
        (current + step + TRAINER_DIRECTIONS.length) %
          TRAINER_DIRECTIONS.length
      ]!,
    );
  };

  const cyclePose = (step: -1 | 1) => {
    const current = TRAINER_POSE_DEFINITIONS.findIndex(
      (entry) => entry.id === pose,
    );
    onPoseChange(
      TRAINER_POSE_DEFINITIONS[
        (current + step + TRAINER_POSE_DEFINITIONS.length) %
          TRAINER_POSE_DEFINITIONS.length
      ]!.id,
    );
  };

  const scale = previewSize === 'small' ? 2 : 4.6;
  const comparisonScale = previewSize === 'small' ? 1.6 : 3;
  const figure = (
    figureAppearance: TrainerAppearance,
    label: string,
    facing = direction,
    mirrored = false,
    highlightedRegion?: 'upper-body' | 'core' | 'lower-body',
  ) => (
    <figure key={`${label}-${facing}`}>
      <TrainerPixelSprite
        appearance={figureAppearance}
        className={mirrored ? 'trainer-mirrored-canvas' : ''}
        direction={facing}
        highlightRegion={
          previewMode === 'muscle-highlight' ? highlightedRegion : undefined
        }
        label={label}
        pose={pose}
        reducedMotion={reducedMotion}
        scale={
          previewMode === 'single' ||
          previewMode === 'silhouette'
            ? scale
            : previewMode === 'muscle-highlight'
              ? 1.9
              : comparisonScale
        }
        silhouette={previewMode === 'silhouette'}
      />
      <figcaption>{label}</figcaption>
    </figure>
  );

  let previewContent = figure(appearance, name || 'Trainer');
  if (previewMode === 'before-after') {
    previewContent = (
      <>
        {figure(initialAppearance, 'Before')}
        {figure(appearance, 'Current')}
      </>
    );
  } else if (previewMode === 'front-back') {
    previewContent = (
      <>
        {figure(appearance, 'Front', 'front')}
        {figure(appearance, 'Back', 'back')}
      </>
    );
  } else if (previewMode === 'mirrored') {
    previewContent = (
      <>
        {figure(appearance, 'Original')}
        {figure(appearance, 'Mirror', direction, true)}
      </>
    );
  } else if (previewMode === 'muscle-highlight') {
    previewContent = (
      <>
        {figure(appearance, 'Upper Body', direction, false, 'upper-body')}
        {figure(appearance, 'Core', direction, false, 'core')}
        {figure(appearance, 'Lower Body', direction, false, 'lower-body')}
      </>
    );
  } else if (previewMode === 'clothing-compare') {
    previewContent = (
      <>
        {figure(appearance, 'Outfit')}
        {figure(competitionAppearance, 'Posing Outfit')}
      </>
    );
  }

  return (
    <>
      <div className="trainer-preview-tool-strip" aria-label="Preview modes">
        {PREVIEW_MODES.map((mode) => (
          <button
            aria-pressed={previewMode === mode.id}
            className={previewMode === mode.id ? 'active' : ''}
            data-setup-control="true"
            key={mode.id}
            onClick={() => setPreviewMode(mode.id)}
            type="button"
          >
            {mode.label}
          </button>
        ))}
      </div>
      <div
        className={`trainer-preview-stage trainer-lighting-${lighting} trainer-preview-size-${previewSize}`}
        data-preview-mode={previewMode}
      >
        {previewContent}
      </div>
      <div className="trainer-rotation-controls" aria-label="Preview rotation">
        <button
          aria-label="Rotate trainer left"
          data-setup-control="true"
          onClick={() => rotate(-1)}
          type="button"
        >
          ←
        </button>
        <span>{direction}</span>
        <button
          aria-label="Rotate trainer right"
          data-setup-control="true"
          onClick={() => rotate(1)}
          type="button"
        >
          →
        </button>
      </div>
      <div className="trainer-preview-secondary-tools">
        <div aria-label="Preview lighting">
          {LIGHTING_MODES.map((mode) => (
            <button
              aria-pressed={lighting === mode.id}
              className={lighting === mode.id ? 'active' : ''}
              data-setup-control="true"
              key={mode.id}
              onClick={() => setLighting(mode.id)}
              type="button"
            >
              {mode.label}
            </button>
          ))}
        </div>
        <div aria-label="Preview size">
          <button
            aria-pressed={previewSize === 'small'}
            className={previewSize === 'small' ? 'active' : ''}
            data-setup-control="true"
            onClick={() => setPreviewSize('small')}
            type="button"
          >
            In-Game Size
          </button>
          <button
            aria-pressed={previewSize === 'large'}
            className={previewSize === 'large' ? 'active' : ''}
            data-setup-control="true"
            onClick={() => setPreviewSize('large')}
            type="button"
          >
            Creator Size
          </button>
        </div>
      </div>
      <div className="trainer-pose-cycle">
        <button
          aria-label="Previous pose"
          data-setup-control="true"
          onClick={() => cyclePose(-1)}
          type="button"
        >
          Previous Pose
        </button>
        <strong>{TRAINER_POSE_DEFINITIONS.find((entry) => entry.id === pose)?.label}</strong>
        <button
          aria-label="Next pose"
          data-setup-control="true"
          onClick={() => cyclePose(1)}
          type="button"
        >
          Next Pose
        </button>
      </div>
      <button
        aria-pressed={autoRotate}
        className="trainer-auto-rotate"
        data-setup-control="true"
        disabled={reducedMotion}
        onClick={() => setAutoRotate((active) => !active)}
        type="button"
      >
        {autoRotate ? 'Stop Slow Rotation' : 'Start Slow Rotation'}
      </button>
    </>
  );
}
