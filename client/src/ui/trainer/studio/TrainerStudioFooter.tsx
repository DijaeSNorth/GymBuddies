import { TRAINER_POSE_DEFINITIONS } from '../../../game/content/bodybuilding';
import type { TrainerFacingDirection, TrainerPose, TrainerStartMode } from '../../../game/types';
import { TRAINER_DIRECTIONS } from '../TrainerPreviewControls';

type TrainerStudioFooterProps = Readonly<{
  direction: TrainerFacingDirection;
  mode: 'new' | 'edit';
  onCancelEdit: () => void;
  onDirectionChange: (direction: TrainerFacingDirection) => void;
  onPoseChange: (pose: TrainerPose) => void;
  onStartModeChange: (mode: TrainerStartMode) => void;
  physiqueLevel: number;
  pose: TrainerPose;
  startMode: TrainerStartMode;
  validationIssues: readonly string[];
}>;

export function TrainerStudioFooter({
  direction,
  mode,
  onCancelEdit,
  onDirectionChange,
  onPoseChange,
  onStartModeChange,
  physiqueLevel,
  pose,
  startMode,
  validationIssues,
}: TrainerStudioFooterProps) {
  return (
    <footer className="trainer-studio-footer">
      <label>
        <span>Pose</span>
        <select data-setup-control="true" value={pose} onChange={(event) => onPoseChange(event.target.value as TrainerPose)}>
          {TRAINER_POSE_DEFINITIONS.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
        </select>
      </label>
      <label>
        <span>Direction</span>
        <select data-setup-control="true" value={direction} onChange={(event) => onDirectionChange(event.target.value as TrainerFacingDirection)}>
          {TRAINER_DIRECTIONS.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
        </select>
      </label>
      <span className="trainer-studio-physique-level"><small>GAMEPLAY PHYSIQUE</small><strong>{String(physiqueLevel).padStart(2, '0')}</strong></span>
      <span className={`trainer-studio-validation ${validationIssues.length ? 'invalid' : 'valid'}`} role="status">
        {validationIssues[0] ?? 'Appearance valid'}
      </span>
      {mode === 'new' ? (
        <label className="trainer-studio-start-mode">
          <span>Opening</span>
          <select data-setup-control="true" value={startMode} onChange={(event) => onStartModeChange(event.target.value as TrainerStartMode)}>
            <option value="guided">Guided Tutorial</option>
            <option value="normal">Normal Start</option>
          </select>
        </label>
      ) : (
        <button type="button" className="secondary-btn" data-setup-control="true" onClick={onCancelEdit}>Cancel Changes</button>
      )}
      <button className="primary-btn trainer-studio-confirm" data-setup-control="true" disabled={validationIssues.length > 0} type="submit">
        {mode === 'new'
          ? startMode === 'guided'
            ? 'Start Guided Journey'
            : 'Start Journey'
          : 'Save Appearance'}
      </button>
    </footer>
  );
}
