import type { JourneyController } from '../../JourneyShell';

type TrainingWorkspaceProps = Readonly<{
  controller: JourneyController;
}>;

export function TrainingWorkspace({ controller }: TrainingWorkspaceProps) {
  const {
    WorkoutMiniGame,
    activeBuddy,
    activeMachine,
    activeZone,
    calculateWorkoutReadiness,
    encounter,
    gameplayPaused,
    match,
    percent,
    performWorkoutAction,
    save,
    selectMachine,
    selectedWorkoutLoad,
    sendToWorkout,
    setSelectedWorkoutLoad,
    trainer,
    trainerVisualPresentation,
    workoutFrame,
    workoutPreview,
    workoutSession,
  } = controller;
  const workoutStartBlocker = !activeBuddy
    ? 'Select an active Buddy before training.'
    : !activeMachine
      ? 'Select a machine before training.'
      : encounter || match
        ? 'Finish the current encounter before training.'
        : workoutSession
          ? null
          : workoutPreview &&
              activeBuddy.hp <= Math.max(1, -workoutPreview.expectedHpChange)
            ? 'Recover the active Buddy before this set.'
            : null;
  const canStartWorkout = Boolean(
    activeBuddy &&
      activeMachine &&
      workoutPreview &&
      !encounter &&
      !match &&
      !workoutSession &&
      !workoutStartBlocker,
  );

  return (
    <div className="journey-training-workspace">
      <section className="journey-machine-picker" aria-label="Available training machines">
        <span className="journey-overlay-kicker">{activeZone.name.toUpperCase()}</span>
        <h3>Choose a machine</h3>
        <div className="journey-machine-list">
          {activeZone.machines.map((machine) => {
            const selected = machine.id === activeMachine?.id;
            const readiness = activeBuddy
              ? percent(
                  calculateWorkoutReadiness({
                    machine,
                    buddy: activeBuddy,
                    trainer,
                    gymKind: activeZone.type,
                    trainingFatigue: save.trainingFatigue,
                    workoutMomentum: save.workoutMomentum,
                  }),
                )
              : 'No Buddy';
            return (
              <button
                key={machine.id}
                type="button"
                className={selected ? 'active' : ''}
                aria-pressed={selected}
                disabled={Boolean(workoutSession)}
                onClick={() => selectMachine(machine.id)}
              >
                <strong>{machine.name}</strong>
                <small>{machine.primaryMuscleGroups.join(' / ')}</small>
                <span>
                  Readiness {readiness} / Fatigue +{machine.fatigueCost}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="journey-training-focus" aria-label="Selected workout">
        {activeMachine && workoutPreview ? (
          <>
            <div className="journey-training-summary">
              <div>
                <span className="journey-overlay-kicker">SELECTED STATION</span>
                <h3>{activeMachine.name}</h3>
                <p>{activeMachine.detail}</p>
              </div>
              <dl>
                <div><dt>Muscles</dt><dd>{activeMachine.primaryMuscleGroups.join(', ')}</dd></div>
                <div><dt>Disciplines</dt><dd>{activeMachine.buddyDisciplines.join(', ')}</dd></div>
                <div><dt>XP range</dt><dd>{activeMachine.rewardTable.buddyXp.min}-{activeMachine.rewardTable.buddyXp.max}</dd></div>
                <div><dt>Fatigue</dt><dd>+{workoutPreview.expectedFatigueChange.toFixed(1)}</dd></div>
                <div><dt>HP</dt><dd>{workoutPreview.expectedHpChange >= 0 ? '+' : ''}{workoutPreview.expectedHpChange}</dd></div>
                <div><dt>Buddy</dt><dd>{activeBuddy?.nickname ?? 'None selected'}</dd></div>
              </dl>
            </div>
            <WorkoutMiniGame
              canStart={canStartWorkout}
              frame={workoutFrame}
              keyboardBindings={save.input.keyboardBindings}
              machineName={activeMachine.name}
              paused={gameplayPaused}
              preview={workoutPreview}
              primaryMuscleGroups={activeMachine.primaryMuscleGroups}
              reducedMotion={save.accessibility.reducedMotion}
              selectedLoad={selectedWorkoutLoad}
              session={workoutSession}
              trainerAppearance={trainerVisualPresentation.appearance}
              onAction={performWorkoutAction}
              onSelectLoad={setSelectedWorkoutLoad}
              onStart={sendToWorkout}
            />
            {workoutStartBlocker ? (
              <p className="journey-training-blocker" role="status">
                {workoutStartBlocker}
              </p>
            ) : null}
          </>
        ) : (
          <div className="journey-workspace-empty">
            <strong>Select a machine</strong>
            <p>Machine details, load choices, readiness, and the workout console will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
