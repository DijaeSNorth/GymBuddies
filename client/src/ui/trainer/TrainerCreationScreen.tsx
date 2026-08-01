import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  DEFAULT_TRAINER_APPEARANCE,
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
import { randomizeTrainerAppearance } from '../../game/systems/trainerAppearance';
import type {
  KeyboardBindingMap,
  TrainerAppearance,
  TrainerAppearancePreset,
  TrainerCreationDraft,
  TrainerFacingDirection,
  TrainerForgeMode,
  TrainerMuscleId,
  TrainerPose,
  TrainerRandomizationFilter,
  TrainerStartMode,
} from '../../game/types';
import { TrainerPreviewControls } from './TrainerPreviewControls';
import { TrainerPreviewWorkbench } from './TrainerPreviewWorkbench';
import { BuildNavigator } from './studio/BuildNavigator';
import { CustomizationInspector } from './studio/CustomizationInspector';
import { TrainerStudioDrawer } from './studio/TrainerStudioDrawer';
import { TrainerStudioFooter } from './studio/TrainerStudioFooter';
import { TrainerStudioHeader } from './studio/TrainerStudioHeader';
import {
  QUICK_FORGE_BUILD_IDS,
  TRAINER_STUDIO_SECTIONS,
  getBodyControlGroup,
  getBodyRegion,
  type TrainerBodyRegionId,
  type TrainerStudioDrawerId,
  type TrainerStudioSection,
} from './studio/studioConfig';
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
  onAppearancePresetsChange: (presets: readonly TrainerAppearancePreset[]) => void;
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
    root.querySelectorAll<HTMLElement>('[data-setup-control="true"]:not([disabled])'),
  ).filter((element) => element.offsetParent !== null);
}

