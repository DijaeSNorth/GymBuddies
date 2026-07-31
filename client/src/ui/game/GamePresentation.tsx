import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

import type { GamePresentationController } from '../../game/phaser/createGamePresentation';
import {
  calculatePresentationScale,
  type GamePresentationSnapshot,
  type PresentationMotionSettings,
} from '../../game/phaser/presentationConfig';
import type { DialoguePortrait } from '../../game/phaser/presentationEffects';
import {
  CARDINAL_DIRECTIONS,
  INPUT_REPEAT_MS,
  detectGamepadProfile,
  directionToInputAction,
  formatKeyboardCode,
  gamepadActions,
  inputActionToDirection,
  keyboardEventToAction,
  remapKeyboardBinding,
  type InputAction,
} from '../../game/input/actionMap';
import { subscribeToGamepadFrames } from '../../game/input/gamepadPolling';
import type {
  CaptureBattleSpeed,
  CardinalDirection,
  GamepadProfileId,
  KeyboardBindingMap,
  SaveAccessibilitySettings,
  TrainerVisualProgressionPreferences,
} from '../../game/types';
import { InputAccessibilityPanel } from '../accessibility/InputAccessibilityPanel';

const TEXT_SPEED_MS: Readonly<
  Record<SaveAccessibilitySettings['textSpeed'], number>
> = {
  slow: 52,
  standard: 30,
  fast: 14,
  instant: 0,
};

interface GamePresentationProps {
  accessibility: SaveAccessibilitySettings;
  actionLabel: string;
  battleSpeed: CaptureBattleSpeed;
  dialogue: string;
  dialoguePortrait: DialoguePortrait;
  directionAvailability: Record<CardinalDirection, boolean>;
  effectSkippable: boolean;
  keyboardBindings: KeyboardBindingMap;
  visualProgression: TrainerVisualProgressionPreferences;
  movementDisabled: boolean;
  onAccessibilityChange: (settings: SaveAccessibilitySettings) => void;
  onAction: (action: InputAction) => void;
  onBattleSpeedChange: (speed: CaptureBattleSpeed) => void;
  onKeyboardBindingsChange: (bindings: KeyboardBindingMap) => void;
  onPauseChange: (paused: boolean) => void;
  onSkipEffect: () => void;
  onVisualProgressionChange: (
    preferences: TrainerVisualProgressionPreferences,
  ) => void;
  partyCount: number;
  primaryActionDisabled: boolean;
  snapshot: Omit<GamePresentationSnapshot, 'motion'>;
}

function focusableControls(container: HTMLElement | null) {
  return Array.from(
    container?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  ).filter((element) => element.offsetParent !== null);
}

