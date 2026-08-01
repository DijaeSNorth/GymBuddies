import { Suspense } from 'react';

import type { useJourneyController } from './useJourneyController';
import { JourneyWorkspace } from './workspace/JourneyWorkspace';

export type JourneyController = ReturnType<typeof useJourneyController>;

type JourneyShellProps = Readonly<{
  controller: JourneyController;
}>;

export function JourneyShell({ controller }: JourneyShellProps) {
  const {
    activeBuddy,
    adjustVisualProgressionDebug,
    bodybuildingChallengeResult,
    bossEntrance,
    closePhysiqueReview,
    physiqueRatings,
    physiqueReviewOpen,
    runBodybuildingChallenge,
    save,
    savePhysiqueSnapshot,
    setVisualProgressionPreferences,
    skipPresentationSequence,
    skipZoneTransit,
    trainerVisualPresentation,
    zoneTransit,
  } = controller;

  return (
    <>
      <JourneyWorkspace controller={controller} />

      {zoneTransit ? (
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
              <p className="small-note">
                Fresh gym air, a new layout, and a different pressure profile load in.
              </p>
              {zoneTransit.routeName ? (
                <p className="small-note">Route: {zoneTransit.routeName}</p>
              ) : null}
              {zoneTransit.routeFatigue !== undefined ? (
                <p className="small-note">
                  Route fatigue: {zoneTransit.routeFatigue.toFixed(1)}
                </p>
              ) : null}
              {zoneTransit.routeScoutChance !== undefined ? (
                <p className="small-note">
                  Scouting chance: {Math.round(zoneTransit.routeScoutChance * 100)}%
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
      ) : null}

      {bossEntrance ? (
        <button
          type="button"
          className="journey-skip-sequence"
          onClick={skipPresentationSequence}
        >
          Skip boss entrance
        </button>
      ) : null}

      {physiqueReviewOpen ? (
        <Suspense
          fallback={
            <div className="physique-review-backdrop">
              <section className="physique-review-panel" role="status" aria-live="polite">
                Loading Physique Review…
              </section>
            </div>
          }
        >
          <controller.LazyPhysiqueReviewPanel
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
    </>
  );
}
