import type { JourneyController } from '../JourneyShell';

type EncounterStageProps = Readonly<{
  controller: JourneyController;
}>;

export function EncounterStage({ controller }: EncounterStageProps) {
  const {
    PixelCreature,
    activeBuddy,
    activeMatchCaptureTarget,
    activeMatchChallengeStress,
    captureOpponentBattlePose,
    captureOpponentReactionClass,
    capturePlayerBattlePose,
    capturePlayerReactionClass,
    encounter,
    encounterBoss,
    encounterBossCosmetics,
    encounterBossPresentation,
    isMatchChallengeOverload,
    match,
    releaseFullPartyCapture,
    replacePartySlotAfterCapture,
    save,
  } = controller;

  if (!encounter) return null;

  const resultLabel = match
    ? match.status === 'captured'
      ? 'Successful capture'
      : match.status === 'full-party'
        ? 'Full-party capture'
        : match.status === 'near-capture'
          ? 'Near-capture'
          : match.status === 'failed-pin'
            ? 'Failed pin'
            : match.status === 'escape'
              ? 'Opponent escaped'
              : match.status === 'pin-win'
                ? 'Pin won'
                : null
    : null;

  return (
    <section
      className={`journey-encounter-stage ${encounter.isBoss ? 'boss' : ''}`}
      aria-label={encounter.isBoss ? 'Boss capture encounter' : 'Wild Buddy encounter'}
      data-testid="journey-encounter-stage"
    >
      <header>
        <div>
          <span className="journey-overlay-kicker">
            {encounter.isBoss ? 'BOSS CHALLENGE' : 'WILD ENCOUNTER'}
          </span>
          <h2>{encounter.bossName ?? encounter.creature.name}</h2>
        </div>
        <span>LV {encounter.level}</span>
      </header>

      <div className="journey-encounter-figures">
        <figure className={capturePlayerReactionClass}>
          {activeBuddy ? (
            <PixelCreature
              animated
              battlePose={capturePlayerBattlePose}
              cosmetics={activeBuddy.cosmetics}
              creature={activeBuddy.creature}
              pose={match?.status === 'captured' ? 'victory' : 'capture'}
              presentationContext="battle"
              reducedMotion={save.accessibility.reducedMotion}
            />
          ) : null}
          <figcaption>{activeBuddy?.nickname ?? 'Trainer'}</figcaption>
        </figure>
        <strong className="journey-encounter-vs">VS</strong>
        <figure className={captureOpponentReactionClass}>
          <PixelCreature
            animated
            battlePose={captureOpponentBattlePose}
            bossId={encounterBoss?.id}
            bossTier={encounterBossPresentation?.tier}
            cosmetics={encounterBossCosmetics}
            creature={encounter.creature}
            pose={match?.status === 'captured' || match?.status === 'full-party' ? 'capture' : 'entrance'}
            presentationContext="battle"
            reducedMotion={save.accessibility.reducedMotion}
          />
          <figcaption>{encounter.creature.name}</figcaption>
        </figure>
      </div>

      {match ? (
        <div className="journey-encounter-meter-stack">
          <div className="journey-stamina-row">
            <span>Team {match.playerStamina}</span>
            <span>Round {match.round}/{match.maxRounds}</span>
            <span>Wild {match.opponentStamina}</span>
          </div>
          <div
            className="journey-control-meter"
            role="meter"
            aria-label={`Control ${match.meter} percent; secure at ${activeMatchCaptureTarget} percent`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={match.meter}
          >
            <i style={{ width: `${match.meter}%` }} />
            <b style={{ left: `${activeMatchCaptureTarget}%` }} />
          </div>
          <small>
            CONTROL {match.meter}% / SECURE AT {activeMatchCaptureTarget}%
          </small>
          {match.status === 'playing' ? (
            <div className="journey-opponent-tell" role="status">
              <strong>{match.opponentIntent.tendencyLabel}</strong>
              <span>{match.opponentIntent.tell}</span>
              {match.isBossChallengeActive ? (
                <small>
                  Stress {activeMatchChallengeStress.percent}% / {activeMatchChallengeStress.label}
                  {isMatchChallengeOverload ? ' / OVERLOAD' : ''}
                </small>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="journey-encounter-intro">
          <p>{encounter.creature.flavor}</p>
          <span>
            {encounter.creature.primaryDiscipline}
            {encounter.creature.secondaryDiscipline
              ? ` / ${encounter.creature.secondaryDiscipline}`
              : ''}
          </span>
        </div>
      )}

      {encounter.isBoss && encounterBoss ? (
        <details className="journey-boss-details">
          <summary>Boss rules and counterplay</summary>
          <p>{encounterBoss.personality}</p>
          <p><strong>Counterplay:</strong> {encounterBoss.counterplay}</p>
          <p><strong>Signature:</strong> {encounterBoss.signatureRule.name} / {encounterBoss.signatureRule.warning}</p>
        </details>
      ) : null}

      {match?.lines.length ? (
        <div className="journey-encounter-narration" aria-live="polite">
          {match.lines.slice(-2).map((line, index) => (
            <p key={`${match.round}-${index}-${line}`}>{line}</p>
          ))}
        </div>
      ) : null}

      {resultLabel ? (
        <div className={`journey-encounter-result result-${match?.status}`} role="status">
          <strong>{resultLabel}</strong>
          {match?.status === 'full-party' && match.pendingCapturedBuddy ? (
            <div className="journey-capture-party-choice">
              <p>Choose a Buddy to rotate out for {match.pendingCapturedBuddy.nickname}.</p>
              <div>
                {save.team.map((buddy, index) => (
                  <button
                    key={buddy.id}
                    type="button"
                    onClick={() => replacePartySlotAfterCapture(index)}
                  >
                    Replace {buddy.nickname}
                  </button>
                ))}
              </div>
              <button type="button" onClick={releaseFullPartyCapture}>
                Let the captured Buddy return safely
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
