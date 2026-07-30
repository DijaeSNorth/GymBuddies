import { useEffect, useMemo, useRef, useState } from 'react';

import { TRAINER_POSE_DEFINITIONS } from '../../game/content/bodybuilding';
import { ALL_TRAINING_MACHINES } from '../../game/content/machines';
import {
  BODYBUILDING_CHALLENGES,
  DEVELOPMENT_PRESENTATION_LEVELS,
  TRAINER_DEVELOPMENT_GROUPS,
} from '../../game/content/visualProgression';
import {
  gamepadActions,
  type InputAction,
} from '../../game/input/actionMap';
import { subscribeToGamepadFrames } from '../../game/input/gamepadPolling';
import type {
  Buddy,
  BodybuildingChallengeId,
  BodybuildingChallengeResult,
  PhysiqueRatings,
  TrainerDevelopmentGroupId,
  TrainerPose,
  TrainerProfile,
  TrainerVisualPresentation,
  TrainerVisualProgressionPreferences,
  TrainerVisualProgressionState,
} from '../../game/types';
import type { BuddyShowcasePose } from '../../game/assets/types';
import { BuddySprite } from '../buddies/BuddySprite';
import { TrainerPixelSprite } from './TrainerPixelSprite';
import './physiqueReview.css';

type ChallengeEntryInput = {
  challengeId: BodybuildingChallengeId;
  selectedPose: TrainerPose;
  timingPrecision: number;
  preparation: number;
  outfitAlignment: number;
};

interface PhysiqueReviewPanelProps {
  buddy?: Buddy;
  trainer: TrainerProfile;
  visualProgression: TrainerVisualProgressionState;
  presentation: TrainerVisualPresentation;
  ratings: PhysiqueRatings;
  fatigue: number;
  reducedMotion: boolean;
  challengeResult: BodybuildingChallengeResult | null;
  onChallenge: (input: ChallengeEntryInput) => void;
  onClose: () => void;
  onPreferencesChange: (
    preferences: TrainerVisualProgressionPreferences,
  ) => void;
  onSaveSnapshot: (label?: string) => void;
  onDebugAdjust: (
    group: TrainerDevelopmentGroupId,
    target: 'development' | 'pump',
    delta: number,
  ) => void;
}

const BODYBUILDING_POSES = TRAINER_POSE_DEFINITIONS.filter(
  (pose) => pose.category === 'bodybuilding',
);

