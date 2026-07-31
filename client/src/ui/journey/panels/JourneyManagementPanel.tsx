import type { JourneyController } from '../JourneyShell';

type JourneyManagementPanelProps = Readonly<{
  controller: JourneyController;
}>;

export function JourneyManagementPanel({ controller }: JourneyManagementPanelProps) {
  const {
    gameplayPaused,
    save,
    trainer,
    trainingFatigueLevel,
    percent,
    onEditTrainer,
    Suspense,
    isTraveling,
    encounter,
    match,
    workoutSession,
    TEAM_SIZE,
    zoneVibe,
    activeZone,
    activeBossAvailability,
    bossTicker,
    activeGymBosses,
    startBossChallenge,
    movementHint,
    routeScoutCooldownRemaining,
    worldMoveBlocked,
    worldMoveCooldownRemaining,
    connectedWalkByDirection,
    moveTrainerByDirection,
    connectedWalks,
    zoneNames,
    worldMovePercent,
    WORLD_MOVE_COOLDOWN_MS,
    connectedZones,
    WORLD_GRID_WIDTH,
    WORLD_TILE_PITCH,
    WORLD_GRID_PADDING,
    WORLD_GRID_HEIGHT,
    isWorldTileWalkable,
    worldTileZoneId,
    worldTileToStyle,
    AREAS,
    mapPointForZone,
    isZoneUnlocked,
    WORLD_PATH_LINKS,
    WORLD_TILE_PX,
    travelToZone,
    WORLD_ROUTE_PATHS,
    routeSignPosition,
    trainerFacing,
    worldPlayerPos,
    routeProfileFromZones,
    switchArea,
    setPreviewZoneId,
    ZONE_VIBES,
    getGymBossTicker,
    previewZoneId,
    getRouteTransitionPreview,
    openPhysiqueReview,
    trainerPhysique,
    activeMachine,
    selectMachine,
    activeBuddy,
    calculateWorkoutReadiness,
    selectBuddy,
    hpPercent,
    presentationEffect,
    PixelCreature,
    MAX_BUDDY_FORM,
    MAX_BUDDY_MOBILITY,
    MAX_BUDDY_VOLUME,
    buddyStatBand,
    WORKOUT_MOMENTUM_MAX,
    workoutMomentumLabel,
    WORKOUT_DELOAD_MAX,
    FATIGUE_BALANCE,
    canRest,
    restCooldownSeconds,
    clamp01,
    MAX_TRAINING_FATIGUE,
    getExperienceNeeded,
    buddyCustomizationOpen,
    LazyBuddyCustomizer,
    setSave,
    setBuddyCustomizationOpen,
    workoutPreview,
    WorkoutMiniGame,
    workoutFrame,
    selectedWorkoutLoad,
    trainerVisualPresentation,
    performWorkoutAction,
    setSelectedWorkoutLoad,
    sendToWorkout,
    recoverWithRest,
    useSteroid,
    beginEncounter,
    playtestServices,
  } = controller;
  return (
        <section className="panel">
          <div className="panel-head-row">
            <h2>Gym Map</h2>
            <span className="chip">Party {save.team.length}/{TEAM_SIZE}</span>
          </div>
          <div className="zone-hero">
            <div>
              <div className="zone-hero-title">
                {zoneVibe.icon} {activeZone.name}
              </div>
              <p className="small-note">
                {zoneVibe.mood} · {zoneVibe.theme}
              </p>
            </div>
            <span className="chip">Zone Accent: {zoneVibe.accent}</span>
          </div>
          <p className="small-note">Current: {activeZone.name}</p>
          <section
            className={`boss-availability boss-availability-${activeBossAvailability.status}`}
            aria-label={`${activeZone.name} boss availability`}
          >
            <div>
              <strong>
                Boss challenge ·{' '}
                {activeBossAvailability.status === 'ready'
                  ? 'Ready now'
                  : `${bossTicker} active play`}
              </strong>
              <small>
                Possible challengers:{' '}
                {activeGymBosses.map((boss) => boss.name).join(' or ')}
              </small>
              <small>
                Repeat challenges recharge during visible gameplay; exploring,
                training, and battles all count.
              </small>
            </div>
            <button
              className="secondary-btn boss-challenge-btn"
              onClick={() => startBossChallenge(activeZone)}
              disabled={
                activeBossAvailability.status !== 'ready' ||
                Boolean(encounter || match || workoutSession)
              }
            >
              {activeBossAvailability.status === 'ready'
                ? 'Answer Boss Challenge'
                : `Available in ${bossTicker}`}
            </button>
          </section>
          <p className="small-note">{activeZone.blurb}</p>
          <p className="small-note">
            Move with WASD or arrow keys: {movementHint || 'No exits available'}
          </p>
           <p className="small-note">
             Route scouting cooldown: {routeScoutCooldownRemaining <= 0 ? 'ready' : `${(routeScoutCooldownRemaining / 1000).toFixed(1)}s`}
           </p>
           <p className="small-note">Stride lock: {worldMoveBlocked ? `${(Math.max(0, worldMoveCooldownRemaining) / 1000).toFixed(1)}s` : 'ready'}</p>
          <div className="world-dpad">
            <button
              className={`dpad-btn ${connectedWalkByDirection.up ? 'dpad-available' : 'dpad-blocked'}`}
              onClick={() => moveTrainerByDirection('up')}
              disabled={isTraveling || worldMoveBlocked || !connectedWalkByDirection.up}
            >
              ▲
            </button>
            <button
              className={`dpad-btn ${connectedWalkByDirection.left ? 'dpad-available' : 'dpad-blocked'}`}
              onClick={() => moveTrainerByDirection('left')}
              disabled={isTraveling || worldMoveBlocked || !connectedWalkByDirection.left}
            >
              ◀
            </button>
            <button
              className={`dpad-btn ${connectedWalkByDirection.down ? 'dpad-available' : 'dpad-blocked'}`}
              onClick={() => moveTrainerByDirection('down')}
              disabled={isTraveling || worldMoveBlocked || !connectedWalkByDirection.down}
            >
              ▼
            </button>
            <button
              className={`dpad-btn ${connectedWalkByDirection.right ? 'dpad-available' : 'dpad-blocked'}`}
              onClick={() => moveTrainerByDirection('right')}
              disabled={isTraveling || worldMoveBlocked || !connectedWalkByDirection.right}
            >
              ▶
            </button>
          </div>
           {connectedWalks.length > 0 ? (
              <div className="world-move-controls">
              {connectedWalks.map(({ direction, destinationZone, routeName, routeFatigue, encounterBoost }) => (
                <button
                  key={`${direction}-${destinationZone ?? 'path'}`}
                  className="secondary-btn micro-btn"
                  onClick={() => moveTrainerByDirection(direction)}
                  disabled={isTraveling || worldMoveBlocked}
                >
                  {direction.toUpperCase()} · {routeName} → {destinationZone ? zoneNames[destinationZone] ?? destinationZone : 'Path'} · +{routeFatigue.toFixed(1)} fatigue{encounterBoost ? ` · +${Math.round(encounterBoost * 100)}% encounter` : ''}
                </button>
              ))}
            </div>
          ) : null}
          {worldMoveBlocked ? (
            <div className="world-move-progress-wrap">
              <div className="world-move-progress">
                <div className="world-move-progress-fill" style={{ width: `${Math.round(worldMovePercent * 100)}%` }} />
              </div>
              <small className="small-note">
                Stride lock: {Math.max(0, worldMoveCooldownRemaining) / WORLD_MOVE_COOLDOWN_MS < 0.01
                  ? 'free'
                  : `${(Math.ceil(worldMoveCooldownRemaining / 10) / 100).toFixed(2)}s`}
              </small>
            </div>
          ) : null}
          <div className="world-route-list">
            <div className="world-route-pill">
              Available routes:{' '}
              {connectedZones.map((zoneId) => zoneNames[zoneId] ?? zoneId).join(' · ') || 'none'}
            </div>
            <div
              className="world-mini-grid world-overworld-map"
              style={{
                width: WORLD_GRID_WIDTH * WORLD_TILE_PITCH + WORLD_GRID_PADDING * 2,
                height: WORLD_GRID_HEIGHT * WORLD_TILE_PITCH + WORLD_GRID_PADDING * 2,
              }}
            >
              {Array.from({ length: WORLD_GRID_WIDTH * WORLD_GRID_HEIGHT }, (_, index) => {
                const x = index % WORLD_GRID_WIDTH;
                const y = Math.floor(index / WORLD_GRID_WIDTH);
                const point = { x, y };
                const walkable = isWorldTileWalkable(point);
                if (!walkable) return null;
                const zoneId = worldTileZoneId(point);
                const base = worldTileToStyle(point);
                return (
                  <span
                    key={`cell-${x}-${y}`}
                    className={`world-grid-cell ${zoneId ? 'world-gym-tile' : 'world-route-tile'}`}
                    style={{ left: base.left, top: base.top }}
                    aria-hidden="true"
                  />
                );
              })}
              {AREAS.map((zone) => {
                const mapPos = mapPointForZone(zone.id);
                if (!mapPos) return null;
                const isActive = zone.id === save.activeZoneId;
                const linked = connectedZones.includes(zone.id);
                const isUnlocked = isZoneUnlocked(zone.id);
                const isRouteReady = (linked && isUnlocked) || isActive;
                const nearby = WORLD_PATH_LINKS.some(([from, to]) => [from, to].includes(zone.id) && [from, to].includes(save.activeZoneId));
                return (
                  <button
                    key={`main-${zone.id}`}
                    className={`world-mini-node ${zone.type} ${isActive ? 'active' : ''} ${isRouteReady ? 'route-ready' : 'route-locked'} ${
                      nearby ? 'route-nearby' : ''
                    }`}
                    style={{
                      left: mapPos.left - (WORLD_TILE_PX / 2),
                      top: mapPos.top - (WORLD_TILE_PX / 2),
                    }}
                    onClick={() => travelToZone(zone.id)}
                    disabled={!isRouteReady || isTraveling || worldMoveBlocked}
                  >
                    {zone.type === 'home' ? '🏠' : '🏋'}
                      <small>{zone.name}</small>
                      <small>{zone.blurb}</small>
                      {!isUnlocked && !isActive ? '🔒' : ''}
                  </button>
                );
              })}
              {WORLD_ROUTE_PATHS.map((route) => {
                const signPos = routeSignPosition(route);
                if (!signPos) return null;
                return (
                  <div
                    key={`${route.from}-${route.to}-sign`}
                    className="world-route-sign"
                    style={{
                      left: signPos.left,
                      top: signPos.top,
                    }}
                    title={`${route.routeName}: +${route.travelFatigue.toFixed(1)} fatigue · +${Math.round(
                      route.encounterBoost * 100,
                    )}% scouting`}
                  >
                    {route.routeName}
                  </div>
                );
              })}
              <div
                className={`world-mini-trainer trainer-facing-${trainerFacing}`}
                style={{
                  left: worldTileToStyle(worldPlayerPos).left - (WORLD_TILE_PX / 3),
                  top: worldTileToStyle(worldPlayerPos).top - (WORLD_TILE_PX / 3),
                }}
              >
                {trainer.name?.[0]?.toUpperCase() ?? 'T'}
              </div>
            </div>
            <div className="gym-grid">
              {AREAS.map((area) => {
                const linked = connectedZones.includes(area.id);
                const isActive = save.activeZoneId === area.id;
                const isUnlocked = isZoneUnlocked(area.id);
                const isHomeNode = area.id === 'home';
                const routeProfile = routeProfileFromZones(save.activeZoneId, area.id);
                const routeDetail = routeProfile
                  ? `${routeProfile.routeName} • +${routeProfile.travelFatigue.toFixed(1)} fatigue · +${Math.round(routeProfile.encounterBoost * 100)}% scouting`
                  : isActive
                    ? 'Current location'
                    : linked
                      ? 'Connected'
                      : 'Route not yet unlocked';
                const topMachines = area.machines
                  .slice(0, 2)
                  .map((entry) => entry.name.split(' ').at(0))
                  .join(' + ');
                return (
                  <button
                    key={area.id}
                    className={`gym-btn ${area.type} ${isActive ? 'active' : ''} ${
                      linked && isUnlocked ? 'route-ready' : isHomeNode ? '' : 'route-locked'
                    }`}
                    onClick={() => switchArea(area.id)}
                    disabled={(!linked && !isActive) || (!isUnlocked && !isActive)}
                    onMouseEnter={() => setPreviewZoneId(area.id)}
                    onMouseLeave={() => setPreviewZoneId((current) => (current === area.id ? null : current))}
                    onFocus={() => setPreviewZoneId(area.id)}
                    onBlur={() => setPreviewZoneId((current) => (current === area.id ? null : current))}
                    aria-label={`Travel to ${area.name}`}
                    title={
                      isActive
                        ? 'Current location'
                        : !isUnlocked
                          ? 'Locked: visit nearby gyms to unlock'
                          : linked
                            ? `Travel to ${area.name}`
                            : 'Explore map route to unlock this route'
                    }
                  >
                    <strong>{area.name}</strong>
                    <span>{area.type.toUpperCase()} · {ZONE_VIBES[area.id]?.accent ?? area.type}</span>
                    <small>Route: {routeDetail}</small>
                    <small>Machines: {topMachines || 'Mixed lifts'} · Boss {getGymBossTicker(area)}</small>
                  </button>
                );
              })}
              {previewZoneId && (() => {
                const preview = getRouteTransitionPreview(previewZoneId);
                if (!preview) return null;
                return (
                  <div className="route-preview-card" key={`preview-${preview.zone.id}`}>
                    <div className="route-preview-title">
                      {zoneNames[preview.zone.id] ?? preview.zone.id}
                    </div>
                    <small className="small-note">
                      {preview.canTravelNow
                        ? preview.isDirect
                          ? 'Direct travel route active'
                          : `Unlocked ${preview.routeDistance}-hop route`
                        : 'Route not unlocked yet'}
                    </small>
                    <small className="small-note">Route: {preview.routeName}</small>
                    <small className="small-note">Path: {preview.routePathName}</small>
                    <small className="small-note">Fatigue cost: {preview.fatigueCost.toFixed(1)}</small>
                    <small className="small-note">Scouting chance: {Math.round(preview.encounterChance * 100)}%</small>
                    <small className="small-note">Boss timer: {preview.bossTicker}</small>
                    {!preview.isUnlocked ? <small className="small-note route-preview-lock">Locked zone</small> : null}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="panel-head-row">
            <h3>Trainer Profile</h3>
            <div className="action-row">
              {activeZone.id === 'home' ? (
                <button
                  className="primary-btn micro-btn"
                  data-testid="open-physique-review"
                  onClick={openPhysiqueReview}
                  type="button"
                >
                  Physique Review
                </button>
              ) : null}
              <button
                className="secondary-btn micro-btn"
                onClick={onEditTrainer}
                type="button"
              >
                Edit Trainer
              </button>
            </div>
          </div>
          <p className="small-note">
            {trainer.name} · Physique Level {String(trainerPhysique).padStart(2, '0')} ·
            editing the trainer profile preserves all journey progress.
          </p>

          <h3>Machines</h3>
          <p className="small-note">Selected machine boosts efficiency and fatigue tradeoff.</p>
          <div className="machine-grid">
            {activeZone.machines.map((machine) => (
              <button
                key={machine.id}
                className={`machine-btn ${activeMachine?.id === machine.id ? 'active' : ''}`}
                onClick={() => selectMachine(machine.id)}
              >
                  <strong>{machine.name}</strong>
                  <small>{machine.detail}</small>
                  <small>
                    XP {machine.rewardTable.buddyXp.min}-{machine.rewardTable.buddyXp.max} | x
                    {machine.rewardTable.buddyXp.multiplier.toFixed(2)}
                    {' · '}
                    HP {machine.hpEffect >= 0 ? '+' : ''}{machine.hpEffect}
                    {' · '}
                    Fatigue +{machine.fatigueCost}
                    {' · '}
                    Momentum {machine.momentumEffect >= 0 ? '+' : ''}{machine.momentumEffect}
                  </small>
                  <small>
                    Focus: {machine.focus} · {machine.buddyDisciplines.join(' / ')}
                    {' · '}
                    Difficulty {machine.difficulty}/5 · Trainer Lv {machine.recommendedTrainerLevel.min}-
                    {machine.recommendedTrainerLevel.max}
                    {' · '}
                    Drops: Boost {Math.round(machine.dropProbabilities.boostToken * 100)}% / Deload {Math.round(machine.dropProbabilities.deloadToken * 100)}%
                    {activeBuddy
                      ? ` · Readiness ${percent(
                          calculateWorkoutReadiness({
                            machine,
                            buddy: activeBuddy,
                            trainer,
                            gymKind: activeZone.type,
                            trainingFatigue: save.trainingFatigue,
                            workoutMomentum: save.workoutMomentum,
                          }),
                        )}`
                      : ''}
                  </small>
                </button>
              ))}
            </div>

          <div className="team-area">
            <h3>Team Slots (up to 6)</h3>
            <div className="team-slots">
              {Array.from({ length: TEAM_SIZE }).map((_, i) => {
                const buddy = save.team[i];
                const active = save.activeIndex === i;
                return (
                  <button
                    key={`slot-${i}`}
                    className={`team-slot ${active ? 'active' : ''}`}
                    disabled={!buddy}
                    onClick={() => selectBuddy(i)}
                  >
                    <strong>{`#${String(i + 1).padStart(2, '0')}`}</strong>
                    {buddy ? (
                      <>
                        <span>{buddy.nickname}</span>
                        <small>{buddy.creature.name}</small>
                        <em>
                          Lv {buddy.level} | HP {buddy.hp}/{buddy.maxHp} ({hpPercent(buddy.hp, buddy.maxHp)}%)
                        </em>
                      </>
                    ) : (
                      <span className="empty">EMPTY</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {activeBuddy ? (
            <>
              <h3>Active Buddy</h3>
              <div className="active-card">
                <div
                  className={
                     `workout-rig ${
                      workoutSession?.phase === 'rep'
                        ? 'workout-rig-running'
                        : workoutSession?.phase === 'spot'
                          ? 'workout-rig-spot'
                          : workoutSession?.phase === 'resolved'
                            ? 'workout-rig-resolved'
                            : ''
                    } ${
                      presentationEffect?.kind === 'level-up'
                        ? 'workout-rig-level-up'
                        : presentationEffect?.kind === 'rep-failure'
                          ? 'workout-rig-recoil'
                          : presentationEffect?.kind === 'rep-success'
                            ? 'workout-rig-cheer'
                            : ''
                    }`
                  }
                >
                  <PixelCreature
                    cosmetics={activeBuddy.cosmetics}
                    creature={activeBuddy.creature}
                    presentationContext="menu"
                    pose={workoutSession ? 'training' : 'idle'}
                    reducedMotion={save.accessibility.reducedMotion}
                    scale={2.4}
                  />
                </div>
                <div className="active-copy">
                  <strong>{activeBuddy.nickname}</strong>
                  <p>{activeBuddy.creature.flavor}</p>
                  <div>Lv {activeBuddy.level}</div>
                  <div>
                    HP {activeBuddy.hp}/{activeBuddy.maxHp}
                  </div>
                  <div className="buddy-metric-grid">
                    <div>Form: {activeBuddy.form} / {MAX_BUDDY_FORM}</div>
                    <div>Mobility: {activeBuddy.mobility} / {MAX_BUDDY_MOBILITY}</div>
                    <div>Volume: {activeBuddy.volume} / {MAX_BUDDY_VOLUME}</div>
                    <div>Band: {buddyStatBand(activeBuddy.form, MAX_BUDDY_FORM)}</div>
                  </div>
                  <div>
                    Momentum: {save.workoutMomentum}/{WORKOUT_MOMENTUM_MAX} · {workoutMomentumLabel(save.workoutMomentum)}
                  </div>
                  <div>
                    Deload Tokens: {save.deloadTokens}/{WORKOUT_DELOAD_MAX}
                  </div>
                  <div>Recovery: {activeBuddy.hp >= activeBuddy.maxHp ? 'ready' : `+${FATIGUE_BALANCE.restBuddyHeal} at next rest`}</div>
                  <div>Rest cooldown: {canRest ? 'Ready' : `${restCooldownSeconds}s`}</div>
                  <div>
                    Readiness state: {trainingFatigueLevel} ({percent(clamp01(1 - save.trainingFatigue / MAX_TRAINING_FATIGUE))})
                  </div>
                  <div>XP {activeBuddy.xp}/{getExperienceNeeded(activeBuddy.level)}</div>
                </div>
              </div>
              {buddyCustomizationOpen ? (
                <Suspense
                  fallback={
                    <p className="small-note" role="status">
                      Loading Buddy customization…
                    </p>
                  }
                >
                  <LazyBuddyCustomizer
                    buddy={activeBuddy}
                    onChange={(updatedBuddy) =>
                      setSave((state) => ({
                        ...state,
                        team: state.team.map((entry) =>
                          entry.id === updatedBuddy.id ? updatedBuddy : entry,
                        ),
                      }))
                    }
                    onClose={() => setBuddyCustomizationOpen(false)}
                    reducedMotion={save.accessibility.reducedMotion}
                  />
                </Suspense>
              ) : null}
              {workoutPreview && (
                <WorkoutMiniGame
                  canStart={
                    Boolean(activeBuddy && activeMachine) &&
                    !encounter &&
                    !match &&
                    !workoutSession &&
                    activeBuddy.hp > Math.max(1, -workoutPreview.expectedHpChange)
                  }
                  frame={workoutFrame}
                  keyboardBindings={save.input.keyboardBindings}
                  machineName={activeMachine?.name ?? 'Training station'}
                  paused={gameplayPaused}
                  preview={workoutPreview}
                  primaryMuscleGroups={activeMachine?.primaryMuscleGroups ?? []}
                  reducedMotion={save.accessibility.reducedMotion}
                  selectedLoad={selectedWorkoutLoad}
                  session={workoutSession}
                  trainerAppearance={trainerVisualPresentation.appearance}
                  onAction={performWorkoutAction}
                  onSelectLoad={setSelectedWorkoutLoad}
                  onStart={sendToWorkout}
                />
              )}
              <div className="action-row">
                <button
                  className="secondary-btn"
                  onClick={() => {
                    if (!buddyCustomizationOpen) {
                      playtestServices.markChecklist(
                        'buddy-customization',
                        true,
                      );
                    }
                    setBuddyCustomizationOpen((open) => !open);
                  }}
                  type="button"
                >
                  {buddyCustomizationOpen
                    ? 'Close Buddy Style'
                    : 'Customize Buddy'}
                </button>
                <button className="secondary-btn" onClick={recoverWithRest} disabled={!canRest}>
                  Recover
                </button>
                <button
                  className="primary-btn"
                  onClick={useSteroid}
                  disabled={!activeBuddy || save.steroids <= 0}
                >
                  Use Steroid (x{save.steroids})
                </button>
              </div>
            </>
          ) : (
            <p className="small-note">No active buddy selected.</p>
          )}

          <div className="xp-track">
            <div className="xp-fill" style={{ width: `${(save.team.length / TEAM_SIZE) * 100}%` }} />
          </div>

          <button className="primary-btn" onClick={beginEncounter} disabled={activeZone.type === 'home'}>
            Scout Wild Buddy
          </button>
        </section>
  );
}
