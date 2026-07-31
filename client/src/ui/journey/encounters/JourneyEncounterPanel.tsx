import type { JourneyController } from '../JourneyShell';

type JourneyEncounterPanelProps = Readonly<{
  controller: JourneyController;
}>;

export function JourneyEncounterPanel({ controller }: JourneyEncounterPanelProps) {
  const {
    save,
    percent,
    captureAnimation,
    bossEntrance,
    encounter,
    match,
    skipPresentationSequence,
    zoneNames,
    activeBuddy,
    PixelCreature,
    captureSpeed,
    isMatchChallengeForcedRecovery,
    isMatchChallengeAligned,
    isMatchChallengeInDanger,
    isMatchChallengeStreakReady,
    activeMatchCaptureTarget,
    encounterBoss,
    bossEntranceDuration,
    capturePlayerReactionClass,
    capturePlayerBattlePose,
    encounterBossPresentation,
    captureOpponentReactionClass,
    encounterBossCharacterDesign,
    captureOpponentBattlePose,
    encounterBossCosmetics,
    encounterZone,
    MOVES,
    encounterChallengeMachine,
    encounterMachineBonus,
    activeMatchChallengeStress,
    activeMatchChallengeSummary,
    bossChallengeThresholdText,
    challengeAlignmentText,
    encounterTrainerPressure,
    encounterBuddyPressure,
    isMatchChallengeOverload,
    activeMatchChallengeProfile,
    startMatch,
    captureMovePredictions,
    performMove,
    replacePartySlotAfterCapture,
    releaseFullPartyCapture,
    setMatch,
    setEncounter,
    setMessage,
  } = controller;
  return (
        <section className="panel">
          <h2>Capture Arena</h2>
          {!encounter ? (
            <p className="small-note">
              No encounter active. Scout a route or answer a ready boss
              challenge from the current gym.
            </p>
          ) : (
            <>
              <div
                className={`combat-stage combat-speed-${captureSpeed.id} ${
                  captureAnimation
                    ? `combat-beat-${captureAnimation.tone} combat-move-${captureAnimation.moveId}`
                    : ''
                } ${
                  encounter.isBoss
                    ? `combat-stage-boss ${
                        isMatchChallengeForcedRecovery
                          ? 'combat-stage-overload'
                          : isMatchChallengeAligned === false
                            ? 'combat-stage-drift'
                            : isMatchChallengeInDanger
                              ? 'combat-stage-danger'
                              : isMatchChallengeStreakReady || (match && match.meter >= activeMatchCaptureTarget - 6)
                                ? 'combat-stage-ready'
                              : isMatchChallengeAligned
                                ? 'combat-stage-lock'
                                : ''
                      } ${isMatchChallengeInDanger ? 'combat-stage-danger' : ''} ${
                        encounterBoss
                          ? `boss-arena-${encounterBoss.arenaEffect.className}`
                          : ''
                      }`
                    : ''
                }`}
              >
                {bossEntrance ? (
                  <div
                    className="boss-entrance"
                    role="status"
                    style={{
                      '--boss-entrance-ms': `${bossEntranceDuration}ms`,
                    } as Record<string, string>}
                  >
                    <span className="boss-entrance-kicker">Challenge line opens</span>
                    <strong>{bossEntrance.bossName}</strong>
                    <small>{bossEntrance.gymName} · {bossEntrance.signature}</small>
                    <button type="button" onClick={skipPresentationSequence}>
                      Skip entrance
                    </button>
                  </div>
                ) : null}
                <div className="combat-row">
                  <div
                    className={`combat-figure ${encounter.isBoss ? 'combat-figure-fighter' : ''} ${capturePlayerReactionClass}`}
                  >
                    {activeBuddy ? (
                      <PixelCreature
                        animated
                        battlePose={capturePlayerBattlePose}
                        cosmetics={activeBuddy.cosmetics}
                        creature={activeBuddy.creature}
                        pose={
                          match?.status === 'captured'
                            ? 'victory'
                            : captureAnimation
                              ? 'capture'
                              : 'idle'
                        }
                        presentationContext="battle"
                        reducedMotion={save.accessibility.reducedMotion}
                      />
                    ) : <span>None</span>}
                    <span>You</span>
                  </div>
                  <div className="combat-vs">VS</div>
                  <div
                    className={`combat-figure ${encounter.isBoss ? 'combat-figure-opponent' : ''} ${encounterBossPresentation?.arenaLightingClass ?? ''} ${captureOpponentReactionClass}`}
                  >
                    <PixelCreature
                      animationCueId={
                        encounter.isBoss &&
                        (match?.status === 'escape' ||
                          match?.status === 'failed-pin' ||
                          match?.status === 'near-capture')
                          ? encounterBossCharacterDesign?.victoryAnimationId
                          : encounterBossCharacterDesign?.entranceAnimationId
                      }
                      animated
                      battlePose={captureOpponentBattlePose}
                      bossId={encounterBoss?.id}
                      bossTier={encounterBossPresentation?.tier}
                      cosmetics={encounterBossCosmetics}
                      creature={encounter.creature}
                      pose={
                        encounter.isBoss && encounterBossPresentation
                          ? encounterBossPresentation.poseId
                          : encounter.isBoss &&
                        (match?.status === 'escape' ||
                          match?.status === 'failed-pin' ||
                          match?.status === 'near-capture')
                          ? 'victory'
                          : match?.status === 'captured' ||
                              match?.status === 'full-party'
                            ? 'capture'
                            : encounter.isBoss
                              ? 'entrance'
                              : 'idle'
                      }
                      presentationContext="battle"
                      reducedMotion={save.accessibility.reducedMotion}
                    />
                    <span>{encounter.creature.name}</span>
                  </div>
                </div>
                {captureAnimation ? (
                  <button
                    type="button"
                    className="combat-skip-effect"
                    onClick={skipPresentationSequence}
                  >
                    Skip impact
                  </button>
                ) : null}

                <div className="encounter-data">
                  <div>Location: {zoneNames[encounter.zoneId]}</div>
                  <div>
                    Lv {encounter.level} · {encounter.isBoss ? 'Boss' : 'Wild'}{' '}
                    {encounter.bossName ? `(${encounter.bossName})` : ''} · Capture outlook{' '}
                    {encounter.catchChance >= 0.84
                      ? 'open'
                      : encounter.catchChance >= 0.7
                        ? 'contested'
                        : 'guarded'}
                    {encounter.creature.isExotic ? ' (Exotic)' : ''}
                  </div>
                  <small>
                    Discipline: {encounter.creature.primaryDiscipline}
                    {encounter.creature.secondaryDiscipline
                      ? ` / ${encounter.creature.secondaryDiscipline}`
                      : ''}
                    {' · '}Zone pressure: {encounterZone.type}
                  </small>
                  {encounterBoss ? (
                    <div className="boss-dossier">
                      <strong>
                        {encounterBoss.name} · {encounterBoss.arenaEffect.name}
                      </strong>
                      <span>{encounterBoss.visualIdentity}</span>
                      <small>{encounterBoss.personality}</small>
                      <small>
                        Preferred tactic: {MOVES.find((move) => move.id === encounterBoss.preferredTactic)?.title}
                        {' · '}Counterplay: {encounterBoss.counterplay}
                      </small>
                      <small>
                        Signature: {encounterBoss.signatureRule.name} ·{' '}
                        {encounterBoss.signatureRule.warning}
                      </small>
                      {encounterBossCharacterDesign ? (
                        <>
                          <small>
                            Build: {encounterBossCharacterDesign.buildLabel} ·{' '}
                            {encounterBossCharacterDesign.battleStance}
                          </small>
                          <small>
                            Philosophy: {encounterBossCharacterDesign.trainingPhilosophy}
                          </small>
                          <small>
                            Signature gear: {encounterBossCharacterDesign.signatureClothing} ·{' '}
                            {encounterBossCharacterDesign.signatureEquipment}
                          </small>
                        </>
                      ) : null}
                      <small>
                        Victory rewards: {encounterBoss.rewardTable.buddyXp} XP ·{' '}
                        {encounterBoss.rewardTable.fatigueRecovery} recovery ·{' '}
                        {encounterBoss.rewardTable.momentum} momentum ·{' '}
                        {encounterBoss.rewardTable.deloadTokens} guaranteed Deload
                      </small>
                    </div>
                  ) : null}
                  {encounter.isBoss && encounterChallengeMachine ? (
                    <small>
                      Machine challenge: {encounterChallengeMachine.name} · Challenge bonus {encounterMachineBonus >= 0 ? '+' : ''}
                      {encounterMachineBonus}
                    </small>
                  ) : null}
                  {match?.encounter?.isBoss ? <small>Boss capture target: {activeMatchCaptureTarget}%</small> : null}
                  {match?.encounter?.isBoss && match.isBossChallengeActive ? (
                    <small>
                      Challenge stress: {activeMatchChallengeStress.label} · {activeMatchChallengeStress.percent}% ·{' '}
                      {activeMatchChallengeStress.detail}
                    </small>
                  ) : null}
                  {activeMatchChallengeSummary?.isActive ? (
                    <small>
                      Challenge tier: {bossChallengeThresholdText(activeMatchChallengeSummary.tier, encounterZone.type)}
                    </small>
                  ) : null}
                  {challengeAlignmentText ? <small>{challengeAlignmentText}</small> : null}
                  {activeBuddy ? (
                    <small>
                      Trainer power {encounterTrainerPressure} · Buddy power {encounterBuddyPressure}
                    </small>
                  ) : null}
                  {match?.status === 'playing' ? (
                    <div className="opponent-tell" role="status" aria-live="polite">
                      <strong>Opponent tell · {match.opponentIntent.tendencyLabel}</strong>
                      <span>{match.opponentIntent.tell}</span>
                      <small>
                        Read: {match.opponentIntent.confidence === 'clear' ? 'clear' : 'mixed'}.
                        Predictions show matchup direction, never the hidden roll.
                      </small>
                    </div>
                  ) : null}
                  {match?.isBossChallengeActive && match.encounter?.isBoss ? (
                    <small>
                      Challenge misses: {match.bossChallengeMisses} · Near misses: {match.bossChallengeNearMisses} ·
                      Required action: {match.bossChallengeMachineName ?? 'locked'} +{' '}
                      {match.encounter.bossRequiredMoveName ?? 'announced move'}
                    </small>
                  ) : null}
                  {isMatchChallengeOverload ? (
                    <small>
                      Boss challenge overload: complete the required
                      machine-and-move action immediately.
                    </small>
                  ) : null}
                  {isMatchChallengeForcedRecovery ? (
                    <small className="overload-action-callout">
                      Forced recovery lock: every non-required move increases pressure and fatigue.
                    </small>
                  ) : null}
                  {match?.isBossChallengeActive && activeMatchChallengeSummary?.isActive ? (
                    <small>
                      Streak {match?.bossChallengeMatchStreak ?? 0}/{activeMatchChallengeProfile.streakLimit} ·
                      Grace {activeMatchChallengeProfile.missResetGrace}
                    </small>
                  ) : null}
                  {match?.encounter?.isBoss && match.isBossChallengeActive ? (
                    <div
                      className="challenge-stress-track"
                      role="meter"
                      aria-label={`Boss challenge stress: ${activeMatchChallengeStress.percent} percent, ${activeMatchChallengeStress.label}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={activeMatchChallengeStress.percent}
                    >
                      <div
                        className={`challenge-stress-fill challenge-stress-${activeMatchChallengeStress.tone}`}
                        style={{ width: `${activeMatchChallengeStress.percent}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              {!match ? (
                <button className="primary-btn" onClick={startMatch}>
                  Take the Rally Grip
                </button>
              ) : (
                <>
                  <div className="capture-stamina-grid" aria-label="Capture stamina">
                    <div>
                      <span>Team stamina {match.playerStamina}</span>
                      <div className="capture-stamina-track">
                        <div
                          className="capture-stamina-fill capture-stamina-player"
                          style={{ width: `${match.playerStamina}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <span>Wild stamina {match.opponentStamina}</span>
                      <div className="capture-stamina-track">
                        <div
                          className="capture-stamina-fill capture-stamina-wild"
                          style={{ width: `${match.opponentStamina}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    className="meter-track"
                    role="meter"
                    aria-label={`Control meter. ${match.meter} percent. Secure control begins at ${activeMatchCaptureTarget} percent.`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={match.meter}
                  >
                    <div
                      className={`meter-fill ${
                        match.encounter.isBoss
                          ? isMatchChallengeOverload
                            ? 'meter-fill-challenge-overload'
                            : isMatchChallengeAligned === false
                            ? 'meter-fill-challenge-miss'
                            : isMatchChallengeInDanger
                              ? 'meter-fill-challenge-danger'
                              : isMatchChallengeStreakReady
                                ? 'meter-fill-challenge-lock'
                                : match.meter >= activeMatchCaptureTarget - 8
                                  ? 'meter-fill-challenge-ready'
                                  : isMatchChallengeAligned
                                    ? 'meter-fill-challenge-lock'
                                    : ''
                          : ''
                      }`}
                      style={{ width: `${match.meter}%` }}
                    />
                    <div
                      className="meter-capture-zone"
                      style={{
                        left: `${activeMatchCaptureTarget}%`,
                        width: `${100 - activeMatchCaptureTarget}%`,
                      }}
                    />
                    <div
                      className="meter-capture-threshold"
                      style={{ left: `${activeMatchCaptureTarget}%` }}
                    />
                    <div className="meter-center" />
                    <div className="meter-pin" />
                  </div>
                  <div className="capture-round-row">
                    <span>Round {match.round}/{match.maxRounds}</span>
                    <span>
                      Control {match.meter}% · secure at {activeMatchCaptureTarget}%
                    </span>
                  </div>

                  {match.status === 'playing' && (
                    <div className="capture-move-grid">
                      {MOVES.map((move, index) => {
                        const prediction = captureMovePredictions.get(move.id);
                        return (
                          <button
                            key={move.id}
                            className={`capture-move-btn capture-forecast-${prediction?.advantage ?? 'even'} ${
                              isMatchChallengeForcedRecovery
                                ? 'combat-move-recovery'
                                : ''
                            }`}
                            onClick={() => performMove(move)}
                            disabled={
                              Boolean(captureAnimation) ||
                              Boolean(
                                isMatchChallengeOverload &&
                                  !isMatchChallengeAligned,
                              )
                            }
                            aria-keyshortcuts={`${index + 1}`}
                          >
                            <span className="capture-move-heading">
                              <strong>{index + 1}. {move.title}</strong>
                              <span>{prediction?.advantage ?? 'even'}</span>
                            </span>
                            <small>{move.summary}</small>
                            <span className="capture-move-economy">
                              Cost {move.staminaCost} · after {prediction?.staminaAfter ?? match.playerStamina}
                            </span>
                            <span className="capture-move-reason">
                              {prediction?.reasons.join(' · ') ?? move.tactic}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="narration">
                    {match.lines.map((line, index) => (
                      <p key={`${match.round}-${index}`}>{line}</p>
                    ))}
                  </div>

                  {match.status !== 'playing' && (
                    <div
                      className={`result-block capture-result capture-result-${match.status}`}
                      role="status"
                    >
                      {['near-capture', 'captured', 'full-party', 'pin-win'].includes(
                        match.status,
                      ) ? (
                        <span className="capture-result-kicker">Pin win</span>
                      ) : null}
                      <h3>
                        {match.status === 'captured'
                          ? 'Successful capture'
                          : match.status === 'full-party'
                            ? 'Full-party capture'
                            : match.status === 'near-capture'
                              ? 'Near-capture'
                              : match.status === 'failed-pin'
                                ? 'Failed pin'
                                : match.status === 'escape'
                                  ? 'Opponent escaped'
                                  : 'Pin won'}
                      </h3>
                      <p>
                        {match.status === 'captured'
                          ? 'The challenge bond is complete.'
                          : match.status === 'full-party'
                            ? match.pendingCapturedBuddy
                              ? 'Choose a party slot to rotate, or let the captured Buddy return safely.'
                              : 'The capture was recorded and the party remains unchanged.'
                            : match.status === 'near-capture'
                              ? 'You secured the pin, but the final invitation did not hold.'
                              : match.status === 'failed-pin'
                                ? `Control did not reach the ${activeMatchCaptureTarget}% secure line.`
                                : match.status === 'escape'
                                  ? 'Control fell far enough for the wild Buddy to break away.'
                                  : 'The control count is complete.'}
                      </p>
                      {match.status === 'full-party' &&
                      match.pendingCapturedBuddy ? (
                        <div
                          className="capture-party-choice"
                          aria-label="Choose a Buddy to rotate out"
                        >
                          <strong>
                            Place {match.pendingCapturedBuddy.nickname}
                          </strong>
                          <div className="capture-party-grid">
                            {save.team.map((buddy, index) => (
                              <button
                                key={buddy.id}
                                type="button"
                                className="capture-party-slot"
                                onClick={() =>
                                  replacePartySlotAfterCapture(index)
                                }
                              >
                                <span>Replace slot {index + 1}</span>
                                <strong>{buddy.nickname}</strong>
                                <small>
                                  {buddy.creature.name} · Lv {buddy.level}
                                  {save.activeIndex === index
                                    ? ' · Active'
                                    : ''}
                                </small>
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={releaseFullPartyCapture}
                          >
                            Let captured Buddy return to the route
                          </button>
                        </div>
                      ) : (
                        <button
                          className="secondary-btn"
                          onClick={() => {
                            setMatch(null);
                            setEncounter(null);
                            setMessage('Arena reset. Scout again when ready.');
                          }}
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
  );
}