function updateFocusedRange(element: HTMLInputElement, direction: -1 | 1) {
  const step = Number(element.step || 1);
  const minimum = Number(element.min || 0);
  const maximum = Number(element.max || 100);
  const next = Math.min(maximum, Math.max(minimum, Number(element.value) + direction * step));
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(element, String(next));
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function updateFocusedSelect(element: HTMLSelectElement, direction: -1 | 1) {
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
          <button autoFocus className="secondary-btn" data-setup-control="true" onClick={onCancel} type="button">
            Keep Current Journey
          </button>
          <button className="trainer-confirm-reset" data-setup-control="true" onClick={onConfirm} type="button">
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
  const initialAppearanceRef = useRef(cloneTrainerAppearance(draft.appearance));
  const randomSeedRef = useRef((Date.now() ^ 0x47594d42) >>> 0);
  const previousGamepadActionsRef = useRef(new Set<InputAction>());
  const nextGamepadRepeatAtRef = useRef(0);
  const [activeSection, setActiveSection] = useState<TrainerStudioSection>('build');
  const [activeDrawer, setActiveDrawer] = useState<TrainerStudioDrawerId | null>(null);
  const [forgeMode, setForgeMode] = useState<TrainerForgeMode>('quick');
  const [randomizationFilter, setRandomizationFilter] =
    useState<TrainerRandomizationFilter>('any-physique');
  const [selectedBodyRegion, setSelectedBodyRegion] = useState<TrainerBodyRegionId>('overall');
  const [selectedBodyGroupId, setSelectedBodyGroupId] = useState('overall-frame');
  const [direction, setDirection] = useState<TrainerFacingDirection>('front');
  const [pose, setPose] = useState<TrainerPose>('idle');
  const [undoStack, setUndoStack] = useState<TrainerAppearance[]>([]);
  const [redoStack, setRedoStack] = useState<TrainerAppearance[]>([]);

  const commitAppearance = useCallback(
    (appearance: TrainerAppearance) => {
      if (sameAppearance(appearance, draft.appearance)) return;
      setUndoStack((stack) => [...stack.slice(-31), cloneTrainerAppearance(draft.appearance)]);
      setRedoStack([]);
      onAppearanceChange(appearance);
    },
    [draft.appearance, onAppearanceChange],
  );

  const undo = useCallback(() => {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [...stack.slice(-31), cloneTrainerAppearance(draft.appearance)]);
    onAppearanceChange(previous);
  }, [draft.appearance, onAppearanceChange, undoStack]);

  const redo = useCallback(() => {
    const next = redoStack.at(-1);
    if (!next) return;
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [...stack.slice(-31), cloneTrainerAppearance(draft.appearance)]);
    onAppearanceChange(next);
  }, [draft.appearance, onAppearanceChange, redoStack]);

  const selectBodyRegion = (regionId: TrainerBodyRegionId) => {
    const region = getBodyRegion(regionId);
    setSelectedBodyRegion(region.id);
    setSelectedBodyGroupId(region.groups[0]!.id);
    setActiveSection('build');
  };

  const resetCurrentSection = useCallback(() => {
    if (activeSection === 'poses' || activeSection === 'gameplay') return;
    const next = cloneTrainerAppearance(draft.appearance);
    if (activeSection === 'build') {
      const attributeIds = forgeMode === 'quick'
        ? QUICK_FORGE_BUILD_IDS
        : getBodyControlGroup(selectedBodyRegion, selectedBodyGroupId).attributeIds;
      for (const attributeId of attributeIds) {
        next.build[attributeId] = DEFAULT_TRAINER_APPEARANCE.build[attributeId];
      }
    } else {
      next[activeSection] = { ...DEFAULT_TRAINER_APPEARANCE[activeSection] } as never;
    }
    commitAppearance(next);
  }, [activeSection, commitAppearance, draft.appearance, forgeMode, selectedBodyGroupId, selectedBodyRegion]);

  const applyPhysiquePreset = (presetId: string) => {
    const preset = getTrainerPhysiquePresetById(presetId);
    setUndoStack((stack) => [...stack.slice(-31), cloneTrainerAppearance(draft.appearance)]);
    setRedoStack([]);
    onPhysiquePresetSelect(preset.id);
  };

  const randomize = () => {
    randomSeedRef.current = (Math.imul(randomSeedRef.current, 1664525) + 1013904223) >>> 0;
    commitAppearance(randomizeTrainerAppearance(randomSeedRef.current, randomizationFilter));
  };

  useEffect(() => {
    document.body.classList.add('gb-trainer-studio-active');
    return () => document.body.classList.remove('gb-trainer-studio-active');
  }, []);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    rootRef.current?.querySelector<HTMLElement>('[data-setup-autofocus="true"]')?.focus();
  }, [mode]);

  useEffect(() => {
    const handleAction = (action: InputAction) => {
      const root = rootRef.current;
      if (!root) return;
      const controls = focusableSetupControls(root);
      if (!controls.length) return;
      const active = document.activeElement as HTMLElement | null;
      let index = active ? controls.indexOf(active) : -1;

      if ((active instanceof HTMLInputElement && active.type === 'range') || active instanceof HTMLSelectElement) {
        if (action === 'move-left' || action === 'move-right') {
          const step = action === 'move-left' ? -1 : 1;
          if (active instanceof HTMLInputElement) updateFocusedRange(active, step);
          else updateFocusedSelect(active, step);
          return;
        }
      }
      if (action === 'move-up' || action === 'move-left' || action === 'move-down' || action === 'move-right') {
        const step = action === 'move-up' || action === 'move-left' ? -1 : 1;
        index = (index + step + controls.length) % controls.length;
        controls[index]?.focus();
        return;
      }
      if (action === 'confirm' || action === 'interact') {
        if (index < 0) controls[0]?.focus();
        else if (active instanceof HTMLButtonElement || active instanceof HTMLInputElement) active.click();
        return;
      }
      if (action === 'cancel' || action === 'menu') {
        if (activeDrawer) setActiveDrawer(null);
        else if (mode === 'edit') onCancelEdit();
      }
    };

    return subscribeToGamepadFrames((gamepad, now) => {
      const actions = gamepad ? gamepadActions(gamepad.buttons, gamepad.axes) : new Set<InputAction>();
      const previous = previousGamepadActionsRef.current;
      const newlyPressed = [...actions].filter((action) => !previous.has(action));
      const repeated = actions.size > 0 && now >= nextGamepadRepeatAtRef.current ? [...actions] : [];
      const nextAction = newlyPressed[0] ?? repeated[0];
      if (nextAction) {
        handleAction(nextAction);
        nextGamepadRepeatAtRef.current = now + GAMEPAD_REPEAT_MS;
      }
      if (actions.size === 0) nextGamepadRepeatAtRef.current = 0;
      previousGamepadActionsRef.current = actions;
    });
  }, [activeDrawer, mode, onCancelEdit]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (validationIssues.length === 0) onConfirm();
  };

  const presetLabel = draft.physiquePresetId
    ? getTrainerPhysiquePresetById(draft.physiquePresetId).label
    : 'Custom Build';
  const activeSectionLabel = TRAINER_STUDIO_SECTIONS.find((section) => section.id === activeSection)?.label ?? 'Build';

  return (
    <div
      className="trainer-creation-shell trainer-studio-v3"
      data-forge-mode={forgeMode}
      data-section={activeSection}
      ref={rootRef}
      onKeyDownCapture={(event) => {
        const action = keyboardEventToAction(event.nativeEvent, keyboardBindings);
        if (!action) return;
        const active = document.activeElement as HTMLElement | null;
        if (active instanceof HTMLInputElement && (active.type === 'text' || active.type === 'radio')) {
          if (action !== 'cancel') return;
        }
        if (action === 'cancel') {
          if (activeDrawer) {
            event.preventDefault();
            setActiveDrawer(null);
          } else if (mode === 'edit') {
            event.preventDefault();
            onCancelEdit();
          }
          return;
        }
        if (active instanceof HTMLInputElement && active.type === 'range' && (action === 'move-left' || action === 'move-right')) {
          event.preventDefault();
          updateFocusedRange(active, action === 'move-left' ? -1 : 1);
          return;
        }
        if (action === 'confirm' && (active instanceof HTMLButtonElement || (active instanceof HTMLInputElement && active.type !== 'text'))) {
          event.preventDefault();
          active.click();
        }
      }}
    >
      <form className="trainer-studio-form" onSubmit={submit}>
        <TrainerStudioHeader
          canRedo={redoStack.length > 0}
          canUndo={undoStack.length > 0}
          mode={mode}
          name={draft.name}
          onDrawerOpen={setActiveDrawer}
          onNameChange={onNameChange}
          onRedo={redo}
          onReset={resetCurrentSection}
          onUndo={undo}
          presetLabel={presetLabel}
          resetDisabled={activeSection === 'poses' || activeSection === 'gameplay'}
        />

        <main className="trainer-studio-main">
          <BuildNavigator
            forgeMode={forgeMode}
            onModeChange={setForgeMode}
            onPresetSelect={applyPhysiquePreset}
            onRegionSelect={selectBodyRegion}
            selectedPresetId={draft.physiquePresetId ?? ''}
            selectedRegion={selectedBodyRegion}
          />

          <section className="trainer-studio-preview" aria-label="Live animated trainer preview">
            <div className="trainer-studio-preview-heading">
              <span><small>LIVE PREVIEW</small><strong>{draft.name || 'Trainer'}</strong></span>
              <span>{direction} · {pose}</span>
            </div>
            <TrainerPreviewWorkbench
              appearance={draft.appearance}
              compact
              direction={direction}
              highlightedRegion={getBodyRegion(selectedBodyRegion).previewRegion}
              initialAppearance={initialAppearanceRef.current}
              name={draft.name || 'Trainer'}
              onDirectionChange={setDirection}
              onPoseChange={setPose}
              pose={pose}
              reducedMotion={reducedMotion}
            />
            {mode === 'edit' ? (
              <p className="trainer-progress-safe">Appearance only · journey progress preserved</p>
            ) : null}
          </section>

          <CustomizationInspector
            activeSection={activeSection}
            direction={direction}
            draft={draft}
            forgeMode={forgeMode}
            onAppearanceChange={commitAppearance}
            onAppearancePresetsChange={onAppearancePresetsChange}
            onBodyGroupSelect={setSelectedBodyGroupId}
            onDirectionChange={setDirection}
            onGameplayPresetSelect={onPresetSelect}
            onMuscleChange={onMuscleChange}
            onPhysiquePresetSelect={applyPhysiquePreset}
            onPoseChange={setPose}
            onSectionChange={setActiveSection}
            pose={pose}
            selectedBodyGroupId={selectedBodyGroupId}
            selectedBodyRegion={selectedBodyRegion}
          />
        </main>

        <TrainerStudioFooter
          direction={direction}
          mode={mode}
          onCancelEdit={onCancelEdit}
          onDirectionChange={setDirection}
          onPoseChange={setPose}
          onStartModeChange={onStartModeChange}
          physiqueLevel={physiqueLevel}
          pose={pose}
          startMode={startMode}
          validationIssues={validationIssues}
        />
      </form>

      {activeDrawer === 'saved-looks' ? (
        <TrainerStudioDrawer onClose={() => setActiveDrawer(null)} title="Saved Looks">
          <TrainerPreviewControls
            appearance={draft.appearance}
            appearancePresets={draft.appearancePresets}
            direction={direction}
            onAppearanceLoad={commitAppearance}
            onAppearancePresetsChange={onAppearancePresetsChange}
            onDirectionChange={setDirection}
            onPoseChange={setPose}
            pose={pose}
            section="saved-looks"
          />
        </TrainerStudioDrawer>
      ) : null}

      {activeDrawer === 'randomize' ? (
        <TrainerStudioDrawer onClose={() => setActiveDrawer(null)} title="Controlled Randomizer">
          <div className="trainer-studio-randomizer">
            <p>Generate a valid muscular appearance using the existing deterministic filter rules.</p>
            <label>
              <span>Random style</span>
              <select
                data-setup-control="true"
                onChange={(event) => setRandomizationFilter(event.target.value as TrainerRandomizationFilter)}
                value={randomizationFilter}
              >
                {TRAINER_RANDOMIZATION_FILTERS.map((filter) => (
                  <option key={filter.id} value={filter.id}>{filter.label}</option>
                ))}
              </select>
            </label>
            <button className="primary-btn" data-setup-control="true" onClick={randomize} type="button">Randomize Appearance</button>
            <small>Undo remains available after closing this drawer.</small>
          </div>
        </TrainerStudioDrawer>
      ) : null}

      {activeDrawer === 'help' ? (
        <TrainerStudioDrawer onClose={() => setActiveDrawer(null)} title="Forge Help">
          <div className="trainer-studio-help">
            <h3>{activeSectionLabel}</h3>
            <p>Quick Forge exposes the strongest silhouette decisions. Detail Forge reveals every existing regional control without changing current values.</p>
            <p>Cosmetic proportions, outfit, pose, and colors remain separate from the fictional gameplay attributes under Gameplay.</p>
            <p><strong>Controls:</strong> Tab or D-pad to move, arrows to tune a focused slider, confirm to activate, and cancel to close a drawer.</p>
            <button className="trainer-danger-link" data-setup-control="true" onClick={onRequestRestart} type="button">Restart Entire Journey</button>
          </div>
        </TrainerStudioDrawer>
      ) : null}

      <JourneyRestartDialog
        onCancel={onCancelRestart}
        onConfirm={onConfirmRestart}
        open={restartConfirmationOpen}
      />
    </div>
  );
}
