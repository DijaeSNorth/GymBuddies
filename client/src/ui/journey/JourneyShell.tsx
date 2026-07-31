import type { CaptureBattleSpeed } from '../../game/types';
import { AppErrorBoundary } from '../errors/AppErrorBoundary';
import { downloadSaveJson } from '../save/saveDownload';
import type { useJourneyController } from './useJourneyController';
import { JourneyEncounterPanel } from './encounters/JourneyEncounterPanel';
import { JourneyManagementPanel } from './panels/JourneyManagementPanel';

export type JourneyController = ReturnType<typeof useJourneyController>;

type JourneyShellProps = Readonly<{
  controller: JourneyController;
}>;

export function JourneyShell({ controller }: JourneyShellProps) {
  const {
    gameplayPaused,
    zoneTransit,
    save,
    skipZoneTransit,
    tutorialActive,
    setShowRoadmap,
    showRoadmap,
    TUTORIAL_STEPS,
    currentTutorialText,
    nextTutorialStep,
    finishTutorialNow,
    trainer,
    trainingFatigueLevel,
    percent,
    fatigueRatio,
    onEditTrainer,
    onRestartJourney,
    onReturnToOpening,
    resetTutorial,
    setAudioEnabled,
    setMusicVolume,
    setSfxVolume,
    setCaptureBattleSpeed,
    CAPTURE_BATTLE_SPEEDS,
    SaveManagementPanel,
    saveServices,
    LazyAudioTestPanel,
    Suspense,
    playAudioCue,
    auditionAudioTrack,
    activateAudioEngine,
    getAudioEngine,
    LazyGamePresentation,
    presentationActionLabel,
    message,
    dialoguePortrait,
    overworldDirectionAvailability,
    captureAnimation,
    bossEntrance,
    isTraveling,
    encounter,
    match,
    workoutSession,
    physiqueReviewOpen,
    handlePresentationAction,
    setAccessibilitySettings,
    setKeyboardBindings,
    handleGameplayPauseChange,
    skipPresentationSequence,
    setVisualProgressionPreferences,
    gamePresentationSnapshot,
    activeBuddy,
    trainerVisualPresentation,
    LazyBuddyIndex,
    CREATURES,
    log,
    LazyPhysiqueReviewPanel,
    bodybuildingChallengeResult,
    runBodybuildingChallenge,
    closePhysiqueReview,
    adjustVisualProgressionDebug,
    savePhysiqueSnapshot,
    physiqueRatings,
    playtestServices,
  } = controller;
  return (
    <div
      className="app-shell"
      data-gameplay-paused={gameplayPaused ? 'true' : 'false'}
    >
      {zoneTransit && (
        <div
          className={`zone-transition zone-transition-${save.captureBattleSpeed}`}
          role="dialog"
          aria-modal="true"
          aria-label={`Traveling from ${zoneTransit.from} to ${zoneTransit.to}`}
        >
          <div className="zone-transition-card">
            <div className="zone-transition-row">
              <span>{zoneTransit.icon}</span>
              <span>{zoneTransit.from}</span>
              <span>→</span>
              <span>{zoneTransit.to}</span>
            </div>
            <div className="zone-transition-subrow">
              <p className="small-note">Fresh gym air, new layout, and a different pressure profile load in.</p>
              {zoneTransit.routeName ? <p className="small-note">Route: {zoneTransit.routeName}</p> : null}
              {zoneTransit.routeFatigue !== undefined ? (
                <p className="small-note">Route fatigue: {zoneTransit.routeFatigue.toFixed(1)}</p>
              ) : null}
              {zoneTransit.routeEncounterBoost ? (
                <p className="small-note">Route scouting bonus: +{Math.round(zoneTransit.routeEncounterBoost * 100)}%</p>
              ) : null}
              {zoneTransit.routeScoutChance !== undefined ? (
                <p className="small-note">
                  Approx. route scouting chance: {Math.round(zoneTransit.routeScoutChance * 100)}%
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="zone-transition-skip"
              onClick={skipZoneTransit}
            >
              Continue now
            </button>
          </div>
        </div>
      )}
      {tutorialActive && (
        <div className="tutorial-overlay">
          <div className="tutorial-card">
            <div className="panel-head-row">
              <h2>Tutorial</h2>
              <button className="secondary-btn" onClick={() => setShowRoadmap((open) => !open)}>
                {showRoadmap ? 'Hide plan' : 'Roadmap'}
              </button>
            </div>
            <p className="small-note">Step {Math.min(save.tutorialStep + 1, TUTORIAL_STEPS.length)} of {TUTORIAL_STEPS.length}</p>
            <p>{currentTutorialText}</p>
            <p className="small-note">You can still play, but finishing tutorial gives full control tips.</p>
            <div className="action-row">
              <button className="primary-btn" onClick={nextTutorialStep}>
                {save.tutorialStep >= TUTORIAL_STEPS.length - 1 ? 'Finish Tutorial' : 'Next'}
              </button>
              <button className="secondary-btn" onClick={finishTutorialNow}>
                Skip
              </button>
            </div>
            {showRoadmap && (
              <div className="roadmap">
                <h3>Feature cadence plan</h3>
                <small>Phase 1 (now): Controls, machine depth, beginner combat.</small>
                <small>Phase 2 (+2h): Boss prep items, gym challenges, rewards.</small>
                <small>Phase 3 (+4h): Late-game forms, rare trainer events.</small>
                <small>Phase 4 (+6h): Full gym-boss meta and balancing pass.</small>
              </div>
            )}
          </div>
        </div>
      )}
      <header className="top-banner">
        <h1>GYM BUDDIES</h1>
        <p>Original handheld-era fitness adventure, open-world gym travel, and competitive captures.</p>
        <div className="panel-head-row">
          <span className="chip">Trainer: {trainer.name}</span>
          <span className="chip">Fatigue {trainingFatigueLevel} · {percent(1 - fatigueRatio)}</span>
          <div className="action-row">
            <button className="secondary-btn micro-btn" onClick={onEditTrainer}>
              Edit Trainer
            </button>
            <button className="secondary-btn micro-btn" onClick={onRestartJourney}>
              Restart Journey
            </button>
            <button className="secondary-btn" onClick={resetTutorial}>
              Restart Tutorial
            </button>
          </div>
        </div>
        <div className="audio-controls">
          <button
            className="secondary-btn micro-btn"
            onClick={() => setAudioEnabled(!save.audio.enabled)}
            aria-label={
              save.audio.enabled ? 'Mute all audio' : 'Unmute all audio'
            }
            aria-pressed={!save.audio.enabled}
          >
            {save.audio.enabled ? '🔊 Audio: On' : '🔇 Audio: Muted'}
          </button>
          <label className="audio-control">
            <span>Music {Math.round(save.audio.musicVolume * 100)}%</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={save.audio.musicVolume}
              onChange={(event) => setMusicVolume(Number(event.target.value))}
            />
          </label>
          <label className="audio-control">
            <span>SFX {Math.round(save.audio.sfxVolume * 100)}%</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={save.audio.sfxVolume}
              onChange={(event) => setSfxVolume(Number(event.target.value))}
            />
          </label>
          <label className="audio-control">
            <span>Battle speed</span>
            <select
              value={save.captureBattleSpeed}
              onChange={(event) =>
                setCaptureBattleSpeed(event.target.value as CaptureBattleSpeed)
              }
              aria-label="Capture battle speed"
            >
              {CAPTURE_BATTLE_SPEEDS.map((speed) => (
                <option key={speed.id} value={speed.id}>
                  {speed.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <SaveManagementPanel
          canRestorePrevious={saveServices.previousSaveAvailable}
          loadIssues={saveServices.loadIssues}
          loadMessage={saveServices.loadMessage}
          onImportJson={saveServices.importJourneyJson}
          onRestorePrevious={saveServices.restorePreviousJourney}
          save={save}
        />
        {LazyAudioTestPanel ? (
          <Suspense fallback={null}>
            <LazyAudioTestPanel
              onPlayCue={playAudioCue}
              onPlayTrack={auditionAudioTrack}
              onRestoreGameMix={() => {
                void activateAudioEngine();
              }}
              onStopMusic={() => getAudioEngine().stopMusic()}
            />
          </Suspense>
        ) : null}
      </header>

      <AppErrorBoundary
        resetKey={save.activeZoneId}
        onError={() =>
          playtestServices.recordError(
            'phaser-presentation',
            'The playfield presentation stopped and entered recovery.',
          )
        }
        onRetry={() =>
          playtestServices.recordEvent(
            'phaser-recovered',
            'Playfield presentation retry requested',
          )
        }
        fallback={({ retry }) => (
          <section className="game-presentation-loading" role="alert">
            <div>
              <strong>The playfield presentation stopped.</strong>
              <p>
                Journey progress is still safe outside Phaser.
              </p>
              <div className="action-row">
                <button
                  className="primary-btn"
                  onClick={retry}
                  type="button"
                >
                  Retry playfield
                </button>
                <button
                  className="secondary-btn"
                  onClick={onReturnToOpening}
                  type="button"
                >
                  Return to trainer setup
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => downloadSaveJson(save)}
                  type="button"
                >
                  Export save
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => window.location.reload()}
                  type="button"
                >
                  Reload application
                </button>
              </div>
            </div>
          </section>
        )}
      >
        <Suspense
          fallback={
            <section
              aria-live="polite"
              className="game-presentation-loading"
              role="status"
            >
              Preparing the 240×160 playfield…
            </section>
          }
        >
          <LazyGamePresentation
            accessibility={save.accessibility}
            actionLabel={presentationActionLabel}
            battleSpeed={save.captureBattleSpeed}
            dialogue={message}
            dialoguePortrait={dialoguePortrait}
            directionAvailability={overworldDirectionAvailability}
            effectSkippable={Boolean(captureAnimation || bossEntrance || zoneTransit)}
            keyboardBindings={save.input.keyboardBindings}
            visualProgression={save.visualProgression.preferences}
            movementDisabled={Boolean(
              isTraveling ||
                encounter ||
                match ||
                workoutSession ||
                physiqueReviewOpen,
            )}
            onAction={handlePresentationAction}
            onAccessibilityChange={setAccessibilitySettings}
            onBattleSpeedChange={setCaptureBattleSpeed}
            onKeyboardBindingsChange={setKeyboardBindings}
            onPauseChange={handleGameplayPauseChange}
            onSkipEffect={skipPresentationSequence}
            onVisualProgressionChange={setVisualProgressionPreferences}
            partyCount={save.team.length}
            primaryActionDisabled={Boolean(
              captureAnimation ||
                (match && match.status !== 'playing'),
            )}
            snapshot={gamePresentationSnapshot}
          />
        </Suspense>
      </AppErrorBoundary>

      <main className="game-grid">
        <JourneyManagementPanel controller={controller} />

        <JourneyEncounterPanel controller={controller} />

        <section className="panel">
          <Suspense
            fallback={
              <p className="small-note" role="status">
                Loading Buddy Index…
              </p>
            }
          >
            <LazyBuddyIndex
              species={CREATURES}
              seenDex={save.seenDex}
              caughtDex={save.caughtDex}
            />
          </Suspense>

          <h3>Log</h3>
          <ul className="log-list">
            {log.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="status-bar">
        <strong>Broadcast:</strong> {message}
      </footer>
      {physiqueReviewOpen ? (
        <Suspense
          fallback={
            <div className="physique-review-backdrop">
              <section
                aria-live="polite"
                className="physique-review-panel"
                role="status"
              >
                Loading Physique Review…
              </section>
            </div>
          }
        >
          <LazyPhysiqueReviewPanel
            buddy={activeBuddy ?? undefined}
            challengeResult={bodybuildingChallengeResult}
            fatigue={save.trainingFatigue}
            onChallenge={runBodybuildingChallenge}
            onClose={closePhysiqueReview}
            onDebugAdjust={adjustVisualProgressionDebug}
            onPreferencesChange={setVisualProgressionPreferences}
            onSaveSnapshot={savePhysiqueSnapshot}
            presentation={trainerVisualPresentation}
            ratings={physiqueRatings}
            reducedMotion={save.accessibility.reducedMotion}
            trainer={save.trainer}
            visualProgression={save.visualProgression}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
