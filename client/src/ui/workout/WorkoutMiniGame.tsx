import { useEffect, useMemo, useRef, type CSSProperties } from 'react';

import {
  WORKOUT_LOAD_BY_ID,
  WORKOUT_LOAD_ORDER,
} from '../../game/content/workoutLoads';
import {
  gamepadActions,
  keyboardEventToAction,
} from '../../game/input/actionMap';
import { subscribeToGamepadFrames } from '../../game/input/gamepadPolling';
import {
  calculateWorkoutTimingPosition,
  getWorkoutSetStressLabel,
} from '../../game/systems/workoutResolution';
import type {
  WorkoutFeedbackCode,
  KeyboardBindingMap,
  WorkoutLoadTier,
  WorkoutPreview,
  WorkoutSession,
} from '../../game/types';

const FEEDBACK_COPY: Record<WorkoutFeedbackCode, string> = {
  'readiness-strong': 'Readiness supports clean repetitions.',
  'readiness-low': 'Low readiness is narrowing the margin for error.',
  'trainer-aligned': 'Trainer build aligns with this machine.',
  'trainer-misaligned': 'Trainer-to-machine alignment is limited.',
  'buddy-aligned': 'Buddy discipline fits this machine.',
  'buddy-misaligned': 'Buddy discipline is outside this machine’s specialty.',
  'volume-ready': 'Volume preparedness supports the full set.',
  'volume-low': 'Volume preparedness may fade late in the set.',
  'load-controlled': 'Selected load keeps set stress controlled.',
  'load-demanding': 'Selected load is creating demanding set stress.',
  'repeat-diminished': 'Repeated use reduced XP, momentum, and drop yield; switch machines or recover.',
  'technique-consistent': 'Consistent rep timing protected form and rewards.',
  'technique-inconsistent': 'Inconsistent timing reduced form and rewards.',
  'spot-saved': 'Spot Now partially saved the set.',
  'spot-missed': 'The rescue window was missed.',
};

