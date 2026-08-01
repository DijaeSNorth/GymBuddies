import type { JourneyController } from '../JourneyShell';
import type { OpenJourneyWorkspace } from './workspaceTypes';

type CompactStatusBarProps = Readonly<{
  controller: JourneyController;
  openWorkspace: OpenJourneyWorkspace;
}>;

export function CompactStatusBar({
  controller,
  openWorkspace,
}: CompactStatusBarProps) {
  const {
    activeBossAvailability,
    activeBuddy,
    activeZone,
    fatigueRatio,
    gamePresentationSnapshot,
    save,
    trainer,
  } = controller;
  const fatiguePercent = Math.round(fatigueRatio * 100);
  const pumpPercent = Math.round(
    (save.workoutMomentum / controller.WORKOUT_MOMENTUM_MAX) * 100,
  );

  return (
    <header className="journey-status" data-testid="journey-status-bar">
      <div className="journey-wordmark" aria-label="Gym Buddies">
        <span aria-hidden="true">GB</span>
        <strong>GYM BUDDIES</strong>
      </div>
      <span className="journey-location">
        {gamePresentationSnapshot.activeZoneName}
      </span>
      <span className="journey-trainer">{trainer.name}</span>
      <div
        className="journey-status-meter"
        role="meter"
        aria-label={`Fatigue ${fatiguePercent} percent`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fatiguePercent}
      >
        <span>FAT {fatiguePercent}%</span>
        <i style={{ width: `${fatiguePercent}%` }} />
      </div>
      {pumpPercent > 0 ? (
        <span className="journey-pump" aria-label={`Pump ${pumpPercent} percent`}>
          PUMP {pumpPercent}%
        </span>
      ) : null}
      <span className="journey-active-buddy">
        {activeBuddy ? (
          <>
            {activeBuddy.nickname}{' '}
            <b>{activeBuddy.hp}/{activeBuddy.maxHp}</b>
          </>
        ) : (
          'No active Buddy'
        )}
      </span>
      {activeZone.id !== 'home' && activeBossAvailability.status === 'ready' ? (
        <span
          className="journey-boss-ready"
          role="status"
        >
          BOSS READY
        </span>
      ) : null}
      <button
        className="journey-system-button"
        aria-label="Open system menu"
        aria-haspopup="dialog"
        onClick={() => openWorkspace('system')}
        type="button"
      >
        <span aria-hidden="true">MENU</span>
      </button>
    </header>
  );
}
