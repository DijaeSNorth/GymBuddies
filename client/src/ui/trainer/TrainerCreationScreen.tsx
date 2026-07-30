import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  DEFAULT_TRAINER_APPEARANCE,
  TRAINER_BUILD_ATTRIBUTES,
  TRAINER_RANDOMIZATION_FILTERS,
  cloneTrainerAppearance,
  getTrainerPhysiquePresetById,
} from '../../game/content/trainerAppearance';
import {
  gamepadActions,
  keyboardEventToAction,
  type InputAction,
} from '../../game/input/actionMap';
import { subscribeToGamepadFrames } from '../../game/input/gamepadPolling';
import {
  randomizeTrainerAppearance,
} from '../../game/systems/trainerAppearance';
import type {
  KeyboardBindingMap,
  TrainerAppearance,
  TrainerAppearanceCategory,
  TrainerAppearancePreset,
  TrainerCreationDraft,
  TrainerFacingDirection,
  TrainerForgeMode,
  TrainerMuscleId,
  TrainerPose,
  TrainerRandomizationFilter,
  TrainerStartMode,
} from '../../game/types';
import {
  TRAINER_CUSTOMIZATION_TABS,
  TrainerCustomizationControls,
} from './TrainerCustomizationControls';
import {
  TrainerPreviewControls,
} from './TrainerPreviewControls';
import { TrainerPreviewWorkbench } from './TrainerPreviewWorkbench';
import './trainerCreation.css';

interface TrainerCreationScreenProps {
  draft: TrainerCreationDraft;
  keyboardBindings: KeyboardBindingMap;
  mode: 'new' | 'edit';
  physiqueLevel: number;
  reducedMotion: boolean;
  restartConfirmationOpen: boolean;
  startMode: TrainerStartMode;
  validationIssues: readonly string[];
  onAppearanceChange: (appearance: TrainerAppearance) => void;
  onAppearancePresetsChange: (
    presets: readonly TrainerAppearancePreset[],
  ) => void;
  onCancelEdit: () => void;
  onCancelRestart: () => void;
  onConfirm: () => void;
  onConfirmRestart: () => void;
  onMuscleChange: (key: TrainerMuscleId, value: number) => void;
  onNameChange: (value: string) => void;
  onPhysiquePresetSelect: (presetId: string) => void;
  onPresetSelect: (presetId: string) => void;
  onRequestRestart: () => void;
  onStartModeChange: (mode: TrainerStartMode) => void;
}

const GAMEPAD_REPEAT_MS = 240;
function focusableSetupControls(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      '[data-setup-control="true"]:not([disabled])',
    ),
  ).filter((element) => element.offsetParent !== null);
}

function updateFocusedRange(
  element: HTMLInputElement,
  direction: -1 | 1,
) {
  const step = Number(element.step || 1);
  const minimum = Number(element.min || 0);
  const maximum = Number(element.max || 100);
  const next = Math.min(
    maximum,
    Math.max(minimum, Number(element.value) + direction * step),
  );
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set;
  setter?.call(element, String(next));
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function updateFocusedSelect(
  element: HTMLSelectElement,
  direction: -1 | 1,
) {
  const nextIndex = Math.min(
    element.options.length - 1,
    Math.max(0, element.selectedIndex + direction),
  );
  if (nextIndex === element.selectedIndex) return;
  element.selectedIndex = nextIndex;
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function sameAppearance(left: TrainerAppearance, right: TrainerAppearance) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function JourneyRestartDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const controls = dialog
      ? Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled])'))
      : [];
    controls[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== 'Tab' || controls.length < 2) return;
      const index = controls.indexOf(document.activeElement as HTMLElement);
      const nextIndex = event.shiftKey
        ? (index - 1 + controls.length) % controls.length
        : (index + 1) % controls.length;
      event.preventDefault();
      controls[nextIndex]?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel, open]);
  if (!open) return null;
  return (
    <div className="trainer-dialog-backdrop">
      <section
        aria-describedby="restart-journey-description"
        aria-labelledby="restart-journey-title"
        aria-modal="true"
        className="trainer-restart-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <p className="trainer-kicker">Permanent journey reset</p>
        <h2 id="restart-journey-title">Restart Gym Buddies?</h2>
        <p id="restart-journey-description">
          This replaces the current versioned save, including Buddies, routes,
          gym progress, victories, items, and trainer settings. It cannot be
          undone through normal play, but the current valid save will be kept
          as the previous-save backup.
        </p>
        <div className="action-row">
          <button
            autoFocus
            className="secondary-btn"
            data-setup-control="true"
            onClick={onCancel}
            type="button"
          >
            Keep Current Journey
          </button>
          <button
            className="trainer-confirm-reset"
            data-setup-control="true"
            onClick={onConfirm}
            type="button"
          >
            Yes, Restart Everything
          </button>
        </div>
      </section>
    </div>
  );
}

