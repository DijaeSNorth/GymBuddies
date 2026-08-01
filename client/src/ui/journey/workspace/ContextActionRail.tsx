import { useState } from 'react';

import type { JourneyController } from '../JourneyShell';
import type { JourneyWorkspaceId, OpenJourneyWorkspace } from './workspaceTypes';

type ContextActionRailProps = Readonly<{
  controller: JourneyController;
  openWorkspace: OpenJourneyWorkspace;
}>;

type ContextAction = Readonly<{
  id: string;
  label: string;
  detail: string;
  primary?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onAction: () => void;
  workspace?: JourneyWorkspaceId;
}>;

export function ContextActionRail({
  controller,
  openWorkspace,
}: ContextActionRailProps) {
  const [hint, setHint] = useState('Choose an action for the current situation.');
  const {
    MOVES,
    activeBossAvailability,
    activeZone,
    beginEncounter,
    canRest,
    captureAnimation,
    gamePresentationSnapshot,
    handlePresentationAction,
    isMatchChallengeAligned,
    isMatchChallengeOverload,
    match,
    openPhysiqueReview,
    performMove,
    performWorkoutAction,
    recoverWithRest,
    restCooldownSeconds,
    setEncounter,
    setMatch,
    setMessage,
    startBossChallenge,
    startMatch,
    workoutSession,
  } = controller;

  let title = 'ACTIONS';
  let actions: ContextAction[];

  if (match?.status === 'playing') {
    title = 'CAPTURE';
    actions = MOVES.slice(0, 3).map((move, index) => {
      const prediction = controller.captureMovePredictions.get(move.id);
      const disabled = Boolean(
        captureAnimation ||
          (isMatchChallengeOverload && !isMatchChallengeAligned),
      );
      return {
        id: move.id,
        label: `${index + 1} ${move.title}`,
        detail: prediction
          ? `${prediction.advantage} / cost ${move.staminaCost}`
          : move.tactic,
        primary: index === 0,
        disabled,
        disabledReason: captureAnimation
          ? 'Wait for the current impact.'
          : 'Complete the required boss alignment first.',
        onAction: () => performMove(move),
      };
    });
  } else if (match) {
    title = 'RESULT';
    const pendingPartyChoice =
      match.status === 'full-party' && Boolean(match.pendingCapturedBuddy);
    actions = [
      {
        id: 'continue-result',
        label: pendingPartyChoice ? 'Choose Party Slot' : 'Continue',
        detail: pendingPartyChoice
          ? 'Resolve the captured Buddy in the arena.'
          : 'Return to exploration.',
        primary: true,
        disabled: pendingPartyChoice,
        disabledReason: 'Choose a party slot or release the capture first.',
        onAction: () => {
          setMatch(null);
          setEncounter(null);
          setMessage('Arena reset. Scout again when ready.');
        },
      },
      {
        id: 'team-after-result',
        label: 'Team',
        detail: 'Review the current party.',
        onAction: () => openWorkspace('team'),
      },
    ];
  } else if (controller.encounter) {
    title = controller.encounter.isBoss ? 'BOSS' : 'ENCOUNTER';
    actions = [
      {
        id: 'start-match',
        label: 'Take the Grip',
        detail: 'Begin the round-based capture contest.',
        primary: true,
        onAction: startMatch,
      },
      {
        id: 'encounter-team',
        label: 'Team',
        detail: 'Check your active Buddy first.',
        onAction: () => openWorkspace('team'),
      },
    ];
  } else if (workoutSession) {
    title = 'WORKOUT';
    const isSpot = workoutSession.phase === 'spot';
    actions = [
      {
        id: 'workout-input',
        label: isSpot ? 'Spot Now' : workoutSession.resolved ? 'Set Complete' : 'Rep Input',
        detail: isSpot
          ? 'Use the rescue window.'
          : workoutSession.resolved
            ? 'Review the result in Training.'
            : 'Time the current repetition.',
        primary: !workoutSession.resolved,
        disabled: workoutSession.resolved,
        disabledReason: 'This set is resolved.',
        onAction: performWorkoutAction,
      },
      {
        id: 'workout-details',
        label: 'Training',
        detail: 'Open the focused workout layer.',
        onAction: () => openWorkspace('training'),
      },
    ];
  } else if (gamePresentationSnapshot.activeZoneType === 'route') {
    title = 'ROUTE';
    actions = [
      {
        id: 'route-interact',
        label: 'Interact',
        detail: controller.presentationActionLabel,
        primary: true,
        onAction: () => handlePresentationAction('interact'),
      },
      {
        id: 'route-scout',
        label: 'Scout',
        detail: 'Search the marked encounter terrain.',
        onAction: beginEncounter,
      },
      {
        id: 'route-team',
        label: 'Team',
        detail: 'Open party management.',
        onAction: () => openWorkspace('team'),
      },
      {
        id: 'route-map',
        label: 'Map',
        detail: 'Review connected routes.',
        onAction: () => openWorkspace('map'),
      },
    ];
  } else if (activeZone.id === 'home') {
    title = 'HOME GYM';
    actions = [
      {
        id: 'home-train',
        label: 'Train',
        detail: 'Choose a machine and load.',
        primary: true,
        onAction: () => openWorkspace('training'),
      },
      {
        id: 'home-recover',
        label: 'Recover',
        detail: canRest ? 'Restore readiness and Buddy HP.' : `Ready in ${restCooldownSeconds}s.`,
        disabled: !canRest,
        disabledReason: `Recovery is ready in ${restCooldownSeconds}s.`,
        onAction: recoverWithRest,
      },
      {
        id: 'home-physique',
        label: 'Physique',
        detail: 'Review training development.',
        onAction: openPhysiqueReview,
      },
      {
        id: 'home-team',
        label: 'Team',
        detail: 'Manage the active party.',
        onAction: () => openWorkspace('team'),
      },
    ];
  } else {
    title = activeZone.name.toUpperCase();
    const bossReady = activeBossAvailability.status === 'ready';
    actions = [
      {
        id: 'gym-train',
        label: 'Train',
        detail: "Choose one of this gym's machines.",
        primary: true,
        onAction: () => openWorkspace('training'),
      },
      {
        id: 'gym-scout',
        label: 'Scout',
        detail: 'Search for a wild Buddy.',
        onAction: beginEncounter,
      },
      {
        id: 'gym-boss',
        label: 'Boss',
        detail: bossReady ? 'Challenge available now.' : `Ready in ${controller.bossTicker}.`,
        disabled: !bossReady,
        disabledReason: `Boss recharges in ${controller.bossTicker} of active play.`,
        onAction: () => startBossChallenge(activeZone),
      },
      {
        id: 'gym-map',
        label: 'Travel',
        detail: 'Open the connected world map.',
        onAction: () => openWorkspace('map'),
      },
    ];
  }

  return (
    <aside className="journey-action-rail" aria-label="Context actions">
      <strong className="journey-rail-title">{title}</strong>
      <div className="journey-context-actions">
        {actions.slice(0, 4).map((action) => (
          <button
            key={action.id}
            type="button"
            data-testid={
              action.id === 'home-physique'
                ? 'open-physique-review'
                : `journey-action-${action.id}`
            }
            className={action.primary ? 'primary' : ''}
            disabled={action.disabled}
            title={action.disabled ? action.disabledReason : action.detail}
            onClick={action.onAction}
            onFocus={() => setHint(action.disabled ? action.disabledReason ?? action.detail : action.detail)}
            onPointerEnter={() => setHint(action.disabled ? action.disabledReason ?? action.detail : action.detail)}
          >
            <strong>{action.label}</strong>
            <small>{action.detail}</small>
          </button>
        ))}
      </div>
      <p className="journey-action-hint" role="status">{hint}</p>
    </aside>
  );
}