function formatGameplayTime(gameplayTimeMs: number) {
  const minutes = Math.floor(gameplayTimeMs / 60_000);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function PhysiqueReviewPanel({
  buddy,
  trainer,
  visualProgression,
  presentation,
  ratings,
  fatigue,
  reducedMotion,
  challengeResult,
  onChallenge,
  onClose,
  onPreferencesChange,
  onSaveSnapshot,
  onDebugAdjust,
}: PhysiqueReviewPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const [pose, setPose] = useState<TrainerPose>('front-relaxed');
  const [challengeId, setChallengeId] =
    useState<BodybuildingChallengeId>('pose-sequence');
  const [timingPrecision, setTimingPrecision] = useState(72);
  const [preparation, setPreparation] = useState(70);
  const [outfitAlignment, setOutfitAlignment] = useState(75);
  const [portraitCaptured, setPortraitCaptured] = useState(false);
  const challenge = BODYBUILDING_CHALLENGES.find(
    (entry) => entry.id === challengeId,
  )!;
  const buddyShowcasePose: BuddyShowcasePose =
    pose === 'back-relaxed' || pose === 'back-double-biceps'
      ? pose
      : pose === 'side-chest' || pose === 'side-triceps'
        ? pose
        : pose === 'most-muscular' || pose === 'abs-and-thigh'
          ? pose
          : pose === 'victory-flex'
            ? 'victory-pose'
            : 'front-relaxed';
  const machineNames = useMemo(
    () =>
      new Map(
        ALL_TRAINING_MACHINES.map((machine) => [machine.id, machine.name]),
      ),
    [],
  );

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    const previousActions = new Set<InputAction>();
    return subscribeToGamepadFrames((gamepad) => {
      const actions = gamepad
        ? gamepadActions(gamepad.buttons, gamepad.axes)
        : new Set<InputAction>();
      const pressed = [...actions].filter(
        (action) => !previousActions.has(action),
      );
      previousActions.clear();
      actions.forEach((action) => previousActions.add(action));
      if (pressed.includes('cancel')) {
        onClose();
        return;
      }
      const direction = pressed.includes('move-down')
        ? 1
        : pressed.includes('move-up')
          ? -1
          : 0;
      const controls = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), summary',
        ) ?? [],
      ).filter((element) => element.offsetParent !== null);
      if (direction && controls.length > 0) {
        const current = controls.indexOf(
          document.activeElement as HTMLElement,
        );
        controls[
          (current + direction + controls.length) % controls.length
        ]?.focus();
      }
      if (pressed.includes('confirm')) {
        const active = document.activeElement;
        if (
          active instanceof HTMLButtonElement ||
          active instanceof HTMLElement && active.tagName === 'SUMMARY'
        ) {
          active.click();
        }
      }
    });
  }, [onClose]);

  return (
    <div className="physique-review-backdrop" role="presentation">
      <section
        aria-labelledby="physique-review-title"
        aria-modal="true"
        className="physique-review-panel"
        data-testid="physique-review"
        ref={panelRef}
        role="dialog"
      >
        <header className="physique-review-header">
          <div>
            <p className="physique-review-kicker">HOME GYM · OPTIONAL PATH</p>
            <h2 id="physique-review-title">Physique Review</h2>
            <p>
              Fictional game ratings and visual training history. Your Trainer
              Forge appearance always remains the foundation.
            </p>
          </div>
          <button
            autoFocus
            className="secondary-btn"
            onClick={onClose}
            type="button"
          >
            Close review
          </button>
        </header>

        <div className="physique-review-grid">
          <div className="physique-review-preview-card">
            <div className="physique-review-compare">
              <figure>
                <TrainerPixelSprite
                  appearance={visualProgression.baselineAppearance}
                  direction="front"
                  label="Beginning appearance"
                  pose={pose}
                  reducedMotion={reducedMotion}
                  scale={4}
                />
                <figcaption>Beginning</figcaption>
              </figure>
              <figure
                className={
                  presentation.pumpIntensity > 0.15
                    ? 'physique-review-pumped'
                    : ''
                }
              >
                <TrainerPixelSprite
                  appearance={presentation.appearance}
                  direction="front"
                  label="Current trained appearance"
                  pose={pose}
                  reducedMotion={reducedMotion}
                  scale={4}
                />
                <figcaption>Current</figcaption>
              </figure>
            </div>
            {buddy ? (
              <figure className="physique-review-buddy">
                <BuddySprite
                  cosmetics={buddy.cosmetics}
                  creature={buddy.creature}
                  label={`${buddy.nickname} physique review`}
                  presentationContext="showcase"
                  reducedMotion={reducedMotion}
                  scale={2}
                  showcasePose={buddyShowcasePose}
                />
                <figcaption>
                  {buddy.nickname} · matching showcase pose
                </figcaption>
              </figure>
            ) : null}
            <label className="physique-review-field">
              <span>Review pose</span>
              <select
                aria-label="Physique review pose"
                value={pose}
                onChange={(event) => setPose(event.target.value as TrainerPose)}
              >
                {BODYBUILDING_POSES.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="physique-review-status-row">
              <span>Pump {Math.round(presentation.pumpIntensity * 100)}%</span>
              <span>Fatigue {Math.round(fatigue)}%</span>
              <span>{presentation.recovery.stance}</span>
            </div>
            <div className="physique-review-actions">
              <button
                className="primary-btn"
                onClick={() => {
                  onSaveSnapshot('Pixel portrait');
                  setPortraitCaptured(true);
                }}
                type="button"
              >
                Take in-game pixel portrait
              </button>
              <button
                className="secondary-btn"
                onClick={() => onSaveSnapshot()}
                type="button"
              >
                Save progress snapshot
              </button>
            </div>
            {portraitCaptured ? (
              <p className="physique-review-success" role="status">
                Pixel portrait stored in this save—no external file access used.
              </p>
            ) : null}
          </div>

          <div className="physique-review-settings-card">
            <h3>Visible development</h3>
            <label className="physique-review-field">
              <span>Presentation level</span>
              <select
                aria-label="Visible training development"
                value={visualProgression.preferences.developmentLevel}
                onChange={(event) =>
                  onPreferencesChange({
                    ...visualProgression.preferences,
                    developmentLevel: event.target
                      .value as TrainerVisualProgressionPreferences['developmentLevel'],
                  })
                }
              >
                {DEVELOPMENT_PRESENTATION_LEVELS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="physique-review-toggle">
              <input
                checked={visualProgression.preferences.showPumpEffects}
                onChange={(event) =>
                  onPreferencesChange({
                    ...visualProgression.preferences,
                    showPumpEffects: event.target.checked,
                  })
                }
                type="checkbox"
              />
              <span>Workout pump highlights</span>
            </label>
            <label className="physique-review-toggle">
              <input
                checked={visualProgression.preferences.showFatigueEffects}
                onChange={(event) =>
                  onPreferencesChange({
                    ...visualProgression.preferences,
                    showFatigueEffects: event.target.checked,
                  })
                }
                type="checkbox"
              />
              <span>Fatigue and recovery stance</span>
            </label>
            <p className="small-note">
              Turning effects off hides them only. It never deletes training
              progress.
            </p>
          </div>
        </div>

        <div className="physique-review-section">
          <h3>Development map</h3>
          <div className="physique-development-list">
            {TRAINER_DEVELOPMENT_GROUPS.map((group) => {
              const development = visualProgression.development[group.id];
              const pump = presentation.pumpOffsets[group.id] / 0.9;
              return (
                <div className="physique-development-row" key={group.id}>
                  <strong>{group.label}</strong>
                  <div
                    aria-label={`${group.label} development ${Math.round(development)} percent`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={Math.round(development)}
                    className="physique-development-track"
                    role="progressbar"
                  >
                    <span
                      className="physique-development-fill"
                      style={{ width: `${development}%` }}
                    />
                    <span
                      className="physique-pump-fill"
                      style={{ width: `${Math.max(0, pump) * 100}%` }}
                    />
                  </div>
                  <span>{Math.round(development)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="physique-review-section">
          <h3>Fictional presentation ratings</h3>
          <div className="physique-ratings-grid">
            {Object.entries(ratings).map(([rating, value]) => (
              <div key={rating}>
                <span>{rating}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <p className="small-note">
            These are game statistics for the Trainer, not health or real-world
            fitness assessments.
          </p>
        </div>

        <div className="physique-review-section">
          <h3>Recent training</h3>
          {visualProgression.recentTraining.length ? (
            <ol className="physique-history-list">
              {visualProgression.recentTraining.slice(0, 8).map((record) => (
                <li key={record.id}>
                  <strong>
                    {machineNames.get(record.machineId) ?? record.machineId}
                  </strong>
                  <span>
                    {record.loadTier} · {record.outcome} · quality{' '}
                    {Math.round(record.quality * 100)}% ·{' '}
                    {formatGameplayTime(record.gameplayTimeMs)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="small-note">
              Complete a machine set to begin the training record.
            </p>
          )}
        </div>

        <div className="physique-review-section">
          <h3>Bodybuilding challenges</h3>
          <p>
            Optional stage challenges add a second progression path; they do
            not replace captures or machine bosses.
          </p>
          <div className="physique-challenge-grid">
            <label className="physique-review-field">
              <span>Challenge</span>
              <select
                value={challengeId}
                onChange={(event) => {
                  const next = event.target.value as BodybuildingChallengeId;
                  setChallengeId(next);
                  const definition = BODYBUILDING_CHALLENGES.find(
                    (entry) => entry.id === next,
                  );
                  if (definition?.preferredPoses[0]) {
                    setPose(definition.preferredPoses[0]);
                  }
                }}
              >
                {BODYBUILDING_CHALLENGES.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="physique-review-field">
              <span>Timing marker {timingPrecision}%</span>
              <input
                max={100}
                min={0}
                onChange={(event) =>
                  setTimingPrecision(Number(event.target.value))
                }
                type="range"
                value={timingPrecision}
              />
            </label>
            <label className="physique-review-field">
              <span>Preparation {preparation}%</span>
              <input
                max={100}
                min={0}
                onChange={(event) =>
                  setPreparation(Number(event.target.value))
                }
                type="range"
                value={preparation}
              />
            </label>
            <label className="physique-review-field">
              <span>Outfit alignment</span>
              <select
                value={outfitAlignment}
                onChange={(event) =>
                  setOutfitAlignment(Number(event.target.value))
                }
              >
                <option value={58}>Training outfit</option>
                <option value={76}>Current adaptive outfit</option>
                <option value={92}>Competition posing outfit</option>
              </select>
            </label>
          </div>
          <p className="small-note">{challenge.description}</p>
          <button
            className="primary-btn"
            onClick={() =>
              onChallenge({
                challengeId,
                selectedPose: pose,
                timingPrecision: timingPrecision / 100,
                preparation: preparation / 100,
                outfitAlignment: outfitAlignment / 100,
              })
            }
            type="button"
          >
            Enter {challenge.name}
          </button>
          {challengeResult?.challengeId === challengeId ? (
            <div
              className={`physique-challenge-result ${challengeResult.completed ? 'success' : ''}`}
              role="status"
            >
              <strong>
                {challengeResult.score}/100 · {challengeResult.rating}
              </strong>
              <span>
                {challengeResult.completed
                  ? `Challenge cleared. Reward: ${challenge.reward.label}.`
                  : 'Not cleared yet. Adjust timing, pose, preparation, recovery, or outfit.'}
              </span>
            </div>
          ) : null}
        </div>

        <div className="physique-review-section">
          <h3>Snapshots and rewards</h3>
          <div className="physique-review-grid">
            <ul className="physique-compact-list">
              {visualProgression.snapshots.length ? (
                visualProgression.snapshots.map((snapshot) => (
                  <li key={snapshot.id}>
                    {snapshot.label} · {formatGameplayTime(snapshot.gameplayTimeMs)}
                  </li>
                ))
              ) : (
                <li>No progress snapshots yet.</li>
              )}
            </ul>
            <ul className="physique-compact-list">
              {visualProgression.challenges.unlockedRewardIds.length ? (
                visualProgression.challenges.unlockedRewardIds.map(
                  (rewardId) => {
                    const reward = BODYBUILDING_CHALLENGES.find(
                      (entry) => entry.reward.id === rewardId,
                    )?.reward;
                    return <li key={rewardId}>{reward?.label ?? rewardId}</li>;
                  },
                )
              ) : (
                <li>No stage rewards unlocked yet.</li>
              )}
            </ul>
          </div>
        </div>

        {import.meta.env.DEV ? (
          <details className="physique-review-section physique-debug-controls">
            <summary>Development debug controls</summary>
            <p>
              Development-only values are still normalized by the save service.
            </p>
            {TRAINER_DEVELOPMENT_GROUPS.map((group) => (
              <div key={group.id}>
                <span>{group.label}</span>
                <button
                  onClick={() =>
                    onDebugAdjust(group.id, 'development', -10)
                  }
                  type="button"
                >
                  Dev −
                </button>
                <button
                  onClick={() =>
                    onDebugAdjust(group.id, 'development', 10)
                  }
                  type="button"
                >
                  Dev +
                </button>
                <button
                  onClick={() => onDebugAdjust(group.id, 'pump', -15)}
                  type="button"
                >
                  Pump −
                </button>
                <button
                  onClick={() => onDebugAdjust(group.id, 'pump', 15)}
                  type="button"
                >
                  Pump +
                </button>
              </div>
            ))}
          </details>
        ) : null}
      </section>
    </div>
  );
}