export function TrainerCreationScreen({
  draft,
  keyboardBindings,
  mode,
  physiqueLevel,
  reducedMotion,
  restartConfirmationOpen,
  startMode,
  validationIssues,
  onAppearanceChange,
  onAppearancePresetsChange,
  onCancelEdit,
  onCancelRestart,
  onConfirm,
  onConfirmRestart,
  onMuscleChange,
  onNameChange,
  onPhysiquePresetSelect,
  onPresetSelect,
  onRequestRestart,
  onStartModeChange,
}: TrainerCreationScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const initialAppearanceRef = useRef(
    cloneTrainerAppearance(draft.appearance),
  );
  const randomSeedRef = useRef((Date.now() ^ 0x47594d42) >>> 0);
  const previousGamepadActionsRef = useRef(new Set<InputAction>());
  const nextGamepadRepeatAtRef = useRef(0);
  const [activeTab, setActiveTab] =
    useState<TrainerAppearanceCategory>('build');
  const [forgeMode, setForgeMode] =
    useState<TrainerForgeMode>('quick');
  const [randomizationFilter, setRandomizationFilter] =
    useState<TrainerRandomizationFilter>('any-physique');
  const [direction, setDirection] =
    useState<TrainerFacingDirection>('front');
  const [pose, setPose] = useState<TrainerPose>('idle');
  const [undoStack, setUndoStack] = useState<TrainerAppearance[]>([]);
  const [redoStack, setRedoStack] = useState<TrainerAppearance[]>([]);

  const commitAppearance = useCallback(
    (appearance: TrainerAppearance) => {
      if (sameAppearance(appearance, draft.appearance)) return;
      setUndoStack((stack) => [
        ...stack.slice(-31),
        cloneTrainerAppearance(draft.appearance),
      ]);
      setRedoStack([]);
      onAppearanceChange(appearance);
    },
    [draft.appearance, onAppearanceChange],
  );

  const undo = useCallback(() => {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [
      ...stack.slice(-31),
      cloneTrainerAppearance(draft.appearance),
    ]);
    onAppearanceChange(previous);
  }, [draft.appearance, onAppearanceChange, undoStack]);

  const redo = useCallback(() => {
    const next = redoStack.at(-1);
    if (!next) return;
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [
      ...stack.slice(-31),
      cloneTrainerAppearance(draft.appearance),
    ]);
    onAppearanceChange(next);
  }, [draft.appearance, onAppearanceChange, redoStack]);

  const resetCategory = useCallback(() => {
    const next = cloneTrainerAppearance(draft.appearance);
    if (
      activeTab === 'build' ||
      activeTab === 'upper-body' ||
      activeTab === 'core' ||
      activeTab === 'lower-body'
    ) {
      for (const attribute of TRAINER_BUILD_ATTRIBUTES) {
        if (
          forgeMode === 'quick'
            ? attribute.quick
            : attribute.region === activeTab
        ) {
          next.build[attribute.id] =
            DEFAULT_TRAINER_APPEARANCE.build[attribute.id];
        }
      }
    } else if (activeTab === 'face') {
      next.face = { ...DEFAULT_TRAINER_APPEARANCE.face };
    } else if (activeTab === 'hair') {
      next.hair = { ...DEFAULT_TRAINER_APPEARANCE.hair };
    } else if (activeTab === 'outfit') {
      next.outfit = { ...DEFAULT_TRAINER_APPEARANCE.outfit };
    } else if (activeTab === 'colors') {
      next.colors = { ...DEFAULT_TRAINER_APPEARANCE.colors };
    } else if (activeTab === 'accessories') {
      next.accessories = { ...DEFAULT_TRAINER_APPEARANCE.accessories };
    } else if (activeTab === 'poses' || activeTab === 'saved-looks') {
      return;
    }
    commitAppearance(next);
  }, [activeTab, commitAppearance, draft.appearance, forgeMode]);

  const applyPhysiquePreset = (presetId: string) => {
    const preset = getTrainerPhysiquePresetById(presetId);
    setUndoStack((stack) => [
      ...stack.slice(-31),
      cloneTrainerAppearance(draft.appearance),
    ]);
    setRedoStack([]);
    onPhysiquePresetSelect(preset.id);
  };

  const randomize = () => {
    randomSeedRef.current =
      (Math.imul(randomSeedRef.current, 1664525) + 1013904223) >>> 0;
    commitAppearance(
      randomizeTrainerAppearance(
        randomSeedRef.current,
        randomizationFilter,
      ),
    );
  };

  useEffect(() => {
    if (
      forgeMode === 'quick' &&
      (activeTab === 'upper-body' ||
        activeTab === 'core' ||
        activeTab === 'lower-body')
    ) {
      setActiveTab('build');
    }
  }, [activeTab, forgeMode]);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const firstControl = rootRef.current?.querySelector<HTMLElement>(
      '[data-setup-autofocus="true"]',
    );
    firstControl?.focus();
  }, [mode]);

  useEffect(() => {
    const handleAction = (action: InputAction) => {
      const root = rootRef.current;
      if (!root) return;
      const controls = focusableSetupControls(root);
      if (!controls.length) return;
      const active = document.activeElement as HTMLElement | null;
      let index = active ? controls.indexOf(active) : -1;

      if (
        (active instanceof HTMLInputElement && active.type === 'range') ||
        active instanceof HTMLSelectElement
      ) {
        if (action === 'move-left' || action === 'move-right') {
          const step = action === 'move-left' ? -1 : 1;
          if (active instanceof HTMLInputElement) {
            updateFocusedRange(active, step);
          } else {
            updateFocusedSelect(active, step);
          }
          return;
        }
      }
      if (
        action === 'move-up' ||
        action === 'move-left' ||
        action === 'move-down' ||
        action === 'move-right'
      ) {
        const step =
          action === 'move-up' || action === 'move-left' ? -1 : 1;
        index = (index + step + controls.length) % controls.length;
        controls[index]?.focus();
        return;
      }
      if (action === 'confirm' || action === 'interact') {
        if (index < 0) {
          controls[0]?.focus();
          return;
        }
        if (
          active instanceof HTMLButtonElement ||
          active instanceof HTMLInputElement
        ) {
          active.click();
        }
        return;
      }
      if (
        (action === 'cancel' || action === 'menu') &&
        mode === 'edit'
      ) {
        onCancelEdit();
      }
    };

    return subscribeToGamepadFrames((gamepad, now) => {
      const actions = gamepad
        ? gamepadActions(gamepad.buttons, gamepad.axes)
        : new Set<InputAction>();
      const previous = previousGamepadActionsRef.current;
      const newlyPressed = [...actions].filter(
        (action) => !previous.has(action),
      );
      const repeated =
        actions.size > 0 && now >= nextGamepadRepeatAtRef.current
          ? [...actions]
          : [];
      const nextAction = newlyPressed[0] ?? repeated[0];
      if (nextAction) {
        handleAction(nextAction);
        nextGamepadRepeatAtRef.current = now + GAMEPAD_REPEAT_MS;
      }
      if (actions.size === 0) nextGamepadRepeatAtRef.current = 0;
      previousGamepadActionsRef.current = actions;
    });
  }, [mode, onCancelEdit]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (validationIssues.length === 0) onConfirm();
  };

  return (
    <div
      className="app-shell trainer-creation-shell trainer-studio-v2"
      ref={rootRef}
      onKeyDownCapture={(event) => {
        const action = keyboardEventToAction(
          event.nativeEvent,
          keyboardBindings,
        );
        if (!action) return;
        const active = document.activeElement as HTMLElement | null;
        if (
          active instanceof HTMLInputElement &&
          (active.type === 'text' || active.type === 'radio')
        ) {
          if (action !== 'cancel') return;
        }
        if (action === 'cancel' && mode === 'edit') {
          event.preventDefault();
          onCancelEdit();
          return;
        }
        if (
          active instanceof HTMLInputElement &&
          active.type === 'range' &&
          (action === 'move-left' || action === 'move-right')
        ) {
          event.preventDefault();
          updateFocusedRange(active, action === 'move-left' ? -1 : 1);
          return;
        }
        if (
          action === 'confirm' &&
          (active instanceof HTMLButtonElement ||
            (active instanceof HTMLInputElement && active.type !== 'text'))
        ) {
          event.preventDefault();
          active.click();
        }
      }}
    >
      <header className="top-banner trainer-creation-header">
        <div>
          <p className="trainer-kicker">
            {mode === 'new'
              ? 'New journey · required setup'
              : 'Trainer studio · progress preserved'}
          </p>
          <h1>GYM BUDDIES</h1>
          <p>
            Trainer Forge: build an original fitness hero with a powerful
            silhouette and your own proportions, features, outfit, and palette.
          </p>
        </div>
        <div className="trainer-control-hint" aria-label="Setup controls">
          Keyboard: Tab and arrows · Touch: tap and drag · Gamepad: D-pad,
          south button, east button to cancel
        </div>
      </header>

      <form className="trainer-studio-layout" onSubmit={submit}>
        <aside
          aria-label="Live animated trainer preview"
          className="panel trainer-preview-panel trainer-studio-preview"
        >
          <div className="trainer-section-heading">
            <span className="trainer-step">01</span>
            <div>
              <h2>Live Preview</h2>
              <p>{direction} · {pose}</p>
            </div>
          </div>
          <TrainerPreviewWorkbench
            appearance={draft.appearance}
            direction={direction}
            initialAppearance={initialAppearanceRef.current}
            name={draft.name || 'Trainer'}
            onDirectionChange={setDirection}
            onPoseChange={setPose}
            pose={pose}
            reducedMotion={reducedMotion}
          />
          <label className="trainer-name-field">
            Trainer name
            <input
              data-setup-autofocus="true"
              data-setup-control="true"
              maxLength={14}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Trainer"
              value={draft.name}
            />
          </label>
          <div className="trainer-physique-card" aria-live="polite">
            <span>Gameplay Physique Level</span>
            <strong>{String(physiqueLevel).padStart(2, '0')}</strong>
            <small>
              Calculated from fictional gameplay attributes—not cosmetic body
              proportions or a real-world assessment.
            </small>
          </div>
          {mode === 'edit' ? (
            <div className="trainer-progress-safe">
              Saving here preserves Buddies, routes, victories, items, fatigue,
              specialization, equipment bonuses, and gym progress.
            </div>
          ) : null}
        </aside>

        <main className="panel trainer-studio-controls">
          <div className="trainer-section-heading">
            <span className="trainer-step">02</span>
            <div>
              <h2>Customize</h2>
              <p>Every option uses a stable content ID.</p>
            </div>
          </div>
          <div className="trainer-forge-mode" aria-label="Trainer Forge mode">
            <button
              aria-pressed={forgeMode === 'quick'}
              className={forgeMode === 'quick' ? 'active' : ''}
              data-setup-control="true"
              onClick={() => setForgeMode('quick')}
              type="button"
            >
              <strong>Quick Forge</strong>
              <small>Presets and essential silhouette controls</small>
            </button>
            <button
              aria-pressed={forgeMode === 'detail'}
              className={forgeMode === 'detail' ? 'active' : ''}
              data-setup-control="true"
              onClick={() => setForgeMode('detail')}
              type="button"
            >
              <strong>Detail Forge</strong>
              <small>Every regional proportion and comparison tool</small>
            </button>
          </div>
          <div
            aria-label="Trainer customization sections"
            className="trainer-custom-tabs"
            role="tablist"
          >
            {TRAINER_CUSTOMIZATION_TABS.filter(
              (tab) => forgeMode === 'detail' || !tab.detailOnly,
            ).map((tab) => (
              <button
                aria-controls={`trainer-tab-panel-${tab.id}`}
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? 'active' : ''}
                data-setup-control="true"
                id={`trainer-tab-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="trainer-history-toolbar">
            <label className="trainer-random-filter">
              Random style
              <select
                data-setup-control="true"
                onChange={(event) =>
                  setRandomizationFilter(
                    event.target.value as TrainerRandomizationFilter,
                  )
                }
                value={randomizationFilter}
              >
                {TRAINER_RANDOMIZATION_FILTERS.map((filter) => (
                  <option key={filter.id} value={filter.id}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              data-setup-control="true"
              onClick={randomize}
              type="button"
            >
              Randomize
            </button>
            <button
              data-setup-control="true"
              disabled={undoStack.length === 0}
              onClick={undo}
              type="button"
            >
              Undo
            </button>
            <button
              data-setup-control="true"
              disabled={redoStack.length === 0}
              onClick={redo}
              type="button"
            >
              Redo
            </button>
            <button
              data-setup-control="true"
              disabled={
                activeTab === 'poses' || activeTab === 'saved-looks'
              }
              onClick={resetCategory}
              type="button"
            >
              Reset {activeTab.replace('-', ' ')}
            </button>
          </div>
          <section
            aria-labelledby={`trainer-tab-${activeTab}`}
            className="trainer-custom-tab-panel"
            id={`trainer-tab-panel-${activeTab}`}
            role="tabpanel"
          >
            <TrainerCustomizationControls
              activeTab={activeTab}
              draft={draft}
              forgeMode={forgeMode}
              onAppearanceChange={commitAppearance}
              onGameplayPresetSelect={onPresetSelect}
              onMuscleChange={onMuscleChange}
              onPhysiquePresetSelect={applyPhysiquePreset}
              poseContent={
                <TrainerPreviewControls
                  appearance={draft.appearance}
                  appearancePresets={draft.appearancePresets}
                  direction={direction}
                  onAppearanceLoad={commitAppearance}
                  onAppearancePresetsChange={
                    onAppearancePresetsChange
                  }
                  onDirectionChange={setDirection}
                  onPoseChange={setPose}
                  pose={pose}
                  section="poses"
                />
              }
              savedLooksContent={
                <TrainerPreviewControls
                  appearance={draft.appearance}
                  appearancePresets={draft.appearancePresets}
                  direction={direction}
                  onAppearanceLoad={commitAppearance}
                  onAppearancePresetsChange={
                    onAppearancePresetsChange
                  }
                  onDirectionChange={setDirection}
                  onPoseChange={setPose}
                  pose={pose}
                  section="saved-looks"
                />
              }
            />
          </section>
        </main>

        <aside className="panel trainer-studio-finish">
          <div className="trainer-section-heading">
            <span className="trainer-step">03</span>
            <div>
              <h2>Finish</h2>
              <p>Your full appearance is stored in the versioned save.</p>
            </div>
          </div>
          {mode === 'new' ? (
            <fieldset className="trainer-fieldset trainer-start-mode">
              <legend>Choose your opening</legend>
              <label className={startMode === 'guided' ? 'active' : ''}>
                <input
                  checked={startMode === 'guided'}
                  data-setup-control="true"
                  name="trainer-start-mode"
                  onChange={() => onStartModeChange('guided')}
                  type="radio"
                />
                <span>
                  <strong>Guided Tutorial</strong>
                  <small>
                    Learn Home Gym training, route travel, scouting, capture,
                    and boss signals step by step.
                  </small>
                </span>
              </label>
              <label className={startMode === 'normal' ? 'active' : ''}>
                <input
                  checked={startMode === 'normal'}
                  data-setup-control="true"
                  name="trainer-start-mode"
                  onChange={() => onStartModeChange('normal')}
                  type="radio"
                />
                <span>
                  <strong>Normal Start</strong>
                  <small>
                    Begin at Home Gym with normal systems available and
                    tutorial guidance completed.
                  </small>
                </span>
              </label>
            </fieldset>
          ) : null}
          <div className="trainer-separation-card">
            <strong>Cosmetics stay cosmetic</strong>
            <p>
              Visible arms, body mass, equipment, fatigue presentation, and
              style selections never silently modify battle power.
            </p>
          </div>
          {validationIssues.length > 0 ? (
            <div className="trainer-validation" role="alert">
              {validationIssues[0]}
            </div>
          ) : null}
          <div className="trainer-creation-actions">
            <button
              className="primary-btn"
              data-setup-control="true"
              disabled={validationIssues.length > 0}
              type="submit"
            >
              {mode === 'new'
                ? startMode === 'guided'
                  ? 'Confirm & Start Guided Journey'
                  : 'Confirm & Start Journey'
                : 'Save Trainer Appearance'}
            </button>
            {mode === 'edit' ? (
              <button
                className="secondary-btn"
                data-setup-control="true"
                onClick={onCancelEdit}
                type="button"
              >
                Cancel Changes
              </button>
            ) : null}
            <button
              className="trainer-danger-link"
              data-setup-control="true"
              onClick={onRequestRestart}
              type="button"
            >
              Restart Entire Journey
            </button>
          </div>
        </aside>
      </form>

      <JourneyRestartDialog
        onCancel={onCancelRestart}
        onConfirm={onConfirmRestart}
        open={restartConfirmationOpen}
      />
    </div>
  );
}
