import type { TrainerStudioDrawerId } from './studioConfig';

type TrainerStudioHeaderProps = Readonly<{
  canRedo: boolean;
  canUndo: boolean;
  mode: 'new' | 'edit';
  name: string;
  onDrawerOpen: (drawer: TrainerStudioDrawerId) => void;
  onNameChange: (name: string) => void;
  onRedo: () => void;
  onReset: () => void;
  onUndo: () => void;
  presetLabel: string;
  resetDisabled: boolean;
}>;

export function TrainerStudioHeader({
  canRedo,
  canUndo,
  mode,
  name,
  onDrawerOpen,
  onNameChange,
  onRedo,
  onReset,
  onUndo,
  presetLabel,
  resetDisabled,
}: TrainerStudioHeaderProps) {
  return (
    <header className="trainer-studio-header">
      <div className="trainer-studio-wordmark">
        <h1 className="trainer-studio-screen-reader-title">GYM BUDDIES</h1>
        <span aria-hidden="true">GB</span>
        <strong title="Gym Buddies Trainer Forge">TRAINER FORGE</strong>
        {mode === 'edit' ? <small>PROGRESS PRESERVED</small> : null}
      </div>
      <label className="trainer-studio-name">
        <span>Name</span>
        <input
          aria-label="Trainer name"
          data-setup-autofocus="true"
          data-setup-control="true"
          maxLength={14}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Trainer"
          value={name}
        />
      </label>
      <span className="trainer-studio-current-preset" title={presetLabel}>
        <small>PHYSIQUE</small>
        <strong>{presetLabel}</strong>
      </span>
      <nav className="trainer-studio-header-actions" aria-label="Forge history and tools">
        <button type="button" data-setup-control="true" disabled={!canUndo} onClick={onUndo}>Undo</button>
        <button type="button" data-setup-control="true" disabled={!canRedo} onClick={onRedo}>Redo</button>
        <button type="button" data-setup-control="true" onClick={() => onDrawerOpen('randomize')}>Randomize</button>
        <button type="button" data-setup-control="true" onClick={() => onDrawerOpen('saved-looks')}>Saved Looks</button>
        <button type="button" data-setup-control="true" disabled={resetDisabled} onClick={onReset}>Reset</button>
        <button type="button" data-setup-control="true" onClick={() => onDrawerOpen('help')}>Help</button>
      </nav>
    </header>
  );
}