function signed(value: number, suffix = '') {
  return `${value > 0 ? '+' : ''}${value}${suffix}`;
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

interface WorkoutMiniGameProps {
  canStart: boolean;
  frame: number;
  keyboardBindings: KeyboardBindingMap;
  paused: boolean;
  preview: WorkoutPreview;
  selectedLoad: WorkoutLoadTier;
  session: WorkoutSession | null;
  onAction: () => void;
  onSelectLoad: (load: WorkoutLoadTier) => void;
  onStart: () => void;
}

export function WorkoutMiniGame({
  canStart,
  frame,
  keyboardBindings,
  paused,
  preview,
  selectedLoad,
  session,
  onAction,
  onSelectLoad,
  onStart,
}: WorkoutMiniGameProps) {
  const rootRef = useRef<HTMLElement>(null);
  const previousGamepadActions = useRef(new Set<string>());
  const selectedLoadIndex = WORKOUT_LOAD_ORDER.indexOf(selectedLoad);
  const display = session ?? preview;
  const feedbackCodes = session?.feedbackCodes ?? preview.feedbackCodes;
  const cursorPosition =
    session?.phase === 'rep'
      ? calculateWorkoutTimingPosition(session, frame)
      : 0;
  const spotRemaining =
    session?.phase === 'spot'
      ? Math.max(0, session.spotWindowEnd - frame)
      : 0;
  const spotProgress =
    session?.phase === 'spot'
      ? 1 - spotRemaining / Math.max(1, session.spotWindowMs)
      : 0;
  const gradeSummary = useMemo(() => {
    if (!session?.repResults.length) return 'No rep graded yet';
    return session.repResults
      .map((result) => `R${result.rep} ${result.grade}`)
      .join(' · ');
  }, [session?.repResults]);
  const latestRep = session?.repResults.at(-1);
  const machineFeedback =
    session?.phase === 'resolved'
      ? session.outcome === 'success'
        ? 'Set clear'
        : session.outcome === 'rescued'
          ? 'Spot save'
          : 'Set ended'
      : latestRep?.grade === 'perfect'
        ? 'Perfect impact'
        : latestRep?.grade === 'good'
          ? 'Good impact'
          : latestRep?.grade === 'rough'
            ? 'Rough impact'
            : session?.phase === 'spot'
              ? 'Spot window'
              : session?.phase === 'rep'
                ? 'Machine moving'
                : 'Machine ready';
  const machineTone =
    session?.phase === 'resolved'
      ? session.outcome ?? 'preview'
      : latestRep?.grade ?? session?.phase ?? 'preview';

  function selectAdjacentLoad(delta: -1 | 1) {
    if (paused || session) return;
    const nextIndex = Math.max(
      0,
      Math.min(WORKOUT_LOAD_ORDER.length - 1, selectedLoadIndex + delta),
    );
    onSelectLoad(WORKOUT_LOAD_ORDER[nextIndex]);
  }

  function performPrimaryAction() {
    if (paused) return;
    if (session) {
      if (!session.resolved) onAction();
      return;
    }
    if (canStart) onStart();
  }

  useEffect(() => {
    return subscribeToGamepadFrames((gamepad) => {
      const focused =
        !paused && rootRef.current?.contains(document.activeElement);
      if (focused && gamepad) {
        const actions = gamepadActions(gamepad.buttons, gamepad.axes);
        const previous = previousGamepadActions.current;
        if (
          (actions.has('confirm') && !previous.has('confirm')) ||
          (actions.has('interact') && !previous.has('interact'))
        ) {
          performPrimaryAction();
        }
        if (actions.has('move-left') && !previous.has('move-left')) {
          selectAdjacentLoad(-1);
        }
        if (actions.has('move-right') && !previous.has('move-right')) {
          selectAdjacentLoad(1);
        }
        previousGamepadActions.current = new Set(actions);
      } else {
        previousGamepadActions.current.clear();
      }
    });
  }, [canStart, onAction, onSelectLoad, onStart, paused, selectedLoadIndex, session]);

  return (
    <section
      className={`workout-console workout-phase-${session?.phase ?? 'preview'}`}
      ref={rootRef}
      tabIndex={0}
      aria-disabled={paused}
      aria-label="Machine workout mini-game"
      onKeyDown={(event) => {
        if (paused) return;
        const action = keyboardEventToAction(
          event.nativeEvent,
          keyboardBindings,
        );
        if (
          action !== 'confirm' &&
          action !== 'interact' &&
          action !== 'move-left' &&
          action !== 'move-right'
        ) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (action === 'move-left') selectAdjacentLoad(-1);
        if (action === 'move-right') selectAdjacentLoad(1);
        if (action === 'confirm' || action === 'interact') performPrimaryAction();
      }}
    >
      <div className="workout-heading">
        <div>
          <strong>Technique Set</strong>
          <small>
            {session
              ? session.phase === 'rep'
                ? `Rep ${session.currentRep}/${session.repCount}: lock inside the timing zones.`
                : session.phase === 'spot'
                  ? 'Rep failing — use Spot Now before the rescue line closes.'
                  : session.outcome === 'success'
                    ? 'Set complete with controlled technique.'
                    : session.outcome === 'rescued'
                      ? 'Set partially saved by a successful spot.'
                      : 'Set ended after a missed spot.'
              : 'Choose a load, review the forecast, then time every rep.'}
          </small>
        </div>
        <span className={`workout-load-chip load-${session?.loadTier ?? preview.selectedLoad}`}>
          {(session?.loadTier ?? preview.selectedLoad).toUpperCase()}
        </span>
      </div>

      <div
        key={`${session?.id ?? 'preview'}-${session?.repResults.length ?? 0}-${session?.phase ?? 'preview'}`}
        className={`workout-machine-visual machine-motion-${session?.phase ?? 'preview'} machine-impact-${machineTone}`}
        aria-hidden="true"
        style={{
          '--workout-machine-cycle-ms': `${session?.repDurationMs ?? preview.repTimingMs}ms`,
        } as CSSProperties}
      >
        <span className="workout-machine-upright workout-machine-upright-left" />
        <span className="workout-machine-upright workout-machine-upright-right" />
        <span className="workout-machine-cable" />
        <span className="workout-machine-handle" />
        <span className="workout-machine-pad" />
        <span className="workout-impact-pip workout-impact-pip-a" />
        <span className="workout-impact-pip workout-impact-pip-b" />
        <span className="workout-impact-pip workout-impact-pip-c" />
        <strong>{machineFeedback}</strong>
      </div>

      {!session && (
        <div className="workout-load-picker" aria-label="Selected workout load">
          {WORKOUT_LOAD_ORDER.map((loadId) => {
            const load = WORKOUT_LOAD_BY_ID[loadId];
            return (
              <button
                key={load.id}
                type="button"
                aria-pressed={selectedLoad === load.id}
                className={`workout-load-btn ${selectedLoad === load.id ? 'active' : ''}`}
                onClick={() => onSelectLoad(load.id)}
              >
                <strong>{load.label}</strong>
                <small>{load.repCount} reps · {(load.repDurationMs / 1000).toFixed(1)}s</small>
              </button>
            );
          })}
        </div>
      )}

      <div className="workout-metric-grid">
        <div><span>Readiness</span><strong>{percent(display.readiness)} · {display.readinessLabel}</strong></div>
        <div><span>Failure risk</span><strong>{percent(session?.failChance ?? preview.failureProbability)}</strong></div>
        <div><span>Rep timing</span><strong>{((session?.repDurationMs ?? preview.repTimingMs) / 1000).toFixed(1)}s</strong></div>
        <div><span>Form consistency</span><strong>{percent(session?.sessionQuality ?? preview.formConsistency)}</strong></div>
        <div><span>Set stress</span><strong>{percent(display.setStress)} · {getWorkoutSetStressLabel(display.setStress)}</strong></div>
        <div><span>Volume prep</span><strong>{percent(display.volumePreparedness)}</strong></div>
        <div><span>Trainer alignment</span><strong>{percent(display.trainerMachineAlignment)}</strong></div>
        <div><span>Buddy alignment</span><strong>{percent(display.buddyDisciplineAlignment)}</strong></div>
        <div><span>Expected fatigue</span><strong>{signed(display.expectedFatigueChange)}</strong></div>
        <div><span>Expected HP</span><strong>{signed(session?.staminaChange ?? preview.expectedHpChange)}</strong></div>
        <div><span>Expected XP</span><strong>+{session?.xpGain ?? preview.expectedXp}</strong></div>
        <div><span>Deload</span><strong>{display.deloadUsed ? `${display.deloadUsed} token${display.deloadUsed === 1 ? '' : 's'}` : 'None'}</strong></div>
        <div><span>Repeat yield</span><strong>{percent(display.rewardEfficiency)}</strong></div>
      </div>

      {session?.phase === 'rep' && (
        <div className="workout-timing-wrap">
          <div className="workout-timing-labels">
            <span>EARLY</span>
            <strong>LOCK REP</strong>
            <span>LATE</span>
          </div>
          <div
            className="workout-timing-track"
            role="progressbar"
            aria-label={`Rep ${session.currentRep} timing`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(cursorPosition * 100)}
          >
            <div
              className="workout-good-zone"
              style={{
                left: `${(session.timingTarget - session.goodWindow) * 100}%`,
                width: `${session.goodWindow * 200}%`,
              }}
            />
            <div
              className="workout-perfect-zone"
              style={{
                left: `${(session.timingTarget - session.perfectWindow) * 100}%`,
                width: `${session.perfectWindow * 200}%`,
              }}
            />
            <div
              className="workout-timing-cursor"
              style={{ left: `${cursorPosition * 100}%` }}
            />
          </div>
          <button
            type="button"
            className="primary-btn workout-primary-action"
            onClick={onAction}
          >
            Lock Rep
            <small>Enter / Space / gamepad A</small>
          </button>
        </div>
      )}

      {session?.phase === 'spot' && (
        <div className="workout-spot-wrap" aria-live="assertive">
          <div className="workout-spot-meter">
            <div
              className="workout-spot-save-zone"
              style={{
                width: `${((session.spotSaveDeadline - session.spotWindowStart) / session.spotWindowMs) * 100}%`,
              }}
            />
            <div
              className="workout-spot-meter-pin"
              style={{ left: `${spotProgress * 100}%` }}
            />
          </div>
          <button
            type="button"
            className="trainer-spot-btn"
            onClick={onAction}
          >
            Spot Now
            <small>{(spotRemaining / 1000).toFixed(1)}s left · Enter / Space / gamepad A</small>
          </button>
          <small className="warning">
            A quick spot partially saves XP and limits HP, fatigue, and form consequences.
          </small>
        </div>
      )}

      {session && (
        <div className="workout-rep-summary" aria-live="polite">
          {gradeSummary}
        </div>
      )}

      {session?.phase === 'resolved' && (
        <div className={`workout-result result-${session.outcome}`}>
          <strong>
            {session.outcome === 'success'
              ? 'TECHNIQUE HELD'
              : session.outcome === 'rescued'
                ? 'SET PARTIALLY SAVED'
                : 'SET ENDED'}
          </strong>
          <span>Form consistency {percent(session.sessionQuality)}</span>
        </div>
      )}

      {!session && (
        <button
          type="button"
          className="primary-btn workout-start-btn"
          onClick={onStart}
          disabled={!canStart}
        >
          Start {WORKOUT_LOAD_BY_ID[selectedLoad].label} Set
          <small>Enter / Space / gamepad A</small>
        </button>
      )}

      <div className="workout-feedback">
        {feedbackCodes.slice(-5).map((code, index) => (
          <small key={`${code}-${index}`}>{FEEDBACK_COPY[code]}</small>
        ))}
      </div>
      <small className="workout-control-hint">
        ←/→ selects load · Enter/Space acts · touch buttons · gamepad D-pad/A
      </small>
    </section>
  );
}