export function GamePresentation({
  accessibility,
  actionLabel,
  battleSpeed,
  dialogue,
  dialoguePortrait,
  directionAvailability,
  effectSkippable,
  keyboardBindings,
  movementDisabled,
  onAccessibilityChange,
  onAction,
  onBattleSpeedChange,
  onKeyboardBindingsChange,
  onPauseChange,
  onSkipEffect,
  partyCount,
  primaryActionDisabled,
  snapshot,
  visualProgression,
  onVisualProgressionChange,
}: GamePresentationProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<GamePresentationController | null>(null);
  const latestSnapshotRef = useRef<GamePresentationSnapshot | null>(null);
  const resumeButtonRef = useRef<HTMLButtonElement>(null);
  const pauseResumeButtonRef = useRef<HTMLButtonElement>(null);
  const latestActionRef = useRef(onAction);
  const latestSkipEffectRef = useRef(onSkipEffect);
  const dispatchInputActionRef = useRef<(action: InputAction) => void>(() => undefined);
  const movementDisabledRef = useRef(movementDisabled);
  const primaryActionDisabledRef = useRef(primaryActionDisabled);
  const effectSkippableRef = useRef(effectSkippable);
  const menuOpenRef = useRef(false);
  const pausedRef = useRef(false);
  const debugOverlayRef = useRef(false);
  const touchRepeatTimerRef = useRef<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState<'manual' | 'focus'>('manual');
  const [dialogueVisible, setDialogueVisible] = useState(true);
  const [dialogueCursor, setDialogueCursor] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [debugOverlay, setDebugOverlay] = useState(false);
  const [gamepadProfile, setGamepadProfile] =
    useState<GamepadProfileId>('standard');
  const [toggledDirection, setToggledDirection] =
    useState<CardinalDirection | null>(null);
  const [presentationFailure, setPresentationFailure] =
    useState<Error | null>(null);
  const motion: PresentationMotionSettings = {
    reducedMotion: accessibility.reducedMotion,
    screenShake: accessibility.screenShake,
  };
  const effectivePaused = paused || menuOpen;
  const displayedDialogue = dialogue.slice(0, dialogueCursor);
  const dialogueComplete = dialogueCursor >= dialogue.length;
  const keyboardShortcutText = useMemo(
    () =>
      Object.values(keyboardBindings)
        .flat()
        .map(formatKeyboardCode)
        .join(' '),
    [keyboardBindings],
  );
  const phaserSnapshot = useMemo(
    () => ({
      ...snapshot,
      motion,
    }),
    [motion.reducedMotion, motion.screenShake, snapshot],
  );
  latestSnapshotRef.current = phaserSnapshot;

  useEffect(() => {
    latestActionRef.current = onAction;
    latestSkipEffectRef.current = onSkipEffect;
    movementDisabledRef.current = movementDisabled;
    primaryActionDisabledRef.current = primaryActionDisabled;
    effectSkippableRef.current = effectSkippable;
    menuOpenRef.current = menuOpen;
    pausedRef.current = paused;
    debugOverlayRef.current = debugOverlay;
  }, [
    debugOverlay,
    effectSkippable,
    menuOpen,
    movementDisabled,
    onAction,
    onSkipEffect,
    paused,
    primaryActionDisabled,
  ]);

  useEffect(() => {
    onPauseChange(effectivePaused);
  }, [effectivePaused, onPauseChange]);

  useEffect(() => {
    setDialogueCursor(0);
    setDialogueVisible(true);
  }, [dialogue]);

  useEffect(() => {
    if (
      accessibility.reducedMotion ||
      accessibility.textSpeed === 'instant'
    ) {
      setDialogueCursor(dialogue.length);
      return;
    }
    if (effectivePaused || dialogueCursor >= dialogue.length) return;
    const timer = window.setInterval(() => {
      setDialogueCursor((cursor) => {
        const nextCursor = Math.min(dialogue.length, cursor + 1);
        if (nextCursor >= dialogue.length) window.clearInterval(timer);
        return nextCursor;
      });
    }, TEXT_SPEED_MS[accessibility.textSpeed]);
    return () => window.clearInterval(timer);
  }, [
    accessibility.reducedMotion,
    accessibility.textSpeed,
    dialogue,
    effectivePaused,
  ]);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;
    let active = true;
    let controller: GamePresentationController | null = null;
    void import('../../game/phaser/createGamePresentation')
      .then(({ createGamePresentation }) => {
        if (!active || !latestSnapshotRef.current) return;
        controller = createGamePresentation(
          host,
          latestSnapshotRef.current,
        );
        controller.setDebugOverlay(debugOverlayRef.current);
        controller.setPaused(
          pausedRef.current || menuOpenRef.current,
        );
        controllerRef.current = controller;
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPresentationFailure(
          error instanceof Error
            ? error
            : new Error('The Phaser presentation could not start.'),
        );
      });
    return () => {
      active = false;
      controller?.destroy();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setSnapshot(phaserSnapshot);
  }, [phaserSnapshot]);

  useEffect(() => {
    controllerRef.current?.setDebugOverlay(debugOverlay);
  }, [debugOverlay]);

  useEffect(() => {
    controllerRef.current?.setPaused(effectivePaused);
  }, [effectivePaused]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const stage = stageRef.current;
    if (!wrapper || !stage) return;

    const updateScale = () => {
      const isPresentationFullscreen = document.fullscreenElement === wrapper;
      const availableHeight = Math.max(
        180,
        isPresentationFullscreen ? window.innerHeight - 24 : window.innerHeight * 0.72,
      );
      const metrics = calculatePresentationScale(wrapper.clientWidth, availableHeight);
      stage.style.setProperty('--gb-stage-width', `${metrics.width}px`);
      stage.style.setProperty('--gb-stage-height', `${metrics.height}px`);
      stage.style.setProperty('--gb-pixel-unit', `${metrics.scale}px`);
      stage.dataset.integerScale = metrics.isInteger ? 'true' : 'false';
    };

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(wrapper);
    window.addEventListener('resize', updateScale);
    document.addEventListener('fullscreenchange', updateScale);
    updateScale();
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScale);
      document.removeEventListener('fullscreenchange', updateScale);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (menuOpen) resumeButtonRef.current?.focus();
  }, [menuOpen]);

  useEffect(() => {
    if (paused && !menuOpen) pauseResumeButtonRef.current?.focus();
  }, [menuOpen, paused]);

  useEffect(() => {
    const pauseForFocusLoss = () => {
      setPauseReason('focus');
      setPaused(true);
      setToggledDirection(null);
    };
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') pauseForFocusLoss();
    };
    window.addEventListener('blur', pauseForFocusLoss);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('blur', pauseForFocusLoss);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const focusOverlayControl = useCallback((delta: -1 | 1) => {
    const overlay = stageRef.current?.querySelector<HTMLElement>(
      menuOpenRef.current ? '[data-presentation-menu]' : '[data-pause-overlay]',
    );
    const controls = focusableControls(overlay ?? null);
    if (controls.length === 0) return;
    const currentIndex = controls.indexOf(document.activeElement as HTMLElement);
    const nextIndex =
      currentIndex < 0
        ? 0
        : (currentIndex + delta + controls.length) % controls.length;
    controls[nextIndex]?.focus();
  }, []);

  const resumeGameplay = useCallback(() => {
    setPaused(false);
    setMenuOpen(false);
    setToggledDirection(null);
    window.requestAnimationFrame(() => stageRef.current?.focus());
  }, []);

  const dispatchInputAction = useCallback(
    (action: InputAction) => {
      if (action === 'debug-toggle') {
        if (import.meta.env.DEV) setDebugOverlay((visible) => !visible);
        return;
      }

      if (menuOpenRef.current) {
        const direction = inputActionToDirection(action);
        if (direction) {
          focusOverlayControl(
            action === 'move-up' || action === 'move-left' ? -1 : 1,
          );
          return;
        }
        if (action === 'confirm' || action === 'interact') {
          const active = document.activeElement as HTMLElement | null;
          active?.click();
          return;
        }
        if (action === 'cancel' || action === 'menu' || action === 'pause') {
          setMenuOpen(false);
          window.requestAnimationFrame(() => stageRef.current?.focus());
        }
        return;
      }

      if (pausedRef.current) {
        if (
          action === 'confirm' ||
          action === 'cancel' ||
          action === 'interact' ||
          action === 'pause'
        ) {
          resumeGameplay();
        } else if (action === 'menu') {
          setMenuOpen(true);
        }
        return;
      }

      if (action === 'menu') {
        setToggledDirection(null);
        setMenuOpen(true);
        return;
      }
      if (action === 'pause') {
        setPauseReason('manual');
        setToggledDirection(null);
        setPaused(true);
        return;
      }
      if (action === 'cancel') {
        if (dialogueVisible) setDialogueVisible(false);
        return;
      }

      const direction = inputActionToDirection(action);
      if (direction) {
        if (
          movementDisabledRef.current ||
          !directionAvailability[direction]
        ) {
          return;
        }
        controllerRef.current?.performFeedback('move');
        latestActionRef.current(action);
        return;
      }

      if (
        action === 'confirm' ||
        action === 'interact' ||
        action === 'ability-1' ||
        action === 'ability-2' ||
        action === 'ability-3'
      ) {
        if (
          (action === 'confirm' || action === 'interact') &&
          dialogueVisible &&
          !dialogueComplete
        ) {
          setDialogueCursor(dialogue.length);
          return;
        }
        if (effectSkippableRef.current) {
          latestSkipEffectRef.current();
          return;
        }
        if (primaryActionDisabledRef.current) return;
        controllerRef.current?.performFeedback('confirm');
        latestActionRef.current(action);
      }
    },
    [
      dialogue.length,
      dialogueComplete,
      dialogueVisible,
      directionAvailability,
      focusOverlayControl,
      resumeGameplay,
    ],
  );
  dispatchInputActionRef.current = dispatchInputAction;

  useEffect(() => {
    const previousActions = new Set<InputAction>();
    const lastDispatchAt = new Map<InputAction, number>();
    return subscribeToGamepadFrames((gamepad, now) => {
      const stageFocused = stageRef.current?.contains(document.activeElement);
      if (stageFocused && gamepad) {
        const profile = detectGamepadProfile(gamepad.id);
        setGamepadProfile((current) => (current === profile ? current : profile));
        const activeActions = gamepadActions(gamepad.buttons, gamepad.axes);
        activeActions.forEach((action) => {
          const repeatMs = inputActionToDirection(action)
            ? INPUT_REPEAT_MS.movement
            : INPUT_REPEAT_MS.command;
          const canDispatch =
            !previousActions.has(action) ||
            now - (lastDispatchAt.get(action) ?? 0) >= repeatMs;
          if (canDispatch) {
            dispatchInputActionRef.current(action);
            lastDispatchAt.set(action, now);
          }
        });
        previousActions.clear();
        activeActions.forEach((action) => previousActions.add(action));
      } else {
        previousActions.clear();
        lastDispatchAt.clear();
      }
    });
  }, []);

  useEffect(() => {
    if (
      !toggledDirection ||
      accessibility.sustainedInputMode !== 'toggle' ||
      effectivePaused ||
      movementDisabled ||
      !directionAvailability[toggledDirection]
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      dispatchInputActionRef.current(
        directionToInputAction(toggledDirection),
      );
    }, INPUT_REPEAT_MS.movement);
    return () => window.clearInterval(timer);
  }, [
    accessibility.sustainedInputMode,
    directionAvailability,
    effectivePaused,
    movementDisabled,
    toggledDirection,
  ]);

  useEffect(() => {
    if (
      toggledDirection &&
      (effectivePaused ||
        movementDisabled ||
        !directionAvailability[toggledDirection])
    ) {
      setToggledDirection(null);
    }
  }, [
    directionAvailability,
    effectivePaused,
    movementDisabled,
    toggledDirection,
  ]);

  useEffect(
    () => () => {
      if (touchRepeatTimerRef.current !== null) {
        window.clearInterval(touchRepeatTimerRef.current);
      }
    },
    [],
  );

  const toggleFullscreen = useCallback(async () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await wrapper.requestFullscreen();
      }
    } catch {
      setIsFullscreen(false);
    }
  }, []);

  function handleStageKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const insideInputSettings = Boolean(target.closest('[data-input-settings]'));
    const isFormControl = ['input', 'button', 'select', 'textarea', 'summary'].includes(
      target.tagName.toLowerCase(),
    );

    if (menuOpen && event.key === 'Tab') {
      const menu = stageRef.current?.querySelector<HTMLElement>('[data-presentation-menu]');
      const focusable = focusableControls(menu ?? null);
      if (focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      event.stopPropagation();
      return;
    }

    const action = keyboardEventToAction(event.nativeEvent, keyboardBindings);
    if (!action) return;
    if (
      insideInputSettings &&
      action !== 'cancel' &&
      action !== 'menu' &&
      action !== 'pause'
    ) {
      return;
    }
    if (
      isFormControl &&
      menuOpen &&
      action !== 'cancel' &&
      action !== 'menu' &&
      action !== 'pause'
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    dispatchInputAction(action);
  }

  function stopHeldTouchMovement() {
    if (touchRepeatTimerRef.current !== null) {
      window.clearInterval(touchRepeatTimerRef.current);
      touchRepeatTimerRef.current = null;
    }
  }

  function beginTouchMovement(direction: CardinalDirection) {
    const action = directionToInputAction(direction);
    if (accessibility.sustainedInputMode === 'toggle') {
      setToggledDirection((current) => {
        const next = current === direction ? null : direction;
        if (next) dispatchInputAction(action);
        return next;
      });
      return;
    }
    setToggledDirection(null);
    stopHeldTouchMovement();
    dispatchInputAction(action);
    touchRepeatTimerRef.current = window.setInterval(
      () => dispatchInputActionRef.current(action),
      INPUT_REPEAT_MS.movement,
    );
  }

  const stageStyle = {
    '--gb-stage-width': '240px',
    '--gb-stage-height': '180px',
    '--gb-pixel-unit': '1px',
  } as CSSProperties;

  if (presentationFailure) throw presentationFailure;

  return (
    <section
      className="gb-presentation"
      data-game-presentation="true"
      data-high-contrast={accessibility.highContrast ? 'true' : 'false'}
      aria-labelledby="gb-presentation-title"
    >
      <div className="gb-presentation-heading">
        <div>
          <p className="gb-presentation-kicker">Field Link / 240</p>
          <h2 id="gb-presentation-title">Live route view</h2>
        </div>
        <p>Focus the playfield for keyboard or gamepad control.</p>
      </div>

      <div ref={wrapperRef} className="gb-presentation-viewport">
        <div
          ref={stageRef}
          className="gb-stage"
          data-reduced-motion={accessibility.reducedMotion ? 'true' : 'false'}
          data-high-contrast={accessibility.highContrast ? 'true' : 'false'}
          data-location-id={snapshot.locationId}
          data-player-x={snapshot.playerTileX}
          data-player-y={snapshot.playerTileY}
          style={stageStyle}
          tabIndex={0}
          role="region"
          aria-label="Gym Buddies game playfield. Controls can be reviewed and remapped from the field menu."
          aria-keyshortcuts={keyboardShortcutText}
          onKeyDown={handleStageKeyDown}
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest('button, input, select, summary')) return;
            stageRef.current?.focus();
          }}
        >
          <div className="gb-letterbox gb-letterbox-top" aria-hidden="true" />
          <div ref={canvasHostRef} className="gb-phaser-host" aria-hidden="true" />
          <div className="gb-letterbox gb-letterbox-bottom" aria-hidden="true" />

          <div className="gb-status-hud" aria-label="Current game status">
            <span className="gb-hud-zone">{snapshot.activeZoneName}</span>
            <span className="gb-hud-divider" aria-hidden="true" />
            <span>Buddy {snapshot.buddyName || 'Solo'}</span>
            <span>HP {Math.max(0, snapshot.buddyHp)}/{Math.max(0, snapshot.buddyMaxHp)}</span>
            <span>Fatigue {Math.round(snapshot.fatigueRatio * 100)}%</span>
            <span>Team {partyCount}</span>
          </div>

          <div className="gb-stage-tools">
            <button
              type="button"
              className="gb-icon-button gb-menu-glyph"
              onClick={() => dispatchInputAction('menu')}
              aria-label="Open game menu"
              aria-haspopup="dialog"
            >
              <span aria-hidden="true" />
            </button>
            <button
              type="button"
              className="gb-icon-button gb-fullscreen-glyph"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              aria-pressed={isFullscreen}
            >
              <span aria-hidden="true" />
            </button>
          </div>

          {dialogueVisible && !effectivePaused ? (
            <div className="gb-dialogue" role="status">
              <div
                className={`gb-dialogue-portrait gb-dialogue-portrait-${dialoguePortrait.kind}`}
                aria-hidden="true"
                style={{
                  '--gb-portrait-accent': dialoguePortrait.accent,
                  '--gb-portrait-base': dialoguePortrait.base,
                } as CSSProperties}
              >
                <span>{dialoguePortrait.initial}</span>
                <i />
              </div>
              <div className="gb-dialogue-copy">
                <strong>{dialoguePortrait.name}</strong>
                <p aria-hidden="true">{displayedDialogue}</p>
              </div>
              <span className="visually-hidden" aria-live="polite">
                {dialoguePortrait.name}: {dialogue}
              </span>
              <button
                type="button"
                className="gb-dialogue-dismiss"
                onClick={() => setDialogueVisible(false)}
                aria-label="Hide dialogue"
              >
                ×
              </button>
            </div>
          ) : null}

          {!dialogueVisible && !effectivePaused ? (
            <button
              type="button"
              className="gb-dialogue-restore"
              onClick={() => setDialogueVisible(true)}
            >
              Message
            </button>
          ) : null}

          {paused && !menuOpen ? (
            <div
              className="gb-pause-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="gb-pause-title"
              data-pause-overlay
            >
              <p className="gb-menu-eyebrow">
                {pauseReason === 'focus' ? 'Focus changed' : 'Route held'}
              </p>
              <h3 id="gb-pause-title">Paused</h3>
              <p>
                {pauseReason === 'focus'
                  ? 'Gameplay paused when the browser lost focus.'
                  : 'Workout and route timers are held.'}
              </p>
              <button
                ref={pauseResumeButtonRef}
                type="button"
                className="gb-menu-action"
                onClick={resumeGameplay}
              >
                Resume gameplay
              </button>
              <button
                type="button"
                className="gb-menu-action"
                onClick={() => setMenuOpen(true)}
              >
                Open settings
              </button>
            </div>
          ) : null}

          {menuOpen ? (
            <div
              className="gb-menu-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="gb-menu-title"
              data-presentation-menu
            >
              <div className="gb-menu-plate" aria-hidden="true" />
              <p className="gb-menu-eyebrow">Trainer console</p>
              <h3 id="gb-menu-title">Controls &amp; accessibility</h3>
              <button
                ref={resumeButtonRef}
                type="button"
                className="gb-menu-action"
                onClick={resumeGameplay}
              >
                Resume route
              </button>
              <button type="button" className="gb-menu-action" onClick={toggleFullscreen}>
                {isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              </button>
              <InputAccessibilityPanel
                accessibility={accessibility}
                battleSpeed={battleSpeed}
                gamepadProfile={gamepadProfile}
                keyboardBindings={keyboardBindings}
                visualProgression={visualProgression}
                onAccessibilityChange={onAccessibilityChange}
                onBattleSpeedChange={onBattleSpeedChange}
                onKeyboardBindingsChange={onKeyboardBindingsChange}
                onRemap={(action, code) =>
                  onKeyboardBindingsChange(
                    remapKeyboardBinding(keyboardBindings, action, code),
                  )
                }
                onVisualProgressionChange={onVisualProgressionChange}
              />
              {import.meta.env.DEV ? (
                <label className="gb-menu-toggle">
                  <input
                    type="checkbox"
                    checked={debugOverlay}
                    onChange={(event) => setDebugOverlay(event.target.checked)}
                  />
                  <span>Collision overlay (F2)</span>
                </label>
              ) : null}
              <p className="gb-menu-help">
                Tab or D-pad moves focus · Confirm chooses · Cancel resumes
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="gb-touch-deck" aria-label="Touchscreen game controls">
        <div className="gb-touch-dpad" aria-label="Movement controls">
          {CARDINAL_DIRECTIONS.map((direction) => (
            <button
              key={direction}
              type="button"
              className={`gb-touch-direction gb-touch-${direction}`}
              disabled={
                movementDisabled ||
                effectivePaused ||
                !directionAvailability[direction]
              }
              aria-label={`Move ${direction}`}
              aria-pressed={
                accessibility.sustainedInputMode === 'toggle' &&
                toggledDirection === direction
              }
              onPointerDown={(event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                beginTouchMovement(direction);
              }}
              onPointerUp={stopHeldTouchMovement}
              onPointerCancel={stopHeldTouchMovement}
              onLostPointerCapture={stopHeldTouchMovement}
              onClick={(event) => {
                if (event.detail === 0) beginTouchMovement(direction);
              }}
            >
              <span aria-hidden="true" />
            </button>
          ))}
          <span className="gb-touch-dpad-center" aria-hidden="true" />
        </div>

        <div className="gb-touch-command-deck">
          <div className="gb-touch-meta">
            <button
              type="button"
              className="gb-touch-action gb-touch-action-compact"
              onClick={() => dispatchInputAction('menu')}
            >
              Menu
            </button>
            <button
              type="button"
              className="gb-touch-action gb-touch-action-compact"
              onClick={() => dispatchInputAction('pause')}
            >
              Pause
            </button>
          </div>
          <div className="gb-touch-skills" aria-label="Ability controls">
            {(['ability-1', 'ability-2', 'ability-3'] as const).map(
              (action, index) => (
                <button
                  key={action}
                  type="button"
                  className="gb-touch-action gb-touch-action-skill"
                  disabled={primaryActionDisabled || effectivePaused}
                  onClick={() => dispatchInputAction(action)}
                  aria-label={`Ability ${index + 1}`}
                >
                  {index + 1}
                </button>
              ),
            )}
          </div>
          <div className="gb-touch-actions">
            <button
              type="button"
              className="gb-touch-action gb-touch-action-secondary"
              onClick={() => dispatchInputAction('cancel')}
              aria-label="Cancel"
            >
              B<small>Cancel</small>
            </button>
            <button
              type="button"
              className="gb-touch-action gb-touch-action-interact"
              disabled={primaryActionDisabled || effectivePaused}
              onClick={() => dispatchInputAction('interact')}
              aria-label="Interact"
            >
              X<small>Interact</small>
            </button>
            <button
              type="button"
              className="gb-touch-action gb-touch-action-primary"
              disabled={primaryActionDisabled || effectivePaused}
              onClick={() => dispatchInputAction('confirm')}
              aria-label={actionLabel}
            >
              A<small>{actionLabel}</small>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
